import type { Entries } from './entries';

/**
 * Pharmacies near you (OpenStreetMap) and DIGEMID, the official price of gas (Osinergmin's Facilito)
 * and Radio Nacional. Quechua and Aymara are a careful draft for a native speaker to check.
 */
export const OFFICIAL_SOURCES: Entries = {
  // Pharmacies
  "Farmacias": ["Pharmacies", "Hampi wasikuna", "Qulla utanaka"],
  "Farmacia": ["Pharmacy", "Hampi wasi", "Qulla uta"],
  "Farmacias cerca": ["Pharmacies nearby", "Qayllapi hampi wasikuna", "Jak'an qulla utanaka"],
  "Las del mapa, y medicinas en DIGEMID": ["Those on the map, and medicines at DIGEMID", "Mapapi kaqkuna, DIGEMIDpi hampikunapas", "Mapan utjirinaka, DIGEMIDan qullanakampi"],
  "No sabemos qué farmacia está de turno hoy: llama antes de ir.": ["We don't know which pharmacy is on duty today: call before you go.", "Manam yachaykuchu mayqin hampi wasi kunan punchaw turnopi kasqanta: manaraq rispa waqyay.", "Janiw yatktti kawkïr qulla utas jichhürux turnon ukxa: janïr sarkasax jawsam."],
  "Activa tu ubicación para ver las farmacias más cercanas.": ["Turn on your location to see the nearest pharmacies.", "Maypi kasqaykita kichay aswan qayllapi hampi wasikunata qhawanaykipaq.", "Kawkinkasa uk jaqtam jak'ankir qulla utanak uñjañataki."],
  "Buscando farmacias...": ["Looking for pharmacies...", "Hampi wasikunata maskachkan...", "Qulla utanak thaqhaski..."],
  "No encontramos farmacias en el mapa a menos de 20 km.": ["We found no pharmacies on the map within 20 km.", "Manam mapapi 20 km ukhupi hampi wasikunata tarirqaykuchu.", "Janiw mapan 20 km jak'an qulla utanak jikxatapktti."],
  "Abierta las 24 horas, según el mapa": ["Open 24 hours, according to the map", "24 horas kichasqa, mapa nisqanman hina", "24 horas jist'arata, mapaxa sistu"],
  "¿Buscas un medicamento?": ["Looking for a medicine?", "¿Hampitachu maskachkanki?", "¿Mä qullacha thaqhasta?"],
  "DIGEMID, del Ministerio de Salud, muestra en qué farmacias lo venden y a qué precio.": ["DIGEMID, from the Ministry of Health, shows which pharmacies sell it and at what price.", "Salud Ministeriopa DIGEMIDninmi rikuchin mayqin hampi wasikunapi rantikusqanta, hayk'apipas.", "Salud Ministerion DIGEMIDapaw uñacht'ayi kawkïr qulla utanakan aljasi ukat qawqhas."],
  "Buscar en DIGEMID": ["Search on DIGEMID", "DIGEMIDpi maskay", "DIGEMIDan thaqhaña"],
  "Farmacias: datos de OpenStreetMap. Si no tiene teléfono, te mostramos cómo llegar.": ["Pharmacies: OpenStreetMap data. If there is no phone, we show you how to get there.", "Hampi wasikuna: OpenStreetMap willakuykuna. Mana telefonoyuq kaptinqa, imayna chayanaykitam rikuchiyki.", "Qulla utanaka: OpenStreetMap yatiyawinaka. Jan telefononïchixa, kunjams purita uk uñacht'ayapxsma."],

  // Gas
  "Balón de gas": ["Gas cylinder", "Gas balón", "Gas balón"],
  "Precio oficial": ["Official price", "Chiqap chanin", "Chiqpach chani"],
  "Precio del balón de gas": ["Price of a gas cylinder", "Gas balónpa chaninnin", "Gas balónan chanipa"],
  "Precios oficiales en Facilito": ["Official prices on Facilito", "Facilitopi chiqap chaninkuna", "Facilitoan chiqpach chaninaka"],
  "Facilito, de Osinergmin, muestra el precio del balón de gas de 10 kg en los locales formales de tu distrito, con su dirección y teléfono.": ["Facilito, from Osinergmin, shows the price of a 10 kg gas cylinder at the formal shops in your district, with their address and phone.", "Osinergminpa Facilitonmi rikuchin 10 kg gas balónpa chaninta distritoykipa chiqap qhatukunapi, maypi kasqanwan telefononwan.", "Osinergminan Facilitopaw uñacht'ayi 10 kg gas balónan chanipa distritoman chiqpach aljañ utanakan, kawkinkisa telefonompi."],
  "Ahí elige \"GLP\", luego \"GLP envasado\" y tu distrito.": ["There choose \"GLP\", then \"GLP envasado\" and your district.", "Chaypi \"GLP\" akllay, chaymanta \"GLP envasado\", distritoykitapas.", "Ukan \"GLP\" ajllim, ukat \"GLP envasado\", distritomsa."],
  "Ver precios en Facilito": ["See prices on Facilito", "Facilitopi chaninkunata qhaway", "Facilitoan chaninak uñjaña"],
  "Para usar el gas con cuidado": ["To use gas safely", "Gasta allinta llamk'achinapaq", "Gas sum apnaqañataki"],
  "Compra en locales formales: el balón debe tener su precinto de seguridad.": ["Buy at formal shops: the cylinder must have its safety seal.", "Chiqap qhatukunapi rantiy: balónqa precinto de seguridadniyuqmi kanan.", "Chiqpach aljañ utanakan alam: balónax precinto de seguridadanïñapawa."],
  "Si huele a gas, no prendas luces ni fósforos: abre puertas y ventanas, cierra la llave del balón y sal.": ["If it smells of gas, don't turn on lights or strike matches: open doors and windows, close the cylinder valve and get out.", "Gas q'apachkaptinqa, ama k'anchaykunata nitaq fosforota hap'ichiychu: punkukunata, ventanakunatapas kichay, balónpa llavinta wichq'ay, lluqsiy.", "Gas thujsaskchixa, jan qhananak ni fosforo naktaymti: punkunak ventananak jist'aram, balónan llavip jist'antam, mistum."],
  "Después de un sismo, revisa la manguera y la válvula antes de volver a prender la cocina.": ["After an earthquake, check the hose and valve before lighting the stove again.", "Pacha kuyuy qhipamanqa, mangueratawan válvulatawan qhawariy manaraq yanunaykita kaqmanta hap'ichichkaspa.", "Uraqi khathati qhipatxa, manguera válvulampi uñakipt'am janïr cocina wasitat naktaykasa."],
  "Precios oficiales: Osinergmin (Facilito).": ["Official prices: Osinergmin (Facilito).", "Chiqap chaninkuna: Osinergmin (Facilito).", "Chiqpach chaninaka: Osinergmin (Facilito)."],

  // Radio Nacional
  "Radio Nacional": ["Radio Nacional", "Radio Nacional", "Radio Nacional"],
  "Comunicados oficiales: en la app o en una radio a pilas": ["Official statements: on the app or on a battery radio", "Chiqap willakuykuna: apppi utaq pilayuq radiopi", "Chiqpach yatiyawinaka: appan jan ukax pilani radion"],
  "Radio Nacional (IRTP) es la radio del Estado: en una emergencia transmite los comunicados oficiales.": ["Radio Nacional (IRTP) is the State radio: in an emergency it broadcasts the official statements.", "Radio Nacional (IRTP) Estadopa radionmi: emergenciapi chiqap willakuykunata uyarichin.", "Radio Nacional (IRTP) Estadon radiopawa: emergencian chiqpach yatiyawinak ist'ayi."],
  "Sin internet, sintonízala en una radio a pilas. En Lima es 103.9 FM.": ["Without internet, tune in on a battery radio. In Lima it's 103.9 FM.", "Mana internetwanqa pilayuq radiopi uyariy. Limapiqa 103.9 FM.", "Jan internetampixa pilani radion ist'am. Limanxa 103.9 FM."],
  "Abrir la app oficial": ["Open the official app", "Chiqap appta kichay", "Chiqpach app jist'araña"],
  "Otras formas de escucharla (gob.pe)": ["Other ways to listen (gob.pe)", "Huk uyarina ñankuna (gob.pe)", "Yaqha ist'añ thakhinaka (gob.pe)"],
  "En una radio a pilas: 103.9 FM en Lima. Transmite los comunicados oficiales.": ["On a battery radio: 103.9 FM in Lima. It broadcasts the official statements.", "Pilayuq radiopi: Limapi 103.9 FM. Chiqap willakuykunata uyarichin.", "Pilani radion: Limanx 103.9 FM. Chiqpach yatiyawinak ist'ayi."]
};
