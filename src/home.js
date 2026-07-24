import { applyHomeView, getHomeVersion } from './home-version.js'

const version = getHomeVersion()
applyHomeView(version)

// #region agent log
fetch('http://127.0.0.1:7850/ingest/0c1f0efb-9c3f-4dbd-8308-1dd1b824c3ae',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ae8d36'},body:JSON.stringify({sessionId:'ae8d36',runId:'pre-fix',hypothesisId:'A',location:'home.js:entry',message:'home boot',data:{version,href:location.href,coolerHidden:!!document.getElementById('home-cooler')?.hidden,simpleHidden:!!document.getElementById('home-simple')?.hidden,bioStylesheets:[...document.styleSheets].map(s=>{try{return s.href}catch{return 'opaque'}}).filter(Boolean)},timestamp:Date.now()})}).catch(()=>{});
// #endregion

if (version === 'cooler') {
  import('./main.js')
    .then(() => {
      // #region agent log
      const layout = document.querySelector('.layout')
      const scene = document.querySelector('#scene-frame')
      const cs = layout ? getComputedStyle(layout) : null
      fetch('http://127.0.0.1:7850/ingest/0c1f0efb-9c3f-4dbd-8308-1dd1b824c3ae',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ae8d36'},body:JSON.stringify({sessionId:'ae8d36',runId:'pre-fix',hypothesisId:'A',location:'home.js:main-loaded',message:'main.js import resolved',data:{layoutH:cs?.height,layoutDisplay:cs?.display,sceneH:scene?.clientHeight,sceneW:scene?.clientWidth,hasMpHud:layout?.classList?.contains('mp-hud'),stylesheetCount:document.styleSheets.length,hrefs:[...document.styleSheets].map(s=>{try{return s.href}catch{return null}}).filter(Boolean)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    })
    .catch((err) => {
      // #region agent log
      fetch('http://127.0.0.1:7850/ingest/0c1f0efb-9c3f-4dbd-8308-1dd1b824c3ae',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ae8d36'},body:JSON.stringify({sessionId:'ae8d36',runId:'pre-fix',hypothesisId:'D',location:'home.js:main-fail',message:'main.js import failed',data:{error:String(err),stack:err?.stack},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    })
} else {
  import('./simple-home.js')
}
