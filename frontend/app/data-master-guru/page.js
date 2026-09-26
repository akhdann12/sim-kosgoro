"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TambahGuruModal from "@/components/TambahGuruModal";
import ImportGuruPanel from "@/components/ImportGuruPanel";
import { useGuruMaster } from "@/lib/context/GuruMasterContext";
import { useOnboarding } from "@/lib/context/OnboardingContext";
import { useAuth } from "@/lib/context/AuthContext";

function formatTanggalID(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const JABATAN_NON_PENGAJAR = ["Tenaga Administrasi", "Tenaga Kebersihan"];

export default function DataMasterGuruPage() {
  const { guruList, loading, error, addGuru, updateGuru, removeGuru, importGuru, refresh } = useGuruMaster();
  const { onboarding, endOnboarding } = useOnboarding();
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [savingTbId, setSavingTbId] = useState(null);

  function handleSelesaiSetup() {
    endOnboarding();
    router.push("/dashboard");
  }

  const totalGuru = guruList.length;
  const totalPengajar = guruList.filter((g) => !JABATAN_NON_PENGAJAR.includes(g.jabatan)).length;
  const totalTendik = totalGuru - totalPengajar;

  const filtered = guruList.filter((g) => {
    const q = search.toLowerCase();
    return g.nama.toLowerCase().includes(q) || g.jabatan.toLowerCase().includes(q) || (g.mapel || "").toLowerCase().includes(q);
  });

  async function handleAdd(payload) {
    setSaving(true);
    try {
      await addGuru(payload);
      setShowModal(false);
    } catch (err) {
      alert(err.message || "Gagal menyimpan guru baru.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUbahTanggalBergabung(g, value) {
    setSavingTbId(g.id);
    try {
      await updateGuru(g.id, { tanggal_bergabung: value || null });
    } catch (err) {
      alert(err.message || "Gagal menyimpan tanggal bergabung.");
    } finally {
      setSavingTbId(null);
    }
  }

  async function handleRemove(g) {
    const ok = window.confirm(`Hapus "${g.nama}" dari data master? Data ini akan ikut hilang dari Dashboard, Presensi Kegiatan, dan Ketidakhadiran.`);
    if (!ok) return;
    setRemovingId(g.id);
    try {
      await removeGuru(g.id);
    } catch (err) {
      alert(err.message || "Gagal menghapus guru.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading && (
            <div className="mb-4 text-xs text-slate-400 flex items-center">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> Memuat data dari server...
            </div>
          )}
          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 flex items-center justify-between">
              <span><i className="fa-solid fa-circle-exclamation mr-1.5"></i> {error}</span>
              <button onClick={refresh} className="font-semibold underline">Coba lagi</button>
            </div>
          )}

          {onboarding && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Mode Setup Tahun Ajaran {onboarding.label}</p>
                  <p className="text-[11px] text-emerald-700">
                    Guru yang ditambahkan atau di-import sekarang otomatis dianggap bergabung sejak{" "}
                    <b>{formatTanggalID(onboarding.tanggalMulai)}</b> (tanggal mulai tahun ajaran ini).
                  </p>
                </div>
              </div>
              <button
                onClick={handleSelesaiSetup}
                className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs shadow-sm whitespace-nowrap"
              >
                <i className="fa-solid fa-check mr-1.5"></i> Selesai Setup, ke Dashboard
              </button>
            </div>
          )}

          {/* Page Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a8a] mb-1">Data Master Guru & Tenaga Kependidikan</h2>
              <p className="text-xs text-slate-500">
                SMK Kosgoro Kota Bogor &bull; Sumber data utama &mdash; semua rekap di Dashboard, Presensi Kegiatan, dan
                Ketidakhadiran diambil dari daftar ini.
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 bg-[#1e3a8a] text-white rounded font-medium hover:bg-blue-900 shadow-sm text-sm whitespace-nowrap"
              >
                <i className="fa-solid fa-user-plus mr-2"></i> Tambah Guru
              </button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Total Terdaftar</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalGuru}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Guru & tenaga kependidikan aktif</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Guru / Pendidik</p>
              <h3 className="text-3xl font-bold text-emerald-600">{totalPengajar}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Dihitung di rekap kehadiran mengajar</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Tenaga Kependidikan</p>
              <h3 className="text-3xl font-bold text-purple-600">{totalTendik}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Administrasi & kebersihan</p>
            </div>
          </div>

          {/* IMPORT DATA MASTER - khusus super_admin */}
          {isSuperAdmin && (
            <ImportGuruPanel onImport={importGuru} defaultTanggalBergabung={onboarding?.tanggalMulai || null} />
          )}

          {/* TABLE SECTION */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#1e3a8a] text-white rounded flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-users-gear"></i>
                </div>
                <div>
                  <h4 className="font-bold text-[#1e3a8a] text-sm">Daftar Guru & Tenaga Kependidikan</h4>
                  <p className="text-[11px] text-slate-500">Nambah/hapus data di sini otomatis ngubah data di semua halaman</p>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-300 text-xs"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, jabatan, atau mapel..."
                  className="w-full text-xs bg-white border border-slate-200 rounded py-2 pl-8 pr-3 outline-none focus:border-blue-300"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[10px] uppercase tracking-wider">
                    <th className="p-3 font-medium text-center w-12">No</th>
                    <th className="p-3 font-medium w-28">NIP / ID</th>
                    <th className="p-3 font-medium">Nama Lengkap Guru</th>
                    <th className="p-3 font-medium">Jabatan / Mapel</th>
                    <th className="p-3 font-medium w-40">Tanggal Bergabung</th>
                    {isSuperAdmin && <th className="p-3 font-medium text-right pr-6">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
                  {filtered.map((g, idx) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-3 text-slate-400">{g.nip ? g.nip : <span className="italic text-slate-300">ID-{g.id}</span>}</td>
                      <td className="p-3">
                        <span className="font-bold text-sm text-[#1e3a8a]">{g.nama}</span>
                      </td>
                      <td className="p-3">
                        {/^(Kepala|Waka\.)/.test(g.jabatan) ? (
                          <span className={/^Waka\./.test(g.jabatan) ? "bg-[#1e3a8a] text-white px-2 py-1 rounded text-[10px] font-medium" : "bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-medium border border-blue-100"}>
                            {g.jabatan}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">{g.jabatan}</span>
                        )}
                        {g.mapel && <span className="ml-2 text-[10px] text-slate-400">&bull; {g.mapel}</span>}
                      </td>
                      <td className="p-3">
                        {isSuperAdmin ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                defaultValue={g.tanggal_bergabung || ""}
                                disabled={savingTbId === g.id}
                                onBlur={(e) => {
                                  if (e.target.value !== (g.tanggal_bergabung || "")) handleUbahTanggalBergabung(g, e.target.value);
                                }}
                                className="text-[11px] bg-slate-50 border border-slate-200 rounded py-1 px-1.5 outline-none focus:border-blue-300 disabled:opacity-50"
                              />
                              {savingTbId === g.id && <i className="fa-solid fa-spinner fa-spin text-slate-400 text-[10px]"></i>}
                            </div>
                            {!g.tanggal_bergabung && (
                              <p className="text-[9px] text-slate-300 mt-0.5">Kosong = sejak awal TA</p>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">{g.tanggal_bergabung ? formatTanggalID(g.tanggal_bergabung) : "-"}</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="p-3 text-right pr-6">
                          <button onClick={() => handleRemove(g)} disabled={removingId === g.id} className="text-red-500 hover:text-red-700 text-[11px] font-medium disabled:opacity-50">
                            {removingId === g.id ? (
                              <><i className="fa-solid fa-spinner fa-spin mr-1"></i> Menghapus...</>
                            ) : (
                              <><i className="fa-solid fa-trash-can mr-1"></i> Hapus</>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={isSuperAdmin ? 6 : 5} className="p-6 text-center text-slate-400 text-xs">
                        {guruList.length === 0 ? "Belum ada data guru. Tambah manual atau import lewat panel di atas." : "Gak ada data yang cocok."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-lg text-[10px] text-slate-500">
              <i className="fa-solid fa-circle-info mr-1.5 text-slate-400"></i>
              NIP/ID boleh dikosongin &mdash; ID internal (primary key) dibuat otomatis dan dipakai buat nyambungin data
              guru ini ke semua rekap kehadiran, presensi kegiatan, dan ketidakhadiran.
            </div>
          </div>

          <br /><br />
        </div>
      </AppShell>

      {showModal && (
        <TambahGuruModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
          saving={saving}
          defaultTanggalBergabung={onboarding?.tanggalMulai || null}
        />
      )}
    </>
  );
}
