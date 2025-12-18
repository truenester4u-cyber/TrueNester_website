import { describe, it, expect } from "vitest";
import { parsePropertyTypes, getPrimaryPropertyType } from "./utils";

describe("parsePropertyTypes", () => {
  it("should parse pipe-delimited property types", () => {
    const result = parsePropertyTypes("apartment|penthouse|villa");
    expect(result).toEqual(["apartment", "penthouse", "villa"]);
  });

  it("should parse curly-brace delimited property types", () => {
    const result = parsePropertyTypes("{apartment,penthouse,villa}");
    expect(result).toEqual(["apartment", "penthouse", "villa"]);
  });

  it("should handle single property type", () => {
    const result = parsePropertyTypes("apartment");
    expect(result).toEqual(["apartment"]);
  });

  it("should trim whitespace from property types", () => {
    const result = parsePropertyTypes("apartment | penthouse | villa");
    expect(result).toEqual(["apartment", "penthouse", "villa"]);
  });

  it("should handle empty string", () => {
    const result = parsePropertyTypes("");
    expect(result).toEqual([""]);
  });

  it("should handle null or undefined", () => {
    const resultNull = parsePropertyTypes(null as any);
    const resultUndefined = parsePropertyTypes(undefined as any);
    
    expect(resultNull).toEqual([""]);
    expect(resultUndefined).toEqual([""]);
  });

  it("should remove empty strings from result", () => {
    const result = parsePropertyTypes("apartment||villa");
    expect(result).toEqual(["apartment", "villa"]);
  });
});

describe("getPrimaryPropertyType", () => {
  it("should return first property type from pipe-delimited string", () => {
    const result = getPrimaryPropertyType("apartment|penthouse|villa");
    expect(result).toBe("apartment");
  });

  it("should return first property type from curly-brace string", () => {
    const result = getPrimaryPropertyType("{apartment,penthouse,villa}");
    expect(result).toBe("apartment");
  });

  it("should return single property type", () => {
    const result = getPrimaryPropertyType("apartment");
    expect(result).toBe("apartment");
  });

  it("should trim whitespace", () => {
    const result = getPrimaryPropertyType(" apartment | penthouse ");
    expect(result).toBe("apartment");
  });

  it("should handle empty string", () => {
    const result = getPrimaryPropertyType("");
    expect(result).toBe("");
  });

  it("should handle null or undefined", () => {
    const resultNull = getPrimaryPropertyType(null as any);
    const resultUndefined = getPrimaryPropertyType(undefined as any);
    
    expect(resultNull).toBe("");
    expect(resultUndefined).toBe("");
  });
});
