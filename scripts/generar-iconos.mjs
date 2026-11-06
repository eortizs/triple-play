import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const rutaSvg = "public/iconos/icono.svg";
const svg = await (await import("node:fs/promises")).readFile(rutaSvg, "utf8");

await mkdir("public/iconos", { recursive: true });

async function png(tamano, destino, radios = null) {
  let fuente = svg;
  if (radios !== null) {
    fuente = svg.replace(/rx="112"/, `rx="${radios}"`);
  }
  await sharp(Buffer.from(fuente))
    .resize(tamano, tamano)
    .png()
    .toFile(destino);
  console.log(`generado: ${destino}`);
}

await png(192, "public/iconos/icono-192.png");
await png(512, "public/iconos/icono-512.png");
await png(512, "public/iconos/icono-mascara-512.png", 0);
await png(180, "public/iconos/apple-touch-icon.png");
