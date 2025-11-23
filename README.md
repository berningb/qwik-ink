# @qwik-rte/lib

**Qwik Ink** - A powerful and flexible multi-mode text editor built with Qwik.

## Features

- ✨ WYSIWYG editing with full formatting toolbar
- 📝 Markdown mode with live preview
- 💻 HTML source editing
- 👁️ Preview mode available in all editing modes
- 🔍 Word highlighting in preview mode
- 🎨 Built with Tailwind CSS (BYO styles or customize)
- ⚡ Qwik-native with signals for optimal performance
- 🔄 Bidirectional HTML ↔ Markdown conversion

## Installation

```bash
npm install @qwik-rte/lib
```

## Usage

```tsx
import { component$ } from '@builder.io/qwik';
import { RichTextEditor } from '@qwik-rte/lib';

export default component$(() => {
  return (
    <RichTextEditor 
      placeholder="Start typing..."
      initialContent="<p>Hello world!</p>"
      onChange={(text, html, markdown) => {
        console.log('Content changed:', { text, html, markdown });
      }}
    />
  );
});
```

## API

### RichTextEditor Props

- `placeholder?: string` - Placeholder text for empty editor
- `initialContent?: string` - Initial HTML content
- `initialMode?: 'wysiwyg' | 'markdown' | 'html'` - Starting editor mode (default: 'wysiwyg')
- `hideModeSwitcher?: boolean` - Hide the mode switcher button
- `highlightWords?: string[]` - Words to highlight in preview mode
- `onChange?: (text: string, html: string, markdown: string) => void` - Callback fired on content change

## Exports

- `RichTextEditor` - Main editor component
- `MarkdownPreview` - Preview component for markdown/HTML
- `htmlToMarkdown` - Utility function to convert HTML to Markdown
- `markdownToHtml` - Utility function to convert Markdown to HTML
- `highlightWords` - Utility function for word highlighting in HTML content

## License

MIT

