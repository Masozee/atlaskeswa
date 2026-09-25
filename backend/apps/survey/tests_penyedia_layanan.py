from datetime import datetime, timezone as dt_timezone

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from .models import (
    DynamicSurveyResponse, Question, QuestionAnswer, QuestionChoice,
    QuestionSection, SurveyTemplate,
)
from .penyedia_layanan import Facility, bucket_keys, classify, summarize

User = get_user_model()


def row(table, provider):
    return next(r for r in table['rows'] if r['provider'] == provider)


class ClassifyTests(SimpleTestCase):
    def test_residential_splits_acute_at_the_questionnaire_branch(self):
        self.assertEqual(classify('R1'), ('R', 'akut'))
        self.assertEqual(classify('R3.1.1'), ('R', 'akut'))
        self.assertEqual(classify('R4'), ('R', 'non_akut'))
        # Social residential branches acute at SR1–SR2, not R1–R3.
        self.assertEqual(classify('SR2'), ('R', 'akut'))
        self.assertEqual(classify('SR3.1'), ('R', 'non_akut'))

    def test_day_care_non_acute_kinds_pair_health_and_social(self):
        self.assertEqual(classify('D1.2'), ('D', 'akut'))
        self.assertEqual(classify('D8.1'), ('D', 'terstruktur'))
        self.assertEqual(classify('D 8.1'), ('D', 'terstruktur'))
        self.assertEqual(classify('SD3.2.1'), ('D', 'terstruktur'))
        self.assertEqual(classify('SD1.1.1'), ('D', 'pekerjaan'))

    def test_outpatient_columns(self):
        self.assertEqual(classify('O2.1'), ('O', 'akut_kunjungan'))
        self.assertEqual(classify('O4.1'), ('O', 'akut_fasilitas'))
        self.assertEqual(classify('O7.1'), ('O', 'non_akut_kunjungan'))
        self.assertEqual(classify('O10.1'), ('O', 'non_akut_fasilitas'))
        self.assertEqual(classify('SO1.3.1'), ('O', 'non_akut_kunjungan'))
        self.assertEqual(classify('SO2.3.1'), ('O', 'non_akut_fasilitas'))

    def test_information_topic_and_channel(self):
        self.assertEqual(classify('SI1.3'), ('I', 'sosial'))
        self.assertEqual(classify('I2.1.2'), ('I', 'media_sosial'))
        self.assertEqual(classify('SI2.2'), ('I', 'non_interaktif'))

    def test_parent_codes_name_no_column(self):
        for code in ['SR', 'I1', 'I2.1', 'DO', '', None]:
            self.assertIsNone(classify(code), code)


class BucketTests(SimpleTestCase):
    def test_types_map_to_report_buckets_loosely(self):
        self.assertEqual(bucket_keys(['Rumah Sakit Umum', 'Rumah Sakit Jiwa (RSJ)']), ['rs'])
        self.assertEqual(bucket_keys(['KLINIK ATAU BIRO PSIKOLOGI']), ['biro_psikologi'])
        self.assertEqual(bucket_keys(['Organisasi Berbasis Komunitas']), ['kader'])

    def test_unknown_or_missing_type_is_lainnya(self):
        self.assertEqual(bucket_keys(['Lembaga Swadaya Masyarakat (LSM)']), ['lainnya'])
        self.assertEqual(bucket_keys([]), ['lainnya'])


