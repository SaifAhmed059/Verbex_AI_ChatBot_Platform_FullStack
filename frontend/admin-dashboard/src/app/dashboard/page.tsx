'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentApi } from '@/lib/api';
import { Plus, Bot, Trash2, ExternalLink, MessageSquare } from 'lucide-react';
import AgentFormModal from '@/components/AgentFormModal';

interface Agent {
  id: string; name: string; system_prompt: string; temperature: number;
  llm_provider: string; total_conversations: string; total_messages: string;
  last_activity: string; created_at: string;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const load = () =>
    agentApi.list().then(({ data }) => setAgents(data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    await agentApi.delete(id);
    load();
  };

  const chatWidgetUrl = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL || 'http://localhost:3001';

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-500 text-sm mt-1">{agents.length} agent{agents.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => { setEditAgent(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="card p-16 text-center">
          <Bot size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No agents yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Create your first AI agent to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Bot size={18} className="text-brand-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                    <span className="text-xs text-gray-400 uppercase">{agent.llm_provider}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(agent.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={15} />
                </button>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{agent.system_prompt}</p>

              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {agent.total_conversations} convs
                </span>
                <span>{agent.total_messages} msgs</span>
                <span className="ml-auto">temp {agent.temperature}</span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-gray-50">
                <button onClick={() => { setEditAgent(agent); setShowModal(true); }}
                  className="btn-secondary text-xs flex-1 py-1.5">Edit</button>
                <Link href={`/dashboard/agents/${agent.id}/conversations`}
                  className="btn-secondary text-xs flex-1 py-1.5 text-center">Conversations</Link>
                <a href={`${chatWidgetUrl}/chat/${agent.id}`} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs px-2 py-1.5 flex items-center gap-1">
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AgentFormModal
          agent={editAgent}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
