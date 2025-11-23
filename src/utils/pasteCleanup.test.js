import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Test utility to simulate paste cleanup logic
 * This mirrors the logic in rte.jsx handlePaste$
 */
function cleanPastedHtml(html) {
  if (!html) return html;
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove inline background-color styles
    if (el.style.backgroundColor) {
      el.style.backgroundColor = '';
    }
    if (el.style.background) {
      el.style.background = '';
    }
    
    // Remove line-height
    if (el.style.lineHeight) {
      el.style.lineHeight = '';
    }
    
    // Remove padding
    if (el.style.padding) {
      el.style.padding = '';
    }
    if (el.style.paddingTop) {
      el.style.paddingTop = '';
    }
    if (el.style.paddingBottom) {
      el.style.paddingBottom = '';
    }
    if (el.style.paddingLeft) {
      el.style.paddingLeft = '';
    }
    if (el.style.paddingRight) {
      el.style.paddingRight = '';
    }
    
    // Remove margin
    if (el.style.margin) {
      el.style.margin = '';
    }
    if (el.style.marginTop) {
      el.style.marginTop = '';
    }
    if (el.style.marginBottom) {
      el.style.marginBottom = '';
    }
    if (el.style.marginLeft) {
      el.style.marginLeft = '';
    }
    if (el.style.marginRight) {
      el.style.marginRight = '';
    }
    
    // Clean style attribute
    if (el.hasAttribute('style')) {
      const style = el.getAttribute('style');
      if (style) {
        const cleanedStyle = style
          .replace(/background-color\s*:\s*[^;]+;?/gi, '')
          .replace(/background\s*:\s*[^;]+;?/gi, '')
          .replace(/background-image\s*:\s*[^;]+;?/gi, '')
          .replace(/background-position\s*:\s*[^;]+;?/gi, '')
          .replace(/background-repeat\s*:\s*[^;]+;?/gi, '')
          .replace(/background-size\s*:\s*[^;]+;?/gi, '')
          .replace(/background-attachment\s*:\s*[^;]+;?/gi, '')
          .replace(/line-height\s*:\s*[^;]+;?/gi, '')
          .replace(/padding\s*:\s*[^;]+;?/gi, '')
          .replace(/padding-top\s*:\s*[^;]+;?/gi, '')
          .replace(/padding-bottom\s*:\s*[^;]+;?/gi, '')
          .replace(/padding-left\s*:\s*[^;]+;?/gi, '')
          .replace(/padding-right\s*:\s*[^;]+;?/gi, '')
          .replace(/margin\s*:\s*[^;]+;?/gi, '')
          .replace(/margin-top\s*:\s*[^;]+;?/gi, '')
          .replace(/margin-bottom\s*:\s*[^;]+;?/gi, '')
          .replace(/margin-left\s*:\s*[^;]+;?/gi, '')
          .replace(/margin-right\s*:\s*[^;]+;?/gi, '')
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;\s*|\s*;\s*$/g, '')
          .trim();
        if (cleanedStyle) {
          el.setAttribute('style', cleanedStyle);
        } else {
          el.removeAttribute('style');
        }
      }
    }
    
    // Remove bgcolor attribute
    if (el.hasAttribute('bgcolor')) {
      el.removeAttribute('bgcolor');
    }
    
    // Remove background-related classes
    if (el.className) {
      const classes = el.className.split(/\s+/).filter(cls => {
        return !cls.match(/^(bg-|background|highlight|hl-|mark|p-|m-|padding|margin)/i);
      });
      if (classes.length > 0) {
        el.className = classes.join(' ');
      } else {
        el.removeAttribute('class');
      }
    }
  });
  
  return temp.innerHTML;
}

