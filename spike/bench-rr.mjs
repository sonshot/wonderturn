import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const SYS = "You talk with curious kids aged 8-12. Reply in at most 3 sentences, about 60 words. Warm, plain language, no follow-up hook questions."
const Qs = ["why do stars twinkle?","why is the ocean salty?","what makes thunder loud?","how do plants eat sunlight?","why do we dream at night?","how do birds know where to fly?","what is inside a volcano?","how do magnets stick together?"]
const MODELS = ['google/gemini-3.5-flash-lite','google/gemini-3.6-flash','openai/gpt-5.6-luna','anthropic/claude-haiku-4.5','mistral/mistral-medium-3.5','minimax/minimax-m3']
const R = Object.fromEntries(MODELS.map(m => [m, { t: [], tok: [], fail: 0 }]))
const START = Date.now(), DEADLINE = 470_000

for (let round = 0; round < Qs.length; round++) {
  if (Date.now() - START > DEADLINE) { console.log(`\n(stopped early after round ${round})`); break }
  const order = [...MODELS].sort(() => Math.random() - 0.5)   // defeat position bias
  for (const model of order) {
    const t0 = performance.now()
    try {
      const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(25_000),
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 120, messages: [{ role:'system', content: SYS }, { role:'user', content: Qs[round] }] }) })
      const j = await res.json()
      if (j.error) { R[model].fail++; continue }
      R[model].t.push((performance.now() - t0) / 1000)
      R[model].tok.push(j.usage?.completion_tokens ?? 0)
    } catch { R[model].fail++ }
  }
  process.stdout.write(`round ${round + 1}/${Qs.length}  `)
}

const q = (a, p) => { const s = [...a].sort((x,y)=>x-y); return s[Math.min(s.length-1, Math.floor(s.length*p))] }
const avg = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0
console.log(`\n\nelapsed ${((Date.now()-START)/1000).toFixed(0)}s — interleaved, randomized order per round\n`)
console.log('model                            n  median     p90     min     max   fail  tok')
for (const m of MODELS) {
  const { t, tok, fail } = R[m]
  if (!t.length) { console.log(`${m.padEnd(30)}  —  all ${fail} calls failed`); continue }
  console.log(`${m.padEnd(30)} ${String(t.length).padStart(2)}  ${q(t,.5).toFixed(2)}s  ${q(t,.9).toFixed(2)}s  ${Math.min(...t).toFixed(2)}s  ${Math.max(...t).toFixed(2)}s  ${String(fail).padStart(4)}  ${avg(tok).toFixed(0)}`)
}
console.log('\nranked by p90 (what Outcome 5 actually cares about):')
for (const m of MODELS.filter(m=>R[m].t.length).sort((a,b)=>q(R[a].t,.9)-q(R[b].t,.9)))
  console.log(`  ${q(R[m].t,.9).toFixed(2)}s  ${m}`)
