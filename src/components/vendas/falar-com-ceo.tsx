"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

const Y = "#facc15";

/**
 * "Falar com o CEO" (rede com +250 usuários): caixinha na própria página que envia pro
 * contato@kayserone.com.br / Gmail do Rodrigo via /support (tipo "ceo"). O mailto antigo não
 * abria em computador sem programa de e-mail configurado.
 */
export function FalarComCeo() {
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: "", empresa: "", contato: "", corretores: "", msg: "" });
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "erro">("");
  const campo = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    const message =
      `Reunião com o CEO (site — acima de 250 usuários)\n\n` +
      `Nome: ${f.nome}\nEmpresa: ${f.empresa}\nWhatsApp/e-mail: ${f.contato}\nNº de corretores: ${f.corretores}\n\n${f.msg}`;
    try {
      const r = await fetch(`${API_URL}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ceo", name: f.nome.slice(0, 120), email: f.contato.slice(0, 160), message: message.slice(0, 5000) }),
      });
      setEstado(r.ok ? "ok" : "erro");
    } catch {
      setEstado("erro");
    }
  };

  const input = "w-full rounded-xl px-3 py-2.5 text-sm border outline-none";
  const estilo = { background: "#0f0f0f", borderColor: "rgba(250,204,21,.25)", color: "#f5f5f4" };

  if (estado === "ok") {
    return (
      <div className="mt-6 rounded-xl p-4 text-sm text-center" style={{ background: "rgba(34,197,94,.12)", color: "#4ade80" }}>
        ✅ Recebemos! O CEO vai entrar em contato para marcar a reunião.
      </div>
    );
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-6 w-full text-center rounded-xl px-4 py-3 font-bold border transition-transform hover:scale-[1.02]"
        style={{ borderColor: Y, color: Y }}
      >
        Falar com o CEO
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-5 space-y-2">
      <input required maxLength={120} placeholder="Seu nome" value={f.nome} onChange={campo("nome")} className={input} style={estilo} />
      <input required maxLength={120} placeholder="Imobiliária / rede" value={f.empresa} onChange={campo("empresa")} className={input} style={estilo} />
      <input required maxLength={160} placeholder="WhatsApp ou e-mail" value={f.contato} onChange={campo("contato")} className={input} style={estilo} />
      <input maxLength={20} placeholder="Nº de corretores" value={f.corretores} onChange={campo("corretores")} className={input} style={estilo} />
      <textarea maxLength={2000} rows={3} placeholder="Conte um pouco do seu negócio (opcional)" value={f.msg} onChange={campo("msg")} className={input} style={estilo} />
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="w-full rounded-xl px-4 py-3 font-bold disabled:opacity-60"
        style={{ background: Y, color: "#0a0a0a" }}
      >
        {estado === "enviando" ? "Enviando…" : "Enviar para o CEO"}
      </button>
      {estado === "erro" && (
        <p className="text-xs text-center" style={{ color: "#f87171" }}>
          Não consegui enviar agora. Tente de novo ou escreva para contato@kayserone.com.br
        </p>
      )}
    </form>
  );
}
