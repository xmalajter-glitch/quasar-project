import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.integer('channel_id').unsigned().references('channels.id').onDelete('CASCADE')
      table.string('status').defaultTo('active') // Môže byť 'active', 'banned'
      table.integer('kick_count').defaultTo(0) // Počítadlo vyhodení
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      
      // Poistka: Používateľ môže mať len jeden záznam o členstve v danom kanáli
      table.unique(['user_id', 'channel_id']) 
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}