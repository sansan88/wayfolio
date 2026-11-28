/** Texte der Produktseite in vier Sprachen. Rechtstexte (Impressum, Datenschutz) bleiben deutsch. */
export type Lang = 'de' | 'en' | 'fr' | 'es'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
]

type Item = { title: string; text: string }
/** Zeile der Vergleichstabelle: Kriterium, Little Footnotes, typische Reise-Apps; `ok` = Häkchen bei uns */
type CompareRow = { label: string; us: string; others: string }
type Faq = { q: string; a: string }

export type LandingText = {
  signIn: string
  toApp: string
  start: string
  toDiary: string
  howLink: string
  sourceAria: string
  instagramAria: string
  followUs: string
  themeLight: string
  themeDark: string
  langLabel: string
  eyebrow: string
  h1a: string
  h1em: string
  h1b: string
  lead: string
  stamps: [string, string, string, string]
  routeTag: string
  mindfulTitle: string
  mindfulText: string
  howTitle: string
  steps: [Item, Item, Item]
  shotsTitle: string
  shotsSub: string
  shotLabels: [string, string, string, string]
  shotAlts: [string, string, string, string, string]
  featuresTitle: string
  features: [Item, Item, Item, Item, Item, Item, Item, Item]
  compareTitle: string
  compareSub: string
  compareUs: string
  compareOthers: string
  compareRows: CompareRow[]
  compareNote: string
  dataPromise: string
  plansTitle: string
  plansSub: string
  privTitle: string
  privNote: string
  privItems: string[]
  soon: string
  pubTitle: string
  pubPrice: string
  pubNote: string
  pubItems: string[]
  wlLabel: string
  wlPlaceholder: string
  wlSubmit: string
  wlBusy: string
  wlHint: string
  wlError: string
  wlDone: string
  ossTitle: string
  ossText: string
  ossCta: string
  faqTitle: string
  faqs: Faq[]
  finalTitle: string
}

