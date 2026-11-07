import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { normalizePhone } from '../utils/geo';
import { PostType } from '../types';
import { 
  X, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Wrench, 
  HeartHandshake, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  WifiOff, 
  ArrowRight,
  CheckCircle2,
  Mic,
  MicOff
} from 'lucide-react';

export const ThreeClickPublishModal: React.FC = () => {
  const { 
    isPublishModalOpen, 
    setIsPublishModalOpen, 
    addItem, 
    userLocation, 
    isOnline,
    mode 
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<PostType>(mode === 'emergency' ? 'emergency_need' : 'service');
  const [selectedCategory, setSelectedCategory] = useState<string>('gasfiteria');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorPhone, setAuthorPhone] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('Mi cuadra / Barrio Central');
  const [priceInfo, setPriceInfo] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'baja' | 'media' | 'alta' | 'critica'>('alta');

  // Voice Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
    }
  }, []);

  if (!isPublishModalOpen) return null;

  const categoriesByType = {
    service: [
      { id: 'gasfiteria', label: '🔧 Gasfitería', template: 'Reparación de cañerías y sanitarios' },
      { id: 'electricidad', label: '⚡ Electricidad', template: 'Instalación eléctrica y cortocircuitos' },
      { id: 'cerrajeria', label: '🔑 Cerrajería', template: 'Apertura de puertas y cambio de chapas' },
      { id: 'carpinteria', label: '🪵 Carpintería', template: 'Reparación de muebles y puertas' },
      { id: 'mascotas', label: '🐾 Mascotas', template: 'Paseo y cuidado de perritos' },
      { id: 'clases', label: '📚 Clases / Apoyo', template: 'Clases particulares escolares' },
    ],
    favor_offer: [
      { id: 'herramientas', label: '🔨 Préstamo Herramientas', template: 'Presto taladro / escalera a vecinos' },
      { id: 'donacion', label: '📦 Donación de cosas', template: 'Donación de ropa o libros en buen estado' },
      { id: 'habilidades', label: '💡 Trueque de Saberes', template: 'Enseño computación / huerto casero' },
      { id: 'movilidad', label: '🚲 Movilidad Solidaria', template: 'Apoyo con bicicleta o carrito' },
    ],
    favor_request: [
      { id: 'ayuda_temporal', label: '🤝 Ayuda con Mueble/Carga', template: 'Necesito ayuda para mover algo pesado' },
      { id: 'herramientas', label: '🔨 Necesito Herramienta', template: 'Busco prestado serrucho o escalera' },
      { id: 'otros', label: '🌱 Mano de obra comunitaria', template: 'Ayuda para limpiar jardín comunal' },
    ],
    emergency_need: [
      { id: 'vulnerabilidad_mayor', label: '👵 Adulto Mayor Solo', template: 'Adulto mayor necesita apoyo urgente' },
      { id: 'agua_alimentos', label: '💧 Sin Agua Potable', template: 'Familia requiere bidón de agua limpia' },
      { id: 'energia_luz', label: '⚡ Sin Luz / Riesgo Eléctrico', template: 'Cable caído o corte en la cuadra' },
      { id: 'primeros_auxilios', label: '🩹 Medicamentos / Oxígeno', template: 'Se requiere medicina urgente' },
    ],
    emergency_resource: [
      { id: 'agua_alimentos', label: '💧 Tanque de Agua Solidario', template: 'Punto de recarga de agua para vecinos' },
      { id: 'energia_luz', label: '🔋 Generador / Carga Solar', template: 'Tomas de corriente habilitadas para recarga' },
    ],
    support_group: [
      { id: 'primeros_auxilios', label: '🚑 Brigada de Triage', template: 'Vecinos brigadistas voluntarios de apoyo' },
    ]
  };

  const currentCategories = categoriesByType[selectedType] || categoriesByType.service;

  // Voice Recognition Handler
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-PE'; // Spanish (Peru / Latin America)
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          setTitle(spoken);
          setDescription(`Publicado por dictado de voz: "${spoken}"`);

          // Intelligent categorization based on spoken keywords
          const lower = spoken.toLowerCase();
          if (lower.includes('agua') || lower.includes('tubería') || lower.includes('caño') || lower.includes('desagüe')) {
            setSelectedCategory('gasfiteria');
          } else if (lower.includes('luz') || lower.includes('cable') || lower.includes('corriente') || lower.includes('enchufe')) {
            setSelectedCategory('electricidad');
          } else if (lower.includes('taladro') || lower.includes('herramienta') || lower.includes('escalera') || lower.includes('presto')) {
            setSelectedType('favor_offer');
            setSelectedCategory('herramientas');
          } else if (lower.includes('emergencia') || lower.includes('auxilio') || lower.includes('grave') || lower.includes('abuelo')) {
            setSelectedType('emergency_need');
            setSelectedCategory('vulnerabilidad_mayor');
          }

          setStep(3); // Jump straight to confirmation
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsListening(false);
    }
  };

  const handleSelectType = (type: PostType) => {
    setSelectedType(type);
    const defaults = categoriesByType[type];
    if (defaults && defaults.length > 0) {
      setSelectedCategory(defaults[0].id);
      setTitle(defaults[0].template);
    }
    setStep(2);
  };

  const handleSelectCategory = (catId: string, defaultTemplate: string) => {
    setSelectedCategory(catId);
    if (!title || title.length < 3) {
      setTitle(defaultTemplate);
    }
    setStep(3);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalTitle = title.trim() || 'Publicación vecinal';
    const finalAuthor = authorName.trim() || 'Vecino solidario';
    const finalPhone = normalizePhone(authorPhone);

    addItem({
      title: finalTitle,
      description: description.trim() || `Publicado por ${finalAuthor} para apoyo en la comunidad.`,
      type: selectedType,
      category: selectedCategory,
      authorName: finalAuthor,
      authorPhone: finalPhone,
      neighborhood: neighborhood.trim() || userLocation.name,
      coordinates: [
        userLocation.lat + (Math.random() - 0.5) * 0.003,
        userLocation.lng + (Math.random() - 0.5) * 0.003
      ],
      priceInfo: priceInfo.trim() || (selectedType === 'service' ? 'Tarifa vecinal accesible' : 'Sin costo / Solidario'),
      urgencyLevel: ['emergency_need', 'emergency_resource'].includes(selectedType) ? urgencyLevel : undefined,
      status: 'active'
    });

    setStep(1);
    setTitle('');
    setDescription('');
    setIsPublishModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center font-black text-xs text-white">
              {step}/3
            </span>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Publicar en tu Barrio (3 Clics)
              </h3>
              <p className="text-[11px] text-slate-300">
                {step === 1 && 'Clic 1: ¿Qué tipo de publicación deseas hacer?'}
                {step === 2 && 'Clic 2: Elige la categoría con un toque'}
                {step === 3 && 'Clic 3: Revisa y confirma tu publicación'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPublishModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline notice */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Estás sin internet. Tu publicación se guardará localmente y se compartirá al reconectarte.</span>
          </div>
        )}

        {/* Voice dictation banner for accessibility */}
        {hasSpeechSupport && step === 1 && (
          <div className="px-5 pt-4">
            <button
              onClick={startVoiceInput}
              className={`w-full p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer shadow-sm ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 animate-bounce" />
                  <span>Escuchando... Di lo que necesitas o quieres ofrecer</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-600" />
                  <span>🎙️ Dictar por Voz (Accesible para Adultos Mayores)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5">
          {/* STEP 1: CHOOSE TYPE */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                O toca una de las siguientes opciones:
              </p>

              <button
                onClick={() => handleSelectType('service')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                    🛠️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700">
                      1. Ofrezco un Oficio o Profesión
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gasfitería, electricidad, cerrajería, carpintería, paseos, clases. Con Visto Bueno Vecinal.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleSelectType('favor_offer')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                    🤝
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700">
                      2. Cadena de Favores: Prestar o Donar (Sin Dinero)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prestar taladro o escalera, donar ropa o libros, trueque de saberes o movilidad.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleSelectType('favor_request')}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                    🙋
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-700">
                      3. Necesito un Favor Comunitario
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ayuda temporal para cargar un mueble, préstamo de herramienta, favor vecinal.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition shrink-0 ml-2" />
              </button>

              <button
                onClick={() => handleSelectType('emergency_need')}
                className="w-full text-left p-4 rounded-2xl border-2 border-rose-300 bg-rose-50/40 hover:border-rose-500 hover:bg-rose-100/50 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition">
                    🚨
                  </div>
                  <div>
                    <h4 className="font-extrabold text-rose-900 text-sm">
                      4. ALERTA DE EMERGENCIA S.O.S.
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Auxilio para persona mayor, falta crítica de agua/luz, primeros auxilios o peligro.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-rose-500 transition shrink-0 ml-2" />
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE CATEGORY */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">
                  Toca la categoría adecuada:
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Volver al paso 1
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {currentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id, cat.template)}
                    className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-left transition flex flex-col justify-between cursor-pointer group active:scale-98"
                  >
                    <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-amber-700">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {cat.template}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM & PUBLISH */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-600">
                  Paso final: Revisa y publica
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Cambiar categoría
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título de la publicación *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Presto escalera de 4 metros los fines de semana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Nombre o Apodo *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ej: Vecino Carlos"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp o Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={authorPhone}
                    onChange={(e) => setAuthorPhone(e.target.value)}
                    placeholder="Ej: +51 987 654 321"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubicación de referencia en el barrio
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ej: Pasaje Los Pinos, a 2 cuadras del parque"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explica brevemente horarios de atención, condiciones o detalles de contacto."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>¡Publicar en mi Barrio Ahora! (3er Clic)</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
