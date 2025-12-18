import { Button } from "@/components/ui/button";
import { Trash2, Edit, X } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onBulkEdit,
  onBulkDelete,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </div>
          <span className="font-medium">
            {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="h-6 w-px bg-slate-700" />
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkEdit}
            className="text-white hover:bg-slate-800 hover:text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkDelete}
            className="text-red-400 hover:bg-red-950 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
