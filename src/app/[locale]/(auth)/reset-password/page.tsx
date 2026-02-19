'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { ChefHat, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/actions/auth'
import { ScaleIn } from '@/components/ui/motion'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const t = useTranslations('auth')
  const te = useTranslations('serverErrors')

  if (!token) {
    return (
      <ScaleIn>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('resetTokenInvalidTitle')}</CardTitle>
            <CardDescription>{t('resetTokenInvalidDescription')}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              {t('requestNewLink')}
            </Link>
          </CardFooter>
        </Card>
      </ScaleIn>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (trimmedPassword !== trimmedConfirm) {
      toast.error(te('passwordsMismatch'))
      return
    }

    if (trimmedPassword.length < 8) {
      toast.error(te('passwordTooShort'))
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(token, trimmedPassword)

      if (!result.success) {
        if (result.error === 'resetTokenInvalid') {
          toast.error(te('resetTokenInvalid'))
        } else {
          toast.error(result.error ? te(result.error) : te('serverError'))
        }
        return
      }

      router.push('/login?reset=true')
    } catch {
      toast.error(te('serverError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScaleIn>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('resetPasswordTitle')}</CardTitle>
          <CardDescription>{t('resetPasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <PasswordInput
                id="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={128}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder={t('passwordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                maxLength={128}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updatingPassword')}
                </>
              ) : (
                t('updatePassword')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </ScaleIn>
  )
}
