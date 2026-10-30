'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/logs/api?type=${typeFilter}&status=${statusFilter}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [typeFilter, statusFilter]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">API & Webhook Audit Logs</h1>
          <p className="text-xs text-slate-500">
            Real-time request trace logger for all WhatsApp Cloud API and Webhook endpoints
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Request Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Types</option>
            <option value="WEBHOOK">WEBHOOK</option>
            <option value="MESSAGE">MESSAGE</option>
            <option value="TEMPLATE">TEMPLATE</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="success">Success (HTTP 2xx)</option>
            <option value="failed">Failed (HTTP 4xx/5xx)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Request Type</th>
                <th className="px-6 py-3.5">Endpoint</th>
                <th className="px-6 py-3.5">HTTP Status</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Response / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No logs recorded yet
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isSuccess = log.statusCode < 400;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition font-mono">
                      <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {log.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">{log.endpoint}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{log.durationMs} ms</td>
                      <td className="px-6 py-3.5 text-slate-600 truncate max-w-xs font-sans text-[11px]">
                        {log.errorMessage || log.responseBody || 'OK'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
