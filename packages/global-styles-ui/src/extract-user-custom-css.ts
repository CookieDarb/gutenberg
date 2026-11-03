/**
 * Normalizes newlines to standard UNIX format.
 *
 * @param str The string to normalize.
 * @return The normalized string.
 */
function normalizeNewlines( str: string ): string {
	return str.replace( /\r\n/g, '\n' );
}

/**
 * Extracts user-authored Additional CSS from user styles by removing
 * the custom CSS contributed by the active theme style variation.
 *
 * When a style variation is selected, its custom CSS is prepended to the
 * user's custom CSS in the Global Styles config. This function isolates the
 * user-authored portion by stripping only that active variation's CSS prefix.
 *
 * @param userCss            Current user styles CSS (with variation CSS prepended).
 * @param activeVariationCss Custom CSS from the active variation being switched away from.
 * @return Remaining user-authored CSS, if any.
 */
export function extractUserCustomCss(
	userCss: string | undefined,
	activeVariationCss: string | undefined
): string {
	if ( ! userCss?.trim() ) {
		return '';
	}

	if ( ! activeVariationCss?.trim() ) {
		return userCss.trim();
	}

	const normalizedUser = normalizeNewlines( userCss ).trim();
	const normalizedActive = normalizeNewlines( activeVariationCss ).trim();

	// Variation CSS is always prepended to user styles when a variation is selected.
	// Only slice off the variation CSS if user styles start with it.
	if ( normalizedUser.startsWith( normalizedActive ) ) {
		return normalizedUser.slice( normalizedActive.length ).trim();
	}

	return normalizedUser;
}
