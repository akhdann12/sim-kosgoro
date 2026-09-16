// Helper kecil buat fetch ke Laravel API.
// Saat development, Next.js akan proxy /api/* -> NEXT_PUBLIC_API_URL (lihat next.config.js)
export async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `/api${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gagal ambil data: ${path}`);
  return res.json();
}

export async function apiPost(path, body = {}) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gagal kirim data: ${path}`);
  return res.json();
}

// Bangun query export sesuai periode yang dipilih user
// period: "week" | "month" | "months_back" | "semester"
export function buildExportUrl({ period, months = 1, format = "xlsx" }) {
  const params = new URLSearchParams({ period, format });
  if (period === "months_back") params.set("months", months);
  return `/api/export/kehadiran?${params.toString()}`;
}
