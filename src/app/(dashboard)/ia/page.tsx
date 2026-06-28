"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Bot, Send, Upload, FileText, Settings, Zap, RefreshCw } from "lucide-react";
import { useAiChat, type AiChatMessage } from "@/hooks/use-ai";
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
        <div className="w-72 flex flex-col gap-4">
          {/* Config */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} style={{ color: "var(--primary)" }} />
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Configuração da IA
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Provedor de IA
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option>Anthropic Claude</option>
                  <option>OpenAI GPT-4</option>
                  <option>Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--foreground)" }}>Follow-up automático</span>
                <div
                  className="w-10 h-5 rounded-full relative cursor-pointer"
                  style={{ background: "var(--primary)" }}
                >
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Base */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} style={{ color: "var(--primary)" }} />
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Base de Conhecimento
              </h3>
            </div>
            <div className="space-y-2">
              {["Scripts de vendas.pdf", "Tabela de preços.xlsx", "FAQ clientes.docx", "Empreendimentos.pptx"].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 p-2 rounded-xl"
                  style={{ background: "var(--secondary)" }}
                >
                  <FileText size={14} style={{ color: "var(--primary)" }} />
                  <span className="text-xs truncate flex-1" style={{ color: "var(--foreground)" }}>{f}</span>
                </div>
              ))}
              <button
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed text-xs font-medium"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <Upload size={14} />
                Adicionar documento
              </button>
            </div>
          </div>

          {/* Automations */}
          <div
            className="rounded-2xl border p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} style={{ color: "#f59e0b" }} />
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Automações Ativas
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Resposta imediata", active: true },
                { label: "Follow-up 3 dias", active: true },
                { label: "Agendamento automático", active: false },
                { label: "Atualizar CRM", active: true },
              ].map((a) => (
                <div key={a.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>{a.label}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: a.active ? "#22c55e18" : "var(--secondary)",
                      color: a.active ? "#22c55e" : "var(--muted-foreground)",
                    }}
                  >
                    {a.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
