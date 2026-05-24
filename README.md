# Prompt CMS

Aplicacion web estatica para pegar documentos de prompts, parsearlos por secciones dinamicas y gestionarlos como proyectos.

## Uso

Abre `index.html` en el navegador. No requiere servidor ni instalacion.

Los proyectos se guardan automaticamente en `localStorage`. Tambien puedes exportar un proyecto individual, importar `.json` o `.txt`, y crear un backup JSON de todos los proyectos.

## Formato

```txt
@PROJECT: Galaxies
@GENRE: Space Trance

@SUNO
prompt...

@WALLPAPERS
IMG01|16:9:: prompt...
IMG02|16:9:: prompt...

@VERTICALS
IMG01|9:16:: prompt...

@TRACKS
TRACK01:: name...
TRACK02:: name...

@COVER
prompt...

@YT_TITLE_EN
title...

@DESC_EN
description...
```

Cada linea que empieza con `@` abre una seccion o metadata inicial. Las secciones no estan hardcodeadas: si agregas `@THUMBNAILS`, `@SPOTIFY`, `@SHORTS` o cualquier otra, se renderiza automaticamente como tab.
