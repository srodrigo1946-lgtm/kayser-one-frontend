"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { Bot, Send, Upload, FileText, Settings, Zap, RefreshCw, Loader2, Check } from "lucide-react";
import { useAiChat, useMyAi, useUpdateMyAi, type AiChatMessage } from "@/hooks/use-ai";
import { useSettings } from "@/hooks/use-settings";
import { useKnowledge, useUploadKnowledge } from "@/hooks/use-knowledge";
import { getApiErrorMessage } from "@/lib/api";

const initialConvo: AiChatMessage[] = [
  {
    role: "assistant",
    content:
      "Olá! Sou a Kayser One AI. Estou aqui para ajudar na qualificação e atendimento dos seus leads. Como posso te ajudar hoje?",
  },
];

export default function IAPage() {
  const [messages, setMessages] = useState<AiChatMessage[]>(initialConvo);
  const [input, setInput] = useState("");
  const aiChat = useAiChat();
  const loading = aiChat.isPending;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: AiChatMessage = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setInput("");
    setMessages(history);
    try {
      // Envia apenas as mensagens user/assistant (sem a saudação inicial fixa)
      const payload = history.filter((_, i) => i > 0);
      const res = await aiChat.mutateAsync(payload);
      setMessages((m) => [...m, { role: "assistant", content: res.content || "(sem resposta)" }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${getApiErrorMessage(err, "Não foi possível falar com a IA. Verifique a API Key em Configurações.")}` },
      ]);
    }
  };

  const clear = () => setMessages(initialConvo);

  return (
    <div className="flex flex-col h-screen">
      <Header title="IA Agente" subtitle="Kayser One AI — Assistente Comercial Inteligente" />

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Chat */}
        <div
          className="flex-1 flex flex-col rounded-2xl border overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)", color: "white" }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  Kayser One AI
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Ativa e operando
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clear}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <RefreshCw size={12} />
                Limpar
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "var(--primary)", color: "white" }}
                    >
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "var(--primary)" : "var(--secondary)",
                      color: msg.role === "user" ? "white" : "var(--foreground)",
                      borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                      borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    <Bot size={14} />
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                    style={{ background: "var(--secondary)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: "var(--muted-foreground)", animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <input
              placeholder="Pergunte sobre seus leads, métricas, automações..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                background: "var(--secondary)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-50"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <MyAiCard />
          <KnowledgePanel />
          <AutomationsPanel />
        </div>
      </div>
    </div>
  );
}

const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" } as const;
const PROVIDERS = [
  { id: "anthropic", label: "Anthropic Claude" },
  { id: "openai", label: "OpenAI GPT" },
  { id: "gemini", label: "Google Gemini" },
];

/* Config da IA do PRÓPRIO usuário (chave própria; fallback na chave da empresa). */
function MyAiCard() {
  const { data: myAi } = useMyAi();
  const update = useUpdateMyAi();
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (myAi) {
      setProvider(myAi.aiProvider ?? "anthropic");
      setModel(myAi.aiModel ?? "");
    }
  }, [myAi]);

  const save = async () => {
    setFeedback("");
    try {
      const payload: { aiProvider: string; aiModel: string; aiApiKey?: string } = { aiProvider: provider, aiModel: model };
      if (apiKey) payload.aiApiKey = apiKey;
      await update.mutateAsync(payload);
      setApiKey("");
      setFeedback("IA salva! Seus leads passam a usar a sua chave.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar."));
    }
  };

  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Settings size={16} style={{ color: "var(--primary)" }} />
        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Minha IA</h3>
      </div>
      <p className="text-[11px] mb-3" style={{ color: "var(--muted-foreground)" }}>
        Sua própria chave/token. Sem ela, seus leads usam a IA da empresa.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Provedor</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>Modelo (opcional)</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="ex: gpt-4o-mini" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
            API Key {myAi?.hasAiKey && <span style={{ color: "#22c55e" }}>(configurada — preencha p/ trocar)</span>}
          </label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
        </div>
        {feedback && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
        <button onClick={save} disabled={update.isPending} className="w-full px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
          {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar minha IA
        </button>
      </div>
    </div>
  );
}

/* Base de conhecimento REAL (compartilhada da empresa). */
function KnowledgePanel() {
  const { data: items } = useKnowledge();
  const upload = useUploadKnowledge();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    try {
      await upload.mutateAsync(file);
      setMsg(`"${file.name}" adicionado à base.`);
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao enviar."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <FileText size={16} style={{ color: "var(--primary)" }} />
        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Base de Conhecimento</h3>
      </div>
      <div className="space-y-2">
        {(items ?? []).slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "var(--secondary)" }}>
            <FileText size={14} style={{ color: "var(--primary)" }} />
            <span className="text-xs truncate flex-1" style={{ color: "var(--foreground)" }}>{item.title}</span>
          </div>
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>Nenhum documento ainda.</p>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.csv,.txt,.md" onChange={handleUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed text-xs font-medium disabled:opacity-60" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Adicionar documento
        </button>
        {msg && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{msg}</p>}
      </div>
    </div>
  );
}

/* Automações REAIS lidas das configurações. */
function AutomationsPanel() {
  const { data: s } = useSettings();
  const rows = [
    { label: "Resposta imediata (IA)", active: !!s?.aiAutoReply },
    { label: `Follow-up ${s?.followupDays ?? 3} dias`, active: !!s?.followupEnabled },
    { label: "IA responde em grupos", active: !!s?.aiReplyGroups },
  ];
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} style={{ color: "#f59e0b" }} />
        <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Automações Ativas</h3>
      </div>
      <div className="space-y-2">
        {rows.map((a) => (
          <div key={a.label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--foreground)" }}>{a.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: a.active ? "#22c55e18" : "var(--secondary)", color: a.active ? "#22c55e" : "var(--muted-foreground)" }}>
              {a.active ? "Ativo" : "Inativo"}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-3" style={{ color: "var(--muted-foreground)" }}>Configuráveis em Configurações → IA.</p>
    </div>
  );
}
