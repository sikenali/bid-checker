/**
 * Convert ri-xxx-yyy to RiXxxYyy (global component name)
 */
export function riToCompName(riClass: string): string {
  const parts = riClass.replace('ri-', '').split('-');
  return 'Ri' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}