class SummarizeTests(SimpleTestCase):
    def test_multi_select_facility_counts_in_each_bucket(self):
        summary = summarize([
            Facility(1, 'RS A', facility_types=['Rumah Sakit Umum', 'Puskesmas'],
                     services={'O4.1': 30}),
        ])
        chart = {c['facility_type']: c for c in summary['chart']}
        self.assertEqual(chart['Rumah Sakit Umum']['O'], 1)
        self.assertEqual(chart['Puskesmas']['O'], 1)
        self.assertEqual(row(summary['rawat_jalan'], 'rs')['akut_fasilitas'], {'fasilitas': 1, 'jumlah': 30})
        # Each bucket's row counts it, so the total counts it twice.
        self.assertEqual(summary['rawat_jalan']['total']['akut_fasilitas']['fasilitas'], 2)

    def test_chart_counts_facilities_not_service_blocks(self):
        summary = summarize([
            Facility(1, 'Puskesmas A', facility_types=['Puskesmas'],
                     services={'O4.1': 10, 'O10.1': 5, 'SO2.3.1': 2}),
        ])
        chart = {c['facility_type']: c for c in summary['chart']}
        self.assertEqual(chart['Puskesmas']['O'], 1)

    def test_chart_keeps_q4_types_apart_where_buckets_merge_them(self):
        summary = summarize([
            Facility(1, 'RSU A', facility_types=['Rumah Sakit Umum'], services={'R1': 1}),
            Facility(2, 'RSJ B', facility_types=['Rumah Sakit Jiwa (RSJ)'], services={'R1': 1}),
            Facility(3, 'Pusk C', facility_types=['PUSKESMAS'], services={'O4.1': 1}),
            Facility(4, 'Pusk D', facility_types=['Puskesmas'], services={'O4.1': 1}),
            Facility(5, 'Tanpa jenis', services={'A2': 1}),
        ])
        chart = {c['facility_type']: c for c in summary['chart']}
        # No Q4 answer, no type to count under — as on the landing page.
        self.assertEqual(set(chart), {'Rumah Sakit Umum', 'Rumah Sakit Jiwa (RSJ)', 'PUSKESMAS'})
        self.assertEqual(chart['PUSKESMAS']['O'], 2)
        self.assertEqual(chart['PUSKESMAS']['total'], 2)

    def test_chart_counts_every_survey_while_tables_count_the_latest(self):
        early = datetime(2026, 7, 6, tzinfo=dt_timezone.utc)
        late = datetime(2026, 7, 28, tzinfo=dt_timezone.utc)
        summary = summarize([
            Facility(1, 'RSUD Prembun', early, ['Rumah Sakit Umum'], {'R1': 10}),
            Facility(2, 'RSUD Prembun', late, ['Rumah Sakit Umum'], {'R1': 10}),
        ])
        (row,) = summary['chart']
        self.assertEqual((row['total'], row['R']), (2, 2))
        self.assertEqual(summary['total_surveys'], 2)
        self.assertEqual(summary['total_facilities'], 1)
        self.assertEqual(len(summary['rawat_inap']), 1)

    def test_unreported_volume_is_zero(self):
        summary = summarize([
            Facility(1, 'Panti A', facility_types=['Panti Sosial/Lembaga Rehabilitasi Sosial/Pondok Pesantren'],
                     services={'SR4.1': 0}),
        ])
        self.assertEqual(summary['rawat_inap'], [{
            'id': 1, 'name': 'Panti A',
            'akut': {'tersedia': False, 'kapasitas': 0},
            'non_akut': {'tersedia': True, 'kapasitas': 0},
        }])

    def test_day_care_non_acute_kinds_share_one_capacity(self):
        summary = summarize([
            Facility(1, 'Rumah A', facility_types=['Puskesmas'],
                     services={'D1.1': 4, 'D8.1': 3, 'D9': 2}),
        ])
        (entry,) = summary['perawatan_harian']
        self.assertEqual(entry['akut'], {'tersedia': True, 'kapasitas': 4})
        self.assertEqual(entry['non_akut'], {
            'pekerjaan': False, 'persiapan_kerja': False,
            'terstruktur': True, 'tidak_terstruktur': True, 'kapasitas': 5,
        })

    def test_only_the_latest_survey_of_a_facility_counts(self):
        early = datetime(2026, 7, 6, tzinfo=dt_timezone.utc)
        late = datetime(2026, 7, 28, tzinfo=dt_timezone.utc)
        summary = summarize([
            Facility(1, 'Rsud prembun', early, ['Rumah Sakit Umum'], {'R1': 99}),
            Facility(2, 'RSUD  Prembun.', late, ['Rumah Sakit Umum'], {'R1': 10}),
        ])
        self.assertEqual(summary['total_facilities'], 1)
        self.assertEqual([(r['id'], r['akut']['kapasitas']) for r in summary['rawat_inap']], [(2, 10)])

    def test_lainnya_row_only_when_something_falls_into_it(self):
        base = Facility(1, 'A', facility_types=['Puskesmas'], services={'A2': 1})
        self.assertNotIn('lainnya', [p['key'] for p in summarize([base])['providers']])
        other = Facility(2, 'B', facility_types=['Lembaga Swadaya Masyarakat (LSM)'], services={'A2': 1})
        self.assertIn('lainnya', [p['key'] for p in summarize([base, other])['providers']])


class PenyediaLayananEndpointTests(TestCase):
    url = '/v1/surveys/responses/penyedia-layanan/'

    def setUp(self):
        self.surveyor = User.objects.create_user(
            email='s@example.com', password='pass', role=User.Role.SURVEYOR
        )
        self.template = SurveyTemplate.objects.create(name='OMMHA', code='T')
        section = QuestionSection.objects.create(template=self.template, code='S', name='S')
        self.q1 = Question.objects.create(section=section, code='Q1', question_text='Nama', answer_type='TEXT')
        self.q4 = Question.objects.create(
            section=section, code='Q4', question_text='Jenis', answer_type='MULTIPLE_CHOICE'
        )
        self.oqc = Question.objects.create(
            section=section, code='OQC', question_text='Kapasitas', answer_type='NUMBER'
        )
        self.puskesmas = QuestionChoice.objects.create(question=self.q4, value='p', label='Puskesmas')

    def survey(self, name, capacity, published=True):
        response = DynamicSurveyResponse.objects.create(
            template=self.template, surveyor=self.surveyor,
            survey_date=datetime(2026, 7, 1, tzinfo=dt_timezone.utc), is_published=published,
        )
        QuestionAnswer.objects.create(response=response, question=self.q1, text_value=name)
        QuestionAnswer.objects.create(response=response, question=self.q4).selected_choices.add(self.puskesmas)
        QuestionAnswer.objects.create(
            response=response, question=self.oqc, context_key='O4.1', number_value=capacity
        )
        return response

    def test_anonymous_caller_sees_published_surveys_only(self):
        self.survey('Puskesmas A', 30)
        self.survey('Puskesmas B', 70, published=False)

        response = APIClient().get(self.url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total_facilities'], 1)
        self.assertEqual(
            row(data['rawat_jalan'], 'puskesmas')['akut_fasilitas'], {'fasilitas': 1, 'jumlah': 30}
        )
