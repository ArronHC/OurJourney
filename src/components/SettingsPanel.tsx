'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    onClose();
  };

  if (!open) {
    return null;
  }

  const fields = [
    { key: 'relationship_start_date', label: '恋爱开始日期', type: 'date' },
    { key: 'partner_a_name', label: '伴侣A名称', type: 'text' },
    { key: 'partner_b_name', label: '伴侣B名称', type: 'text' },
    { key: 'partner_city_a', label: '伴侣A所在城市', type: 'text' },
    { key: 'partner_city_b', label: '伴侣B所在城市', type: 'text' },
    { key: 'next_meeting_date', label: '下次见面日期', type: 'date' },
    { key: 'next_meeting_city', label: '下次见面城市', type: 'text' },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-journal-border bg-journal-paper p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-journal-text">设置</h3>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-[11px] text-journal-text-muted">
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif focus:border-journal-accent focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-journal-border py-2.5 text-sm font-serif text-journal-text-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-journal-accent py-2.5 text-sm font-semibold text-white font-serif"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
