"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/context/AuthContext";

const GuruMasterContext = createContext(null);

export function GuruMasterProvider({ children }) {
  const { user } = useAuth();
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/guru");
      setGuruList(data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data master guru dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cuma fetch data guru kalau udah login (biar gak nembak API pas masih di halaman login)
  useEffect(() => {
    if (user) refresh();
    else setLoading(false);
  }, [user, refresh]);

  async function addGuru({ nama, jabatan, mapel, nip, tanggal_bergabung }) {
    await apiPost("/guru", { nama, jabatan, mapel: mapel || null, nip: nip || null, tanggal_bergabung: tanggal_bergabung || null });
    await refresh();
  }

  // Dipakai buat set/ubah tanggal_bergabung guru (guru yang gabung di tengah semester) atau
  // data lain tanpa harus lewat form tambah - misal langsung dari kolom di tabel Data Master Guru.
  async function updateGuru(id, payload) {
    await apiPut(`/guru/${id}`, payload);
    await refresh();
  }

  async function removeGuru(id) {
    await apiDelete(`/guru/${id}`);
    await refresh();
  }

  // rows: [{ nama, jabatan, nip }] - hasil parsing Excel/CSV di frontend, dikirim ke backend buat di-upsert
  // tanggalBergabungDefault (opsional): dipakai HANYA buat guru yang beneran baru dibikin dari
  // import ini (biasanya = tanggal mulai Tahun Ajaran pas mode setup awal aktif).
  async function importGuru(rows, tanggalBergabungDefault = null) {
    const result = await apiPost("/guru/import", { rows, tanggal_bergabung_default: tanggalBergabungDefault });
    await refresh();
    return result; // { added, updated }
  }

  return (
    <GuruMasterContext.Provider value={{ guruList, loading, error, addGuru, updateGuru, removeGuru, importGuru, refresh }}>
      {children}
    </GuruMasterContext.Provider>
  );
}

export function useGuruMaster() {
  const ctx = useContext(GuruMasterContext);
  if (!ctx) throw new Error("useGuruMaster harus dipakai di dalam <GuruMasterProvider>");
  return ctx;
}
