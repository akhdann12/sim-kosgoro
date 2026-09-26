"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "sim_kosgoro_onboarding_ta";
const OnboardingContext = createContext(null);

/**
 * Sesudah user bikin Tahun Ajaran baru (baik itu setup pertama kali sistem dipakai, atau bikin TA
 * baru buat tahun ajaran berikutnya), dia diarahin ke Data Master Guru dalam "mode setup" - guru
 * yang ditambahin/di-import selama mode ini aktif otomatis dianggap bergabung sejak tanggal mulai
 * TA tersebut (gak perlu diisi manual satu-satu). Begitu user klik "Selesai Setup" atau pindah ke
 * TA lain, mode ini berhenti - nambah guru sesudahnya wajib isi tanggal bergabung sendiri.
 *
 * Disimpan di sessionStorage (bukan localStorage) - sengaja cuma nempel selama tab ini masih
 * kebuka, biar gak "nyangkut aktif" kalau user buka lagi sistemnya besok/di tab baru.
 */
export function OnboardingProvider({ children }) {
  const [onboarding, setOnboarding] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setOnboarding(JSON.parse(raw));
    } catch (err) {
      console.error(err);
    } finally {
      setHydrated(true);
    }
  }, []);

  const startOnboarding = useCallback((ta) => {
    const payload = {
      taId: ta.id,
      tanggalMulai: ta.tanggal_mulai,
      label: `${ta.nama} \u2022 ${String(ta.semester).toUpperCase()}`,
    };
    setOnboarding(payload);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const endOnboarding = useCallback(() => {
    setOnboarding(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <OnboardingContext.Provider value={{ onboarding: hydrated ? onboarding : null, startOnboarding, endOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding harus dipakai di dalam <OnboardingProvider>");
  return ctx;
}
