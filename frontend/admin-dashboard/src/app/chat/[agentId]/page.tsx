'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Send, Bot, User, Zap, AlertCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://verbex-ai-chatbot-platform-fullstack.onrender.com/api';
const AGENT_API = API;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  llm_provider: string;
}

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [agentLoading, setAgentLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load agent info
  useEffect(() => {
    fetch(`${AGENT_API}/agents/public/${agentId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Agent not found'))
      .then(setAgent)
      .catch(() => setError('Agent not found or unavailable.'))
      .finally(() => setAgentLoading(false));
  }, [agentId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setError('');
    setIsStreaming(true);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Add empty assistant message that will be streamed into
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch(`${API}/chat/${agentId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));

            if (json.done) {
              // Streaming complete — remove cursor
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, streaming: false };
                }
                return next;
              });
            } else if (json.text) {
              fullContent += json.text;
              const snapshot = fullContent;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: snapshot, streaming: true };
                }
                return next;
              });
            }

            // Capture conversation ID from first response if returned
            if (json.conversationId && !conversationId) {
              setConversationId(json.conversationId);
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err: any) {
      setError('Failed to get response. Please try again.');
      // Remove the empty streaming bubble on error
      setMessages(prev => prev.filter((_, i) => i < prev.length - 1));
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, agentId, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading agent…</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error && !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // ── Chat UI ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white max-w-2xl mx-auto">

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 text-sm truncate">
            {agent?.name || 'AI Assistant'}
          </h1>
          <p className="text-xs text-gray-400 capitalize">{agent?.llm_provider} · ready</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Online" />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Bot size={28} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Hi! I'm {agent?.name}</p>
              <p className="text-sm text-gray-400 mt-1">How can I help you today?</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}
            className={`msg-appear flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-indigo-500" />
              </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-500 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.content ? (
                <span className={msg.streaming ? 'cursor-blink' : ''}>
                  {msg.content}
                </span>
              ) : (
                /* typing dots while waiting for first chunk */
                <span className="flex gap-1 items-center py-0.5">
                  {[0, 1, 2].map(d => (
                    <span key={d}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </span>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Send error */}
        {error && agent && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none py-1 max-h-28 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5"
          >
            <Send size={14} className={isStreaming ? 'text-gray-400' : 'text-white'} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-2">Powered by Verbex AI</p>
      </div>
    </div>
  );
}
