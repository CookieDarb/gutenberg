import { describe, expect, it } from 'vitest';
import { extractUserCustomCss } from '../extract-user-custom-css';

describe( 'extractUserCustomCss', () => {
	const variationCss =
		'body { padding: 30px; } .wp-site-blocks { max-width: 1340px; }';

	describe( 'basic handling and empty states', () => {
		it( 'returns an empty string when user CSS is empty or whitespace', () => {
			expect( extractUserCustomCss( undefined, variationCss ) ).toBe(
				''
			);
			expect( extractUserCustomCss( '', variationCss ) ).toBe( '' );
			expect( extractUserCustomCss( '   ', variationCss ) ).toBe( '' );
		} );

		it( 'returns user CSS unchanged when no variation CSS is provided', () => {
			const userCss = '.my-button { background: purple; }';
			expect( extractUserCustomCss( userCss, undefined ) ).toBe(
				userCss
			);
			expect( extractUserCustomCss( userCss, '' ) ).toBe( userCss );
			expect( extractUserCustomCss( userCss, '   ' ) ).toBe( userCss );
		} );

		it( 'returns an empty string when user CSS consists solely of the variation CSS', () => {
			expect( extractUserCustomCss( variationCss, variationCss ) ).toBe(
				''
			);
			expect(
				extractUserCustomCss( `  ${ variationCss }  `, variationCss )
			).toBe( '' );
		} );
	} );

	describe( 'preserving user-authored Additional CSS', () => {
		it( 'preserves user-authored CSS when prepended with variation CSS', () => {
			const userAdditionalCss =
				'.hero-banner { color: #fff; font-size: 2rem; }';
			const fullCss = `${ variationCss } ${ userAdditionalCss }`;

			expect( extractUserCustomCss( fullCss, variationCss ) ).toBe(
				userAdditionalCss
			);
		} );

		it( 'preserves user CSS when the user rule matches the variation rule', () => {
			// When both the variation and user define the same rule, concatenation creates
			// duplicate rules. Stripping the variation prefix must preserve the user copy.
			const sharedRule = 'a { color: red; }';
			const fullCss = `${ sharedRule } ${ sharedRule }`;

			expect( extractUserCustomCss( fullCss, sharedRule ) ).toBe(
				sharedRule
			);
		} );

		it( 'does not strip a user selector when the variation rule matches a substring of the selector', () => {
			const shortVariationCss = 'a { color: red; }';
			const userScopedCss = '.site-footer a { color: red; }';

			expect(
				extractUserCustomCss( userScopedCss, shortVariationCss )
			).toBe( userScopedCss );
		} );

		it( 'preserves user CSS when the active variation has no custom CSS', () => {
			const userCss = 'body { margin: 0; }';

			expect( extractUserCustomCss( userCss, undefined ) ).toBe(
				userCss
			);
		} );

		it( 'preserves both prior Additional CSS and subsequently added Additional CSS', () => {
			const priorCss = '.btn { color: red; }';
			const subsequentCss = '.footer { margin: 0; }';
			const combined = `${ variationCss } ${ priorCss } ${ subsequentCss }`;

			expect( extractUserCustomCss( combined, variationCss ) ).toBe(
				`${ priorCss } ${ subsequentCss }`
			);
		} );
	} );

	describe( 'formatting and multiline normalization', () => {
		it( 'normalizes newlines, tabs, and multiline formatting differences', () => {
			const multilineVariation = `body {
	padding: 30px;
}
.wp-site-blocks {
	max-width: 1340px;
}`;
			const userCustom = '.card { border-radius: 8px; }';
			const fullCss = `${ multilineVariation }\n\n${ userCustom }`;

			expect( extractUserCustomCss( fullCss, multilineVariation ) ).toBe(
				userCustom
			);
		} );
	} );

	describe( 'block-level custom CSS', () => {
		it( 'extracts block-level custom CSS correctly', () => {
			const variationBlockCss = '.wp-block-group { padding: 10px; }';
			const userBlockCss = '.custom-group-inner { margin-top: 5px; }';
			const combined = `${ variationBlockCss } ${ userBlockCss }`;

			expect( extractUserCustomCss( combined, variationBlockCss ) ).toBe(
				userBlockCss
			);
		} );
	} );
} );
