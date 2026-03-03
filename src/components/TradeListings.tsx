import { ArrowLeftRight, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import ChatDialog from "@/components/ChatDialog";

const avatarColors = [
  "bg-teal-light text-teal",
  "bg-coral-light text-coral",
  "bg-violet-light text-violet",
  "bg-amber-light text-amber",
  "bg-emerald-light text-emerald",
];

const TradeListings = () => {
  const { user } = useAuth();
  const { data: matches = [], isLoading } = useMatches();
  const [chatWith, setChatWith] = useState<{ userId: string; name: string } | null>(null);

  if (!user) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Available Swaps</h2>
        <p className="text-sm text-muted-foreground">Sign in to see skill matches</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Your Matches</h2>
        <span className="text-xs text-muted-foreground">{matches.length} matches found</span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Finding matches...</p>}

      {!isLoading && matches.length === 0 && (
        <div className="rounded-xl bg-card p-6 shadow-card text-center">
          <p className="text-sm text-muted-foreground">No matches yet. Add skills above to find students to swap with!</p>
        </div>
      )}

      <div className="space-y-3">
        {matches.map((match, i) => {
          const initials = match.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div
              key={match.userId}
              className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={`${avatarColors[i % avatarColors.length]} font-display text-xs font-semibold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{match.displayName}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                  {match.matchingOffers.slice(0, 2).map(s => (
                    <Badge key={s} variant="secondary" className="bg-teal-light text-teal text-[10px] px-1.5 py-0">{s}</Badge>
                  ))}
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  {match.matchingWants.slice(0, 2).map(s => (
                    <Badge key={s} variant="secondary" className="bg-coral-light text-coral text-[10px] px-1.5 py-0">{s}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline text-xs font-semibold text-primary">{match.matchScore}% match</span>
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setChatWith({ userId: match.userId, name: match.displayName })}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {chatWith && (
        <ChatDialog
          partnerId={chatWith.userId}
          partnerName={chatWith.name}
          open={!!chatWith}
          onClose={() => setChatWith(null)}
        />
      )}
    </section>
  );
};

export default TradeListings;
