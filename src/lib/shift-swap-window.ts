export function shiftAllowsSwap(date: string, time: string, now = Date.now()) {
  const start = +new Date(`${date.slice(0, 10)}T${time}:00-03:00`);
  return Number.isFinite(start) && start - now >= 24 * 3600000;
}
