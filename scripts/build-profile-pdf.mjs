// Builds the one-page-style profile PDFs (de, en, uk) from the same messages the site uses,
// so the PDF and the website never drift apart. Needs Google Chrome.
// Usage: node scripts/build-profile-pdf.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const site = { name: "Christina Volodina", email: "kristin198689@gmail.com", github: "https://github.com/Kristin198689", location: "Pforzheim · Germany" };
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
  const html = `<!doctype html><html lang="${l}" dir="${rtl ? "rtl" : "ltr"}"><meta charset="utf-8"><title>${esc(site.name)}</title>
<style>
@page{size:A4;margin:16mm 15mm}
*{box-sizing:border-box}
body{margin:0;font:9.2pt/1.5 "Helvetica Neue","Geeza Pro",Helvetica,Arial,sans-serif;color:#0a0a0a}
${rtl ? "h1,h2{letter-spacing:0!important;text-transform:none!important}" : ""}
h1{font-size:34pt;line-height:.9;letter-spacing:-.04em;margin:0 0 4mm;text-transform:uppercase;font-weight:800}
h2{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;margin:6mm 0 2mm;border-top:1px solid #0a0a0a;padding-top:2mm;font-weight:600}
.role{font-size:12pt;margin:0 0 3mm}.lead{max-width:150mm;margin:0 0 2mm}
ul{list-style:none;margin:0;padding:0}li{margin:0 0 1.6mm;break-inside:avoid}
b{font-weight:700}i{opacity:.65;font-style:normal;margin-left:2mm}small{opacity:.65}
.cols{columns:2;column-gap:10mm}
.meta{display:flex;gap:8mm;flex-wrap:wrap;font-size:9pt;margin-top:3mm}
</style>
<h1>${esc(site.name)}</h1>
<p class="role">${esc(m.meta.jobTitle)}</p>
<p class="lead">${esc(m.hero.lead)}</p>
<p class="lead"><b>${esc(m.hero.status)}.</b> ${esc(m.hire.pitch)}</p>
<div class="meta"><span>${esc(site.email)}</span><span>${esc(site.github.replace("https://", ""))}</span><span>${esc(site.location)}</span></div>
<h2>${L.lang}</h2><p>${esc(m.contact.languagesValue)}</p>
<h2>${L.skills}</h2><ul class="cols">${li(skills)}</ul>
<h2>${L.seo}</h2><ul class="cols">${li(seo)}</ul>
<h2>${L.flow}</h2><ul class="cols">${li(flow)}</ul>
<h2>${L.projects}</h2><ul class="cols">${li(projects)}</ul>
<h2>${L.ai}</h2><ul class="cols">${li(ai)}</ul>
</html>`;
  const file = join(tmpdir(), `profile-${l}.html`);
  writeFileSync(file, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=public/cv/profile-${l}.pdf`, `file://${file}`], { stdio: "ignore" });
  console.log("wrote public/cv/profile-" + l + ".pdf");
}
