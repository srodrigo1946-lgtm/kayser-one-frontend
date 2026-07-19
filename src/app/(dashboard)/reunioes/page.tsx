"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { getApiErrorMessage } from "@/lib/api";
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
  useSaveMeetingNotes,
  type Meeting,
} from "@/hooks/use-meetings";
import { useUsers } from "@/hooks/use-users";
import { getStoredUser } from "@/lib/auth";
import { Video, Plus, X, Trash2, Copy, ArrowLeft, Users, Check, Loader2 } from "lucide-react";

const STATUS: Record<string, { label: string; color: string }> = {
  agendada: { label: "Agendada", color: "#3b82f6" },
  em_andamento: { label: "Em andamento", color: "#22c55e" },
  encerrada: { label: "Encerrada", color: "#6b7280" },
};

function quando(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Monta o link do Jitsi já configurado: entra direto (sem tela de pré-entrada),
 * câmera e microfone ligados, vídeo 720p e, no celular, abre no navegador
 * (sem o pop-up "abrir no app"). Se passar o nome, já entra identificado.
 */
function joinUrl(link: string, nome?: string) {
  const cfg = [
    "config.prejoinPageEnabled=false",
    "config.startWithAudioMuted=false",
    "config.startWithVideoMuted=false",
    "config.disableDeepLinking=true",
    "config.resolution=720",
  ];
  if (nome) cfg.unshift(`userInfo.displayName=${encodeURIComponent(`"${nome}"`)}`);
  return `${link}#${cfg.join("&")}`;
}

// Data (YYYY-MM-DD) e hora (HH:mm) da próxima hora cheia, para os inputs nativos.
function proxima() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

export default function ReunioesPage() {
  const { data: meetings = [], isLoading } = useMeetings();
  const del = useDeleteMeeting();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  const excluir = (m: Meeting) => {
    if (!window.confirm(`Excluir a reunião "${m.title}"? Ela sai da agenda de todos.`)) return;
    del.mutate(m.id, {
      onError: (err) => setFeedback(getApiErrorMessage(err, "Falha ao excluir a reunião.")),
    });
  };

  const active = meetings.find((m) => m.id === openId) || null;

  if (active) {
    return <MeetingRoom meeting={active} onBack={() => setOpenId(null)} />;
  }

  // Separa em Próximas (ainda não terminaram) e Histórico (já passaram).
  const agora = Date.now();
  const fim = (m: Meeting) => new Date(m.scheduledAt).getTime() + (m.durationMin || 90) * 60000;
  const proximas = meetings
    .filter((m) => fim(m) >= agora)
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const historico = meetings.filter((m) => fim(m) < agora);

  return (
    <div>
      <Header title="Reuniões" subtitle="Reuniões em vídeo — agende, grave e anote" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Plus size={16} /> Nova reunião
          </button>
        </div>

        {feedback && (
          <div className="text-sm p-3 rounded-xl" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
        ) : meetings.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Nenhuma reunião ainda. Clique em “Nova reunião”.
          </div>
        ) : (
          <div className="space-y-6">
            <Secao titulo="Próximas reuniões" lista={proximas} vazio="Nenhuma reunião marcada." onOpen={setOpenId} />
            <Secao titulo="Histórico" lista={historico} vazio="Nenhuma reunião passada ainda." onOpen={setOpenId} />
          </div>
        )}
      </div>

      {showForm && (
        <MeetingForm
          onClose={() => setShowForm(false)}
          onCreated={(m) => { setShowForm(false); setOpenId(m.id); }}
          onError={(msg) => setFeedback(msg)}
        />
      )}
    </div>
  );
}

