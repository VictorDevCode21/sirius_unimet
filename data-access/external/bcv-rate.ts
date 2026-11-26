import 'server-only'
import { get } from 'node:https'
import { rootCertificates } from 'node:tls'
import { SECTIGO_OV_R36_CERTIFICATE } from '@/data-access/external/bcv-certificate'
import { parseBcvUsdRate, type BcvRate } from '@/data-access/external/bcv-rate-parser'

const BCV_URL = 'https://www.bcv.org.ve/'
const CACHE_MS = 30 * 60 * 1000
const TIMEOUT_MS = 10_000

let cached: { rate: BcvRate; fetchedAt: number } | null = null

function download(url: string) {
  return new Promise<string>((resolve, reject) => {
    const request = get(url, { ca: [...rootCertificates, SECTIGO_OV_R36_CERTIFICATE], timeout: TIMEOUT_MS }, (response) => {
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`BCV responded ${response.statusCode}`))
        return
      }
      response.setEncoding('utf8')
      let body = ''
      response.on('data', (chunk: string) => (body += chunk))
      response.on('end', () => resolve(body))
    })
    request.on('timeout', () => request.destroy(new Error('BCV request timed out')))
    request.on('error', reject)
  })
}

// Official USD rate published on the BCV home page, cached for 30 minutes. When the site cannot be reached it returns
// the last rate it read; it returns null only if it never got one.
export async function getBcvUsdRate(): Promise<(BcvRate & { stale: boolean }) | null> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return { ...cached.rate, stale: false }
  try {
    const rate = parseBcvUsdRate(await download(BCV_URL))
    if (!rate) throw new Error('BCV rate not found in the page')
    cached = { rate, fetchedAt: Date.now() }
    return { ...rate, stale: false }
  } catch (error) {
    console.error('Could not read the BCV rate:', error instanceof Error ? error.message : error)
    return cached ? { ...cached.rate, stale: true } : null
  }
}
