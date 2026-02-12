interface PageLoadingProps {
  isLoading: boolean
  error?: string | null
  children: React.ReactNode
}

export default function PageLoading({ isLoading, error, children }: PageLoadingProps) {
  if (error) {
    return (
      <div style={{
        padding: 32,
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>😵</div>
        <div style={{ fontSize: 'var(--text-sm)' }}>加载失败: {error}</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{
        padding: 32,
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ fontSize: 'var(--text-sm)' }}>加载中...</div>
      </div>
    )
  }

  return <>{children}</>
}
