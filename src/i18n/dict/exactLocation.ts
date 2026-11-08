import type { Entries } from './entries';

/**
 * The exact place in rescue messages (manzana y lote, GPS precision) and the Auxilio sheet (Plus Code,
 * family contact, neighbourhood whistle). Quechua and Aymara are a careful draft for a native speaker.
 */
export const EXACT_LOCATION: Entries = {
  // Manzana y lote
  "Tu dirección exacta": ["Your exact address", "Chiqap maypi tiyasqayki", "Chiqpach kawkin jakasta"],
  "Escribe tu manzana y lote para que la ayuda llegue a tu puerta.": ["Write your block and lot so help reaches your door.", "Manzanaykita lotiykitapas qillqay yanapay punkuykiman chayananpaq.", "Manzanama lotemsa qillqt'am yanapax punkumar purinapataki."],
  "Escribir manzana y lote": ["Write block and lot", "Manzanata lotitapas qillqay", "Manzana lotempi qillqt'aña"],
  "Manzana y lote, o una referencia": ["Block and lot, or a landmark", "Manzana lotepas, utaq huk riqsichiy", "Manzana lotempi, jan ukax mä uñt'ayawi"],
  "Se guarda solo en tu celular. Irá en tus mensajes de auxilio cuando estés a menos de {meters} m de aquí.": ["It's saved only on your phone. It will go in your help messages when you are less than {meters} m from here.", "Celularniykillapim waqaychakun. Yanapay willakuyniykikunapim rinqa kaymanta {meters} m-manta pisillapi kaspa.", "Celularamankiw imasi. Yanap yatiyawinakamanwa sarani akat {meters} m-t juk'a jak'ankasma ukhaxa."],
  "Guardado. Irá en tus mensajes de auxilio cuando estés aquí.": ["Saved. It will go in your help messages when you are here.", "Waqaychasqaña. Kaypi kaspaqa yanapay willakuyniykikunapim rinqa.", "Imatawa. Akankasma ukhax yanap yatiyawinakamanwa sarani."],
  "Dirección exacta borrada.": ["Exact address deleted.", "Chiqap tiyana pichasqaña.", "Chiqpach jakañax chhaqtayatawa."],
  "Activa tu ubicación para poder enviar dónde estás exactamente.": ["Turn on your location to be able to send exactly where you are.", "Maypi kasqaykita kichay chiqap maypi kasqaykita kachanaykipaq.", "Kawkinkasa uk jaqtam chiqpach kawkinkasa uk apayañataki."],
  "GPS ±{meters} m.": ["GPS ±{meters} m.", "GPS ±{meters} m.", "GPS ±{meters} m."],

  // Auxilio sheet
  "Auxilio Rápido y Plus Code de Rescate": ["Quick help and rescue Plus Code", "Utqay yanapay, qispichiy Plus Codepas", "Jank'ak yanapa, qhispiyasiñ Plus Codempi"],
  "Plus Code & Rescate": ["Plus Code and rescue", "Plus Code, qispichiypas", "Plus Code, qhispiyasiñampi"],
  "Silbato Antirrobo (200m)": ["Anti-theft whistle (200 m)", "Suwakunapaq pitu (200 m)", "Lunthatanakataki pitu (200 m)"],
  "Tu código de ubicación exacta (sin internet)": ["Your exact location code (no internet)", "Chiqap maypi kasqayki kodigo (mana internetwan)", "Chiqpach kawkinkasa codigo (jan internetampi)"],
  "Activa tu ubicación para ver tu código.": ["Turn on your location to see your code.", "Maypi kasqaykita kichay kodigoykita qhawanaykipaq.", "Kawkinkasa uk jaqtam codigom uñjañataki."],
  "Código de ubicación copiado": ["Location code copied", "Maypi kasqayki kodigo copiasqaña", "Kawkinkasa codigox copiatawa"],
  "Copiar": ["Copy", "Copiay", "Copiaña"],
  "¡Copiado!": ["Copied!", "¡Copiasqaña!", "¡Copiatawa!"],
  "Dictar en voz alta": ["Read aloud", "Sinchita willay", "Jach'at liyt'aña"],
  "Para dictar por teléfono a Bomberos (116) o Policía (105):": ["To read over the phone to Firefighters (116) or Police (105):", "Bomberosman (116) utaq Policíaman (105) telefonopi willanapaq:", "Bomberos (116) jan ukax Policía (105) ukaru telefonon yatiyañataki:"],
  "Ficha médica de rescate": ["Rescue medical record", "Qispichiypaq hampi willakuy", "Qhispiyasiñataki qulla yatiyawi"],
  "Sangre": ["Blood", "Yawar", "Wila"],
  "sin completar": ["not filled in", "mana hunt'asqa", "jan phuqhachata"],
  "Celular de un familiar (ej. 987654321)": ["A relative's phone (e.g. 987654321)", "Ayllu masiykipa celularnin (ej. 987654321)", "Familiaman celularapa (ej. 987654321)"],
  "Contacto guardado:": ["Saved contact:", "Waqaychasqa contacto:", "Imata contacto:"],
  "No tienes un número de familiar guardado. Toca «Configurar» para agregarlo.": ["You have no relative's number saved. Tap «Set up» to add it.", "Manam ayllu masiykipa yupaynin waqaychasqachu. «Allichay» ñit'iy yapanaykipaq.", "Janiw familiaman jakhupax imatäkiti. «Wakicht'aña» ch'iqt'am yapxatañataki."],
  "Línea 119:": ["Line 119:", "119 Línea:", "119 Línea:"],
  "deja o escucha mensajes de voz si las llamadas colapsan por un sismo.": ["leave or listen to voice messages if calls collapse after an earthquake.", "kunka willakuykunata saqiy utaq uyariy, pacha kuyuyrayku waqyaykuna mana atikuptin.", "aru yatiyawinak jaytam jan ukax ist'am, uraqi khathatit jawsawinakax jan atkchixa."],
  "Silbato fuerte y linterna intermitente": ["Loud whistle and flashing torch", "Sinchi pitu, k'anchay k'anchaypas", "Ch'amani pitu, qhant qhant linterna"],
  "Suena un silbato fuerte e intermitente y parpadea la linterna para alertar a toda la cuadra y ahuyentar a sospechosos.": ["A loud, intermittent whistle sounds and the torch flashes to alert the whole block and scare off suspects.", "Sinchi pitum waqan, linternapas k'anchaykachan, llapan cuadrata willanapaq, iskayrayana runakunatapas qarqonapaq.", "Ch'amani pitux jawsaski, linternax qhant qhant sasa, taqpach cuadrar yatiyañataki, pächasiñ jaqinak alissuñataki."],
  "¡Activar!": ["Turn on!", "¡Kichay!", "¡Jaqtaña!"],
  "Silbato vecinal": ["Neighbourhood whistle", "Llaqta pitu", "Marka pitu"],
  "¡Alarma comunitaria sonando a máximo volumen!": ["Community alarm sounding at full volume!", "¡Llaqta alarma tukuy sinchiwan waqachkan!", "¡Marka alarmax taqi ch'amampi jawsaski!"],
  "Presiona para activar el silbato vecinal": ["Press to turn on the neighbourhood whistle", "Ñit'iy llaqta pituta kichanaykipaq", "Ch'iqt'am marka pitu jaqtañataki"],
  "Policía (105)": ["Police (105)", "Policía (105)", "Policía (105)"],
  "Bomberos (116)": ["Firefighters (116)", "Bomberos (116)", "Bomberos (116)"],
  "Ambulancia SAMU (106)": ["SAMU ambulance (106)", "SAMU ambulancia (106)", "SAMU ambulancia (106)"],
  "Defensa Civil (115)": ["Civil Defence (115)", "Defensa Civil (115)", "Defensa Civil (115)"]
};
