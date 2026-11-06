import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { exigirAcceso } from "@/lib/auth/guard";
import { getServicios } from "@/lib/services";
import { TablaUsuarios } from "./tabla-usuarios";

export const metadata = {
  title: "Usuarios",
};

export default async function PaginaUsuarios() {
  await exigirAcceso("/usuarios");
  const servicios = await getServicios();
  const usuarios = await servicios.usuarios.listUsuarios();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Personal del negocio con sus roles y niveles jerárquicos
        </p>
      </div>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Personal</FrameTitle>
          <FrameDescription>{usuarios.length} cuentas registradas</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <TablaUsuarios usuarios={usuarios} />
        </FramePanel>
      </Frame>
    </div>
  );
}
