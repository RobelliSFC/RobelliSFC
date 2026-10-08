/**
 * Backend per l'app "Letture immersioni".
 * - GET  ?action=navi   -> elenco costruzioni dalla scheda "Impostazioni"
 * - POST {action:'salva', record:{...}} -> aggiunge una riga alla scheda "Letture"
 *
 * Imposta qui sotto gli ID dei fogli (la parte tra /d/ e /edit nell'URL).
 * Se Impostazioni e Letture sono nello stesso file, usa lo stesso ID due volte.
 */
const ID_IMPOSTAZIONI = '11WV2lYM5Qr7FeF2tYGUprkZMUzHbOXX4kV_7Lc2I0pE';
const ID_LETTURE      = '11WV2lYM5Qr7FeF2tYGUprkZMUzHbOXX4kV_7Lc2I0pE';
const SCHEDA_IMPOSTAZIONI = 'Impostazioni';
const SCHEDA_LETTURE      = 'Letture';
const FUSO = 'Europe/Rome';
/* Avviso via mail a ogni lettura salvata. Lascia '' per disattivarlo. */
const EMAIL_AVVISO = 'stefano.robelli@fincantieri.it';

/* Scheda Impostazioni, riga 1 = intestazioni, dalla riga 2 una nave per riga:
   A Costruzione | B Distanza marche prua-poppa (m) | C Largh. prua (m) | D Largh. centro (m) | E Largh. poppa SKEG (m) | F Largh. poppa TIMONE (m) */

const INTESTAZIONI = ['Data','Ora','Costruzione','Marca poppa su',
  'PS prua','SB prua','PS centro','SB centro','PS poppa','SB poppa',
  'Densità','Immersione media',
  'Sbandamento prua (°)','Sbandamento centro (°)','Sbandamento poppa (°)',
  'Assetto (°)','Assetto (m)','Prima lettura','Ultima lettura','ID'];
/* Segni: sbandamento > 0 = più immersa SB (a dritta); assetto > 0 = appruato. */

/* accetta numeri veri o testo con la virgola ("300,21") */
function num(v){
  if(v === '' || v === null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g,'').replace(',','.'));
  return isFinite(n) ? n : null;
}

/* La password non sta nel codice: si imposta in Impostazioni progetto > Proprietà script (nome: PASSWORD). */
function passwordOk(pw){
  const vera = PropertiesService.getScriptProperties().getProperty('PASSWORD');
  return !!vera && pw === vera;
}

function virgola(n, d){
  return (n === null || n === undefined || n === '' || !isFinite(n)) ? '—' : Number(n).toFixed(d).replace('.', ',');
}

/* Spedisce direttamente (MailApp) oppure tramite il secondo script su Gmail. Restituisce '' se ok, altrimenti l'errore. */
function inviaMail(oggetto, testo){
  try{
    if(MAIL_RELAY_URL){
      const segreto = PropertiesService.getScriptProperties().getProperty('MAIL_SEGRETO');
      const res = UrlFetchApp.fetch(MAIL_RELAY_URL, {
        method: 'post', contentType: 'text/plain', followRedirects: true, muteHttpExceptions: true,
        payload: JSON.stringify({segreto: segreto, oggetto: oggetto, testo: testo})
      });
      const j = JSON.parse(res.getContentText());
      return j.ok ? '' : String(j.error || 'errore sconosciuto').slice(0, 160);
    }
    MailApp.sendEmail({to: EMAIL_AVVISO, subject: oggetto, body: testo});
    return '';
  }catch(err){
    console.error('Mail non inviata: ' + err);
    return String(err).slice(0, 160);
  }
}

/* Una mail per ogni lettura. Se l'invio fallisce la lettura resta comunque nel foglio;
   la funzione restituisce '' se tutto ok, altrimenti il testo dell'errore (mostrato sul telefono). */
