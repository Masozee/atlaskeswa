import { EMPTY, type ReportTable } from '@/lib/location-report';

/**
 * The short version of a service branch's detail block, read under the branch
 * on the profile. The tables come from the location report, so the page says
 * exactly what the downloaded PDF and XLSX say. The full block stays on the
 * "Rincian layanan" tab.
 */
function SummaryTable({ table }: { table: ReportTable }) {
  return (
    <table className="w-full border-collapse text-[14px]">
      <thead>
        <tr className="border-b border-foreground/40">
          <th className="w-[42%] py-1.5 pr-3 text-left font-medium">Layanan</th>
          <th className="py-1.5 text-left font-medium">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b align-top">
          <th scope="row" className="py-1.5 pr-3 text-left font-medium">
            {table.label}
          </th>
          <td className="py-1.5">{table.available ? 'Tersedia' : EMPTY}</td>
        </tr>
        {table.rows.map((row) => (
          <tr key={row.label} className="border-b align-top">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted-foreground">
              {row.label}
            </th>
            <td className={table.available ? 'py-1.5' : 'py-1.5 text-muted-foreground'}>
              {Array.isArray(row.value) ? (
                <ul className="list-disc pl-4 space-y-0.5">
                  {row.value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                row.value
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The summary tables for one DESDE-LTC branch: one per slot of its family. */
export function ServiceSummary({ title, tables }: { title: string; tables: ReportTable[] }) {
  if (tables.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-semibold mb-3">{title}</h3>
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2 lg:items-start">
        {tables.map((table) => (
          <SummaryTable key={table.label} table={table} />
        ))}
      </div>
    </div>
  );
}
