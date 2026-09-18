(function(){
  'use strict';

  const STORAGE_KEY='xps-tools-theme';
  const themes=[
    {key:'ocean',label:'Ocean',mode:'Dark',dot:'#38bdf8'},
    {key:'graphite',label:'Graphite',mode:'Dark',dot:'#9fb2c3'},
    {key:'forest',label:'Forest',mode:'Dark',dot:'#42d392'},
    {key:'teal',label:'Teal',mode:'Dark',dot:'#22d3ee'},
    {key:'sandstone',label:'Sandstone',mode:'Dark',dot:'#f1c45d'},
    {key:'sky',label:'Sky',mode:'Light',dot:'#2f8cff'},
    {key:'sage',label:'Sage',mode:'Light',dot:'#4b9a6a'},
    {key:'ivory',label:'Ivory',mode:'Light',dot:'#c48722'}
  ];

  function getTheme(key){return themes.find(t=>t.key===key)||themes[0]}
  function savedTheme(){
    try{return localStorage.getItem(STORAGE_KEY)||'ocean'}catch(_){return 'ocean'}
  }
  function applyTheme(key,persist){
    const theme=getTheme(key);
    document.documentElement.dataset.theme=theme.key;
    document.documentElement.dataset.themeMode=theme.mode.toLowerCase();
    if(persist){try{localStorage.setItem(STORAGE_KEY,theme.key)}catch(_){}}
    document.dispatchEvent(new CustomEvent('xps-theme-change',{detail:theme}));
    return theme;
  }

  applyTheme(savedTheme(),false);

  function renderPicker(host){
    host.classList.add('themePicker');
    host.innerHTML='<button type="button" class="themeButton" aria-haspopup="listbox" aria-expanded="false"></button><div class="themeMenu" role="listbox" hidden></div>';
    const button=host.querySelector('.themeButton');
    const menu=host.querySelector('.themeMenu');

    function paintButton(){
      const theme=getTheme(document.documentElement.dataset.theme);
      button.innerHTML=`<span class="themeChoice"><span class="themeDot" style="--theme-dot:${theme.dot}"></span><span>${theme.label}</span></span><span class="themeChevron">⌄</span>`;
      button.setAttribute('aria-label',`Theme: ${theme.label}`);
    }
    function paintMenu(){
      const current=document.documentElement.dataset.theme;
      let html='';
      for(const mode of ['Dark','Light']){
        html+=`<div class="themeMenuLabel">${mode}</div>`;
        for(const t of themes.filter(x=>x.mode===mode)){
          html+=`<button type="button" class="themeOption${t.key===current?' active':''}" data-theme-option="${t.key}" role="option" aria-selected="${t.key===current?'true':'false'}"><span class="themeDot" style="--theme-dot:${t.dot}"></span><span>${t.label}</span></button>`;
        }
      }
      menu.innerHTML=html;
      menu.querySelectorAll('[data-theme-option]').forEach(option=>{
        option.addEventListener('click',()=>{
          applyTheme(option.dataset.themeOption,true);
          paintButton();paintMenu();closeMenu();
        });
      });
    }
    function openMenu(){menu.hidden=false;button.setAttribute('aria-expanded','true')}
    function closeMenu(){menu.hidden=true;button.setAttribute('aria-expanded','false')}
    function toggleMenu(){menu.hidden?openMenu():closeMenu()}

    button.addEventListener('click',toggleMenu);
    host.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
    document.addEventListener('click',e=>{if(!host.contains(e.target))closeMenu()});
    paintButton();paintMenu();
  }

  function init(){document.querySelectorAll('[data-theme-picker]').forEach(renderPicker)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

  window.XPSTheme={themes,applyTheme,getTheme};
})();
