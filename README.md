# Rutina Bailarín — PWA actualizable

## Cómo funciona
- La app (`index.html`, `app.js`, `style.css`) casi no cambia.
- La rutina vive en `routine.json`.
- Al abrir la app o pulsar **Actualizar rutina**, intenta descargar la versión más nueva con `cache: no-store`.
- Los checks, las sesiones completadas y el número de vuelta se guardan localmente en el iPhone.
- Los ejercicios tienen IDs estables, así que una edición de la rutina puede conservar el progreso de los ejercicios que siguen existiendo.

## Flujo después de publicarla
1. Pides en ChatGPT un cambio.
2. Se modifica `routine.json` y se hace commit/push.
3. GitHub Pages despliega el cambio.
4. En el iPhone pulsas **Actualizar rutina** o vuelves a abrir la app.
5. La rutina nueva aparece sin reinstalar la app.

## Publicar una vez
1. Crea un repositorio público en GitHub, por ejemplo `rutina-bailarin`.
2. Sube todos estos archivos a la raíz de `main`.
3. En GitHub: Settings → Pages → Deploy from a branch → `main` / `(root)`.
4. Espera a que aparezca la URL de GitHub Pages.
5. Ábrela en Safari del iPhone → Compartir → Añadir a pantalla de inicio.

## Importante
La actualización es tan rápida como el despliegue de GitHub Pages. Normalmente tarda poco, pero no es un sistema en tiempo real de milisegundos.
