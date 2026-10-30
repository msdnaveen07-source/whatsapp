import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Send,
  CheckCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  FileCode2,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let org: any = null;
  let totalContacts = 0;
  let activeConversations = 0;
  let unreadMessagesCount = { _sum: { unreadCount: 0 } };
  let messagesSent = 0;
  let messagesReceived = 0;
  let deliveredCount = 0;
  let readCount = 0;
  let failedCount = 0;
  let connection: any = null;
  let recentConversations: any[] = [];
  let templatesCount = 0;
  let approvedTemplates = 0;

  try {
    org = await prisma.organization.findFirst();
    const orgId = org?.id || '';

    if (orgId) {
      const [
        totalContactsRes,
        activeConversationsRes,
        unreadAggRes,
        messagesSentRes,
        messagesReceivedRes,
        deliveredCountRes,
        readCountRes,
        failedCountRes,
        connectionRes,
        recentConversationsRes,
        templatesCountRes,
        approvedTemplatesRes,
      ] = await Promise.all([
        prisma.contact.count({ where: { organizationId: orgId } }),
        prisma.conversation.count({ where: { organizationId: orgId, status: 'OPEN' } }),
        prisma.conversation.aggregate({
          where: { organizationId: orgId },
          _sum: { unreadCount: true },
        }),
        prisma.message.count({ where: { organizationId: orgId, direction: 'OUTBOUND' } }),
        prisma.message.count({ where: { organizationId: orgId, direction: 'INBOUND' } }),
        prisma.message.count({ where: { organizationId: orgId, status: 'DELIVERED' } }),
        prisma.message.count({ where: { organizationId: orgId, status: 'READ' } }),
        prisma.message.count({ where: { organizationId: orgId, status: 'FAILED' } }),
        prisma.whatsAppConnection.findUnique({ where: { organizationId: orgId } }),
        prisma.conversation.findMany({
          where: { organizationId: orgId },
          include: {
            contact: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
          take: 5,
          orderBy: { lastMessageAt: 'desc' },
        }),
        prisma.template.count({ where: { organizationId: orgId } }),
        prisma.template.count({ where: { organizationId: orgId, status: 'APPROVED' } }),
      ]);

      totalContacts = totalContactsRes;
      activeConversations = activeConversationsRes;
      if (unreadAggRes._sum.unreadCount) {
        unreadMessagesCount = { _sum: { unreadCount: unreadAggRes._sum.unreadCount } };
      }
      messagesSent = messagesSentRes;
      messagesReceived = messagesReceivedRes;
      deliveredCount = deliveredCountRes;
      readCount = readCountRes;
      failedCount = failedCountRes;
      connection = connectionRes;
      recentConversations = recentConversationsRes;
      templatesCount = templatesCountRes;
      approvedTemplates = approvedTemplatesRes;
    }
  } catch (error) {
    console.error('Error loading dashboard data from database:', error);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner: Connection Status & Quick Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Meta WhatsApp Cloud API
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              WABA ID: <span className="font-mono text-slate-700 font-medium">{connection?.wabaId || '100987654321098'}</span> &bull; Phone ID: <span className="font-mono text-slate-700 font-medium">{connection?.phoneNumberId || '105432109876543'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm shadow-emerald-600/20 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open 2-Way Inbox</span>
          </Link>
          <Link
            href="/settings/whatsapp"
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition border border-slate-200"
          >
            Configure Connection
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contacts
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{totalContacts}</span>
            <span className="text-xs text-emerald-600 font-semibold ml-2 inline-flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Conversations
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{activeConversations}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">Open Chats</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unread Messages
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {unreadMessagesCount._sum.unreadCount || 0}
            </span>
            <span className="text-xs text-amber-600 font-semibold ml-2">Requires Action</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Messages
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {messagesSent + messagesReceived}
            </span>
            <span className="text-xs text-slate-500 font-medium ml-2">
              Sent: {messagesSent} | Recv: {messagesReceived}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Row: Message Delivery Stats & Meta Templates Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Delivery Stats */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Delivery Status Breakdown</h3>
              <p className="text-xs text-slate-500">Live WhatsApp Cloud API status progression</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-xs text-slate-600 font-medium">Real-Time Sync</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{deliveredCount + readCount}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Delivered</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{readCount}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Read Ticks</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900">{failedCount}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">Failed</p>
            </div>
          </div>
        </div>

        {/* Templates Status Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Meta Templates</h3>
              <FileCode2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Approved WhatsApp templates ready for outbound campaigns
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium">
                <span>Approved by Meta</span>
                <span className="font-bold text-emerald-700 text-sm">{approvedTemplates}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-amber-50 text-amber-900 font-medium">
                <span>Pending Review</span>
                <span className="font-bold text-amber-700 text-sm">
                  {templatesCount - approvedTemplates}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/templates/create"
            className="mt-6 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition flex items-center justify-center gap-2"
          >
            <span>Create New Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Conversations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent WhatsApp Conversations</h3>
            <p className="text-xs text-slate-500">Live 2-way chat customer interactions</p>
          </div>
          <Link
            href="/inbox"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All in Inbox <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No active conversations found</div>
          ) : (
            recentConversations.map(conv => {
              const lastMsg = conv.messages[0];
              return (
                <Link
                  key={conv.id}
                  href="/inbox"
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {conv.contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{conv.contact.name}</span>
                        <span className="text-xs font-mono text-slate-400">+{conv.contact.phone}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full font-bold text-[10px]">
                        {conv.unreadCount} unread
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
