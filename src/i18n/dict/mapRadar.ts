import type { Entries } from './entries';

/**
 * The map's radar (what is published near you) and safe zones (open places to gather after an
 * earthquake), and triage in the SOS panel. Quechua and Aymara are a careful draft for a native speaker.
 */
export const MAP_RADAR: Entries = {
  // Radar
  "Radar": ["Radar", "Radar", "Radar"],
  "Radar: cerca de ti": ["Radar: near you", "Radar: qayllaykipi", "Radar: jak'aman"],
  "A menos de {distance}: {summary}.": ["Within {distance}: {summary}.", "{distance}-manta pisillapi: {summary}.", "{distance}-t juk'a jak'ana: {summary}."],
  "Nada publicado a menos de {distance}. Prueba un radio más grande.": ["Nothing posted within {distance}. Try a bigger radius.", "Manam imapas willasqachu {distance}-manta pisillapi. Aswan hatun muyuta yant'ay.", "Janiw kunas yatiyatäkiti {distance}-t juk'a jak'ana. Juk'amp jach'a muyumpi yant'am."],
  "Apagar el radar": ["Turn off the radar", "Radarta wañuchiy", "Radar jiwayaña"],
  "Distancia del radar": ["Radar distance", "Radarpa karunkaynin", "Radaran jayapa"],
  "Activa tu ubicación para usar el radar.": ["Turn on your location to use the radar.", "Maypi kasqaykita kichay radarta llamk'achinaykipaq.", "Kawkinkasa uk jaqtam radar apnaqañataki."],

  // Safe zones
  "Zonas seguras": ["Safe zones", "Mana manchakuy kitikuna", "Jan walt'aw chiqanaka"],
  "Punto de reunión": ["Assembly point", "Huñunakuna kiti", "Tantachasiñ chiqa"],
  "Parque": ["Park", "Parque", "Parque"],
  "Losa deportiva": ["Sports court", "Pukllana pampa", "Anatañ pampa"],
  "Plaza": ["Square", "Plaza", "Plaza"],
  "Activa tu ubicación para ver las zonas seguras cerca de ti.": ["Turn on your location to see the safe zones near you.", "Maypi kasqaykita kichay qayllaykipi mana manchakuy kitikunata qhawanaykipaq.", "Kawkinkasa uk jaqtam jak'aman jan walt'aw chiqanak uñjañataki."],
  "Sin internet no se pueden buscar zonas seguras.": ["Without internet safe zones can't be searched.", "Mana internetwanqa manam mana manchakuy kitikunata maskayta atikunchu.", "Jan internetampix janiw jan walt'aw chiqanak thaqhañ atiskiti."],
  "El mapa no tiene parques ni puntos de reunión a menos de 1.5 km.": ["The map has no parks or assembly points within 1.5 km.", "Mapaqa manam 1.5 km ukhupi parquekunayuqchu nitaq huñunakuna kitikunayuqchu.", "Mapax janiw 1.5 km jak'ana parquenakanïkiti ni tantachasiñ chiqanakanïkiti."],
  "No se pudieron buscar zonas seguras. Vuelve a intentar.": ["Couldn't search for safe zones. Try again.", "Manam mana manchakuy kitikunata maskayta atikurqanchu. Kaqmanta yant'ay.", "Janiw jan walt'aw chiqanak thaqhañjamäkänti. Wasitat yant'am."],

  // Triage in SOS
  "Triaje de heridos": ["Triage of the injured", "K'irisqakunata t'aqay", "Usuchjatanak t'aqaña"],
  "Clasifícalos por colores y comparte la lista con un código QR": ["Sort them by colour and share the list with a QR code", "Llimpikunawan t'aqay, listatapas QR kodigowan rakiy", "Saminakampi t'aqam, listsa QR codigompi churt'am"],
  "Para quien llegue a ayudar": ["For whoever comes to help", "Yanapaq chayamuqpaq", "Yanapir purinirinakataki"],
  "Muestra este código a los bomberos o al personal de salud: cualquier celular lo lee con la cámara, sin internet, y ve la lista de heridos con su ubicación.": ["Show this code to firefighters or health staff: any phone reads it with the camera, without internet, and sees the list of injured with their location.", "Kay kodigota bomberoskunaman utaq salud runakunaman rikuchiy: mayqin celularpas camarawan ñawinchan, mana internetwan, k'irisqakunapa listanta maypi kasqankutawan qhawan.", "Aka codigo bomberonakaru jan ukax salud jaqinakaru uñacht'ayam: kuna celularas camarampiw liyt'i, jan internetampi, usuchjatanakan listap kawkinkapxisa ukamp uñji."]
};
