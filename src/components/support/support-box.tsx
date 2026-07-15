"use client";

import { useState } from "react";
import { LifeBuoy, ChevronDown, CheckCircle2, Mail } from "lucide-react";
import { sendSupportMessage } from "@/hooks/use-support";

const SUPPORT_EMAIL = "contato@kayserone.com.br";

export function SupportBox() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("suporte");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (message.trim().length < 3) {
      setError("Escreva a sua mensagem.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendSupportMessage({ name, email, type, message });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const inputStyle = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="mt-6 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        <LifeBuoy size={16} style={{ color: "var(--primary)" }} />
        <span className="flex-1 text-left">Suporte ou reclamação</span>
        <ChevronDown size={16} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
          {sent ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={28} className="mx-auto" style={{ color: "#10b981" }} />
              <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Mensagem enviada — obrigado!</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nossa equipe vai analisar.</div>
              <button onClick={() => setSent(false)} className="text-xs" style={{ color: "var(--primary)" }}>Enviar outra</button>
            </div>
          ) : (
            <div className="pt-3 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setType("suporte")}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={type === "suporte" ? { background: "var(--primary)", color: "white", borderColor: "var(--primary)" } : inputStyle}
                >
                  Suporte
                </button>
                <button
                  onClick={() => setType("reclamacao")}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={type === "reclamacao" ? { background: "#f59e0b", color: "white", borderColor: "#f59e0b" } : inputStyle}
                >
                  Reclamação
                </button>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome (opcional)" className={inputCls} style={inputStyle} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail (opcional)" className={inputCls} style={inputStyle} />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Escreva a sua mensagem…" className={`${inputCls} resize-y`} style={inputStyle} />
              {error && <div className="text-xs" style={{ color: "#ef4444" }}>{error}</div>}
              <button
                onClick={enviar}
                disabled={sending}
                className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {sending ? "Enviando…" : "Enviar mensagem"}
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Mail size={12} />
            <span>ou escreva para <strong style={{ color: "var(--foreground)" }}>{SUPPORT_EMAIL}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
