'use client';

import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useMeeting, useMeetings } from '@/hooks/useMeetings';
import type { Ticket } from '@/types';
import EmptyState from './EmptyState';
import JournalPage from './JournalPage';
import ScrollFadeIn from './ScrollFadeIn';

const TAG_STYLES: Record<string, string> = {
  flight: 'bg-[#faf0e6] border-journal-border',
  train: 'bg-[#f8f0f2] border-ticket-train-border',
  hotel: 'bg-[#f0f4f8] border-ticket-hotel-border',
};

const TAG_ICONS: Record<string, string> = { flight: '✈️', train: '🚄', hotel: '🏨' };

export default function Timeline() {
  const { meetings, isLoading, mutate: mutateMeetings } = useMeetings();
  const { mutate: mutateCache } = useSWRConfig();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const {
    meeting: expandedMeeting,
    error: expandedMeetingError,
    isLoading: isExpandedMeetingLoading,
    mutate: mutateExpandedMeeting,
  } = useMeeting(expandedId);

  const refreshExpandedMeeting = async () => {
    await Promise.all([
      mutateMeetings(),
      mutateCache('/api/stats'),
      expandedId ? mutateExpandedMeeting() : Promise.resolve(),
    ]);
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (expandedId === meetingId) {
      setExpandedId(null);
    }

    await Promise.all([mutateMeetings(), mutateCache('/api/stats')]);
  };

  return (
    <section
      id="timeline"
      className="min-h-screen bg-gradient-to-b from-journal-bg via-[#faf5ee] to-journal-bg px-5 py-20"
    >
      <div className="mx-auto max-w-journal">
        <h2 className="mb-7 text-center text-[22px] font-bold text-journal-text">
          <span className="border-b-2 border-journal-gold pb-1.5">📖 我们的时间线</span>
        </h2>

        {isLoading ? (
          <div className="py-16 text-center text-journal-text-muted">加载中...</div>
        ) : meetings.length === 0 ? (
          <EmptyState
            message="还没有见面记录，去添加第一次吧 ✈️"
            action={{ label: '添加记录', target: 'record' }}
          />
        ) : (
          <div className="relative pl-8">
            <div className="absolute bottom-0 left-[10px] top-0 w-0.5 bg-journal-border" />

            {meetings.map((meeting, idx) => (
              <ScrollFadeIn key={meeting.id}>
                <div className="relative mb-6">
                  <div
                    className={`absolute -left-[22px] top-4 h-4 w-4 rounded-full border-[2.5px] border-white shadow-sm ${
                      idx === meetings.length - 1 ? 'bg-journal-accent' : 'bg-journal-gold'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                    aria-expanded={expandedId === meeting.id}
                    aria-controls={`meeting-panel-${meeting.id}`}
                    className={`w-full rounded-xl border bg-journal-paper p-[18px_20px] text-left shadow-sm transition-all hover:translate-x-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-journal-accent/40 ${
                      expandedId === meeting.id ? 'border-journal-accent' : 'border-journal-border'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>
                        <span className="block text-xs text-journal-text-muted">
                          {meeting.start_date} — {meeting.end_date}
                        </span>
                        <span className="mt-0.5 block text-lg font-bold text-journal-text">
                          {meeting.city} · {meeting.title}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-lg font-bold text-journal-accent">
                          ¥{(meeting.total_cost || 0).toLocaleString()}
                        </span>
                      </span>
                    </span>
                    {meeting.tickets && meeting.tickets.length > 0 && (
                      <span className="mt-2.5 flex flex-wrap gap-1.5">
                        {meeting.tickets.map((ticket: Ticket) => (
                          <span
                            key={ticket.id}
                            className={`${TAG_STYLES[ticket.type]} rounded-md border px-2.5 py-0.5 text-[11px] text-journal-text-secondary`}
                          >
                            {TAG_ICONS[ticket.type]}{' '}
                            {ticket.type === 'hotel'
                              ? ticket.hotel_name
                              : `${ticket.departure}→${ticket.arrival}`}{' '}
                            {ticket.price != null ? `¥${ticket.price}` : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedId === meeting.id && expandedMeeting ? (
                      <JournalPage
                        meeting={expandedMeeting}
                        onRefresh={refreshExpandedMeeting}
                        onDeleteMeeting={handleDeleteMeeting}
                        panelId={`meeting-panel-${meeting.id}`}
                      />
                    ) : expandedId === meeting.id ? (
                      <div
                        id={`meeting-panel-${meeting.id}`}
                        role="region"
                        aria-live="polite"
                        className="mt-3 rounded-[14px] border border-journal-border/60 bg-journal-paper p-6 text-center text-sm text-journal-text-muted shadow-sm"
                      >
                        {expandedMeetingError
                          ? '见面详情加载失败，请稍后重试'
                          : isExpandedMeetingLoading
                            ? '正在加载见面详情...'
                            : '暂无见面详情'}
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
