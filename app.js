(() => {
  const canvas = document.querySelector('#canvas');
  const wrap = document.querySelector('#canvas-wrap');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let tool = 'pencil', colour = '#171717', width = 7, drawing = false, last = null;

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const old = document.createElement('canvas');
    old.width = canvas.width; old.height = canvas.height;
    if (canvas.width && canvas.height) old.getContext('2d').drawImage(canvas,0,0);
    const cssW = Math.max(1, rect.width - (innerWidth <= 760 ? 16 : 32));
    const cssH = Math.max(1, rect.height - (innerWidth <= 760 ? 16 : 32));
    canvas.width = Math.floor(cssW * dpr); canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,cssW,cssH);
    if (old.width) ctx.drawImage(old,0,0,old.width,old.height,0,0,cssW,cssH);
    ctx.lineCap='round'; ctx.lineJoin='round';
  }

  function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  function start(e){e.preventDefault(); if(tool==='fill'){floodFill(point(e));return} drawing=true;last=point(e);draw(last,last);canvas.setPointerCapture?.(e.pointerId)}
  function move(e){if(!drawing)return;e.preventDefault();const p=point(e);draw(last,p);last=p}
  function end(e){drawing=false;last=null;try{canvas.releasePointerCapture?.(e.pointerId)}catch{}}
  function draw(a,b){ctx.strokeStyle=tool==='eraser'?'#ffffff':colour;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}

  function floodFill(p){
    const dpr=Math.max(1,window.devicePixelRatio||1), x=Math.floor(p.x*dpr), y=Math.floor(p.y*dpr), w=canvas.width,h=canvas.height;
    if(x<0||y<0||x>=w||y>=h)return;
    const img=ctx.getImageData(0,0,w,h), data=img.data, start=(y*w+x)*4;
    const target=[data[start],data[start+1],data[start+2],data[start+3]];
    const temp=document.createElement('canvas').getContext('2d');temp.fillStyle=colour;temp.fillRect(0,0,1,1);const fill=temp.getImageData(0,0,1,1).data;
    if(target[0]===fill[0]&&target[1]===fill[1]&&target[2]===fill[2])return;
    const match=i=>Math.abs(data[i]-target[0])<12&&Math.abs(data[i+1]-target[1])<12&&Math.abs(data[i+2]-target[2])<12&&data[i+3]===target[3];
    const stack=[[x,y]], seen=new Uint8Array(w*h);
    while(stack.length){const [cx,cy]=stack.pop(), pos=cy*w+cx;if(cx<0||cy<0||cx>=w||cy>=h||seen[pos])continue;seen[pos]=1;const i=pos*4;if(!match(i))continue;data[i]=fill[0];data[i+1]=fill[1];data[i+2]=fill[2];data[i+3]=255;stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1])}
    ctx.putImageData(img,0,0);
  }

  function activate(selector, el){document.querySelectorAll(selector).forEach(b=>b.classList.remove('active'));el.classList.add('active')}
  document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;activate('.tool',b)}));
  document.querySelectorAll('.width').forEach(b=>b.addEventListener('click',()=>{width=+b.dataset.width;activate('.width',b)}));
  document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{colour=b.dataset.colour;tool='pencil';activate('.swatch',b);activate('.tool',document.querySelector('[data-tool="pencil"]'))}));
  document.querySelector('#clear').addEventListener('click',()=>{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore()});
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  resizeCanvas();
  let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(resizeCanvas,120)});
})();