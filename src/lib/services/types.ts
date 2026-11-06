import type { UserProfile } from '@/types/auth';
import type {
  NuevaVentaInput,
  Producto,
  UsuarioDetalle,
  Venta,
} from '@/types/domain';

export interface UsuariosService {
  authenticate(username: string, password: string): Promise<UserProfile | null>;
  listUsuarios(): Promise<UsuarioDetalle[]>;
}

export interface ProductosService {
  listProductos(): Promise<Producto[]>;
  actualizarStock(productoId: string, delta: number): Promise<Producto>;
}

export interface VentasService {
  listVentas(limite?: number): Promise<Venta[]>;
  crearVenta(input: NuevaVentaInput): Promise<Venta>;
}

export interface Servicios {
  usuarios: UsuariosService;
  productos: ProductosService;
  ventas: VentasService;
}
