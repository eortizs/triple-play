import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PackageIcon } from "lucide-react";
import { getServicios } from "@/lib/services";
import { TablaInventario } from "./tabla-inventario";

export const metadata = {
  title: "Inventario",
};

export default async function PaginaInventario() {
  const servicios = await getServicios();
  const productos = await servicios.productos.listProductos();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Consulta y filtra los productos disponibles en el negocio
        </p>
      </div>
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Productos</FrameTitle>
          <FrameDescription>
            {productos.length} productos registrados
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="p-0">
          {productos.length === 0 ? (
            <div className="p-4">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin productos</EmptyTitle>
                  <EmptyDescription>
                    Aún no hay productos en el inventario.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="p-4 pt-3">
              <TablaInventario productos={productos} />
            </div>
          )}
        </FramePanel>
      </Frame>
    </div>
  );
}
