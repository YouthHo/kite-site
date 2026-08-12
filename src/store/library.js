import { ref, reactive } from 'vue'

/**
 * 收藏/书签（W · library store）
 * favorites: Set<`type:id`>，localStorage 持久化，跨页统一
 */
const KEY = 'kite-library'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return {
      favorites: new Set(raw.favorites || []),
      watched: new Set(raw.watched || []),
    }
  } catch (e) {
    return { favorites: new Set(), watched: new Set() }
  }
}

const state = reactive(load())

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ favorites: [...state.favorites], watched: [...state.watched] })
    )
  } catch (e) {
    /* ignore */
  }
}

export function toggleFavorite(type, id) {
  const key = `${type}:${id}`
  if (state.favorites.has(key)) state.favorites.delete(key)
  else state.favorites.add(key)
  persist()
  return state.favorites.has(key)
}

export function isFavorite(type, id) {
  return state.favorites.has(`${type}:${id}`)
}

export function toggleWatched(episodeId) {
  if (state.watched.has(episodeId)) state.watched.delete(episodeId)
  else state.watched.add(episodeId)
  persist()
}

export function favoritesList() {
  return [...state.favorites].map((k) => {
    const [type, id] = k.split(':')
    return { type, id }
  })
}

export function favoriteCount() {
  return state.favorites.size
}

export { state as libraryState }
