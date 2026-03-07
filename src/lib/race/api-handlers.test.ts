import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleRegisterLap,
  handleAddRunner,
  handleDeleteLap,
  handleAuth,
  Result,
} from "./api-handlers";

// Mock db module
vi.mock("./db", () => ({
  registerLap: vi.fn(),
  addRunner: vi.fn(),
  deleteLap: vi.fn(),
  getRunners: vi.fn(),
}));

// Mock supabase server module
vi.mock("./supabase-server", () => ({
  createServerClient: () => ({}),
}));

import * as db from "./db";

const ADMIN_PASSWORD = "test-secret";

function expectError(result: Result, message: string) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe(message);
}

function expectOk(result: Result) {
  expect(result.ok).toBe(true);
  if (result.ok) return result.data;
}

describe("handleAuth", () => {
  it("returns success for correct password", async () => {
    const result = await handleAuth("test-secret", ADMIN_PASSWORD);
    expectOk(result);
  });

  it("returns error for wrong password", async () => {
    const result = await handleAuth("wrong", ADMIN_PASSWORD);
    expectError(result, "Invalid password");
  });
});

describe("handleRegisterLap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when bib is missing", async () => {
    const result = await handleRegisterLap({}, 2026, ADMIN_PASSWORD, ADMIN_PASSWORD);
    expectError(result, "Bib number is required");
  });

  it("returns error when bib is not a number", async () => {
    const result = await handleRegisterLap(
      { bib: "abc" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );
    expectError(result, "Bib number must be a positive integer");
  });

  it("returns error when not authenticated", async () => {
    const result = await handleRegisterLap(
      { bib: 1 },
      2026,
      "wrong",
      ADMIN_PASSWORD
    );
    expectError(result, "Unauthorized");
  });

  it("calls registerLap and returns result on success", async () => {
    const mockResult = {
      lap: { id: "l1", runner_id: "r1", lap_number: 3, timestamp: "2026-05-09T11:00:00Z" },
      runner: { id: "r1", bib: 42, name: "Alice", gender: "female" as const, notes: null, edition_year: 2026 },
    };
    vi.mocked(db.registerLap).mockResolvedValue(mockResult);

    const result = await handleRegisterLap(
      { bib: 42 },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );

    const data = expectOk(result);
    expect(data).toEqual(mockResult);
    expect(db.registerLap).toHaveBeenCalledWith(expect.anything(), 42, 2026);
  });

  it("returns error when runner not found", async () => {
    vi.mocked(db.registerLap).mockRejectedValue(
      new Error("No runner found with bib 99")
    );

    const result = await handleRegisterLap(
      { bib: 99 },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );
    expectError(result, "No runner found with bib 99");
  });
});

describe("handleAddRunner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for missing name", async () => {
    const result = await handleAddRunner(
      { name: "", bib: 1, gender: "male" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );
    expectError(result, "Name is required");
  });

  it("returns error for invalid gender", async () => {
    const result = await handleAddRunner(
      { name: "Alice", bib: 1, gender: "invalid" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );
    expectError(result, "Gender must be male, female, or other");
  });

  it("returns error when not authenticated", async () => {
    const result = await handleAddRunner(
      { name: "Alice", bib: 1, gender: "female" },
      2026,
      "wrong",
      ADMIN_PASSWORD
    );
    expectError(result, "Unauthorized");
  });

  it("calls addRunner and returns result on success", async () => {
    vi.mocked(db.getRunners).mockResolvedValue([]);
    const mockRunner = {
      id: "r1",
      bib: 1,
      name: "Alice",
      gender: "female" as const,
      notes: null,
      edition_year: 2026,
    };
    vi.mocked(db.addRunner).mockResolvedValue(mockRunner);

    const result = await handleAddRunner(
      { name: "Alice", bib: 1, gender: "female" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );

    const data = expectOk(result);
    expect(data).toEqual(mockRunner);
  });

  it("auto-assigns next bib number when bib is omitted", async () => {
    vi.mocked(db.getRunners).mockResolvedValue([
      { id: "r1", bib: 3, name: "Existing", gender: "male", notes: null, edition_year: 2026 },
    ]);
    vi.mocked(db.addRunner).mockImplementation(async (_sb, runner) => ({
      id: "r2",
      ...runner,
    }));

    const result = await handleAddRunner(
      { name: "New Runner", gender: "female" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );

    const data = expectOk(result);
    expect((data as any).bib).toBe(4);
  });

  it("auto-assigns bib when bib is empty string", async () => {
    vi.mocked(db.getRunners).mockResolvedValue([]);
    vi.mocked(db.addRunner).mockImplementation(async (_sb, runner) => ({
      id: "r2",
      ...runner,
    }));

    const result = await handleAddRunner(
      { name: "First Runner", bib: "", gender: "male" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );

    const data = expectOk(result);
    expect((data as any).bib).toBe(1);
  });

  it("returns error when bib number is already in use", async () => {
    vi.mocked(db.getRunners).mockResolvedValue([
      { id: "r1", bib: 5, name: "Existing", gender: "male", notes: null, edition_year: 2026 },
    ]);

    const result = await handleAddRunner(
      { name: "New Runner", bib: 5, gender: "female" },
      2026,
      ADMIN_PASSWORD,
      ADMIN_PASSWORD
    );
    expectError(result, "Bib number 5 is already in use");
  });
});

describe("handleDeleteLap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    const result = await handleDeleteLap("lap-1", "wrong", ADMIN_PASSWORD);
    expectError(result, "Unauthorized");
  });

  it("returns error when lapId is missing", async () => {
    const result = await handleDeleteLap("", ADMIN_PASSWORD, ADMIN_PASSWORD);
    expectError(result, "Lap ID is required");
  });

  it("calls deleteLap on success", async () => {
    vi.mocked(db.deleteLap).mockResolvedValue(undefined);

    const result = await handleDeleteLap("lap-1", ADMIN_PASSWORD, ADMIN_PASSWORD);
    expectOk(result);
    expect(db.deleteLap).toHaveBeenCalledWith(expect.anything(), "lap-1");
  });
});
