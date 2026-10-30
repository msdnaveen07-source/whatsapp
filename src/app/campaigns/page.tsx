'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  CheckCheck,
  Clock,
  AlertCircle,
  Play,
  FileCode2,
  Users,
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleExecuteCampaign = async (campaignId: string) => {
    setIsSendingId(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Campaign executed successfully!');
        fetchCampaigns();
      } else {
        alert(data.error || 'Campaign execution failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Broadcast Campaigns</h1>
          <p className="text-xs text-slate-500">
            Send targeted WhatsApp template broadcasts to audience lists with live delivery analytics
          </p>
        </div>

        <Link
          href="/campaigns/create"
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Broadcast Campaign</span>
        </Link>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No broadcast campaigns found. Click &quot;Create Broadcast Campaign&quot; to launch your first WhatsApp broadcast.
          </div>
        ) : (
          campaigns.map(camp => {
            const total = camp.totalTarget || 1;
            const sentPct = Math.round((camp.sentCount / total) * 100);
            const deliveredPct = Math.round((camp.deliveredCount / total) * 100);
            const readPct = Math.round((camp.readCount / total) * 100);

            return (
              <div
                key={camp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-base">{camp.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        Status: {camp.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <FileCode2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                      Template: <span className="font-mono font-semibold text-slate-700">{camp.template.name}</span>
                      &bull; Target Audience: <span className="font-semibold text-slate-700">{camp.totalTarget} contacts</span>
                    </p>
                  </div>

                  {camp.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleExecuteCampaign(camp.id)}
                      disabled={isSendingId === camp.id}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSendingId === camp.id ? 'Sending Broadcast...' : 'Execute Broadcast Now'}</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar & Stats */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Campaign Delivery Analytics</span>
                    <span>
                      {camp.sentCount} / {camp.totalTarget} Processed
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${readPct}%` }}
                      className="bg-blue-600 h-full"
                      title={`Read: ${camp.readCount}`}
                    ></div>
                    <div
                      style={{ width: `${deliveredPct - readPct}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Delivered: ${camp.deliveredCount}`}
                    ></div>
                    <div
                      style={{ width: `${sentPct - deliveredPct}%` }}
                      className="bg-amber-400 h-full"
                      title={`Sent: ${camp.sentCount}`}
                    ></div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center pt-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Sent</span>
                      <span className="font-extrabold text-slate-900">{camp.sentCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Delivered</span>
                      <span className="font-extrabold text-emerald-900">{camp.deliveredCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50">
                      <span className="text-blue-700 text-[10px] uppercase font-bold block">Read Ticks</span>
                      <span className="font-extrabold text-blue-900">{camp.readCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50">
                      <span className="text-rose-700 text-[10px] uppercase font-bold block">Failed</span>
                      <span className="font-extrabold text-rose-900">{camp.failedCount}</span>
                    </div>
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
