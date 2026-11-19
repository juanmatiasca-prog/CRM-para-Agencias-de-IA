"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";

/**
 * Envuelve las paginas privadas. Mientras Firebase resuelve la sesion muestra
 * un estado de carga; si no hay usuario, redirige al login.
 *
 * La comprobacion es de cliente: el export estatico no tiene servidor que
 * pueda bloquear la respuesta. Protege la interfaz, no los datos. Cuando haya
 * base de datos, el control real debe estar en las Security Rules.
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Comprobando sesion…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
