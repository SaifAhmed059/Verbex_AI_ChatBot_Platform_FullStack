'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentApi } from '@/lib/api';
import { Plus, Bot, Trash2, ExternalLink, MessageSquare, Sparkles, CheckCircle2, Cpu, Flame } from 'lucide-react';
import AgentFormModal from '@/components/AgentFormModal';

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  temperature: number;
  llm_provider: string;
  total_conversations: string;
  total_messages: string;
  last_activity: string;
  created_at: string;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const load = () =>
    agentApi
      .list()
      .then(({ data }) => setAgents(data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated conversation history will be permanently deleted.`)) return;
    await agentApi.delete(id);
    load();
  };

  const getProviderBadge = (provider: string) => {
    if (provider.includes('nvidia')) {
      return {
        label: 'NVIDIA Nemotron',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      };
    }
    if (provider.includes('cohere')) {
      return {
        label: 'Cohere North',
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
      };
    }
    if (provider.includes('openrouter')) {
      return {
        label: 'OpenRouter Auto',
        bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
      };
    }
    return {
      label: provider.split('/')[0] || 'AI Model',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
    };
  };

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Loading AI agents…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Agents
            </h1>
            <span className="badge bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/70 dark:border-brand-800/60">
              {agents.length} active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create, manage, and deploy autonomous conversational agents with multi-model LLMs.
          </p>
        </div>

        <button
          onClick={() => {
            setEditAgent(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center justify-center gap-2 shadow-glow text-sm font-semibold w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>New AI Agent</span>
        </button>
      </div>

      {/* System Status Metrics Pill Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400 block font-normal">Platform Status</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">100% Operational</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-blue-500" />
          <div className="text-xs">
            <span className="text-slate-400 block font-normal">Database Engine</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL (Neon)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <Cpu size={16} className="text-purple-500" />
          <div className="text-xs">
            <span className="text-slate-400 block font-normal">AI Inference</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">OpenRouter Streaming</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <Sparkles size={16} className="text-amber-500" />
          <div className="text-xs">
            <span className="text-slate-400 block font-normal">OAuth2 Security</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Google & GitHub</span>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <div className="card p-16 text-center border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:bg-transparent">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
            <Bot size={32} className="text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No agents deployed yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
            Build your first AI assistant in seconds with custom prompts, temperature control, and multi-model streaming.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create First Agent</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => {
            const providerInfo = getProviderBadge(agent.llm_provider);

            return (
              <div
                key={agent.id}
                className="card p-5 flex flex-col justify-between hover:shadow-lg hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 group relative overflow-hidden"
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Bot size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {agent.name}
                        </h3>
                        <span className={`badge border text-[10px] mt-0.5 ${providerInfo.bg}`}>
                          {providerInfo.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(agent.id, agent.name)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete Agent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* System Prompt snippet */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 font-mono">
                    "{agent.system_prompt}"
                  </p>
                </div>

                {/* Footer Metrics & Actions */}
                <div>
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 dark:border-slate-800/80 text-center mb-3">
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Conversations</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{agent.total_conversations || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">Messages</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{agent.total_messages || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center justify-center gap-0.5">
                        <Flame size={10} className="text-amber-500" /> Temp
                      </span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{Number(agent.temperature).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditAgent(agent);
                        setShowModal(true);
                      }}
                      className="btn-secondary text-xs flex-1 py-2 text-center"
                    >
                      Edit
                    </button>

                    <Link
                      href={`/dashboard/agents/${agent.id}/conversations`}
                      className="btn-secondary text-xs flex-1 py-2 text-center flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={13} />
                      History
                    </Link>

                    <a
                      href={`/chat/${agent.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 font-semibold text-xs px-3 py-2 rounded-xl border border-brand-200/80 dark:border-brand-800 flex items-center gap-1.5 transition-colors"
                      title="Open Live Chatbot"
                    >
                      <span>Chat</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Creation / Edit Modal */}
      {showModal && (
        <AgentFormModal
          agent={editAgent}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
