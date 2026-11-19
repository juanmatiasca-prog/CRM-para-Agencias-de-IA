/**
 * Persistencia temporal en el navegador.
 *
 * Todavia no hay base de datos: los datos viven en localStorage, aislados por
 * usuario (uid de Firebase Auth). Esto significa que no se comparten entre
 * navegadores ni dispositivos. Cuando se conecte Firestore, solo hay que
 * sustituir este modulo manteniendo la misma interfaz.
 */
import type { Client, Comment, Project } from "./types";

const VERSION = "v1";

function storageKey(uid: string) {
  return `crm_mkt_hackers:${VERSION}:${uid}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Lee los clientes del usuario. Nunca lanza: ante cualquier fallo devuelve []. */
export function loadClients(uid: string): Client[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Client[];
  } catch {
    return [];
  }
}

/** Guarda los clientes del usuario. Devuelve false si el navegador lo impide. */
export function saveClients(uid: string, clients: Client[]): boolean {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(clients));
    return true;
  } catch {
    return false;
  }
}

export function createClient(input: {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  notes?: string;
}): Client {
  return {
    id: newId(),
    name: input.name.trim(),
    company: (input.company ?? "").trim(),
    email: (input.email ?? "").trim(),
    phone: (input.phone ?? "").trim(),
    industry: (input.industry ?? "").trim(),
    status: "lead",
    notes: (input.notes ?? "").trim(),
    createdAt: new Date().toISOString(),
    projects: [],
  };
}

export function createProject(input: {
  name: string;
  description?: string;
  budget?: number | null;
}): Project {
  return {
    id: newId(),
    name: input.name.trim(),
    description: (input.description ?? "").trim(),
    status: "discovery",
    budget: input.budget ?? null,
    createdAt: new Date().toISOString(),
    comments: [],
  };
}

export function createComment(input: { body: string; author: string }): Comment {
  return {
    id: newId(),
    body: input.body.trim(),
    author: input.author,
    createdAt: new Date().toISOString(),
  };
}

/** Numero total de proyectos entre todos los clientes. */
export function countProjects(clients: Client[]): number {
  return clients.reduce((total, client) => total + client.projects.length, 0);
}

/** Numero total de comentarios entre todos los proyectos. */
export function countComments(clients: Client[]): number {
  return clients.reduce(
    (total, client) =>
      total + client.projects.reduce((sum, project) => sum + project.comments.length, 0),
    0,
  );
}
