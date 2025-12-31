import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/uptime", label: "Uptime" },
  { href: "/threats", label: "Threats" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-6">
        <div className="text-xl font-semibold">Ser3bellum</div>
        <div className="mt-1 text-sm text-zinc-500">Web Monitoring</div>
      </div>

      <nav className="px-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
