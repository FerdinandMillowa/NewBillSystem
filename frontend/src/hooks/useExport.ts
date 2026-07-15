import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportColumn<T = any> {
  /** Column header label shown in the exported file */
  header: string;
  /** Key on the data row, or a getter function for derived values */
  accessor: keyof T | ((row: T) => string | number | null | undefined);
  /** Optional width hint for Excel columns (in characters) */
  width?: number;
}

export interface UseExportOptions<T = any> {
  /** Display title printed at the top of the PDF / Excel sheet */
  title: string;
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Filename without extension */
  filename: string;
}

function getCellValue<T>(row: T, accessor: ExportColumn<T>['accessor']): string {
  const raw =
    typeof accessor === 'function'
      ? accessor(row)
      : (row as any)[accessor];
  if (raw === null || raw === undefined) return '—';
  return String(raw);
}

export function useExport<T = any>(options: UseExportOptions<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (data: T[], format: ExportFormat) => {
    if (!data || data.length === 0) return;

    setIsExporting(true);

    try {
      const headers = options.columns.map((c) => c.header);
      const rows = data.map((row) =>
        options.columns.map((col) => getCellValue(row, col.accessor)),
      );

      if (format === 'pdf') {
        await exportPdf(headers, rows, options.title, options.filename);
      } else if (format === 'excel') {
        exportExcel(headers, rows, options.title, options.filename, options.columns);
      } else if (format === 'csv') {
        exportCsv(headers, rows, options.filename);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function exportPdf(
  headers: string[],
  rows: string[][],
  title: string,
  filename: string,
) {
  // Landscape for wide tables, portrait otherwise
  const orientation = headers.length > 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Header band ──
  doc.setFillColor(26, 26, 46); // #1a1a2e brand dark
  doc.rect(0, 0, pageW, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Pitch & Roll Bar', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 176);
  doc.text(title, margin, 18);

  // Generated timestamp (right-aligned)
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 176);
  doc.text(`Generated: ${now}`, pageW - margin, 18, { align: 'right' });

  // ── Table ──
  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: rows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [233, 69, 96], // #e94560 accent
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1,
  });

  // ── Footer on every page ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageW / 2,
      pageH - 6,
      { align: 'center' },
    );
    doc.text('Pitch & Roll Bar Management System', margin, pageH - 6);
  }

  doc.save(`${filename}.pdf`);
}

// ─── Excel ────────────────────────────────────────────────────────────────────

function exportExcel<T>(
  headers: string[],
  rows: string[][],
  title: string,
  filename: string,
  columns: ExportColumn<T>[],
) {
  const wb = XLSX.utils.book_new();

  // Title row + blank row + header + data
  const sheetData = [
    [`Pitch & Roll Bar — ${title}`],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths
  ws['!cols'] = columns.map((c) => ({
    wch: c.width ?? Math.max(c.header.length + 4, 14),
  }));

  // Merge title across all columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

function exportCsv(headers: string[], rows: string[][], filename: string) {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v;

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}