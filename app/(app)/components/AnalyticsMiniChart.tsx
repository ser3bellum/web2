"use client";

import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { cn } from "@/app/(app)/lib/cn";

type RangeKey = "7d" | "30d" | "90d";

type Point = {
	t: number;
	label: string;
	value: number;
};

function formatDayLabel(ts: number) {
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
	}).format(ts);
}

function generateSeries(days: number): Point[] {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const base = 850;
	const seed = now.getTime() / 86400000;
	const points: Point[] = [];

	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(now.getDate() - i);
		const t = d.getTime();

		const wobble =
			Math.sin((seed + i) * 0.9) * 90 + Math.cos((seed + i) * 0.35) * 55;
		const trend = days >= 30 ? (days - i) * 1.2 : (days - i) * 0.6;
		const weekendDip = [0, 6].includes(d.getDay()) ? -120 : 0;

		const value = Math.max(120, Math.round(base + wobble + trend + weekendDip));
		points.push({ t, label: formatDayLabel(t), value });
	}

	return points;
}

function niceNumber(n: number) {
	return new Intl.NumberFormat("en-GB").format(n);
}

export function AnalyticsMiniChart({ className }: { className?: string }) {
	const [range, setRange] = useState<RangeKey>("30d");
	const [hover, setHover] = useState<Point | null>(null);

	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
	const data = useMemo(() => generateSeries(days), [days]);

	const total = useMemo(() => data.reduce((a, p) => a + p.value, 0), [data]);
	const avg = useMemo(() => Math.round(total / data.length), [total, data.length]);
	const peak = useMemo(() => Math.max(...data.map((p) => p.value)), [data]);

	const liveValue = hover?.value ?? data[data.length - 1]?.value ?? 0;
	const liveLabel = hover?.label ?? "Today";

	return (
		<div className={cn("flex h-full min-w-0 flex-col overflow-hidden", className)}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="text-xs uppercase tracking-wide text-zinc-500">
						Visits
					</div>

					<div className="mt-1 flex items-baseline gap-2">
						<div className="text-2xl font-semibold text-zinc-900">
							{niceNumber(liveValue)}
						</div>
						<div className="text-sm text-zinc-500">{liveLabel}</div>
					</div>

					<div className="mt-1 text-xs text-zinc-500">
						Avg/day {niceNumber(avg)} • Peak {niceNumber(peak)}
					</div>
				</div>

				<div className="flex gap-1 rounded-lg border border-black/10 bg-white/60 p-1">
					{(["7d", "30d", "90d"] as RangeKey[]).map((k) => (
						<button
							type="button"
							key={k}
							onClick={() => setRange(k)}
							className={cn(
								"h-8 rounded-md px-2 text-xs transition-colors",
								range === k
									? "bg-white text-zinc-900 shadow-sm"
									: "text-zinc-600 hover:bg-white/70",
							)}
						>
							{k}
						</button>
					))}
				</div>
			</div>

			<div className="mt-3 h-[190px] min-w-0 overflow-hidden rounded-xl">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={data}
						margin={{ top: 8, right: 0, left: -8, bottom: 0 }}
						onMouseMove={(state: unknown) => {
							const s = state as
								| { activePayload?: Array<{ payload?: Point }> }
								| null;
							const p = s?.activePayload?.[0]?.payload;
							if (p) setHover(p);
						}}
						onMouseLeave={() => setHover(null)}
					>
						<defs>
						<linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
  							<stop offset="0%" stopColor="#416bd7" stopOpacity={0.35} />
 							 <stop offset="60%" stopColor="#416bd7" stopOpacity={0.15} />
 							 <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
						</linearGradient>
						</defs>

						<XAxis
							dataKey="label"
							tick={{ fontSize: 11 }}
							tickLine={false}
							axisLine={false}
							interval={Math.max(0, Math.floor(data.length / 6))}
							minTickGap={24}
						/>
						<YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
						<Tooltip content={<TooltipBox />} cursor={{ stroke:"#416bd7" }} />
						<Area
						type="monotone"
						dataKey="value"
						stroke="#416bd7"
						fill="url(#analyticsGradient)"
						strokeWidth={2}
						dot={false}
						activeDot={{ r: 4 }}
						className="text-zinc-900"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

type TooltipPayloadItem = { payload?: Point };
type TooltipProps = { active?: boolean; payload?: TooltipPayloadItem[] };

function TooltipBox({ active, payload }: TooltipProps) {
	if (!active || !payload?.length) return null;
	const p = payload[0]?.payload;
	if (!p) return null;

	return (
		<div className="rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-xs shadow-sm">
			<div className="font-medium text-zinc-900">{p.label}</div>
			<div className="text-zinc-600">
				Visits: {new Intl.NumberFormat("en-GB").format(p.value)}
			</div>
		</div>
	);
}