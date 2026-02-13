import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useTaskStore } from '../../stores/taskStore'
import { getToday } from '../../utils/generateId'

type TemplateStyle = 'bear' | 'space' | 'clean'
type PrintType = 'weekly' | 'challenge'

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
  const [printType, setPrintType] = useState<PrintType>('weekly')
  const [challengeName, setChallengeName] = useState('')
  const [startDate, setStartDate] = useState(() => getToday())

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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>打印中心</h2>
          <div style={{ width: 40 }} />
        </div>

        {/* Print type selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPrintType('weekly')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, textAlign: 'center',
              border: printType === 'weekly' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              background: printType === 'weekly' ? 'var(--color-primary-light)' : 'white',
            }}
          >
            📋 每周任务表
          </button>
          <button
            onClick={() => setPrintType('challenge')}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, textAlign: 'center',
              border: printType === 'challenge' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              background: printType === 'challenge' ? 'var(--color-primary-light)' : 'white',
            }}
          >
            🏆 30天挑战卡
          </button>
        </div>

        {/* Challenge card options */}
        {printType === 'challenge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                挑战任务
              </label>
              {tasks.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {tasks.map((t) => (
                    <button
                      key={t.taskId}
                      onClick={() => setChallengeName(`${t.icon} ${t.name}`)}
                      style={{
                        padding: '4px 10px', borderRadius: 14, fontSize: '0.75rem',
                        border: challengeName === `${t.icon} ${t.name}` ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                        background: challengeName === `${t.icon} ${t.name}` ? 'var(--color-primary-light)' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {t.icon} {t.name}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                placeholder="或自定义挑战名，如：每天自己刷牙"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--color-border)', fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--color-border)', fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        )}

        {/* Style selector */}
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
          disabled={printType === 'challenge' && !challengeName.trim()}
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
        {printType === 'weekly' ? (
          <WeeklyTable child={child} tasks={tasks} weekRange={weekRange} styleConfig={styleConfig} />
        ) : (
          <ChallengeCard child={child} challengeName={challengeName} startDate={startDate} styleConfig={styleConfig} />
        )}
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

// ---- Weekly Task Table (V1) ----
function WeeklyTable({ child, tasks, weekRange, styleConfig }: {
  child: { name: string }
  tasks: { taskId: string; icon: string; name: string }[]
  weekRange: string
  styleConfig: { accentColor: string }
}) {
  return (
    <>
      <div style={{
        textAlign: 'center', marginBottom: 20, paddingBottom: 12,
        borderBottom: `3px dashed ${styleConfig.accentColor}40`,
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: styleConfig.accentColor }}>
          ★ {child.name} 的小星星任务表 ★
        </div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
          本周日期：{weekRange}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{
              padding: '10px 8px', textAlign: 'left',
              borderBottom: `2px solid ${styleConfig.accentColor}`,
              color: styleConfig.accentColor, width: '30%',
            }}>
              我的任务
            </th>
            {DAY_LABELS.map((d) => (
              <th key={d} style={{
                padding: '10px 4px', textAlign: 'center',
                borderBottom: `2px solid ${styleConfig.accentColor}`,
                color: styleConfig.accentColor, width: '10%',
              }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.taskId}>
              <td style={{ padding: '10px 8px', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
                {task.icon} {task.name}
              </td>
              {DAY_LABELS.map((d) => (
                <td key={d} style={{ padding: '10px 4px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{
                    width: 24, height: 24,
                    border: `2px solid ${styleConfig.accentColor}40`,
                    borderRadius: 4, margin: '0 auto',
                  }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
        <div style={{ height: 60, border: `1.5px dashed ${styleConfig.accentColor}40`, borderRadius: 8 }} />
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#bbb' }}>
        完成任务后，在方格里画 ★ 或贴小贴纸吧！
      </div>
    </>
  )
}

// ---- 30-Day Challenge Card (V2) ----
function ChallengeCard({ child, challengeName, startDate, styleConfig }: {
  child: { name: string }
  challengeName: string
  startDate: string
  styleConfig: { accentColor: string }
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const rows: number[][] = []
  for (let i = 0; i < days.length; i += 5) {
    rows.push(days.slice(i, i + 5))
  }

  const milestones: Record<number, string> = {
    10: '← 第一关！',
    20: '← 第二关！',
    30: '← 挑战成功！',
  }

  return (
    <>
      {/* Header */}
      <div style={{
        textAlign: 'center', marginBottom: 24, paddingBottom: 16,
        borderBottom: `3px dashed ${styleConfig.accentColor}40`,
      }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: styleConfig.accentColor }}>
          🏆 30天挑战：{challengeName || '______'} 🏆
        </div>
        <div style={{ fontSize: 16, marginTop: 8, color: '#555' }}>
          挑战者：{child.name}
        </div>
        <div style={{ fontSize: 14, marginTop: 4, color: '#888' }}>
          开始日期：{formatDate(startDate)}
        </div>
      </div>

      {/* 30 checkboxes: 6 rows × 5 columns */}
      <div style={{ marginBottom: 20 }}>
        {rows.map((row, rowIdx) => {
          const lastDay = row[row.length - 1]
          const milestone = milestones[lastDay]
          return (
            <div key={rowIdx} style={{
              display: 'flex', alignItems: 'center', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                {row.map((day) => (
                  <div key={day} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    flex: 1,
                  }}>
                    <div style={{
                      width: 36, height: 36,
                      border: `2.5px solid ${styleConfig.accentColor}${day === 10 || day === 20 || day === 30 ? '' : '60'}`,
                      borderRadius: day === 10 || day === 20 || day === 30 ? '50%' : 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: day === 30 ? `${styleConfig.accentColor}10` : 'transparent',
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: styleConfig.accentColor,
                      }}>
                        {day}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {milestone && (
                <div style={{
                  fontSize: 13, fontWeight: 700, color: styleConfig.accentColor,
                  marginLeft: 8, whiteSpace: 'nowrap',
                }}>
                  {milestone}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Motivational messages */}
      <div style={{
        padding: 16, borderRadius: 12,
        border: `2px dashed ${styleConfig.accentColor}30`,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, lineHeight: 2 }}>
          <div>💪 第10天：你已经是习惯小达人了！</div>
          <div>🔥 第20天：太厉害了，坚持就是胜利！</div>
          <div>🏆 第30天：恭喜你完成挑战！你是最棒的！</div>
        </div>
      </div>

      {/* Notes area */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: styleConfig.accentColor, marginBottom: 6 }}>
          爸爸妈妈寄语：
        </div>
        <div style={{ height: 50, border: `1.5px dashed ${styleConfig.accentColor}40`, borderRadius: 8 }} />
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#bbb' }}>
        每完成一天，就在方格里画 ★ 吧！坚持30天你就是最棒的！
      </div>
    </>
  )
}
