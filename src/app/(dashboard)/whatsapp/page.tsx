"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Search, Send, Bot, QrCode, Loader2, Smile, Paperclip } from "lucide-react";
import { api, getApiErrorMessage, API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Mídia protegida: o token vai na query pra funcionar dentro de <img>/<audio>/<video>.
const mediaUrl = (id: string) => `${API_URL}/conversations/media/${id}?token=${getToken() ?? ""}`;

// Emojis mais usados no atendimento — lista curta e própria (sem biblioteca extra).
const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😉", "😍", "😘", "🤗", "🤔",
  "👍", "👏", "🙏", "💪", "🤝", "👌", "✌️", "🙌", "👋", "🫡",
  "❤️", "🔥", "✨", "🎉", "🥳", "✅", "❌", "⚠️", "⏰", "📅",
  "🏠", "🏡", "🏢", "🔑", "📍", "💰", "💵", "📈", "📝", "📎",
  "📷", "📞", "💬", "📧", "🚗", "😅", "😎", "🥰", "😢", "🤩",
];

// Limite de arquivo (base64 cresce ~33%; o backend aceita corpo de 25MB).
const MAX_ARQUIVO_MB = 15;
import {
  useConversations,
  useMessages,
  useSendWhatsapp,
  useSendWhatsappMedia,
  useAssignConversation,
  useSetEtiquetas,
  type ConversationItem,
} from "@/hooks/use-conversations";
import { useUsers } from "@/hooks/use-users";
import { useKanbanBoard } from "@/hooks/use-kanban";
import { DocRequestPanel } from "@/components/documents/doc-request-panel";

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

// Nome exibido: lead cadastrado > nome do WhatsApp (pushName) > número.
function displayName(conv: ConversationItem) {
  return conv.lead?.name || conv.contactName || conv.remoteJid || "Contato";
}

