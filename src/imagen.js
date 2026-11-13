function explicarErrorApi(respuesta) {
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error('La clave de Pollinations no es válida o no tiene permiso para generar imágenes.');
  }
  if (respuesta.status === 402) {
    throw new Error('La clave de Pollinations no tiene saldo suficiente.');
  }
  if (respuesta.status === 429) {
    const espera = respuesta.headers.get('retry-after');
    const detalleEspera = espera ? ` El servicio recomienda esperar ${espera} segundos.` : '';
    throw new Error(`Pollinations limitó las solicitudes.${detalleEspera}`);
  }
  if (respuesta.status === 404 || respuesta.status === 410) {
    throw new Error('El modelo de imágenes o la URL de Pollinations no están disponibles.');
  }
  if (respuesta.status === 504) {
    throw new Error('Pollinations agotó el tiempo de espera al generar la imagen. Inténtalo más tarde.');
  }
  throw new Error(`Pollinations respondió con un error (HTTP ${respuesta.status}).`);
}

function explicarErrorConexion(error) {
  if (error && error.name === 'TimeoutError') {
    throw new Error('Pollinations tardó demasiado en generar la imagen.');
  }
  if (error instanceof TypeError) {
    throw new Error('No se pudo conectar con Pollinations. Revisa tu conexión a internet.');
  }
  throw error;
}

async function generarImagen(descripcion) {
  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    throw new Error('Falta configurar POLLINATIONS_API_KEY en el archivo .env.');
  }

  const url = new URL(`https://gen.pollinations.ai/image/${encodeURIComponent(descripcion)}`);
  url.search = new URLSearchParams({
    model: 'black-forest-labs/flux.1-schnell',
    width: '1024',
    height: '1024',
    seed: '0',
  }).toString();

  let respuesta;
  try {
    respuesta = await fetch(url, {
      headers: {
        Accept: 'image/png, image/jpeg, image/webp, image/gif, image/svg+xml',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(180000),
    });
  } catch (error) {
    explicarErrorConexion(error);
  }

  if (!respuesta.ok) {
    explicarErrorApi(respuesta);
  }

  const contentType = respuesta.headers.get('content-type');
  const tipoImagen = contentType && contentType.split(';')[0].trim().toLowerCase();
  const extension = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  }[tipoImagen];

  if (!extension) {
    throw new Error(`Pollinations devolvió una respuesta que no es una imagen (${contentType || 'tipo desconocido'}).`);
  }

  const bytes = Buffer.from(await respuesta.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error('Pollinations devolvió una imagen vacía.');
  }

  return { bytes, extension };
}

module.exports = { generarImagen };