function avvisaPerMail(r, quando){
  if(!EMAIL_AVVISO) return 'avviso mail disattivato';
  try{
    const m = r.marche;
    const data = Utilities.formatDate(quando, FUSO, 'dd/MM/yyyy HH:mm');
    const lato = a => a === null || !isFinite(a) || Math.abs(a) < 0.005 ? '' : (a > 0 ? ' a dritta' : ' a sinistra');
    const assetto = (r.assetto_m === null || !isFinite(r.assetto_m) || Math.abs(r.assetto_m) < 0.005) ? '' : (r.assetto_m > 0 ? ' (appruato)' : ' (appoppato)');
    const righe = [
      'Costruzione ' + r.costruzione + ' · marca di poppa letta su ' + (r.rif_poppa || '—'),
      'Data: ' + data,
      '',
      'Prua   PS ' + virgola(m.fp,2) + '   SB ' + virgola(m.fs,2),
      'Centro PS ' + virgola(m.mp,2) + '   SB ' + virgola(m.ms,2),
      'Poppa  PS ' + virgola(m.ap,2) + '   SB ' + virgola(m.as,2),
      '',
      'Immersione media: ' + virgola(r.media,3) + ' m',
      'Densità: ' + virgola(r.densita,3) + ' t/m³',
      'Sbandamento prua: ' + virgola(Math.abs(r.sbandamento.f),2) + '°' + lato(r.sbandamento.f),
      'Sbandamento centro: ' + virgola(Math.abs(r.sbandamento.m),2) + '°' + lato(r.sbandamento.m),
      'Sbandamento poppa: ' + virgola(Math.abs(r.sbandamento.a),2) + '°' + lato(r.sbandamento.a),
      'Assetto: ' + virgola(Math.abs(r.assetto_gradi),3) + '° / ' + virgola(Math.abs(r.assetto_m),2) + ' m' + assetto
    ];
    return inviaMail('Immersioni ' + r.costruzione + ' · media ' + virgola(r.media,3) + ' m · ' + data, righe.join('\n'));
  }catch(err){
    console.error('Mail non inviata: ' + err);
    return String(err).slice(0, 160);
  }
}

/* Da lanciare a mano dall'editor (menu funzioni → provaMail → Esegui): chiede l'autorizzazione e invia una mail di prova. */
function provaMail(){
  const err = inviaMail('Prova avviso Letture immersioni', 'Se leggi questa mail l\'invio funziona.');
  Logger.log(err ? 'ERRORE: ' + err : 'Mail di prova inviata (' + (MAIL_RELAY_URL ? 'tramite Gmail' : 'diretta') + ')');
}

function risposta(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  try{
    if((e.parameter.action||'') !== 'navi') return risposta({ok:false,error:'azione sconosciuta'});
    const righe = SpreadsheetApp.openById(ID_IMPOSTAZIONI).getSheetByName(SCHEDA_IMPOSTAZIONI)
      .getDataRange().getValues().slice(1);
    const navi = righe.filter(r => r[0] !== '').map(r => ({
      id:String(r[0]).trim(), len:num(r[1]), bf:num(r[2]), bm:num(r[3]), ba:num(r[4]), bt:num(r[5])
    }));
    return risposta({ok:true,navi:navi});
  }catch(err){ return risposta({ok:false,error:String(err)}); }
}

function doPost(e){
  const lock = LockService.getScriptLock();
  try{
    lock.waitLock(20000);
    const body = JSON.parse(e.postData.contents);
    if(!passwordOk(body.pw)) return risposta({ok:false,error:'password errata'});
    if(body.action !== 'salva') return risposta({ok:false,error:'azione sconosciuta'});
    const r = body.record;
    let sh = SpreadsheetApp.openById(ID_LETTURE).getSheetByName(SCHEDA_LETTURE);
    if(!sh){ sh = SpreadsheetApp.openById(ID_LETTURE).insertSheet(SCHEDA_LETTURE); }
    if(sh.getLastRow() === 0){ sh.appendRow(INTESTAZIONI); sh.setFrozenRows(1); }

    // evita doppioni se il telefono rimanda lo stesso record
    const colId = INTESTAZIONI.length;
    if(sh.getLastRow() > 1){
      const ids = sh.getRange(2, colId, sh.getLastRow()-1, 1).getValues().flat();
      if(ids.indexOf(r.rid) !== -1) return risposta({ok:true,duplicato:true});
    }

    const quando = new Date(r.ts);
    const ora = t => t ? Utilities.formatDate(new Date(t), FUSO, 'HH:mm:ss') : '';
    const m = r.marche;
    sh.appendRow([
      Utilities.formatDate(quando, FUSO, 'dd/MM/yyyy'), ora(r.ts), r.costruzione, r.rif_poppa || '',
      m.fp, m.fs, m.mp, m.ms, m.ap, m.as,
      r.densita, r.media,
      r.sbandamento.f, r.sbandamento.m, r.sbandamento.a,
      r.assetto_gradi, r.assetto_m, ora(r.prima_lettura), ora(r.ultima_lettura), r.rid
    ]);
    const errMail = avvisaPerMail(r, quando);
    return risposta({ok:true, mail:errMail});
  }catch(err){
    return risposta({ok:false,error:String(err)});
  }finally{
    lock.releaseLock();
  }
}
