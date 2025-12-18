import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (updates: BulkUpdatePayload) => Promise<void>;
}

export interface BulkUpdatePayload {
  status?: "new" | "in-progress" | "completed" | "lost";
  leadQuality?: "hot" | "warm" | "cold";
  assignedAgentId?: string;
  tags?: string[];
  notes?: string;
}

export const BulkEditModal = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<BulkUpdatePayload>({});

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(updates);
      onOpenChange(false);
      setUpdates({});
    } finally {
      setLoading(false);
    }
  };

  const hasUpdates = Object.keys(updates).some(key => {
    const value = updates[key as keyof BulkUpdatePayload];
    return value !== undefined && value !== "";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Conversations</DialogTitle>
          <DialogDescription>
            Update {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} at once. Only selected fields will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={updates.status || ""}
              onValueChange={(value) => setUpdates(prev => ({ 
                ...prev, 
                status: value ? value as "new" | "in-progress" | "completed" | "lost" : undefined 
              }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Keep current status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep current status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadQuality">Lead Quality</Label>
            <Select
              value={updates.leadQuality || ""}
              onValueChange={(value) => setUpdates(prev => ({ 
                ...prev, 
                leadQuality: value ? value as "hot" | "warm" | "cold" : undefined 
              }))}
            >
              <SelectTrigger id="leadQuality">
                <SelectValue placeholder="Keep current quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep current quality</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Add Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes to all selected conversations..."
              value={updates.notes || ""}
              onChange={(e) => setUpdates(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Notes will be appended to existing notes
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !hasUpdates}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Update ${selectedCount} Conversation${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
