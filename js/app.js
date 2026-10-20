"use strict";

/* ============================================================
   APLICACIÓN
   ------------------------------------------------------------
   La configuración general vive en:  js/config.js
   Cada diapositiva vive en:          slides/recuerdo-XX.js
   Este archivo solo se encarga de la interacción y la galería.
   ============================================================ */
const CONFIG = window.SITE_CONFIG || {
  couple: {
    firstName: "Ivan",
    secondName: "Carol"
  },
  months: 5,
  welcome: {
    eyebrow: "Nuestra historia",
    subtitle: "Nuestra historia en unos cuantos recuerdos.",
    buttonLabel: "Recordemos estos meses",
    footerNote: "Hechos de días juntos"
  }
};

// Registro compartido entre la aplicación y los archivos de /slides.
window.MEMORY_SLIDES = window.MEMORY_SLIDES || {};

function getRegisteredSlides() {
  const registry = window.MEMORY_SLIDES && typeof window.MEMORY_SLIDES === "object"
    ? window.MEMORY_SLIDES
    : {};

  // Las claves numéricas permiten ordenar las diapositivas aunque
  // los archivos terminen de cargar en otro orden.
  return Object.keys(registry)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => registry[key]);
}

function loadScriptFile(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error(`No se pudo cargar el archivo: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadSlideFiles() {
  const files = Array.isArray(CONFIG.slideFiles)
    ? CONFIG.slideFiles.filter(Boolean)
    : [];

  if (!files.length) return [];

  const results = await Promise.allSettled(files.map(loadScriptFile));

  return results
    .map((result, index) => {
      if (result.status === "fulfilled") return null;

      console.error(result.reason);
      return files[index];
    })
    .filter(Boolean);
}

/* ============================================================
   REFERENCIAS DEL DOM
   ============================================================ */
const welcomeScreen = document.getElementById("welcomeScreen");
const memoriesScreen = document.getElementById("memoriesScreen");
const startButton = document.getElementById("startButton");
const memoriesTitle = document.getElementById("memoriesTitle");
const loadError = document.getElementById("loadError");

const slideElement = document.getElementById("slide");
const slideImage = document.getElementById("slideImage");
const slideText = document.getElementById("slideText");
const slideChapter = document.getElementById("slideChapter");
const slideStatus = document.getElementById("slideStatus");
const progressCurrent = document.getElementById("progressCurrent");
const progressTotal = document.getElementById("progressTotal");
const progressElement = document.querySelector(".progress");

const photoControls = document.getElementById("photoControls");
const photoPrevButton = document.getElementById("photoPrevButton");
const photoNextButton = document.getElementById("photoNextButton");
const photoCurrent = document.getElementById("photoCurrent");
const photoTotal = document.getElementById("photoTotal");
const slideThumbs = document.getElementById("slideThumbs");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const nextLabel = document.getElementById("nextLabel");
const nextIcon = document.getElementById("nextIcon");
const dotsContainer = document.getElementById("dots");

/* ============================================================
   ESTADO
   ============================================================ */
let slides = [];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const SCREEN_FADE_MS = 620;
const SLIDE_FADE_OUT_MS = 220;
const SLIDE_FADE_IN_MS = 260;

let currentIndex = 0;
let currentSlideImages = [];
let currentPhotoIndex = 0;
let slideBusy = false;
let screenBusy = false;
let photoBusy = false;
let photoTransitionId = 0;

/* ============================================================
   UTILIDADES
   ============================================================ */
function pad(value) {
  return String(value).padStart(2, "0");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderWordmark(element, first, second) {
  if (!element) return;

  const initialA = document.createElement("span");
  initialA.textContent = first.trim().charAt(0).toUpperCase() || "A";

  const amp = document.createElement("span");
  amp.className = "wordmark__amp";
  amp.textContent = "&";

  const initialB = document.createElement("span");
  initialB.textContent = second.trim().charAt(0).toUpperCase() || "L";

  element.replaceChildren(
    initialA,
    document.createTextNode(" "),
    amp,
    document.createTextNode(" "),
    initialB
  );
  element.setAttribute("aria-label", `${first} y ${second}`);
}

/* ============================================================
   CONTENIDO GENERAL
   ============================================================ */
const firstName = String(CONFIG.couple.firstName || "Ivan").trim();
const secondName = String(CONFIG.couple.secondName || "Carol").trim();
const parsedMonths = Number.parseInt(CONFIG.months, 10);
const months = Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : 1;
const monthWord = months === 1 ? "mes" : "meses";

function populateContent() {
  const chapterWord = slides.length === 1 ? "capítulo" : "capítulos";

  document.title = `${firstName} & ${secondName} — ${months} ${monthWord}`;

  const coupleNames = document.getElementById("coupleNames");
  if (coupleNames) {
    coupleNames.setAttribute("aria-label", `${firstName} y ${secondName}`);
  }

  setText("firstName", firstName);
  setText("secondName", secondName);
  setText("welcomeEyebrow", CONFIG.welcome.eyebrow);
  setText("welcomeSubtitle", CONFIG.welcome.subtitle);
  setText("startLabel", CONFIG.welcome.buttonLabel);
  setText("welcomeMonthTag", `${pad(months)} ${monthWord}`);
  setText("welcomeChapters", `${slides.length} ${chapterWord}`);
  setText("welcomeFooterNote", CONFIG.welcome.footerNote);
  setText("memoriesFooterMonths", `${months} ${monthWord} juntos`);

  renderWordmark(document.getElementById("welcomeWordmark"), firstName, secondName);
  renderWordmark(document.getElementById("memoriesWordmark"), firstName, secondName);

  progressTotal.textContent = pad(slides.length);
}

/* ============================================================
   DIAPOSITIVAS
   ============================================================ */
function buildDots() {
  dotsContainer.replaceChildren();

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `Ir al recuerdo ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
}

function getSlideImages(slide, slideIndex) {
  const rawImages = Array.isArray(slide.images)
    ? slide.images
    : slide.image
      ? [{ src: slide.image, alt: slide.alt }]
      : [];

  const images = rawImages
    .map((image, photoIndex) => {
      if (typeof image === "string") {
        return {
          src: image,
          alt: `Recuerdo ${slideIndex + 1}, foto ${photoIndex + 1}`
        };
      }

      return {
        src: image && (image.src || image.image) ? (image.src || image.image) : "",
        alt: image && image.alt
          ? image.alt
          : `Recuerdo ${slideIndex + 1}, foto ${photoIndex + 1}`
      };
    })
    .filter((image) => image.src);

  if (images.length) return images;

  return [{
    src: fallbackImage(pad(slideIndex + 1)),
    alt: `Recuerdo ${slideIndex + 1} de la pareja`
  }];
}

function buildPhotoGallery(images) {
  const hasSeveralPhotos = images.length > 1;

  currentPhotoIndex = 0;
  photoControls.hidden = !hasSeveralPhotos;
  slideThumbs.hidden = !hasSeveralPhotos;
  slideElement.classList.toggle("has-gallery", hasSeveralPhotos);
  photoTotal.textContent = String(images.length);
  slideThumbs.replaceChildren();
  slideThumbs.scrollLeft = 0;

  if (!hasSeveralPhotos) return;

  images.forEach((photo, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slide-thumb";
    button.setAttribute("aria-label", `Ver foto ${index + 1} de ${images.length}`);

    const thumbnail = document.createElement("img");
    thumbnail.src = photo.src;
    thumbnail.alt = "";
    thumbnail.decoding = "async";

    button.appendChild(thumbnail);
    button.addEventListener("click", () => selectPhoto(index));
    slideThumbs.appendChild(button);
  });
}

function updatePhotoInterface() {
  if (!currentSlideImages.length) return;

  const hasSeveralPhotos = currentSlideImages.length > 1;
  photoCurrent.textContent = String(currentPhotoIndex + 1);

  if (hasSeveralPhotos) {
    photoPrevButton.disabled = currentPhotoIndex === 0;
    photoNextButton.disabled = currentPhotoIndex === currentSlideImages.length - 1;
  }

  Array.from(slideThumbs.children).forEach((thumbnail, index) => {
    const isCurrent = index === currentPhotoIndex;
    thumbnail.classList.toggle("is-active", isCurrent);

    if (isCurrent) {
      thumbnail.setAttribute("aria-current", "true");
    } else {
      thumbnail.removeAttribute("aria-current");
    }
  });

  // Si hay muchas fotos, mantiene visible la miniatura seleccionada.
  const activeThumbnail = slideThumbs.children[currentPhotoIndex];
  if (activeThumbnail && slideThumbs.scrollWidth > slideThumbs.clientWidth) {
    const thumbRect = activeThumbnail.getBoundingClientRect();
    const stripRect = slideThumbs.getBoundingClientRect();

    if (thumbRect.left < stripRect.left || thumbRect.right > stripRect.right) {
      slideThumbs.scrollBy({
        left: thumbRect.left - stripRect.left - 8,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    }
  }
}

function updateSlideStatus() {
  const photoInfo = currentSlideImages.length > 1
    ? ` Foto ${currentPhotoIndex + 1} de ${currentSlideImages.length}.`
    : "";

  slideStatus.textContent =
    `Recuerdo ${currentIndex + 1} de ${slides.length}.${photoInfo} ${slideText.textContent}`;
}

function applyPhoto(index) {
  const photo = currentSlideImages[index];
  if (!photo) return;

  currentPhotoIndex = index;
  updatePhotoInterface();
  updateSlideStatus();

  slideImage.classList.add("is-loading");
  slideImage.dataset.failed = "false";
  slideImage.src = photo.src;
  slideImage.alt = photo.alt;

  if (slideImage.complete && slideImage.naturalWidth > 0) {
    window.setTimeout(() => {
      slideImage.classList.remove("is-loading");
      photoBusy = false;
    }, 30);
  } else {
    // La diapositiva nunca se queda bloqueada si una foto no responde.
    window.setTimeout(() => {
      slideImage.classList.remove("is-loading");
      photoBusy = false;
    }, 1200);
  }
}

function selectPhoto(index) {
  if (
    photoBusy ||
    index === currentPhotoIndex ||
    index < 0 ||
    index >= currentSlideImages.length
  ) {
    return;
  }

  photoBusy = true;
  const transitionId = ++photoTransitionId;
  slideImage.classList.add("is-loading");

  window.setTimeout(() => {
    if (transitionId !== photoTransitionId) return;
    applyPhoto(index);
  }, 140);
}

function updateInterface() {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;

  slideChapter.textContent = pad(currentIndex + 1);
  progressCurrent.textContent = pad(currentIndex + 1);
  progressElement.setAttribute(
    "aria-label",
    `Recuerdo ${currentIndex + 1} de ${slides.length}`
  );

  prevButton.disabled = isFirst;
  nextButton.disabled = isLast;
  nextLabel.textContent = isLast ? "Fin" : "Siguiente";
  nextIcon.textContent = "→";
  nextIcon.hidden = isLast;
  slideElement.classList.toggle("is-final", isLast);

  Array.from(dotsContainer.children).forEach((dot, index) => {
    const isCurrent = index === currentIndex;
    dot.classList.toggle("is-active", isCurrent);

    if (isCurrent) {
      dot.setAttribute("aria-current", "step");
    } else {
      dot.removeAttribute("aria-current");
    }
  });
}

function applySlide(index) {
  const slide = slides[index];
  if (!slide) return;

  // Cancela cualquier cambio de foto que estuviera en curso y
  // reinicia la galería de la nueva diapositiva en su primera foto.
  photoTransitionId += 1;
  photoBusy = false;
  currentSlideImages = getSlideImages(slide, index);

  slideText.textContent = slide.text || "Un recuerdo más juntos.";

  buildPhotoGallery(currentSlideImages);
  applyPhoto(0);
}

function goToSlide(index) {
  if (slideBusy || index === currentIndex || index < 0 || index >= slides.length) {
    return;
  }

  slideBusy = true;
  const shouldReduceMotion = reducedMotion.matches;
  const fadeOutTime = shouldReduceMotion ? 10 : SLIDE_FADE_OUT_MS;
  const fadeInTime = shouldReduceMotion ? 10 : SLIDE_FADE_IN_MS;

  slideElement.classList.add("is-changing");

  window.setTimeout(() => {
    currentIndex = index;
    applySlide(currentIndex);
    updateInterface();
    slideElement.classList.remove("is-changing");

    window.setTimeout(() => {
      slideBusy = false;
    }, fadeInTime);
  }, fadeOutTime);
}

/* ============================================================
   CAMBIO DE PANTALLA
   ============================================================ */
function openMemories() {
  if (screenBusy) return;

  screenBusy = true;
  startButton.disabled = true;

  const shouldReduceMotion = reducedMotion.matches;
  const fadeTime = shouldReduceMotion ? 20 : SCREEN_FADE_MS;

  welcomeScreen.classList.remove("is-active");

  window.setTimeout(() => {
    welcomeScreen.hidden = true;
    welcomeScreen.setAttribute("aria-hidden", "true");

    memoriesScreen.hidden = false;
    memoriesScreen.removeAttribute("aria-hidden");

    // Fuerza un primer cálculo con opacity: 0 antes de activar,
    // para que el fade-in de la segunda pantalla sí se reproduzca.
    void memoriesScreen.offsetWidth;
    memoriesScreen.classList.add("is-active");

    window.setTimeout(() => {
      screenBusy = false;
      startButton.disabled = false;
      memoriesTitle.focus({ preventScroll: true });
    }, fadeTime);
  }, fadeTime);
}

/* ============================================================
   IMAGEN DE RESPALDO
   Se usa únicamente si una foto no puede cargarse (por ejemplo,
   si no hay conexión). Mantiene la estética de la página.
   ============================================================ */
function fallbackImage(number) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#ede7dc"/>
      <line x1="280" y1="218" x2="320" y2="218" stroke="#6d2a34" stroke-width="2"/>
      <text x="300" y="194" fill="#6d2a34" font-family="Georgia, serif" font-size="28" text-anchor="middle">Nuestro recuerdo</text>
      <text x="300" y="246" fill="#716c63" font-family="Arial, sans-serif" font-size="11" letter-spacing="4" text-anchor="middle">FOTO ${number}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

slideImage.addEventListener("load", () => {
  slideImage.classList.remove("is-loading");
  photoBusy = false;
});

slideImage.addEventListener("error", () => {
  if (slideImage.dataset.failed === "true") return;
  slideImage.dataset.failed = "true";
  slideImage.src = fallbackImage(pad(currentIndex + 1));
});

/* ============================================================
   PRECARGA
   ============================================================ */
function preloadImages() {
  slides.forEach((slide, slideIndex) => {
    getSlideImages(slide, slideIndex).forEach((photo) => {
      const image = new Image();
      image.decoding = "async";
      image.src = photo.src;
    });
  });
}

/* ============================================================
   EVENTOS E INICIALIZACIÓN
   ============================================================ */
startButton.addEventListener("click", openMemories);
prevButton.addEventListener("click", () => goToSlide(currentIndex - 1));
nextButton.addEventListener("click", () => goToSlide(currentIndex + 1));
photoPrevButton.addEventListener("click", () => selectPhoto(currentPhotoIndex - 1));
photoNextButton.addEventListener("click", () => selectPhoto(currentPhotoIndex + 1));

document.addEventListener("keydown", (event) => {
  if (memoriesScreen.hidden) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToSlide(currentIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goToSlide(currentIndex + 1);
  }
});

function init() {
  populateContent();
  buildDots();
  applySlide(0);
  updateInterface();
  preloadImages();
}

function showLoadError(message) {
  if (!loadError) return;
  loadError.textContent = message;
  loadError.hidden = false;
}

async function boot() {
  startButton.disabled = true;

  const failedFiles = await loadSlideFiles();
  slides = getRegisteredSlides();

  if (!slides.length) {
    slides = [{
      images: [{ src: "https://picsum.photos/600/400", alt: "Nuestro recuerdo" }],
      text: "Un recuerdo para guardar."
    }];
    showLoadError("No se pudieron cargar las diapositivas. Revisa las rutas en js/config.js.");
  } else if (failedFiles.length) {
    showLoadError("Algunas diapositivas no se pudieron cargar. Revisa las rutas en js/config.js.");
  }

  startButton.disabled = false;
  init();
}

boot();
