import { spawn } from "node:child_process";
import { encontrarPuertoLibre } from "./encontrar-puerto.mjs";

const argumentos = process.argv.slice(2);
const indiceModo = argumentos.indexOf("--mode");
const modo = indiceModo >= 0 ? argumentos[indiceModo + 1] : "skeleton";
const esDev = argumentos.includes("--dev");

if (modo !== "skeleton" && modo !== "production") {
  console.error(`Modo inválido: ${modo}. Usa skeleton o production.`);
  process.exit(1);
}

const puerto = await encontrarPuertoLibre(modo === "skeleton" ? 3000 : 4000);

console.log(
  `[triple-play] instancia "${modo}" en el puerto ${puerto} (${esDev ? "next dev" : "next start"})`,
);

const hijo = spawn("pnpm", ["exec", "next", esDev ? "dev" : "start", "-p", String(puerto)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_ENVIRONMENT_MODE: modo,
    PUERTO_ASIGNADO: String(puerto),
  },
});

hijo.on("exit", (codigo) => process.exit(codigo ?? 1));

for (const señal of ["SIGINT", "SIGTERM"]) {
  process.on(señal, () => hijo.kill(señal));
}
