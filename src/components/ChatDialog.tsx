import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";

interface ChatDialogProps {
  partnerId: string;
  partnerName: string;
  open: boolean;
  onClose: () => void;
}

const ChatDialog = ({ partnerId, partnerName, open, onClose }: ChatDialogProps) => {
  const [input, setInput] = useState("");
  const { user } = useAuth();
  const { messages, sendMessage } = useMessages(partnerId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed) {
      sendMessage.mutate(trimmed);
      setInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Chat with {partnerName}</DialogTitle>
        </DialogHeader>

        <div className="h-72 overflow-y-auto space-y-2 p-2 bg-secondary/50 rounded-lg">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">
              Start the conversation! Introduce yourself and propose a skill swap.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.sender_id === user?.id
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-card text-foreground shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="text-sm"
          />
          <Button size="sm" onClick={handleSend} disabled={sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
