const avatarChangeEvent = 'folester:avatar-change'

export function announceAvatarChange(avatarUrl) {
  window.dispatchEvent(new CustomEvent(avatarChangeEvent, { detail: { avatarUrl } }))
}

export function onAvatarChange(listener) {
  const handleChange = (event) => listener(event.detail?.avatarUrl || '')
  window.addEventListener(avatarChangeEvent, handleChange)
  return () => window.removeEventListener(avatarChangeEvent, handleChange)
}
