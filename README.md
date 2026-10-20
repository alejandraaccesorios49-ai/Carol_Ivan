# Ivan & Carol — 5 meses

Página de aniversario en HTML, CSS y JavaScript puro, sin recargar el documento.

## Estructura

```text
5Meses/
├── index.html                 Página principal y estructura de las dos pantallas
├── css/
│   └── styles.css             Diseño, responsive y transiciones
├── img/
│   └── foto1.jpg … foto14.jpg Fotos reales de la pareja
├── js/
│   ├── config.js              Nombres, meses y textos de bienvenida
│   └── app.js                 Lógica de pantallas, galería y navegación
├── slides/
│   ├── recuerdo-01.js         Contenido de la diapositiva 1
│   ├── recuerdo-02.js         Contenido de la diapositiva 2
│   ├── recuerdo-03.js
│   ├── recuerdo-04.js
│   ├── recuerdo-05.js
│   ├── recuerdo-06.js
│   └── recuerdo-07.js         Carta final con el "TE AMO"
└── README.md
```

Cada diapositiva es un archivo independiente. `js/app.js` los carga
automáticamente usando la lista `slideFiles` de `js/config.js`.

Para añadir otra diapositiva:

1. Duplica uno de los archivos de `slides/`.
2. Cámbiale el nombre y la clave (`"07"`, por ejemplo).
3. Agrega la ruta del nuevo archivo al arreglo `slideFiles` en `js/config.js`.

## Fotos

En cada archivo de `slides/` se usa un arreglo `images`:

```js
images: [
  { src: "img/foto1.jpg", alt: "Descripción de la foto" },
  { src: "img/foto2.jpg", alt: "Descripción de la foto" }
]
```

Puedes usar rutas locales o URLs. Si una diapositiva tiene una sola imagen,
los controles de fotos y las miniaturas se ocultan automáticamente.

Las fotos se muestran en un marco vertical para conservar los rostros.
El encuadre se ajusta desde `.slide__figure` y `object-position` en
`css/styles.css`.

## Página final

`slides/recuerdo-07.js` usa `layout: "letter"` en lugar de fotos. Su
contenido se edita en el objeto `letter`:

```js
letter: {
  eyebrow: "Para ti, Carol",
  paragraphs: ["Primer párrafo...", "Segundo párrafo..."],
  signature: "Ivan",
  bigText: "TE AMO"
}
```

## Abrir la página

Haz doble clic en `index.html`. No necesita servidor local.
