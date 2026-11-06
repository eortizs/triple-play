import type { UserProfile } from './auth';

export type CategoriaProducto =
  | 'abarrotes'
  | 'bebidas'
  | 'limpieza'
  | 'snacks'
  | 'otros';

export interface AtributosProducto {
  marca?: string;
  unidad?: string;
  proveedor?: string;
  [clave: string]: unknown;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
  minStock: number;
  atributos: AtributosProducto;
}

export interface ItemVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export type EstadoVenta = 'completada' | 'pendiente' | 'cancelada';
export type MetodoPago = 'efectivo' | 'transferencia';

export interface Venta {
  id: string;
  folio: string;
  fecha: string;
  estado: EstadoVenta;
  metodoPago: MetodoPago;
  total: number;
  vendedorId: string;
  vendedorNombre: string;
  items: ItemVenta[];
}

export interface UsuarioDetalle extends UserProfile {
  nombre: string;
  activo: boolean;
}

export interface NuevaVentaInput {
  items: Array<{ productoId: string; cantidad: number }>;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  vendedor: UserProfile;
}
