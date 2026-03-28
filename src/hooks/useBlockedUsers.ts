import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const blockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: blockedId,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users", user?.id] }),
  });

  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users", user?.id] }),
  });

  const isBlocked = (userId: string) => blockedUsers.some((b) => b.blocked_id === userId);

  return { blockedUsers, blockUser, unblockUser, isBlocked };
};
