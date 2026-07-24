import { applyHomeView, getHomeVersion } from './home-version.js'

const version = getHomeVersion()
applyHomeView(version)

if (version === 'cooler') {
  import('./main.js')
} else {
  import('./simple-home.js')
}
