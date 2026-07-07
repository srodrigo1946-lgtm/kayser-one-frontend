"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Property {
  id: string;
  name: string;
  type: string;
  status: string;
  construtora?: string | null;
  description?: string | null;
  vgv?: number | null;
  address?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  totalUnits?: number;
  availableUnits?: number;
  priceMin?: number | null;
  priceMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  bedrooms?: number | null;
  parkingSpots?: number | null;
  amenities?: string[] | null;
  imageUrl?: string | null;
  photos?: string[] | null;
  active?: boolean;
  createdAt?: string;
}

export type PropertyInput = Partial<Omit<Property, "id" | "createdAt">>;

export function useProperties(search?: string) {
  return useQuery({
    queryKey: ["properties", search ?? ""],
    queryFn: async () => {
      const { data } = await api.get<Property[]>("/properties", {
        params: search ? { search } : {},
      });
      return data;
    },
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PropertyInput) => (await api.post("/properties", input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: PropertyInput & { id: string }) =>
      (await api.patch(`/properties/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/properties/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
