import { Conversation } from "@/types/conversations";
import { ConversationCard } from "./ConversationCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onAssign: (conversation: Conversation) => void;
  onFollowUp: (conversation: Conversation) => void;
  onNotes: (conversation: Conversation) => void;
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onSortChange: (sort: string) => void;
  activeSort: string;
  selectedIds?: string[];
  onToggleSelection?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
}

const sortTabs = [
  { value: "recent", label: "Recent" },
  { value: "hot", label: "Hot leads" },
  { value: "follow-up", label: "Pending follow-ups" },
];

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelect,
  onAssign,
  onFollowUp,
  onNotes,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onSortChange,
  activeSort,
  selectedIds = [],
  onToggleSelection,
  onSelectAll,
}: ConversationListProps) => {
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const allSelected = conversations.length > 0 && conversations.every(c => selectedIds.includes(c.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onSelectAll && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
              className="data-[state=indeterminate]:bg-primary"
              ref={(el) => {
                if (el && someSelected && !allSelected) {
                  el.dataset.state = 'indeterminate';
                }
              }}
            />
          )}
          <div>
            <p className="text-xs uppercase text-slate-400">Conversations</p>
            <p className="text-2xl font-bold text-slate-900">{total.toLocaleString()} total</p>
          </div>
        </div>
        <Tabs value={activeSort} onValueChange={onSortChange} className="hidden lg:block">
          <TabsList>
            {sortTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-slate-500">
          No conversations match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-start gap-3">
              {onToggleSelection && (
                <Checkbox
                  checked={selectedIds.includes(conversation.id)}
                  onCheckedChange={() => onToggleSelection(conversation.id)}
                  className="mt-4"
                />
              )}
              <div className="flex-1">
                <ConversationCard
                  conversation={conversation}
                  isActive={conversation.id === selectedConversationId}
                  onSelect={() => onSelect(conversation)}
                  onAssign={onAssign}
                  onFollowUp={onFollowUp}
                  onNotes={onNotes}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
