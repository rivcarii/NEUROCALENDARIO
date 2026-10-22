// Verifica el cifrado y la firma contra una implementación de referencia (http_ece, la que usa la librería web-push).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, createPublicKey, createVerify, randomBytes } from 'node:crypto';
import ece from 'http_ece';
import { b64u, encryptPayload, generateVapid, unb64u, vapidHeader } from '../src/webpush.js';

test('el navegador puede descifrar el aviso (aes128gcm, RFC 8291)', async () => {
  const ua = createECDH('prime256v1'); ua.generateKeys();
  const auth = randomBytes(16);
  const body = await encryptPayload('{"ref":"m-1","at":1}', b64u(ua.getPublicKey()), b64u(auth));
  const plain = ece.decrypt(Buffer.from(body), { version: 'aes128gcm', privateKey: ua, authSecret: auth });
  assert.equal(plain.toString(), '{"ref":"m-1","at":1}');
});

test('la firma VAPID es un ES256 válido con la clave pública anunciada', async () => {
  const v = await generateVapid();
  const h = await vapidHeader('https://web.push.apple.com/abc', v, 'https://example.org/', 1_700_000_000_000);
  const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(h);
  assert.equal(k, v.publicKey);
  const [hd, cl, sig] = t.split('.');
  const claims = JSON.parse(Buffer.from(unb64u(cl)).toString());
  assert.equal(claims.aud, 'https://web.push.apple.com');
  assert.equal(claims.sub, 'https://example.org/');
  const raw = unb64u(k);
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(raw.slice(1, 33)), y: b64u(raw.slice(33, 65)) }, format: 'jwk' });
  const ok = createVerify('SHA256').update(`${hd}.${cl}`).verify({ key, dsaEncoding: 'ieee-p1363' }, Buffer.from(unb64u(sig)));
  assert.ok(ok);
});
