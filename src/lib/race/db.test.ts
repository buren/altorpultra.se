import { describe, it, expect } from "vitest";
import { registerLap, checkInRunner } from "./db";
import type { Runner, Lap } from "./types";

type Update = { table: string; values: Record<string, unknown>; eqId?: string };

function makeRunner(overrides: Partial<Runner> = {}): Runner {
  return {
    id: "r1",
    bib: 1,
    name: "Test Runner",
    gender: "male",
    notes: null,
    edition_year: 2026,
    stopped_at: null,
    checked_in_at: null,
    ...overrides,
  };
}

interface MockState {
  runners: Runner[];
  laps: Lap[];
  insertedLap: Lap | null;
  updates: Update[];
}

function buildMockClient(initial: { runners: Runner[]; laps?: Lap[] }): {
  client: any;
  state: MockState;
} {
  const state: MockState = {
    runners: [...initial.runners],
    laps: initial.laps ? [...initial.laps] : [],
    insertedLap: null,
    updates: [],
  };

  function from(table: string) {
    const pendingFilters: Record<string, unknown> = {};
    let pendingUpdate: Record<string, unknown> | null = null;
    let pendingInsert: Record<string, unknown> | null = null;
    let mode: "select" | "update" | "insert" | "delete" = "select";

    const builder: any = {
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        pendingFilters[col] = val;
        return builder;
      },
      insert(values: Record<string, unknown>) {
        mode = "insert";
        pendingInsert = values;
        return builder;
      },
      update(values: Record<string, unknown>) {
        mode = "update";
        pendingUpdate = values;
        return builder;
      },
      single() {
        if (mode === "insert" && table === "laps" && pendingInsert) {
          const newLap: Lap = {
            id: `lap-${state.laps.length + 1}`,
            runner_id: pendingInsert.runner_id as string,
            lap_number: pendingInsert.lap_number as number,
            timestamp: (pendingInsert.timestamp as string) ?? new Date().toISOString(),
          };
          state.laps.push(newLap);
          state.insertedLap = newLap;
          return Promise.resolve({ data: newLap, error: null });
        }
        if (mode === "update" && pendingUpdate) {
          const id = pendingFilters.id as string;
          state.updates.push({ table, values: pendingUpdate, eqId: id });
          if (table === "runners") {
            const idx = state.runners.findIndex((r) => r.id === id);
            if (idx >= 0) {
              state.runners[idx] = { ...state.runners[idx], ...pendingUpdate } as Runner;
              return Promise.resolve({ data: state.runners[idx], error: null });
            }
          }
          return Promise.resolve({ data: null, error: null });
        }
        // select single
        if (table === "runners") {
          const found = state.runners.find((r) =>
            Object.entries(pendingFilters).every(([k, v]) => (r as any)[k] === v)
          );
          return Promise.resolve(
            found ? { data: found, error: null } : { data: null, error: { message: "not found" } }
          );
        }
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve: (v: { data: any; error: any }) => void) {
        // List query (no .single()) — used for fetching laps
        if (table === "laps" && mode === "select") {
          const filtered = state.laps.filter((l) =>
            Object.entries(pendingFilters).every(([k, v]) => (l as any)[k] === v)
          );
          resolve({ data: filtered, error: null });
        } else {
          resolve({ data: [], error: null });
        }
      },
    };

    return builder;
  }

  return { client: { from }, state };
}

describe("registerLap", () => {
  it("auto-fills checked_in_at when runner has not checked in yet", async () => {
    const runner = makeRunner({ checked_in_at: null });
    const { client, state } = buildMockClient({ runners: [runner] });

    const { runner: returned } = await registerLap(client, 1, 2026);

    expect(returned.checked_in_at).not.toBeNull();
    const updates = state.updates.filter((u) => u.table === "runners");
    const checkInUpdate = updates.find((u) => "checked_in_at" in u.values);
    expect(checkInUpdate).toBeTruthy();
    expect(checkInUpdate?.values.checked_in_at).toBeTruthy();
  });

  it("uses the lap timestamp as checked_in_at", async () => {
    const runner = makeRunner({ checked_in_at: null });
    const { client, state } = buildMockClient({ runners: [runner] });

    await registerLap(client, 1, 2026);

    const lap = state.insertedLap!;
    const checkInUpdate = state.updates
      .filter((u) => u.table === "runners")
      .find((u) => "checked_in_at" in u.values);
    expect(checkInUpdate?.values.checked_in_at).toBe(lap.timestamp);
  });

  it("does NOT overwrite checked_in_at when already set", async () => {
    const existing = "2026-05-09T10:00:00.000Z";
    const runner = makeRunner({ checked_in_at: existing });
    const { client, state } = buildMockClient({ runners: [runner] });

    await registerLap(client, 1, 2026);

    const checkInUpdate = state.updates
      .filter((u) => u.table === "runners")
      .find((u) => "checked_in_at" in u.values);
    expect(checkInUpdate).toBeUndefined();
  });
});

describe("checkInRunner", () => {
  it("sets checked_in_at to now when checking in", async () => {
    const runner = makeRunner({ checked_in_at: null });
    const { client, state } = buildMockClient({ runners: [runner] });
    const before = Date.now();

    const result = await checkInRunner(client, "r1", true);

    expect(result.checked_in_at).toBeTruthy();
    const ts = Date.parse(result.checked_in_at!);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].table).toBe("runners");
    expect(state.updates[0].eqId).toBe("r1");
  });

  it("clears checked_in_at when un-checking in", async () => {
    const runner = makeRunner({ checked_in_at: "2026-05-09T10:00:00.000Z" });
    const { client, state } = buildMockClient({ runners: [runner] });

    const result = await checkInRunner(client, "r1", false);

    expect(result.checked_in_at).toBeNull();
    expect(state.updates[0].values.checked_in_at).toBeNull();
  });
});
