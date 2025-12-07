import { Conversation, ConversationSummary as ConversationSummaryType } from "@/types/conversations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ConversationSummaryProps {
  conversation: Conversation;
  summary?: ConversationSummaryType;
  onRegenerate: () => void;
}

const leadQualityColors: Record<string, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-yellow-100 text-yellow-700",
  cold: "bg-emerald-100 text-emerald-700",
};

export const ConversationSummary = ({ conversation, summary, onRegenerate }: ConversationSummaryProps) => {
  const qualityBadge = leadQualityColors[conversation.leadQuality] ?? leadQualityColors.cold;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Conversation Summary</p>
          <p className="text-xs text-slate-500">AI generated snapshot with follow-up guidance</p>
        </div>
        <Badge className={qualityBadge}>Lead score {conversation.leadScore}/100</Badge>
      </div>

      {summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <p className="text-slate-400 text-xs uppercase">Duration</p>
              <p className="font-semibold">{summary.durationMinutes ?? conversation.durationMinutes ?? 0} mins</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Messages</p>
              <p className="font-semibold">{summary.totalMessages ?? conversation.messages.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Intent</p>
              <p className="font-semibold capitalize">{summary.customerIntent ?? conversation.intent ?? "--"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase">Preferred Area</p>
              <p className="font-semibold">{summary.preferredArea ?? conversation.preferredArea ?? "--"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase">Lead Score Breakdown</p>
            <div className="space-y-2 mt-2">
              {summary.leadScoreBreakdown &&
                Object.entries(summary.leadScoreBreakdown)
                  .filter(([key]) => key !== "total" && key !== "quality")
                  .map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="capitalize">{key}</span>
                        <span>{value as number} pts</span>
                      </div>
                      <Progress value={(Number(value) / 30) * 100} className="h-2" />
                    </div>
                  ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase">Actions Completed</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {summary.actionsTaken?.map((action) => (
                <div key={action} className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {action}
                </div>
              ))}
            </div>
          </div>

          {summary.missingSteps && summary.missingSteps.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Missing Steps
              </div>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {summary.missingSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 uppercase mb-1">Suggested Follow-up</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {summary.suggestedFollowUp ?? "No suggestion available"}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          Summary not available yet.
        </div>
      )}

      <Button variant="outline" onClick={onRegenerate} className="w-full">
        Regenerate summary
      </Button>
    </Card>
  );
};
