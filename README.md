# Prompt Manager

> Aplicacion web estatica para gestionar prompts de IA organizados por proyectos, secciones y categorias.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat)
![LocalStorage](https://img.shields.io/badge/storage-localStorage-orange?style=flat)
![File System API](https://img.shields.io/badge/File%20System%20Access%20API-supported-blue?style=flat)

---

## Descripcion

Prompt Manager es una aplicacion cliente 100% estatica, sin servidor, sin npm, sin frameworks. Abre `index.html` en cualquier navegador moderno y funciona de inmediato.

Disenada para quienes trabajan con prompts de IA (imagen, musica, texto, video) y necesitan una forma rapida de organizar, revisar, copiar y reutilizar sus prompts sin depender de servicios externos.

---

## Caracteristicas

- **Parseo estructurado** — Pega un bloque con formato `@SECCION` y la app crea automaticamente tabs y secciones sin configuracion
- **Proyectos dinamicos** — Cada proyecto tiene secciones, items, notas y etiquetas generadas automaticamente
- **Acciones por item** — Copiar al portapapeles, marcar como usado, favorito, like/dislike, editar, eliminar
- **Busqueda global** — Filtra proyectos desde el sidebar en tiempo real
- **Favoritos** — Marca proyectos e items como favoritos con indicador visual
- **Tema claro / oscuro** — Persiste entre sesiones con `localStorage`
- **Sidebar colapsable** — En desktop se oculta/muestra con transicion; en movil es un drawer con overlay
- **Exportar / Importar** — JSON por proyecto o backup completo de todos los proyectos
- **Vincular archivo JSON** — Mediante la File System Access API, guarda automaticamente en un archivo `.json` local sin servidor
- **Vista biblioteca** — Resumen general con estadisticas, tarjetas de proyectos y categorias
- **Lista virtual** — Renderizado eficiente para secciones con muchos items
- **Responsive** — Funciona en movil, tablet y desktop

---

## Inicio rapido

No requiere instalacion ni servidor.

```bash
git clone https://github.com/tu-usuario/prompt-manager.git
cd prompt-manager
# Abre index.html en tu navegador
```

O simplemente descarga el repositorio y abre `index.html`.

---

## Paginas

| Archivo | Descripcion |
|---|---|
| `index.html` | Biblioteca general — resumen, estadisticas y tarjetas de todos los proyectos |
| `new.html` | Crear o importar un proyecto nuevo |
| `project.html?id=...` | Vista de proyecto — Overview, tabs dinamicas por seccion, notas, acciones |

---

## Formato de entrada

Cada proyecto se define pegando un bloque de texto con este formato:

```
@PROJECT: Galaxies
@GENRE: Space Trance

@SUNO
prompt de musica...

@WALLPAPERS
IMG01|16:9:: prompt de imagen...
IMG02|16:9:: prompt de imagen...

@VERTICALS
IMG01|9:16:: prompt vertical...

@TRACKS
TRACK01:: nombre del track...
TRACK02:: nombre del track...

@COVER
prompt de portada...

@YT_TITLE_EN
titulo para YouTube...

@DESC_EN
descripcion del video...
```

**Reglas:**
- Las lineas `@CLAVE: valor` definen metadatos del proyecto (`PROJECT`, `GENRE`, etc.)
- Las lineas `@NOMBRE` (sin `:`) abren una nueva seccion que se renderiza como tab
- Las secciones no estan hardcodeadas — cualquier `@NOMBRE` crea un tab automaticamente
- Cada linea dentro de una seccion es un item independiente

---

## Persistencia de datos

Los datos se guardan en dos capas opcionales:

**1. localStorage (por defecto)**
Automatico, sin configuracion. Los datos persisten en el navegador.

**2. Archivo JSON local (opcional)**
Usando el boton de base de datos en el footer del sidebar, puedes vincular un archivo `.json` mediante la [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API). Cada cambio se escribe automaticamente al archivo.

> La carpeta `data/` esta incluida en `.gitignore` para que los datos personales no se suban al repositorio.

---

## Estructura del proyecto

```
prompt-manager/
├── index.html       # Biblioteca general
├── new.html         # Crear proyecto
├── project.html     # Vista de proyecto
├── app.js           # Logica completa de la aplicacion
├── styles.css       # Estilos (dark/light theme, responsive)
├── data/            # Archivos de datos locales (ignorados por git)
│   └── .gitkeep
└── .gitignore
```

---

## Compatibilidad

| Navegador | localStorage | File System API |
|---|---|---|
| Chrome / Edge 86+ | Si | Si |
| Firefox | Si | No (fallback a localStorage) |
| Safari 15.2+ | Si | Parcial |

La app funciona completamente sin la File System API — es un bonus para quienes usen Chrome/Edge.

---

## Licencia

MIT — libre para uso personal y comercial.
