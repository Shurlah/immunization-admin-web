import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  Database,
  FileClock,
  LogOut,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Syringe,
  Users
} from 'lucide-react';
import {
  approveDevice,
  completeAppointment,
  createAppointment,
  createChild,
  createFacility,
  createGuardian,
  createSchedule,
  createUser,
  createVaccine,
  disableUser,
  disableVaccine,
  fetchAppointments,
  fetchAuditLogs,
  fetchChildren,
  fetchCoverage,
  fetchDuplicates,
  fetchFacilities,
  fetchFacilityPerformance,
  fetchMissedAppointments,
  fetchSmsDelivery,
  fetchSmsNotifications,
  fetchSyncDownload,
  fetchSyncReliability,
  fetchSyncStatus,
  fetchUsers,
  fetchVaccines,
  loadSession,
  login,
  logout,
  markAppointmentMissed,
  recordImmunization,
  registerDevice,
  roleOptions,
  setSession,
  sendTestSms,
  updateFacility,
  updateUser,
  updateVaccine
} from './api';
import type { Appointment, AuditLog, AuthSession, Child, DashboardMetrics, Facility, FacilityPerformance, SmsDelivery, SmsNotification, SyncReliability, User, Vaccine } from './types';
import './styles.css';

type ViewKey = 'dashboard' | 'users' | 'facilities' | 'children' | 'vaccines' | 'appointments' | 'reports' | 'sync' | 'sms' | 'audit' | 'devices';
type Notice = { tone: 'ok' | 'error'; text: string } | null;

const emptyFacility = { name: '', code: '', address: '', ward: '', lga: 'Alimosho', state: 'Lagos' };
const today = () => new Date().toISOString().slice(0, 10);

function App() {
  const [session, setLocalSession] = useState<AuthSession | null>(() => loadSession());
  const [view, setView] = useState<ViewKey>('dashboard');

  if (!session) return <LoginScreen onLogin={setLocalSession} />;

  async function signOut() {
    if (session) await logout(session.refreshToken).catch(() => setSession(null));
    setLocalSession(null);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AI</span>
          <div>
            <strong>Alimosho Immunization</strong>
            <small>{session.role}</small>
          </div>
        </div>
        <nav aria-label="Portal sections">
          <NavButton icon={<Activity />} active={view === 'dashboard'} onClick={() => setView('dashboard')} label="Dashboard" />
          <NavButton icon={<Users />} active={view === 'users'} onClick={() => setView('users')} label="Users" />
          <NavButton icon={<Building2 />} active={view === 'facilities'} onClick={() => setView('facilities')} label="Facilities" />
          <NavButton icon={<Users />} active={view === 'children'} onClick={() => setView('children')} label="Children" />
          <NavButton icon={<Syringe />} active={view === 'vaccines'} onClick={() => setView('vaccines')} label="Vaccines" />
          <NavButton icon={<CalendarDays />} active={view === 'appointments'} onClick={() => setView('appointments')} label="Appointments" />
          <NavButton icon={<FileClock />} active={view === 'reports'} onClick={() => setView('reports')} label="Reports" />
          <NavButton icon={<Database />} active={view === 'sync'} onClick={() => setView('sync')} label="Sync" />
          <NavButton icon={<Bell />} active={view === 'sms'} onClick={() => setView('sms')} label="SMS" />
          <NavButton icon={<ShieldCheck />} active={view === 'audit'} onClick={() => setView('audit')} label="Audit" />
          <NavButton icon={<Smartphone />} active={view === 'devices'} onClick={() => setView('devices')} label="Devices" />
        </nav>
        <button className="logout" onClick={signOut}><LogOut size={18} /> Sign out</button>
      </aside>
      <section className="content">
        {view === 'dashboard' && <Dashboard />}
        {view === 'users' && <UsersView />}
        {view === 'facilities' && <FacilitiesView />}
        {view === 'children' && <ChildrenView session={session} />}
        {view === 'vaccines' && <VaccinesView />}
        {view === 'appointments' && <AppointmentsView session={session} />}
        {view === 'reports' && <ReportsView />}
        {view === 'sync' && <SyncView />}
        {view === 'sms' && <SmsView />}
        {view === 'audit' && <AuditView />}
        {view === 'devices' && <DevicesView />}
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: AuthSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      onLogin(await login(email, password));
    } catch {
      setError('Login failed. Use a valid backend user account.');
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <span className="eyebrow">Secure Health Records</span>
        <h1>Alimosho Immunization Admin</h1>
        <p>Manage facilities, staff access, child records, immunization activity, reminders, sync health, and audit evidence.</p>
        <form onSubmit={submit}>
          <label>Email<input value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {error && <strong className="form-error">{error}</strong>}
          <button type="submit">Open dashboard</button>
        </form>
      </section>
    </main>
  );
}

