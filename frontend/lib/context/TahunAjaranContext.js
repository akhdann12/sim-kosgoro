"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { taOptions, PERIODE_OPTIONS, getPeriodRange } from "@/lib/periodUtils";
import { apiGet } from "@/lib/api";
import { buildDashboardView } from "@/lib/dashboardUtils";
import { statusFromBackend, computeAgendaList, computeEventSummary, computeRekapPerAgenda } from "@/lib/eventUtils";
import { useGuruMaster } from "@/lib/context/GuruMasterContext";
import { useAuth } from "@/lib/context/AuthContext";

const TahunAjaranContext = createContext(null);

export function TahunAjaranProvider({ children }) {
  const { user } = useAuth();
  const options = taOptions();
  const [taId, setTaId] = useState(options[0].id);
  const { guruList } = useGuruMaster();

  const [dashboardByPeriod, setDashboardByPeriod] = useState({});
  const [periodRanges, setPeriodRanges] = useState({});
  const [event, setEvent] = useState({ summaryCards: [], agendaList: [], guruEvent: [], rekapPerAgenda: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const current = options.find((o) => o.id === taId) || options[0];

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // --- Dashboard: fetch rekap per periode (minggu/bulan/3 bulan/semester) ---
      const ranges = {};
      const byPeriod = {};
      for (const p of PERIODE_OPTIONS) {
        const range = getPeriodRange(taId, p.key);
        ranges[p.key] = range;
        const res = await apiGet("/dashboard/rekap", { start: range.startISO, end: range.endISO });
        byPeriod[p.key] = buildDashboardView(res);
      }
      setPeriodRanges(ranges);
      setDashboardByPeriod(byPeriod);

      // --- Presensi Kegiatan: fetch matrix guru x agenda ---
      const matrixRes = await apiGet("/kegiatan/matrix");
      const agendaBase = (matrixRes.kegiatan || []).map((k) => ({
        key: `agenda-${k.id}`, id: k.id, label: String(k.nama).toUpperCase(), namaAsli: k.nama, tanggal: k.tanggal,
      }));
      const guruEvent = (matrixRes.data || []).map((g, idx) => ({
        id: g.guru_id, no: idx + 1, nama: g.nama, nip: g.nip, jabatan: g.jabatan,
        status: (g.status || []).map((s) => ({ value: statusFromBackend(s.status), reason: s.reason || "" })),
      }));
      const agendaList = computeAgendaList(agendaBase, guruEvent);
      setEvent({
        summaryCards: computeEventSummary(agendaList, guruEvent),
        agendaList,
        guruEvent,
        rekapPerAgenda: computeRekapPerAgenda(agendaList),
      });
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data dari server. Cek koneksi backend / login ulang.");
    } finally {
      setLoading(false);
    }
  }, [taId, user]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taId, user, guruList.length]);

  const data = {
    taId,
    tahun: current.tahun,
    semester: current.semester,
    guruList,
    dashboard: dashboardByPeriod.semester || { summaryCards: [], guruRekap: [] },
    dashboardByPeriod,
    periodRanges,
    event,
  };

  const value = { taId, setTaId, options, current, data, loading, error, refresh: loadData };

  return <TahunAjaranContext.Provider value={value}>{children}</TahunAjaranContext.Provider>;
}

export function useTahunAjaran() {
  const ctx = useContext(TahunAjaranContext);
  if (!ctx) {
    throw new Error("useTahunAjaran harus dipakai di dalam <TahunAjaranProvider>");
  }
  return ctx;
}
