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

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map((item) => ({
        id: item.id,
        el: document.getElementById(item.id),
      }));

      for (const section of sections.reverse()) {
        if (section.el && window.scrollY >= section.el.offsetTop - 100) {
          setActive(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-journal-border bg-journal-paper/90 shadow-sm backdrop-blur-md">
        <div className="relative flex justify-center">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-journal-border bg-white px-3 py-1.5 text-xs text-journal-text-secondary">
            {user.display_name}
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-lg text-journal-text-secondary transition-all hover:bg-journal-gold/10 hover:text-journal-accent"
            aria-label="打开设置"
          >
            ⚙️
          </button>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`border-b-2 px-6 py-3.5 text-sm tracking-wider transition-all ${
              active === item.id
                ? 'border-journal-accent font-semibold text-journal-accent'
                : 'border-transparent text-journal-text-secondary hover:bg-journal-gold/5 hover:text-journal-text'
            }`}
          >
            {item.label}
          </button>
        ))}
        </div>
      </nav>
      <SettingsPanel user={user} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
