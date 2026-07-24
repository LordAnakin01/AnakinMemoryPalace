export const INTERVALS = [1, 3, 7, 14, 30]; // days

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysUntil = (dateStr) => {
  const ms = new Date(dateStr) - new Date(todayISO());
  return Math.round(ms / 86400000);
};

export function orderedItems(palace, list) {
  return palace.stops
    .map((s) => {
      const item = list.items.find((it) => it.stopId === s.id);
      return item ? { ...item, stopLabel: s.label } : null;
    })
    .filter(Boolean);
}
