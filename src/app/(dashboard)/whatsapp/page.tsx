"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { mockConversations } from "@/lib/mock-data";
import type { Conversation } from "@/types";
import { Search, Send, Bot, Phone, MoreHorizontal, Wifi, WifiOff } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const mockMessages = [
  { id: "1", content: "Olá! Vi o anúncio do apartamento e gostei muito.", direction: "in" as const, timestamp: "2025-06-26T09:00:00", isAI: false },
  { id: "2", content: "Olá, Ana Paula! Boa tarde! 😊 Que ótimo que você se interessou! Posso te ajudar com mais informações sobre o Residencial Jardins. Qual seria a sua renda familiar aproximada?", direction: "out" as const, timestamp: "2025-06-26T09:01:00", isAI: true },
  { id: "3", content: "Minha renda é em torno de R$ 5.500,00", direction: "in" as const, timestamp: "2025-06-26T09:05:00", isAI: false },
  { id: "4", content: "Perfeito! Com essa renda, você se enquadra muito bem no financiamento. Você possui FGTS disponível? Isso pode ajudar bastante na entrada! 🏠", direction: "out" as const, timestamp: "2025-06-26T09:06:00", isAI: true },
  { id: "5", content: "Sim, tenho uns R$ 15.000 de FGTS", direction: "in" as const, timestamp: "2025-06-26T09:10:00", isAI: false },
  { id: "6", content: "Excelente! Com R$ 15.000 de FGTS e uma entrada adicional, fica bem mais fácil de viabilizar. Gostaria de agendar uma visita para conhecer o empreendimento pessoalmente? 📅", direction: "out" as const, timestamp: "2025-06-26T09:11:00", isAI: true },
  { id: "7", content: "Sim! Quando tem disponibilidade?", direction: "in" as const, timestamp: "2025-06-26T09:15:00", isAI: false },
];

export default function WhatsAppPage() {
  const [selected, setSelected] = useState<Conversation | null>(mockConversations[0]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const filtered = mockConversations.filter((c) =>
    c.lead.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen">
      <Header title="WhatsApp" subtitle="Central de mensagens" />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div
          className="w-80 flex flex-col border-r flex-shrink-0"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--secondary)" }}
            >
              <Search size={14} style={{ color: "var(--muted-foreground)" }} />
              <input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--foreground)" }}
              />
            </div>
          </div>

          {/* Session Status */}
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-xs">
              <Wifi size={12} style={{ color: "#22c55e" }} />
              <span style={{ color: "#22c55e" }}>Conectado • (11) 98765-0000</span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className="w-full flex items-center gap-3 p-3 text-left border-b transition-colors"
                style={{
                  background: selected?.id === conv.id ? "var(--secondary)" : "transparent",
                  borderColor: "var(--border)",
                }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    {conv.lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                      style={{ background: "#22c55e", color: "white" }}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {conv.lead.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(conv.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {conv.lastMessage?.isAI && (
                      <Bot size={10} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    )}
                    <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {conv.lastMessage?.content}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div
              className="h-16 flex items-center justify-between px-4 border-b"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {selected.lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                    {selected.lead.name}
                  </div>
                  <div className="text-xs flex items-center gap-1" style={{ color: "#22c55e" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--primary)18", color: "var(--primary)" }}
                >
                  <Bot size={12} />
                  IA Ativa
                </div>
                <button style={{ color: "var(--muted-foreground)" }}>
                  <Phone size={18} />
                </button>
                <button style={{ color: "var(--muted-foreground)" }}>
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "var(--background)" }}>
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[70%] rounded-2xl px-4 py-2.5"
                    style={{
                      background: msg.direction === "out"
                        ? msg.isAI ? "var(--primary)" : "#1e40af"
                        : "var(--card)",
                      color: msg.direction === "out" ? "white" : "var(--foreground)",
                      borderBottomRightRadius: msg.direction === "out" ? "4px" : "16px",
                      borderBottomLeftRadius: msg.direction === "in" ? "4px" : "16px",
                    }}
                  >
                    {msg.direction === "out" && msg.isAI && (
                      <div className="flex items-center gap-1 mb-1 opacity-70 text-xs">
                        <Bot size={10} />
                        <span>Kayser One AI</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div
              className="p-3 border-t flex items-center gap-2"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ background: "var(--primary)18", color: "var(--primary)" }}
              >
                <Bot size={14} />
                IA
              </button>
              <input
                placeholder="Digite uma mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
                style={{
                  background: "var(--secondary)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                onKeyDown={(e) => e.key === "Enter" && setMessage("")}
              />
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)", color: "white" }}
                onClick={() => setMessage("")}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
