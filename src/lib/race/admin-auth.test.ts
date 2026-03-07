import { describe, it, expect } from "vitest";
import { validateAdminPassword } from "./admin-auth";

describe("validateAdminPassword", () => {
  it("returns true for correct password", () => {
    expect(validateAdminPassword("secret123", "secret123")).toBe(true);
  });

  it("returns false for incorrect password", () => {
    expect(validateAdminPassword("wrong", "secret123")).toBe(false);
  });

  it("returns false for empty password", () => {
    expect(validateAdminPassword("", "secret123")).toBe(false);
  });

  it("returns false when server password is empty", () => {
    expect(validateAdminPassword("anything", "")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(validateAdminPassword("Secret123", "secret123")).toBe(false);
  });
});
