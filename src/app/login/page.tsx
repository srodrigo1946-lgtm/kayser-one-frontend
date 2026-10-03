"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Moon, Sun, Building2, Lock, Mail } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { login } from "@/lib/auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { SupportBox } from "@/components/support/support-box";
import { Cena3D } from "@/components/login/cena-3d";

// Cores do painel do login (amarelo e preto — pedido do Rodrigo).
const AMARELO = "#facc15";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recCode, setRecCode] = useState("");
  const [recNewPass, setRecNewPass] = useState("");
  const [recMsg, setRecMsg] = useState("");
  const [recLoading, setRecLoading] = useState(false);

  const handleRecover = async () => {
    setRecMsg("");
    if (!email || recCode.length < 6 || recNewPass.length < 6) {
      setRecMsg("Preencha e-mail, código (mín. 6) e nova senha (mín. 6).");
      return;
    }
    setRecLoading(true);
    try {
      await api.post("/auth/recover", { email, recoveryCode: recCode, newPassword: recNewPass });
      setRecMsg("✅ Senha redefinida! Agora é só entrar com a nova senha.");
      setRecCode("");
      setRecNewPass("");
      setPassword("");
    } catch (err) {
      setRecMsg(getApiErrorMessage(err, "E-mail ou código de recuperação inválido."));
    } finally {
      setRecLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("E-mail e senha são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.firstLogin) {
        router.push("/trocar-senha");
      } else {
        // Empresa parceira entra direto na área de análise (não vê dashboard).
        router.push((res.user as any)?.empresaId ? "/pastas" : "/dashboard");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Credenciais inválidas."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left Panel - Brand: cena 3D (prédios animados) em amarelo e preto */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "#050505" }}>
        <Cena3D />
        {/* Degradê por cima da cena: deixa os textos legíveis sem esconder os prédios. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.15) 30%, rgba(5,5,5,0.1) 55%, rgba(5,5,5,0.9) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: AMARELO }}>
              <Building2 size={22} color="#0a0a0a" />
            </div>
            <span className="text-xl font-bold text-white">Kayser One</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
              CRM Inteligente
              <br />
              para Gestão
              <br />
              <span style={{ color: AMARELO }}>Comercial</span>
            </h1>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}>
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
                  className="rounded-xl p-4 backdrop-blur-md border"
                  style={{ background: "rgba(10,10,10,0.55)", borderColor: "rgba(250,204,21,0.25)" }}
                >
                  <div className="text-2xl font-bold" style={{ color: AMARELO }}>
                    {stat.value}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            © 2025 Kayser One. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8"
        style={theme === "dark" ? { background: "#0b0b0b" } : undefined}
      >
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
              style={{ background: AMARELO }}
            >
              <Building2 size={22} color="#0a0a0a" />
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
                  onClick={() => setShowForgot((v) => !v)}
                  className="text-sm"
                  style={{ color: AMARELO }}
                >
                  Esqueceu a senha?
                </button>
              </div>
              {showForgot && (
                <div className="mb-2 p-3 rounded-xl text-xs leading-relaxed border space-y-2" style={{ borderColor: "var(--border)", background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                  <p>
                    Peça ao seu <strong>gestor</strong> ou ao <strong>Diretor</strong> para redefinir sua senha.
                    Você entrará com a senha padrão <strong>123456789</strong> e criará uma nova no primeiro acesso.
                  </p>
                  <button type="button" onClick={() => setShowRecover((v) => !v)} className="font-medium" style={{ color: "var(--primary)" }}>
                    É o Diretor? Recuperar com o código de recuperação
                  </button>
                  {showRecover && (
                    <div className="pt-2 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
                      <p>Digite seu <strong>e-mail acima</strong>, e aqui o código de recuperação + a nova senha:</p>
                      <input type="password" value={recCode} onChange={(e) => setRecCode(e.target.value)} autoComplete="off" placeholder="Código de recuperação" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                      <input type="password" value={recNewPass} onChange={(e) => setRecNewPass(e.target.value)} autoComplete="new-password" placeholder="Nova senha (mín. 6)" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                      <button type="button" onClick={handleRecover} disabled={recLoading} className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
                        {recLoading ? "Recuperando..." : "Redefinir minha senha"}
                      </button>
                      {recMsg && <p className="text-xs">{recMsg}</p>}
                    </div>
                  )}
                </div>
              )}
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
              style={{ background: AMARELO, color: "#0a0a0a" }}
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
            <Link href="/register" style={{ color: AMARELO }}>Cadastre-se</Link>
          </p>

          {/* Caixinha pública de suporte/reclamação */}
          <SupportBox />

          <p className="mt-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/termos" className="underline">Termos de Uso</Link>
            {" · "}
            <Link href="/privacidade" className="underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
