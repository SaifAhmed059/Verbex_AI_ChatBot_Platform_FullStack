'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agentApi } from '@/lib/api';
import { ArrowLeft, MessageSquare, ExternalLink, Calendar, Hash } from 'lucide-react';

interface Conversation {
  id: string;
  started_at: string;
  last_message: string;
  message_count: number;
  first_message: string;
}

export default function ConversationsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      agentApi.get(id),
      agentApi.conversations(id),
    ])
      .then(([agentRes, convRes]) => {
        setAgentName(agentRes.data?.name || 'Agent');
        setConversations(convRes.data || []);
      })
      .catch((err) => {
        console.error('Failed to load conversations', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading conversation history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Conversations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live transcript logs for <span className="font-semibold text-brand-600 dark:text-brand-400">{agentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {conversations.length} total sessions
          </span>
          <a
            href={`/chat/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold transition-colors"
          >
            <span>Open Live Widget</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Content */}
      {conversations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={26} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No conversations recorded yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md mx-auto">
            Once visitors or users send prompts to this agent through the public chat or embedded iframe, conversations will stream here in real time.
          </p>
          <div className="mt-5">
            <a
              href={`/chat/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              <span>Test Chat Bot Now</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3.5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {conv.first_message || 'Conversation started'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(conv.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={12} />
                    {conv.message_count} messages
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    ID: {conv.id.slice(0, 8)}…
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
