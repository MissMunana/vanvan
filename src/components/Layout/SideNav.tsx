import { useLocation, useNavigate } from 'react-router-dom'
import { AppIcon } from '../common/AppIcon'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: 'Sparkles' },
  { path: '/tasks', label: '任务', icon: 'Target' },
  { path: '/shop', label: '商城', icon: 'Gift' },
  { path: '/profile', label: '我的', icon: 'PawPrint' },
  { path: '/parent', label: '家长', icon: 'Lock' },
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
        <AppIcon name="Star" size={24} color="#FFB800" />
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
              <AppIcon name={item.icon} size={22} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