const de: LandingText = {
  signIn: 'Anmelden',
  toApp: 'Zur App',
  start: 'Kostenlos starten',
  toDiary: 'Zu meinem Tagebuch',
  howLink: 'So funktioniert’s',
  sourceAria: 'Quellcode auf GitHub',
  instagramAria: 'Little Footnotes auf Instagram',
  followUs: 'Folgt uns auf Instagram',
  themeLight: 'Helles Design',
  themeDark: 'Dunkles Design',
  langLabel: 'Sprache',
  eyebrow: 'Open-Source-Reisetagebuch',
  h1a: 'Bewusst reisen. ',
  h1em: 'Momente teilen',
  h1b: ' mit denen, die euch wichtig sind.',
  lead: 'Little Footnotes ist ein ruhiges Reisetagebuch für euch und eure Liebsten: ein Ort, ein paar Fotos, ein Satz. Familie und Freunde lesen per Link mit – ohne Feed, ohne Likes, ohne Konto.',
  stamps: ['Private Reisen kostenlos', 'Quellcode offen', 'Daten in Zürich', 'KI nur, wenn ihr wollt'],
  routeTag: 'Zürich → Dubai → Auckland → Wellington',
  mindfulTitle: 'Weniger posten. Mehr dort sein.',
  mindfulText:
    'Reisen ist kein Wettbewerb um Reichweite. Little Footnotes hat keine Likes, keine Followerzahlen und keinen Algorithmus – nur eure kleinen Fussnoten vom Weg, für die Menschen, die wirklich wissen wollen, wie es euch geht.',
  howTitle: 'So funktioniert’s',
  steps: [
    { title: 'Reise anlegen', text: 'Mit eurer E-Mail-Adresse anmelden, der Reise einen Namen geben.' },
    { title: 'Momente festhalten', text: 'Ein Tipp auf «+»: ein Foto, ein Satz. Ort und Zeit kommen aus dem Foto oder vom Handy.' },
    { title: 'Link weitergeben', text: 'Ein Link für Tagebuch, Karte und Fotos. Eure Liebsten öffnen ihn im Browser.' },
  ],
  shotsTitle: 'So sieht es unterwegs aus',
  shotsSub: 'Bilder direkt aus der App.',
  shotLabels: ['Tagebuch', 'Route', 'Ort im Detail', 'Beitrag erfassen'],
  shotAlts: [
    'Tagebuch mit einem Beitrag aus Wellington',
    'Tagebuch mit einem Beitrag aus Piha bei Auckland',
    'Karte mit der Route von Zürich über Dubai nach Auckland und Wellington',
    'Details zu Wellington mit Fotos',
    'Beitrag erfassen mit Ort, Zeitpunkt und drei Fotos',
  ],
  featuresTitle: 'Was drin ist',
  features: [
    { title: 'Ein Foto, ein Satz', text: 'Ort und Zeit kommen automatisch aus dem Foto oder per GPS. Für längere Geschichten einfach mehr Text, Fotos und Links dazu.' },
    { title: 'Schreiben mit Claude – wenn ihr wollt', text: 'Auf Wunsch KI-gestützt: Aus Stichworten und Fotos wird ein Entwurf, Claude liest Korrektur oder fasst die letzten Tage zusammen. Nur mit eurer Einwilligung, jederzeit ausschaltbar.' },
    { title: 'Route auf der Karte', text: 'Jeder Ort wird ein Punkt auf eurer Route, Fotos erscheinen direkt auf der Karte. Ein Tipp zeigt alles von dort.' },
    { title: 'Ein Punkt pro Tag', text: 'Die Zeitleiste zeigt jeden Reisetag als Punkt. Fehlt ein Tag, tragt ihr ihn nach – Ort und Datum sind frei wählbar.' },
    { title: 'Updates per E-Mail', text: 'Wer lieber Mails liest, abonniert eure Reise – bei jedem Beitrag oder als Wochenrückblick. Abmelden mit einem Klick.' },
    { title: 'Teilen, wo eure Leute sind', text: 'Ein Beitrag geht mit Foto und Link in die Familiengruppe – oder als fertiges Bild mit Datum und Ort in eure Instagram-Story.' },
    { title: 'Privat per Secret Link', text: 'Kein Profil, keine Suche, keine Likes. Wer den Link hat, liest mit – ohne App und ohne Konto.' },
    { title: 'Auch ohne Netz', text: 'Little Footnotes liegt als App auf dem Home-Bildschirm und zeigt die zuletzt geladenen Beiträge, Fotos und Karten offline.' },
  ],
  compareTitle: 'Little Footnotes im Vergleich',
  compareSub: 'Gegenüber typischen Reise-Apps – ohne Namen, denn jede ist etwas anders.',
  compareUs: 'Little Footnotes',
  compareOthers: 'Typische Reise-Apps',
  compareRows: [
    { label: 'Likes, Followerzahlen, Algorithmus', us: 'Gibt es nicht', others: 'Oft Teil des Konzepts' },
    { label: 'Mitlesen für Familie und Freunde', us: 'Per Link im Browser, ohne App und Konto', others: 'Meist mit App oder Konto' },
    { label: 'Speicherort der Daten', us: 'Schweiz, Rechenzentrum in Zürich', others: 'Meist ausserhalb der Schweiz' },
    { label: 'Eure Daten für KI-Training', us: 'Nie', others: 'Je nach Anbieter, oft unklar' },
    { label: 'Verkauf oder Weitergabe für Werbung', us: 'Nie', others: 'Je nach Geschäftsmodell' },
    { label: 'Quellcode', us: 'Offen (BSD-3), selbst betreibbar', others: 'Meist geschlossen' },
    { label: 'Schreibhilfe mit KI', us: 'Optional, nur mit Einwilligung', others: 'Unterschiedlich' },
    { label: 'Updates per E-Mail', us: 'Ja, bei jedem Beitrag oder wöchentlich', others: 'Teils' },
    { label: 'Kosten für Mitlesende', us: 'Immer kostenlos', others: 'Meist kostenlos' },
  ],
  compareNote: '«Typische Reise-Apps» ist unsere allgemeine Einschätzung, keine Aussage über ein bestimmtes Angebot (Stand November 2026). Im Zweifel lohnt ein Blick in die Datenschutzbestimmungen der jeweiligen App.',
  dataPromise: 'Eure Daten liegen in Zürich und bleiben eure: Wir verwenden sie nicht weiter – kein KI-Training, kein Verkauf an Dritte. Ausnahmen gibt es nur, wenn ihr sie selbst auslöst: wenn ihr die Schreibhilfe mit Claude aktiviert (dann gehen Text und Fotos zur Verarbeitung an Anthropic) oder Bilder auf Instagram oder anderen Plattformen teilt.',
  plansTitle: 'Privat ist kostenlos',
  plansSub: 'Wer mitliest, zahlt nie. Ein Abo braucht es erst für öffentliche Reisen.',
  privTitle: 'Private Reise',
  privNote: 'für euch und eure Liebsten',
  privItems: [
    'Beiträge mit Fotos, Videos und Links',
    'Route auf der Karte, Galerie, Zeitleiste',
    'Secret Link für die Reise oder einen einzelnen Beitrag',
    'Teilen in WhatsApp, Bild für Instagram',
    'Updates per E-Mail für Familie und Freunde',
    'Schreibhilfe mit Claude, wenn ihr wollt',
    'App auf dem Home-Bildschirm, auch offline',
  ],
  soon: 'Bald verfügbar',
  pubTitle: 'Öffentliche Reise',
  pubPrice: 'Abo',
  pubNote: 'Preis folgt',
  pubItems: ['Alles aus der privaten Reise', 'Eure Reise als öffentliche Seite – für alle sichtbar, ohne Secret Link'],
  wlLabel: 'Sagt mir Bescheid, wenn es so weit ist',
  wlPlaceholder: 'eure@email.ch',
  wlSubmit: 'Eintragen',
  wlBusy: 'Moment …',
  wlHint: 'Nur diese eine Nachricht, kein Newsletter.',
  wlError: 'Das hat nicht geklappt. Bitte Adresse prüfen und nochmals versuchen.',
  wlDone: 'Danke – ihr steht auf der Liste. Wir melden uns, sobald öffentliche Reisen bereit sind.',
  ossTitle: 'Offen gebaut',
  ossText: 'Little Footnotes ist Open Source. Der Code liegt auf GitHub – zum Nachlesen, Mitentwickeln oder selbst Betreiben.',
  ossCta: 'Quellcode ansehen',
  faqTitle: 'Häufige Fragen',
  faqs: [
    { q: 'Brauchen Familie und Freunde eine App?', a: 'Nein. Sie öffnen euren Link im Browser – auf Handy, Tablet oder Computer – und können ihn auf den Home-Bildschirm legen.' },
    { q: 'Wer kann unsere Reise sehen?', a: 'Nur wer euren Secret Link hat. Die Reise ist nicht auffindbar. Einzelne Beiträge lassen sich mit einem eigenen Link teilen, ohne dass die ganze Reise sichtbar wird.' },
    { q: 'Was heisst Open Source?', a: 'Der ganze Quellcode liegt offen auf GitHub (BSD-3-Lizenz). Ihr könnt nachlesen, was mit euren Daten passiert, mitentwickeln oder Little Footnotes selbst betreiben.' },
    { q: 'Wo liegen unsere Daten?', a: 'Datenbank und Fotos liegen in einem Rechenzentrum in Zürich. Wir verwenden eure Daten nicht weiter – kein KI-Training, kein Verkauf an Dritte. Ausnahmen: wenn ihr die Schreibhilfe mit Claude aktiviert oder Bilder selbst auf Instagram oder anderen Plattformen teilt.' },
    { q: 'Nutzt Little Footnotes KI?', a: 'Nur wenn ihr wollt. Die Schreibhilfe mit Claude (Anthropic) macht aus Stichworten und Fotos einen Entwurf, liest Korrektur oder fasst die letzten Tage zusammen. Sie ist erst nach eurer Einwilligung aktiv und lässt sich jederzeit ausschalten; ohne sie funktioniert alles wie gewohnt.' },
    { q: 'In welcher Sprache ist die App?', a: 'Die App selbst ist derzeit auf Deutsch. Diese Seite gibt es auch auf Englisch, Französisch und Spanisch.' },
    { q: 'Was kostet es?', a: 'Private Reisen sind kostenlos. Öffentliche Reisen kommen später als Abo – wer sich einträgt, erfährt es zuerst.' },
  ],
  finalTitle: 'Die nächste Fussnote schreibt ihr.',
}

