import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MatchedStudent {
  userId: string;
  displayName: string;
  offeredSkills: string[];
  wantedSkills: string[];
  matchingOffers: string[]; // their offers that match my wants
  matchingWants: string[]; // their wants that match my offers
  matchScore: number;
}

export const useMatches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["matches", user?.id],
    queryFn: async (): Promise<MatchedStudent[]> => {
      if (!user) return [];

      // Get my skills
      const { data: mySkills } = await supabase
        .from("user_skills")
        .select("*")
        .eq("user_id", user.id);

      if (!mySkills?.length) return [];

      const myOffers = mySkills.filter(s => s.skill_type === "offer").map(s => s.skill_name.toLowerCase());
      const myWants = mySkills.filter(s => s.skill_type === "want").map(s => s.skill_name.toLowerCase());

      // Get all other users' skills
      const { data: otherSkills } = await supabase
        .from("user_skills")
        .select("*")
        .neq("user_id", user.id);

      if (!otherSkills?.length) return [];

      // Get profiles
      const userIds = [...new Set(otherSkills.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Group skills by user
      const userSkillsMap = new Map<string, { offers: string[]; wants: string[] }>();
      otherSkills.forEach(s => {
        if (!userSkillsMap.has(s.user_id)) userSkillsMap.set(s.user_id, { offers: [], wants: [] });
        const entry = userSkillsMap.get(s.user_id)!;
        if (s.skill_type === "offer") entry.offers.push(s.skill_name);
        else entry.wants.push(s.skill_name);
      });

      // Calculate matches
      const matches: MatchedStudent[] = [];
      userSkillsMap.forEach((skills, userId) => {
        const matchingOffers = skills.offers.filter(o => myWants.includes(o.toLowerCase()));
        const matchingWants = skills.wants.filter(w => myOffers.includes(w.toLowerCase()));

        if (matchingOffers.length > 0 || matchingWants.length > 0) {
          const totalPossible = Math.max(myWants.length + myOffers.length, 1);
          const matchScore = Math.round(((matchingOffers.length + matchingWants.length) / totalPossible) * 100);
          const profile = profileMap.get(userId);

          matches.push({
            userId,
            displayName: profile?.display_name || "Student",
            offeredSkills: skills.offers,
            wantedSkills: skills.wants,
            matchingOffers,
            matchingWants,
            matchScore: Math.min(matchScore, 100),
          });
        }
      });

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    },
    enabled: !!user,
  });
};
