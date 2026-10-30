'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCode2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSyncMetaStatus = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/templates/sync', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Template status synced!');
        fetchTemplates();
      } else {
        alert(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTemplates = templates.filter(
    t => filterCategory === 'ALL' || t.category === filterCategory
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp Message Templates</h1>
          <p className="text-xs text-slate-500">
            Create Meta-compliant templates, submit for official review, and track approval status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncMetaStatus}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Meta Approval Status'}</span>
          </button>

          <Link
            href="/templates/create"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </Link>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex rounded-xl bg-white p-1.5 border border-slate-200 w-fit text-xs font-semibold text-slate-600">
        {(['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-1.5 rounded-lg transition ${
              filterCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {cat === 'ALL' ? 'All Templates' : cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No templates found. Click &quot;Create New Template&quot; to build your first template.
          </div>
        ) : (
          filteredTemplates.map(tpl => {
            const bodyComp = tpl.components.find((c: any) => c.type === 'BODY');
            const headerComp = tpl.components.find((c: any) => c.type === 'HEADER');

            return (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm font-mono">{tpl.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Lang: {tpl.language} &bull; {tpl.category}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {tpl.status === 'APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    ) : tpl.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Review
                      </span>
                    ) : tpl.status === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {tpl.status}
                      </span>
                    )}
                  </div>

                  {/* Template Content Snippet */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    {headerComp && (
                      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">
                        {headerComp.text || `[${headerComp.format} Header]`}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{bodyComp?.text}</p>
                  </div>

                  {/* Rejection or Draft Alert Box */}
                  {tpl.status === 'REJECTED' && tpl.rejectionReason && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Meta Rejection Reason:
                      </div>
                      <p className="text-[11px] text-rose-700">{tpl.rejectionReason}</p>
                    </div>
                  )}

                  {tpl.status === 'DRAFT' && tpl.rejectionReason && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Submission Notice:
                      </div>
                      <p className="text-[11px] text-amber-700">{tpl.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Created {new Date(tpl.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/templates/create?editId=${tpl.id}`}
                      className="font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs transition"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/campaigns/create?templateId=${tpl.id}`}
                      className={`font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 ${
                        tpl.status !== 'APPROVED' ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      <span>Use in Campaign</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
