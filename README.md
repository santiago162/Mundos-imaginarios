# mundos-ia

Programa de consola en Node.js que guarda los datos de un mundo imaginario, solicita una descripción visual en inglés a una API de texto y genera una imagen con NVIDIA FLUX.1-schnell. Los resultados se guardan en `data/`, `descripciones/` e `imagenes/`. Si la descripción o la imagen ya existen, se reutilizan para no volver a consumir cuota.

## Requisitos

- Node.js 20.12 o superior y npm.
- Una clave de Groq para texto y una clave de NVIDIA para imágenes.

## Instalación y configuración

```powershell
npm install
Copy-Item .env.example .env
```

Edita `.env` y reemplaza los valores de ejemplo por tus claves. No compartas ese archivo ni lo agregues a Git; está excluido en `.gitignore`.

## Ejemplo

```powershell
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

La situación y el mundo van entre comillas para que cada uno se reciba como un argumento. Deben indicarse exactamente cinco colores distintos.

## Estructura

```text
mundos-ia/
├── src/
│   ├── index.js
│   ├── mundo.js
│   ├── texto.js
│   └── imagen.js
├── data/             # JSON generado, no versionado
├── descripciones/    # texto generado, no versionado
├── imagenes/         # imágenes generadas, no versionadas
├── .env.example
├── .gitignore
├── package.json
└── PROMPT.md
```

## Servicios seleccionados

- Texto: [Groq API](https://console.groq.com/docs/api-reference#chat-create), modelo `openai/gpt-oss-20b`.
- Imagen: [NVIDIA FLUX.1-schnell](https://build.nvidia.com/black-forest-labs/flux-1-schnell).

Los modelos, límites gratuitos y endpoints pueden cambiar; revisa la documentación y tus cuotas antes de usarlos.

## Publicación y archivos ignorados

`npm publish --dry-run` permite revisar el paquete sin publicarlo. npm usa `.gitignore` como lista de exclusión si no existe `.npmignore`; por eso el archivo `.env` y los resultados generados no deben incluirse. En la prueba realizada, el dry-run con `.gitignore` no incluyó `.env` ni las carpetas de resultados. Al renombrar temporalmente `.gitignore` a `.gitignore.off`, un `.env` ficticio sí apareció en la lista, junto con `.gitignore.off`; esto demuestra el riesgo de publicar credenciales. El archivo fue restaurado y el `.env` ficticio eliminado.

**Pendiente:** agregar en `evidencias/` las capturas de ambos dry-run, las ejecuciones, los archivos generados, los errores controlados y `git ls-files`. No se incluyeron capturas inventadas.

## Preguntas de reflexión

**¿Por qué el id se calcula sin la fecha?**  
El id debe depender solo de la situación, el mundo y los colores para que los mismos datos produzcan el mismo nombre de archivo. Si la fecha se incluyera, cada ejecución generaría otro id y no se podrían reutilizar los resultados.

**¿Por qué pedir la descripción en inglés?**  
El taller propone inglés porque los modelos de imágenes suelen entender mejor esos prompts. Para comparar con español, genera dos mundos equivalentes cambiando solo el idioma y registra el resultado observado.

**¿Qué diferencia hay entre una respuesta JSON y bytes de imagen? ¿Qué es base64?**  
El JSON es texto estructurado que contiene datos y metadatos; los bytes son el contenido binario del archivo. Base64 representa bytes como texto para poder transportarlos dentro de JSON y luego reconstruirlos con `Buffer.from(..., 'base64')`.

**¿Qué pasaría si guardas la imagen con `utf-8`?**  
Se interpretaría el contenido binario como texto y se alterarían los bytes, por lo que probablemente el archivo no podría abrirse. Por eso se escribe el `Buffer` directamente, sin indicar codificación.

**¿Qué pasos consumen cuota y cómo se evita repetirlos?**  
Las llamadas a los modelos de texto y de imágenes pueden consumir cuota. El programa comprueba si el `.txt` y el `.jpg` ya existen y reutiliza sus contenidos en vez de repetir esas llamadas.

**Si usaste IA, ¿qué fue lo más difícil y qué corregiste?**  
Completa esta respuesta con tu experiencia personal tras revisar y probar el código; no debe atribuirse al estudiante una revisión que todavía no haya hecho.

## Evidencias y entrega

Guarda en `evidencias/` tus capturas de las ejecuciones, archivos generados, errores controlados, experimentos de npm y `git ls-files`. Las claves reales nunca deben aparecer en capturas, commits, prompts ni archivos versionados. Consulta [PROMPT.md](./PROMPT.md) y completa las secciones que dependen de tu propio proceso y sustentación.
