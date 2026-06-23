// Coworking desk zones (mirror of backend com.beworking.bookings.CoworkZone and
// the booking app's src/config/coworkZones.js). A zone is a block of desks whose
// product names share a prefix (MA1O1-1..16), with an optional active window.

export const COWORK_ZONES = [
  { prefix: 'MA1O1', shortLabel: 'Coworking 1', displayName: 'MA1 Desks', deskCount: 16, activeFrom: null, activeTo: null },
  // Second desk room (MA1A5). Permanent fixture; bookable only within its window.
  { prefix: 'MA1O5', shortLabel: 'Coworking 2', displayName: 'MA1A5 Coworking', deskCount: 14, activeFrom: '2026-07-01', activeTo: '2026-08-31' },
];

// Zones are permanent fixtures and always shown; the date window governs booking.
export const isZoneActiveToday = (zone) => Boolean(zone);

/** Zones bookable today (the permanent zone plus any in-window seasonal zones). */
export const activeZonesToday = () => COWORK_ZONES.filter(isZoneActiveToday);

/** Every desk product name across all zones, e.g. ['MA1O1-1', …, 'MA1O5-14']. */
export const allDeskProductNames = () =>
  COWORK_ZONES.flatMap((z) => Array.from({ length: z.deskCount }, (_, i) => `${z.prefix}-${i + 1}`));
