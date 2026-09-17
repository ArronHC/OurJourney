'use client';

import type { ReactNode } from 'react';
import type { Ticket, TicketType, Traveler } from '@/types';

export interface TicketDraft {
  type: TicketType;
  traveler: Traveler;
  departure: string;
  arrival: string;
  departure_time: string;
  arrival_time: string;
  carrier: string;
  trip_number: string;
  seat_class: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  price_per_night: string;
  price: string;
  screenshot_path: string;
  raw_ocr_data: string;
}

const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'flight', label: '✈️ 机票' },
  { value: 'train', label: '🚄 火车票' },
  { value: 'hotel', label: '🏨 酒店' },
];

function normalizeDateTime(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const normalized = value.trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

export function toTicketDraft(ticket?: Partial<Ticket> | null, defaultType: TicketType = 'flight'): TicketDraft {
  return {
    type: ticket?.type ?? defaultType,
    traveler: ticket?.traveler ?? 'a',
    departure: ticket?.departure ?? '',
    arrival: ticket?.arrival ?? '',
    departure_time: normalizeDateTime(ticket?.departure_time),
    arrival_time: normalizeDateTime(ticket?.arrival_time),
    carrier: ticket?.carrier ?? '',
    trip_number: ticket?.trip_number ?? '',
    seat_class: ticket?.seat_class ?? '',
    hotel_name: ticket?.hotel_name ?? '',
    check_in: normalizeDate(ticket?.check_in),
    check_out: normalizeDate(ticket?.check_out),
    price_per_night:
      ticket?.price_per_night == null || Number.isNaN(ticket.price_per_night)
        ? ''
        : String(ticket.price_per_night),
    price: ticket?.price == null || Number.isNaN(ticket.price) ? '' : String(ticket.price),
    screenshot_path: ticket?.screenshot_path ?? '',
    raw_ocr_data: ticket?.raw_ocr_data ?? '',
  };
}

export function ticketDraftToPayload(ticket: TicketDraft) {
  const base = {
    type: ticket.type,
    traveler: ticket.traveler,
    departure: ticket.departure || null,
    arrival: ticket.arrival || null,
    departure_time: ticket.departure_time || null,
    arrival_time: ticket.arrival_time || null,
    carrier: ticket.carrier || null,
    trip_number: ticket.trip_number || null,
    seat_class: ticket.seat_class || null,
    hotel_name: ticket.hotel_name || null,
    check_in: ticket.check_in || null,
    check_out: ticket.check_out || null,
    price_per_night: ticket.price_per_night === '' ? null : Number(ticket.price_per_night),
    price: ticket.price === '' ? null : Number(ticket.price),
    screenshot_path: ticket.screenshot_path || null,
    raw_ocr_data: ticket.raw_ocr_data || null,
  };

  return base;
}

interface TicketEditorProps {
  value: TicketDraft;
  onChange: (value: TicketDraft) => void;
  title?: string;
  submitLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  busy?: boolean;
  showTypeSelector?: boolean;
  showTravelerSelector?: boolean;
  travelerLabels?: { a: string; b: string };
  className?: string;
  children?: ReactNode;
}

export default function TicketEditor({
  value,
  onChange,
  title,
  submitLabel,
  onSubmit,
  onCancel,
  busy = false,
  showTypeSelector = true,
  showTravelerSelector = true,
  travelerLabels = { a: '伴侣A 的票', b: '伴侣B 的票' },
  className = '',
  children,
}: TicketEditorProps) {
  const updateField = (key: keyof TicketDraft, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  const transportFields: Array<{ key: keyof TicketDraft; label: string; type?: string }> = [
    { key: 'departure', label: '出发地' },
    { key: 'arrival', label: '目的地' },
    { key: 'departure_time', label: '出发时间', type: 'datetime-local' },
    { key: 'arrival_time', label: '到达时间', type: 'datetime-local' },
    { key: 'carrier', label: '承运方' },
    { key: 'trip_number', label: '航班号/车次' },
    { key: 'seat_class', label: '舱位/座席' },
    { key: 'price', label: '价格', type: 'number' },
  ];

  const hotelFields: Array<{ key: keyof TicketDraft; label: string; type?: string }> = [
    { key: 'hotel_name', label: '酒店名称' },
    { key: 'check_in', label: '入住日期', type: 'date' },
    { key: 'check_out', label: '退房日期', type: 'date' },
    { key: 'price_per_night', label: '每晚价格', type: 'number' },
    { key: 'price', label: '总价', type: 'number' },
  ];

  const fields = value.type === 'hotel' ? hotelFields : transportFields;

  return (
    <div className={`rounded-[14px] border border-journal-border bg-journal-paper p-5 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4 text-sm font-semibold tracking-[1px] text-journal-text">{title}</div>
      )}

      {showTypeSelector && (
        <div className="mb-3 flex flex-wrap justify-center gap-3">
          {TICKET_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('type', type.value)}
              className={`rounded-[10px] border-[1.5px] bg-white px-5 py-3 text-sm font-serif transition-all ${
                value.type === type.value
                  ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                  : 'border-journal-border text-journal-text hover:border-journal-accent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {showTravelerSelector && (
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => updateField('traveler', 'a')}
            className={`rounded-[10px] border-[1.5px] bg-white px-5 py-2 text-sm font-serif transition-all ${
              value.traveler === 'a'
                ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                : 'border-journal-border text-journal-text'
            }`}
          >
            {travelerLabels.a}
          </button>
          <button
            type="button"
            onClick={() => updateField('traveler', 'b')}
            className={`rounded-[10px] border-[1.5px] bg-white px-5 py-2 text-sm font-serif transition-all ${
              value.traveler === 'b'
                ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                : 'border-journal-border text-journal-text'
            }`}
          >
            {travelerLabels.b}
          </button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-[11px] text-journal-text-muted">{field.label}</label>
            <input
              type={field.type || 'text'}
              value={value[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      {children}

      {(onSubmit || onCancel) && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[10px] border border-journal-border bg-white px-4 py-2 text-sm font-serif text-journal-text transition hover:border-journal-accent"
            >
              取消
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={busy}
              className="rounded-[10px] bg-gradient-to-br from-journal-accent to-[#d4946e] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy ? '保存中...' : submitLabel || '保存'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
