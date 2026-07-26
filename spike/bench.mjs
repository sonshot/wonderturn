import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const SYS = "You talk with curious kids aged 8-12. Reply in at most 3 sentences, about 60 words. Warm, plain language, no follow-up hook questions."
const Qs = ["why do stars twinkle?","how do birds know where to fly?","why is the ocean salty?","what makes thunder loud?","how do plants eat sunlight?","why do we dream at night?","what is inside a volcano?","how do magnets stick together?"]
const stat = a => { const s=[...a].sort((x,y)=>x-y); return { med:s[s.length>>1], min:s[0], max:s[s.length-1] } }

for (const model of ['anthropic/claude-haiku-4.5','anthropic/claude-sonnet-5','anthropic/claude-opus-5-fast','anthropic/claude-fable-5']) {
  const ts = []
  for (const q of Qs) {
    const t0 = performance.now()
    const r = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method:'POST',
      headers:{ Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ model, max_tokens:100, messages:[{role:'system',content:SYS},{role:'user',content:q}] }) })
    await r.json(); ts.push((performance.now()-t0)/1000)
  }
  const s = stat(ts)
  console.log(`${model.padEnd(30)} median ${s.med.toFixed(2)}s   min ${s.min.toFixed(2)}  max ${s.max.toFixed(2)}   [${ts.map(t=>t.toFixed(1)).join(' ')}]`)
}
