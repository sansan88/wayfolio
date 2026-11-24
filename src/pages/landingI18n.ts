/** Texte der Produktseite in vier Sprachen. Rechtstexte (Impressum, Datenschutz) bleiben deutsch. */
export type Lang = 'de' | 'en' | 'fr' | 'es'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
]

type Item = { title: string; text: string }
type Faq = { q: string; a: string }

export type LandingText = {
  signIn: string
  toApp: string
  start: string
  toDiary: string
  howLink: string
  sourceAria: string
  themeLight: string
  themeDark: string
  langLabel: string
  eyebrow: string
  h1a: string
  h1em: string
  h1b: string
  lead: string
  stamps: [string, string, string]
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
  themeLight: 'Helles Design',
  themeDark: 'Dunkles Design',
  langLabel: 'Sprache',
  eyebrow: 'Open-Source-Reisetagebuch',
  h1a: 'Bewusst reisen. ',
  h1em: 'Momente teilen',
  h1b: ' mit denen, die euch wichtig sind.',
  lead: 'Little Footnotes ist ein ruhiges Reisetagebuch für euch und eure Liebsten: ein Ort, ein paar Fotos, ein Satz. Familie und Freunde lesen per Link mit – ohne Feed, ohne Likes, ohne Konto.',
  stamps: ['Private Reisen kostenlos', 'Quellcode offen', 'Daten in Zürich'],
  routeTag: 'Zürich → Dubai → Auckland → Wellington',
  mindfulTitle: 'Weniger posten. Mehr dort sein.',
  mindfulText:
    'Reisen ist kein Wettbewerb um Reichweite. Little Footnotes hat keine Likes, keine Followerzahlen und keinen Algorithmus – nur eure kleinen Fussnoten vom Weg, für die Menschen, die wirklich wissen wollen, wie es euch geht.',
  howTitle: 'So funktioniert’s',
  steps: [
    { title: 'Reise anlegen', text: 'Mit eurer E-Mail-Adresse anmelden, der Reise einen Namen geben.' },
    { title: 'Momente festhalten', text: 'Ein Tipp auf «+»: Check-in oder Beitrag. Ort und Zeit kommen aus dem Foto oder vom Handy.' },
    { title: 'Link weitergeben', text: 'Ein Link für Tagebuch, Karte und Fotos. Eure Liebsten öffnen ihn im Browser.' },
  ],
  shotsTitle: 'So sieht es unterwegs aus',
  shotsSub: 'Bilder direkt aus der App.',
  shotLabels: ['Tagebuch', 'Route', 'Ort im Detail', 'Check-in'],
  shotAlts: [
    'Tagebuch mit einem Check-in in Wellington',
    'Tagebuch mit einem Beitrag aus Auckland',
    'Karte mit der Route von Zürich über Dubai nach Auckland und Wellington',
    'Details zu Wellington mit Fotos',
    'Check-in mit Ort, Zeitpunkt und drei Fotos',
  ],
  featuresTitle: 'Was drin ist',
  features: [
    { title: 'Check-in', text: '«Wir sind heute hier»: Ort per GPS, Suche oder Pin, dazu ein paar Fotos und ein Satz. Mehr braucht es nicht.' },
    { title: 'Beiträge', text: 'Für die längeren Geschichten: Text mit Fotos, Link und Ort – wenn ihr abends Zeit dafür habt.' },
    { title: 'Route auf der Karte', text: 'Jeder Ort wird ein Punkt auf eurer Route, Fotos erscheinen direkt auf der Karte. Ein Tipp zeigt alles von dort.' },
    { title: 'Ein Punkt pro Tag', text: 'Die Zeitleiste zeigt jeden Reisetag als Punkt. Fehlt ein Tag, tragt ihr ihn nach – Ort und Datum sind frei wählbar.' },
    { title: 'Fotos, die bleiben', text: 'Alle Bilder der Reise in einer Galerie. Sie werden fürs Handy verkleinert und sind nur über euren Link zu sehen.' },
    { title: 'Teilen, wo eure Leute sind', text: 'Ein Beitrag geht mit Foto und Link in die Familiengruppe – als ganze Reise oder nur dieser eine Moment.' },
    { title: 'Privat per Secret Link', text: 'Kein Profil, keine Suche, keine Likes. Wer den Link hat, liest mit – ohne App und ohne Konto.' },
    { title: 'Auch ohne Netz', text: 'Little Footnotes liegt als App auf dem Home-Bildschirm und zeigt die zuletzt geladenen Beiträge, Fotos und Karten offline.' },
  ],
  plansTitle: 'Privat ist kostenlos',
  plansSub: 'Wer mitliest, zahlt nie. Ein Abo braucht es erst für öffentliche Reisen.',
  privTitle: 'Private Reise',
  privNote: 'für euch und eure Liebsten',
  privItems: [
    'Check-ins und Beiträge mit Fotos',
    'Route auf der Karte, Galerie, Zeitleiste',
    'Secret Link für die Reise oder einen einzelnen Beitrag',
    'Teilen in WhatsApp',
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
    { q: 'Wo liegen unsere Daten?', a: 'Datenbank und Fotos liegen in einem Rechenzentrum in Zürich. Fotos werden vor dem Hochladen fürs Handy verkleinert.' },
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
  themeLight: 'Light theme',
  themeDark: 'Dark theme',
  langLabel: 'Language',
  eyebrow: 'Open-source travel journal',
  h1a: 'Travel mindfully. ',
  h1em: 'Share the moments',
  h1b: ' with the people who matter.',
  lead: 'Little Footnotes is a calm travel journal for you and your loved ones: a place, a few photos, one line. Family and friends follow along via a link – no feed, no likes, no account.',
  stamps: ['Private trips are free', 'Open source', 'Data stored in Zurich'],
  routeTag: 'Zurich → Dubai → Auckland → Wellington',
  mindfulTitle: 'Post less. Be there more.',
  mindfulText:
    'Travel is not a race for reach. Little Footnotes has no likes, no follower counts and no algorithm – just your little footnotes from the road, for the people who really want to know how you are.',
  howTitle: 'How it works',
  steps: [
    { title: 'Create a trip', text: 'Sign in with your email address and give your trip a name.' },
    { title: 'Capture moments', text: 'Tap «+»: check-in or post. Place and time come from the photo or your phone.' },
    { title: 'Share the link', text: 'One link for journal, map and photos. Your loved ones open it in their browser.' },
  ],
  shotsTitle: 'What it looks like on the road',
  shotsSub: 'Screenshots straight from the app (in German).',
  shotLabels: ['Journal', 'Route', 'Place details', 'Check-in'],
  shotAlts: [
    'Journal with a check-in in Wellington',
    'Journal with a post from Auckland',
    'Map with the route from Zurich via Dubai to Auckland and Wellington',
    'Details for Wellington with photos',
    'Check-in with place, time and three photos',
  ],
  featuresTitle: 'What’s inside',
  features: [
    { title: 'Check-in', text: '«We’re here today»: place via GPS, search or pin, plus a few photos and one line. That’s all it takes.' },
    { title: 'Posts', text: 'For the longer stories: text with photos, a link and a place – whenever you have time in the evening.' },
    { title: 'Route on the map', text: 'Every place becomes a point on your route, photos appear right on the map. One tap shows everything from there.' },
    { title: 'One dot per day', text: 'The timeline shows each travel day as a dot. Missed a day? Add it later – place and date are up to you.' },
    { title: 'Photos that stay', text: 'All trip photos in one gallery. They are resized for phones and only visible through your link.' },
    { title: 'Share where your people are', text: 'Send a post with photo and link to the family group – the whole trip or just this one moment.' },
    { title: 'Private by secret link', text: 'No profile, no search, no likes. Whoever has the link can follow – without an app or account.' },
    { title: 'Works offline', text: 'Add Little Footnotes to your home screen; recently loaded posts, photos and maps stay available offline.' },
  ],
  plansTitle: 'Private is free',
  plansSub: 'Followers never pay. You only need a subscription for public trips.',
  privTitle: 'Private trip',
  privNote: 'for you and your loved ones',
  privItems: [
    'Check-ins and posts with photos',
    'Route on the map, gallery, timeline',
    'Secret link for the trip or a single post',
    'Share to WhatsApp',
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
    { q: 'Where is our data stored?', a: 'Database and photos are stored in a data centre in Zurich. Photos are resized for phones before uploading.' },
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
  themeLight: 'Thème clair',
  themeDark: 'Thème sombre',
  langLabel: 'Langue',
  eyebrow: 'Carnet de voyage open source',
  h1a: 'Voyager en conscience. ',
  h1em: 'Partager les moments',
  h1b: ' avec celles et ceux qui comptent.',
  lead: 'Little Footnotes est un carnet de voyage paisible pour vous et vos proches : un lieu, quelques photos, une phrase. Famille et amis suivent via un lien – sans fil d’actualité, sans likes, sans compte.',
  stamps: ['Voyages privés gratuits', 'Code ouvert', 'Données à Zurich'],
  routeTag: 'Zurich → Dubaï → Auckland → Wellington',
  mindfulTitle: 'Publier moins. Être là davantage.',
  mindfulText:
    'Voyager n’est pas une course à l’audience. Little Footnotes n’a ni likes, ni compteur d’abonnés, ni algorithme – seulement vos petites notes de route, pour les personnes qui veulent vraiment savoir comment vous allez.',
  howTitle: 'Comment ça marche',
  steps: [
    { title: 'Créer un voyage', text: 'Connectez-vous avec votre adresse e-mail et donnez un nom au voyage.' },
    { title: 'Capturer les moments', text: 'Un tap sur «+» : check-in ou article. Lieu et heure viennent de la photo ou du téléphone.' },
    { title: 'Partager le lien', text: 'Un seul lien pour le carnet, la carte et les photos. Vos proches l’ouvrent dans le navigateur.' },
  ],
  shotsTitle: 'À quoi ça ressemble en route',
  shotsSub: 'Captures tirées directement de l’app (en allemand).',
  shotLabels: ['Carnet', 'Itinéraire', 'Détail du lieu', 'Check-in'],
  shotAlts: [
    'Carnet avec un check-in à Wellington',
    'Carnet avec un article depuis Auckland',
    'Carte avec l’itinéraire de Zurich via Dubaï vers Auckland et Wellington',
    'Détails de Wellington avec photos',
    'Check-in avec lieu, heure et trois photos',
  ],
  featuresTitle: 'Ce qu’il y a dedans',
  features: [
    { title: 'Check-in', text: '«Nous sommes ici aujourd’hui» : lieu par GPS, recherche ou épingle, quelques photos et une phrase. C’est tout.' },
    { title: 'Articles', text: 'Pour les plus longues histoires : texte avec photos, lien et lieu – quand vous avez du temps le soir.' },
    { title: 'Itinéraire sur la carte', text: 'Chaque lieu devient un point de votre itinéraire, les photos apparaissent sur la carte. Un tap montre tout ce qui s’y est passé.' },
    { title: 'Un point par jour', text: 'La frise montre chaque jour de voyage comme un point. Un jour manque ? Ajoutez-le plus tard – lieu et date au choix.' },
    { title: 'Des photos qui restent', text: 'Toutes les photos du voyage dans une galerie. Redimensionnées pour mobile et visibles uniquement via votre lien.' },
    { title: 'Partager là où sont vos proches', text: 'Envoyez un article avec photo et lien au groupe familial – tout le voyage ou seulement ce moment.' },
    { title: 'Privé par lien secret', text: 'Pas de profil, pas de recherche, pas de likes. Qui a le lien peut suivre – sans app ni compte.' },
    { title: 'Même hors ligne', text: 'Little Footnotes s’installe sur l’écran d’accueil et garde les derniers articles, photos et cartes hors ligne.' },
  ],
  plansTitle: 'Le privé est gratuit',
  plansSub: 'Celles et ceux qui suivent ne paient jamais. L’abonnement ne concerne que les voyages publics.',
  privTitle: 'Voyage privé',
  privNote: 'pour vous et vos proches',
  privItems: [
    'Check-ins et articles avec photos',
    'Itinéraire sur la carte, galerie, frise',
    'Lien secret pour le voyage ou un seul article',
    'Partage sur WhatsApp',
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
    { q: 'Où sont stockées nos données ?', a: 'Base de données et photos sont stockées dans un centre de données à Zurich. Les photos sont réduites avant l’envoi.' },
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
  themeLight: 'Tema claro',
  themeDark: 'Tema oscuro',
  langLabel: 'Idioma',
  eyebrow: 'Diario de viaje de código abierto',
  h1a: 'Viajar con calma. ',
  h1em: 'Compartir momentos',
  h1b: ' con quienes más te importan.',
  lead: 'Little Footnotes es un diario de viaje tranquilo para ti y los tuyos: un lugar, unas fotos, una frase. Familia y amigos lo siguen con un enlace – sin feed, sin likes, sin cuenta.',
  stamps: ['Viajes privados gratis', 'Código abierto', 'Datos en Zúrich'],
  routeTag: 'Zúrich → Dubái → Auckland → Wellington',
  mindfulTitle: 'Publicar menos. Estar más presente.',
  mindfulText:
    'Viajar no es una carrera por el alcance. Little Footnotes no tiene likes, ni contador de seguidores, ni algoritmo – solo tus pequeñas notas del camino, para las personas que de verdad quieren saber cómo estás.',
  howTitle: 'Cómo funciona',
  steps: [
    { title: 'Crea un viaje', text: 'Inicia sesión con tu correo electrónico y ponle nombre al viaje.' },
    { title: 'Guarda momentos', text: 'Toca «+»: check-in o entrada. El lugar y la hora salen de la foto o del móvil.' },
    { title: 'Comparte el enlace', text: 'Un enlace para diario, mapa y fotos. Tus seres queridos lo abren en el navegador.' },
  ],
  shotsTitle: 'Así se ve en el camino',
  shotsSub: 'Capturas directamente de la app (en alemán).',
  shotLabels: ['Diario', 'Ruta', 'Detalle del lugar', 'Check-in'],
  shotAlts: [
    'Diario con un check-in en Wellington',
    'Diario con una entrada desde Auckland',
    'Mapa con la ruta de Zúrich por Dubái hasta Auckland y Wellington',
    'Detalles de Wellington con fotos',
    'Check-in con lugar, hora y tres fotos',
  ],
  featuresTitle: 'Qué incluye',
  features: [
    { title: 'Check-in', text: '«Hoy estamos aquí»: lugar por GPS, búsqueda o chincheta, unas fotos y una frase. No hace falta más.' },
    { title: 'Entradas', text: 'Para las historias largas: texto con fotos, enlace y lugar – cuando tengas tiempo por la noche.' },
    { title: 'Ruta en el mapa', text: 'Cada lugar se convierte en un punto de tu ruta y las fotos aparecen en el mapa. Un toque muestra todo lo de allí.' },
    { title: 'Un punto por día', text: 'La línea de tiempo muestra cada día de viaje como un punto. ¿Falta un día? Añádelo luego – lugar y fecha a tu elección.' },
    { title: 'Fotos que se quedan', text: 'Todas las fotos del viaje en una galería. Reducidas para el móvil y visibles solo con tu enlace.' },
    { title: 'Comparte donde está tu gente', text: 'Envía una entrada con foto y enlace al grupo familiar – todo el viaje o solo ese momento.' },
    { title: 'Privado con enlace secreto', text: 'Sin perfil, sin búsqueda, sin likes. Quien tenga el enlace puede seguirte – sin app ni cuenta.' },
    { title: 'También sin conexión', text: 'Instala Little Footnotes en la pantalla de inicio; las últimas entradas, fotos y mapas siguen disponibles sin conexión.' },
  ],
  plansTitle: 'Lo privado es gratis',
  plansSub: 'Quien te sigue nunca paga. Solo los viajes públicos necesitarán una suscripción.',
  privTitle: 'Viaje privado',
  privNote: 'para ti y los tuyos',
  privItems: [
    'Check-ins y entradas con fotos',
    'Ruta en el mapa, galería, línea de tiempo',
    'Enlace secreto para el viaje o una sola entrada',
    'Compartir en WhatsApp',
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
    { q: '¿Dónde se guardan nuestros datos?', a: 'La base de datos y las fotos están en un centro de datos en Zúrich. Las fotos se reducen antes de subirlas.' },
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
