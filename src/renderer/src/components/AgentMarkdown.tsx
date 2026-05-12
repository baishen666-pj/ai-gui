import { useState, useCallback, Suspense, lazy, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism-light').then((m) => {
    return import('react-syntax-highlighter/dist/esm/languages/prism/typescript').then((ts) => {
      m.registerLanguage('typescript', ts.default)
      return import('react-syntax-highlighter/dist/esm/languages/prism/python').then((py) => {
        m.registerLanguage('python', py.default)
        return import('react-syntax-highlighter/dist/esm/languages/prism/bash').then((bash) => {
          m.registerLanguage('bash', bash.default)
          return import('react-syntax-highlighter/dist/esm/languages/prism/json').then((json) => {
            m.registerLanguage('json', json.default)
            return import('react-syntax-highlighter/dist/esm/languages/prism/css').then((css) => {
              m.registerLanguage('css', css.default)
              return import('react-syntax-highlighter/dist/esm/languages/prism/markdown').then(
                (md) => {
                  m.registerLanguage('markdown', md.default)
                  return { default: m.default || m }
                }
              )
            })
          })
        })
      })
    })
  })
)

interface CodeBlockProps {
  language: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children])

  const isDiff = language === 'diff'

  if (isDiff) {
    return (
      <div className="group relative my-2 overflow-hidden rounded-lg border border-border-default">
        <div className="flex items-center justify-between bg-surface-overlay px-3 py-1 text-xs text-content-muted">
          <span>diff</span>
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
        <pre className="overflow-x-auto bg-surface-elevated p-3 text-sm">
          {children.split('\n').map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('+')
                  ? 'text-green-400'
                  : line.startsWith('-')
                    ? 'text-red-400'
                    : 'text-content-heading'
              }
            >
              {line}
            </div>
          ))}
        </pre>
      </div>
    )
  }

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border-default">
      <div className="flex items-center justify-between bg-surface-overlay px-3 py-1 text-xs text-content-muted">
        <span>{language || 'code'}</span>
        <CopyButton copied={copied} onClick={handleCopy} />
      </div>
      <Suspense
        fallback={
          <pre className="bg-surface-elevated p-3 text-sm text-content-heading">{children}</pre>
        }
      >
        <SyntaxHighlighter
          language={language || 'typescript'}
          useInlineStyles={false}
          wrapLongLines
          className="!bg-surface-elevated !p-3 !text-sm"
        >
          {children}
        </SyntaxHighlighter>
      </Suspense>
    </div>
  )
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded px-2 py-0.5 text-xs text-content-subtle hover:bg-surface-inset hover:text-content-heading"
    >
      {copied ? '已复制' : '复制'}
    </button>
  )
}

interface AgentMarkdownProps {
  content: string
}

const markdownComponents = {
  code(props: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
    const { className, children, ...rest } = props
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match && !className
    if (isInline) {
      return <code className={className} {...rest}>{children}</code>
    }
    return (
      <CodeBlock language={match?.[1] || ''}>
        {String(children).replace(/\n$/, '')}
      </CodeBlock>
    )
  },
  a(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) {
    const { href, children } = props
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault()
          if (href && (href.startsWith('http') || href.startsWith('mailto'))) {
            window.aiGui?.openExternal(href)
          }
        }}
        className="cursor-pointer"
      >
        {children}
      </a>
    )
  }
}

export const AgentMarkdown = memo(function AgentMarkdown({ content }: AgentMarkdownProps) {
  return (
    <div className="prose-invert max-w-none text-sm text-content-secondary [&_a]:text-accent-text [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border-default [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-content-muted [&_code]:rounded [&_code]:bg-surface-overlay [&_code]:px-1 [&_code]:text-accent-text [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-bold [&_hr]:border-border-default [&_li]:ml-4 [&_ol]:list-decimal [&_p]:my-1 [&_strong]:text-content-primary [&_table]:my-2 [&_td]:border [&_td]:border-border-default [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border-default [&_th]:bg-surface-overlay [&_th]:px-2 [&_th]:py-1 [&_th]:font-medium [&_ul]:list-disc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
