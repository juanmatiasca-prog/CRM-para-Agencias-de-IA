/**
 * Migracion puntual del almacenamiento local a Cloud Firestore.
 *
 * Antes de conectar la base de datos, los clientes vivian en localStorage bajo
 * `crm_mkt_hackers:v1:<uid>`. Este modulo sube esos datos una sola vez por
 * usuario y navegador, y deja una marca para no repetirlo.
 *
 * No borra el original: si algo sale mal, los datos siguen en el navegador.
 * Es codigo de transicion y puede eliminarse cuando ya nadie tenga datos
 * locales pendientes.
 */
import {
  addClient,
  addComment,
  addProject,
  setClientStatus,
  setProjectStatus,
} from "@/lib/repo";
import type { Client } from "@/lib/types";

const LEGACY_PREFIX = "crm_mkt_hackers:v1:";
const DONE_PREFIX = "crm_mkt_hackers:migrated:";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Lee los clientes guardados en el navegador por la version anterior. */
function readLegacy(uid: string): Client[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(`${LEGACY_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Client[]) : [];
  } catch {
    return [];
  }
}

function alreadyMigrated(uid: string): boolean {
  if (!canUseStorage()) return true;
  try {
    return window.localStorage.getItem(`${DONE_PREFIX}${uid}`) === "1";
  } catch {
    return true;
  }
}

function markMigrated(uid: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(`${DONE_PREFIX}${uid}`, "1");
  } catch {
    // Si el navegador no deja escribir, la migracion se reintentara. Es
    // preferible a perder los datos por marcarla hecha sin estarlo.
  }
}

export interface MigrationResult {
  migrated: boolean;
  clients: number;
  projects: number;
  comments: number;
}

const NOTHING: MigrationResult = {
  migrated: false,
  clients: 0,
  projects: 0,
  comments: 0,
};

/**
 * Sube a Firestore los datos locales del usuario, si los hay y no se
 * migraron ya. Se marca como hecha solo si termina entera.
 */
export async function migrateLocalData(uid: string): Promise<MigrationResult> {
  if (alreadyMigrated(uid)) return NOTHING;

  const legacy = readLegacy(uid);
  if (legacy.length === 0) {
    markMigrated(uid);
    return NOTHING;
  }

  let projects = 0;
  let comments = 0;

  // En orden inverso porque la lista se ordena por fecha de creacion
  // descendente: subiendo del mas antiguo al mas nuevo se conserva el orden.
  for (const client of [...legacy].reverse()) {
    const clientId = await addClient(uid, {
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      industry: client.industry,
      notes: client.notes,
    });

    // `addClient` siempre crea en estado "lead": si el local tenia otro,
    // se corrige para no perder el avance comercial.
    if (client.status && client.status !== "lead") {
      await setClientStatus(uid, clientId, client.status);
    }

    for (const project of [...(client.projects ?? [])].reverse()) {
      const projectId = await addProject(uid, clientId, {
        name: project.name,
        description: project.description,
        budget: project.budget,
      });
      projects += 1;

      if (project.status && project.status !== "discovery") {
        await setProjectStatus(uid, clientId, projectId, project.status);
      }

      for (const comment of project.comments ?? []) {
        await addComment(uid, clientId, projectId, comment.body, comment.author);
        comments += 1;
      }
    }
  }

  markMigrated(uid);

  return { migrated: true, clients: legacy.length, projects, comments };
}
