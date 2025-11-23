import { component$, useSignal, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { htmlToMarkdown, markdownToHtml } from './utils/markdown';
import { getCurrentFormat, getCurrentListType, getActiveFormats } from './utils/formatTracking';
import { Toolbar } from './components/Toolbar';
import { EditorView } from './components/EditorView';
import { CharCount } from './components/CharCount';

export const RichTextEditor = component$((props) => {
  const { 
    placeholder = 'Start typing...',
    initialContent = '',
    onChange,
    initialMode = 'wysiwyg',
    hideModeSwitcher = false,
    highlightWords = []
  } = props;
  
  // Refs for editor elements
  const editorRef = useSignal();
  const markdownRef = useSignal();
  const htmlRef = useSignal();
  
  // Editor state
  const mode = useSignal(initialMode);
  const showPreview = useSignal(false);
  
  const state = useStore({
    content: initialContent,
    html: initialContent,
    selection: null,
    markdown: htmlToMarkdown(initialContent),
  });

  // Track active formatting states
  const activeFormats = useStore({
    bold: false,
    italic: false,
    underline: false,
  });

  // Track current format states
  const currentFormat = useSignal('p');
  const currentAlignment = useSignal('left');
  const currentList = useSignal('none');

  // Helper: Update all state and format tracking (DRY - used in 3 places)
  const updateEditorState$ = $(() => {
    if (!editorRef.value) return;

    const html = editorRef.value.innerHTML;
    const text = editorRef.value.textContent || '';
    const markdown = htmlToMarkdown(html);

    // Update content state
    state.html = html;
    state.content = text;
    state.markdown = markdown;

    // Update formatting state
    const formats = getActiveFormats();
    activeFormats.bold = formats.bold;
    activeFormats.italic = formats.italic;
    activeFormats.underline = formats.underline;

    currentFormat.value = getCurrentFormat(editorRef.value);
    currentList.value = getCurrentListType();

    // Notify parent
    if (onChange) {
      onChange(text, html, markdown);
    }
  });

  // Execute document command
  const execCommand$ = $((command, value) => {
    document.execCommand(command, false, value);
    if (editorRef.value) {
      editorRef.value.focus();
      updateEditorState$();
    }
  });

  // Handle format dropdown change
  const handleFormatChange$ = $((event) => {
    const select = event.target;
    const format = select.value;
    currentFormat.value = format;
    execCommand$('formatBlock', format);
  });

  // Handle list dropdown change
  const handleListChange$ = $((event) => {
    const select = event.target;
    const listType = select.value;
    
    const isInUL = document.queryCommandState('insertUnorderedList');
    const isInOL = document.queryCommandState('insertOrderedList');
    
    if (listType === 'none') {
      if (isInUL) execCommand$('insertUnorderedList');
      if (isInOL) execCommand$('insertOrderedList');
      currentList.value = 'none';
    } else if (listType === 'ul') {
      if (isInOL) execCommand$('insertOrderedList');
      if (!isInUL) execCommand$('insertUnorderedList');
      currentList.value = 'ul';
    } else if (listType === 'ol') {
      if (isInUL) execCommand$('insertUnorderedList');
      if (!isInOL) execCommand$('insertOrderedList');
      currentList.value = 'ol';
    }
  });

  // Handle alignment dropdown change
  const handleAlignmentChange$ = $((event) => {
    const select = event.target;
    const alignment = select.value;
    currentAlignment.value = alignment;
    
    if (alignment === 'left') execCommand$('justifyLeft');
    else if (alignment === 'center') execCommand$('justifyCenter');
    else if (alignment === 'right') execCommand$('justifyRight');
    else if (alignment === 'justify') execCommand$('justifyFull');
  });

  // Handle content changes
  const handleInput$ = $(() => {
    updateEditorState$();
  });

  // Handle selection changes
  const handleSelect$ = $(() => {
    if (editorRef.value) {
      // Track selection range
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        state.selection = {
          start: range.startOffset,
          end: range.endOffset,
        };
      }
      
      updateEditorState$();
    }
  });

  // Handle markdown textarea changes
  const handleMarkdownInput$ = $(() => {
    if (markdownRef.value) {
      const markdown = markdownRef.value.value;
      const html = markdownToHtml(markdown);
      const text = markdownRef.value.value;
      
      state.html = html;
      state.content = text;
      state.markdown = markdown;
      
      if (onChange) {
        onChange(text, html, markdown);
      }
    }
  });

  // Handle HTML textarea changes
  const handleHTMLInput$ = $(() => {
    if (htmlRef.value) {
      const html = htmlRef.value.value;
      const markdown = htmlToMarkdown(html);
      const text = htmlRef.value.value.replace(/<[^>]*>/g, '');
      
      state.html = html;
      state.content = text;
      state.markdown = markdown;
      
      if (onChange) {
        onChange(text, html, markdown);
      }
    }
  });

  // Toggle between modes
  const toggleMode$ = $(() => {
    if (mode.value === 'wysiwyg' && editorRef.value) {
      const html = editorRef.value.innerHTML;
      state.html = html;
      state.markdown = htmlToMarkdown(html);
      mode.value = 'markdown';
    } else if (mode.value === 'markdown' && markdownRef.value) {
      const markdown = markdownRef.value.value;
      state.markdown = markdown;
      state.html = markdownToHtml(markdown);
      mode.value = 'html';
    } else if (mode.value === 'html' && htmlRef.value) {
      const html = htmlRef.value.value;
      state.html = html;
      state.markdown = htmlToMarkdown(html);
      mode.value = 'wysiwyg';
    }
    
    showPreview.value = false;
  });
  
  // Sync content when mode changes
  useVisibleTask$(({ track }) => {
    track(() => mode.value);
    
    if (mode.value === 'wysiwyg' && editorRef.value && state.html) {
      editorRef.value.innerHTML = state.html;
    }
  });

  // Sync content when preview is toggled off (restore editor content)
  useVisibleTask$(({ track }) => {
    track(() => showPreview.value);
    track(() => mode.value);
    track(() => editorRef.value);
    
    // When preview is turned off and we're in WYSIWYG mode, restore the content
    if (!showPreview.value && mode.value === 'wysiwyg' && editorRef.value && state.html) {
      // Only update if content is different to avoid cursor issues
      if (editorRef.value.innerHTML !== state.html) {
        editorRef.value.innerHTML = state.html;
      }
    }
  });

  // Initialize editor with content
  useVisibleTask$(({ track }) => {
    track(() => initialContent);
    
    if (editorRef.value && initialContent) {
      if (state.html !== initialContent) {
        editorRef.value.innerHTML = initialContent;
        state.content = editorRef.value.textContent || '';
        state.html = initialContent;
        state.markdown = htmlToMarkdown(initialContent);
      }
    }
    
    if (markdownRef.value && initialContent) {
      const newMarkdown = htmlToMarkdown(initialContent);
      if (state.markdown !== newMarkdown) {
        state.markdown = newMarkdown;
        state.html = initialContent;
      }
    }
    
    if (htmlRef.value && initialContent) {
      if (state.html !== initialContent) {
        state.html = initialContent;
        state.markdown = htmlToMarkdown(initialContent);
      }
    }
  });

  return (
    <div class="bg-white border border-gray-200 rounded overflow-hidden flex flex-col w-full">
      <Toolbar
        mode={mode}
        showPreview={showPreview}
        hideModeSwitcher={hideModeSwitcher}
        activeFormats={activeFormats}
        currentFormat={currentFormat}
        currentList={currentList}
        currentAlignment={currentAlignment}
        execCommand$={execCommand$}
        handleFormatChange$={handleFormatChange$}
        handleListChange$={handleListChange$}
        handleAlignmentChange$={handleAlignmentChange$}
        toggleMode$={toggleMode$}
      />

      <EditorView
        mode={mode}
        showPreview={showPreview}
        placeholder={placeholder}
        editorRef={editorRef}
        markdownRef={markdownRef}
        htmlRef={htmlRef}
        state={state}
        handleInput$={handleInput$}
        handleSelect$={handleSelect$}
        handleMarkdownInput$={handleMarkdownInput$}
        handleHTMLInput$={handleHTMLInput$}
        highlightWords={highlightWords}
      />

      <CharCount
        mode={mode}
        showPreview={showPreview}
        state={state}
      />
    </div>
  );
});

