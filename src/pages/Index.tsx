/* THE RYDBERG ROOM
 * A multiplayer experiment in collective quantum excitation.
 * Each visitor becomes a neutral atom trapped in an optical tweezer.
 * Press E to fire a laser pulse and excite your atom into a Rydberg state.
 * Open multiple tabs for real cross-tab multiplayer via BroadcastChannel.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { Atom, GameParams, BroadcastMessage } from "@/lib/types";
import { DEFAULT_PARAMS } from "@/lib/types";
import { latLonToXY, pixelDistance } from "@/lib/geo";
import { drawWorldMap } from "@/lib/worldmap";
import { createAtom, exciteAtom, checkEntanglement, updateAtomTimers } from "@/lib/atoms";
import {
  drawStarfield,
  drawConnectionLines,
  drawOrbitRings,
  drawBlockadeZone,
  drawAtom,
  drawCrosshair,
} from "@/lib/render";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useGhostAtoms } from "@/hooks/useGhostAtoms";
import ParamsPanel from "@/components/ParamsPanel";
import StatusHUD from "@/components/StatusHUD";
import InfoPopup, { type PopupType } from "@/components/InfoPopup";
import InfoCard from "@/components/InfoCard";

type IntroPhase = "locating" | "trapped" | "deploy" | "ready";

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<GameParams>(DEFAULT_PARAMS);
  const [popup, setPopup] = useState<PopupType>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [atomCount, setAtomCount] = useState(1);
  const [nearbyLinks, setNearbyLinks] = useState(0);

  // Persisted "first time" flags
  const shownPopups = useRef<Set<string>>(new Set());

  const myId = useMemo(() => `user-${Math.random().toString(36).slice(2, 8)}`, []);
  const geo = useGeolocation();
  const ghosts = useGhostAtoms();

  // Mutable refs for animation loop
  const mouseRef = useRef({ x: 0, y: 0 });
  const userAtomRef = useRef<Atom | null>(null);
  const peerAtomsRef = useRef<Map<string, Atom>>(new Map());
  const introPhaseRef = useRef<IntroPhase>("locating");
  const introStartRef = useRef(Date.now());
  const starsRef = useRef<{ x: number; y: number }[]>([]);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // For HUD reactivity
  const userAtomStateRef = useRef<Atom | null>(null);
  const [hudAtom, setHudAtom] = useState<Atom | null>(null);

  // Generate stars once
  useEffect(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
    }));
  }, []);

  // Broadcast handlers
  const onPeerUpdate = useCallback((msg: BroadcastMessage) => {
    const existing = peerAtomsRef.current.get(msg.id!);
    if (existing) {
      existing.x = msg.x!;
      existing.y = msg.y!;
      existing.state = msg.state!;
      existing.stateTimer = msg.stateTimer!;
    } else {
      peerAtomsRef.current.set(
        msg.id!,
        createAtom(msg.id!, msg.x!, msg.y!, 0, 0, msg.label ?? "peer", false)
      );
    }
  }, []);

  const onPeerDisconnect = useCallback((id: string) => {
    peerAtomsRef.current.delete(id);
  }, []);

  const { broadcast } = useBroadcast(myId, onPeerUpdate, onPeerDisconnect);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        const atom = userAtomRef.current;
        if (atom && atom.state === "ground" && introPhaseRef.current === "ready") {
          userAtomRef.current = exciteAtom(atom, paramsRef.current);
          if (!shownPopups.current.has("excite")) {
            shownPopups.current.add("excite");
            setPopup("excite");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Click handler — excite on click
  useEffect(() => {
    const handleClick = () => {
      const atom = userAtomRef.current;
      if (atom && atom.state === "ground" && introPhaseRef.current === "ready") {
        userAtomRef.current = exciteAtom(atom, paramsRef.current);
        if (!shownPopups.current.has("excite")) {
          shownPopups.current.add("excite");
          setPopup("excite");
        }
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let lastTs = 0;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reposition ghosts
      ghosts.repositionAll(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // Wait for geolocation then init
    const waitForGeo = setInterval(() => {
      if (geo.loading) return;
      clearInterval(waitForGeo);

      const pos = latLonToXY(geo.lat, geo.lon, window.innerWidth, window.innerHeight);
      const atom = createAtom(myId, window.innerWidth / 2, window.innerHeight / 2, geo.lat, geo.lon, geo.label, true);
      userAtomRef.current = atom;
      mouseRef.current = { x: pos.x, y: pos.y };

      ghosts.init(window.innerWidth, window.innerHeight);
      introStartRef.current = Date.now();
    }, 100);

    const animate = (timestamp: number) => {
      const dt = lastTs ? timestamp - lastTs : 16;
      lastTs = timestamp;
      t++;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const p = paramsRef.current;

      ctx.clearRect(0, 0, W, H);

      // Stars
      drawStarfield(ctx, starsRef.current, W, H);

      // World map
      drawWorldMap(ctx, W, H, latLonToXY);

      const user = userAtomRef.current;
      if (!user) {
        animFrame = requestAnimationFrame(animate);
        return;
      }

      // Intro phases
      const elapsed = Date.now() - introStartRef.current;
      const phase = introPhaseRef.current;

      if (phase === "locating" && elapsed > 2000) {
        introPhaseRef.current = "trapped";
      } else if (phase === "trapped" && elapsed > 3500) {
        introPhaseRef.current = "deploy";
      } else if (phase === "deploy" && elapsed > 5000) {
        introPhaseRef.current = "ready";
      }

      const currentPhase = introPhaseRef.current;

      // Intro: spin freely during locating
      if (currentPhase === "locating") {
        user.orbitAngle += 0.05; // fast spin
        user.x = W / 2;
        user.y = H / 2;
      } else if (currentPhase === "trapped") {
        user.x = W / 2;
        user.y = H / 2;
        // Stop spinning, show orbit rings
      } else if (currentPhase === "deploy") {
        // Lerp to geo position
        const targetPos = latLonToXY(user.lat, user.lon, W, H);
        const progress = Math.min((elapsed - 3500) / 1500, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        user.x = W / 2 + (targetPos.x - W / 2) * ease;
        user.y = H / 2 + (targetPos.y - H / 2) * ease;
      } else {
        // Ready — follow mouse with lerp
        user.x += (mouseRef.current.x - user.x) * 0.08;
        user.y += (mouseRef.current.y - user.y) * 0.08;
        // Clamp
        user.x = Math.max(40, Math.min(W - 40, user.x));
        user.y = Math.max(40, Math.min(H - 40, user.y));
      }

      // Thermal noise (1px wiggle)
      if (currentPhase !== "locating") {
        user.x += (Math.random() - 0.5) * 0.6;
        user.y += (Math.random() - 0.5) * 0.6;
      }

      // Update ghost atoms
      let ghostAtoms: Atom[] = [];
      if (p.ghostsEnabled) {
        ghostAtoms = ghosts.update(dt, p, t);
      }

      // Peer atoms
      const peerAtoms = Array.from(peerAtomsRef.current.values());

      // All atoms
      let allAtoms = [user, ...ghostAtoms, ...peerAtoms];

      // Update timers
      allAtoms = updateAtomTimers(allAtoms, dt, p);
      // Apply back to user
      const updatedUser = allAtoms[0];
      userAtomRef.current = updatedUser;

      // Check entanglement
      allAtoms = checkEntanglement(allAtoms, p);
      userAtomRef.current = allAtoms[0];

      // Check if user just entangled
      if (
        allAtoms[0].state === "entangled" &&
        !shownPopups.current.has("entangle")
      ) {
        shownPopups.current.add("entangle");
        setPopup("entangle");
      }

      // Count nearby links
      let links = 0;
      for (let i = 1; i < allAtoms.length; i++) {
        if (
          pixelDistance(allAtoms[0].x, allAtoms[0].y, allAtoms[i].x, allAtoms[i].y) <
          p.connectionThreshold
        ) {
          if (allAtoms[0].state !== "ground" && allAtoms[i].state !== "ground") {
            links++;
          }
        }
      }

      // Draw layers
      // Layer 0: connections
      if (currentPhase === "ready" || currentPhase === "deploy") {
        drawConnectionLines(ctx, allAtoms, p, t);
      }

      // Layer 1: orbit rings + blockade
      for (const atom of allAtoms) {
        if (currentPhase !== "locating") {
          drawOrbitRings(ctx, atom, p);
          drawBlockadeZone(ctx, atom, p, t);
        }
      }

      // Layer 2: atoms
      for (const atom of allAtoms) {
        drawAtom(ctx, atom, p, t);
      }

      // Layer 3: crosshair on user
      if (currentPhase !== "locating") {
        drawCrosshair(ctx, allAtoms[0], p.crosshairStyle);
      }

      // Layer 4: intro text
      ctx.save();
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";

      if (currentPhase === "locating") {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("locating...", W / 2, H / 2 + 60);
      } else if (currentPhase === "trapped") {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("this atom is now yours", W / 2, H / 2 + 60);
      } else if (currentPhase === "deploy") {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("press E or click to excite", W / 2, H - 40);
      }
      ctx.restore();

      // Broadcast user state
      broadcast(allAtoms[0]);

      // Update HUD state (throttled)
      if (t % 6 === 0) {
        setAtomCount(allAtoms.length);
        setNearbyLinks(links);
        setHudAtom({ ...allAtoms[0] });
      }

      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
      clearInterval(waitForGeo);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [myId, geo, ghosts, broadcast]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black cursor-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />

      <ParamsPanel params={params} setParams={setParams} />
      <StatusHUD userAtom={hudAtom} atomCount={atomCount} nearbyLinks={nearbyLinks} />

      <InfoPopup type={popup} onDismiss={() => setPopup(null)} />
      <InfoCard open={infoOpen} onClose={() => setInfoOpen(false)} />

      {/* Room code */}
      <div className="fixed top-4 left-4 z-50 font-mono text-[10px] text-white/20">
        rydberg-room://local
      </div>
    </div>
  );
};

export default Index;
