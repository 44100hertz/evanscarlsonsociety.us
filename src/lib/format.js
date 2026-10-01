// Cards are sorted newest first everywhere; these keep the ordering and the
// date wording in one place.

export const byNewest = (a, b) => b.data.date.localeCompare(a.data.date);

export function date(iso) {
  const d = new Date(iso);
  return `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
