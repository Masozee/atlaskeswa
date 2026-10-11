import ExcelJS from 'exceljs';
import { EMPTY, type LocationReport, type ReportTable } from '@/lib/location-report';

/**
 * The location report as a worksheet laid out like the research team's
 * report.xlsx: name, description, then per branch its letter and codes and the
 * Layanan/Keterangan tables two abreast — columns C:D on the left, F:G on the
 * right. Loaded only when someone asks for the file.
 */

const FONT = 'Aptos';
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
const THIN: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
const BOXED: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };

/** The two column pairs a table can sit in. */
const PAIRS = [
  ['C', 'D'],
  ['F', 'G'],
] as const;

/** "1.080" as the report formats a count; written back as a number so it sums. */
const COUNT = /^\d{1,3}(\.\d{3})*$/;

function cell(ws: ExcelJS.Worksheet, address: string, value: string, style: Partial<ExcelJS.Style> = {}) {
  const target = ws.getCell(address);
  if (COUNT.test(value)) {
    target.value = Number(value.replace(/\./g, ''));
    target.numFmt = '#,##0';
    target.alignment = { horizontal: 'left' };
  } else {
    target.value = value;
  }
  target.font = { name: FONT, size: 12, ...style.font };
  if (style.fill) target.fill = style.fill;
  if (style.border) target.border = style.border;
  target.alignment = { ...target.alignment, vertical: 'top', wrapText: true, ...style.alignment };
  return target;
}

const lines = (value: string | string[]) => (Array.isArray(value) ? value : [value]);

/**
 * Writes a row of up to two tables from `start`. Their rows line up label by
 * label — a branch's tables share one set of rows — and a list cell takes one
 * spreadsheet row per item, as the printed report has it.
 */
function writeTablePair(ws: ExcelJS.Worksheet, start: number, tables: ReportTable[]): number {
  tables.forEach((_, side) => {
    const [label, value] = PAIRS[side];
    const header = { font: { bold: true }, fill: HEADER_FILL, border: BOXED };
    cell(ws, `${label}${start}`, 'Layanan', header);
    cell(ws, `${value}${start}`, 'Keterangan', header);
  });

  let row = start + 1;
  tables.forEach((table, side) => {
    const [label, value] = PAIRS[side];
    cell(ws, `${label}${row}`, table.label, { border: BOXED });
    cell(ws, `${value}${row}`, table.available ? 'Tersedia' : EMPTY, { border: BOXED });
  });
  row += 1;

  const rowCount = Math.max(...tables.map((table) => table.rows.length));
  for (let index = 0; index < rowCount; index++) {
    const height = Math.max(...tables.map((table) => (table.rows[index] ? lines(table.rows[index].value).length : 1)));
    tables.forEach((table, side) => {
      const [label, value] = PAIRS[side];
      const entry = table.rows[index];
      if (!entry) return;
      const items = lines(entry.value);
      for (let offset = 0; offset < height; offset++) {
        // The label sits on the first line only, with no rule under it, so a
        // list reads as one row of the table.
        const first = offset === 0;
        const last = offset === height - 1;
        const edges: Partial<ExcelJS.Borders> = {
          left: THIN,
          right: THIN,
          ...(first && { top: THIN }),
          ...(last && { bottom: THIN }),
        };
        cell(ws, `${label}${row + offset}`, first ? entry.label : '', { border: edges });
        cell(ws, `${value}${row + offset}`, items[offset] ?? '', { border: edges });
      }
    });
    row += height;
  }
  return row;
}

export function buildLocationWorkbook(report: LocationReport): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OMMHA · Atlas Keswa';
  workbook.created = new Date();
  workbook.title = `Laporan profil layanan — ${report.title}`;
  workbook.subject = 'Profil layanan kesehatan jiwa (DESDE-LTC)';
  workbook.keywords = ['OMMHA', 'Atlas Keswa', 'DESDE-LTC', ...report.branches.map((branch) => branch.code)].join(', ');

  const surveyed = report.facts.find((fact) => fact.label === 'Tanggal survei')?.value;
  const meta = [report.place, surveyed && surveyed !== EMPTY && `Disurvei ${surveyed}`].filter(
    (part): part is string => Boolean(part)
  );

  const ws = workbook.addWorksheet('Laporan', {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  // The widths of report.xlsx: a narrow gutter for the branch letter, then two
  // label/value pairs with a spacer between them.
  [10.8, 5.5, 24.8, 46.7, 10.8, 24.2, 45.5, 10.8].forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });

  cell(ws, 'B2', report.title, { font: { bold: true, size: 26 }, alignment: { wrapText: false } });
  ws.getRow(2).height = 34;

  let row = 3;
  if (meta.length > 0) {
    cell(ws, `B${row}`, meta.join(' · '), {
      font: { size: 11, color: { argb: 'FF6B7280' } },
      alignment: { wrapText: false },
    });
  }
  row += 1;

  if (report.description) {
    ws.mergeCells(`B${row}:G${row}`);
    cell(ws, `B${row}`, report.description);
    // The merged band holds ~150 characters a line; Excel will not grow a
    // merged row by itself.
    ws.getRow(row).height = Math.max(1, Math.ceil(report.description.length / 140)) * 16 + 4;
    row += 1;
  }

  for (const branch of report.branches) {
    row += 1;
    cell(ws, `B${row}`, branch.code, { font: { bold: true }, alignment: { wrapText: false } });
    cell(ws, `C${row}`, branch.name, { font: { bold: true }, alignment: { wrapText: false } });
    row += 1;
    for (const child of branch.children) {
      cell(ws, `C${row}`, `${child.code} ${child.name}`, { alignment: { wrapText: false } });
      row += 1;
    }

    for (let index = 0; index < branch.tables.length; index += 2) {
      row += 1;
      row = writeTablePair(ws, row, branch.tables.slice(index, index + 2));
    }
    row += 1;
  }

  return workbook;
}

export async function locationReportXlsx(report: LocationReport): Promise<Blob> {
  const buffer = await buildLocationWorkbook(report).xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
