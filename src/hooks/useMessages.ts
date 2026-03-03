import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", user?.id, otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!otherUserId,
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !otherUserId) throw new Error("Missing user");
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", user?.id, otherUserId] }),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by conversation partner
      const convMap = new Map<string, { partnerId: string; lastMessage: string; lastAt: string; unread: number }>();
      data.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, {
            partnerId,
            lastMessage: msg.content,
            lastAt: msg.created_at,
            unread: (!msg.read && msg.receiver_id === user.id) ? 1 : 0,
          });
        } else if (!msg.read && msg.receiver_id === user.id) {
          convMap.get(partnerId)!.unread++;
        }
      });

      // Get profiles for partners
      const partnerIds = [...convMap.keys()];
      if (partnerIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", partnerIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return [...convMap.values()].map(c => ({
        ...c,
        partnerName: profileMap.get(c.partnerId)?.display_name || "Student",
      }));
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  return { messages, isLoading, sendMessage, conversations };
};
