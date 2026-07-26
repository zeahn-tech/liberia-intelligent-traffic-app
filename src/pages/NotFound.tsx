import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 relative"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto clay-card p-4">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-6xl sm:text-7xl font-bold mb-2">404</h1>
          <p className="text-xl text-muted-foreground">Page Not Found</p>
        </div>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to a known section.
        </p>

        <div className="flex justify-center gap-3 pt-4">
          <Button className="clay-btn rounded-xl" onClick={() => navigate("/dashboard")}>
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
