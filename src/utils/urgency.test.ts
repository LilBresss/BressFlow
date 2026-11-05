import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUrgency,
  calculateCountdown,
  calculateDuration,
  formatDurationDescriptive,
  calculateSubtaskProgress,
  sortActivities,
} from './urgency';
import { Activity } from '../types';

test('calculateUrgency: properly tags expired activities', () => {
  const now = new Date('2026-11-05T12:00:00');
  const past = calculateUrgency('2026-11-05', '11:00', now);
  assert.equal(past.isExpired, true);
  assert.equal(past.level, 5);
});

test('calculateUrgency: less than 48 hours is level 5 Molto alta', () => {
  const now = new Date('2026-11-05T12:00:00');
  const res = calculateUrgency('2026-11-06', '12:00', now); // 24h away
  assert.equal(res.isExpired, false);
  assert.equal(res.level, 5);
  assert.equal(res.label, 'Molto alta');
});

test('calculateUrgency: 48h to 7 days is level 4 Alta', () => {
  const now = new Date('2026-11-05T12:00:00');
  const res = calculateUrgency('2026-11-08', '12:00', now); // 3 days away
  assert.equal(res.isExpired, false);
  assert.equal(res.level, 4);
  assert.equal(res.label, 'Alta');
});

test('calculateUrgency: 7 to 14 days is level 3 Media', () => {
  const now = new Date('2026-11-05T12:00:00');
  const res = calculateUrgency('2026-11-15', '12:00', now); // 10 days away
  assert.equal(res.isExpired, false);
  assert.equal(res.level, 3);
  assert.equal(res.label, 'Media');
});

test('calculateUrgency: 14 to 30 days is level 2 Bassa', () => {
  const now = new Date('2026-11-05T12:00:00');
  const res = calculateUrgency('2026-11-25', '12:00', now); // 20 days away
  assert.equal(res.isExpired, false);
  assert.equal(res.level, 2);
  assert.equal(res.label, 'Bassa');
});

test('calculateUrgency: >30 days is level 1 Molto bassa', () => {
  const now = new Date('2026-11-05T12:00:00');
  const res = calculateUrgency('2026-12-25', '12:00', now); // 50 days away
  assert.equal(res.isExpired, false);
  assert.equal(res.level, 1);
  assert.equal(res.label, 'Molto bassa');
});

test('calculateCountdown: accurate countdown breakdown and formatting', () => {
  const now = new Date('2026-11-01T12:00:00');
  // 2 weeks, 3 days, 5 hours, 24 minutes away
  // target = 2026-11-01 + 17 days, 5 hours, 24 min => 2026-11-18 17:24
  const res = calculateCountdown('2026-11-18', '17:24', now);
  assert.equal(res.weeks, 2);
  assert.equal(res.days, 3);
  assert.equal(res.hours, 5);
  assert.equal(res.minutes, 24);
  assert.equal(res.formatted, '2 settimane, 3 giorni, 5 ore e 24 minuti');
});

test('calculateDuration: calculates manual duration when no subtasks', () => {
  const res = calculateDuration({ manualDurationMinutes: 90, subtasks: [] });
  assert.equal(res.totalMinutes, 90);
  assert.equal(res.formatted, '1h 30m');
});

test('calculateDuration: sums subtasks automatically', () => {
  const res = calculateDuration({
    manualDurationMinutes: 10, // should be ignored when subtasks exist
    subtasks: [
      { durationMinutes: 45 },
      { durationMinutes: 60 },
      { durationMinutes: 90 },
      { durationMinutes: 30 },
    ],
  });
  assert.equal(res.totalMinutes, 225);
  assert.equal(formatDurationDescriptive(res.totalMinutes), '3 ore e 45 minuti');
});

test('calculateSubtaskProgress: computes percentage properly', () => {
  const res = calculateSubtaskProgress([
    { status: 'COMPLETATA' },
    { status: 'DA FARE' },
    { status: 'COMPLETATA' },
    { status: 'DA FARE' },
  ]);
  assert.equal(res.completed, 2);
  assert.equal(res.total, 4);
  assert.equal(res.percentage, 50);
});

test('sortActivities: expired first, then closest deadline', () => {
  const now = new Date('2026-11-05T12:00:00');
  const acts: Activity[] = [
    {
      id: '1',
      title: 'Future late',
      dueDate: '2026-11-10',
      dueTime: '10:00',
      status: 'DA FARE',
      manualDurationMinutes: 30,
      subtasks: [],
      createdAt: '2026-11-01',
    },
    {
      id: '2',
      title: 'Expired yesterday',
      dueDate: '2026-11-04',
      dueTime: '10:00',
      status: 'DA FARE',
      manualDurationMinutes: 30,
      subtasks: [],
      createdAt: '2026-11-01',
    },
    {
      id: '3',
      title: 'Future soon',
      dueDate: '2026-11-06',
      dueTime: '10:00',
      status: 'DA FARE',
      manualDurationMinutes: 30,
      subtasks: [],
      createdAt: '2026-11-01',
    },
    {
      id: '4',
      title: 'Completed task',
      dueDate: '2026-11-02',
      dueTime: '10:00',
      status: 'COMPLETATA',
      manualDurationMinutes: 30,
      subtasks: [],
      createdAt: '2026-11-01',
      completedAt: '2026-11-03',
    },
  ];

  const sorted = sortActivities(acts, now);
  assert.equal(sorted[0].id, '2'); // Expired first
  assert.equal(sorted[1].id, '3'); // Future soon second
  assert.equal(sorted[2].id, '1'); // Future late third
  assert.equal(sorted[3].id, '4'); // Completed last
});
