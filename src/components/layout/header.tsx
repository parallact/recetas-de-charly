'use client'

import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Bookmark,
  User,
  LogOut,
  Menu,
  ChefHat,
  BookOpen
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { AuthUser } from '@/lib/auth/get-user'
import { SearchForm } from './search-form'

interface HeaderProps {
  initialUser: AuthUser | null
}

export function Header({ initialUser }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common')
  const { data: session, status } = useSession()

  // Derive user from session or initial value - no useEffect needed
  const user = useMemo<AuthUser | null>(() => {
    if (session?.user) {
      return {
        id: session.user.id || '',
        email: session.user.email || '',
        display_name: session.user.name || undefined,
        avatar_url: session.user.image || undefined,
      }
    }
    if (status === 'unauthenticated') {
      return null
    }
    // While loading, use initial value
    return initialUser
  }, [session, status, initialUser])

  const confirmLogout = async () => {
    try {
      await signOut({ redirect: false })
      toast.success(t('loggedOut'))
      router.push('/')
      router.refresh()
    } catch {
      toast.error(t('logoutError'))
    }
    setShowLogoutDialog(false)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t('appName')}</span>
        </Link>

        {/* Search Bar - Desktop */}
        <SearchForm className="hidden md:flex flex-1 max-w-md mx-4" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })
            }}
          >
            {locale === 'es' ? 'EN' : 'ES'}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t('newRecipe')}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('userMenu')}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.display_name || user.email} />
                      <AvatarFallback>
                        {(user.display_name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      {t('myProfile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-recipes">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t('myRecipes')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">
                      <Bookmark className="mr-2 h-4 w-4" />
                      {t('myBookmarks')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t('register')}</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label={t('openMenu')}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80" title={t('menu')} description={t('navigationPanel')} closeLabel={t('close')}>
            <div className="flex flex-col gap-4 mt-8">
              {/* Mobile Search */}
              <SearchForm onSubmit={() => setMobileMenuOpen(false)} />

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })
                    setMobileMenuOpen(false)
                  }}
                >
                  {locale === 'es' ? 'EN' : 'ES'}
                </Button>
                <Link
                  href="/"
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChefHat className="h-5 w-5" />
                  {t('home')}
                </Link>
                <Link
                  href="/categories"
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('categories')}
                </Link>

                {user ? (
                  <>
                    <Link
                      href="/recipes/new"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Plus className="h-5 w-5" />
                      {t('newRecipe')}
                    </Link>
                    <Link
                      href="/my-recipes"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <BookOpen className="h-5 w-5" />
                      {t('myRecipes')}
                    </Link>
                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bookmark className="h-5 w-5" />
                      {t('bookmarks')}
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      {t('myProfile')}
                    </Link>
                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('logoutConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('logoutConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              {t('logoutConfirmTitle')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
