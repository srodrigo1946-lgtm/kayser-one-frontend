"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";

type Pessoa = { id: string; nome: string; bloqueado: boolean; pelaEquipe: boolean };

/** Diretor: todos os corretores pegam no Bolsão; aqui bloqueia gerente (time todo) ou corretor. */
export function BloqueioBolsao() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const { data } = useQuery({
    queryKey: ["bolsao", "bloqueios"],
    queryFn: async () => (await api.get<{ gestores: Pessoa[]; corretores: Pessoa[] }>("/bolsao/bloqueios")).data,
  });
  const trocar = useMutation({
    mutationFn: async (p: { id: string; bloqueado: boolean }) => (await api.put(`/bolsao/bloqueio/${p.id}`, { bloqueado: p.bloqueado })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bolsao", "bloqueios"] }),
    onError: (e) => setErro(getApiErrorMessage(e, "Não deu pra salvar.")),
  });
  const filtra = (l: Pessoa[] = []) => l.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const linha = (p: Pessoa, gestor: boolean) => (
    <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
      <span className="flex-1 text-sm truncate" style={{ color: "var(--foreground)" }}>
        {p.nome}
        {p.pelaEquipe && <span className="ml-2 text-xs" style={{ color: "#f87171" }}>bloqueado pelo gerente</span>}
      </span>
      <button
        onClick={() => trocar.mutate({ id: p.id, bloqueado: !p.bloqueado })}
        disabled={trocar.isPending}
        className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60"
        style={p.bloqueado ? { background: "#ef4444", color: "#fff" } : { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        title={gestor ? "Bloqueia ele e o time inteiro dele" : "Bloqueia só este corretor"}
      >
        {p.bloqueado ? "⛔ Bloqueado — liberar" : gestor ? "Bloquear o time" : "Bloquear"}
      </button>
    </div>
  );

  return (
    <div className="mt-8 p-4 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="font-semibold" style={{ color: "var(--foreground)" }}>Quem pode pegar no Bolsão</div>
      <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        Todos os corretores do K1 estão liberados. Bloquear um gerente bloqueia o time inteiro dele. Só você vê este quadro.
      </p>
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pelo nome" className="w-full mb-3 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
      {erro && <p className="text-xs mb-2" style={{ color: "#ef4444" }}>{erro}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Gerentes (bloqueia o time)</div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">{filtra(data?.gestores).map((p) => linha(p, true))}</div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Corretores</div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">{filtra(data?.corretores).map((p) => linha(p, false))}</div>
        </div>
      </div>
    </div>
  );
}
