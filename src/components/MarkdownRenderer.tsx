import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure marked for GitHub Flavored Markdown
const renderer = new marked.Renderer();

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer: renderer
});

// Custom highlight function
const highlightCode = (code: string, lang: string) => {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch (__) {}
  }
  return hljs.highlightAuto(code).value;
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const safeContent = content ?? '';
  // Parse markdown (with GFM tables) and sanitize
  const rawHtml = marked.parse(safeContent);
  const sanitizedContent = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['table','thead','tbody','tr','th','td'],
    ADD_ATTR: ['class']
  });

  useEffect(() => {
    // Add copy buttons to code blocks after render
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block, index) => {
      const pre = block.parentElement;
      if (pre && !pre.querySelector('.copy-button')) {
        const button = document.createElement('button');
        button.className = 'copy-button absolute top-2 right-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors';
        button.setAttribute('data-code-id', index.toString());
        
        const icon = document.createElement('div');
        icon.className = 'w-4 h-4';
        button.appendChild(icon);
        
        button.onclick = () => {
          const codeText = block.textContent || '';
          copyToClipboard(codeText, index.toString());
        };
        
        pre.style.position = 'relative';
        pre.appendChild(button);
      }
    });

    // Update button icons based on copied state
    const buttons = document.querySelectorAll('.copy-button');
    buttons.forEach((button) => {
      const codeId = button.getAttribute('data-code-id');
      const icon = button.querySelector('div');
      if (icon) {
        if (copiedCode === codeId) {
          icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        } else {
          icon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
        }
      }
    });
  }, [sanitizedContent, copiedCode]);

  return (
    <div
      className={`
      markdown-content
      prose
      prose-slate
      prose-table:border
      prose-table:border-gray-200
      prose-code:bg-muted
      max-w-none
      ${className}
      `}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
  );
};
