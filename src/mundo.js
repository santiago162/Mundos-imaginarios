const fs = require('node:fs');
const path = require('node:path');
const objectHash = require('object-hash');

const dataDir = path.join(__dirname, '..', 'data');

function crearMundo(args) {
  if (args.length !== 7 || args.some((argumento) => argumento.trim() === '')) {
    throw new Error(
      'Debes indicar una situación entre comillas, un mundo entre comillas y 5 colores.\n' +
        'Ejemplo: npm start -- "Una tormenta amenaza la ciudad" "Aerópolis, islas flotantes" rojo azul verde dorado violeta',
    );
  }

  const [situacion, mundo, ...colores] = args;
  const coloresUnicos = new Set(colores.map((color) => color.trim().toLowerCase()));

  if (coloresUnicos.size !== 5) {
    throw new Error('Los 5 colores deben ser distintos, sin importar mayúsculas o minúsculas.');
  }

  const id = objectHash({ situacion, mundo, colores }).slice(0, 8);

  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString(),
  };
}

function guardarMundo(mundo) {
  fs.mkdirSync(dataDir, { recursive: true });
  const ruta = path.join(dataDir, `mundo_${mundo.id}.json`);
  fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2), 'utf8');
  return ruta;
}

function leerMundo(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

module.exports = { crearMundo, guardarMundo, leerMundo };
