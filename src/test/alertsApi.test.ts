import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockChannel = vi.fn();
const mockOn = vi.fn();
const mockSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

describe("alertsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockNeq.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockReturnThis();
    mockRange.mockReturnThis();
    mockSingle.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockChannel.mockReturnThis();
    mockOn.mockReturnThis();
    mockSubscribe.mockReturnThis();
  });

  it("fetchAlerts calls Supabase with correct params", async () => {
    const mockData = [
      { id: "1", status: "Pendente", tipo: "Assalto", users: { nome: "João", telefone: "123" }, created_at: "2024-01-01", latitude: -8.838, longitude: 13.234 },
    ];
    mockSelect.mockResolvedValue({ data: mockData, error: null });

    const { fetchAlerts } = await import("@/lib/alertsApi");
    const result = await fetchAlerts();

    expect(mockFrom).toHaveBeenCalledWith("occurrences");
    expect(mockNeq).toHaveBeenCalledWith("status", "Finalizado");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("João");
  });

  it("fetchAlerts handles empty response", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const { fetchAlerts } = await import("@/lib/alertsApi");
    const result = await fetchAlerts();

    expect(result).toHaveLength(0);
  });

  it("updateAlertStatus calls Supabase update", async () => {
    mockUpdate.mockResolvedValue({ error: null });

    const { updateAlertStatus } = await import("@/lib/alertsApi");
    await updateAlertStatus("occ-1", "Despachado");

    expect(mockFrom).toHaveBeenCalledWith("occurrences");
    expect(mockUpdate).toHaveBeenCalledWith({ status: "Despachado" });
    expect(mockEq).toHaveBeenCalledWith("id", "occ-1");
  });

  it("findClosestAgent returns the nearest agent", async () => {
    const agents = [
      { id: "a1", name: "Agente 1", latitude: -8.838, longitude: 13.234, status: "patrulha" },
      { id: "a2", name: "Agente 2", latitude: -8.850, longitude: 13.240, status: "patrulha" },
    ];
    mockSelect.mockResolvedValue({ data: [
      { agent_id: "a1", latitude: -8.838, longitude: 13.234, police_agents: { nome: "Agente 1", codigo: "AG-001" } },
      { agent_id: "a2", latitude: -8.850, longitude: 13.240, police_agents: { nome: "Agente 2", codigo: "AG-002" } },
    ], error: null });

    const { findClosestAgent } = await import("@/lib/alertsApi");
    const result = await findClosestAgent(-8.838, 13.234);

    expect(result).not.toBeNull();
    expect(result!.agent.name).toBe("Agente 1");
  });

  it("findClosestAgent returns null when no agents", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const { findClosestAgent } = await import("@/lib/alertsApi");
    const result = await findClosestAgent(-8.838, 13.234);

    expect(result).toBeNull();
  });
});
