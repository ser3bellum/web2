"use client";

import { cn } from "app/(app)/lib/cn";

function normalize(values: number[]) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	return values.map((v) => (v - min) / range);
}

export function Sparkline({
	data,
	width = 120,
	height = 36,
	strokeWidth = 2,
	className,
}: {
	data: number[];
	width?: number;
	height?: number;
	strokeWidth?: number;
	className?: string;
}) {
	const n = data.length;
	if (n < 2) return null;

	const norm = normalize(data);
	const points = norm.map((v, i) => {
		const x = (i / (n - 1)) * width;
		const y = (1 - v) * (height - strokeWidth) + strokeWidth / 2;
		return `${x},${y}`;
	});

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			className={cn("opacity-70", className)}
			aria-hidden="true"
		>
			<polyline
				points={points.join(" ")}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
