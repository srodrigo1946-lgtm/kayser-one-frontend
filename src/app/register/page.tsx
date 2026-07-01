"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Eye, EyeOff } from "lucide-react";
import { register } from "@/lib/auth";
import { api, getApiErrorMessage } from "@/lib/api";

type Role = "superintendente" | "gerente_geral" | "gerente" | "corretor";

// Cargo do gestor que cada cargo deve escolher (nível imediatamente acima).
const MANAGER_LABEL: Record<Role, string> = {
  superintendente: "Diretor",
  gerente_geral: "Superintendente",
  gerente: "Gerente Geral",
  corretor: "Gerente",
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "corretor", label: "Corretor" },
  { value: "gerente", label: "Gerente" },
  { value: "gerente_geral", label: "Gerente Geral" },
  { value: "superintendente", label: "Superintendente" },
];

interface ManagerOption {
  id: string;
  name: string;
  role: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("corretor");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Carrega os possíveis gestores (nível acima) sempre que o cargo muda.
  useEffect(() => {
    setManagerId("");
    setManagerSearch("");
    api
      .get<ManagerOption[]>("/auth/managers", { params: { role } })
      .then(({ data }) => setManagers(data))
      .catch(() => setManagers([]));
  }, [role]);

  const filteredManagers = managers.filter((m) =>
    m.name.toLowerCase().includes(managerSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Preencha nome, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (!managerId) {
      setError(`Selecione seu ${MANAGER_LABEL[role]}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await register({ name, email, password, role, managerId });
      setSuccess(res.message || "Cadastro enviado! Aguarde a aprovação do seu gestor para acessar.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao cadastrar."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <Building2 size={22} color="white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Kayser One</span>
        </div>

        <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: "var(--foreground)" }}>Criar conta</h2>
        <p className="mb-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          Cadastre-se e selecione seu gestor
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="text-sm p-4 rounded-xl" style={{ background: "#dcfce7", color: "#16a34a" }}>
              {success}
            </div>
            <Link href="/login" className="block text-center py-3 rounded-xl font-semibold text-sm" style={{ background: "var(--primary)", color: "white" }}>
              Ir para o login
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
          <Field label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pr-12 px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>Seu cargo</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
              Seu {MANAGER_LABEL[role]} (a quem você responde)
            </label>
            <input
              value={managerSearch}
              onChange={(e) => setManagerSearch(e.target.value)}
              placeholder={`Buscar ${MANAGER_LABEL[role]} pelo nome...`}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-2"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            {managers.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Nenhum {MANAGER_LABEL[role]} cadastrado ainda. Peça para ele(a) se cadastrar primeiro.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                {filteredManagers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setManagerId(m.id)}
                    className="w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0"
                    style={{
                      borderColor: "var(--border)",
                      background: managerId === m.id ? "var(--primary)" : "transparent",
                      color: managerId === m.id ? "white" : "var(--foreground)",
                    }}
                  >
                    {m.name}
                  </button>
                ))}
                {filteredManagers.length === 0 && (
                  <p className="text-xs px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Nenhum resultado.</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm p-3 rounded-xl" style={{ background: "#fee2e2", color: "#dc2626" }}>{error}</div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-70" style={{ background: "var(--primary)", color: "white" }}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "var(--primary)" }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}
