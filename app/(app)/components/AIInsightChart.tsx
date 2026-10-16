"use client";

import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export type AIInsightTrendPoint = {
	label: string;
	value: number;
};

type AIInsightChartProps = {
	data?: AIInsightTrendPoint[];
	metric?: string;
};

const demoData: AIInsightTrendPoint[] = [
	{ label: "Sep 1", value: 64 },
	{ label: "Sep 5", value: 69 },
	{ label: "Sep 9", value: 66 },
	{ label: "Sep 13", value: 73 },
	{ label: "Sep 17", value: 71 },
	{ label: "Sep 21", value: 62 },
	{ label: "Sep 25", value: 58 },
	{ label: "Sep 30", value: 56 },
];

export function AIInsightChart({
	data = demoData,
	metric = "Conversions",
}: AIInsightChartProps) {
	return (
		<div className="h-[185px] w-full rounded-2xl border border-white/15 bg-white/[0.08] px-2 pb-2 pt-4">
			<div className="mb-2 flex items-center justify-between px-3">
				<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
					{metric}
				</p>

				<p className="text-[11px] text-white/55">
					Selected period
				</p>
			</div>

			<div className="h-[135px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={data}
						margin={{
							top: 8,
							right: 8,
							left: 0,
							bottom: 0,
						}}
					>
						<defs>
							<linearGradient
								id="aiInsightArea"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="rgba(255,255,255,0.42)"
								/>
								<stop
									offset="95%"
									stopColor="rgba(255,255,255,0)"
								/>
							</linearGradient>
						</defs>

						<XAxis
							dataKey="label"
							axisLine={false}
							tickLine={false}
							minTickGap={28}
							tick={{
								fill: "rgba(255,255,255,0.55)",
								fontSize: 10,
							}}
						/>

						<YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />

						<Tooltip
							cursor={{
								stroke: "rgba(255,255,255,0.18)",
								strokeDasharray: "4 4",
							}}
							contentStyle={{
								background: "rgba(65, 48, 105, 0.92)",
								border: "1px solid rgba(255,255,255,0.14)",
								borderRadius: "10px",
								color: "#fff",
								fontSize: "12px",
							}}
							labelStyle={{
								color: "rgba(255,255,255,0.65)",
							}}
						/>

						<Area
							type="monotone"
							dataKey="value"
							stroke="rgba(255,255,255,0.92)"
							strokeWidth={2.25}
							fill="url(#aiInsightArea)"
							activeDot={{
								r: 4,
								fill: "#fff",
								strokeWidth: 0,
							}}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}