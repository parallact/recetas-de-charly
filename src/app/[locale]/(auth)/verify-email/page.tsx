'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { verifyEmail, resendVerificationEmail } from '@/lib/actions/auth'
import { ScaleIn } from '@/components/ui/motion'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const t = useTranslations('auth')
  const te = useTranslations('serverErrors')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    verifyEmail(token).then((result) => {
      if (result.success) {
        setStatus('success')
        setTimeout(() => router.push('/login?verified=true'), 2000)
      } else {
        setStatus('error')
      }
    })
  }, [token, router])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResending(true)

    try {
      const result = await resendVerificationEmail(resendEmail)
      if (!result.success && result.error) {
        toast.error(te(result.error))
        return
      }
      setResendSent(true)
    } catch {
      toast.error(te('serverError'))
    } finally {
      setIsResending(false)
    }
  }

  if (status === 'loading') {
    return (
      <ScaleIn>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">{t('verifyingEmail')}</CardTitle>
          </CardHeader>
        </Card>
      </ScaleIn>
    )
  }

  if (status === 'success') {
    return (
      <ScaleIn>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">{t('emailVerifiedTitle')}</CardTitle>
            <CardDescription>{t('emailVerifiedDescription')}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              {t('loginButton')}
            </Link>
          </CardFooter>
        </Card>
      </ScaleIn>
    )
  }

  // Error state — show resend form
  return (
    <ScaleIn>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t('verifyTokenInvalidTitle')}</CardTitle>
          <CardDescription>{t('verifyTokenInvalidDescription')}</CardDescription>
        </CardHeader>
        {!resendSent ? (
          <CardContent>
            <form onSubmit={handleResend} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">{t('email')}</Label>
                <Input
                  id="resendEmail"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  maxLength={50}
                  disabled={isResending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('sendingLink')}
                  </>
                ) : (
                  t('resendVerification')
                )}
              </Button>
            </form>
          </CardContent>
        ) : (
          <CardContent className="text-center text-sm text-muted-foreground">
            {t('verificationLinkSent')}
          </CardContent>
        )}
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </ScaleIn>
  )
}
