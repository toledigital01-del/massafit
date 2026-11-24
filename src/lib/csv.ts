/** CSV para Excel brasileiro: separador ';', vírgula decimal e BOM UTF-8. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [headers, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
}
