import { SearchFilters as FilterState, ConversationStatus, LeadQuality, IntentType } from "@/types/conversations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMemo, ReactNode } from "react";

interface SearchFiltersProps {
  filters: FilterState;
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  onStatusToggle: (status: ConversationStatus) => void;
  onLeadQualityToggle: (quality: LeadQuality) => void;
  onIntentToggle: (intent: IntentType) => void;
  onSortChange: (sort: string) => void;
  activeSort: string;
}

const statusOptions: ConversationStatus[] = ["new", "in-progress", "completed", "lost"];
const leadQualityOptions: LeadQuality[] = ["hot", "warm", "cold"];
const intentOptions: IntentType[] = ["buy", "rent", "sell", "invest", "browse"];

export const SearchFilters = ({
  filters,
  query,
  onQueryChange,
  onClear,
  onStatusToggle,
  onLeadQualityToggle,
  onIntentToggle,
  onSortChange,
  activeSort,
}: SearchFiltersProps) => {
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length !== statusOptions.length) count++;
    if (filters.leadQuality && filters.leadQuality.length > 0) count++;
    if (filters.intent && filters.intent.length > 0) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.areas && filters.areas.length > 0) count++;
    if (filters.followUpStatus && filters.followUpStatus.length > 0) count++;
    if (filters.scoreRange && (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100)) count++;
    return count;
  }, [filters]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, phone, email, tags, #vip, etc."
          className="h-11"
        />
        <div className="flex items-center gap-2">
          <Button variant={activeSort === "recent" ? "default" : "outline"} onClick={() => onSortChange("recent")}>Recent</Button>
          <Button variant={activeSort === "hot" ? "default" : "outline"} onClick={() => onSortChange("hot")}>Hot</Button>
          <Button variant={activeSort === "follow-up" ? "default" : "outline"} onClick={() => onSortChange("follow-up")}>
            Follow-ups
          </Button>
          <Button variant="ghost" onClick={onClear}>
            Clear ({activeCount})
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <FilterGroup label="Status">
          {statusOptions.map((status) => (
            <Badge
              key={status}
              className={`${filters.status?.includes(status) ? "bg-primary text-white" : "bg-slate-100 text-slate-600"} cursor-pointer`}
              onClick={() => onStatusToggle(status)}
            >
              {status.replace("-", " ")}
            </Badge>
          ))}
        </FilterGroup>

        <FilterGroup label="Lead Quality">
          {leadQualityOptions.map((quality) => (
            <Badge
              key={quality}
              className={`${filters.leadQuality?.includes(quality) ? "bg-primary text-white" : "bg-slate-100 text-slate-600"} cursor-pointer`}
              onClick={() => onLeadQualityToggle(quality)}
            >
              {quality}
            </Badge>
          ))}
        </FilterGroup>

        <FilterGroup label="Intent">
          {intentOptions.map((intent) => (
            <Badge
              key={intent}
              className={`${filters.intent?.includes(intent) ? "bg-primary text-white" : "bg-slate-100 text-slate-600"} cursor-pointer`}
              onClick={() => onIntentToggle(intent)}
            >
              {intent}
            </Badge>
          ))}
        </FilterGroup>
      </div>
    </div>
  );
};

const FilterGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs uppercase text-slate-400">{label}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
