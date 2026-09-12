// Browser behavior and visual evidence with clearly synthetic records only.
// Backend authorization/signatures/storage are exercised separately in Python.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5191';
const output = process.env.ASTRO_SCREENSHOTS || '/tmp/astro-private-inquiries';
mkdirSync(output, { recursive:true });

(async () => {
  const browser = await chromium.launch({ executablePath:process.env.ASTRO_BROWSER_EXECUTABLE, headless:true });
  const checks = [];
  try {
    for (const [label,width,height] of [['laptop',1366,768],['desktop',2560,1440],['mobile',390,844]]) {
      const context = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce' });
      const page = await context.newPage();
      async function capture(state) {
        await page.evaluate(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
        await page.screenshot({path:`${output}/${label}-${state}.png`,fullPage:true});
        if(state==='inquiry') await page.screenshot({path:`${output}/${label}-viewport.png`});
      }
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      let signedIn=true, empty=false, fail=false, delayDetail=false, detailPending;
      const seen=new Set();
      const rows = [
        {id:'11111111-1111-4111-8111-111111111111',name:'Synthetic visitor — career',subject:'General Numerology',source:'home'},
        {id:'22222222-2222-4222-8222-222222222222',name:'Synthetic visitor — home',subject:'Vastu Consultation',source:'contact'},
        {id:'33333333-3333-4333-8333-333333333333',name:'Synthetic visitor — question',subject:'Prashna Kundali inquiry',source:'prashna'},
      ].map(x=>({...x,created_at:'2026-09-11T06:30:00Z',seen_at:null}));
      const fulfilled = (route,data,status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
      await page.route('**/api/**', async route => {
        const url=new URL(route.request().url()); const path=url.pathname;
        if(!signedIn) return fulfilled(route,{detail:'Please sign in again.'},401);
        if(path==='/api/admin/session') return fulfilled(route,{email:'synthetic-studio@example.invalid',csrf_token:'synthetic-browser-csrf'});
        if(path==='/api/admin/logout') {signedIn=false;return fulfilled(route,{success:true});}
        if(path==='/api/admin/day') return fulfilled(route,{slots:[],closures:[]});
        if(path.endsWith('/seen')) {
          assert.equal(route.request().headers()['x-astro-csrf'],'synthetic-browser-csrf');
          seen.add(path.split('/').at(-2));return fulfilled(route,{success:true});
        }
        if(path==='/api/admin/inquiries') {
          if(fail) return fulfilled(route,{detail:'Synthetic connection interruption. Please try again.'},503);
          const items=empty?[]:url.searchParams.get('before')?[rows[2]]:rows;
          return fulfilled(route,{items:items.map(x=>({...x,seen_at:seen.has(x.id)?x.created_at:null})),next_cursor:empty||url.searchParams.get('before')?null:rows[1].id});
        }
        if(path.startsWith('/api/admin/inquiries/')) {
          if(delayDetail) await new Promise(resolve=>{detailPending=resolve;});
          const row=rows.find(x=>path.endsWith(x.id));
          return fulfilled(route,{...row,seen_at:seen.has(row.id)?row.created_at:null,
            email:'synthetic.visitor@example.invalid',phone:'+918000000000',dob:'',location:'SyntheticLocation'.repeat(11),
            message:'Synthetic example for layout testing.\nI would like guidance on a career decision and the right consultation to choose. Please let me know how to proceed.\n\n<script>window.inquiryInjected=true</script>',
            notifications:[{recipient:'client',status:'Waiting for email allowance'},{recipient:'customer',status:'Delivered to mail server'}]});
        }
        return fulfilled(route,{detail:'Not part of this synthetic check'},404);
      });
      await page.goto(base+'/#/studio/calendar');
      await page.getByRole('button',{name:'Inquiries',exact:true}).click();
      await page.getByText(rows[0].name,{exact:true}).waitFor();
      await page.locator('details.studio-inquiry').first().locator('summary').click();
      await page.getByRole('heading',{name:'Message',exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>Boolean(window.inquiryInjected)),false);
      assert.ok(await page.getByText('Waiting for email allowance',{exact:true}).isVisible());
      await page.getByRole('button',{name:'Mark as seen',exact:true}).click();
      await page.locator('details.studio-inquiry').first().getByText('Seen',{exact:true}).waitFor();
      assert.equal(seen.size,1);
      assert.ok((await page.getByRole('link',{name:'Reply by email'}).getAttribute('href')).startsWith('mailto:'));
      await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,left:0,behavior:'instant'});});
      await page.waitForTimeout(500); // Let shared navigation/footer entrance motion settle before measuring layout.
      const overflow = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,x:scrollX,body:document.body.scrollWidth,root:document.documentElement.getBoundingClientRect().toJSON(),
        items:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,class:typeof el.className==='string'?el.className:'svg',width:el.getBoundingClientRect().width,wrap:getComputedStyle(el).overflowWrap})).slice(0,8)}));
      if(overflow.scroll>overflow.width+1) await capture('overflow');
      assert.ok(overflow.scroll<=overflow.width+1,JSON.stringify({label,...overflow}));
      assert.ok(await page.locator('.studio-inquiry__content').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await capture('inquiry');
      checks.push(`${label}: details, safe text, seen action, contact action and width`);
      await page.getByRole('button',{name:'Older inquiries'}).click();
      await page.waitForFunction(()=>document.querySelectorAll('details.studio-inquiry').length===1);
      await page.getByRole('button',{name:'Newest inquiries'}).click();
      await page.waitForFunction(()=>document.querySelectorAll('details.studio-inquiry').length===3);
      empty=true;
      await page.getByRole('button',{name:'Needs attention',exact:true}).click();
      await page.getByRole('heading',{name:'No inquiry emails need attention'}).waitFor();
      await capture('empty');
      fail=true;
      await page.getByRole('button',{name:'Refresh inquiries'}).click();
      await page.getByRole('alert').filter({hasText:'Synthetic connection interruption'}).waitFor();
      await capture('error');
      fail=false; empty=false;
      await page.getByRole('button',{name:'Try again',exact:true}).click();
      await page.getByText(rows[0].name,{exact:true}).waitFor();
      delayDetail=true;
      await page.locator('details.studio-inquiry').first().locator('summary').click();
      await page.getByText('Loading inquiry…',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Sign out',exact:true}).click();
      await page.getByRole('button',{name:'Connect with Google',exact:true}).waitFor();
      if(detailPending) detailPending();
      await page.waitForTimeout(150);
      assert.equal(await page.getByText(rows[0].name,{exact:true}).count(),0);
      assert.equal(await page.getByText('synthetic.visitor@example.invalid',{exact:true}).count(),0);
      await capture('signed-out');
      assert.deepEqual(errors,[]);
      checks.push(`${label}: paging, empty, error recovery, logout and stale detail response`);
      await context.close();
    }
    console.log(JSON.stringify({checks,passed:checks.length,output,realProviderCalls:0}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
