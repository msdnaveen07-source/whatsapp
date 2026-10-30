'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function WhatsAppSettingsPage() {
  const [form, setForm] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    wabaId: '',
    phoneNumberId: '',
    phoneNumber: '',
    webhookVerifyToken: 'whcrm_verify_9f7d3a2c8b6e4a1f',
  });

  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTED');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/whatsapp');
      const data = await res.json();
      if (data.connection) {
        setForm(prev => ({
          ...prev,
          ...data.connection,
          accessToken: '', // Keep empty so user never accidentally overwrites saved token with dots
          appSecret: '',
        }));
        setConnectionStatus(data.connection.status || 'CONNECTED');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.status) {
        setConnectionStatus(data.status);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert('WhatsApp credentials saved successfully!');
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const webhookCallbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Meta WhatsApp Cloud API Connection</h1>
        <p className="text-xs text-slate-500">
          Configure direct integration with official Meta Graph API endpoints
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Connection Status:</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {connectionStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports real Meta Graph API credentials or automatic local mock fallback
            </p>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Testing Meta API...' : 'Test Connection'}</span>
        </button>
      </div>

      {/* Diagnostic Result Alert */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium space-y-1 ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="font-bold flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{testResult.message}</span>
          </div>
          {testResult.details && (
            <pre className="p-2 bg-white/70 rounded border text-[10px] font-mono overflow-x-auto">
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Main Grid: Step-by-Step Meta Developer Guide vs Credentials Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step-by-Step Setup Wizard Guide */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Meta Setup Wizard (Steps 1–9)
          </h3>

          <ol className="space-y-3 text-xs text-slate-300 divide-y divide-slate-800/60">
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 1:</span> Create an App on{' '}
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline inline-flex items-center gap-0.5"
              >
                developers.facebook.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 2:</span> Add the <strong>WhatsApp</strong> product to your App.
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 3:</span> Connect your WhatsApp Business Account (WABA).
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 4:</span> Copy <strong>App ID</strong>, <strong>App Secret</strong>, <strong>System User Access Token</strong>, <strong>WABA ID</strong>, and <strong>Phone Number ID</strong> into the form.
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 5:</span> Configure Webhook Callback URL:
              <div className="mt-1 p-2 bg-slate-800 rounded font-mono text-[10px] break-all text-emerald-300">
                {webhookCallbackUrl}
              </div>
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 6:</span> Enter Webhook Verification Token:
              <div className="mt-1 p-2 bg-slate-800 rounded font-mono text-[10px] text-amber-300 flex items-center justify-between">
                <span>{form.webhookVerifyToken}</span>
                <button
                  onClick={() => copyToClipboard(form.webhookVerifyToken)}
                  className="hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 7:</span> Subscribe to the <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 font-bold">messages</code> field in Meta Developer Console.
            </li>
            <li className="pt-2">
              <span className="font-bold text-emerald-400">Step 8 & 9:</span> Test incoming & outbound WhatsApp messages in Inbox.
            </li>
          </ol>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            WhatsApp API Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">META_APP_ID</label>
              <input
                type="text"
                placeholder="123456789012345"
                value={form.appId || ''}
                onChange={e => setForm({ ...form, appId: e.target.value })}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">META_APP_SECRET</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={form.appSecret || ''}
                onChange={e => setForm({ ...form, appSecret: e.target.value })}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              META_ACCESS_TOKEN (Permanent System User Token)
            </label>
            <input
              type="password"
              placeholder={form.wabaId ? "Token is securely saved in database (leave blank to keep existing)" : "EAAG..."}
              value={form.accessToken || ''}
              onChange={e => setForm({ ...form, accessToken: e.target.value })}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">WABA_ID (WhatsApp Business Account ID)</label>
              <input
                type="text"
                placeholder="100987654321098"
                value={form.wabaId || ''}
                onChange={e => setForm({ ...form, wabaId: e.target.value })}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">PHONE_NUMBER_ID</label>
              <input
                type="text"
                placeholder="105432109876543"
                value={form.phoneNumberId || ''}
                onChange={e => setForm({ ...form, phoneNumberId: e.target.value })}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">WEBHOOK_VERIFY_TOKEN (Custom Application Token)</label>
            <input
              type="text"
              required
              value={form.webhookVerifyToken}
              onChange={e => setForm({ ...form, webhookVerifyToken: e.target.value })}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Custom secret used to verify webhook subscription requests from Meta.
            </p>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