describe('cleanPastedHtml', () => {
  beforeEach(() => {
    // Setup DOM environment
    if (typeof document === 'undefined') {
      global.document = {
        createElement: () => ({
          innerHTML: '',
          querySelectorAll: () => [],
          setAttribute: () => {},
          removeAttribute: () => {},
          getAttribute: () => null,
          hasAttribute: () => false,
        }),
      };
    }
  });

  describe('background color removal', () => {
    it('should remove background-color from inline styles', () => {
      const html = '<p style="background-color: yellow;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.backgroundColor).toBe('');
    });

    it('should remove background shorthand from inline styles', () => {
      const html = '<p style="background: blue;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.background).toBe('');
    });

    it('should remove background-color from style attribute', () => {
      const html = '<p style="background-color: red; color: black;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.getAttribute('style')).not.toContain('background-color');
      expect(p.getAttribute('style')).toContain('color: black');
    });

    it('should remove bgcolor attribute', () => {
      const html = '<p bgcolor="yellow">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.hasAttribute('bgcolor')).toBe(false);
    });
  });

  describe('line-height removal', () => {
    it('should remove line-height from inline styles', () => {
      const html = '<p style="line-height: 2;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.lineHeight).toBe('');
    });

    it('should remove line-height from style attribute', () => {
      const html = '<p style="line-height: 1.5; color: black;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.getAttribute('style')).not.toContain('line-height');
      expect(p.getAttribute('style')).toContain('color: black');
    });
  });

  describe('padding removal', () => {
    it('should remove padding from inline styles', () => {
      const html = '<p style="padding: 10px;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.padding).toBe('');
    });

    it('should remove padding-top, padding-bottom, etc.', () => {
      const html = '<p style="padding-top: 5px; padding-bottom: 5px;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.paddingTop).toBe('');
      expect(p.style.paddingBottom).toBe('');
    });

    it('should remove padding from style attribute', () => {
      const html = '<p style="padding: 10px; color: black;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.getAttribute('style')).not.toContain('padding');
      expect(p.getAttribute('style')).toContain('color: black');
    });
  });

  describe('margin removal', () => {
    it('should remove margin from inline styles', () => {
      const html = '<p style="margin: 10px;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.margin).toBe('');
    });

    it('should remove margin-top, margin-bottom, etc.', () => {
      const html = '<p style="margin-top: 5px; margin-bottom: 5px;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.style.marginTop).toBe('');
      expect(p.style.marginBottom).toBe('');
    });

    it('should remove margin from style attribute', () => {
      const html = '<p style="margin: 10px; color: black;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.getAttribute('style')).not.toContain('margin');
      expect(p.getAttribute('style')).toContain('color: black');
    });
  });

  describe('class removal', () => {
    it('should remove background-related classes', () => {
      const html = '<p class="bg-yellow-200 highlight">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.className).not.toContain('bg-yellow-200');
      expect(p.className).not.toContain('highlight');
    });

    it('should preserve non-background classes', () => {
      const html = '<p class="text-center font-bold">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      expect(p.className).toContain('text-center');
      expect(p.className).toContain('font-bold');
    });
  });

  describe('combined cleanup', () => {
    it('should remove all unwanted styles while preserving others', () => {
      const html = '<p style="background-color: yellow; line-height: 2; padding: 10px; margin: 5px; color: black; font-weight: bold;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      const style = p.getAttribute('style') || '';
      expect(style).not.toContain('background-color');
      expect(style).not.toContain('line-height');
      expect(style).not.toContain('padding');
      expect(style).not.toContain('margin');
      expect(style).toContain('color: black');
      expect(style).toContain('font-weight: bold');
    });

    it('should handle nested elements', () => {
      const html = '<div style="background-color: blue;"><p style="line-height: 2; padding: 5px;">Test</p></div>';
      const result = cleanPastedHtml(html);
      // Result should not contain background-color or line-height
      expect(result).not.toContain('background-color');
      expect(result).not.toContain('line-height');
      expect(result).not.toContain('padding');
      // But should preserve the structure and content
      expect(result).toContain('Test');
    });

    it('should handle empty style attributes', () => {
      const html = '<p style="background-color: yellow; line-height: 2;">Test</p>';
      const result = cleanPastedHtml(html);
      const temp = document.createElement('div');
      temp.innerHTML = result;
      const p = temp.querySelector('p');
      // Style attribute should be removed if empty
      const style = p.getAttribute('style');
      expect(style === null || style.trim() === '').toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined HTML', () => {
      expect(cleanPastedHtml(null)).toBe(null);
      expect(cleanPastedHtml(undefined)).toBe(undefined);
    });

    it('should handle empty HTML', () => {
      expect(cleanPastedHtml('')).toBe('');
    });

    it('should handle HTML with no styles', () => {
      const html = '<p>Test</p>';
      const result = cleanPastedHtml(html);
      expect(result).toContain('<p>Test</p>');
    });
  });
});

