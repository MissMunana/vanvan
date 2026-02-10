import { useLocation, useNavigate } from 'react-router-dom'
import { AppIcon } from '../common/AppIcon'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: 'Home' },
  { path: '/health', label: '健康', icon: 'HeartPulse' },
  { path: '/shop', label: '商城', icon: 'Gift' },
  { path: '/knowledge', label: '知识', icon: 'BookOpen' },
  { path: '/profile', label: '我的', icon: 'User' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname.startsWith('/parent') || location.pathname === '/onboarding') {
    return null
  }

  return (
    <>
      <style>{`
        @keyframes nav-bounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .nav-icon-active {
          animation: nav-bounce 0.4s ease-out forwards;
        }
      `}</style>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        height: 'calc(var(--nav-height) + var(--safe-bottom))',
        background: 'white',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: 6,
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
                padding: '6px 8px',
              }}
            >
              <span
                className={isActive ? 'nav-icon-active' : ''}
                style={{
                  display: 'inline-flex',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                <AppIcon name={item.icon} size={22} />
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
    </>
  )
}
