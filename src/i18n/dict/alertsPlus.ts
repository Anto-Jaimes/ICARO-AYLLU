import type { Entries } from './entries';

/**
 * Tsunami estimate, roads (SUTRAN), health and safe places, triage and the Plus Code entry. Quechua and
 * Aymara are a careful draft for a native speaker to check, as the rest of the app.
 */
export const ALERTS_PLUS: Entries = {
  // Tsunami: an AYLLU estimate from the IGP quake, never presented as a DHN statement
  "Riesgo de tsunami (estimado)": ["Tsunami risk (estimate)", "Tsunami manchakuy (yuyaykusqa)", "Tsunami jan walt'awi (amuyt'ata)"],
  "Posible tsunami": ["Possible tsunami", "Tsunami kanmanmi", "Tsunami utjaspawa"],
  "Atención en la costa": ["Caution on the coast", "Qucha patapi cuidakuy", "Quta thiyan amuyasim"],
  "No se espera tsunami": ["No tsunami expected", "Manam tsunami suyakunchu", "Janiw tsunami suyatäkiti"],
  "Posible tsunami en el litoral peruano": ["Possible tsunami on the Peruvian coast", "Piruw qucha patapi tsunami kanmanmi", "Perú quta thiyan tsunami utjaspawa"],
  "Sismo de magnitud {magnitude} en el mar y poco profundo ({depth} km). Si estás en la costa, aléjate de la playa y sube ahora a una zona alta, a más de 30 metros. Sigue los comunicados de la DHN (Marina de Guerra).": ["Magnitude {magnitude} earthquake at sea and shallow ({depth} km). If you are on the coast, move away from the beach and climb now to high ground, more than 30 metres up. Follow the DHN (Navy) bulletins.", "Qucha ukhupi {magnitude} sinchiyuq pacha kuyuy, mana ukhuchu ({depth} km). Qucha patapi kaspaqa, playamanta karunchakuy, kunanpacha hanaq pataman wichay, 30 metromanta aswan hanaqman. DHN (Marina de Guerra) willakuyninta qatiy.", "Qutan {magnitude} ch'amani uraqi khathati, jan manqhachiti ({depth} km). Quta thiyankasta ukhaxa, playat jithiqtam, jichhpach alay chiqaru makhatam, 30 metrot juk'ampi. DHN (Marina de Guerra) yatiyawinakap arknaqam."],
  "Sismo de magnitud {magnitude} en el mar. Aléjate de la orilla de la playa y atiende los comunicados de la DHN (Marina de Guerra).": ["Magnitude {magnitude} earthquake at sea. Stay away from the shoreline and follow the DHN (Navy) bulletins.", "Qucha ukhupi {magnitude} sinchiyuq pacha kuyuy. Playa patamanta karunchakuy, DHN (Marina de Guerra) willakuyninta uyariy.", "Qutan {magnitude} ch'amani uraqi khathati. Playa thiyat jithiqtam, DHN (Marina de Guerra) yatiyawinakap ist'am."],
  "Por su magnitud, profundidad y lugar, este sismo no tiene las condiciones de un tsunami. Ante cualquier duda, sigue los comunicados de la DHN (Marina de Guerra).": ["Given its magnitude, depth and place, this earthquake does not have the conditions for a tsunami. If in doubt, follow the DHN (Navy) bulletins.", "Sinchiyninman, ukhunninman, maypi kasqanman hinaqa, kay pacha kuyuyqa manam tsunamipaq hinachu. Iskayrayaspaqa, DHN (Marina de Guerra) willakuyninta qatiy.", "Ch'amaparjama, manqhaparjama, kawkinkiparjamaxa, aka uraqi khathatix janiw tsunamitakïkiti. Pächasïta ukhaxa, DHN (Marina de Guerra) yatiyawinakap arknaqam."],
  "Estimado por AYLLU con el sismo del IGP. El aviso oficial lo da la DHN.": ["Estimated by AYLLU from the IGP earthquake. The official warning comes from the DHN.", "IGP pacha kuyuywanmi AYLLU yuyaykun. Chiqap willakuytaqa DHN nisqam qun.", "AYLLUw amuyt'i IGP uraqi khathatimpi. Chiqpach yatiyawix DHN ukat juti."],
  "Zona segura: más de 30 m de altura": ["Safe zone: more than 30 m high", "Mana manchakuy: 30 m-manta aswan hanaq", "Jan walt'aw chiqa: 30 m-t juk'amp alaya"],

  // Alerts screen
  "Huaicos y lluvia en {place}": ["Mudslides and rain in {place}", "{place}-pi lluqllakuna, parapas", "{place} ukan llocllanaka, jallumpi"],
  "Sismos en {place}": ["Earthquakes in {place}", "{place}-pi pacha kuyuykuna", "{place} ukan uraqi khathatinaka"],
  "1 distrito con riesgo de huaico": ["1 district at risk of mudslides", "1 distrito lluqlla manchakuywan", "1 distrito lloclla jan walt'awimpi"],
  "{count} distritos con riesgo de huaico": ["{count} districts at risk of mudslides", "{count} distrito lluqlla manchakuywan", "{count} distrito lloclla jan walt'awimpi"],
  "Entre ellos: {places}.": ["Among them: {places}.", "Paykuna ukhupi: {places}.", "Jupanak taypina: {places}."],
  "Fuentes oficiales: IGP, SENAMHI, DHN (Marina de Guerra), SUTRAN. Pronóstico: Open-Meteo.": ["Official sources: IGP, SENAMHI, DHN (Navy), SUTRAN. Forecast: Open-Meteo.", "Chiqap willakuqkuna: IGP, SENAMHI, DHN (Marina de Guerra), SUTRAN. Pacha willakuy: Open-Meteo.", "Chiqpach yatiyirinaka: IGP, SENAMHI, DHN (Marina de Guerra), SUTRAN. Pacha yatiyawi: Open-Meteo."],
  "Estado de Carreteras": ["Road status", "Ñankunapa imayna kasqan", "Thakhinakan kunjamäkis"],
  "Estado de Carreteras (SUTRAN)": ["Road status (SUTRAN)", "Ñankunapa imayna kasqan (SUTRAN)", "Thakhinakan kunjamäkis (SUTRAN)"],
  "Estado de Carreteras (SUTRAN / Provías)": ["Road status (SUTRAN / Provías)", "Ñankunapa imayna kasqan (SUTRAN / Provías)", "Thakhinakan kunjamäkis (SUTRAN / Provías)"],
  "Cortes de vías por huaicos, desbordes y tránsito libre": ["Roads cut by mudslides or flooding, and roads open", "Lluqllawan, mayu llumpaywan wichq'asqa ñankuna, kichasqa ñankunapas", "Lloclla, jawir phuqhantawimpi jist'antata thakhinaka, jist'arata thakhinakampi"],
  "Bloqueos, huaicos y rutas transitables en carreteras": ["Blockages, mudslides and passable roads", "Wichq'akuykuna, lluqllakuna, puriy atina ñankunapas", "Jist'antawinaka, llocllanaka, sarnaqañjam thakhinakampi"],

  // Emergency mode and home entries
  "Clasifica víctimas y entrega informe en QR sin internet": ["Sort the injured and hand over a QR report, without internet", "K'irisqakunata t'aqay, QR willakuyta quy, mana internetwan", "Usuchjatanak t'aqam, QR yatiyawi churam, jan internetampi"],
  "Bomberos 116": ["Firefighters 116", "Bomberos 116", "Bomberos 116"],
  "Hospitales, postas RENAES, tambos MIDIS y agua potable": ["Hospitals, RENAES health posts, MIDIS tambos and drinking water", "Hampina wasikuna, RENAES postakuna, MIDIS tambokuna, upyana yakupas", "Qullañ utanaka, RENAES postanaka, MIDIS tambonaka, umañ umampi"],
  "Agua / Salud / Tambos": ["Water / Health / Tambos", "Yaku / Hampi / Tambokuna", "Uma / Qullaña / Tambonaka"],
  "Plus Code & Silbato Vecinal": ["Plus Code and neighbourhood whistle", "Plus Code, llaqta pituwanpas", "Plus Code, marka pitumpi"],
  "Tu ubicación exacta sin internet y alarma disuasiva": ["Your exact location without internet, and a warning alarm", "Mana internetwan chiqap maypi kasqayki, manchachiq alarmapas", "Jan internetampi kawkinkitas chiqpacha, axsarayir alarmampi"],
  "Ubicación exacta sin internet, SMS de rescate y alarma disuasiva": ["Exact location without internet, rescue SMS and a warning alarm", "Mana internetwan chiqap maypi kasqan, qispichinapaq SMS, manchachiq alarmapas", "Jan internetampi kawkinkis chiqpacha, qhispiyañ SMS, axsarayir alarmampi"],
  "Oficios de tu barrio": ["Trades in your neighbourhood", "Llaqtaykipa llamk'aykunan", "Markaman luräwinaka"]
};
