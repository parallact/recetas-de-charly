import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// 10 categories with original UUIDs from 002_migrate_data.sql
const CATEGORIES = [
  { id: '99caa761-dafc-4e12-8592-ed2142ae90f3', name: 'Desayunos', slug: 'desayunos', icon: '🍳' },
  { id: 'eebf78e3-5319-44b6-bb85-7d94bbeaa570', name: 'Almuerzos', slug: 'almuerzos', icon: '🍝' },
  { id: 'a7a729bd-8ff3-4e2b-9ce2-a22d17fa1cb8', name: 'Cenas', slug: 'cenas', icon: '🍽️' },
  { id: '62057e9a-9d30-4e6c-8447-b6a79f0de7fa', name: 'Postres', slug: 'postres', icon: '🍰' },
  { id: 'da05c534-5966-4a90-a9fe-d4f87c7f20c2', name: 'Sopas', slug: 'sopas', icon: '🍲' },
  { id: '2e7e35d0-0ffc-4b3c-a39a-4eba7d28235a', name: 'Ensaladas', slug: 'ensaladas', icon: '🥗' },
  { id: '9837ba64-3ffb-4de5-987d-a3236d354402', name: 'Bebidas', slug: 'bebidas', icon: '🍹' },
  { id: '2891c511-f265-4f23-bee4-fcf7eeab5bc4', name: 'Snacks', slug: 'snacks', icon: '🍿' },
  { id: '544420de-36e3-4d60-8980-4a6420f6cd3f', name: 'Panaderia', slug: 'panaderia', icon: '🍞' },
  { id: 'a1da3208-1be3-4e20-a824-f7d77711f659', name: 'Mariscos', slug: 'mariscos', icon: '🦐' },
]

// 24 default tags from src/lib/actions/tags.ts
const DEFAULT_TAGS = [
  'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Keto', 'Bajo en Calorías',
  'Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Postre', 'Aperitivo',
  'Argentino', 'Italiano', 'Mexicano', 'Asiático', 'Mediterráneo', 'Americano',
  'Rápido', 'Al Horno', 'A la Parrilla', 'Saludable', 'Comfort Food', 'Para Niños',
]

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  const client = await pool.connect()

  try {
    // Seed categories
    let catCount = 0
    for (const cat of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (id, name, slug, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3, icon = $4`,
        [cat.id, cat.name, cat.slug, cat.icon]
      )
      catCount += res.rowCount
    }
    console.log(`Categories: ${catCount} upserted`)

    // Seed tags
    let tagCount = 0
    for (const name of DEFAULT_TAGS) {
      const slug = toSlug(name)
      const res = await client.query(
        `INSERT INTO tags (name, slug, is_default)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO UPDATE SET is_default = true`,
        [name, slug]
      )
      tagCount += res.rowCount
    }
    console.log(`Tags: ${tagCount} upserted`)

    console.log('Seed completed successfully!')
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