function Dashboard() {
  const [coverage, setCoverage] = useState<DashboardMetrics | null>(null);
  const [sms, setSms] = useState<SmsDelivery | null>(null);
  const [sync, setSync] = useState<SyncReliability | null>(null);
  const [performance, setPerformance] = useState<FacilityPerformance[]>([]);

  useEffect(() => {
    void Promise.all([fetchCoverage(), fetchSmsDelivery(), fetchSyncReliability(), fetchFacilityPerformance()])
      .then(([coverageData, smsData, syncData, facilityData]) => {
        setCoverage(coverageData);
        setSms(smsData);
        setSync(syncData);
        setPerformance(facilityData);
      });
  }, []);

  return (
    <>
      <Header title="Operations Dashboard" subtitle="Current immunization activity across facilities" />
      <div className="metric-grid">
        <Metric icon={<Users />} label="Registered children" value={coverage?.registeredChildren ?? 0} />
        <Metric icon={<ShieldCheck />} label="Immunizations" value={coverage?.completedImmunizations ?? 0} />
        <Metric icon={<Bell />} label="Missed appointments" value={coverage?.missedAppointments ?? 0} tone="alert" />
        <Metric icon={<Database />} label="Processed sync items" value={sync?.processed ?? sync?.accepted ?? 0} />
        <Metric icon={<Send />} label="SMS sent" value={sms?.sent ?? 0} />
        <Metric icon={<Activity />} label="Sync failures" value={sync?.failed ?? 0} tone="alert" />
      </div>
      <DataTable title="Facility performance" columns={['Facility', 'Children', 'Immunizations', 'Missed']} rows={performance.map(row => [row.name, row.children, row.immunizations, row.missedAppointments])} />
    </>
  );
}

function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '', roleId: roleOptions[0].id, facilityId: '' });

  async function load() {
    const [userData, facilityData] = await Promise.all([fetchUsers(), fetchFacilities()]);
    setUsers(userData);
    setFacilities(facilityData);
  }
  useEffect(() => { void load(); }, []);

  function edit(user: User) {
    const role = roleOptions.find(item => item.name === user.role);
    setEditing(user);
    setForm({ fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber ?? '', password: '', roleId: role?.id ?? roleOptions[0].id, facilityId: user.facilityId ?? '' });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editing) await updateUser(editing.id, { fullName: form.fullName, phoneNumber: clean(form.phoneNumber), roleId: form.roleId, facilityId: clean(form.facilityId) });
      else await createUser({ ...form, phoneNumber: clean(form.phoneNumber), facilityId: clean(form.facilityId) });
      setNotice({ tone: 'ok', text: editing ? 'User updated.' : 'User created.' });
      setEditing(null);
      setForm({ fullName: '', email: '', phoneNumber: '', password: '', roleId: roleOptions[0].id, facilityId: '' });
      await load();
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }

  const filtered = useMemo(() => users.filter(user => `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())), [query, users]);
  return (
    <>
      <Header title="User Management" subtitle="Create accounts, assign roles, and disable access" />
      <NoticeBox notice={notice} />
      <Workspace>
        <form className="panel-form" onSubmit={submit}>
          <h2>{editing ? 'Update user' : 'Create user'}</h2>
          <label>Name<input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></label>
          <label>Email<input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editing} required /></label>
          {!editing && <label>Password<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>}
          <label>Phone<input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></label>
          <label>Role<select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>{roleOptions.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <label>Facility<select value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })}><option value="">None</option>{facilities.map(facility => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
          <button><Plus size={16} />{editing ? 'Save changes' : 'Create user'}</button>
          {editing && <button type="button" className="secondary" onClick={() => setEditing(null)}>Cancel edit</button>}
        </form>
        <section>
          <SearchBox value={query} onChange={setQuery} />
          <DataTable columns={['Name', 'Email', 'Role', 'Status', 'Actions']} rows={filtered.map(user => [user.fullName, user.email, user.role, status(user.isActive ? 'Active' : 'Disabled'), <RowActions><button onClick={() => edit(user)}>Edit</button><button onClick={() => void disableUser(user.id).then(load)}>Disable</button></RowActions>])} />
        </section>
      </Workspace>
    </>
  );
}

function FacilitiesView() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Facility | null>(null);
  const [form, setForm] = useState(emptyFacility);
  const [notice, setNotice] = useState<Notice>(null);
  const load = async () => setFacilities(await fetchFacilities());
  useEffect(() => { void load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editing) await updateFacility(editing.id, form);
      else await createFacility(form);
      setNotice({ tone: 'ok', text: editing ? 'Facility updated.' : 'Facility created.' });
      setEditing(null);
      setForm(emptyFacility);
      await load();
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }

  const filtered = facilities.filter(facility => `${facility.name} ${facility.code} ${facility.ward ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <Header title="Facilities" subtitle="Maintain primary health centre records" />
      <NoticeBox notice={notice} />
      <Workspace>
        <form className="panel-form" onSubmit={submit}>
          <h2>{editing ? 'Update facility' : 'Create facility'}</h2>
          <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Code<input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></label>
          <label>Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label>Ward<input value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} /></label>
          <label>LGA<input value={form.lga} onChange={e => setForm({ ...form, lga: e.target.value })} required /></label>
          <label>State<input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required /></label>
          <button><Plus size={16} />{editing ? 'Save changes' : 'Create facility'}</button>
        </form>
        <section>
          <SearchBox value={query} onChange={setQuery} />
          <DataTable columns={['Name', 'Code', 'Ward', 'LGA', 'Status', 'Actions']} rows={filtered.map(facility => [facility.name, facility.code, facility.ward ?? '-', facility.lga, status(facility.isActive ? 'Active' : 'Inactive'), <button onClick={() => { setEditing(facility); setForm({ name: facility.name, code: facility.code, address: facility.address ?? '', ward: facility.ward ?? '', lga: facility.lga, state: facility.state }); }}>Edit</button>])} />
        </section>
      </Workspace>
    </>
  );
}

