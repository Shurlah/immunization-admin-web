import axios from 'axios';
import type {
  Appointment,
  AuditLog,
  AuthSession,
  Child,
  DashboardMetrics,
  Facility,
  FacilityPerformance,
  Guardian,
  ImmunizationRecord,
  Paged,
  SmsDelivery,
  SmsNotification,
  SyncReliability,
  User,
  Vaccine,
  VaccineSchedule
} from './types';

type SessionListener = (session: AuthSession | null) => void;

const sessionListeners = new Set<SessionListener>();
let refreshPromise: Promise<AuthSession | null> | null = null;

export const roleOptions = [
  { id: 'a1111111-1111-1111-1111-111111111111', name: 'SystemAdministrator' },
  { id: 'a2222222-2222-2222-2222-222222222222', name: 'LgaHealthOfficial' },
  { id: 'a3333333-3333-3333-3333-333333333333', name: 'FacilitySupervisor' },
  { id: 'a4444444-4444-4444-4444-444444444444', name: 'HealthWorker' },
  { id: 'a5555555-5555-5555-5555-555555555555', name: 'Auditor' }
];

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  timeout: 15000
});

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function withAccessTokenExpiry(session: AuthSession): AuthSession {
  const payload = decodeJwtPayload(session.accessToken);
  return {
    ...session,
    accessTokenExpiresAt: payload?.exp ? payload.exp * 1000 : undefined
  };
}

function notifySessionListeners(session: AuthSession | null) {
  sessionListeners.forEach(listener => listener(session));
}

