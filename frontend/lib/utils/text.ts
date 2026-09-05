/**
 * Survey answers arrive in whatever casing the questionnaire authored, and the
 * service descriptions are largely SHOUTED. These helpers calm that down
 * without corrupting the acronyms the copy depends on.
 */

/**
 * Acronyms that must survive lowercasing. ODGJ is the only one that appears in
 * the QL1/QL2 service descriptions, but the facility-type and legal-status
 * answers use the rest, so the set is shared.
 */
const ACRONYMS = new Set([
  'ODGJ', 'ODMK', 'BPJS', 'RS', 'RSJ', 'RSU', 'PKU', 'IGD', 'UGD',
  'TKSK', 'LSM', 'LKS', 'KKSJ', 'PT', 'CV', 'KTP', 'NIK', 'SK',
  'DESDE', 'LTC', 'WHO', 'RI',
]);

/**
 * Turns shouted survey copy into sentence case.
 *
 * Only fully-uppercase words are touched. Text the questionnaire already wrote
 * in mixed case — the parenthetical clarifications on several service
 * descriptions, for instance — is left exactly as authored, so this cannot
 * flatten a distinction someone made deliberately.
 */
export function toSentenceCase(input: string): string {
  if (!input) return input;

  const lowered = input.replace(/\p{Lu}[\p{Lu}\p{M}]*/gu, (word) => {
    // A single capital is a normal sentence start, not shouting.
    if (word.length < 2) return word;
    if (ACRONYMS.has(word)) return word;
    return word.toLowerCase();
  });

  // Re-capitalise sentence starts: the beginning of the string, and the first
  // letter after `.`, `!` or `?` (optionally through an opening bracket).
  return lowered.replace(
    /(^|[.!?]\s+\(?)(\p{Ll})/gu,
    (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()
  );
}

/**
 * Display label for a `kategori` value. The API stores FASKES / NON FASKES;
 * those are keys, not chrome, so they are shown in sentence case.
 */
export function kategoriLabel(kategori: string | null | undefined): string | null {
  if (!kategori) return null;
  if (kategori === 'FASKES') return 'Faskes';
  if (kategori === 'NON FASKES') return 'Non-faskes';
  return toSentenceCase(kategori);
}
