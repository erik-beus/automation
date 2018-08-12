import * as PubSub from '@google-cloud/pubsub'
import { handleIncomingMessage } from './sonos-config'

export interface IPubSubMessage {
  id: string
  data: string
  attributes: Record<string, string>
  ack: () => void
}

export const listenForMessages = () => {
  const pubsub = PubSub({
    projectId: process.env.projectId,
    keyFilename: 'auth.json',
  })
  const subscription = pubsub.subscription('sonos')
  const messageHandler = (message: IPubSubMessage) => {
    console.log(`Received message ${JSON.stringify(message)}:`)
    message.ack()
    handleIncomingMessage(message)
  }

  subscription.on(`message`, messageHandler)
  console.log('listening for messages ...')
}
