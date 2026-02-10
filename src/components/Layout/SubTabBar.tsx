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
    <div className="toggle-group" style={{
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
            className={`toggle-btn${isActive ? ' active' : ''}`}
            onClick={() => onChange(tab.key)}
            style={{
              flex: '1 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'nowrap',
              ...(isActive ? { background: color } : {}),
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
