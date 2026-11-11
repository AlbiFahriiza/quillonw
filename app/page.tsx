import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatIsQuillon } from "@/components/what-is-quillon";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <WhatIsQuillon />
      </main>
      <SiteFooter />
    </>
  );
}