/* ---------------- Seção da lista (Próximas / Histórico) ---------------- */
function Secao({
  titulo,
  lista,
  vazio,
  onOpen,
}: {
  titulo: string;
  lista: Meeting[];
  vazio: string;
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
        {titulo} {lista.length > 0 && <span style={{ opacity: 0.6 }}>· {lista.length}</span>}
      </h3>
      {lista.length === 0 ? (
        <p className="text-xs py-2" style={{ color: "var(--muted-foreground)" }}>{vazio}</p>
      ) : (
        <div className="space-y-2">
          {lista.map((m) => <MeetingRow key={m.id} m={m} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function MeetingRow({ m, onOpen }: { m: Meeting; onOpen: (id: string) => void }) {
  const st = STATUS[m.status] ?? STATUS.agendada;
  return (
    <button
      onClick={() => onOpen(m.id)}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3b82f622", color: "#3b82f6" }}>
        <Video size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{m.title}</div>
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {quando(m.scheduledAt)} · {m.durationMin} min · {(m.participantIds?.length ?? 0)} participante(s)
        </div>
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${st.color}22`, color: st.color }}>
        {st.label}
      </span>
    </button>
  );
}

/* ---------------- Sala da reunião (Jitsi embutido + anotações) ---------------- */
function MeetingRoom({ meeting, onBack }: { meeting: Meeting; onBack: () => void }) {
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [saved, setSaved] = useState(true);
  const [copied, setCopied] = useState(false);
  const saveNotes = useSaveMeetingNotes();
  const del = useDeleteMeeting();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelar = () => {
    if (!window.confirm(`Cancelar a reunião "${meeting.title}"? Ela sai da agenda.`)) return;
    del.mutate(meeting.id, { onSuccess: onBack });
  };

  // Autosave das anotações (1,2s depois de parar de digitar).
  useEffect(() => {
    if (notes === (meeting.notes ?? "")) return;
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveNotes.mutate({ id: meeting.id, notes }, { onSuccess: () => setSaved(true) });
    }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Eu entro já identificado; o convidado recebe o link com as mesmas configurações
  // de som/imagem (só sem o nome, que ele preenche).
  const meuNome = (getStoredUser() as any)?.name as string | undefined;
  const meuLink = joinUrl(meeting.link, meuNome);
  const linkConvidado = joinUrl(meeting.link);

  const copyLink = () => {
    navigator.clipboard.writeText(linkConvidado).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 flex items-center gap-3 px-4 border-b flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--secondary)", color: "var(--foreground)" }} title="Voltar">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{meeting.title}</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{quando(meeting.scheduledAt)}</div>
        </div>
        <button
          onClick={copyLink}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border min-h-[40px]"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          title="Copiar link para convidar (interno ou externo)"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar link do convidado"}</span>
        </button>
        <button
          onClick={cancelar}
          disabled={del.isPending}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-60"
          style={{ background: "#ef444418", color: "#ef4444" }}
          title="Cancelar reunião"
          aria-label="Cancelar reunião"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Entrar na reunião (abre o Jitsi em nova aba — sem limite de tempo, ótimo no celular) */}
        <div className="lg:flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#3b82f622", color: "#3b82f6" }}>
            <Video size={30} />
          </div>
          <div>
            <div className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>{meeting.title}</div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{quando(meeting.scheduledAt)} · {meeting.durationMin} min</div>
          </div>
          <a
            href={meuLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Video size={18} /> Entrar na reunião
          </a>
          <p className="text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>
            Abre em nova aba com <b>câmera e microfone já ligados</b> e seu nome preenchido. Funciona no computador e no celular.
          </p>
        </div>

        {/* Anotações */}
        <div className="flex-1 lg:flex-none w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Anotações</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{saved ? "Salvo ✓" : "Salvando…"}</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escreva as anotações da reunião aqui…"
            className="flex-1 p-4 text-sm outline-none resize-none bg-transparent"
            style={{ color: "var(--foreground)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Formulário de nova reunião ---------------- */
function MeetingForm({
  onClose,
  onCreated,
  onError,
}: {
  onClose: () => void;
  onCreated: (m: Meeting) => void;
  onError: (msg: string) => void;
}) {
  const create = useCreateMeeting();
  const { data: users = [] } = useUsers();
  const [title, setTitle] = useState("");
  const [data, setData] = useState(() => proxima().data);
  const [hora, setHora] = useState(() => proxima().hora);
  const [durationMin, setDurationMin] = useState(90);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const filtrados = (users as any[]).filter((u) =>
    (u.name || "").toLowerCase().includes(busca.toLowerCase())
  );

  const toggle = (id: string) =>
    setParticipantIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    if (!title.trim() || !data || !hora) {
      onError("Informe título, data e hora.");
      return;
    }
    try {
      const m = await create.mutateAsync({
        title: title.trim(),
        scheduledAt: new Date(`${data}T${hora}`).toISOString(),
        durationMin,
        participantIds,
      });
      onCreated(m);
    } catch (err) {
      onError(getApiErrorMessage(err, "Falha ao criar reunião."));
    }
  };

  // Campos brancos (bem visíveis no fundo escuro do drawer); colorScheme light deixa
  // os seletores nativos de data/hora também claros.
  const inputStyle = { background: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", colorScheme: "light" as const };
  const inputCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto p-6" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Nova reunião</h3>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Alinhamento da equipe" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Duração (min)</label>
            <input type="number" min={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="text-xs mb-1 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
              <Users size={13} /> Participantes do time
            </label>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pessoa pelo nome…"
              className={`${inputCls} mb-2`}
              style={inputStyle}
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border divide-y" style={{ borderColor: "var(--border)" }}>
              {filtrados.length === 0 && (
                <p className="text-xs p-3" style={{ color: "var(--muted-foreground)" }}>Nenhum usuário encontrado.</p>
              )}
              {filtrados.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
                  style={{ borderColor: "var(--border)", background: participantIds.includes(u.id) ? "var(--secondary)" : "transparent", color: "var(--foreground)" }}
                >
                  <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ border: `1px solid var(--border)`, background: participantIds.includes(u.id) ? "var(--primary)" : "transparent" }}>
                    {participantIds.includes(u.id) && <Check size={12} color="white" />}
                  </span>
                  {u.name}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Gente de fora entra pelo <b>link do convidado</b> (na tela da reunião).
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancelar
            </button>
            <button onClick={submit} disabled={create.isPending} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
              {create.isPending && <Loader2 size={16} className="animate-spin" />} Criar e abrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
