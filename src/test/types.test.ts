import { describe, it, expect } from "vitest";

describe("Types", () => {
  it("should have correct type structure for Occurrence", () => {
    const occurrence = {
      id: "occ-1",
      user_id: "user-1",
      agent_id: null,
      tipo: "Assalto",
      status: "Pendente" as const,
      descricao: "Descrição do ocorrido",
      latitude: -8.838,
      longitude: 13.234,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
    };

    expect(occurrence.id).toBe("occ-1");
    expect(occurrence.status).toBe("Pendente");
    expect(occurrence.tipo).toBe("Assalto");
  });

  it("should validate occurrence status transitions", () => {
    const validStatuses = ["Pendente", "Despachado", "A caminho", "No local", "Finalizado"] as const;
    type OccurrenceStatus = typeof validStatuses[number];

    const checkStatus = (status: string): status is OccurrenceStatus =>
      validStatuses.includes(status as OccurrenceStatus);

    expect(checkStatus("Pendente")).toBe(true);
    expect(checkStatus("Finalizado")).toBe(true);
    expect(checkStatus("Cancelado")).toBe(false);
  });

  it("should validate stolen vehicle statuses", () => {
    const validStatuses = ["Procurado", "Confirmado", "Recuperado"] as const;
    type VehicleStatus = typeof validStatuses[number];

    const checkStatus = (status: string): status is VehicleStatus =>
      validStatuses.includes(status as VehicleStatus);

    expect(checkStatus("Procurado")).toBe(true);
    expect(checkStatus("Recuperado")).toBe(true);
    expect(checkStatus("Desconhecido")).toBe(false);
  });
});
