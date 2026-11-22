import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Neprecitana pozvanka - kanal je zvyrazneny a navrchu zoznamu, kym ho pouzivatel neotvori
      table.boolean('invited').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('invited')
    })
  }
}
