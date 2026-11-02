'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Send, Bot, User, Zap, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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

const STARTER_PROMPTS = [
  '👋 Introduce yourself',
  '💡 What can you help me with?',
  '😄 Tell me a quick joke',
  '🚀 What makes you unique?',
];

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
      .then((r) => (r.ok ? r.json() : Promise.reject('Agent not found')))
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
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText || input).trim();
      if (!text || isStreaming) return;

      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setError('');
      setIsStreaming(true);

      // Add user message immediately
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      // Add empty assistant message that will be streamed into
      setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

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
                setMessages((prev) => {
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
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.role === 'assistant') {
                    next[next.length - 1] = { ...last, content: snapshot, streaming: true };
                  }
                  return next;
                });
              }

              if (json.conversationId && !conversationId) {
                setConversationId(json.conversationId);
              }
            } catch {
              // Ignore malformed SSE chunk
            }
          }
        }
      } catch (err: any) {
        setError('Failed to connect to AI server. Please try again.');
        setMessages((prev) => prev.filter((_, i) => i < prev.length - 1));
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, agentId, conversationId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setError('');
  };

  if (agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Connecting to AI agent…</p>
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="card p-8 max-w-sm text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Agent Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Centered Chat Container */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col bg-white dark:bg-slate-900 border-x border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-screen">
        
        {/* Chat Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Bot size={20} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-2">
                {agent?.name || 'AI Assistant'}
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online · Multi-turn Streaming</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={resetChat}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Restart Conversation"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-12 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-500 shadow-glow">
                <Sparkles size={30} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Chat with {agent?.name}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                  Powered by Verbex AI. Ask questions, explore tasks, or initiate autonomous conversations.
                </p>
              </div>

              {/* Starter Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.01] active:scale-98 shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg-appear flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot size={16} />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-sm shadow-md shadow-brand-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content ? (
                  <span className={msg.streaming ? 'cursor-blink' : ''}>
                    {msg.content}
                  </span>
                ) : (
                  <span className="flex gap-1.5 items-center py-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${d * 0.18}s` }}
                      />
                    ))}
                  </span>
                )}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {error && agent && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 rounded-xl">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky bottom-0 z-20">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Press Enter to send)"
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none py-1.5 px-2 max-h-32 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-sm active:scale-95"
              title="Send Message"
            >
              <Send size={15} className={isStreaming ? 'animate-pulse text-slate-400' : 'text-white'} />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
            <span>Powered by Verbex AI</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
