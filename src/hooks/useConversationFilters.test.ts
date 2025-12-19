import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConversationFilters } from "./useConversationFilters";
import type { ConversationStatus, LeadQuality, IntentType } from "@/types/conversations";

describe("useConversationFilters", () => {
  describe("initial state", () => {
    it("should initialize with default filters", () => {
      const { result } = renderHook(() => useConversationFilters());

      expect(result.current.filters.status).toEqual(["new", "in-progress"]);
      expect(result.current.filters.leadQuality).toEqual([]);
      expect(result.current.filters.intent).toEqual([]);
      expect(result.current.filters.areas).toEqual([]);
      expect(result.current.filters.tags).toEqual([]);
      expect(result.current.filters.scoreRange).toEqual([0, 100]);
      expect(result.current.filters.sort).toBe("recent");
    });

    it("should initialize page to 1", () => {
      const { result } = renderHook(() => useConversationFilters());
      expect(result.current.page).toBe(1);
    });

    it("should initialize query as empty string", () => {
      const { result } = renderHook(() => useConversationFilters());
      expect(result.current.query).toBe("");
    });
  });

  describe("updateFilters", () => {
    it("should update filters with partial values", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.updateFilters({
          status: ["completed"],
          scoreRange: [50, 100],
        });
      });

      expect(result.current.filters.status).toEqual(["completed"]);
      expect(result.current.filters.scoreRange).toEqual([50, 100]);
      expect(result.current.filters.leadQuality).toEqual([]);
    });

    it("should reset page to 1 when filters change", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);

      act(() => {
        result.current.updateFilters({ sort: "score-high" });
      });

      expect(result.current.page).toBe(1);
    });

    it("should preserve other filters when updating specific ones", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.updateFilters({
          leadQuality: ["hot", "warm"],
        });
      });

      expect(result.current.filters.status).toEqual(["new", "in-progress"]);
      expect(result.current.filters.leadQuality).toEqual(["hot", "warm"]);
    });
  });

  describe("clearFilters", () => {
    it("should reset all filters to defaults", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.updateFilters({
          status: ["completed"],
          leadQuality: ["hot"],
          scoreRange: [80, 100],
        });
        result.current.setQuery("test");
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.status).toEqual(["new", "in-progress"]);
      expect(result.current.filters.leadQuality).toEqual([]);
      expect(result.current.filters.scoreRange).toEqual([0, 100]);
      expect(result.current.query).toBe("");
    });

    it("should reset page to 1 when clearing filters", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(3);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe("toggleStatus", () => {
    it("should add status when not present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleStatus("completed");
      });

      expect(result.current.filters.status).toContain("completed");
    });

    it("should remove status when present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleStatus("new");
      });

      expect(result.current.filters.status).not.toContain("new");
    });

    it("should handle toggling multiple statuses", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleStatus("completed");
        result.current.toggleStatus("lost");
        result.current.toggleStatus("new");
      });

      expect(result.current.filters.status).toEqual(["in-progress", "completed", "lost"]);
    });

    it("should reset page to 1 when toggling status", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(4);
        result.current.toggleStatus("completed");
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe("toggleLeadQuality", () => {
    it("should add lead quality when not present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleLeadQuality("hot");
      });

      expect(result.current.filters.leadQuality).toContain("hot");
    });

    it("should remove lead quality when present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleLeadQuality("hot");
        result.current.toggleLeadQuality("hot");
      });

      expect(result.current.filters.leadQuality).not.toContain("hot");
    });

    it("should handle toggling multiple lead qualities", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleLeadQuality("hot");
        result.current.toggleLeadQuality("warm");
        result.current.toggleLeadQuality("cold");
      });

      expect(result.current.filters.leadQuality).toEqual(["hot", "warm", "cold"]);
    });

    it("should reset page to 1 when toggling lead quality", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(2);
        result.current.toggleLeadQuality("hot");
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe("toggleIntent", () => {
    it("should add intent when not present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleIntent("buy");
      });

      expect(result.current.filters.intent).toContain("buy");
    });

    it("should remove intent when present", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleIntent("buy");
        result.current.toggleIntent("buy");
      });

      expect(result.current.filters.intent).not.toContain("buy");
    });

    it("should handle toggling multiple intents", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleIntent("buy");
        result.current.toggleIntent("rent");
        result.current.toggleIntent("invest");
      });

      expect(result.current.filters.intent).toEqual(["buy", "rent", "invest"]);
    });

    it("should reset page to 1 when toggling intent", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(3);
        result.current.toggleIntent("buy");
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe("query management", () => {
    it("should update query string", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setQuery("John Doe");
      });

      expect(result.current.query).toBe("John Doe");
      expect(result.current.filters.query).toBe("John Doe");
    });

    it("should reset page when setting query", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(5);
        result.current.setQuery("search term");
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe("page management", () => {
    it("should set page number", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);
    });

    it("should allow setting page to any number", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.setPage(100);
      });

      expect(result.current.page).toBe(100);
    });
  });

  describe("complex filter scenarios", () => {
    it("should handle combination of multiple filter changes", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.updateFilters({
          status: ["completed"],
          scoreRange: [80, 100],
        });
        result.current.toggleLeadQuality("hot");
        result.current.toggleIntent("buy");
        result.current.setQuery("premium");
      });

      expect(result.current.filters.status).toEqual(["completed"]);
      expect(result.current.filters.scoreRange).toEqual([80, 100]);
      expect(result.current.filters.leadQuality).toContain("hot");
      expect(result.current.filters.intent).toContain("buy");
      expect(result.current.query).toBe("premium");
    });

    it("should preserve independent filter changes", () => {
      const { result } = renderHook(() => useConversationFilters());

      act(() => {
        result.current.toggleStatus("completed");
        result.current.toggleLeadQuality("hot");
      });

      act(() => {
        result.current.toggleIntent("buy");
      });

      expect(result.current.filters.status).not.toContain("new");
      expect(result.current.filters.leadQuality).toContain("hot");
      expect(result.current.filters.intent).toContain("buy");
    });
  });
});
