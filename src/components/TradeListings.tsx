import { ArrowLeftRight, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: number;
  name: string;
  initials: string;
  offers: string;
  wants: string;
  matchPercent: number;
}

const trades: Trade[] = [
  { id: 1, name: "Priya Sharma", initials: "PS", offers: "UI/UX Design", wants: "React.js", matchPercent: 95 },
  { id: 2, name: "Arjun Mehta", initials: "AM", offers: "Spanish", wants: "Python", matchPercent: 88 },
  { id: 3, name: "Sara Khan", initials: "SK", offers: "Video Editing", wants: "Guitar", matchPercent: 82 },
  { id: 4, name: "Rohan Gupta", initials: "RG", offers: "Data Science", wants: "Public Speaking", matchPercent: 76 },
  { id: 5, name: "Neha Patel", initials: "NP", offers: "Photography", wants: "Web Development", matchPercent: 70 },
];

const avatarColors = [
  "bg-teal-light text-teal",
  "bg-coral-light text-coral",
  "bg-violet-light text-violet",
  "bg-amber-light text-amber",
  "bg-emerald-light text-emerald",
];

const TradeListings = () => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Available Swaps</h2>
        <Button variant="ghost" size="sm" className="text-primary text-xs font-medium">
          View all
        </Button>
      </div>

      <div className="space-y-3">
        {trades.map((trade, i) => (
          <div
            key={trade.id}
            className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className={`${avatarColors[i % avatarColors.length]} font-display text-xs font-semibold`}>
                {trade.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{trade.name}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-teal-light text-teal text-[10px] px-1.5 py-0">
                  {trade.offers}
                </Badge>
                <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <Badge variant="secondary" className="bg-coral-light text-coral text-[10px] px-1.5 py-0">
                  {trade.wants}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-xs font-semibold text-primary">{trade.matchPercent}% match</span>
              <Button size="sm" className="h-8 gap-1.5 text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                Connect
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TradeListings;
