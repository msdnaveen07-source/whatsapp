'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCode2,
  Smartphone,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  HelpCircle,
} from 'lucide-react';

export default function CreateTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');

  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');

  const [bodyText, setBodyText] = useState(
    'Hello {{1}}, your order #{{2}} has been confirmed and is scheduled for delivery.'
  );

  const [footerText, setFooterText] = useState('Acme Customer Service');

  // Example value map for variables e.g. {"1": "Alex", "2": "94820"}
  const [variableExamples, setVariableExamples] = useState<Record<string, string>>({
    '1': 'Alex Rivera',
    '2': '94820',
  });

  const [buttons, setButtons] = useState<
    Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phoneNumber?: string }>
  >([
    { type: 'QUICK_REPLY', text: 'Track Order' },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editId is provided, fetch existing template and populate form
  React.useEffect(() => {
    if (!editId) return;
    fetch('/api/whatsapp/templates')
      .then(r => r.json())
      .then(d => {
        const found = (d.templates || []).find((t: any) => t.id === editId);
        if (found) {
          setName(found.name);
          setLanguage(found.language);
          setCategory(found.category);

          const bodyComp = found.components.find((c: any) => c.type === 'BODY');
          if (bodyComp?.text) setBodyText(bodyComp.text);

          const headerComp = found.components.find((c: any) => c.type === 'HEADER');
          if (headerComp) {
            setHeaderType(headerComp.format || 'TEXT');
            setHeaderText(headerComp.text || '');
          }

          const footerComp = found.components.find((c: any) => c.type === 'FOOTER');
          if (footerComp?.text) setFooterText(footerComp.text);

          const btnComp = found.components.find((c: any) => c.type === 'BUTTONS');
          if (btnComp?.buttons) {
            try {
              setButtons(JSON.parse(btnComp.buttons));
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(console.error);
  }, [editId]);

  // Extract variables dynamically from body text
  const detectedVariables = Array.from(bodyText.matchAll(/\{\{(\d+)\}\}/g)).map(m => m[1]);
  const uniqueVars = Array.from(new Set(detectedVariables)).sort((a, b) => parseInt(a) - parseInt(b));

  const handleVariableExampleChange = (varNum: string, value: string) => {
    setVariableExamples(prev => ({ ...prev, [varNum]: value }));
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'QUICK_REPLY', text: 'Quick Action' }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          language,
          category,
          headerType,
          headerText,
          bodyText,
          footerText,
          buttons,
          variableExamples,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      if (data.metaSubmitted) {
        alert('🎉 Template submitted directly to Meta WhatsApp Cloud API for review! Status: PENDING');
      } else {
        alert(`⚠️ ${data.message || 'Template saved locally as DRAFT.'}\n\nReason: ${data.warning || 'Meta Access Token is expired or invalid'}`);
      }
      router.push('/templates');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Construct Live Preview Text
  let previewBody = bodyText;
  uniqueVars.forEach(v => {
    const val = variableExamples[v] || `{{${v}}}`;
    previewBody = previewBody.replaceAll(`{{${v}}}`, val);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create WhatsApp Message Template</h1>
          <p className="text-xs text-slate-500">
            Build Meta-compliant message templates with dynamic variable placeholders
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Builder Form vs Smartphone Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Builder Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Step 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              1. Basic Template Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="appointment_reminder_v1"
                  value={name}
                  onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Lowercase, numbers and underscores only</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="en_US">English (US)</option>
                  <option value="es_ES">Spanish</option>
                  <option value="fr_FR">French</option>
                  <option value="de_DE">German</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
              <div className="grid grid-cols-3 gap-3">
                {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                      category === cat
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Content Components */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              2. Template Components & Variables
            </h3>

            {/* Header Format */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Header (Optional)</label>
              <select
                value={headerType}
                onChange={e => setHeaderType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 mb-2"
              >
                <option value="NONE">None</option>
                <option value="TEXT">Text Header</option>
                <option value="IMAGE">Image Header</option>
                <option value="VIDEO">Video Header</option>
                <option value="DOCUMENT">Document Header</option>
              </select>

              {headerType === 'TEXT' && (
                <input
                  type="text"
                  placeholder="Header text title..."
                  value={headerText}
                  onChange={e => setHeaderText(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                />
              )}
            </div>

            {/* Body Text */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Body Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Use variables like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-700">&#123;&#123;1&#125;&#123;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-emerald-700">&#123;&#123;2&#125;&#123;</code> for dynamic personalization.
              </p>
            </div>

            {/* Variable Example Values (Required by Meta API) */}
            {uniqueVars.length > 0 && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <label className="text-xs font-bold text-emerald-900 block">
                  Required Variable Examples for Meta Review
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueVars.map(vNum => (
                    <div key={vNum}>
                      <label className="text-[11px] font-semibold text-emerald-800 block mb-0.5">
                        Sample for &#123;&#123;{vNum}&#125;&#125;
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={`Example for {{${vNum}}}`}
                        value={variableExamples[vNum] || ''}
                        onChange={e => handleVariableExampleChange(vNum, e.target.value)}
                        className="w-full p-2 bg-white border border-emerald-300 rounded text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Text */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Footer (Optional)</label>
              <input
                type="text"
                placeholder="Disclaimers or brand signatures..."
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Step 3: Interactive Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">3. Interactive Buttons</h3>
              <button
                type="button"
                onClick={handleAddButton}
                disabled={buttons.length >= 3}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Button
              </button>
            </div>

            <div className="space-y-2">
              {buttons.map((btn, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <select
                    value={btn.type}
                    onChange={e => {
                      const updated = [...buttons];
                      updated[idx].type = e.target.value as any;
                      setButtons(updated);
                    }}
                    className="p-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                  >
                    <option value="QUICK_REPLY">Quick Reply</option>
                    <option value="URL">Call to Action URL</option>
                    <option value="PHONE_NUMBER">Call Phone Number</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Button text..."
                    value={btn.text}
                    onChange={e => {
                      const updated = [...buttons];
                      updated[idx].text = e.target.value;
                      setButtons(updated);
                    }}
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveButton(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting to Meta...' : 'Submit Template to Meta'}</span>
            </button>
          </div>
        </form>

        {/* Right 5 Cols: Smartphone Live Preview Frame */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 text-slate-100 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              WhatsApp Smartphone Preview
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              WhatsApp iOS / Android
            </span>
          </div>

          {/* Smartphone Frame Container */}
          <div className="bg-[#efeae2] text-slate-900 rounded-2xl p-4 shadow-inner min-h-[420px] flex flex-col justify-end space-y-3 font-sans">
            {/* WhatsApp Chat Bubble */}
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200 max-w-xs space-y-2 text-xs">
              {headerType !== 'NONE' && (
                <div className="font-bold text-slate-900 pb-1 border-b border-slate-100">
                  {headerType === 'TEXT' ? headerText || '[Header Text]' : `[Media Header: ${headerType}]`}
                </div>
              )}

              <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{previewBody}</p>

              {footerText && (
                <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                  {footerText}
                </p>
              )}

              <div className="text-[10px] text-slate-400 text-right font-medium">12:45 PM</div>
            </div>

            {/* Quick Action Buttons */}
            {buttons.length > 0 && (
              <div className="space-y-1 max-w-xs">
                {buttons.map((btn, i) => (
                  <div
                    key={i}
                    className="w-full py-2 bg-white/95 rounded-xl border border-slate-200 text-center font-semibold text-emerald-600 text-xs shadow-sm"
                  >
                    {btn.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
