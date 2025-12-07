import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface ExportMenuProps {
  onExport: (format: "pdf" | "csv" | "xlsx") => void;
}

export const ExportMenu = ({ onExport }: ExportMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4" /> Export
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Export conversations</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onExport("pdf")}>PDF report</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onExport("csv")}>CSV</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onExport("xlsx")}>Excel workbook</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
