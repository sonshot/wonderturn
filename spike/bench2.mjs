import { readFileSync } from 'node:fs'
for (const l of readFileSync('.env.local','utf8').split('\n')) { const [k,...v]=l.split('='); if(k&&v.length) process.env[k.trim()]=v.join('=').trim() }
const KEY = process.env.AI_GATEWAY_API_KEY
const stat = a => { const s=[...a].sort((x,y)=>x-y); return { med:s[s.length>>1], min:s[0], max:s[s.length-1] } }
const call = (model, sys, user, max_tokens) => fetch('https://ai-gateway.vercel.sh/v1/chat/completions', { method:'POST',
  headers:{ Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json' },
  body: JSON.stringify({ model, max_tokens, messages:[{role:'system',content:sys},{role:'user',content:user}] }) }).then(r=>r.json())

const CLS = 'Reply with exactly one word: disclosure, nudge, or ordinary.'
const CLR = 'Reply with exactly one word: SAFE or UNSAFE. Is this text appropriate for an 8-year-old?'
const utter = ["why do stars twinkle?","some kids keep pushing me at lunch","umm never mind","how do volcanoes work?","my dad shouts a lot and it scares me","what is gravity?","i dont know","why is the sky blue?"]
const replies = ["Stars twinkle because their light passes through moving air.","Volcanoes erupt when hot melted rock pushes up through cracks.","Gravity is the pull that keeps us on the ground.","The sky looks blue because air scatters blue light most.","Birds navigate using the sun, stars, and Earth's magnetic field.","Thunder is loud because lightning heats air so fast it bangs.","Plants use sunlight to turn water and air into food.","The ocean is salty from minerals washed off rocks over ages."]

for (const [label, model, sys, inputs, mt] of [
  ['classifier haiku-4.5', 'anthropic/claude-haiku-4.5', CLS, utter, 4],
  ['clearing   haiku-4.5', 'anthropic/claude-haiku-4.5', CLR, replies, 4],
]) {
  const ts = []
  for (const i of inputs) { const t0=performance.now(); await call(model, sys, i, mt); ts.push((performance.now()-t0)/1000) }
  const s = stat(ts)
  console.log(`${label.padEnd(22)} median ${s.med.toFixed(2)}s   min ${s.min.toFixed(2)}  max ${s.max.toFixed(2)}   [${ts.map(t=>t.toFixed(1)).join(' ')}]`)
}
