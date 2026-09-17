'use client';

import type { AuthUser } from '@/types';
import FootprintMap from '@/components/FootprintMap';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import RecordForm from '@/components/RecordForm';
import Stats from '@/components/Stats';
import Timeline from '@/components/Timeline';

export default function AppShell({ user }: { user: AuthUser }) {
  return (
    <>
      <Navbar user={user} />
      <main className="pt-[84px] sm:pt-[92px]">
        <Hero />
        <Timeline />
        <RecordForm />
        <Stats />
        <FootprintMap />
      </main>
    </>
  );
}
