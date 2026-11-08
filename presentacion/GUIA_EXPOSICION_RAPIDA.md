# ⏱️ HOJA DE RUTA RÁPIDA — EXPOSICIÓN DE 15 MINUTOS (AYLLU)

Usa esta hoja como guía rápida de apoyo frente a la pantalla para no perderte en los tiempos.

---

## 🗺️ MAPA DE TIEMPOS (15 Minutos)

| Bloque | Tiempo | Qué se muestra en pantalla | Responsable / Acción Clave |
| :---: | :---: | :--- | :--- |
| **1** | `0:00 - 5:00` | **Diapositivas PPT (Láminas 1 a 5)** | Pitch de problemática, solución AYLLU, Ayni y datos oficiales. |
| **2** | `5:00 - 10:00` | **Navegador Web / Celular con AYLLU** | Demostración de rutas a pie, 3 clics, gas/farmacias y **simulacro offline**. |
| **3** | `10:00 - 15:00`| **Visual Studio Code (Editor de Código)** | Mostrar arquitectura, OSRM, Plus Codes, Web Audio y APIs nacionales. |

---

## 🎯 ARCHIVOS EXACTOS A ABRIR EN EL CÓDIGO (Minuto 10 a 15)

Ten estas pestañas ya abiertas en Visual Studio Code para no perder tiempo buscándolas:

1. [`src/services/geoService.ts`](file:///c:/Users/Antonela/Documents/SEXTO%20CICLO/ICARO-AYLLU/src/services/geoService.ts)  
   👉 **Líneas clave:** `reverseGeocode()` (Nominatim) y `getWalkingRoute()` (OSRM Foot Routing a pie).
2. [`src/utils/plusCodes.ts`](file:///c:/Users/Antonela/Documents/SEXTO%20CICLO/ICARO-AYLLU/src/utils/plusCodes.ts)  
   👉 **Líneas clave:** Algoritmo matemático offline sin HTTP y deletreo fonético.
3. [`src/utils/acousticP2P.ts`](file:///c:/Users/Antonela/Documents/SEXTO%20CICLO/ICARO-AYLLU/src/utils/acousticP2P.ts)  
   👉 **Líneas clave:** Web Audio API nativa con oscilador a 2900 Hz.
4. [`src/services/hazardService.ts`](file:///c:/Users/Antonela/Documents/SEXTO%20CICLO/ICARO-AYLLU/src/services/hazardService.ts)  
   👉 **Líneas clave:** Ingesta concurrente de IGP (sismos) y SENAMHI (avisos).
5. [`src/index.css`](file:///c:/Users/Antonela/Documents/SEXTO%20CICLO/ICARO-AYLLU/src/index.css)  
   👉 **Líneas clave:** Tokens temáticos, contraste WCAG 2.1 AAA y modo `[data-mode='emergency']`.

---

## 💥 LOS 3 MOMENTOS "WOW" PARA GANAR

1. **Minuto 5:30 (Muro a pie):** Resaltar la frase *"A 3 min a pie (240 m)"* para probar que se cumple *"sin necesidad de transporte mayor"*.
2. **Minuto 8:45 (El corte de señal):** Desconectar el WiFi o activar Modo Avión en vivo y mostrar cómo el Plus Code y la alarma se generan de inmediato sin red.
3. **Minuto 12:45 (Web Audio nativo):** Explicar que la alarma no es un archivo MP3 pesado, sino un oscilador senoidal puro generado por el procesador del celular.
