"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/src/presentation/lib/cn";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload / JD" },
  { href: "/candidates", label: "Candidates" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav({ isDemo = false }: { isDemo?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.filter((link) => !isDemo || link.href !== "/upload").map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-xl px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:bg-brand-soft hover:text-brand-strong",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
