// app/components/Card.tsx
import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode; // icons, kebab menu, etc.
};

export function Card({ title, subtitle, rightSlot, className = "", children, ...props }: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
        "p-5",
        className,
      ].join(" ")}
      {...props}
    >
      {(title || subtitle || rightSlot) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
