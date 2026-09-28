// Helper kecil buat fetch ke Laravel API, dengan token Sanctum otomatis nempel di header.
// Saat development, Next.js akan proxy /api/* -> NEXT_PUBLIC_API_URL (lihat next.config.js)

const TOKEN_KEY = "sim_kosgoro_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Kalau server bilang "gak login" (401), token yang tersimpan udah gak valid -> bersihin
// dan lempar balik ke halaman login, biar gak nyangkut di halaman yang datanya gak bisa dimuat.
function handleUnauthorized() {
  setToken(null);
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Bikin pesan error yang informatif dari response gagal: pakai pesan dari server kalau ada,
// dan kasih penjelasan khusus buat status yang sering muncul di hosting (timeout gateway,
// rate limit, server error) - biar gak cuma "Gagal ambil data" tanpa tau sebabnya.
async function pesanError(res, fallback) {
  const body = await res.json().catch(() => ({}));
  if (res.status === 429) return "Terlalu banyak permintaan dalam waktu singkat, tunggu sekitar 1 menit lalu coba lagi.";
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return `Server backend lagi lambat / belum merespons (HTTP ${res.status}). Coba lagi sebentar.`;
  }
  if (body.message) return res.status >= 500 ? `${body.message} (HTTP ${res.status})` : body.message;
  return `${fallback} (HTTP ${res.status})`;
}

export async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `/api${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store", headers: { ...authHeaders() } });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(await pesanError(res, `Gagal ambil data: ${path}`));
  return res.json();
}

export async function apiPost(path, body = {}) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(await pesanError(res, `Gagal kirim data: ${path}`));
  return res.json();
}

export async function apiPut(path, body = {}) {
  const res = await fetch(`/api${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(await pesanError(res, `Gagal memperbarui data: ${path}`));
  return res.json();
}

// Upload file (multipart/form-data) - dipakai buat import Excel yang parsing-nya dilakukan di
// backend (bukan di browser), misal format grid ketidakhadiran (guru x tanggal + baris Keterangan).
export async function apiUploadFile(path, file, fieldName = "file") {
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(await pesanError(res, `Gagal upload file: ${path}`));
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`/api${path}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(await pesanError(res, `Gagal hapus data: ${path}`));
  return res.json();
}

// Bangun query export sesuai periode yang dipilih user
// period: "week" | "month" | "months_back" | "semester"
export function buildExportUrl({ period, months = 1, format = "xlsx" }) {
  const params = new URLSearchParams({ period, format });
  if (period === "months_back") params.set("months", months);
  return `/api/export/kehadiran?${params.toString()}`;
}
