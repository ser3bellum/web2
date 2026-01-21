"use client";

import { cn } from "@/app/(app)/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = { label: string; href: string; icon: React.ReactNode };

/**
 * Glass system
 * - Hover is more obvious
 * - Active uses brand blue as accent (not full fill)
 */
const glassBase =
  "w-full rounded-xl px-3 py-2.5 flex items-center gap-3 " +
  "border border-white/25 bg-white/10 backdrop-blur-xl " +
  "ring-1 ring-white/10 shadow-sm transition-colors";

const glassHover = "hover:bg-white/22 hover:border-white/45 hover:shadow-md";

const glassActive = "bg-white/18 border-blue-400/35 ring-1 ring-blue-500/20";

export function Sidebar() {
  const pathname = usePathname();

  const [appsOpen, setAppsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const connectedApps = useMemo(
    () => ["App 1", "App 2", "App 3", "App 4", "App 5"],
    []
  );
  const [activeApp, setActiveApp] = useState<string | null>("App 1");

  // ✅ Refresh Data removed from nav links (it is an action, not routing)
  const appLinks: NavItem[] = useMemo(
    () => [
      { label: "Analytics", href: "/analytics", icon: <AnalyticsIcon /> },
      { label: "Security", href: "/security", icon: <ShieldIcon /> },
    ],
    []
  );

  const settingsLinks: NavItem[] = useMemo(
    () => [
      {
        label: "Track new URL",
        href: "/settings/track-url",
        icon: <LinkIcon />,
      },
      {
        label: "Manage API Keys",
        href: "/settings/api-keys",
        icon: <KeyIcon />,
      },
    ],
    []
  );

  const [companyOpen, setCompanyOpen] = useState(false);

  const companies = useMemo(
    () => [
      { name: "Company X", href: "/dashboard?company=x" },
      { name: "Company A", href: "/dashboard?company=a" },
      { name: "Company B", href: "/dashboard?company=b" },
      { name: "Company C", href: "/dashboard?company=c" },
    ],
    []
  );

  const [activeCompany, setActiveCompany] = useState(companies[0]);

  const toggleCompany = () => {
    setCompanyOpen((v) => {
      const next = !v;
      if (next) {
        setAppsOpen(false);
        setSettingsOpen(false);
      }
      return next;
    });
  };

  return (
    <aside className="z-50 h-full w-72 border-r border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
      <div className="flex h-screen flex-col px-6 py-6">
        {/* Logo */}
        <div className="mb-6 flex h-20 items-center justify-center">
          <img
            src="/brand/ser3bellum-logo-final.svg"
            alt="Ser3bellum"
            className="max-h-14 w-auto object-contain"
          />
        </div>

        {/* Company selector */}
        <button
          type="button"
          onClick={toggleCompany}
          className={cn(
            "mb-2 mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2",
            "bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-100",
            "border border-indigo-300/40",
            "transition-all duration-200",
            "hover:border-indigo-400/50",
            "hover:shadow-md hover:shadow-indigo-200/40"
          )}
        >
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]">
              <GridIcon />
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {activeCompany.name}
            </span>
          </span>

          <span className="ml-auto text-slate-700 opacity-70">
            <ChevronIcon
              className={cn(
                "opacity-80 transition-transform duration-200",
                companyOpen && "rotate-180"
              )}
            />
          </span>
        </button>

        {/* Company dropdown */}
        <div
          className={cn(
            "mb-3 grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            companyOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-2 flex flex-col gap-1">
              {companies
                .filter((c) => c.name !== activeCompany.name)
                .map((c) => (
                  <Link
                    key={c.name}
                    href={c.href}
                    onClick={() => {
                      setActiveCompany(c);
                      setCompanyOpen(false);
                    }}
                    className={cn(
                      "relative w-full rounded-lg px-3 py-2 text-sm transition-colors",
                      "text-slate-600 hover:bg-slate-100/60"
                    )}
                  >
                    <span className="pl-3">{c.name}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* User row + gear */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-zinc-200" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              info@ser3bellum.com
            </div>
            <div className="text-xs text-zinc-500">
              Monday, January 5, 2026 • 6:29 PM
            </div>
          </div>

          <Link
            href="/user-settings"
            aria-label="User settings"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100"
          >
            <GearIcon />
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-2 px-2">
          {/* Apps dropdown (header) */}
          <DropdownHeader
            label="Apps"
            open={appsOpen}
            onToggle={() => {
              setAppsOpen((v) => {
                const next = !v;
                if (next) setSettingsOpen(false);
                if (next) setCompanyOpen(false);
                return next;
              });
            }}
            icon={<AppsIcon />}
          />

          {/* Apps dropdown content */}
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              appsOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0 pointer-events-none"
            )}
          >
            <div className="overflow-hidden">
              <div className="mt-2 mb-2 flex flex-col gap-1">
                {connectedApps.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveApp(name)}
                    className={cn(
                      "relative w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      "text-slate-500 hover:bg-slate-100/60",
                      activeApp === name && "text-slate-700"
                    )}
                  >
                    {activeApp === name && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-blue-500" />
                    )}
                    <span className="pl-3">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ Actions (visually identical to nav rows) */}
          <ActionRow
            label="Refresh Data"
            icon={<RefreshIcon />}
            onClick={() => console.log("Trigger dashboard refresh")}
          />

          {/* Main navigation */}
          <nav className="mt-2 flex flex-col gap-1">
            {appLinks.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={pathname === item.href}
              />
            ))}
          </nav>

          {/* Bottom area */}
          <div className="mt-auto pt-6">
            {/* Settings dropdown */}
            <DropdownHeader
              label="Settings"
              open={settingsOpen}
              onToggle={() => {
                setSettingsOpen((v) => {
                  const next = !v;
                  if (next) setAppsOpen(false);
                  if (next) setCompanyOpen(false);
                  return next;
                });
              }}
              icon={<SettingsIcon />}
            />

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                settingsOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0 pointer-events-none"
              )}
            >
              <div className="overflow-hidden">
                <div className="mt-3">
                  <nav className="flex flex-col gap-1">
                    {settingsLinks.map((item) => (
                      <NavRow
                        key={item.href}
                        item={item}
                        active={pathname === item.href}
                      />
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Customize Dashboard button */}
            <button
              type="button"
              onClick={() => alert("Customize Dashboard (modal later)")}
              className={cn(
                "mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl px-3",
                "bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 backdrop-blur-xl",
                "border border-white/20 text-white",
                "transition-all duration-200",
                "hover:bg-blue-600/90 hover:shadow-md hover:shadow-blue-700/20",
                "active:translate-y-[1px]",
                "focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              )}
            >
              <GridIcon />
              <span className="text-sm font-semibold">Customize Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Dropdown header
 */
function DropdownHeader({
  label,
  open,
  onToggle,
  icon,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(glassBase, glassHover, open && glassActive)}
    >
      <span className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-white/10 border border-white/20",
            open && "border-blue-400/40 text-blue-700"
          )}
        >
          {icon}
        </span>
        {label}
      </span>

      <ChevronIcon
        className={cn(
          "ml-auto opacity-80 transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  );
}

/**
 * Shared row shell so ActionRow and NavRow never drift visually.
 */
function RowShell({
  active,
  children,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", active && "", className)}>
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" />
      )}
      {children}
    </div>
  );
}

function ActionRow({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <RowShell>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          glassBase,
          glassHover,
          "text-zinc-700/90",
          "focus:outline-none focus:ring-2 focus:ring-black/10"
        )}
      >
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-white/10 border border-white/20 text-slate-600"
          )}
        >
          {icon}
        </span>
        <span className="font-medium text-slate-600">{label}</span>
      </button>
    </RowShell>
  );
}

