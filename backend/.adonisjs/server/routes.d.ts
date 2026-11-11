import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.channels.join': { paramsTuple?: []; params?: {} }
    'channels.channels.invite': { paramsTuple?: []; params?: {} }
    'channels.channels.revoke': { paramsTuple?: []; params?: {} }
    'channels.channels.kick': { paramsTuple?: []; params?: {} }
    'channels.channels.quit': { paramsTuple?: []; params?: {} }
    'channels.channels.cancel': { paramsTuple?: []; params?: {} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'channel_id': ParamValue} }
    'channels.messages.store': { paramsTuple: [ParamValue]; params: {'channel_id': ParamValue} }
    'channels.channels.channel_users': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  GET: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'channel_id': ParamValue} }
    'channels.channels.channel_users': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  HEAD: {
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.messages.index': { paramsTuple: [ParamValue]; params: {'channel_id': ParamValue} }
    'channels.channels.channel_users': { paramsTuple: [ParamValue]; params: {'name': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'profile.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'channels.channels.join': { paramsTuple?: []; params?: {} }
    'channels.channels.invite': { paramsTuple?: []; params?: {} }
    'channels.channels.revoke': { paramsTuple?: []; params?: {} }
    'channels.channels.kick': { paramsTuple?: []; params?: {} }
    'channels.channels.quit': { paramsTuple?: []; params?: {} }
    'channels.channels.cancel': { paramsTuple?: []; params?: {} }
    'channels.messages.store': { paramsTuple: [ParamValue]; params: {'channel_id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}