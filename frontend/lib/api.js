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

export async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `/api${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store", headers: { ...authHeaders() } });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesi login habis, silakan login ulang.");
  }
  if (!res.ok) throw new Error(`Gagal ambil data: ${path}`);
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
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Gagal kirim data: ${path}`);
  }
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
  if (!res.ok) throw new Error(`Gagal hapus data: ${path}`);
  return res.json();
}

// Bangun query export sesuai periode yang dipilih user
// period: "week" | "month" | "months_back" | "semester"
export function buildExportUrl({ period, months = 1, format = "xlsx" }) {
  const params = new URLSearchParams({ period, format });
  if (period === "months_back") params.set("months", months);
  return `/api/export/kehadiran?${params.toString()}`;
}
