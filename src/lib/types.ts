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

/**
 * Metadatos de un archivo adjunto. El fichero en si vive en Cloud Storage;
 * aqui solo se guarda como encontrarlo y como mostrarlo.
 *
 * `path` es la ruta dentro del bucket, no una URL. La URL de descarga se pide
 * a Firebase en el momento de usarla, para que el acceso pase siempre por las
 * reglas de seguridad en vez de quedar guardado en la base de datos.
 */
export interface Attachment {
  id: string;
  name: string;
  path: string;
  contentType: string;
  size: number;
  createdAt: string;
}

/** A que entidad se engancha un adjunto. */
export type AttachmentOwner =
  | { kind: "client"; clientId: string }
  | { kind: "project"; clientId: string; projectId: string }
  | { kind: "comment"; clientId: string; projectId: string; commentId: string };

/** Tamano maximo por archivo. Debe coincidir con `storage.rules`. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Tipos admitidos. Debe coincidir con la lista de `storage.rules`: si aqui se
 * permite algo que alli no, la subida se rechaza a mitad y el usuario ve un
 * error sin explicacion.
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

/** Valor del atributo `accept` del selector de archivos del sistema. */
export const ATTACHMENT_ACCEPT = [
  ...ALLOWED_ATTACHMENT_TYPES,
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".rtf",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
].join(",");
