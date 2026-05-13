import { useState, useCallback, Suspense, lazy, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism-light').then(async (m) => {
    const languages = [
      'typescript', 'javascript', 'python', 'bash', 'json', 'css', 'markdown',
      'html', 'sql', 'yaml', 'rust', 'go', 'java', 'c', 'cpp', 'shell'
    ]
    for (const lang of languages) {
      try {
        const mod = await import(/* @vite-ignore */ `react-syntax-highlighter/dist/esm/languages/prism/${lang}`)
        m.registerLanguage(lang, mod.default)
      } catch { /* skip unavailable */ }
    }
    return { default: m.default || m }
  })
)

interface CodeBlockProps {
  language: string
  children: string
}

const RUNNABLE_LANGS = new Set(['javascript', 'js', 'typescript', 'ts', 'python', 'py', 'bash', 'sh', 'shell'])

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children])

  const handleRun = useCallback(() => {
    const lang = language.toLowerCase()
    setRunning(true)
    setOutput(null)

    if (lang === 'python' || lang === 'py') {
      if (window.aiGui) {
        window.aiGui.chatSend({
          messages: [
            { role: 'system', content: 'Execute this Python code and return ONLY the output. If there is an error, return the error message prefixed with "Error:".' },
            { role: 'user', content: `\`\`\`python\n${children}\n\`\`\`` }
          ]
        }).catch(() => {})
        let buf = ''
        const unsubChunk = window.aiGui.onChatChunk((chunk: string) => { buf += chunk; setOutput(buf) })
        const unsubDone = window.aiGui.onChatDone(() => { unsubChunk(); unsubDone(); unsubErr(); setRunning(false) })
        const unsubErr = window.aiGui.onChatError((msg: string) => { unsubChunk(); unsubDone(); unsubErr(); setOutput(`Error: ${msg}`); setRunning(false) })
      }
      return
    }

    // JS/TS/Bash — execute locally via eval (sandboxed) or shell
    if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
      if (window.aiGui?.runShell) {
        window.aiGui.runShell(children).then((result: string) => { setOutput(result); setRunning(false) }).catch((e: Error) => { setOutput(`Error: ${e.message}`); setRunning(false) })
      } else {
        setOutput('Shell execution not available in browser mode')
        setRunning(false)
      }
      return
    }

    // JavaScript / TypeScript — eval in sandbox
    try {
      const logs: string[] = []
      const fakeConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(' ')), error: (...args: unknown[]) => logs.push('Error: ' + args.map(String).join(' ')), warn: (...args: unknown[]) => logs.push('Warn: ' + args.map(String).join(' ')) }
      const code = lang === 'typescript' || lang === 'ts'
        ? children.replace(/:\s+(\w+)(\[\])?/g, '').replace(/:\s+\w+/g, '').replace(/interface\s+\w+\s*\{[^}]*\}/g, '').replace(/<\w+>/g, '')
        : children
      const fn = new Function('console', code)
      const result = fn(fakeConsole)
      const out = logs.join('\n') + (result !== undefined ? (logs.length ? '\n→ ' : '→ ') + String(result) : '')
      setOutput(out || '(no output)')
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`)
    }
    setRunning(false)
  }, [language, children])

  const isDiff = language === 'diff'
  const canRun = RUNNABLE_LANGS.has(language.toLowerCase())

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
                  ? 'bg-success/10 text-success'
                  : line.startsWith('-')
                    ? 'bg-danger/10 text-danger'
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
        <div className="flex items-center gap-1">
          {canRun && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-success transition-colors hover:bg-success/10 disabled:opacity-40"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
              {running ? '运行中...' : '运行'}
            </button>
          )}
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
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
      {output !== null && (
        <div className="border-t border-border-subtle bg-surface-base px-3 py-2">
          <div className="mb-1 text-[10px] font-medium text-content-subtle">输出</div>
          <pre className="overflow-x-auto text-xs text-content-secondary whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-content-subtle transition-colors hover:bg-surface-inset hover:text-content-heading"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
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