export default function WhatsAppPage() {
  const { data: conversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: thread } = useMessages(selectedId);
  const send = useSendWhatsapp();
  const sendMedia = useSendWhatsappMedia();
  const [showEmojis, setShowEmojis] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const assign = useAssignConversation();
  const setEtiquetas = useSetEtiquetas();
  const { data: teamUsers } = useUsers();
  const { data: board } = useKanbanBoard();
  const [message, setMessage] = useState("");

  // Etiquetas = colunas reais do Kanban. A key da coluna é o próprio status do lead,
  // então escolher a etiqueta move o card direto para a coluna correspondente.
  const etiquetas = (board ?? []).map((col) => ({
    key: col.id,
    label: col.title,
    color: col.color,
    emoji: col.emoji,
  }));

  // Lista suspensa: a etiqueta representa o estágio atual do funil (single-select).
  const setEtiqueta = (conv: ConversationItem, key: string) => {
    setEtiquetas.mutate({ conversationId: conv.id, etiquetas: key ? [key] : [] });
  };
  const [search, setSearch] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Deep-link vindo do card do lead (/whatsapp?lead=<id>&phone=<tel>): abre a conversa.
  useEffect(() => {
    if (selectedId || !conversations) return;
    const params = new URLSearchParams(window.location.search);
    const leadP = params.get("lead");
    const phoneP = (params.get("phone") || "").replace(/\D/g, "");
    let conv: ConversationItem | undefined;
    if (leadP) conv = conversations.find((c) => c.leadId === leadP);
    if (!conv && phoneP.length >= 6) {
      const tail = phoneP.slice(-8);
      conv = conversations.find((c) => (c.remoteJid || "").replace(/\D/g, "").includes(tail));
    }
    if (conv) setSelectedId(conv.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const list = (conversations ?? []).filter((c) =>
    (c.lead?.name || c.contactName || c.remoteJid || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected: ConversationItem | undefined = list.find((c) => c.id === selectedId) ?? thread?.conversation;

  const connect = async () => {
    setConnecting(true);
    setQr(null);
    try {
      await api.post("/whatsapp/instance");
      const { data } = await api.get("/whatsapp/instance/qr");
      // Evolution retorna base64 ou code dependendo da versão
      const code = data?.base64 || data?.qrcode?.base64 || data?.code || null;
      setQr(code);
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao conectar. Verifique a Evolution API."));
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selected?.remoteJid) return;
    try {
      await send.mutateAsync({ to: selected.remoteJid, text: message.trim() });
      setMessage("");
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao enviar."));
    }
  };

  // Anexo: imagem, PDF ou Excel. Vira base64 e sobe pelo endpoint de mídia.
  // O texto digitado (se houver) vai junto como legenda.
  const handleFile = async (file: File) => {
    if (!selected?.remoteJid) return;
    if (file.size > MAX_ARQUIVO_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo ${MAX_ARQUIVO_MB} MB.`);
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await sendMedia.mutateAsync({
        to: selected.remoteJid,
        base64,
        mimetype: file.type || "application/octet-stream",
        fileName: file.name,
        caption: message.trim() || undefined,
      });
      setMessage("");
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao enviar o arquivo."));
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="WhatsApp" subtitle="Central de mensagens" />

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de conversas */}
        <div className="w-80 flex flex-col border-r flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
              <Search size={14} style={{ color: "var(--muted-foreground)" }} />
              <input placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)" }} />
            </div>
          </div>

          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <button onClick={connect} disabled={connecting} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "var(--primary)18", color: "var(--primary)" }}>
              {connecting ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
              Conectar WhatsApp (QR Code)
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {list.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedId(conv.id)} className="w-full flex items-center gap-3 p-3 text-left border-b" style={{ background: selectedId === conv.id ? "var(--secondary)" : "transparent", borderColor: "var(--border)" }}>
                <div className="relative flex-shrink-0">
                  {conv.contactAvatar ? (
                    <img src={conv.contactAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--primary)", color: "white" }}>
                      {initials(displayName(conv))}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center" style={{ background: "#22c55e", color: "white" }}>{conv.unreadCount}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                    <span className="truncate">{displayName(conv)}</span>
                    {conv.fromAd && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--primary)", color: "white" }} title="Lead de anúncio">🎯 Anúncio</span>
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{conv.lastMessage}</div>
                  {(conv.etiquetas ?? []).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {(conv.etiquetas ?? []).map((k) => {
                        const et = etiquetas.find((e) => e.key === k);
                        return et ? <span key={k} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: et.color }} title={et.label} /> : null;
                      })}
                    </div>
                  )}
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>Nenhuma conversa ainda.</p>
            )}
          </div>
        </div>

        {/* Área de chat */}
        {qr ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "var(--foreground)" }}>
            <h3 className="font-semibold">Escaneie o QR Code no seu WhatsApp</h3>
            {qr.startsWith("data:") || qr.length > 100 ? (
              <img src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`} alt="QR Code" className="w-64 h-64 rounded-xl border" style={{ borderColor: "var(--border)" }} />
            ) : (
              <code className="text-xs p-4 rounded-xl" style={{ background: "var(--secondary)" }}>{qr}</code>
            )}
            <button onClick={() => setQr(null)} className="text-sm" style={{ color: "var(--primary)" }}>Fechar</button>
          </div>
        ) : selected ? (
          <div className="flex-1 flex flex-col">
            <div className="h-16 flex items-center gap-3 px-4 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {selected.contactAvatar ? (
                <img src={selected.contactAvatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
                  {initials(displayName(selected))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>{displayName(selected)}</div>
                <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  Atendente: {selected.assignedTo?.name ?? "não atribuído"}
                </div>
              </div>
              {(teamUsers ?? []).length > 0 && (
                <select
                  value={selected.assignedToId ?? ""}
                  onChange={(e) => assign.mutate({ conversationId: selected.id, userId: e.target.value || null })}
                  className="text-xs px-2 py-1.5 rounded-lg border outline-none flex-shrink-0"
                  style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  title="Atribuir atendente"
                >
                  <option value="">Sem atendente</option>
                  {(teamUsers ?? []).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Etiqueta = estágio do funil (lista suspensa). Move o card no Kanban. */}
            <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>Etiqueta:</span>
              <select
                value={(selected.etiquetas ?? [])[0] ?? ""}
                onChange={(e) => setEtiqueta(selected, e.target.value)}
                disabled={setEtiquetas.isPending}
                className="text-sm px-2 py-1.5 rounded-lg border outline-none disabled:opacity-50"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="">— Sem etiqueta —</option>
                {etiquetas.map((et) => (
                  <option key={et.key} value={et.key}>{et.emoji ? `${et.emoji} ` : ""}{et.label}</option>
                ))}
              </select>
              {(() => {
                const atual = etiquetas.find((e) => e.key === (selected.etiquetas ?? [])[0]);
                return atual ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: atual.color, color: "white" }}>
                    {atual.emoji ? `${atual.emoji} ` : ""}{atual.label}
                  </span>
                ) : null;
              })()}
            </div>

            <DocRequestPanel
              conversationId={selected.id}
              clientName={displayName(selected)}
              clientPhone={selected.remoteJid}
            />

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "var(--background)" }}>
              {(thread?.messages ?? []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[70%] rounded-2xl px-4 py-2.5" style={{ background: msg.direction === "out" ? "var(--primary)" : "var(--card)", color: msg.direction === "out" ? "white" : "var(--foreground)" }}>
                    {msg.direction === "out" && msg.isAI && (
                      <div className="flex items-center gap-1 mb-1 opacity-70 text-xs"><Bot size={10} /><span>Kayser One AI</span></div>
                    )}
                    {msg.hasMedia && (
                      <div className="mb-1">
                        {msg.mediaType === "image" || msg.mediaType === "sticker" ? (
                          <a href={mediaUrl(msg.id)} target="_blank" rel="noreferrer">
                            <img
                              src={mediaUrl(msg.id)}
                              alt="imagem"
                              className="rounded-lg max-w-full max-h-64 object-cover"
                            />
                          </a>
                        ) : msg.mediaType === "audio" ? (
                          <audio controls src={mediaUrl(msg.id)} className="max-w-full" />
                        ) : msg.mediaType === "video" ? (
                          <video controls src={mediaUrl(msg.id)} className="rounded-lg max-w-full max-h-64" />
                        ) : (
                          <a
                            href={mediaUrl(msg.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm underline break-all"
                          >
                            {msg.content}
                          </a>
                        )}
                      </div>
                    )}
                    {/* Mostra o texto quando não é mídia baixada, ou como legenda de imagem/vídeo. */}
                    {(!msg.hasMedia ||
                      ((msg.mediaType === "image" || msg.mediaType === "video") &&
                        !/^(📷|🎥)/.test(msg.content))) && (
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    )}
                    <p className="text-xs mt-1 opacity-60 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {(thread?.messages ?? []).length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>Sem mensagens.</p>
              )}
            </div>

            <div className="p-3 border-t flex items-center gap-2 relative" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {showEmojis && (
                <div
                  className="absolute bottom-16 left-3 z-20 p-2 rounded-xl border shadow-lg grid grid-cols-10 gap-1 w-[320px]"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setMessage((m) => m + e); setShowEmojis(false); }}
                      className="text-lg leading-none p-1 rounded hover:opacity-70"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowEmojis((v) => !v)}
                title="Emojis"
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                <Smile size={18} />
              </button>

              {/* Anexo: imagem, PDF ou Excel */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.pdf,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sendMedia.isPending}
                title="Anexar imagem, PDF ou Excel"
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                {sendMedia.isPending ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </button>

              <input placeholder="Digite uma mensagem..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
              <button onClick={handleSend} disabled={send.isPending} className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
            Selecione uma conversa ou conecte o WhatsApp
          </div>
        )}
      </div>
    </div>
  );
}
