"use client";

import { Header } from "@/components/layout/header";
import { useState } from "react";
import { User, Lock, Bell, Bot, Users, Building2, Palette } from "lucide-react";

const tabs = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "ia", label: "Inteligência Artificial", icon: Bot },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "seguranca", label: "Segurança", icon: Lock },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div>
      <Header title="Configurações" subtitle="Gerencie sua conta e preferências" />
      <div className="p-6 flex gap-6">
        {/* Sidebar */}
        <div
          className="w-56 rounded-2xl border p-2 h-fit"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left mb-0.5"
              style={{
                background: activeTab === id ? "var(--secondary)" : "transparent",
                color: activeTab === id ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "perfil" && (
            <div
              className="rounded-2xl border p-6"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <h3 className="font-semibold mb-6" style={{ color: "var(--foreground)" }}>
                Informações do Perfil
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  RK
                </div>
                <div>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    Alterar foto
                  </button>
                  <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                    JPG, PNG. Máx 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nome completo", value: "Rodrigo Kayser", type: "text" },
                  { label: "E-mail", value: "rodrigo@kayserone.com.br", type: "email" },
                  { label: "Telefone", value: "(11) 99999-0000", type: "tel" },
                  { label: "WhatsApp", value: "(11) 99999-0000", type: "tel" },
                  { label: "Cargo", value: "Diretor", type: "text" },
                  { label: "Cidade", value: "São Paulo", type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      defaultValue={f.value}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  Salvar alterações
                </button>
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {activeTab === "usuarios" && (
            <div
              className="rounded-2xl border p-6"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                  Gerenciar Usuários
                </h3>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  + Novo usuário
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Carlos Silva", role: "Corretor", email: "carlos@email.com", active: true },
                  { name: "Marina Costa", role: "Gerente", email: "marina@email.com", active: true },
                  { name: "Patricia Souza", role: "Corretor", email: "patricia@email.com", active: true },
                  { name: "João Mendes", role: "Superintendente", email: "joao@email.com", active: false },
                ].map((u) => (
                  <div
                    key={u.name}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: "var(--secondary)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: "var(--primary)", color: "white" }}
                    >
                      {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{u.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.email}</div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "var(--primary)18", color: "var(--primary)" }}
                    >
                      {u.role}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: u.active ? "#22c55e18" : "var(--border)",
                        color: u.active ? "#22c55e" : "var(--muted-foreground)",
                      }}
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== "perfil" && activeTab !== "usuarios" && (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div style={{ color: "var(--muted-foreground)" }}>
                <Settings size={40} className="mx-auto mb-3 opacity-30" />
                <p>Seção em desenvolvimento</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Settings({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
