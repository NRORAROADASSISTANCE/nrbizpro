/* Smart Print customer test entry.
 * Keeps the production login/license flow intact while exposing a clear 5-page
 * document/ID test path. Passport remains Premium-only.
 */
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m))}
  function mount(){
    const gate=document.getElementById('gate');
    if(!gate || new URLSearchParams(location.search).get('customerTest')==='1') return;
    gate.innerHTML=`<div class="gate">
      <h1>NR BizPro Smart Print</h1>
      <p>Clean WhatsApp documents and make them print-ready without rewriting their content.</p>
      <div class="price">₹2,000 + GST</div>
      <p>3 Years • Unlimited Printing • Registered Customers Only</p>
      <div class="warn">Customer Test: 5 successful document/ID test pages. Passport-size photos are Premium only.</div>
      <div style="display:grid;gap:10px;margin-top:14px">
        <button class="primary" type="button" id="spCustomerTestBtn">🧪 Start 5-Page Customer Test</button>
        <button class="secondary" type="button" id="spLoginContinueBtn">🔐 Login &amp; Continue</button>
      </div>
    </div>`;
    document.getElementById('spCustomerTestBtn').onclick=function(){
      const u=new URL(location.href);u.searchParams.set('customerTest','1');location.href=u.toString();
    };
    document.getElementById('spLoginContinueBtn').onclick=function(){
      if(typeof window.getAccount==='function' && window.getAccount()){
        if(typeof window.showWorkspace==='function') window.showWorkspace();
        else location.href='index.html';
      } else {
        alert('Please login to your NR BizPro account first.');
      }
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,50));
  else setTimeout(mount,50);
})();
