import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'yakkum.db';
const DB_VERSION = 1;

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    // Skip database initialization on web platform
    if (Platform.OS === 'web') {
      console.warn('SQLite not supported on web platform');
      return;
    }

    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Services table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        address TEXT,
        synced INTEGER DEFAULT 1,
        last_updated INTEGER,
        data TEXT
      );
    `);

    // Surveys table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        service_id INTEGER,
        service_name TEXT,
        service_city TEXT,
        service_address TEXT,
        survey_date TEXT,
        survey_period_start TEXT,
        survey_period_end TEXT,
        latitude REAL,
        longitude REAL,
        location_accuracy REAL,
        current_bed_capacity INTEGER DEFAULT 0,
        beds_occupied INTEGER DEFAULT 0,
        current_psychiatrist_count INTEGER DEFAULT 0,
        current_psychologist_count INTEGER DEFAULT 0,
        current_nurse_count INTEGER DEFAULT 0,
        current_social_worker_count INTEGER DEFAULT 0,
        total_patients_served INTEGER DEFAULT 0,
        new_patients INTEGER DEFAULT 0,
        returning_patients INTEGER DEFAULT 0,
        patients_male INTEGER DEFAULT 0,
        patients_female INTEGER DEFAULT 0,
        patients_age_0_17 INTEGER DEFAULT 0,
        patients_age_18_64 INTEGER DEFAULT 0,
        patients_age_65_plus INTEGER DEFAULT 0,
        bpjs_patients INTEGER DEFAULT 0,
        private_insurance_patients INTEGER DEFAULT 0,
        self_pay_patients INTEGER DEFAULT 0,
        monthly_budget TEXT,
        patient_satisfaction_score REAL,
        average_wait_time_days REAL,
        surveyor_notes TEXT,
        challenges_faced TEXT,
        improvements_needed TEXT,
        additional_notes TEXT,
        verification_status TEXT DEFAULT 'DRAFT',
        status_display TEXT,
        surveyor_name TEXT,
        synced INTEGER DEFAULT 0,
        pending_action TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    // Sync queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        table_name TEXT NOT NULL,
        local_id INTEGER,
        data TEXT NOT NULL,
        timestamp INTEGER,
        retries INTEGER DEFAULT 0
      );
    `);

    // Dashboard stats cache
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT,
        last_updated INTEGER
      );
    `);

    // Sync metadata
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_sync_time INTEGER,
        last_sync_status TEXT
      );
    `);
  }

  // Services methods
  async saveServices(services: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('DELETE FROM services');

    for (const service of services) {
      await this.db.runAsync(
        `INSERT INTO services (id, name, city, address, synced, last_updated, data)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [
          service.id,
          service.name,
          service.city || '',
          service.address || '',
          Date.now(),
          JSON.stringify(service)
        ]
      );
    }
  }

  async getServices(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync('SELECT * FROM services ORDER BY name');
    return result.map((row: any) => JSON.parse(row.data));
  }

  // Surveys methods
  async saveSurvey(survey: any, localOnly: boolean = false): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const result = await this.db.runAsync(
      `INSERT INTO surveys (
        server_id, service_id, service_name, service_city, service_address,
        survey_date, survey_period_start, survey_period_end,
        latitude, longitude, location_accuracy,
        current_bed_capacity, beds_occupied,
        current_psychiatrist_count, current_psychologist_count,
        current_nurse_count, current_social_worker_count,
        total_patients_served, new_patients, returning_patients,
        patients_male, patients_female,
        patients_age_0_17, patients_age_18_64, patients_age_65_plus,
        bpjs_patients, private_insurance_patients, self_pay_patients,
        monthly_budget, patient_satisfaction_score, average_wait_time_days,
        surveyor_notes, challenges_faced, improvements_needed, additional_notes,
        verification_status, status_display, surveyor_name,
        synced, pending_action, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        survey.server_id || null,
        survey.service,
        survey.service_name || '',
        survey.service_city || '',
        survey.service_address || '',
        survey.survey_date,
        survey.survey_period_start,
        survey.survey_period_end,
        survey.latitude,
        survey.longitude,
        survey.location_accuracy,
        survey.current_bed_capacity,
        survey.beds_occupied,
        survey.current_psychiatrist_count,
        survey.current_psychologist_count,
        survey.current_nurse_count,
        survey.current_social_worker_count,
        survey.total_patients_served,
        survey.new_patients,
        survey.returning_patients,
        survey.patients_male,
        survey.patients_female,
        survey.patients_age_0_17,
        survey.patients_age_18_64,
        survey.patients_age_65_plus,
        survey.bpjs_patients,
        survey.private_insurance_patients,
        survey.self_pay_patients,
        survey.monthly_budget,
        survey.patient_satisfaction_score,
        survey.average_wait_time_days,
        survey.surveyor_notes,
        survey.challenges_faced,
        survey.improvements_needed,
        survey.additional_notes,
        survey.verification_status || 'DRAFT',
        survey.status_display || 'Draft',
        survey.surveyor_name || '',
        localOnly ? 0 : 1,
        localOnly ? 'create' : null,
        now,
        now
      ]
    );

    return result.lastInsertRowId;
  }

  async updateSurvey(localId: number, survey: any, localOnly: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE surveys SET
        service_id = ?, service_name = ?, service_city = ?, service_address = ?,
        survey_date = ?, survey_period_start = ?, survey_period_end = ?,
        latitude = ?, longitude = ?, location_accuracy = ?,
        current_bed_capacity = ?, beds_occupied = ?,
        current_psychiatrist_count = ?, current_psychologist_count = ?,
        current_nurse_count = ?, current_social_worker_count = ?,
        total_patients_served = ?, new_patients = ?, returning_patients = ?,
        patients_male = ?, patients_female = ?,
        patients_age_0_17 = ?, patients_age_18_64 = ?, patients_age_65_plus = ?,
        bpjs_patients = ?, private_insurance_patients = ?, self_pay_patients = ?,
        monthly_budget = ?, patient_satisfaction_score = ?, average_wait_time_days = ?,
        surveyor_notes = ?, challenges_faced = ?, improvements_needed = ?, additional_notes = ?,
        verification_status = ?, status_display = ?, surveyor_name = ?,
        synced = ?, pending_action = ?, updated_at = ?
      WHERE id = ?`,
      [
        survey.service,
        survey.service_name || '',
        survey.service_city || '',
        survey.service_address || '',
        survey.survey_date,
        survey.survey_period_start,
        survey.survey_period_end,
        survey.latitude,
        survey.longitude,
        survey.location_accuracy,
        survey.current_bed_capacity,
        survey.beds_occupied,
        survey.current_psychiatrist_count,
        survey.current_psychologist_count,
        survey.current_nurse_count,
        survey.current_social_worker_count,
        survey.total_patients_served,
        survey.new_patients,
        survey.returning_patients,
        survey.patients_male,
        survey.patients_female,
        survey.patients_age_0_17,
        survey.patients_age_18_64,
        survey.patients_age_65_plus,
        survey.bpjs_patients,
        survey.private_insurance_patients,
        survey.self_pay_patients,
        survey.monthly_budget,
        survey.patient_satisfaction_score,
        survey.average_wait_time_days,
        survey.surveyor_notes,
        survey.challenges_faced,
        survey.improvements_needed,
        survey.additional_notes,
        survey.verification_status || 'DRAFT',
        survey.status_display || 'Draft',
        survey.surveyor_name || '',
        localOnly ? 0 : 1,
        localOnly ? 'update' : null,
        Date.now(),
        localId
      ]
    );
  }

  async getSurveys(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM surveys ORDER BY created_at DESC'
    );
    return result;
  }

  async getSurvey(localId: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM surveys WHERE id = ?',
      [localId]
    );
    return result || null;
  }

  async getPendingSyncCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM surveys WHERE synced = 0'
    ) as any;
    return result.count;
  }

  async getPendingSurveys(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM surveys WHERE synced = 0 ORDER BY created_at'
    );
    return result;
  }

  async markSurveySynced(localId: number, serverId?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE surveys SET synced = 1, pending_action = NULL, server_id = ? WHERE id = ?',
      [serverId || null, localId]
    );
  }

  // Dashboard cache
  async saveDashboardCache(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO dashboard_cache (id, data, last_updated)
       VALUES (1, ?, ?)`,
      [JSON.stringify(data), Date.now()]
    );
  }

  async getDashboardCache(): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM dashboard_cache WHERE id = 1'
    ) as any;

    if (!result) return null;

    // Cache valid for 5 minutes
    const cacheAge = Date.now() - result.last_updated;
    if (cacheAge > 5 * 60 * 1000) return null;

    return JSON.parse(result.data);
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('DELETE FROM services');
    // Only delete synced surveys to preserve local pending changes
    await this.db.execAsync('DELETE FROM surveys WHERE synced = 1');
    await this.db.execAsync('DELETE FROM dashboard_cache');
  }

  // Sync metadata methods
  async updateLastSyncTime(status: 'success' | 'failed'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (id, last_sync_time, last_sync_status)
       VALUES (1, ?, ?)`,
      [Date.now(), status]
    );
  }

  async getLastSyncTime(): Promise<{ time: number | null; status: string | null }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM sync_metadata WHERE id = 1'
    ) as any;

    if (!result) {
      return { time: null, status: null };
    }

    return {
      time: result.last_sync_time,
      status: result.last_sync_status,
    };
  }
}

export const database = new Database();
