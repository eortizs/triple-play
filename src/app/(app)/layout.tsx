import { redirect } from "next/navigation";
import { Badge } from "@/components/reui/badge";
import { NavInferior } from "@/components/app/nav-inferior";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cerrarSesionAccion } from "@/lib/auth/acciones";
import { puedeAcceder, RUTAS_PROTEGIDAS } from "@/lib/auth/acceso";
import { perfilActual } from "@/lib/auth/sesion";
import { ES_MODO_SKELETON } from "@/lib/config";
import { LogOutIcon } from "lucide-react";

export const instant = false;

const ETIQUETAS: Record<
  string,
  { etiqueta: string; icono: "inicio" | "inventario" | "ventas" | "usuarios" }
> = {
  "/dashboard": { etiqueta: "Inicio", icono: "inicio" },
  "/inventario": { etiqueta: "Inventario", icono: "inventario" },
  "/ventas": { etiqueta: "Ventas", icono: "ventas" },
  "/usuarios": { etiqueta: "Usuarios", icono: "usuarios" },
};

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await perfilActual();
  if (!perfil) {
    redirect("/login");
  }

  const elementos = RUTAS_PROTEGIDAS.filter((ruta) =>
    puedeAcceder(perfil, ruta),
  ).map((ruta) => ({ href: ruta, ...ETIQUETAS[ruta] }));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-2 px-4">
          <p className="font-heading text-sm font-semibold tracking-tight">
            triple-play
          </p>
          {ES_MODO_SKELETON ? (
            <Badge variant="info-light" size="xs">
              mock
            </Badge>
          ) : (
            <Badge variant="success-light" size="xs">
              producción
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {perfil.username} · {perfil.role}
            </p>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <form action={cerrarSesionAccion}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Cerrar sesión"
              >
                <LogOutIcon className="size-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-24 pt-4 md:py-6">
        {children}
      </main>
      <NavInferior elementos={elementos} />
    </div>
  );
}
