"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { migrateLocalData } from "@/lib/migrate";
import * as repo from "@/lib/repo";
import type {
  Client,
  ClientStatus,
  Comment,
  Project,
  ProjectStatus,
} from "@/lib/types";

/**
 * Estado de los clientes del usuario, respaldado por Cloud Firestore.
 *
 * Las suscripciones van en tres capas para no leer de mas:
 *
 *   1. Clientes: siempre.
 *   2. Proyectos: de todos los clientes, porque la lista muestra cuantos tiene
 *      cada uno.
 *   3. Comentarios: solo de los proyectos del cliente seleccionado, que es el
 *      unico cuyo detalle esta en pantalla.
 *
 * Al montar, sube a Firestore los datos que hubiera en localStorage de la
 * version anterior. Es una operacion unica por usuario y navegador.
 */
export function useClients(selectedClientId: string | null) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [projectsByClient, setProjectsByClient] = useState<Record<string, Project[]>>({});
  const [commentsByProject, setCommentsByProject] = useState<Record<string, Comment[]>>({});

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migration, setMigration] = useState<string | null>(null);

  // Evita relanzar la migracion en cada render del mismo montaje.
  const migrationStarted = useRef<string | null>(null);

  const handleError = useCallback((cause: Error) => {
    const code = (cause as Error & { code?: string }).code;
    setError(
      code === "permission-denied"
        ? "Firestore denegó el acceso. Revisa que las reglas estén desplegadas."
        : "No se pudo conectar con la base de datos.",
    );
  }, []);

  // --- Migracion desde localStorage -----------------------------
  useEffect(() => {
    if (!uid || migrationStarted.current === uid) return;
    migrationStarted.current = uid;

    migrateLocalData(uid)
      .then((result) => {
        if (!result.migrated) return;
        setMigration(
          `Se subieron ${result.clients} cliente(s), ${result.projects} proyecto(s) y ${result.comments} comentario(s) desde este navegador.`,
        );
      })
      .catch(() => {
        setMigration(
          "No se pudieron subir los datos guardados en este navegador. Siguen ahí, sin perderse.",
        );
      });
  }, [uid]);

  // --- Capa 1: clientes -----------------------------------------
  useEffect(() => {
    if (!uid) {
      setRawClients([]);
      setReady(false);
      return;
    }
    setError(null);
    const unsubscribe = repo.watchClients(
      uid,
      (clients) => {
        setRawClients(clients);
        setReady(true);
      },
      (cause) => {
        handleError(cause);
        setReady(true);
      },
    );
    return unsubscribe;
  }, [uid, handleError]);

  // --- Capa 2: proyectos de cada cliente ------------------------
  // La clave de dependencia es la lista de ids unida: cambia solo cuando se
  // anade o quita un cliente, no en cada renderizado.
  const clientIdsKey = rawClients.map((client) => client.id).join(",");

  useEffect(() => {
    if (!uid || clientIdsKey === "") {
      setProjectsByClient({});
      return;
    }
    const clientIds = clientIdsKey.split(",");
    const unsubscribers = clientIds.map((clientId) =>
      repo.watchProjects(
        uid,
        clientId,
        (projects) =>
          setProjectsByClient((current) => ({ ...current, [clientId]: projects })),
        handleError,
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid, clientIdsKey, handleError]);

  // --- Capa 3: comentarios del cliente seleccionado -------------
  const selectedProjectIdsKey = (
    selectedClientId ? (projectsByClient[selectedClientId] ?? []) : []
  )
    .map((project) => project.id)
    .join(",");

  useEffect(() => {
    if (!uid || !selectedClientId || selectedProjectIdsKey === "") return;
    const projectIds = selectedProjectIdsKey.split(",");
    const unsubscribers = projectIds.map((projectId) =>
      repo.watchComments(
        uid,
        selectedClientId,
        projectId,
        (comments) =>
          setCommentsByProject((current) => ({ ...current, [projectId]: comments })),
        handleError,
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid, selectedClientId, selectedProjectIdsKey, handleError]);

  // --- Ensamblado para la interfaz ------------------------------
  const clients = useMemo<Client[]>(
    () =>
      rawClients.map((client) => ({
        ...client,
        projects: (projectsByClient[client.id] ?? []).map((project) => ({
          ...project,
          comments: commentsByProject[project.id] ?? [],
        })),
      })),
    [rawClients, projectsByClient, commentsByProject],
  );

  // --- Mutaciones ------------------------------------------------
  // Firestore actualiza la interfaz solo, por el listener. No hace falta
  // tocar el estado local tras escribir.

  const addClient = useCallback(
    (input: Parameters<typeof repo.addClient>[1]) => {
      if (!uid) return Promise.reject(new Error("sin sesión"));
      return repo.addClient(uid, input);
    },
    [uid],
  );

  const updateClientStatus = useCallback(
    (clientId: string, status: ClientStatus) => {
      if (!uid) return Promise.resolve();
      return repo.setClientStatus(uid, clientId, status);
    },
    [uid],
  );

  const removeClient = useCallback(
    (clientId: string) => {
      if (!uid) return Promise.resolve();
      return repo.removeClient(uid, clientId);
    },
    [uid],
  );

  const addProject = useCallback(
    (clientId: string, input: Parameters<typeof repo.addProject>[2]) => {
      if (!uid) return Promise.reject(new Error("sin sesión"));
      return repo.addProject(uid, clientId, input);
    },
    [uid],
  );

  const updateProjectStatus = useCallback(
    (clientId: string, projectId: string, status: ProjectStatus) => {
      if (!uid) return Promise.resolve();
      return repo.setProjectStatus(uid, clientId, projectId, status);
    },
    [uid],
  );

  const removeProject = useCallback(
    (clientId: string, projectId: string) => {
      if (!uid) return Promise.resolve();
      return repo.removeProject(uid, clientId, projectId);
    },
    [uid],
  );

  const addComment = useCallback(
    (clientId: string, projectId: string, body: string) => {
      if (!uid) return Promise.reject(new Error("sin sesión"));
      const author = user?.displayName || user?.email || "Anónimo";
      return repo.addComment(uid, clientId, projectId, body, author);
    },
    [uid, user],
  );

  return {
    clients,
    ready,
    error,
    migration,
    dismissMigration: () => setMigration(null),
    addClient,
    updateClientStatus,
    removeClient,
    addProject,
    updateProjectStatus,
    removeProject,
    addComment,
  };
}