const en: LandingText = {
  signIn: 'Sign in',
  toApp: 'Open app',
  start: 'Start for free',
  toDiary: 'Go to my journal',
  howLink: 'How it works',
  sourceAria: 'Source code on GitHub',
  instagramAria: 'Little Footnotes on Instagram',
  followUs: 'Follow us on Instagram',
  themeLight: 'Light theme',
  themeDark: 'Dark theme',
  langLabel: 'Language',
  eyebrow: 'Open-source travel journal',
  h1a: 'Travel mindfully. ',
  h1em: 'Share the moments',
  h1b: ' with the people who matter.',
  lead: 'Little Footnotes is a calm travel journal for you and your loved ones: a place, a few photos, one line. Family and friends follow along via a link – no feed, no likes, no account.',
  stamps: ['Private trips are free', 'Open source', 'Data stored in Zurich', 'AI only if you want it'],
  routeTag: 'Zurich → Dubai → Auckland → Wellington',
  mindfulTitle: 'Post less. Be there more.',
  mindfulText:
    'Travel is not a race for reach. Little Footnotes has no likes, no follower counts and no algorithm – just your little footnotes from the road, for the people who really want to know how you are.',
  howTitle: 'How it works',
  steps: [
    { title: 'Create a trip', text: 'Sign in with your email address and give your trip a name.' },
    { title: 'Capture moments', text: 'Tap «+»: one photo, one line. Place and time come from the photo or your phone.' },
    { title: 'Share the link', text: 'One link for journal, map and photos. Your loved ones open it in their browser.' },
  ],
  shotsTitle: 'What it looks like on the road',
  shotsSub: 'Screenshots straight from the app (in German).',
  shotLabels: ['Journal', 'Route', 'Place details', 'New post'],
  shotAlts: [
    'Journal with a post from Wellington',
    'Journal with a post from Piha near Auckland',
    'Map with the route from Zurich via Dubai to Auckland and Wellington',
    'Details for Wellington with photos',
    'New post with place, time and three photos',
  ],
  featuresTitle: 'What’s inside',
  features: [
    { title: 'One photo, one line', text: 'Place and time come automatically from the photo or GPS. For longer stories, just add more text, photos and links.' },
    { title: 'Write with Claude – if you like', text: 'AI-powered if you want it: notes and photos become a draft, Claude proofreads or sums up the last few days. Only with your consent, switch it off any time.' },
    { title: 'Route on the map', text: 'Every place becomes a point on your route, photos appear right on the map. One tap shows everything from there.' },
    { title: 'One dot per day', text: 'The timeline shows each travel day as a dot. Missed a day? Add it later – place and date are up to you.' },
    { title: 'Updates by email', text: 'Prefer email? Subscribe to a trip – for every post or as a weekly digest. Unsubscribe with one click.' },
    { title: 'Share where your people are', text: 'Send a post with photo and link to the family group – or as a ready-made image with date and place to your Instagram story.' },
    { title: 'Private by secret link', text: 'No profile, no search, no likes. Whoever has the link can follow – without an app or account.' },
    { title: 'Works offline', text: 'Add Little Footnotes to your home screen; recently loaded posts, photos and maps stay available offline.' },
  ],
  compareTitle: 'How Little Footnotes compares',
  compareSub: 'Compared with typical travel apps – no names, as each one is a little different.',
  compareUs: 'Little Footnotes',
  compareOthers: 'Typical travel apps',
  compareRows: [
    { label: 'Likes, follower counts, algorithm', us: 'None', others: 'Often part of the concept' },
    { label: 'Following for family and friends', us: 'Via link in the browser, no app or account', others: 'Usually with an app or account' },
    { label: 'Where your data lives', us: 'Switzerland, data centre in Zurich', others: 'Usually outside Switzerland' },
    { label: 'Your data for AI training', us: 'Never', others: 'Depends on the provider, often unclear' },
    { label: 'Sold or shared for advertising', us: 'Never', others: 'Depends on the business model' },
    { label: 'Source code', us: 'Open (BSD-3), self-hostable', others: 'Usually closed' },
    { label: 'AI writing help', us: 'Optional, only with consent', others: 'Varies' },
    { label: 'Updates by email', us: 'Yes, for every post or weekly', others: 'Sometimes' },
    { label: 'Cost for followers', us: 'Always free', others: 'Usually free' },
  ],
  compareNote: '«Typical travel apps» is our general assessment, not a statement about any specific product (as of November 2026). When in doubt, check the privacy policy of the app in question.',
  dataPromise: 'Your data lives in Zurich and stays yours: we don’t reuse it – no AI training, no selling to third parties. The only exceptions are the ones you trigger yourself: turning on the writing help with Claude (text and photos are then sent to Anthropic for processing) or sharing images on Instagram or other platforms.',
  plansTitle: 'Private is free',
  plansSub: 'Followers never pay. You only need a subscription for public trips.',
  privTitle: 'Private trip',
  privNote: 'for you and your loved ones',
  privItems: [
    'Posts with photos, videos and links',
    'Route on the map, gallery, timeline',
    'Secret link for the trip or a single post',
    'Share to WhatsApp, image for Instagram',
    'Email updates for family and friends',
    'Writing help with Claude, if you like',
    'Home-screen app, also offline',
  ],
  soon: 'Coming soon',
  pubTitle: 'Public trip',
  pubPrice: 'Subscription',
  pubNote: 'Pricing to follow',
  pubItems: ['Everything in a private trip', 'Your trip as a public page – visible to everyone, no secret link needed'],
  wlLabel: 'Let me know when it’s ready',
  wlPlaceholder: 'you@email.com',
  wlSubmit: 'Notify me',
  wlBusy: 'One moment …',
  wlHint: 'Just this one message, no newsletter.',
  wlError: 'That didn’t work. Please check the address and try again.',
  wlDone: 'Thanks – you’re on the list. We’ll let you know as soon as public trips are ready.',
  ossTitle: 'Built in the open',
  ossText: 'Little Footnotes is open source. The code lives on GitHub – to read, contribute to or host yourself.',
  ossCta: 'View source code',
  faqTitle: 'Questions',
  faqs: [
    { q: 'Do family and friends need an app?', a: 'No. They open your link in the browser – on phone, tablet or computer – and can add it to their home screen.' },
    { q: 'Who can see our trip?', a: 'Only people with your secret link. The trip can’t be found otherwise. Single posts can be shared with their own link without revealing the whole trip.' },
    { q: 'What does open source mean?', a: 'All the source code is public on GitHub (BSD-3 licence). You can check what happens with your data, contribute, or run Little Footnotes yourself.' },
    { q: 'Where is our data stored?', a: 'Database and photos are stored in a data centre in Zurich. We don’t reuse your data – no AI training, no selling to third parties. Exceptions: when you turn on the writing help with Claude or share images on Instagram or other platforms yourself.' },
    { q: 'Does Little Footnotes use AI?', a: 'Only if you want it to. The writing help with Claude (Anthropic) turns notes and photos into a draft, proofreads or sums up the last few days. It only works after you consent and can be switched off at any time; without it, everything works as usual.' },
    { q: 'Which language is the app in?', a: 'The app itself is currently in German. This page is also available in English, French and Spanish.' },
    { q: 'How much does it cost?', a: 'Private trips are free. Public trips will come later with a subscription – sign up to hear first.' },
  ],
  finalTitle: 'The next footnote is yours to write.',
}

