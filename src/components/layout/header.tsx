"use client";

import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-10"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{
            background: "var(--secondary)",
            color: "var(--muted-foreground)",
          }}
        >
          <Search size={16} />
          <span>Buscar...</span>
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: "var(--border)" }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--secondary)", color: "var(--foreground)" }}
        >
          <Bell size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--danger)" }}
          />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--secondary)", color: "var(--foreground)" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
