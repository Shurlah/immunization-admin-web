// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppointmentsView } from '../src/main';
import * as api from '../src/api';

vi.mock('../src/api', () => ({
  fetchAppointments: vi.fn(), fetchChildren: vi.fn(), fetchVaccines: vi.fn(), fetchFacilities: vi.fn(),
  fetchChildImmunizations: vi.fn(), fetchDueVaccines: vi.fn(), recordImmunization: vi.fn()
}));

const session = { accessToken: 'test', refreshToken: 'test', userId: 'worker', role: 'HealthWorker', facilityId: 'clinic' };
const appointment = { id: 'selected-appointment', childId: 'child', vaccineId: 'vaccine', doseName: 'Dose 2', facilityId: 'clinic', appointmentDate: '2026-10-01', status: 'Scheduled' };

beforeEach(() => {
  vi.mocked(api.fetchAppointments).mockResolvedValue([appointment]);
  vi.mocked(api.fetchChildren).mockResolvedValue([{ id: 'child', firstName: 'Ada', lastName: 'Test', dateOfBirth: '2026-08-01', sex: 'Female', guardianId: 'guardian', facilityId: 'clinic', createdByUserId: 'worker' }]);
  vi.mocked(api.fetchVaccines).mockResolvedValue([{ id: 'vaccine', name: 'Test vaccine', code: 'T', isActive: true }]);
  vi.mocked(api.fetchFacilities).mockResolvedValue([{ id: 'clinic', name: 'Test clinic', code: 'T', lga: 'Test', state: 'Lagos', isActive: true }]);
  vi.mocked(api.fetchChildImmunizations).mockResolvedValue([]);
  vi.mocked(api.fetchDueVaccines).mockResolvedValue([]);
  vi.mocked(api.recordImmunization).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Appointment recording', () => {
  it('shows vaccine in Status and opens the exact appointment with preselected values', async () => {
    render(<AppointmentsView session={session} initialSection="status" onSectionChange={vi.fn()} />);
    expect(await screen.findByRole('columnheader', { name: 'Vaccine' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /Record immunization for Ada Test/ }));
    expect((screen.getByLabelText('Child') as HTMLSelectElement).value).toBe('child');
    expect((screen.getByLabelText('Vaccine') as HTMLSelectElement).value).toBe('vaccine');
    expect((screen.getByLabelText('Dose') as HTMLInputElement).value).toBe('Dose 2');
    expect((screen.getByLabelText('Facility') as HTMLSelectElement).value).toBe('clinic');
    expect((screen.getByLabelText('Child') as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByRole('columnheader', { name: 'Vaccine' })).toBeTruthy();
    expect(api.recordImmunization).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-09' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record', exact: true }));
    await waitFor(() => expect(api.recordImmunization).toHaveBeenCalledWith(expect.objectContaining({
      appointmentId: 'selected-appointment', childId: 'child', vaccineId: 'vaccine', doseName: 'Dose 2', facilityId: 'clinic', dateAdministered: '2026-09-09'
    })));
  });

  it('allows leaving the selected appointment to enter another immunization', async () => {
    render(<AppointmentsView session={session} initialSection="status" onSectionChange={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Record immunization for Ada Test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter a different immunization' }));
    expect((screen.getByLabelText('Child') as HTMLSelectElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Record', exact: true }));
    await waitFor(() => expect(api.recordImmunization).toHaveBeenCalledWith(expect.objectContaining({ appointmentId: null })));
  });
});
