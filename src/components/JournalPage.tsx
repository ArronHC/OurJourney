'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import MeetingEditor, { toMeetingDraft, type MeetingDraft } from '@/components/MeetingEditor';
import TicketEditor, {
  ticketDraftToPayload,
  toTicketDraft,
  type TicketDraft,
} from '@/components/TicketEditor';
import type { Meeting } from '@/types';
import TicketCard from './TicketCard';

interface JournalPageProps {
  meeting: Meeting;
  onRefresh: () => Promise<unknown>;
  onDeleteMeeting: (meetingId: number) => Promise<unknown>;
  panelId?: string;
}

function ActionButton({
  label,
  onClick,
  tone = 'default',
  busy = false,
}: {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`rounded-full border px-3 py-1.5 text-xs font-serif transition ${
        tone === 'danger'
          ? 'border-[#d6b0a2] bg-[#fff7f3] text-[#b45f47] hover:border-[#b45f47]'
          : 'border-journal-border bg-white text-journal-text hover:border-journal-accent'
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

export default function JournalPage({
  meeting,
  onRefresh,
  onDeleteMeeting,
  panelId,
}: JournalPageProps) {
  const tickets = meeting.tickets || [];
  const totalCost = tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
  const days =
    Math.max(
      1,
      Math.round(
        (new Date(meeting.end_date).getTime() - new Date(meeting.start_date).getTime()) / 86400000
      )
    ) + 1;
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [meetingDraft, setMeetingDraft] = useState<MeetingDraft>(toMeetingDraft(meeting));
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [ticketDraft, setTicketDraft] = useState<TicketDraft>(toTicketDraft());
  const [busyState, setBusyState] = useState<string | null>(null);

  useEffect(() => {
    setMeetingDraft(toMeetingDraft(meeting));
    setEditingMeeting(false);
    setEditingTicketId(null);
    setTicketDraft(toTicketDraft());
    setMessage(null);
  }, [meeting]);

  const handleMeetingSave = async () => {
    setBusyState('meeting-save');
    setMessage(null);

    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meetingDraft,
          notes: meetingDraft.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: 'error', text: errorData?.error || '更新见面记录失败' });
        return;
      }

      setEditingMeeting(false);
      setMessage({ type: 'success', text: '见面记录已更新' });
      await onRefresh();
    } finally {
      setBusyState(null);
    }
  };

  const handleMeetingDelete = async () => {
    if (!window.confirm(`确定删除「${meeting.city} · ${meeting.title}」吗？相关票据也会一起删除。`)) {
      return;
    }

    setBusyState('meeting-delete');
    setMessage(null);

    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: 'error', text: errorData?.error || '删除见面记录失败' });
        return;
      }

      await onDeleteMeeting(meeting.id);
    } finally {
      setBusyState(null);
    }
  };

  const startTicketEdit = (ticketId: number) => {
    const target = tickets.find((ticket) => ticket.id === ticketId);
    if (!target) {
      return;
    }

    setEditingTicketId(ticketId);
    setTicketDraft(toTicketDraft(target, target.type));
    setMessage(null);
  };

  const handleTicketSave = async () => {
    if (!editingTicketId) {
      return;
    }

    setBusyState(`ticket-save-${editingTicketId}`);
    setMessage(null);

    try {
      const response = await fetch(`/api/tickets/${editingTicketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meeting.id,
          ...ticketDraftToPayload(ticketDraft),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: 'error', text: errorData?.error || '更新票据失败' });
        return;
      }

      setEditingTicketId(null);
      setTicketDraft(toTicketDraft());
      setMessage({ type: 'success', text: '票据已更新' });
      await onRefresh();
    } finally {
      setBusyState(null);
    }
  };

  const handleTicketDelete = async (ticketId: number) => {
    if (!window.confirm('确定删除这张票据吗？截图文件也会一并清理。')) {
      return;
    }

    setBusyState(`ticket-delete-${ticketId}`);
    setMessage(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: 'error', text: errorData?.error || '删除票据失败' });
        return;
      }

      if (editingTicketId === ticketId) {
        setEditingTicketId(null);
        setTicketDraft(toTicketDraft());
      }

      setMessage({ type: 'success', text: '票据已删除' });
      await onRefresh();
    } finally {
      setBusyState(null);
    }
  };

  return (
    <motion.div
      id={panelId}
      role="region"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="mt-3 overflow-hidden rounded-[14px] border border-journal-border/60 bg-journal-paper shadow-lg"
    >
      <div className="relative p-8">
        <div className="journal-lines absolute inset-0" />
        <div className="journal-binding absolute bottom-0 left-9 top-0" />

        <div className="relative">
          <div className="mb-7 text-center">
            <div className="text-xs uppercase tracking-[3px] text-journal-text-muted">{meeting.title}</div>
            <h3 className="mt-1 text-2xl font-bold text-journal-text">
              {meeting.city} · {days}天{days > 1 ? `${days - 1}夜` : ''}
            </h3>
            <div className="mt-1 text-sm text-journal-text-secondary">
              {meeting.start_date} — {meeting.end_date}
            </div>
            <div className="mx-auto mt-3.5 h-0.5 w-[50px] bg-journal-gold" />
          </div>

          {message && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {editingMeeting ? (
            <MeetingEditor
              value={meetingDraft}
              onChange={setMeetingDraft}
              title="编辑这次见面"
              submitLabel="保存见面"
              onSubmit={() => void handleMeetingSave()}
              onCancel={() => {
                setEditingMeeting(false);
                setMeetingDraft(toMeetingDraft(meeting));
              }}
              busy={busyState === 'meeting-save'}
              className="mb-5"
            />
          ) : (
            <div className="mb-5 rounded-[14px] border border-journal-border/80 bg-[#fffaf2] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[2px] text-journal-text-muted">见面管理</div>
                  <div className="mt-1 text-sm leading-7 text-journal-text-secondary">
                    {meeting.notes?.trim() ? meeting.notes : '这次见面还没有补充备注。'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="编辑见面" onClick={() => setEditingMeeting(true)} />
                  <ActionButton
                    label="删除见面"
                    tone="danger"
                    busy={busyState === 'meeting-delete'}
                    onClick={() => void handleMeetingDelete()}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            {tickets.length === 0 && (
              <div className="rounded-[14px] border border-dashed border-journal-border bg-[#fffaf2] px-4 py-6 text-center text-sm text-journal-text-muted">
                这次见面还没有票据记录。
              </div>
            )}

            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
              >
                {editingTicketId === ticket.id ? (
                  <TicketEditor
                    value={ticketDraft}
                    onChange={setTicketDraft}
                    title="编辑票据"
                    submitLabel="保存票据"
                    onSubmit={() => void handleTicketSave()}
                    onCancel={() => {
                      setEditingTicketId(null);
                      setTicketDraft(toTicketDraft());
                    }}
                    busy={busyState === `ticket-save-${ticket.id}`}
                    className="mb-4"
                  />
                ) : (
                  <TicketCard
                    ticket={ticket}
                    index={index}
                    actions={
                      <div className="flex flex-wrap gap-2">
                        <ActionButton label="编辑票据" onClick={() => startTicketEdit(ticket.id)} />
                        <ActionButton
                          label="删除票据"
                          tone="danger"
                          busy={busyState === `ticket-delete-${ticket.id}`}
                          onClick={() => void handleTicketDelete(ticket.id)}
                        />
                      </div>
                    }
                  />
                )}
              </motion.div>
            ))}
          </div>

          {tickets.length > 0 && (
            <div className="relative mt-6 border-t border-dashed border-journal-border pt-4 text-center">
              <div className="text-sm text-journal-text-muted">本次见面总花费</div>
              <div className="text-[32px] font-bold text-journal-accent">¥{totalCost.toLocaleString()}</div>
              <div className="mt-1.5 text-xs text-journal-text-muted">💕 每一分钱都值得</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
