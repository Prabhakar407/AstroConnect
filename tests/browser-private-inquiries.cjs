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
      let paymentHandled=false, deliveryRetried=false, paymentEventRetried=false;
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
        if(path==='/api/admin/bookings') return fulfilled(route,{items:[],next_cursor:null});
        if(path==='/api/admin/logout') {signedIn=false;return fulfilled(route,{success:true});}
        if(path==='/api/admin/day') return fulfilled(route,{slots:[],closures:[]});
        if(path==='/api/admin/attention') return fulfilled(route,{
          payment_cases:paymentHandled?[]:[{id:'44444444-4444-4444-8444-444444444444',kind:'late_or_mismatched_payment',
            booking_id:'55555555-5555-4555-8555-555555555555',full_name:'Synthetic payment visitor',
            email:'payment@example.invalid',phone:'+918000000001',service_name:'General Numerology',amount_paise:310000,
            starts_at:'2026-09-15T10:00:00+05:30',created_at:'2026-09-11T06:30:00Z'}],
          delivery_problems:deliveryRetried?[]:[{id:'66666666-6666-4666-8666-666666666666',recipient_role:'calendar',
            full_name:'Synthetic calendar visitor',service_name:'Vedic Astrology',last_error_code:'reconnect_required'}],
          payment_event_problems:paymentEventRetried?[]:[{id:'77777777-7777-4777-8777-777777777777',event_id:'evt_synthetic',
            kind:'payment.captured',payment_id:'pay_synthetic123',last_error:'payment_order_unmatched',
            received_at:'2026-09-11T06:30:00Z',next_attempt_at:'2026-09-11T06:45:00Z',attempts:12}],
        });
        if(path==='/api/admin/attention/payments/44444444-4444-4444-8444-444444444444/handled') {
          assert.equal(route.request().headers()['x-astro-csrf'],'synthetic-browser-csrf');
          assert.deepEqual(route.request().postDataJSON(),{resolution:'checked_no_action',note:'Synthetic review complete.'});
          paymentHandled=true; return fulfilled(route,{success:true});
        }
        if(path==='/api/admin/attention/delivery/66666666-6666-4666-8666-666666666666/retry') {
          assert.equal(route.request().headers()['x-astro-csrf'],'synthetic-browser-csrf');
          deliveryRetried=true; return fulfilled(route,{success:true});
        }
        if(path==='/api/admin/attention/delivery/77777777-7777-4777-8777-777777777777/retry') {
          assert.equal(route.request().headers()['x-astro-csrf'],'synthetic-browser-csrf');
          paymentEventRetried=true; return fulfilled(route,{success:true});
        }
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
      await page.goto(base+'/studio/calendar');
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
      await page.getByRole('heading',{name:'Late or mismatched payment',exact:true}).waitFor();
      await capture('attention');
      await page.getByLabel('What did you do?').selectOption('checked_no_action');
      await page.getByLabel('Private note (optional)').fill('Synthetic review complete.');
      await page.getByRole('button',{name:'Mark as handled',exact:true}).click();
      await page.getByRole('heading',{name:'Google Calendar and Meet did not complete',exact:true}).waitFor();
      page.once('dialog', dialog=>dialog.accept());
      await page.getByRole('button',{name:'Try delivery again',exact:true}).click();
      await page.getByRole('heading',{name:'Captured payment needs checking',exact:true}).waitFor();
      page.once('dialog', dialog=>{
        assert.equal(dialog.message(),'Check this Razorpay update again?');
        dialog.accept();
      });
      await page.getByRole('button',{name:'Check again',exact:true}).click();
      await page.getByRole('heading',{name:'No booking or payment items need attention',exact:true}).waitFor();
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
