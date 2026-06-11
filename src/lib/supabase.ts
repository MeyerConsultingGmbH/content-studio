import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Customer = {
  id: string
  name: string
  instagram: string
  facebook: string
  industry: string
  tone: string
  description: string
  refs: string[]
  lang: string
  slug: string
  created_at: string
}

export type Post = {
  id: string
  customer_id: string
  customer_name: string
  image_url: string
  ig_text: string
  fb_text: string
  ig_edit: string
  fb_edit: string
  hashtags: string[]
  status: 'pending' | 'review' | 'kunde' | 'approved' | 'rejected' | 'scheduled'
  created_at: string
  updated_at: string
}

export type Comment = {
  id: string
  post_id: string
  author: string
  text: string
  created_at: string
}
