'use client';

import type { Meeting } from '@/types';

export interface MeetingDraft {
  title: string;
  city: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export const EMPTY_MEETING_DRAFT: MeetingDraft = {
  title: '',
  city: '',
  start_date: '',
  end_date: '',
  notes: '',
};

export function toMeetingDraft(meeting?: Partial<Meeting> | null): MeetingDraft {
  return {
    title: meeting?.title ?? '',
    city: meeting?.city ?? '',
    start_date: meeting?.start_date ?? '',
    end_date: meeting?.end_date ?? '',
    notes: meeting?.notes ?? '',
  };
}

interface MeetingEditorProps {
  value: MeetingDraft;
  onChange: (value: MeetingDraft) => void;
  title?: string;
  submitLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  busy?: boolean;
  className?: string;
}

export default function MeetingEditor({
  value,
  onChange,
  title,
  submitLabel,
  onSubmit,
  onCancel,
  busy = false,
  className = '',
}: MeetingEditorProps) {
  const updateField = (key: keyof MeetingDraft, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <div className={`rounded-[14px] border border-journal-border bg-journal-paper p-5 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4 text-sm font-semibold tracking-[1px] text-journal-text">{title}</div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] text-journal-text-muted">标题</label>
          <input
            type="text"
            value={value.title}
            placeholder="如：情人节"
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-journal-text-muted">城市</label>
          <input
            type="text"
            value={value.city}
            placeholder="如：上海"
            onChange={(event) => updateField('city', event.target.value)}
            className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-journal-text-muted">开始日期</label>
          <input
            type="date"
            value={value.start_date}
            onChange={(event) => updateField('start_date', event.target.value)}
            className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-journal-text-muted">结束日期</label>
          <input
            type="date"
            value={value.end_date}
            onChange={(event) => updateField('end_date', event.target.value)}
            className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[11px] text-journal-text-muted">备注</label>
        <textarea
          value={value.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          rows={4}
          placeholder="写一点这次见面的回忆..."
          className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
        />
      </div>

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
