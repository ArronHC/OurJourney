'use client';

import { motion } from 'framer-motion';
import type { Meeting } from '@/types';
import TicketCard from './TicketCard';

export default function JournalPage({ meeting }: { meeting: Meeting }) {
  const tickets = meeting.tickets || [];
  const totalCost = tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
  const days =
    Math.max(
      1,
      Math.round(
        (new Date(meeting.end_date).getTime() - new Date(meeting.start_date).getTime()) /
          86400000
      )
    ) + 1;

  return (
    <motion.div
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
            <div className="text-xs uppercase tracking-[3px] text-journal-text-muted">
              {meeting.title}
            </div>
            <h3 className="mt-1 text-2xl font-bold text-journal-text">
              {meeting.city} · {days}天{days > 1 ? `${days - 1}夜` : ''}
            </h3>
            <div className="mt-1 text-sm text-journal-text-secondary">
              {meeting.start_date} — {meeting.end_date}
            </div>
            <div className="mx-auto mt-3.5 h-0.5 w-[50px] bg-journal-gold" />
          </div>

          <div>
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
              >
                <TicketCard ticket={ticket} index={index} />
              </motion.div>
            ))}
          </div>

          {tickets.length > 0 && (
            <div className="relative mt-6 border-t border-dashed border-journal-border pt-4 text-center">
              <div className="text-sm text-journal-text-muted">本次见面总花费</div>
              <div className="text-[32px] font-bold text-journal-accent">
                ¥{totalCost.toLocaleString()}
              </div>
              <div className="mt-1.5 text-xs text-journal-text-muted">💕 每一分钱都值得</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
