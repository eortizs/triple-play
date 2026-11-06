import { Suspense } from "react";
import { Badge } from "@/components/reui/badge";
import { LoginForm } from "./login-form";
import { ES_MODO_SKELETON } from "@/lib/config";

const CUENTAS_DEMO = [
  { username: "dev", password: "dev123", nombre: "dev", rol: "desarrollador" },
  {
    username: "propietario",
    password: "propietario123",
    nombre: "propietario",
    rol: "propietario",
  },
  { username: "ana", password: "ana123", nombre: "ana", rol: "usuario · nivel 1" },
  { username: "luis", password: "luis123", nombre: "luis", rol: "usuario · nivel 2" },
  {
    username: "carla",
    password: "carla123",
    nombre: "carla",
    rol: "usuario · nivel 3",
  },
];

export default function PaginaLogin() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">triple-play</h1>
        <p className="text-sm text-muted-foreground">
          Operación diaria de tu micro-negocio
        </p>
        {ES_MODO_SKELETON ? (
          <Badge variant="info-light" size="xs">
            Modo maquetación · datos mock
          </Badge>
        ) : (
          <Badge variant="success-light" size="xs">
            Modo producción
          </Badge>
        )}
      </div>
      <Suspense>
        <LoginForm demoUsuarios={ES_MODO_SKELETON ? CUENTAS_DEMO : []} />
      </Suspense>
    </div>
  );
}
