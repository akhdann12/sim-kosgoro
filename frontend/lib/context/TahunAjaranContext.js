"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERIODE_OPTIONS, getPeriodRange } from "@/lib/periodUtils";
import { apiGet, apiPost } from "@/lib/api";
import { buildDashboardView } from "@/lib/dashboardUtils";
import { statusFromBackend, computeAgendaList, computeEventSummary, computeRekapPerAgenda } from "@/lib/eventUtils";
import { useGuruMaster } from "@/lib/context/GuruMasterContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useOnboarding } from "@/lib/context/OnboardingContext";

const TahunAjaranContext = createContext(null);

function labelFor(ta) {
  return `TA ${ta.nama} \u2022 ${String(ta.semester).toUpperCase()}`;
}

export function TahunAjaranProvider({ children }) {
  const { user } = useAuth();
  const { guruList } = useGuruMaster();
  const { startOnboarding } = useOnboarding();
  const router = useRouter();

  // Daftar tahun ajaran SEPENUHNYA dari database (GET /api/tahun-ajaran) - gak ada lagi
  // data statis/percobaan yang di-hardcode. Kalau belum ada tahun ajaran sama sekali,
  // halaman-halaman yang butuh data akan minta user bikin dulu lewat "Tambah Tahun Ajaran".
  const [taList, setTaList] = useState([]);
  const [taId, setTaId] = useState(null);
  const [loadingTaList, setLoadingTaList] = useState(true);

  const [dashboardByPeriod, setDashboardByPeriod] = useState({});
  const [periodRanges, setPeriodRanges] = useState({});
  const [event, setEvent] = useState({ summaryCards: [], agendaList: [], guruEvent: [], rekapPerAgenda: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const options = useMemo(
    () => taList.map((ta) => ({ id: ta.id, label: labelFor(ta), tahun: ta.nama, semester: ta.semester, raw: ta })),
    [taList]
  );

  const current = useMemo(() => {
    const found = taList.find((t) => t.id === taId) || taList[0];
    if (!found) return null;
    return { id: found.id, label: labelFor(found), tahun: found.nama, semester: found.semester, raw: found };
  }, [taList, taId]);

  const loadTaList = useCallback(async () => {
    if (!user) return;
    setLoadingTaList(true);
    try {
      const list = await apiGet("/tahun-ajaran");
      setTaList(list);
      setTaId((prevId) => {
        if (prevId && list.some((t) => t.id === prevId)) return prevId;
        const aktif = list.find((t) => t.aktif);
        return (aktif || list[0])?.id ?? null;
      });
    } catch (err) {
      console.error(err);
      setError("Gagal memuat daftar Tahun Ajaran dari server.");
    } finally {
      setLoadingTaList(false);
    }
  }, [user]);

  useEffect(() => {
    loadTaList();
  }, [loadTaList]);

  // Bikin Tahun Ajaran baru (dipakai form "Tambah Tahun Ajaran"). Habis dibuat, langsung
  // dipilih jadi tahun ajaran yang ditampilkan, DAN user diarahin ke Data Master Guru dalam mode
  // setup: guru yang ditambahin/di-import di situ otomatis dianggap bergabung sejak tanggal mulai
  // TA yang baru dibuat ini - gak perlu isi tanggal bergabung manual satu-satu.
  const createTahunAjaran = useCallback(async ({ nama, semester, tanggal_mulai, tanggal_selesai, aktif }) => {
    const created = await apiPost("/tahun-ajaran", { nama, semester, tanggal_mulai, tanggal_selesai, aktif });
    await loadTaList();
    setTaId(created.id);
    startOnboarding(created);
    router.push("/data-master-guru");
    return created;
  }, [loadTaList, startOnboarding, router]);

  const loadData = useCallback(async () => {
    if (!user || !current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const semStart = new Date(current.raw.tanggal_mulai);
      const semEnd = new Date(current.raw.tanggal_selesai);

      // --- Dashboard: fetch rekap per periode (minggu/bulan/3 bulan/semester) ---
      const ranges = {};
      const byPeriod = {};
      for (const p of PERIODE_OPTIONS) {
        const range = getPeriodRange(semStart, semEnd, p.key);
        ranges[p.key] = range;
        const res = await apiGet("/dashboard/rekap", { start: range.startISO, end: range.endISO });
        byPeriod[p.key] = buildDashboardView(res);
      }
      setPeriodRanges(ranges);
      setDashboardByPeriod(byPeriod);

      // --- Presensi Kegiatan: fetch matrix guru x agenda ---
      const matrixRes = await apiGet("/kegiatan/matrix");
      const agendaBase = (matrixRes.kegiatan || []).map((k) => ({
        key: `agenda-${k.id}`, id: k.id, label: String(k.nama).toUpperCase(), namaAsli: k.nama,
        tanggal: k.tanggal, tanggalIso: k.tanggal_iso,
      }));
      const guruEvent = (matrixRes.data || []).map((g, idx) => ({
        id: g.guru_id, no: idx + 1, nama: g.nama, nip: g.nip, jabatan: g.jabatan,
        tanggalBergabung: g.tanggal_bergabung || null,
        status: (g.status || []).map((s) => ({
          value: s.status === "belum_bergabung" ? "belum_bergabung" : statusFromBackend(s.status),
          reason: s.reason || "",
        })),
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
  }, [current, user]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, user, guruList.length]);

  const data = {
    taId,
    tahun: current?.tahun,
    semester: current?.semester,
    guruList,
    dashboard: dashboardByPeriod.semester || { summaryCards: [], guruRekap: [] },
    dashboardByPeriod,
    periodRanges,
    event,
  };

  const value = {
    taId, setTaId, options, current, data, loading, error, refresh: loadData,
    taList, loadingTaList, createTahunAjaran, refreshTaList: loadTaList,
  };

  return <TahunAjaranContext.Provider value={value}>{children}</TahunAjaranContext.Provider>;
}

export function useTahunAjaran() {
  const ctx = useContext(TahunAjaranContext);
  if (!ctx) {
    throw new Error("useTahunAjaran harus dipakai di dalam <TahunAjaranProvider>");
  }
  return ctx;
}
