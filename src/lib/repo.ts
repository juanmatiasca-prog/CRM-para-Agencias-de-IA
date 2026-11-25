/**
 * Acceso a datos sobre Cloud Firestore.
 *
 * ESTRUCTURA
 *
 *   /users/{uid}                                              perfil
 *   /users/{uid}/clients/{clientId}                           cliente
 *   /users/{uid}/clients/{clientId}/projects/{projectId}      proyecto
 *   .../projects/{projectId}/comments/{commentId}             comentario
 *
 * Todo cuelga del uid del usuario. El aislamiento entre usuarios no se
 * garantiza aqui sino en `firestore.rules`: este modulo solo construye rutas
 * correctas. Las reglas son las que impiden que alguien lea datos ajenos.
 *
 * Las fechas se escriben con `serverTimestamp()` y se leen convertidas a ISO
 * 8601, que es lo que espera la interfaz. Escribirlas en servidor evita que el
 * reloj del navegador decida el orden de los registros.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

import { purgeAttachments } from "@/lib/attachments";
import { getDb } from "@/lib/firebase";
import type {
  Client,
  ClientStatus,
  Comment,
  Project,
  ProjectStatus,
} from "@/lib/types";

// ---------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------

const userDoc = (uid: string) => doc(getDb(), "users", uid);

const clientsCol = (uid: string) => collection(getDb(), "users", uid, "clients");

const projectsCol = (uid: string, clientId: string) =>
  collection(getDb(), "users", uid, "clients", clientId, "projects");

const commentsCol = (uid: string, clientId: string, projectId: string) =>
  collection(
    getDb(),
    "users",
    uid,
    "clients",
    clientId,
    "projects",
    projectId,
    "comments",
  );

// ---------------------------------------------------------------
// Conversion de documentos
// ---------------------------------------------------------------

/**
 * Convierte un Timestamp de Firestore a ISO 8601.
 *
 * Devuelve cadena vacia mientras el valor esta pendiente: con
 * `serverTimestamp()` la escritura optimista local llega con `null` hasta que
 * el servidor confirma. La interfaz debe tolerar ese instante.
 */
function toIso(value: unknown): string {
  if (!value) return "";
  const stamp = value as Timestamp;
  if (typeof stamp.toDate !== "function") return "";
  return stamp.toDate().toISOString();
}

function toClient(snapshot: QueryDocumentSnapshot<DocumentData>): Client {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: (data.name as string) ?? "",
    company: (data.company as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    industry: (data.industry as string) ?? "",
    notes: (data.notes as string) ?? "",
    status: (data.status as ClientStatus) ?? "lead",
    createdAt: toIso(data.createdAt),
    projects: [],
  };
}

function toProject(snapshot: QueryDocumentSnapshot<DocumentData>): Project {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: (data.name as string) ?? "",
    description: (data.description as string) ?? "",
    status: (data.status as ProjectStatus) ?? "discovery",
    budget: (data.budget as number | null) ?? null,
    createdAt: toIso(data.createdAt),
    comments: [],
  };
}

function toComment(snapshot: QueryDocumentSnapshot<DocumentData>): Comment {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    body: (data.body as string) ?? "",
    author: (data.author as string) ?? "",
    createdAt: toIso(data.createdAt),
  };
}

// ---------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------

/**
 * Crea o refresca el documento de perfil. Se llama al iniciar sesion.
 * Usa merge para no pisar `createdAt` en los accesos posteriores.
 */
