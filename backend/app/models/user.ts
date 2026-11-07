import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import Message from './message.js'

// Zabezpecuje overenie hesla a autentifikaciu uzivatela
const AuthFinder = withAuthFinder(() => hash.use(), {
  uids: ['email'],
  passwordColumnName: 'password',
})

// Potrebne pre autentifikaciu a autorizaciu uzivatela
export default class User extends compose(BaseModel, AuthFinder) {
  
  // 3. Konfiguracia pre accessTokens
  static accessTokens = DbAccessTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare surname: string

  @column()
  declare nickname: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacie
  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @manyToMany(() => Channel, {
    pivotTable: 'channel_users',
    pivotColumns: ['status', 'kick_count'],
    pivotTimestamps: true
  })
  declare channels: ManyToMany<typeof Channel>
}