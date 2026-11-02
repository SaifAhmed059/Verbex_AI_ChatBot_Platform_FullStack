'use client';
import { useEffect, useState } from 'react';
import { agentApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  MessageSquare,
  Bot,
  Activity,
  Award,
  ExternalLink,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    agentApi
      .analytics()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Aggregating platform analytics…</p>
      </div>
    );
  }

  const totalConvs = data.reduce((s, a) => s + Number(a.total_conversations || 0), 0);
  const totalMsgs = data.reduce((s, a) => s + Number(a.total_messages || 0), 0);
  const activeAgentsCount = data.filter((a) => Number(a.total_conversations) > 0).length;
  const avgMsgsPerConv = totalConvs > 0 ? (totalMsgs / totalConvs).toFixed(1) : '0';

  // Find top agent
  const topAgent = data.length > 0
    ? [...data].sort((a, b) => Number(b.total_conversations) - Number(a.total_conversations))[0]
    : null;

  const stats = [
    {
      label: 'Total AI Agents',
      value: data.length,
      detail: `${activeAgentsCount} currently active`,
      icon: Bot,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Total Conversations',
      value: totalConvs,
      detail: `${avgMsgsPerConv} msgs / conversation`,
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Messages Exchanged',
      value: totalMsgs,
      detail: 'Real-time SSE streamed',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'System Engagement',
      value: data.length > 0 ? `${Math.round((activeAgentsCount / data.length) * 100)}%` : '0%',
      detail: 'Active agent ratio',
      icon: Activity,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const tickColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Platform Analytics
            </h1>
            <span className="badge bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time usage metrics, conversation throughput, and agent performance breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
            PostgreSQL Auto-Synced
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, detail, icon: Icon, color }) => (
          <div
            key={label}
            className="card p-5 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}
              >
                <Icon size={17} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <Sparkles size={11} className="text-brand-500" />
              {detail}
            </p>
          </div>
        ))}
      </div>

      {/* Spotlight: Most Active Agent */}
      {topAgent && Number(topAgent.total_conversations) > 0 && (
        <div className="card p-5 bg-gradient-to-r from-brand-50/50 via-white to-purple-50/40 dark:from-brand-950/20 dark:via-slate-900 dark:to-purple-950/20 border-brand-200/60 dark:border-brand-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Top Performing Agent
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {topAgent.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Leading with {topAgent.total_conversations} conversations and {topAgent.total_messages} messages
              </p>
            </div>
          </div>
          <a
            href={`/chat/${topAgent.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs self-start sm:self-center inline-flex items-center gap-1.5"
          >
            <span>Open Chat</span>
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Visual Analytics Charts */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Conversations per Agent */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Conversations by Agent
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparison of conversation volume
                </p>
              </div>
              <MessageSquare size={18} className="text-brand-500" />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    color: tooltipText,
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                />
                <Bar dataKey="total_conversations" name="Conversations" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i % 2 === 0 ? '#6366f1' : '#8b5cf6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Message Volume Distribution */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Message Throughput
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cumulative user & assistant turns
                </p>
              </div>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    color: tooltipText,
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_messages"
                  name="Total Messages"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#msgGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Per-Agent Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Agent Performance Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed metrics per registered AI bot
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {data.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="text-left px-6 py-3.5">Agent Name</th>
                <th className="text-right px-6 py-3.5">Conversations</th>
                <th className="text-right px-6 py-3.5">Messages</th>
                <th className="text-right px-6 py-3.5">Last Active</th>
                <th className="text-center px-6 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No analytics recorded yet. Start a conversation with an agent to see data.
                  </td>
                </tr>
              ) : (
                data.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs">
                          <Bot size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {agent.name}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            ID: {agent.id.slice(0, 8)}…
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {agent.total_conversations || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {agent.total_messages || 0} msgs
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">
                      {agent.last_activity
                        ? new Date(agent.last_activity).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/chat/${agent.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                        title="Chat with Agent"
                      >
                        <Zap size={12} />
                        <span>Chat</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
