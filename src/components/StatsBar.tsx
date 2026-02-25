import { ArrowLeftRight, Users, TrendingUp, Sparkles } from "lucide-react";

const stats = [
  { label: "Active Traders", value: "1,247", icon: Users, color: "bg-teal-light text-teal" },
  { label: "Skills Available", value: "380+", icon: Sparkles, color: "bg-coral-light text-coral" },
  { label: "Swaps This Week", value: "89", icon: ArrowLeftRight, color: "bg-violet-light text-violet" },
  { label: "Success Rate", value: "94%", icon: TrendingUp, color: "bg-emerald-light text-emerald" },
];

const StatsBar = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
