'use client';

import FootprintMap from '@/components/FootprintMap';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import RecordForm from '@/components/RecordForm';
import Stats from '@/components/Stats';
import Timeline from '@/components/Timeline';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[52px]">
        <Hero />
        <Timeline />
        <RecordForm />
        <Stats />
        <FootprintMap />
      </main>
    </>
  );
}
