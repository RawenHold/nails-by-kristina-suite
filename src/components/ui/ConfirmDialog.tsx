import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onCancel?: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onCancel,
  title,
  description,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  const handleChange = (v: boolean) => {
    if (!v && onCancel) onCancel();
    if (onOpenChange) onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleChange}>
      <AlertDialogContent className="glass-card-elevated max-w-[340px] rounded-3xl mx-auto border-glass-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-display font-semibold text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-center text-muted-foreground">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:flex-row sm:space-x-0">
          <AlertDialogCancel className="flex-1 rounded-2xl h-11 m-0">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`flex-1 rounded-2xl h-11 m-0 ${destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
