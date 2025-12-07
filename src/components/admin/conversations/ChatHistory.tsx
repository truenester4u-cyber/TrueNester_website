import { ChatMessage } from "@/types/conversations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  messages: ChatMessage[];
}

const senderStyles: Record<string, string> = {
  bot: "bg-slate-50 border border-slate-200 text-slate-700",
  customer: "bg-emerald-50 border border-emerald-100 text-emerald-900",
  agent: "bg-primary/10 border border-primary/20 text-primary",
};

export const ChatHistory = ({ messages }: ChatHistoryProps) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">Chat History</p>
        <p className="text-xs text-slate-500">Full transcript with metadata</p>
      </div>
      <ScrollArea className="h-[360px] p-5">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold capitalize">{message.sender}</span>
                <span>-</span>
                <span>{format(new Date(message.timestamp), "MMM d, yyyy h:mm a")}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {message.messageType}
                </Badge>
              </div>
              <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed", senderStyles[message.sender] ?? senderStyles.customer)}>
                {message.messageText}
                {message.metadata && (
                  <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap bg-white/60 rounded-xl p-2 border border-slate-100">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
