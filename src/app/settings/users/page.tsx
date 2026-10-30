'use client';

import React from 'react';
import { Users, Shield, UserPlus, Mail } from 'lucide-react';

export default function UsersSettingsPage() {
  const users = [
    { id: '1', name: 'Sarah Connor', email: 'admin@acme.com', role: 'OWNER', status: 'Active' },
    { id: '2', name: 'Alex Rivera', email: 'alex@acme.com', role: 'ADMIN', status: 'Active' },
    { id: '3', name: 'John Doe', email: 'john@acme.com', role: 'AGENT', status: 'Active' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users & Roles Management</h1>
          <p className="text-xs text-slate-500">
            Multi-tenant organization team members and role-based permissions
          </p>
        </div>

        <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition">
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{u.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'OWNER'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-emerald-600">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
