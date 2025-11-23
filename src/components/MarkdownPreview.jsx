import { component$ } from '@builder.io/qwik';
import { highlightWords } from '../utils/highlighting';

export const MarkdownPreview = component$(({ html, highlightWords: wordsToHighlight = [] }) => {
  const highlightedHtml = wordsToHighlight && wordsToHighlight.length > 0
    ? highlightWords(html || '', wordsToHighlight)
    : html || '';

  return (
    <div 
      class="min-h-[300px] p-5 text-base leading-relaxed overflow-y-auto flex-1 bg-white [&_h1]:text-3xl [&_h1]:my-3 [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:my-3 [&_h2]:font-bold [&_h3]:text-xl [&_h3]:my-3 [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-8 [&_ol]:list-decimal [&_li]:my-1 [&_li]:ml-4 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-blue-500 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_.rte-highlight]:bg-yellow-200 [&_.rte-highlight]:px-0.5 [&_.rte-highlight]:rounded" 
      dangerouslySetInnerHTML={highlightedHtml} 
    />
  );
});




