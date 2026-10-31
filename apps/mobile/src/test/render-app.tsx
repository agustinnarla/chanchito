import { renderRouter } from 'expo-router/testing-library'
import { fakeAuth, fakeSession } from './fake-supabase-auth'

// The real routes, as the app runs them (Jest runs from apps/mobile).
const APP_DIR = './src/app'

/** Renders the whole app, signed in unless told otherwise. */
export async function renderApp({ signedIn = true } = {}) {
  if (signedIn) fakeAuth.reset(fakeSession())
  return renderRouter(APP_DIR)
}
