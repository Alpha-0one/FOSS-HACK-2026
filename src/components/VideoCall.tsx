import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VideoCallProps {
  partnerId: string;
  partnerName: string;
  open: boolean;
  onClose: () => void;
  isIncoming?: boolean;
  roomId?: string;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const VideoCall = ({ partnerId, partnerName, open, onClose, isIncoming = false, roomId: initialRoomId }: VideoCallProps) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string>(initialRoomId || "");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    peerConnection.current?.close();
    peerConnection.current = null;
    localStream.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setCallState("ended");
  }, []);

  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      toast.error("Could not access camera/microphone");
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate && user) {
        await supabase.from("video_call_signals").insert({
          room_id: roomIdRef.current,
          sender_id: user.id,
          receiver_id: partnerId,
          signal_type: "ice-candidate",
          signal_data: event.candidate.toJSON() as any,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCallState("connected");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") cleanup();
    };

    peerConnection.current = pc;
    return pc;
  }, [user, partnerId, cleanup]);

  const listenForSignals = useCallback(() => {
    if (!user) return;
    const channel = supabase
      .channel(`call-${roomIdRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_call_signals",
          filter: `room_id=eq.${roomIdRef.current}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.sender_id === user.id) return;
          const pc = peerConnection.current;
          if (!pc) return;

          if (signal.signal_type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await supabase.from("video_call_signals").insert({
              room_id: roomIdRef.current,
              sender_id: user.id,
              receiver_id: partnerId,
              signal_type: "answer",
              signal_data: answer as any,
            });
          } else if (signal.signal_type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
          } else if (signal.signal_type === "ice-candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
          } else if (signal.signal_type === "hangup") {
            cleanup();
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
  }, [user, partnerId, cleanup]);

  const startCall = useCallback(async () => {
    if (!user) return;
    const stream = await setupMedia();
    if (!stream) return;

    roomIdRef.current = `${user.id}-${partnerId}-${Date.now()}`;
    setCallState("calling");

    const pc = createPeerConnection(stream);
    listenForSignals();

    // Send call request signal first so partner knows room_id
    await supabase.from("video_call_signals").insert({
      room_id: roomIdRef.current,
      sender_id: user.id,
      receiver_id: partnerId,
      signal_type: "call-request",
      signal_data: { roomId: roomIdRef.current } as any,
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await supabase.from("video_call_signals").insert({
      room_id: roomIdRef.current,
      sender_id: user.id,
      receiver_id: partnerId,
      signal_type: "offer",
      signal_data: offer as any,
    });
  }, [user, partnerId, setupMedia, createPeerConnection, listenForSignals]);

  const answerCall = useCallback(async () => {
    const stream = await setupMedia();
    if (!stream) return;

    roomIdRef.current = initialRoomId || "";
    setCallState("calling");
    createPeerConnection(stream);
    listenForSignals();
  }, [setupMedia, createPeerConnection, listenForSignals, initialRoomId]);

  const hangUp = useCallback(async () => {
    if (user) {
      await supabase.from("video_call_signals").insert({
        room_id: roomIdRef.current,
        sender_id: user.id,
        receiver_id: partnerId,
        signal_type: "hangup",
        signal_data: {} as any,
      });
    }
    cleanup();
    onClose();
  }, [user, partnerId, cleanup, onClose]);

  const toggleMute = () => {
    localStream.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((m) => !m);
  };

  const toggleVideo = () => {
    localStream.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff((v) => !v);
  };

  useEffect(() => {
    if (open) {
      if (isIncoming) {
        answerCall();
      } else {
        startCall();
      }
    }
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && hangUp()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-display">
            Video Call with {partnerName}
            {callState === "calling" && <span className="text-muted-foreground text-sm ml-2">Connecting...</span>}
            {callState === "connected" && <span className="text-emerald text-sm ml-2">● Connected</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-foreground/5 aspect-video">
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Local video PiP */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-32 h-24 rounded-lg object-cover border-2 border-background shadow-lg"
          />
          {callState === "calling" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isIncoming ? "Connecting..." : "Calling..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMute}
            className="rounded-full h-12 w-12"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleVideo}
            className="rounded-full h-12 w-12"
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={hangUp}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
