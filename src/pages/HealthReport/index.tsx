import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useHealthStore } from '../../stores/healthStore'
import { formatAge } from '../../hooks/useAgeGroup'
import { FEVER_LEVEL_INFO, SYMPTOM_TAG_INFO, MEASURE_METHOD_INFO } from '../../types'
import { getFeverLevel } from '../../utils/growthUtils'

export default function HealthReport() {
  const navigate = useNavigate()
  const child = useAppStore((s) => s.getCurrentChild())
  const growthRecords = useHealthStore((s) => s.growthRecords)
  const temperatureRecords = useHealthStore((s) => s.temperatureRecords)
  const medicationRecords = useHealthStore((s) => s.medicationRecords)
  const vaccinationRecords = useHealthStore((s) => s.vaccinationRecords)

  const childId = child?.childId ?? ''

  const sevenDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  }, [])

  const recentTemp = useMemo(() =>
    temperatureRecords
      .filter((r) => r.childId === childId && r.createdAt >= sevenDaysAgo)
      .sort((a, b) => a.measureTime.localeCompare(b.measureTime)),
    [temperatureRecords, childId, sevenDaysAgo]
  )

  const recentMeds = useMemo(() =>
    medicationRecords
      .filter((r) => r.childId === childId && r.createdAt >= sevenDaysAgo)
      .sort((a, b) => a.administrationTime.localeCompare(b.administrationTime)),
    [medicationRecords, childId, sevenDaysAgo]
  )

  const latestGrowth = useMemo(() => {
    const records = growthRecords
      .filter((r) => r.childId === childId)
      .sort((a, b) => a.date.localeCompare(b.date))
    return records.length > 0 ? records[records.length - 1] : null
  }, [growthRecords, childId])

  const vaccines = useMemo(() =>
    vaccinationRecords
      .filter((r) => r.childId === childId)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [vaccinationRecords, childId]
  )

  // Collect symptoms timeline from temp records
  const symptomTimeline = useMemo(() => {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const recent = temperatureRecords
      .filter((r) => r.childId === childId && r.createdAt >= fourteenDaysAgo.toISOString() && r.symptoms.length > 0)
      .sort((a, b) => a.measureTime.localeCompare(b.measureTime))
    return recent
  }, [temperatureRecords, childId])

  if (!child) {
    return <div style={{ padding: 20, textAlign: 'center' }}>请先选择孩子</div>
  }

  const printDate = new Date().toLocaleDateString('zh-CN')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
      {/* No-print controls */}
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
        >
          ← 返回
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
        >
          🖨️ 打印
        </button>
      </div>

      {/* Print content */}
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 16 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>儿童健康档案 - 就医辅助资料</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>生成日期：{printDate}</div>
        </div>

        {/* Basic info */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>基本信息</SectionTitle>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={thStyle}>姓名</td>
                <td style={tdStyle}>{child.name}</td>
                <td style={thStyle}>性别</td>
                <td style={tdStyle}>{child.gender === 'male' ? '男' : '女'}</td>
              </tr>
              <tr>
                <td style={thStyle}>出生日期</td>
                <td style={tdStyle}>{child.birthday}</td>
                <td style={thStyle}>年龄</td>
                <td style={tdStyle}>{formatAge(child.birthday, child.age)}</td>
              </tr>
              {latestGrowth && (
                <tr>
                  <td style={thStyle}>最新身高</td>
                  <td style={tdStyle}>{latestGrowth.height !== null ? `${latestGrowth.height}cm (P${latestGrowth.heightPercentile ?? '-'})` : '-'}</td>
                  <td style={thStyle}>最新体重</td>
                  <td style={tdStyle}>{latestGrowth.weight !== null ? `${latestGrowth.weight}kg (P${latestGrowth.weightPercentile ?? '-'})` : '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Temperature records */}
        {recentTemp.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>近7天体温记录</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>时间</th>
                  <th style={thStyle}>体温</th>
                  <th style={thStyle}>测量方式</th>
                  <th style={thStyle}>分级</th>
                  <th style={thStyle}>症状</th>
                </tr>
              </thead>
              <tbody>
                {recentTemp.map((r) => {
                  const level = getFeverLevel(r.temperature)
                  return (
                    <tr key={r.recordId}>
                      <td style={tdStyle}>{new Date(r.measureTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.temperature}℃</td>
                      <td style={tdStyle}>{MEASURE_METHOD_INFO[r.measureMethod]?.label}</td>
                      <td style={tdStyle}>{FEVER_LEVEL_INFO[level]?.label}</td>
                      <td style={tdStyle}>{r.symptoms.map((s) => SYMPTOM_TAG_INFO[s]?.label).filter(Boolean).join('、') || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Medication records */}
        {recentMeds.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>近7天用药记录</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>时间</th>
                  <th style={thStyle}>药品名称</th>
                  <th style={thStyle}>剂量</th>
                  <th style={thStyle}>途径</th>
                  <th style={thStyle}>原因</th>
                </tr>
              </thead>
              <tbody>
                {recentMeds.map((r) => (
                  <tr key={r.recordId}>
                    <td style={tdStyle}>{new Date(r.administrationTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.drugName}</td>
                    <td style={tdStyle}>{r.singleDose}{r.doseUnit}</td>
                    <td style={tdStyle}>{r.route === 'oral' ? '口服' : r.route === 'topical' ? '外用' : '栓剂'}</td>
                    <td style={tdStyle}>{r.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Symptom timeline */}
        {symptomTimeline.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>近14天症状时间线</SectionTitle>
            <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 12 }}>
              {symptomTimeline.map((r) => (
                <div key={r.recordId} style={{ display: 'flex', gap: 12, fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ minWidth: 100, color: '#666' }}>
                    {new Date(r.measureTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>{r.temperature}℃</span>
                  <span>{r.symptoms.map((s) => SYMPTOM_TAG_INFO[s]?.label).filter(Boolean).join('、')}</span>
                  {r.note && <span style={{ color: '#666' }}>（{r.note}）</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vaccination records */}
        {vaccines.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>疫苗接种记录</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>日期</th>
                  <th style={thStyle}>疫苗名称</th>
                  <th style={thStyle}>剂次</th>
                  <th style={thStyle}>批号</th>
                  <th style={thStyle}>接种部位</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((r) => (
                  <tr key={r.recordId}>
                    <td style={tdStyle}>{r.date}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.vaccineName}</td>
                    <td style={tdStyle}>第{r.doseNumber}/{r.totalDoses}剂</td>
                    <td style={tdStyle}>{r.batchNumber || '-'}</td>
                    <td style={tdStyle}>{r.site || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Latest growth data */}
        {latestGrowth && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>最新生长数据（{latestGrowth.date}）</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>指标</th>
                  <th style={thStyle}>数值</th>
                  <th style={thStyle}>百分位</th>
                </tr>
              </thead>
              <tbody>
                {latestGrowth.height !== null && (
                  <tr>
                    <td style={tdStyle}>身高</td>
                    <td style={tdStyle}>{latestGrowth.height} cm</td>
                    <td style={tdStyle}>P{latestGrowth.heightPercentile ?? '-'}</td>
                  </tr>
                )}
                {latestGrowth.weight !== null && (
                  <tr>
                    <td style={tdStyle}>体重</td>
                    <td style={tdStyle}>{latestGrowth.weight} kg</td>
                    <td style={tdStyle}>P{latestGrowth.weightPercentile ?? '-'}</td>
                  </tr>
                )}
                {latestGrowth.bmi !== null && (
                  <tr>
                    <td style={tdStyle}>BMI</td>
                    <td style={tdStyle}>{latestGrowth.bmi}</td>
                    <td style={tdStyle}>P{latestGrowth.bmiPercentile ?? '-'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', borderTop: '1px solid #ccc', paddingTop: 12, marginTop: 24 }}>
          本资料由「小星星成长宝」自动生成，仅供就医参考。
          <br />
          所有数据由家长手动录入，不构成医疗诊断依据。
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; color: black; background: white; margin: 0; }
          table { page-break-inside: avoid; }
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '1rem',
      fontWeight: 700,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: '1px solid #999',
    }}>
      {children}
    </div>
  )
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
}

const thStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 10px',
  textAlign: 'left',
  background: '#f5f5f5',
  fontWeight: 600,
  fontSize: '0.8rem',
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 10px',
  fontSize: '0.8rem',
}
