import { css as p } from "@umbraco-cms/backoffice/external/lit";
function u(o, e) {
  const r = o.split("`");
  for (let t = 0; t < r.length; t += 2)
    r[t] = e(r[t]);
  return r.join("`");
}
function d(o) {
  let e = o;
  return e = e.replace(/^(\s*)(at\s+[^\n`]+)$/gm, (r, t, s) => /^\s*`/.test(`${t}${s}`) ? `${t}${s}` : `${t}\`${s.trim()}\``), e = e.replace(/\b([A-Za-z]:\\(?:[^\s<>`]|\\)+)(?=[\s,.;:!?)\]'"`]|$)/g, "`$1`"), e = e.replace(
    /\b(\/(?:[\w.-]+\/)+[\w.-]+\.(?:cs|ts|tsx|js|jsx|json|xml|config|cshtml|csproj|props|targets|dll|exe))(?=$|\s|[,.;:!?)}\]])/gi,
    "`$1`"
  ), e = e.replace(/\b((?:[A-Z][\w]*\.){2,}[A-Z][\w]*)\b/g, (r) => r.length < 12 ? r : `\`${r}\``), e;
}
function m(o) {
  return o.split(/(```[\w]*\r?\n[\s\S]*?```)/g).map((r, t) => t % 2 === 1 ? r : u(r, d)).join("");
}
function $(o) {
  if (!o)
    return "";
  let e = m(o);
  e = e.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (a, c, l) => {
    const n = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code class="language-${c || "plaintext"}">${n.trim()}</code></pre>`;
  }), e = e.replace(/`([^`]+)`/g, (a, c) => `<code>${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`), e = e.replace(/\*\*([^\*]+?)\*\*/g, "<strong>$1</strong>"), e = e.replace(/__([^_]+?)__/g, "<strong>$1</strong>"), e = e.replace(/\*([^\*]+?)\*/g, "<em>$1</em>"), e = e.replace(/_([^_]+?)_/g, "<em>$1</em>"), e = e.replace(/~~(.+?)~~/g, "<del>$1</del>"), e = e.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>"), e = e.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>"), e = e.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>"), e = e.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>"), e = e.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>"), e = e.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>"), e = e.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  ), e = e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />'), e = e.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>"), e = e.replace(/^---$/gm, "<hr>"), e = e.replace(/^\*\*\*$/gm, "<hr>");
  const r = /(?:^\*\s+.+$\n?)+/gm;
  e = e.replace(r, (a) => `<ul>${a.split(`
`).filter((n) => n.trim()).map((n) => `<li>${n.replace(/^\*\s+/, "")}</li>`).join("")}</ul>`);
  const t = /(?:^-\s+.+$\n?)+/gm;
  e = e.replace(t, (a) => `<ul>${a.split(`
`).filter((n) => n.trim()).map((n) => `<li>${n.replace(/^-\s+/, "")}</li>`).join("")}</ul>`);
  const s = /(?:^\d+\.\s+.+$\n?)+/gm;
  return e = e.replace(s, (a) => `<ol>${a.split(`
`).filter((n) => n.trim()).map((n) => `<li>${n.replace(/^\d+\.\s+/, "")}</li>`).join("")}</ol>`), e = e.replace(/\n\n+/g, "</p><p>"), e = e.replace(/\n/g, "<br>"), e.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/) || (e = `<p>${e}</p>`), e = e.replace(/<p>(<h[1-6]>)/g, "$1"), e = e.replace(/(<\/h[1-6]>)<\/p>/g, "$1"), e = e.replace(/<p>(<ul>)/g, "$1"), e = e.replace(/(<\/ul>)<\/p>/g, "$1"), e = e.replace(/<p>(<ol>)/g, "$1"), e = e.replace(/(<\/ol>)<\/p>/g, "$1"), e = e.replace(/<p>(<pre>)/g, "$1"), e = e.replace(/(<\/pre>)<\/p>/g, "$1"), e = e.replace(/<p>(<blockquote>)/g, "$1"), e = e.replace(/(<\/blockquote>)<\/p>/g, "$1"), e = e.replace(/<p>(<hr>)<\/p>/g, "$1"), e = e.replace(/<p><\/p>/g, ""), e;
}
const h = p`
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
export {
  h as analysisMarkdownContentStyles,
  m as enhanceMarkdownCodeHints,
  $ as renderAnalysisMarkdown
};
//# sourceMappingURL=analysis-markdown.js.map
