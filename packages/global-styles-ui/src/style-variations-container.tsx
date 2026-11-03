import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type {
	GlobalStylesConfig,
	StyleVariation,
} from '@wordpress/global-styles-engine';
import PreviewStyles from './preview-styles';
import Variation from './variations/variation';
import { GlobalStylesContext } from './context';
import { extractUserCustomCss } from './extract-user-custom-css';
import { isVariationWithProperties } from './utils';

interface StyleVariationsContainerProps {
	gap?: number;
}

function StyleVariationsContainer( {
	gap = 2,
}: StyleVariationsContainerProps ) {
	const { user } = useContext( GlobalStylesContext );
	const userStyles = user?.styles;

	const variations = useSelect( ( select ) => {
		const result =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations();
		// The API might return null or an array
		return Array.isArray( result )
			? ( result as GlobalStylesConfig[] )
			: undefined;
	}, [] );

	// Filter out variations that are color or typography variations.
	const fullStyleVariations = variations?.filter(
		( variation: GlobalStylesConfig ) => {
			return (
				! isVariationWithProperties( variation, [ 'color' ] ) &&
				! isVariationWithProperties( variation, [
					'typography',
					'spacing',
				] )
			);
		}
	);

	const themeVariations = useMemo( () => {
		const allVariations = variations ?? [];

		// Find the active variation whose CSS was prepended to user styles.
		const activeVariation = allVariations.find(
			( variation ) =>
				variation.styles?.css &&
				userStyles?.css
					?.trim()
					.startsWith( variation.styles.css.trim() )
		);

		// Only Additional CSS authored by the user should travel between
		// variations — not CSS that was prepended by the active variation.
		const preservedUserCss = extractUserCustomCss(
			userStyles?.css,
			activeVariation?.styles?.css
		);

		const withEmptyVariation: StyleVariation[] = [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( fullStyleVariations ?? [] ),
		];
		return [
			...withEmptyVariation.map( ( variation: StyleVariation ) => {
				const blockStyles = variation?.styles?.blocks
					? { ...variation.styles.blocks }
					: {};

				// We need to copy any user custom CSS to the variation to prevent it being lost
				// when switching variations.
				if ( userStyles?.blocks ) {
					Object.keys( userStyles.blocks ).forEach( ( blockName ) => {
						// First get any block specific custom CSS from the current user styles and merge with any custom CSS for
						// that block in the variation.
						const userBlockCss =
							userStyles.blocks?.[ blockName ]?.css;
						if ( userBlockCss ) {
							const activeBlockVariation = allVariations.find(
								( themeVariation ) =>
									themeVariation.styles?.blocks?.[ blockName ]
										?.css &&
									userBlockCss
										.trim()
										.startsWith(
											themeVariation.styles.blocks[
												blockName
											].css.trim()
										)
							);
							const preservedBlockCss = extractUserCustomCss(
								userBlockCss,
								activeBlockVariation?.styles?.blocks?.[
									blockName
								]?.css
							);

							if ( ! preservedBlockCss ) {
								return;
							}

							const variationBlockStyles =
								blockStyles[ blockName ] || {};
							const customCSS = {
								css: `${
									blockStyles[ blockName ]?.css || ''
								} ${ preservedBlockCss }`.trim(),
							};
							blockStyles[ blockName ] = {
								...variationBlockStyles,
								...customCSS,
							};
						}
					} );
				}
				// Now merge any global custom CSS from current user styles with global custom CSS in the variation.
				const css =
					preservedUserCss || variation.styles?.css
						? {
								css: `${ variation.styles?.css || '' } ${
									preservedUserCss || ''
								}`.trim(),
							}
						: {};

				const blocks =
					Object.keys( blockStyles ).length > 0
						? { blocks: blockStyles }
						: {};

				const styles = {
					...variation.styles,
					...css,
					...blocks,
				};
				return {
					...variation,
					settings: variation.settings ?? {},
					styles,
				};
			} ),
		];
	}, [
		fullStyleVariations,
		userStyles?.blocks,
		userStyles?.css,
		variations,
	] );

	if ( ! fullStyleVariations || fullStyleVariations.length < 1 ) {
		return null;
	}

	return (
		<Grid
			columns={ 2 }
			className="global-styles-ui-style-variations-container"
			gap={ gap }
		>
			{ themeVariations.map(
				( variation: StyleVariation, index: number ) => (
					<Variation key={ index } variation={ variation }>
						{ ( isFocused: boolean ) => (
							<PreviewStyles
								label={ variation?.title }
								withHoverView
								isFocused={ isFocused }
								variation={ variation }
							/>
						) }
					</Variation>
				)
			) }
		</Grid>
	);
}

export default StyleVariationsContainer;
