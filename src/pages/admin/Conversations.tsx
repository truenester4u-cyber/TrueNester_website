import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { SearchFilters } from "@/components/admin/conversations/SearchFilters";
import { ConversationList } from "@/components/admin/conversations/ConversationList";
import { ConversationDetail } from "@/components/admin/conversations/ConversationDetail";
import { AnalyticsOverview } from "@/components/admin/conversations/AnalyticsOverview";
import { NotificationCenter } from "@/components/admin/conversations/NotificationCenter";
import { ExportMenu } from "@/components/admin/conversations/ExportMenu";
import { useConversationFilters } from "@/hooks/useConversationFilters";
import { adminConversationsApi } from "@/integrations/supabase/adminConversations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  Agent,
  Conversation,
  ConversationSummary,
  NotificationItem,
  FollowUpTask,
} from "@/types/conversations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";

const PAGE_SIZE = 25;
const defaultNotificationPrefs: Record<NotificationItem["type"], boolean> = {
  "new-conversation": true,
  "hot-lead": true,
  tour: true,
  "lost-lead": true,
  overdue: true,
  rating: true,
};

const rangeToDates = (range: string) => {
  const now = new Date();
  const start = new Date(now);
  const map: Record<string, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };
  start.setDate(start.getDate() - (map[range] ?? 7));
  return { from: start.toISOString(), to: now.toISOString() };
};

const ConversationsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { filters, page, setPage, updateFilters, clearFilters, query, setQuery, toggleStatus, toggleLeadQuality, toggleIntent } =
    useConversationFilters();
  const [selectedConversationId, setSelectedConversationId] = useState<string>();
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState("7d");
  const [assignmentOpen, setAssignmentOpen] = useState(false);

  const filterPayload = useMemo(() => ({ ...filters, query }), [filters, query]);

  const conversationsQuery = useQuery<{ data: Conversation[]; total: number }>({
    queryKey: ["admin-conversations", filterPayload, page],
    queryFn: () => adminConversationsApi.fetchConversations(filterPayload, page, PAGE_SIZE),
    placeholderData: (previousData) => previousData,
  });

  const conversationsData = conversationsQuery.data;
  const conversationsLoading = conversationsQuery.isLoading;
  const conversationsError = conversationsQuery.error as Error | null;
  const refetchConversations = conversationsQuery.refetch;

  const selectedConversation = useMemo(() => {
    return conversationsData?.data.find((item) => item.id === selectedConversationId) ?? conversationsData?.data[0];
  }, [conversationsData, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId && conversationsData?.data.length) {
      setSelectedConversationId(conversationsData.data[0].id);
    }
  }, [selectedConversationId, conversationsData]);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery<ConversationSummary | undefined>({
    queryKey: ["conversation-summary", selectedConversation?.id],
    queryFn: () => (selectedConversation ? adminConversationsApi.fetchConversationSummary(selectedConversation.id) : undefined),
    enabled: Boolean(selectedConversation?.id),
  });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["conversation-analytics", analyticsRange],
    queryFn: () => adminConversationsApi.fetchAnalytics({ range: rangeToDates(analyticsRange) }),
  });

  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      return []; // No agents table exists - return empty array
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Conversation> }) =>
      adminConversationsApi.updateConversation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      refetchSummary();
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const handleAssignAgent = async ({ agentId, priority, notes }: { agentId: string; priority: "high" | "medium" | "low"; notes?: string }) => {
    if (!selectedConversation) return;
    await updateConversationMutation.mutateAsync({
      id: selectedConversation.id,
      payload: { assignedAgentId: agentId, notes },
    });
    toast({ title: "Agent assigned", description: `Lead routed with ${priority} priority.` });
  };

  const handleScheduleFollowUp = async (task: Omit<FollowUpTask, "id" | "status"> & { notifyCustomer: boolean }) => {
    if (!selectedConversation) return;
    await adminConversationsApi.scheduleFollowUp(selectedConversation.id, task);
    toast({ title: "Follow-up scheduled", description: `Reminder set for ${new Date(task.followUpDate).toLocaleString()}` });
  };

  const handleUpdateField = async (payload: Partial<Conversation>, successMessage: string) => {
    if (!selectedConversation) return;
    await updateConversationMutation.mutateAsync({ id: selectedConversation.id, payload });
    toast({ title: successMessage });
  };

  useEffect(() => {
    const unsubscribe = adminConversationsApi.subscribeToRealtime(() => refetchConversations(), () => refetchConversations());
    return unsubscribe;
  }, [refetchConversations]);

  useEffect(() => {
    const unsubscribe = adminConversationsApi.subscribeToNotifications((notification) => {
      if (notificationPrefs[notification.type]) {
        setNotifications((prev) => [notification, ...prev].slice(0, 25));
      }
    });
    return unsubscribe;
  }, [notificationPrefs]);

  const handleExport = async (format: "pdf" | "csv" | "xlsx") => {
    try {
      const blob = await adminConversationsApi.exportConversations({ format, filters: filterPayload });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `conversations-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6 rounded-3xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400">TrueNester Concierge</p>
            <h1 className="text-3xl font-bold text-slate-900">Conversation Intelligence Hub</h1>
            <p className="text-sm text-slate-500">Monitor every customer interaction, prioritize hot leads, and trigger follow-ups.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetchConversations()}>
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <ExportMenu onExport={handleExport} />
          </div>
        </Card>

        {conversationsError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load conversations</AlertTitle>
            <AlertDescription>
              {conversationsError.message || "Admin API is unavailable. Start the backend server or sign in to Supabase to continue."}
            </AlertDescription>
          </Alert>
        )}

        {analyticsError && (
          <Alert>
            <AlertTitle>Analytics unavailable</AlertTitle>
            <AlertDescription>Analytics will appear once the admin API is online.</AlertDescription>
          </Alert>
        )}

        <SearchFilters
          filters={filterPayload}
          query={query}
          onQueryChange={setQuery}
          onClear={clearFilters}
          onStatusToggle={toggleStatus}
          onLeadQualityToggle={toggleLeadQuality}
          onIntentToggle={toggleIntent}
          onSortChange={(sort) => updateFilters({ sort })}
          activeSort={filterPayload.sort ?? "recent"}
        />

        <div className="grid gap-4 xl:grid-cols-[1.4fr,0.9fr]">
          <ConversationList
            conversations={conversationsData?.data ?? []}
            selectedConversationId={selectedConversation?.id}
            onSelect={(conversation) => setSelectedConversationId(conversation.id)}
            onAssign={(conversation) => {
              setSelectedConversationId(conversation.id);
              setAssignmentOpen(true);
            }}
            onFollowUp={(conversation) => {
              setSelectedConversationId(conversation.id);
              setAssignmentOpen(true);
            }}
            onNotes={(conversation) => setSelectedConversationId(conversation.id)}
            loading={conversationsLoading}
            page={page}
            pageSize={PAGE_SIZE}
            total={conversationsData?.total ?? 0}
            onPageChange={setPage}
            onSortChange={(sort) => updateFilters({ sort })}
            activeSort={filterPayload.sort ?? "recent"}
          />

          <div className="space-y-4">
            {/* Temporarily disabled analytics to fix page loading - will re-enable after chart fix */}
            {/* <AnalyticsOverview
              data={analyticsData}
              loading={analyticsLoading}
              range={analyticsRange}
              onRangeChange={setAnalyticsRange}
              onRefresh={() => refetchAnalytics()}
              onExport={(format) => handleExport(format)}
            /> */}
            <NotificationCenter
              notifications={notifications}
              preferences={notificationPrefs}
              onPreferenceChange={(key, value) => setNotificationPrefs((prev) => ({ ...prev, [key as NotificationItem["type"]]: value }))}
              onDismiss={(id) => setNotifications((prev) => prev.filter((item) => item.id !== id))}
              onOpenConversation={(conversationId) => setSelectedConversationId(conversationId)}
            />
          </div>
        </div>

        <ConversationDetail
          conversation={selectedConversation}
          summary={summaryData}
          loading={summaryLoading}
          agents={agentsQuery.data ?? []}
          drawerOpen={assignmentOpen}
          onDrawerOpenChange={setAssignmentOpen}
          onRegenerateSummary={() => refetchSummary()}
          onAssignAgent={handleAssignAgent}
          onScheduleFollowUp={handleScheduleFollowUp}
          onUpdateNotes={(notes) => handleUpdateField({ notes }, "Notes updated")}
          onUpdateStatus={(status) => handleUpdateField({ status }, "Status updated")}
          onUpdateLeadQuality={(leadQuality) => handleUpdateField({ leadQuality }, "Lead quality updated")}
        />
      </div>
    </AdminLayout>
  );
};

export default ConversationsPage;
