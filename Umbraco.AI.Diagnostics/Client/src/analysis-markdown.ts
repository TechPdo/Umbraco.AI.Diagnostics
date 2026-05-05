import { css } from '@umbraco-cms/backoffice/external/lit';

/**
 * Applies fn only to segments outside `...` inline spans (odd split indices).
 */
function processOutsideBackticks(segment: string, fn: (plain: string) => string): string {
    const parts = segment.split('`');
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = fn(parts[i]);
    }
    return parts.join('`');
}

/**
 * Wraps common log / stack / path patterns in backticks so markdown renders them as <code>.
 * Skips fenced ``` blocks (caller splits those out).
 */
function wrapCodeLikePatternsInPlainMarkdown(plain: string): string {
    let s = plain;

    // Stack trace lines: "at Namespace.Type.Method ..."
    s = s.replace(/^(\s*)(at\s+[^\n`]+)$/gm, (_, indent: string, rest: string) => {
        if (/^\s*`/.test(`${indent}${rest}`)) {
            return `${indent}${rest}`;
        }
        return `${indent}\`${rest.trim()}\``;
    });

    // Windows paths
    s = s.replace(/\b([A-Za-z]:\\(?:[^\s<>`]|\\)+)(?=[\s,.;:!?)\]'"`]|$)/g, '`$1`');

    // Unix-style paths ending in a file extension (slashes escaped so the regex literal is valid)
    s = s.replace(
        /\b(\/(?:[\w.-]+\/)+[\w.-]+\.(?:cs|ts|tsx|js|jsx|json|xml|config|cshtml|csproj|props|targets|dll|exe))(?=$|\s|[,.;:!?)}\]])/gi,
        '`$1`',
    );

    // Dotted type / namespace segments (e.g. Umbraco.Cms.Core.Logging.Logger)
    s = s.replace(/\b((?:[A-Z][\w]*\.){2,}[A-Z][\w]*)\b/g, (full) => {
        if (full.length < 12) {
            return full;
        }
        return `\`${full}\``;
    });

    return s;
}

/**
 * Enhances markdown before HTML conversion: code-like patterns → inline code.
 */
export function enhanceMarkdownCodeHints(markdown: string): string {
    const chunks = markdown.split(/(```[\w]*\r?\n[\s\S]*?```)/g);
    return chunks
        .map((chunk, i) => {
            if (i % 2 === 1) {
                return chunk;
            }
            return processOutsideBackticks(chunk, wrapCodeLikePatternsInPlainMarkdown);
        })
        .join('');
}

/**
 * Converts a subset of Markdown (plus auto-detected code snippets) to HTML for AI analysis text.
 */
export function renderAnalysisMarkdown(text: string): string {
    if (!text) {
        return '';
    }

    let html = enhanceMarkdownCodeHints(text);

    // Code blocks (must be before inline code)
    html = html.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (_, lang: string, code: string) => {
        const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code class="language-${lang || 'plaintext'}">${escapedCode.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, (_, code: string) => {
        const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<code>${escapedCode}</code>`;
    });

    // Bold (must be before italic) - NON-GREEDY matching
    html = html.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

    // Italic - NON-GREEDY matching
    html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Headers (must be processed before paragraphs)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Links
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');

    // Unordered lists
    const unorderedListRegex = /(?:^\*\s+.+$\n?)+/gm;
    html = html.replace(unorderedListRegex, (match) => {
        const items = match.split('\n').filter((line) => line.trim());
        const listItems = items
            .map((item) => {
                const content = item.replace(/^\*\s+/, '');
                return `<li>${content}</li>`;
            })
            .join('');
        return `<ul>${listItems}</ul>`;
    });

    const dashListRegex = /(?:^-\s+.+$\n?)+/gm;
    html = html.replace(dashListRegex, (match) => {
        const items = match.split('\n').filter((line) => line.trim());
        const listItems = items
            .map((item) => {
                const content = item.replace(/^-\s+/, '');
                return `<li>${content}</li>`;
            })
            .join('');
        return `<ul>${listItems}</ul>`;
    });

    // Ordered lists
    const orderedListRegex = /(?:^\d+\.\s+.+$\n?)+/gm;
    html = html.replace(orderedListRegex, (match) => {
        const items = match.split('\n').filter((line) => line.trim());
        const listItems = items
            .map((item) => {
                const content = item.replace(/^\d+\.\s+/, '');
                return `<li>${content}</li>`;
            })
            .join('');
        return `<ol>${listItems}</ol>`;
    });

    // Line breaks and paragraphs (do this last)
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    if (!html.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/)) {
        html = `<p>${html}</p>`;
    }

    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

/** Shared styles for markdown-rendered analysis (workspace + modal). */
export const analysisMarkdownContentStyles = css`
    .markdown-content {
        line-height: 1.6;
    }

    .markdown-content p {
        margin: var(--uui-size-space-2) 0;
    }

    .markdown-content strong {
        font-weight: 600;
    }

    .markdown-content em {
        font-style: italic;
    }

    .markdown-content code {
        background: var(--uui-color-surface-alt);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: ui-monospace, 'Cascadia Code', 'Courier New', monospace;
        font-size: 0.875em;
        font-weight: 500;
        color: var(--uui-color-text);
        border: 1px solid var(--uui-color-border);
        word-break: break-word;
    }

    .markdown-content pre {
        background: var(--uui-color-surface-alt);
        padding: var(--uui-size-space-3);
        border-radius: var(--uui-border-radius);
        overflow-x: auto;
        margin: var(--uui-size-space-3) 0;
        border: 1px solid var(--uui-color-border);
    }

    .markdown-content pre code {
        background: none;
        padding: 0;
        border: none;
        font-weight: 400;
        font-size: 0.8125rem;
        word-break: normal;
        white-space: pre;
    }

    .markdown-content ul,
    .markdown-content ol {
        margin: var(--uui-size-space-2) 0;
        padding-left: var(--uui-size-space-5);
    }

    .markdown-content li {
        margin-bottom: var(--uui-size-space-1);
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
        margin: var(--uui-size-space-3) 0 var(--uui-size-space-2) 0;
        font-weight: 600;
    }

    .markdown-content h1 {
        font-size: 1.5em;
    }
    .markdown-content h2 {
        font-size: 1.3em;
    }
    .markdown-content h3 {
        font-size: 1.1em;
    }

    .markdown-content blockquote {
        border-left: 3px solid var(--uui-color-border);
        padding-left: var(--uui-size-space-3);
        margin: var(--uui-size-space-3) 0;
        color: var(--uui-color-text-alt);
    }

    .markdown-content hr {
        border: none;
        border-top: 1px solid var(--uui-color-border);
        margin: var(--uui-size-space-4) 0;
    }

    .markdown-content a {
        color: var(--uui-color-interactive);
        text-decoration: none;
    }

    .markdown-content a:hover {
        text-decoration: underline;
    }
`;
