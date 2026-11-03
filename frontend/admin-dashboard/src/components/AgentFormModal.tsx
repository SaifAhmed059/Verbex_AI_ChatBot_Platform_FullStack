'use client';
import { useState, useEffect } from 'react';
import { agentApi } from '@/lib/api';
import { X, Bot, Sparkles, Sliders, Webhook } from 'lucide-react';

interface Props {
  agent?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function AgentFormModal({ agent, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '',
    systemPrompt: '',
    temperature: 0.7,
    llmProvider: 'nvidia/nemotron-3.5-lightning:free',
    webhookUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name,
        systemPrompt: agent.system_prompt,
        temperature: parseFloat(agent.temperature),
        llmProvider: agent.llm_provider,
        webhookUrl: agent.webhook_url || '',
      });
    }
  }, [agent]);

  const set = (field: string) => (e: React.ChangeEvent<any>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        systemPrompt: form.systemPrompt,
        temperature: Number(form.temperature),
        llmProvider: form.llmProvider,
        webhookUrl: form.webhookUrl || undefined,
      };
      if (agent) {
        await agentApi.update(agent.id, payload);
      } else {
        await agentApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 transition-all">
      <div className="card w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {agent ? 'Edit AI Agent' : 'Create New AI Agent'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure agent instructions, intelligence model, and parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Agent Name</label>
            <input
              value={form.name}
              onChange={set('name')}
              className="input"
              placeholder="e.g. Sales Assistant, Code Helper, Tutor"
              required
            />
          </div>

          <div>
            <label className="label">System Instructions / Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={set('systemPrompt')}
              className="input resize-none font-mono text-xs"
              rows={4}
              placeholder="You are an expert AI customer support agent for Verbex AI. Your goal is to..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">AI Inference Model</label>
              <select
                value={form.llmProvider}
                onChange={set('llmProvider')}
                className="input font-medium"
              >
                <option value="nvidia/nemotron-3.5-lightning:free">NVIDIA Nemotron 3.5 (Fast & Free)</option>
                <option value="cohere/north-mini-code:free">Cohere North (Smart AI - Free)</option>
                <option value="openrouter/free">OpenRouter Auto (Auto-Select Free)</option>
                <option value="dots-studio/dots-3-note-preview:free">Dots Studio 3 (Free Preview)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Creativity / Temp</label>
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {Number(form.temperature).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={form.temperature}
                onChange={set('temperature')}
                className="w-full mt-2 accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0 (Strict)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <span>Webhook Event URL</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              value={form.webhookUrl}
              onChange={set('webhookUrl')}
              className="input text-xs"
              placeholder="https://api.yourdomain.com/webhooks/conversations"
              type="url"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3.5 py-2.5 rounded-xl font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-glow"
              disabled={loading}
            >
              <Sparkles size={14} />
              <span>{loading ? 'Saving…' : agent ? 'Save Changes' : 'Deploy Agent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
