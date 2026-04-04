"use client";
import { useState } from "react";

const SHOT_BADGES = ["STATIC", "LOW ANGLE", "PAN", "WIDE", "CLOSE", "HIGH DETAIL", "OVERHEAD"];

function shotBadges(shot) {
  const badges = [];
  const s = (shot.shot || "").toLowerCase();
  if (s.includes("wide")) badges.push("WIDE");
  if (s.includes("close")) badges.push("CLOSE-UP");
  if (s.includes("medium")) badges.push("MEDIUM");
  if (s.includes("over")) badges.push("OTS");
  if (shot.type === "narration") badges.push("STATIC");
  if (shot.type === "dialogue") badges.push("CLOSE-UP");
  return badges.slice(0, 2);
}

export default function ScriptTab({ script, stage, style, onGenerateImages }) {
  const [editMode, setEditMode] = useState(false);
  const isGenerating = stage === "generating_images";
  const hasImages = script?.some((s) => s.image_url);

  if (!script) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ background: "#0A0A0F" }}>
        <div className="text-4xl opacity-20">🎬</div>
        <p className="text-sm" style={{ color: "#64748B" }}>Your screenplay will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0" style={{ borderColor: "#1E1E2E", background: "#0D0D14" }}>
        <span className="text-sm font-semibold truncate mr-auto" style={{ color: "#F1F5F9" }}>
          Sequence: <span style={{ color: "#8B5CF6" }}>{style ? `${style.charAt(0).toUpperCase() + style.slice(1)} Scene` : "Untitled Scene"}</span>
        </span>
        <button onClick={() => setEditMode(!editMode)} className="text-xs px-2 py-1 rounded transition-all" style={{ color: "#64748B", border: "1px solid #1E1E2E", background: editMode ? "#1E1E2E" : "transparent" }}>
          {editMode ? "✓ Done" : "✏ Edit"}
        </button>
        <button
          onClick={onGenerateImages}
          disabled={isGenerating || hasImages}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white" }}
        >
          {isGenerating ? (
            <><div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> Generating…</>
          ) : hasImages ? (
            "✓ Storyboard Ready"
          ) : (
            <>✦ Generate Storyboard</>
          )}
        </button>
      </div>

      {/* Shot cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {script.map((shot, i) => (
          <ShotCard key={i} shot={shot} idx={i} editMode={editMode} />
        ))}
      </div>
    </div>
  );
}

function ShotCard({ shot, idx, editMode }) {
  const badges = shotBadges(shot);
  const shotParts = shot.shot?.split(/[-–]/) || [];
  const shotType = shotParts[0]?.trim() || shot.shot;
  const shotSubtitle = shotParts[1]?.trim() || "";

  return (
    <div className="rounded-lg p-4" style={{ background: "#13131A", border: "1px solid #1E1E2E" }}>
      {/* Shot header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold" style={{ color: "#8B5CF6" }}>SHOT {idx + 1}</span>
        {badges.map((b) => (
          <span key={b} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1E1E2E", color: "#64748B" }}>{b}</span>
        ))}
      </div>

      {/* Shot name */}
      <h3 className="text-lg font-bold mb-1 uppercase tracking-wide" style={{ color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
        {shotType}{shotSubtitle && <span style={{ color: "#94A3B8" }}> – {shotSubtitle}</span>}
      </h3>

      {/* Visual description */}
      {editMode ? (
        <textarea defaultValue={shot.visual} rows={2} className="w-full text-xs rounded p-2 resize-none outline-none font-mono mb-2" style={{ background: "#0A0A0F", border: "1px solid #2D2D3E", color: "#94A3B8" }} />
      ) : (
        <p className="text-xs leading-relaxed mb-2 font-mono" style={{ color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>
          {shot.visual}
        </p>
      )}

      {/* Dialogue / narration */}
      {shot.audio && (
        <div className={shot.type === "dialogue" ? "text-center border-t pt-2" : "border-t pt-2"} style={{ borderColor: "#1E1E2E" }}>
          {shot.type === "dialogue" ? (
            <>
              <p className="text-xs font-bold uppercase mb-0.5" style={{ color: "#F59E0B" }}>
                {shot.voice_name || "CHARACTER"}
              </p>
              <p className="text-xs italic font-mono" style={{ color: "#F1F5F9", fontFamily: "JetBrains Mono, monospace" }}>
                {shot.audio}
              </p>
            </>
          ) : (
            <p className="text-xs font-mono" style={{ color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
              <span style={{ color: "#8B5CF6" }}>NARRATION</span> · {shot.voice_name || "Rachel"} · {shot.audio}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
