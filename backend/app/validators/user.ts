import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * Pravidla zdielane s frontendom (RegisterForm.vue) - pri zmene upravit obe miesta.
 *
 * Nickname sa pouziva v prikazoch (/invite nick) a v @mentions, preto nesmie
 * obsahovat medzery ani specialne znaky.
 */
export const NICKNAME_REGEX = /^[a-zA-Z0-9_]+$/

const email = () => vine.string().trim().email().maxLength(254).toLowerCase()

const password = () =>
  vine
    .string()
    .minLength(8)
    .maxLength(64)
    .regex(/\d/)
    .regex(/[^a-zA-Z0-9\s]/)

/**
 * Validator pre registraciu noveho pouzivatela
 */
export const signupValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(50),
  surname: vine.string().trim().minLength(1).maxLength(50),
  nickname: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(32)
    .regex(NICKNAME_REGEX)
    // @mentions su case-insensitive, preto aj unikatnost nicku
    .unique({ table: 'users', column: 'nickname', caseInsensitive: true }),
  email: email().unique({ table: 'users', column: 'email', caseInsensitive: true }),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})

signupValidator.messagesProvider = new SimpleMessagesProvider(
  {
    'required': 'The {{ field }} field is required.',
    'string': 'The {{ field }} field must be a string.',
    'email': 'Enter a valid email address.',
    'minLength': 'The {{ field }} field must be at least {{ min }} characters long.',
    'maxLength': 'The {{ field }} field must be at most {{ max }} characters long.',
    'nickname.regex': 'Nickname may only contain letters (no diacritics), digits and underscores.',
    'nickname.database.unique': 'This nickname is already taken.',
    'email.database.unique': 'An account with this email already exists.',
    'password.regex': 'Password must contain at least one digit and one special character.',
    'passwordConfirmation.sameAs': 'Passwords do not match.',
  },
  {
    name: 'first name',
    surname: 'last name',
    nickname: 'nickname',
    email: 'email',
    password: 'password',
    passwordConfirmation: 'password confirmation',
  }
)

/**
 * Validator pre prihlasenie
 */
export const loginValidator = vine.create({
  email: vine.string().trim().toLowerCase(),
  password: vine.string(),
})
