"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const Y = "#facc15";

const slug = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(ltda|me|eireli|s\/?a)\b/g, "").replace(/[^a-z0-9-]+/g, "").slice(0, 30);

/**
 * "Comece seu Kayser One" — o Mercado Pago devolve pra cá depois da assinatura
 * (?preapproval_id=...). O cliente preenche os dados e a instalação é criada sozinha.
 */
export default function ComecarPage() {
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [f, setF] = useState({ empresa: "", subdominio: "", diretorNome: "", diretorEmail: "" });
  const [estado, setEstado] = useState<"" | "enviando" | "ok">("");
  const [erro, setErro] = useState("");
  const [endereco, setEndereco] = useState("");

  useEffect(() => setAssinatura(new URLSearchParams(window.location.search).get("preapproval_id") || ""), []);

  const sub = slug(f.subdominio || f.empresa);
  const campo = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");
    setErro("");
    try {
      const r = await fetch(`${API_URL}/clientes-saas/comecar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assinatura, ...f, subdominio: f.subdominio || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(Array.isArray(j.message) ? j.message.join(" ") : j.message || "Não consegui criar agora.");
      setEndereco(j.endereco);
      setEstado("ok");
    } catch (err) {
      setErro((err as Error).message);
      setEstado("");
    }
  };

  const input = "mt-1 w-full rounded-xl px-3 py-3 text-base border outline-none focus-visible:ring-2 focus-visible:ring-yellow-400";
  const estilo = { background: "#0f0f0f", borderColor: "rgba(250,204,21,.25)", color: "#f5f5f4" };

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16" style={{ background: "#0a0a0a", color: "#f5f5f4" }}>
      <div className="max-w-lg mx-auto">
        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center border-2" style={{ borderColor: Y }} aria-label="Kayser One">
          <b className="text-lg leading-none" style={{ color: Y }}>K1</b>
          <i className="block w-5 h-[3px] mt-0.5 rounded" style={{ background: Y }} />
        </div>

        {estado === "ok" ? (
          <section className="mt-8">
            <h1 className="text-3xl font-extrabold">Pronto, está sendo criado.</h1>
            <p className="mt-3" style={{ color: "#a8a29e" }}>
              Em 5 a 10 minutos o seu Kayser One fica no ar em <b style={{ color: Y }}>{endereco.replace("https://", "")}</b>. O login e a senha do
              primeiro acesso chegam no e-mail <b style={{ color: "#f5f5f4" }}>{f.diretorEmail}</b>.
            </p>
            <p className="mt-6 text-sm" style={{ color: "#78716c" }}>
              Não chegou em 15 minutos? Veja o spam ou escreva para contato@kayserone.com.br.
            </p>
          </section>
        ) : assinatura === "" ? (
          <section className="mt-8">
            <h1 className="text-3xl font-extrabold">Comece seu Kayser One</h1>
            <p className="mt-3" style={{ color: "#a8a29e" }}>
              Esta página abre sozinha depois que você assina pelo Mercado Pago. Ainda não assinou?
            </p>
            <a href="/#planos" className="mt-6 inline-block rounded-xl px-5 py-3 font-bold" style={{ background: Y, color: "#0a0a0a" }}>
              Ver os planos
            </a>
          </section>
        ) : (
          <section className="mt-8">
            <h1 className="text-3xl font-extrabold">Assinatura confirmada. Falta pouco.</h1>
            <p className="mt-3" style={{ color: "#a8a29e" }}>
              Preencha os dados da sua imobiliária. O Kayser One é criado na hora, com o seu endereço.
            </p>
            <form onSubmit={enviar} className="mt-8 space-y-5">
              <label className="block text-sm">
                Nome da imobiliária
                <input required maxLength={80} value={f.empresa} onChange={campo("empresa")} className={input} style={estilo} placeholder="Imobiliária Exemplo" />
              </label>
              <label className="block text-sm">
                Endereço do seu Kayser One
                <div className="mt-1 flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-yellow-400" style={estilo}>
                  <input maxLength={30} value={f.subdominio} onChange={campo("subdominio")} className="flex-1 min-w-0 px-3 py-3 text-base bg-transparent outline-none" placeholder={sub || "suaimobiliaria"} />
                  <span className="pr-3 text-sm shrink-0" style={{ color: "#78716c" }}>.kayserone.com.br</span>
                </div>
                <span className="text-xs" style={{ color: "#78716c" }}>Deixe vazio para usar o nome da imobiliária.</span>
              </label>
              <label className="block text-sm">
                Seu nome
                <input required maxLength={80} value={f.diretorNome} onChange={campo("diretorNome")} className={input} style={estilo} />
              </label>
              <label className="block text-sm">
                Seu e-mail
                <input required type="email" maxLength={160} value={f.diretorEmail} onChange={campo("diretorEmail")} className={input} style={estilo} />
                <span className="text-xs" style={{ color: "#78716c" }}>Vira o seu login. A senha do primeiro acesso chega nele.</span>
              </label>
              {erro && (
                <p role="alert" className="text-sm rounded-xl px-3 py-2" style={{ background: "rgba(248,113,113,.12)", color: "#f87171" }}>
                  {erro}
                </p>
              )}
              <button type="submit" disabled={estado === "enviando" || !assinatura} className="w-full rounded-xl px-5 py-3.5 font-bold text-base disabled:opacity-60" style={{ background: Y, color: "#0a0a0a" }}>
                {estado === "enviando" ? "Criando…" : "Criar meu Kayser One"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
