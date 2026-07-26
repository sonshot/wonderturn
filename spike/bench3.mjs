import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const SYS = "You talk with curious kids aged 8-12. Reply in at most 3 sentences, about 60 words. Warm, plain language, no follow-up hook questions."
const Qs = ["why do stars twinkle?","why is the ocean salty?","what makes thunder loud?","why do we dream at night?"]
const MODELS = ['deepseek/deepseek-v4-flash','zai/glm-5.2-fast','moonshotai/kimi-k3','mistral/mistral-medium-3.5','stepfun/step-3.7-flash','minimax/minimax-m3']
const med = a => [...a].sort((x,y)=>x-y)[a.length>>1]
const rows = []
for (const model of MODELS) {
  const ts = []; let sample = '', err = ''
  for (const q of Qs) {
    const t0 = performance.now()
    try {
      const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method:'POST',
        headers:{ Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ model, max_tokens:120, messages:[{role:'system',content:SYS},{role:'user',content:q}] }) })
      const j = await r.json()
      if (j.error) { err = j.error.message.slice(0,60); break }
      ts.push((performance.now()-t0)/1000)
      if (!sample) sample = (j.choices?.[0]?.message?.content ?? '').replace(/\s+/g,' ')
    } catch (e) { err = String(e.message).slice(0,60); break }
  }
  rows.push({ model, median: ts.length ? med(ts) : null, err, sample })
  console.log(`${model.padEnd(32)} ${ts.length ? med(ts).toFixed(2)+'s' : 'ERR '+err}`)
}
console.log('\n=== ranked ===')
for (const r of rows.filter(r=>r.median).sort((a,b)=>a.median-b.median))
  console.log(`\n${r.median.toFixed(2)}s  ${r.model}\n   ${r.sample.slice(0,190)}`)
