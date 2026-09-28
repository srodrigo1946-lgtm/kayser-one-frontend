import type { Metadata } from "next";

// Página PÚBLICA (sem login): exigida pelo Meta para publicar o app que recebe os
// leads de formulário (Facebook/Instagram). Também traz as instruções de exclusão de dados.
export const metadata: Metadata = {
  title: "Política de Privacidade | Kayser One",
  description: "Como o Kayser One trata os dados pessoais de clientes e leads.",
};

const ATUALIZADO = "28 de setembro de 2026";

function Secao({ id, titulo, children }: { id?: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-xl font-semibold mb-3" style={{ color: "#facc15" }}>{titulo}</h2>
      <div className="space-y-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#0b0b0b" }}>
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">Política de Privacidade</h1>
        <p className="mb-10 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Kayser One — CRM imobiliário · Última atualização: {ATUALIZADO}
        </p>

        <Secao titulo="1. Quem somos">
          <p>
            O Kayser One é uma plataforma de gestão comercial (CRM) usada por imobiliárias e corretores para
            atender pessoas interessadas em imóveis. Esta política explica quais dados pessoais tratamos, por
            que tratamos e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <p>Quando você demonstra interesse em um imóvel — por exemplo, preenchendo um formulário de anúncio no Facebook ou Instagram, ou nos chamando no WhatsApp — podemos receber:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>nome, telefone/WhatsApp e e-mail;</li>
            <li>as respostas que você deu no formulário (por exemplo, empreendimento de interesse, renda, cidade);</li>
            <li>as mensagens trocadas com a nossa equipe e com o nosso assistente virtual;</li>
            <li>informações do anúncio pelo qual você chegou (campanha e plataforma).</li>
          </ul>
        </Secao>

        <Secao titulo="3. Para que usamos">
          <ul className="list-disc pl-6 space-y-1">
            <li>entrar em contato sobre o imóvel que você pediu informações;</li>
            <li>tirar dúvidas, enviar materiais, valores e fotos dos empreendimentos;</li>
            <li>agendar visitas ao stand de vendas;</li>
            <li>acompanhar o seu atendimento até a conclusão.</li>
          </ul>
          <p>A base legal é o seu consentimento (ao enviar o formulário ou nos chamar) e a execução de procedimentos preliminares ao contrato que você solicitou.</p>
        </Secao>

        <Secao titulo="4. Com quem compartilhamos">
          <p>
            Os dados ficam restritos à equipe comercial responsável pelo seu atendimento. Não vendemos dados pessoais.
            Usamos serviços de tecnologia para operar a plataforma (hospedagem, banco de dados, mensageria e
            inteligência artificial), que tratam os dados apenas para prestar esse serviço.
          </p>
        </Secao>

        <Secao titulo="5. Dados recebidos do Facebook e Instagram (Meta)">
          <p>
            Quando você preenche um formulário de anúncio da Meta, recebemos apenas as informações daquele formulário
            (as que você viu e enviou). Elas são usadas exclusivamente para o seu atendimento, conforme esta política
            e as políticas da plataforma da Meta.
          </p>
        </Secao>

        <Secao titulo="6. Por quanto tempo guardamos">
          <p>Guardamos os dados enquanto houver atendimento em andamento e pelo prazo necessário para cumprir obrigações legais. Depois disso, os dados são excluídos ou anonimizados.</p>
        </Secao>

        <Secao titulo="7. Seus direitos">
          <p>Você pode, a qualquer momento, pedir: confirmação e acesso aos seus dados, correção, exclusão, revogação do consentimento e informações sobre o compartilhamento.</p>
        </Secao>

        <Secao id="exclusao" titulo="8. Como pedir a exclusão dos seus dados">
          <p>Para excluir os seus dados do Kayser One:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>responda &quot;EXCLUIR MEUS DADOS&quot; na conversa de WhatsApp em que falamos com você; <strong>ou</strong></li>
            <li>
              acesse <a href="https://www.kayserone.com.br/login" className="underline" style={{ color: "#facc15" }}>kayserone.com.br/login</a>{" "}
              e use a opção <strong>&quot;Suporte ou reclamação&quot;</strong>, informando o seu nome e telefone.
            </li>
          </ol>
          <p>O pedido é atendido em até 15 dias, e confirmamos pelo mesmo canal.</p>
        </Secao>

        <Secao titulo="9. Segurança">
          <p>Os dados são protegidos com acesso restrito por usuário e senha, controle de permissões por equipe e conexão criptografada.</p>
        </Secao>

        <Secao titulo="10. Contato">
          <p>
            Dúvidas sobre esta política ou sobre os seus dados: use a opção <strong>&quot;Suporte ou reclamação&quot;</strong> em{" "}
            <a href="https://www.kayserone.com.br/login" className="underline" style={{ color: "#facc15" }}>kayserone.com.br/login</a>.
          </p>
        </Secao>
      </article>
    </main>
  );
}
