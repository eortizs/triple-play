import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getServicios } from "@/lib/services";
import { CircleAlertIcon, PackageIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";

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

export default async function PaginaDashboard() {
  const servicios = await getServicios();
  const [ventas, productos] = await Promise.all([
    servicios.ventas.listVentas(),
    servicios.productos.listProductos(),
  ]);

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const ventasHoy = ventas.filter(
    (v) =>
      v.estado === "completada" && new Date(v.fecha).getTime() >= inicioHoy.getTime(),
  );
  const montoHoy = ventasHoy.reduce((suma, v) => suma + v.total, 0);
  const pendientes = ventas.filter((v) => v.estado === "pendiente").length;
  const stockBajo = productos.filter((p) => p.stock <= p.minStock);
  const valorInventario = productos.reduce(
    (suma, p) => suma + p.precio * p.stock,
    0,
  );
  const recientes = ventas.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de la operación del negocio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <WalletIcon className="size-4" aria-hidden="true" />
              Ventas de hoy
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatearMoneda(montoHoy)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {ventasHoy.length} ticket{ventasHoy.length === 1 ? "" : "s"} completado
            {ventasHoy.length === 1 ? "" : "s"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <ReceiptTextIcon className="size-4" aria-hidden="true" />
              Pendientes
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{pendientes}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            ventas por cobrar o confirmar
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <PackageIcon className="size-4" aria-hidden="true" />
              Inventario
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {productos.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            productos · valor {formatearMoneda(valorInventario)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CircleAlertIcon className="size-4" aria-hidden="true" />
              Stock bajo
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stockBajo.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            productos en o bajo el mínimo
          </CardContent>
        </Card>
      </div>

      <Frame>
        <FrameHeader>
          <FrameTitle>Ventas recientes</FrameTitle>
          <FrameDescription>
            Últimos movimientos registrados en el negocio
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="p-0">
          {recientes.length === 0 ? (
            <div className="p-4">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ReceiptTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin ventas registradas</EmptyTitle>
                  <EmptyDescription>
                    Las ventas que registres aparecerán aquí.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ul className="divide-y">
              {recientes.map((venta) => {
                const estado =
                  ETIQUETA_ESTADO[venta.estado as keyof typeof ETIQUETA_ESTADO];
                return (
                  <li
                    key={venta.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-sm font-medium">
                        {venta.folio} · {venta.items.length}{" "}
                        {venta.items.length === 1 ? "artículo" : "artículos"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {venta.vendedorNombre} · {formatearFecha(venta.fecha)}
                      </p>
                    </div>
                    <Badge variant={estado.variante} size="xs" className="shrink-0">
                      {estado.texto}
                    </Badge>
                    <p className="ml-auto shrink-0 text-sm font-medium tabular-nums">
                      {formatearMoneda(venta.total)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Alertas de stock</FrameTitle>
          <FrameDescription>
            Productos en o bajo su nivel mínimo de inventario
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="p-0">
          {stockBajo.length === 0 ? (
            <div className="p-4">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageIcon />
                  </EmptyMedia>
                  <EmptyTitle>Inventario sano</EmptyTitle>
                  <EmptyDescription>
                    Ningún producto está por debajo del mínimo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <ul className="divide-y">
              {stockBajo.map((producto) => (
                <li
                  key={producto.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium">
                      {producto.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      mínimo {producto.minStock} · {producto.sku}
                    </p>
                  </div>
                  <Badge variant="warning-light" size="xs" className="ml-auto shrink-0">
                    {producto.stock} en stock
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </FramePanel>
      </Frame>
    </div>
  );
}
