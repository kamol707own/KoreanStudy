/**
 * Prints the English content corpus as a single JSON document on stdout.
 * This is the "source of truth" snapshot the translator consumes. It is
 * derived straight from the data modules so it never drifts out of sync.
 *
 * Run via tsx (resolves the @/ path alias): `npx tsx scripts/i18n/dump-en.mts`
 */
import { englishContent } from '../../src/lib/i18n/content'

process.stdout.write(JSON.stringify(englishContent, null, 2))
