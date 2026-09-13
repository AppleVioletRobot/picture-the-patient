(() => {
  const canvas = document.querySelector('#canvas');
  const wrap = document.querySelector('#canvas-wrap');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const STORAGE_KEY = 'picture-the-patient-autosave';
  let tool = 'pencil', colour = '#252321', width = 5, drawing = false, last = null;
  let lastTouchTime = 0;
  const history = [];
  const HISTORY_LIMIT = 20;

  function cssSize() {
    const rect = wrap.getBoundingClientRect();
    const pad = window.innerWidth <= 760 ? 12 : 32;
    return { w: Math.max(1, rect.width - pad), h: Math.max(1, rect.height - pad) };
  }

  function fillWhite() {
    const { w, h } = cssSize();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }

  function resizeCanvas(preserve = true) {
    const { w, h } = cssSize();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const old = document.createElement('canvas');
    old.width = canvas.width; old.height = canvas.height;
    if (preserve && canvas.width && canvas.height) old.getContext('2d').drawImage(canvas, 0, 0);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    fillWhite();
    if (preserve && old.width && old.height) ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, w, h);
  }

  function pointFromClient(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function snapshot() {
    try {
      history.push(canvas.toDataURL('image/png'));
      if (history.length > HISTORY_LIMIT) history.shift();
    } catch {}
  }

  function restoreSnapshot(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const { w, h } = cssSize();
      ctx.clearRect(0, 0, w, h);
      fillWhite();
      ctx.drawImage(img, 0, 0, w, h);
      saveLocal();
    };
    img.src = dataUrl;
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return;
    restoreSnapshot(previous);
  }

  function beginAt(p) {
    snapshot();
    if (tool === 'fill') { floodFill(p); saveLocal(); return; }
    drawing = true;
    last = p;
    draw(last, last);
  }

  function moveTo(p) {
    if (!drawing) return;
    draw(last, p);
    last = p;
  }

  function finishStroke() {
    if (!drawing) return;
    drawing = false;
    last = null;
    saveLocal();
  }

  function draw(a, b) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function floodFill(p) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const x = Math.floor(p.x * dpr), y = Math.floor(p.y * dpr);
    const w = canvas.width, h = canvas.height;
    if (x < 0 || y < 0 || x >= w || y >= h) return;

    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const start = (y * w + x) * 4;
    const target = [data[start], data[start+1], data[start+2], data[start+3]];

    const temp = document.createElement('canvas').getContext('2d');
    temp.fillStyle = colour;
    temp.fillRect(0, 0, 1, 1);
    const fill = temp.getImageData(0, 0, 1, 1).data;

    if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2]) return;

    const match = i =>
      Math.abs(data[i] - target[0]) < 12 &&
      Math.abs(data[i+1] - target[1]) < 12 &&
      Math.abs(data[i+2] - target[2]) < 12 &&
      data[i+3] === target[3];

    const stack = [[x, y]];
    const filled = new Uint8Array(w * h);

    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const pos = cy * w + cx;
      if (filled[pos]) continue;
      const i = pos * 4;
      if (!match(i)) continue;

      filled[pos] = 1;
      data[i] = fill[0];
      data[i+1] = fill[1];
      data[i+2] = fill[2];
      data[i+3] = 255;

      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }

    // New paint visually wins. Push the fill beyond the old boundary far enough
    // to swallow both the solid stroke edge and its anti-aliased fringe.
    const radius = Math.max(2, Math.round((width * dpr) / 2 + 3 * dpr));
    const boundary = [];

    for (let cy = 0; cy < h; cy++) {
      for (let cx = 0; cx < w; cx++) {
        const pos = cy * w + cx;
        if (!filled[pos]) continue;
        if (
          cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1 ||
          !filled[pos - 1] || !filled[pos + 1] ||
          !filled[pos - w] || !filled[pos + w]
        ) boundary.push([cx, cy]);
      }
    }

    for (const [bx, by] of boundary) {
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const px = bx + ox, py = by + oy;
          if (px < 0 || py < 0 || px >= w || py >= h) continue;
          const i = (py * w + px) * 4;
          data[i] = fill[0];
          data[i+1] = fill[1];
          data[i+2] = fill[2];
          data[i+3] = 255;
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  }

  function activate(selector, el){ document.querySelectorAll(selector).forEach(b=>b.classList.remove('active')); el.classList.add('active'); }
  document.querySelectorAll('.tool').forEach(b=>b.addEventListener('click',()=>{ tool=b.dataset.tool; activate('.tool',b); }));
  document.querySelectorAll('.width').forEach(b=>b.addEventListener('click',()=>{ width=+b.dataset.width; activate('.width',b); }));
  document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{ colour=b.dataset.colour; tool='pencil'; activate('.swatch',b); activate('.tool',document.querySelector('[data-tool="pencil"]')); }));

  function clearCanvas(){
    snapshot();
    const {w,h}=cssSize();
    ctx.clearRect(0,0,w,h);
    fillWhite();
    try{localStorage.removeItem(STORAGE_KEY)}catch{}
  }
  function saveLocal(){ try{localStorage.setItem(STORAGE_KEY,canvas.toDataURL('image/png'))}catch{} }
  function restoreLocal(){
    let saved=null; try{saved=localStorage.getItem(STORAGE_KEY)}catch{}
    if(!saved) return;
    const img=new Image();
    img.onload=()=>{const {w,h}=cssSize();ctx.drawImage(img,0,0,w,h)};
    img.src=saved;
  }

  async function saveDrawing(){
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')); if(!blob)return;
    const file=new File([blob],'picture-the-patient.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
      try{await navigator.share({files:[file],title:'Picture the Patient'});return}catch(err){if(err.name==='AbortError')return}
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='picture-the-patient.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  document.querySelector('#clear').addEventListener('click',clearCanvas);
  document.querySelector('#undo').addEventListener('click',undo);
  document.querySelector('#save').addEventListener('click',saveDrawing);

  canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    lastTouchTime=Date.now();
    const t=e.changedTouches[0];
    if(t) beginAt(pointFromClient(t.clientX,t.clientY));
  },{passive:false});
  canvas.addEventListener('touchmove', e=>{
    e.preventDefault();
    lastTouchTime=Date.now();
    const t=e.changedTouches[0];
    if(t) moveTo(pointFromClient(t.clientX,t.clientY));
  },{passive:false});
  canvas.addEventListener('touchend', e=>{e.preventDefault();lastTouchTime=Date.now();finishStroke();},{passive:false});
  canvas.addEventListener('touchcancel', e=>{e.preventDefault();lastTouchTime=Date.now();finishStroke();},{passive:false});

  if(window.PointerEvent){
    canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch') return;
      e.preventDefault(); beginAt(pointFromClient(e.clientX,e.clientY));
      try{canvas.setPointerCapture(e.pointerId)}catch{}
    },{passive:false});
    canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||!drawing)return;e.preventDefault();moveTo(pointFromClient(e.clientX,e.clientY));},{passive:false});
    canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')return;e.preventDefault();finishStroke();try{canvas.releasePointerCapture(e.pointerId)}catch{}},{passive:false});
    canvas.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')finishStroke();},{passive:false});
  }

  canvas.addEventListener('mousedown',e=>{if(Date.now()-lastTouchTime<700)return;e.preventDefault();beginAt(pointFromClient(e.clientX,e.clientY));});
  window.addEventListener('mousemove',e=>{if(!drawing||Date.now()-lastTouchTime<700)return;moveTo(pointFromClient(e.clientX,e.clientY));});
  window.addEventListener('mouseup',()=>{if(Date.now()-lastTouchTime<700)return;finishStroke();});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  resizeCanvas(false);
  restoreLocal();
  let timer;
  window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>resizeCanvas(true),160)});
})();