"use client";

import { Header } from "@/components/layout/header";
import { useEffect, useState } from "react";
import { User as UserIcon, Bot, Users, Building2, Trash2, Plus, Loader2, Upload, Check, X, KeyRound } from "lucide-react";
import { useRef } from "react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useUpdateProfile, useUploadAvatar, avatarUrl } from "@/hooks/use-profile";
import { useMe, useSetRecoveryCode } from "@/hooks/use-recovery";
import { useKnowledge, useCreateKnowledge, useDeleteKnowledge, useUploadKnowledge } from "@/hooks/use-knowledge";
import { useUsers, useCreateUser, useDeactivateUser, useActivateUser, useResetPassword, usePendingUsers, useApproveUser, useRejectUser } from "@/hooks/use-users";
import type { UserRole } from "@/types";

const tabs = [
  { id: "perfil", label: "Perfil", icon: UserIcon },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "ia", label: "Inteligência Artificial", icon: Bot },
  { id: "empresa", label: "Empresa", icon: Building2 },
];

const roleLabels: Record<string, string> = {
  diretor: "Diretor",
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("perfil");

  // Permite abrir direto numa aba via ?tab= (ex.: notificação de novo cadastro → Usuários).
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab);
  }, []);

  return (
    <div>
      <Header title="Configurações" subtitle="Gerencie sua conta e preferências" />
      <div className="p-6 flex gap-6">
        <div className="w-56 rounded-2xl border p-2 h-fit" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left mb-0.5"
              style={{
                background: activeTab === id ? "var(--secondary)" : "transparent",
                color: activeTab === id ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          {activeTab === "perfil" && <ProfileForm />}
          {activeTab === "perfil" && <RecoveryCodeCard />}

          {activeTab === "ia" && <IaSettings />}
          {activeTab === "usuarios" && (
            <>
              <PendingApprovals />
              <UsersManager />
            </>
          )}

          {activeTab === "empresa" && (
            <Card title="Empresa">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Dados da empresa e logo serão configuráveis em breve.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-semibold mb-6" style={{ color: "var(--foreground)" }}>{title}</h3>
      {children}
    </div>
  );
}

function ProfileForm() {
  const stored = getStoredUser();
  const update = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(stored?.name ?? "");
  const [phone, setPhone] = useState(stored?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(stored?.whatsapp ?? "");
  const [hasAvatar, setHasAvatar] = useState<boolean>(!!stored?.avatar);
  const [version, setVersion] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  // Envia a foto real (arquivo de imagem) para o servidor.
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback("");
    try {
      await uploadAvatar.mutateAsync(file);
      setHasAvatar(true);
      setVersion(Date.now()); // cache-bust para recarregar a imagem
      setFeedback("Foto atualizada.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao enviar a foto."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setFeedback("");
    try {
      await update.mutateAsync({ name, phone, whatsapp });
      setFeedback("Perfil atualizado.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar o perfil."));
    }
  };

  return (
    <Card title="Informações do Perfil">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden" style={{ background: "var(--primary)", color: "white" }}>
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl(stored?.id, version)} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            (stored?.name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("")
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending} className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
            {uploadAvatar.isPending && <Loader2 size={16} className="animate-spin" />}
            Alterar foto
          </button>
          <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>Envie uma imagem (JPG ou PNG).</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="Telefone" value={phone} onChange={setPhone} />
        <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cargo</label>
          <div className="px-3 py-2.5 rounded-xl border text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            {roleLabels[stored?.role ?? ""] ?? "—"}
          </div>
        </div>
      </div>

      {feedback && <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
      <button onClick={save} disabled={update.isPending} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
        {update.isPending && <Loader2 size={16} className="animate-spin" />}
        Salvar alterações
      </button>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
        style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}

/* ---------------- Código de recuperação do Diretor ---------------- */
function RecoveryCodeCard() {
  const stored = getStoredUser();
  const { data: me } = useMe();
  const setCodeMut = useSetRecoveryCode();
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [feedback, setFeedback] = useState("");

  if (stored?.role !== "diretor") return null;

  const save = async () => {
    setFeedback("");
    if (code.length < 6) { setFeedback("O código precisa ter pelo menos 6 caracteres."); return; }
    if (code !== confirm) { setFeedback("Os códigos não conferem."); return; }
    try {
      await setCodeMut.mutateAsync(code);
      setCode(""); setConfirm("");
      setFeedback("Código de recuperação salvo! Guarde-o em local seguro.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar."));
    }
  };

  return (
    <Card title="Código de recuperação (Diretor)">
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Como você está no topo, ninguém pode redefinir sua senha. Cadastre um <strong>código de recuperação</strong> secreto:
        se esquecer a senha, use ele no login (em &quot;Esqueceu a senha?&quot;) para criar uma nova.
        {me?.hasRecoveryCode && <span style={{ color: "#22c55e" }}> ✅ Já configurado.</span>}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Novo código (mín. 6)</label>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="new-password" name="kayser-recovery-code" placeholder="••••••" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Confirmar código</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" name="kayser-recovery-confirm" placeholder="••••••" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>
      {feedback && <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
      <button onClick={save} disabled={setCodeMut.isPending} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
        {setCodeMut.isPending && <Loader2 size={16} className="animate-spin" />}
        Salvar código
      </button>
    </Card>
  );
}

/* ---------------- IA ---------------- */
function IaSettings() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [masterPrompt, setMasterPrompt] = useState("");
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [aiReplyGroups, setAiReplyGroups] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel ?? "");
      setMasterPrompt(settings.masterPrompt ?? "");
      setAiAutoReply(settings.aiAutoReply);
      setAiReplyGroups(settings.aiReplyGroups);
    }
  }, [settings]);

  const save = async () => {
    setFeedback("");
    try {
      const payload: any = { aiProvider: provider, aiModel: model, masterPrompt, aiAutoReply, aiReplyGroups };
      if (apiKey) payload.aiApiKey = apiKey;
      await update.mutateAsync(payload);
      setApiKey("");
      setFeedback("Configurações salvas com sucesso.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar. Apenas o Diretor pode alterar."));
    }
  };

  return (
    <div className="space-y-4">
      <Card title="IA da empresa (reserva)">
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          Chave usada por quem <strong>não</strong> configurou a própria IA. Cada cargo pode cadastrar
          a sua em <strong>IA Agente → Minha IA</strong>; sem isso, cai nesta chave da empresa.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Provedor</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI GPT</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Modelo (opcional)</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="ex: claude-sonnet-4-6" autoComplete="off" name="kayser-company-ai-model" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            API Key {settings?.hasApiKey && <span style={{ color: "#22c55e" }}>(já configurada — preencha para trocar)</span>}
          </label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." autoComplete="new-password" name="kayser-company-ai-key" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Prompt mestre (opcional — sobrescreve o padrão)</label>
          <textarea value={masterPrompt} onChange={(e) => setMasterPrompt(e.target.value)} rows={5} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 items-end">
          <Toggle label="Resposta automática" checked={aiAutoReply} onChange={setAiAutoReply} />
          <Toggle label="IA responde em grupos" checked={aiReplyGroups} onChange={setAiReplyGroups} />
        </div>
        {feedback && <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
        <button onClick={save} disabled={update.isPending} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
          {update.isPending && <Loader2 size={16} className="animate-spin" />}
          Salvar configurações
        </button>
      </Card>

      <FollowupSettings />
      <KnowledgeManager />
    </div>
  );
}

