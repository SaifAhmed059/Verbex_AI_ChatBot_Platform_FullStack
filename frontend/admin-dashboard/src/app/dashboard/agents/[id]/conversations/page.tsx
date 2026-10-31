'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agentApi } from '@/lib/api';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string; started_at: string; last_message: string;
  message_count: number; first_message: string;
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
    ]).then(([agentRes, convRes]) => {
      setAgentName(agentRes.data.name);
      setConversations(convRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{agentName}</p>
        </div>
        <span className="ml-auto text-sm text-gray-500">{conversations.length} total</span>
      </div>

      {conversations.length === 0 ? (
        <div className="card p-16 text-center">
          <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No conversations yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Share the public chat link to start receiving messages</p>
          <a href={`/chat/${id}`} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 text-sm">
            <span>Open Chat with Bot</span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div key={conv.id} className="card p-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={14} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {conv.first_message || 'Empty conversation'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{new Date(conv.started_at).toLocaleDateString()}</span>
                  <span>{conv.message_count} messages</span>
                  <span className="ml-auto font-mono text-xs text-gray-300">{conv.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
