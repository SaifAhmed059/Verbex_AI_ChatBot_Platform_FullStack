'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Key, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.profile().then(({ data }) => setProfile(data));
  }, []);

  const generateKey = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.generateApiKey();
      if (data.apiKey) setGeneratedKey(data.apiKey);
      else alert(data.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chatWidgetUrl = process.env.NEXT_PUBLIC_CHAT_WIDGET_URL || 'http://localhost:3001';

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and API access</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">User ID</span>
            <span className="text-gray-400 font-mono text-xs">{user?.id}</span>
          </div>
          {profile?.created_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-700">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-brand-500" />
          <h2 className="font-semibold text-gray-900">API Key</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Use this key to access chat endpoints programmatically. Pass it as a Bearer token.
        </p>

        {profile?.apiKey && !generatedKey && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-500 mb-4">
            Existing key prefix: <code className="font-mono font-medium text-gray-700">{profile.apiKey.key_prefix}…</code>
            <span className="ml-2 text-xs text-gray-400">(created {new Date(profile.apiKey.created_at).toLocaleDateString()})</span>
          </div>
        )}

        {generatedKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">⚠ Copy this key now — it will not be shown again</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white border border-amber-200 rounded px-3 py-2 break-all">{generatedKey}</code>
              <button onClick={() => copy(generatedKey)}
                className="p-2 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 transition-colors flex-shrink-0">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-amber-600" />}
              </button>
            </div>
          </div>
        )}

        <button onClick={generateKey} disabled={loading || !!profile?.apiKey}
          className="btn-primary text-sm disabled:opacity-50">
          {loading ? 'Generating…' : profile?.apiKey ? 'API key already generated' : 'Generate API key'}
        </button>
      </div>

      {/* Embed info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Embed Chat Widget</h2>
        <p className="text-sm text-gray-500 mb-4">Add your agent's chat widget to any website using an iframe.</p>
        <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="${chatWidgetUrl}/chat/YOUR_AGENT_ID"
  width="400"
  height="600"
  frameborder="0"
/>`}
        </pre>
      </div>
    </div>
  );
}
