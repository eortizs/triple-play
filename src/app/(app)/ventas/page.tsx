import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ReceiptTextIcon } from "lucide-react";
import { exigirAcceso } from "@/lib/auth/guard";
import { getServicios } from "@/lib/services";
import { NuevaVentaDialog } from "./nueva-venta-dialog";

export const metadata = {
  title: "Ventas",
};

function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

const ETIQUETA_ESTADO = {
  completada: { texto: "Completada", variante: "success-light" },
  pendiente: { texto: "Pendiente", variante: "warning-light" },
  cancelada: { texto: "Cancelada", variante: "destructive-light" },
} as const;

export default async function PaginaVentas() {
  await exigirAcceso("/ventas");
  const servicios = await getServicios();
  const [ventas, productos] = await Promise.all([
    servicios.ventas.listVentas(30),
    servicios.productos.listProductos(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Registro de tickets y cobros del negocio
          </p>
        </div>
        <NuevaVentaDialog productos={productos} />
      </div>
      <Frame>
        <FrameHeader>
          <FrameTitle>Tickets</FrameTitle>
          <FrameDescription>Últimos 30 movimientos</FrameDescription>
        </FrameHeader>
        <FramePanel className="p-0">
          {ventas.length === 0 ? (
            <div className="p-4">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin ventas registradas</EmptyTitle>
                  <EmptyDescription>
                    Usa el botón «Nueva venta» para registrar el primer ticket.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ul className="divide-y">
              {ventas.map((venta) => {
                const estado =
                  ETIQUETA_ESTADO[venta.estado as keyof typeof ETIQUETA_ESTADO];
                const resumen = venta.items
                  .slice(0, 2)
                  .map((item) => `${item.cantidad} × ${item.nombre}`)
                  .join(", ");
                const restantes = venta.items.length - 2;
                return (
                  <li key={venta.id} className="flex flex-col gap-1.5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{venta.folio}</p>
                      <Badge variant={estado.variante} size="xs">
                        {estado.texto}
                      </Badge>
                      <p className="ml-auto text-sm font-medium tabular-nums">
                        {formatearMoneda(venta.total)}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {resumen}
                      {restantes > 0 ? ` y ${restantes} más` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(venta.fecha)} · {venta.metodoPago} ·{" "}
                      {venta.vendedorNombre}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </FramePanel>
      </Frame>
    </div>
  );
}
