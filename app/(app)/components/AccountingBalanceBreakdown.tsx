type AccountingBalanceBreakdownProps = {
  availableBalance: number;
  pendingBalance: number;
  fees: number;
  net: number;
  currency: string;
};

function formatCurrency(amount: number, currency: string) {
  const safeCurrency =
    typeof currency === "string" && currency.trim().length === 3
      ? currency.toUpperCase()
      : "EUR";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountingBalanceBreakdown({
  availableBalance,
  pendingBalance,
  fees,
  net,
  currency,
}: AccountingBalanceBreakdownProps) {
  const totalBalance = availableBalance + pendingBalance;
  const safeTotal = totalBalance > 0 ? totalBalance : 1;

  const pendingPct = Math.max(0, Math.min(100, (pendingBalance / safeTotal) * 100));
  const availablePct = Math.max(0, Math.min(100, (availableBalance / safeTotal) * 100));

  return (
    <div className="mt-4 space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Balance composition</span>
          <span>{formatCurrency(totalBalance, currency)}</span>
        </div>

        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-indigo-400"
            style={{ width: `${pendingPct}%` }}
            title="Pending"
          />
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${availablePct}%` }}
            title="Available"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Pending</div>
          <div className="mt-1 font-semibold text-slate-900">
            {formatCurrency(pendingBalance, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Available</div>
          <div className="mt-1 font-semibold text-slate-900">
            {formatCurrency(availableBalance, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Net</div>
          <div className="mt-1 font-semibold text-slate-900">
            {formatCurrency(net, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Fees</div>
          <div className="mt-1 font-semibold text-slate-900">
            {formatCurrency(fees, currency)}
          </div>
        </div>
      </div>
    </div>
  );
}