# ESPECIFICACIÓN TÉCNICA: PROYECTO 'TRIPLE-PLAY' (SINGLE TENANT)

## 🎯 OBJETIVO DEL PROYECTO
Desarrollar la aplicación PWA móvil 'triple-play' utilizando un enfoque de "Esqueleto Caminante" (Walking Skeleton). El flujo de desarrollo en VS Code debe estar completamente aislado del backend durante la fase de maquetado e interacciones táctiles utilizando subdominios específicos en la VPS.

## STACK TECNOLÓGICO (ESTRICTO)
- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos y Componentes:** shadcn/ui + Primitives de ReUI (reui.io)
- **Iconos:** Lucide Icons
- **Base de Datos Destino:** PostgreSQL con soporte JSONB
- **Entorno de Despliegue:** VPS (localhost)

---

## 🌐 1. CONFIGURACIÓN DE RED Y PLATAFORMA (VPS)
La aplicación debe responder a dos subdominios diferentes apuntando al entorno local, discriminando su comportamiento mediante variables de entorno:

- **Subdominio de Validación:** `skeleton.triple-play.people-ia.com` -> Despliega la UI pura basada en datos estáticos (Mocks).
- **Subdominio de Producción:** `triple-play.people-ia.com` -> Conecta directamente con la base de datos e infraestructura real.
- **Gestión de Puertos:** Configurar un script de arranque en Node.js que escanee y asigne puertos disponibles de forma dinámica para levantar ambas instancias de manera independiente en la VPS sin generar colisiones.
- **Parámetros de Base de Datos (Producción):**
  - `DB_NAME=skeletor`
  - `DB_USER=admin`
  - `DB_PASSWORD=PeopleC0nnect`
  - `DB_HOST=localhost`

---

## 🔐 2. SISTEMA DE AUTENTICACIÓN JERÁRQUICO
Implementar un control de acceso basado en roles y niveles jerárquicos numéricos dentro de la aplicación:

- **desarrollador:** Rol técnico con permisos para modificar el comportamiento global del sistema.
- **propietario:** Dueño del micro-negocio (mercado informal/micro-empresas en México). Administra la operación general y define las jerarquías de su personal.
- **usuario (Estructura Dinámica por Niveles):** Personal operativo bajo el mando del propietario. Los accesos a las pantallas maquetadas dependen de su nivel numérico:
  - *usuario-nivel_1* (Lectura y operaciones básicas)
  - *usuario-nivel_2* (Modificaciones y supervisión intermedia)
  - *usuario-nivel_3* (Acceso administrativo total dentro de la app)

```typescript
// src/types/auth.ts
export type UserRole = 'desarrollador' | 'propietario' | 'usuario';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  level: number; // Jerarquía numérica de control de accesos
}
```

---

## 🔀 3. ESTRATEGIA DE INYECCIÓN DE DATOS (MOCK VS PRODUCTION)
El código de la interfaz gráfica y los componentes de ReUI deben permanecer idénticos en ambos entornos. La conmutación de origen de datos se realiza mediante la abstracción de servicios controlada por la variable de entorno `NEXT_PUBLIC_ENVIRONMENT_MODE`.

- Si `NEXT_PUBLIC_ENVIRONMENT_MODE='skeleton'`, los servicios resuelven promesas asíncronas leyendo archivos JSON locales con un retardo simulado en milisegundos para emular la latencia de red en dispositivos móviles.
- Si `NEXT_PUBLIC_ENVIRONMENT_MODE='production'`, los servicios ejecutan queries nativas utilizando almacenamiento estructurado y tipos JSONB en PostgreSQL.

---

## INSTRUCCIONES DE EJECUCIÓN PARA EL AGENTE CODING:
1. **Detección de Puertos:** Escribe el script de arranque para Next.js que valide puertos libres en la VPS antes de iniciar los servicios.
2. **Abstracción de Capa de Datos:** Crea las interfaces de TypeScript para los servicios clave e implementa las versiones de simulación (JSON local) y las versiones de producción basadas en las credenciales asignadas.
3. **Middleware de Rutas:** Configura un `middleware.ts` que valide de manera estricta el nivel de acceso del perfil autenticado antes de renderizar los dashboards correspondientes.
4. **Construcción de UI:** Diseña interfaces táctiles Mobile-First responsivas utilizando los bloques de componentes avanzados de ReUI (filtros complejos, data grids e interfaces optimizadas para interacción en smartphones).
