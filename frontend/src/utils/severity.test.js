import { describe, expect, test } from "vitest";
import { cvssToSeverity } from "../components/SeverityBadge";

describe("cvssToSeverity", () => {
  test("maps critical", () => {
    expect(cvssToSeverity(9.8)).toBe("Critical");
  });

  test("maps high", () => {
    expect(cvssToSeverity(7.2)).toBe("High");
  });

  test("maps medium", () => {
    expect(cvssToSeverity(5.5)).toBe("Medium");
  });

  test("maps low", () => {
    expect(cvssToSeverity(2.1)).toBe("Low");
  });
});
