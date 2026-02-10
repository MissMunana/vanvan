import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '✨' },
  { path: '/tasks', label: '任务', icon: '🎯' },
  { path: '/shop', label: '商城', icon: '🎪' },
  { path: '/profile', label: '我的', icon: '🐻' },
  { path: '/parent', label: '家长', icon: '🔒' },
]

export function SideNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      height: '100dvh',
      position: 'sticky',
      top: 0,
      background: 'white',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      zIndex: 100,
    }}>
      <div style={{
        padding: '0 20px 24px',
        fontSize: '1.2rem',
        fontWeight: 700,
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: '1.5rem' }}>⭐</span>
        <span>小星星成长宝</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
                fontWeight: isActive ? 700 : 400,
                fontSize: '0.95rem',
                borderRadius: 0,
                transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
