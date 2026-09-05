/**
 * Shared container geometry for the public (non-dashboard) surfaces, so the
 * notice banner, nav, page content and footer all align on the same edges.
 *
 * This lives in a plain module rather than in `public-nav.tsx`: that file is a
 * client component, and a constant imported from a client module into a server
 * component arrives as a client-reference stub instead of the string, which
 * silently produces a broken className. `login` and `signup` are server
 * components, so they hit exactly that.
 */
export const PUBLIC_CONTAINER = 'container max-w-7xl mx-auto px-4';
