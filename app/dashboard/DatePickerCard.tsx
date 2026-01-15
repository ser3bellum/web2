"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/app/components/Card";
import { toISODate } from "@/lib/dateRange";

type Props = { from: Date; to: Date };

export function DatePickerCard({ from, to }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const fromStr = toISODate(from);
  const toStr = toISODate(to);

  function setParamRange(nextFrom: string, nextTo: string) {
    if (!nextFrom || !nextTo) return;

    const next = new URLSearchParams(params.toString());
    next.set("from", nextFrom);
    next.set("to", nextTo);

    // replace avoids polluting browser history on every date change
    router.replace(`?${next.toString()}`);
  }

  return (
    <Card title="Date range" subtitle="Applies to all dashboard cards">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs opacity-70">From</label>
          <input
            type="date"
            value={fromStr}
            max={toStr}
            onChange={(e) => setParamRange(e.target.value, toStr)}
            className="h-10 rounded-md border px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs opacity-70">To</label>
          <input
            type="date"
            value={toStr}
            min={fromStr}
            onChange={(e) => setParamRange(fromStr, e.target.value)}
            className="h-10 rounded-md border px-3 text-sm"
          />
        </div>
      </div>
    </Card>
  );
}
