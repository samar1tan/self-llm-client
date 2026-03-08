import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CodeBlock } from './CodeBlock';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className;
          const content = String(children).replace(/\n$/, '');
          
          if (isInline) {
            return (
              <code
                className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {content}
              </code>
            );
          }

          return <CodeBlock className={className}>{content}</CodeBlock>;
        },
        pre({ children }) {
          return <>{children}</>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {children}
            </a>
          );
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-2 italic text-zinc-600 dark:text-zinc-400">
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-600">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="border border-zinc-300 dark:border-zinc-600 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 font-semibold text-left">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="border border-zinc-300 dark:border-zinc-600 px-4 py-2">
              {children}
            </td>
          );
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>;
        },
        p({ children }) {
          return <p className="my-2 leading-7">{children}</p>;
        },
        hr() {
          return <hr className="my-4 border-zinc-300 dark:border-zinc-600" />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
