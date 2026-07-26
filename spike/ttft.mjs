import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const med = a => [...a].sort((x,y)=>x-y)[a.length>>1]

async function stream(model, sys, user, maxTok) {
  const t0 = performance.now()
  const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method:'POST',
    headers:{ Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model, max_tokens:maxTok, stream:true, messages:[{role:'system',content:sys},{role:'user',content:user}] }) })
  const headers = performance.now() - t0
  let ttft = null
  const reader = res.body.getReader(), dec = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    const chunk = dec.decode(value, { stream:true })
    if (ttft === null && /"content":"[^"]/.test(chunk)) ttft = performance.now() - t0
  }
  return { headers: headers/1000, ttft: (ttft ?? performance.now()-t0)/1000, total: (performance.now()-t0)/1000 }
}

const SYS_REPLY = "You talk with curious kids aged 8-12. Reply in at most 3 sentences, about 60 words. Warm, plain language, no follow-up hook questions."
const SYS_CHECK = "Reply with exactly one word: SAFE or UNSAFE. Is this text appropriate for an 8-year-old?"
const Qs = ["why do stars twinkle?","why is the ocean salty?","what makes thunder loud?","how do plants eat sunlight?","why do we dream at night?"]
const REP = "Stars twinkle because their light passes through moving air before it reaches our eyes."

const jobs = [
  ['reply  gemini-3.5-flash-lite','google/gemini-3.5-flash-lite',SYS_REPLY,null,120],
  ['reply  mistral-medium-3.5','mistral/mistral-medium-3.5',SYS_REPLY,null,120],
  ['check  haiku-4.5','anthropic/claude-haiku-4.5',SYS_CHECK,REP,4],
  ['check  gemini-3.5-flash-lite','google/gemini-3.5-flash-lite',SYS_CHECK,REP,4],
]
const acc = Object.fromEntries(jobs.map(j=>[j[0],{h:[],f:[],t:[]}]))
for (let r=0;r<5;r++) for (const [label,model,sys,fixed,mt] of [...jobs].sort(()=>Math.random()-0.5)) {
  try { const s = await stream(model, sys, fixed ?? Qs[r], mt)
    acc[label].h.push(s.headers); acc[label].f.push(s.ttft); acc[label].t.push(s.total) } catch {}
}
console.log('\nlabel                          headers   TTFT    total   generation')
for (const [label,{h,f,t}] of Object.entries(acc)) {
  if (!f.length) { console.log(`${label.padEnd(30)} all failed`); continue }
  console.log(`${label.padEnd(30)} ${med(h).toFixed(2)}s   ${med(f).toFixed(2)}s   ${med(t).toFixed(2)}s   ${(med(t)-med(f)).toFixed(2)}s`)
}
