const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function fetchNetworkStatus() {
  const res = await fetch(`${API_BASE}/system/network-status`);
  return res.json();
}

export async function registerStudent(data) {
  const res = await fetch(`${API_BASE}/students/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function studentLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  return res.json();
}

export async function fetchStudents() {
  const res = await fetch(`${API_BASE}/students`);
  return res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function markAttendance(payload) {
  const res = await fetch(`${API_BASE}/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchDailyAttendance(date = '', status = 'All', search = '') {
  const query = new URLSearchParams();
  if (date) query.append('date', date);
  if (status && status !== 'All') query.append('status', status);
  if (search) query.append('search', search);

  const res = await fetch(`${API_BASE}/attendance/daily?${query.toString()}`);
  return res.json();
}

export async function fetchStudentHistory(studentId) {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/attendance/stats`);
  return res.json();
}

export function getExportCsvUrl(date = '') {
  return `${API_BASE}/attendance/export?date=${encodeURIComponent(date)}`;
}

export async function updateSystemSettings(settings) {
  const res = await fetch(`${API_BASE}/system/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/system/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function triggerCronManual() {
  const res = await fetch(`${API_BASE}/system/trigger-cron`, {
    method: 'POST'
  });
  return res.json();
}
