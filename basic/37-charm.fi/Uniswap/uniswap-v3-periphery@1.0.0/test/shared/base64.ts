export function base64Encode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64')
}

export function base64Decode(str: string): string {
  return Buffer.from(str, 'base64').toString('utf8')
}
