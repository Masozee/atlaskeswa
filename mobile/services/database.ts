import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'yakkum_v2.db';

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private ready = false;

  isInitialized(): boolean {
    return this.ready;
  }

  async init(): Promise<void> {
    if (this.db) return;

    if (Platform.OS === 'web') {
      console.warn('SQLite not supported on web platform');
      return;
    }

    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
    this.ready = true;
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

    // Survey templates cache
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS survey_templates (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER
      );
    `);

    // Geographic units cache
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS geographic_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        parent INTEGER,
        data TEXT
      );
    `);

    // Surveys table — dynamic form with answers_json
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        template_id INTEGER,
        service_id INTEGER,
        service_name TEXT,
        service_city TEXT,
        survey_date TEXT,
        survey_period_start TEXT,
        survey_period_end TEXT,
        gps_latitude REAL,
        gps_longitude REAL,
        answers_json TEXT,
        verification_status TEXT DEFAULT 'DRAFT',
        synced INTEGER DEFAULT 0,
        pending_action TEXT,
        created_at INTEGER,
        updated_at INTEGER
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

    // App settings (key-value store)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Survey photos (local cache)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS survey_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        survey_local_id INTEGER,
        survey_server_id INTEGER,
        local_uri TEXT,
        server_image_url TEXT,
        caption TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
  }

  // ── Services ──────────────────────────────────────────────────────────────

  async saveServices(services: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('DELETE FROM services');
    for (const service of services) {
      await this.db.runAsync(
        `INSERT INTO services (id, name, city, address, synced, last_updated, data)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [service.id, service.name, service.city || '', service.address || '', Date.now(), JSON.stringify(service)]
      );
    }
  }

  async getServices(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM services ORDER BY name');
    return result.map((row: any) => JSON.parse(row.data));
  }

  // ── Survey templates ──────────────────────────────────────────────────────

  async saveTemplate(id: number, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO survey_templates (id, data, cached_at) VALUES (?, ?, ?)',
      [id, JSON.stringify(data), Date.now()]
    );
  }

  async getTemplate(id: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync(
      'SELECT data FROM survey_templates WHERE id = ?',
      [id]
    ) as any;
    return row ? JSON.parse(row.data) : null;
  }

  async getLatestTemplate(): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const row = await this.db.getFirstAsync(
      'SELECT data FROM survey_templates ORDER BY cached_at DESC LIMIT 1'
    ) as any;
    return row ? JSON.parse(row.data) : null;
  }

  // ── Geographic units ──────────────────────────────────────────────────────

  async saveGeographicUnits(level: string, parent: number, items: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'DELETE FROM geographic_units WHERE level = ? AND parent = ?',
      [level, parent]
    );
    for (const item of items) {
      await this.db.runAsync(
        'INSERT INTO geographic_units (level, parent, data) VALUES (?, ?, ?)',
        [level, parent, JSON.stringify(item)]
      );
    }
  }

  async getGeographicUnits(level: string, parent: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const rows = await this.db.getAllAsync(
      'SELECT data FROM geographic_units WHERE level = ? AND parent = ?',
      [level, parent]
    ) as any[];
    return rows.map((r) => JSON.parse(r.data));
  }

  // ── Surveys ───────────────────────────────────────────────────────────────

  async saveSurveyLocal(survey: {
    server_id?: number | null;
    template_id: number;
    service_id: number;
    service_name?: string;
    service_city?: string;
    survey_date: string;
    survey_period_start?: string;
    survey_period_end?: string;
    gps_latitude?: number | null;
    gps_longitude?: number | null;
    answers_json: string;
    verification_status?: string;
    pending_action: 'create' | 'update';
  }): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const result = await this.db.runAsync(
      `INSERT INTO surveys (
        server_id, template_id, service_id, service_name, service_city,
        survey_date, survey_period_start, survey_period_end,
        gps_latitude, gps_longitude, answers_json,
        verification_status, synced, pending_action, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        survey.server_id ?? null,
        survey.template_id,
        survey.service_id,
        survey.service_name ?? '',
        survey.service_city ?? '',
        survey.survey_date,
        survey.survey_period_start ?? null,
        survey.survey_period_end ?? null,
        survey.gps_latitude ?? null,
        survey.gps_longitude ?? null,
        survey.answers_json,
        survey.verification_status ?? 'DRAFT',
        survey.pending_action,
        now,
        now,
      ]
    );
    return result.lastInsertRowId;
  }

  async updateSurveyLocal(localId: number, survey: {
    service_id?: number;
    service_name?: string;
    service_city?: string;
    survey_date?: string;
    survey_period_start?: string | null;
    survey_period_end?: string | null;
    gps_latitude?: number | null;
    gps_longitude?: number | null;
    answers_json?: string;
    verification_status?: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (survey.service_id !== undefined) { fields.push('service_id = ?'); values.push(survey.service_id); }
    if (survey.service_name !== undefined) { fields.push('service_name = ?'); values.push(survey.service_name); }
    if (survey.service_city !== undefined) { fields.push('service_city = ?'); values.push(survey.service_city); }
    if (survey.survey_date !== undefined) { fields.push('survey_date = ?'); values.push(survey.survey_date); }
    if (survey.survey_period_start !== undefined) { fields.push('survey_period_start = ?'); values.push(survey.survey_period_start); }
    if (survey.survey_period_end !== undefined) { fields.push('survey_period_end = ?'); values.push(survey.survey_period_end); }
    if (survey.gps_latitude !== undefined) { fields.push('gps_latitude = ?'); values.push(survey.gps_latitude); }
    if (survey.gps_longitude !== undefined) { fields.push('gps_longitude = ?'); values.push(survey.gps_longitude); }
    if (survey.answers_json !== undefined) { fields.push('answers_json = ?'); values.push(survey.answers_json); }
    if (survey.verification_status !== undefined) { fields.push('verification_status = ?'); values.push(survey.verification_status); }

    if (fields.length === 0) return;

    fields.push('synced = 0', 'pending_action = COALESCE(pending_action, \'update\')', 'updated_at = ?');
    values.push(Date.now(), localId);

    await this.db.runAsync(
      `UPDATE surveys SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getSurveys(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync('SELECT * FROM surveys ORDER BY created_at DESC');
  }

  async getExistingSurveyForService(serviceId: number, templateId: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    // Only check for DRAFT surveys - submitted surveys shouldn't block creating new ones
    // Order by created_at desc to get the most recent first
    const result = await this.db.getFirstAsync(
      "SELECT * FROM surveys WHERE service_id = ? AND template_id = ? AND verification_status = 'DRAFT' ORDER BY created_at DESC LIMIT 1",
      [serviceId, templateId]
    );
    return result || null;
  }

  async getSurvey(localId: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM surveys WHERE id = ?', [localId]);
    return result || null;
  }

  async getSurveyByServerId(serverId: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync(
      'SELECT * FROM surveys WHERE server_id = ? ORDER BY updated_at DESC LIMIT 1',
      [serverId]
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
    return this.db.getAllAsync('SELECT * FROM surveys WHERE synced = 0 ORDER BY created_at');
  }

  async markSurveySynced(localId: number, serverId?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE surveys SET synced = 1, pending_action = NULL, server_id = ? WHERE id = ?',
      [serverId ?? null, localId]
    );
  }

  async deleteSurvey(localId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM survey_photos WHERE survey_local_id = ?', [localId]);
    await this.db.runAsync('DELETE FROM surveys WHERE id = ?', [localId]);
  }

  async setSurveyServerId(localId: number, serverId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE surveys SET server_id = ?, updated_at = ? WHERE id = ?',
      [serverId, Date.now(), localId]
    );
  }

  // ── Legacy compat (used by SurveyFormScreen) ─────────────────────────────

  /** @deprecated Use saveSurveyLocal instead */
  async saveSurvey(survey: any, _localOnly: boolean = false): Promise<number> {
    return this.saveSurveyLocal({
      server_id: survey.server_id ?? null,
      template_id: survey.template_id ?? 0,
      service_id: survey.service_id ?? survey.service ?? 0,
      service_name: survey.service_name ?? '',
      service_city: survey.service_city ?? '',
      survey_date: survey.survey_date ?? new Date().toISOString().split('T')[0],
      survey_period_start: survey.survey_period_start ?? '',
      survey_period_end: survey.survey_period_end ?? '',
      gps_latitude: survey.latitude ?? null,
      gps_longitude: survey.longitude ?? null,
      answers_json: JSON.stringify(survey),
      verification_status: survey.verification_status ?? 'DRAFT',
      pending_action: 'create',
    });
  }

  /** @deprecated Use updateSurveyLocal instead */
  async updateSurvey(localId: number, survey: any, _localOnly: boolean = false): Promise<void> {
    return this.updateSurveyLocal(localId, {
      service_id: survey.service_id ?? survey.service,
      service_name: survey.service_name,
      service_city: survey.service_city,
      survey_date: survey.survey_date,
      survey_period_start: survey.survey_period_start,
      survey_period_end: survey.survey_period_end,
      gps_latitude: survey.latitude ?? null,
      gps_longitude: survey.longitude ?? null,
      answers_json: JSON.stringify(survey),
      verification_status: survey.verification_status,
    });
  }

  // ── Dashboard cache ───────────────────────────────────────────────────────

  async saveDashboardCache(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO dashboard_cache (id, data, last_updated) VALUES (1, ?, ?)',
      [JSON.stringify(data), Date.now()]
    );
  }

  async getDashboardCache(): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM dashboard_cache WHERE id = 1') as any;
    if (!result) return null;
    if (Date.now() - result.last_updated > 5 * 60 * 1000) return null;
    return JSON.parse(result.data);
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.execAsync('DELETE FROM services');
    await this.db.execAsync('DELETE FROM surveys WHERE synced = 1');
    await this.db.execAsync('DELETE FROM dashboard_cache');
  }

  // ── Sync metadata ─────────────────────────────────────────────────────────

  async updateLastSyncTime(status: 'success' | 'failed' | 'partial'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sync_metadata (id, last_sync_time, last_sync_status) VALUES (1, ?, ?)',
      [Date.now(), status]
    );
  }

  async getLastSyncTime(): Promise<{ time: number | null; status: string | null }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM sync_metadata WHERE id = 1') as any;
    if (!result) return { time: null, status: null };
    return { time: result.last_sync_time, status: result.last_sync_status };
  }

  // ── App settings ──────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<string | null> {
    if (!this.db) return AsyncStorage.getItem(`setting_${key}`);
    const result = await this.db.getFirstAsync(
      'SELECT value FROM app_settings WHERE key = ?', [key]
    ) as any;
    return result ? result.value : null;
  }

  async saveSetting(key: string, value: string): Promise<void> {
    if (!this.db) {
      await AsyncStorage.setItem(`setting_${key}`, value);
      return;
    }
    await this.db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]
    );
  }

  async getApiBaseUrl(): Promise<string | null> {
    return this.getSetting('api_base_url');
  }

  async saveApiBaseUrl(url: string): Promise<void> {
    return this.saveSetting('api_base_url', url);
  }

  // ── Survey photos ───────────────────────────────────────────────────────────

  async saveSurveyPhotoLocal(photo: {
    server_id?: number | null;
    survey_local_id?: number | null;
    survey_server_id?: number | null;
    local_uri: string;
    server_image_url?: string;
    caption?: string;
  }): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      `INSERT INTO survey_photos (server_id, survey_local_id, survey_server_id, local_uri, server_image_url, caption, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        photo.server_id ?? null,
        photo.survey_local_id ?? null,
        photo.survey_server_id ?? null,
        photo.local_uri,
        photo.server_image_url ?? null,
        photo.caption ?? null,
        Date.now(),
      ]
    );
    return result.lastInsertRowId;
  }

  async getSurveyPhotosForLocalSurvey(localId: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync(
      'SELECT * FROM survey_photos WHERE survey_local_id = ? ORDER BY created_at DESC',
      [localId]
    );
  }

  async getPendingSurveyPhotosForLocalSurvey(localId: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync(
      'SELECT * FROM survey_photos WHERE survey_local_id = ? AND synced = 0 ORDER BY created_at ASC',
      [localId]
    );
  }

  async getSurveyPhotosForServerSurvey(serverId: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync(
      'SELECT * FROM survey_photos WHERE survey_server_id = ? ORDER BY created_at DESC',
      [serverId]
    );
  }

  async markPhotoSynced(localId: number, serverId: number, serverImageUrl: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE survey_photos SET synced = 1, server_id = ?, server_image_url = ? WHERE id = ?',
      [serverId, serverImageUrl, localId]
    );
  }

  async updatePhotoLocal(localId: number, photo: {
    local_uri?: string;
    caption?: string | null;
    synced?: boolean;
    server_id?: number | null;
    server_image_url?: string | null;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (photo.local_uri !== undefined) { fields.push('local_uri = ?'); values.push(photo.local_uri); }
    if (photo.caption !== undefined) { fields.push('caption = ?'); values.push(photo.caption); }
    if (photo.synced !== undefined) { fields.push('synced = ?'); values.push(photo.synced ? 1 : 0); }
    if (photo.server_id !== undefined) { fields.push('server_id = ?'); values.push(photo.server_id); }
    if (photo.server_image_url !== undefined) { fields.push('server_image_url = ?'); values.push(photo.server_image_url); }

    if (fields.length === 0) return;

    values.push(localId);

    await this.db.runAsync(
      `UPDATE survey_photos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async setSurveyServerIdForPhotos(localSurveyId: number, serverId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE survey_photos SET survey_server_id = ? WHERE survey_local_id = ?',
      [serverId, localSurveyId]
    );
  }

  async deletePhoto(localId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM survey_photos WHERE id = ?', [localId]);
  }
}

export const database = new Database();
