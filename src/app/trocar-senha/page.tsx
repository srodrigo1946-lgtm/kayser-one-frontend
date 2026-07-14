"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Building2, ShieldCheck } from "lucide-react";
import { changePassword, getStoredUser, isAuthenticated } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("123456789");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  const user = getStoredUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      // Empresa parceira vai direto para a área de análise (não vê dashboard).
      router.push((user as any)?.empresaId ? "/pastas" : "/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível alterar a senha."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
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

        <div
          className="rounded-2xl border p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} style={{ color: "var(--primary)" }} />
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Criar nova senha
            </h2>
          </div>
          <p className="mb-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {user ? `Olá, ${user.name}! ` : ""}Por segurança, defina uma nova senha para o seu primeiro acesso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Senha atual"
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
            />
            <Field
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              placeholder="Mínimo 8 caracteres"
            />
            <Field
              label="Confirmar nova senha"
              value={confirm}
              onChange={setConfirm}
              type="password"
            />

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
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
        {label}
      </label>
      <div className="relative">
        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>
    </div>
  );
}
