"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  createClient,
  createComment,
  createProject,
  loadClients,
  saveClients,
} from "@/lib/storage";
import type { Client, ClientStatus, ProjectStatus } from "@/lib/types";

/**
 * Estado de los clientes del usuario, respaldado por localStorage.
 *
 * Toda mutacion escribe en el almacenamiento inmediatamente. `ready` indica que
 * ya se leyo el almacenamiento: antes de eso la lista vacia no significa
 * "no hay clientes", solo "todavia no se ha leido".
 */
export function useClients() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!uid) {
      setClients([]);
      setReady(false);
      return;
    }
    setClients(loadClients(uid));
    setReady(true);
  }, [uid]);

  /** Aplica una transformacion a la lista y la persiste. */
  const mutate = useCallback(
    (transform: (current: Client[]) => Client[]) => {
      if (!uid) return;
      setClients((current) => {
        const next = transform(current);
        saveClients(uid, next);
        return next;
      });
    },
    [uid],
  );

  const addClient = useCallback(
    (input: Parameters<typeof createClient>[0]) => {
      const client = createClient(input);
      mutate((current) => [client, ...current]);
      return client;
    },
    [mutate],
  );

  const updateClientStatus = useCallback(
    (clientId: string, status: ClientStatus) => {
      mutate((current) =>
        current.map((client) =>
          client.id === clientId ? { ...client, status } : client,
        ),
      );
    },
    [mutate],
  );

  const removeClient = useCallback(
    (clientId: string) => {
      mutate((current) => current.filter((client) => client.id !== clientId));
    },
    [mutate],
  );

  const addProject = useCallback(
    (clientId: string, input: Parameters<typeof createProject>[0]) => {
      const project = createProject(input);
      mutate((current) =>
        current.map((client) =>
          client.id === clientId
            ? { ...client, projects: [project, ...client.projects] }
            : client,
        ),
      );
      return project;
    },
    [mutate],
  );

  const updateProjectStatus = useCallback(
    (clientId: string, projectId: string, status: ProjectStatus) => {
      mutate((current) =>
        current.map((client) =>
          client.id === clientId
            ? {
                ...client,
                projects: client.projects.map((project) =>
                  project.id === projectId ? { ...project, status } : project,
                ),
              }
            : client,
        ),
      );
    },
    [mutate],
  );

  const removeProject = useCallback(
    (clientId: string, projectId: string) => {
      mutate((current) =>
        current.map((client) =>
          client.id === clientId
            ? {
                ...client,
                projects: client.projects.filter(
                  (project) => project.id !== projectId,
                ),
              }
            : client,
        ),
      );
    },
    [mutate],
  );

  const addComment = useCallback(
    (clientId: string, projectId: string, body: string) => {
      const author = user?.displayName || user?.email || "Anónimo";
      const comment = createComment({ body, author });
      mutate((current) =>
        current.map((client) =>
          client.id === clientId
            ? {
                ...client,
                projects: client.projects.map((project) =>
                  project.id === projectId
                    ? { ...project, comments: [...project.comments, comment] }
                    : project,
                ),
              }
            : client,
        ),
      );
      return comment;
    },
    [mutate, user],
  );

  return {
    clients,
    ready,
    addClient,
    updateClientStatus,
    removeClient,
    addProject,
    updateProjectStatus,
    removeProject,
    addComment,
  };
}
