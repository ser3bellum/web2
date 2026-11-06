"use client";

import { useEffect, useRef } from "react";
import styles from "./AnalyticsLoader.module.css";

type AnalyticsLoaderProps = {
  tone?: "muted" | "gradient";
  phrase?: string;
  subLabel?: string;
};

export function AnalyticsLoader({
  tone = "gradient",
  phrase = "connecting the dots",
  subLabel = "Loading analytics...",
}: AnalyticsLoaderProps) {
  const phraseRef = useRef<HTMLSpanElement | null>(null);
  const dot1Ref = useRef<HTMLSpanElement | null>(null);
  const dot2Ref = useRef<HTMLSpanElement | null>(null);
  const dot3Ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const phraseEl = phraseRef.current;
    const dots = [dot1Ref.current, dot2Ref.current, dot3Ref.current].filter(
      Boolean
    ) as HTMLSpanElement[];

    if (!phraseEl || dots.length !== 3) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
    const clamp = (p: number) => Math.max(0, Math.min(1, p));

    let raf = 0;

    const cycle = 5000;
    const delay = 0.108;
    const travel = 0.53;
    const settle = 0.19;

    const placeReducedMotionDots = () => {
      const width = phraseEl.getBoundingClientRect().width;
      dots.forEach((dot, i) => {
        const finalX = width + 8 + i * 14;
        const finalY = 8;
        dot.style.opacity = "1";
        dot.style.transform = `translate(${finalX}px, ${finalY}px)`;
      });
    };

    const frame = (time: number) => {
      const width = phraseEl.getBoundingClientRect().width;
      const q = (time % cycle) / cycle;

      dots.forEach((dot, i) => {
        const start = i * delay;
        const end = start + travel;
        const finish = end + settle;

        const finalX = width + 8 + i * 14;
        let x = 0;
        let y = -10;
        let scale = 1;
        let opacity = 1;

        if (q < start) {
          opacity = 0;
        } else if (q < end) {
          const p = (q - start) / travel;

          // horizontal travel along the phrase
          x = (width - 12) * p;

          // repeated bounce motion with decreasing height
          const phase = p * 4.1;
          const bounce = phase % 1;
          const bounceIndex = Math.floor(phase);
          const amplitude = 34 * (1 - 0.22 * bounceIndex);

          // tennis-ball arc
          y = -10 - amplitude * 4 * bounce * (1 - bounce);

          // tiny squash near impact
          scale = bounce < 0.04 ? 0.9 : 1;
        } else if (q < finish) {
          const p = (q - end) / settle;

          // smooth roll into final ellipsis position
          x = (width - 12) + (finalX - (width - 12)) * easeOutCubic(p);

          // softer final landing with a tiny micro-bounce
          const normalized = clamp(p / 0.55);
          const microBounce =
            p < 0.55 ? 8 * 4 * normalized * (1 - normalized) : 0;

          y = -10 + 18 * easeOutCubic(p) - microBounce;
          scale = 1 - 0.08 * Math.sin(Math.PI * clamp(p));
        } else {
          x = finalX;
          y = 8;
          scale = 1;
        }

        dot.style.opacity = String(opacity);
        dot.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      });

      raf = window.requestAnimationFrame(frame);
    };

    if (reducedMotion) {
      placeReducedMotionDots();
    } else {
      raf = window.requestAnimationFrame(frame);
    }

    const handleResize = () => {
      if (reducedMotion) placeReducedMotionDots();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`${styles.container} ${
        tone === "muted" ? styles.muted : styles.gradient
      }`}
      role="status"
      aria-label={subLabel}
    >
      <div className={styles.loaderWrap}>
        <div className={styles.textLine} aria-hidden="true">
          <span ref={phraseRef} className={styles.phrase}>
            {phrase}
          </span>

          <span className={styles.tailSpace} />

          <span ref={dot1Ref} className={`${styles.dot} ${styles.dot1}`} />
          <span ref={dot2Ref} className={`${styles.dot} ${styles.dot2}`} />
          <span ref={dot3Ref} className={`${styles.dot} ${styles.dot3}`} />
        </div>

      </div>
    </div>
  );
}