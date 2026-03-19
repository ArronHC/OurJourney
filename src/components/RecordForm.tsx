'use client';

import { useRef, useState } from 'react';
import { useMeetings } from '@/hooks/useMeetings';
import { useSettings } from '@/hooks/useSettings';
import type { RecognizeResponse, TicketType } from '@/types';

export default function RecordForm() {
  const { meetings, mutate: mutateMeetings } = useMeetings();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ticketType, setTicketType] = useState<TicketType>('flight');
  const [traveler, setTraveler] = useState<'a' | 'b'>('a');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [meetingId, setMeetingId] = useState<number | 'new'>('new');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    city: '',
    start_date: '',
    end_date: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('type', ticketType);

    try {
      const response = await fetch('/api/recognize', { method: 'POST', body: fd });
      const data: RecognizeResponse = await response.json();
      setResult(data);
      if (data.success && data.data) {
        setFormData({ ...data.data, screenshot_path: data.screenshot_path });
      } else {
        setFormData({ screenshot_path: data.screenshot_path });
        setMessage({ type: 'error', text: data.message || 'AI 未能识别此截图，请手动填写' });
      }
    } catch {
      setMessage({ type: 'error', text: '识别服务暂时不可用，请手动填写' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      let targetMeetingId = meetingId;
      if (meetingId === 'new') {
        const response = await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMeeting),
        });
        if (!response.ok) {
          setMessage({ type: 'error', text: '创建见面记录失败' });
          return;
        }
        const meeting = await response.json();
        targetMeetingId = meeting.id;
      }

      const ticketBody = {
        meeting_id: targetMeetingId,
        type: ticketType,
        traveler,
        ...formData,
      };
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketBody),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '保存成功！' });
        setResult(null);
        setFormData({});
        setNewMeeting({ title: '', city: '', start_date: '', end_date: '' });
        mutateMeetings();
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const TYPES: { value: TicketType; label: string }[] = [
    { value: 'flight', label: '✈️ 机票' },
    { value: 'train', label: '🚄 火车票' },
    { value: 'hotel', label: '🏨 酒店' },
  ];

  const transportFields = [
    { key: 'departure', label: '出发地' },
    { key: 'arrival', label: '目的地' },
    { key: 'departure_time', label: '出发时间', type: 'datetime-local' },
    { key: 'arrival_time', label: '到达时间', type: 'datetime-local' },
    { key: 'carrier', label: '承运方' },
    { key: 'trip_number', label: '航班号/车次' },
    { key: 'seat_class', label: '舱位/座席' },
    { key: 'price', label: '价格', type: 'number' },
  ];

  const hotelFields = [
    { key: 'hotel_name', label: '酒店名称' },
    { key: 'check_in', label: '入住日期', type: 'date' },
    { key: 'check_out', label: '退房日期', type: 'date' },
    { key: 'price_per_night', label: '每晚价格', type: 'number' },
    { key: 'price', label: '总价', type: 'number' },
  ];

  const fields = ticketType === 'hotel' ? hotelFields : transportFields;

  return (
    <section
      id="record"
      className="min-h-screen bg-gradient-to-b from-journal-bg via-[#faf5ee] to-journal-bg px-5 py-20"
    >
      <div className="mx-auto max-w-journal">
        <h2 className="mb-7 text-center text-[22px] font-bold text-journal-text">
          <span className="border-b-2 border-journal-gold pb-1.5">✈️ 添加新记录</span>
        </h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-journal-binding bg-journal-paper px-6 py-12 text-center transition-all hover:border-journal-accent hover:bg-[#fefcf6]"
        >
          <div className="mb-3 text-5xl">{isUploading ? '⏳' : '📸'}</div>
          <div className="text-base font-semibold text-journal-text">
            {isUploading ? '正在识别...' : '点击或拖拽上传订单截图'}
          </div>
          <div className="mt-1.5 text-sm text-journal-text-muted">
            支持机票、火车票、酒店订单截图 · AI 自动识别
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => event.target.files?.[0] && handleUpload(event.target.files[0])}
          />
        </div>

        <div className="mt-5 flex justify-center gap-3">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setTicketType(type.value)}
              className={`rounded-[10px] border-[1.5px] bg-white px-5 py-3 text-sm font-serif transition-all ${
                ticketType === type.value
                  ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                  : 'border-journal-border text-journal-text hover:border-journal-accent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={() => setTraveler('a')}
            className={`rounded-[10px] border-[1.5px] bg-white px-5 py-2 text-sm font-serif transition-all ${
              traveler === 'a'
                ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                : 'border-journal-border text-journal-text'
            }`}
          >
            {settings.partner_a_name || '伴侣A'} 的票
          </button>
          <button
            onClick={() => setTraveler('b')}
            className={`rounded-[10px] border-[1.5px] bg-white px-5 py-2 text-sm font-serif transition-all ${
              traveler === 'b'
                ? 'border-journal-accent bg-[#fef8f0] text-journal-accent'
                : 'border-journal-border text-journal-text'
            }`}
          >
            {settings.partner_b_name || '伴侣B'} 的票
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-center text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {(result || Object.keys(formData).length > 0) && (
          <div className="mt-5 rounded-[14px] border border-journal-border bg-journal-paper p-6 shadow-sm">
            {result?.success && (
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-journal-text">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                AI 已识别以下信息（可编辑修正）
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={formData[field.key] ?? ''}
                    onChange={(event) =>
                      updateField(
                        field.key,
                        field.type === 'number' ? Number(event.target.value) || '' : event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm text-journal-text font-serif focus:border-journal-accent focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-[11px] text-journal-text-muted">归属见面</label>
              <select
                value={meetingId}
                onChange={(event) =>
                  setMeetingId(event.target.value === 'new' ? 'new' : Number(event.target.value))
                }
                className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm text-journal-text font-serif focus:border-journal-accent focus:outline-none"
              >
                <option value="new">+ 新建见面记录</option>
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    第{meetings.length - meetings.indexOf(meeting)}次 · {meeting.city} ·{' '}
                    {meeting.title}
                  </option>
                ))}
              </select>
            </div>

            {meetingId === 'new' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">标题</label>
                  <input
                    type="text"
                    placeholder="如：情人节"
                    value={newMeeting.title}
                    onChange={(event) =>
                      setNewMeeting((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif focus:border-journal-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">城市</label>
                  <input
                    type="text"
                    placeholder="如：上海"
                    value={newMeeting.city}
                    onChange={(event) =>
                      setNewMeeting((prev) => ({ ...prev, city: event.target.value }))
                    }
                    className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif focus:border-journal-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={newMeeting.start_date}
                    onChange={(event) =>
                      setNewMeeting((prev) => ({ ...prev, start_date: event.target.value }))
                    }
                    className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif focus:border-journal-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-journal-text-muted">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={newMeeting.end_date}
                    onChange={(event) =>
                      setNewMeeting((prev) => ({ ...prev, end_date: event.target.value }))
                    }
                    className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif focus:border-journal-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-5 w-full rounded-[10px] bg-gradient-to-br from-journal-accent to-[#d4946e] py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 font-serif"
            >
              {isSaving ? '保存中...' : '💾 保存到手帐'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
