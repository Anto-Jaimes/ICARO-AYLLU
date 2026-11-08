import type { Entries } from './entries';

/**
 * Closing the session and coming back with the verified number. Quechua and Aymara are a careful draft
 * for a native speaker to check, as the rest of the app.
 */
export const ACCOUNT: Entries = {
  // Help menu
  "Cerrar sesión": ["Sign out", "Sesionta wichq'ay", "Sesión jist'antaña"],
  "Para volver, entras con tu número": ["To come back, you sign in with your number", "Kutimunaykipaqqa yupayniykiwan yaykunki", "Kutt'aniñatakix jakhumampiw mantäta"],
  "Solo en esta computadora. Tu celular sigue con tu cuenta": ["Only on this computer. Your phone keeps your account", "Kay computadorallapi. Celularniykiqa cuentaykiwan hinallam", "Aka computadorankiki. Celularamax cuentamampiskipuniwa"],
  "Cerraste sesión en esta computadora. Tu celular sigue con tu cuenta.": ["You signed out on this computer. Your phone keeps your account.", "Kay computadorapi sesionta wichq'arqanki. Celularniykiqa cuentaykiwan hinallam.", "Aka computadoran sesión jist'antta. Celularamax cuentamampiskipuniwa."],

  // Confirming "Cerrar sesión" in the app
  "Para volver a esta cuenta toca \"Entrar con mi número\": te llamaremos al {phone} y te dictaremos un código.": ["To come back to this account tap \"Sign in with my number\": we'll call {phone} and read you a code.", "Kay cuentaman kutimunaykipaqqa \"Yupayniywan yaykuy\" ñit'iy: {phone} yupayman waqyasqayki, huk kodigotam willasqayki.", "Aka cuentar kutt'aniñatakix \"Jakhujampi mantaña\" ch'iqt'am: {phone} jakhuru jawsämawa, mä codigo yatiyämawa."],
  "Tu número no está verificado.": ["Your number isn't verified.", "Yupayniykiqa manam chiqanchasqachu.", "Jakhumax janiw chiqanchatäkiti."],
  "Si cierras sesión, no podrás volver a esta cuenta (código {code}) ni a tus publicaciones.": ["If you sign out, you won't be able to come back to this account (code {code}) or to your posts.", "Sesionta wichq'aspaqa, manam kay cuentaman (kodigo {code}) nitaq willakuyniykikunaman kutimuyta atinkichu.", "Sesión jist'antasmax, janiw aka cuentar (codigo {code}) ni yatiyawinakamar kutt'aniñ atkätati."],
  "Si cierras sesión, no podrás volver a esta cuenta ni a tus publicaciones.": ["If you sign out, you won't be able to come back to this account or to your posts.", "Sesionta wichq'aspaqa, manam kay cuentaman nitaq willakuyniykikunaman kutimuyta atinkichu.", "Sesión jist'antasmax, janiw aka cuentar ni yatiyawinakamar kutt'aniñ atkätati."],
  "Sin internet no podemos revisar si tu número está verificado. Sin un número verificado no podrás volver a esta cuenta.": ["Without internet we can't check whether your number is verified. Without a verified number you won't be able to come back to this account.", "Mana internetwanqa manam qhawayta atiykuchu yupayniyki chiqanchasqa kasqanta. Mana chiqanchasqa yupaywanqa manam kay cuentaman kutimuyta atinkichu.", "Jan internetampix janiw uñakipañ atkti jakhumax chiqanchatächi uk. Jan chiqanchata jakhumpix janiw aka cuentar kutt'aniñ atkätati."],
  "Verificar mi número primero": ["Verify my number first", "Ñawpaqta yupayniyta chiqanchay", "Nayraqat jakhuj chiqanchaña"],
  "Cerrar sesión igual": ["Sign out anyway", "Chaywanpas sesionta wichq'ay", "Ukhamarus sesión jist'antaña"],
  "Cerraste sesión en este celular. Para volver, toca Ayuda y \"Entrar con mi número\".": ["You signed out on this phone. To come back, tap Help and \"Sign in with my number\".", "Kay celularpi sesionta wichq'arqanki. Kutimunaykipaqqa Yanapay, \"Yupayniywan yaykuy\" ñit'iy.", "Aka celularan sesión jist'antta. Kutt'aniñatakix Yanapaña, \"Jakhujampi mantaña\" ch'iqt'am."],

  // Coming back in
  "Entrar a AYLLU": ["Sign in to AYLLU", "AYLLUman yaykuy", "AYLLUru mantaña"],
  "Cerraste sesión en este celular. Para publicar, comentar y llamar, vuelve a entrar.": ["You signed out on this phone. To post, comment and call, sign in again.", "Kay celularpi sesionta wichq'arqanki. Willanaykipaq, rimanaykipaq, waqyanaykipaqpas kaqmanta yaykuy.", "Aka celularan sesión jist'antta. Yatiyañataki, arsuñataki, jawsañatakisa wasitat mantam."],
  "Entrar con mi número": ["Sign in with my number", "Yupayniywan yaykuy", "Jakhujampi mantaña"],
  "Escribe el número que verificaste en AYLLU. Te llamamos gratis y te dictamos un código de 4 cifras.": ["Type the number you verified in AYLLU. We call you for free and read you a 4-digit code.", "AYLLUpi chiqanchasqayki yupayta qillqay. Mana qullqiyuqmi waqyayki, 4 yupayniyuq kodigotam willayki.", "AYLLUn chiqanchkta uka jakhu qillqt'am. Inakiw jawsapxsma, 4 jakhuni codigo yatiyapxsma."],
  "Llamarme con mi código": ["Call me with my code", "Kodigoywan waqyaway", "Codigojampi jawsitapxita"],
  "Necesitas internet para volver a entrar.": ["You need internet to sign in again.", "Kaqmanta yaykunaykipaqqa internet kananmi.", "Wasitat mantañatakix internet munasiwa."],
  "¿No verificaste tu número?": ["Didn't verify your number?", "¿Manachu yupayniykita chiqancharqanki?", "¿Janit jakhuma chiqanchkta?"],
  "Puedes empezar con una cuenta nueva y un código nuevo. Tu cuenta anterior no se borra, pero sin número verificado no hay cómo volver a ella.": ["You can start with a new account and a new code. Your previous account isn't deleted, but without a verified number there's no way back to it.", "Musuq cuentawan musuq kodigowanmi qallariyta atinki. Ñawpaq cuentaykiqa manam pichakunchu, ichaqa mana chiqanchasqa yupaywanqa manam kutimuyta atikunchu.", "Machaq cuentampi machaq codigompiw qalltasma. Nayra cuentamax janiw chhaqtaykiti, ukampis jan chiqanchata jakhumpix janiw kutt'aniñ atiskiti."],
  "Empezar con una cuenta nueva": ["Start with a new account", "Musuq cuentawan qallariy", "Machaq cuentampi qalltaña"],
  "Sin entrar puedes ver las publicaciones y leer los comentarios, pero no publicar, comentar, recomendar ni llamar.": ["Without signing in you can see posts and read comments, but not post, comment, recommend or call.", "Mana yaykuspaqa willakuykunata qhawaytam, rimasqakunata ñawinchaytam atinki, ichaqa manam willayta, rimayta, yupaychayta nitaq waqyayta atinkichu.", "Jan mantasax yatiyawinak uñjasma, arsutanak liyt'asmawa, ukampis janiw yatiyaña, arsuña, iyawsaña ni jawsañ atkätati."],
  "Volviste a tu cuenta. Ya puedes publicar, comentar y llamar.": ["You're back in your account. Now you can post, comment and call.", "Cuentaykimanmi kutimurqanki. Kunanqa willayta, rimayta, waqyaytapas atinkiña.", "Cuentamaruw kutt'anta. Jichhax yatiyaña, arsuña, jawsañ atxtawa."],
  "Empezaste con una cuenta nueva. Tu código nuevo está en Ayuda.": ["You started with a new account. Your new code is in Help.", "Musuq cuentawanmi qallarirqanki. Musuq kodigoykiqa Yanapaypim.", "Machaq cuentampiw qalltta. Machaq codigomax Yanapañanwa."],
  "Para llamar gratis vuelve a entrar con tu número. En una emergencia marca 105, 106 o 116 desde cualquier celular: son gratis.": ["To call for free, sign in again with your number. In an emergency dial 105, 106 or 116 from any phone: they're free.", "Mana qullqiwan waqyanaykipaqqa yupayniykiwan kaqmanta yaykuy. Emergenciapiqa 105, 106 utaq 116 ñit'iy ima celularmantapas: mana qullqiyuqmi.", "Inaki jawsañatakix jakhumampi wasitat mantam. Emergenciankasax 105, 106 jan ukax 116 ch'iqt'am kuna celularatsa: inakiwa."],

  // Problems
  "Escribe tu celular: 9 números que empiezan con 9.": ["Type your mobile number: 9 digits starting with 9.", "Celularniykita qillqay: 9 yupaykuna, 9-wan qallariq.", "Celularam qillqt'am: 9 jakhunaka, 9-mpi qalltiri."],
  "Este número no puede usar AYLLU por una denuncia.": ["This number can't use AYLLU because of a report.", "Kay yupayqa manam AYLLUta llamk'achiyta atinchu, huk willanakuy kasqanrayku.", "Aka jakhux janiw AYLLU apnaqkaspati, mä jucharuwa."],
  "Ese número no está verificado en ninguna cuenta de AYLLU. Si nunca lo verificaste, empieza con una cuenta nueva.": ["That number isn't verified on any AYLLU account. If you never verified it, start with a new account.", "Chay yupayqa manam mayqin AYLLU cuentapipas chiqanchasqachu. Mana haykapipas chiqanchaspaqa, musuq cuentawan qallariy.", "Uka jakhux janiw kuna AYLLU cuentansa chiqanchatäkiti. Janipuniw chiqanchkta ukhaxa, machaq cuentampi qalltam."],
  "Ya pedimos 3 llamadas hoy para ese número. Vuelve a intentar mañana.": ["We already asked for 3 calls today for that number. Try again tomorrow.", "Kunan punchaw chay yupaypaq 3 waqyaytaña mañakurqayku. Paqarin kaqmanta yant'ay.", "Jichhürux 3 jawsäw uka jakhutakix mayt'xapxtwa. Qharürux wasitat yant'am."],
  "Ese código no coincide o ya venció. Revísalo, o pide otra llamada.": ["That code doesn't match or has expired. Check it, or ask for another call.", "Chay kodigoqa manam tupanchu utaq tukukurqanña. Qhawariy, utaq huk waqyayta mañakuy.", "Uka codigox janiw kikipäkiti jan ukax tukusxiwa. Uñakipt'am, jan ukax yaqha jawsäw mayt'am."],
  "Demasiados intentos con ese código. Pide otra llamada.": ["Too many tries with that code. Ask for another call.", "Chay kodigowan ancha achkha yant'aykuna. Huk waqyayta mañakuy.", "Uka codigompix sinti walja yant'awinaka. Yaqha jawsäw mayt'am."]
};
