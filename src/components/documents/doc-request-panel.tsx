"use client";

import { useState } from "react";
import { FileText, Loader2, Copy, Check } from "lucide-react";
import { useCreateDocRequest, useConversationDocs } from "@/hooks/use-documents";

export function DocRequestPanel({
  conversationId,
  clientName,
  clientPhone,
}: {
  conversationId: string;
  clientName: string;
  clientPhone?: string;
}) {
  const create = useCreateDocRequest();
  const { data: reqs } = useConversationDocs(conversationId);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ fase: "simplificada", perfil: "clt", estadoCivil: "solteiro", declaraIR: false });
  const [nome, setNome] = useState(clientName || "");

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  const gerar = async () => {
    setLink("");
    try {
      const res = await create.mutateAsync({
        conversationId,
        clientName: nome.trim() || clientName || clientPhone || "",
        clientPhone,
        ...form,
      });
      setLink(res.link);
    } catch {
      /* silencioso */
    }
  };
  const copiar = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="px-4 py-2 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          <FileText size={13} /> Solicitar documentos
        </button>
        {(reqs ?? []).map((r) => (
          <span
            key={r.id}
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: r.concluido ? "var(--success)" : "var(--secondary)", color: r.concluido ? "white" : "var(--muted-foreground)" }}
            title={`Análise ${r.fase === "completa" ? "completa" : "simplificada"}`}
          >
            {r.fase === "completa" ? "Completa" : "Simplificada"}: {r.recebidos}/{r.total}
          </span>
        ))}
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--muted-foreground)" }}>
              Nome do cliente (aparece na pasta dos documentos)
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: João da Silva"
              className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.fase} onChange={(e) => setForm((s) => ({ ...s, fase: e.target.value }))} className="px-2 py-1.5 rounded-lg border text-xs outline-none" style={inputStyle}>
              <option value="simplificada">Análise simplificada</option>
              <option value="completa">Análise completa</option>
            </select>
            <select value={form.perfil} onChange={(e) => setForm((s) => ({ ...s, perfil: e.target.value }))} className="px-2 py-1.5 rounded-lg border text-xs outline-none" style={inputStyle}>
              <option value="clt">CLT (contracheque)</option>
              <option value="autonomo">Autônomo (extratos)</option>
            </select>
            <select value={form.estadoCivil} onChange={(e) => setForm((s) => ({ ...s, estadoCivil: e.target.value }))} className="px-2 py-1.5 rounded-lg border text-xs outline-none" style={inputStyle}>
              <option value="solteiro">Solteiro</option>
              <option value="casado">Casado</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs px-2" style={{ color: "var(--foreground)" }}>
              <input type="checkbox" checked={form.declaraIR} onChange={(e) => setForm((s) => ({ ...s, declaraIR: e.target.checked }))} />
              Declara IR
            </label>
          </div>
          <button
            onClick={gerar}
            disabled={create.isPending}
            className="w-full text-xs px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {create.isPending && <Loader2 size={13} className="animate-spin" />} Gerar link
          </button>
          {link && (
            <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <input readOnly value={link} className="flex-1 bg-transparent text-xs outline-none" style={{ color: "var(--muted-foreground)" }} />
              <button onClick={copiar} className="text-xs px-2 py-1 rounded flex items-center gap-1 flex-shrink-0" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          )}
          {link && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Copie e envie este link para o cliente no chat.</p>}
        </div>
      )}
    </div>
  );
}
