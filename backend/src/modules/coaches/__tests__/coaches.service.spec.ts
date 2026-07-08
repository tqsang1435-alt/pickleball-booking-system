// coaches.service.spec.ts — Full test suite (NOT READY FOR MIGRATION)
// Run: npm test -- --runInBand --verbose

import { validateTimeRange } from '../coaches.validation';
import { calcBookingBlockedHours, checkBufferConflict } from '../coaches.buffer';

jest.mock('@/constants/system', () => ({
  SYSTEM_CONFIG: { OPENING_HOUR: 5, CLOSING_HOUR: 23 }
}));

jest.mock('../coaches.repository', () => ({
  findCoachByUserId: jest.fn().mockResolvedValue({ CoachID: 1, Status: 'Approved' }),
  findCoachSchedules: jest.fn().mockResolvedValue([]),
  findActiveBookedScheduleIds: jest.fn().mockResolvedValue([]),
  checkScheduleOverlap: jest.fn().mockResolvedValue(false),
  createCoachSchedulesTransaction: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/modules/bookings/bookings.repository', () => ({
  findBookingsByCoachUserId: jest.fn().mockResolvedValue([])
}));

// Mock coaches.buffer to spy but keep real implementation
jest.mock('../coaches.buffer', () => {
  const real = jest.requireActual('../coaches.buffer');
  return {
    ...real,
    calcBookingBlockedHours: jest.fn((...args) => real.calcBookingBlockedHours(...args)),
    checkBufferConflict: jest.fn((...args) => real.checkBufferConflict(...args)),
  };
});

import { getScheduleOptions, createMySchedule } from '../coaches.service';
import * as coachRepo from '../coaches.repository';

const getBookingsMock = () =>
  require('@/modules/bookings/bookings.repository').findBookingsByCoachUserId as jest.Mock;

// ══════════════════════════════════════════════════════════════════════
// SECTION 1 — validateTimeRange boundary (05:00–23:00)
// ══════════════════════════════════════════════════════════════════════

