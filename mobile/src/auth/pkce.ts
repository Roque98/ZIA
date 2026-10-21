import * as Crypto from 'expo-crypto';

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createPkce(): Promise<{ verifier: string; challenge: string; state: string }> {
  const random = await Crypto.getRandomBytesAsync(32);
  const verifier = base64UrlFromBytes(random);
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const challenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const stateBytes = await Crypto.getRandomBytesAsync(16);
  return { verifier, challenge, state: base64UrlFromBytes(stateBytes) };
}
