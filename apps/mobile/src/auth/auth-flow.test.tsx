import { act, screen, userEvent } from '@testing-library/react-native'
import { fakeAuth, VALID_EMAIL, VALID_PASSWORD } from '@/test/fake-supabase-auth'
import { renderApp } from '@/test/render-app'

async function signInWith(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.press(screen.getByRole('button', { name: 'Ingresar' }))
}

it('shows the login without a session', async () => {
  await renderApp({ signedIn: false })

  expect(await screen.findByRole('header', { name: 'Iniciar sesión' })).toBeOnTheScreen()
})

it('goes straight to the app with a saved session', async () => {
  await renderApp()

  expect(await screen.findByRole('button', { name: 'Cerrar sesión' })).toBeOnTheScreen()
  expect(screen.queryByRole('header', { name: 'Iniciar sesión' })).not.toBeOnTheScreen()
})

it('signs in with the right email and password, and signs out', async () => {
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })

  await signInWith(` ${VALID_EMAIL} `, VALID_PASSWORD)

  expect(fakeAuth.signInWithPassword).toHaveBeenCalledWith({
    email: VALID_EMAIL,
    password: VALID_PASSWORD,
  })
  await userEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }))
  expect(await screen.findByRole('header', { name: 'Iniciar sesión' })).toBeOnTheScreen()
})

it('says when the email or password are wrong, and stays on the login', async () => {
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })

  await signInWith(VALID_EMAIL, 'otra')

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('El email o la contraseña no coinciden.', { exact: false })
  expect(alert).toHaveTextContent('Revisalos y probá de nuevo.', { exact: false })
  expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
})

it('says when there is no connection', async () => {
  fakeAuth.signInWithPassword.mockRejectedValueOnce(new TypeError('Network request failed'))
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })

  await signInWith(VALID_EMAIL, VALID_PASSWORD)

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
  )
})

it('asks for both fields before trying', async () => {
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })

  await userEvent.type(screen.getByLabelText('Email'), VALID_EMAIL)
  await userEvent.press(screen.getByRole('button', { name: 'Ingresar' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Ingresá tu email y tu contraseña.')
  expect(fakeAuth.signInWithPassword).not.toHaveBeenCalled()
})

it('shows and hides the password', async () => {
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })
  const password = screen.getByLabelText('Contraseña')
  expect(password).toHaveProp('secureTextEntry', true)

  await userEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(password).toHaveProp('secureTextEntry', false)

  await userEvent.press(screen.getByRole('button', { name: 'Ocultar contraseña' }))
  expect(password).toHaveProp('secureTextEntry', true)
})

it('goes back to the login when the session ends on its own', async () => {
  await renderApp()
  await screen.findByRole('button', { name: 'Cerrar sesión' })

  await act(async () => fakeAuth.expire())

  expect(await screen.findByRole('header', { name: 'Iniciar sesión' })).toBeOnTheScreen()
})

it('signs in from the keyboard', async () => {
  await renderApp({ signedIn: false })
  await screen.findByRole('header', { name: 'Iniciar sesión' })

  await userEvent.type(screen.getByLabelText('Email'), VALID_EMAIL, { submitEditing: true })
  await userEvent.type(screen.getByLabelText('Contraseña'), VALID_PASSWORD, {
    submitEditing: true,
  })

  expect(await screen.findByRole('button', { name: 'Cerrar sesión' })).toBeOnTheScreen()
})
