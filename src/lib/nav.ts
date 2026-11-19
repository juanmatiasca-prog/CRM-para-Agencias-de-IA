/**
 * Pestanas del menu lateral.
 *
 * Para anadir una pestana nueva: crear la pagina en `src/app/dashboard/<ruta>/`
 * y anadir una entrada aqui. `ready: false` la muestra desactivada con la
 * etiqueta "Pronto", util para dejar visible el roadmap sin romper la navegacion.
 */
import {
  Building2,
  LayoutDashboard,
  Users,
  Handshake,
  FolderKanban,
  Clock,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
  description: string;
}

export const navItems: NavItem[] = [
  {
    title: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboard,
    ready: true,
    description: "Vista general de la actividad",
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    ready: true,
    description: "Clientes, sus proyectos y comentarios",
  },
  {
    title: "Empresas",
    href: "/dashboard/empresas",
    icon: Building2,
    ready: false,
    description: "Cuentas y organizaciones",
  },
  {
    title: "Pipeline",
    href: "/dashboard/pipeline",
    icon: Handshake,
    ready: false,
    description: "Oportunidades por etapa",
  },
  {
    title: "Proyectos",
    href: "/dashboard/proyectos",
    icon: FolderKanban,
    ready: false,
    description: "Entregables y delivery",
  },
  {
    title: "Tiempo",
    href: "/dashboard/tiempo",
    icon: Clock,
    ready: false,
    description: "Horas y utilizacion",
  },
  {
    title: "Facturacion",
    href: "/dashboard/facturacion",
    icon: Receipt,
    ready: false,
    description: "Facturas y cobros",
  },
  {
    title: "Ajustes",
    href: "/dashboard/ajustes",
    icon: Settings,
    ready: false,
    description: "Configuracion del espacio",
  },
];
