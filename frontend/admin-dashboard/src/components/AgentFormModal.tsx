'use client';
import { useState, useEffect } from 'react';
import { agentApi } from '@/lib/api';
import { X } from 'lucide-react';

interface Props {
  agent?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function AgentFormModal({ agent, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '', systemPrompt: '', temperature: 0.7,
    llmProvider: 'nvidia/nemotron-3.5-lightning:free', webhookUrl: '',
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
    setForm(prev => ({ ...prev, [field]: e.target.value }));

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {agent ? 'Edit agent' : 'Create new agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Agent name</label>
            <input value={form.name} onChange={set('name')} className="input"
              placeholder="e.g. Customer Support Bot" required />
          </div>

          <div>
            <label className="label">System prompt</label>
            <textarea value={form.systemPrompt} onChange={set('systemPrompt')}
              className="input resize-none" rows={4}
              placeholder="You are a helpful assistant that..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">LLM Provider</label>
              <select value={form.llmProvider} onChange={set('llmProvider')} className="input">
                <option value="nvidia/nemotron-3.5-lightning:free">NVIDIA Nemotron 3.5 (Fast & Free)</option>
                <option value="cohere/north-mini-code:free">Cohere North (Smart AI - Free)</option>
                <option value="openrouter/free">OpenRouter Auto (Auto-Select Free)</option>
                <option value="dots-studio/dots-3-note-preview:free">Dots Studio 3 (Free Preview)</option>
              </select>
            </div>
            <div>
              <label className="label">Temperature: {Number(form.temperature).toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.05"
                value={form.temperature} onChange={set('temperature')}
                className="w-full mt-2 accent-brand-500" />
            </div>
          </div>

          <div>
            <label className="label">Webhook URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.webhookUrl} onChange={set('webhookUrl')} className="input"
              placeholder="https://your-server.com/webhook" type="url" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : agent ? 'Save changes' : 'Create agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
