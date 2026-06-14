import Link from "next/link";
export default function WhatsNewPage() {
  return (
    <main className="space-y-8 px-6 py-8">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
  <ol className="flex items-center gap-2">
    <li>
      <Link href="/help" className="hover:text-slate-900">
        Help Center
      </Link>
    </li>
    <li>/</li>
    <li className="font-medium text-slate-900">What's New</li>
  </ol>
</nav>
      <div>
        <p className="text-sm font-medium text-slate-500">What's New</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Latest updates
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Follow the latest Ser3bellum improvements, releases, and upcoming
          features.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">June 2026</p>

        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Version 1.0 — Initial Release
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-slate-900">Dashboard</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>✓ Operational dashboard</li>
              <li>✓ Customizable dashboard cards</li>
              <li>✓ Multi-company support</li>
              <li>✓ Date range selector</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Integrations</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>✓ Google Analytics support</li>
              <li>✓ Shopify support</li>
              <li>✓ Slack message preview</li>
              <li>✓ Integration settings page</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>✓ Secure authentication</li>
              <li>✓ Email verification</li>
              <li>✓ User settings</li>
              <li>✓ Billing portal access</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Coming Soon</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>→ AI-powered summaries</li>
              <li>→ Additional integrations</li>
              <li>→ Support ticket management</li>
              <li>→ Screenshot attachments for support requests</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}