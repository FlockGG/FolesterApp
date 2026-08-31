const mediaBucket = 'public-assets'
const maxMediaBytes = 25 * 1024 * 1024

export function isVideoUrl(url = '') {
  return /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(url)
}

export function validateMediaFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Choose an image or video file.')
  if (file.size > maxMediaBytes) throw new Error('Media files must be 25 MB or smaller.')
}

export async function uploadMedia(client, userId, file) {
  validateMediaFile(file)
  if (!file) return null

  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const filename = `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const path = `${userId}/${filename}`
  const { error } = await client.storage.from(mediaBucket).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return client.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}

export async function uploadAvatar(client, userId, file) {
  if (!file?.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile images must be 5 MB or smaller.')

  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const path = `${userId}/avatar-${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
  const { error } = await client.storage.from(mediaBucket).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return client.storage.from(mediaBucket).getPublicUrl(path).data.publicUrl
}
