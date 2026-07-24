const KEY = 'homeVersion'
const DEFAULT = 'cooler'

export function getHomeVersion() {
  return sessionStorage.getItem(KEY) || DEFAULT
}

export function setHomeVersion(version) {
  sessionStorage.setItem(KEY, version)
}

export function applyHomeView(version = getHomeVersion()) {
  const cooler = document.getElementById('home-cooler')
  const simple = document.getElementById('home-simple')
  if (!cooler || !simple) return

  const isSimple = version === 'simple'
  cooler.hidden = isSimple
  simple.hidden = !isSimple
  document.documentElement.dataset.homeVersion = version
}

export function switchHomeVersion(version) {
  setHomeVersion(version)
  window.location.reload()
}
