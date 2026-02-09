import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: '🏠', activeIcon: '🏡' },
  { path: '/tasks', label: '任务', icon: '📋', activeIcon: '📝' },
  { path: '/shop', label: '商城', icon: '🎁', activeIcon: '🎊' },
  { path: '/profile', label: '我的', icon: '👤', activeIcon: '⭐' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname.startsWith('/parent') || location.pathname === '/onboarding') {
    return null
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      height: 'var(--nav-height)',
      background: 'white',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'var(--safe-bottom)',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 16px',
              transition: 'transform 0.2s',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>
              {isActive ? item.activeIcon : item.icon}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: isActive ? 700 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
