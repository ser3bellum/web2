"use client";

import { AnalyticsMiniChart } from "app/(app)/components/AnalyticsMiniChart";
import { Card } from "app/(app)/components/Card"; // adjust if your Card export differs
import { DASHBOARD_CARDS } from "app/(app)/components/DashboardCards";
import { SortableDashboardGrid } from "app/(app)/components/SortableDashboardGrid";

// If renderIconSafe is in the page file, you have 2 options:
// 1) move it here, or
// 2) temporarily remove rightSlot until we wire it cleanly.
function renderIconSafe(icon: any) {
	if (!icon) return null;
	return icon;
}

export default function DashboardCardsGrid() {
	return (
		<section>
			<SortableDashboardGrid
				defs={DASHBOARD_CARDS}
				renderCard={(c) => (
					<Card
						key={c.id}
						title={c.title}
						subtitle={c.subtitle}
						rightSlot={renderIconSafe((c as any).icon)}
						className="h-[408px]" // your standard interactive height
					>
						{c.id === "analytics" ? (
							<AnalyticsMiniChart />
						) : (
							<div className="text-sm opacity-70">
								{(c as any).description ?? "Content coming next step…"}
							</div>
						)}
					</Card>
				)}
			/>
		</section>
	);
}
