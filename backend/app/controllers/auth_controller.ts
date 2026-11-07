import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  
  // Registracia
  async register({ request, response }: HttpContext) {
    // Ziskanie udajov z poziadavky z frontendu
    const data = request.only(['name', 'surname', 'nickname', 'email', 'password'])

    try {
      // Vytvorenie noveho pouzivatela v databaze - automaticke hashovanie hesla
      const user = await User.create(data)

      // Vygenerovanie tokenu pre okamzite prihlasenie po registracii
      const token = await User.accessTokens.create(user)

      return response.created({
        message: 'Registrácia bola úspešná',
        user: user,
        token: token.value!.release(), // Odoslanie tokenu klientovi
      })
    } catch (error) {
      return response.badRequest({ message: 'Chyba pri registrácii, email alebo nickname už možno existuje.' })
    }
  }

  // Prihlasenie
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      // Overenie prihlasovacich udajov
      const user = await User.verifyCredentials(email, password)

      // 2. Vygenerovanie tokenu
      const token = await User.accessTokens.create(user)

      return response.ok({
        message: 'Úspešné prihlásenie',
        user: user,
        token: token.value!.release(),
      })
    } catch (error) {
      return response.unauthorized({ message: 'Nesprávny email alebo heslo' })
    }
  }

  // Odhlasenie
  async logout({ auth, response }: HttpContext) {
  // Ziskanie pouzivatela z autentifikacie
  const user = auth.use('api').user!

  // Overenie, ci token existuje a jeho vymazanie z databazy
  if (user.currentAccessToken) {
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
  }

  return response.ok({ message: 'Úspešne odhlásený' })
}
}