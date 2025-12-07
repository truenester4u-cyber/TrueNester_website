import { NotificationItem } from "@/types/conversations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Flame, Clock, Star, CheckCircle2, X } from "lucide-react";

interface NotificationCenterProps {
  notifications: NotificationItem[];
  preferences: Record<string, boolean>;
  onPreferenceChange: (key: string, value: boolean) => void;
  onDismiss: (id: string) => void;
  onOpenConversation: (conversationId: string) => void;
}

const iconMap: Record<NotificationItem["type"], JSX.Element> = {
  "new-conversation": <Bell className="h-4 w-4" />,
  "hot-lead": <Flame className="h-4 w-4" />,
  tour: <CheckCircle2 className="h-4 w-4" />,
  "lost-lead": <AlertCircle className="h-4 w-4" />,
  overdue: <Clock className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
};

const severityStyles: Record<NotificationItem["severity"], string> = {
  info: "bg-slate-100 text-slate-600",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
  success: "bg-emerald-100 text-emerald-700",
};

export const NotificationCenter = ({
  notifications,
  preferences,
  onPreferenceChange,
  onDismiss,
  onOpenConversation,
}: NotificationCenterProps) => {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Notifications</p>
          <p className="text-xs text-slate-400">Real-time alerts from the chatbot</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {notifications.length} active
        </Badge>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">All caught up!</p>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              className="w-full text-left rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition"
              onClick={() => notification.conversationId && onOpenConversation(notification.conversationId)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${severityStyles[notification.severity]}`}>{iconMap[notification.type]}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{notification.title}</p>
                  <p className="text-xs text-slate-500">{notification.description}</p>
                  <p className="text-[10px] uppercase text-slate-400 mt-1">{notification.timestamp}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); onDismiss(notification.id); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-xs uppercase text-slate-400">Alert Preferences</p>
        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm text-slate-600">
            <span className="capitalize">{key.replace(/-/g, " ")}</span>
            <Switch checked={value} onCheckedChange={(checked) => onPreferenceChange(key, checked)} />
          </div>
        ))}
      </div>
    </Card>
  );
};
