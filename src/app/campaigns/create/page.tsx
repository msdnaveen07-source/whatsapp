'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  Users,
  FileCode2,
  ArrowLeft,
  CheckSquare,
  Square,
  Play,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedTemplateId = searchParams.get('templateId');

  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(preSelectedTemplateId || '');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch approved templates
    fetch('/api/whatsapp/templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) {
          const approved = data.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approved);
          if (!selectedTemplateId && approved.length > 0) {
            setSelectedTemplateId(approved[0].id);
          }
        }
      });

    // Fetch contacts
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => {
        if (data.contacts) {
          setContacts(data.contacts);
          setSelectedContactIds(data.contacts.map((c: any) => c.id));
        }
      });
  }, []);

  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map(c => c.id));
    }
  };

  const handleToggleContact = (id: string) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter(cId => cId !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedTemplateId || selectedContactIds.length === 0) {
      setErrorMsg('Please fill in campaign name, choose an approved template, and select target contacts.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          templateId: selectedTemplateId,
          contactIds: selectedContactIds,
          variables,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      router.push('/campaigns');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const bodyComponent = selectedTemplate?.components?.find((c: any) => c.type === 'BODY');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Broadcast Campaign</h1>
          <p className="text-xs text-slate-500">
            Configure target audience and variable values for WhatsApp template broadcast
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCreateCampaign} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Campaign Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Q4 Black Friday Sale Blast"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Template Select */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Select Meta Approved Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category}) - Approved
              </option>
            ))}
          </select>

          {bodyComponent && (
            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Template Content:</span>
              <p className="whitespace-pre-wrap">{bodyComponent.text}</p>
            </div>
          )}
        </div>

        {/* Dynamic Variables Mapping */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">Variable Placeholder Mapping</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Value for &#123;&#123;1&#125;&#123;</label>
              <input
                type="text"
                placeholder="e.g. Customer Name"
                onChange={e => setVariables({ ...variables, '1': e.target.value })}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Value for &#123;&#123;2&#125;&#123;</label>
              <input
                type="text"
                placeholder="e.g. Discount Code or Date"
                onChange={e => setVariables({ ...variables, '2': e.target.value })}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-xs"
              />
            </div>
          </div>
        </div>

        {/* Target Contacts Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <label className="text-xs font-semibold text-slate-700">
              Target Audience ({selectedContactIds.length} / {contacts.length} selected)
            </label>
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              {selectedContactIds.length === contacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {contacts.map(c => {
              const isSelected = selectedContactIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => handleToggleContact(c.id)}
                  className={`p-3 flex items-center justify-between text-xs cursor-pointer transition ${
                    isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <span className="text-slate-400 font-mono ml-2">+{c.phone}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Create Campaign Draft</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading campaign wizard...</div>}>
      <CreateCampaignForm />
    </Suspense>
  );
}
