import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Paperclip, Video, MoreVertical, Ban, FileText, Image, Film } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VideoCall from "@/components/VideoCall";

interface ChatDialogProps {
  partnerId: string;
  partnerName: string;
  open: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ChatDialog = ({ partnerId, partnerName, open, onClose }: ChatDialogProps) => {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ roomId: string } | null>(null);
  const { user } = useAuth();
  const { messages, sendMessage } = useMessages(partnerId);
  const { isBlocked, blockUser, unblockUser } = useBlockedUsers();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blocked = isBlocked(partnerId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for incoming call requests
  useEffect(() => {
    if (!user || !open) return;
    const channel = supabase
      .channel(`incoming-call-${user.id}-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_call_signals",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const signal = payload.new as any;
          if (signal.sender_id === partnerId && signal.signal_type === "call-request") {
            setIncomingCall({ roomId: signal.signal_data.roomId });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, partnerId, open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !blocked) {
      sendMessage.mutate(trimmed);
      setInput("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 100 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat_attachments")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat_attachments")
        .getPublicUrl(path);

      // Determine type
      let attachmentType = "file";
      if (file.type.startsWith("image/")) attachmentType = "image";
      else if (file.type.startsWith("video/")) attachmentType = "video";

      // Send as message with attachment
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: partnerId,
        content: file.name,
        attachment_url: urlData.publicUrl,
        attachment_type: attachmentType,
        attachment_name: file.name,
      });
      if (error) throw error;

      toast.success("File sent!");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBlock = () => {
    if (blocked) {
      unblockUser.mutate(partnerId, {
        onSuccess: () => toast.success(`Unblocked ${partnerName}`),
      });
    } else {
      blockUser.mutate(partnerId, {
        onSuccess: () => toast.success(`Blocked ${partnerName}`),
      });
    }
  };

  const renderAttachment = (msg: any) => {
    if (!msg.attachment_url) return null;

    if (msg.attachment_type === "image") {
      return (
        <img
          src={msg.attachment_url}
          alt={msg.attachment_name || "Image"}
          className="max-w-full rounded-md mt-1 max-h-48 object-cover cursor-pointer"
          onClick={() => window.open(msg.attachment_url, "_blank")}
        />
      );
    }

    if (msg.attachment_type === "video") {
      return (
        <video
          src={msg.attachment_url}
          controls
          className="max-w-full rounded-md mt-1 max-h-48"
        />
      );
    }

    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-1 text-xs underline opacity-80 hover:opacity-100"
      >
        <FileText className="h-3 w-3" />
        {msg.attachment_name || "Download file"}
      </a>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display">Chat with {partnerName}</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setVideoCallOpen(true)}
                  disabled={blocked}
                  title="Start video call"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                      <Ban className="h-4 w-4 mr-2" />
                      {blocked ? "Unblock User" : "Block User"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>

          {blocked && (
            <div className="bg-destructive/10 text-destructive text-xs text-center py-2 rounded-md">
              You have blocked this user. Unblock to send messages.
            </div>
          )}

          <div className="h-72 overflow-y-auto space-y-2 p-2 bg-secondary/50 rounded-lg">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-8">
                Start the conversation! Introduce yourself and propose a skill swap.
              </p>
            )}
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.sender_id === user?.id
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-card text-foreground shadow-sm"
                }`}
              >
                {!msg.attachment_url && msg.content}
                {renderAttachment(msg)}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Incoming call banner */}
          {incomingCall && (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">
                📞 {partnerName} is calling...
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIncomingCall(null)}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setVideoCallOpen(true);
                    setIncomingCall(null);
                  }}
                >
                  Accept
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || blocked}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={blocked ? "User is blocked" : "Type a message..."}
              className="text-sm"
              disabled={blocked}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sendMessage.isPending || blocked || uploading}
            >
              {uploading ? (
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {videoCallOpen && (
        <VideoCall
          partnerId={partnerId}
          partnerName={partnerName}
          open={videoCallOpen}
          onClose={() => setVideoCallOpen(false)}
          isIncoming={!!incomingCall}
          roomId={incomingCall?.roomId}
        />
      )}
    </>
  );
};

export default ChatDialog;
