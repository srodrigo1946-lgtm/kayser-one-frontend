"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  useProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  type Property,
  type PropertyInput,
} from "@/hooks/use-properties";
import {
  Search,
  Plus,
  Building,
  MapPin,
  Trash2,
  Pencil,
  X,
  ImagePlus,
  Loader2,
  Home,
  Ruler,
  Layers,
  ExternalLink,
  CalendarClock,
} from "lucide-react";

const typeLabels: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  lote: "Lote / Terreno",
  comercial: "Comercial",
  sala: "Sala Comercial",
  cobertura: "Cobertura",
};

const statusLabels: Record<string, string> = {
  lancamento: "Lançamento",
  em_obra: "Em Obra",
  pronto: "Pronto",
  entregue: "Entregue",
};

const statusColors: Record<string, string> = {
  lancamento: "#3b82f6",
  em_obra: "#f59e0b",
  pronto: "#22c55e",
  entregue: "#8b5cf6",
};

const NUMERIC_FIELDS = [
  "vgv",
  "totalUnits",
  "availableUnits",
  "priceMin",
  "priceMax",
  "areaMin",
  "areaMax",
  "bedrooms",
  "parkingSpots",
];

// Redimensiona a imagem no navegador e retorna um data URI (JPEG).
function fileToDataUrl(file: File, max = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          const scale = Math.min(max / width, max / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// imageUrl é usado tanto como "capa" (imagem) quanto como link externo do site.
// Só serve de imagem se parecer uma imagem — senão vira só o link "Ver no site".
function isImageUrl(u?: string | null): boolean {
  return !!u && (u.startsWith("data:image") || /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i.test(u));
}

function cover(p: Property): string | null {
  return (p.photos && p.photos[0]) || (isImageUrl(p.imageUrl) ? (p.imageUrl as string) : null);
}

export default function ImoveisPage() {
  const [search, setSearch] = useState("");
  const { data: properties, isLoading } = useProperties(search);
  const deleteP = useDeleteProperty();
  const user = getStoredUser();
  const isManager = !!user && user.role !== "corretor";

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [feedback, setFeedback] = useState("");

  const openNew = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (p: Property) => {
    setEditTarget(p);
    setFormOpen(true);
  };

  const handleDelete = async (p: Property) => {
    if (!window.confirm(`Remover o imóvel "${p.name}"?`)) return;
    try {
      await deleteP.mutateAsync(p.id);
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao remover."));
    }
  };

  const list = properties ?? [];

  return (
    <div>
      <Header title="Imóveis" subtitle="Empreendimentos e imóveis — base para os leads" />

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <Search size={16} style={{ color: "var(--muted-foreground)" }} />
            <input
              placeholder="Buscar por nome, cidade, bairro ou construtora..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--foreground)" }}
            />
          </div>
          {isManager && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Plus size={16} /> Novo imóvel
            </button>
          )}
        </div>

        {feedback && (
          <div className="text-sm p-3 rounded-xl" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
            {feedback}
          </div>
        )}

        {isLoading && (
          <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando imóveis...</div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="py-16 text-center rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Nenhum imóvel cadastrado ainda.{isManager ? " Clique em “Novo imóvel”." : ""}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p) => {
            const img = cover(p);
            return (
              <div key={p.id} className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="h-40 relative" style={{ background: "linear-gradient(135deg, var(--primary), #8b5cf6)" }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building size={40} color="white" style={{ opacity: 0.6 }} />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium" style={{ background: statusColors[p.status] || "#3b82f6", color: "white" }}>
                    {statusLabels[p.status] || p.status}
                  </span>
                  {(p.photos?.length ?? 0) > 1 && (
                    <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.55)", color: "white" }}>
                      {p.photos!.length} fotos
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {typeLabels[p.type] || p.type}{p.construtora ? ` · ${p.construtora}` : ""}
                      </div>
                    </div>
                    {isManager && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "var(--muted-foreground)" }} title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#ef4444" }} title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {(p.cidade || p.bairro) && (
                    <div className="flex items-center gap-1 text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                      <MapPin size={12} /> {[p.bairro, p.cidade, p.estado].filter(Boolean).join(", ")}
                    </div>
                  )}

                  {p.deliveryDate && (
                    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      <CalendarClock size={12} /> Entrega: {p.deliveryDate}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {p.vgv ? <Info label="VGV" value={formatCurrency(p.vgv)} /> : null}
                    {(p.priceMin || p.priceMax) ? (
                      <Info label="Preço" value={`${p.priceMin ? formatCurrency(p.priceMin) : "—"}${p.priceMax ? ` a ${formatCurrency(p.priceMax)}` : ""}`} />
                    ) : null}
                    {(p.totalUnits ?? 0) > 0 ? <Info label="Unidades" value={`${p.availableUnits ?? 0} disp. / ${p.totalUnits}`} /> : null}
                    {(p.areaMin || p.areaMax) ? <Info label="Área" value={`${p.areaMin ?? "—"}${p.areaMax ? `–${p.areaMax}` : ""} m²`} /> : null}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {p.bedrooms ? <span className="flex items-center gap-1"><Home size={12} /> {p.bedrooms} dorm.</span> : null}
                    {p.parkingSpots ? <span className="flex items-center gap-1"><Layers size={12} /> {p.parkingSpots} vaga(s)</span> : null}
                    {p.areaMin ? <span className="flex items-center gap-1"><Ruler size={12} /> {p.areaMin} m²</span> : null}
                  </div>

                  {p.imageUrl && (
                    <a
                      href={p.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mt-3 text-xs font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      <ExternalLink size={13} /> Ver no site
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {formOpen && (
        <PropertyForm
          initial={editTarget}
          onClose={() => setFormOpen(false)}
          onError={(m) => setFeedback(m)}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "var(--muted-foreground)" }}>{label}</div>
      <div className="font-medium" style={{ color: "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function PropertyForm({
  initial,
  onClose,
  onError,
}: {
  initial: Property | null;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const createP = useCreateProperty();
  const updateP = useUpdateProperty();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    const src = (initial ?? {}) as any;
    [
      "name", "type", "status", "construtora", "description",
      "address", "bairro", "cidade", "estado", "cep", "imageUrl", "deliveryDate",
      ...NUMERIC_FIELDS,
    ].forEach((k) => {
      f[k] = src[k] != null ? String(src[k]) : "";
    });
    f.type = f.type || "apartamento";
    f.status = f.status || "lancamento";
    f.amenities = (src.amenities ?? []).join(", ");
    return f;
  });
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  // Ao completar 8 dígitos no CEP, busca o endereço no ViaCEP e preenche os campos.
  const onCepChange = async (v: string) => {
    setForm((s) => ({ ...s, cep: v }));
    const digits = v.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((s) => ({
          ...s,
          address: data.logradouro || s.address,
          bairro: data.bairro || s.bairro,
          cidade: data.localidade || s.cidade,
          estado: data.uf || s.estado,
        }));
      }
    } catch {
      /* silencioso — CEP inválido ou sem internet, o usuário preenche à mão */
    } finally {
      setCepLoading(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const dataUrls = await Promise.all(Array.from(files).map((f) => fileToDataUrl(f)));
      setPhotos((prev) => [...prev, ...dataUrls].slice(0, 12));
    } catch {
      onError("Falha ao processar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = (): PropertyInput => {
    const out: any = {};
    ["name", "type", "status", "construtora", "description", "address", "bairro", "cidade", "estado", "cep", "imageUrl", "deliveryDate"].forEach((k) => {
      if (form[k] && form[k].trim()) out[k] = form[k].trim();
    });
    NUMERIC_FIELDS.forEach((k) => {
      if (form[k] !== "" && form[k] != null) out[k] = Number(form[k]);
    });
    out.amenities = (form.amenities || "").split(",").map((s) => s.trim()).filter(Boolean);
    out.photos = photos;
    return out;
  };

  const submit = async () => {
    if (!form.name.trim()) {
      onError("Informe o nome do empreendimento.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (initial) {
        await updateP.mutateAsync({ id: initial.id, ...payload });
      } else {
        await createP.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      onError(getApiErrorMessage(err, "Falha ao salvar o imóvel."));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto p-6" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
            {initial ? "Editar imóvel" : "Novo imóvel"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <Field label="Nome do empreendimento *">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Construtora">
              <input value={form.construtora} onChange={(e) => set("construtora", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Previsão de entrega">
              <input value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} placeholder="Ex: Dez/2026 ou Pronto" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
            </Field>
          </div>

          {/* Localização */}
          <div className="text-xs font-semibold pt-1" style={{ color: "var(--muted-foreground)" }}>LOCALIZAÇÃO</div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={cepLoading ? "CEP · buscando…" : "CEP"}><input value={form.cep} onChange={(e) => onCepChange(e.target.value)} placeholder="00000-000" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Cidade"><input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Estado"><input value={form.estado} onChange={(e) => set("estado", e.target.value)} maxLength={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none uppercase" style={inputStyle} /></Field>
          </div>
          <Field label="Bairro"><input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
          <Field label="Endereço"><input value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>

          {/* Comercial */}
          <div className="text-xs font-semibold pt-1" style={{ color: "var(--muted-foreground)" }}>DADOS COMERCIAIS</div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="VGV (R$)"><input type="number" value={form.vgv} onChange={(e) => set("vgv", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Unid. total"><input type="number" value={form.totalUnits} onChange={(e) => set("totalUnits", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Disponíveis"><input type="number" value={form.availableUnits} onChange={(e) => set("availableUnits", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço mín (R$)"><input type="number" value={form.priceMin} onChange={(e) => set("priceMin", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Preço máx (R$)"><input type="number" value={form.priceMax} onChange={(e) => set("priceMax", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Área mín"><input type="number" value={form.areaMin} onChange={(e) => set("areaMin", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Área máx"><input type="number" value={form.areaMax} onChange={(e) => set("areaMax", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Dorm."><input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
            <Field label="Vagas"><input type="number" value={form.parkingSpots} onChange={(e) => set("parkingSpots", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
          </div>

          <Field label="Comodidades (separe por vírgula)">
            <input value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Piscina, Academia, Salão de festas" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </Field>
          <Field label="Descrição">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={inputStyle} />
          </Field>

          {/* Fotos */}
          <div className="text-xs font-semibold pt-1" style={{ color: "var(--muted-foreground)" }}>FOTOS DO EMPREENDIMENTO</div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                  title="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-xs gap-1" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              Adicionar
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
            </label>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Até 12 fotos, redimensionadas automaticamente.</p>

          <Field label="URL de capa (opcional — link externo)">
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </Field>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancelar
            </button>
            <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {initial ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</div>
      {children}
    </div>
  );
}
