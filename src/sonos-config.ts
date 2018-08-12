import { DeviceDiscovery } from 'sonos'
import { IPubSubMessage } from './pubsub'

type SpeakerName = 'Kitchen' | 'Living Room' | 'Garden' | 'Bathroom'
let devices: Record<SpeakerName, any> = {} as any

export const getDevices = () => {
  devices = {} as any
  DeviceDiscovery(async (device: any) => {
    const name = (await device.getName()) as SpeakerName
    console.log(`Found device: ${name} on ${device.host}`)
    devices[name] = device
  })
}

export const playFavorite = async (favoriteIndex: number, deviceName: SpeakerName) => {
  const sonos = devices[deviceName]
  const favorites = await sonos.getFavorites()
  const favorite = favorites.items[favoriteIndex]
  console.log(favorite)
  const { albumArtURI, uri, title } = favorite
  if (uri.indexOf('spotify') !== -1) {
    playSpotify(sonos, uri)
  } else if (albumArtURI.indexOf('tunein') !== -1) {
    playTunein(sonos, uri, title)
  } else {
    console.error(`Configuration for playing favorite with uri: ${uri} has not been set up`)
  }
}

export const playPlaylist = async (playlistIndex: number, deviceName: SpeakerName) => {
  const sonos = devices[deviceName]
  const playlists = await sonos.getMusicLibrary('sonos_playlists')
  if (!playlists || playlists.items.length === 0) {
    console.error(`Unable to find any playlists for device: ${deviceName}`)
    return
  }
  console.log(playlists)
  const playlist = playlists.items[playlistIndex]
  console.log(playlist)
  try {
    const status = await sonos.play(playlist.uri)
    if (status) {
      console.log('played spotify uri on sonos speaker')
    } else {
      console.error(`An error occured while playing Spotify uri: ${playlist.uri}`)
      console.log(status)
    }
  } catch (error) {
    console.error(`An error occured while playing Spotify uri: ${playlist.uri}`)
    console.error(error.message)
  }
}

const playSpotify = async (sonos: any, uri: string) => {
  const parsedUri = uri.substr(uri.indexOf('spotify')).replace(/%3a/g, ':')
  sonos.setSpotifyRegion(2311)
  try {
    const status = await sonos.play(parsedUri)
    if (status) {
      console.log('played spotify uri on sonos speaker')
    } else {
      console.error(`An error occured while playing Spotify uri: ${parsedUri}`)
      console.log(status)
    }
  } catch (error) {
    console.error(`An error occured while playing Spotify uri: ${parsedUri}`)
    console.error(error.message)
  }
}

const playTunein = async (sonos: any, uri: string, title: string) => {
  const matches = uri.match(/:s([0-9]*)\?/)
  if (matches === null || matches.length <= 1) {
    console.error(`Unable to play Tunein uri: ${uri} Could not find sid`)
    return
  }
  const stationId = matches[1]
  const success = await sonos.playTuneinRadio(stationId, title)
  if (success) {
    console.log('played Tunein uri on sonos speaker')
  } else {
    console.error(`An error occured while playing Tunein station id: ${stationId}`)
    console.log(success)
  }
}

export const debug = () => {
  // Wait for all devices to be detected
  setTimeout(() => {
    // playFavorite(0, 'Garden')
    // playPlaylist(1, 'Living Room')
  }, 3000)
}

export const handleIncomingMessage = (message: IPubSubMessage) => {
  if (!message.attributes) {
    console.error(`Missing atributes in message`)
    return
  }
  let volume = 0
  let speaker: SpeakerName = 'Bathroom'
  let favorite = -1
  let playlist = -1
  for (const key in message.attributes) {
    if (message.attributes.hasOwnProperty(key)) {
      const value = message.attributes[key]
      if (key === 'volume') {
        volume = parseInt(value)
      } else if (key === 'speaker') {
        speaker = value as SpeakerName
      } else if (key === 'favorite') {
        favorite = parseInt(value)
      } else if (key === 'playlist') {
        playlist = parseInt(value)
      }
    }
  }
  console.log(`Volume: ${volume}`)
  if (favorite !== -1) {
    console.log(`playFavorite: ${favorite}, ${speaker}`)
    playFavorite(favorite, speaker)
  } else if (playlist !== -1) {
    playPlaylist(playlist, speaker)
  } else {
    console.error(`Unknown action received: ${JSON.stringify(message)}`)
  }
}
