import { component$ } from '@builder.io/qwik';
import { MarkdownPreview } from './MarkdownPreview';

export const EditorView = component$((props) => {
  const {
    mode,
    showPreview,
    placeholder,
    editorRef,
    markdownRef,
    htmlRef,
    state,
    handleInput$,
    handleSelect$,
    handleMarkdownInput$,
    handleHTMLInput$,
    highlightWords,
  } = props;

  return (
    <>
      {mode.value === 'wysiwyg' ? (
        <>
          {!showPreview.value ? (
            <div style="display: block; height: 200px; min-height: 200px; max-height: 800px; overflow: auto; resize: vertical;">
              <div
                ref={editorRef}
                class="min-h-full p-5 outline-none text-base leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic focus:bg-gray-50 [&_h1]:text-3xl [&_h1]:my-3 [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:my-3 [&_h2]:font-bold [&_h3]:text-xl [&_h3]:my-3 [&_h3]:font-bold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-8 [&_ol]:list-decimal [&_li]:my-1 [&_li]:ml-4 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                contentEditable="true"
                data-placeholder={placeholder}
                onInput$={handleInput$}
                onMouseUp$={handleSelect$}
                onKeyUp$={handleSelect$}
              />
            </div>
          ) : (
            <MarkdownPreview html={state.html} highlightWords={highlightWords} />
          )}
        </>
      ) : mode.value === 'markdown' ? (
        <>
          {!showPreview.value ? (
            <textarea
              ref={markdownRef}
              class="h-[200px] p-5 font-mono text-sm leading-relaxed border-none outline-none resize-y bg-gray-50 text-gray-800 w-full focus:bg-white"
              placeholder="Type markdown here..."
              value={state.markdown}
              onInput$={handleMarkdownInput$}
              onKeyUp$={handleMarkdownInput$}
              style="resize: vertical; min-height: 200px; max-height: 800px;"
            />
          ) : (
            <MarkdownPreview html={state.html} highlightWords={highlightWords} />
          )}
        </>
      ) : (
        <>
          {!showPreview.value ? (
            <textarea
              ref={htmlRef}
              class="h-[200px] p-5 font-mono text-sm leading-relaxed border-none outline-none resize-y bg-gray-50 text-gray-800 w-full focus:bg-white"
              placeholder="Type HTML here..."
              value={state.html}
              onInput$={handleHTMLInput$}
              onKeyUp$={handleHTMLInput$}
              style="resize: vertical; min-height: 200px; max-height: 800px;"
            />
          ) : (
            <MarkdownPreview html={state.html} highlightWords={highlightWords} />
          )}
        </>
      )}
    </>
  );
});




