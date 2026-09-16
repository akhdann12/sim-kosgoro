"use client";

import { createContext, useContext, useState } from "react";
import { MASTER_GURU } from "@/lib/data/generateTaData";

const GuruMasterContext = createContext(null);

export function GuruMasterProvider({ children }) {
  const [guruList, setGuruList] = useState(MASTER_GURU);

  function addGuru({ nama, jabatan, mapel, nip }) {
    setGuruList((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((g) => g.id)) + 1 : 1;
      return [...prev, { id: nextId, nama: nama.trim(), jabatan: jabatan.trim(), mapel: mapel?.trim() || undefined, nip: nip?.trim() || "" }];
    });
  }

  function removeGuru(id) {
    setGuruList((prev) => prev.filter((g) => g.id !== id));
  }

  // Import massal dari Excel/CSV. Cocokin berdasarkan nama (case-insensitive):
  // - nama udah ada -> update jabatan & NIP-nya
  // - nama baru -> ditambahin sebagai entri baru
  // Return { added, updated } buat ditampilin ke user.
  function importGuru(rows) {
    const next = [...guruList];
    let nextId = next.length ? Math.max(...next.map((g) => g.id)) + 1 : 1;
    let added = 0;
    let updated = 0;

    rows.forEach((r) => {
      if (!r.nama) return;
      const idx = next.findIndex((g) => g.nama.trim().toLowerCase() === r.nama.trim().toLowerCase());
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          jabatan: r.jabatan || next[idx].jabatan,
          nip: r.nip || next[idx].nip,
        };
        updated++;
      } else {
        next.push({
          id: nextId++,
          nama: r.nama.trim(),
          jabatan: r.jabatan?.trim() || "Guru Mapel",
          nip: r.nip?.trim() || "",
        });
        added++;
      }
    });

    setGuruList(next);
    return { added, updated };
  }

  return (
    <GuruMasterContext.Provider value={{ guruList, addGuru, removeGuru, importGuru }}>
      {children}
    </GuruMasterContext.Provider>
  );
}

export function useGuruMaster() {
  const ctx = useContext(GuruMasterContext);
  if (!ctx) throw new Error("useGuruMaster harus dipakai di dalam <GuruMasterProvider>");
  return ctx;
}
