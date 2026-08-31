const hashtagPattern = /#[A-Za-z0-9_]+/g

export function extractHashtags(text = '') {
  return [...String(text).matchAll(hashtagPattern)].map(([tag]) => tag.slice(1).toLowerCase())
}

export function includesHashtag(text, tag) {
  const normalizedTag = String(tag || '').replace(/^#/, '').toLowerCase()
  return Boolean(normalizedTag) && extractHashtags(text).includes(normalizedTag)
}
