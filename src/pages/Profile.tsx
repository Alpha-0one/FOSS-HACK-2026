import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useSkills } from "@/hooks/useSkills";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { skills: offerSkills } = useSkills("offer");
  const { skills: wantSkills } = useSkills("want");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: swapHistory = [] } = useQuery({
    queryKey: ["swap-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("swap_requests")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profile names for swap partners
      const partnerIds = data.map((s) =>
        s.from_user_id === user.id ? s.to_user_id : s.from_user_id
      );
      const uniqueIds = [...new Set(partnerIds)];
      if (uniqueIds.length === 0) return data.map((s) => ({ ...s, partner_name: "Unknown" }));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", uniqueIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      return data.map((s) => ({
        ...s,
        partner_name:
          nameMap.get(s.from_user_id === user.id ? s.to_user_id : s.from_user_id) ?? "Unknown",
      }));
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, bio })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated!");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Avatar updated!");
    },
    onError: () => toast.error("Failed to upload avatar"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  const initials = profile.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-emerald-light text-emerald";
    if (status === "rejected") return "bg-destructive/10 text-destructive";
    return "bg-amber-light text-amber";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>

          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary-foreground/30">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-lg bg-primary-foreground/20 text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-primary-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-primary-foreground/70 text-sm">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        {/* Edit Profile */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-secondary border-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself, your interests, and what you're passionate about..."
                className="bg-secondary border-none min-h-[100px]"
              />
            </div>
            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="shadow-card border-l-4 border-l-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Skills I Teach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {offerSkills.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No skills added yet</p>
                )}
                {offerSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="bg-teal-light text-teal text-xs"
                  >
                    {s.skill_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                Skills I Want
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wantSkills.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No skills added yet</p>
                )}
                {wantSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="bg-coral-light text-coral text-xs"
                  >
                    {s.skill_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swap History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Swap History</CardTitle>
          </CardHeader>
          <CardContent>
            {swapHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No swap requests yet</p>
            ) : (
              <div className="space-y-3">
                {swapHistory.map((swap: any) => (
                  <div
                    key={swap.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {swap.from_user_id === user.id ? "You → " : ""}
                        {swap.partner_name}
                        {swap.from_user_id !== user.id ? " → You" : ""}
                      </p>
                      {swap.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {swap.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={`text-xs ${statusColor(swap.status)}`}>
                        {swap.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(swap.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
