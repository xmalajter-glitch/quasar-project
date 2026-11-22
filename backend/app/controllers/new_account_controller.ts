import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { signupValidator } from '#validators/user'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, response, serialize }: HttpContext) {
    // Pri chybe validator vrati 422 so zoznamom chyb pre jednotlive polia
    const { name, surname, nickname, email, password } =
      await request.validateUsing(signupValidator)

    const user = await User.create({ name, surname, nickname, email, password })
    const token = await User.accessTokens.create(user)

    response.status(201)
    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
