"use client";
import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { api } from "../../lib/api";
import Layout from "../../components/Layout";
import ChatPanel from "../../components/ChatPanel";
import ScriptTab from "../../components/ScriptTab";
import StoryboardTab from "../../components/StoryboardTab";
import PlaybackTab from "../../components/PlaybackTab";

const initialState = {
  user: null,
  authLoading: true,
  messages: [],
  script: null,
  style: null,
  stage: "idle", // idle | chatting | script_ready | generating_images | generating_audio | playback_ready
  activeTab: "script",
  projectId: null,
  currentSlide: 0,
  isPlaying: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER": return { ...state, user: action.user, authLoading: false };
    case "AUTH_LOADING_DONE": return { ...state, authLoading: false };
    case "ADD_MESSAGE": return { ...state, messages: [...state.messages, action.message] };
    case "SET_STAGE": return { ...state, stage: action.stage };
    case "SET_SCRIPT": return { ...state, script: action.script, activeTab: "script", stage: "script_ready" };
    case "SET_STYLE": return { ...state, style: action.style };
    case "SET_SHOTS": return { ...state, script: action.shots };
    case "SET_ACTIVE_TAB": return { ...state, activeTab: action.tab };
    case "SET_PROJECT_ID": return { ...state, projectId: action.id };
    case "SET_SLIDE": return { ...state, currentSlide: action.idx };
    case "SET_PLAYING": return { ...state, isPlaying: action.playing };
    case "SET_ERROR": return { ...state, error: action.error };
    case "RESET_PROJECT": return { ...initialState, user: state.user, authLoading: false };
    default: return state;
  }
}

