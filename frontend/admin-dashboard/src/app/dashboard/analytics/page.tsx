'use client';
import { useEffect, useState } from 'react';
import { agentApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Bot, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentApi.analytics().then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalConvs = data.reduce((s, a) => s + Number(a.total_conversations), 0);
  const totalMsgs  = data.reduce((s, a) => s + Number(a.total_messages), 0);

  const stats = [
    { label: 'Total agents', value: data.length, icon: Bot },
    { label: 'Total conversations', value: totalConvs, icon: MessageSquare },
    { label: 'Total messages', value: totalMsgs, icon: TrendingUp },
    { label: 'Active agents', value: data.filter(a => Number(a.total_conversations) > 0).length, icon: Activity },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all your agents</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                <Icon size={14} className="text-brand-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {data.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Conversations per agent</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="total_conversations" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#4f6ef7' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-agent table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Agent</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Conversations</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Messages</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data yet</td></tr>
            ) : data.map((agent) => (
              <tr key={agent.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-800">{agent.name}</td>
                <td className="px-5 py-3 text-right text-gray-600">{agent.total_conversations}</td>
                <td className="px-5 py-3 text-right text-gray-600">{agent.total_messages}</td>
                <td className="px-5 py-3 text-right text-gray-400">
                  {agent.last_activity ? new Date(agent.last_activity).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
