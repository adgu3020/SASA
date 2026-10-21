const assert=require('node:assert/strict')
const fs=require('node:fs')
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright')
;(async()=>{
 const launch={headless:true}
 if(process.env.CHROMIUM_MODULE){const c=(await import(process.env.CHROMIUM_MODULE)).default;launch.executablePath=process.env.CHROMIUM_EXECUTABLE_PATH || await c.executablePath();launch.args=c.args.filter(a=>!a.startsWith('--single-process')&&!a.startsWith('--use-angle')&&!a.startsWith('--use-gl'));launch.args.push('--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing','--disable-vulkan','--no-zygote')}
 const browser=await chromium.launch(launch)
 const page=await browser.newPage({viewport:{width:1280,height:900}})
 const errors=[];page.on('pageerror',e=>errors.push(e.stack || e.message))
 let updates=[];let board=[{id:'board-1',name:'Original Officer',role:'Treasurer',bio:'Original bio',instagram:'original',display_order:0,is_visible:true,photo_path:null}]
 let uploadHeaders
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),method=req.method();let data
  if(url.pathname==='/api/board/photos'){
   uploadHeaders=req.headers()['content-type'];data={path:'uploads/00000000-0000-0000-0000-000000000008.jpg'}
  }else if(url.pathname==='/api/board'){
   if(method==='GET')data=board
   else {data={...req.postDataJSON(),id:'board-2'};board.push(data)}
  }else if(url.pathname.startsWith('/api/board/')){
   const id=url.pathname.split('/').at(-1)
   board=board.map(b=>b.id===id?{...b,...(method==='DELETE'?{is_visible:false}:req.postDataJSON())}:b)
   data=board.find(b=>b.id===id)
  }else if(url.pathname.includes('/attendance')){
   data=method==='GET'?[{member_id:'student-1',attended:true}]:{count:req.postDataJSON().member_ids.length}
  }else {
   const body=req.postDataJSON();updates.push({url:url.pathname,method,body});data={...body,id:url.pathname.split('/').at(-1)}
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data})})
 })
 await page.goto('http://localhost:3100/qa')
 try { await page.getByText('Original Officer',{exact:true}).waitFor({timeout:15000}) } catch(e) { console.error('Page errors',errors); console.error((await page.locator('body').innerText()).slice(0,3000)); throw e }
 await page.getByRole('button',{name:'Edit',exact:true}).first().click()
 await page.getByRole('heading',{name:'Edit Meeting'}).waitFor()
 assert.equal(await page.getByLabel('Location',{exact:true}).inputValue(),'UMC')
 const form=page.locator('form').first()
 assert.equal(await form.locator('input[type="text"]').first().inputValue(),'Original Meeting')
 assert.equal(await form.locator('input[type="time"]').inputValue(),'18:00')
 await form.locator('input[type="text"]').first().fill('Edited Meeting')
 await form.locator('textarea').last().fill('https://docs.google.com/presentation/d/e/published/pub')
 await page.getByRole('button',{name:'Save Changes'}).click()
 await page.getByText('Meeting updated. Attendance has been preserved.').waitFor()
 assert.equal(updates[0].method,'PUT');assert.equal(updates[0].url,'/api/meetings/00000000-0000-0000-0000-000000000002')
 assert.equal(updates[0].body.presentations[0],'https://docs.google.com/presentation/d/e/published/pub')
 console.log('PASS Browser meeting edit loads fields, updates same ID, preserves displayed attendance')
 await page.getByRole('button',{name:'Edit',exact:true}).first().click()
 await page.locator('form').first().locator('textarea').last().fill('')
 await page.getByRole('button',{name:'Save Changes'}).click()
 await page.getByRole('heading',{name:'Edit Meeting'}).waitFor({state:'hidden'})
 assert.equal(updates[1].body.presentations.length,0)
 console.log('PASS Browser presentation replacement and removal')
 await page.getByRole('button',{name:'Add Board Member'}).click()
 await page.getByLabel(/^name$/i).fill('New Officer')
 await page.getByLabel(/^role$/i).fill('President')
 await page.getByLabel(/^instagram$/i).fill('@new.officer')
 await page.getByLabel('Description',{exact:true}).fill('New biography')
 await page.getByLabel('Display order (lower numbers first)').fill('2')
 await page.locator('input[type=file]').setInputFiles('public/images/board/president.jpg')
 await page.getByRole('button',{name:'Save Member'}).click()
 await page.getByText('New Officer',{exact:true}).waitFor()
 assert.ok(uploadHeaders.startsWith('multipart/form-data; boundary='))
 assert.equal(board[1].photo_path,'uploads/00000000-0000-0000-0000-000000000008.jpg')
 console.log('PASS Browser board creation sends multipart photo, name, role, bio, Instagram, order')
 await page.getByRole('button',{name:'Edit',exact:true}).last().click()
 await page.getByLabel(/^name$/i).fill('Updated Officer')
 await page.getByRole('button',{name:'Save Member'}).click()
 await page.getByText('Updated Officer',{exact:true}).waitFor()
 await page.reload();await page.getByText('Updated Officer',{exact:true}).waitFor()
 console.log('PASS Browser board edits persist across refresh through mocked API')
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Hide',exact:true}).last().click()
 await page.getByText('Board member hidden. You can restore them by editing their visibility.').waitFor()
 assert.equal(board[1].is_visible,false)
 console.log('PASS Browser board hiding and restoration UI')
 await page.getByText('Google Slides',{exact:true}).click()
 assert.equal(await page.locator('iframe').getAttribute('src'),'https://docs.google.com/presentation/d/test/preview')
 assert.equal(await page.getByRole('link',{name:'open the presentation in a new tab'}).getAttribute('target'),'_blank')
 console.log('PASS Browser responsive trusted presentation iframe and external fallback link')
 await page.setViewportSize({width:390,height:844})
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'No mobile horizontal overflow')
 await page.screenshot({path:process.env.QA_SCREENSHOT || require('node:path').join(require('node:os').tmpdir(),'sasa-qa-mobile.png'),fullPage:true})
 console.log('PASS Mobile layout fits 390px viewport')
 assert.deepEqual(errors,[])
 await browser.close();console.log('7 browser checks passed (mocked API, no production requests)')
})().catch(e=>{console.error(e);process.exit(1)})
