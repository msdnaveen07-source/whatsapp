'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  User,
  Tag as TagIcon,
  FileText,
  FileCode2,
  Clock,
  MoreVertical,
  X,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations List
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/conversations?status=${activeFilter === 'ALL' || activeFilter === 'UNREAD' ? '' : activeFilter}&filter=${activeFilter === 'UNREAD' ? 'unread' : ''}`);
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Messages for Selected Conversation
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Approved Templates for Template Composer
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      if (data.templates) {
        const approved = data.templates.filter((t: any) => t.status === 'APPROVED');
        setTemplates(approved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, [activeFilter]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Real-time SSE Setup for instant message arrival
  useEffect(() => {
    const eventSource = new EventSource('/api/conversations/stream');

    eventSource.addEventListener('new_message', (e: any) => {
      const payload = JSON.parse(e.data);
      if (payload.conversationId === selectedConvId) {
        setMessages(prev => [...prev, payload.message]);
        scrollToBottom();
      }
      fetchConversations();
    });

    eventSource.addEventListener('status_update', (e: any) => {
      const payload = JSON.parse(e.data);
      if (payload.conversationId === selectedConvId) {
        setMessages(prev =>
          prev.map(m => (m.id === payload.messageId ? { ...m, status: payload.status } : m))
        );
      }
    });

    return () => {
      eventSource.close();
    };
  }, [selectedConvId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle Outbound Text Message Send
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedConvId || isSending) return;

    setIsSending(true);
    const textToSend = messageInput;
    setMessageInput('');

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConvId,
          type: 'TEXT',
          text: textToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Outbound Template Message Send
  const handleSendTemplateMessage = async () => {
    if (!selectedTemplate || !selectedConvId) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConvId,
          templateName: selectedTemplate.name,
          templateLanguage: selectedTemplate.language,
          templateParameters: templateVars,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        setTemplateVars({});
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-100">
      {/* 1. Left Conversation List Panel */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Header Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Inbox</h2>
            <button
              onClick={fetchConversations}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            {(['ALL', 'UNREAD', 'OPEN', 'CLOSED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-1 py-1 rounded-md transition ${
                  activeFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No conversations found</div>
          ) : (
            conversations
              .filter(
                c =>
                  c.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.contact.phone.includes(searchQuery)
              )
              .map(conv => {
                const isSelected = conv.id === selectedConvId;
                const lastMsg = conv.messages[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {conv.contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {conv.contact.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                      {conv.contact.contactTags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {conv.contact.contactTags.map((ct: any) => (
                            <span
                              key={ct.tag.id}
                              className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700"
                            >
                              {ct.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* 2. Center WhatsApp-Style Chat Panel */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#efeae2]/60">
          {/* Chat Header */}
          <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                {selectedConv.contact.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {selectedConv.contact.name}
                  <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    +{selectedConv.contact.phone}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedConv.assignedAgent
                    ? `Assigned to: ${selectedConv.assignedAgent.name}`
                    : 'Unassigned agent'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Send Template</span>
              </button>
              <button
                onClick={() => setShowRightDrawer(!showRightDrawer)}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => {
              const isInbound = msg.direction === 'INBOUND';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-3.5 shadow-sm text-xs space-y-1.5 relative ${
                      isInbound
                        ? 'bg-white text-slate-900 rounded-tl-none border border-slate-200/80'
                        : 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200'
                    }`}
                  >
                    {/* Render Template Header Badge */}
                    {msg.messageType === 'TEMPLATE' && (
                      <div className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-800 text-[10px] font-bold inline-block mb-1">
                        Template: {msg.templateName}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Timestamp & Ticks */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!isInbound && (
                        <span>
                          {msg.status === 'READ' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                          ) : msg.status === 'DELIVERED' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Composer Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 flex-shrink-0"
          >
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Type a WhatsApp message..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            <button
              type="submit"
              disabled={isSending || !messageInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Select a conversation to start chatting
        </div>
      )}

      {/* 3. Right Side Contact Drawer */}
      {showRightDrawer && selectedConv && (
        <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-xl mb-3">
              {selectedConv.contact.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{selectedConv.contact.name}</h3>
            <p className="text-xs text-slate-500 font-mono">+{selectedConv.contact.phone}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Contact Details
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{selectedConv.contact.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-medium text-slate-800">{selectedConv.contact.source}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedConv.contact.contactTags?.map((ct: any) => (
                <span
                  key={ct.tag.id}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"
                >
                  {ct.tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Select Meta Approved Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700">Choose Template</label>
              <select
                onChange={e => {
                  const tpl = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(tpl || null);
                }}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Choose an approved template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs text-slate-700 font-medium">
                    {selectedTemplate.components.find((c: any) => c.type === 'BODY')?.text}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Variables Mapping
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="{{1}} value (e.g. Alex)"
                        onChange={e => setTemplateVars({ ...templateVars, '1': e.target.value })}
                        className="p-2 bg-white border border-slate-200 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="{{2}} value (e.g. Tomorrow 2 PM)"
                        onChange={e => setTemplateVars({ ...templateVars, '2': e.target.value })}
                        className="p-2 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTemplateMessage}
                disabled={!selectedTemplate || isSending}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Send Template Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
