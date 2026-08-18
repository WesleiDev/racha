const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function newId(len = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export function newToken(len = 4): string {
  return newId(len)
}