function ChildrenView({ session }: { session: AuthSession }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [duplicates, setDuplicates] = useState<Child[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [query, setQuery] = useState('');
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [guardian, setGuardian] = useState({ fullName: '', phoneNumber: '', relationshipToChild: '', address: '', ward: '' });
  const [child, setChild] = useState({ firstName: '', middleName: '', lastName: '', dateOfBirth: today(), sex: 'Female', facilityId: session.facilityId ?? '' });

  async function load() {
    const [childData, duplicateData, facilityData] = await Promise.all([fetchChildren(), fetchDuplicates(), fetchFacilities()]);
    setChildren(childData);
    setDuplicates(duplicateData);
    setFacilities(facilityData);
  }
  useEffect(() => { void load(); }, []);

  async function search() {
    setChildren(await fetchChildren({ q: clean(query) ?? undefined, phone: clean(phone) ?? undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const savedGuardian = await createGuardian({ ...guardian, alternativePhoneNumber: null });
      await createChild({ ...child, guardianId: savedGuardian.id, createdByUserId: session.userId, createdByDeviceId: null, middleName: clean(child.middleName) });
      setNotice({ tone: 'ok', text: 'Child and caregiver registered.' });
      setGuardian({ fullName: '', phoneNumber: '', relationshipToChild: '', address: '', ward: '' });
      setChild({ firstName: '', middleName: '', lastName: '', dateOfBirth: today(), sex: 'Female', facilityId: session.facilityId ?? '' });
      await load();
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }

  return (
    <>
      <Header title="Children" subtitle="Register, search, and review duplicate flags" />
      <NoticeBox notice={notice} />
      <Workspace>
        <form className="panel-form" onSubmit={submit}>
          <h2>Register child</h2>
          <label>Caregiver name<input value={guardian.fullName} onChange={e => setGuardian({ ...guardian, fullName: e.target.value })} required /></label>
          <label>Caregiver phone<input value={guardian.phoneNumber} onChange={e => setGuardian({ ...guardian, phoneNumber: e.target.value })} required /></label>
          <label>Relationship<input value={guardian.relationshipToChild} onChange={e => setGuardian({ ...guardian, relationshipToChild: e.target.value })} /></label>
          <label>Child first name<input value={child.firstName} onChange={e => setChild({ ...child, firstName: e.target.value })} required /></label>
          <label>Middle name<input value={child.middleName} onChange={e => setChild({ ...child, middleName: e.target.value })} /></label>
          <label>Last name<input value={child.lastName} onChange={e => setChild({ ...child, lastName: e.target.value })} required /></label>
          <label>Date of birth<input type="date" value={child.dateOfBirth} onChange={e => setChild({ ...child, dateOfBirth: e.target.value })} required /></label>
          <label>Sex<select value={child.sex} onChange={e => setChild({ ...child, sex: e.target.value })}><option>Female</option><option>Male</option></select></label>
          <label>Facility<select value={child.facilityId} onChange={e => setChild({ ...child, facilityId: e.target.value })} required><option value="">Select facility</option>{facilities.map(facility => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
          <button><Plus size={16} />Register child</button>
        </form>
        <section>
          <div className="filters"><SearchBox value={query} onChange={setQuery} placeholder="Search child name" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Caregiver phone" /><button onClick={() => void search()}><Search size={16} />Search</button></div>
          <DataTable columns={['Child', 'DOB', 'Sex', 'Caregiver', 'Duplicate']} rows={children.map(item => [`${item.firstName} ${item.lastName}`, item.dateOfBirth, item.sex, item.guardian?.phoneNumber ?? item.guardianId, item.isPossibleDuplicate ? status('Possible') : 'No'])} />
          <DataTable title="Duplicate review queue" columns={['Child', 'Caregiver', 'Facility']} rows={duplicates.map(item => [`${item.firstName} ${item.lastName}`, item.guardian?.phoneNumber ?? '-', item.facilityId])} />
        </section>
      </Workspace>
    </>
  );
}

function VaccinesView() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [editing, setEditing] = useState<Vaccine | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [schedule, setSchedule] = useState({ vaccineId: '', doseName: '', recommendedAgeInWeeks: 0, minimumAgeInWeeks: '', maximumAgeInWeeks: '', sequence: 1 });
  const load = async () => setVaccines(await fetchVaccines());
  useEffect(() => { void load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editing) await updateVaccine(editing.id, form);
      else await createVaccine(form);
      setNotice({ tone: 'ok', text: editing ? 'Vaccine updated.' : 'Vaccine created.' });
      setEditing(null);
      setForm({ name: '', code: '', description: '' });
      await load();
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }

  async function addSchedule(event: React.FormEvent) {
    event.preventDefault();
    await createSchedule(schedule.vaccineId, { doseName: schedule.doseName, recommendedAgeInWeeks: Number(schedule.recommendedAgeInWeeks), minimumAgeInWeeks: numberOrNull(schedule.minimumAgeInWeeks), maximumAgeInWeeks: numberOrNull(schedule.maximumAgeInWeeks), sequence: Number(schedule.sequence), isActive: true });
    setNotice({ tone: 'ok', text: 'Schedule added for sync download.' });
  }

  return (
    <>
      <Header title="Vaccines" subtitle="Maintain vaccine records and dose schedules" />
      <NoticeBox notice={notice} />
      <Workspace>
        <div className="stack">
          <form className="panel-form" onSubmit={submit}>
            <h2>{editing ? 'Update vaccine' : 'Create vaccine'}</h2>
            <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Code<input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></label>
            <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
            <button><Plus size={16} />{editing ? 'Save vaccine' : 'Create vaccine'}</button>
          </form>
          <form className="panel-form" onSubmit={addSchedule}>
            <h2>Add schedule</h2>
            <label>Vaccine<select value={schedule.vaccineId} onChange={e => setSchedule({ ...schedule, vaccineId: e.target.value })} required><option value="">Select vaccine</option>{vaccines.map(vaccine => <option key={vaccine.id} value={vaccine.id}>{vaccine.name}</option>)}</select></label>
            <label>Dose<input value={schedule.doseName} onChange={e => setSchedule({ ...schedule, doseName: e.target.value })} required /></label>
            <label>Recommended age weeks<input type="number" value={schedule.recommendedAgeInWeeks} onChange={e => setSchedule({ ...schedule, recommendedAgeInWeeks: Number(e.target.value) })} required /></label>
            <label>Minimum age weeks<input type="number" value={schedule.minimumAgeInWeeks} onChange={e => setSchedule({ ...schedule, minimumAgeInWeeks: e.target.value })} /></label>
            <label>Maximum age weeks<input type="number" value={schedule.maximumAgeInWeeks} onChange={e => setSchedule({ ...schedule, maximumAgeInWeeks: e.target.value })} /></label>
            <label>Sequence<input type="number" value={schedule.sequence} onChange={e => setSchedule({ ...schedule, sequence: Number(e.target.value) })} required /></label>
            <button><Plus size={16} />Add schedule</button>
          </form>
        </div>
        <DataTable columns={['Name', 'Code', 'Description', 'Actions']} rows={vaccines.map(vaccine => [vaccine.name, vaccine.code, vaccine.description ?? '-', <RowActions><button onClick={() => { setEditing(vaccine); setForm({ name: vaccine.name, code: vaccine.code, description: vaccine.description ?? '' }); }}>Edit</button><button onClick={() => void disableVaccine(vaccine.id).then(load)}>Disable</button></RowActions>])} />
      </Workspace>
    </>
  );
}

function AppointmentsView({ session }: { session: AuthSession }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ childId: '', vaccineId: '', doseName: '', facilityId: session.facilityId ?? '', appointmentDate: today() });
  const [immunization, setImmunization] = useState({ childId: '', vaccineId: '', doseName: '', facilityId: session.facilityId ?? '', dateAdministered: today(), notes: '' });

  async function load() {
    const [appointmentData, childData, vaccineData, facilityData] = await Promise.all([fetchAppointments(), fetchChildren(), fetchVaccines(), fetchFacilities()]);
    setAppointments(appointmentData);
    setChildren(childData);
    setVaccines(vaccineData);
    setFacilities(facilityData);
  }
  useEffect(() => { void load(); }, []);

  async function addAppointment(event: React.FormEvent) {
    event.preventDefault();
    await createAppointment(form);
    setNotice({ tone: 'ok', text: 'Appointment created and reminder scheduled when caregiver data exists.' });
    await load();
  }

  async function addImmunization(event: React.FormEvent) {
    event.preventDefault();
    await recordImmunization({ ...immunization, administeredByUserId: session.userId, createdByDeviceId: null, notes: clean(immunization.notes) });
    setNotice({ tone: 'ok', text: 'Immunization recorded.' });
    await load();
  }

  return (
    <>
      <Header title="Appointments" subtitle="Schedule visits, mark outcomes, and record vaccinations" />
      <NoticeBox notice={notice} />
      <Workspace>
        <div className="stack">
          <RecordForm title="Create appointment" data={form} setData={setForm} children={children} vaccines={vaccines} facilities={facilities} dateKey="appointmentDate" onSubmit={addAppointment} submit="Schedule" />
          <RecordForm title="Record immunization" data={immunization} setData={setImmunization} children={children} vaccines={vaccines} facilities={facilities} dateKey="dateAdministered" onSubmit={addImmunization} submit="Record" includeNotes />
        </div>
        <DataTable columns={['Date', 'Child', 'Dose', 'Status', 'Actions']} rows={appointments.map(item => [item.appointmentDate, childName(children, item.childId), item.doseName, status(item.status), <RowActions><button onClick={() => void completeAppointment(item.id).then(load)}>Complete</button><button onClick={() => void markAppointmentMissed(item.id).then(load)}>Missed</button></RowActions>])} />
      </Workspace>
    </>
  );
}

function ReportsView() {
  const [coverage, setCoverage] = useState<DashboardMetrics | null>(null);
  const [missed, setMissed] = useState<Appointment[]>([]);
  const [sms, setSms] = useState<SmsDelivery | null>(null);
  const [sync, setSync] = useState<SyncReliability | null>(null);
  const [performance, setPerformance] = useState<FacilityPerformance[]>([]);
  useEffect(() => {
    void Promise.all([fetchCoverage(), fetchMissedAppointments(), fetchSmsDelivery(), fetchSyncReliability(), fetchFacilityPerformance()])
      .then(([a, b, c, d, e]) => { setCoverage(a); setMissed(b); setSms(c); setSync(d); setPerformance(e); });
  }, []);
  return (
    <>
      <Header title="Reports" subtitle="Coverage, missed appointments, SMS delivery, sync reliability, and facility performance" />
      <div className="metric-grid">
        <Metric icon={<Users />} label="Children" value={coverage?.registeredChildren ?? 0} />
        <Metric icon={<Bell />} label="Missed appointments" value={missed.length} tone="alert" />
        <Metric icon={<Send />} label="SMS delivered" value={sms?.delivered ?? 0} />
        <Metric icon={<Database />} label="Latest server version" value={sync?.latestServerVersion ?? 0} />
      </div>
      <DataTable title="Missed appointments" columns={['Date', 'Child ID', 'Dose', 'Facility']} rows={missed.map(item => [item.appointmentDate, item.childId, item.doseName, item.facilityId])} />
      <DataTable title="Facility performance" columns={['Facility', 'Children', 'Immunizations', 'Missed']} rows={performance.map(item => [item.name, item.children, item.immunizations, item.missedAppointments])} />
    </>
  );
}

function SyncView() {
  const [statusData, setStatusData] = useState<SyncReliability | null>(null);
  const [sinceVersion, setSinceVersion] = useState(0);
  const [download, setDownload] = useState<any>(null);
  useEffect(() => { void fetchSyncStatus().then(setStatusData); }, []);
  return (
    <>
      <Header title="Sync Monitor" subtitle="Inspect offline upload health and server change download" />
      <div className="metric-grid">
        <Metric icon={<Database />} label="Processed" value={statusData?.processed ?? 0} />
        <Metric icon={<Activity />} label="Conflicts" value={statusData?.conflicts ?? statusData?.conflict ?? 0} tone="alert" />
        <Metric icon={<Activity />} label="Failed" value={statusData?.failed ?? 0} tone="alert" />
        <Metric icon={<FileClock />} label="Server version" value={statusData?.latestServerVersion ?? 0} />
      </div>
      <section className="work-panel inline-tools">
        <label>Since version<input type="number" value={sinceVersion} onChange={e => setSinceVersion(Number(e.target.value))} /></label>
        <button onClick={() => void fetchSyncDownload(sinceVersion).then(setDownload)}><Database size={16} />Download changes</button>
      </section>
      {download && <pre className="json-view">{JSON.stringify(download, null, 2)}</pre>}
    </>
  );
}

function SmsView() {
  const [items, setItems] = useState<SmsNotification[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ phoneNumber: '', message: '' });
  const load = async () => setItems(await fetchSmsNotifications());
  useEffect(() => { void load(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await sendTestSms(form);
      setNotice({ tone: 'ok', text: 'Test SMS request submitted to backend sender.' });
      setForm({ phoneNumber: '', message: '' });
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }
  return (
    <>
      <Header title="SMS Notifications" subtitle="Review reminder delivery and send test messages" />
      <NoticeBox notice={notice} />
      <Workspace>
        <form className="panel-form" onSubmit={submit}>
          <h2>Send test SMS</h2>
          <label>Phone<input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} required /></label>
          <label>Message<textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required /></label>
          <button><Send size={16} />Send test</button>
        </form>
        <DataTable columns={['Type', 'Phone', 'Status', 'Scheduled', 'Failure']} rows={items.map(item => [item.notificationType, item.phoneNumber, status(item.status), formatDateTime(item.scheduledAt), item.failureReason ?? '-'])} />
      </Workspace>
    </>
  );
}

function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({ action: '', entityType: '', from: '', to: '' });
  async function load() { setLogs(await fetchAuditLogs({ action: clean(filters.action) ?? undefined, entityType: clean(filters.entityType) ?? undefined, from: clean(filters.from) ?? undefined, to: clean(filters.to) ?? undefined })); }
  useEffect(() => { void load(); }, []);
  return (
    <>
      <Header title="Audit Logs" subtitle="Filter read-only evidence for sensitive workflows" />
      <section className="work-panel filters">
        <input placeholder="Action" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} />
        <input placeholder="Entity type" value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value })} />
        <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
        <button onClick={() => void load()}><Search size={16} />Filter</button>
      </section>
      <DataTable columns={['Time', 'Action', 'Entity', 'Entity ID', 'User']} rows={logs.map(log => [formatDateTime(log.createdAt), log.action, log.entityType, log.entityId ?? '-', log.userId ?? '-'])} />
    </>
  );
}

