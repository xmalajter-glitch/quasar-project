import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.integer('channel_id').unsigned().references('channels.id').onDelete('CASCADE')
      table.text('content').notNullable()
      table.boolean('is_mention').defaultTo(false) // Či správa obsahuje @nickname
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}