export async function ensureProfile(
  uid: string,
  displayName: string,
  email: string,
): Promise<void> {
  await setDoc(
    userDoc(uid),
    {
      displayName: displayName.slice(0, 80),
      email: email.slice(0, 320),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---------------------------------------------------------------
// Suscripciones en tiempo real
// ---------------------------------------------------------------

export function watchClients(
  uid: string,
  onData: (clients: Client[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(clientsCol(uid), orderBy("createdAt", "desc")),
    (snapshot) => onData(snapshot.docs.map(toClient)),
    onError,
  );
}

export function watchProjects(
  uid: string,
  clientId: string,
  onData: (projects: Project[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(projectsCol(uid, clientId), orderBy("createdAt", "desc")),
    (snapshot) => onData(snapshot.docs.map(toProject)),
    onError,
  );
}

export function watchComments(
  uid: string,
  clientId: string,
  projectId: string,
  onData: (comments: Comment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(commentsCol(uid, clientId, projectId), orderBy("createdAt", "asc")),
    (snapshot) => onData(snapshot.docs.map(toComment)),
    onError,
  );
}

// ---------------------------------------------------------------
// Escrituras
//
// Los objetos enviados contienen exactamente los campos que declaran las
// Security Rules: un campo de mas hace que la regla `hasOnly` deniegue la
// escritura entera.
// ---------------------------------------------------------------

export async function addClient(
  uid: string,
  input: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    industry?: string;
    notes?: string;
  },
): Promise<string> {
  const reference = await addDoc(clientsCol(uid), {
    name: input.name.trim().slice(0, 120),
    company: (input.company ?? "").trim().slice(0, 120),
    email: (input.email ?? "").trim().slice(0, 320),
    phone: (input.phone ?? "").trim().slice(0, 40),
    industry: (input.industry ?? "").trim().slice(0, 80),
    notes: (input.notes ?? "").trim().slice(0, 5000),
    status: "lead" satisfies ClientStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function setClientStatus(
  uid: string,
  clientId: string,
  status: ClientStatus,
): Promise<void> {
  await updateDoc(doc(clientsCol(uid), clientId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Borra un cliente con todos sus proyectos y comentarios.
 *
 * Firestore NO borra las subcolecciones al borrar el documento padre: quedan
 * huerfanas y siguen ocupando y facturando. Hay que recorrerlas a mano.
 */
export async function removeClient(uid: string, clientId: string): Promise<void> {
  const projects = await getDocs(projectsCol(uid, clientId));
  for (const projectSnapshot of projects.docs) {
    await removeProject(uid, clientId, projectSnapshot.id);
  }

  await purgeAttachments(uid, { kind: "client", clientId });
  await deleteDoc(doc(clientsCol(uid), clientId));
}

export async function addProject(
  uid: string,
  clientId: string,
  input: { name: string; description?: string; budget?: number | null },
): Promise<string> {
  const reference = await addDoc(projectsCol(uid, clientId), {
    name: input.name.trim().slice(0, 120),
    description: (input.description ?? "").trim().slice(0, 5000),
    status: "discovery" satisfies ProjectStatus,
    budget:
      typeof input.budget === "number" && Number.isFinite(input.budget)
        ? Math.max(0, input.budget)
        : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function setProjectStatus(
  uid: string,
  clientId: string,
  projectId: string,
  status: ProjectStatus,
): Promise<void> {
  await updateDoc(doc(projectsCol(uid, clientId), projectId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function removeProject(
  uid: string,
  clientId: string,
  projectId: string,
): Promise<void> {
  const comments = await getDocs(commentsCol(uid, clientId, projectId));
  for (const commentSnapshot of comments.docs) {
    await purgeAttachments(uid, {
      kind: "comment",
      clientId,
      projectId,
      commentId: commentSnapshot.id,
    });
    await deleteDoc(commentSnapshot.ref);
  }

  await purgeAttachments(uid, { kind: "project", clientId, projectId });
  await deleteDoc(doc(projectsCol(uid, clientId), projectId));
}

export async function addComment(
  uid: string,
  clientId: string,
  projectId: string,
  body: string,
  author: string,
): Promise<string> {
  const reference = await addDoc(commentsCol(uid, clientId, projectId), {
    body: body.trim().slice(0, 5000),
    author: author.slice(0, 320),
    createdAt: serverTimestamp(),
  });
  return reference.id;
}
