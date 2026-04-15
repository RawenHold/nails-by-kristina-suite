import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingActionButton({ onClick, label }: FABProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      aria-label={label || "Add"}
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
}
