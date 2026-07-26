import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const med = a => [...a].sort((x,y)=>x-y)[a.length>>1]
const call = (model,sys,user,mt) => fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',
  headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({model,max_tokens:mt,messages:[{role:'system',content:sys},{role:'user',content:user}]})}).then(r=>r.json())

const CLS='Reply with exactly one word: disclosure, nudge, or ordinary.'
const utter=["why do stars twinkle?","some kids keep pushing me at lunch","umm never mind","my dad shouts a lot and it scares me","what is gravity?","i dont know"]
const want =["ordinary","disclosure","nudge","disclosure","ordinary","nudge"]

for (const model of ['mistral/mistral-medium-3.5','google/gemini-3.5-flash-lite','anthropic/claude-haiku-4.5']) {
  const ts=[], got=[]
  for (let i=0;i<utter.length;i++){
    const t0=performance.now()
    const j=await call(model,CLS,utter[i],8)
    ts.push((performance.now()-t0)/1000)
    got.push((j.choices?.[0]?.message?.content??'ERR').trim().toLowerCase().replace(/[^a-z]/g,''))
  }
  const hits = got.filter((g,i)=>g===want[i]).length
  console.log(`${model.padEnd(30)} median ${med(ts).toFixed(2)}s   correct ${hits}/${want.length}   ${got.join(' ')}`)
}
