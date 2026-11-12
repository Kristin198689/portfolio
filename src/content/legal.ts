import { legal } from "@/config/legal";

export type Section = { h: string; p: string[] };
export type LegalDoc = { title: string; lead: string; sections: Section[]; missing?: string };

type L = "de" | "en" | "uk";

const addressLines = (l: L) => {
  const lines: string[] = [legal.name];
  if (legal.street) lines.push(legal.street);
  lines.push(`${legal.zip ? legal.zip + " " : ""}${legal.city}`);
  lines.push(legal.country[l]);
  return lines;
};

const missingAddress: Record<L, string> = {
  de: "Hinweis: Die vollständige ladungsfähige Anschrift (Straße, Hausnummer, Postleitzahl) fehlt noch und muss vor Veröffentlichung ergänzt werden.",
  en: "Notice: the full postal address (street, house number, postcode) is still missing and must be added before the site goes live.",
  uk: "Примітка: повна поштова адреса (вулиця, номер будинку, поштовий індекс) ще відсутня і має бути додана перед публікацією сайту.",
};

export function impressum(l: L): LegalDoc {
  const addr = addressLines(l).join("\n");
  const contact = [`E-Mail: ${legal.email}`];
  if (legal.phone) contact.push(`${l === "de" ? "Telefon" : l === "en" ? "Phone" : "Телефон"}: ${legal.phone}`);
  const vat = legal.vatId
    ? [
        {
          h: { de: "Umsatzsteuer-ID", en: "VAT ID", uk: "ПДВ-номер" }[l],
          p: [
            {
              de: `Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${legal.vatId}`,
              en: `VAT identification number according to § 27a of the German VAT Act: ${legal.vatId}`,
              uk: `Ідентифікаційний номер платника ПДВ згідно з § 27a Закону про ПДВ Німеччини: ${legal.vatId}`,
            }[l],
          ],
        },
      ]
    : [];

  const t = {
    de: {
      title: "Impressum",
      lead: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)",
      s: [
        { h: "Anbieterin", p: [addr] },
        { h: "Kontakt", p: contact },
        ...vat,
        { h: "Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)", p: [addr] },
        {
          h: "Haftung für Inhalte",
          p: [
            "Als Diensteanbieterin bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach den §§ 8 bis 10 DDG bin ich jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.",
            "Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.",
          ],
        },
        {
          h: "Haftung für Links",
          p: [
            "Diese Website enthält Links zu externen Websites Dritter (zum Beispiel GitHub oder Vercel), auf deren Inhalte ich keinen Einfluss habe. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.",
          ],
        },
        {
          h: "Urheberrecht und Marken",
          p: [
            "Die durch die Seitenbetreiberin erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der Urheberin.",
            "Die gezeigten Projekte sind eigene Konzept-, Demo- und Vorlagenseiten. Namen und Logos von Technologien und Diensten (zum Beispiel GitHub, Vercel, Next.js, React, Claude) sind Marken ihrer jeweiligen Inhaber und werden nur genutzt, um die verwendeten Werkzeuge zu benennen.",
          ],
        },
        {
          h: "Verbraucherstreitbeilegung",
          p: [
            "Ich bin weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
          ],
        },
      ],
    },
    en: {
      title: "Imprint",
      lead: "Information pursuant to § 5 of the German Digital Services Act (DDG)",
      s: [
        { h: "Provider", p: [addr] },
        { h: "Contact", p: contact },
        ...vat,
        { h: "Responsible for content (§ 18 (2) MStV)", p: [addr] },
        {
          h: "Liability for content",
          p: [
            "As a service provider I am responsible for my own content on these pages under general law (§ 7 (1) DDG). Under §§ 8 to 10 DDG, however, I am not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate unlawful activity.",
            "Obligations to remove or block the use of information under general law remain unaffected. Liability in this respect is only possible from the moment a specific infringement becomes known. Once I become aware of such infringements, I will remove the content immediately.",
          ],
        },
        {
          h: "Liability for links",
          p: [
            "This website contains links to external third-party websites (for example GitHub or Vercel) over whose content I have no influence. The respective provider or operator is always responsible for the content of the linked pages. No infringements were apparent at the time of linking. Once I become aware of any, I will remove such links immediately.",
          ],
        },
        {
          h: "Copyright and trademarks",
          p: [
            "The content and works created by the site operator on these pages are subject to German copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of copyright require the written consent of the author.",
            "The projects shown are my own concept, demo and template sites. Names and logos of technologies and services (for example GitHub, Vercel, Next.js, React, Claude) are trademarks of their respective owners and are used only to name the tools I work with.",
          ],
        },
        {
          h: "Consumer dispute resolution",
          p: ["I am neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board."],
        },
      ],
    },
    uk: {
      title: "Impressum (вихідні дані)",
      lead: "Інформація відповідно до § 5 Закону Німеччини про цифрові послуги (DDG)",
      s: [
        { h: "Надавачка послуги", p: [addr] },
        { h: "Контакти", p: contact },
        ...vat,
        { h: "Відповідальна за зміст (§ 18 абз. 2 MStV)", p: [addr] },
        {
          h: "Відповідальність за зміст",
          p: [
            "Як надавачка послуг я несу відповідальність за власний зміст цих сторінок відповідно до загального законодавства (§ 7 абз. 1 DDG). Згідно з §§ 8–10 DDG я не зобов'язана відстежувати передану чи збережену стороннью інформацію або шукати обставини, що вказують на протиправну діяльність.",
            "Обов'язки щодо видалення чи блокування інформації згідно із загальним законодавством залишаються чинними. Відповідальність у цьому зв'язку можлива лише з моменту, коли стало відомо про конкретне порушення. Дізнавшись про такі порушення, я негайно видалю відповідний зміст.",
          ],
        },
        {
          h: "Відповідальність за посилання",
          p: [
            "Цей сайт містить посилання на зовнішні сайти третіх осіб (наприклад, GitHub чи Vercel), на зміст яких я не можу впливати. За зміст пов'язаних сторінок завжди відповідає відповідний надавач або оператор. На момент додавання посилань порушень не було помітно. Дізнавшись про порушення, я негайно видалю такі посилання.",
          ],
        },
        {
          h: "Авторське право та торговельні марки",
          p: [
            "Зміст і роботи, створені власницею сайту на цих сторінках, підпадають під німецьке авторське право. Копіювання, редагування, поширення та будь-яке використання за межами авторського права потребують письмової згоди авторки.",
            "Показані проєкти є моїми власними концептами, демо- та шаблонними сайтами. Назви й логотипи технологій та сервісів (наприклад, GitHub, Vercel, Next.js, React, Claude) є торговельними марками їхніх власників і використовуються лише для назви інструментів, з якими я працюю.",
          ],
        },
        {
          h: "Позасудове вирішення споживчих спорів",
          p: ["Я не зобов'язана і не готова брати участь у процедурах вирішення спорів перед споживчим арбітражним органом."],
        },
      ],
    },
  }[l];

  return {
    title: t.title,
    lead: t.lead,
    sections: t.s,
    missing: legal.street && legal.zip ? undefined : missingAddress[l],
  };
}

