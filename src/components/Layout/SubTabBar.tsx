import { AppIcon } from '../common/AppIcon'

interface TabItem<T extends string> {
  key: T
  label: string
  icon: string
}

interface SubTabBarProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (key: T) => void
  color?: string
}

export default function SubTabBar<T extends string>({ tabs, active, onChange, color = 'var(--color-health)' }: SubTabBarProps<T>) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      overflowX: 'auto',
      paddingBottom: 2,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              flex: '1 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: isActive ? 700 : 400,
              background: isActive ? color : 'var(--color-card)',
              color: isActive ? 'white' : 'var(--color-text-secondary)',
              border: isActive ? 'none' : '1px solid var(--color-border)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <AppIcon name={tab.icon} size={16} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
