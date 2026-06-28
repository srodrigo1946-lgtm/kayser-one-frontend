"use client";

import { Header } from "@/components/layout/header";
import { useEffect, useState } from "react";
import { User as UserIcon, Bot, Users, Building2, Trash2, Plus, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useKnowledge, useCreateKnowledge, useDeleteKnowledge, useUploadKnowledge } from "@/hooks/use-knowledge";
import { useUsers, useCreateUser, useDeactivateUser } from "@/hooks/use-users";
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
  const [activeTab, setActiveTab] = useState("ia");
  const user = getStoredUser();

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
          {activeTab === "perfil" && (
            <Card title="Informações do Perfil">
              <div className="grid grid-cols-2 gap-4">
                <Info label="Nome" value={user?.name ?? "—"} />
                <Info label="E-mail" value={user?.email ?? "—"} />
                <Info label="Cargo" value={roleLabels[user?.role ?? ""] ?? "—"} />
                <Info label="Status" value={user?.active ? "Ativo" : "Inativo"} />
              </div>
            </Card>
          )}

          {activeTab === "ia" && <IaSettings />}
          {activeTab === "usuarios" && <UsersManager />}

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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <div className="px-3 py-2.5 rounded-xl border text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        {value}
      </div>
    </div>
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
  const [followupEnabled, setFollowupEnabled] = useState(true);
  const [followupDays, setFollowupDays] = useState(3);
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel ?? "");
      setMasterPrompt(settings.masterPrompt ?? "");
      setFollowupEnabled(settings.followupEnabled);
      setFollowupDays(settings.followupDays);
      setAiAutoReply(settings.aiAutoReply);
    }
  }, [settings]);

  const save = async () => {
    setFeedback("");
    try {
      const payload: any = { aiProvider: provider, aiModel: model, masterPrompt, followupEnabled, followupDays, aiAutoReply };
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
      <Card title="Configuração da IA">
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
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="ex: claude-sonnet-4-6" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            API Key {settings?.hasApiKey && <span style={{ color: "#22c55e" }}>(já configurada — preencha para trocar)</span>}
          </label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="mt-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Prompt mestre (opcional — sobrescreve o padrão)</label>
          <textarea value={masterPrompt} onChange={(e) => setMasterPrompt(e.target.value)} rows={5} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 items-end">
          <Toggle label="Resposta automática" checked={aiAutoReply} onChange={setAiAutoReply} />
          <Toggle label="Follow-up automático" checked={followupEnabled} onChange={setFollowupEnabled} />
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Dias p/ follow-up</label>
            <input type="number" min={1} value={followupDays} onChange={(e) => setFollowupDays(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
        </div>
        {feedback && <p className="text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}
        <button onClick={save} disabled={update.isPending} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
          {update.isPending && <Loader2 size={16} className="animate-spin" />}
          Salvar configurações
        </button>
      </Card>

      <KnowledgeManager />
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

/* ---------------- Usuários ---------------- */
function UsersManager() {
  const { data: users } = useUsers();
  const create = useCreateUser();
  const deactivate = useDeactivateUser();
  const [feedback, setFeedback] = useState("");

  const addUser = async () => {
    const name = window.prompt("Nome do usuário:");
    if (!name) return;
    const email = window.prompt("E-mail:");
    if (!email) return;
    const role = (window.prompt("Cargo (diretor, superintendente, gerente_geral, gerente, corretor):", "corretor") || "corretor") as UserRole;
    setFeedback("");
    try {
      await create.mutateAsync({ name, email, role });
      setFeedback("Usuário criado. Senha padrão: 123456789");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao criar usuário."));
    }
  };

  return (
    <Card title="Gerenciar Usuários">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Equipe e hierarquia</p>
        <button onClick={addUser} className="px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "white" }}>
          <Plus size={16} /> Novo usuário
        </button>
      </div>
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
            {u.active && (
              <button onClick={() => deactivate.mutate(u.id)} style={{ color: "#ef4444" }} title="Desativar"><Trash2 size={16} /></button>
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
