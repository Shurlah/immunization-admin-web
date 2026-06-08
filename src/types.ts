export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
  facilityId?: string | null;
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type Facility = {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  ward?: string | null;
  lga: string;
  state: string;
  isActive: boolean;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  facilityId?: string | null;
  isActive: boolean;
};

export type Guardian = {
  id: string;
  fullName: string;
  phoneNumber: string;
  alternativePhoneNumber?: string | null;
  relationshipToChild?: string | null;
  address?: string | null;
  ward?: string | null;
};

export type Child = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  guardianId: string;
  guardian?: Guardian | null;
  facilityId: string;
  registrationSource: string;
  createdByUserId: string;
  isPossibleDuplicate: boolean;
};

export type Vaccine = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
};

export type VaccineSchedule = {
  id?: string;
  vaccineId?: string;
  doseName: string;
  recommendedAgeInWeeks: number;
  minimumAgeInWeeks?: number | null;
  maximumAgeInWeeks?: number | null;
  sequence: number;
  isActive?: boolean;
};

export type Appointment = {
  id: string;
  childId: string;
  vaccineId: string;
  doseName: string;
  facilityId: string;
  appointmentDate: string;
  status: string;
  completedAt?: string | null;
  missedAt?: string | null;
};

export type ImmunizationRecord = {
  id: string;
  childId: string;
  vaccineId: string;
  doseName: string;
  dateAdministered: string;
  facilityId: string;
  administeredByUserId: string;
  notes?: string | null;
  isCorrection: boolean;
};

export type SmsNotification = {
  id: string;
  phoneNumber: string;
  message: string;
  notificationType: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
};

export type AuditLog = {
  id: string;
  userId?: string | null;
  deviceId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type DashboardMetrics = {
  registeredChildren: number;
  completedImmunizations: number;
  missedAppointments: number;
};

export type SyncReliability = {
  total?: number;
  accepted?: number;
  processed?: number;
  failed: number;
  conflict?: number;
  conflicts?: number;
  latestServerVersion?: number;
};

export type SmsDelivery = {
  sent: number;
  delivered: number;
  failed: number;
};

export type FacilityPerformance = {
  facilityId: string;
  name: string;
  children: number;
  immunizations: number;
  missedAppointments: number;
};
