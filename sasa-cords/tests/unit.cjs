const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
let auth = null
let operations=[]
let rpcResult={data:'linked-member',error:null}
const chain={select(){return this},eq(key,value){operations.push(['eq',key,value]);return this},single:async()=>({data:{id:'meeting-1'},error:null}),insert(value){operations.push(['insert',value]);return this},update(value){operations.push(['update',value]);return this}}
const server={verifyAuth:async()=>auth,createAdminClient:()=>({from(table){operations.push(['table',table]);return chain},rpc:async(name,args)=>{operations.push(['rpc',name,args]);return rpcResult}})}
const cache=new Map()
function load(file){
 file=path.resolve(file)
 if(cache.has(file))return cache.get(file).exports
 const mod=new Module(file,module);mod.filename=file;mod.paths=module.paths;cache.set(file,mod)
 mod.require=(id)=>{
  if(id==='@/lib/supabase/server')return server
  if(id.startsWith('@/'))return load(path.resolve(id.slice(2)+'.ts'))
  if(id.startsWith('.'))return load(path.resolve(path.dirname(file),id+'.ts'))
  return require(id)
 }
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file)
 return mod.exports
}
const {presentationFromUrl,parsePresentations}=load('lib/presentations.ts')
const {meetingInput}=load('lib/meeting-input.ts')
const {instagramHandle,boardInput}=load('lib/board-input.ts')
const {photoExtension}=load('lib/photo-validation.ts')
test('Google Slides shared and published URLs convert to trusted viewers',()=>{
 assert.equal(presentationFromUrl('https://docs.google.com/presentation/d/abc_123/edit?usp=sharing#slide=id.x').embedUrl,'https://docs.google.com/presentation/d/abc_123/preview')
 assert.equal(presentationFromUrl('https://docs.google.com/presentation/d/e/abc-123/pub?start=true').embedUrl,'https://docs.google.com/presentation/d/e/abc-123/embed')
 assert.equal(presentationFromUrl('https://www.canva.com/design/ABC/xyz/view?utm_content=a').embedUrl,'https://www.canva.com/design/ABC/xyz/view?embed')
})
test('Presentation input rejects scripts, HTML, credentials, ports, and deceptive origins',()=>{
 for(const url of ['javascript:alert(1)','<iframe src="https://docs.google.com"/>','http://docs.google.com/presentation/d/abc/edit','https://docs.google.com.evil.org/presentation/d/abc/edit','https://evil.org/','https://user:pass@docs.google.com/presentation/d/abc/edit','https://docs.google.com:8443/presentation/d/abc/edit','https://docs.google.com/document/d/abc/edit'])assert.throws(()=>presentationFromUrl(url),url)
 assert.throws(()=>parsePresentations(Array(6).fill('https://docs.google.com/presentation/d/abc/edit')))
 const parsed=parsePresentations([{url:'https://docs.google.com/presentation/d/abc/edit',embedUrl:'javascript:alert(1)'}])
 assert.equal(parsed[0].embedUrl,'https://docs.google.com/presentation/d/abc/preview')
})
test('Meeting validation supports edit, replace, and remove presentations',()=>{
 const body={title:' Test ',date:'2026-10-12',time:'18:30',location:' UMC ',presentations:['https://docs.google.com/presentation/d/abc/edit']}
 assert.equal(meetingInput(body).title,'Test');assert.equal(meetingInput(body).location,'UMC')
 assert.equal(meetingInput({...body,presentations:[]}).presentations.length,0)
 for(const change of [{title:' '},{date:'2026-02-30'},{time:'25:30'},{location:{}},{semester_id:'junk'}])assert.throws(()=>meetingInput({...body,...change}))
})
test('Instagram normalization only accepts profile handles and safe URLs',()=>{
 assert.equal(instagramHandle('@Some.User'),'some.user')
 assert.equal(instagramHandle('https://www.instagram.com/Some.User/'),'some.user')
 assert.equal(instagramHandle(''),null)
 for(const url of ['javascript:alert(1)','https://evil.org/user','https://instagram.com/p/abc','https://instagram.com/user?next=evil','https://instagram.com:8443/user','https://user:pass@instagram.com/user'])assert.throws(()=>instagramHandle(url))
 assert.throws(()=>boardInput({name:'A',role:'B',display_order:-1}))
})
test('Photo validation checks size, MIME, and file signature',()=>{
 assert.equal(photoExtension('image/jpeg',3,new Uint8Array([255,216,255])),'jpg')
 assert.equal(photoExtension('image/png',8,new Uint8Array([137,80,78,71,13,10,26,10])),'png')
 assert.throws(()=>photoExtension('image/jpeg',20,new TextEncoder().encode('<script>bad</script>')))
 assert.throws(()=>photoExtension('image/svg+xml',12,new Uint8Array(12)))
 assert.throws(()=>photoExtension('image/jpeg',6*1024*1024,new Uint8Array([255,216,255])))
})
test('Administrative API routes reject anonymous and student requests before service reads',async()=>{
 const checks=[['app/api/meetings/route.ts',['POST']],['app/api/meetings/[id]/route.ts',['GET','PUT','DELETE']],['app/api/meetings/[id]/attendance/route.ts',['GET','POST']],['app/api/board/route.ts',['GET','POST']],['app/api/board/[id]/route.ts',['PUT','DELETE']],['app/api/board/photos/route.ts',['POST','DELETE']],['app/api/members/route.ts',['GET','POST']],['app/api/members/[id]/route.ts',['PUT','DELETE']]]
 for(const [file,methods] of checks){
  const route=load(file)
  for(const method of methods){
   for(const role of [null,'student']){
    auth=role?{userId:'student-1',role}:null;operations=[]
    const res=await route[method](new Request('http://localhost/api/test',{method:method==='GET'?'GET':'POST',body:method==='GET'?undefined:'{}',headers:{'Content-Type':'application/json'}}),{params:{id:'meeting-1'}})
    assert.equal(res.status,role?403:401,`${file} ${method} ${role}`)
    assert.equal(operations.length,0,`${file} must not access private tables`)
   }
  }
 }
})
test('Secure signup ignores supplied userId/email and links only authenticated identity',async()=>{
 const signup=load('app/api/auth/signup/route.ts')
 auth=null;operations=[]
 let res=await signup.POST(new Request('http://localhost/api/auth/signup',{method:'POST',body:JSON.stringify({userId:'victim',email:'victim@test.edu'})}))
 assert.equal(res.status,401);assert.equal(operations.length,0)
 auth={userId:'verified-user',role:'student'}
 res=await signup.POST(new Request('http://localhost/api/auth/signup',{method:'POST',body:JSON.stringify({userId:'victim',email:'victim@test.edu'})}))
 assert.equal(res.status,200);assert.deepEqual(operations[0],['rpc','ensure_student_member',{p_user_id:'verified-user'}])
 rpcResult={data:null,error:null}
 res=await signup.POST(new Request('http://localhost/api/auth/signup',{method:'POST'}));assert.equal(res.status,409)
 rpcResult={data:'linked-member',error:null}
})
test('Meeting edit updates existing ID, has no attendance write, and validates invalid JSON',async()=>{
 auth={userId:'admin-1',role:'admin'};operations=[]
 const route=load('app/api/meetings/[id]/route.ts')
 let res=await route.PUT(new Request('http://localhost/api/meetings/id',{method:'PUT',body:JSON.stringify({title:'Edited',date:'2026-10-12',presentations:[]})}),{params:{id:'original-meeting'}})
 assert.equal(res.status,200)
 assert.ok(operations.some(op=>op[0]==='eq' && op[1]==='id' && op[2]==='original-meeting'))
 assert.ok(operations.filter(op=>op[0]==='table').every(op=>op[1]==='meetings'))
 operations=[]
 res=await route.PUT(new Request('http://localhost/api/meetings/id',{method:'PUT',body:'{bad'}),{params:{id:'original-meeting'}})
 assert.equal(res.status,400);assert.equal(operations.length,0)
})
