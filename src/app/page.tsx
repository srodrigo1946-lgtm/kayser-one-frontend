import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FalarComCeo } from "@/components/vendas/falar-com-ceo";

// Página de vendas do Kayser One (kayserone.com.br). Texto: Rebeca (marketing), 11/10/2026.
// Subdomínio de cliente (imobx.kayserone.com.br) vai direto pro login da imobiliária.

export const metadata: Metadata = {
  title: "Kayser One | CRM para imobiliárias de lançamento",
  description:
    "IA que atende seu cliente no WhatsApp 24h, lead em segundos só para quem está no stand, plantão com check-in por GPS e gestão completa — com a sua marca.",
};

const WHATS =
  "https://wa.me/5521998236607?text=" +
  encodeURIComponent("Olá! Vi o site do Kayser One e quero agendar uma demonstração.");

const Y = "#facc15";

function BotaoWhats({ grande = false }: { grande?: boolean }) {
  return (
    <a
      href={WHATS}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-transform hover:scale-[1.03] ${grande ? "px-8 py-4 text-lg" : "px-6 py-3 text-base"}`}
      style={{ background: "#22c55e", color: "#ffffff", boxShadow: "0 10px 40px rgba(34,197,94,.35)" }}
    >
      <svg width={grande ? 24 : 20} height={grande ? 24 : 20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.81-1.32l-.34-.2-3.58.94.96-3.49-.23-.36a9.420 9.420 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.45-9.44 9.45m8.04-17.49A11.3 11.3 0 0 0 12.05.68C5.78.68.68 5.78.68 12.05c0 2 .52 3.96 1.52 5.69L.58 23.32l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.890-3.34-8.04" />
      </svg>
      Falar no WhatsApp
    </a>
  );
}

const dores = [
  ["Trava bem na hora do lead", "O cliente chama e o sistema não abre. Quando abre, ele já falou com outra imobiliária."],
  ["A notificação não chega", "O lead entrou, mas o corretor só fica sabendo quando o gestor avisa."],
  ["Atualizou… e quebrou tudo", "Cada versão nova do app muda o que funcionava. A equipe perde dias."],
];

const recursos = [
  ["🤖", "IA que atende no WhatsApp 24h", "Responde o cliente na hora, tira dúvidas pela sua base, entende áudio, pede nome e e-mail e agenda a visita. Depois passa para o corretor."],
  ["⚡", "Lead em segundos, para quem está no stand", "Facebook, Instagram e WhatsApp caem direto na fila de plantão e vão para o próximo corretor, com aviso em tela cheia."],
  ["📍", "Plantão com check-in por GPS", "Só entra na fila quem fez check-in no stand. Saiu do stand, sai da fila. Bloqueios por gestor e sorteio automático da ordem."],
  ["🦉", "Repique noturno", "Lead parado não morre: volta para os corretores ativos pegarem, com limite por dia."],
  ["🔁", "Reengajamento automático", "Clientes que disseram “sem interesse” recebem uma nova mensagem com cadência segura. Quem responde que quer, volta para a fila."],
  ["📊", "O gestor vê tudo", "Kanban, conversas ao vivo por equipe, ranking, metas, VGV, custo por lead e relatórios — cada cargo vê só o seu time."],
];

// Planos (planilha do Rodrigo, 12/10/2026). `link` = link de assinatura do Mercado Pago
// (o Rodrigo manda, colar aqui). Sem link, "Assinar" abre o WhatsApp com o plano.
const PLANOS: { nome: string; preco: number; usuarios: number; para: string; destaque?: boolean; link?: string }[] = [
  { nome: "Corretor", preco: 30, usuarios: 1, para: "Corretor autônomo", link: "https://mpago.la/1fqCwQo" },
  { nome: "Gerente de Vendas", preco: 110, usuarios: 16, para: "Gerente + equipe", link: "https://mpago.la/2NxVJas" },
  { nome: "Gerente Geral", preco: 330, usuarios: 57, para: "Várias equipes", destaque: true, link: "https://mpago.la/2mn66hG" },
  { nome: "Superintendente", preco: 530, usuarios: 120, para: "Regional", link: "https://mpago.la/1TBCxkA" },
  { nome: "Diretor completo", preco: 750, usuarios: 250, para: "Imobiliária inteira", link: "https://mpago.la/1HFPF2m" },
];
const assinar = (p: (typeof PLANOS)[number]) =>
  p.link ||
  "https://wa.me/5521998236607?text=" +
    encodeURIComponent(`Olá! Quero assinar o plano ${p.nome} do Kayser One (R$ ${p.preco}/mês, até ${p.usuarios} usuário${p.usuarios > 1 ? "s" : ""}).`);
const passos = [
  ["1", "Fale com a gente", "Um papo rápido no WhatsApp para entender sua operação."],
  ["2", "Demonstração", "Mostramos o sistema funcionando com o seu fluxo de lançamento."],
  ["3", "Sua equipe no ar", "Configuramos com você: marca, stands, equipe e WhatsApp."],
];

export default async function Home() {
  // Subdomínio de cliente = login da imobiliária (a página de vendas é só da Kayser).
  // `x-kayser-host`: o repassador do Cloudflare manda o subdomínio original (imobx.kayserone.com.br).
  const h = await headers();
  const host = (h.get("x-kayser-host") || h.get("host") || "").toLowerCase().split(":")[0];
  if (/^[a-z0-9-]+\.kayserone\.com\.br$/.test(host) && !host.startsWith("www.")) redirect("/login");

  return (
    <main className="min-h-screen" style={{ background: "#0a0a0a", color: "#f5f5f4" }}>
      {/* Topo */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center border-2" style={{ borderColor: Y, background: "#0a0a0a" }} aria-label="Kayser One">
            <b className="text-lg leading-none" style={{ color: Y }}>K1</b>
            <i className="block w-5 h-[3px] mt-0.5 rounded" style={{ background: Y }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="#planos" className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ color: "#f5f5f4" }}>
            Planos
          </a>
          <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "rgba(250,204,21,.4)", color: Y }}>
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24 text-center">
        <p className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6" style={{ background: "rgba(250,204,21,.12)", color: Y }}>
          CRM com IA para imobiliárias de lançamento
        </p>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Nenhum lead esperando.
          <br />
          <span style={{ color: Y }}>Nenhum plantão no papel.</span>
        </h1>
        <p className="mt-6 text-base sm:text-xl max-w-2xl mx-auto" style={{ color: "#a8a29e" }}>
          A IA atende seu cliente no WhatsApp em segundos, o lead vai só para quem está no stand e o gestor vê tudo — com a sua marca.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <BotaoWhats grande />
          <a href="#planos" className="px-6 py-4 rounded-2xl text-base font-semibold border" style={{ color: Y, borderColor: "rgba(250,204,21,.4)" }}>
            Ver planos ↓
          </a>
        </div>
      </section>

      {/* Vídeo de apresentação (51s, vertical) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 flex flex-col items-center">
        <div
          className="w-full max-w-[340px] rounded-[44px] p-3 border-4"
          style={{ borderColor: "#2a2a2a", background: "#0f0f0f", boxShadow: "0 30px 90px rgba(0,0,0,.6), 0 0 70px rgba(250,204,21,.18)" }}
        >
          <video
            className="w-full rounded-[32px] block"
            style={{ aspectRatio: "9 / 16", background: "#0a0a0a" }}
            src="/video/kayser-one-vendas.mp4"
            poster="/video/kayser-one-vendas-capa.jpg"
            controls
            playsInline
            preload="metadata"
          />
        </div>
        <p className="mt-4 text-sm" style={{ color: "#a8a29e" }}>▶ Veja o Kayser One em 50 segundos</p>
      </section>

      {/* Dores */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center">
          Seu CRM <span style={{ color: Y }}>te deixa na mão?</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {dores.map(([t, d]) => (
            <div key={t} className="rounded-2xl p-6 border" style={{ background: "rgba(239,68,68,.06)", borderColor: "rgba(239,68,68,.3)" }}>
              <div className="text-2xl mb-2" style={{ color: "#ef4444" }}>✕</div>
              <h3 className="font-bold text-lg">{t}</h3>
              <p className="mt-2 text-sm" style={{ color: "#a8a29e" }}>{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-lg font-semibold">
          O Kayser One roda no navegador e no celular, <span style={{ color: Y }}>sem depender de loja nem de “atualizar o app”</span>.
        </p>
      </section>

      {/* Recursos */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center">
          Feito para o <span style={{ color: Y }}>dia a dia do lançamento</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map(([i, t, d]) => (
            <div key={t} className="rounded-2xl p-6 border" style={{ background: "#141414", borderColor: "rgba(250,204,21,.18)" }}>
              <div className="text-3xl">{i}</div>
              <h3 className="mt-3 font-bold text-lg">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#a8a29e" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipe */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid gap-6 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            A equipe também tem <span style={{ color: Y }}>uma IA só dela</span>
          </h2>
          <p className="mt-4 text-base" style={{ color: "#a8a29e" }}>
            A <b style={{ color: "#f5f5f4" }}>One</b> atende corretores e gestores num WhatsApp próprio: resolve acesso ao sistema, consulta unidades disponíveis,
            simula pagamento (tabela direta, investidor e financiamento) e manda o book do empreendimento.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>📲 App instalável no celular, sem loja</li>
            <li>💬 Conversas ao vivo com o cliente, por equipe</li>
            <li>🔔 Aviso de lead novo na hora</li>
          </ul>
        </div>
        <div className="rounded-3xl p-6 border" style={{ background: "#141414", borderColor: "rgba(250,204,21,.25)" }}>
          <div className="rounded-2xl px-4 py-3 text-sm max-w-[85%]" style={{ background: "#262626" }}>Qual o valor da unidade 1203 e a parcela na tabela direta?</div>
          <div className="rounded-2xl px-4 py-3 text-sm max-w-[85%] ml-auto mt-3 font-semibold" style={{ background: Y, color: "#0a0a0a" }}>
            <span className="block text-xs opacity-70">🤖 One</span>
            Te mando a simulação nas duas regras agora, com o ato, as parcelas da obra e o pós-obra. 📊
          </div>
        </div>
      </section>

      {/* Marca própria */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold">
          Com a <span style={{ color: Y }}>sua marca</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "#a8a29e" }}>
          Seu nome, suas cores e seu logo no sistema, na tela de entrada e no app do celular — num endereço próprio.
        </p>
        <div className="mt-6 inline-block px-5 py-3 rounded-2xl font-bold break-all" style={{ background: "#141414", color: Y, border: "1px solid rgba(250,204,21,.3)" }}>
          suaimobiliaria.kayserone.com.br
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center">
          Planos <span style={{ color: Y }}>para o tamanho da sua equipe</span>
        </h2>
        <p className="mt-3 text-center text-sm sm:text-base" style={{ color: "#a8a29e" }}>
          Todos com tudo incluso: IA no WhatsApp, fila de plantão com GPS, Corujão, reengajamento, app no celular e a sua marca.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANOS.map((p) => (
            <div
              key={p.nome}
              tabIndex={0}
              className="group rounded-2xl p-6 border flex flex-col outline-none"
              style={{ background: p.destaque ? "rgba(250,204,21,.07)" : "#141414", borderColor: p.destaque ? Y : "rgba(250,204,21,.18)" }}
            >
              {p.destaque && (
                <span className="self-start text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: Y, color: "#0a0a0a" }}>
                  Mais escolhido
                </span>
              )}
              <h3 className="font-bold text-xl">{p.nome}</h3>
              <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>{p.para}</p>
              {/* Preço oculto (borrado) até passar o mouse / tocar no card — pedido do Rodrigo. */}
              <div className="mt-4 relative">
                <div className="blur-md select-none transition duration-300 group-hover:blur-none group-focus:blur-none group-focus-within:blur-none" aria-label={`R$ ${p.preco} por mês`}>
                  <span className="text-4xl font-extrabold" style={{ color: Y }}>R$ {p.preco}</span>
                  <span className="text-sm" style={{ color: "#a8a29e" }}>/mês</span>
                </div>
                <span className="absolute inset-0 flex items-center text-xs font-semibold transition-opacity duration-300 group-hover:opacity-0 group-focus:opacity-0 group-focus-within:opacity-0 pointer-events-none" style={{ color: "#f5f5f4" }}>
                  👆 Passe o mouse para ver o valor
                </span>
              </div>
              <p className="mt-2 font-semibold">
                até {p.usuarios} usuário{p.usuarios > 1 ? "s" : ""}
              </p>
              <a
                href={assinar(p)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-center rounded-xl px-4 py-3 font-bold transition-transform hover:scale-[1.02]"
                style={p.destaque ? { background: Y, color: "#0a0a0a" } : { background: "#22c55e", color: "#ffffff" }}
              >
                Assinar
              </a>
            </div>
          ))}
          <div className="rounded-2xl p-6 border flex flex-col" style={{ background: "#141414", borderColor: "rgba(250,204,21,.18)" }}>
            <h3 className="font-bold text-xl">Rede / Empresa</h3>
            <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>Acima de 250 usuários</p>
            <div className="mt-4 text-2xl font-extrabold" style={{ color: Y }}>Sob medida</div>
            <p className="mt-2 text-sm" style={{ color: "#a8a29e" }}>
              Reunião personalizada com o CEO para entender o seu negócio.
            </p>
            <FalarComCeo />
            <p className="mt-2 text-xs text-center" style={{ color: "#78716c" }}>contato@kayserone.com.br</p>
          </div>
        </div>
      </section>

      {/* Como começar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Como começar</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {passos.map(([n, t, d]) => (
            <div key={n} className="rounded-2xl p-6 border text-center" style={{ background: "#141414", borderColor: "rgba(250,204,21,.18)" }}>
              <div className="mx-auto w-10 h-10 rounded-full flex items-center justify-center font-extrabold" style={{ background: Y, color: "#0a0a0a" }}>{n}</div>
              <h3 className="mt-3 font-bold text-lg">{t}</h3>
              <p className="mt-2 text-sm" style={{ color: "#a8a29e" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="rounded-3xl px-6 py-12 border" style={{ background: "radial-gradient(600px 300px at 50% 0%, rgba(250,204,21,.15), #111 70%)", borderColor: "rgba(250,204,21,.3)" }}>
          <h2 className="text-3xl sm:text-5xl font-extrabold">
            Venda mais <span style={{ color: Y }}>lançamentos</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg" style={{ color: "#a8a29e" }}>Agende uma demonstração pelo WhatsApp.</p>
          <div className="mt-8">
            <BotaoWhats grande />
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-xs flex flex-col sm:flex-row gap-3 justify-between" style={{ color: "#78716c" }}>
        <span>© {new Date().getFullYear()} Kayser One · CNPJ 53.286.988/0001-63</span>
        <span className="flex gap-4">
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/login">Entrar</Link>
        </span>
      </footer>
    </main>
  );
}
