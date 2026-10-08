/**
 * Secondo script, da creare sull'ACCOUNT GMAIL (stefano.robelli@gmail.com).
 * Riceve dal primo script l'oggetto e il testo e spedisce la mail all'indirizzo fisso qui sotto.
 * Il destinatario è fisso, così nessuno può usarlo per spedire mail ad altri.
 *
 * Impostazioni:
 *  1. Impostazioni progetto > Proprietà script > aggiungi SEGRETO = una parola a tua scelta
 *     (la stessa va messa nel primo script come MAIL_SEGRETO).
 *  2. Esegui il deployment > Nuovo deployment > App web > Esegui come: Me, Accesso: Chiunque.
 *  3. Copia l'URL /exec e incollalo in MAIL_RELAY_URL del primo script.
 */
const DESTINATARIO = 'stefano.robelli@fincantieri.it';

function esito(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try{
    const b = JSON.parse(e.postData.contents);
    const segreto = PropertiesService.getScriptProperties().getProperty('SEGRETO');
    if(!segreto || b.segreto !== segreto) return esito({ok:false, error:'segreto errato'});
    MailApp.sendEmail({
      to: DESTINATARIO,
      subject: String(b.oggetto || 'Avviso').slice(0, 200),
      body: String(b.testo || '').slice(0, 5000)
    });
    return esito({ok:true});
  }catch(err){
    return esito({ok:false, error:String(err).slice(0, 160)});
  }
}

/* Prova da editor: invia una mail di prova (e chiede l'autorizzazione la prima volta). */
function provaMailGmail(){
  MailApp.sendEmail(DESTINATARIO, 'Prova da Gmail', 'Se leggi questa mail, Gmail → Fincantieri funziona.');
  Logger.log('Inviata a ' + DESTINATARIO);
}
