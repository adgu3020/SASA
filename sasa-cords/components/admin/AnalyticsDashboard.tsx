'use client'

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Props {
  members: any[]
  submissions: any[]
  semesters: any[]
}

const STATUS_COLORS: Record<string, string> = {
  eligible:     '#34d399',
  not_eligible: '#f87171',
  pending:      '#fbbf24',
  approved:     '#60a5fa',
  rejected:     '#94a3b8',
}

export default function AnalyticsDashboard({ members, submissions, semesters }: Props) {
  // ── Eligibility breakdown pie ────────────────────────────────────────
  const statusCounts = members.reduce((acc, m) => {
    acc[m.eligibility_status] = (acc[m.eligibility_status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // ── Submissions over time bar ────────────────────────────────────────
  const submissionsByMonth = submissions.reduce((acc, s) => {
    const month = new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    acc[month] = (acc[month] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const barData = Object.entries(submissionsByMonth)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-8)
    .map(([month, count]) => ({ month, count }))

  // ── Graduation year breakdown ────────────────────────────────────────
  const yearCounts = members.reduce((acc, m) => {
    acc[m.graduation_year] = (acc[m.graduation_year] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const yearData = Object.entries(yearCounts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year, count }))

  // ── Headline stats ───────────────────────────────────────────────────
  const totalMembers    = members.length
  const eligibleCount   = statusCounts['eligible'] ?? 0
  const approvedCount   = submissions.filter(s => s.status === 'approved').length
  const pendingCount    = submissions.filter(s => s.status === 'pending').length
  const autoAccuracy    = submissions.length > 0
    ? Math.round((submissions.filter(s => s.auto_eligible !== null).length / submissions.length) * 100)
    : 0

  const stats = [
    { label: 'Total Members',    value: totalMembers, color: 'text-sky-400' },
    { label: 'Eligible',         value: eligibleCount, color: 'text-emerald-400' },
    { label: 'Cords Approved',   value: approvedCount, color: 'text-purple-400' },
    { label: 'Pending Review',   value: pendingCount, color: 'text-amber-400' },
  ]

  const tooltipStyle = {
    backgroundColor: 'hsl(228, 47%, 8%)',
    border: '1px solid hsl(228, 30%, 15%)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card p-5">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligibility pie */}
        <div className="glass-card p-6">
          <h3 className="font-serif text-lg mb-4">Eligibility Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map(entry => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {value.replace('_', ' ')}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No member data yet" />
          )}
        </div>

        {/* Submissions over time */}
        <div className="glass-card p-6">
          <h3 className="font-serif text-lg mb-4">Submissions Over Time</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={24}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(251,191,36,0.05)' }} />
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No submission data yet" />
          )}
        </div>

        {/* Members by graduation year */}
        <div className="glass-card p-6">
          <h3 className="font-serif text-lg mb-4">Members by Graduation Year</h3>
          {yearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearData} barSize={28}>
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(251,191,36,0.05)' }} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No member data yet" />
          )}
        </div>

        {/* Auto-eligibility accuracy */}
        <div className="glass-card p-6">
          <h3 className="font-serif text-lg mb-2">Submission Insights</h3>
          <div className="space-y-4 mt-4">
            <Insight
              label="Total Submissions"
              value={submissions.length}
              max={submissions.length || 1}
              color="bg-amber-400"
            />
            <Insight
              label="Auto-Eligible at Submission"
              value={submissions.filter(s => s.auto_eligible === true).length}
              max={submissions.length || 1}
              color="bg-emerald-400"
            />
            <Insight
              label="Not Eligible at Submission"
              value={submissions.filter(s => s.auto_eligible === false).length}
              max={submissions.length || 1}
              color="bg-red-400"
            />
            <Insight
              label="Approved"
              value={submissions.filter(s => s.status === 'approved').length}
              max={submissions.length || 1}
              color="bg-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Insight({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
      {label}
    </div>
  )
}
