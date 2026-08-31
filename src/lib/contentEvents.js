const contentCreatedEvent = 'folester:content-created'

export function announceContentCreated(kind) {
  window.dispatchEvent(new CustomEvent(contentCreatedEvent, { detail: { kind } }))
}

export function onContentCreated(listener) {
  const handleEvent = (event) => listener(event.detail?.kind)
  window.addEventListener(contentCreatedEvent, handleEvent)
  return () => window.removeEventListener(contentCreatedEvent, handleEvent)
}
