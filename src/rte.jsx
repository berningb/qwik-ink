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
    highlightWords = [],
    highlightWordColors = null,
    onWordClick$ = null
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
  const currentLineSpacing = useSignal('1.5');

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

  // Handle line spacing change
  const handleLineSpacingChange$ = $((event) => {
    const select = event.target;
    const lineSpacing = select.value;
    currentLineSpacing.value = lineSpacing;
    
    if (editorRef.value) {
      // Apply line-height using CSS custom property and inline style
      editorRef.value.style.setProperty('--editor-line-height', lineSpacing);
      editorRef.value.style.lineHeight = lineSpacing;
      
      // Force line-height on all elements to ensure inheritance works
      // This is critical for pasted content that might have its own styles
      const allElements = editorRef.value.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove any existing line-height from style object
        if (el.style.lineHeight) {
          el.style.lineHeight = '';
        }
        // Remove from style attribute
        if (el.hasAttribute('style')) {
          const style = el.getAttribute('style');
          if (style) {
            const cleaned = style.replace(/line-height\s*:\s*[^;]+;?/gi, '').trim();
            if (cleaned) {
              el.setAttribute('style', cleaned);
            } else {
              el.removeAttribute('style');
            }
          }
        }
        // Force inheritance - set to empty string so it inherits from parent
        el.style.lineHeight = '';
        // Use CSS to force inheritance
        el.style.setProperty('line-height', 'inherit', 'important');
      });
      
      // Use a small delay to ensure DOM has updated, then verify
      requestAnimationFrame(() => {
        if (editorRef.value) {
          // Double-check the editor container has the line-height
          editorRef.value.style.setProperty('--editor-line-height', lineSpacing);
          editorRef.value.style.lineHeight = lineSpacing;
          updateEditorState$();
        }
      });
      
      updateEditorState$();
    }
  });

  // Handle paste events - remove background colors from pasted HTML
  const handlePaste$ = $((event) => {
    if (!editorRef.value || mode.value !== 'wysiwyg') return;
    
    event.preventDefault();
    
    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    let pastedHtml = clipboardData.getData('text/html');
    const pastedText = clipboardData.getData('text/plain');
    
    // If HTML is available, clean it; otherwise use plain text
    if (pastedHtml) {
      // Create a temporary div to parse and clean the HTML
      const temp = document.createElement('div');
      temp.innerHTML = pastedHtml;
      
      // Remove background-color and line-height from all elements and text nodes' parent elements
      const allElements = temp.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove inline background-color styles
        if (el.style.backgroundColor) {
          el.style.backgroundColor = '';
        }
        if (el.style.background) {
          el.style.background = '';
        }
        
        // Remove line-height from pasted elements (we'll use the editor's line spacing)
        if (el.style.lineHeight) {
          el.style.lineHeight = '';
        }
        
        // Remove padding and margin that might interfere with line spacing
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
        
        // Clean style attribute more thoroughly
        if (el.hasAttribute('style')) {
          const style = el.getAttribute('style');
          if (style) {
            // Remove all background-related CSS properties, line-height, padding, and margin
            const cleanedStyle = style
              .replace(/background-color\s*:\s*[^;]+;?/gi, '')
              .replace(/background\s*:\s*[^;]+;?/gi, '')
              .replace(/background-image\s*:\s*[^;]+;?/gi, '')
              .replace(/background-position\s*:\s*[^;]+;?/gi, '')
              .replace(/background-repeat\s*:\s*[^;]+;?/gi, '')
              .replace(/background-size\s*:\s*[^;]+;?/gi, '')
              .replace(/background-attachment\s*:\s*[^;]+;?/gi, '')
              .replace(/line-height\s*:\s*[^;]+;?/gi, '') // Remove line-height
              .replace(/padding\s*:\s*[^;]+;?/gi, '') // Remove padding
              .replace(/padding-top\s*:\s*[^;]+;?/gi, '')
              .replace(/padding-bottom\s*:\s*[^;]+;?/gi, '')
              .replace(/padding-left\s*:\s*[^;]+;?/gi, '')
              .replace(/padding-right\s*:\s*[^;]+;?/gi, '')
              .replace(/margin\s*:\s*[^;]+;?/gi, '') // Remove margin
              .replace(/margin-top\s*:\s*[^;]+;?/gi, '')
              .replace(/margin-bottom\s*:\s*[^;]+;?/gi, '')
              .replace(/margin-left\s*:\s*[^;]+;?/gi, '')
              .replace(/margin-right\s*:\s*[^;]+;?/gi, '')
              .replace(/;\s*;/g, ';') // Remove double semicolons
              .replace(/^\s*;\s*|\s*;\s*$/g, '') // Remove leading/trailing semicolons
              .trim();
            if (cleanedStyle) {
              el.setAttribute('style', cleanedStyle);
            } else {
              el.removeAttribute('style');
            }
          }
        }
        
        // Remove bgcolor attribute if present
        if (el.hasAttribute('bgcolor')) {
          el.removeAttribute('bgcolor');
        }
        
        // Remove background-related classes (common in pasted content)
        if (el.className) {
          const classes = el.className.split(/\s+/).filter(cls => {
            // Remove classes that might contain background colors, padding, or margin
            return !cls.match(/^(bg-|background|highlight|hl-|mark|p-|m-|padding|margin)/i);
          });
          if (classes.length > 0) {
            el.className = classes.join(' ');
          } else {
            el.removeAttribute('class');
          }
        }
      });
      
      // Also process text nodes' parent elements (in case they have background styles, line-height, padding, or margin)
      const walker = document.createTreeWalker(
        temp,
        NodeFilter.SHOW_TEXT,
        null
      );
      let textNode;
      while (textNode = walker.nextNode()) {
        const parent = textNode.parentElement;
        if (parent && parent !== temp) {
          if (parent.style.backgroundColor || parent.style.background) {
            parent.style.backgroundColor = '';
            parent.style.background = '';
          }
          if (parent.style.lineHeight) {
            parent.style.lineHeight = '';
          }
          if (parent.style.padding || parent.style.paddingTop || parent.style.paddingBottom) {
            parent.style.padding = '';
            parent.style.paddingTop = '';
            parent.style.paddingBottom = '';
          }
          if (parent.style.margin || parent.style.marginTop || parent.style.marginBottom) {
            parent.style.margin = '';
            parent.style.marginTop = '';
            parent.style.marginBottom = '';
          }
        }
      }
      
      pastedHtml = temp.innerHTML;
    }
    
    // Insert the cleaned content
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      if (pastedHtml) {
        const temp = document.createElement('div');
        temp.innerHTML = pastedHtml;
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }
        range.insertNode(fragment);
      } else if (pastedText) {
        const textNode = document.createTextNode(pastedText);
        range.insertNode(textNode);
      }
      
      // Move cursor to end of inserted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Update editor state and clean up any remaining background colors
    updateEditorState$();
    
    // Final cleanup pass - remove any background colors, line-height, padding, and margin that might have slipped through
    if (editorRef.value) {
      requestAnimationFrame(() => {
        if (!editorRef.value) return;
        const allElements = editorRef.value.querySelectorAll('*');
        allElements.forEach(el => {
          // Remove background colors
          if (el.style.backgroundColor || el.style.background) {
            el.style.backgroundColor = '';
            el.style.background = '';
          }
          // Remove line-height, padding, and margin from child elements (editor container has the line spacing)
          if (el !== editorRef.value) {
            if (el.style.lineHeight) {
              el.style.lineHeight = '';
            }
            if (el.style.padding || el.style.paddingTop || el.style.paddingBottom) {
              el.style.padding = '';
              el.style.paddingTop = '';
              el.style.paddingBottom = '';
              el.style.paddingLeft = '';
              el.style.paddingRight = '';
            }
            if (el.style.margin || el.style.marginTop || el.style.marginBottom) {
              el.style.margin = '';
              el.style.marginTop = '';
              el.style.marginBottom = '';
              el.style.marginLeft = '';
              el.style.marginRight = '';
            }
          }
          const style = el.getAttribute('style');
          if (style && (style.includes('background') || style.includes('bgcolor') || style.includes('line-height') || style.includes('padding') || style.includes('margin'))) {
            const cleaned = style
              .replace(/background[^:]*:\s*[^;]+;?/gi, '')
              .replace(/bgcolor[^:]*:\s*[^;]+;?/gi, '')
              .replace(/line-height\s*:\s*[^;]+;?/gi, '') // Remove line-height
              .replace(/padding[^:]*:\s*[^;]+;?/gi, '') // Remove padding
              .replace(/margin[^:]*:\s*[^;]+;?/gi, '') // Remove margin
              .trim();
            if (cleaned) {
              el.setAttribute('style', cleaned);
            } else {
              el.removeAttribute('style');
            }
          }
        });
        // Ensure editor's line spacing is still applied
        if (currentLineSpacing.value && editorRef.value) {
          editorRef.value.style.lineHeight = currentLineSpacing.value;
        }
        updateEditorState$();
      });
    }
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
      // Apply line spacing when switching to WYSIWYG mode
      if (currentLineSpacing.value) {
        editorRef.value.style.lineHeight = currentLineSpacing.value;
      }
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
    <div class="bg-white border border-gray-200 rounded overflow-hidden flex flex-col w-full h-full">
      <Toolbar
        mode={mode}
        showPreview={showPreview}
        hideModeSwitcher={hideModeSwitcher}
        activeFormats={activeFormats}
        currentFormat={currentFormat}
        currentList={currentList}
        currentAlignment={currentAlignment}
        currentLineSpacing={currentLineSpacing}
        execCommand$={execCommand$}
        handleFormatChange$={handleFormatChange$}
        handleListChange$={handleListChange$}
        handleAlignmentChange$={handleAlignmentChange$}
        handleLineSpacingChange$={handleLineSpacingChange$}
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
        handlePaste$={handlePaste$}
        highlightWords={highlightWords}
        highlightWordColors={highlightWordColors}
        onWordClick$={onWordClick$}
        lineSpacing={currentLineSpacing}
      />

      <CharCount
        mode={mode}
        showPreview={showPreview}
        state={state}
      />
    </div>
  );
});

