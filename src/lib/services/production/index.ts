import { CONFIG_DB } from '@/lib/config';
import type { Servicios } from '@/lib/services/types';
import type { UserProfile } from '@/types/auth';
import type {
  ItemVenta,
  NuevaVentaInput,
  Producto,
  UsuarioDetalle,
  Venta,
} from '@/types/domain';
import { Pool } from 'pg';
import type { QueryResultRow } from 'pg';

type PoolGlobal = typeof globalThis & {
  __poolTriplePlay?: Pool;
};

function obtenerPool(): Pool {
  const g = globalThis as PoolGlobal;
  if (!g.__poolTriplePlay) {
    g.__poolTriplePlay = new Pool(CONFIG_DB);
  }
  return g.__poolTriplePlay;
}

async function consulta<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  const pool = obtenerPool();
  const resultado = await pool.query<T>(sql, params);
  return resultado.rows;
}

const usuariosService: Servicios['usuarios'] = {
  async authenticate(username, password) {
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(password).digest('hex');
    const filas = await consulta<{
      id: string;
      username: string;
      role: UserProfile['role'];
      level: number;
      activo: boolean;
    }>(
      'SELECT id, username, role, level, activo FROM usuarios WHERE username = $1 AND password_hash = $2 AND activo = true LIMIT 1',
      [username, hash],
    );
    const fila = filas[0];
    if (!fila) return null;
    return { id: fila.id, username: fila.username, role: fila.role, level: fila.level };
  },

  async listUsuarios() {
    const filas = await consulta<{
      id: string;
      username: string;
      role: UserProfile['role'];
      level: number;
      nombre: string;
      activo: boolean;
    }>('SELECT id, username, role, level, nombre, activo FROM usuarios ORDER BY role, level DESC');
    return filas.map<UsuarioDetalle>((f) => ({
      id: f.id,
      username: f.username,
      role: f.role,
      level: f.level,
      nombre: f.nombre,
      activo: f.activo,
    }));
  },
};

const productosService: Servicios['productos'] = {
  async listProductos() {
    const filas = await consulta<{
      id: string;
      sku: string;
      nombre: string;
      categoria: Producto['categoria'];
      precio: string | number;
      stock: number;
      min_stock: number;
      atributos: Producto['atributos'];
    }>('SELECT id, sku, nombre, categoria, precio, stock, min_stock, atributos FROM productos ORDER BY nombre');
    return filas.map<Producto>((f) => ({
      id: f.id,
      sku: f.sku,
      nombre: f.nombre,
      categoria: f.categoria,
      precio: Number(f.precio),
      stock: Number(f.stock),
      minStock: Number(f.min_stock),
      atributos: f.atributos ?? {},
    }));
  },

  async actualizarStock(productoId, delta) {
    const filas = await consulta<{
      id: string;
      sku: string;
      nombre: string;
      categoria: Producto['categoria'];
      precio: string | number;
      stock: number;
      min_stock: number;
      atributos: Producto['atributos'];
    }>(
      'UPDATE productos SET stock = GREATEST(0, stock + $1) WHERE id = $2 RETURNING id, sku, nombre, categoria, precio, stock, min_stock, atributos',
      [delta, productoId],
    );
    const f = filas[0];
    if (!f) throw new Error(`Producto no encontrado: ${productoId}`);
    return {
      id: f.id,
      sku: f.sku,
      nombre: f.nombre,
      categoria: f.categoria,
      precio: Number(f.precio),
      stock: Number(f.stock),
      minStock: Number(f.min_stock),
      atributos: f.atributos ?? {},
    };
  },
};

const ventasService: Servicios['ventas'] = {
  async listVentas(limite) {
    const filas = await consulta<{
      id: string;
      folio: string;
      fecha: Date;
      estado: Venta['estado'];
      metodo_pago: Venta['metodoPago'];
      total: string | number;
      vendedor_id: string;
      vendedor_nombre: string;
      items: ItemVenta[];
    }>(
      'SELECT id, folio, fecha, estado, metodo_pago, total, vendedor_id, vendedor_nombre, items FROM ventas ORDER BY fecha DESC LIMIT $1',
      [limite ?? 200],
    );
    return filas.map<Venta>((f) => ({
      id: f.id,
      folio: f.folio,
      fecha: new Date(f.fecha).toISOString(),
      estado: f.estado,
      metodoPago: f.metodo_pago,
      total: Number(f.total),
      vendedorId: f.vendedor_id,
      vendedorNombre: f.vendedor_nombre,
      items: f.items ?? [],
    }));
  },

  async crearVenta(input: NuevaVentaInput) {
    const pool = obtenerPool();
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const items: ItemVenta[] = [];
      let total = 0;
      for (const item of input.items) {
        const resultado = await cliente.query<{
          id: string;
          nombre: string;
          precio: string | number;
        }>(
          'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id, nombre, precio',
          [item.cantidad, item.productoId],
        );
        const fila = resultado.rows[0];
        if (!fila) {
          throw new Error(`Stock insuficiente para el producto: ${item.productoId}`);
        }
        const precioUnitario = Number(fila.precio);
        items.push({
          productoId: fila.id,
          nombre: fila.nombre,
          cantidad: item.cantidad,
          precioUnitario,
        });
        total += item.cantidad * precioUnitario;
      }
      if (items.length === 0) throw new Error('La venta no tiene productos');
      const consecutivo = await cliente.query<{ folio: string }>(
        "SELECT 'V-' || (COALESCE(MAX(NULLIF(regexp_replace(folio, '\\D', '', 'g'), '')::int), 1000) + 1)::text AS folio FROM ventas",
      );
      const folio = consecutivo.rows[0]?.folio ?? 'V-1001';
      const insertada = await cliente.query<{ id: string; fecha: Date }>(
        'INSERT INTO ventas (folio, estado, metodo_pago, total, vendedor_id, vendedor_nombre, items) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING id, fecha',
        [
          folio,
          input.estado,
          input.metodoPago,
          total,
          input.vendedor.id,
          input.vendedor.username,
          JSON.stringify(items),
        ],
      );
      await cliente.query('COMMIT');
      const fila = insertada.rows[0];
      return {
        id: fila.id,
        folio,
        fecha: new Date(fila.fecha).toISOString(),
        estado: input.estado,
        metodoPago: input.metodoPago,
        total,
        vendedorId: input.vendedor.id,
        vendedorNombre: input.vendedor.username,
        items,
      };
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  },
};

export const serviciosProduccion: Servicios = {
  usuarios: usuariosService,
  productos: productosService,
  ventas: ventasService,
};
