import type { Entries } from './entries';

/** SOS sheet, medical card, first aid, news reports, camera, backpack, mural, posts. */
export const SOS_REPORTS: Entries = {
  // SOS sheet
  "Geófono de muro y auxilio manos libres por voz": ["Wall geophone and hands-free voice SOS", "Pirqa geófono, makiwan mana llamk'aspa kunkawan yanapay", "Perqa geófono, jan amparampi arumpi yanapt'a"],
  // Fixes: "chawpi" (middle) and "thakhi" (path) do not mean a phone line; the Aymara alarm text was cut short.
  "Línea 119: mensajes de voz": ["Line 119: voice messages", "119 waqyana: kunkawan willakuykuna", "119 jawsaña: arut yatiyawinaka"],
  "Suena fuerte para que tus vecinos o los rescatistas te encuentren, incluso de noche o bajo escombros. Úsala solo en una emergencia real.": [
    "Sounds loudly so your neighbours or rescuers can find you, even at night or under rubble. Use it only in a real emergency.",
    "Qaparispa waqyan llaqtamasikikuna utaq qhispichiqkuna tarisunaykipaq, tutapipas utaq thunipakusqapipas. Chiqap sasachakuypillam llank'achiy.",
    "Ch'amampiw arxati, jak'a jaqinakamas jan ukax qhispiyirinakas jikxatapxañamataki, arumas jan ukax t'unjat manqhans. Chiqap emergenciankakiw apnaqañama."
  ],
  // "Karu rimana" is Quechua; Aymara uses the loanword.
  "Teléfono": ["Phone", "Karu rimana", "Telefono"],

  // Common buttons
  "Cancelar": ["Cancel", "Saqiy", "Jaytaña"],
  "Guardar": ["Save", "Waqaychay", "Imaña"],
  "Cerrar": ["Close", "Wichq'ay", "Jist'antaña"],
  "Quitar": ["Remove", "Qichuy", "Apsuña"],
  "Detener": ["Stop", "Sayachiy", "Sayt'ayaña"],
  "Imprimir": ["Print", "Imprimiy", "Imprimiña"],
  "Todos": ["All", "Llapan", "Taqpacha"],
  "Tú": ["You", "Qam", "Juma"],
  "Enviando...": ["Sending...", "Kachachkan...", "Apayaski..."],

  // Medical card
  "Cambiar mis datos": ["Edit my details", "Willakuyniyta t'ikray", "Yatiyawinakaj turkaña"],
  "Llenar mi ficha": ["Fill in my card", "Fichayta hunt'achiy", "Fichaj phuqhaña"],
  "Ficha médica": ["Medical card", "Hampi ficha", "Qullañ ficha"],
  "Para que un rescatista sepa tu tipo de sangre, tus alergias y a quién llamar. Se guarda solo en este teléfono y se abre sin internet.": [
    "So a rescuer knows your blood type, your allergies and who to call. It is saved only on this phone and opens without internet.",
    "Qhispichiq runa yawarniykip rikch'ayninta, alergiaykikunata, piman waqyanatapas yachananpaq. Kay celularllapim waqaychakun, mana internetwanpas kicharikun.",
    "Qhispiyirix wilaman kastapa, alergianakama, khitirus jawsañasa uk yatiñapataki. Aka celularankakiw imasi, jan internetampis jist'arasiwa."
  ],
  "Tu nombre completo": ["Your full name", "Hunt'asqa sutiyki", "Phuqhat sutima"],
  "Tipo de sangre": ["Blood type", "Yawar rikch'ay", "Wila kasta"],
  "No lo sé": ["I don't know", "Manam yachanichu", "Janiw yatkti"],
  "Alergias": ["Allergies", "Alergiakuna", "Alergianaka"],
  "Por ejemplo: penicilina": ["For example: penicillin", "Ahinataq: penicilina", "Uñacht'awi: penicilina"],
  "Enfermedades o medicinas que tomas": ["Illnesses or medicines you take", "Unquyniykikuna utaq upyasqayki hampikuna", "Usunakama jan ukax umt'ata qullanakama"],
  "Por ejemplo: diabetes, asma": ["For example: diabetes, asthma", "Ahinataq: diabetes, asma", "Uñacht'awi: diabetes, asma"],
  "A quién llamar": ["Who to call", "Piman waqyana", "Khitirus jawsaña"],
  "Nombre de un familiar": ["A relative's name", "Huk ayllumasiykip sutin", "Mä wila masin sutipa"],
  "Su celular": ["Their phone", "Celularnin", "Celularapa"],
  "Nombre": ["Name", "Suti", "Suti"],
  "No lo sabe": ["Unknown", "Mana yachanchu", "Janiw yatkiti"],
  "No anotó ninguna": ["None noted", "Manam imatapas qillqarqanchu", "Janiw kuns qillqt'kiti"],
  "Enfermedades o medicinas": ["Illnesses or medicines", "Unquykuna utaq hampikuna", "Usunaka jan ukax qullanaka"],
  "Familiar": ["Relative", "Ayllumasi", "Wila masi"],
  "Todavía no llenaste tu ficha. Toma un minuto y puede ayudar a salvarte.": [
    "You haven't filled in your card yet. It takes a minute and could help save you.",
    "Manaraqmi fichaykita hunt'achinkichu. Huk minutullam, qispichisunkimantaqmi.",
    "Janïraw fichama phuqhantati. Mä minutukiw, qhispiyañatakis yanapt'aspawa."
  ],

  // First aid (same steps, numbers and doses as the Spanish)
  "Pasos básicos mientras llega la ayuda. Funciona sin internet.": ["Basic steps while help is on the way. Works offline.", "Yanapay chayamunankama ruranapaq ñawpaq kamachikuykuna. Mana internetwanpas llamk'an.", "Yanapa purinkama lurañataki jasa thakhinaka. Jan internetampis irnaqi."],
  "Elige qué pasó": ["Choose what happened", "Ima pasasqanta akllay", "Kunas pasäna uk akllam"],
  "Sangrado fuerte": ["Heavy bleeding", "Sinchi yawar lluqsiy", "Wali wila mistuwi"],
  "Presiona directamente sobre la herida con un paño limpio o gasa, con fuerza y sin soltar.": [
    "Press directly on the wound with a clean cloth or gauze, firmly and without letting go.",
    "K'irip hawanpi ch'uya p'achawan utaq gasawan sinchita ñit'iy, ama kacharispa.",
    "Usuchjat patxaru q'uma isimpi jan ukax gasampi ch'amampi limt'am, jan antutasa."
  ],
  "No retires el paño aunque se empape; coloca otro encima y sigue presionando.": [
    "Don't take the cloth off even if it soaks through; put another one on top and keep pressing.",
    "Ama p'achata qichuychu yawarwan chiqchisqa kaptinpas; huktawan hawanman churay, ñit'iyta qatiy.",
    "Isix wilampi ch'aranchatäkchi ukasa jan apsumti; yaqha isi patxaru uchtam ukat limt'askakim."
  ],
  "Eleva la extremidad herida por encima del nivel del corazón si no hay fractura.": [
    "Raise the injured arm or leg above the level of the heart if there is no broken bone.",
    "K'irisqa makita utaq chakita sunqup hawanman huqariy, mana tullu p'akisqa kaptinqa.",
    "Usuchjat amparsa kayusa chuymat juk'amp alayaru aptam, jan ch'akha p'akjatäkchixa."
  ],
  "Mantén a la persona abrigada y acostada mientras llega ayuda. Llama al 106.": [
    "Keep the person warm and lying down until help arrives. Call 106.",
    "Runata q'uñichisqata, siriykachisqata waqaychay yanapay chayamunankama. 106 yupayman waqyay.",
    "Jaqirux q'unt'ayasa ikintayasa uñjam yanapa purinkama. 106 jakhur jawsam."
  ],
  "Atragantamiento": ["Choking", "Kunkapi chakaykukuy", "Kunkan jark'antasiña"],
  "Pregunta a la persona si puede hablar o toser. Si tose, anímala a seguir tosiendo.": [
    "Ask the person if they can speak or cough. If they cough, encourage them to keep coughing.",
    "Runata tapuy rimayta utaq uhuyta atisqanmanta. Uhuspaqa, uhuyta qatinanpaq kallpachay.",
    "Jaqiru jiskt'am arsuñ jan ukax ujuñ atispa. Ujuspaxa, ujuskakiñapatak ch'amancham."
  ],
  "Si no puede respirar ni hacer sonido: colócate detrás y rodea su cintura con tus brazos.": [
    "If they can't breathe or make a sound: stand behind them and put your arms around their waist.",
    "Mana samayta nitaq uyarichikuyta atispaqa: qhipanpi sayay, wiqawnintataq makiykikunawan muyuykuy.",
    "Jan samañ jan ukax arsuñ atkchixa: qhipapar sayt'am, ukat chika taypip amparanakamampi muyt'am."
  ],
  "Coloca un puño, con el pulgar hacia adentro, justo arriba del ombligo.": [
    "Place a fist, with the thumb tucked in, just above the belly button.",
    "Huk maki muquta, mama ruk'anata ukhuman qhawachispa, pupup hawallanpi churay.",
    "Mä muqu amparampi, jach'a luk'anap manqhar uñtayasa, pupu patxaru uchtam."
  ],
  "Cubre el puño con tu otra mano y presiona con fuerza hacia adentro y hacia arriba. Repite hasta que expulse el objeto.": [
    "Cover the fist with your other hand and press hard inwards and upwards. Repeat until the object comes out.",
    "Huk makiykiwan chay maki muquta qataykuy, sinchita ukhuman hanaqmanpas ñit'iy. Kaqllata ruray chakasqa ima lluqsimunankama.",
    "Yaqha amparamampi uka muqu amparar ch'ukuntam, ch'amampi manqhar alayarus limt'am. Uka yäx mistunkama kutt'ayam."
  ],
  "Si se desmaya, llama al 106 y empieza a presionar el pecho.": [
    "If they pass out, call 106 and start pressing on the chest.",
    "Yuyayninta chinkachiptinqa, 106 yupayman waqyay hinaspa qasqunta ñit'iyta qallariy.",
    "Amuyup chhaqtayxchixa, 106 jakhur jawsam ukat chuymap limt'añ qalltam."
  ],
  "Persona desmayada": ["Unconscious person", "Yuyayninta chinkachiq runa", "Amuyup chhaqtayir jaqi"],
  "Mira si respira: acerca tu mejilla a su boca durante 10 segundos.": [
    "Check if they are breathing: put your cheek close to their mouth for 10 seconds.",
    "Samasqanta qhaway: uyaykita siminman 10 segundo qayllachiy.",
    "Samaski uk uñjam: ajanuma lakapar 10 segundo jak'achtam."
  ],
  "Si respira: ponla de costado para que no se ahogue con la lengua o el vómito.": [
    "If they are breathing: lay them on their side so they don't choke on their tongue or vomit.",
    "Samaspaqa: waqtanman siriykachiy, ama qallunwan utaq aqtusqanwan chakaykukunanpaq.",
    "Samaskchixa: mä thiyaru ikintayam, laxrapampi jan ukax wiq'ichatapampi jan jararjañapataki."
  ],
  "Si no respira: pide que alguien llame al 106 o 116 y presiona fuerte en el centro del pecho, de 100 a 120 veces por minuto, sin parar hasta que llegue ayuda.": [
    "If they are not breathing: ask someone to call 106 or 116 and press hard in the centre of the chest, 100 to 120 times a minute, without stopping until help arrives.",
    "Mana samaptinqa: pipas 106 utaq 116 yupayman waqyananta mañakuy, qasqup chawpinpi sinchita ñit'iy, sapa minutupi 100 manta 120 kutikama, ama sayaspa yanapay chayamunankama.",
    "Jan samkchixa: maynir 106 jan ukax 116 jakhur jawsañap mayim, ukat chuyma taypin ch'amampi limt'am, sapa minutun 100 ukat 120 kutikama, jan sayt'asa yanapa purinkama."
  ],
  "Agua segura": ["Safe water", "Ch'uya yaku", "Q'uma uma"],
  "Si el agua está turbia, fíltrala primero con un paño limpio o una tela de algodón.": [
    "If the water is cloudy, first filter it through a clean cloth or a piece of cotton fabric.",
    "Yaku qunchu kaptinqa, ñawpaqta ch'uya p'achawan utaq algodón p'achawan suysuy.",
    "Umax q'añüchixa, nayraqat q'uma isimpi jan ukax algodón isimpi suysum."
  ],
  "Hiérvela a borbotones durante al menos 3 minutos.": [
    "Bring it to a rolling boil for at least 3 minutes.",
    "Sinchita t'impuchiy, aslla kaptinpas 3 minutu.",
    "Wali t'ixtayam, juk'akis 3 minuto."
  ],
  "Si no puedes hervirla: agrega 2 gotas de lejía sin aroma por cada litro (40 gotas, media cucharadita, para un bidón de 20 litros) y espera 30 minutos antes de tomarla.": [
    "If you can't boil it: add 2 drops of unscented bleach per litre (40 drops, half a teaspoon, for a 20-litre container) and wait 30 minutes before drinking it.",
    "T'impuchiyta mana atispaqa: sapa litruman 2 sut'uy mana q'apayniyuq lejíata yapay (40 sut'uy, huch'uy kucharap kuskan, 20 litruyuq bidónpaq) hinaspa 30 minutu suyay manaraq upyachkaspa.",
    "T'ixtayañ jan atkasmaxa: sapa litror 2 ch'aqa jan thujsani lejía yapam (40 ch'aqa, chikat jisk'a cuchara, 20 litro bidónataki) ukat 30 minuto suyt'am janïr umkasina."
  ],

  // Emergency backpack
  "Tienes {ready} de {total} cosas. Te faltan {missing}.": ["You have {ready} of {total} items. {missing} still missing.", "{total} kaqmanta {ready} kapusunki. {missing} pisisunki.", "{total} yänakat {ready} utjtam. {missing} pist'asktam."],

  // Printable neighbourhood board
  "Mural para imprimir": ["Board to print", "Imprimichinapaq mural", "Imprimiñataki mural"],
  "Para imprimirlo, abre ayllu-five.vercel.app en una computadora y entra a Ayuda.": [
    "To print it, open ayllu-five.vercel.app on a computer and go to Help.",
    "Impriminaykipaqqa, computadorapi ayllu-five.vercel.app kichay, Yanapayman yaykuy.",
    "Imprimiñatakix, mä computadoran ayllu-five.vercel.app jist'aram, Yanapañar mantam."
  ],
  "Pégalo en una bodega o en el tambo para los vecinos sin celular o cuando no haya luz.": [
    "Put it up in a corner shop or at the tambo for neighbours without a phone, or for when the power goes out.",
    "Huk bodegapi utaq tambopi k'askachiy, mana celularniyuq llaqtamasikunapaq utaq mana k'anchay kaptin.",
    "Mä tiendan jan ukax tambon k'askayam, jan celularani jak'a jaqinakataki jan ukax qhana jan utjkipan."
  ],
  "Mural del barrio": ["Neighbourhood board", "Llaqtap muralnin", "Markan muralapa"],
  "Red de vecinos AYLLU.": ["AYLLU neighbour network.", "AYLLU llaqtamasikunap llikan.", "AYLLU jak'a jaqinakan tamapa."],
  "Zona: {zone}.": ["Area: {zone}.", "K'iti: {zone}.", "Marka: {zone}."],
  "Actualizado el {date}.": ["Updated on {date}.", "{date} p'unchawpi musuqchasqa.", "{date} urun machaqar tukuyata."],
  "En una emergencia llama gratis, sin saldo": ["In an emergency, call for free, no credit needed", "Emergenciapiqa mana qullqiyuq waqyay, mana saldowan", "Emergencianxa inakiw jawsasma, jan saldompi"],
  "Ambulancia (SAMU)": ["Ambulance (SAMU)", "Ambulancia (SAMU)", "Ambulancia (SAMU)"],
  "Mensajes de voz en emergencias": ["Voice messages in emergencies", "Emergenciapi kunkawan willakuykuna", "Emergencianx arut yatiyawinaka"],
  "Pedidos y ofertas de ayuda": ["Requests and offers of help", "Yanapay mañakuykuna, quykunapas", "Yanapa mayiwinaka churawinakampi"],
  "Oficios recomendados por vecinos": ["Trades recommended by neighbours", "Llaqtamasikunap allin nisqan llamk'aykuna", "Jak'a jaqinakan aski sat lurawinaka"],
  "Préstamos y favores": ["Loans and favours", "Mañakuykuna, aynikunapas", "Mayt'awinaka yanapt'anakampi"],
  "Recomendado por {count} vecinos": ["Recommended by {count} neighbours", "{count} llaqtamasikuna allin ninku", "{count} jak'a jaqinakaw aski sapxi"],
  "La verdadera riqueza del barrio es la ayuda entre vecinos.": [
    "A neighbourhood's true wealth is neighbours helping each other.",
    "Llaqtap chiqap qhapaq kayninqa llaqtamasikunap yanapanakuyninmi.",
    "Markan chiqpach qamir kankañapax jak'a jaqinakan yanapt'asiwipawa."
  ],

  // News report form and photo checks
  "¿Qué pasó?": ["What happened?", "¿Imataq pasarqa?", "¿Kunas pasäna?"],
  "Accidente": ["Accident", "Accidente", "Accidente"],
  "Huaico": ["Landslide", "Lluklla", "Lloclla"],
  "Inundación": ["Flood", "Yaku hunt'ay", "Uma phuqhantawi"],
  "Incendio": ["Fire", "Nina rawray", "Nina nakhawi"],
  "Sismo": ["Earthquake", "Pacha kuyuy", "Uraq khathati"],
  "Otro": ["Other", "Huk", "Yaqha"],
  "Aviso": ["Notice", "Willakuy", "Yatiyawi"],
  "Un vecino": ["A neighbour", "Huk llaqtamasi", "Mä jak'a jaqi"],
  "Publicar noticia": ["Post news", "Willakuyta willay", "Yatiyawi yatiyaña"],
  "Necesitas internet para enviar una noticia. Si es urgente, toca SOS.": [
    "You need internet to send a news report. If it's urgent, tap SOS.",
    "Willakuy kachanaykipaqqa internet munakun. Usqhaylla kaptinqa, SOS ñit'iy.",
    "Yatiyawi apayañatakix internet munasi. Jank'akïchixa, SOS limt'am."
  ],
  "Agregar foto o video": ["Add a photo or video", "Fotota utaq videota yapay", "Foto jan ukax video yapaña"],
  "Vista previa": ["Preview", "Ñawpaqta qhaway", "Nayrat uñjaña"],
  "Revisando el archivo...": ["Checking the file...", "Archivota qhawachkan...", "Archivo uñakipaski..."],
  "Tomar foto": ["Take photo", "Fotota hurquy", "Foto apsuña"],
  "Grabar video": ["Record video", "Videota grabay", "Video grabaña"],
  "Elegir archivo": ["Choose file", "Archivota akllay", "Archivo akllaña"],
  "Opcional. Video de hasta 1 minuto.": ["Optional. Video up to 1 minute.", "Munaspaqa. Video 1 minutukama.", "Munasaxa. Video 1 minutokama."],
  "Cuéntalo en pocas palabras": ["Tell it in a few words", "Pisi simillapi willay", "Juk'a arunakampi yatiyam"],
  "Este archivo no se puede publicar.": ["This file can't be posted.", "Kay archivota manam willayta atikunchu.", "Aka archivox janiw yatiyañjamäkiti."],
  "Elige una foto o un video.": ["Choose a photo or a video.", "Huk fotota utaq videota akllay.", "Mä foto jan ukax video akllam."],
  "El archivo pesa más de 50 MB. Graba un video más corto o de menor calidad.": [
    "The file is over 50 MB. Record a shorter or lower-quality video.",
    "Archivoqa 50 MB nisqamanta aswan llasan. Aswan pisi videota utaq pisi calidadniyuqta grabay.",
    "Archivox 50 MB ukat juk'amp jathiwa. Juk'amp jisk'a jan ukax juk'a calidadani video grabam."
  ],
  "El video dura más de 1 minuto. Graba uno más corto.": ["The video is longer than 1 minute. Record a shorter one.", "Videoqa 1 minutumanta aswan unaymi. Aswan pisillata grabay.", "Videox 1 minutot juk'amp jaya. Juk'amp jisk'a grabam."],
  "Este video no se puede publicar: tiene contenido prohibido.": ["This video can't be posted: it has forbidden content.", "Kay videota manam willayta atikunchu: hark'asqa imakunayuqmi.", "Aka videox janiw yatiyañjamäkiti: jark'ata yänakaniwa."],
  "Esta foto no se puede publicar: tiene contenido prohibido.": ["This photo can't be posted: it has forbidden content.", "Kay fotota manam willayta atikunchu: hark'asqa imakunayuqmi.", "Aka fotox janiw yatiyañjamäkiti: jark'ata yänakaniwa."],
  "Esto parece publicidad. Para ofrecer algo, usa Publicar y elige \"Ofrezco mi trabajo\".": [
    "This looks like advertising. To offer something, use Post and choose \"I offer my work\".",
    "Kayqa publicidad hinam. Imatapas haywarinaykipaqqa, \"Aylluman willay\" ñit'iy hinaspa \"Llamk'ayniyta haywarini\" akllay.",
    "Akax publicidad ukhamawa. Kunsa churañatakix, \"Yatiyaña\" limt'am ukat \"Irnaqawij churta\" akllam."
  ],
  "Ya publicaste varias noticias. Espera un momento.": ["You've already posted several news reports. Wait a moment.", "Achka willakuykunatañam willarqanki. Huk ratota suyay.", "Walja yatiyawinakaw yatiyxtaxa. Mä juk'a suyt'am."],
  "Noticia publicada": ["News posted", "Willakuyqa willasqañam", "Yatiyawix yatiyatäxiwa"],
  "Un moderador la revisará antes de publicarla.": ["A moderator will review it before it's posted.", "Huk qhawaqmi qhawanqa manaraq willakuchkaspa.", "Mä uñjiriw uñakipani janïr yatiykasina."],
  "Muchas personas empezaron a usar AYLLU desde esta misma red. Espera unos minutos y vuelve a intentar.": [
    "Many people started using AYLLU from this same network. Wait a few minutes and try again.",
    "Achka runakunam kay kikin llikamanta AYLLUta llamk'achiyta qallarirqanku. Wakin minutukunata suyay, kaqmanta yant'ay.",
    "Walja jaqinakaw aka pachpa red tuqit AYLLU apnaqañ qalltapxi. Mä qawqha minuto suyt'am ukat wasitat yant'am."
  ],
  "No se pudo enviar. Revisa tu internet y vuelve a intentar.": ["Couldn't send. Check your internet and try again.", "Manam kachayta atikunchu. Internetniykita qhaway, kaqmanta yant'ay.", "Janiw apayañjamäkiti. Internetam uñakipam ukat wasitat yant'am."],

  // Camera
  "Falta el permiso de la cámara. Actívalo en los ajustes o elige un archivo.": ["Camera permission is missing. Turn it on in settings or choose a file.", "Cámarapaq saqillay pisin. Ajustekunapi kichay utaq archivota akllay.", "Cámaratak permiso pisiwa. Ajustenakan jist'aram jan ukax archivo akllam."],
  "Este equipo no tiene cámara. Puedes elegir un archivo.": ["This device has no camera. You can choose a file.", "Kay equipoqa manam cámarayuqchu. Archivota akllayta atinki.", "Aka equipox janiw cámaranïkiti. Archivo akllasmawa."],
  "No se pudo abrir la cámara. Puedes elegir un archivo.": ["Couldn't open the camera. You can choose a file.", "Manam cámarata kichayta atikunchu. Archivota akllayta atinki.", "Janiw cámara jist'arañjamäkiti. Archivo akllasmawa."],
  "Este equipo no puede grabar video. Puedes elegir un archivo.": ["This device can't record video. You can choose a file.", "Kay equipoqa manam videota grabayta atinchu. Archivota akllayta atinki.", "Aka equipox janiw video grabañ atkiti. Archivo akllasmawa."],
  "Empezar a grabar": ["Start recording", "Grabayta qallariy", "Grabañ qalltaña"],
  "Cerrar cámara": ["Close camera", "Cámarata wichq'ay", "Cámara jist'antaña"],
  "{elapsed} de 1:00": ["{elapsed} of 1:00", "{elapsed} / 1:00", "{elapsed} / 1:00"],
  "Cambiar de cámara": ["Switch camera", "Cámarata t'ikray", "Cámara turkaña"],

  // Reporting abuse and comments
  "Para denunciar una noticia necesitas entrar con tu código de usuario.": ["To report a news item you need to sign in with your user code.", "Willakuyta willanakunaykipaqqa kodigoykiwan yaykunaykim tiyan.", "Mä yatiyawi qhanstañatakix codigomampi mantañamawa."],
  "Necesitas internet para denunciar.": ["You need internet to report.", "Willanakunaykipaqqa internet munakun.", "Qhanstañatakix internet munasi."],
  "Gracias. Lo revisaremos.": ["Thank you. We'll look into it.", "Añay. Qhawasaqkum.", "Yuspajara. Uñakipapxäwa."],
  "No se pudo enviar. Vuelve a intentar.": ["Couldn't send. Try again.", "Manam kachayta atikunchu. Kaqmanta yant'ay.", "Janiw apayañjamäkiti. Wasitat yant'am."],
  "Ya la denunciaste": ["You already reported it", "Willanakurqankiñam", "Qhanstxtawa"],
  "Para comentar necesitas entrar con tu código de usuario.": ["To comment you need to sign in with your user code.", "Rimanaykipaqqa kodigoykiwan yaykunaykim tiyan.", "Arsuñatakix codigomampi mantañamawa."],
  "Escribe tu comentario, de hasta 500 letras.": ["Write your comment, up to 500 characters.", "Rimayniykita qillqay, 500 qillqakama.", "Arsuwima qillqt'am, 500 qillqakama."],
  "Esta noticia ya no está publicada.": ["This news item is no longer posted.", "Kay willakuyqa manañam rikuchikunchu.", "Aka yatiyawix janiw uñacht'ayatäxiti."],
  "Ya comentaste mucho en la última hora. Vuelve a intentar más tarde.": ["You've commented a lot in the last hour. Try again later.", "Kay qhipa horapi achkatañam rimarqanki. Qhipaman kaqmanta yant'ay.", "Aka qhipa horanx walja arsxtaxa. Qhipatx wasitat yant'am."],
  "No se pudo enviar el comentario. Intenta de nuevo.": ["Couldn't send the comment. Try again.", "Manam rimayta kachayta atikunchu. Kaqmanta yant'ay.", "Janiw arsuwi apayañjamäkiti. Wasitat yant'am."],
  "No se pudo borrar el comentario.": ["Couldn't delete the comment.", "Manam rimayta pichayta atikunchu.", "Janiw arsuwi pichsuñjamäkiti."],
  "Pregunta qué pasó, dónde, o si alguien necesita ayuda.": ["Ask what happened, where, or if anyone needs help.", "Tapuy imataq pasarqa, maypi, utaq pipas yanapata munanchu.", "Jiskt'am kunas pasäna, kawkinsa, jan ukax khitis yanapa munaspa."],
  "Cargando comentarios...": ["Loading comments...", "Rimaykunata apamuchkan...", "Arsuwinak apaniski..."],
  "Todavía no hay comentarios. Sé el primero.": ["No comments yet. Be the first.", "Manaraqmi rimaykuna kanchu. Ñawpaqta rimay.", "Janïraw arsuwinakax utjkiti. Nayraqat arsum."],
  "Borrar mi comentario": ["Delete my comment", "Rimayniyta pichay", "Arsuwij pichsuña"],
  "Tu comentario": ["Your comment", "Rimayniyki", "Arsuwima"],
  "¿Qué pasó? ¿Hay heridos? ¿Se puede pasar?": ["What happened? Is anyone hurt? Can people get through?", "¿Imataq pasarqa? ¿K'irisqakuna kanchu? ¿Puriyta atikunchu?", "¿Kunas pasäna? ¿Usuchjatanakax utjiti? ¿Sarañjamäspati?"],
  "Entra con tu código para comentar": ["Sign in with your code to comment", "Kodigoykiwan yaykuy rimanaykipaq", "Codigomampi mantam arsuñataki"],

  // News screen and cards
  "Noticias": ["News", "Willakuykuna", "Yatiyawinaka"],
  "{time}, por {name}": ["{time}, by {name}", "{time}, {name} willarqa", "{time}, {name} yatiyi"],
  "{kind} en {place}": ["{kind} in {place}", "{kind} {place}pi", "{kind} {place}na"],
  "Ver la noticia y los comentarios": ["See the news and comments", "Willakuyta rimaykunatapas qhaway", "Yatiyawi arsuwinakamp uñjaña"],
  "En revisión": ["Under review", "Qhawasqa kachkan", "Uñakipaski"],
  "Buscando noticias...": ["Looking for news...", "Willakuykunata maskachkan...", "Yatiyawinak thaqhaski..."],
  "Todavía no hay noticias aquí": ["No news here yet", "Manaraqmi kaypi willakuykuna kanchu", "Janïraw akan yatiyawinakax utjkiti"],
  "Avisa a tus vecinos si pasa algo en tu zona.": ["Let your neighbours know if something happens in your area.", "Llaqtamasiykikunaman willay k'itiykipi imapas pasaptin.", "Jak'a jaqinakamar yatiyam markaman kunas pasaspa."],

  // Nearby help
  "Guardado {time}, sin internet.": ["Saved {time}, offline.", "{time} waqaychasqa, mana internetwan.", "{time} imata, jan internet."],
  "Llamar al {phone}": ["Call {phone}", "{phone} yupayman waqyay", "{phone} jakhur jawsaña"],
  "Ver cómo llegar": ["See directions", "Imayna chayanata qhaway", "Kunjams puriña uñjaña"],

  // Post detail
  "Hola {name}, te escribo por \"{title}\" que vi en AYLLU.": [
    "Hi {name}, I'm writing about \"{title}\" that I saw on AYLLU.",
    "Napaykullayki {name}, AYLLUpi rikusqay \"{title}\" nisqamanta qillqamuyki.",
    "Kamisaki {name}, AYLLUn uñjta uka \"{title}\" layku qillqt'sma."
  ],
  "Número copiado. Pégalo en Yape o Plin.": ["Number copied. Paste it in Yape or Plin.", "Yupayqa copiasqañam. Yapepi utaq Plinpi k'askachiy.", "Jakhux copiatäxiwa. Yape jan ukax Plin ukan k'askayam."],
  "Foto {number}": ["Photo {number}", "Foto {number}", "Foto {number}"],
  "Para recomendar o comentar necesitas entrar con tu código de usuario.": [
    "To recommend or comment you need to sign in with your user code.",
    "Allin ninaykipaq utaq rimanaykipaqqa kodigoykiwan yaykunaykim tiyan.",
    "Aski sañataki jan ukax arsuñatakix codigomampi mantañamawa."
  ],
};
