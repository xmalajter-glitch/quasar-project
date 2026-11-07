import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Channel from './channel.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare channelId: number

  @column()
  declare content: string

  @column()
  declare isMention: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relacie
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>
}