const fr: LandingText = {
  signIn: 'Se connecter',
  toApp: 'Ouvrir l’app',
  start: 'Commencer gratuitement',
  toDiary: 'Vers mon carnet',
  howLink: 'Comment ça marche',
  sourceAria: 'Code source sur GitHub',
  instagramAria: 'Little Footnotes sur Instagram',
  followUs: 'Suivez-nous sur Instagram',
  themeLight: 'Thème clair',
  themeDark: 'Thème sombre',
  langLabel: 'Langue',
  eyebrow: 'Carnet de voyage open source',
  h1a: 'Voyager en conscience. ',
  h1em: 'Partager les moments',
  h1b: ' avec celles et ceux qui comptent.',
  lead: 'Little Footnotes est un carnet de voyage paisible pour vous et vos proches : un lieu, quelques photos, une phrase. Famille et amis suivent via un lien – sans fil d’actualité, sans likes, sans compte.',
  stamps: ['Voyages privés gratuits', 'Code ouvert', 'Données à Zurich', 'IA seulement si vous voulez'],
  routeTag: 'Zurich → Dubaï → Auckland → Wellington',
  mindfulTitle: 'Publier moins. Être là davantage.',
  mindfulText:
    'Voyager n’est pas une course à l’audience. Little Footnotes n’a ni likes, ni compteur d’abonnés, ni algorithme – seulement vos petites notes de route, pour les personnes qui veulent vraiment savoir comment vous allez.',
  howTitle: 'Comment ça marche',
  steps: [
    { title: 'Créer un voyage', text: 'Connectez-vous avec votre adresse e-mail et donnez un nom au voyage.' },
    { title: 'Capturer les moments', text: 'Un tap sur «+» : une photo, une phrase. Lieu et heure viennent de la photo ou du téléphone.' },
    { title: 'Partager le lien', text: 'Un seul lien pour le carnet, la carte et les photos. Vos proches l’ouvrent dans le navigateur.' },
  ],
  shotsTitle: 'À quoi ça ressemble en route',
  shotsSub: 'Captures tirées directement de l’app (en allemand).',
  shotLabels: ['Carnet', 'Itinéraire', 'Détail du lieu', 'Nouvel article'],
  shotAlts: [
    'Carnet avec un article de Wellington',
    'Carnet avec un article de Piha, près d’Auckland',
    'Carte avec l’itinéraire de Zurich à Auckland et Wellington via Dubaï',
    'Détails de Wellington avec photos',
    'Nouvel article avec lieu, heure et trois photos',
  ],
  featuresTitle: 'Ce qu’il y a dedans',
  features: [
    { title: 'Une photo, une phrase', text: 'Lieu et heure viennent automatiquement de la photo ou du GPS. Pour les longues histoires, ajoutez simplement texte, photos et liens.' },
    { title: 'Écrire avec Claude – si vous le souhaitez', text: 'Assisté par IA si vous le voulez : vos notes et photos deviennent un brouillon, Claude corrige ou résume les derniers jours. Uniquement avec votre accord, désactivable à tout moment.' },
    { title: 'Itinéraire sur la carte', text: 'Chaque lieu devient un point de votre itinéraire, les photos apparaissent sur la carte. Un tap montre tout ce qui s’y est passé.' },
    { title: 'Un point par jour', text: 'La frise montre chaque jour de voyage comme un point. Un jour manque ? Ajoutez-le plus tard – lieu et date au choix.' },
    { title: 'Nouvelles par e-mail', text: 'Vous préférez les e-mails ? Abonnez-vous à un voyage – à chaque article ou en résumé hebdomadaire. Désabonnement en un clic.' },
    { title: 'Partager là où sont vos proches', text: 'Envoyez un article avec photo et lien au groupe familial – ou comme image prête avec date et lieu dans votre story Instagram.' },
    { title: 'Privé par lien secret', text: 'Pas de profil, pas de recherche, pas de likes. Qui a le lien peut suivre – sans app ni compte.' },
    { title: 'Même hors ligne', text: 'Little Footnotes s’installe sur l’écran d’accueil et garde les derniers articles, photos et cartes hors ligne.' },
  ],
  compareTitle: 'Little Footnotes en comparaison',
  compareSub: 'Face aux applis de voyage typiques – sans noms, car chacune est un peu différente.',
  compareUs: 'Little Footnotes',
  compareOthers: 'Applis de voyage typiques',
  compareRows: [
    { label: 'Likes, nombre d’abonnés, algorithme', us: 'Aucun', others: 'Souvent au cœur du concept' },
    { label: 'Suivre pour famille et amis', us: 'Par lien dans le navigateur, sans app ni compte', others: 'Le plus souvent avec app ou compte' },
    { label: 'Lieu de stockage des données', us: 'Suisse, centre de données à Zurich', others: 'Le plus souvent hors de Suisse' },
    { label: 'Vos données pour entraîner une IA', us: 'Jamais', others: 'Selon le fournisseur, souvent flou' },
    { label: 'Vente ou partage pour la publicité', us: 'Jamais', others: 'Selon le modèle économique' },
    { label: 'Code source', us: 'Ouvert (BSD-3), auto-hébergeable', others: 'Le plus souvent fermé' },
    { label: 'Aide à la rédaction par IA', us: 'Optionnelle, uniquement avec accord', others: 'Variable' },
    { label: 'Nouvelles par e-mail', us: 'Oui, à chaque article ou chaque semaine', others: 'Parfois' },
    { label: 'Coût pour les lecteurs', us: 'Toujours gratuit', others: 'Le plus souvent gratuit' },
  ],
  compareNote: '«Applis de voyage typiques» est notre appréciation générale, pas une affirmation sur un produit précis (état novembre 2026). En cas de doute, consultez la politique de confidentialité de l’appli concernée.',
  dataPromise: 'Vos données sont à Zurich et restent les vôtres : nous ne les réutilisons pas – pas d’entraînement d’IA, pas de vente à des tiers. Seules exceptions, celles que vous déclenchez vous-même : activer l’aide à la rédaction avec Claude (texte et photos sont alors envoyés à Anthropic pour traitement) ou partager des images sur Instagram ou d’autres plateformes.',
  plansTitle: 'Le privé est gratuit',
  plansSub: 'Celles et ceux qui suivent ne paient jamais. L’abonnement ne concerne que les voyages publics.',
  privTitle: 'Voyage privé',
  privNote: 'pour vous et vos proches',
  privItems: [
    'Articles avec photos, vidéos et liens',
    'Itinéraire sur la carte, galerie, frise',
    'Lien secret pour le voyage ou un seul article',
    'Partage WhatsApp, image pour Instagram',
    'Nouvelles par e-mail pour famille et amis',
    'Aide à la rédaction avec Claude, si vous voulez',
    'App sur l’écran d’accueil, aussi hors ligne',
  ],
  soon: 'Bientôt disponible',
  pubTitle: 'Voyage public',
  pubPrice: 'Abonnement',
  pubNote: 'Prix à venir',
  pubItems: ['Tout le voyage privé', 'Votre voyage en page publique – visible par tous, sans lien secret'],
  wlLabel: 'Prévenez-moi quand ce sera prêt',
  wlPlaceholder: 'vous@email.ch',
  wlSubmit: 'M’inscrire',
  wlBusy: 'Un instant …',
  wlHint: 'Un seul message, pas de newsletter.',
  wlError: 'Cela n’a pas fonctionné. Vérifiez l’adresse et réessayez.',
  wlDone: 'Merci – vous êtes sur la liste. Nous vous écrirons dès que les voyages publics seront prêts.',
  ossTitle: 'Construit en open source',
  ossText: 'Little Footnotes est open source. Le code est sur GitHub – à lire, à améliorer ou à héberger vous-même.',
  ossCta: 'Voir le code source',
  faqTitle: 'Questions fréquentes',
  faqs: [
    { q: 'Famille et amis ont-ils besoin d’une app ?', a: 'Non. Ils ouvrent votre lien dans le navigateur – sur téléphone, tablette ou ordinateur – et peuvent l’ajouter à l’écran d’accueil.' },
    { q: 'Qui peut voir notre voyage ?', a: 'Seulement les personnes qui ont votre lien secret. Le voyage n’est pas trouvable autrement. Un article peut être partagé avec son propre lien sans dévoiler tout le voyage.' },
    { q: 'Que signifie open source ?', a: 'Tout le code source est public sur GitHub (licence BSD-3). Vous pouvez vérifier ce qui arrive à vos données, contribuer ou héberger Little Footnotes vous-même.' },
    { q: 'Où sont stockées nos données ?', a: 'Base de données et photos sont stockées dans un centre de données à Zurich. Nous ne réutilisons pas vos données – pas d’entraînement d’IA, pas de vente à des tiers. Exceptions : si vous activez l’aide à la rédaction avec Claude ou partagez vous-même des images sur Instagram ou d’autres plateformes.' },
    { q: 'Little Footnotes utilise-t-il l’IA ?', a: 'Seulement si vous le souhaitez. L’aide à la rédaction avec Claude (Anthropic) transforme notes et photos en brouillon, corrige ou résume les derniers jours. Elle n’est active qu’après votre accord et se désactive à tout moment ; sans elle, tout fonctionne comme d’habitude.' },
    { q: 'Dans quelle langue est l’app ?', a: 'L’app elle-même est pour l’instant en allemand. Cette page existe aussi en anglais, français et espagnol.' },
    { q: 'Combien ça coûte ?', a: 'Les voyages privés sont gratuits. Les voyages publics viendront plus tard avec un abonnement – inscrivez-vous pour être informé en premier.' },
  ],
  finalTitle: 'La prochaine note de bas de page, c’est vous qui l’écrivez.',
}

