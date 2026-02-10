import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
type TemplateStyle = 'bear' | 'space' | 'clean'

const STYLES: Record<TemplateStyle, { label: string; icon: string; bgColor: string; accentColor: string }> = {
  bear: { label: '小熊森林', icon: '🐻', bgColor: '#FFF9EC', accentColor: '#8D6E63' },
  space: { label: '星际探险', icon: '🚀', bgColor: '#E8EAF6', accentColor: '#3F51B5' },
  clean: { label: '简约清新', icon: '📋', bgColor: '#FFFFFF', accentColor: '#607D8B' },
}

function getWeekDates() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default function Print() {
  const navigate = useNavigate()
  const children = useAppStore((s) => s.children)
  const currentChildId = useAppStore((s) => s.currentChildId)
  const allTasks = useTaskStore((s) => s.tasks)
  const [style, setStyle] = useState<TemplateStyle>('bear')

  const child = useMemo(() => children.find((c) => c.childId === currentChildId) || null, [children, currentChildId])
  const childId = child?.childId || ''

  const tasks = useMemo(() => allTasks.filter((t) => t.childId === childId && t.isActive), [allTasks, childId])

  const weekDates = useMemo(() => getWeekDates(), [])
  const weekRange = `${weekDates[0].getMonth() + 1}月${weekDates[0].getDate()}日 - ${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日`

  const styleConfig = STYLES[style]

  if (!child) return null

  return (
    <div>
      {/* Controls - hidden in print */}
      <div className="no-print" style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 480,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(-1)} style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            ← 返回
          </button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>打印任务表</h2>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(Object.entries(STYLES) as [TemplateStyle, typeof styleConfig][]).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 12,
                border: style === key ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                background: style === key ? 'var(--color-primary-light)' : 'white',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{s.icon} {s.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-primary btn-block"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>🖨️ 打印</span>
        </button>
      </div>

      {/* Printable area */}
      <div
        id="print-area"
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: 24,
          background: styleConfig.bgColor,
          fontFamily: "'ZCOOL KuaiLe', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: `3px dashed ${styleConfig.accentColor}40`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: styleConfig.accentColor }}>
            ★ {child.name} 的小星星任务表 ★
          </div>
          <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
            本周日期：{weekRange}
          </div>
        </div>

        {/* Task table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '10px 8px',
                textAlign: 'left',
                borderBottom: `2px solid ${styleConfig.accentColor}`,
                color: styleConfig.accentColor,
                width: '30%',
              }}>
                我的任务
              </th>
              {DAY_LABELS.map((d) => (
                <th key={d} style={{
                  padding: '10px 4px',
                  textAlign: 'center',
                  borderBottom: `2px solid ${styleConfig.accentColor}`,
                  color: styleConfig.accentColor,
                  width: '10%',
                }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.taskId}>
                <td style={{
                  padding: '10px 8px',
                  borderBottom: '1px solid #e0e0e0',
                  fontWeight: 600,
                }}>
                  {task.icon} {task.name}
                </td>
                {DAY_LABELS.map((d) => (
                  <td key={d} style={{
                    padding: '10px 4px',
                    textAlign: 'center',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      border: `2px solid ${styleConfig.accentColor}40`,
                      borderRadius: 4,
                      margin: '0 auto',
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 20, display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: styleConfig.accentColor, marginBottom: 6 }}>
              本周累计星星：_________ ★
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: styleConfig.accentColor, marginBottom: 6 }}>
            爸爸妈妈寄语：
          </div>
          <div style={{
            height: 60,
            border: `1.5px dashed ${styleConfig.accentColor}40`,
            borderRadius: 8,
          }} />
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 16,
          fontSize: 12,
          color: '#bbb',
        }}>
          完成任务后，在方格里画 ★ 或贴小贴纸吧！
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #print-area {
            max-width: none;
            margin: 0;
            padding: 20mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
