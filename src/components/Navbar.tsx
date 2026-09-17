'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from '@/types';
import SettingsPanel from './SettingsPanel';

const NAV_ITEMS = [
  { id: 'hero', label: '封面' },
  { id: 'timeline', label: '时间线' },
  { id: 'record', label: '新记录' },
  { id: 'stats', label: '统计' },
  { id: 'map', label: '足迹' },
];

export default function Navbar({ user }: { user: AuthUser }) {
  const [active, setActive] = useState('hero');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCompactControls, setShowCompactControls] = useState(false);

  useEffect(() => {
    const compactThreshold = 96;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      setShowCompactControls(nextScrollY > compactThreshold);

      const sections = NAV_ITEMS.map((item) => ({
        id: item.id,
        el: document.getElementById(item.id),
      }));

      for (const section of sections.reverse()) {
        if (section.el && nextScrollY >= section.el.offsetTop - 100) {
          setActive(section.id);
          break;
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-50">
        {!showCompactControls ? (
          <div className="mx-auto max-w-[1120px] px-3 pt-3">
            <div className="pointer-events-auto rounded-[28px] border border-journal-border bg-journal-paper/88 px-2 py-2 shadow-[0_14px_40px_rgba(84,58,34,0.12)] backdrop-blur-xl">
              <div className="-mx-1 flex min-w-0 items-center justify-start overflow-x-auto px-1 sm:justify-center">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`shrink-0 border-b-2 px-4 py-3 text-sm tracking-wider transition-colors duration-200 sm:px-5 lg:px-6 ${
                      active === item.id
                        ? 'border-journal-accent font-semibold text-journal-accent'
                        : 'border-transparent text-journal-text-secondary hover:bg-journal-gold/5 hover:text-journal-text'
                    }`}
                    aria-current={active === item.id ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between px-4 pt-4 sm:px-6">
            <div className="pointer-events-auto rounded-full border border-journal-border bg-white/92 px-3 py-2 text-xs text-journal-text-secondary shadow-[0_10px_28px_rgba(84,58,34,0.14)] backdrop-blur-md">
              <span className="block max-w-[42vw] truncate">{user.display_name}</span>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="pointer-events-auto rounded-full border border-journal-border bg-white/92 px-3 py-2 text-lg text-journal-text-secondary shadow-[0_10px_28px_rgba(84,58,34,0.14)] backdrop-blur-md transition-colors duration-200 hover:border-journal-border hover:bg-journal-gold/10 hover:text-journal-accent"
              aria-label="打开设置"
            >
              ⚙️
            </button>
          </div>
        )}
      </nav>
      <SettingsPanel user={user} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
