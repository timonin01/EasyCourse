import ReactMarkdown from 'react-markdown';

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className = '' }: ChatMarkdownProps) {
  return (
    <div className={`markdown-content prose prose-sm prose-invert max-w-none break-words ${className}`}>
      <ReactMarkdown
        components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-dark-200">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-dark-100">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ className: codeClassName, children }) => {
          const isBlock = codeClassName?.includes('language-');
          if (isBlock) {
            return (
              <pre className="my-2 overflow-x-auto rounded-lg bg-dark-950 border border-dark-600 p-3">
                <code className="text-xs text-primary-200">{children}</code>
              </pre>
            );
          }
          return (
            <code className="rounded bg-dark-700 px-1.5 py-0.5 text-xs text-primary-300">
              {children}
            </code>
          );
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 underline hover:text-primary-300"
          >
            {children}
          </a>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-6 text-xl font-bold text-dark-100 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-5 text-lg font-semibold text-dark-100">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-4 text-base font-semibold text-primary-200">{children}</h4>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
