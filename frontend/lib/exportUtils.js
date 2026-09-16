// Export beneran ke file .xlsx (bisa dibuka Excel/Google Sheets/LibreOffice) pakai SheetJS,
// dan ke .pdf pakai jsPDF + jspdf-autotable. Di-import secara dynamic supaya cuma jalan di browser.
// Setiap dokumen otomatis dikasih kop surat (PDF) / header sekolah (Excel), sekali fetch di-cache di memori.

let cachedLetterheadDataUrl = null;

async function getLetterheadDataUrl() {
  if (cachedLetterheadDataUrl) return cachedLetterheadDataUrl;
  try {
    const res = await fetch("/kop-surat.jpg");
    if (!res.ok) throw new Error("Kop surat tidak ditemukan");
    const blob = await res.blob();
    cachedLetterheadDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return cachedLetterheadDataUrl;
  } catch (err) {
    console.warn("Gagal memuat kop surat:", err);
    return null;
  }
}

export async function exportRowsToExcel({ headers, rows, fileName, sheetName = "Rekap", withHeaderText = true }) {
  const XLSX = await import("xlsx");

  const wsData = withHeaderText
    ? [
        ["SMK KOSGORO KOTA BOGOR - Yayasan Dharma Setia Kosgoro"],
        ["Jl. Pajajaran 217A, Bantarjati, Bogor Utara, Kota Bogor 16153 \u2022 NPSN: 20276384"],
        [],
        headers,
        ...rows,
      ]
    : [headers, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // biar kolom gak kepotong
  ws["!cols"] = headers.map((h, idx) => {
    const maxLen = Math.max(
      String(h).length,
      ...rows.map((r) => String(r[idx] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// Siapin dokumen jsPDF: kop surat (opsional) + judul + subjudul multi-baris. Return { doc, cursorY, margin, pageWidth }
async function setupPdfDoc({ title, subtitle, orientation, withLetterhead }) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 14;

  if (withLetterhead) {
    const dataUrl = await getLetterheadDataUrl();
    if (dataUrl) {
      // Dibatasi max 170mm biar gak di-upscale kegedean dari ukuran asli (940x149px) - kalau
      // dipaksa selebar halaman landscape A4 (~270mm) hasilnya jadi pecah/burik.
      const maxWidth = 170;
      const imgWidth = Math.min(pageWidth - margin * 2, maxWidth);
      const imgHeight = imgWidth * (149 / 940); // rasio asli gambar kop surat 940x149
      const xPos = (pageWidth - imgWidth) / 2; // center
      doc.addImage(dataUrl, "JPEG", xPos, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 3;
      doc.setDrawColor(200);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 6;
    }
  }

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text(title, margin, cursorY);
  cursorY += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  if (subtitle) {
    const lines = String(subtitle).split("\n");
    lines.forEach((line) => {
      doc.text(line, margin, cursorY);
      cursorY += 5;
    });
  }

  return { doc, cursorY, margin, pageWidth };
}

function addFooterAndSave(doc, margin, fileName) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `SIM Kosgoro \u2022 Dicetak ${new Date().toLocaleDateString("id-ID")} \u2022 Hal ${i}/${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
  }
  doc.save(fileName);
}

export async function exportRowsToPDF({
  title,
  subtitle,
  headers,
  rows,
  fileName,
  orientation = "landscape",
  withLetterhead = true,
}) {
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;

  const { doc, cursorY, margin } = await setupPdfDoc({ title, subtitle, orientation, withLetterhead });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: cursorY + 2,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  addFooterAndSave(doc, margin, fileName);
}

// Sama seperti exportRowsToPDF, tapi bisa render beberapa tabel berurutan dengan judul section
// masing-masing. Dipakai buat laporan yang butuh lebih dari satu tabel di satu file
// (misal: rekap kehadiran + daftar yang tidak hadir & alasannya).
export async function exportMultiSectionPDF({
  title,
  subtitle,
  sections, // [{ heading, headers, rows }]
  fileName,
  orientation = "portrait",
  withLetterhead = true,
}) {
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;

  const { doc, cursorY: startY, margin } = await setupPdfDoc({ title, subtitle, orientation, withLetterhead });
  let cursorY = startY + 3;

  sections.forEach((section) => {
    if (section.heading) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(section.heading, margin, cursorY);
      cursorY += 5;
      doc.setFont(undefined, "normal");
    }

    autoTable(doc, {
      head: [section.headers],
      body: section.rows,
      startY: cursorY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    cursorY = doc.lastAutoTable.finalY + 10;
  });

  addFooterAndSave(doc, margin, fileName);
}
