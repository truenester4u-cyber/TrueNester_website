/**
 * SavePropertyButton - Heart icon button to save/unsave properties
 * Shows login prompt if user is not authenticated
 */
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext.v2";
import { useIsPropertySaved, useToggleSaveProperty } from "@/hooks/useSavedProperties";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SavePropertyButtonProps {
  propertyId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const SavePropertyButton = ({
  propertyId,
  variant = "outline",
  size = "icon",
  className,
}: SavePropertyButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isSaved = false, isLoading: checkingStatus } = useIsPropertySaved(propertyId);
  const { toggleSave, isLoading } = useToggleSaveProperty();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    await toggleSave(propertyId, isSaved);
  };

  const isProcessing = isLoading || checkingStatus;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(className)}
      title={isSaved ? "Remove from saved" : "Save property"}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isSaved && "fill-current text-red-500",
          isProcessing && "opacity-50"
        )}
      />
      {size !== "icon" && (
        <span className="ml-2">{isSaved ? "Saved" : "Save"}</span>
      )}
    </Button>
  );
};
