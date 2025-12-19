/**
 * SLA Alert Banner Component
 * 
 * WHY: Provides real-time visibility into SLA compliance.
 * - Shows leads approaching SLA deadline
 * - Alerts when SLA is breached
 * - Enables quick action on urgent leads
 */

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminTimelineApi, type SLABreachCandidate } from "@/integrations/supabase/adminTimeline";
import { useNavigate } from "react-router-dom";

interface SLAAlertBannerProps {
  warningMinutes?: number;
  refreshIntervalMs?: number;
}

export function SLAAlertBanner({
  warningMinutes = 30,
  refreshIntervalMs = 60000, // Check every minute
}: SLAAlertBannerProps) {
  const [candidates, setCandidates] = useState<SLABreachCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await adminTimelineApi.getSLABreachCandidates(warningMinutes);
        setCandidates(data);
      } catch (error) {
        console.error("Failed to fetch SLA candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();

    // Set up polling
    const interval = setInterval(fetchCandidates, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [warningMinutes, refreshIntervalMs]);

  if (isLoading || candidates.length === 0 || isDismissed) {
    return null;
  }

  const breachedCount = candidates.filter((c) => c.minutesRemaining <= 0).length;
  const warningCount = candidates.filter((c) => c.minutesRemaining > 0).length;

  const handleViewLead = (conversationId: string) => {
    navigate(`/admin/conversations?id=${conversationId}`);
  };

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 dark:text-red-200">
            SLA Alert: {candidates.length} Lead{candidates.length !== 1 ? "s" : ""} Require Attention
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {breachedCount > 0 && (
              <span className="font-medium">
                {breachedCount} breached SLA.{" "}
              </span>
            )}
            {warningCount > 0 && (
              <span>
                {warningCount} approaching deadline.
              </span>
            )}
          </p>

          <div className="mt-3 space-y-2">
            {candidates.slice(0, 3).map((candidate) => (
              <div
                key={candidate.conversationId}
                className="flex items-center justify-between rounded-md bg-white/50 p-2 dark:bg-black/20"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={candidate.minutesRemaining <= 0 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {candidate.leadQuality.toUpperCase()}
                  </Badge>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {candidate.customerName}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    {candidate.minutesRemaining <= 0
                      ? `${Math.abs(candidate.minutesRemaining)} min overdue`
                      : `${candidate.minutesRemaining} min left`}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => handleViewLead(candidate.conversationId)}
                >
                  <Phone className="h-3 w-3" />
                  Contact
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {candidates.length > 3 && (
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-red-700 dark:text-red-300"
              onClick={() => navigate("/admin/conversations?filter=sla-warning")}
            >
              View all {candidates.length} leads →
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-red-600 hover:text-red-800 dark:text-red-400"
          onClick={() => setIsDismissed(true)}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export default SLAAlertBanner;
