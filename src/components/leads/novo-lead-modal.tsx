"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { useCreateLead } from "@/hooks/use-leads";
import { useDistribuirLead } from "@/hooks/use-lead-queue";
import { useProperties } from "@/hooks/use-properties";

/** "50k", "50.000", "R$ 50.000,00" → 50000. Vazio/inválido → undefined. */
export function lerValor(t: string): number | undefined {
  const s = (t || "").toLowerCase().replace(/r\$|\s/g, "");
  if (!s) return undefined;
  const mil = /k$|mil$/.test(s);
  const n = Number(s.replace(/k$|mil$/, "").replace(/\./g, "").replace(",", "."));
  if (!isFinite(n) || n <= 0) return undefined;
  return Math.round(mil ? n * 1000 : n);
}
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/**
 * Cadastro do lead com as informações (ato/entrada, renda, FGTS, empreendimento…) ANTES
 * de ir pra fila. Diretor escolhe o destino: fila normal, fila SWAT ou fica com ele.
 * Cargos escolhem o time de origem (não entram em fila).
 */
export function NovoLeadModal({ isDiretor, origens, onClose, onPronto }: { isDiretor: boolean; origens: string[]; onClose: () => void; onPronto: (msg: string) => void }) {
  const criar = useCreateLead();
  const distribuir = useDistribuirLead();
  const { data: imoveis } = useProperties();
  const [f, setF] = useState({ name: "", phone: "", email: "", propertyId: "", ato: "", renda: "", fgts: "", objetivo: "", obs: "", origem: "", destino: "normal" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const muda = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const salvar = async () => {
    setErro("");
    if (!f.name.trim()) return setErro("Escreva o nome do lead.");
    if (f.phone.replace(/\D/g, "").length < 10) return setErro("Telefone com DDD (ex.: 21999998888).");
    if (!isDiretor && !f.origem) return setErro("Escolha o time de origem.");
    const ato = lerValor(f.ato), renda = lerValor(f.renda), fgts = lerValor(f.fgts);
    const imovel = (imoveis ?? []).find((p) => p.id === f.propertyId);
    // A IA lê esse bloco e não pergunta de novo o que já sabemos.
    const linhas = [
      ato ? `Ato/entrada: ${brl(ato)}` : "",
      renda ? `Renda: ${brl(renda)}` : "",
      fgts ? `FGTS: ${brl(fgts)}` : "",
      f.objetivo ? `Objetivo: ${f.objetivo}` : "",
      imovel ? `Empreendimento: ${imovel.name}` : "",
      f.obs.trim() ? `Observações: ${f.obs.trim()}` : "",
    ].filter(Boolean);
    setSalvando(true);
    try {
      const novo = await criar.mutateAsync({
        name: f.name.trim(),
        phone: f.phone.replace(/\D/g, ""),
        ...(f.email.trim() ? { email: f.email.trim() } : {}),
        ...(imovel ? { propertyId: imovel.id, empreendimento: imovel.name } : {}),
        ...(ato ? { entrada: ato } : {}),
        ...(renda ? { renda } : {}),
        ...(fgts ? { fgts } : {}),
        ...(linhas.length ? { observacoes: `📋 Respostas do formulário:\n${linhas.join("\n")}` } : {}),
        ...(!isDiretor ? { origem: f.origem } : {}),
      } as any);
      if (isDiretor && f.destino !== "comigo" && novo?.id) {
        const swat = f.destino === "swat";
        const nomeFila = swat ? "fila SWAT" : "fila normal";
        try {
          const d = await distribuir.mutateAsync({ leadId: novo.id, swat });
          onPronto(
            d.status === "distribuido"
              ? `Lead criado com as informações e enviado pra ${nomeFila}: já está com o corretor da vez.`
              : d.status === "aguardando"
                ? `Lead criado na ${nomeFila}: aguardando ${swat ? "um SWAT com check-in" : "o plantão abrir"}.`
                : d.status === "fila_desligada"
                  ? "Lead criado, mas a fila está desligada — ficou com você."
                  : `Lead criado (status da fila: ${d.status}).`
          );
        } catch (err) {
          onPronto(`Lead criado, mas não entrou na ${nomeFila}: ${getApiErrorMessage(err, "erro")}`);
        }
      } else {
        onPronto(isDiretor ? "Lead criado com as informações. Ficou com você, fora da fila." : `Lead criado no ${f.origem}.`);
      }
      onClose();
    } catch (err) {
      setErro(getApiErrorMessage(err, "Falha ao criar o lead."));
    } finally {
      setSalvando(false);
    }
  };

  const box = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };
  const campo = "w-full mt-1 px-3 py-2 rounded-lg border text-sm outline-none";
  const rot = "text-xs";
  const corRot = { color: "var(--muted-foreground)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Plus size={18} /> Novo lead
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className={rot} style={corRot}>Nome *<input value={f.name} onChange={muda("name")} className={campo} style={box} autoFocus /></label>
          <label className={rot} style={corRot}>Telefone com DDD *<input value={f.phone} onChange={muda("phone")} inputMode="tel" placeholder="21999998888" className={campo} style={box} /></label>
          <label className={rot} style={corRot}>E-mail<input value={f.email} onChange={muda("email")} type="email" className={campo} style={box} /></label>
          <label className={rot} style={corRot}>
            Empreendimento
            <select value={f.propertyId} onChange={muda("propertyId")} className={campo} style={box}>
              <option value="">— Não sei / vários —</option>
              {(imoveis ?? []).filter((p) => p.active !== false).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className={rot} style={corRot}>Ato / entrada<input value={f.ato} onChange={muda("ato")} placeholder="ex.: 50k ou 50.000" className={campo} style={box} /></label>
          <label className={rot} style={corRot}>Renda<input value={f.renda} onChange={muda("renda")} placeholder="ex.: 8.000" className={campo} style={box} /></label>
          <label className={rot} style={corRot}>FGTS<input value={f.fgts} onChange={muda("fgts")} placeholder="ex.: 20k" className={campo} style={box} /></label>
          <label className={rot} style={corRot}>
            Morar ou investir
            <select value={f.objetivo} onChange={muda("objetivo")} className={campo} style={box}>
              <option value="">—</option>
              <option>Morar</option>
              <option>Investir</option>
            </select>
          </label>
        </div>
        <label className={rot + " block mt-3"} style={corRot}>
          Observações (o corretor e a IA leem)
          <textarea value={f.obs} onChange={muda("obs")} rows={3} placeholder="ex.: quer 2 quartos, visita no sábado" className={campo} style={box} />
        </label>

        {isDiretor ? (
          <div className="mt-4">
            <div className={rot + " mb-1"} style={corRot}>Para onde vai o lead?</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                ["normal", "Fila normal", "Corretor da vez no plantão"],
                ["swat", "Fila SWAT 🛡️", "Só os SWAT com check-in"],
                ["comigo", "Fica comigo", "Sem fila"],
              ].map(([v, t, d]) => (
                <label key={v} className="p-3 rounded-xl border cursor-pointer text-sm" style={{ borderColor: f.destino === v ? "var(--primary)" : "var(--border)", color: "var(--foreground)" }}>
                  <input type="radio" name="destino" value={v} checked={f.destino === v} onChange={muda("destino")} className="mr-2" />
                  <b>{t}</b>
                  <span className="block text-xs mt-0.5" style={corRot}>{d}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <label className={rot + " block mt-3"} style={corRot}>
            Time de origem *
            <select value={f.origem} onChange={muda("origem")} className={campo} style={box}>
              <option value="">— Escolha o time —</option>
              {origens.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}

        {erro && <p className="text-sm mt-3" style={{ color: "#ef4444" }}>{erro}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
            {salvando && <Loader2 size={14} className="animate-spin" />}
            {isDiretor && f.destino !== "comigo" ? "Salvar e enviar pra fila" : "Salvar lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
