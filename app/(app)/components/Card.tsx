// app/components/Card.tsx
import type * as React from "react";

type SourceBadge = {
	label: string;
	variant?: "default" | "success" | "warning" | "danger";
};

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
	title?: string;
	subtitle?: string;
	subtitleVariant?: "default" | "muted" | "inverse" | "kpi";
	rightSlot?: React.ReactNode;
	sources?: SourceBadge[]; // connector/provider badges
	updatedLabel?: string;
};

const badgeVariants: Record<
	NonNullable<SourceBadge["variant"]>,
	string
> = {
	default:
		
  		"border-emerald-200 bg-emerald-50 text-emerald-700",
	success:
		"border-emerald-200 bg-emerald-50 text-emerald-700",
	warning:
		"border-amber-200 bg-amber-50 text-amber-700",
	danger:
		"border-rose-200 bg-rose-50 text-rose-700",
};

export function Card({
	title,
	subtitle,
	subtitleVariant = "default",
	rightSlot,
	sources,
	updatedLabel,
	className = "",
	children,
	...props
}: CardProps) {
	const subtitleClass =
  subtitleVariant === "inverse"
    ? "text-white/70"
    : subtitleVariant === "muted"
      ? "text-slate-300"
      : subtitleVariant === "kpi"
        ? "text-[14px] font-medium leading-4 text-slate-400"
        : "text-[#8A96AB]";
	return (
		<section
			className={[
				"rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
				"p-5",
				className,
			].join(" ")}
			{...props}
		>
			{(title || subtitle || rightSlot || updatedLabel || sources?.length) && (
				<header className="mb-3 flex items-start justify-between gap-3">
					<div className="min-w-0">
						{title && (
  				<h3 className="text-lg leading-6 text-slate-900">
   				 {title}
 				 </h3>
				)}

			{sources && sources.length > 0 && (
  				<div className="mt-3 mb-2 flex flex-wrap items-center gap-2">
   				 <span className="text-xs font-medium text-slate-400">
      			Source
    			</span>

    			{sources.map((source) => (
      			<span
        		key={source.label}
       			className={[
          		"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          		badgeVariants[source.variant ?? "default"],
       		 	].join(" ")}
      			>
       		{source.label}
      		</span>
    		))}
  		</div>
			)}

		{subtitle && (
  		<p className={`mt-1 max-w-[260px] whitespace-nowrap text-[10px] leading-3 ${subtitleClass}`}>
    	{subtitle}
  		</p>
			)}
					</div>

					{(updatedLabel || rightSlot) ? (
	<div className="flex shrink-0 items-start gap-3">
		{updatedLabel ? (
			<span className="mr-8 whitespace-nowrap pt-1 text-right text-[10px] font-small italic text-emerald-500">
				{updatedLabel}
			</span>
		) : null}

		{rightSlot ? <div>{rightSlot}</div> : null}
	</div>
) : null}
				</header>
			)}

			{children}
		</section>
	);
}
