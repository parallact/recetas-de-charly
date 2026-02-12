import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getUser } from "@/lib/auth/get-user"
import { AuthProvider } from "@/lib/auth/auth-context"
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  return {
    title: t('appName'),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const user = await getUser()

  return (
    <NextIntlClientProvider>
      <Providers>
        <AuthProvider initialUser={user}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
          >
            {locale === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}
          </a>
          <div className="relative flex min-h-screen flex-col">
            <Header initialUser={user} />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </Providers>
    </NextIntlClientProvider>
  )
}
