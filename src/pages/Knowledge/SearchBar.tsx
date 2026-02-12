import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => { setLocal(value) }, [value])

  const handleChange = (v: string) => {
    setLocal(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 300)
  }

  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索知识文章..."
        style={{
          width: '100%',
          padding: '10px 36px 10px 14px',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          fontSize: '1rem',
          background: 'var(--color-surface)',
        }}
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', fontSize: '1rem',
            color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0,
          }}
        >
          x
        </button>
      )}
    </div>
  )
}
