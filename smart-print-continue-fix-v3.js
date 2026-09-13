// Smart Print Continue button final capture-phase fallback
(function(){'use strict';
function go(){var g=document.getElementById('gate'),w=document.getElementById('workspace');if(!w)return false;if(g)g.classList.add('hidden');w.classList.remove('hidden');try{window.updateLicense&&window.updateLicense()}catch(e){}try{window.selectType&&window.selectType('document')}catch(e){}return true}
function hook(){var g=document.getElementById('gate');if(!g||g.dataset.nrContinueV3)return;g.dataset.nrContinueV3='1';g.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('button'):null;if(b){e.preventDefault();e.stopPropagation();go()}},true)}
[0,100,500,1000,2000,4000].forEach(function(t){setTimeout(hook,t)});
})();
