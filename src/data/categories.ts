import {
  BookOpen,
  Car,
  CookingPot,
  Droplets,
  GraduationCap,
  Hammer,
  HandHeart,
  HeartPulse,
  Home,
  KeyRound,
  Package,
  PawPrint,
  Users,
  Wrench,
  Zap,
  type LucideIcon
} from 'lucide-react';
import { PostType } from '../types';

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SERVICE_CATEGORIES: Category[] = [
  { id: 'gasfiteria', label: 'Gasfitería', icon: Wrench },
  { id: 'electricidad', label: 'Electricidad', icon: Zap },
  { id: 'comida', label: 'Comida', icon: CookingPot },
  { id: 'clases', label: 'Clases', icon: BookOpen },
  { id: 'cerrajeria', label: 'Cerrajería', icon: KeyRound },
  { id: 'carpinteria', label: 'Carpintería', icon: Hammer },
  { id: 'mascotas', label: 'Mascotas', icon: PawPrint },
  { id: 'salud', label: 'Salud', icon: HeartPulse }
];

export const FAVOR_CATEGORIES: Category[] = [
  { id: 'herramientas', label: 'Herramientas', icon: Hammer },
  { id: 'salud', label: 'Muletas y salud', icon: HeartPulse },
  { id: 'donacion', label: 'Donaciones', icon: Package },
  { id: 'habilidades', label: 'Enseñar', icon: GraduationCap },
  { id: 'movilidad', label: 'Transporte', icon: Car },
  { id: 'ayuda_temporal', label: 'Una mano', icon: HandHeart }
];

export const EMERGENCY_CATEGORIES: Category[] = [
  { id: 'agua_alimentos', label: 'Agua y comida', icon: Droplets },
  { id: 'primeros_auxilios', label: 'Primeros auxilios', icon: HeartPulse },
  { id: 'vulnerabilidad_mayor', label: 'Persona mayor', icon: HandHeart },
  { id: 'energia_luz', label: 'Luz y carga', icon: Zap },
  { id: 'albergue_refugio', label: 'Refugio', icon: Home },
  { id: 'rescate_movilidad', label: 'Traslado', icon: Car }
];

const ALL_CATEGORIES = [...SERVICE_CATEGORIES, ...FAVOR_CATEGORIES, ...EMERGENCY_CATEGORIES];

const FALLBACK: Category = { id: 'otros', label: 'Otros', icon: Users };

export function findCategory(id: string): Category {
  return ALL_CATEGORIES.find((category) => category.id === id) ?? FALLBACK;
}

export interface PublishTile {
  type: PostType;
  category: string;
  label: string;
  icon: LucideIcon;
  title: string;
}

export interface PublishGroup {
  heading: string;
  tiles: PublishTile[];
}

const tile = (type: PostType, category: Category, label: string, title: string): PublishTile => ({
  type,
  category: category.id,
  label,
  icon: category.icon,
  title
});

const byId = (list: Category[], id: string) => list.find((category) => category.id === id) ?? FALLBACK;
const service = (id: string) => byId(SERVICE_CATEGORIES, id);
const favor = (id: string) => byId(FAVOR_CATEGORIES, id);
const emergency = (id: string) => byId(EMERGENCY_CATEGORIES, id);

export const NORMAL_PUBLISH_GROUPS: PublishGroup[] = [
  {
    heading: 'Ofrezco mi trabajo',
    tiles: [
      tile('service', service('gasfiteria'), 'Gasfitería', 'Arreglo cañerías y sanitarios'),
      tile('service', service('electricidad'), 'Electricidad', 'Hago instalaciones eléctricas'),
      tile('service', service('comida'), 'Comida', 'Vendo comida casera'),
      tile('service', service('clases'), 'Clases', 'Doy clases particulares'),
      tile('service', service('cerrajeria'), 'Cerrajería', 'Abro y cambio chapas'),
      tile('service', service('carpinteria'), 'Carpintería', 'Hago trabajos de carpintería')
    ]
  },
  {
    heading: 'Presto o regalo',
    tiles: [
      tile('favor_offer', favor('herramientas'), 'Herramientas', 'Presto herramientas'),
      tile('favor_offer', favor('salud'), 'Muletas y salud', 'Presto muletas'),
      tile('favor_offer', favor('donacion'), 'Regalo cosas', 'Regalo cosas que ya no uso'),
      tile('favor_offer', favor('habilidades'), 'Enseño algo', 'Enseño lo que sé'),
      tile('favor_offer', favor('movilidad'), 'Llevo vecinos', 'Tengo sitio en mi carro')
    ]
  },
  {
    heading: 'Necesito un favor',
    tiles: [
      tile('favor_request', favor('herramientas'), 'Una herramienta', 'Necesito una herramienta'),
      tile('favor_request', favor('ayuda_temporal'), 'Una mano', 'Necesito una mano'),
      tile('favor_request', favor('movilidad'), 'Transporte', 'Necesito que me lleven')
    ]
  }
];

export const EMERGENCY_PUBLISH_GROUPS: PublishGroup[] = [
  {
    heading: 'Necesito ayuda',
    tiles: [
      tile('emergency_need', emergency('primeros_auxilios'), 'Heridos', 'Hay una persona herida'),
      tile('emergency_need', emergency('agua_alimentos'), 'Agua y comida', 'Necesitamos agua y comida'),
      tile('emergency_need', emergency('vulnerabilidad_mayor'), 'Persona mayor', 'Una persona mayor necesita ayuda'),
      tile('emergency_need', emergency('albergue_refugio'), 'Refugio', 'Necesitamos un lugar seguro')
    ]
  },
  {
    heading: 'Tengo para compartir',
    tiles: [
      tile('emergency_resource', emergency('agua_alimentos'), 'Agua y comida', 'Tengo agua y comida para compartir'),
      tile('emergency_resource', emergency('energia_luz'), 'Luz y carga', 'Tengo luz para cargar celulares'),
      tile('emergency_resource', emergency('albergue_refugio'), 'Refugio', 'Tengo un lugar seguro'),
      tile('emergency_resource', emergency('rescate_movilidad'), 'Traslado', 'Puedo llevar personas')
    ]
  },
  {
    heading: 'Somos un grupo',
    tiles: [
      tile('support_group', emergency('primeros_auxilios'), 'Grupo de ayuda', 'Somos un grupo de ayuda')
    ]
  }
];

export const HELP_REQUEST_PRESET = {
  type: 'emergency_need' as PostType,
  category: 'primeros_auxilios',
  title: 'Necesito ayuda ahora'
};
