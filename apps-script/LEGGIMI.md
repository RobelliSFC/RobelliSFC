# Collegare l'app al foglio Google

1. Nel foglio **Impostazioni**, scheda `Impostazioni`, riga 1 intestazioni, dalla riga 2 una nave per riga:
   `Costruzione | Distanza marche prua-poppa (m) | Largh. prua | Largh. centro | Largh. poppa SKEG | Largh. poppa TIMONE`
   (es. `6302 | 200 | 20 | 30 | 30 | 12`). L'app usa la larghezza SKEG o TIMONE in base al menu «Marca letta su». Il menu dell'app legge la colonna A.
2. Nel foglio **Letture** non serve preparare nulla: la scheda `Letture` e le intestazioni vengono create al primo salvataggio.
3. Apri uno dei due fogli > **Estensioni > Apps Script**, incolla il contenuto di `Code.gs`, sostituisci i due ID.
4. **Distribuisci > Nuova distribuzione > Tipo: App web**; *Esegui come*: **Me**; *Chi ha accesso*: **Chiunque**. Autorizza e copia l'URL che finisce con `/exec`.
5. In `index.html` incolla l'URL in `const SHEET_URL=''`.

Nota: chiunque conosca l'URL può leggere l'elenco navi e aggiungere righe. Per dati non sensibili va bene; verifica la policy aziendale.

## Se «Estensioni > Apps Script» dà «Impossibile aprire il file»
1. Di solito è colpa di più account Google aperti nello stesso browser. Apri una **finestra in incognito**, accedi **solo** con l'account del foglio e riprova.
2. Oppure vai direttamente su https://script.google.com con quell'account > **Nuovo progetto** e incolla `Code.gs`: lo script funziona anche non collegato al foglio, perché apre i fogli tramite gli ID.
3. Se anche così non si apre, l'account (Workspace aziendale) potrebbe avere Apps Script disabilitato dall'amministratore.

## Password
Il salvataggio è protetto da una password (l'elenco navi invece si legge senza).
1. Nell'editor Apps Script clicca l'ingranaggio **Impostazioni progetto** (a sinistra).
2. In fondo, sezione **Proprietà script** > **Aggiungi proprietà script**.
3. Proprietà: `PASSWORD`, Valore: la password scelta > **Salva proprietà script**.
4. Dopo ogni modifica al codice: **Esegui il deployment > Gestisci deployment > matita > Versione: Nuova versione > Esegui il deployment** (l'URL resta lo stesso).
Sul telefono l'app la chiede al primo salvataggio e la ricorda.

## Avviso via mail
Ogni lettura salvata invia una mail all'indirizzo in `EMAIL_AVVISO` (in cima a `Code.gs`; `''` per spegnerlo).
Dopo aver incollato il codice nuovo Google chiede un'autorizzazione in più (invio mail): **Esegui** una funzione qualsiasi dal menu in alto e consenti, poi ridistribuisci con **Nuova versione**.
Limite: circa 100 mail al giorno con account Gmail gratuito, 1500 con Workspace.

## Mail rifiutata (DMARC): invio tramite un account Gmail
Se il tuo account Google usa un indirizzo aziendale, le mail dello script vengono rifiutate («does not pass DMARC verification»).
Soluzione: un secondo script, sull'account **Gmail**, spedisce al posto del primo.
1. Accedi a Gmail (finestra in incognito), vai su script.google.com → Nuovo progetto, incolla `MailGmail.gs`.
2. Impostazioni progetto → Proprietà script → `SEGRETO` = una parola a tua scelta.
3. Esegui `provaMailGmail` (autorizza). Poi Esegui il deployment → Nuovo deployment → App web → Esegui come Me, Accesso Chiunque. Copia l'URL `/exec`.
4. Nel primo script: incolla l'URL in `MAIL_RELAY_URL`, aggiungi la proprietà script `MAIL_SEGRETO` con la stessa parola, esegui `provaMail` (autorizza l'accesso a servizi esterni), ridistribuisci con «Nuova versione».
