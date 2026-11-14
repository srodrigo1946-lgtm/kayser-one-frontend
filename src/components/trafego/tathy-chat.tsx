"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

/**
 * Pergunte à Tathy (Rodrigo 14/11): conversa ao vivo com os números do painel, imagem
 * (criativo/print — botão, Ctrl+V ou arrastar) e link (cola no texto). Tudo gravado.
 */
type Msg = { role: "user" | "assistant"; texto: string; imagens?: number; links?: string[]; em?: string };
type Img = { mime: string; base64: string; url: string };

// Reduz a imagem (lado maior 1600 px, JPEG) antes de mandar — print de celular fica leve.
async function prepararImagem(f: File): Promise<Img> {
  const url = URL.createObjectURL(f);
  const img = await new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = erro;
    i.src = url;
  });
  const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg", 0.85);
  return { mime: "image/jpeg", base64: dataUrl.split(",")[1], url };
}

export function TathyChat() {
  const qc = useQueryClient();
  const { data: historico = [] } = useQuery<Msg[]>({
    queryKey: ["tathy-conversa"],
    queryFn: async () => (await api.get("/investimento/tathy/conversa")).data,
  });
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [imagens, setImagens] = useState<Img[]>([]);
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState("");
  const lista = useRef<HTMLDivElement>(null);
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [verChave, setVerChave] = useState(false);
  const [chave, setChave] = useState("");
  const [chaveMsg, setChaveMsg] = useState("");
  const salvarChave = async () => {
    try {
      await updateSettings.mutateAsync({ tathyClaudeKey: chave.trim() } as any);
      setChave("");
      setChaveMsg("Chave salva. Testando...");
      await testarChave();
    } catch (err) {
      setChaveMsg(getApiErrorMessage(err, "Não consegui salvar a chave."));
    }
  };
  // Mostra só o começo e o tamanho da chave salva e se a Claude aceita.
  const testarChave = async () => {
    try {
      const { data: r } = await api.get("/investimento/tathy/testar-chave");
      if (!r.salva) return setChaveMsg("Nenhuma chave da Tathy salva ainda.");
      setChaveMsg(
        r.ok
          ? `✅ A Claude aceitou a chave (${r.inicio}, ${r.tamanho} caracteres). Pode perguntar à Tathy.`
          : `❌ A Claude recusou a chave salva (${r.inicio}, ${r.tamanho} caracteres): ${r.erro}. Uma chave da Claude começa com sk-ant-api03- e tem uns 108 caracteres.`
      );
    } catch (err) {
      setChaveMsg(getApiErrorMessage(err, "Não consegui testar a chave."));
    }
  };

  useEffect(() => setMsgs(historico), [historico]);
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pensando]);

  const anexar = async (files: FileList | File[] | null) => {
    const lista = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!lista.length) return;
    try {
      const novas = await Promise.all(lista.slice(0, 4).map(prepararImagem));
      setImagens((a) => [...a, ...novas].slice(0, 4));
    } catch {
      setErro("Não consegui ler essa imagem. Tente PNG ou JPG.");
    }
  };

  const enviar = async () => {
    const pergunta = texto.trim();
    if ((!pergunta && !imagens.length) || pensando) return;
    setErro("");
    setMsgs((m) => [...m, { role: "user", texto: pergunta || "(imagem)", imagens: imagens.length }]);
    setTexto("");
    const paraEnviar = imagens.map(({ mime, base64 }) => ({ mime, base64 }));
    setImagens([]);
    setPensando(true);
    try {
      const { data } = await api.post("/investimento/tathy/perguntar", { pergunta, imagens: paraEnviar });
      setMsgs((m) => [...m, { role: "assistant", texto: data.resposta }]);
      qc.invalidateQueries({ queryKey: ["tathy-conversa"] });
    } catch (err) {
      setErro(getApiErrorMessage(err, "A Tathy não conseguiu responder agora. Tente de novo."));
    } finally {
      setPensando(false);
    }
  };

  const limpar = async () => {
    if (!confirm("Apagar toda a conversa com a Tathy?")) return;
    await api.delete("/investimento/tathy/conversa");
    setMsgs([]);
    qc.invalidateQueries({ queryKey: ["tathy-conversa"] });
  };

  const sugestoes = ["Qual anúncio eu pauso e onde coloco a verba?", "Quem está segurando lead parado?", "Por que o custo por lead está assim?"];

  return (
    <div
      className="rounded-xl border p-3 space-y-3"
      style={{ borderColor: "#facc1566", background: "var(--secondary)" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        anexar(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Pergunte à Tathy</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>texto, imagem do criativo ou link — ela responde com os números ao vivo</span>
        <span className="ml-auto flex gap-3">
          <button onClick={() => setVerChave((v) => !v)} className="text-xs underline" style={{ color: (settings as any)?.hasTathyClaudeKey ? "var(--muted-foreground)" : "#f59e0b" }}>
            {(settings as any)?.hasTathyClaudeKey ? "Chave da Tathy ✓" : "Colocar chave da Tathy"}
          </button>
          {msgs.length > 0 && (
            <button onClick={limpar} className="text-xs underline" style={{ color: "var(--muted-foreground)" }}>Apagar conversa</button>
          )}
        </span>
      </div>
      {verChave && (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="password"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder="Cole aqui a chave da Claude (sk-ant-...)"
            autoComplete="off"
            className="flex-1 min-w-[220px] text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <button onClick={salvarChave} disabled={!chave.trim() || updateSettings.isPending} className="text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50" style={{ background: "#facc15", color: "#0a0a0a" }}>
            Salvar chave
          </button>
          <button onClick={testarChave} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Testar chave
          </button>
          <span className="w-full text-xs" style={{ color: "var(--muted-foreground)" }}>
            {chaveMsg || "Fica guardada e escondida; só a Tathy usa. Pegue em console.anthropic.com → API Keys."}
          </span>
        </div>
      )}

      <div ref={lista} className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {!msgs.length && (
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button key={s} onClick={() => setTexto(s)} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 items-start ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <img src="/tathy.jpg" alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />}
            <div
              className="max-w-[85%] text-sm px-3 py-2 rounded-xl whitespace-pre-wrap break-words"
              style={m.role === "user" ? { background: "#facc15", color: "#0a0a0a" } : { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            >
              {m.texto}
              {!!m.imagens && <div className="text-xs mt-1 opacity-70">📎 {m.imagens} imagem(ns)</div>}
            </div>
          </div>
        ))}
        {pensando && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>A Tathy está analisando os números…</div>}
      </div>

      {imagens.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {imagens.map((im, i) => (
            <div key={i} className="relative">
              <img src={im.url} alt={`Imagem ${i + 1} para a Tathy`} className="w-16 h-16 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
              <button onClick={() => setImagens((a) => a.filter((_, j) => j !== i))} aria-label="Tirar imagem" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs" style={{ background: "#ef4444", color: "#fff" }}>×</button>
            </div>
          ))}
        </div>
      )}
      {erro && <div className="text-xs" style={{ color: "#ef4444" }}>{erro}</div>}

      <div className="flex gap-2 items-end">
        <label className="shrink-0 cursor-pointer text-xs px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} title="Anexar imagem (ou cole com Ctrl+V)">
          📎 Imagem
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { anexar(e.target.files); e.target.value = ""; }} />
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.length) {
              e.preventDefault();
              anexar(files);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={2}
          placeholder="Pergunte, cole um link ou uma imagem (Ctrl+V)… Enter envia"
          className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none resize-y"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
        <button onClick={enviar} disabled={pensando || (!texto.trim() && !imagens.length)} className="shrink-0 text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50" style={{ background: "#facc15", color: "#0a0a0a" }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
