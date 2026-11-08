import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { canSpeak, speak, stopSpeaking } from '../utils/audioGuide';

interface AudioGuideButtonProps {
  className?: string;
  screenTitle?: string;
}

export const AudioGuideButton: React.FC<AudioGuideButtonProps> = ({ className = '' }) => {
  const { mode, tab, userLocation, hasLocation, items, isAlertsOpen, isNewsOpen, showNotice } = useApp();
  const { lang, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wasStopped = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!canSpeak()) return null;

  const spokenText = (): string => {
    if (mode === 'emergency') {
      switch (lang) {
        case 'qu':
          return 'Sasachakuy pata kichasqa kashan. Kaypim rikunki wasi masikunata yanapayta mañakuqkunata, qasi kaway pukyukuna huñukunatapas. Bomberosman waqyanaykipaq qillqay pachak chunka soqtayoqta (116). Policiapaq pachak phisqayoqta (105). Utaq puka S.O.S. botonta ñit’iy.';
        case 'qu-cen':
          return 'Sasakuy pacha kichashqam kaykan. Kaychawmi rikakunki wahi masikikunata yanapata mañakuykaqta, allin qillpakunata, huñukunatapis. Bomberosman qayaypaq 116. Policiapaq 105. Manaqa puka S.O.S. botonta ñitiy.';
        case 'ay':
          return 'Aka pachax ch\'axwa pachawa. Aka uñtañanx uñjataraktwa uta masinakarux yanapt\'a mayisirinaka, qhantati cheqanaka. Bomberos jawsañatakix 116. Policiarux 105. Jan ukax wila S.O.S. thaqtäwix ch\'ipxtayma.';
        case 'cni':
          return 'Katsinkari ashinonkatantsi kapyaji. Aka pamene piñaajeitakeri pitstakoite katsinkari amitarori, pankotsi tsimeyetatsiri. Bomberos pikenkithatake 116. Policía pikenkithatake 105. Eero katsinkari pamatakenari S.O.S.';
        case 'en':
          return 'Emergency mode active. Here you see neighbours asking for urgent help, safe shelters and support groups. For Firefighters dial 116. For Police dial 105. Or tap the red SOS button.';
        default:
          return 'Modo emergencia activado. En esta pantalla puedes ver a los vecinos que necesitan ayuda urgente, puntos seguros y los grupos de apoyo. Para llamar a los Bomberos marca el ciento dieciséis. Para la Policía, el ciento cinco. O toca el botón rojo S.O.S.';
      }
    }

    if (isAlertsOpen) {
      switch (lang) {
        case 'qu':
          return 'Piruw suyupa willakuyninkuna. Kaypim rikunki IGP pacha kuyuyta SENAMHI para llukllatapas.';
        case 'qu-cen':
          return 'Piruw suyupa kikin willakuyninkuna. Kaychawmi rikakun IGP allpa siksiyta SENAMHI tamya llocllatapis.';
        case 'ay':
          return 'Perú markan yatiyawinaka. IGP uraq khathatirinaka SENAMHI jallu llocllanaka uñjataraktwa.';
        case 'cni':
          return 'Kamantsi Perú. Aka pamene IGP kipatsi omoryanintake aisati SENAMHI inkaare katsinkari.';
        case 'en':
          return 'Official alerts for Peru. Here you see earthquakes from IGP and rain or landslide warnings from SENAMHI.';
        default:
          return 'Alertas oficiales del Perú. Aquí verás los sismos del Instituto Geofísico del Perú y los avisos de lluvias o huaicos del Senamhi.';
      }
    }

    if (isNewsOpen) {
      switch (lang) {
        case 'qu':
          return 'Llaqtaykipa willakuyninkuna. Wasi masikunam fotokunata willaykunatapas apachinku imachus kasqanta.';
        case 'qu-cen':
          return 'Markaykipa willakuyninkuna. Wahi masikunam fotokunata willakuykunatapis churayan imapis kashqanta.';
        case 'ay':
          return 'Markaman yatiyawinaka. Uta masinakax fotonaka yatiyawinaka apayanipxi kamsasisa markanx.';
        case 'cni':
          return 'Kamantsitsipage piñampite. Nampitarori ipajeita fotopaye aisati kamantsitsipage tsika ikantajeita.';
        case 'en':
          return 'News from your area. Neighbours share photos and notices of what is happening around you.';
        default:
          return 'Noticias de tu barrio. Aquí los vecinos comparten fotos y avisos de lo que pasa en tu zona.';
      }
    }

    if (tab === 'services') {
      switch (lang) {
        case 'qu':
          return 'Llaqtaykipa llamk\'ayninkuna. Kaypim tarikun gasfitería, electricidad, cerrajería llapan ima, wasi masikikunap munasqan. Ñit\'iy llamk\'ayta rimapayanaykipaq.';
        case 'qu-cen':
          return 'Markaykipa aruyninkuna. Kaychawmi tarinki gasfitería, electricidad, cerrajería, wahi masikikunapa allin nisqan. Ñitiy aruyta qayapayanaykipaq.';
        case 'ay':
          return 'Markaman irnaqawinaka. Akana jikxattawa gasfitería, electricidad, cerrajería, uta masinakan yuspajaratawa. Irnaqawi ch\'ipxtayma parlañataki.';
        case 'cni':
          return 'Antavaitantsi nampitsiki. Aka pineero gasfitería, electricidad, cerrajería, maaroni amitakojeitiri. Pamene antavaitantsi pikenkithatakeri.';
        case 'en':
          return 'Services in your area. Find plumbing, electrical, lock repair and more, recommended by your neighbours. Tap a service to contact them.';
        default:
          return 'Oficios de tu barrio. Aquí encuentras gasfitería, electricidad, cerrajería y más, recomendados por tus propios vecinos. Toca un servicio para ver cómo contactarlo.';
      }
    }

    if (tab === 'favors') {
      switch (lang) {
        case 'qu':
          return 'Ayni llaqtamasikunawan. Kaypim llaqtamasikuna herramientas nisqata manukuchinku, mana qullqillapaq yanapanku. Ñit\'iy aynita rimanakunaykipaq.';
        case 'qu-cen':
          return 'Ayni wahi masikunawan. Kaychawmi wahi masikuna herramientakunata manunakuyan, mana qillayllapaq yanapanakuyan. Ñitiy aynita rimanapaq.';
        case 'ay':
          return 'Ayni uta masinaka taypina. Uta masinakax herramientanaka mayt\'asipxi, jan qullqitakisa yanapt\'apxiwa. Ayni ch\'ipxtayma parlañataki.';
        case 'cni':
          return 'Amitakotaventa nampitarori. Nampitarori ipajeita herramientapaye, amitakotaventa eero pipinate. Pamene amitakotaventa pikenkithatake.';
        case 'en':
          return 'Neighbour favours. People lend tools like drills or ladders, and offer help without charging. Tap a favour to coordinate.';
        default:
          return 'Favores entre vecinos. Aquí los vecinos prestan herramientas como taladros o escaleras, y ofrecen ayuda sin cobrar. Toca un favor para coordinar.';
      }
    }

    if (tab === 'map') {
      switch (lang) {
        case 'qu':
          return 'Saywiti llaqtaykimanta. Llimp\'i muyukunaqa llamk\'aykunata, aynikunata, qasi kaway tarina puquykunatam qhawachin qayllaykipi.';
        case 'qu-cen':
          return 'Markaykipa saywitin. Tiksi llimpiykunaqa aruykunata, aynikunata, allin qillpakunatam rikachikun kikillaykichaw.';
        case 'ay':
          return 'Markaman uraqpampa jamuqata. Samisi muyukuna irnaqawinaka, ayninaka, qhantati cheqanaka uñacht\'ayi.';
        case 'cni':
          return 'Kipatsi katsinka. Oponkaro katsinkaripaye pamene antavaitantsi, amitakotaventa aisati pankotsi tsimeyetatsiri.';
        case 'en':
          return 'Map of your area. Coloured circles show services, favours and emergency safe places near you.';
        default:
          return 'Mapa de tu zona. Los círculos de colores muestran los oficios, los favores y los puntos de emergencia cerca de ti.';
      }
    }

    const nearby = items.filter((item) => item.type === 'service' || item.type === 'favor_offer').length;
    const place = hasLocation ? `${userLocation.name}. ` : '';

    switch (lang) {
      case 'qu':
        return `Allillanchu AYLLU-man chayamusqayki, wasi masikunap llikan. ${place ? `${place} llaqtapim kashanki. ` : ''}Qayllaykipi kashan ${nearby} llamk'aykuna ayniwan yanapanakuykuna. Uraypim kashan puka S.O.S. sasachakuykunapaq, mana internetniyoq llank'aq, anqas botontapas willakunaykipaq.`;
      case 'qu-cen':
        return `Allillaku AYLLU-man chayamushqayki, wahi masikikunapa llikan. ${place ? `${place} markachawmi kaykanki. ` : ''}Kikillaykichawmi kapun ${nearby} aruykuna aynikunawan yanapanakunapaq. Uraychawmi kapushunki puka S.O.S. sasakuykunapaq, mana internetwan, hinaspa anqash botón willakunapaq.`;
      case 'ay':
        return `Kamisaraki AYLLU quturu purinitama, uta masinakan llikapa. ${place ? `${place} markanwa jikxattasïta. ` : ''}Qayllanx ${nearby} aru irnaqawinaka ayninakax utjiwa. Manqhanx wila S.O.S. botunax utjiwa, jan internetampis ch'amaniraquiwa.`;
      case 'cni':
        return `Kitaiteri! Pipokajeite AYLLU nampitsi. ${place ? `${place}-ki piñaatsi. ` : ''}Aka pineero ${nearby} antavaitantsi aisati amitakotaventa nampitarori. Isaviki oitoki katsinkari puka S.O.S., tema tekatsi interneti, aisati kamantantsi.`;
      case 'en':
        return `Welcome to AYLLU, your neighbourhood network. ${place ? `You are in ${place}. ` : ''}There are ${nearby} services and favours near you. Below is the red SOS button for emergencies, and the blue button to post.`;
      default:
        return `Bienvenido a AYLLU, tu red de vecinos. ${place ? `Estás en ${place}. ` : ''}Hay ${nearby} oficios y favores cerca de ti. Abajo tienes el botón rojo S.O.S. para emergencias, que funciona sin internet ni saldo, y el botón azul para publicar.`;
    }
  };

  const toggle = () => {
    if (isSpeaking) {
      wasStopped.current = true;
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    wasStopped.current = false;
    setIsSpeaking(true);
    speak(spokenText(), lang)
      .catch(() => {
        if (!wasStopped.current) {
          showNotice(t('Tu teléfono no tiene voz instalada para este idioma. Puedes instalarla en los ajustes de texto a voz.'));
        }
      })
      .finally(() => setIsSpeaking(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isSpeaking ? t('Detener la lectura') : t('Escuchar esta pantalla')}
      aria-pressed={isSpeaking}
      title={isSpeaking ? t('Detener la lectura') : t('Escuchar esta pantalla')}
      className={`icon-btn ${isSpeaking ? 'bg-sunken text-anil' : ''} ${className}`}
    >
      {isSpeaking ? <VolumeX className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
    </button>
  );
};
