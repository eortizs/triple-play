import { createServer } from "node:net";

/**
 * Escanea desde `puertoInicial` hacia arriba y devuelve el primer puerto
 * libre en `host` (0.0.0.0). Reserva el puerto con un bind temporal,
 * así dos escaneos simultáneos nunca eligen el mismo puerto.
 */
export function encontrarPuertoLibre(
  puertoInicial = 3000,
  host = "0.0.0.0",
  limite = 100,
) {
  return new Promise((resolver, rechazar) => {
    function intentar(puerto) {
      if (puerto > puertoInicial + limite) {
        rechazar(
          new Error(
            `No se encontró un puerto libre entre ${puertoInicial} y ${puertoInicial + limite}`,
          ),
        );
        return;
      }
      const servidor = createServer();
      servidor.once("error", () => {
        servidor.removeAllListeners();
        intentar(puerto + 1);
      });
      servidor.listen(puerto, host, () => {
        const { port } = servidor.address();
        servidor.close(() => resolver(port));
      });
    }
    intentar(puertoInicial);
  });
}
