function explicarErrorApi(respuesta) {
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
  throw new Error(`El servicio de imágenes respondió con un error (HTTP ${respuesta.status}).`);
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

async function generarImagen(descripcion) {
  const apiKey = process.env.IMAGEN_API_KEY;
  const url = process.env.IMAGEN_URL;

  if (!apiKey || !url) {
    throw new Error('Falta configurar IMAGEN_API_KEY o IMAGEN_URL en el archivo .env.');
  }

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: descripcion,
        width: 1024,
        height: 1024,
        steps: 4,
        seed: 0,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    explicarErrorConexion(error);
  }

  if (!respuesta.ok) {
    explicarErrorApi(respuesta);
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error('El servicio de imágenes devolvió una respuesta inválida.');
  }

  const artefacto = datos.artifacts?.[0];
  if (!artefacto || artefacto.finishReason !== 'SUCCESS' || !artefacto.base64) {
    throw new Error('El servicio de imágenes no completó la generación correctamente.');
  }

  const bytes = Buffer.from(artefacto.base64, 'base64');
  if (bytes.length === 0) {
    throw new Error('El servicio de imágenes devolvió una imagen vacía.');
  }

  return bytes;
}

module.exports = { generarImagen };
