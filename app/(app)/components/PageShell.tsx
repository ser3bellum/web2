// app/(app)/components/PageShell.tsx
import type { ReactNode } from "react";

type PageShellProps = {
	children: ReactNode;
	className?: string;
	contained?: boolean;
};

export default function PageShell({
	children,
	className = "",
	contained = false,
}: PageShellProps) {
	return (
		<div
			className={
				contained ? `mx-auto w-full max-w-[1200px] ${className}` : className
			}
		>
			{children}
		</div>
	);
}
