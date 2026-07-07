export type UserRole = "diretor" | "superintendente" | "gerente_geral" | "gerente" | "corretor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  whatsapp?: string;
  active: boolean;
  firstLogin: boolean;
  createdAt: string;
}

export type LeadStatus =
  | "novo_lead"
  | "primeiro_contato"
  | "em_atendimento"
  | "documentacao"
  | "agendamento"
  | "visita_agendada"
  | "visita_realizada"
  | "simulacao"
  | "subida_pasta"
  | "aprovacao"
  | "reprovacao"
  | "venda_ganha"
  | "venda_perdida";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  empreendimento?: string;
  propertyId?: string | null;
  origem?: string;
  campanha?: string;
  responsavel?: { id: string; name: string } | null;
  responsavelId?: string;
  cidade?: string;
  renda?: number;
  fgts?: number;
  entrada?: number;
  observacoes?: string;
  status: LeadStatus;
  score?: number;
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
}

export interface KanbanColumn {
  id: string; // chave/status da coluna (pode ser customizada)
  columnId?: string; // id no banco (para editar/remover)
  title: string;
  emoji: string;
  color: string;
  leads: Lead[];
}

export interface DashboardMetrics {
  leadsHoje: number;
  leadsSemana: number;
  leadsMes: number;
  visitas: number;
  vendas: number;
  conversao: number;
  tempoMedioAtendimento: number;
  leadsSemAtendimento: number;
  clientesSemContato: number;
}

export interface SaleData {
  month: string;
  leads: number;
  vendas: number;
  visitas: number;
}

export interface WhatsAppSession {
  id: string;
  userId: string;
  userName: string;
  status: "connected" | "disconnected" | "connecting";
  phone?: string;
  qrCode?: string;
}

export interface Message {
  id: string;
  leadId: string;
  content: string;
  type: "text" | "image" | "audio" | "document";
  direction: "in" | "out";
  timestamp: string;
  isAI?: boolean;
}

export interface Conversation {
  id: string;
  lead: Lead;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}
