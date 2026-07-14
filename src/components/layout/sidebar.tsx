"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Calendar,
  Bot,
  BarChart3,
  Target,
  Trophy,
  Settings,
  Building2,
  Building,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  Megaphone,
  FolderUp,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { getStoredUser, logout } from "@/lib/auth";
import { avatarUrl } from "@/hooks/use-profile";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads / CRM", icon: Users },
  { href: "/imoveis", label: "Imóveis", icon: Building },
  { href: "/pastas", label: "Subir Pasta", icon: FolderUp },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/fila-leads", label: "Fila de Leads", icon: Megaphone, diretorOnly: true },
  { href: "/empresas", label: "Empresas", icon: Building2, diretorOnly: true },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/ia", label: "IA Agente", icon: Bot },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const roleLabels: Record<string, string> = {
  diretor: "Diretor",
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const user = getStoredUser() ?? { name: "Usuário", role: "corretor" };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 transition-all duration-300 border-r",
        collapsed ? "w-[68px]" : "w-64"
      )}
      style={{
        background: "var(--sidebar)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--primary)" }}
        >
          <Building2 size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--sidebar-foreground)" }}>
              Kayser One
            </div>
            <div className="text-xs" style={{ color: "var(--sidebar-muted)" }}>
              CRM Inteligente
            </div>
          </div>
        )}
      </div>

      {/* Usuário (topo) */}
      <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl",
            collapsed ? "justify-center" : ""
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {(user as any).avatar && (user as any).id ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl((user as any).id)} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "var(--sidebar-foreground)" }}
              >
                {user.name}
              </div>
              <div className="flex items-center gap-1">
                <Crown size={10} style={{ color: "var(--warning)" }} />
                <span className="text-xs" style={{ color: "var(--sidebar-muted)" }}>
                  {roleLabels[user.role] ?? user.role}
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1 rounded-lg transition-colors"
              style={{ color: "var(--sidebar-muted)" }}
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => {
            // Empresa parceira (usuário com empresaId) só enxerga as análises.
            if ((user as any).empresaId) return item.href === "/pastas";
            return !(item as any).diretorOnly || user.role === "diretor";
          })
          .map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                collapsed ? "justify-center" : ""
              )}
              style={{
                background: active ? "var(--sidebar-active)" : "transparent",
                color: active ? "var(--sidebar-active-foreground)" : "var(--sidebar-muted)",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
