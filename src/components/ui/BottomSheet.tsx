import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /**
   * Footer rendered as a sticky bar at the bottom of the sheet.
   * Use this for primary action buttons so they are never hidden.
   */
  footer?: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 glass-sheet rounded-t-3xl flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-center pt-2.5 pb-1">
              <span className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-lg font-display font-semibold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 overflow-y-auto flex-1">
              {children}
            </div>
            {footer && (
              <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom,0px),1rem)] border-t border-glass-border bg-popover/60 backdrop-blur-md">
                {footer}
              </div>
            )}
            {!footer && <div className="h-[max(env(safe-area-inset-bottom,0px),1rem)]" />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
