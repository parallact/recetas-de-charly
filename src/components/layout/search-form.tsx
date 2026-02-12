'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchFormProps {
  className?: string
  onSubmit?: () => void
}

export function SearchForm({ className, onSubmit }: SearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const t = useTranslations('common')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      onSubmit?.()
    }
  }

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          maxLength={100}
        />
      </div>
    </form>
  )
}
