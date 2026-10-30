'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-500 font-medium">Enter your email to receive recovery instructions</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2 text-center">
            <p className="font-bold">Password Reset Email Sent!</p>
            <p className="text-slate-600">Please check your inbox for instructions to reset your account password.</p>
            <Link href="/login" className="inline-block mt-2 font-bold text-emerald-600 hover:text-emerald-700">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@acme.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Send className="w-4 h-4" />
              <span>Send Reset Instructions</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 text-xs">
          <Link href="/login" className="font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
