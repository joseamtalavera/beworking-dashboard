import { useEffect, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CoworkingFloorPlan, { buildDeskMap } from './CoworkingFloorPlan.jsx';
import { fetchPublicAvailability } from '../../api/bookings.js';

/**
 * One coworking zone rendered as its own titled floor-plan card (e.g. "Desk 1 —
 * MA1 Desks"). Fetches that zone's availability independently so several zones
 * can be shown side by side, each with its own occupancy. `onDeskClick` is
 * called with (zonePrefix, deskNumber, subscription) so the parent knows which
 * room/product the picked seat belongs to.
 */
export default function ZoneFloorPlan({ zone, date, dateTo, deskOccupancy, onDeskClick, mode = 'admin' }) {
  const [avail, setAvail] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;
    setLoading(true);
    const products = [];
    for (let i = 1; i <= zone.deskCount; i += 1) products.push(`${zone.prefix}-${i}`);
    fetchPublicAvailability({ date, dateTo: dateTo || date, products, centers: ['MA1'] })
      .then((d) => { if (!cancelled) setAvail(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setAvail([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [zone.prefix, zone.deskCount, date, dateTo]);

  const bookedDesks = useMemo(() => {
    const set = new Set();
    const re = new RegExp(`^${zone.prefix}(\\d{1,2})$`);
    avail.forEach((item) => {
      const name = (item?.producto?.nombre || '').toUpperCase().replace(/[-_\s]/g, '');
      const m = name.match(re);
      if (m) set.add(parseInt(m[1], 10));
    });
    return set;
  }, [avail, zone.prefix]);

  const deskData = useMemo(
    () => buildDeskMap(deskOccupancy, { prefix: zone.prefix, deskCount: zone.deskCount }),
    [deskOccupancy, zone.prefix, zone.deskCount],
  );

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {zone.shortLabel}
        <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, ml: 1 }}>
          {zone.displayName} · {zone.deskCount} mesas
        </Typography>
      </Typography>
      <CoworkingFloorPlan
        mode={mode}
        deskData={deskData}
        bookedDeskNumbers={bookedDesks}
        onDeskClick={(deskNumber, sub) => onDeskClick(zone.prefix, deskNumber, sub)}
        loading={loading}
        deskCount={zone.deskCount}
      />
    </Stack>
  );
}
