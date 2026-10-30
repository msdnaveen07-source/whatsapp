'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  MessageSquare,
  Clock,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react';

interface AutomationRule {
  id: string;
  label: string;
  keywords: string[];
  matchType: 'EXACT' | 'CONTAINS';
  replyText: string;
  enabled: boolean;
}

interface AutomationSettings {
  autoReplyEnabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  rules: AutomationRule[];
}

export default function AutomationSettingsPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings/automation')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = () => {
    if (!settings) return;
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      label: 'New Keyword Trigger',
      keywords: ['keyword'],
      matchType: 'CONTAINS',
      replyText: 'Hi! Thank you for messaging us. How can we help?',
      enabled: true,
    };
    setSettings({
      ...settings,
      rules: [...settings.rules, newRule],
    });
  };

  const handleRemoveRule = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      rules: settings.rules.filter(r => r.id !== id),
    });
  };

  const handleToggleRule = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      rules: settings.rules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  const handleUpdateRule = (id: string, field: keyof AutomationRule, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      rules: settings.rules.map(r => (r.id === id ? { ...r, [field]: value } : r)),
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading automation settings...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">WhatsApp Automation & Keyword Bot</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated instant replies, keyword triggers, and Gemini AI customer assistant
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Switch Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enable Automated Responders</h3>
            <p className="text-xs text-slate-500">
              When an inbound message arrives, automatically trigger keyword matches or AI replies
            </p>
          </div>
        </div>

        <button
          onClick={() => setSettings({ ...settings, autoReplyEnabled: !settings.autoReplyEnabled })}
          className="p-1 text-slate-600 hover:text-slate-900 transition"
        >
          {settings.autoReplyEnabled ? (
            <ToggleRight className="w-10 h-10 text-emerald-600" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-slate-400" />
          )}
        </button>
      </div>

      {/* Keyword Rules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Keyword Triggers & Automated Responses</h2>
            <p className="text-xs text-slate-500">
              When a customer sends any of the comma-separated keywords, send the configured response
            </p>
          </div>

          <button
            onClick={handleAddRule}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trigger</span>
          </button>
        </div>

        <div className="space-y-3">
          {settings.rules.map((rule, idx) => (
            <div
              key={rule.id}
              className={`bg-white p-5 rounded-xl border transition shadow-sm ${
                rule.enabled ? 'border-slate-200' : 'border-slate-200/50 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={rule.label}
                    onChange={e => handleUpdateRule(rule.id, 'label', e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none"
                    placeholder="Rule Label"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition text-slate-600 hover:bg-slate-50"
                  >
                    {rule.enabled ? (
                      <span className="text-emerald-600 font-bold">Enabled</span>
                    ) : (
                      <span className="text-slate-400">Disabled</span>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Keywords input */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Trigger Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={rule.keywords.join(', ')}
                    onChange={e =>
                      handleUpdateRule(
                        rule.id,
                        'keywords',
                        e.target.value.split(',').map(s => s.trim())
                      )
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    placeholder="hi, hello, menu, 1"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Match:</span>
                    <select
                      value={rule.matchType}
                      onChange={e => handleUpdateRule(rule.id, 'matchType', e.target.value)}
                      className="text-[11px] bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
                    >
                      <option value="CONTAINS">Contains keyword</option>
                      <option value="EXACT">Exact match only</option>
                    </select>
                  </div>
                </div>

                {/* Reply message */}
                <div className="md:col-span-7 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Automated WhatsApp Reply Message
                  </label>
                  <textarea
                    rows={4}
                    value={rule.replyText}
                    onChange={e => handleUpdateRule(rule.id, 'replyText', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter message..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Info Card */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-950">Gemini AI Smart Fallback</h4>
            <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
              When a customer asks a question that does not match any of your keyword triggers above,
              the built-in <strong>Gemini 1.5 Flash AI</strong> automatically analyzes their query and
              generates a polite, natural reply in English or Tanglish based on your business offerings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
