"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, UploadCloud, Loader2, FileText, ShieldCheck } from "lucide-react";

interface ChecklistItem {
  key: string;
  label: string;
  recebido: boolean;
  count: number;
}
interface DocData {
  clientName: string;
  fase: string;
  checklist: ChecklistItem[];
  concluido: boolean;
}

export default function PublicDocsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<DocData>(`/docs/${token}`);
      setData(res.data);
      setError("");
    } catch {
      setError("Link inválido ou expirado. Peça um novo link ao seu corretor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const upload = async (tipo: string, file: File) => {
    setUploading(tipo);
    const form = new FormData();
    form.append("file", file);
    form.append("tipo", tipo);
    try {
      await api.post(`/docs/${token}/upload`, form, { headers: { "Content-Type": "multipart/form-data" } });
      await load();
    } catch {
      setError("Falha no envio. Tente novamente.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="min-h-dvh flex items-start justify-center p-4" style={{ color: "var(--foreground)" }}>
      <div className="w-full max-w-lg py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary)", color: "white" }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="font-bold" style={{ color: "var(--foreground)" }}>Kayser One</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Envio de documentos</div>
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando...</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border p-6 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            <div className="rounded-2xl border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Olá,</div>
              <div className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{data.clientName}</div>
              <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Envie os documentos abaixo para a análise {data.fase === "completa" ? "completa" : "simplificada"}. Formatos: PDF, JPG ou PNG.
              </div>
              {data.concluido && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}>
                  <CheckCircle2 size={16} /> Todos os documentos foram enviados. Obrigado!
                </div>
              )}
            </div>

            <div className="space-y-2">
              {data.checklist.map((item) => (
                <div key={item.key} className="rounded-xl border p-3 flex items-center gap-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.recebido ? "var(--success)" : "var(--secondary)", color: item.recebido ? "white" : "var(--muted-foreground)" }}>
                    {item.recebido ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {item.recebido ? `${item.count} arquivo(s) enviado(s) — pode enviar mais` : "Pendente"}
                    </div>
                  </div>
                  <label className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 flex-shrink-0" style={{ background: item.recebido ? "var(--secondary)" : "var(--primary)", color: item.recebido ? "var(--foreground)" : "white" }}>
                    {uploading === item.key ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    {item.recebido ? "Adicionar" : "Enviar"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploading === item.key}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(item.key, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 justify-center mt-6 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <ShieldCheck size={13} /> Seus documentos são enviados com segurança.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
