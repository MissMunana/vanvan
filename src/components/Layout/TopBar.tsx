import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useIsTablet } from '../../hooks/useMediaQuery'

const HIDDEN_ROUTES = ['/parent', '/print', '/health-report']

export function TopBar() {
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const setCurrentChild = useAppStore((s) => s.setCurrentChild)
  const getCurrentChild = useAppStore((s) => s.getCurrentChild)
  const navigate = useNavigate()
  const location = useLocation()
  const isTablet = useIsTablet()

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const child = getCurrentChild()
  const multiChild = children.length > 1

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close dropdown on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  if (HIDDEN_ROUTES.includes(location.pathname) || !child) return null

  const accentColor = child.themeColor ?? 'var(--color-primary)'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: isTablet ? 'var(--sidebar-width)' : 0,
      right: 0,
      height: 52,
      background: 'white',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 99,
    }}>
      <div
        ref={dropdownRef}
        style={{ position: 'relative' }}
      >
        <button
          onClick={() => multiChild && setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            background: 'none',
            border: 'none',
            cursor: multiChild ? 'pointer' : 'default',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: accentColor + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            {child.avatar}
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{child.name}</span>
          {multiChild && (
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
              {open ? '▲' : '▼'}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && multiChild && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            minWidth: 200,
            zIndex: 100,
          }}>
            {children.map((c) => (
              <button
                key={c.childId}
                onClick={() => {
                  setCurrentChild(c.childId)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  background: c.childId === currentChildId ? (c.themeColor ?? 'var(--color-primary)') + '15' : 'white',
                  borderBottom: '1px solid var(--color-border)',
                  border: 'none',
                  borderBlockEnd: '1px solid var(--color-border)',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: (c.themeColor ?? 'var(--color-primary)') + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem',
                }}>
                  {c.avatar}
                </div>
                <span style={{
                  flex: 1, fontWeight: c.childId === currentChildId ? 700 : 400,
                  fontSize: '0.85rem',
                }}>
                  {c.name}
                </span>
                {c.themeColor && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: c.themeColor,
                  }} />
                )}
                {c.childId === currentChildId && (
                  <span style={{ fontSize: '0.7rem', color: c.themeColor ?? 'var(--color-primary)', fontWeight: 600 }}>当前</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/parent')}
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          padding: '6px 10px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.04)',
          border: 'none',
        }}
      >
        家长
      </button>
    </div>
  )
}
