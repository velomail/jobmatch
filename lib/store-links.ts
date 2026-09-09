export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '#'
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || '#'

export function storeHref(url: string) {
  return url && url !== '#' ? url : undefined
}
