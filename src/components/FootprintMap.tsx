'use client';

import dynamic from 'next/dynamic';
import { useMeetings } from '@/hooks/useMeetings';
import { useSettings } from '@/hooks/useSettings';
import EmptyState from './EmptyState';
import ScrollFadeIn from './ScrollFadeIn';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

export default function FootprintMap() {
  const { meetings, isLoading } = useMeetings();
  const { settings } = useSettings();

  return (
    <section
      id="map"
      className="min-h-screen bg-gradient-to-b from-journal-bg via-[#faf5ee] to-journal-bg px-5 py-20"
    >
      <div className="mx-auto max-w-journal">
        <h2 className="mb-7 text-center text-[22px] font-bold text-journal-text">
          <span className="border-b-2 border-journal-gold pb-1.5">🗺️ 我们的足迹</span>
        </h2>

        <ScrollFadeIn>
          <div className="overflow-hidden rounded-[14px] border border-journal-border bg-journal-paper shadow-sm">
            <div className="relative h-[320px]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-journal-text-muted">
                  加载中...
                </div>
              ) : meetings.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <EmptyState message="足迹地图等待你们的第一段旅程" />
                </div>
              ) : (
                <MapInner meetings={meetings} nextCity={settings.next_meeting_city} />
              )}
            </div>
            <div className="flex justify-center gap-4 border-t border-journal-bg px-6 py-3">
              <div className="flex items-center gap-1.5 text-xs text-journal-text-secondary">
                <div className="h-2.5 w-2.5 rounded-full bg-journal-accent" /> 已去过
              </div>
              <div className="flex items-center gap-1.5 text-xs text-journal-text-secondary">
                <div className="h-2.5 w-2.5 rounded-full bg-journal-gold" /> 即将前往
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-dashed border-journal-border pt-6 text-center">
            <div className="text-sm italic text-journal-text-muted">
              「 每一程奔赴，都是因为你 」
            </div>
            <div className="mt-2 text-xs text-journal-border">♥ Made with love ♥</div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
