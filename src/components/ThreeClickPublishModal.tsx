import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostType } from '../types';
import { 
  X, 
  Wrench, 
  HeartHandshake, 
  ShieldAlert, 
  MapPin, 
  Phone, 
  ArrowRight,
  CheckCircle2,
  Mic,
  MicOff,
  Flame,
  Droplets,
  BookOpen,
  Car,
  Package,
  Layers,
  FileText
} from 'lucide-react';

export const ThreeClickPublishModal: React.FC = () => {
  const { 
    isPublishModalOpen, 
    setIsPublishModalOpen, 
    addItem, 
    userLocation, 
    mode 
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<PostType>(mode === 'emergency' ? 'emergency_need' : 'service');
  const [selectedCategory, setSelectedCategory] = useState<string>('gasfiteria');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorPhone, setAuthorPhone] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>(userLocation.name || 'Sector Los Sauces');
  const [priceInfo, setPriceInfo] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'baja' | 'media' | 'alta' | 'critica'>('alta');

  const [isListening, setIsListening] = useState<boolean>(false);

  if (!isPublishModalOpen) return null;

  // Iconos formales vectoriales (sin emojis)
  const categoriesByType = {
    service: [
      { id: 'gasfiteria', label: 'Gasfitería', icon: <Wrench className="w-4 h-4 text-slate-700" />, template: 'Reparación de cañerías y sanitarios' },
      { id: 'electricidad', label: 'Electricidad', icon: <Flame className="w-4 h-4 text-slate-700" />, template: 'Instalación eléctrica y cortocircuitos' },
      { id: 'cerrajeria', label: 'Cerrajería', icon: <Layers className="w-4 h-4 text-slate-700" />, template: 'Apertura de puertas y cambio de chapas' },
      { id: 'comida', label: 'Alimentos y Repostería', icon: <Package className="w-4 h-4 text-slate-700" />, template: 'Pasteles o viandas caseras del barrio' },
      { id: 'clases', label: 'Clases Particulares', icon: <BookOpen className="w-4 h-4 text-slate-700" />, template: 'Apoyo en matemáticas y materias escolares' },
    ],
    favor_offer: [
      { id: 'herramientas', label: 'Préstamo de Herramientas', icon: <Wrench className="w-4 h-4 text-slate-700" />, template: 'Presto taladro o escalera a vecinos' },
      { id: 'salud', label: 'Insumos Médicos / Muletas', icon: <HeartHandshake className="w-4 h-4 text-slate-700" />, template: 'Presto muletas o silla de ruedas' },
      { id: 'movilidad', label: 'Movilidad Solidaria / Pool', icon: <Car className="w-4 h-4 text-slate-700" />, template: 'Asientos libres para ruta escolar' },
      { id: 'donacion', label: 'Donación de Materiales', icon: <Package className="w-4 h-4 text-slate-700" />, template: 'Donación de libros o enseres' },
    ],
    favor_request: [
      { id: 'herramientas', label: 'Solicitud de Herramienta', icon: <Wrench className="w-4 h-4 text-slate-700" />, template: 'Busco prestado taladro o escalera' },
      { id: 'ayuda_temporal', label: 'Ayuda Temporal', icon: <HeartHandshake className="w-4 h-4 text-slate-700" />, template: 'Apoyo para mover algo pesado' },
    ],
    emergency_need: [
      { id: 'agua_alimentos', label: 'Corte de Agua / Filtración', icon: <Droplets className="w-4 h-4 text-red-700" />, template: 'Se requiere agua potable o baldes' },
      { id: 'vulnerabilidad_mayor', label: 'Adulto Mayor Vulnerable', icon: <HeartHandshake className="w-4 h-4 text-red-700" />, template: 'Adulto mayor requiere apoyo de movilidad' },
      { id: 'primeros_auxilios', label: 'Primeros Auxilios', icon: <ShieldAlert className="w-4 h-4 text-red-700" />, template: 'Atención y auxilio primario' },
    ],
    emergency_resource: [
      { id: 'energia_luz', label: 'Generador / Recarga', icon: <Flame className="w-4 h-4 text-emerald-700" />, template: 'Punto de recarga de celulares activo' },
      { id: 'tanque_agua', label: 'Tanque Comunitario', icon: <Droplets className="w-4 h-4 text-emerald-700" />, template: 'Acceso a agua potable comunal' },
    ],
    support_group: [
      { id: 'brigada', label: 'Brigada Vecinal Activa', icon: <ShieldAlert className="w-4 h-4 text-blue-700" />, template: 'Voluntarios de apoyo y defensa' },
    ]
  };

  const handleSelectCategory = (catId: string, template: string) => {
    setSelectedCategory(catId);
    if (!title) setTitle(template);
    setStep(3); // Clic 2 completado -> pasa al paso 3
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addItem({
      title,
      description: description || 'Publicación comunitaria verificada para vecinos del cuadrante.',
      type: selectedType,
      category: selectedCategory,
      authorName: authorName || 'Vecino del Cuadrante',
      authorPhone: authorPhone || '+51999999999',
      neighborhood: neighborhood || userLocation.name || 'Barrio Los Sauces',
      address: 'Cuadrante cercano',
      coordinates: [userLocation.lat, userLocation.lng],
      priceInfo: priceInfo || (selectedType === 'service' ? 'Tarifa vecinal' : 'Sin costo / Solidario'),
      urgencyLevel: selectedType === 'emergency_need' ? urgencyLevel : undefined,
      status: 'active'
    });

    // Reset
    setStep(1);
    setTitle('');
    setDescription('');
    setIsPublishModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Proceso de Publicación (Paso {step} de 3)
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {step === 1 && "1. Selecciona la intención"}
              {step === 2 && "2. Elige el rubro o necesidad"}
              {step === 3 && "3. Confirma tu publicación"}
            </h3>
          </div>
          <button 
            onClick={() => setIsPublishModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso de 3 pasos */}
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="bg-slate-800 h-full transition-all duration-200"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Contenido según el paso */}
        <div className="p-5 overflow-y-auto">
          
          {/* PASO 1: Elegir Módulo (1er Clic) */}
          {step === 1 && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => { setSelectedType('service'); setStep(2); }}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Ofrecer un Oficio o Emprendimiento</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gasfitería, cerrajería, electricidad, repostería o clases particulares.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedType('favor_offer'); setStep(2); }}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Cadena de Favores (Sin Dinero)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Préstamo de muletas, herramientas, pool al colegio o donaciones.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedType('emergency_need'); setStep(2); }}
                className="w-full text-left p-3.5 rounded-xl border border-red-200 hover:border-red-600 bg-red-50/40 hover:bg-red-50 transition flex items-start gap-3.5 cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-red-100 text-red-800 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-xs sm:text-sm">Emergencia / Auxilio Inmediato</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">Reportar adulto mayor vulnerable, corte crítico de agua o sismo.</p>
                </div>
              </button>
            </div>
          )}

          {/* PASO 2: Elegir Categoría (2do Clic) */}
          {step === 2 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-600 block">
                Selecciona la categoría adecuada:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(categoriesByType[selectedType] || categoriesByType.service).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id, cat.template)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-left transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="p-1.5 bg-slate-100 rounded-md shrink-0">
                      {cat.icon}
                    </div>
                    <span className="font-semibold text-xs text-slate-800">{cat.label}</span>
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="mt-3 text-xs text-slate-500 hover:underline"
              >
                ← Volver al paso anterior
              </button>
            </div>
          )}

          {/* PASO 3: Confirmación y Clic 3 */}
          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la publicación:</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción breve:</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle para tus vecinos..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre o contacto:</label>
                  <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Vecino"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono (WhatsApp):</label>
                  <input 
                    type="tel"
                    value={authorPhone}
                    onChange={(e) => setAuthorPhone(e.target.value)}
                    placeholder="+519..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button 
                  type="button"
                  onClick={() => setStep(2)} 
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Atrás
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirmar y Publicar (Clic 3)</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