/**
 * Nav rows
 */
function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <RowShell active={active}>
      <Link
        href={item.href}
        className={cn(
          glassBase,
          glassHover,
          active && glassActive,
          active ? "text-zinc-900" : "text-zinc-700/90"
        )}
      >
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-white/10 border border-white/20",
            active && "border-blue-400/40 text-blue-700"
          )}
        >
          {item.icon}
        </span>

        <span className="font-medium text-slate-600">{item.label}</span>
      </Link>
    </RowShell>
  );
}

/* Inline icons */

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a7.9 7.9 0 00.1-2l2-1.2-2-3.4-2.2.6a8 8 0 00-1.7-1L15 5h-6l-.6 2.9a8 8 0 00-1.7 1l-2.2-.6-2 3.4 2 1.2a7.9 7.9 0 000 2l-2 1.2 2 3.4 2.2-.6a8 8 0 001.7 1L9 22h6l.6-2.9a8 8 0 001.7-1l2.2.6 2-3.4-2-1.2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v2M17 3v2M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a7.9 7.9 0 00.1-2l2-1.2-2-3.4-2.2.6a8 8 0 00-1.7-1L15 5h-6l-.6 2.9a8 8 0 00-1.7 1l-2.2-.6-2 3.4 2 1.2a7.9 7.9 0 000 2l-2 1.2 2 3.4 2.2-.6a8 8 0 001.7 1L9 22h6l.6-2.9a8 8 0 001.7-1l2.2.6 2-3.4-2-1.2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 12a8 8 0 10-2.3 5.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 8v4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12v7M12 5v14M19 9v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 01-7 0l-2 2a5 5 0 007 7l1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 10l-6 6h-3v3H9v3H6v-3.5l7.2-7.2A5 5 0 1121 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M16.5 8.5h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
