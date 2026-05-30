import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, customer } = await req.json()

    if (!imageBase64 || !customer) {
      return NextResponse.json({ error: 'Missing imageBase64 or customer' }, { status: 400 })
    }

    const systemPrompt = `Du bist Social-Media-Experte für "${customer.name}".
Profil: Instagram ${customer.instagram || '–'}, Facebook ${customer.facebook || '–'},
Branche: ${customer.industry || '–'}, Tonalität: ${customer.tone || 'professionell, freundlich'},
Beschreibung: ${customer.description || '–'},
Referenz-Accounts: ${customer.refs?.join(', ') || 'keine'},
Sprache: ${customer.lang === 'de' ? 'Deutsch' : 'Englisch'}.

Antworte NUR mit validem JSON ohne Markdown-Backticks:
{"ig":"...","fb":"...","tags":["tag1","tag2",...]}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: 'Analysiere dieses Bild und erstelle: 1) Instagram-Text (2-4 Absätze, emotional, 1-2 Emojis) 2) Facebook-Text (etwas informativer) 3) Genau 22 passende Hashtags. Antworte nur mit JSON.'
          }
        ]
      }]
    })

    const text = message.content.map((b: any) => b.text || '').join('')
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    if (!parsed.ig || !parsed.fb || !Array.isArray(parsed.tags)) {
      throw new Error('Unvollständige Antwort')
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: err.message || 'Fehler beim Generieren' }, { status: 500 })
  }
}
