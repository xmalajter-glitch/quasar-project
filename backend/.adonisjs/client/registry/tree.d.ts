/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  channels: {
    channels: {
      index: typeof routes['channels.channels.index']
      join: typeof routes['channels.channels.join']
      invite: typeof routes['channels.channels.invite']
      kick: typeof routes['channels.channels.kick']
      quit: typeof routes['channels.channels.quit']
      cancel: typeof routes['channels.channels.cancel']
      channelUsers: typeof routes['channels.channels.channel_users']
    }
    messages: {
      index: typeof routes['channels.messages.index']
      store: typeof routes['channels.messages.store']
    }
  }
}
