function unwrap({ data, error }) {
  if (error) throw error
  return data
}

const postFields = `
  id, user_id, content, topic, coin_tag, media_url, created_at,
  profiles ( username, avatar_url, nimiq_address ),
  likes ( user_id ),
  comments ( id, user_id, content, created_at, profiles ( username, avatar_url ) )
`

const calloutFields = `
  id, user_id, title, thesis, sources, coin_tag, media_url, created_at,
  profiles ( username, avatar_url, nimiq_address ),
  likes ( user_id ),
  comments ( id, user_id, content, created_at, profiles ( username, avatar_url ) )
`

export function getPosts(client) {
  return client.from('posts').select(postFields).order('created_at', { ascending: false }).then(unwrap)
}

export function getUserPosts(client, userId) {
  return client.from('posts').select(postFields).eq('user_id', userId).order('created_at', { ascending: false }).then(unwrap)
}

export function insertPost(client, post) {
  return client.from('posts').insert(post).select(postFields).single().then(unwrap)
}

export async function deletePost(client, postId, userId) {
  const { error } = await client.from('posts').delete().eq('id', postId).eq('user_id', userId)
  if (error) throw error
}

export function getCallouts(client) {
  return client.from('callouts').select(calloutFields).order('created_at', { ascending: false }).then(unwrap)
}

export function getUserCallouts(client, userId) {
  return client.from('callouts').select(calloutFields).eq('user_id', userId).order('created_at', { ascending: false }).then(unwrap)
}

export function insertCallout(client, callout) {
  return client.from('callouts').insert(callout).select(calloutFields).single().then(unwrap)
}

export async function deleteCallout(client, calloutId, userId) {
  const { error } = await client.from('callouts').delete().eq('id', calloutId).eq('user_id', userId)
  if (error) throw error
}

export async function toggleLike(client, { userId, postId, calloutId, liked }) {
  const targetColumn = postId ? 'post_id' : 'callout_id'
  const targetId = postId || calloutId
  const request = liked
    ? client.from('likes').delete().eq('user_id', userId).eq(targetColumn, targetId)
    : client.from('likes').insert({ user_id: userId, [targetColumn]: targetId })
  const { error } = await request
  if (error) throw error
}

export function insertComment(client, comment) {
  return client
    .from('comments')
    .insert(comment)
    .select('id, user_id, content, created_at, profiles ( username, avatar_url )')
    .single()
    .then(unwrap)
}

function cleanSearchTerm(query) {
  return query.trim().replace(/[%,_().]/g, ' ').replace(/\s+/g, ' ')
}

export async function searchContent(client, query) {
  const term = cleanSearchTerm(query)
  if (!term) return { posts: [], callouts: [] }
  const pattern = `%${term}%`
  const [posts, callouts] = await Promise.all([
    client.from('posts').select('id, content, topic, coin_tag, created_at, profiles ( username )').ilike('content', pattern).order('created_at', { ascending: false }).limit(8),
    client.from('callouts').select('id, title, thesis, coin_tag, created_at, profiles ( username )').or(`title.ilike.${pattern},thesis.ilike.${pattern}`).order('created_at', { ascending: false }).limit(8),
  ])
  return { posts: unwrap(posts), callouts: unwrap(callouts) }
}

export async function searchByHashtag(client, tag) {
  const normalizedTag = String(tag || '').replace(/^#/, '').replace(/[^A-Za-z0-9_]/g, '')
  if (!normalizedTag) return { posts: [], callouts: [] }
  const pattern = `%#${normalizedTag}%`
  const [posts, callouts] = await Promise.all([
    client.from('posts').select(postFields).ilike('content', pattern).order('created_at', { ascending: false }),
    client.from('callouts').select(calloutFields).or(`title.ilike.${pattern},thesis.ilike.${pattern}`).order('created_at', { ascending: false }),
  ])
  return { posts: unwrap(posts), callouts: unwrap(callouts) }
}

export function getProfile(client, userId) {
  return client.from('profiles').select('id, username, bio, avatar_url, nimiq_address').eq('id', userId).maybeSingle().then(unwrap)
}

export async function getFollowSummary(client, userId, viewerId) {
  const [followers, following, relationship] = await Promise.all([
    client.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    client.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    viewerId && viewerId !== userId ? client.from('follows').select('follower_id').eq('follower_id', viewerId).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ])
  if (followers.error) throw followers.error
  if (following.error) throw following.error
  if (relationship.error) throw relationship.error
  return { followers: followers.count || 0, following: following.count || 0, isFollowing: Boolean(relationship.data) }
}

export async function followUser(client, followerId, followingId) {
  const { error } = await client.from('follows').insert({ follower_id: followerId, following_id: followingId })
  if (error) throw error
}

export async function unfollowUser(client, followerId, followingId) {
  const { error } = await client.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
  if (error) throw error
}

export function saveProfile(client, profile) {
  const { id, ...changes } = profile
  return client.from('profiles').update(changes).eq('id', id).select().single().then(unwrap)
}
