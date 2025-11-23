import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { highlightWords } from '../utils/highlighting';

/**
 * Highlights words with different colors
 */
function highlightWordsMultiColor(html, wordColorMap) {
  if (!html || !wordColorMap || wordColorMap.length === 0) {
    return html;
  }

  let result = html;
  
  // Sort by word length (longest first) to handle overlapping
  const sorted = [...wordColorMap].sort((a, b) => b.word.length - a.word.length);
  
  sorted.forEach(({ word, color }) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?![^<]*>)(\\b${escapedWord}\\b)`, 'gi');
    result = result.replace(regex, `<span class="${color.class} ${color.text} px-0.5 rounded font-medium">$1</span>`);
  });
  
  return result;
}

export const MarkdownPreview = component$(({ html, highlightWords: wordsToHighlight = [], highlightWordColors = null, onWordClick$ = null, lineSpacing = null }) => {
  const previewRef = useSignal();
  
  let highlightedHtml = html || '';
  
  // Use multi-color highlighting if wordColorMap is provided
  if (highlightWordColors && highlightWordColors.length > 0) {
    highlightedHtml = highlightWordsMultiColor(html || '', highlightWordColors);
  } else if (wordsToHighlight && wordsToHighlight.length > 0) {
    // Fall back to single-color highlighting
    highlightedHtml = highlightWords(html || '', wordsToHighlight);
  }

  // Handle word clicks in preview mode - attach listener after DOM updates
  useVisibleTask$(({ track, cleanup }) => {
    track(() => previewRef.value);
    track(() => html);
    track(() => onWordClick$);
    
    console.log('Setting up preview click handler', { 
      hasRef: !!previewRef.value, 
      hasCallback: !!onWordClick$,
      htmlLength: html?.length 
    });
    
    if (!previewRef.value || !onWordClick$) {
      console.log('Missing ref or callback');
      return;
    }
    
    const handleClick = (event) => {
        console.log('Preview click detected', { 
          target: event.target, 
          targetTag: event.target.tagName,
          targetText: event.target.textContent?.substring(0, 20),
          onWordClick: !!onWordClick$ 
        });
        
        const target = event.target;
        
        // Small delay to ensure selection is set
        setTimeout(() => {
          console.log('Processing click, target:', target.tagName, target.textContent?.substring(0, 30));
          
          // If clicking on a highlighted span, extract word from its text
          if (target.tagName === 'SPAN' && target.textContent) {
            const text = target.textContent.trim();
            console.log('Span clicked, text:', text);
            const wordMatch = text.match(/[\w'-]+/);
            if (wordMatch) {
              const clickedWord = wordMatch[0].replace(/^['-]+|['-]+$/g, '').toLowerCase().trim();
              console.log('Extracted word from span:', clickedWord);
              if (clickedWord && clickedWord.length > 1) {
                console.log('Calling onWordClick$ with:', clickedWord);
                onWordClick$(clickedWord);
              }
              return;
            }
          }
          
          // Otherwise, use selection to find word
          const selection = window.getSelection();
          console.log('Selection:', selection, 'rangeCount:', selection?.rangeCount);
          if (!selection || selection.rangeCount === 0) {
            console.log('No selection found');
            return;
          }
          
          const range = selection.getRangeAt(0);
          let textNode = range.startContainer;
          let offset = range.startOffset;
          console.log('Range:', { textNode: textNode.nodeType, offset });
          
          // If clicking on an element node, find the text node
          if (textNode.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(
              textNode,
              NodeFilter.SHOW_TEXT,
              null
            );
            textNode = walker.nextNode();
            if (!textNode) {
              console.log('No text node found in element');
              return;
            }
            offset = 0;
          }
          
          if (textNode.nodeType !== Node.TEXT_NODE) {
            console.log('Not a text node:', textNode.nodeType);
            return;
          }
          
          const text = textNode.textContent || '';
          console.log('Text node content:', text.substring(0, 50));
          
          // Extract word boundaries
          const beforeCursor = text.substring(0, offset);
          const afterCursor = text.substring(offset);
          
          const beforeMatch = beforeCursor.match(/[\w'-]+$/);
          const afterMatch = afterCursor.match(/^[\w'-]+/);
          
          const wordBefore = beforeMatch ? beforeMatch[0] : '';
          const wordAfter = afterMatch ? afterMatch[0] : '';
          
          const clickedWord = (wordBefore + wordAfter).replace(/^['-]+|['-]+$/g, '').toLowerCase().trim();
          console.log('Extracted word from selection:', clickedWord);
          
          if (clickedWord && clickedWord.length > 1) {
            console.log('Calling onWordClick$ with:', clickedWord);
            onWordClick$(clickedWord);
          } else {
            console.log('Word too short or empty:', clickedWord);
          }
        }, 10);
      };
      
    console.log('Adding click event listener to preview (capture phase)');
    // Use capture phase to catch events before they bubble
    previewRef.value.addEventListener('click', handleClick, true);
    
    cleanup(() => {
      console.log('Removing click event listener from preview');
      if (previewRef.value) {
        previewRef.value.removeEventListener('click', handleClick, true);
      }
    });
  });

  return (
    <div 
      ref={previewRef}
      class="min-h-[300px] p-5 text-base overflow-y-auto flex-1 bg-white [&_h1]:text-3xl [&_h1]:my-3 [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:my-3 [&_h2]:font-bold [&_h3]:text-xl [&_h3]:my-3 [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-8 [&_ol]:list-decimal [&_li]:my-1 [&_li]:ml-4 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-blue-500 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_.rte-highlight]:bg-yellow-200 [&_.rte-highlight]:px-0.5 [&_.rte-highlight]:rounded cursor-pointer" 
      style={`line-height: ${lineSpacing?.value || '1.5'};`}
      dangerouslySetInnerHTML={highlightedHtml} 
    />
  );
});




