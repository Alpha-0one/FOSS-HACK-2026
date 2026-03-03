import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSkills = (skillType: "offer" | "want") => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills", user?.id, skillType],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_skills")
        .select("*")
        .eq("user_id", user.id)
        .eq("skill_type", skillType);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addSkill = useMutation({
    mutationFn: async (skillName: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_name: skillName,
        skill_type: skillType,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skills", user?.id, skillType] }),
  });

  const removeSkill = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase.from("user_skills").delete().eq("id", skillId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skills", user?.id, skillType] }),
  });

  return { skills, isLoading, addSkill, removeSkill };
};
