import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class NewAccountController {
  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'surname', 'nickname', 'email', 'password'])
    
    const user = await User.create(data)
    const token = await User.accessTokens.create(user)

    return response.created({
      user,
      token: token.value!.release(),
    })
  }
}
