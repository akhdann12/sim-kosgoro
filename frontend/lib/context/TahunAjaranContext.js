"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getDataForTA, taOptions } from "@/lib/data/generateTaData";
import { useGuruMaster } from "@/lib/context/GuruMasterContext";

const TahunAjaranContext = createContext(null);

export function TahunAjaranProvider({ children }) {
  const options = useMemo(() => taOptions(), []);
  const [taId, setTaId] = useState(options[0].id);
  const { guruList } = useGuruMaster(); // Data Master Guru jadi source of truth

  // data di-generate ulang tiap kali TA berubah ATAU data master guru berubah
  const data = useMemo(() => getDataForTA(taId, guruList), [taId, guruList]);
  const current = options.find((o) => o.id === taId) || options[0];

  const value = { taId, setTaId, options, current, data };

  return <TahunAjaranContext.Provider value={value}>{children}</TahunAjaranContext.Provider>;
}

export function useTahunAjaran() {
  const ctx = useContext(TahunAjaranContext);
  if (!ctx) {
    throw new Error("useTahunAjaran harus dipakai di dalam <TahunAjaranProvider>");
  }
  return ctx;
}
