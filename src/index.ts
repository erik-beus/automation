import { listenForMessages } from './pubsub'
import { getDevices, debug } from './sonos-config'

// Refresh speakers every hour
getDevices()
setInterval(() => {
  getDevices()
}, 1000 * 60 * 60)
debug()
listenForMessages()
