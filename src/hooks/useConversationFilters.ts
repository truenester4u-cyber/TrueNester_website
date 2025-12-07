import { useState } from "react";
import type { SearchFilters, ConversationStatus, LeadQuality, IntentType } from "@/types/conversations";

const defaultFilters: SearchFilters = {
  status: ["new", "in-progress"] as ConversationStatus[],
  leadQuality: [],
  intent: [],
  areas: [],
  tags: [],
  scoreRange: [0, 100],
  sort: "recent",
};

export const useConversationFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const updateFilters = (partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setQuery("");
    setPage(1);
  };

  const toggleStatus = (status: ConversationStatus) => {
    updateFilters({
      status: filters.status?.includes(status)
        ? filters.status?.filter((s) => s !== status)
        : [...(filters.status ?? []), status],
    });
  };

  const toggleLeadQuality = (quality: LeadQuality) => {
    updateFilters({
      leadQuality: filters.leadQuality?.includes(quality)
        ? filters.leadQuality?.filter((q) => q !== quality)
        : [...(filters.leadQuality ?? []), quality],
    });
  };

  const toggleIntent = (intent: IntentType) => {
    updateFilters({
      intent: filters.intent?.includes(intent)
        ? filters.intent?.filter((i) => i !== intent)
        : [...(filters.intent ?? []), intent],
    });
  };

  return {
    filters: { ...filters, query },
    page,
    setPage,
    updateFilters,
    clearFilters,
    query,
    setQuery,
    toggleStatus,
    toggleLeadQuality,
    toggleIntent,
  };
};
