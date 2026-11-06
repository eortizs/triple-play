import { spawn } from "node:child_process";
import { encontrarPuertoLibre } from "./encontrar-puerto.mjs";

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function lanzarInstancia({ modo, puerto, dev }) {
  console.log(
    `[triple-play] instancia "${modo}" en el puerto ${puerto} (${dev ? "next dev" : "next start"})`,
  );
  const hijo = spawn(
    "pnpm",
    ["exec", "next", dev ? "dev" : "start", "-p", String(puerto)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_ENVIRONMENT_MODE: modo,
        PUERTO_ASIGNADO: String(puerto),
      },
    },
  );
  hijo.on("exit", (codigo) => {
    console.error(`[triple-play] instancia "${modo}" terminó con código ${codigo}`);
    process.exit(codigo ?? 1);
  });
  return hijo;
}

const args = process.argv.slice(2);
const esDev = args.includes("--dev");

const puertoSkeleton = await encontrarPuertoLibre(3000);
lanzarInstancia({ modo: "skeleton", puerto: puertoSkeleton, dev: esDev });

await esperar(1500);

const puertoProduccion = await encontrarPuertoLibre(4000);
lanzarInstancia({ modo: "production", puerto: puertoProduccion, dev: esDev });

console.log(
  `[triple-play] skeleton.triple-play.people-ia.com -> :${puertoSkeleton} · triple-play.people-ia.com -> :${puertoProduccion}`,
);

for (const señal of ["SIGINT", "SIGTERM"]) {
  process.on(señal, () => process.exit(0));
}
