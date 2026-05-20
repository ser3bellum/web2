export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-3xl">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-slate-900">
          Workspace activated
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Your subscription is now active.
          <br />
          Please verify your email address to secure your workspace.
        </p>

        <div className="mt-8 space-y-3">
          <a
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Go to login
          </a>

          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Resend verification email
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          If you don’t see the email, check your spam folder.
        </p>
      </div>
    </main>
  );
}