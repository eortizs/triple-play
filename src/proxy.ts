import { NextResponse } from 'next/server';
import type { NextRequest, NextProxy } from 'next/server';
import { puedeAcceder, RUTAS_PROTEGIDAS } from '@/lib/auth/acceso';
import type { RutaProtegida } from '@/lib/auth/acceso';
import { verificarToken } from '@/lib/auth/sesion';

function resolverRuta(pathname: string): RutaProtegida | null {
  for (const ruta of RUTAS_PROTEGIDAS) {
    if (pathname === ruta || pathname.startsWith(`${ruta}/`)) return ruta;
  }
  return null;
}

export const proxy: NextProxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const perfil = verificarToken(request.cookies.get('tp_sesion')?.value);

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = perfil ? '/dashboard' : '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname === '/login') {
    if (perfil) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === '/acceso-denegado') {
    if (!perfil) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const ruta = resolverRuta(pathname);
  if (!ruta) {
    return NextResponse.next();
  }

  if (!perfil) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('from', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!puedeAcceder(perfil, ruta)) {
    const url = request.nextUrl.clone();
    url.pathname = '/acceso-denegado';
    url.search = '';
    url.searchParams.set('ruta', ruta);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};

export default proxy;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|iconos|manifest.webmanifest|sw.js|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
