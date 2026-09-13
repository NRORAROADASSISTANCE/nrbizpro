// NR BizPro Smart Print Continue: capture clicks on the gate button and reveal workspace.
(function(){'use strict';
function go(){var w=document.getElementById('workspace'),g=document.getElementById('gate');if(!w)return;if(g)g.classList.add('hidden');w.classList.remove('hidden');try{if(typeof window.updateLicense==='function')window.updateLicense()}catch(e){}try{if(typeof window.selectType==='function')window.selectType('document')}catch(e){}}
function hook(){var g=document.getElementById('gate');if(!g||g.dataset.nrContinueFinal==='1')return;g.dataset.nrContinueFinal='1';g.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(b){e.preventDefault();e.stopImmediatePropagation();go()}},true)}
[0,100,300,700,1500,3000].forEach(function(t){setTimeout(hook,t)});
})();
