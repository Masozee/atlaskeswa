'use client';

/**
 * Form Draft Persistence Hook
 * Best practice: Auto-save form drafts to localStorage
 */

import { useCallback, useEffect, useRef } from 'react';

const DRAFT_PREFIX = 'yakkum-form-draft-';

interface UseFormPersistenceOptions<T> {
  /**
   * Unique key for this form (e.g., 'survey-new', 'service-edit-123')
   */
  key: string;
  /**
   * Debounce delay in milliseconds (default: 1000)
   */
  debounceMs?: number;
  /**
   * Whether persistence is enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook to persist form drafts to localStorage
 *
 * Usage:
 * ```tsx
 * const { saveDraft, loadDraft, clearDraft } = useFormPersistence<FormData>({
 *   key: 'survey-new',
 * });
 *
 * // Load draft on mount
 * useEffect(() => {
 *   const draft = loadDraft();
 *   if (draft) {
 *     form.reset(draft);
 *   }
 * }, []);
 *
 * // Save draft on change
 * useEffect(() => {
 *   saveDraft(formData);
 * }, [formData]);
 *
 * // Clear draft on successful submit
 * onSubmit: () => {
 *   clearDraft();
 * }
 * ```
 */
export function useFormPersistence<T extends Record<string, unknown>>({
  key,
  debounceMs = 1000,
  enabled = true,
}: UseFormPersistenceOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `${DRAFT_PREFIX}${key}`;

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback((): T | null => {
    if (!enabled || typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);

      // Drafts expire after 24 hours
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return data as T;
    } catch {
      return null;
    }
  }, [enabled, storageKey]);

  /**
   * Save draft to localStorage (debounced)
   */
  const saveDraft = useCallback(
    (data: T) => {
      if (!enabled || typeof window === 'undefined') return;

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce save
      timeoutRef.current = setTimeout(() => {
        try {
          const payload = {
            data,
            timestamp: Date.now(),
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
          // Ignore storage errors (quota exceeded, etc.)
        }
      }, debounceMs);
    },
    [enabled, storageKey, debounceMs]
  );

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  /**
   * Check if draft exists
   */
  const hasDraft = useCallback((): boolean => {
    if (!enabled || typeof window === 'undefined') return false;

    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [enabled, storageKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}

/**
 * Clear all form drafts
 * Use this when user logs out or to clean up storage
 */
export function clearAllFormDrafts() {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(DRAFT_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore errors
  }
}
