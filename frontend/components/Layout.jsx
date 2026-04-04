"use client";
import Image from "next/image";
import { signOutUser } from "../lib/firebase";

const TABS = ["script", "storyboard", "playback"];

export default function Layout({ activeTab, onTabChange, projectTitle, user, onNewProject, children }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Icon sidebar */}
      <aside className="flex flex-col items-center gap-4 py-4 border-r" style={{ width: 44, background: "#0D0D14", borderColor: "#1E1E2E" }}>
        <Image src="/logo.png" alt="logo" width={28} height={28} className="mb-2" />
        <SidebarIcon title="New Scene" onClick={onNewProject}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        </SidebarIcon>
        <SidebarIcon title="Script">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
        </SidebarIcon>
        <SidebarIcon title="History">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
        </SidebarIcon>
        {/* spacer */}
        <div className="flex-1" />
        <SidebarIcon title={`Sign out (${user?.email})`} onClick={signOutUser}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </SidebarIcon>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top nav */}
        <header className="flex items-center gap-4 px-4 border-b shrink-0" style={{ height: 48, background: "#0D0D14", borderColor: "#1E1E2E" }}>
          <span className="text-sm font-semibold tracking-widest" style={{ color: "#8B5CF6", fontFamily: "Inter, sans-serif" }}>
            AI DIRECTOR
          </span>
          {/* Tab pills */}
          <nav className="flex gap-1 ml-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className="px-3 py-1 rounded text-xs font-medium capitalize transition-all"
                style={{
                  background: activeTab === tab ? "#1E1E2E" : "transparent",
                  color: activeTab === tab ? "#8B5CF6" : "#64748B",
                  borderBottom: activeTab === tab ? "2px solid #8B5CF6" : "2px solid transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </nav>
          {/* Project name */}
          {projectTitle && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full truncate max-w-xs" style={{ background: "#1E1E2E", color: "#94A3B8" }}>
              {projectTitle}
            </span>
          )}
          {/* User avatar */}
          {user?.photoURL && (
            <img src={user.photoURL} alt="avatar" className="h-7 w-7 rounded-full ml-2 ring-1" style={{ ringColor: "#1E1E2E" }} />
          )}
        </header>

        {/* Content row */}
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarIcon({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded transition-all"
      style={{ color: "#64748B" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#8B5CF6")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
    >
      {children}
    </button>
  );
}
