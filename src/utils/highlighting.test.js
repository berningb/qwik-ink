import { describe, it, expect } from 'vitest';
import { highlightWords } from './highlighting';

describe('highlightWords', () => {
  describe('basic functionality', () => {
    it('should return original HTML when no words provided', () => {
      const html = '<p>This is a test</p>';
      expect(highlightWords(html, [])).toBe(html);
      expect(highlightWords(html, null)).toBe(html);
      expect(highlightWords(html, undefined)).toBe(html);
    });

    it('should return original HTML when empty string provided', () => {
      const html = '';
      expect(highlightWords(html, ['test'])).toBe('');
    });

    it('should return original HTML when null/undefined HTML provided', () => {
      expect(highlightWords(null, ['test'])).toBe(null);
      expect(highlightWords(undefined, ['test'])).toBe(undefined);
    });

    it('should highlight a single word', () => {
      const html = '<p>This is a test</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
      expect(result).toContain('<p>This is a ');
      expect(result).toContain('</p>');
    });

    it('should highlight multiple words', () => {
      const html = '<p>This is a test with multiple words</p>';
      const result = highlightWords(html, ['test', 'words']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
      expect(result).toContain('<span class="rte-highlight">words</span>');
    });

    it('should highlight words case-insensitively', () => {
      const html = '<p>This is a Test with TEST and test</p>';
      const result = highlightWords(html, ['test']);
      const matches = (result.match(/<span class="rte-highlight">test<\/span>/gi) || []).length;
      expect(matches).toBeGreaterThan(0);
    });
  });

  describe('word boundaries', () => {
    it('should only match whole words', () => {
      const html = '<p>testing test tested</p>';
      const result = highlightWords(html, ['test']);
      // Should match "test" but not "testing" or "tested"
      expect(result).toContain('<span class="rte-highlight">test</span>');
      expect(result).not.toContain('<span class="rte-highlight">testing</span>');
      expect(result).not.toContain('<span class="rte-highlight">tested</span>');
    });

    it('should handle words at the beginning of text', () => {
      const html = '<p>test is here</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });

    it('should handle words at the end of text', () => {
      const html = '<p>here is test</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });

    it('should handle words with punctuation', () => {
      const html = '<p>This is a test.</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });
  });

  describe('HTML tag handling', () => {
    it('should not highlight words inside HTML tags', () => {
      const html = '<div class="test">This is a test</div>';
      const result = highlightWords(html, ['test']);
      // Should highlight "test" in content but not in class attribute
      expect(result).toContain('<div class="test">');
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });

    it('should preserve HTML structure', () => {
      const html = '<p>This is a <strong>test</strong> with <em>words</em></p>';
      const result = highlightWords(html, ['test', 'words']);
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('</em>');
      expect(result).toContain('<span class="rte-highlight">test</span>');
      expect(result).toContain('<span class="rte-highlight">words</span>');
    });

    it('should handle nested HTML tags', () => {
      const html = '<div><p>This is a test</p><span>More text</span></div>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
      expect(result).toContain('<span>');
      expect(result).toContain('</span>');
      expect(result).toContain('</div>');
    });
  });

  describe('multiple words and overlapping', () => {
    it('should handle overlapping words (longest first)', () => {
      const html = '<p>This is a testing word</p>';
      const result = highlightWords(html, ['test', 'testing']);
      // Should highlight "testing" (longer word) but not "test" within it
      expect(result).toContain('<span class="rte-highlight">testing</span>');
      // Should not have nested highlights
      const highlightCount = (result.match(/rte-highlight/g) || []).length;
      expect(highlightCount).toBe(1);
    });

    it('should handle multiple occurrences of the same word', () => {
      const html = '<p>test test test</p>';
      const result = highlightWords(html, ['test']);
      const matches = (result.match(/<span class="rte-highlight">test<\/span>/g) || []).length;
      expect(matches).toBe(3);
    });

    it('should handle words in different order', () => {
      const html = '<p>word test</p>';
      const result1 = highlightWords(html, ['test', 'word']);
      const result2 = highlightWords(html, ['word', 'test']);
      // Results should be equivalent (order shouldn't matter for non-overlapping words)
      expect(result1).toContain('<span class="rte-highlight">word</span>');
      expect(result1).toContain('<span class="rte-highlight">test</span>');
      expect(result2).toContain('<span class="rte-highlight">word</span>');
      expect(result2).toContain('<span class="rte-highlight">test</span>');
    });
  });

  describe('edge cases', () => {
    it('should filter out empty strings in words array', () => {
      const html = '<p>This is a test</p>';
      const result = highlightWords(html, ['test', '', '  ', null, undefined]);
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });

    it('should trim whitespace from words', () => {
      const html = '<p>This is a test</p>';
      const result = highlightWords(html, [' test ', '  test  ']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });

    it('should handle special regex characters in words', () => {
      const html = '<p>This is a test (with parentheses)</p>';
      const result = highlightWords(html, ['test (with']);
      // Should escape regex special characters
      expect(result).toContain('<span class="rte-highlight">test (with</span>');
    });

    it('should handle words with dots', () => {
      const html = '<p>Visit example.com for more info</p>';
      const result = highlightWords(html, ['example.com']);
      expect(result).toContain('<span class="rte-highlight">example.com</span>');
    });

    it('should handle custom highlight class', () => {
      const html = '<p>This is a test</p>';
      const result = highlightWords(html, ['test'], 'custom-highlight');
      expect(result).toContain('<span class="custom-highlight">test</span>');
      expect(result).not.toContain('rte-highlight');
    });
  });

  describe('complex HTML structures', () => {
    it('should handle lists', () => {
      const html = '<ul><li>First test</li><li>Second test</li></ul>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('</li>');
      expect(result).toContain('</ul>');
      const matches = (result.match(/<span class="rte-highlight">test<\/span>/g) || []).length;
      expect(matches).toBe(2);
    });

    it('should handle headings', () => {
      const html = '<h1>Test Heading</h1><p>Test paragraph</p>';
      const result = highlightWords(html, ['Test']);
      expect(result).toContain('<h1>');
      expect(result).toContain('</h1>');
      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
      const matches = (result.match(/<span class="rte-highlight">Test<\/span>/gi) || []).length;
      expect(matches).toBe(2);
    });

    it('should handle links', () => {
      const html = '<p>Visit <a href="https://example.com">example</a> for test</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<a href="https://example.com">example</a>');
      expect(result).toContain('<span class="rte-highlight">test</span>');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle a typical paragraph with multiple highlights', () => {
      const html = '<p>This is a test paragraph with multiple words that need highlighting. Some words appear more than once.</p>';
      const result = highlightWords(html, ['test', 'words', 'highlighting']);
      expect(result).toContain('<span class="rte-highlight">test</span>');
      expect(result).toContain('<span class="rte-highlight">words</span>');
      expect(result).toContain('<span class="rte-highlight">highlighting</span>');
    });

    it('should handle markdown-like HTML', () => {
      const html = '<h2>Test Heading</h2><p>This is a <strong>test</strong> paragraph with <em>emphasis</em>.</p>';
      const result = highlightWords(html, ['test']);
      expect(result).toContain('<h2>');
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('</em>');
      const matches = (result.match(/<span class="rte-highlight">test<\/span>/gi) || []).length;
      expect(matches).toBeGreaterThan(0);
    });
  });
});

