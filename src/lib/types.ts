/**
 * Modelo de datos del CRM.
 *
 * Nota: por ahora todo se persiste en el navegador (localStorage). Los tipos
 * estan pensados para migrar a Firestore sin cambiar la forma de los objetos:
 * cada entidad tiene `id` propio y fechas en ISO 8601.
 */

export type ClientStatus = "lead" | "activo" | "pausado" | "cerrado";

export type ProjectStatus =
  | "discovery"
  | "propuesta"
  | "en_curso"
  | "entregado"
  | "cancelado";

export interface Comment {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number | null;
  createdAt: string;
  comments: Comment[];
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  projects: Project[];
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: "Lead",
  activo: "Activo",
  pausado: "Pausado",
  cerrado: "Cerrado",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  discovery: "Discovery",
  propuesta: "Propuesta",
  en_curso: "En curso",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const CLIENT_STATUS_ORDER: ClientStatus[] = [
  "lead",
  "activo",
  "pausado",
  "cerrado",
];

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "discovery",
  "propuesta",
  "en_curso",
  "entregado",
  "cancelado",
];
