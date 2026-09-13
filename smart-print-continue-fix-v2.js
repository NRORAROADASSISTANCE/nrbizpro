// Smart Print Continue fallback. Kept separate from existing Smart Print logic.
(function(){
'use strict';
function forceContinue(){
 var gate=document.getElementById('gate'), ws=document.getElementById('workspace');
 if(!ws)return;
 if(gate)gate.classList.add('hidden');
 ws.classList.remove('hidden');
 try{if(typeof window.updateLicense==='function')window.updateLicense()}catch(e){}
 try{if(typeof window.selectType==='function')window.selectType('document')}catch(e){}
}
function install(){
 var gate=document.getElementById('gate'); if(!gate)return;
 var b=gate.querySelector('button'); if(!b)return;
 if(b.dataset.nrContinueV2==='1')return;
 b.dataset.nrContinueV2='1'; b.type='button';
 b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();forceContinue()},true);
}
[0,100,500,1200,2500].forEach(function(t){setTimeout(install,t)});
})();
