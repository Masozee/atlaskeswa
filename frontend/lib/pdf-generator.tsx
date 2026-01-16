import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { mockIndonesianServices } from './indonesia-locations';

// PDF Styles with professional design
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header Section
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '3 solid #2563eb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  dateText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },
  // Section Styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '2 solid #e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Statistics Cards
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: '1 solid #e2e8f0',
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    lineHeight: 1.2,
  },
  statSubtext: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
  },
  // Table Styles
  table: {
    marginTop: 8,
    border: '1 solid #e2e8f0',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #f1f5f9',
    minHeight: 32,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#1e40af',
    borderBottom: '2 solid #1e3a8a',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#334155',
  },
  tableCellBold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tableNote: {
    marginTop: 8,
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
  },
  // Filter Info
  filterInfo: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    border: '1 solid #dbeafe',
  },
  filterText: {
    fontSize: 9,
    color: '#1e40af',
    marginBottom: 2,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 12,
  },
  footerText: {
    marginBottom: 2,
  },
  // Page Number
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#64748b',
  },
});

// Service Availability Report PDF
export const ServiceAvailabilityPDF = ({ filters }: { filters: any }) => {
  const servicesData = mockIndonesianServices;

  // Apply filters
  const filteredServices = servicesData.filter((service) => {
    if (filters.province && filters.province !== 'all' && service.province !== filters.province) return false;
    if (filters.mtc && filters.mtc !== 'all' && service.mtc_code !== filters.mtc) return false;
    return true;
  });

  const stats = {
    total: filteredServices.length,
    verified: filteredServices.filter((s) => s.verification_status === 'VERIFIED').length,
    pending: filteredServices.filter((s) => s.verification_status === 'SUBMITTED').length,
    rejected: filteredServices.filter((s) => s.verification_status === 'REJECTED').length,
  };

  const verificationRate = stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : '0';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Ketersediaan Layanan</Text>
          <Text style={styles.subtitle}>Sistem Manajemen Data Layanan Kesehatan Mental - Atlas Keswa</Text>
          <Text style={styles.dateText}>
            Dibuat: {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Filter Information */}
        {(filters.province || filters.mtc) && (
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>Filter yang Diterapkan:</Text>
            {filters.province && filters.province !== 'all' && (
              <Text style={styles.filterText}>• Provinsi: {filters.province}</Text>
            )}
            {filters.mtc && filters.mtc !== 'all' && (
              <Text style={styles.filterText}>• Kode MTC: {filters.mtc}</Text>
            )}
          </View>
        )}

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Statistik</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Layanan</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statSubtext}>Seluruh layanan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Terverifikasi</Text>
              <Text style={styles.statValue}>{stats.verified}</Text>
              <Text style={styles.statSubtext}>{verificationRate}% dari total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Menunggu</Text>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statSubtext}>Perlu peninjauan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ditolak</Text>
              <Text style={styles.statValue}>{stats.rejected}</Text>
              <Text style={styles.statSubtext}>Perlu perbaikan</Text>
            </View>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Layanan Kesehatan Mental</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 3 }]}>Nama Layanan</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Provinsi</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>MTC</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Tempat Tidur</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Staf</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Status</Text>
            </View>

            {/* Table Rows */}
            {filteredServices.slice(0, 15).map((service, index) => (
              <View key={service.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellBold, { flex: 3 }]}>
                  {service.service_name}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{service.province}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{service.mtc_code}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {service.total_beds || '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                  {service.total_staff || '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {service.verification_status === 'VERIFIED' ? 'Terverifikasi' :
                   service.verification_status === 'SUBMITTED' ? 'Menunggu' : 'Ditolak'}
                </Text>
              </View>
            ))}
          </View>
          {filteredServices.length > 15 && (
            <Text style={styles.tableNote}>
              Menampilkan 15 dari {filteredServices.length} layanan. Unduh versi lengkap untuk melihat semua data.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dokumen ini dibuat secara otomatis oleh Sistem Manajemen Data Layanan Kesehatan Mental Atlas Keswa
          </Text>
          <Text style={styles.footerText}>
            Untuk informasi lebih lanjut, kunjungi www.atlaskeswa.id
          </Text>
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Halaman ${pageNumber} dari ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

// Export function to generate PDF download link
export const generatePDFDownload = (reportType: string, filters: any) => {
  const fileName = `atlaskeswa-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;

  switch (reportType) {
    case 'service-availability':
      return { component: <ServiceAvailabilityPDF filters={filters} />, fileName };
    default:
      return { component: <ServiceAvailabilityPDF filters={filters} />, fileName };
  }
};