function DevicesView() {
  const [notice, setNotice] = useState<Notice>(null);
  const [registration, setRegistration] = useState({ deviceIdentifier: '', userId: '', facilityId: '', deviceName: '', platform: 'Android' });
  const [approveId, setApproveId] = useState('');
  async function submitRegistration(event: React.FormEvent) {
    event.preventDefault();
    try {
      const device = await registerDevice({ ...registration, deviceName: clean(registration.deviceName), platform: clean(registration.platform) });
      setNotice({ tone: 'ok', text: `Device registered: ${device.id}` });
    } catch (error) {
      setNotice({ tone: 'error', text: messageFrom(error) });
    }
  }
  async function submitApproval(event: React.FormEvent) {
    event.preventDefault();
    await approveDevice(approveId);
    setNotice({ tone: 'ok', text: 'Device approved.' });
  }
  return (
    <>
      <Header title="Devices" subtitle="Register mobile devices and approve known device IDs" />
      <NoticeBox notice={notice} />
      <Workspace>
        <form className="panel-form" onSubmit={submitRegistration}>
          <h2>Register device</h2>
          <label>Device identifier<input value={registration.deviceIdentifier} onChange={e => setRegistration({ ...registration, deviceIdentifier: e.target.value })} required /></label>
          <label>User ID<input value={registration.userId} onChange={e => setRegistration({ ...registration, userId: e.target.value })} required /></label>
          <label>Facility ID<input value={registration.facilityId} onChange={e => setRegistration({ ...registration, facilityId: e.target.value })} required /></label>
          <label>Device name<input value={registration.deviceName} onChange={e => setRegistration({ ...registration, deviceName: e.target.value })} /></label>
          <label>Platform<input value={registration.platform} onChange={e => setRegistration({ ...registration, platform: e.target.value })} /></label>
          <button><Smartphone size={16} />Register</button>
        </form>
        <form className="panel-form" onSubmit={submitApproval}>
          <h2>Approve device</h2>
          <p className="muted">The backend has an approval endpoint but no device list endpoint, so approval requires a known device ID.</p>
          <label>Device ID<input value={approveId} onChange={e => setApproveId(e.target.value)} required /></label>
          <button><ShieldCheck size={16} />Approve</button>
        </form>
      </Workspace>
    </>
  );
}

