/**
 * Logo utilities for SVG generation and conversion
 */

/**
 * Convert SVG code to data URL for use in img tags
 */
export function svgToDataURL(svgCode: string): string {
  // Clean and encode SVG
  const cleanSvg = svgCode.trim();
  const base64 = Buffer.from(cleanSvg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Validate SVG code structure
 */
export function isValidSVG(svgCode: string): boolean {
  const trimmed = svgCode.trim();
  return trimmed.startsWith('<svg') && trimmed.endsWith('</svg>');
}

/**
 * Extract viewBox dimensions from SVG code
 */
export function extractViewBox(svgCode: string): {
  width: number;
  height: number;
} | null {
  const viewBoxMatch = svgCode.match(/viewBox=["']([^"']+)["']/);
  if (!viewBoxMatch || !viewBoxMatch[1]) return null;

  const values = viewBoxMatch[1].split(/\s+/).map(Number);
  if (values.length !== 4) return null;

  const width = values[2];
  const height = values[3];

  if (width === undefined || height === undefined) return null;

  return {
    width,
    height,
  };
}

/**
 * Ensure SVG has proper dimensions for rendering
 */
export function normalizeSVG(svgCode: string): string {
  let normalized = svgCode.trim();

  // Ensure viewBox is present
  if (!normalized.includes('viewBox')) {
    normalized = normalized.replace(
      /<svg/,
      '<svg viewBox="0 0 512 512"'
    );
  }

  // Ensure xmlns is present
  if (!normalized.includes('xmlns')) {
    normalized = normalized.replace(
      /<svg/,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  return normalized;
}

/**
 * Optimize SVG code for production
 */
export function optimizeSVG(svgCode: string): string {
  let optimized = svgCode;

  // Remove comments
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove unnecessary whitespace
  optimized = optimized.replace(/>\s+</g, '><');

  // Normalize whitespace
  optimized = optimized.replace(/\s+/g, ' ');

  return optimized.trim();
}
