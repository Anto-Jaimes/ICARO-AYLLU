# Estándar de Iconografía y Sistema de Diseño Vectorial (Architecture RFC)
**Proyecto:** ICARO-AYLLU (Hackathon UTP 2026)  
**Objetivo:** Eliminar el uso de emoticones y activos rasterizados, implementando un estándar de ingeniería de software de clase internacional basado en componentes vectoriales SVG limpios, escalables y accesibles.

---

## 1. Justificación de Ingeniería: ¿Por qué erradicar los emoticones?

1. **Inconsistencia de Plataforma:** Un emoji renderiza de forma distinta y a menudo infantil en Windows, macOS, Android (Samsung vs Xiaomi vs Pixel) e iOS. En situaciones de crisis o contratos de servicios, genera desconfianza.
2. **Accesibilidad (WCAG 2.2):** Los lectores de pantalla verbalizan nombres arbitrarios para los emojis (ej. *"cara con sudor frío"* o *"herramienta de mano"*), entorpeciendo la navegación de usuarios con discapacidad visual.
3. **Escalabilidad Visual y Color Sync:** Los emojis no respetan `currentColor`, impidiendo que se adapten a hover states, modos oscuros tácticos o esquemas de contraste alto.

---

## 2. Las 4 Fuentes Canónicas de Iconografía en el Proyecto

| Fuente Oficial | Enfoque de Ingeniería | Rol en ICARO-AYLLU |
| :--- | :--- | :--- |
| **1. [Lucide Icons](https://lucide.dev/)** | Tree-shakeable React components, grosor de trazo uniforme (`stroke-width: 2`), caja `24x24`. | **Librería Primaria:** Se utiliza en el 95% de la aplicación (navegación, filtros, botones, estados de red, telemetría y geolocalización). |
| **2. [Radix UI Icons](https://icons.radix-ui.com/)** | Diseñados sobre grilla de `15x15` píxeles para alta densidad de datos. | **Inspiración de Densidad:** Referencia para micro-indicadores, chips de estado y selectores compactos sin ruido visual. |
| **3. [Heroicons (Tailwind Labs)](https://heroicons.com/)** | Dualidad *Outline* (inactivo) vs *Solid* (activo). | **Patrón de Estados:** Alternancia visual entre elementos seleccionados y no seleccionados en la barra móvil y filtros. |
| **4. Isotipo SVG Puro (`IcaroBrandLogo.tsx`)** | Gráfico vectorial manual incrustado (<1 KB) sin dependencias ni llamadas de red externas. | **Identidad de Marca:** Representa el refugio comunitario, el sol Inti y la señal de contingencia en el header. |

---

## 3. Matriz de Reemplazo Vectorial (Anti-Emoji Mapping)

| Módulo | Elemento Anterior (Emoji) | Componente SVG Oficial (`lucide-react`) | Utilidad en la App |
| :--- | :---: | :--- | :--- |
| **Header** | ☀️ / 🚨 | `<IcaroBrandLogo />` | Isotipo institucional con estado dinámico (Normal vs SOS). |
| **Alerta Sonora** | 📢 | `<Siren className="text-red-700" />` | Alarma acústica comunitaria de emergencia. |
| **Conexión Red** | 🟢 / 🟡 | `<Wifi />` / `<WifiOff />` | Detección de conectividad en tiempo real (PWA). |
| **Oficios Locales** | 🔧 Gasfitería | `<Wrench />` | Reparación de cañerías y sanitarios de proximidad. |
| **Oficios Locales** | ⚡ Electricidad | `<Flame />` / `<Zap />` | Red eléctrica y cortocircuitos. |
| **Oficios Locales** | 🔑 Cerrajería | `<Layers />` / `<KeyRound />` | Apertura de puertas y cambio de chapas. |
| **Comida Barrial** | 🍲 Lasaña | `<Package />` / `<Utensils />` | Emprendimientos gastronómicos vecinales. |
| **Clases** | 📚 Matemáticas | `<BookOpen />` | Clases particulares y apoyo escolar. |
| **Cadena de Favores** | 🩼 Muletas | `<HeartHandshake />` | Préstamo solidario de insumos de salud. |
| **Cadena de Favores** | 🚲 Movilidad | `<Car />` / `<Bike />` | Pool al colegio y movilidad comunitaria. |
| **Emergencia SOS** | 💧 Agua Potable | `<Droplets />` | Puntos de agua y baldes ante lluvias/El Niño. |
| **Emergencia SOS** | 👵 Adulto Mayor | `<ShieldAlert />` | Vecinos vulnerables con necesidad de auxilio. |
| **Proximidad** | 🚶‍♂️ Caminando | `<Footprints />` | Distancia calculada a pie vía OSRM (`formatDistance`). |
| **Visto Bueno** | 🛡️ Recomendación | `<Award />` + `<ThumbsUp />` | Sello de recomendación vecinal verificada. |

---

## 4. Guía de Implementación para Desarrolladores

Para mantener la consistencia estética y de código en los próximos commits:

```tsx
// ❌ INCORRECTO: Uso de emojis o imágenes rasterizadas
<button>🔧 Solicitar Gasfitero</button>

// ✅ CORRECTO: Componente SVG con trazo, tamaño y herencia de color estandarizada
import { Wrench } from 'lucide-react';

<button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-800 hover:bg-slate-100 transition">
  <Wrench className="w-4 h-4 text-slate-600" aria-hidden="true" />
  <span className="font-semibold text-xs">Gasfitería</span>
</button>
```
