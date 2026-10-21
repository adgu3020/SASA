// Disposable component harness: no production routes, credentials, or data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process')
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sasa-qa-'))
fs.mkdirSync(path.join(tmp,'app','qa'),{recursive:true})
fs.copyFileSync(path.join(root,'tests','ui-harness.tsx'),path.join(tmp,'app','qa','page.tsx'))
for(const f of ['layout.tsx','globals.css'])fs.copyFileSync(path.join(root,'app',f),path.join(tmp,'app',f))
for(const f of ['tsconfig.json','tailwind.config.ts','postcss.config.js','package.json'])fs.copyFileSync(path.join(root,f),path.join(tmp,f))
for(const dir of ['node_modules','components','types'])fs.symlinkSync(path.join(root,dir),path.join(tmp,dir),'dir')
fs.cpSync(path.join(root,'lib'),path.join(tmp,'lib'),{recursive:true})
// Mock Auth session recovery only. The real apiFetch implementation still sends the form requests.
fs.writeFileSync(path.join(tmp,'lib','supabase','client.ts'),"export function createClient(){return {auth:{getSession:async()=>({data:{session:null}})}}}\n")
fs.writeFileSync(path.join(tmp,'next.config.js'),'module.exports={experimental:{externalDir:true}}\n')
const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',NEXT_TELEMETRY_DISABLED:'1'}
const server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev',tmp,'--port','3100'],{env,stdio:['ignore','pipe','pipe']})
let started=false,qa,finished=false
function finish(code){if(finished)return;finished=true;server.kill('SIGTERM');process.exitCode=code}
server.stdout.on('data',d=>{if(d.toString().includes('Ready')&&!started){started=true;qa=spawn(process.execPath,[path.join(root,'tests/ui.cjs')],{env,cwd:root,stdio:'inherit'});qa.on('exit',code=>finish(code||0))}})
server.stderr.on('data',d=>process.stderr.write(d))
server.on('exit',code=>{if(!finished)finish(code||1);fs.rmSync(tmp,{recursive:true,force:true})})
setTimeout(()=>{if(!started){console.error('QA server did not start');finish(1)}},30000).unref()
process.on('SIGINT',()=>{qa?.kill();finish(1)})
