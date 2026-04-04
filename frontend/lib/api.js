import { getIdToken } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function call(endpoint, body = null, method = "POST") {
  const token = await getIdToken();
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  chat: (messages, style, project_id) =>
    call("/api/chat", { messages, style, project_id }),

  generateImages: (shots, style, project_id) =>
    call("/api/generate-images", { shots, style, project_id }),

  generateAudio: (shots, project_id) =>
    call("/api/generate-audio", { shots, project_id }),

  regenerateImage: (shot, style, project_id, shot_idx) =>
    call("/api/regenerate-image", { shot, style, project_id, shot_idx }),

  listProjects: () => call("/api/projects", null, "GET"),

  getProject: (id) => call(`/api/projects/${id}`, null, "GET"),

  saveProject: (data) => call("/api/projects", data),
};
