const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { generarImagen } = require('../src/imagen');

const originalApiKey = process.env.POLLINATIONS_API_KEY;
const originalFetch = global.fetch;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.POLLINATIONS_API_KEY;
  } else {
    process.env.POLLINATIONS_API_KEY = originalApiKey;
  }
  global.fetch = originalFetch;
});

test('solicita una imagen a Pollinations con autenticación y devuelve bytes y formato', async () => {
  process.env.POLLINATIONS_API_KEY = 'test-key';
  const imageBytes = Buffer.from('fake png bytes');
  let requestUrl;
  let requestOptions;

  global.fetch = async (url, options) => {
    requestUrl = new URL(url);
    requestOptions = options;
    return new Response(imageBytes, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  };

  const result = await generarImagen('A city among the clouds');

  assert.deepEqual(result, { bytes: imageBytes, extension: 'png' });
  assert.equal(requestUrl.origin, 'https://gen.pollinations.ai');
  assert.equal(requestUrl.pathname, '/image/A%20city%20among%20the%20clouds');
  assert.equal(requestUrl.searchParams.get('model'), 'black-forest-labs/flux.1-schnell');
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-key');
});

test('admite JPEG y reporta la extensión correspondiente', async () => {
  process.env.POLLINATIONS_API_KEY = 'test-key';
  const imageBytes = Buffer.from('fake jpeg bytes');
  global.fetch = async () =>
    new Response(imageBytes, {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    });

  assert.deepEqual(await generarImagen('prompt'), {
    bytes: imageBytes,
    extension: 'jpg',
  });
});

test('falla explícitamente si falta la clave de Pollinations', async () => {
  delete process.env.POLLINATIONS_API_KEY;

  await assert.rejects(generarImagen('prompt'), /Falta configurar POLLINATIONS_API_KEY/);
});

test('informa los errores de saldo agotado del servicio', async () => {
  process.env.POLLINATIONS_API_KEY = 'test-key';
  global.fetch = async () =>
    new Response('payment required', { status: 402 });

  await assert.rejects(generarImagen('prompt'), /no tiene saldo suficiente/);
});
