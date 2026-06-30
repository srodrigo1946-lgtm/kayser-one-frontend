"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Moon, Sun, Building2, Lock, Mail } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { login } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("E-mail e senha são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const { firstLogin } = await login(email, password);
      router.push(firstLogin ? "/trocar-senha" : "/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Credenciais inválidas."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left Panel - Brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--sidebar)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--primary)" }}
          >
            <Building2 size={22} color="white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--sidebar-foreground)" }}>
            Kayser One
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--sidebar-foreground)" }}>
            CRM Inteligente
            <br />
            para Gestão
            <br />
            Comercial
          </h1>
          <p style={{ color: "var(--sidebar-muted)" }} className="text-lg">
            Leads, Kanban, WhatsApp e IA em uma única plataforma.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { label: "Leads gerenciados", value: "12.4k" },
              { label: "Vendas fechadas", value: "1.2k" },
              { label: "Taxa de conversão", value: "9.7%" },
              { label: "Tempo médio", value: "4.2 dias" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="text-2xl font-bold" style={{ color: "var(--sidebar-foreground)" }}>
                  {stat.value}
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--sidebar-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm" style={{ color: "var(--sidebar-muted)" }}>
          © 2025 Kayser One. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "var(--secondary)",
              color: "var(--foreground)",
            }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <Building2 size={22} color="white" />
            </div>
            <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Kayser One
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Bem-vindo de volta
          </h2>
          <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
            Acesse sua conta para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    "--tw-ring-color": "var(--primary)",
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Senha
                </label>
                <button
                  type="button"
                  className="text-sm"
                  style={{ color: "var(--primary)" }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                  style={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm p-3 rounded-xl"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-70"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div
            className="mt-6 p-4 rounded-xl text-sm"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            <strong style={{ color: "var(--foreground)" }}>Primeiro acesso?</strong>
            <br />
            Use a senha padrão <code className="font-mono">123456789</code>. Você será solicitado a criar uma nova senha.
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            Não tem conta?{" "}
            <Link href="/register" style={{ color: "var(--primary)" }}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
