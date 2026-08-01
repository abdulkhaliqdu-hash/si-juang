const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface User {
  id: number;
  username: string;
  role: string;
  display_name: string;
  nama_gampong?: string;
  nama_keuchik?: string;
  no_wa?: string;
  email?: string;
  photo_path?: string;
}

export interface Permohonan {
  id: number;
  nik: string;
  nama_pemohon: string;
  asal_gampong: string;
  jenis_surat: string;
  keperluan: string;
  no_wa_gampong: string;
  file_pengantar_path?: string;
  waktu_pengajuan: string;
  status: string;
  alasan_penolakan?: string;
  file_tte_path?: string;
}

export interface Feedback {
  permohonan_id: number;
  tingkat_kepuasan: string;
  catatan?: string;
  waktu_feedback: string;
}

export interface DashboardStats {
  total_permohonan: number;
  menunggu_verifikasi: number;
  proses_srikandi: number;
  selesai_tte: number;
  ditolak: number;
  total_feedback: number;
  permohonan_per_bulan: { bulan: string; jumlah: number }[];
  per_jenis_surat: { jenis_surat: string; jumlah: number }[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

// Auth
export async function login(username: string, password: string) {
  return request<{ success: boolean; user: User }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getUser(username: string) {
  return request<User>(`/user?username=${encodeURIComponent(username)}`);
}

export async function updateProfile(username: string, data: Partial<User>) {
  return request<{ success: boolean }>("/user/profile", {
    method: "PUT",
    body: JSON.stringify({ username, ...data }),
  });
}

export async function changePassword(
  username: string,
  old_password: string,
  new_password: string
) {
  return request<{ success: boolean }>("/user/change-password", {
    method: "POST",
    body: JSON.stringify({ username, old_password, new_password }),
  });
}

export async function registerOperator(data: {
  username: string;
  password: string;
  display_name: string;
  nama_gampong: string;
  nama_keuchik: string;
  no_wa: string;
  email?: string;
}) {
  return request<{ success: boolean }>("/user/register-operator", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Permohonan
export async function getPermohonan(status?: string, gampong?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (gampong) params.set("gampong", gampong);
  const qs = params.toString();
  return request<{ data: Permohonan[] }>(`/permohonan${qs ? "?" + qs : ""}`);
}

export async function createPermohonan(data: Partial<Permohonan>) {
  return request<{ success: boolean; id: number }>("/permohonan", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePermohonanStatus(
  id: number,
  action: string,
  extra: Record<string, string> = {}
) {
  return request<{ success: boolean }>("/permohonan/status", {
    method: "PUT",
    body: JSON.stringify({ id, action, ...extra }),
  });
}

// Leaderboard
export async function getLeaderboard() {
  return request<{ data: { gampong: string; layanan: number }[] }>(
    "/leaderboard"
  );
}

// Stats
export async function getDashboardStats() {
  return request<DashboardStats>("/stats");
}

// Feedback
export async function getFeedback() {
  return request<{
    total_feedback: number;
    detail: Record<string, number>;
    masukan_tidak_puas: Feedback[];
  }>("/feedback");
}

export async function submitFeedback(
  permohonan_id: number,
  tingkat_kepuasan: string,
  catatan: string
) {
  return request<{ success: boolean }>("/feedback", {
    method: "POST",
    body: JSON.stringify({ permohonan_id, tingkat_kepuasan, catatan }),
  });
}