export function onSessionChange(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function setSession(session: AuthSession | null) {
  if (session) {
    const normalizedSession = withAccessTokenExpiry(session);
    localStorage.setItem('immunization-admin-session', JSON.stringify(normalizedSession));
    api.defaults.headers.common.Authorization = `Bearer ${normalizedSession.accessToken}`;
    notifySessionListeners(normalizedSession);
  } else {
    localStorage.removeItem('immunization-admin-session');
    delete api.defaults.headers.common.Authorization;
    notifySessionListeners(null);
  }
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem('immunization-admin-session');
  if (!raw) return null;
  const session = withAccessTokenExpiry(JSON.parse(raw) as AuthSession);
  api.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
  return session;
}

export async function login(email: string, password: string) {
  const response = await api.post<AuthSession>('/api/auth/login', { email, password });
  setSession(response.data);
  return response.data;
}

export async function logout(refreshToken: string) {
  await api.post('/api/auth/logout', { refreshToken });
  setSession(null);
}

export async function refreshSession(refreshToken?: string) {
  const currentSession = refreshToken ? loadSession() ?? { refreshToken } as AuthSession : loadSession();
  const token = refreshToken ?? currentSession?.refreshToken;

  if (!token) {
    setSession(null);
    return null;
  }

  const response = await api.post<AuthSession>('/api/auth/refresh-token', { refreshToken: token }, { skipAuthRefresh: true } as never);
  setSession(response.data);
  return loadSession();
}

api.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean; skipAuthRefresh?: boolean }) | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
      });

      const session = await refreshPromise;
      if (!session) {
        return Promise.reject(error);
      }

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${session.accessToken}`
      };

      return api.request(originalRequest);
    } catch (refreshError) {
      setSession(null);
      return Promise.reject(refreshError);
    }
  }
);

export async function fetchCoverage() {
  return (await api.get<DashboardMetrics>('/api/reports/immunization-coverage')).data;
}

export async function fetchSyncReliability() {
  return (await api.get<SyncReliability>('/api/reports/sync-reliability')).data;
}

export async function fetchSmsDelivery() {
  return (await api.get<SmsDelivery>('/api/reports/sms-delivery')).data;
}

export async function fetchFacilityPerformance() {
  return (await api.get<FacilityPerformance[]>('/api/reports/facility-performance')).data;
}

export async function fetchMissedAppointments() {
  return (await api.get<Appointment[]>('/api/reports/missed-appointments')).data;
}

export async function downloadReportCsv(path: string, fileName: string) {
  const response = await api.get<Blob>(path, { responseType: 'blob' });
  const downloadUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportCoverageCsv() {
  await downloadReportCsv('/api/reports/immunization-coverage/export', 'immunization-coverage.csv');
}

export async function exportMissedAppointmentsCsv() {
  await downloadReportCsv('/api/reports/missed-appointments/export', 'missed-appointments.csv');
}

export async function exportSmsDeliveryCsv() {
  await downloadReportCsv('/api/reports/sms-delivery/export', 'sms-delivery.csv');
}

export async function exportSyncReliabilityCsv() {
  await downloadReportCsv('/api/reports/sync-reliability/export', 'sync-reliability.csv');
}

export async function exportFacilityPerformanceCsv() {
  await downloadReportCsv('/api/reports/facility-performance/export', 'facility-performance.csv');
}

export async function fetchFacilities() {
  return (await api.get<Paged<Facility>>('/api/facilities', { params: { pageSize: 200 } })).data.items;
}

export async function createFacility(payload: Omit<Facility, 'id' | 'isActive'>) {
  return (await api.post<Facility>('/api/facilities', payload)).data;
}

export async function updateFacility(id: string, payload: Omit<Facility, 'id' | 'isActive'>) {
  await api.put(`/api/facilities/${id}`, payload);
}

export async function fetchUsers() {
  return (await api.get<Paged<User>>('/api/users', { params: { pageSize: 200 } })).data.items;
}

export async function createUser(payload: { fullName: string; email: string; phoneNumber?: string | null; password: string; roleId: string; facilityId?: string | null }) {
  return (await api.post<User>('/api/users', payload)).data;
}

export async function updateUser(id: string, payload: { fullName: string; phoneNumber?: string | null; roleId: string; facilityId?: string | null }) {
  await api.put(`/api/users/${id}`, payload);
}

export async function disableUser(id: string) {
  await api.post(`/api/users/${id}/disable`);
}

export async function fetchVaccines() {
  return (await api.get<Vaccine[]>('/api/vaccines')).data;
}

export async function createVaccine(payload: Omit<Vaccine, 'id' | 'isActive'>) {
  return (await api.post<Vaccine>('/api/vaccines', payload)).data;
}

export async function updateVaccine(id: string, payload: Omit<Vaccine, 'id' | 'isActive'>) {
  await api.put(`/api/vaccines/${id}`, payload);
}

export async function disableVaccine(id: string) {
  await api.post(`/api/vaccines/${id}/disable`);
}

export async function createSchedule(vaccineId: string, payload: VaccineSchedule) {
  return (await api.post<VaccineSchedule>(`/api/vaccines/${vaccineId}/schedules`, payload)).data;
}

export async function fetchChildren(params?: { q?: string; phone?: string; facilityId?: string }) {
  if (params?.q || params?.phone || params?.facilityId) {
    return (await api.get<Child[]>('/api/children/search', { params })).data;
  }
  return (await api.get<Paged<Child>>('/api/children', { params: { pageSize: 100 } })).data.items;
}

export async function fetchDuplicates() {
  return (await api.get<Child[]>('/api/children/duplicates')).data;
}

export async function exportChildrenCsv(params?: {
  facilityId?: string;
  from?: string;
  to?: string;
  startMonth?: string;
  endMonth?: string;
  startYear?: string;
  endYear?: string;
}) {
  const query = Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => value));
  const search = new URLSearchParams(query).toString();
  const path = search ? `/api/children/export?${search}` : '/api/children/export';
  await downloadReportCsv(path, 'children-export.csv');
}

export async function createGuardian(payload: Omit<Guardian, 'id'>) {
  return (await api.post<Guardian>('/api/guardians', payload)).data;
}

export async function createChild(payload: { firstName: string; middleName?: string | null; lastName: string; dateOfBirth: string; sex: string; guardianId: string; facilityId: string; createdByUserId: string; createdByDeviceId?: string | null }) {
  return (await api.post<Child>('/api/children', { id: null, ...payload })).data;
}

export async function recordImmunization(payload: { childId: string; vaccineId: string; doseName: string; dateAdministered: string; facilityId: string; administeredByUserId: string; createdByDeviceId?: string | null; notes?: string | null }) {
  return (await api.post<ImmunizationRecord>('/api/immunizations', { id: null, ...payload })).data;
}

export async function fetchAppointments() {
  return (await api.get<Appointment[]>('/api/appointments')).data;
}

export async function createAppointment(payload: Omit<Appointment, 'id' | 'status' | 'completedAt' | 'missedAt'>) {
  return (await api.post<Appointment>('/api/appointments', payload)).data;
}

export async function completeAppointment(id: string) {
  await api.post(`/api/appointments/${id}/complete`, { completedAt: new Date().toISOString() });
}

export async function markAppointmentMissed(id: string) {
  await api.post(`/api/appointments/${id}/mark-missed`);
}

export async function fetchSmsNotifications() {
  return (await api.get<Paged<SmsNotification>>('/api/notifications/sms', { params: { pageSize: 100 } })).data.items;
}

export async function sendTestSms(payload: { phoneNumber: string; message: string }) {
  return (await api.post('/api/notifications/sms/send-test', payload)).data;
}

export async function fetchAuditLogs(params?: { action?: string; entityType?: string; from?: string; to?: string }) {
  return (await api.get<AuditLog[]>('/api/audit-logs', { params })).data;
}

export async function fetchSyncStatus() {
  return (await api.get<SyncReliability>('/api/sync/status')).data;
}

export async function fetchSyncDownload(sinceVersion: number) {
  return (await api.get('/api/sync/download', { params: { sinceVersion } })).data;
}

export async function registerDevice(payload: { deviceIdentifier: string; userId: string; facilityId: string; deviceName?: string | null; platform?: string | null }) {
  return (await api.post('/api/devices/register', payload)).data;
}

export async function approveDevice(id: string) {
  await api.post(`/api/devices/${id}/approve`);
}