export function datenschutz(l: L): LegalDoc {
  const controller = [...addressLines(l), `E-Mail: ${legal.email}`].join("\n");
  const hosting = legal.hosting;
  const t = {
    de: {
      title: "Datenschutzerklärung",
      lead: "Diese Website ist ein persönliches Portfolio. Ich erhebe so wenige Daten wie möglich: keine Cookies, kein Tracking, keine Analyse-Tools, keine Werbung.",
      s: [
        { h: "1. Verantwortliche", p: [controller] },
        {
          h: "2. Hosting und Server-Logfiles",
          p: [
            hosting
              ? `Diese Website wird bei folgendem Dienstleister gehostet: ${hosting}. Mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO, soweit erforderlich.`
              : "Diese Website wird bei einem externen Hosting-Dienstleister betrieben. Dessen Name und Anschrift werden hier ergänzt, sobald die Website veröffentlicht ist.",
            "Beim Aufruf der Seite verarbeitet der Hoster technisch notwendige Verbindungsdaten in Server-Logfiles: IP-Adresse, Datum und Uhrzeit, aufgerufene URL, Browsertyp und Betriebssystem, Referrer-URL. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb). Die Daten werden nicht mit anderen Daten zusammengeführt und nach kurzer Zeit gelöscht.",
          ],
        },
        {
          h: "3. Cookies, Tracking und lokale Speicherung",
          p: [
            "Diese Website setzt keine Cookies und nutzt keine Analyse- oder Marketing-Dienste.",
            "Im Browser werden ausschließlich technisch notwendige Einstellungen gespeichert, die ohne Ihre Aktion nicht entstehen: die von Ihnen gewählte Darstellung hell oder dunkel (localStorage), ein Merker, dass die Eingangsanimation in dieser Sitzung schon gezeigt wurde, und – nur nach Ihrem Klick – ein Zwischenspeicher der abgerufenen GitHub-Commits (sessionStorage). Diese Daten verlassen Ihr Gerät nicht. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG in Verbindung mit Art. 6 Abs. 1 lit. f DSGVO.",
          ],
        },
        {
          h: "4. Schriftarten",
          p: ["Die verwendeten Schriften werden beim Bau der Website heruntergeladen und von dieser Website selbst ausgeliefert. Es findet keine Verbindung zu Servern von Google oder anderen Schriftanbietern statt."],
        },
        {
          h: "5. GitHub-Commit-Anzeige (nur auf Klick)",
          p: [
            "Im Abschnitt „KI-Workflow“ können Sie sich die letzten Commits des öffentlichen Repositorys dieser Website anzeigen lassen. Erst wenn Sie auf die Schaltfläche klicken, sendet Ihr Browser eine Anfrage an api.github.com (GitHub Inc., USA). Dabei wird Ihre IP-Adresse an GitHub übermittelt. Rechtsgrundlage ist Ihre Einwilligung durch den Klick, Art. 6 Abs. 1 lit. a DSGVO. Die Übermittlung in die USA stützt sich auf die Zertifizierung von GitHub bzw. Microsoft unter dem EU-US Data Privacy Framework. Ohne Klick findet keine Verbindung zu GitHub statt. Weitere Informationen: Datenschutzerklärung von GitHub.",
          ],
        },
        {
          h: "6. Kontaktaufnahme",
          p: [
            "Das Kontaktformular speichert und versendet nichts über einen eigenen Server. Es erzeugt lediglich eine vorformulierte Nachricht aus Ihren Eingaben und öffnet WhatsApp (Link wa.me) oder, wenn keine WhatsApp-Nummer hinterlegt ist, Ihr E-Mail-Programm. Erst wenn Sie die Nachricht dort selbst absenden, werden Daten verarbeitet, und zwar vom jeweiligen Dienst (WhatsApp Ireland Ltd. / Meta bzw. Ihrem E-Mail-Anbieter) nach dessen Datenschutzbestimmungen.",
            "Wenn Sie mir per E-Mail oder WhatsApp schreiben, verarbeite ich Ihren Namen, Ihre Kontaktdaten und den Inhalt Ihrer Nachricht, um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f DSGVO. Ich lösche die Daten, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen.",
          ],
        },
        {
          h: "7. Externe Links und Downloads",
          p: ["Links zu externen Seiten (zum Beispiel GitHub oder Vercel) führen erst nach Ihrem Klick zu einer Verbindung. Für die dortige Datenverarbeitung gelten die Datenschutzerklärungen der Anbieter. Das Profil-PDF wird von dieser Website selbst ausgeliefert."],
        },
        {
          h: "8. Ihre Rechte",
          p: [
            "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3).",
            "Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist für Baden-Württemberg der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg (baden-wuerttemberg.datenschutz.de).",
          ],
        },
        {
          h: "9. Sicherheit und Änderungen",
          p: [
            "Die Website wird ausschließlich verschlüsselt (HTTPS) ausgeliefert und setzt zusätzliche Sicherheits-Header ein. Ich passe diese Datenschutzerklärung an, wenn sich die Website oder die Rechtslage ändert.",
            `Stand: ${legal.updated.de}`,
          ],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      lead: "This website is a personal portfolio. I collect as little data as possible: no cookies, no tracking, no analytics tools, no advertising.",
      s: [
        { h: "1. Controller", p: [controller] },
        {
          h: "2. Hosting and server log files",
          p: [
            hosting
              ? `This website is hosted by: ${hosting}. Where required, a data processing agreement under Art. 28 GDPR is in place.`
              : "This website is operated by an external hosting provider. Its name and address will be added here once the website is published.",
            "When you open the site, the host processes technically necessary connection data in server log files: IP address, date and time, requested URL, browser type and operating system, referrer URL. The legal basis is Art. 6 (1)(f) GDPR (legitimate interest in secure and stable operation). The data is not merged with other data and is deleted after a short time.",
          ],
        },
        {
          h: "3. Cookies, tracking and local storage",
          p: [
            "This website sets no cookies and uses no analytics or marketing services.",
            "Only technically necessary settings are stored in your browser, and only as a result of your own action: your chosen light or dark appearance (localStorage), a flag that the intro animation was already shown in this session, and, only after you click, a cache of the loaded GitHub commits (sessionStorage). This data does not leave your device. The legal basis is § 25 (2) no. 2 TDDDG in conjunction with Art. 6 (1)(f) GDPR.",
          ],
        },
        {
          h: "4. Fonts",
          p: ["The fonts are downloaded when the website is built and served from this website itself. No connection to Google or other font providers is made."],
        },
        {
          h: "5. GitHub commit display (only on click)",
          p: [
            "In the “AI workflow” section you can display the latest commits of this website's public repository. Only when you click the button does your browser send a request to api.github.com (GitHub Inc., USA), which transmits your IP address to GitHub. The legal basis is your consent by clicking, Art. 6 (1)(a) GDPR. The transfer to the USA relies on the certification of GitHub / Microsoft under the EU-US Data Privacy Framework. Without a click, no connection to GitHub is made. More information: GitHub's privacy statement.",
          ],
        },
        {
          h: "6. Getting in touch",
          p: [
            "The contact form does not store or send anything through a server of its own. It only builds a prepared message from your input and opens WhatsApp (wa.me link) or, if no WhatsApp number is configured, your email app. Only when you send the message there yourself is data processed, by the respective service (WhatsApp Ireland Ltd. / Meta or your email provider) under its own privacy terms.",
            "If you write to me by email or WhatsApp, I process your name, contact details and the content of your message to answer your enquiry. The legal basis is Art. 6 (1)(b) GDPR (pre-contractual measures) or (f). I delete the data once it is no longer needed for its purpose and no statutory retention duties apply.",
          ],
        },
        {
          h: "7. External links and downloads",
          p: ["Links to external sites (for example GitHub or Vercel) only create a connection after you click. The providers' privacy statements apply to the data processing there. The profile PDF is served by this website itself."],
        },
        {
          h: "8. Your rights",
          p: [
            "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21). You can withdraw any consent at any time with effect for the future (Art. 7 (3)).",
            "You also have the right to lodge a complaint with a data protection supervisory authority. For Baden-Württemberg this is the State Commissioner for Data Protection and Freedom of Information Baden-Württemberg (baden-wuerttemberg.datenschutz.de).",
          ],
        },
        {
          h: "9. Security and changes",
          p: [
            "The website is delivered encrypted (HTTPS) only and uses additional security headers. I will update this privacy policy when the website or the legal situation changes.",
            `Last updated: ${legal.updated.en}`,
          ],
        },
      ],
    },
    uk: {
      title: "Політика конфіденційності (Datenschutz)",
      lead: "Цей сайт є особистим портфоліо. Я збираю якомога менше даних: без cookies, без трекінгу, без аналітики, без реклами.",
      s: [
        { h: "1. Відповідальна особа", p: [controller] },
        {
          h: "2. Хостинг і серверні журнали",
          p: [
            hosting
              ? `Цей сайт розміщено у: ${hosting}. За потреби укладено договір про обробку даних згідно зі ст. 28 GDPR.`
              : "Цей сайт працює у зовнішнього хостинг-провайдера. Його назву й адресу буде додано тут після публікації сайту.",
            "Під час відкриття сайту хостинг обробляє технічно необхідні дані підключення у серверних журналах: IP-адреса, дата й час, запитаний URL, тип браузера й операційна система, URL джерела переходу. Правова підстава: ст. 6 абз. 1 лід. f GDPR (законний інтерес у безпечній і стабільній роботі). Дані не обʼєднуються з іншими та видаляються через короткий час.",
          ],
        },
        {
          h: "3. Cookies, трекінг і локальне сховище",
          p: [
            "Цей сайт не встановлює cookies і не використовує аналітичні чи маркетингові сервіси.",
            "У браузері зберігаються лише технічно необхідні налаштування, і тільки через вашу дію: обрана світла чи темна тема (localStorage), позначка, що вступну анімацію вже показано в цьому сеансі, та, лише після вашого кліку, кеш завантажених комітів GitHub (sessionStorage). Ці дані не залишають ваш пристрій. Правова підстава: § 25 абз. 2 п. 2 TDDDG у звʼязку зі ст. 6 абз. 1 лід. f GDPR.",
          ],
        },
        {
          h: "4. Шрифти",
          p: ["Шрифти завантажуються під час збирання сайту і віддаються самим сайтом. Звʼязку із серверами Google чи інших постачальників шрифтів немає."],
        },
        {
          h: "5. Показ комітів GitHub (лише після кліку)",
          p: [
            "У розділі «AI-процес» можна показати останні коміти публічного репозиторію цього сайту. Лише після натискання кнопки ваш браузер надсилає запит до api.github.com (GitHub Inc., США), при цьому ваша IP-адреса передається GitHub. Правова підстава: ваша згода кліком, ст. 6 абз. 1 лід. a GDPR. Передача до США спирається на сертифікацію GitHub / Microsoft за EU-US Data Privacy Framework. Без кліку зʼєднання з GitHub не встановлюється. Докладніше: політика конфіденційності GitHub.",
          ],
        },
        {
          h: "6. Звʼязок зі мною",
          p: [
            "Форма контакту нічого не зберігає і не надсилає через власний сервер. Вона лише формує готове повідомлення з ваших даних і відкриває WhatsApp (посилання wa.me) або, якщо номер WhatsApp не налаштовано, вашу поштову програму. Дані обробляються лише тоді, коли ви самі надсилаєте повідомлення там, відповідним сервісом (WhatsApp Ireland Ltd. / Meta або вашим поштовим провайдером) за його правилами.",
            "Якщо ви пишете мені поштою чи у WhatsApp, я обробляю ваше імʼя, контактні дані та зміст повідомлення, щоб відповісти на запит. Правова підстава: ст. 6 абз. 1 лід. b GDPR (дії перед укладенням договору) або лід. f. Я видаляю дані, коли вони більше не потрібні для мети і немає законних обовʼязків зберігання.",
          ],
        },
        {
          h: "7. Зовнішні посилання й завантаження",
          p: ["Посилання на зовнішні сайти (наприклад, GitHub чи Vercel) створюють зʼєднання лише після вашого кліку. До обробки даних там застосовуються політики конфіденційності відповідних постачальників. PDF-профіль віддається самим сайтом."],
        },
        {
          h: "8. Ваші права",
          p: [
            "Ви маєте право на доступ (ст. 15 GDPR), виправлення (ст. 16), видалення (ст. 17), обмеження обробки (ст. 18), перенесення даних (ст. 20) і заперечення (ст. 21). Надану згоду можна відкликати будь-коли на майбутнє (ст. 7 абз. 3).",
            "Ви також маєте право подати скаргу до наглядового органу із захисту даних. Для Баден-Вюртембергу це Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg (baden-wuerttemberg.datenschutz.de).",
          ],
        },
        {
          h: "9. Безпека та зміни",
          p: [
            "Сайт віддається лише зашифровано (HTTPS) і використовує додаткові заголовки безпеки. Я оновлю цю політику, якщо зміниться сайт чи правова ситуація.",
            `Станом на: ${legal.updated.uk}`,
          ],
        },
      ],
    },
  }[l];
  return { title: t.title, lead: t.lead, sections: t.s };
}

// Arabic visitors see the English text, with a short notice in Arabic that German is authoritative.
export const arabicNotice =
  "النص القانوني الملزم هو النسخة الألمانية. تُعرض هنا النسخة الإنجليزية للتسهيل.";
