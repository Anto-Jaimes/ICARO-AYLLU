import type { Entries } from './entries';

/**
 * "Carreteras": national roads closed or restricted, from the MTC. Route names, causes and the MTC's
 * own words stay as the MTC writes them (data). Quechua and Aymara are a careful draft.
 */
export const ROADS: Entries = {
  "Carreteras": ["Roads", "Ñankuna", "Thakhinaka"],
  "Vías cerradas o con paso restringido, según el MTC": ["Roads closed or with restricted passage, according to the MTC", "MTC nisqanman hina wichq'asqa utaq sasa puriy ñankuna", "MTC sistu ukarjama jist'antata jan ukax ch'ama sarañ thakhinaka"],
  "Qué carreteras ver": ["Which roads to show", "Mayqin ñankunata qhaway", "Kawkïr thakhinak uñjaña"],
  "Todo el Perú": ["All of Peru", "Llapan Piruw", "Taqpach Perú"],
  "Activa tu ubicación para ver solo las de tu zona.": ["Turn on your location to see only those in your area.", "Maypi kasqaykita kichay llaqtaykipi kaqkunallata qhawanaykipaq.", "Kawkinkasa uk jaqtam markaman utjirinakaki uñjañataki."],
  "Consultando al MTC...": ["Checking with the MTC...", "MTCta tapuchkan...", "MTCru jiskt'aski..."],
  "No se pudo consultar al MTC. Revisa tu internet y vuelve a abrir esta sección.": ["Couldn't check with the MTC. Check your internet and open this section again.", "Manam MTCta tapuyta atikurqanchu. Internetniykita qhawaspa kay t'aqata kaqmanta kichay.", "Janiw MTCru jiskt'añjamäkänti. Internetam uñakipt'am ukat aka t'aqa wasitat jist'aram."],
  "Sin conexión con el MTC. Datos guardados {time}.": ["No connection with the MTC. Data saved {time}.", "Mana MTCwan tinkiyniyuq. Willakuykuna waqaychasqa {time}.", "Jan MTCampi mayacht'atäkiti. Yatiyawinak imata {time}."],
  "Datos guardados": ["Saved data", "Waqaychasqa willakuykuna", "Imata yatiyawinaka"],
  "Cerca de ti ({km} km) no hay vías nacionales cerradas ni con paso restringido.": ["Near you ({km} km) there are no national roads closed or with restricted passage.", "Qayllaykipi ({km} km) manam kanchu wichq'asqa nitaq sasa puriy nacional ñankuna.", "Jak'aman ({km} km) janiw utjkiti jist'antata ni ch'ama sarañ nacional thakhinaka."],
  "No hay vías nacionales cerradas ni con paso restringido.": ["There are no national roads closed or with restricted passage.", "Manam kanchu wichq'asqa nitaq sasa puriy nacional ñankuna.", "Janiw utjkiti jist'antata ni ch'ama sarañ nacional thakhinaka."],
  "1 vía cerrada": ["1 road closed", "1 ñan wichq'asqa", "1 thakhi jist'antata"],
  "{count} vías cerradas": ["{count} roads closed", "{count} ñankuna wichq'asqa", "{count} thakhinaka jist'antata"],
  "1 con paso restringido": ["1 with restricted passage", "1 sasa puriywan", "1 ch'ama sarañampi"],
  "{count} con paso restringido": ["{count} with restricted passage", "{count} sasa puriywan", "{count} ch'ama sarañampi"],
  " y ": [" and ", " hinallataq ", " ukat "],
  "Cerca de ti: {summary}.": ["Near you: {summary}.", "Qayllaykipi: {summary}.", "Jak'aman: {summary}."],
  "En todo el Perú: {summary}.": ["In all of Peru: {summary}.", "Llapan Piruwpi: {summary}.", "Taqpach Perún: {summary}."],
  "Desde {when}": ["Since {when}", "{when}-manta", "{when}-tpacha"],
  "Cerrada": ["Closed", "Wichq'asqa", "Jist'antata"],
  "Paso restringido": ["Restricted passage", "Sasa puriy", "Ch'ama saraña"],
  "Qué pasó:": ["What happened:", "Ima pasarqan:", "Kunas pasäna:"],
  "Última novedad:": ["Latest update:", "Qhipa willakuy:", "Qhipa yatiyawi:"],
  "Ver más ({count})": ["Show more ({count})", "Aswanta qhaway ({count})", "Juk'amp uñjaña ({count})"],
  "Fuente: MTC, Centro de Operaciones de Emergencia. Consultado {time}.": ["Source: MTC, Emergency Operations Centre. Checked {time}.", "Maymanta: MTC, Emergencia Operaciones Centro. Tapusqa {time}.", "Kawkitsa: MTC, Emergencia Operaciones Centro. Jiskt'ata {time}."],
  "Fuente: MTC, Centro de Operaciones de Emergencia.": ["Source: MTC, Emergency Operations Centre.", "Maymanta: MTC, Emergencia Operaciones Centro.", "Kawkitsa: MTC, Emergencia Operaciones Centro."],
  "Ver el mapa oficial del MTC": ["See the MTC's official map", "MTCpa chiqap mapanta qhaway", "MTCan chiqpach mapap uñjaña"],
  "¿Pasó algo en la carretera?": ["Did something happen on the road?", "¿Ñanpi imapas pasarqanchu?", "¿Thakhin kunas pasänti?"],
  "Policía de Carreteras": ["Highway Police", "Ñankunapa Policían", "Thakhinakan Policíapa"],
  "SUTRAN, línea gratuita": ["SUTRAN, free line", "SUTRAN, mana qullqiyuq línea", "SUTRAN, inaki línea"],
  "Denunciar a un bus o camión (Fiscafono de SUTRAN)": ["Report a bus or truck (SUTRAN's Fiscafono)", "Busta utaq camionta willanakuy (SUTRANpa Fiscafonon)", "Bus jan ukax camión uñt'ayaña (SUTRAN Fiscafono)"]
};
