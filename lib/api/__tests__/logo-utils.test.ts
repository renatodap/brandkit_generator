import { describe, it, expect } from 'vitest';
import {
  svgToDataURL,
  isValidSVG,
  extractViewBox,
  normalizeSVG,
  optimizeSVG,
} from '../logo-utils';

describe('logo-utils', () => {
  describe('svgToDataURL', () => {
    it('should convert SVG to data URL', () => {
      const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(result.length).toBeGreaterThan(svg.length);
    });

    it('should handle SVG with special characters', () => {
      const svg = '<svg viewBox="0 0 100 100"><text>Hello & "World"</text></svg>';
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should trim whitespace before encoding', () => {
      const svg = '  \n  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>  \n  ';
      const result = svgToDataURL(svg);

      // Should be same as trimmed version
      const trimmedResult = svgToDataURL(svg.trim());
      expect(result).toBe(trimmedResult);
    });

    it('should handle empty SVG', () => {
      const svg = '<svg></svg>';
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should handle complex SVG with multiple elements', () => {
      const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="#3B82F6"/>
  <rect x="75" y="75" width="50" height="50" fill="#8B5CF6"/>
  <path d="M 50 50 L 150 50 L 100 150 Z" fill="#10B981"/>
</svg>`;
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

      // Verify it can be decoded back
      const base64 = result.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toBe(svg);
    });

    it('should handle SVG with quotes and apostrophes', () => {
      const svg = '<svg viewBox="0 0 100 100"><text font-family="Arial, \'Helvetica\'">Test</text></svg>';
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

      const base64 = result.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toContain('Arial');
    });

    it('should handle unicode characters', () => {
      const svg = '<svg viewBox="0 0 100 100"><text>Hello 世界 🌍</text></svg>';
      const result = svgToDataURL(svg);

      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

      const base64 = result.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toContain('世界');
      expect(decoded).toContain('🌍');
    });
  });

  describe('isValidSVG', () => {
    it('should validate correct SVG', () => {
      const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      expect(isValidSVG(svg)).toBe(true);
    });

    it('should validate SVG with attributes', () => {
      const svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
      expect(isValidSVG(svg)).toBe(true);
    });

    it('should validate empty SVG', () => {
      const svg = '<svg></svg>';
      expect(isValidSVG(svg)).toBe(true);
    });

    it('should validate multiline SVG', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40"/>
</svg>`;
      expect(isValidSVG(svg)).toBe(true);
    });

    it('should reject non-SVG content', () => {
      const notSvg = '<div>Not an SVG</div>';
      expect(isValidSVG(notSvg)).toBe(false);
    });

    it('should reject SVG without closing tag', () => {
      const incompleteSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/>';
      expect(isValidSVG(incompleteSvg)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidSVG('')).toBe(false);
    });

    it('should reject string that only ends with </svg>', () => {
      const invalid = 'Some text before </svg>';
      expect(isValidSVG(invalid)).toBe(false);
    });

    it('should reject string that only starts with <svg', () => {
      const invalid = '<svg> some content';
      expect(isValidSVG(invalid)).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      const svg = '  \n  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>  \n  ';
      expect(isValidSVG(svg)).toBe(true);
    });

    it('should handle SVG with self-closing tag', () => {
      const svg = '<svg viewBox="0 0 100 100"/>';
      expect(isValidSVG(svg)).toBe(false); // Should end with </svg>
    });
  });

  describe('extractViewBox', () => {
    it('should extract viewBox dimensions', () => {
      const svg = '<svg viewBox="0 0 200 300"><circle cx="100" cy="150" r="50"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 200, height: 300 });
    });

    it('should handle viewBox with single quotes', () => {
      const svg = "<svg viewBox='0 0 400 500'><circle cx='200' cy='250' r='50'/></svg>";
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 400, height: 500 });
    });

    it('should handle viewBox with multiple spaces', () => {
      const svg = '<svg viewBox="0  0  150  250"><circle cx="75" cy="125" r="50"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 150, height: 250 });
    });

    it('should handle viewBox with tabs', () => {
      const svg = '<svg viewBox="0\t0\t100\t100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 100, height: 100 });
    });

    it('should return null for SVG without viewBox', () => {
      const svg = '<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toBeNull();
    });

    it('should return null for malformed viewBox (too few values)', () => {
      const svg = '<svg viewBox="0 0 100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toBeNull();
    });

    it('should return null for malformed viewBox (too many values)', () => {
      const svg = '<svg viewBox="0 0 100 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toBeNull();
    });

    it('should handle viewBox with decimal values', () => {
      const svg = '<svg viewBox="0 0 100.5 200.75"><circle cx="50" cy="100" r="40"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 100.5, height: 200.75 });
    });

    it('should handle viewBox with negative x and y', () => {
      const svg = '<svg viewBox="-50 -50 200 300"><circle cx="100" cy="150" r="50"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 200, height: 300 });
    });

    it('should return null for empty string', () => {
      const result = extractViewBox('');
      expect(result).toBeNull();
    });

    it('should extract from SVG with multiple attributes', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100" height="100"><circle cx="256" cy="256" r="200"/></svg>';
      const result = extractViewBox(svg);

      expect(result).toEqual({ width: 512, height: 512 });
    });
  });

  describe('normalizeSVG', () => {
    it('should add viewBox if missing', () => {
      const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox="0 0 512 512"');
      expect(result).toContain('<circle');
    });

    it('should add xmlns if missing', () => {
      const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('viewBox="0 0 100 100"');
    });

    it('should add both viewBox and xmlns if missing', () => {
      const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox="0 0 512 512"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should not modify SVG with both attributes', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="50"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toBe(svg);
    });

    it('should trim whitespace', () => {
      const svg = '  \n  <svg><circle cx="50" cy="50" r="40"/></svg>  \n  ';
      const result = normalizeSVG(svg);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });

    it('should preserve existing viewBox', () => {
      const svg = '<svg viewBox="10 10 100 100"><circle cx="60" cy="60" r="40"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox="10 10 100 100"');
      expect(result).not.toContain('viewBox="0 0 512 512"');
    });

    it('should preserve existing xmlns', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>';
      const result = normalizeSVG(svg);

      // Should not have duplicate xmlns
      const xmlnsCount = (result.match(/xmlns=/g) || []).length;
      expect(xmlnsCount).toBe(1);
    });

    it('should handle SVG with attributes in different order', () => {
      const svg = '<svg width="100" height="100" fill="none"><circle cx="50" cy="50" r="40"/></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox="0 0 512 512"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result).toContain('width="100"');
    });

    it('should handle multiline SVG', () => {
      const svg = `<svg>
  <circle cx="50" cy="50" r="40"/>
</svg>`;
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox');
      expect(result).toContain('xmlns');
    });

    it('should handle empty SVG', () => {
      const svg = '<svg></svg>';
      const result = normalizeSVG(svg);

      expect(result).toContain('viewBox="0 0 512 512"');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });

  describe('optimizeSVG', () => {
    it('should remove HTML comments', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <!-- This is a comment -->
  <circle cx="50" cy="50" r="40"/>
  <!-- Another comment -->
</svg>`;
      const result = optimizeSVG(svg);

      expect(result).not.toContain('<!--');
      expect(result).not.toContain('-->');
      expect(result).toContain('<circle');
    });

    it('should remove multi-line comments', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <!--
    This is a
    multi-line
    comment
  -->
  <circle cx="50" cy="50" r="40"/>
</svg>`;
      const result = optimizeSVG(svg);

      expect(result).not.toContain('<!--');
      expect(result).not.toContain('multi-line');
    });

    it('should remove whitespace between tags', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40"/>
  <rect x="25" y="25" width="50" height="50"/>
</svg>`;
      const result = optimizeSVG(svg);

      expect(result).toContain('><circle');
      expect(result).toContain('/><rect');
      expect(result).not.toMatch(/>\s+</);
    });

    it('should normalize internal whitespace', () => {
      const svg = '<svg viewBox="0  0  100   100"><circle   cx="50"   cy="50"   r="40"/></svg>';
      const result = optimizeSVG(svg);

      expect(result).not.toContain('  ');
      expect(result).toContain('viewBox="0 0 100 100"');
    });

    it('should trim result', () => {
      const svg = '  \n  <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>  \n  ';
      const result = optimizeSVG(svg);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });

    it('should handle SVG without comments or excess whitespace', () => {
      const svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
      const result = optimizeSVG(svg);

      expect(result).toBe(svg);
    });

    it('should preserve necessary whitespace in attributes', () => {
      const svg = '<svg viewBox="0 0 100 100"><path d="M 10 10 L 90 90" fill="red"/></svg>';
      const result = optimizeSVG(svg);

      expect(result).toContain('d="M 10 10 L 90 90"');
    });

    it('should handle multiple comments', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <!-- Comment 1 -->
  <circle cx="50" cy="50" r="40"/>
  <!-- Comment 2 -->
  <rect x="25" y="25" width="50" height="50"/>
  <!-- Comment 3 -->
</svg>`;
      const result = optimizeSVG(svg);

      expect(result).not.toContain('<!--');
      expect(result).toContain('<circle');
      expect(result).toContain('<rect');
    });

    it('should handle nested comments', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <!-- Outer comment <!-- Nested --> -->
  <circle cx="50" cy="50" r="40"/>
</svg>`;
      const result = optimizeSVG(svg);

      // Should remove everything between first <!-- and last -->
      expect(result).not.toContain('<!--');
      expect(result).toContain('<circle');
    });

    it('should optimize complex SVG', () => {
      const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Logo design -->
  <circle    cx="100"    cy="100"    r="50"    fill="#3B82F6"/>

  <!-- Secondary shape -->
  <rect    x="75"    y="75"    width="50"    height="50"    fill="#8B5CF6"/>

</svg>`;
      const result = optimizeSVG(svg);

      expect(result).not.toContain('<!--');
      expect(result).not.toContain('  '); // No double spaces
      expect(result).toContain('<circle');
      expect(result).toContain('<rect');
      const length = result.length;
      const originalLength = svg.length;
      expect(length).toBeLessThan(originalLength);
    });

    it('should handle empty SVG', () => {
      const svg = '<svg></svg>';
      const result = optimizeSVG(svg);

      expect(result).toBe(svg);
    });

    it('should handle SVG with only comments', () => {
      const svg = `<svg>
  <!-- Just a comment -->
</svg>`;
      const result = optimizeSVG(svg);

      expect(result).not.toContain('<!--');
      expect(result).toBe('<svg></svg>');
    });

    it('should preserve text content', () => {
      const svg = '<svg viewBox="0 0 100 100"><text x="50" y="50">Hello World</text></svg>';
      const result = optimizeSVG(svg);

      expect(result).toContain('Hello World');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle full workflow: normalize then optimize', () => {
      const svg = `  <svg>
  <!-- Generated logo -->
  <circle   cx="50"   cy="50"   r="40"/>
</svg>  `;

      const normalized = normalizeSVG(svg);
      const optimized = optimizeSVG(normalized);

      expect(optimized).toContain('viewBox="0 0 512 512"');
      expect(optimized).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(optimized).not.toContain('<!--');
      expect(optimized).not.toMatch(/\s\s+/);
      expect(optimized).toContain('<circle');
    });

    it('should handle workflow: optimize then convert to data URL', () => {
      const svg = `<svg viewBox="0 0 100 100">
  <!-- Logo -->
  <circle cx="50" cy="50" r="40"/>
</svg>`;

      const optimized = optimizeSVG(svg);
      const dataURL = svgToDataURL(optimized);

      expect(dataURL).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(dataURL).not.toContain('<!--');

      const base64 = dataURL.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toContain('<circle');
      expect(decoded).not.toContain('<!--');
    });

    it('should validate optimized SVG', () => {
      const svg = `  <svg viewBox="0 0 100 100">
  <!-- Comment -->
  <circle cx="50" cy="50" r="40"/>
</svg>  `;

      const optimized = optimizeSVG(svg);
      const isValid = isValidSVG(optimized);

      expect(isValid).toBe(true);
    });

    it('should extract viewBox from normalized SVG', () => {
      const svg = '<svg><circle cx="50" cy="50" r="40"/></svg>';
      const normalized = normalizeSVG(svg);
      const viewBox = extractViewBox(normalized);

      expect(viewBox).toEqual({ width: 512, height: 512 });
    });

    it('should handle very large SVG', () => {
      const svg =
        '<svg viewBox="0 0 1000 1000">' +
        Array(100)
          .fill('<circle cx="50" cy="50" r="5"/>')
          .join('\n  ') +
        '</svg>';

      const optimized = optimizeSVG(svg);
      const dataURL = svgToDataURL(optimized);

      expect(dataURL).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(optimized.length).toBeLessThan(svg.length);
    });

    it('should handle SVG with special XML entities', () => {
      const svg = '<svg viewBox="0 0 100 100"><text>&lt; &gt; &amp; &quot; &apos;</text></svg>';
      const optimized = optimizeSVG(svg);
      const dataURL = svgToDataURL(optimized);

      expect(dataURL).toMatch(/^data:image\/svg\+xml;base64,/);

      const base64 = dataURL.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      expect(decoded).toContain('&lt;');
      expect(decoded).toContain('&amp;');
    });
  });
});
