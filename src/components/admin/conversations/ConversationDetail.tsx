import { useMemo, useState, useEffect, ReactNode } from "react";
import {
  Conversation,
  ConversationSummary as ConversationSummaryType,
  Agent,
  FollowUpTask,
  ConversationStatus,
  LeadQuality,
} from "@/types/conversations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationSummary } from "./ConversationSummary";
import { ChatHistory } from "./ChatHistory";
import { AgentAssignmentDrawer } from "./AgentAssignmentDrawer";
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin, Tag, Clock, UserRound, Image as ImageIcon, ExternalLink } from "lucide-react";

interface ConversationDetailProps {
  conversation?: Conversation;
  summary?: ConversationSummaryType;
  loading?: boolean;
  agents: Agent[];
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onRegenerateSummary: () => void;
  onAssignAgent: (payload: { agentId: string; priority: "high" | "medium" | "low"; notes?: string }) => Promise<void>;
  onScheduleFollowUp: (task: Omit<FollowUpTask, "id" | "status"> & { notifyCustomer: boolean }) => Promise<void>;
  onUpdateNotes: (notes: string) => void;
  onUpdateStatus: (status: ConversationStatus) => void;
  onUpdateLeadQuality: (quality: LeadQuality) => void;
}

export const ConversationDetail = ({
  conversation,
  summary,
  loading,
  agents,
  drawerOpen,
  onDrawerOpenChange,
  onRegenerateSummary,
  onAssignAgent,
  onScheduleFollowUp,
  onUpdateNotes,
  onUpdateStatus,
  onUpdateLeadQuality,
}: ConversationDetailProps) => {
  const [notesDraft, setNotesDraft] = useState(conversation?.notes ?? "");

  useEffect(() => {
    setNotesDraft(conversation?.notes ?? "");
  }, [conversation]);

  // Extract property images from lead_score_breakdown if available
  const propertyImages = useMemo(() => {
    if (conversation?.leadScoreBreakdown && typeof conversation.leadScoreBreakdown === 'object') {
      const breakdown = conversation.leadScoreBreakdown as any;
      return (breakdown.images || []) as string[];
    }
    return [];
  }, [conversation]);

  const stats = useMemo(
    () => [
      { label: "Duration", value: `${conversation?.durationMinutes ?? 0} mins` },
      { label: "Lead Score", value: `${conversation?.leadScore ?? 0}/100` },
      { label: "Messages", value: `${conversation?.messages.length ?? 0}` },
      { label: "Follow-up", value: conversation?.followUpDate ? new Date(conversation.followUpDate).toLocaleString() : "Not scheduled" },
    ],
    [conversation]
  );

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full border border-dashed rounded-3xl">
        <p className="text-sm text-slate-400">Select a conversation to inspect details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-3xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-100">
                <UserRound className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">{conversation.customerName}</p>
                <p className="text-sm text-slate-500">
                  Started {new Date(conversation.startTime).toLocaleString()} | Status {conversation.status}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field icon={<Phone className="h-3 w-3" />} label="Phone" value={conversation.customerPhone ?? "--"} />
              <Field icon={<Mail className="h-3 w-3" />} label="Email" value={conversation.customerEmail ?? "--"} />
              <Field icon={<MapPin className="h-3 w-3" />} label="Preferred Area" value={conversation.preferredArea ?? "--"} />
              <Field icon={<Tag className="h-3 w-3" />} label="Budget" value={conversation.budget ?? "--"} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onDrawerOpenChange(true)}>Assign Agent</Button>
              <Button variant="default" onClick={() => onDrawerOpenChange(true)}>Follow-up</Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {conversation.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="uppercase text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-400 uppercase">{stat.label}</p>
              <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Tabs defaultValue="history" className="rounded-3xl border border-slate-200 bg-white p-4">
          <TabsList>
            <TabsTrigger value="history">Chat History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-4">
            <ChatHistory messages={conversation.messages} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <Label className="text-xs uppercase text-slate-400">Internal Notes</Label>
            <Textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} rows={8} className="mt-2" />
            <Button className="mt-3" onClick={() => onUpdateNotes(notesDraft)}>
              Save Notes
            </Button>
          </TabsContent>
        </Tabs>

        {propertyImages.length > 0 && (
          <Card className="p-4 rounded-3xl">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-slate-600" />
              <p className="text-sm font-semibold text-slate-700">Property Images ({propertyImages.length})</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {propertyImages.map((url, index) => (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 hover:border-primary transition-colors"
                >
                  <img 
                    src={url} 
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <ConversationSummary conversation={conversation} summary={summary} onRegenerate={onRegenerateSummary} />
          <Card className="p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Lead Controls</p>
            <div className="grid gap-3">
              <div>
                <Label>Status</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["new", "in-progress", "completed", "lost"].map((status) => (
                    <Badge
                      key={status}
                      className={cn(
                        "cursor-pointer",
                        conversation.status === status ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      )}
                      onClick={() => onUpdateStatus(status as ConversationStatus)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Lead Quality</Label>
                <div className="mt-2 flex gap-2">
                  {["hot", "warm", "cold"].map((quality) => (
                    <Badge
                      key={quality}
                      className={cn(
                        "cursor-pointer",
                        conversation.leadQuality === quality ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      )}
                      onClick={() => onUpdateLeadQuality(quality as LeadQuality)}
                    >
                      {quality}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Next Follow-up</Label>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {conversation.followUpDate ? new Date(conversation.followUpDate).toLocaleString() : "Not scheduled"}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AgentAssignmentDrawer
        open={drawerOpen}
        conversation={conversation}
        agents={agents}
        onClose={() => onDrawerOpenChange(false)}
        onAssign={onAssignAgent}
        onScheduleFollowUp={onScheduleFollowUp}
      />
    </div>
  );
};

const Field = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 text-sm text-slate-600">
    <div className="flex items-center gap-1 text-slate-400">
      {icon}
      <span>{label}:</span>
    </div>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);
