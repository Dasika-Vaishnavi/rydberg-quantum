/* THE RYDBERG ROOM
 * A multiplayer experiment in collective quantum excitation.
 * Each visitor becomes a neutral atom trapped in an optical tweezer.
 * Press E to fire a laser pulse and excite your atom into a Rydberg state.
 * Open multiple tabs for real cross-tab multiplayer via BroadcastChannel.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Atom, GameParams, BroadcastMessage } from "@/lib/types";
import { DEFAULT_PARAMS } from "@/lib/types";
import { latLonToXY, pixelDistance } from "@/lib/geo";
import { drawWorldMap } from "@/lib/worldmap";
import { createAtom, exciteAtom, checkEntanglement, updateAtomTimers } from "@/lib/atoms";
import {
  drawStarfield,
  drawGrid,
  drawConnectionLines,
  drawOrbitRings,
  drawBlockadeZone,
  drawAtom,
  drawCrosshair,
  drawExcitationFlash,
  drawEntangleFlash,
} from "@/lib/render";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useGhostAtoms } from "@/hooks/useGhostAtoms";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import ParamsPanel from "@/components/ParamsPanel";
import StatusHUD from "@/components/StatusHUD";
import InfoPopup, { type PopupType } from "@/components/InfoPopup";
import InfoCard from "@/components/InfoCard";
import EventFeed, { type GameEvent, createEvent } from "@/components/EventFeed";
import GuidedPrompts, { type GameMilestone } from "@/components/GuidedPrompts";

type IntroPhase = "loading" | "locating" | "trapped" | "deploy" | "ready";

// Simple sound effects via Web Audio
function playExciteSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playEntangleSound() {
  try {
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 300;
    osc2.frequency.value = 450;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.2);
  } catch {}
}

const Index = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState<GameParams>(DEFAULT_PARAMS);
  const [popup, setPopup] = useState<PopupType>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [atomCount, setAtomCount] = useState(1);
  const [nearbyLinks, setNearbyLinks] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loadingText, setLoadingText] = useState("initializing optical trap...");
  const [milestone, setMilestone] = useState<GameMilestone>("start");
  const [introPhaseState, setIntroPhaseState] = useState<string>("loading");
  const hasMovedRef = useRef(false);
  const hasExcitedRef = useRef(false);
  const hasEntangledRef = useRef(false);
  const hasDecayedRef = useRef(false);
  const mouseMoveCountRef = useRef(0);

  const shownPopups = useRef<Set<string>>(new Set());
  const myId = useMemo(() => `user-${Math.random().toString(36).slice(2, 8)}`, []);
  const geo = useGeolocation();
  const ghosts = useGhostAtoms();

  // Mutable refs
  const mouseRef = useRef({ x: 0, y: 0 });
  const userAtomRef = useRef<Atom | null>(null);
  const peerAtomsRef = useRef<Map<string, Atom>>(new Map());
  const introPhaseRef = useRef<IntroPhase>("loading");
  const introStartRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number }[]>([]);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const gameStartedRef = useRef(false);

  // Flash state
  const exciteFlashRef = useRef({ active: false, progress: 0, x: 0, y: 0 });
  const entangleFlashRef = useRef({ active: false, progress: 0 });
  const shakeRef = useRef({ active: false, elapsed: 0 });
  const flashScaleRef = useRef(1);

  // Events ref for animation loop
  const eventsRef = useRef<GameEvent[]>([]);
  const addEvent = useCallback((text: string, type: GameEvent["type"]) => {
    const ev = createEvent(text, type);
    eventsRef.current = [...eventsRef.current.slice(-5), ev];
    setEvents([...eventsRef.current]);
  }, []);

  const [hudAtom, setHudAtom] = useState<Atom | null>(null);

  // Generate stars once
  useEffect(() => {
    starsRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random(),
    }));
  }, []);

  // Loading text sequence
  useEffect(() => {
    const t1 = setTimeout(() => setLoadingText("locating your atom..."), 800);
    const t2 = setTimeout(() => setLoadingText("calibrating lasers..."), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Excitation handler
  const doExcite = useCallback(() => {
    const atom = userAtomRef.current;
    if (!atom || atom.state !== "ground" || introPhaseRef.current !== "ready") return;

    userAtomRef.current = exciteAtom(atom, paramsRef.current);
    playExciteSound();

    // Flash effect
    exciteFlashRef.current = { active: true, progress: 0, x: atom.x, y: atom.y };
    flashScaleRef.current = 2;

    // Screen shake
    shakeRef.current = { active: true, elapsed: 0 };

    addEvent("⚡ you entered rydberg state", "rydberg");

    // Milestone: first excite → advance to find_target
    if (!hasExcitedRef.current) {
      hasExcitedRef.current = true;
      setMilestone("find_target");
    }

    if (!shownPopups.current.has("excite")) {
      shownPopups.current.add("excite");
      setPopup("excite");
    }
  }, [addEvent]);

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
      if (e.key === "e" || e.key === "E") doExcite();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [doExcite]);

  // Start game after onboarding
  const handleStartGame = useCallback(() => {
    setShowOnboarding(false);
    setGameStarted(true);
    gameStartedRef.current = true;
    introPhaseRef.current = "locating";
    introStartRef.current = Date.now();
  }, []);

  // Track previous ghost states for event feed
  const prevGhostStatesRef = useRef<Map<string, string>>(new Map());

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
      ghosts.repositionAll(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      mouseMoveCountRef.current++;
      if (mouseMoveCountRef.current === 15 && !hasExcitedRef.current) {
        hasMovedRef.current = true;
        setMilestone("excite");
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    // Wait for geo then init user atom
    const waitForGeo = setInterval(() => {
      if (geo.loading) return;
      clearInterval(waitForGeo);

      const pos = latLonToXY(geo.lat, geo.lon, window.innerWidth, window.innerHeight);
      const atom = createAtom(myId, window.innerWidth / 2, window.innerHeight / 2, geo.lat, geo.lon, geo.label, true);
      userAtomRef.current = atom;
      mouseRef.current = { x: pos.x, y: pos.y };
      ghosts.init(window.innerWidth, window.innerHeight);
    }, 100);

    const animate = (timestamp: number) => {
      const dt = lastTs ? timestamp - lastTs : 16;
      lastTs = timestamp;
      t++;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const p = paramsRef.current;

      // Background
      ctx.fillStyle = "#04060a";
      ctx.fillRect(0, 0, W, H);

      // Grid
      drawGrid(ctx, W, H);

      // Stars
      drawStarfield(ctx, starsRef.current, W, H);

      // World map
      drawWorldMap(ctx, W, H, latLonToXY);

      const user = userAtomRef.current;
      if (!user) {
        animFrame = requestAnimationFrame(animate);
        return;
      }

      if (!gameStartedRef.current) {
        // Pre-onboarding: just draw idle user atom at center
        user.x = W / 2;
        user.y = H / 2;
        user.orbitAngle += 0.02;
        drawAtom(ctx, user, p, t);
        animFrame = requestAnimationFrame(animate);
        return;
      }

      // Intro phases
      const elapsed = Date.now() - introStartRef.current;
      const phase = introPhaseRef.current;

      if (phase === "locating" && elapsed > 2000) { introPhaseRef.current = "trapped"; setIntroPhaseState("trapped"); }
      else if (phase === "trapped" && elapsed > 3500) { introPhaseRef.current = "deploy"; setIntroPhaseState("deploy"); setMilestone("start"); }
      else if (phase === "deploy" && elapsed > 5000) {
        introPhaseRef.current = "ready";
        setIntroPhaseState("ready");
        if (!hasMovedRef.current && !hasExcitedRef.current) setMilestone("move");
      }

      const currentPhase = introPhaseRef.current;

      if (currentPhase === "locating") {
        user.orbitAngle += 0.05;
        user.x = W / 2;
        user.y = H / 2;
      } else if (currentPhase === "trapped") {
        user.x = W / 2;
        user.y = H / 2;
      } else if (currentPhase === "deploy") {
        const targetPos = latLonToXY(user.lat, user.lon, W, H);
        const progress = Math.min((elapsed - 3500) / 1500, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        user.x = W / 2 + (targetPos.x - W / 2) * ease;
        user.y = H / 2 + (targetPos.y - H / 2) * ease;
      } else {
        user.x += (mouseRef.current.x - user.x) * 0.08;
        user.y += (mouseRef.current.y - user.y) * 0.08;
        user.x = Math.max(40, Math.min(W - 40, user.x));
        user.y = Math.max(40, Math.min(H - 40, user.y));
      }

      // Thermal noise
      if (currentPhase !== "locating") {
        user.x += (Math.random() - 0.5) * 0.6;
        user.y += (Math.random() - 0.5) * 0.6;
      }

      // Flash scale decay
      flashScaleRef.current += (1 - flashScaleRef.current) * 0.1;

      // Excite flash animation
      if (exciteFlashRef.current.active) {
        exciteFlashRef.current.progress += dt / 300;
        if (exciteFlashRef.current.progress >= 1) exciteFlashRef.current.active = false;
      }

      // Entangle flash animation
      if (entangleFlashRef.current.active) {
        entangleFlashRef.current.progress += dt / 400;
        if (entangleFlashRef.current.progress >= 1) entangleFlashRef.current.active = false;
      }

      // Screen shake
      if (shakeRef.current.active) {
        shakeRef.current.elapsed += dt;
        if (shakeRef.current.elapsed > 200) {
          shakeRef.current.active = false;
          if (wrapperRef.current) wrapperRef.current.style.transform = "";
        } else {
          const amp = 3 * (1 - shakeRef.current.elapsed / 200);
          const sx = Math.sin(shakeRef.current.elapsed * 0.1) * amp;
          const sy = Math.cos(shakeRef.current.elapsed * 0.13) * amp;
          if (wrapperRef.current) wrapperRef.current.style.transform = `translate(${sx}px, ${sy}px)`;
        }
      }

      // Ghost atoms
      let ghostAtoms: Atom[] = [];
      if (p.ghostsEnabled) {
        ghostAtoms = ghosts.update(dt, p, t);

        // Event feed for ghost state changes
        for (const g of ghostAtoms) {
          const prev = prevGhostStatesRef.current.get(g.id);
          if (prev !== g.state) {
            if (g.state === "rydberg") addEvent(`⚡ ${g.label} entered rydberg state`, "rydberg");
            else if (g.state === "entangled") addEvent(`🔴 ${g.label} became entangled`, "entangle");
            else if (prev === "rydberg" || prev === "entangled") addEvent(`○ ${g.label} returned to ground`, "decay");
            prevGhostStatesRef.current.set(g.id, g.state);
          }
        }
      }

      const peerAtoms = Array.from(peerAtomsRef.current.values());
      let allAtoms = [user, ...ghostAtoms, ...peerAtoms];

      allAtoms = updateAtomTimers(allAtoms, dt, p);
      userAtomRef.current = allAtoms[0];

      // Detect user decay back to ground → milestone
      if (allAtoms[0].state === "ground" && hasExcitedRef.current && !hasEntangledRef.current && !hasDecayedRef.current) {
        hasDecayedRef.current = true;
        setMilestone("decayed");
        // After 3s, go back to find_target
        setTimeout(() => { if (!hasEntangledRef.current) setMilestone("find_target"); }, 3000);
      }

      // Check entanglement
      const prevUserState = allAtoms[0].state;
      allAtoms = checkEntanglement(allAtoms, p);
      userAtomRef.current = allAtoms[0];

      if (allAtoms[0].state === "entangled" && prevUserState !== "entangled") {
        playEntangleSound();
        entangleFlashRef.current = { active: true, progress: 0 };
        addEvent("🔴 you became entangled!", "entangle");

        // Milestone: first entangle → celebrate, then free play
        if (!hasEntangledRef.current) {
          hasEntangledRef.current = true;
          setMilestone("entangle");
          setTimeout(() => setMilestone("free_play"), 6000);
        }

        if (!shownPopups.current.has("entangle")) {
          shownPopups.current.add("entangle");
          setPopup("entangle");
        }
      }

      // Count links
      let links = 0;
      for (let i = 1; i < allAtoms.length; i++) {
        if (pixelDistance(allAtoms[0].x, allAtoms[0].y, allAtoms[i].x, allAtoms[i].y) < p.connectionThreshold) {
          if (allAtoms[0].state !== "ground" && allAtoms[i].state !== "ground") links++;
        }
      }

      // === DRAW LAYERS ===

      // Entangle screen flash
      if (entangleFlashRef.current.active) {
        drawEntangleFlash(ctx, W, H, entangleFlashRef.current.progress);
      }

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
        const scale = atom.isUser ? flashScaleRef.current : 1;
        drawAtom(ctx, atom, p, t, scale);
      }

      // Layer 3: crosshair
      if (currentPhase !== "locating") {
        drawCrosshair(ctx, allAtoms[0], p.crosshairStyle, t);
      }

      // Excitation flash
      if (exciteFlashRef.current.active) {
        drawExcitationFlash(ctx, exciteFlashRef.current.x, exciteFlashRef.current.y, exciteFlashRef.current.progress);
      }

      // Layer 4: intro text
      ctx.save();
      ctx.font = "12px 'Space Mono', monospace";
      ctx.textAlign = "center";

      if (currentPhase === "locating") {
        ctx.fillStyle = "rgba(232,244,248,0.5)";
        ctx.fillText("locating...", W / 2, H / 2 + 65);
      } else if (currentPhase === "trapped") {
        ctx.fillStyle = "rgba(0,212,255,0.7)";
        ctx.fillText("this atom is now yours", W / 2, H / 2 + 65);
      } else if (currentPhase === "deploy") {
        ctx.fillStyle = "rgba(232,244,248,0.5)";
        ctx.fillText("press E or click to excite", W / 2, H - 50);
      }
      ctx.restore();

      // "YOU" label (brief)
      if (currentPhase === "trapped" || (currentPhase === "deploy" && elapsed < 6000)) {
        ctx.save();
        ctx.fillStyle = "rgba(255,215,0,0.7)";
        ctx.font = "10px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("YOU", allAtoms[0].x, allAtoms[0].y - 22);
        ctx.restore();
      }

      broadcast(allAtoms[0]);

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
  }, [myId, geo, ghosts, broadcast, addEvent]);

  return (
    <div
      ref={wrapperRef}
      className={`w-screen h-screen overflow-hidden ${gameStarted && !showOnboarding ? 'cursor-none' : ''}`}
      style={{ background: "#04060a" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Onboarding */}
      {showOnboarding && <OnboardingOverlay onStart={handleStartGame} />}

      {/* UI overlays — only show after game starts */}
      {gameStarted && (
        <>
          <ParamsPanel params={params} setParams={setParams} />
          <StatusHUD userAtom={hudAtom} atomCount={atomCount} nearbyLinks={nearbyLinks} onExcite={doExcite} />
          <EventFeed events={events} />
          <GuidedPrompts milestone={milestone} atomState={hudAtom?.state ?? "ground"} introPhase={introPhaseState} />

          <InfoPopup type={popup} onDismiss={() => setPopup(null)} onLearnMore={() => setInfoOpen(true)} />
          <InfoCard open={infoOpen} onClose={() => setInfoOpen(false)} />

          {/* Room info */}
          <div className="fixed top-4 left-4 z-50" style={{ fontFamily: "var(--font-display)" }}>
            <div className="text-[11px] font-bold tracking-wider" style={{ color: "var(--game-dim)" }}>
              THE RYDBERG ROOM
              <span className="ml-2 font-normal" style={{ color: "rgba(58,80,104,0.5)" }}>
                · experiment #0047
              </span>
            </div>
            <div className="h-px my-1 w-48" style={{ background: "var(--game-panel-border)" }} />
            <div className="text-[9px]" style={{ color: "rgba(58,80,104,0.5)" }}>
              room: rydberg-room://local · mode: {Array.from(peerAtomsRef.current.keys()).length > 0 ? "multi-tab" : "single-tab demo"}
            </div>
            <button
              onClick={() => navigate("/map")}
              className="mt-2 text-[9px] font-bold tracking-wider px-3 py-1.5 rounded transition-all"
              style={{
                border: "1px solid var(--game-accent-blue)",
                color: "var(--game-accent-blue)",
                background: "rgba(0,212,255,0.05)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.15em",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.05)")}
            >
              📍 GPS MAP
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
