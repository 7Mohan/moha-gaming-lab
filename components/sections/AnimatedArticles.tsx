"use client";
import * as React from "react";
import Link from "next/link";

const ARTICLES = [
  { id:"a1", category:"Guide", color:"#00E5A0", title:"How to Fix FPS Drops in PUBG Mobile on Mid-Range Devices", excerpt:"Thermal throttling is the #1 cause of mid-session FPS drops. Here is how to diagnose it and extend your stable performance window.", readTime:"6 min read", href:"/guides/optimize-pubg-mobile-android", icon:"🎯" },
  { id:"a2", category:"Performance", color:"#3B82F6", title:"eFootball 2024 Android: Smooth 60 FPS on Any Device", excerpt:"eFootball is surprisingly GPU-light but CPU-sensitive. Learn which settings matter and how server selection affects gameplay.", readTime:"5 min read", href:"/guides/improve-fps-android", icon:"⚽" },
  { id:"a3", category:"Network", color:"#F59E0B", title:"Reduce Ping to Under 20ms in Mobile Games", excerpt:"Ping is not just about speed — consistency matters. We cover ISP routing, server selection, and Wi-Fi settings most players ignore.", readTime:"7 min read", href:"/guides/reduce-ping-mobile-games", icon:"📡" },
  { id:"a4", category:"Deep Dive", color:"#8B5CF6", title:"Snapdragon vs Dimensity: Which SoC Wins at Gaming in 2025?", excerpt:"A technical breakdown of gaming performance, GPU drivers, and thermal management across both chipset families.", readTime:"10 min read", href:"/guides/android-soc-gaming-performance", icon:"🔬" },
  { id:"a5", category:"Tool", color:"#EC4899", title:"Using the FPS Calculator: Find Your Device Real Performance Ceiling", excerpt:"The FPS cap you see in settings is not always achievable. Our calculator shows the sustained ceiling based on your SoC and thermal profile.", readTime:"3 min read", href:"/tools", icon:"📊" },
  { id:"a6", category:"Tips", color:"#06B6D4", title:"Touch Latency: Why Your 120Hz Phone Still Feels Laggy", excerpt:"High refresh rates help, but touch sampling rate and display overlays can negate all of that. Here is the full picture.", readTime:"5 min read", href:"/guides/improve-fps-android", icon:"👆" },
] as const;

// Generic so any RefObject<T extends Element | null> is accepted without casting
function useInView<T extends Element>(ref: React.RefObject<T | null>, threshold = 0.12): boolean {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function ArticleCard({ article, index }: { article: (typeof ARTICLES)[number]; index: number }) {
  // ref on a div wrapper — keeps the Link clean and avoids ref-forwarding issues
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const visible = useInView(wrapRef, 0.1);
  const delay = index * 90;

  return (
    <div
      ref={wrapRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <Link
        href={article.href}
        id={`article-card-${article.id}`}
        className="group relative flex flex-col gap-3 p-5 rounded-lg border border-border-default bg-bg-surface overflow-hidden no-underline"
        style={{ display:"flex", flexDirection:"column", gap:12, textDecoration:"none",
          transition:"border-color .2s, background .2s, box-shadow .2s" }}
      >
        <style>{`
          #article-card-${article.id}:hover{border-color:var(--border-strong)!important;background:var(--bg-elevated)!important;box-shadow:0 8px 32px rgba(0,0,0,.18);transform:translateY(-3px);}
          #article-card-${article.id}:hover .ac-arrow-${article.id}{opacity:1;transform:translate(2px,-2px);}
          #article-card-${article.id}:hover .ac-glow-${article.id}{opacity:1;}
          .ac-arrow-${article.id}{transition:opacity .2s,transform .2s;opacity:0;}
          .ac-glow-${article.id}{transition:opacity .4s;opacity:0;}
        `}</style>

        <div className={`ac-glow-${article.id} pointer-events-none absolute inset-0`}
          style={{ background:`radial-gradient(ellipse 80% 60% at 50% 100%,${article.color}10 0%,transparent 70%)` }}
          aria-hidden="true" />

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded"
            style={{ background:`${article.color}18`, color:article.color, border:`1px solid ${article.color}35` }}>
            {article.category}
          </span>
          <span className="text-xl" aria-hidden="true">{article.icon}</span>
        </div>

        <h3 className="text-[15px] font-bold leading-snug text-text-primary m-0 flex-1">{article.title}</h3>
        <p className="text-[13px] leading-relaxed text-text-secondary m-0">{article.excerpt}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <span className="text-[11px] font-mono text-text-muted">{article.readTime}</span>
          <span className={`ac-arrow-${article.id} text-sm font-bold`} style={{ color:article.color }} aria-hidden="true">↗</span>
        </div>
      </Link>
    </div>
  );
}

export function AnimatedArticles() {
  const hRef = React.useRef<HTMLDivElement>(null);
  const hVisible = useInView(hRef, 0.2);

  return (
    <section aria-labelledby="articles-heading" className="section border-b border-border-subtle bg-bg-surface">
      <div className="container-content">
        <div
          ref={hRef}
          className="flex items-end justify-between mb-10"
          style={{ opacity:hVisible?1:0, transform:hVisible?"translateY(0)":"translateY(20px)", transition:"opacity .5s ease,transform .5s ease" }}
        >
          <div className="flex flex-col gap-2">
            <span className="label-mono">Latest Articles</span>
            <h2 id="articles-heading" className="text-2xl font-bold text-text-primary">Gaming Performance Insights</h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-[44ch]">
              Technical guides, deep dives, and optimization tips from real Android hardware testing.
            </p>
          </div>
          <Link href="/guides" className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded">
            All articles <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
          {ARTICLES.map((a, i) => (
            <li key={a.id}>
              <ArticleCard article={a} index={i} />
            </li>
          ))}
        </ul>

        <div className="mt-7 flex sm:hidden justify-center">
          <Link href="/guides" className="text-sm text-text-secondary hover:text-accent transition-colors">
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  );
}
