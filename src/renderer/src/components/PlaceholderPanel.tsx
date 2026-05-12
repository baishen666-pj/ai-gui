export function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-3xl">🚧</div>
        <p className="text-sm text-zinc-500">{title} — 即将推出</p>
      </div>
    </div>
  )
}
