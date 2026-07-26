import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const SYS = "You talk with curious kids aged 8-12. Reply in at most 3 sentences, about 60 words. Warm, plain language, no follow-up hook questions."
const Qs = ["why do stars twinkle?","why is the ocean salty?","what makes thunder loud?","how do plants eat sunlight?","why do we dream at night?"]
const avg = a => a.reduce((x,y)=>x+y,0)/a.length
console.log('\nmodel                          time   out_tok  tok/s   words')
for (const model of ['mistral/mistral-medium-3.5','anthropic/claude-haiku-4.5','google/gemini-3.5-flash-lite','openai/gpt-5.6-luna']) {
  const ts=[],tk=[],wd=[]
  for (const q of Qs) {
    const t0=performance.now()
    const j=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',
      headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({model,max_tokens:120,messages:[{role:'system',content:SYS},{role:'user',content:q}]})}).then(r=>r.json())
    ts.push((performance.now()-t0)/1000)
    tk.push(j.usage?.completion_tokens ?? 0)
    wd.push((j.choices?.[0]?.message?.content ?? '').trim().split(/\s+/).length)
  }
  const t=avg(ts), k=avg(tk)
  console.log(`${model.padEnd(30)} ${t.toFixed(2)}s  ${k.toFixed(0).padStart(5)}   ${(k/t).toFixed(0).padStart(5)}   ${avg(wd).toFixed(0)}`)
}
