import type { Metadata } from "next";
import Link from "next/link";

// Página PÚBLICA (sem login): regras de uso do Kayser One para imobiliárias e usuários.
export const metadata: Metadata = {
  title: "Termos de Uso | Kayser One",
  description: "Regras de uso da plataforma Kayser One.",
};

const ATUALIZADO = "3 de outubro de 2026";
const CNPJ = "53.286.988/0001-63";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3" style={{ color: "#facc15" }}>{titulo}</h2>
      <div className="space-y-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{children}</div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#0b0b0b" }}>
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">Termos de Uso</h1>
        <p className="mb-10 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Kayser One — CRM imobiliário · CNPJ {CNPJ} · Última atualização: {ATUALIZADO}
        </p>

        <Secao titulo="1. Sobre estes termos">
          <p>
            Estes Termos de Uso regulam o acesso e o uso da plataforma Kayser One, um sistema de gestão comercial (CRM)
            para imobiliárias e corretores, oferecido pela empresa inscrita no CNPJ {CNPJ} (“Kayser One”). Ao acessar ou
            usar a plataforma, você concorda com estes termos e com a{" "}
            <Link href="/privacidade" className="underline" style={{ color: "#facc15" }}>Política de Privacidade</Link>.
          </p>
        </Secao>

        <Secao titulo="2. Quem usa a plataforma">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Cliente:</strong> a imobiliária ou empresa que contrata o Kayser One.</li>
            <li><strong>Usuários:</strong> diretores, gestores e corretores cadastrados pelo Cliente.</li>
            <li>
              Cada usuário é responsável pelo sigilo do seu login e senha e por tudo o que for feito com o seu acesso.
              Não é permitido compartilhar contas.
            </li>
          </ul>
        </Secao>

        <Secao titulo="3. O que a plataforma oferece">
          <p>
            Gestão de leads e funil de vendas (Kanban), fila de distribuição com plantão e check-in por localização,
            atendimento por WhatsApp com assistente de inteligência artificial, integração com formulários de anúncios,
            agenda, metas, ranking, relatórios e demais recursos disponíveis no plano contratado. Os recursos podem
            evoluir, ser melhorados ou substituídos ao longo do tempo.
          </p>
        </Secao>

        <Secao titulo="4. Uso permitido">
          <p>O Cliente e os usuários se comprometem a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>usar a plataforma apenas para atividades lícitas de atendimento e venda de imóveis;</li>
            <li>tratar os dados dos seus clientes e leads de acordo com a LGPD (Lei nº 13.709/2018);</li>
            <li>
              respeitar as regras do WhatsApp, da Meta (Facebook/Instagram) e dos demais serviços conectados — sem spam,
              mensagens em massa para quem não pediu contato ou conteúdo enganoso;
            </li>
            <li>não tentar burlar a segurança, copiar, revender ou fazer engenharia reversa da plataforma;</li>
            <li>não falsificar localização no check-in do plantão nem usar o sistema para fraudar a distribuição de leads.</li>
          </ul>
        </Secao>

        <Secao titulo="5. Dados dos leads e responsabilidades (LGPD)">
          <p>
            O Cliente é o <strong>controlador</strong> dos dados pessoais dos seus leads e clientes: decide como e para que
            eles são usados e responde pela base legal do tratamento. O Kayser One atua como <strong>operador</strong>,
            tratando esses dados apenas para prestar o serviço, conforme as instruções do Cliente e a{" "}
            <Link href="/privacidade" className="underline" style={{ color: "#facc15" }}>Política de Privacidade</Link>.
          </p>
        </Secao>

        <Secao titulo="6. Inteligência artificial">
          <p>
            O assistente de IA responde e organiza atendimentos de forma automática a partir das informações cadastradas
            pelo Cliente (empreendimentos, valores, materiais). Respostas automáticas podem conter erros ou ficar
            desatualizadas; cabe ao Cliente manter as informações corretas e acompanhar os atendimentos. Valores,
            condições e disponibilidade de imóveis só valem quando confirmados pela equipe comercial.
          </p>
        </Secao>

        <Secao titulo="7. Planos, pagamento e cancelamento">
          <ul className="list-disc pl-6 space-y-1">
            <li>O uso é por assinatura mensal, no plano e preço combinados com o Cliente, podendo haver taxa de implantação.</li>
            <li>O pagamento pode ser feito por Pix, cartão de crédito ou boleto, conforme as opções disponíveis.</li>
            <li>
              Em caso de atraso, o Cliente é avisado; persistindo a falta de pagamento, o acesso pode ser suspenso até a
              regularização.
            </li>
            <li>
              O Cliente pode cancelar a qualquer momento, sem multa, com efeito no fim do período já pago. Valores de
              períodos já utilizados não são devolvidos.
            </li>
            <li>
              Após o cancelamento, o Cliente pode pedir a exportação dos seus dados em até 30 dias; depois disso, os dados
              podem ser excluídos.
            </li>
          </ul>
        </Secao>

        <Secao titulo="8. Disponibilidade e suporte">
          <p>
            Trabalhamos para manter a plataforma no ar o tempo todo, mas podem ocorrer interrupções por manutenção,
            atualizações ou falhas de serviços de terceiros (hospedagem, WhatsApp, Meta, provedores de IA). Sempre que
            possível, manutenções são feitas fora do horário comercial. O suporte é feito pelo canal “Suporte ou
            reclamação” na tela de login.
          </p>
        </Secao>

        <Secao titulo="9. Limitação de responsabilidade">
          <p>
            O Kayser One é uma ferramenta de apoio à venda e não garante resultados comerciais. Não nos responsabilizamos
            por decisões tomadas com base em informações cadastradas pelo Cliente, por bloqueios aplicados por terceiros
            (como o WhatsApp ou a Meta) em razão do uso feito pelo Cliente, nem por danos indiretos ou lucros cessantes.
            Quando houver responsabilidade, ela fica limitada ao valor pago pelo Cliente nos últimos 3 meses.
          </p>
        </Secao>

        <Secao titulo="10. Propriedade intelectual">
          <p>
            A plataforma, a marca Kayser One, o código, o design e os conteúdos pertencem ao Kayser One. O Cliente recebe
            uma licença de uso, pessoal e intransferível, enquanto durar a assinatura. Os dados inseridos pelo Cliente
            continuam sendo dele.
          </p>
        </Secao>

        <Secao titulo="11. Mudanças nestes termos">
          <p>
            Podemos atualizar estes termos. Mudanças importantes serão avisadas dentro da plataforma com antecedência.
            Continuar usando o Kayser One depois da atualização significa concordar com a nova versão.
          </p>
        </Secao>

        <Secao titulo="12. Foro">
          <p>
            Estes termos seguem as leis do Brasil. Fica eleito o foro da comarca do Rio de Janeiro/RJ para resolver
            qualquer questão, salvo quando a lei determinar outro.
          </p>
        </Secao>

        <p className="text-sm mt-12" style={{ color: "rgba(255,255,255,0.55)" }}>
          Dúvidas: use a opção “Suporte ou reclamação” em{" "}
          <Link href="/login" className="underline" style={{ color: "#facc15" }}>kayserone.com.br/login</Link>.
        </p>
      </article>
    </main>
  );
}
