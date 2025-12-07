import { Conversation } from "@/types/conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  Flame,
  CircleDot,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const leadQualityConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  hot: { label: "Hot Lead", color: "bg-red-100 text-red-700", icon: <Flame className="h-4 w-4" /> },
  warm: { label: "Warm Lead", color: "bg-yellow-100 text-yellow-700", icon: <CircleDot className="h-4 w-4" /> },
  cold: { label: "Cold Lead", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const statusIconMap: Record<string, JSX.Element> = {
  new: <Flame className="h-4 w-4 text-red-500" />,
  "in-progress": <CircleDot className="h-4 w-4 text-sky-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  lost: <XCircle className="h-4 w-4 text-slate-500" />,
};

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onAssign: (conversation: Conversation) => void;
  onFollowUp: (conversation: Conversation) => void;
  onNotes: (conversation: Conversation) => void;
}

export const ConversationCard = ({
  conversation,
  isActive,
  onSelect,
  onAssign,
  onFollowUp,
  onNotes,
}: ConversationCardProps) => {
  const quality = leadQualityConfig[conversation.leadQuality] ?? leadQualityConfig.cold;
  const statusIcon = statusIconMap[conversation.status] ?? statusIconMap["in-progress"];
  const lastMessageTime = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
    : "Just now";

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "p-4 border transition-all cursor-pointer",
        isActive ? "border-primary shadow-lg" : "hover:border-primary/50"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {conversation.avatarUrl && <AvatarImage src={conversation.avatarUrl} alt={conversation.customerName} />}
            <AvatarFallback>
              {conversation.customerName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-900">{conversation.customerName}</p>
            <div className="flex items-center text-sm text-slate-500">
              <Phone className="h-3 w-3 mr-1" />
              {conversation.customerPhone ?? "N/A"}
            </div>
            <div className="flex items-center text-sm text-slate-500">
              <Mail className="h-3 w-3 mr-1" />
              {conversation.customerEmail ?? "N/A"}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={cn("flex items-center gap-1 text-[11px]", quality.color)}>
            {quality.icon}
            {quality.label}
          </Badge>
          <div className="flex items-center text-xs text-slate-500 gap-1">
            {statusIcon}
            <span className="capitalize">{conversation.status.replace("-", " ")}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600 line-clamp-2">
        <span className="text-slate-400">Last message:</span> {conversation.lastMessageSnippet ?? "--"}
      </div>
      <div className="mt-1 text-xs text-slate-400">{lastMessageTime}</div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {conversation.intent && <Badge variant="outline" className="capitalize">Intent: {conversation.intent}</Badge>}
        {conversation.preferredArea && <Badge variant="outline">{conversation.preferredArea}</Badge>}
        {conversation.budget && <Badge variant="outline">Budget: {conversation.budget}</Badge>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          View
        </Button>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onAssign(conversation); }}>
          Assign
        </Button>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onFollowUp(conversation); }}>
          Follow-up
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onNotes(conversation); }}>
          Notes
        </Button>
      </div>
    </Card>
  );
};