const es: LandingText = {
  signIn: 'Iniciar sesión',
  toApp: 'Abrir la app',
  start: 'Empezar gratis',
  toDiary: 'Ir a mi diario',
  howLink: 'Cómo funciona',
  sourceAria: 'Código fuente en GitHub',
  instagramAria: 'Little Footnotes en Instagram',
  followUs: 'Síguenos en Instagram',
  themeLight: 'Tema claro',
  themeDark: 'Tema oscuro',
  langLabel: 'Idioma',
  eyebrow: 'Diario de viaje de código abierto',
  h1a: 'Viajar con calma. ',
  h1em: 'Compartir momentos',
  h1b: ' con quienes más te importan.',
  lead: 'Little Footnotes es un diario de viaje tranquilo para ti y los tuyos: un lugar, unas fotos, una frase. Familia y amigos lo siguen con un enlace – sin feed, sin likes, sin cuenta.',
  stamps: ['Viajes privados gratis', 'Código abierto', 'Datos en Zúrich', 'IA solo si quieres'],
  routeTag: 'Zúrich → Dubái → Auckland → Wellington',
  mindfulTitle: 'Publicar menos. Estar más presente.',
  mindfulText:
    'Viajar no es una carrera por el alcance. Little Footnotes no tiene likes, ni contador de seguidores, ni algoritmo – solo tus pequeñas notas del camino, para las personas que de verdad quieren saber cómo estás.',
  howTitle: 'Cómo funciona',
  steps: [
    { title: 'Crea un viaje', text: 'Inicia sesión con tu correo electrónico y ponle un nombre al viaje.' },
    { title: 'Guarda los momentos', text: 'Un toque en «+»: una foto, una frase. El lugar y la hora salen de la foto o del móvil.' },
    { title: 'Comparte el enlace', text: 'Un solo enlace para diario, mapa y fotos. Tus seres queridos lo abren en el navegador.' },
  ],
  shotsTitle: 'Así se ve en el camino',
  shotsSub: 'Capturas directamente de la app (en alemán).',
  shotLabels: ['Diario', 'Ruta', 'Detalle del lugar', 'Nueva entrada'],
  shotAlts: [
    'Diario con una entrada desde Wellington',
    'Diario con una entrada desde Piha, cerca de Auckland',
    'Mapa con la ruta de Zúrich a Auckland y Wellington pasando por Dubái',
    'Detalles de Wellington con fotos',
    'Nueva entrada con lugar, hora y tres fotos',
  ],
  featuresTitle: 'Qué incluye',
  features: [
    { title: 'Una foto, una frase', text: 'El lugar y la hora salen automáticamente de la foto o del GPS. Para historias más largas, añade más texto, fotos y enlaces.' },
    { title: 'Escribir con Claude – si quieres', text: 'Con IA si lo deseas: tus notas y fotos se convierten en un borrador, Claude corrige o resume los últimos días. Solo con tu consentimiento, desactivable en cualquier momento.' },
    { title: 'Ruta en el mapa', text: 'Cada lugar se convierte en un punto de tu ruta y las fotos aparecen en el mapa. Un toque muestra todo lo de ese sitio.' },
    { title: 'Un punto por día', text: 'La línea de tiempo muestra cada día de viaje como un punto. ¿Falta un día? Añádelo después – lugar y fecha a tu elección.' },
    { title: 'Novedades por correo', text: '¿Prefieres el correo? Suscríbete a un viaje – con cada entrada o como resumen semanal. Te das de baja con un clic.' },
    { title: 'Comparte donde está tu gente', text: 'Envía una entrada con foto y enlace al grupo familiar – o como imagen lista con fecha y lugar a tu historia de Instagram.' },
    { title: 'Privado con enlace secreto', text: 'Sin perfil, sin búsqueda, sin likes. Quien tiene el enlace puede seguir – sin app ni cuenta.' },
    { title: 'También sin conexión', text: 'Little Footnotes se instala en la pantalla de inicio y muestra sin conexión las últimas entradas, fotos y mapas.' },
  ],
  compareTitle: 'Little Footnotes en comparación',
  compareSub: 'Frente a las apps de viaje típicas – sin nombres, porque cada una es un poco distinta.',
  compareUs: 'Little Footnotes',
  compareOthers: 'Apps de viaje típicas',
  compareRows: [
    { label: 'Likes, número de seguidores, algoritmo', us: 'Ninguno', others: 'A menudo parte del concepto' },
    { label: 'Seguir para familia y amigos', us: 'Con un enlace en el navegador, sin app ni cuenta', others: 'Normalmente con app o cuenta' },
    { label: 'Dónde están los datos', us: 'Suiza, centro de datos en Zúrich', others: 'Normalmente fuera de Suiza' },
    { label: 'Tus datos para entrenar IA', us: 'Nunca', others: 'Según el proveedor, a menudo poco claro' },
    { label: 'Venta o cesión para publicidad', us: 'Nunca', others: 'Según el modelo de negocio' },
    { label: 'Código fuente', us: 'Abierto (BSD-3), autoalojable', others: 'Normalmente cerrado' },
    { label: 'Ayuda para escribir con IA', us: 'Opcional, solo con consentimiento', others: 'Varía' },
    { label: 'Novedades por correo', us: 'Sí, con cada entrada o cada semana', others: 'A veces' },
    { label: 'Coste para quien sigue', us: 'Siempre gratis', others: 'Normalmente gratis' },
  ],
  compareNote: '«Apps de viaje típicas» es nuestra valoración general, no una afirmación sobre un producto concreto (a noviembre de 2026). Ante la duda, consulta la política de privacidad de cada app.',
  dataPromise: 'Tus datos están en Zúrich y siguen siendo tuyos: no los reutilizamos – nada de entrenar IA, nada de venderlos a terceros. Las únicas excepciones son las que activas tú: encender la ayuda para escribir con Claude (texto y fotos se envían entonces a Anthropic para procesarlos) o compartir imágenes en Instagram u otras plataformas.',
  plansTitle: 'Lo privado es gratis',
  plansSub: 'Quien te sigue nunca paga. Solo los viajes públicos necesitarán una suscripción.',
  privTitle: 'Viaje privado',
  privNote: 'para ti y los tuyos',
  privItems: [
    'Entradas con fotos, vídeos y enlaces',
    'Ruta en el mapa, galería, línea de tiempo',
    'Enlace secreto para el viaje o una sola entrada',
    'Compartir en WhatsApp, imagen para Instagram',
    'Novedades por correo para familia y amigos',
    'Ayuda para escribir con Claude, si quieres',
    'App en la pantalla de inicio, también sin conexión',
  ],
  soon: 'Muy pronto',
  pubTitle: 'Viaje público',
  pubPrice: 'Suscripción',
  pubNote: 'Precio por anunciar',
  pubItems: ['Todo lo del viaje privado', 'Tu viaje como página pública – visible para todos, sin enlace secreto'],
  wlLabel: 'Avísame cuando esté listo',
  wlPlaceholder: 'tu@email.com',
  wlSubmit: 'Apuntarme',
  wlBusy: 'Un momento …',
  wlHint: 'Solo este mensaje, sin newsletter.',
  wlError: 'No ha funcionado. Revisa la dirección e inténtalo de nuevo.',
  wlDone: 'Gracias – ya estás en la lista. Te avisaremos en cuanto los viajes públicos estén listos.',
  ossTitle: 'Hecho en abierto',
  ossText: 'Little Footnotes es de código abierto. El código está en GitHub – para leerlo, contribuir o alojarlo tú mismo.',
  ossCta: 'Ver el código',
  faqTitle: 'Preguntas frecuentes',
  faqs: [
    { q: '¿Necesitan una app la familia y los amigos?', a: 'No. Abren tu enlace en el navegador – en móvil, tableta u ordenador – y pueden añadirlo a la pantalla de inicio.' },
    { q: '¿Quién puede ver nuestro viaje?', a: 'Solo quien tenga tu enlace secreto. El viaje no se puede encontrar de otra forma. Una entrada se puede compartir con su propio enlace sin mostrar todo el viaje.' },
    { q: '¿Qué significa código abierto?', a: 'Todo el código fuente es público en GitHub (licencia BSD-3). Puedes comprobar qué pasa con tus datos, contribuir o alojar Little Footnotes tú mismo.' },
    { q: '¿Dónde se guardan nuestros datos?', a: 'La base de datos y las fotos se guardan en un centro de datos en Zúrich. No reutilizamos tus datos – nada de entrenar IA, nada de venderlos a terceros. Excepciones: si activas la ayuda para escribir con Claude o compartes tú mismo imágenes en Instagram u otras plataformas.' },
    { q: '¿Usa IA Little Footnotes?', a: 'Solo si tú quieres. La ayuda para escribir con Claude (Anthropic) convierte notas y fotos en un borrador, corrige o resume los últimos días. Solo funciona tras tu consentimiento y se desactiva en cualquier momento; sin ella, todo funciona igual.' },
    { q: '¿En qué idioma está la app?', a: 'Por ahora la app está en alemán. Esta página también está en inglés, francés y español.' },
    { q: '¿Cuánto cuesta?', a: 'Los viajes privados son gratis. Los viajes públicos llegarán más adelante con suscripción – apúntate para enterarte primero.' },
  ],
  finalTitle: 'La próxima nota al pie la escribes tú.',
}

export const TEXTS: Record<Lang, LandingText> = { de, en, fr, es }

const LANG_KEY = 'lf-lang'

export const initialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null
    if (saved && saved in TEXTS) return saved
  } catch {
    /* Speicher nicht verfügbar */
  }
  const nav = (navigator.language || 'de').slice(0, 2) as Lang
  return nav in TEXTS ? nav : 'de'
}

export const saveLang = (lang: Lang) => {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* egal */
  }
}

export type Theme = 'light' | 'dark'
const THEME_KEY = 'lf-theme'

export const savedTheme = (): Theme | null => {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export const saveTheme = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* egal */
  }
}
