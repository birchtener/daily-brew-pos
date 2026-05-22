"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Coffee, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { extractErrorMessage } from "@/lib/extractErrorMessage"
import { useStore } from "@/store/useStore"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { loginRequest } from "@/api/auth"

const loginSchema = z.object({
  username: z.string().min(5, { message: 'Username must be at least 5 characters long' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

type LoginFields = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const { dark, toggleDark } = useStore()
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFields) => {
    setSubmitError(null)

    try {
        const result = await loginRequest(values)
        localStorage.setItem('daily_brew_user', JSON.stringify(result))
      navigate('/', { replace: true })
    } catch (error) {
        const message = extractErrorMessage(error, 'Login failed. Please try again.')
        setSubmitError(message)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-black/10">
                <Coffee className="size-7" />
              </div>
              <div className="flex flex-col justify-center items-center">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome to Daily Brew</h1>
                <FieldDescription className="mt-1">POS & inventory operations</FieldDescription>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="admin_user"
                autoComplete="username"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              <FieldError errors={[errors.username]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="pr-11"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            {submitError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" /> Signing in...
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{dark ? 'Dark mode enabled' : 'Light mode enabled'}</span>
          <button type="button" onClick={toggleDark} className="font-medium text-foreground underline-offset-4 hover:underline">
            Toggle theme
          </button>
        </div>
      </div>
    </div>
  )
}