function RecordForm({ title, data, setData, children, vaccines, facilities, dateKey, onSubmit, submit, includeNotes }: any) {
  return (
    <form className="panel-form" onSubmit={onSubmit}>
      <h2>{title}</h2>
      <label>Child<select value={data.childId} onChange={e => setData({ ...data, childId: e.target.value })} required><option value="">Select child</option>{children.map((child: Child) => <option key={child.id} value={child.id}>{childName(children, child.id)}</option>)}</select></label>
      <label>Vaccine<select value={data.vaccineId} onChange={e => setData({ ...data, vaccineId: e.target.value })} required><option value="">Select vaccine</option>{vaccines.map((vaccine: Vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.name}</option>)}</select></label>
      <label>Dose<input value={data.doseName} onChange={e => setData({ ...data, doseName: e.target.value })} required /></label>
      <label>Facility<select value={data.facilityId} onChange={e => setData({ ...data, facilityId: e.target.value })} required><option value="">Select facility</option>{facilities.map((facility: Facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
      <label>Date<input type="date" value={data[dateKey]} onChange={e => setData({ ...data, [dateKey]: e.target.value })} required /></label>
      {includeNotes && <label>Notes<textarea value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} /></label>}
      <button><Plus size={16} />{submit}</button>
    </form>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <header><div><h1>{title}</h1><p>{subtitle}</p></div><span className="status-pill">Live API</span></header>;
}

function Workspace({ children }: { children: React.ReactNode }) {
  return <div className="workspace">{children}</div>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'alert' }) {
  return <article className={`metric ${tone ?? ''}`}><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function DataTable({ title, columns, rows }: { title?: string; columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <section className="table-section">
      {title && <h2>{title}</h2>}
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length}>No records found.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}

function SearchBox({ value, onChange, placeholder = 'Search records' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search"><Search size={18} /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function NoticeBox({ notice }: { notice: Notice }) {
  return notice ? <div className={`notice ${notice.tone}`}>{notice.text}</div> : null;
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}{label}</button>;
}

function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="row-actions">{children}</div>;
}

function status(value: string) {
  return <span className={`status ${value.toLowerCase()}`}>{value}</span>;
}

function clean(value?: string | null) {
  return value && value.trim() ? value.trim() : null;
}

function numberOrNull(value: string) {
  return value === '' ? null : Number(value);
}

function childName(children: Child[], id: string) {
  const child = children.find(item => item.id === id);
  return child ? `${child.firstName} ${child.lastName}` : id;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function messageFrom(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Request failed.';
  }
  return 'Request failed.';
}

createRoot(document.getElementById('root')!).render(<App />);
