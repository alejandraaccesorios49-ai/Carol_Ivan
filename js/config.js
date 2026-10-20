"use strict";

/* ============================================================
   CONFIGURACIÓN GENERAL
   ------------------------------------------------------------
   Edita este archivo para cambiar:
   1. Los nombres de la pareja.
   2. La cantidad de meses.
   3. Los textos de la pantalla de bienvenida.

   Las diapositivas están una por archivo dentro de /slides.
   ============================================================ */
window.SITE_CONFIG = {
  // ── 1. NOMBRES DE LA PAREJA ──────────────────────────────
  couple: {
    firstName: "Ivan",
    secondName: "Carol"
  },

  // ── 2. CANTIDAD DE MESES JUNTOS ──────────────────────────
  months: 5,

  // ── 3. TEXTOS DE LA PANTALLA DE BIENVENIDA ───────────────
  welcome: {
    eyebrow: "Nuestros Meses Juntos",
    subtitle: "Nuestro tiempo juntos ha sido increíble. Cada momento a tu lado es un recuerdo que me llena de alegría",
    buttonLabel: "Recordemos estos meses",
    footerNote: "Hechos de días juntos"
  },

  // ── 4. ARCHIVOS DE DIAPOSITIVAS ──────────────────────────
  // La aplicación carga estos archivos automáticamente y los
  // ordena por la clave que cada uno registra ("01", "02"...).
  // Para añadir una diapositiva: crea el archivo en /slides y
  // agrega su ruta aquí.
  slideFiles: [
    "slides/recuerdo-01.js",
    "slides/recuerdo-02.js",
    "slides/recuerdo-03.js",
    "slides/recuerdo-04.js",
    "slides/recuerdo-05.js",
    "slides/recuerdo-06.js",
    "slides/recuerdo-07.js"
  ]
};
