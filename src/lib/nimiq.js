const LUNAS_PER_NIM = 100_000n

export function toLunas(amount) {
  const value = String(amount).trim()
  if (!/^\d+(?:\.\d{1,5})?$/.test(value)) {
    throw new Error('Enter a positive NIM amount with up to 5 decimal places.')
  }

  const [whole, fraction = ''] = value.split('.')
  const lunas = (BigInt(whole) * LUNAS_PER_NIM) + BigInt(fraction.padEnd(5, '0'))
  if (lunas <= 0n) throw new Error('Tip amount must be greater than zero.')
  return lunas.toString()
}

export function createNimiqPaymentUri(recipientAddress, amount) {
  const recipient = recipientAddress.trim().replace(/\s+/g, '')
  if (!recipient) throw new Error('Creator has not connected a wallet.')
  return `nimiq:${encodeURIComponent(recipient)}?amount=${toLunas(amount)}`
}
