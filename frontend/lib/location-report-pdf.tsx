import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { EMPTY, formatReportDate, type LocationReport, type ReportTable } from '@/lib/location-report';

/**
 * The location report as an A4 document in the OMMHA identity: a running
 * header with the logo, the record's metadata up front, then per branch its
 * letter and codes and the Layanan/Keterangan tables two abreast, as in
 * report.xlsx. Loaded only when someone asks for it.
 */

/** The logo's blue and the map's FASKES teal — the two brand colours. */
const BRAND = '#07579E';
const ACCENT = '#00979D';
const TEXT = '#1A1A1A';
const SECONDARY = '#374151';
const MUTED = '#6B7280';
const RULE = '#D7DCE2';
const TINT = '#EEF3F9';

let fontsRegistered = false;

/** Geist, the site's typeface, served from /fonts so the PDF reads like the page. */
function registerFonts(assetBase: string) {
  if (fontsRegistered) return;
  Font.register({
    family: 'Geist',
    fonts: [
      { src: `${assetBase}/fonts/Geist-Regular.ttf`, fontWeight: 400 },
      { src: `${assetBase}/fonts/Geist-Medium.ttf`, fontWeight: 500 },
      { src: `${assetBase}/fonts/Geist-SemiBold.ttf`, fontWeight: 600 },
    ],
  });
  // Labels are short and Indonesian; the default English hyphenator splits
  // them mid-word ("Kunjun-gan"), so words wrap whole.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const GUTTER = 30;

const styles = StyleSheet.create({
  page: {
    paddingTop: 78,
    paddingBottom: 64,
    paddingHorizontal: 40,
    fontFamily: 'Geist',
    fontSize: 9,
    color: TEXT,
  },
  // No lineHeight on the page or any View: react-pdf drops a page-number Text
  // that inherits a unitless one. Text styles that need air set their own,
  // always beside a fontSize — without one react-pdf doubles the leading.

  /* running header and footer */
  header: {
    position: 'absolute',
    top: 24,
    left: 40,
    right: 40,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1.5 solid ${BRAND}`,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 26, height: 26 },
  brandName: { fontSize: 11, fontWeight: 600, color: BRAND, lineHeight: 1.1 },
  brandTagline: { fontSize: 7.5, color: MUTED },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: {
    fontSize: 7.5,
    fontWeight: 500,
    color: BRAND,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 7.5,
    color: MUTED,
    maxWidth: 240,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `0.75 solid ${RULE}`,
    fontSize: 7.5,
    color: MUTED,
  },

  /* cover block */
  eyebrow: { fontSize: 8, fontWeight: 600, color: ACCENT, letterSpacing: 1.2 },
  title: { marginTop: 4, fontSize: 22, fontWeight: 600, lineHeight: 1.15 },
  place: { marginTop: 4, fontSize: 9.5, color: MUTED, lineHeight: 1.4 },
  chips: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    paddingTop: 3,
    paddingBottom: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
    fontSize: 7.5,
    lineHeight: 1,
    fontWeight: 500,
    color: '#FFFFFF',
  },
  facts: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: TINT,
    borderRadius: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fact: { width: '33.33%', paddingVertical: 4, paddingRight: 8 },
  factLabel: { fontSize: 7, color: MUTED, letterSpacing: 0.4 },
  factValue: { marginTop: 1, fontSize: 9, fontWeight: 500, lineHeight: 1.4 },
  sectionLabel: {
    marginTop: 16,
    fontSize: 8,
    fontWeight: 600,
    color: BRAND,
    letterSpacing: 0.8,
  },
  description: {
    marginTop: 4,
    fontSize: 9.5,
    color: SECONDARY,
    lineHeight: 1.5,
  },
  stats: { marginTop: 8, flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 10, borderRadius: 6, border: `0.75 solid ${RULE}` },
  statValue: { fontSize: 18, fontWeight: 600, color: BRAND, lineHeight: 1.1 },
  statLabel: { marginTop: 2, fontSize: 7.5, color: MUTED, lineHeight: 1.4 },

  /* branches */
  branch: { marginTop: 22, flexDirection: 'row' },
  branchCode: {
    width: GUTTER - 8,
    height: 18,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 600,
    textAlign: 'center',
    paddingTop: 4,
  },
  branchBody: { flex: 1 },
  branchName: { fontSize: 12, fontWeight: 600, color: BRAND, paddingTop: 1 },
  child: { fontSize: 9, marginTop: 2, color: SECONDARY, lineHeight: 1.4 },
  childCode: { fontWeight: 600, color: TEXT },
  pair: {
    marginTop: 10,
    marginLeft: GUTTER,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  /* tables */
  table: { flex: 1, border: `0.75 solid ${RULE}`, borderRadius: 4 },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  headerCell: { color: '#FFFFFF', fontWeight: 600, fontSize: 8 },
  row: { flexDirection: 'row', borderTop: `0.75 solid ${RULE}` },
  serviceRow: { flexDirection: 'row', backgroundColor: TINT },
  label: { fontSize: 9, width: '42%', paddingVertical: 4, paddingHorizontal: 6, lineHeight: 1.4 },
  value: { fontSize: 9, width: '58%', paddingVertical: 4, paddingHorizontal: 6, lineHeight: 1.4 },
  valueBox: { width: '58%', paddingVertical: 4, paddingHorizontal: 6 },
  line: { fontSize: 9, lineHeight: 1.4 },
  serviceLabel: { fontWeight: 600 },
  available: { fontWeight: 600, color: ACCENT },
  muted: { color: MUTED },

  note: {
    marginTop: 26,
    paddingTop: 10,
    borderTop: `0.75 solid ${RULE}`,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.5,
  },
});

function ReportTableView({ table }: { table: ReportTable }) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, styles.headerCell]}>Layanan</Text>
        <Text style={[styles.value, styles.headerCell]}>Keterangan</Text>
      </View>
      <View style={styles.serviceRow}>
        <Text style={[styles.label, styles.serviceLabel]}>{table.label}</Text>
        <Text style={[styles.value, table.available ? styles.available : styles.muted]}>
          {table.available ? 'Tersedia' : EMPTY}
        </Text>
      </View>
      {table.rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.label, styles.muted]}>{row.label}</Text>
          <View style={styles.valueBox}>
            {(Array.isArray(row.value) ? row.value : [row.value]).map((item) => (
              <Text key={item} style={table.available ? styles.line : [styles.line, styles.muted]}>
                {Array.isArray(row.value) ? `• ${item}` : item}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Cover({ report }: { report: LocationReport }) {
  const tables = report.branches.flatMap((branch) => branch.tables);
  const stats = [
    { value: report.branches.length, label: 'Cabang layanan DESDE-LTC' },
    {
      value: report.branches.reduce((sum, branch) => sum + branch.children.length, 0),
      label: 'Kode layanan',
    },
    {
      value: tables.filter((table) => table.available).length,
      label: 'Jenis layanan tersedia',
    },
  ];

  return (
    <View>
      <Text style={styles.eyebrow}>LAPORAN PROFIL LAYANAN</Text>
      <Text style={styles.title}>{report.title}</Text>
      {report.place && <Text style={styles.place}>{report.place}</Text>}
      {report.types.length > 0 && (
        <View style={styles.chips}>
          {report.types.map((type) => (
            <Text key={type.label} style={[styles.chip, { backgroundColor: type.color }]}>
              {type.label}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.facts}>
        {report.facts.map((fact) => (
          <View key={fact.label} style={styles.fact}>
            <Text style={styles.factLabel}>{fact.label.toUpperCase()}</Text>
            <Text style={styles.factValue}>{fact.value}</Text>
          </View>
        ))}
      </View>

      {report.description && (
        <>
          <Text style={styles.sectionLabel}>JENIS LAYANAN</Text>
          <Text style={styles.description}>{report.description}</Text>
        </>
      )}

      {report.branches.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>RINGKASAN</Text>
          <View style={styles.stats}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

type PdfOptions = {
  /** Where /fonts and /report/ommha-logo.png are served from: the site origin. */
  assetBase: string;
  /** The profile page the report was downloaded from. */
  url: string;
};

function LocationReportDocument({ report, assetBase, url }: { report: LocationReport } & PdfOptions) {
  const downloaded = formatReportDate(new Date());

  return (
    <Document
      title={`Laporan Profil Layanan — ${report.title}`}
      author="OMMHA · Atlas Keswa"
      subject={`Profil layanan kesehatan jiwa${report.place ? `, ${report.place}` : ''}`}
      keywords={['OMMHA', 'Atlas Keswa', 'kesehatan jiwa', 'DESDE-LTC', ...report.branches.map((b) => b.code)].join(
        ', ',
      )}
      creator={`OMMHA — One Map for Mental Health Atlas (${url})`}
      producer="OMMHA · Atlas Keswa"
      language="id"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            <Image src={`${assetBase}/report/ommha-logo.png`} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>OMMHA</Text>
              <Text style={styles.brandTagline}>One Map for Mental Health Atlas</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>LAPORAN PROFIL LAYANAN</Text>
            <Text style={styles.headerTitle}>{report.title}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>OMMHA · Atlas Keswa · Nomor survei #{report.id}</Text>
          <Text>Diunduh {downloaded}</Text>
          <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>

        <Cover report={report} />

        {report.branches.map((branch) => {
          const pairs = Array.from({ length: Math.ceil(branch.tables.length / 2) }, (_, index) =>
            branch.tables.slice(index * 2, index * 2 + 2),
          );
          const pairView = (tables: ReportTable[], key: number) => (
            <View key={key} style={styles.pair} wrap={false}>
              {tables.map((table) => (
                <ReportTableView key={table.label} table={table} />
              ))}
              {/* An odd last table keeps its half width. */}
              {tables.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          );

          return (
            <View key={branch.code}>
              {/* The heading travels with its first tables rather than being
                  stranded at the foot of a page. */}
              <View wrap={false}>
                <View style={styles.branch}>
                  <Text style={styles.branchCode}>{branch.code}</Text>
                  <View style={styles.branchBody}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    {branch.children.map((child) => (
                      <Text key={child.code} style={styles.child}>
                        <Text style={styles.childCode}>{child.code}</Text> {child.name}
                      </Text>
                    ))}
                  </View>
                </View>
                {pairs[0] && pairView(pairs[0], 0)}
              </View>
              {pairs.slice(1).map((tables, index) => pairView(tables, index + 1))}
            </View>
          );
        })}

        <Text style={styles.note} wrap={false}>
          Laporan ini disusun otomatis dari data survei pemetaan layanan kesehatan jiwa OMMHA di Kabupaten Kebumen.
          Layanan diklasifikasikan menurut DESDE-LTC. Tanda {EMPTY} berarti layanan tidak tersedia atau pertanyaan tidak
          dijawab. Versi terkini: {url}
        </Text>
      </Page>
    </Document>
  );
}

export function locationReportPdf(report: LocationReport, options: PdfOptions): Promise<Blob> {
  registerFonts(options.assetBase);
  return pdf(<LocationReportDocument report={report} {...options} />).toBlob();
}
