'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Tag as TagIcon,
  Trash2,
  Mail,
  Phone,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}&tag=${encodeURIComponent(selectedTag)}`);
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search, selectedTag]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagList = newContact.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContact,
          tags: tagList,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewContact({ name: '', phone: '', email: '', tags: '' });
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowImportModal(false);
        setImportFile(null);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contacts Management</h1>
          <p className="text-xs text-slate-500">
            Manage your WhatsApp customer profiles, tags, and audience segmentation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/contacts/export"
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Tag Filter:</span>
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Tags</option>
            {tags.map(t => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">WhatsApp Phone</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Tags</th>
                <th className="px-6 py-3.5">Source</th>
                <th className="px-6 py-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">+{c.phone}</td>
                    <td className="px-6 py-4 text-slate-500">{c.email || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.contactTags?.map((ct: any) => (
                          <span
                            key={ct.tag.id}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {ct.tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {c.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">WhatsApp Phone (with Country Code)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14155552671"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newContact.email}
                  onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="VIP Lead, Active Client"
                  value={newContact.tags}
                  onChange={e => setNewContact({ ...newContact, tags: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Import Contacts via CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="space-y-4">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Select CSV file with headers: <code className="bg-slate-100 px-1 py-0.5 rounded">name, phone, email</code>
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500 mx-auto block"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  Upload & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
