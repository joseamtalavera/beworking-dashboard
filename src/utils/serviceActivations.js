import { useEffect, useState } from 'react';
import { DEPT_TABS } from '../constants.js';

const STORAGE_KEY = 'bw_activated_services';
const EVENT_NAME = 'bw:activations-change';

// Top-level tabs that are always visible to admin and not toggleable.
export const ALWAYS_VISIBLE_ADMIN = new Set(['Platform', 'Tools', 'CommunityAI']);

// All top-level dept ids that can be toggled on/off via the Services page.
export function getActivatableServiceIds() {
  return DEPT_TABS
    .map((d) => d.id)
    .filter((id) => !ALWAYS_VISIBLE_ADMIN.has(id));
}

function readSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getActivatedServices() {
  return readSet();
}

export function toggleService(id) {
  const set = readSet();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeSet(set);
}

export function setServiceActivated(id, activated) {
  const set = readSet();
  if (activated) set.add(id);
  else set.delete(id);
  writeSet(set);
}

export function useActivatedServices() {
  const [activated, setActivated] = useState(readSet);
  useEffect(() => {
    const onChange = () => setActivated(readSet());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  return activated;
}
