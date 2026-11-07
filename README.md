# ☀️ ICARO-AYLLU | Red Vecinal y Economía Solidaria

> **Reto 48 Horas:** Aplicativo para que los ciudadanos obtengan con costos mínimos y sin necesidad de transporte mayor productos y servicios recomendados por vecinos, con mecanismos de intercambios solidarios y evolución a situaciones de emergencia.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green.svg)](https://leafletjs.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Online%20%2F%20Offline-orange.svg)]()

---

## 🌟 ¿Qué es ICARO-AYLLU?

Inspirada en el vocablo quechua **Ayllu** (*comunidad unida por vínculos de reciprocidad, ayuda mutua y solidaridad*), **ICARO-AYLLU** es una plataforma ciudadana hiperlocal diseñada para transformar la convivencia de los barrios en dos frentes:

1. **Día a Día:** Fortalecer la economía local de proximidad y la economía solidaria sin dinero.
2. **Emergencias:** Convertirse en un centro de comando vecinal resiliente para coordinar auxilio humanitario inmediato y compartir recursos críticos ante cortes, desastres naturales o situaciones críticas.

---

## 🚀 Módulos y Características Principales

### 1. Servicios de Proximidad (Economía Local)
- **Directorio de Oficios y Profesiones Barriales:** Gasfitería, electricidad, cerrajería, carpintería, cuidado de mascotas, clases particulares, etc.
- **Sistema de "Visto Bueno Vecinal":** Respaldado por testimonios y recomendaciones de vecinos de la misma zona para garantizar confianza y honradez sin depender de intermediarios comerciales.
- **Sin necesidad de transporte mayor:** Filtro por distancia hiperlocal (a pie: 500m, 1km, 3km) para resolver necesidades en minutos y a menor costo.
- **Contacto Directo:** Integración instantánea con WhatsApp y llamadas telefónicas con plantillas de mensajes vecinales listas.

### 2. Cadena de Favores & Red de Solidaridad (Economía Solidaria)
- **Muro colaborativo para resolver necesidades sin dinero:**
  - **Préstamo de herramientas:** Taladros, escaleras, sierras, etc.
  - **Donaciones de materiales:** Libros escolares, ropa, enseres del hogar.
  - **Trueque de saberes:** Clases de tecnología a cambio de cuidados de huerto, etc.
  - **Ayuda temporal y movilidad solidaria:** Acompañamiento a adultos mayores, traslado de muebles o transporte en bicicleta/carrito.

### 3. Centro de Comando en "Modo Emergencia" (S.O.S.)
- **Conmutador instantáneo:** La interfaz cambia a modo de alta visibilidad y alerta roja.
- **Tablero de Ayuda Humanitaria:** Reportes geolocalizados de vecinos en alta vulnerabilidad (ej. adultos mayores que viven solos, personas que requieren recarga de oxígeno o medicamentos).
- **Recursos Críticos Compartidos:** Red comunitaria para compartir generadores eléctricos, paneles solares para recarga de teléfonos y tanques de agua potable.
- **Directorio de Brigadas Vecinales:** Grupos voluntarios de triage, primeros auxilios, defensa civil y radio comunitaria.
- **Seguimiento en Vivo:** Estados de "Activo", "En Atención" y "Atendido / Resuelto".

### 4. Experiencia de Usuario Accesible y Mobile-First
- **Publicación en Máximo 3 Clics:**
  - **Clic 1:** Selección de intención (Oficio, Favor Solidario, Alerta de Auxilio).
  - **Clic 2:** Selección de categoría en cuadrícula táctil con iconos claros.
  - **Clic 3:** Confirmación con plantilla rápida y publicación inmediata.
- **Geolocalización Interactiva:** Mapa en vivo (OpenStreetMap + Leaflet) con pines por código de color y círculos de radio de proximidad.
- **Soporte Online y Offline (PWA):** Si se cae la red o el internet durante una emergencia, la app almacena todo en almacenamiento local (`localStorage`) y sincroniza automáticamente las publicaciones al reconectarse.
- **Tutorial Interactivo Integrado:** Guía interactiva paso a paso para cualquier vecino del barrio accesible en cualquier momento desde el botón "¿Cómo funciona?".

---

## 🛠️ Tecnologías Empleadas

- **Framework:** React 19 + TypeScript
- **Empaquetador y Servidor Dev:** Vite 6
- **Estilos:** Tailwind CSS v4 con animaciones de pulso y estados de emergencia
- **Mapas y Geolocalización:** Leaflet + OpenStreetMap + API de Geolocalización del navegador
- **Iconografía:** Lucide React
- **Micro-interacciones:** Canvas Confetti para celebración comunitaria al dar Visto Bueno Vecinal

---

## 💻 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Anto-Jaimes/ICARO-AYLLU.git
   cd ICARO-AYLLU
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 👥 Integración Comunitaria

*ICARO-AYLLU* demuestra que la mejor tecnología no es la que aísla, sino la que fortalece el tejido social, la economía local y la resiliencia ciudadana ante cualquier adversidad.
