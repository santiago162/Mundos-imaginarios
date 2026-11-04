const fs = require('node:fs');
const path = require('node:path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

const raiz = path.join(__dirname, '..');
const descripcionesDir = path.join(raiz, 'descripciones');
const imagenesDir = path.join(raiz, 'imagenes');

function cargarVariablesDeEntorno() {
  const rutaEnv = path.join(raiz, '.env');
  if (fs.existsSync(rutaEnv)) {
    try {
      process.loadEnvFile(rutaEnv);
    } catch {
      throw new Error('No se pudo leer .env. Revisa que tenga el formato correcto.');
    }
  }
}

async function main() {
  try {
    cargarVariablesDeEntorno();

    // Paso 1: validar los argumentos, crear el objeto y guardar el JSON.
    const mundoNuevo = crearMundo(process.argv.slice(2));
    const rutaJson = guardarMundo(mundoNuevo);
    console.log(`Paso 1: mundo guardado en ${path.relative(raiz, rutaJson)}`);

    // Paso 2: leer el JSON guardado y reutilizar la descripción si ya existe.
    const mundoGuardado = leerMundo(rutaJson);
    fs.mkdirSync(descripcionesDir, { recursive: true });
    const rutaDescripcion = path.join(descripcionesDir, `mundo_${mundoGuardado.id}.txt`);
    let descripcion;

    if (fs.existsSync(rutaDescripcion)) {
      descripcion = fs.readFileSync(rutaDescripcion, 'utf8');
      console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
    } else {
      descripcion = await describirMundo(mundoGuardado);
      fs.writeFileSync(rutaDescripcion, descripcion, 'utf8');
      console.log(`Paso 2: descripción guardada en ${path.relative(raiz, rutaDescripcion)}`);
    }

    // Paso 3: enviar el texto guardado y reutilizar la imagen si ya existe.
    fs.mkdirSync(imagenesDir, { recursive: true });
    const rutaImagen = path.join(imagenesDir, `mundo_${mundoGuardado.id}.jpg`);

    if (fs.existsSync(rutaImagen)) {
      console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
    } else {
      const bytesImagen = await generarImagen(fs.readFileSync(rutaDescripcion, 'utf8'));
      fs.writeFileSync(rutaImagen, bytesImagen);
      console.log(`Paso 3: imagen guardada en ${path.relative(raiz, rutaImagen)}`);
    }

    console.log('Listo. Revisa la carpeta imagenes.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    process.exitCode = 1;
  }
}

main();
