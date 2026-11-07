import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Message from './message.js'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare channelName: string

  @column()
  declare isPrivate: boolean

  @column()
  declare adminId: number

  @column.dateTime()
  declare lastActivityAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacie
  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @manyToMany(() => User, {
    pivotTable: 'channel_users',
    pivotColumns: ['status', 'kick_count'],
    pivotTimestamps: true
  })
  declare members: ManyToMany<typeof User>
}