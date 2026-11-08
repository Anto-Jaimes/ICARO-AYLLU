import {
  Baby,
  BookOpen,
  ShoppingBasket,
  CakeSlice,
  Car,
  CookingPot,
  Drumstick,
  Ellipsis,
  HardHat,
  Scissors,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Tv,
  UtensilsCrossed,
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
  { id: 'polleria', label: 'Pollería', icon: Drumstick },
  { id: 'reposteria', label: 'Repostería', icon: CakeSlice },
  { id: 'restaurante', label: 'Restaurante', icon: UtensilsCrossed },
  { id: 'bodega', label: 'Bodega', icon: Store },
  { id: 'clases', label: 'Clases', icon: BookOpen },
  { id: 'cerrajeria', label: 'Cerrajería', icon: KeyRound },
  { id: 'carpinteria', label: 'Carpintería', icon: Hammer },
  { id: 'construccion', label: 'Construcción', icon: HardHat },
  { id: 'limpieza', label: 'Limpieza', icon: Sparkles },
  { id: 'belleza', label: 'Belleza', icon: Scissors },
  { id: 'costura', label: 'Costura', icon: Shirt },
  { id: 'tecnologia', label: 'Celulares y PC', icon: Smartphone },
  { id: 'streaming', label: 'Streaming y digital', icon: Tv },
  { id: 'transporte', label: 'Transporte y mudanza', icon: Truck },
  { id: 'mascotas', label: 'Mascotas', icon: PawPrint },
  { id: 'salud', label: 'Salud', icon: HeartPulse },
  { id: 'otro_servicio', label: 'Otro servicio', icon: Ellipsis }
];

export const FAVOR_CATEGORIES: Category[] = [
  { id: 'herramientas', label: 'Herramientas', icon: Hammer },
  { id: 'salud', label: 'Muletas y salud', icon: HeartPulse },
  { id: 'donacion', label: 'Donaciones', icon: Package },
  { id: 'habilidades', label: 'Enseñar', icon: GraduationCap },
  { id: 'movilidad', label: 'Transporte', icon: Car },
  { id: 'ayuda_temporal', label: 'Una mano', icon: HandHeart },
  { id: 'mandados', label: 'Mandados', icon: ShoppingBasket },
  { id: 'cuidado', label: 'Cuidar a alguien', icon: Baby }
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
    heading: 'Vendo comida',
    tiles: [
      tile('service', service('comida'), 'Comida casera', 'Menú casero'),
      tile('service', service('polleria'), 'Pollería', 'Pollos a la brasa'),
      tile('service', service('reposteria'), 'Repostería', 'Tortas y postres'),
      tile('service', service('restaurante'), 'Restaurante', 'Restaurante'),
      tile('service', service('bodega'), 'Bodega', 'Bodega del barrio')
    ]
  },
  {
    heading: 'Ofrezco mi trabajo',
    tiles: [
      tile('service', service('gasfiteria'), 'Gasfitería', 'Arreglo cañerías y sanitarios'),
      tile('service', service('electricidad'), 'Electricidad', 'Hago instalaciones eléctricas'),
      tile('service', service('carpinteria'), 'Carpintería', 'Hago trabajos de carpintería'),
      tile('service', service('cerrajeria'), 'Cerrajería', 'Abro y cambio chapas'),
      tile('service', service('construccion'), 'Construcción', 'Albañilería y acabados'),
      tile('service', service('limpieza'), 'Limpieza', 'Limpieza de casas y oficinas')
    ]
  },
  {
    heading: 'Más servicios',
    tiles: [
      tile('service', service('clases'), 'Clases', 'Doy clases particulares'),
      tile('service', service('belleza'), 'Belleza', 'Corte y peinado'),
      tile('service', service('costura'), 'Costura', 'Arreglo y confecciono ropa'),
      tile('service', service('tecnologia'), 'Celulares y PC', 'Reparo celulares y computadoras'),
      tile('service', service('streaming'), 'Streaming y digital', 'Cuentas de streaming'),
      tile('service', service('transporte'), 'Transporte y mudanza', 'Hago mudanzas y fletes'),
      tile('service', service('mascotas'), 'Mascotas', 'Baño y cuidado de mascotas'),
      tile('service', service('otro_servicio'), 'Otro servicio', '')
    ]
  },
  {
    heading: 'Presto o regalo',
    tiles: [
      tile('favor_offer', favor('herramientas'), 'Herramientas', 'Presto herramientas'),
      tile('favor_offer', favor('salud'), 'Muletas y salud', 'Presto muletas'),
      tile('favor_offer', favor('donacion'), 'Regalo cosas', 'Regalo cosas que ya no uso'),
      tile('favor_offer', favor('habilidades'), 'Enseño algo', 'Enseño lo que sé'),
      tile('favor_offer', favor('movilidad'), 'Llevo vecinos', 'Tengo sitio en mi carro'),
      tile('favor_offer', favor('mandados'), 'Hago mandados', 'Puedo hacer compras o mandados'),
      tile('favor_offer', favor('ayuda_temporal'), 'Doy una mano', 'Puedo dar una mano')
    ]
  },
  {
    heading: 'Necesito un favor',
    tiles: [
      tile('favor_request', favor('herramientas'), 'Una herramienta', 'Necesito una herramienta'),
      tile('favor_request', favor('ayuda_temporal'), 'Una mano', 'Necesito una mano'),
      tile('favor_request', favor('movilidad'), 'Transporte', 'Necesito que me lleven'),
      tile('favor_request', favor('mandados'), 'Un mandado', 'Necesito que me compren algo'),
      tile('favor_request', favor('cuidado'), 'Cuidar a alguien', 'Necesito que cuiden a mi hijo o a un mayor')
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
