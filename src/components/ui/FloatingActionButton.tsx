import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingActionButton({ onClick, label }: FABProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      style={{ bottom: `calc(5rem + env(safe-area-inset-bottom, 0px))` }}
      className="fixed right-5 z-[55] w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/35 flex items-center justify-center"
      aria-label={label || "Добавить"}
    >
      <Plus className="w-6 h-6" strokeWidth={2.5} />
    </motion.button>
  );
}
