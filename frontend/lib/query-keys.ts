/**
 * Query Key Factory - Centralized query key management
 * Best practice: Use a factory pattern for consistent query keys
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/community/lukemorales-query-key-factory
 */

export const queryKeys = {
  // Auth & Users
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    me: () => [...queryKeys.auth.user(), 'me'] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    infinite: (params?: Record<string, unknown>) => [...queryKeys.users.all, 'infinite', params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  // Surveys
  surveys: {
    all: ['surveys'] as const,
    lists: () => [...queryKeys.surveys.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.surveys.lists(), params] as const,
    infinite: (params?: Record<string, unknown>) => [...queryKeys.surveys.all, 'infinite', params] as const,
    details: () => [...queryKeys.surveys.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.surveys.details(), id] as const,
    stats: () => [...queryKeys.surveys.all, 'stats'] as const,
    attachments: (surveyId: number) => [...queryKeys.surveys.detail(surveyId), 'attachments'] as const,
    auditLogs: (surveyId: number) => [...queryKeys.surveys.detail(surveyId), 'audit-logs'] as const,
  },

  // Services (Directory)
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.services.lists(), params] as const,
    infinite: (params?: Record<string, unknown>) => [...queryKeys.services.all, 'infinite', params] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.services.details(), id] as const,
    stats: () => [...queryKeys.services.all, 'stats'] as const,
    map: () => [...queryKeys.services.all, 'map'] as const,
  },

  // Classifications
  mtc: {
    all: ['mtc'] as const,
    list: () => [...queryKeys.mtc.all, 'list'] as const,
    tree: () => [...queryKeys.mtc.all, 'tree'] as const,
  },

  bsic: {
    all: ['bsic'] as const,
    list: () => [...queryKeys.bsic.all, 'list'] as const,
  },

  targetPopulations: {
    all: ['target-populations'] as const,
    list: () => [...queryKeys.targetPopulations.all, 'list'] as const,
  },

  serviceTypes: {
    all: ['service-types'] as const,
    list: () => [...queryKeys.serviceTypes.all, 'list'] as const,
  },

  // Logs
  activityLogs: {
    all: ['activity-logs'] as const,
    lists: () => [...queryKeys.activityLogs.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.activityLogs.lists(), params] as const,
  },

  systemErrors: {
    all: ['system-errors'] as const,
    lists: () => [...queryKeys.systemErrors.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.systemErrors.lists(), params] as const,
  },

  auditLogs: {
    all: ['audit-logs'] as const,
    lists: () => [...queryKeys.auditLogs.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.auditLogs.lists(), params] as const,
  },

  // Logs (various types)
  logs: {
    all: ['logs'] as const,
    activity: () => [...queryKeys.logs.all, 'activity'] as const,
    activityList: (params?: Record<string, unknown>) => [...queryKeys.logs.activity(), params] as const,
    activityStats: () => [...queryKeys.logs.activity(), 'stats'] as const,
    verification: () => [...queryKeys.logs.all, 'verification'] as const,
    verificationList: (params?: Record<string, unknown>) => [...queryKeys.logs.verification(), params] as const,
    verificationStats: () => [...queryKeys.logs.verification(), 'stats'] as const,
    dataChanges: () => [...queryKeys.logs.all, 'data-changes'] as const,
    dataChangesList: (params?: Record<string, unknown>) => [...queryKeys.logs.dataChanges(), params] as const,
    dataChangesStats: () => [...queryKeys.logs.dataChanges(), 'stats'] as const,
    errors: () => [...queryKeys.logs.all, 'errors'] as const,
    errorsList: (params?: Record<string, unknown>) => [...queryKeys.logs.errors(), params] as const,
    errorsStats: () => [...queryKeys.logs.errors(), 'stats'] as const,
    importExport: () => [...queryKeys.logs.all, 'import-export'] as const,
    importExportList: (params?: Record<string, unknown>) => [...queryKeys.logs.importExport(), params] as const,
    importExportStats: () => [...queryKeys.logs.importExport(), 'stats'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    services: () => [...queryKeys.analytics.all, 'services'] as const,
    surveys: () => [...queryKeys.analytics.all, 'surveys'] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    user: () => [...queryKeys.settings.all, 'user'] as const,
  },
} as const;

// Type helper to extract query key types
export type QueryKeys = typeof queryKeys;
