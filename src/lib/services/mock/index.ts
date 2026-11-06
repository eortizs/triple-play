import type { Servicios } from '@/lib/services/types';
import type { UserProfile } from '@/types/auth';
import type {
  ItemVenta,
  NuevaVentaInput,
  Producto,
  UsuarioDetalle,
  Venta,
} from '@/types/domain';
import productosIniciales from './data/productos.json';
import usuariosIniciales from './data/usuarios.json';
import ventasIniciales from './data/ventas.json';
import { retardo } from './retardo';

interface UsuarioMock {
  id: string;
  username: string;
  password: string;
  nombre: string;
  role: UserProfile['role'];
  level: number;
  activo: boolean;
}

interface VentaMock {
  id: string;
  folio: string;
  diasAtras: number;
  horasAtras: number;
  estado: Venta['estado'];
  metodoPago: Venta['metodoPago'];
  vendedorId: string;
  vendedorNombre: string;
  items: ItemVenta[];
}

const usuarios = usuariosIniciales as UsuarioMock[];
const productos = productosIniciales as Producto[];
const ventasMock = ventasIniciales as VentaMock[];
const ventasRegistradas: Venta[] = [];

function totalDe(items: ItemVenta[]): number {
  return items.reduce((suma, item) => suma + item.cantidad * item.precioUnitario, 0);
}

function fechaDesde(diasAtras: number, horasAtras: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);
  fecha.setHours(fecha.getHours() - horasAtras);
  return fecha.toISOString();
}

const usuariosService: Servicios['usuarios'] = {
  async authenticate(username, password) {
    await retardo();
    const encontrado = usuarios.find(
      (u) => u.username === username && u.password === password && u.activo,
    );
    if (!encontrado) return null;
    return {
      id: encontrado.id,
      username: encontrado.username,
      role: encontrado.role,
      level: encontrado.level,
    };
  },

  async listUsuarios() {
    await retardo();
    return usuarios.map<UsuarioDetalle>((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      level: u.level,
      nombre: u.nombre,
      activo: u.activo,
    }));
  },
};

const productosService: Servicios['productos'] = {
  async listProductos() {
    await retardo();
    return productos.map((p) => ({ ...p, atributos: { ...p.atributos } }));
  },

  async actualizarStock(productoId, delta) {
    await retardo();
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);
    producto.stock = Math.max(0, producto.stock + delta);
    return { ...producto, atributos: { ...producto.atributos } };
  },
};

const ventasService: Servicios['ventas'] = {
  async listVentas(limite) {
    await retardo();
    const ventas: Venta[] = ventasMock.map((v) => ({
      id: v.id,
      folio: v.folio,
      fecha: fechaDesde(v.diasAtras, v.horasAtras),
      estado: v.estado,
      metodoPago: v.metodoPago,
      vendedorId: v.vendedorId,
      vendedorNombre: v.vendedorNombre,
      items: v.items,
      total: totalDe(v.items),
    }));
    const ordenadas = [...ventasRegistradas, ...ventas].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
    return typeof limite === 'number' ? ordenadas.slice(0, limite) : ordenadas;
  },

  async crearVenta(input: NuevaVentaInput) {
    await retardo();
    const items: ItemVenta[] = input.items.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) throw new Error(`Producto no encontrado: ${item.productoId}`);
      return {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
      };
    });
    if (items.length === 0) throw new Error('La venta no tiene productos');
    const siguiente = ventasRegistradas.length + ventasMock.length + 1001;
    const venta: Venta = {
      id: `v-${siguiente}`,
      folio: `V-${siguiente}`,
      fecha: new Date().toISOString(),
      estado: input.estado,
      metodoPago: input.metodoPago,
      vendedorId: input.vendedor.id,
      vendedorNombre: input.vendedor.username,
      items,
      total: totalDe(items),
    };
    ventasRegistradas.unshift(venta);
    for (const item of items) {
      await productosService.actualizarStock(item.productoId, -item.cantidad);
    }
    return venta;
  },
};

export const serviciosMock: Servicios = {
  usuarios: usuariosService,
  productos: productosService,
  ventas: ventasService,
};
