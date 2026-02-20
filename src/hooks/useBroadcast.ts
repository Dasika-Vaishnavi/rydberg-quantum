import { useEffect, useRef, useCallback } from "react";
import type { Atom, BroadcastMessage } from "@/lib/types";

export function useBroadcast(
  myId: string,
  onPeerUpdate: (msg: BroadcastMessage) => void,
  onPeerDisconnect: (id: string) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("rydberg-room");
    channelRef.current = channel;

    channel.onmessage = (e: MessageEvent<BroadcastMessage>) => {
      if (e.data.id === myId) return;
      if (e.data.type === "atom-update") {
        onPeerUpdate(e.data);
      } else if (e.data.type === "atom-disconnect") {
        onPeerDisconnect(e.data.id);
      }
    };

    return () => {
      channel.postMessage({ type: "atom-disconnect", id: myId });
      channel.close();
    };
  }, [myId, onPeerUpdate, onPeerDisconnect]);

  const broadcast = useCallback(
    (atom: Atom) => {
      channelRef.current?.postMessage({
        type: "atom-update",
        id: atom.id,
        x: atom.x,
        y: atom.y,
        state: atom.state,
        label: atom.label,
        stateTimer: atom.stateTimer,
      } satisfies BroadcastMessage);
    },
    []
  );

  return { broadcast };
}
