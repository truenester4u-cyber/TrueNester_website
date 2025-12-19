/**
 * Conversation Timeline Component
 * 
 * WHY: Provides complete audit trail of all actions on a conversation.
 * - Shows lead creation, status changes, assignments
 * - Displays notification delivery status
 * - Tracks follow-ups and customer contacts
 * - Real-time updates via Supabase subscriptions
 */

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  User,
  Bot,
  Bell,
  Calendar,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  FileText,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminTimelineApi,
  type TimelineEntry,
  type TimelineEventType,
} from "@/integrations/supabase/adminTimeline";

interface ConversationTimelineProps {
  conversationId: string;
  maxEntries?: number;
}

const eventTypeConfig: Record<
  TimelineEventType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  created: { icon: User, color: "text-green-600", bgColor: "bg-green-100" },
  status_changed: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
  assigned: { icon: UserPlus, color: "text-purple-600", bgColor: "bg-purple-100" },
  note_added: { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100" },
  follow_up_scheduled: { icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-100" },
  follow_up_completed: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  notification_sent: { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-100" },
  customer_contacted: { icon: Phone, color: "text-green-600", bgColor: "bg-green-100" },
  property_viewed: { icon: Building, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  document_shared: { icon: FileText, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  meeting_scheduled: { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-100" },
  call_logged: { icon: Phone, color: "text-green-600", bgColor: "bg-green-100" },
  email_sent: { icon: Mail, color: "text-blue-600", bgColor: "bg-blue-100" },
  sla_warning: { icon: AlertTriangle, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  sla_breached: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

const actorTypeIcons: Record<string, React.ElementType> = {
  system: Bot,
  agent: User,
  customer: User,
  bot: Bot,
};

export function ConversationTimeline({
  conversationId,
  maxEntries = 50,
}: ConversationTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const data = await adminTimelineApi.getTimeline(conversationId, maxEntries);
        setEntries(data);
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();

    // Subscribe to real-time updates
    const unsubscribe = adminTimelineApi.subscribeToTimeline(
      conversationId,
      (newEntry) => {
        setEntries((prev) => [newEntry, ...prev].slice(0, maxEntries));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, maxEntries]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No timeline entries yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const config = eventTypeConfig[entry.eventType] || {
            icon: MessageSquare,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
          };
          const Icon = config.icon;
          const ActorIcon = actorTypeIcons[entry.actorType] || User;

          return (
            <div key={entry.id} className="relative flex gap-3 pl-1">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor}`}
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {entry.title}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Actor info */}
                {entry.actorName && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <ActorIcon className="h-3 w-3" />
                    <span>{entry.actorName}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {entry.actorType}
                    </Badge>
                  </div>
                )}

                {/* Metadata badges */}
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.metadata.channel && (
                      <Badge variant="secondary" className="text-xs">
                        {String(entry.metadata.channel)}
                      </Badge>
                    )}
                    {entry.metadata.status && (
                      <Badge
                        variant={
                          entry.metadata.status === "sent" || entry.metadata.status === "delivered"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {String(entry.metadata.status)}
                      </Badge>
                    )}
                    {entry.metadata.leadQuality && (
                      <Badge
                        variant={
                          entry.metadata.leadQuality === "hot"
                            ? "destructive"
                            : entry.metadata.leadQuality === "warm"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {String(entry.metadata.leadQuality)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConversationTimeline;
