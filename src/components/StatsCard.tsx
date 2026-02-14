import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  variant?: "default" | "danger" | "warning" | "success";
}

const variantStyles = {
  default: "glow-primary border-primary/20",
  danger: "glow-danger border-destructive/20",
  warning: "glow-warning border-warning/20",
  success: "border-success/20",
};

const iconVariants = {
  default: "bg-primary/15 text-primary",
  danger: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
};

const StatsCard = ({ title, value, icon: Icon, change, variant = "default" }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-panel rounded-lg p-5 ${variantStyles[variant]}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-foreground mt-1 font-mono">{value}</p>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconVariants[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export default StatsCard;
