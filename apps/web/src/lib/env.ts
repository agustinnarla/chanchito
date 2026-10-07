import { z } from 'zod'

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
})

export type Env = z.infer<typeof EnvSchema>

export function parseEnv(source: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(source)
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
    throw new Error(
      `Invalid or missing environment variables: ${missing}. Copy apps/web/.env.example to apps/web/.env.local and fill it in.`,
    )
  }
  return result.data
}
