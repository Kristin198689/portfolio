// Builds the whole icon set from the eyes artwork of my studio site (scripts/assets/eyes-source.png),
// recoloured: the lids go from violet to a lighter periwinkle, the background to a lighter indigo.
// Run: node scripts/build-icons.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SOURCE = "scripts/assets/eyes-source.png";
const OLD_BG = [27, 11, 53];
const OLD_LID = [167, 135, 222];
export const BG = [31, 26, 74]; // lighter indigo
export const LID = [190, 184, 252]; // lighter periwinkle

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (i) => [data[i], data[i + 1], data[i + 2]];

// 1. background region: flood fill from the corners over dark, bluish pixels
const bgMask = new Uint8Array(W * H);
const isDarkBlue = (i) => {
  const [r, g, b] = px(i);
  return b <= 60 && b >= g && b >= r;
};
const stack = [0, W - 1, (H - 1) * W, H * W - 1];
while (stack.length) {
  const p = stack.pop();
  if (bgMask[p] || !isDarkBlue(p * 4)) continue;
  bgMask[p] = 1;
  const x = p % W;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (p >= W) stack.push(p - W);
  if (p < W * (H - 1)) stack.push(p + W);
}

// 2. recolour: every edge pixel is a blend of a colour with the black outline, so scale by that ratio
const recoloured = Buffer.from(data);
const transparent = Buffer.from(data);
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  const [r, g, b] = px(i);
  if (bgMask[p]) {
    const t = Math.min(1, b / OLD_BG[2]);
    for (let c = 0; c < 3; c++) recoloured[i + c] = Math.round(BG[c] * t);
    // for the favicon the background becomes real transparency, the outline stays black
    transparent[i + 3] = t > 0.9 ? 0 : Math.round(255 * (1 - t));
    if (t <= 0.9) for (let c = 0; c < 3; c++) transparent[i + c] = 0;
  } else if (b - g > 40 && b >= r && r > g) {
    const t = Math.min(1, b / OLD_LID[2]);
    for (let c = 0; c < 3; c++) {
      recoloured[i + c] = Math.round(LID[c] * t);
      transparent[i + c] = recoloured[i + c];
    }
  }
}
const full = await sharp(recoloured, { raw: { width: W, height: H, channels: 4 } }).removeAlpha().png().toBuffer();
const keyed = await sharp(transparent, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

// tight, square, transparent mark for favicons
const trimmed = await sharp(keyed).trim().toBuffer();
const tm = await sharp(trimmed).metadata();
const side = Math.max(tm.width, tm.height);
const pad = Math.round(side * 0.02);
const canvas = side + pad * 2;
const mark = await sharp(trimmed)
  .extend({
    top: Math.floor((canvas - tm.height) / 2),
    bottom: Math.ceil((canvas - tm.height) / 2),
    left: Math.floor((canvas - tm.width) / 2),
    right: Math.ceil((canvas - tm.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .sharpen({ sigma: 1.0, m1: 1.0, m2: 2 })
  .png()
  .toBuffer();

mkdirSync("public/icons", { recursive: true });
const out = (file, buf) => writeFileSync(file, buf);
const resize = (buf, n) => sharp(buf).resize(n, n).png().toBuffer();

// favicon.ico (16, 32, 48) and icon.svg (embedded raster, transparent)
const ico = [];
for (const n of [16, 32, 48]) ico.push({ size: n, buffer: await sharp(mark).resize(n, n).sharpen({ sigma: 0.5 }).png().toBuffer() });
const header = Buffer.alloc(6 + 16 * ico.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(ico.length, 4);
let off = header.length;
ico.forEach(({ size, buffer }, k) => {
  const e = 6 + 16 * k;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(buffer.length, e + 8);
  header.writeUInt32LE(off, e + 12);
  off += buffer.length;
});
out("src/app/favicon.ico", Buffer.concat([header, ...ico.map((i) => i.buffer)]));
const b64 = (await resize(mark, 128)).toString("base64");
out("src/app/icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><image href="data:image/png;base64,${b64}" width="128" height="128"/></svg>\n`);
out("public/icons/icon-32.png", await resize(mark, 32));
out("public/icons/mark.png", await resize(mark, 512)); // transparent, used by the share image

// app icons on the indigo background
out("src/app/apple-icon.png", await resize(full, 180));
out("public/icons/icon-192.png", await resize(full, 192));
out("public/icons/icon-512.png", await resize(full, 512));
const inner = Math.round(512 * 0.7);
out(
  "public/icons/icon-512-maskable.png",
  await sharp({ create: { width: 512, height: 512, channels: 3, background: { r: BG[0], g: BG[1], b: BG[2] } } })
    .composite([{ input: await resize(full, inner), left: Math.round((512 - inner) / 2), top: Math.round((512 - inner) / 2) }])
    .png()
    .toBuffer(),
);
out("public/icons/mask-icon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 6c-3.3 0-6 4.5-6 10s2.7 10 6 10 6-4.5 6-10-2.7-10-6-10Zm0 13.5c-1.4 0-2.5-1.6-2.5-3.5S6.6 12.5 8 12.5s2.5 1.6 2.5 3.5S9.4 19.5 8 19.5ZM24 6c-3.3 0-6 4.5-6 10s2.7 10 6 10 6-4.5 6-10-2.7-10-6-10Zm0 13.5c-1.4 0-2.5-1.6-2.5-3.5S22.6 12.5 24 12.5s2.5 1.6 2.5 3.5-1.1 3.5-2.5 3.5Z" fill="black"/></svg>\n`);
out("scripts/assets/eyes-portfolio.png", await resize(full, 1024));
console.log("icons written");
