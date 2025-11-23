import { component$ } from '@builder.io/qwik';
import { getTextFromHtml } from '../utils/helpers';

export const CharCount = component$((props) => {
  const { mode, showPreview, state } = props;

  const charCount = mode.value === 'wysiwyg' || showPreview.value
    ? getTextFromHtml(state.html).length
    : mode.value === 'markdown' 
      ? state.markdown.length 
      : state.html.length;

  return (
    <div class="px-2 py-1 bg-gray-50 border-t border-gray-200 flex justify-end">
      <span class="text-xs text-gray-500">
        {charCount} chars
      </span>
    </div>
  );
});




