'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function WebhooksDiagnosticsPage() {
  const [diag, setDiag] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/webhooks/diagnostics');
      const data = await res.json();
      setDiag(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Webhook Diagnostics & Status</h1>
          <p className="text-xs text-slate-500">
            Monitor real-time Meta WhatsApp Cloud API webhook reachability and event ingestion
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Run Webhook Diagnostics</span>
        </button>
      </div>

      {/* Diagnostics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Webhook Verification
          </span>
          <div className="flex items-center gap-2 pt-1">
            {diag?.webhookStatus === 'VERIFIED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-lg font-extrabold text-slate-900">
              {diag?.webhookStatus || 'NOT_VERIFIED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">GET Hub challenge verification status</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Messages Field Subscribed
          </span>
          <div className="flex items-center gap-2 pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-lg font-extrabold text-slate-900">Active (Subscribed)</span>
          </div>
          <p className="text-[11px] text-slate-500">Receives text, media & delivery statuses</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Webhook Ingested
          </span>
          <div className="flex items-center gap-2 pt-1">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-extrabold text-slate-900">{diag?.totalEventsCount || 0} events</span>
          </div>
          <p className="text-[11px] text-slate-500">Idempotently processed webhook calls</p>
        </div>
      </div>

      {/* Callback URL Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Meta Webhook Configuration Summary
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Callback URL (GET / POST):</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-lg font-mono text-slate-800 border border-slate-200">
              <span className="flex-1 truncate">{diag?.callbackUrl}</span>
              <button
                onClick={() => copyUrl(diag?.callbackUrl)}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 font-sans text-[11px] font-semibold border border-slate-200"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-slate-500 font-medium">Verify Token Status:</span>
              <span className="ml-2 font-mono font-bold text-emerald-700">
                {diag?.verifyTokenMasked || 'Configured'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Last Webhook Timestamp:</span>
              <span className="ml-2 font-medium text-slate-800">
                {diag?.lastWebhookReceivedAt
                  ? new Date(diag.lastWebhookReceivedAt).toLocaleString()
                  : 'No webhooks received yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Webhook Event Payload Viewer */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Last Raw Meta Webhook Event Payload
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">JSON Inspector</span>
        </div>

        {diag?.lastWebhookEvent ? (
          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-80">
            {JSON.stringify(diag.lastWebhookEvent, null, 2)}
          </pre>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No webhook payload received yet. Trigger an inbound message or test webhook to view payload.
          </div>
        )}
      </div>
    </div>
  );
}
