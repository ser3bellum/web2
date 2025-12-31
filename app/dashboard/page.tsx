function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Deployment baseline is up. Next: wire features back in.
          </p>
        </div>

        <div className="text-xs text-zinc-500">Last updated: just now</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Uptime" value="99.98%" sub="Last 7 days" />
        <MetricCard title="Downtime" value="7m" sub="Last 7 days" />
        <MetricCard title="Threats blocked" value="—" sub="Coming soon" />
        <MetricCard title="Active monitors" value="—" sub="Coming soon" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-white p-5">
          <div className="text-sm font-medium">Performance</div>
          <div className="mt-3 h-64 rounded-lg bg-zinc-50" />
          <div className="mt-2 text-xs text-zinc-500">Chart placeholder</div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm font-medium">Incidents</div>
          <div className="mt-3 space-y-2 text-sm text-zinc-600">
            <div className="rounded-lg bg-zinc-50 p-3">No incidents yet</div>
            <div className="rounded-lg bg-zinc-50 p-3">Connect integrations to populate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