/* ---------------- Follow-up automático (só Diretor) ---------------- */
const SOURCE_OPTIONS: { id: string; label: string }[] = [
  { id: "anuncio", label: "Anúncio (Facebook/Instagram/etc)" },
  { id: "manual", label: "Cadastrado pelo cargo" },
  { id: "whatsapp", label: "WhatsApp orgânico (sem anúncio)" },
];

const FOLLOWUP_DEFAULTS = {
  manha: "Oi {nome}, bom dia! 😊 Passando pra saber se você ainda tem interesse no imóvel. Posso tirar dúvidas ou já agendar uma visita?",
  tarde: "Oi {nome}, boa tarde! 😊 Passando pra saber se você ainda tem interesse no imóvel. Posso tirar dúvidas ou já agendar uma visita?",
  noite: "Oie {nome}, boa noite! 😊 Passando pra saber se você ainda tem interesse no imóvel. Posso tirar dúvidas ou já agendar uma visita?",
};

function FollowupSettings() {
  const stored = getStoredUser();
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState(3);
  const [sources, setSources] = useState<string[]>(["anuncio", "manual"]);
  const [manha, setManha] = useState("");
  const [tarde, setTarde] = useState("");
  const [noite, setNoite] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.followupEnabled);
      setDays(settings.followupDays);
      setSources(settings.followupSources?.length ? settings.followupSources : ["anuncio", "manual"]);
      setManha(settings.followupMsgManha ?? "");
      setTarde(settings.followupMsgTarde ?? "");
      setNoite(settings.followupMsgNoite ?? "");
    }
  }, [settings]);

  // Regras de follow-up são exclusivas do Diretor.
  if (stored?.role !== "diretor") return null;

  const toggleSource = (id: string) =>
    setSources((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  const save = async () => {
    setFeedback("");
    try {
      await update.mutateAsync({
        followupEnabled: enabled,
        followupDays: days,
        followupSources: sources,
        followupMsgManha: manha,
        followupMsgTarde: tarde,
        followupMsgNoite: noite,
      });
      setFeedback("Regras de follow-up salvas.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar."));
    }
  };

  return (
    <Card title="Follow-up automático">
      <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
        Quando ligado, leads sem contato há alguns dias recebem uma saudação automática por WhatsApp
        conforme o horário. Só o Diretor edita estas regras.
      </p>

      <div className="grid grid-cols-2 gap-4 items-end mb-5">
        <Toggle label="Ativar follow-up" checked={enabled} onChange={setEnabled} />
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Disparar após (dias sem contato)</label>
          <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
      </div>

      <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>Origens que recebem o follow-up</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {SOURCE_OPTIONS.map((opt) => {
          const on = sources.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleSource(opt.id)}
              className="text-xs px-3 py-2 rounded-xl border font-medium inline-flex items-center gap-1.5"
              style={{
                borderColor: on ? "var(--primary)" : "var(--border)",
                background: on ? "var(--primary)" : "transparent",
                color: on ? "white" : "var(--muted-foreground)",
              }}
            >
              {on && <Check size={13} />} {opt.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <FollowupMsg label="🌅 Mensagem da manhã (até 12h)" value={manha} onChange={setManha} placeholder={FOLLOWUP_DEFAULTS.manha} />
        <FollowupMsg label="☀️ Mensagem da tarde (12h–18h)" value={tarde} onChange={setTarde} placeholder={FOLLOWUP_DEFAULTS.tarde} />
        <FollowupMsg label="🌙 Mensagem da noite (após 18h)" value={noite} onChange={setNoite} placeholder={FOLLOWUP_DEFAULTS.noite} />
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
        Use <code>{"{nome}"}</code> para inserir o primeiro nome do lead. Deixe vazio para usar o texto padrão.
      </p>

      {feedback && <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
      <button onClick={save} disabled={update.isPending} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
        {update.isPending && <Loader2 size={16} className="animate-spin" />}
        Salvar regras
      </button>
    </Card>
  );
}

function FollowupMsg({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className="w-12 h-6 rounded-full relative transition-colors"
        style={{ background: checked ? "var(--primary)" : "var(--border)" }}
      >
        <span className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow" style={{ left: checked ? "26px" : "2px" }} />
      </button>
    </div>
  );
}

function KnowledgeManager() {
  const { data: items } = useKnowledge();
  const create = useCreateKnowledge();
  const remove = useDeleteKnowledge();
  const upload = useUploadKnowledge();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const add = async () => {
    if (!title.trim() || !content.trim()) return;
    await create.mutateAsync({ title, content });
    setTitle("");
    setContent("");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg("");
    try {
      await upload.mutateAsync(file);
      setUploadMsg(`"${file.name}" processado e adicionado à base.`);
    } catch (err) {
      setUploadMsg(getApiErrorMessage(err, "Falha ao processar o arquivo."));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card title="Base de Conhecimento">
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Adicione textos ou envie arquivos (PDF, Word, PowerPoint, Excel, CSV, TXT). A IA usa apenas estas informações.
      </p>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.csv,.txt,.md" onChange={handleUpload} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Enviar documento para treinar a IA
      </button>
      {uploadMsg && <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>{uploadMsg}</p>}

      <div className="space-y-2 mb-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ex: FAQ Financiamento)" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Conteúdo..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        <button onClick={add} disabled={create.isPending} className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
          <Plus size={16} /> Adicionar
        </button>
      </div>
      <div className="space-y-2">
        {(items ?? []).map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--secondary)" }}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.title}</div>
              <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{item.content}</div>
            </div>
            <button onClick={() => remove.mutate(item.id)} style={{ color: "#ef4444" }} title="Remover"><Trash2 size={16} /></button>
          </div>
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>Nenhum item ainda.</p>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Aprovações pendentes ---------------- */
function PendingApprovals() {
  const { data: pending } = usePendingUsers();
  const approve = useApproveUser();
  const reject = useRejectUser();

  if (!pending || pending.length === 0) return null;

  return (
    <Card title={`Cadastros pendentes (${pending.length})`}>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Estas pessoas se cadastraram e escolheram você (ou sua equipe) como gestor. Aprove para liberar o acesso.
      </p>
      <div className="space-y-3">
        {pending.map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--secondary)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#f59e0b", color: "white" }}>
              {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{u.name}</div>
              <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{u.email}</div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--card)", color: "var(--primary)" }}>{roleLabels[u.role] ?? u.role}</span>
            <button onClick={() => approve.mutate(u.id)} disabled={approve.isPending} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50" style={{ background: "#22c55e18", color: "#22c55e" }} title="Aprovar">
              <Check size={16} />
            </button>
            <button onClick={() => { if (window.confirm(`Recusar o cadastro de ${u.name}?`)) reject.mutate(u.id); }} disabled={reject.isPending} className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50" style={{ color: "#ef4444" }} title="Recusar">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Usuários ---------------- */
function UsersManager() {
  const { data: users } = useUsers();
  const create = useCreateUser();
  const deactivate = useDeactivateUser();
  const activate = useActivateUser();
  const resetPw = useResetPassword();
  const [feedback, setFeedback] = useState("");

  const handleReset = (u: { id: string; name: string }) => {
    if (!window.confirm(`Redefinir a senha de ${u.name} para a padrão (123456789)? A pessoa criará uma nova no próximo acesso.`)) return;
    resetPw.mutate(u.id, {
      onSuccess: (d) => setFeedback(d.message),
      onError: (err) => setFeedback(getApiErrorMessage(err, "Falha ao redefinir a senha.")),
    });
  };
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("corretor" as UserRole);
  const [managerId, setManagerId] = useState("");

  const resetForm = () => {
    setName(""); setEmail(""); setRole("corretor" as UserRole); setManagerId("");
  };

  const addUser = async () => {
    if (!name.trim() || !email.trim()) {
      setFeedback("Preencha nome e e-mail.");
      return;
    }
    setFeedback("");
    try {
      await create.mutateAsync({ name: name.trim(), email: email.trim(), role, managerId: managerId || undefined });
      setFeedback("Usuário criado. Senha padrão: 123456789");
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao criar usuário."));
    }
  };

  return (
    <Card title="Gerenciar Usuários">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Equipe e hierarquia</p>
        <button onClick={() => setShowForm((v) => !v)} className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Cargo</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                <option value="diretor">Diretor</option>
                <option value="superintendente">Superintendente</option>
                <option value="gerente_geral">Gerente Geral</option>
                <option value="gerente">Gerente</option>
                <option value="corretor">Corretor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Gestor (a quem responde)</label>
              <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                <option value="">Sem gestor (topo)</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {roleLabels[u.role] ?? u.role}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            O gestor define a hierarquia: quem vê os dados deste usuário. Ex.: um Corretor responde a um Gerente.
          </p>
          <div className="flex gap-2">
            <button onClick={addUser} disabled={create.isPending} className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
              {create.isPending && <Loader2 size={16} className="animate-spin" />} Criar usuário
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {feedback && <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
      <div className="space-y-3">
        {(users ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--secondary)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--primary)", color: "white" }}>
              {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{u.name}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.email}</div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--card)", color: "var(--primary)" }}>{roleLabels[u.role] ?? u.role}</span>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: u.active ? "#22c55e18" : "var(--border)", color: u.active ? "#22c55e" : "var(--muted-foreground)" }}>
              {u.active ? "Ativo" : "Inativo"}
            </span>
            <button
              onClick={() => handleReset(u)}
              disabled={resetPw.isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "var(--card)", color: "var(--muted-foreground)" }}
              title="Redefinir senha"
            >
              <KeyRound size={14} /> Redefinir senha
            </button>
            {u.active ? (
              <button
                onClick={() => { if (window.confirm(`Desativar ${u.name}? Ela perde o acesso, mas o histórico é mantido.`)) deactivate.mutate(u.id); }}
                disabled={deactivate.isPending}
                className="text-xs px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "#ef444418", color: "#ef4444" }}
                title="Desativar"
              >
                <Trash2 size={14} /> Desativar
              </button>
            ) : (
              <button
                onClick={() => activate.mutate(u.id)}
                disabled={activate.isPending}
                className="text-xs px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "#22c55e18", color: "#22c55e" }}
                title="Ativar"
              >
                <Check size={14} /> Ativar
              </button>
            )}
          </div>
        ))}
        {(users ?? []).length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>Nenhum usuário encontrado.</p>
        )}
      </div>
    </Card>
  );
}
