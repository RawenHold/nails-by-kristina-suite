import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">This page doesn't exist</p>
        <a
          href="/"
          className="inline-flex h-11 px-6 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20"
        >
          Go Home
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