describe('Section 1 — validateTimeRange boundary (05:00–23:00)', () => {
  it('TC-1: 05:00–06:00 hợp lệ (slot đầu tiên)', () => {
    expect(() => validateTimeRange('05:00', '06:00')).not.toThrow();
  });
  it('TC-2: 22:00–23:00 hợp lệ (slot cuối cùng)', () => {
    expect(() => validateTimeRange('22:00', '23:00')).not.toThrow();
  });
  it('TC-3: 23:00–24:00 bị reject (EndTime > 23)', () => {
    expect(() => validateTimeRange('23:00', '24:00')).toThrow();
  });
  it('TC-4: 04:00–05:00 bị reject (StartTime < 05:00)', () => {
    expect(() => validateTimeRange('04:00', '05:00')).toThrow();
  });
  it('TC-5: 22:00–00:00 bị reject (xuyên ngày)', () => {
    expect(() => validateTimeRange('22:00', '00:00')).toThrow();
  });
  it('TC-6: 23:00–23:00 bị reject (StartTime === EndTime)', () => {
    expect(() => validateTimeRange('23:00', '23:00')).toThrow();
  });
  it('TC-7: 22:30–23:00 bị reject (phút ≠ 00)', () => {
    expect(() => validateTimeRange('22:30', '23:00')).toThrow();
  });
  it('TC-8: 22:00–23:30 bị reject (phút ≠ 00)', () => {
    expect(() => validateTimeRange('22:00', '23:30')).toThrow();
  });
  it('TC-9: validateTimeRange không kiểm tra giờ hiện tại (handled by validateStartTimeInFuture)', () => {
    expect(() => validateTimeRange('17:00', '18:00')).not.toThrow();
  });
  it('TC-10: 18:00–19:00 hợp lệ', () => {
    expect(() => validateTimeRange('18:00', '19:00')).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 2 — getScheduleOptions startTimes range
// ══════════════════════════════════════════════════════════════════════

describe('Section 2 — getScheduleOptions startTimes (05:00–22:00)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([]);
    getBookingsMock().mockResolvedValue([]);
  });

  it('TC-11: startTimes[0] = "05:00"', async () => {
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes[0]).toBe('05:00');
  });
  it('TC-12: startTimes cuối = "22:00"', async () => {
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes[r.startTimes.length - 1]).toBe('22:00');
  });
  it('TC-13: "23:00" KHÔNG xuất hiện trong startTimes', async () => {
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).not.toContain('23:00');
  });
  it('TC-14: có đủ 18 startTimes (05–22)', async () => {
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes.length).toBe(18);
  });
  it('TC-15: hôm nay lúc 17:30 → startTimes[0] = "18:00"', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-06T17:30:00+07:00'));
    const r = await getScheduleOptions(1, '2026-07-06');
    expect(r.startTimes[0]).toBe('18:00');
    jest.useRealTimers();
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 3 — Legacy long-schedule overlap
// ══════════════════════════════════════════════════════════════════════

describe('Section 3 — Legacy long-schedule overlap handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBookingsMock().mockResolvedValue([]);
  });

  it('TC-16: Legacy 08:00–13:00 → occupiedHours ⊇ {8,9,10,11,12}', async () => {
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([
      { CoachScheduleID: 1, WorkingDate: '2030-01-01', StartTime: '08:00', EndTime: '13:00', Status: 'Available' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.occupiedHours).toEqual(expect.arrayContaining([8, 9, 10, 11, 12]));
  });
  it('TC-17: Legacy 08:00–13:00 → startTimes không chứa 08:00–12:00', async () => {
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([
      { CoachScheduleID: 1, WorkingDate: '2030-01-01', StartTime: '08:00', EndTime: '13:00', Status: 'Available' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    ['08:00','09:00','10:00','11:00','12:00'].forEach(t => expect(r.startTimes).not.toContain(t));
  });
  it('TC-18: Legacy 08:00–13:00 → 13:00 hợp lệ', async () => {
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([
      { CoachScheduleID: 1, WorkingDate: '2030-01-01', StartTime: '08:00', EndTime: '13:00', Status: 'Available' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).toContain('13:00');
  });
  it('TC-19: 08:00–09:00 và 09:00–10:00 KHÔNG overlap (half-open)', () => {
    expect((8 < 10) && (9 < 9)).toBe(false);
  });
  it('TC-20: 08:00–10:00 và 09:00–11:00 overlap (half-open)', () => {
    expect((8 < 11) && (9 < 10)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 4 — Shared Buffer Helper (coaches.buffer.ts)
// ══════════════════════════════════════════════════════════════════════

describe('Section 4 — coaches.buffer.ts: calcBookingBlockedHours & checkBufferConflict', () => {
  const date = '2030-01-01';

  it('TC-BUF-H1: Booking Confirmed 08:00–09:00 → occupied={8}, bufferAfter={9}, bufferBefore={7}', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.occupiedHours.has(8)).toBe(true);
    expect(r.bufferHours.has(9)).toBe(true);   // buffer after
    expect(r.bufferHours.has(7)).toBe(true);   // buffer before
    expect(r.blockedHours.has(9)).toBe(true);
    expect(r.blockedHours.has(7)).toBe(true);
  });

  it('TC-BUF-H2: Booking 08:00–10:00 (multi-slot) → occupied={8,9}, buffer={10,7}', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '10:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.occupiedHours.has(8)).toBe(true);
    expect(r.occupiedHours.has(9)).toBe(true);  // occupied (không phải buffer nội bộ)
    expect(r.bufferHours.has(10)).toBe(true);
    expect(r.bufferHours.has(7)).toBe(true);
  });

  it('TC-BUF-H3: Booking Cancelled → không block gì', () => {
    const bookings = [{ Status: 'Cancelled', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.blockedHours.size).toBe(0);
  });

  it('TC-BUF-H4: checkBufferConflict 09:00–10:00 với booking 08:00–09:00 → có lỗi buffer', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const err = checkBufferConflict(bookings, date, 9, 10);
    expect(err).not.toBeNull();
    expect(err).toContain('buffer');
  });

  it('TC-BUF-H5: checkBufferConflict 10:00–11:00 với booking 08:00–09:00 → không lỗi', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const err = checkBufferConflict(bookings, date, 10, 11);
    expect(err).toBeNull();
  });

  it('TC-BUF-H6: checkBufferConflict 07:00–08:00 với booking 08:00–09:00 → có lỗi buffer', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const err = checkBufferConflict(bookings, date, 7, 8);
    expect(err).not.toBeNull();
  });

  it('TC-BUF-H7: checkBufferConflict range 09:00–12:00 với booking 08:00–09:00 → lỗi tại giờ 9', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: date, StartTime: '08:00', EndTime: '09:00' }];
    const err = checkBufferConflict(bookings, date, 9, 12);
    expect(err).not.toBeNull(); // giờ 9 trong range [9,12) bị buffer block
  });

  it('TC-BUF-H8: Booking PendingPayment vẫn gây buffer (active status)', () => {
    const bookings = [{ Status: 'PendingPayment', BookingDate: date, StartTime: '14:00', EndTime: '15:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.blockedHours.has(14)).toBe(true);
    expect(r.blockedHours.has(15)).toBe(true); // buffer after
  });

  it('TC-BUF-H9: Booking ngày khác → không ảnh hưởng ngày hiện tại', () => {
    const bookings = [{ Status: 'Confirmed', BookingDate: '2030-01-02', StartTime: '08:00', EndTime: '09:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.blockedHours.size).toBe(0);
  });

  it('TC-BUF-H10: Booking Refunded → không block (nhả slot về Available)', () => {
    const bookings = [{ Status: 'Refunded', BookingDate: date, StartTime: '10:00', EndTime: '11:00' }];
    const r = calcBookingBlockedHours(bookings, date);
    expect(r.blockedHours.size).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 5 — getScheduleOptions: buffer integration
// ══════════════════════════════════════════════════════════════════════

describe('Section 5 — getScheduleOptions Buffer Time integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([]);
  });

  it('TC-OPTS-1: Booking Confirmed 08:00–09:00 → 09:00 bị block (buffer after)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: '2030-01-01', StartTime: '08:00', EndTime: '09:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).not.toContain('08:00');
    expect(r.startTimes).not.toContain('09:00');
  });

  it('TC-OPTS-2: Booking Confirmed 08:00–09:00 → 10:00 hợp lệ (ngoài buffer)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: '2030-01-01', StartTime: '08:00', EndTime: '09:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).toContain('10:00');
  });

  it('TC-OPTS-3: Booking Cancelled → không block, không buffer', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Cancelled', BookingDate: '2030-01-01', StartTime: '08:00', EndTime: '09:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).toContain('08:00');
    expect(r.startTimes).toContain('09:00');
    expect(r.startTimes).toContain('07:00');
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 6 — createMySchedule: Buffer re-check (backend guard)
// ══════════════════════════════════════════════════════════════════════

describe('Section 6 — createMySchedule Buffer re-check (backend integrity guard)', () => {
  const futureDate = '2030-01-01';
  beforeEach(() => {
    jest.clearAllMocks();
    (coachRepo.findCoachByUserId as jest.Mock).mockResolvedValue({ CoachID: 1, Status: 'Approved' });
    (coachRepo.checkScheduleOverlap as jest.Mock).mockResolvedValue(false);
    (coachRepo.createCoachSchedulesTransaction as jest.Mock).mockResolvedValue([]);
  });

  // Case A: buffer sau booking
  it('TC-CRE-A1: Booking Confirmed 08:00–09:00, request 09:00–10:00 → reject (buffer after)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: futureDate, StartTime: '08:00', EndTime: '09:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '09:00', endTime: '10:00' })
    ).rejects.toThrow('buffer');
    expect(coachRepo.createCoachSchedulesTransaction).not.toHaveBeenCalled();
  });

  // Case B: buffer trước booking
  it('TC-CRE-A2: Booking Confirmed 08:00–09:00, request 07:00–08:00 → reject (buffer before)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: futureDate, StartTime: '08:00', EndTime: '09:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '07:00', endTime: '08:00' })
    ).rejects.toThrow();
    expect(coachRepo.createCoachSchedulesTransaction).not.toHaveBeenCalled();
  });

  // Case C: ngoài buffer
  it('TC-CRE-A3: Booking Confirmed 08:00–09:00, request 10:00–11:00 → hợp lệ', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: futureDate, StartTime: '08:00', EndTime: '09:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '10:00', endTime: '11:00' })
    ).resolves.not.toThrow();
    expect(coachRepo.createCoachSchedulesTransaction).toHaveBeenCalledTimes(1);
  });

  // Case D: multi-slot booking
  it('TC-CRE-B1: Booking 08:00–10:00 (multi-slot), request 10:00–11:00 → reject (buffer after endH=10)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: futureDate, StartTime: '08:00', EndTime: '10:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '10:00', endTime: '11:00' })
    ).rejects.toThrow();
    expect(coachRepo.createCoachSchedulesTransaction).not.toHaveBeenCalled();
  });

  it('TC-CRE-B2: Booking 08:00–10:00, request 11:00–12:00 → hợp lệ', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Confirmed', BookingDate: futureDate, StartTime: '08:00', EndTime: '10:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '11:00', endTime: '12:00' })
    ).resolves.not.toThrow();
    expect(coachRepo.createCoachSchedulesTransaction).toHaveBeenCalledTimes(1);
  });

  // Case E: booking đã release (Cancelled → không có buffer)
  it('TC-CRE-E: Booking Cancelled 08:00–09:00, request 09:00–10:00 → hợp lệ (slot đã nhả)', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Cancelled', BookingDate: futureDate, StartTime: '08:00', EndTime: '09:00' }
    ]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '09:00', endTime: '10:00' })
    ).resolves.not.toThrow();
    expect(coachRepo.createCoachSchedulesTransaction).toHaveBeenCalledTimes(1);
  });

  // Case F: Legacy overlap (giữ đúng)
  it('TC-CRE-F1: Legacy 08:00–13:00 exists, request 09:00–10:00 → reject (overlap)', async () => {
    (coachRepo.checkScheduleOverlap as jest.Mock).mockResolvedValue(true);
    getBookingsMock().mockResolvedValue([]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '09:00', endTime: '10:00' })
    ).rejects.toThrow('trùng');
    expect(coachRepo.createCoachSchedulesTransaction).not.toHaveBeenCalled();
  });

  it('TC-CRE-F2: Legacy 08:00–13:00, request 13:00–14:00 → hợp lệ', async () => {
    (coachRepo.checkScheduleOverlap as jest.Mock).mockResolvedValue(false);
    getBookingsMock().mockResolvedValue([]);
    await createMySchedule(1, { workingDate: futureDate, startTime: '13:00', endTime: '14:00' });
    const slots = (coachRepo.createCoachSchedulesTransaction as jest.Mock).mock.calls[0][0];
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ startTime: '13:00', endTime: '14:00' });
  });

  it('TC-CRE-F3: Existing 08:00–09:00, request 09:00–10:00 → hợp lệ (liền nhau)', async () => {
    (coachRepo.checkScheduleOverlap as jest.Mock).mockResolvedValue(false);
    getBookingsMock().mockResolvedValue([]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '09:00', endTime: '10:00' })
    ).resolves.not.toThrow();
  });

  it('TC-CRE-F4: 08:00–10:00 overlap 09:00–11:00 → reject', async () => {
    (coachRepo.checkScheduleOverlap as jest.Mock).mockResolvedValue(true);
    getBookingsMock().mockResolvedValue([]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '09:00', endTime: '11:00' })
    ).rejects.toThrow('trùng');
  });

  it('TC-CRE-F5: Multi-slot 10:00–13:00 → 3 slots', async () => {
    getBookingsMock().mockResolvedValue([]);
    await createMySchedule(1, { workingDate: futureDate, startTime: '10:00', endTime: '13:00' });
    const slots = (coachRepo.createCoachSchedulesTransaction as jest.Mock).mock.calls[0][0];
    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({ startTime: '10:00', endTime: '11:00' });
    expect(slots[2]).toMatchObject({ startTime: '12:00', endTime: '13:00' });
  });

  it('TC-CRE-F6: Coach Pending → reject trước check overlap', async () => {
    (coachRepo.findCoachByUserId as jest.Mock).mockResolvedValue({ CoachID: 1, Status: 'Pending' });
    getBookingsMock().mockResolvedValue([]);
    await expect(
      createMySchedule(1, { workingDate: futureDate, startTime: '10:00', endTime: '11:00' })
    ).rejects.toThrow('duyệt');
    expect(coachRepo.checkScheduleOverlap).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 7 — Booking filter (Lịch dạy)
// ══════════════════════════════════════════════════════════════════════

describe('Section 7 — getScheduleOptions booking filter (active statuses)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (coachRepo.findCoachSchedules as jest.Mock).mockResolvedValue([]);
  });

  it('TC-F1: PendingPayment → bị ẩn', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'PendingPayment', BookingDate: '2030-01-01', StartTime: '10:00', EndTime: '11:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).not.toContain('10:00');
  });

  it('TC-F2: Cancelled → không bị ẩn', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Cancelled', BookingDate: '2030-01-01', StartTime: '10:00', EndTime: '11:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).toContain('10:00');
  });

  it('TC-F3: Refunded → không bị ẩn', async () => {
    getBookingsMock().mockResolvedValue([
      { Status: 'Refunded', BookingDate: '2030-01-01', StartTime: '14:00', EndTime: '15:00' }
    ]);
    const r = await getScheduleOptions(1, '2030-01-01');
    expect(r.startTimes).toContain('14:00');
  });
});
