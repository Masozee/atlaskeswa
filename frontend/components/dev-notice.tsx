import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';

/**
 * Pre-launch notice, shown on every public surface. Lifted out of the landing
 * page so the wording and treatment stay in one place.
 *
 * Deliberately carries no live-region role: the text never changes, and
 * `role="status"` would have it announced on every page load as if it had.
 */
export function DevNotice() {
  return (
    <div className="bg-amber-500/90 text-amber-950 py-3">
      <div className={`${PUBLIC_CONTAINER} flex items-center justify-center gap-3`}>
        <HugeiconsIcon icon={Alert02Icon} size={20} className="flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          Situs ini masih dalam tahap pengembangan. Beberapa fitur mungkin belum tersedia atau
          berfungsi dengan sempurna.
        </p>
      </div>
    </div>
  );
}
