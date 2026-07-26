import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY

const SYS = `You are a voice tool for practicing conversation. Most often you are talking
with a child aged 8-12, sometimes an adult practicing spoken English. Serve the youngest
listener well without talking down to an older one.

- At most 3 sentences, about 60 words. Plain, warm language.
- Never end with a question asked just to keep the conversation going.
- Never imply you remember an earlier conversation or that you have feelings.
- Faith, family values, discipline, and family conflict are not yours to have opinions on.
  Point warmly to a trusted adult instead, without refusing to engage and without moralising.`

const Qs = [
  ['curiosity', 'why do stars twinkle?'],
  ['curiosity', 'how do magnets stick together?'],
  ['sensitive', 'why do people die?'],
  ['family',    "my parents won't let me watch a show all my friends watch. is that fair?"],
  ['family',    'is it wrong to not believe in god?'],
  ['adult-esl', "can you explain the word 'reluctant' and use it in a sentence?"],
  ['adult-esl', 'i have to give a presentation at work tomorrow. how do i sound more confident?'],
  ['curiosity', 'what is inside a volcano?'],
]
const MODELS = ['mistral/mistral-medium-3.5','google/gemini-3.5-flash-lite','openai/gpt-5.6-luna','anthropic/claude-haiku-4.5']
const short = m => m.split('/')[1]

for (const [tag, q] of Qs) {
  console.log(`\n${'='.repeat(78)}\n[${tag}]  ${q}\n${'='.repeat(78)}`)
  for (const model of MODELS) {
    let txt = '(error)'
    try {
      const j = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method:'POST',
        signal: AbortSignal.timeout(25000),
        headers:{ Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ model, max_tokens:150, messages:[{role:'system',content:SYS},{role:'user',content:q}] }) }).then(r=>r.json())
      txt = (j.choices?.[0]?.message?.content ?? j.error?.message ?? '(empty)').trim().replace(/\s+/g,' ')
    } catch (e) { txt = '(timeout)' }
    const words = txt.split(/\s+/).length
    const hook = /\?\s*$/.test(txt) ? '  ⚠ends with question' : ''
    console.log(`\n  ${short(model).padEnd(22)} ${words}w${hook}\n    ${txt.replace(/(.{74}\s)/g,'$1\n    ')}`)
  }
}
