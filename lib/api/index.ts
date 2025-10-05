/**
 * API Services Index
 *
 * This module exports all API service clients for the Brand Kit Generator.
 * These services integrate with free AI APIs and provide algorithmic solutions
 * for generating brand assets.
 */

// Color Palette Generation
export {
  generateColorPalette,
  isValidHexColor,
  getContrastingTextColor,
  lightenColor,
  darkenColor,
  ColorUtils,
} from './colors';

// Google Fonts Pairing
export {
  getFontPairing,
  getFontCategories,
  getFontsByCategory,
  searchFonts,
  getAllIndustryPairings,
  generateFontFaceCSS,
  FONTS,
} from './fonts';

// Tagline Generation
export {
  generateTagline,
  generateMultipleTaglines,
  validateTagline,
  getExampleTaglines,
  industryTaglineStyles,
  fallbackTaglines,
} from './taglines';
