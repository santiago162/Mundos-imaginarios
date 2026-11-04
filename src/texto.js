const TEXTO_SISTEMA =
  'Write one paragraph in English, between 80 and 120 words, describing an image rather than telling a story. ' +
  'Describe the scene, elements, lighting, composition, and artistic style. Mention all five colors supplied in the world data. ' +
  'Do not add a title, Markdown, or any text that should appear inside the image.';

function explicarErrorApi(respuesta, servicio) {
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error('La API key no es válida. Revisa tu archivo .env.');
  }
  if (respuesta.status === 402 || respuesta.status === 429) {
    const espera = respuesta.headers.get('retry-after');
    const detalleEspera = espera ? ` El servicio recomienda esperar ${espera} segundos.` : '';
    throw new Error(`Superaste el límite gratuito. Espera un momento.${detalleEspera}`);
  }
  if (respuesta.status === 404 || respuesta.status === 410) {
    throw new Error('El modelo o la URL no existen. Revisa tu configuración.');
  }
  throw new Error(`El servicio de ${servicio} respondió con un error (HTTP ${respuesta.status}).`);
}

function explicarErrorConexion(error) {
  if (error && error.name === 'TimeoutError') {
    throw new Error('El servicio tardó demasiado en responder.');
  }
  if (error instanceof TypeError) {
    throw new Error('No se pudo conectar. Revisa tu internet o la URL.');
  }
  throw error;
}

async function describirMundo(mundo) {
  const apiKey = process.env.TEXTO_API_KEY;
  const url = process.env.TEXTO_URL;
  const modelo = process.env.TEXTO_MODELO;

  if (!apiKey || !url || !modelo) {
    throw new Error('Falta configurar TEXTO_API_KEY, TEXTO_URL o TEXTO_MODELO en el archivo .env.');
  }

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        messages: [
          { role: 'system', content: TEXTO_SISTEMA },
          { role: 'user', content: JSON.stringify(mundo) },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    explicarErrorConexion(error);
  }

  if (!respuesta.ok) {
    explicarErrorApi(respuesta, 'texto');
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error('El servicio de texto devolvió una respuesta inválida.');
  }

  const eleccion = datos.choices && datos.choices[0];
  const mensaje = eleccion && eleccion.message;
  let descripcion = mensaje && mensaje.content;
  if (typeof descripcion !== 'string' || descripcion.trim() === '') {
    throw new Error('El modelo de texto devolvió una descripción vacía.');
  }

  descripcion = descripcion.trim();
  if (descripcion.length > 1500) {
    descripcion = descripcion.slice(0, 1500);
    console.warn('La descripción superó 1500 caracteres y se recortó.');
  }

  return descripcion;
}

module.exports = { describirMundo };
