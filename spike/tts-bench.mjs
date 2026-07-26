import { experimental_generateSpeech as generateSpeech } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { readFileSync } from 'node:fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const [k, ...v] = line.split('='); if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

const TEXT = "Stars twinkle because their light has to pass through Earth's moving air before it reaches our eyes. The air bends the light this way and that, so the star looks like it's flickering. Planets twinkle less because they look like tiny discs, not single points."
console.log(`text: ${TEXT.length} chars\n`)

for (const model of ['openai/tts-1', 'openai/tts-1-hd', 'xai/grok-tts']) {
  const times = []
  let bytes = 0, fmt = ''
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now()
    try {
      const r = await generateSpeech({ model: gateway.speech(model), text: TEXT })
      times.push(((performance.now() - t0) / 1000).toFixed(3))
      bytes = r.audio.uint8Array.length; fmt = r.audio.mediaType
    } catch (e) {
      times.push('ERR'); fmt = String(e.message).slice(0, 70); break
    }
  }
  console.log(`${model.padEnd(18)} ${times.join('  ')}   ${bytes ? bytes + ' bytes ' + fmt : fmt}`)
}
