"use client";

import { useCallback, useEffect, useRef } from "react";

export function AutoPrint({
  ready,
  enabled = true,
}: {
  ready: boolean;
  enabled?: boolean;
}) {
  const hasPrintedRef = useRef(false);

  const openPrintDialog = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (!ready || !enabled || hasPrintedRef.current) {
      return;
    }

    let cancelled = false;

    async function printWhenSettled() {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 300);
      });

      if (cancelled) return;

      hasPrintedRef.current = true;
      openPrintDialog();
    }

    void printWhenSettled();

    return () => {
      cancelled = true;
    };
  }, [enabled, openPrintDialog, ready]);

  return (
    <div className="no-print fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={openPrintDialog}
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
      >
        Print report
      </button>
    </div>
  );
}