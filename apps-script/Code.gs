/**
 * Backend per l'app "Letture immersioni".
 * - GET  ?action=navi   -> elenco costruzioni dalla scheda "Impostazioni"
 * - POST {action:'salva', record:{...}} -> aggiunge una riga alla scheda "Letture"
 *
 * Imposta qui sotto gli ID dei fogli (la parte tra /d/ e /edit nell'URL).
 * Se Impostazioni e Letture sono nello stesso file, usa lo stesso ID due volte.
 */
const ID_IMPOSTAZIONI = 'INCOLLA_QUI_ID_FOGLIO_IMPOSTAZIONI';
const ID_LETTURE      = 'INCOLLA_QUI_ID_FOGLIO_LETTURE';
const SCHEDA_IMPOSTAZIONI = 'Impostazioni';
const SCHEDA_LETTURE      = 'Letture';
const FUSO = 'Europe/Rome';

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
    return risposta({ok:true});
  }catch(err){
    return risposta({ok:false,error:String(err)});
  }finally{
    lock.releaseLock();
  }
}
