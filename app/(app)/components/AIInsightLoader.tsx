"use client";

import { useId } from "react";
import styles from "./AIInsightLoader.module.css";

export default function AIInsightLoader() {
  const id = useId().replace(/:/g, "");
  const glowId = `${id}-glow`;
  const coreId = `${id}-core`;

  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <svg
        className={styles.orb}
        viewBox="0 0 320 280"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={glowId}>
            <stop stopColor="#FFFFFF" stopOpacity=".95" />
            <stop offset=".18" stopColor="#F5CEFF" stopOpacity=".8" />
            <stop offset=".48" stopColor="#A477FF" stopOpacity=".35" />
            <stop offset="1" stopColor="#7960FF" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={coreId}>
            <stop stopColor="#FFFFFF" />
            <stop offset=".3" stopColor="#FFF0FF" />
            <stop offset=".65" stopColor="#E2B3FF" stopOpacity=".8" />
            <stop offset="1" stopColor="#C084FC" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          className={styles.halo}
          cx="160"
          cy="140"
          r="116"
          fill={`url(#${glowId})`}
        />

        <g className={styles.field}>
          {Array.from({ length: 9 }, (_, index) => (
            <g key={index} transform={`rotate(${index * 20} 160 140)`}>
              <ellipse
                className={styles.filament}
                cx="160"
                cy="140"
                rx={82 + (index % 3) * 5}
                ry={30 + (index % 4) * 7}
                stroke={
                  ["#FFFFFF", "#DDD2FF", "#A78BFA", "#F5C8FF"][index % 4]
                }
                strokeWidth={index % 3 === 0 ? 1.5 : 0.8}
                style={{ animationDelay: `${index * -0.7}s` }}
              />
            </g>
          ))}
        </g>

        <g className={styles.particles}>
          {Array.from({ length: 18 }, (_, index) => {
            const angle = (index * Math.PI * 2) / 18;
            const radius = 92 + (index % 4) * 9;

            return (
              <circle
                key={index}
                className={styles.particle}
                cx={160 + Math.cos(angle) * radius}
                cy={140 + Math.sin(angle) * radius * 0.85}
                r={index % 3 === 0 ? 1.8 : 1}
                fill="#FFFFFF"
                style={{ animationDelay: `${index * -0.3}s` }}
              />
            );
          })}
        </g>

        <circle
          className={styles.core}
          cx="160"
          cy="140"
          r="38"
          fill={`url(#${coreId})`}
        />
        <circle cx="160" cy="140" r="5" fill="white" />
      </svg>

      <div className={styles.copy}>
        <p className={styles.title}>Preparing your business insights…</p>
        <p className={styles.subtitle}>
          Connecting the dots across your business
        </p>
      </div>

      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}