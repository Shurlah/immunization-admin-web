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

export function setSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem('immunization-admin-session', JSON.stringify(session));
    api.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
  } else {
    localStorage.removeItem('immunization-admin-session');
    delete api.defaults.headers.common.Authorization;
  }
}

export function loadSession(): AuthSession | null {
  const raw = localStorage.getItem('immunization-admin-session');
  if (!raw) return null;
  const session = JSON.parse(raw) as AuthSession;
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
