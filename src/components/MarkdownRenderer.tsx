import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      children={content}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Ensure tables get full-width and Tailwind prose styles
        table: ({ node, ...props }) => (
          <table className="w-full table-auto border-collapse prose prose-slate" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="border px-2 py-1 bg-gray-100" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border px-2 py-1" {...props} />
        ),
        p: ({ node, ...props }) => <p className="mb-2" {...props} />
      }}
      className={`markdown-content prose prose-slate max-w-none ${className}`}
    />
  );
};
