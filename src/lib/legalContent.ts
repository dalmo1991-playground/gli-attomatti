export interface LegalSectionItem {
  label?: string;
  text: string;
}

export interface LegalSectionCard {
  title: string;
  text: string;
}

export interface LegalSectionNoticeBox {
  title?: string;
  paragraphs?: string[];
}

export interface TerminiSection {
  id: string;
  title: string;
  intro?: string;
  text?: string;
  items?: LegalSectionItem[];
  paragraphs?: string[];
  cards?: LegalSectionCard[];
  notice_box?: LegalSectionNoticeBox;
}

export interface CookieRow {
  name: string;
  provider: string;
  duration: string;
  purpose: string;
}

export const IMPRESSUM_CONTENT = {
  meta: {
    title: "Note Legali & Impressum",
    description:
      "Note legali, forma giuridica e informazioni editoriali dell'Associazione teatrale Gli Attomatti.",
  },
  back_link: "Torna alla home",
  badge: "Note Legali",
  title: "Impressum",
  description:
    "Informazioni legali ed editoriali ai sensi della legge federale svizzera contro la concorrenza sleale (art. 3 cpv. 1 lett. s LCSl) e del Codice Civile Svizzero (artt. 60 e segg. CC).",
  last_updated: "Ultimo aggiornamento: Novembre 2026",
  organization: {
    section_title: "Organizzazione & Forma Giuridica",
    name: "Associazione Gli Attomatti",
    legal_form_label: "Forma giuridica",
    legal_form:
      "Associazione senza scopo di lucro ai sensi degli artt. 60 e segg. del Codice Civile Svizzero (ZGB / CCS)",
    purpose_label: "Scopo statutario",
    purpose:
      "Promozione del teatro amatoriale in lingua italiana e della cultura, organizzazione di spettacoli teatrali e attività artistiche senza scopo di lucro.",
    seat_label: "Sede sociale",
    seat: "Kilchberg (Canton Zurigo), Svizzera",
    address_label: "Indirizzo",
    address: "Alte Landstrasse 4, 8802 Kilchberg (ZH), Svizzera",
    represented_by_label: "Rappresentanza legale",
    represented_by:
      "Domenico Scotti Di Carlo (Presidente, con potere di rappresentanza legale individuale)",
    editorial_responsible_label: "Responsabile dei contenuti editoriali",
    editorial_responsible:
      "Domenico Scotti Di Carlo (Presidente) — Alte Landstrasse 4, 8802 Kilchberg (ZH), Svizzera",
    treasurer_label: "Cassa e amministrazione",
    treasurer: "Teresa Bianco (Cassiera, senza potere di rappresentanza esterna)",
    registry_label: "Registro di commercio / IVA",
    registry:
      "Associazione non iscritta al Registro di commercio (iscrizione non obbligatoria ai sensi dell'art. 61 cpv. 2 CC) e non soggetta a imposta sul valore aggiunto (IVA / MWST) in quanto al di sotto della soglia d'obbligo di cifra d'affari (art. 10 LIVA).",
  },
  contacts: {
    section_title: "Contatti telematici",
    email_label: "Email ufficiale",
    email: "compagniateatralegliattomatti@gmail.com",
    website_label: "Sito web",
    website_url: "https://gliattomatti.ch",
  },
  providers_section: {
    section_title: "Fornitori di servizi e infrastruttura digitale",
    intro:
      "Per l'erogazione del sito web, della biglietteria, dei moduli di iscrizione e delle comunicazioni telematiche, l'Associazione si avvale dei seguenti fornitori di servizi esterni (in coerenza con la nostra Informativa sulla Privacy):",
  },
  liability: {
    section_title: "Esclusione di responsabilità",
    contents_title: "Contenuti del sito:",
    contents_text:
      "I contenuti di questo sito web sono stati elaborati con la massima diligenza e accuratezza. Tuttavia, l'Associazione Gli Attomatti non assume alcuna responsabilità per l'esattezza, la completezza, l'attualità e la disponibilità continua delle informazioni pubblicate.",
    links_title: "Collegamenti esterni e servizi terzi incorporati:",
    links_text_1:
      "Il nostro sito web include collegamenti a pagine terze e integra componenti digitali e servizi incorporati di fornitori esterni, tra cui la biglietteria svizzera Eventfrog AG (Neuhardstrasse 38, 4600 Olten) e i formulari interattivi Tally BV (Muinklaan 23, 9000 Gand, Belgio).",
    links_text_2:
      "L'accesso a tali servizi esterni avviene a esclusivo rischio dell'utente. L'Associazione Gli Attomatti non ha alcuna influenza sulla conformazione tecnica, sulla sicurezza dei dati né sui contenuti dei siti o servizi di terzi. Per il trattamento dei dati personali da parte di ciascun fornitore, si rimanda alle rispettive informative elencate sopra e alla nostra <a href='/Privacy' class='text-primary hover:underline'>Informativa sulla Privacy</a>.",
  },
  copyright: {
    section_title: "Diritto d'autore",
    text: "I contenuti, i testi, le immagini, i loghi e i materiali pubblicati su questo sito web sono di proprietà dell'Associazione Gli Attomatti o dei rispettivi autori indicati e sono protetti dalla Legge federale svizzera sul diritto d'autore (LDA). Qualsiasi riproduzione, elaborazione o utilizzo promozionale richiede la previa autorizzazione scritta dell'Associazione.",
  },
} as const;