export default function DirectorPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.replace("/"); return; }
      dispatch({ type: "SET_USER", user });
    });
    return unsub;
  }, [router]);

  async function sendMessage(text) {
    if (!text.trim() || state.stage === "generating_images" || state.stage === "generating_audio") return;

    const userMsg = { role: "user", content: text };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    dispatch({ type: "SET_STAGE", stage: "chatting" });

    const allMessages = [...state.messages, userMsg];

    // Extract style hint from conversation
    let style = state.style;
    if (!style) {
      const lower = text.toLowerCase();
      const styles = ["cinematic", "anime", "noir", "cartoon", "sci-fi", "horror", "fantasy", "documentary"];
      for (const s of styles) {
        if (lower.includes(s)) { style = s; dispatch({ type: "SET_STYLE", style: s }); break; }
      }
    }

    try {
      const res = await api.chat(allMessages, style, state.projectId);
      const aiMsg = {
        role: "assistant",
        content: res.script
          ? `Your ${res.script.length}-shot screenplay is ready. Review it in the Script tab, then click "Generate Storyboard" to create images.`
          : res.reply,
      };
      dispatch({ type: "ADD_MESSAGE", message: aiMsg });

      if (res.script) {
        // Generate a project ID immediately so generateImages/generateAudio never
        // block on the async autoSave debounce (1 s delay + network round-trip).
        const newProjectId = state.projectId || crypto.randomUUID();
        if (!state.projectId) dispatch({ type: "SET_PROJECT_ID", id: newProjectId });
        dispatch({ type: "SET_SCRIPT", script: res.script });
        autoSave({ ...state, projectId: newProjectId, messages: [...allMessages, aiMsg], script: res.script, style, stage: "script_ready" });
      } else {
        dispatch({ type: "SET_STAGE", stage: "idle" });
      }
    } catch (e) {
      dispatch({ type: "ADD_MESSAGE", message: { role: "assistant", content: `Sorry, something went wrong: ${e.message}` } });
      dispatch({ type: "SET_STAGE", stage: "idle" });
    }
  }

  async function generateImages() {
    if (!state.script || !state.projectId) return;
    dispatch({ type: "SET_STAGE", stage: "generating_images" });
    dispatch({ type: "SET_ACTIVE_TAB", tab: "storyboard" });
    try {
      const res = await api.generateImages(state.script, state.style || "cinematic", state.projectId);
      dispatch({ type: "SET_SHOTS", shots: res.shots });
      dispatch({ type: "SET_STAGE", stage: "script_ready" });
      autoSave({ ...state, script: res.shots, stage: "script_ready" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: `Image generation failed: ${e.message}` });
      dispatch({ type: "SET_STAGE", stage: "script_ready" });
    }
  }

  async function generateAudio() {
    if (!state.script || !state.projectId) return;
    dispatch({ type: "SET_STAGE", stage: "generating_audio" });
    try {
      const res = await api.generateAudio(state.script, state.projectId);
      dispatch({ type: "SET_SHOTS", shots: res.shots });
      dispatch({ type: "SET_STAGE", stage: "playback_ready" });
      dispatch({ type: "SET_ACTIVE_TAB", tab: "playback" });
      dispatch({ type: "SET_SLIDE", idx: 0 });
      dispatch({ type: "SET_PLAYING", playing: true });
      autoSave({ ...state, script: res.shots, stage: "playback_ready" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: `Audio generation failed: ${e.message}` });
      dispatch({ type: "SET_STAGE", stage: "script_ready" });
    }
  }

  async function regenerateImage(shotIdx) {
    if (!state.script || !state.projectId) return;
    const shot = state.script[shotIdx];
    const updated = [...state.script];
    updated[shotIdx] = { ...shot, image_url: null };
    dispatch({ type: "SET_SHOTS", shots: updated });
    try {
      const res = await api.regenerateImage(shot, state.style || "cinematic", state.projectId, shotIdx);
      const next = [...state.script];
      next[shotIdx] = { ...shot, image_url: res.image_url };
      dispatch({ type: "SET_SHOTS", shots: next });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: `Regenerate failed: ${e.message}` });
      dispatch({ type: "SET_SHOTS", shots: state.script });
    }
  }

  async function autoSave(snapState) {
    if (!snapState.user) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const title = snapState.messages.find((m) => m.role === "user")?.content?.slice(0, 60) || "Untitled Scene";
        const res = await api.saveProject({
          project_id: snapState.projectId || undefined,
          title,
          style: snapState.style,
          messages: snapState.messages,
          shots: snapState.script || [],
          stage: snapState.stage,
        });
        if (!snapState.projectId) dispatch({ type: "SET_PROJECT_ID", id: res.project_id });
      } catch {
        // silent fail
      }
    }, 1000);
  }

  if (state.authLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const rightPanel = {
    script: (
      <ScriptTab
        script={state.script}
        stage={state.stage}
        style={state.style}
        onGenerateImages={() => generateImages()}
      />
    ),
    storyboard: (
      <StoryboardTab
        script={state.script}
        stage={state.stage}
        style={state.style}
        onRegenerateImage={regenerateImage}
        onGenerateAudio={() => generateAudio()}
      />
    ),
    playback: (
      <PlaybackTab
        script={state.script}
        currentSlide={state.currentSlide}
        isPlaying={state.isPlaying}
        onSlideChange={(idx) => dispatch({ type: "SET_SLIDE", idx })}
        onPlayingChange={(p) => dispatch({ type: "SET_PLAYING", playing: p })}
      />
    ),
  };

  return (
    <Layout
      activeTab={state.activeTab}
      onTabChange={(tab) => dispatch({ type: "SET_ACTIVE_TAB", tab })}
      projectTitle={state.messages.find((m) => m.role === "user")?.content?.slice(0, 40)}
      user={state.user}
      onNewProject={() => dispatch({ type: "RESET_PROJECT" })}
    >
      <ChatPanel
        messages={state.messages}
        stage={state.stage}
        hasScript={!!state.script}
        onSend={sendMessage}
        onRegenerate={() => sendMessage("Please regenerate the script with a different approach")}
      />
      {rightPanel[state.activeTab] || rightPanel.script}
    </Layout>
  );
}
