import { toLunas } from './nimiq'

function createHubApi() {
  const HubApi = window.HubApi
  if (!HubApi) throw new Error('Nimiq Hub is unavailable. Please refresh and try again.')
  return new HubApi('https://hub.nimiq.com')
}

export async function chooseNimiqAddress() {
  const hubApi = createHubApi()
  const result = await hubApi.chooseAddress({ appName: 'Folester' })
  const address = typeof result?.address === 'string' ? result.address : result?.address?.toUserFriendlyAddress?.()

  if (!address) throw new Error('Nimiq Hub did not return a wallet address.')
  return address
}

export async function checkoutNimiqPayment({ recipient, amount }) {
  const address = String(recipient || '').trim().replace(/\s+/g, '')
  if (!address) throw new Error('Creator has not connected a wallet.')

  const value = Number(toLunas(amount))
  if (!Number.isSafeInteger(value)) throw new Error('Tip amount is too large.')

  const hubApi = createHubApi()
  return hubApi.checkout({ appName: 'Folester', recipient: address, value })
}

const walletChangeEvent = 'folester:nimiq-wallet-change'

export function announceNimiqWalletChange(address) {
  window.dispatchEvent(new CustomEvent(walletChangeEvent, { detail: { address } }))
}

export function onNimiqWalletChange(listener) {
  const handleChange = (event) => listener(event.detail?.address || '')
  window.addEventListener(walletChangeEvent, handleChange)
  return () => window.removeEventListener(walletChangeEvent, handleChange)
}