export const TERMINI_CONTENT: {
  meta: { title: string; description: string };
  back_link: string;
  badge: string;
  title: string;
  description: string;
  last_updated: string;
  sections: TerminiSection[];
} = {
  meta: {
    title: "Termini e Condizioni",
    description:
      "Condizioni generali per l'acquisto dei biglietti, l'iscrizione agli eventi e il regolamento di sala dell'Associazione Gli Attomatti a Zurigo.",
  },
  back_link: "Torna alla home",
  badge: "Regolamento Spettacoli & Eventi",
  title: "Termini e Condizioni",
  description:
    "Condizioni generali per l'acquisto dei biglietti, l'iscrizione a corsi ed eventi teatrali e il regolamento di sala dell'Associazione Gli Attomatti (Kilchberg / Zurigo, Svizzera).",
  last_updated: "Ultimo aggiornamento: Novembre 2026",
  sections: [
    {
      id: "scope",
      title: "1. Ambito di applicazione, venditore e canali di fruizione",
      intro:
        'I presenti Termini e Condizioni disciplinano tutti i rapporti tra l\'acquirente/partecipante e l\'Associazione Gli Attomatti (Alte Landstrasse 4, 8802 Kilchberg ZH, Svizzera, di seguito "Organizzatore" o "Venditore") in merito alla vendita dei biglietti per gli spettacoli, all\'iscrizione a corsi, laboratori, audizioni ed eventi culturali promossi dalla compagnia teatrale.',
      items: [
        {
          label: "Spettacoli a pagamento e casse incorporate:",
          text: "l'acquisto dei titoli di accesso può avvenire sia direttamente sul portale del nostro partner di biglietteria Eventfrog AG (Neuhardstrasse 38, 4600 Olten, Svizzera), sia tramite le casse digitali incorporate (iframe embed) integrate all'interno del nostro sito web (nelle sezioni /Biglietti, /Biglietti/[slug], schede spettacolo o landing page). La controparte contrattuale per la vendita dei biglietti è l'Associazione Gli Attomatti. Eventfrog AG agisce esclusivamente come fornitore tecnico della piattaforma di biglietteria e di emissione dei biglietti con codice QR. I presenti Termini e Condizioni si applicano indistintamente agli acquisti effettuati sul sito o tramite cassa incorporata, unitamente alle condizioni d'uso tecniche della piattaforma Eventfrog per gli acquirenti.",
        },
        {
          label: "Iscrizioni a eventi gratuiti, workshop o audizioni:",
          text: "la prenotazione o registrazione a eventi gratuiti, prove aperte o workshop a numero programmato avviene tramite moduli interattivi (anche incorporati via iframe o finestre modali) gestiti dalla piattaforma tecnica Tally BV (Gand, Belgio) raggiungibili all'hub /Registrazioni, alle sezioni /Registrazioni/[slug] o alle relative landing page.",
        },
      ],
    },
    {
      id: "pricing",
      title: "2. Prezzi, imposte, commissioni e perfezionamento contrattuale",
      paragraphs: [
        "Tutti i prezzi dei biglietti per gli spettacoli teatrali sono espressi in Franchi Svizzeri (CHF). In conformità alla legislazione fiscale svizzera, l'Associazione Gli Attomatti è un'associazione culturale senza scopo di lucro non iscritta al registro IVA in quanto al di sotto della soglia d'obbligo di cifra d'affari (art. 10 LIVA); pertanto, sui biglietti non viene applicata l'imposta svizzera sul valore aggiunto (IVA / MWST). Per gli spettatori residenti nell'Unione Europea o in altri Paesi, il prezzo addebitato è quello finale in franchi svizzeri.",
        "Trasparenza sulle commissioni di servizio: salvo dove diversamente specificato in modo esplicito nella pagina d'acquisto, il prezzo mostrato per ciascuna categoria di biglietto comprende già i costi di servizio e di elaborazione digitale del partner Eventfrog. Eventuali opzioni aggiuntive facoltative selezionate dall'acquirente (come la polizza assicurativa di annullamento o donazioni volontarie alla piattaforma) sono chiaramente separate ed evidenziate prima del pagamento finale.",
        "Il contratto di compravendita del biglietto si intende concluso e vincolante non appena la transazione di pagamento è andata a buon fine sulla cassa Eventfrog e l'acquirente riceve la conferma elettronica con il biglietto recante codice QR univoco via email o nella propria app Eventfrog. Per le registrazioni via modulo (Tally), il perfezionamento coincide con la schermata di conferma e l'eventuale messaggio riepilogativo di ricezione.",
      ],
    },
    {
      id: "refunds",
      title: "3. Diritto di recesso, rimborsi, cedibilità e presenza responsabile",
      intro:
        "In linea con gli usi consolidati nel settore degli spettacoli dal vivo e con le normative vigenti in Svizzera e nell'Unione Europea, i biglietti acquistati per gli spettacoli non sono rimborsabili in caso di ripensamento, mancata partecipazione, errore di prenotazione o impedimento personale dell'acquirente.",
      items: [
        {
          label: "Clienti residenti in Svizzera:",
          text: "ai sensi del diritto contrattuale svizzero (Codice delle Obbligazioni - CO), non è previsto un diritto di recesso o recesso legale per i contratti conclusi online o a distanza.",
        },
        {
          label: "Consumatori residenti nell'Unione Europea:",
          text: "ai sensi dell'art. 16, lett. l) della Direttiva Europea 2011/83/UE e delle relative norme nazionali di recepimento (inclusa la normativa a tutela del consumatore, ad es. art. 59 comma 1 lett. n del Codice del Consumo italiano, D.Lgs. 206/2005), il diritto di recesso entro 14 giorni per gli acquisti online è espressamente escluso per la fornitura di servizi relativi ad attività del tempo libero, spettacoli e manifestazioni culturali qualora il contratto preveda una data, un orario o un periodo di esecuzione determinati.",
        },
        {
          label: "Cedibilità del biglietto a terzi:",
          text: "i biglietti non sono strettamente nominali salvo dove diversamente indicato per specifici eventi d'eccezione. È consentito cedere liberamente il proprio biglietto a familiari, amici o conoscenti senza necessità di alcuna comunicazione preventiva all'Organizzatore. La persona che si presenta all'ingresso con il codice QR valido originale e non ancora obliterato avrà pieno diritto di accesso.",
        },
      ],
      cards: [
        {
          title: "Assicurazione di annullamento facoltativa Eventfrog",
          text: "Durante il processo d'acquisto sulla cassa Eventfrog, l'acquirente può stipulare facoltativamente un'assicurazione di annullamento con la compagnia partner di Eventfrog. In caso di malattia, infortunio o altri motivi coperti dalla polizza, il rimborso del biglietto (inclusa la gestione del sinistro) è disciplinato dalle condizioni contrattuali dell'assicurazione e va richiesto direttamente a Eventfrog.",
        },
        {
          title: "Politica No-Show per eventi gratuiti su registrazione (Tally)",
          text: "Per i workshop, corsi o eventi ad accesso gratuito con capienza limitata, la registrazione impegna eticamente a presenziare. Qualora sopravvenga un impedimento, chiediamo di inviare tempestiva disdetta via email a compagniateatralegliattomatti@gmail.com, permettendo così alla lista d'attesa di subentrare.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "4. Annullamento, interruzione o rinvio dell'evento",
      paragraphs: [
        "Annullamento definitivo dell'evento: qualora uno spettacolo debba essere annullato definitivamente per cause di forza maggiore, malattia degli interpreti, disposizioni di pubblica autorità o motivi organizzativi insormontabili, l'Organizzatore rimborserà all'acquirente il 100% del prezzo nominale del biglietto pagato. Il rimborso viene disposto entro un termine massimo di 30 giorni dalla data di comunicazione dell'annullamento, tramite lo stesso metodo di pagamento utilizzato in fase d'acquisto attraverso la piattaforma Eventfrog. Le commissioni per servizi opzionali esterni scelti volontariamente dall'utente (quali costi assicurativi di terzi) sono disciplinate dalle condizioni dei rispettivi fornitori.",
        "Rinvio o spostamento a nuova data: in caso di spostamento dello spettacolo a una data o sede alternativa, il biglietto acquistato rimane pienamente valido per la nuova recita. Se l'acquirente non può partecipare nella nuova data stabilita, ha diritto a richiedere il rimborso integrale del biglietto entro e non oltre 14 giorni dalla comunicazione ufficiale della nuova data (o entro il termine indicato nell'avviso inviato da Eventfrog/Organizzatore), inviando richiesta all'indirizzo compagniateatralegliattomatti@gmail.com o tramite i canali d'assistenza di Eventfrog.",
        "Interruzione a spettacolo già iniziato: qualora la rappresentazione debba essere interrotta dopo l'inizio del secondo tempo o dopo aver superato la metà della durata prevista per cause non imputabili all'Organizzatore (es. allarme antincendio, evacuazione della struttura, interruzione elettrica municipale), non è dovuto alcun rimborso monetario automatico; compatibilmente con il calendario della stagione, l'Organizzatore si impegna tuttavia a offrire agli spettatori interessati un voucher o un cambio data per una replica successiva. Restano in ogni caso salvi eventuali diritti inderogabili riconosciuti al consumatore dalla legge applicabile.",
      ],
    },
    {
      id: "hall_access",
      title: "5. Accesso in sala, orari, puntualità e ritardatari",
      paragraphs: [
        "Gli orari precisi di apertura porte, biglietteria/cassa di sala e inizio spettacolo sono riportati sulla scheda evento del sito web e sul biglietto elettronico emesso. Si raccomanda di presentarsi all'ingresso con almeno 15-20 minuti di anticipo rispetto all'orario indicato di inizio rappresentazione.",
        "Gestione del pubblico ritardatario: a tutela del pubblico già accomodato e della concentrazione degli interpreti in scena, una volta iniziato lo spettacolo l'accesso alla sala è sospeso. Agli spettatori in ritardo l'ingresso potrà essere consentito solo ed esclusivamente durante il primo intervallo utile (qualora previsto dalla recita) e a insindacabile discrezione del personale di sala, eventualmente in posti diversi e laterali per non recare disturbo. In nessun caso il ritardo dell'acquirente dà diritto al rimborso del biglietto.",
      ],
    },
    {
      id: "rules",
      title: "6. Norme di comportamento in sala, dispositivi e registrazioni",
      paragraphs: [
        "Dispositivi elettronici: all'ingresso in sala e per l'intera durata dello spettacolo, telefoni cellulari, smartwatch e altri apparati elettronici devono essere rigorosamente silenziati o impostati in modalità 'non disturbare' con luminosità dello schermo azzerata.",
        "Registrazioni audio/video e fotografie: è tassativamente vietato effettuare registrazioni audio o video integrali dello spettacolo teatrale, in conformità con la normativa a tutela del diritto d'autore e dei diritti connessi. È altresì severamente vietato l'utilizzo del flash fotografico in qualsiasi momento. È consentito scattare brevi foto ricordo senza flash o brevi clip video amatoriali (massimo 15-30 secondi) esclusivamente durante gli applausi finali o se espressamente autorizzato prima dell'inizio dello spettacolo.",
        "Comportamento in sala e facoltà di allontanamento: all'interno del teatro è vietato consumare cibi o bevande non autorizzati, fumare o disturbare gli attori e gli spettatori con conversazioni. L'Organizzatore e il personale di sala si riservano il diritto di allontanare immediatamente e senza alcun rimborso chiunque assuma un comportamento molesto, aggressivo, pericoloso o in violazione delle presenti regole.",
      ],
    },
    {
      id: "photo_policy",
      title: "7. Foto, riprese della compagnia e diritto all'immagine",
      intro:
        "In occasione delle rappresentazioni, dei corsi, delle prove aperte e delle iniziative culturali promosse dall'Associazione Gli Attomatti, possono essere effettuate riprese fotografiche e videoriprese a scopo di documentazione culturale, rassegna stampa, archivio storico e divulgazione sui canali ufficiali della compagnia (sito web, social network Instagram e Facebook, locandine e brochure). Il trattamento delle immagini si fonda sul nostro legittimo interesse documentale e promozionale dell'attività culturale, come dettagliato nella nostra <a href='/Privacy' class='text-primary hover:underline'>Informativa sulla Privacy</a>.",
      items: [
        {
          label: "Inquadratura generale della sala:",
          text: "le riprese fotografiche del pubblico sono prevalentemente panoramiche o d'insieme per documentare la partecipazione alla serata teatrale, senza intento di ritrarre singole persone in primo piano salvo autorizzazione.",
        },
        {
          label: "Opposizione preventiva prima dell'evento:",
          text: "se desideri esprimere la tua opposizione a comparire nelle riprese prima ancora di giungere in sala, puoi comunicarcelo liberamente inviando un'email a compagniateatralegliattomatti@gmail.com indicando la data dell'evento e il tuo nominativo. In alternativa, puoi comunicarlo all'ingresso al nostro personale: ti verrà indicato un settore di sedute o applicata la dovuta accortezza affinché tu non venga ripreso/a.",
        },
        {
          label: "Diritto di rimozione successiva:",
          text: "se a seguito della pubblicazione dovessi riconoscere il tuo volto in un'immagine o video sui nostri canali e desiderassi la rimozione o l'oscuramento, puoi richiederlo in qualunque momento scrivendo a compagniateatralegliattomatti@gmail.com. Provvederemo alla rimozione tempestiva della risorsa.",
        },
      ],
    },
    {
      id: "accessibility",
      title:
        "8. Accessibilità, posti per persone a mobilità ridotta e requisiti di età",
      paragraphs: [
        "Accessibilità e posti riservati: l'Associazione Gli Attomatti favorisce la piena partecipazione di tutte le persone alle iniziative teatrali. La maggior parte delle sale utilizzate a Zurigo e dintorni è accessibile alle persone con sedia a rotelle o a ridotta mobilità. Invitiamo gli spettatori con particolari esigenze motorie o di accompagnamento a contattarci via email (compagniateatralegliattomatti@gmail.com) con congruo anticipo prima della data dello spettacolo, in modo da riservare la postazione idonea e agevolare l'accoglienza all'ingresso.",
        "Età consigliata e minori: Età minima consigliata: come indicato nella rispettiva scheda evento (in assenza di indicazioni specifiche, gli spettacoli ordinari sono consigliati a partire dai 10 anni). I minori di 14 anni devono essere obbligatoriamente accompagnati da un adulto responsabile per tutta la durata della rappresentazione.",
      ],
    },
    {
      id: "safety",
      title: "9. Sicurezza della sala, uscite di emergenza e condizioni ambientali",
      paragraphs: [
        "Tutti gli spettatori sono tenuti a rispettare scrupolosamente le norme di sicurezza e prevenzione incendi delle strutture teatrali ospitanti, i cartelli informativi e le indicazioni impartite dal personale di accoglienza e sicurezza.",
        "I corridoi di transito, i passaggi e le uscite di sicurezza devono rimanere sempre liberi da qualsiasi ingombro (inclusi zaini, cappotti voluminosi o passeggini, da depositare all'eventuale guardaroba). In caso di allarme o di evacuazione di emergenza, il pubblico deve mantenere la calma e seguire ordinatamente le vie di fuga segnalate senza attardarsi a recuperare oggetti personali.",
      ],
    },
    {
      id: "third_party",
      title: "10. Servizi digitali di terze parti e limitazione di responsabilità",
      paragraphs: [
        "L'Organizzatore declina ogni responsabilità per temporanei malfunzionamenti tecnici, interruzioni della connessione internet o guasti indipendenti dei server riconducibili alle infrastrutture dei fornitori terzi indipendenti impiegati (Eventfrog AG per la biglietteria, Tally BV per i moduli di registrazione, Google / YouTube per i flussi video, Meta / Instagram per i post social, Vercel per l'hosting).",
        "Limitazione di responsabilità: la responsabilità contrattuale ed extracontrattuale dell'Associazione Gli Attomatti per eventuali danni materiali o patrimoniali diretti è limitata, nei limiti consentiti dalla legge applicabile (incluso l'art. 100 del Codice delle Obbligazioni svizzero), all'importo effettivamente corrisposto dall'utente per il biglietto o servizio in questione. Resta espressamente esclusa, nei limiti di legge, qualsiasi responsabilità per danni indiretti, perdita di guadagno o per lieve colpa (leichte Fahrlässigkeit). La responsabilità non è limitata o esclusa in caso di dolo (Vorsatz), colpa grave (grobe Fahrlässigkeit) o per danni alla vita, al corpo o alla salute della persona. Restano in ogni caso impregiudicati i diritti inderogabili del consumatore.",
      ],
    },
    {
      id: "complaints",
      title: "11. Gestione dei reclami, contatti e assistenza clienti",
      paragraphs: [
        "Per qualsiasi richiesta di chiarimento, segnalazione di problemi relativi all'accesso in sala, disservizi o reclami formali, l'utente può contattare l'Organizzatore scrivendo all'indirizzo email ufficiale: compagniateatralegliattomatti@gmail.com.",
        "L'Associazione Gli Attomatti si impegna a riscontrare tempestivamente ogni comunicazione pervenuta, di regola entro 5 giorni lavorativi, ricercando primariamente una composizione amichevole ed equa di qualsiasi disaccordo.",
      ],
    },
    {
      id: "jurisdiction",
      title: "12. Diritto applicabile e foro competente",
      paragraphs: [
        "Diritto applicabile: il rapporto contrattuale è disciplinato dal diritto materiale svizzero (Codice delle Obbligazioni - CO), con espressa esclusione della Convenzione delle Nazioni Unite sui contratti di compravendita internazionale di merci (CISG). Per gli acquirenti che rivestono la qualifica di consumatori residenti nell'Unione Europea, la scelta della legge svizzera non pregiudica l'applicazione delle disposizioni inderogabili a tutela del consumatore previste dalla legge dello Stato membro di residenza abituale (ai sensi dell'art. 6 par. 2 del Regolamento CE n. 593/2008 'Roma I').",
        "Foro competente: per qualsiasi controversia derivante da o collegata ai presenti Termini e Condizioni o ai servizi forniti dall'Organizzatore, il foro competente ordinario esclusivo è quello della sede dell'Associazione (Zurigo / distretto di Horgen, Svizzera). Qualora l'utente rivesta la qualifica di consumatore ai sensi della Convenzione di Lugano (Convenzione concernente la competenza giurisdizionale, il riconoscimento e l'esecuzione delle decisioni in materia civile e commerciale) o dell'art. 18 del Regolamento UE n. 1215/2012 (Bruxelles I-bis), resta salva la facoltà del consumatore di adire i tribunali del proprio domicilio di residenza, nonché l'obbligo dell'Organizzatore di promuovere eventuali azioni contro il consumatore esclusivamente dinanzi ai tribunali del domicilio di quest'ultimo.",
      ],
    },
  ],
};

export const PRIVACY_CONTENT = {
  meta: {
    title: "Informativa sulla Privacy",
    description:
      "Informativa sul trattamento dei dati personali conforme alla nuova Legge federale svizzera sulla protezione dei dati (nLPD) e al Regolamento UE 2016/679 (GDPR).",
  },
  back_link: "Torna alla home",
  badge: "nLPD & GDPR",
  title: "Informativa sulla Privacy",
  description:
    "Trattamento dei dati personali conforme alla nuova Legge federale svizzera sulla protezione dei dati (nLPD), al Regolamento Generale sulla Protezione dei Dati dell'Unione Europea (GDPR, Reg. UE 2016/679) e al principio di trasparenza preventiva e opt-in.",
  last_updated: "Ultimo aggiornamento: Novembre 2026",
  data_controller: {
    title: "Titolare del trattamento",
    name: "Associazione Gli Attomatti",
    address: "Alte Landstrasse 4, 8802 Kilchberg (ZH), Svizzera",
    email_label: "Contatto email ufficiale:",
    email: "compagniateatralegliattomatti@gmail.com",
  },
  general_processing: {
    title: "Basi giuridiche e principi del trattamento",
    text: "Trattiamo i dati personali esclusivamente nella misura necessaria a rendere accessibile un sito web sicuro e a erogare le nostre attività culturali, la prevendita dei biglietti teatrali, l'iscrizione a corsi ed eventi e l'invio di newsletter informative. Ai sensi dell'art. 6 del GDPR e degli artt. 6 e 31 della nLPD svizzera, le basi giuridiche applicate comprendono: (a) l'esecuzione del contratto o di misure precontrattuali per l'acquisto di biglietti o l'iscrizione ad attività teatrali; (b) l'adempimento di obblighi legali e contabili; (c) il consenso esplicito e preventivo (opt-in) per cookie analitici e di marketing e per l'iscrizione alla newsletter promozionale; (d) il legittimo interesse prevalente dell'Organizzatore alla sicurezza informatica e alla prevenzione delle frodi (art. 31 cpv. 1 nLPD, art. 6 cpv. 1 lett. f GDPR). In virtù della decisione di adeguatezza della Commissione Europea (art. 45 GDPR) e del riconoscimento reciproco svizzero, il livello di protezione dei dati tra Svizzera e Spazio Economico Europeo è equiparabile e consente la libera e sicura circolazione dei dati.",
  },
  retention: {
    title: "Periodi di conservazione dei dati",
    paragraphs: [
      "I dati personali vengono conservati per il tempo strettamente necessario a conseguire le finalità per cui sono stati raccolti, in ottemperanza al principio di proporzionalità (art. 6 cpv. 2 nLPD e art. 5 cpv. 1 lett. e GDPR):",
      "• Dati di acquisto biglietti e contabilità: i dati anagrafici e contabili collegati alle transazioni di acquisto vengono conservati per 10 anni in conformità agli obblighi di conservazione dei libri contabili previsti dal diritto commerciale e fiscale svizzero (art. 958f del Codice delle Obbligazioni svizzero - CO). Per i dati di profilo eventualmente salvati su un account personale Eventfrog si applica l'informativa di Eventfrog AG.",
      "• Dati di registrazione a eventi gratuiti o workshop (Tally): conservati per la durata dell'organizzazione dell'evento e cancellati entro 6 mesi dalla conclusione dello stesso, salvo consenso dell'interessato all'iscrizione alla newsletter continuativa.",
      "• Dati di check-in in Area Riservata (Vercel Blob): le liste partecipanti sincronizzate temporaneamente per il controllo accessi in sala vengono eliminate entro 30 giorni dalla conclusione del rispettivo evento.",
      "• Dati newsletter e comunicazioni teatrali: conservati fino alla revoca del consenso o alla richiesta di disiscrizione da parte dell'utente, a seguito della quale vengono cancellati tempestivamente dalla lista attiva.",
      "• File di log del server (Vercel) e dati di sicurezza (reCAPTCHA): i file di log tecnici contenenti gli indirizzi IP vengono conservati per un massimo di 30 giorni a fini di diagnostica e sicurezza di rete e successivamente aggregati o sovrascritti.",
    ],
    ga_retention:
      "• Dati statistici (Google Analytics 4): conservati per un massimo di 14 mesi secondo le impostazioni GA4, salva precedente cancellazione dei cookie dal browser.",
    meta_retention:
      "• Dati di marketing (Meta Pixel): conservati per un massimo di 90 giorni per i cookie Meta Pixel, salva precedente cancellazione dei cookie dal browser.",
  },
  data_processors: {
    title: "Responsabili del trattamento (Data Processors) e accordi DPA",
    paragraphs: [
      "Nello svolgimento delle attività telematiche, l'Associazione Gli Attomatti si avvale di fornitori terzi specializzati che trattano i dati personali per nostro conto in qualità di Responsabili del trattamento (ai sensi dell'art. 9 nLPD e dell'art. 28 GDPR). Con ciascuno di essi è stato stipulato o è attivo il relativo Data Processing Agreement (DPA) vincolante:",
      "• Hosting, CDN e archiviazione Vercel Blob: Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) — server e nodi di edge hosting situati nell'Unione Europea (Francoforte, Germania) con infrastruttura globale di sicurezza. Trasferimento verso gli USA regolato dal Swiss-U.S. Data Privacy Framework (DPF) e dalle Clausole Contrattuali Standard (SCC).",
      "• Moduli telematici di registrazione: Tally BV (Muinklaan 23, 9000 Gand, Belgio) — server dedicati ospitati all'interno dell'Unione Europea (Belgio e Germania).",
      "• Distribuzione email e notifiche: Resend Inc. (2261 Market Street #5039, San Francisco, CA 94114, USA) — elaborazione telematica delle email transazionali; trasferimento verso gli USA disciplinato da accordo DPA conforme e dalle Clausole Contrattuali Standard approvate (SCC / Swiss Addendum).",
      "• Casella postale ufficiale: Google Workspace / Gmail (Google Cloud EMEA Limited, 70 Sir John Rogerson's Quay, Dublino 2, Irlanda) — gestione sicura delle comunicazioni via posta elettronica.",
    ],
  },
  server_logs: {
    title: "Hosting Vercel e file di log del server",
    text: "Il nostro sito è ospitato sull'infrastruttura di Vercel Inc. I server di Vercel (con data center primario europeo per i visitatori della Svizzera e dello SEE) raccolgono automaticamente dati tecnici trasmessi dal browser nei file di log: indirizzo IP, tipo e versione del browser, sistema operativo, referrer URL e timestamp della richiesta. Questi dati sono indispensabili per garantire la sicurezza del server, la difesa da attacchi DDoS e la corretta distribuzione dei contenuti (CDN). Non vengono incrociati con altre sorgenti né impiegati per profilare i visitatori.",
  },
  vercel_blob: {
    title: "Area Riservata, Check-in e Archiviazione Vercel Blob",
    paragraphs: [
      "Per supportare l'organizzazione operativa degli eventi, l'Associazione utilizza il servizio di archiviazione protetta Vercel Blob (Vercel Inc.) esclusivamente per: (a) la sincronizzazione temporanea delle liste partecipanti Tally necessarie al check-in in sala; (b) la gestione delle code tecniche di invio email (DLQ) e dei contatori anti-abuso.",
      "Accesso e sicurezza: l'archivio è protetto e accessibile unicamente tramite l'Area Riservata autenticata ai soli referenti autorizzati della compagnia.",
      "Periodo di conservazione: i dati dei partecipanti sincronizzati su Vercel Blob per il check-in vengono conservati per il tempo strettamente necessario alla gestione della serata e cancellati entro 30 giorni dalla conclusione dell'evento.",
    ],
  },
  cookie_opt_in: {
    title: "Cookie, sessioni e servizi incorporati (Politica Opt-in)",
    intro_1:
      "Questo sito web adotta una rigorosa politica di consenso preventivo (Opt-in): nessun cookie o tracker analitico o di marketing viene memorizzato o attivato prima che tu abbia espresso una scelta esplicita e positiva tramite il banner delle preferenze.",
    intro_2:
      "I componenti tecnici strettamente necessari (come il cookie per memorizzare il tuo consenso, i token di sicurezza dei form o il token anti-bot) non richiedono consenso preventivo ai sensi della nLPD e del GDPR, ma sono elencati di seguito per assoluta trasparenza:",
    table_heading: "Tabella dei cookie e componenti attivi:",
    columns: {
      name: "Nome / Origine",
      provider: "Fornitore",
      duration: "Durata",
      purpose: "Classificazione e Finalità",
    },
    rows: {
      own_consent: {
        name: "attomatti_cookie_consent",
        provider: "Sito proprio (Locale)",
        duration: "1 anno",
        purpose:
          "Tecnico essenziale: memorizza le scelte di consenso privacy espresse nel banner.",
      },
      newsletter_popup: {
        name: "attomatti_newsletter_popup",
        provider: "Sito proprio (Locale)",
        duration: "7 giorni (chiusura) / Permanente (iscrizione)",
        purpose:
          "Tecnico funzionale: memorizza lo stato di chiusura del popup per evitare ripetizioni inopportune.",
      },
      eventfrog: {
        name: "eventfrog.ch (iframe)",
        provider: "Eventfrog AG (Svizzera)",
        duration: "Sessione di acquisto",
        purpose:
          "Tecnico essenziale di cassa: gestione del carrello, sicurezza della transazione e rilascio del biglietto.",
      },
      tally: {
        name: "tally.so (iframe)",
        provider: "Tally BV (Belgio / UE)",
        duration: "Sessione modulo",
        purpose:
          "Tecnico essenziale di modulo: token anti-CSRF e stato di compilazione del form. (Nota: l'iscrizione alla newsletter avviene solo con esplicito consenso dell'utente).",
      },
      recaptcha: {
        name: "_GRECAPTCHA, rc::a, rc::c",
        provider: "Google LLC (USA)",
        duration: "Sessione / 6 mesi",
        purpose:
          "Tecnico di sicurezza essenziale: protezione anti-bot e anti-spam dei moduli di contatto via email.",
      },
      google_analytics: {
        name: "_ga, _ga_*",
        provider: "Google LLC (USA)",
        duration: "2 anni",
        purpose:
          "Analitico (previo consenso): misurazione anonima e aggregata delle visite e delle pagine lette.",
      },
      meta_pixel: {
        name: "_fbp",
        provider: "Meta Platforms Ireland Ltd.",
        duration: "90 giorni",
        purpose:
          "Marketing (previo consenso): misurazione dell'efficacia delle inserzioni per spettacoli teatrali su Instagram e Facebook.",
      },
      youtube: {
        name: "youtube-nocookie.com (iframe)",
        provider: "Google Ireland Limited / YouTube (USA/UE)",
        duration: "All'avvio del video / Sessione",
        purpose:
          "Funzionale multimediale a richiesta: streaming del trailer solo a seguito del clic volontario su 'Play' (nessun cookie di tracciamento preventivo).",
      },
    } satisfies Record<string, CookieRow>,
  },
  youtube: {
    title: "Video e Trailer Teatrali a Richiesta (YouTube)",
    paragraphs: [
      "Nelle schede degli spettacoli e nelle gallerie multimediali possono essere presenti trailer informativi ospitati su YouTube (Google Ireland Limited, Dublino, Irlanda).",
      "I video sono classificati come contenuti funzionali multimediali a richiesta e sono integrati con la modalità di privacy avanzata (dominio youtube-nocookie.com). In questo modo, nessun cookie o tracciamento viene attivato prima che l'utente clicchi attivamente sul tasto di riproduzione.",
      "Solo con l'avvio della riproduzione da parte dell'utente viene stabilita la connessione con i server di Google per lo streaming video, comportando la trasmissione tecnica dell'indirizzo IP. Per maggiori dettagli consultare: policies.google.com/privacy.",
    ],
    privacy_url: "https://policies.google.com/privacy",
  },
  google_analytics: {
    title: "Google Analytics 4 e Consent Mode v2 (Google LLC)",
    paragraphs: [
      "Sul sito è configurato lo strumento di misurazione statistica Google Analytics 4 di Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA).",
      "Verifica del blocco preventivo: il caricamento dello script di Google Analytics e la raccolta dei dati avvengono nel pieno rispetto della Google Consent Mode v2. Lo script e i relativi tag rimangono rigorosamente bloccati finché l'utente non seleziona e approva la categoria 'Statistici/Analitici' nel banner dei cookie.",
      "Gli indirizzi IP dei visitatori vengono anonimizzati (IP masking). L'eventuale trasferimento dei dati aggregati verso server situati negli Stati Uniti avviene in base alla certificazione di Google ai sensi dello Swiss-U.S. Data Privacy Framework e del EU-U.S. Data Privacy Framework. Il consenso può essere revocato in ogni momento dal gestore delle preferenze.",
    ],
  },
  meta_pixel: {
    title:
      "Meta Pixel e Accordo di Contitolarità (Meta Platforms Ireland Limited)",
    paragraphs: [
      "Previo tuo esplicito consenso marketing, utilizziamo il Meta Pixel di Meta Platforms Ireland Limited (Merrion Road, Dublino 4, D04 X2K5, Irlanda) per valutare l'efficacia delle campagne promozionali teatrali su Instagram e Facebook.",
      "Contitolarità del trattamento (Joint Controllership): ai sensi della sentenza della Corte di Giustizia dell'UE (C-40/17, Fashion ID) e dell'art. 26 GDPR, l'Associazione Gli Attomatti e Meta Platforms Ireland Ltd. agiscono quali contitolari del trattamento limitatamente alla fase di raccolta e trasmissione a Meta dei dati degli eventi tramite il Pixel. Il successivo trattamento autonomo, l'abbinamento agli account e la targettizzazione pubblicitaria ricadono sotto la titolarità esclusiva di Meta.",
      "L'accordo di contitolarità (Controller Addendum di Meta) stabilisce che Meta è responsabile principale per la gestione dei diritti degli interessati relativi al trattamento successivo. Per informazioni dettagliate o per opporsi al trattamento pubblicitario gestito da Meta: privacycenter.instagram.com/policy e facebook.com/about/privacy.",
    ],
    privacy_url: "https://privacycenter.instagram.com/policy",
  },
  eventfrog: {
    title: "Biglietteria Online e Casse Incorporate (Eventfrog AG)",
    paragraphs: [
      "Per la vendita e l'emissione dei biglietti teatrali ci avvaliamo della piattaforma svizzera Eventfrog AG (Neuhardstrasse 38, 4600 Olten, Svizzera).",
      "I widget di cassa possono essere raggiunti tramite link o incorporati via iframe nelle nostre pagine. Quando acquisti un biglietto, la transazione e l'elaborazione dei dati di pagamento avvengono tramite connessione cifrata diretta con i server di Eventfrog AG, la quale opera quale titolare indipendente del trattamento per la piattaforma di pagamento nel pieno rispetto della nLPD svizzera.",
      "L'Associazione Gli Attomatti riceve unicamente i dati necessari per la gestione degli accessi in sala (nominativo dell'acquirente, tipologia di biglietto, codice QR) e non memorizza né ha accesso alle coordinate bancarie o di carta di credito. I dati risiedono su data center svizzeri; la conservazione dei dati di profilo Eventfrog è disciplinata dall'informativa di Eventfrog: eventfrog.ch/datenschutz.",
    ],
    privacy_url: "https://eventfrog.ch/datenschutz",
  },
  tally: {
    title: "Moduli di Registrazione Eventi e Iscrizione Newsletter (Tally BV)",
    paragraphs: [
      "Per le registrazioni a workshop, corsi ed eventi gratuiti utilizziamo i moduli di Tally BV (Gand, Belgio).",
      "Distinzione delle finalità e minori: la compilazione del form per la partecipazione a un evento ha finalità puramente organizzative e contrattuali (gestione degli accessi e lista d'attesa). L'eventuale iscrizione alla Newsletter promozionale della compagnia richiede una casella di spunta separata e facoltativa (Opt-in esplicito) all'interno del modulo. Per i minori di 16 anni che si iscrivono a corsi o workshop, la registrazione richiede il consenso di un genitore o tutore.",
      "I dati sono archiviati su server cloud situati all'interno dell'Unione Europea (Belgio/Germania) e, per il solo check-in in sala, possono essere sincronizzati temporaneamente su Vercel Blob come descritto nella sezione dedicata. La lista iscritti è consultata unicamente dai referenti autorizzati dell'Associazione. Non esiste profilazione commerciale di terzi e ci si può cancellare in qualsiasi momento inviando un'email a compagniateatralegliattomatti@gmail.com.",
      "Per maggiori informazioni: tally.so/help/privacy-policy.",
    ],
    privacy_url: "https://tally.so/help/privacy-policy",
  },
  resend: {
    title: "Distribuzione Email, Newsletter e Notifiche (Resend / Google Workspace)",
    paragraphs: [
      "Per il recapito delle comunicazioni informative (newsletter periodiche con annunci di spettacoli, articoli del blog e novità della compagnia) nonché per le conferme d'iscrizione e le notifiche relative agli eventi a cui l'utente si è volontariamente registrato, l'Associazione Gli Attomatti si avvale dell'infrastruttura di posta elettronica fornita da Resend Inc. (San Francisco, USA) e dei servizi Google Workspace / Gmail.",
      "I dati strettamente necessari per il recapito (indirizzo email del destinatario ed eventuale nome) vengono trasmessi tramite canale cifrato (TLS/HTTPS). I fornitori agiscono in qualità di responsabili del trattamento (Data Processor) ed elaborano i dati unicamente per l'invio della specifica comunicazione richiesta o acconsentita, senza impiegare gli indirizzi per finalità proprie o cessione a terzi.",
      "Il trasferimento telematico verso gli USA è presidiato dalle Clausole Contrattuali Standard (SCC) della Commissione Europea integrate con l'addendum svizzero (Swiss Addendum) e dal Data Privacy Framework.",
      "Per non ricevere più le comunicazioni informative della compagnia, è sufficiente rispondere al messaggio o inviare un'email a compagniateatralegliattomatti@gmail.com indicando la volontà di disiscriversi, e il contatto verrà tempestivamente rimosso dalla lista attiva.",
      "Per maggiori dettagli sulla politica di conformità di Resend: resend.com/legal/privacy-policy.",
    ],
    privacy_url: "https://resend.com/legal/privacy-policy",
  },
  recaptcha: {
    title: "Sicurezza Tecnica e Protezione Anti-Bot (Google reCAPTCHA v3)",
    paragraphs: [
      "Per proteggere i formulari di contatto via email contro abusi, spam automatizzato e attacchi brute-force, il nostro sito impiega il servizio di sicurezza Google reCAPTCHA v3 fornito da Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA).",
      "reCAPTCHA analizza parametri tecnici del visitatore (es. movimenti del cursore, tempi di compilazione e indirizzo IP) al fine esclusivo di verificare se l'invio è operato da una persona reale o da uno script bot dannoso. Tale trattamento tecnico è fondato sul nostro legittimo interesse prevalente (art. 6 cpv. 1 lett. f GDPR e art. 31 cpv. 1 nLPD) a garantire la stabilità e la sicurezza informatica del sito web e a prevenire l'inoltro di email fraudolente.",
      "Google aderisce allo Swiss-U.S. Data Privacy Framework e all'EU-U.S. Data Privacy Framework. L'uso di reCAPTCHA è soggetto alle Norme sulla privacy e ai Termini di servizio di Google: policies.google.com/privacy e policies.google.com/terms.",
    ],
    privacy_url: "https://policies.google.com/privacy",
  },
  typography_social: {
    title: "Font Tipografici Self-Hosted e Social Instagram",
    fonts_title: "Caratteri tipografici (Font self-hosted / next/font)",
    fonts_text:
      "A tutela della riservatezza dei visitatori, tutti i caratteri tipografici utilizzati su questo sito web (Geist e Newsreader) sono ospitati localmente sul nostro server (self-hosted tramite la tecnologia nativa next/font). Non viene effettuata alcuna richiesta esterna ai server di Google Fonts durante la navigazione, garantendo che il tuo indirizzo IP non venga mai trasmesso a terzi per il caricamento dei font.",
    social_title: "Contenuti social Instagram (Soluzione protetta 2-Click)",
    social_text:
      "I post o reel di Instagram incorporati nella home page sono protetti da un meccanismo a due clic (2-Click): all'apertura del sito nessun dato viene trasmesso a Meta. Solo cliccando attivamente su 'Carica questo post' viene autorizzata la connessione con i server di Instagram.",
  },
  photo_rights: {
    title: "Fotografie e riprese durante gli eventi (Diritto all'immagine)",
    paragraphs: [
      "Durante gli spettacoli e gli eventi organizzati dalla compagnia teatrale possono essere effettuate riprese fotografiche o audiovisive d'insieme per documentazione culturale e rassegna stampa.",
      "Il trattamento delle immagini si basa sul nostro legittimo interesse documentale e di promozione culturale (art. 31 cpv. 1 nLPD; art. 6 par. 1 lett. f GDPR). Hai diritto di opposizione secondo quanto indicato nei <a href='/Termini' class='text-primary hover:underline'>Termini e Condizioni</a>, art. 7: puoi opporti preventivamente prima dell'evento (scrivendo a compagniateatralegliattomatti@gmail.com o comunicandolo all'ingresso al personale di sala) oppure richiedere in qualsiasi momento la rimozione o l'oscuramento delle foto pubblicate sui nostri canali ufficiali.",
    ],
  },
  your_rights: {
    title: "I tuoi diritti (nLPD & GDPR), termini di risposta e reclami",
    paragraphs: [
      "Ai sensi della Legge federale svizzera sulla protezione dei dati (nLPD, artt. 25-29) e del Regolamento UE 2016/679 (GDPR, artt. 15-22), hai il diritto in ogni momento di: (1) ottenere la conferma che sia o meno in corso un trattamento di tuoi dati e richiederne l'accesso; (2) ottenere la rettifica di dati inesatti; (3) ottenere la cancellazione dei dati (diritto all'oblio); (4) richiedere la limitazione del trattamento; (5) richiedere la portabilità dei dati personali in formato elettronico strutturato e leggibile da dispositivo automatico (art. 28 nLPD, art. 20 GDPR); (6) opporti in qualsiasi momento per motivi legittimi al trattamento, nonché opporti espressamente e incondizionatamente al marketing diretto o alla ricezione di newsletter (art. 21 par. 2 GDPR).",
      "Modalità, gratuità e verifica dell'identità: l'esercizio dei tuoi diritti è interamente gratuito. Per prevenire accessi abusivi da parte di terzi e a tutela della tua riservatezza, l'Organizzatore potrà richiedere la prova della tua identità prima di dare seguito alla richiesta.",
      "Termine di risposta: in conformità alla legge, le richieste di accesso o esercizio dei diritti riceveranno riscontro entro e non oltre 30 giorni lavorativi (art. 25 cpv. 7 nLPD; art. 12 par. 3 GDPR).",
      "Autorità di vigilanza: qualora ritenessi che il trattamento violi le disposizioni vigenti, hai il diritto di proporre reclamo o segnalazione: in Svizzera all'Incaricato federale della protezione dei dati e della trasparenza (IFPDT - Feldeggweg 1, 3003 Berna, www.edoeb.admin.ch); nell'Unione Europea all'Autorità di controllo dello Stato membro in cui risiedi (in Italia: Garante per la Protezione dei Dati Personali - Piazza Venezia 11, 00187 Roma, www.garanteprivacy.it).",
      "Per qualsiasi richiesta o per esercitare i tuoi diritti: compagniateatralegliattomatti@gmail.com.",
    ],
  },
} as const;
