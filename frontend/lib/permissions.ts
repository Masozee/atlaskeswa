/**
 * Role-based Access Control (RBAC) for Yakkum
 * Define what each role can access
 */

export type UserRole = 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';

export interface Permission {
  path: string;
  roles: UserRole[];
  label: string;
  icon?: string;
}

// Define permissions for each menu/page
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_OVERVIEW: {
    path: '/dashboard/overview',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Dashboard Overview',
  },

  // Services Management
  SERVICES_VIEW: {
    path: '/dashboard/services',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'All Services',
  },
  SERVICES_CREATE: {
    path: '/dashboard/services/new',
    roles: ['ADMIN', 'SURVEYOR'],
    label: 'Add New Service',
  },
  SERVICES_CATEGORIES: {
    path: '/dashboard/services/categories',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Service Categories',
  },
  SERVICES_MTC: {
    path: '/dashboard/services/mtc',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Main Types of Care (MTC)',
  },
  SERVICES_TARGET_POPULATIONS: {
    path: '/dashboard/services/target-populations',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Target Populations',
  },
  SERVICES_SERVICE_TYPES: {
    path: '/dashboard/services/service-types',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Service Types',
  },

  // Survey Management
  SURVEY_VIEW: {
    path: '/dashboard/survey',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER'],
    label: 'All Survey Records',
  },
  SURVEY_CREATE: {
    path: '/dashboard/survey/new',
    roles: ['ADMIN', 'SURVEYOR'],
    label: 'New Survey Entry',
  },
  SURVEY_PENDING: {
    path: '/dashboard/survey/pending',
    roles: ['ADMIN', 'VERIFIER'],
    label: 'Pending Submissions',
  },
  SURVEY_APPROVED: {
    path: '/dashboard/survey/approved',
    roles: ['ADMIN', 'VERIFIER', 'VIEWER'],
    label: 'Approved Surveys',
  },
  SURVEY_REJECTED: {
    path: '/dashboard/survey/rejected',
    roles: ['ADMIN', 'VERIFIER'],
    label: 'Rejected Surveys',
  },
  SURVEY_BULK_UPLOAD: {
    path: '/dashboard/survey/bulk-upload',
    roles: ['ADMIN', 'SURVEYOR'],
    label: 'Bulk Upload',
  },
  SURVEY_AUDIT: {
    path: '/dashboard/survey/audit',
    roles: ['ADMIN', 'VERIFIER'],
    label: 'Audit Log',
  },

  // Verification Queue
  VERIFICATION_QUEUE: {
    path: '/dashboard/queue',
    roles: ['ADMIN', 'VERIFIER'],
    label: 'Verification Queue',
  },
  VERIFICATION_QUEUE_ALT: {
    path: '/verification/queue',
    roles: ['ADMIN', 'VERIFIER'],
    label: 'Verification Queue',
  },

  // Analytics (ADMIN and VIEWER only)
  ANALYTICS_OVERVIEW: {
    path: '/dashboard/analytics',
    roles: ['ADMIN', 'VIEWER'],
    label: 'Analytics Overview',
  },
  ANALYTICS_REPORTS: {
    path: '/dashboard/analytics/reports',
    roles: ['ADMIN', 'VIEWER'],
    label: 'Reports',
  },

  // User Management (ADMIN only)
  USERS_VIEW: {
    path: '/dashboard/users',
    roles: ['ADMIN'],
    label: 'User Management',
  },
  USERS_CREATE: {
    path: '/dashboard/users/new',
    roles: ['ADMIN'],
    label: 'Add New User',
  },

  // Settings
  SETTINGS: {
    path: '/dashboard/settings',
    roles: ['ADMIN', 'SURVEYOR', 'VERIFIER', 'VIEWER'],
    label: 'Settings',
  },
} as const;

/**
 * Check if user has permission to access a path
 */
export function hasPermission(userRole: UserRole | null | undefined, path: string): boolean {
  if (!userRole) return false;

  // Find permission for this path
  const permission = Object.values(PERMISSIONS).find((p) => p.path === path);

  // If no specific permission defined, deny access
  if (!permission) return false;

  // Check if user's role is in the allowed roles
  return (permission.roles as readonly UserRole[]).includes(userRole);
}

/**
 * Filter menu items based on user role
 */
export function filterMenuByRole(
  menuItems: Array<{ path: string; [key: string]: any }>,
  userRole: UserRole | null | undefined
): Array<{ path: string; [key: string]: any }> {
  if (!userRole) return [];

  return menuItems.filter((item) => {
    // Check if item has children
    if (item.items && Array.isArray(item.items)) {
      // Filter children recursively
      item.items = filterMenuByRole(item.items, userRole);
      // Keep parent if it has at least one visible child
      return item.items.length > 0;
    }

    // Check permission for this item
    return hasPermission(userRole, item.path);
  });
}

/**
 * Get all accessible paths for a user role
 */
export function getAccessiblePaths(userRole: UserRole | null | undefined): string[] {
  if (!userRole) return [];

  return Object.values(PERMISSIONS)
    .filter((permission) => (permission.roles as readonly UserRole[]).includes(userRole))
    .map((permission) => permission.path);
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(
  userRole: UserRole | null | undefined,
  action: 'create' | 'edit' | 'delete' | 'verify' | 'view'
): boolean {
  if (!userRole) return false;

  switch (action) {
    case 'create':
      return ['ADMIN', 'SURVEYOR'].includes(userRole);
    case 'edit':
      return ['ADMIN', 'SURVEYOR'].includes(userRole);
    case 'delete':
      return ['ADMIN'].includes(userRole);
    case 'verify':
      return ['ADMIN', 'VERIFIER'].includes(userRole);
    case 'view':
      return true; // All roles can view
    default:
      return false;
  }
}
