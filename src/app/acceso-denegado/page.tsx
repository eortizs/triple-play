import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { perfilActual } from "@/lib/auth/sesion";
import { nivelRequerido } from "@/lib/auth/acceso";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export const metadata = {
  title: "Acceso denegado",
};

export default async function PaginaAccesoDenegado({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ruta } = await searchParams;
  const perfil = await perfilActual();
  if (!perfil) {
    redirect("/login");
  }

  const rutaDestino = typeof ruta === "string" ? ruta : "/dashboard";

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>
            Tu nivel no permite abrir {rutaDestino}. Para esta pantalla necesitas
            nivel {nivelRequerido(rutaDestino)} o superior (tu nivel es{" "}
            {perfil.level}).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pide al propietario que actualice tu jerarquía si necesitas acceso.
        </CardContent>
        <CardFooter>
          <Button render={<Link href="/dashboard" />} variant="outline" className="w-full">
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
