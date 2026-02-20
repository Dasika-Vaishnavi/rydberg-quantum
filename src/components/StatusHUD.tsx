import type { Atom } from "@/lib/types";

interface Props {
  userAtom: Atom | null;
  atomCount: number;
  nearbyLinks: number;
}

export default function StatusHUD({ userAtom, atomCount, nearbyLinks }: Props) {
  const state = userAtom?.state ?? "ground";
  const timer = userAtom?.stateTimer ?? 0;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 font-mono text-[11px] leading-relaxed select-none"
      style={{ color: "#fff" }}
    >
      <div className="space-y-0.5">
        <div>
          <span className="text-white/40">state: </span>
          <span
            style={{
              color:
                state === "entangled"
                  ? "#ef4444"
                  : state === "rydberg"
                  ? "#3b82f6"
                  : "#fff",
            }}
          >
            {state}
          </span>
        </div>
        <div>
          <span className="text-white/40">nearby links: </span>
          <span>{nearbyLinks}</span>
        </div>
        <div>
          <span className="text-white/40">atoms online: </span>
          <span>{atomCount}</span>
        </div>
        <div className="pt-1 text-white/30">
          {state === "ground" && "press E to excite"}
          {state === "rydberg" && `decaying in ${(timer / 1000).toFixed(1)}s`}
          {state === "entangled" && "entangled. observe carefully."}
        </div>
      </div>
    </div>
  );
}
