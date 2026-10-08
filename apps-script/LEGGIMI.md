# Collegare l'app al foglio Google

1. Nel foglio **Impostazioni**, scheda `Impostazioni`, riga 1 intestazioni, dalla riga 2 una nave per riga:
   `Costruzione | Distanza marche prua-poppa (m) | Largh. prua | Largh. centro | Largh. poppa`
   (es. `6302 | 200 | 20 | 30 | 30`). Il menu dell'app legge la colonna A.
2. Nel foglio **Letture** non serve preparare nulla: la scheda `Letture` e le intestazioni vengono create al primo salvataggio.
3. Apri uno dei due fogli > **Estensioni > Apps Script**, incolla il contenuto di `Code.gs`, sostituisci i due ID.
4. **Distribuisci > Nuova distribuzione > Tipo: App web**; *Esegui come*: **Me**; *Chi ha accesso*: **Chiunque**. Autorizza e copia l'URL che finisce con `/exec`.
5. In `index.html` incolla l'URL in `const SHEET_URL=''`.

Nota: chiunque conosca l'URL può leggere l'elenco navi e aggiungere righe. Per dati non sensibili va bene; verifica la policy aziendale.
