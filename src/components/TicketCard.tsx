'use client';

import type { ReactNode } from 'react';
import type { Ticket } from '@/types';
import { PaperClip, PushPin, WashiTape } from './TicketDecorations';

const ROTATION_CLASSES = [
  'ticket-rotate-1',
  'ticket-rotate-2',
  'ticket-rotate-3',
  'ticket-rotate-4',
  'ticket-rotate-5',
];

const TYPE_STYLES = {
  flight:
    'bg-gradient-to-br from-ticket-flight-start to-ticket-flight-end border-ticket-flight-border',
  train: 'bg-gradient-to-br from-ticket-train-start to-ticket-train-end border-ticket-train-border',
  hotel: 'bg-gradient-to-br from-ticket-hotel-start to-ticket-hotel-end border-ticket-hotel-border',
};

const TYPE_ICONS = { flight: '✈️', train: '🚄', hotel: '🏨' };

const DECORATIONS = {
  flight: PaperClip,
  train: WashiTape,
  hotel: PushPin,
};

export default function TicketCard({
  ticket,
  index,
  actions,
}: {
  ticket: Ticket;
  index: number;
  actions?: ReactNode;
}) {
  const rotation = ROTATION_CLASSES[index % ROTATION_CLASSES.length];
  const style = TYPE_STYLES[ticket.type];
  const Decoration = DECORATIONS[ticket.type];

  if (ticket.type === 'hotel') {
    return (
      <div className={`${style} ${rotation} relative mb-4 rounded-xl border p-[18px_20px] shadow-md`}>
        <Decoration />
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-[11px] text-journal-text-muted">
              {TYPE_ICONS[ticket.type]} 住宿
            </div>
            <div className="mt-1 text-lg font-bold text-journal-text">
              {ticket.hotel_name || '未知酒店'}
            </div>
            <div className="mt-1 text-xs text-journal-text-secondary">
              {ticket.check_in && ticket.check_out
                ? `${Math.round(
                    (new Date(ticket.check_out).getTime() -
                      new Date(ticket.check_in).getTime()) /
                      86400000
                  )}晚 · ${ticket.check_in} 入住 → ${ticket.check_out} 退房`
                : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-bold text-journal-accent">
              {ticket.price != null ? `¥${ticket.price.toLocaleString()}` : '—'}
            </div>
            {ticket.price_per_night != null && (
              <div className="text-[11px] text-journal-text-muted">
                ¥{ticket.price_per_night}/晚
              </div>
            )}
          </div>
        </div>
        {actions && <div className="mt-4 flex justify-end">{actions}</div>}
      </div>
    );
  }

  return (
    <div className={`${style} ${rotation} relative mb-4 rounded-xl border p-[18px_20px] shadow-md`}>
      <Decoration />
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 text-[11px] text-journal-text-muted">
            {TYPE_ICONS[ticket.type]} {ticket.type === 'flight' ? '航班' : '列车'} ·{' '}
            {ticket.carrier || ''} {ticket.trip_number || ''}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div>
              <div className="text-[22px] font-bold text-journal-text">
                {ticket.departure || '—'}
              </div>
              <div className="text-[11px] text-journal-text-secondary">
                {ticket.departure_time
                  ? new Date(ticket.departure_time).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
            </div>
            <div className="text-base text-journal-gold">── {TYPE_ICONS[ticket.type]} ──›</div>
            <div>
              <div className="text-[22px] font-bold text-journal-text">
                {ticket.arrival || '—'}
              </div>
              <div className="text-[11px] text-journal-text-secondary">
                {ticket.arrival_time
                  ? new Date(ticket.arrival_time).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-bold text-journal-accent">
            {ticket.price != null ? `¥${ticket.price.toLocaleString()}` : '—'}
          </div>
          {ticket.seat_class && (
            <div className="text-[11px] text-journal-text-muted">{ticket.seat_class}</div>
          )}
        </div>
      </div>
      {actions && <div className="mt-4 flex justify-end">{actions}</div>}
    </div>
  );
}
