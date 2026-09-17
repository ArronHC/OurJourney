'use client';

import { useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
import MeetingEditor, { EMPTY_MEETING_DRAFT, type MeetingDraft } from '@/components/MeetingEditor';
import TicketEditor, {
  ticketDraftToPayload,
  toTicketDraft,
  type TicketDraft,
} from '@/components/TicketEditor';
import { useMeetings } from '@/hooks/useMeetings';
import { useSettings } from '@/hooks/useSettings';
import type { RecognizeResponse } from '@/types';

type EntryMode = 'upload' | 'manual';

function getMeetingDateDefaults(data?: RecognizeResponse['data']) {
  if (!data) {
    return { start_date: '', end_date: '' };
  }

  if (data.type === 'hotel') {
    return {
      start_date: data.check_in?.slice(0, 10) ?? '',
      end_date: data.check_out?.slice(0, 10) ?? '',
    };
  }

  return {
    start_date: data.departure_time?.slice(0, 10) ?? '',
    end_date: data.arrival_time?.slice(0, 10) ?? '',
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function isValidPrice(value: string) {
  if (value.trim() === '') {
    return false;
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0;
}

export default function RecordForm() {
  const { meetings, mutate: mutateMeetings } = useMeetings();
  const { mutate: mutateCache } = useSWRConfig();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [ticketDraft, setTicketDraft] = useState<TicketDraft>(toTicketDraft());
  const [meetingId, setMeetingId] = useState<number | 'new'>('new');
  const [newMeeting, setNewMeeting] = useState<MeetingDraft>(EMPTY_MEETING_DRAFT);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const resetTicketState = () => {
    setResult(null);
    setTicketDraft(toTicketDraft());
  };

  const handleModeChange = (nextMode: EntryMode) => {
    if (nextMode === entryMode) {
      return;
    }

    setEntryMode(nextMode);
    setMessage(null);
    resetTicketState();
  };

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    if (file.size <= 600_000) {
      return file;
    }

    const imageUrl = URL.createObjectURL(file);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error('image_load_failed'));
        nextImage.src = imageUrl;
      });

      const maxDimension = 1280;
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        return file;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/jpeg', 0.72);
      });

      if (!blob) {
        return file;
      }

      const outputName = file.name.replace(/\.[^.]+$/, '') || 'upload';
      return new File([blob], `${outputName}.jpg`, { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setMessage(null);
    const uploadFile = await compressImage(file);
    const fd = new FormData();
    fd.append('image', uploadFile);

    try {
      const response = await fetch('/api/recognize', { method: 'POST', body: fd });
      const raw = await response.text();
      let data: RecognizeResponse | null = null;

      try {
        data = JSON.parse(raw) as RecognizeResponse;
      } catch {
        setResult(null);
        setTicketDraft((prev) => ({
          ...toTicketDraft(undefined, prev.type),
          traveler: prev.traveler,
        }));
        setMessage({
          type: 'error',
          text: `识别请求失败（HTTP ${response.status}）`,
        });
        return;
      }

      setResult(data);
      if (data.success && data.data) {
        const detectedType = data.detected_type ?? data.data.type ?? ticketDraft.type;
        const recognizedTicket = {
          ...data.data,
          type: detectedType,
          screenshot_path: data.screenshot_path || null,
        };

        setTicketDraft((prev) => ({
          ...toTicketDraft(
            { ...recognizedTicket, traveler: prev.traveler },
            detectedType
          ),
          traveler: prev.traveler,
        }));
        setNewMeeting((prev) => ({
          ...prev,
          ...getMeetingDateDefaults(recognizedTicket),
        }));
      } else {
        setTicketDraft((prev) => ({
          ...prev,
          screenshot_path: data?.screenshot_path || '',
        }));
        setMessage({
          type: 'error',
          text:
            data?.message ||
            (response.ok
              ? 'AI 未能识别此截图，请手动填写'
              : `识别请求失败（HTTP ${response.status}）`),
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? `识别请求异常：${error.message}` : '识别请求异常，请手动填写',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const validateRecord = () => {
    if (meetingId === 'new') {
      if (!newMeeting.title.trim()) {
        return '请填写见面标题';
      }

      if (!newMeeting.city.trim()) {
        return '请填写见面城市';
      }

      if (!isValidDate(newMeeting.start_date) || !isValidDate(newMeeting.end_date)) {
        return '请填写有效的见面日期';
      }

      if (new Date(newMeeting.end_date) < new Date(newMeeting.start_date)) {
        return '结束日期不能早于开始日期';
      }
    }

    if (!isValidPrice(ticketDraft.price)) {
      return '请填写有效的票据价格';
    }

    if (ticketDraft.type === 'hotel' && ticketDraft.price_per_night && !isValidPrice(ticketDraft.price_per_night)) {
      return '请填写有效的每晚价格';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateRecord();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      let targetMeetingId = meetingId;

      if (meetingId === 'new') {
        const meetingResponse = await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newMeeting,
            notes: newMeeting.notes || null,
          }),
        });

        if (!meetingResponse.ok) {
          const errorData = (await meetingResponse.json().catch(() => null)) as { error?: string } | null;
          setMessage({ type: 'error', text: errorData?.error || '创建见面记录失败' });
          return;
        }

        const meeting = (await meetingResponse.json()) as { id: number };
        targetMeetingId = meeting.id;
      }

      const ticketResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: targetMeetingId,
          ...ticketDraftToPayload(ticketDraft),
        }),
      });

      if (!ticketResponse.ok) {
        const errorData = (await ticketResponse.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: 'error', text: errorData?.error || '保存票据失败' });
        return;
      }

      setMessage({ type: 'success', text: '保存成功！' });
      resetTicketState();
      setNewMeeting(EMPTY_MEETING_DRAFT);
      setMeetingId('new');
      setEntryMode('upload');
      await Promise.all([mutateMeetings(), mutateCache('/api/stats')]);
    } catch {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const shouldShowEditor =
    entryMode === 'manual' || result !== null || ticketDraft.screenshot_path !== '';

  return (
    <section
      id="record"
      className="min-h-screen bg-gradient-to-b from-journal-bg via-[#faf5ee] to-journal-bg px-5 py-20"
    >
      <div className="mx-auto max-w-journal">
        <h2 className="mb-7 text-center text-[22px] font-bold text-journal-text">
          <span className="border-b-2 border-journal-gold pb-1.5">✈️ 添加新记录</span>
        </h2>

        <div className="mb-5 rounded-2xl border border-journal-border bg-journal-paper p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('upload')}
              className={`rounded-[12px] px-4 py-3 text-sm font-semibold transition-all ${
                entryMode === 'upload'
                  ? 'bg-gradient-to-br from-journal-accent to-[#d4946e] text-white shadow-md'
                  : 'bg-[#faf5ee] text-journal-text hover:bg-[#f7efe3]'
              }`}
            >
              上传识别
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={`rounded-[12px] px-4 py-3 text-sm font-semibold transition-all ${
                entryMode === 'manual'
                  ? 'bg-gradient-to-br from-journal-accent to-[#d4946e] text-white shadow-md'
                  : 'bg-[#faf5ee] text-journal-text hover:bg-[#f7efe3]'
              }`}
            >
              手动录入
            </button>
          </div>
        </div>

        {entryMode === 'upload' && (
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
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUpload(file);
                }
              }}
            />
          </div>
        )}

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-center text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {shouldShowEditor && (
          <div className="mt-5 space-y-4">
            <TicketEditor
              value={ticketDraft}
              onChange={setTicketDraft}
              title={
                entryMode === 'manual'
                  ? '手动填写票据详情'
                  : result?.success
                    ? 'AI 已识别以下信息（可编辑修正）'
                    : '请补充票据详情'
              }
              travelerLabels={{
                a: `${settings.partner_a_name || '伴侣A'} 的票`,
                b: `${settings.partner_b_name || '伴侣B'} 的票`,
              }}
            >
              <div className="mt-4">
                <label className="mb-1 block text-[11px] text-journal-text-muted">归属见面</label>
                <select
                  value={meetingId}
                  onChange={(event) =>
                    setMeetingId(event.target.value === 'new' ? 'new' : Number(event.target.value))
                  }
                  className="w-full rounded-lg border border-journal-border bg-[#faf5ee] px-3 py-2.5 text-sm font-serif text-journal-text focus:border-journal-accent focus:outline-none"
                >
                  <option value="new">+ 新建见面记录</option>
                  {meetings.map((meeting, idx) => (
                    <option key={meeting.id} value={meeting.id}>
                      第{idx + 1}次 · {meeting.city} · {meeting.title}
                    </option>
                  ))}
                </select>
              </div>
            </TicketEditor>

            {meetingId === 'new' && (
              <MeetingEditor
                value={newMeeting}
                onChange={setNewMeeting}
                title="新建见面记录"
              />
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-[10px] bg-gradient-to-br from-journal-accent to-[#d4946e] py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '💾 保存到手帐'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
