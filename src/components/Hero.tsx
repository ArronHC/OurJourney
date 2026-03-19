'use client';

import { useSettings } from '@/hooks/useSettings';

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export default function Hero() {
  const { settings } = useSettings();
  const today = new Date().toISOString().split('T')[0];

  const daysInLove = settings.relationship_start_date
    ? daysBetween(settings.relationship_start_date, today)
    : 0;

  const daysUntilNext = settings.next_meeting_date
    ? daysBetween(today, settings.next_meeting_date)
    : null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-journal-paper via-[#faf5ee] to-journal-bg"
    >
      <div className="mx-auto max-w-journal px-5 py-20 text-center">
        <div className="mb-4 inline-block rounded-full border-[1.5px] border-journal-gold px-5 py-1.5 text-xs tracking-[5px] text-journal-text-muted">
          OUR JOURNEY
        </div>

        <h1 className="my-2 text-4xl font-bold text-journal-text">
          {settings.partner_city_a || '城市A'} ↔ {settings.partner_city_b || '城市B'}
        </h1>

        <p className="text-base text-journal-text-secondary">
          在一起的第{' '}
          <span className="px-1 text-5xl font-bold text-journal-accent">
            {daysInLove || '?'}
          </span>{' '}
          天
        </p>

        <div className="mx-auto my-6 h-0.5 w-[60px] bg-journal-gold" />

        {daysUntilNext !== null && (
          <div className="relative inline-block -rotate-1 rounded-xl border border-journal-border bg-white px-9 py-5 shadow-md transition-all hover:-translate-y-0.5 hover:rotate-0">
            <div className="absolute left-1/2 top-[-7px] h-4 w-[72px] -translate-x-1/2 rotate-2 rounded-sm bg-green-200/50" />
            <div className="text-xs text-journal-text-muted">下次见面还有</div>
            <div className="my-1 text-[42px] font-bold leading-tight text-journal-accent">
              {daysUntilNext > 0 ? daysUntilNext : 0} 天
            </div>
            <div className="text-xs text-journal-text-secondary">
              {settings.next_meeting_date} · {settings.next_meeting_city || ''}
            </div>
          </div>
        )}

        <div className="mx-auto mt-9 grid max-w-[480px] grid-cols-4 gap-3">
          {[
            { icon: '📖', label: '时间线', id: 'timeline' },
            { icon: '✈️', label: '新记录', id: 'record' },
            { icon: '📊', label: '统计', id: 'stats' },
            { icon: '🗺️', label: '足迹', id: 'map' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="rounded-xl border-[1.5px] border-journal-border bg-white px-2 py-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-1.5 text-2xl">{item.icon}</div>
              <div className="text-sm font-semibold text-journal-text">{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
