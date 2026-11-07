import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  CheckCircle2
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

  // Step 1: Type selection (Click 1)
  // Step 2: Category selection (Click 2)
  // Step 3: Fast Details & Confirm (Click 3)
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

  if (!isPublishModalOpen) return null;

  // Categories per type
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

  // Step 1: Select Type
  const handleSelectType = (type: PostType) => {
    setSelectedType(type);
    const defaults = categoriesByType[type];
    if (defaults && defaults.length > 0) {
      setSelectedCategory(defaults[0].id);
      setTitle(defaults[0].template);
    }
    setStep(2); // Advance to Click 2
  };

  // Step 2: Select Category
  const handleSelectCategory = (catId: string, defaultTemplate: string) => {
    setSelectedCategory(catId);
    if (!title || title.length < 3) {
      setTitle(defaultTemplate);
    }
    setStep(3); // Advance to Click 3
  };

  // Step 3: Final Submit (Click 3)
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalTitle = title.trim() || 'Publicación vecinal';
    const finalAuthor = authorName.trim() || 'Vecino solidario';
    const finalPhone = authorPhone.trim() || '+51900000000';

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

    // Reset and close
    setStep(1);
    setTitle('');
    setDescription('');
    setIsPublishModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Top Header */}
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

        {/* Offline notice inside modal */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Estás sin internet. Tu publicación se guardará localmente y se compartirá al reconectarte.</span>
          </div>
        )}

        {/* Body based on 3-Click Flow */}
        <div className="p-5">
          {/* STEP 1: CHOOSE TYPE (CLICK 1) */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Selecciona la opción que mejor describa lo que deseas:
              </p>

              {/* Option 1: Oficio Local */}
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

              {/* Option 2: Prestar / Donar (Sin Dinero) */}
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

              {/* Option 3: Necesito Ayuda sin dinero */}
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

              {/* Option 4: Emergencia SOS */}
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

          {/* STEP 2: CHOOSE CATEGORY (CLICK 2) */}
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

          {/* STEP 3: CONFIRM & PUBLISH (CLICK 3) */}
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

              {/* Quick Title */}
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

              {/* Author & WhatsApp */}
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

              {/* Neighborhood / Location */}
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

              {/* Optional brief details */}
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

              {/* Final Confirm Button (3rd Click) */}
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
