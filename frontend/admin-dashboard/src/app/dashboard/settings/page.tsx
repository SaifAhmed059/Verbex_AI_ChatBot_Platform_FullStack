'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { Key, Copy, Check, Shield, Code, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    authApi.profile().then(({ data }) => setProfile(data)).catch(() => {});
    setOrigin(process.env.NEXT_PUBLIC_CHAT_WIDGET_URL || window.location.origin);
  }, []);

  const generateKey = async () => {
    setLoading(true);
    try {
      const { data } = await authApi.generateApiKey();
      if (data.apiKey) {
        setGeneratedKey(data.apiKey);
      } else {
        alert(data.message || 'API key already exists for this account');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'key' | 'embed') => {
    await navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const embedCode = `<iframe
  src="${origin ? `${origin}/chat/YOUR_AGENT_ID` : '/chat/YOUR_AGENT_ID'}"
  width="420"
  height="640"
  frameborder="0"
  style="border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);"
/>`;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account & API Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your platform credentials, API access keys, and website embed widgets.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              User Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your identity on Verbex AI
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="label">Email Address</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-1 truncate">
              {user?.email}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="label">Authentication Type</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white mt-1 capitalize">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {profile?.auth_provider || 'Email / Password'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 md:col-span-2">
            <span className="label">Account User ID</span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block mt-1 truncate select-all">
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      {/* API Key Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Key size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Developer API Key
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Programmatic access to chat streaming & agent endpoints
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          Use this secret key in your external apps, mobile apps, or backend servers via header:
          <code className="ml-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-[11px]">
            Authorization: Bearer vx_your_api_key
          </code>
        </p>

        {generatedKey ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Generated Key (Copy now — it will not be displayed again):
              </span>
              <button
                onClick={() => copyToClipboard(generatedKey, 'key')}
                className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1.5"
              >
                {copiedKey ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>
            <code className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 break-all select-all block bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
              {generatedKey}
            </code>
          </div>
        ) : profile?.apiKey ? (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                Active Key Prefix: <strong>{profile.apiKey.key_prefix}…</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Created and secured</span>
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={generateKey}
              disabled={loading}
              className="btn-primary text-xs font-semibold inline-flex items-center gap-2"
            >
              <Key size={14} />
              <span>{loading ? 'Generating Key…' : 'Generate Secret API Key'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Embed Chat Widget Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Code size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Website Iframe Embed Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Embed your conversational AI widget into WordPress, Shopify, Next.js, or HTML
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(embedCode, 'embed')}
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            {copiedEmbed ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedEmbed ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Paste this snippet into any webpage. Replace <code className="text-brand-500 font-mono font-bold">YOUR_AGENT_ID</code> with your agent's unique ID from the Agents dashboard:
        </p>

        <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800">
{embedCode}
        </pre>
      </div>
    </div>
  );
}
