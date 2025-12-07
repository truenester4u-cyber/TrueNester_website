import { useEffect, useState } from "react";
import { Conversation, Agent, FollowUpTask, ReminderType, PriorityLevel } from "@/types/conversations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface AgentAssignmentDrawerProps {
  open: boolean;
  conversation?: Conversation;
  agents: Agent[];
  onClose: () => void;
  onAssign: (payload: { agentId: string; priority: PriorityLevel; notes?: string }) => Promise<void>;
  onScheduleFollowUp: (task: Omit<FollowUpTask, "id" | "status"> & { notifyCustomer: boolean }) => Promise<void>;
}

const reminderOptions: { label: string; value: ReminderType }[] = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "WhatsApp", value: "whatsapp" },
];

const priorityOptions: { label: string; value: PriorityLevel }[] = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const AgentAssignmentDrawer = ({
  open,
  conversation,
  agents,
  onClose,
  onAssign,
  onScheduleFollowUp,
}: AgentAssignmentDrawerProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [priority, setPriority] = useState<PriorityLevel>("high");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [reminderType, setReminderType] = useState<ReminderType>("email");
  const [reminderText, setReminderText] = useState("Call to confirm tour time");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (conversation) {
      setSelectedAgent(conversation.assignedAgentId ?? "");
      setNotes(conversation.notes ?? "");
      setFollowUpDate(conversation.followUpDate ?? "");
    }
  }, [conversation]);

  const handleAssign = async () => {
    if (!conversation || !selectedAgent) return;
    setIsSubmitting(true);
    try {
      await onAssign({ agentId: selectedAgent, priority, notes });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleFollowUp = async () => {
    if (!conversation || !selectedAgent || !followUpDate) return;
    setIsSubmitting(true);
    try {
      await onScheduleFollowUp({
        conversationId: conversation.id,
        assignedAgentId: selectedAgent,
        followUpDate,
        reminderText,
        reminderType,
        priority,
        notifyCustomer,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!conversation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign Agent & Schedule Follow-up</DialogTitle>
          <DialogDescription>
            Route lead to the right specialist and ensure timely follow-up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Assign to Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.activeConversations ?? 0}/{agent.maxCapacity ?? 10})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as PriorityLevel)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="datetime-local"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reminder Type</Label>
              <Select value={reminderType} onValueChange={(value) => setReminderType(value as ReminderType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 mt-8">
              <Switch checked={notifyCustomer} onCheckedChange={setNotifyCustomer} />
              <div>
                <p className="text-sm font-medium">Notify customer</p>
                <p className="text-xs text-slate-500">Send reminder via selected channel</p>
              </div>
            </div>
          </div>

          <div>
            <Label>Reminder Message</Label>
            <Textarea value={reminderText} onChange={(event) => setReminderText(event.target.value)} className="mt-2" rows={3} />
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2" rows={3} />
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleAssign} disabled={!selectedAgent || isSubmitting}>
              Assign Agent
            </Button>
            <Button variant="outline" onClick={handleFollowUp} disabled={!selectedAgent || !followUpDate || isSubmitting}>
              Schedule Follow-up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
