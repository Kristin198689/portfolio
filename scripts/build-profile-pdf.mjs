// Builds the one-page-style profile PDFs (de, en, uk) from the same messages the site uses,
// so the PDF and the website never drift apart. Needs Google Chrome.
// Usage: node scripts/build-profile-pdf.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const site = { name: "Christina Volodina", phone: "+49 152 36385095", email: "volodina.webstudio@gmail.com", github: "https://github.com/Kristin198689", location: "Pforzheim · Germany" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const labels = {
  en: { skills: "Skills", projects: "Projects", seo: "SEO", ai: "Working with AI", flow: "End to end", contact: "Contact", lang: "Languages", tools: "Tools" },
  de: { skills: "Skills", projects: "Projekte", seo: "SEO", ai: "Arbeiten mit KI", flow: "Alles aus einer Hand", contact: "Kontakt", lang: "Sprachen", tools: "Werkzeuge" },
  uk: { skills: "Навички", projects: "Проєкти", seo: "SEO", ai: "Робота з AI", flow: "Від початку до кінця", contact: "Контакти", lang: "Мови", tools: "Інструменти" },
  ar: { skills: "المهارات", projects: "المشاريع", seo: "SEO", ai: "العمل مع الذكاء الاصطناعي", flow: "من البداية إلى النهاية", contact: "تواصل", lang: "اللغات", tools: "الأدوات" },
};

mkdirSync("public/cv", { recursive: true });
for (const l of ["de", "en", "uk", "ar"]) {
  const m = JSON.parse(readFileSync(`messages/${l}.json`, "utf8"));
  const L = labels[l];
  const li = (arr) => arr.map((x) => `<li>${x}</li>`).join("");
  const skills = Object.values(m.skills.tiles).map((t) => `<li><b>${esc(t.t)}</b> ${esc(t.d)}</li>`);
  const seo = Object.values(m.seo.skills).map((t) => `<li><b>${esc(t.t)}</b> ${esc(t.d)}</li>`);
  const ai = Object.values(m.ai.steps).map((t) => `<li><b>${esc(t.t)}</b> ${esc(t.d)}</li>`);
  const flow = Object.values(m.process.steps).map((t) => `<li><b>${esc(t.title)}</b> ${esc(t.text)}</li>`);
  const projects = Object.values(m.projects.items).map(
    (p) => `<li><b>${esc(p.title)}</b> <i>${esc(p.category)}</i><br>${esc(p.description)}<br><small>${p.tags.map(esc).join(" · ")}</small></li>`,
  );
  const rtl = l === "ar";
  const lh = readFileSync("src/config/lighthouse.ts", "utf8");
  const score = (k) => (lh.match(new RegExp(k + ": (\\d+)")) || [])[1] ?? "";
  const scores = [["Performance", score("performance")], ["Accessibility", score("accessibility")], ["Best practices", score("bestPractices")], ["SEO", score("seo")]];
  const html = `<!doctype html><html lang="${l}" dir="${rtl ? "rtl" : "ltr"}"><meta charset="utf-8"><title>${esc(site.name)}</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:9pt/1.45 "Helvetica Neue","Geeza Pro",Helvetica,Arial,sans-serif;color:#0a0a0a}
${rtl ? "h1,h2,h3{letter-spacing:0!important;text-transform:none!important}" : ""}
.band{background:#0a0a0a;color:#fafaf7;padding:14mm 15mm 10mm}
h1{font-size:40pt;line-height:.88;letter-spacing:-.045em;margin:0 0 4mm;text-transform:uppercase;font-weight:800}
.role{font-size:12pt;margin:0 0 3mm}
.status{display:inline-block;border:1px solid #fafaf7;padding:1mm 3mm;font-size:8pt;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3mm}
.meta{display:flex;gap:6mm;flex-wrap:wrap;font-size:8.5pt;opacity:.85}
.scores{display:flex;gap:4mm;margin-top:5mm}
.scores div{border-top:2px solid #fafaf7;padding-top:1.5mm;min-width:22mm}
.scores b{display:block;font-size:20pt;line-height:1}
.scores span{font-size:7pt;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.page{padding:8mm 15mm 12mm}
.pitch{font-size:11pt;line-height:1.35;margin:0 0 5mm}
h2{font-size:7.5pt;letter-spacing:.16em;text-transform:uppercase;margin:5mm 0 2mm;border-top:1px solid #0a0a0a;padding-top:2mm;font-weight:700}
ul{list-style:none;margin:0;padding:0}li{margin:0 0 1.5mm;break-inside:avoid}
b{font-weight:700}i{opacity:.6;font-style:normal;margin-inline-start:2mm}small{opacity:.6}
.cols{columns:2;column-gap:9mm}
</style>
<div class="band">
<h1>${esc(site.name)}</h1>
<p class="role">${esc(m.meta.jobTitle)}</p>
<span class="status">${esc(m.hero.status)}</span>
<div class="meta"><span>${esc(site.email)}</span><span>${esc(site.phone)}</span><span>${esc(site.github.replace("https://", ""))}</span><span>${esc(site.location)}</span></div>
<div class="scores">${scores.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("")}</div>
</div>
<div class="page">
<p class="pitch">${esc(m.hire.pitch)}</p>
<h2>${L.lang}</h2><p>${esc(m.contact.languagesValue)}</p>
<h2>${L.skills}</h2><ul class="cols">${li(skills)}</ul>
<h2>${L.seo}</h2><ul class="cols">${li(seo)}</ul>
<h2>${L.flow}</h2><ul class="cols">${li(flow)}</ul>
<h2>${L.projects}</h2><ul class="cols">${li(projects)}</ul>
<h2>${L.ai}</h2><ul class="cols">${li(ai)}</ul>
</div>
</html>`;
  const file = join(tmpdir(), `profile-${l}.html`);
  writeFileSync(file, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=public/cv/profile-${l}.pdf`, `file://${file}`], { stdio: "ignore" });
  console.log("wrote public/cv/profile-" + l + ".pdf");
}
