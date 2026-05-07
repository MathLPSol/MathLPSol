/* ═══════════════════════════════════════════════════
   FORM BUILDER & GRID NAVIGATION (Excel-like Experience)
   ═══════════════════════════════════════════════════ */
function buildForm(){
  const n=+document.getElementById('nv').value||2;
  const m=+document.getElementById('nc').value||2;
  const od=document.getElementById('objdiv');
  const pC=Array.from(od.querySelectorAll('input')).map(i=>i.value);
  od.innerHTML='<span class="z-lbl">Z =</span>';
  
  // Dựng hàm mục tiêu (Hàng 0)
  for(let j=0;j<n;j++){
    if(j>0){const s=document.createElement('span');s.className='math-op';s.textContent='+';od.appendChild(s)}
    const inp=document.createElement('input');inp.type='number';inp.id='c'+j;inp.placeholder='0';inp.step='any';
    // Gắn toạ độ cho ô (row 0)
    inp.dataset.row = 0; inp.dataset.col = j; 
    
    if(pC[j])inp.value=pC[j];od.appendChild(inp);
    const lbl=document.createElement('span');lbl.className='math-lbl';lbl.innerHTML=`x<sub>${j+1}</sub>`;od.appendChild(lbl);
  }
  
  const cd=document.getElementById('condiv');
  const pR=Array.from(cd.querySelectorAll('.con-row')).map(r=>({c:Array.from(r.querySelectorAll('.cc')).map(i=>i.value),t:r.querySelector('select').value,b:r.querySelector('.rb').value}));
  cd.innerHTML='';
  
  // Dựng các ràng buộc (Từ hàng 1 đến m)
  for(let i=0;i<m;i++){
    const row=document.createElement('div');row.className='con-row';
    const nm=document.createElement('span');nm.className='con-idx';nm.textContent=i+1;row.appendChild(nm);
    
    for(let j=0;j<n;j++){
      if(j>0){const s=document.createElement('span');s.className='math-op';s.textContent='+';row.appendChild(s)}
      const inp=document.createElement('input');inp.type='number';inp.className='cc';inp.placeholder='0';inp.step='any';
      // Gắn toạ độ cho ma trận hệ số A
      inp.dataset.row = i + 1; inp.dataset.col = j;
      
      if(pR[i]?.c[j])inp.value=pR[i].c[j];row.appendChild(inp);
      const lbl=document.createElement('span');lbl.className='math-lbl';lbl.innerHTML=`x<sub>${j+1}</sub>`;row.appendChild(lbl);
    }
    
    const sel=document.createElement('select');
    ['&#8804;','&#8805;','='].forEach(v=>{const o=document.createElement('option');o.value=['≤','≥','='][['&#8804;','&#8805;','='].indexOf(v)];o.innerHTML=v;sel.appendChild(o)});
    sel.value=pR[i]?.t||'≤';
    // Gắn toạ độ cho cột dấu
    sel.dataset.row = i + 1; sel.dataset.col = n;
    row.appendChild(sel);
    
    const rhs=document.createElement('input');rhs.type='number';rhs.className='rb con-rhs';rhs.placeholder='0';rhs.step='any';
    // Gắn toạ độ cho cột vế phải B
    rhs.dataset.row = i + 1; rhs.dataset.col = n + 1;
    if(pR[i]?.b)rhs.value=pR[i].b;row.appendChild(rhs);
    
    cd.appendChild(row);
  }
  document.getElementById('nnlbl').innerHTML=Array.from({length:n},(_,i)=>`x<sub>${i+1}</sub>`).join(', ')+' ≥ 0';

  // Kích hoạt tính năng trải nghiệm nhập liệu Bảng tính
  attachGridListeners();
}

function attachGridListeners() {
  const elements = document.querySelectorAll('#objdiv input, #condiv input, #condiv select');
  
  elements.forEach(el => {
    // 1. Lắng nghe phím mũi tên 4 hướng để nhảy ô
    el.addEventListener('keydown', function(e) {
      const row = parseInt(this.dataset.row);
      const col = parseInt(this.dataset.col);
      if (isNaN(row) || isNaN(col)) return;

      let targetRow = row, targetCol = col;
      
      // Xử lý 4 phím mũi tên và phím Enter
      if (e.key === 'ArrowUp') { 
        targetRow--; e.preventDefault(); 
      } else if (e.key === 'ArrowDown' || e.key === 'Enter') { 
        targetRow++; e.preventDefault(); 
      } else if (e.key === 'ArrowRight') { 
        targetCol++; e.preventDefault(); 
      } else if (e.key === 'ArrowLeft') { 
        targetCol--; e.preventDefault(); 
      }

      // Nếu có sự thay đổi tọa độ thì nhảy focus
      if (targetRow !== row || targetCol !== col) {
        const target = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
        if (target) {
          target.focus();
          // Nếu không phải là ô chọn Dấu, tự động bôi đen toàn bộ số để gõ đè
          if (target.tagName !== 'SELECT') {
            setTimeout(() => target.select(), 10); 
          }
        }
      }
    });

    // 2. Lắng nghe thao tác Dán (Paste) mảng (Giữ nguyên)
    el.addEventListener('paste', function(e) {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      const rows = pasteData.trim().split(/\r\n|\n|\r/);
      const startRow = parseInt(this.dataset.row);
      const startCol = parseInt(this.dataset.col);

      if (isNaN(startRow) || isNaN(startCol)) return;

      rows.forEach((rowData, i) => {
        const cols = rowData.trim().split(/\t|,|\s+/);
        cols.forEach((val, j) => {
          const target = document.querySelector(`[data-row="${startRow + i}"][data-col="${startCol + j}"]`);
          if (target) {
            if (target.tagName === 'SELECT') {
              if (val === '<=' || val === '<' || val === '≤') target.value = '≤';
              else if (val === '>=' || val === '>' || val === '≥') target.value = '≥';
              else if (val === '=') target.value = '=';
            } else {
              const numVal = parseFloat(val);
              if (!isNaN(numVal)) target.value = numVal;
            }
          }
        });
      });
    });
  });
}

/* ═══════════════════════════════════════════════════
   READ INPUT & SOLVER CONTROLLERS
   ═══════════════════════════════════════════════════ */
function readInput(){
  const n=+document.getElementById('nv').value;
  const m=+document.getElementById('nc').value;
  const ot=document.getElementById('ot').value;
  const sfrac=true;
  const sint=document.getElementById('sint').checked;
  const c=[];for(let j=0;j<n;j++){const v=parseFloat(document.getElementById('c'+j).value);c.push(isNaN(v)?0:v)}
  const A=[],b=[],types=[];
  document.getElementById('condiv').querySelectorAll('.con-row').forEach(row=>{
    const cs=Array.from(row.querySelectorAll('.cc')).map(i=>{const v=parseFloat(i.value);return isNaN(v)?0:v});
    A.push(cs);types.push(row.querySelector('select').value);
    const v=parseFloat(row.querySelector('.rb').value);b.push(isNaN(v)?0:v);
  });
  return{n,m,ot,sfrac,sint,c,A,b,types};
}

let manualState=null;

function solve(){
  const inp=readInput();
  setStatus('run','Đang giải…');
  document.getElementById('placeholder').style.display='none';
  document.getElementById('sol').innerHTML='';
  manualState=null;
  let html='';
  try{html=runSolver(inp)}catch(e){html=mkAlert('warn','Lỗi: '+e);console.error(e)}
  document.getElementById('sol').innerHTML=html;
  const good=document.getElementById('sol').querySelector('.result-panel');
  setStatus(good?'ok':'','Hoàn tất');
}

function solveManual(){
  const inp=readInput();
  setStatus('run','Chế độ thủ công…');
  document.getElementById('placeholder').style.display='none';
  document.getElementById('sol').innerHTML='';
  manualState=null;
  const sf=buildSF(inp);
  const T=makeTab(sf);
  manualState={T,inp,step:0,origN:inp.n,phase:'lp',gomIter:0};
  let html=buildProbHeader(inp,sf);
  html+=renderStep(cloneT(T),-1,-1,0,'Bảng đơn hình khởi đầu','init',inp.ot);
  html+=buildManualControls(T,inp.ot,0);
  document.getElementById('sol').innerHTML=html;
  setStatus('run','Chọn biến vào / biến ra');
}

/* ═══════════════════════════════════════════════════
   MANUAL MODE (ĐƠN HÌNH & GOMORY THỦ CÔNG)
   ═══════════════════════════════════════════════════ */
function buildManualControls(T,ot,step){
  if(!T)return'';
  const dualFeas=T.obj.every(v=>v.lte(q(1e-9)));
  const hasNegRhs=T.rhs.some(v=>v.lt(q(-1e-9)));
  const ec_auto=findEnter(T);
  const isOptimal=(ec_auto===-1&&!hasNegRhs);
  if(isOptimal){
    return`<div class="manual-ctrl">
      <div class="mc-title">✓ Bảng tối ưu — không cần thêm bước</div>
      <button class="mc-btn mc-ok" onclick="manualFinish()">Xem kết quả</button>
    </div>`;
  }
  let colOpts='<option value="">-- Chọn biến vào --</option>';
  for(let j=0;j<T.NV;j++){
    if(!T.basis.includes(j)){
      const v=T.obj[j].val();
      const cjDisp=ot==='min'?T.obj[j].neg():T.obj[j];
      const mark=v>1e-9?' ✓':'';
      colOpts+=`<option value="${j}">${T.vn[j]} (c<sub>j</sub>=${cjDisp.plain()}${mark})</option>`;
    }
  }
  let rowOpts='<option value="">-- Chọn biến ra --</option>';
  for(let i=0;i<T.m;i++){ rowOpts+=`<option value="${i}">${T.vn[T.basis[i]]} (b=${T.rhs[i].plain()})</option>`; }
  const hint=dualFeas&&hasNegRhs?'Đang áp dụng <strong>đơn hình đối ngẫu</strong>: chọn hàng có b &lt; 0 làm biến ra, sau đó chọn cột vào.':
    `Đơn hình thường: chọn cột có c<sub>j</sub> dương làm biến vào, kiểm tra tỉ số θ chọn biến ra.`;
  return`<div class="manual-ctrl" id="mc">
    <div class="mc-title">Bước ${step+1} — Chọn phép xoay</div>
    <div class="mc-hint">${hint}</div>
    <div class="mc-row">
      <div class="mc-field"><label>Biến vào (cột)</label><select id="mc-col" onchange="updateRatios()">${colOpts}</select></div>
      <div class="mc-field"><label>Biến ra (hàng)</label><select id="mc-row">${rowOpts}</select></div>
      <button class="mc-btn" onclick="manualPivot()">Thực hiện xoay →</button>
    </div>
    <div id="ratio-preview" class="ratio-preview"></div>
    <div class="mc-auto-row">
      <button class="mc-btn mc-auto" onclick="manualAutoStep()">Tự động bước này</button>
      <button class="mc-btn mc-fin" onclick="manualAutoAll()">Tự động tất cả</button>
    </div>
  </div>`;
}

function updateRatios(){
  if(!manualState)return;
  const T=manualState.T;
  const sel=document.getElementById('mc-col');
  if(!sel)return;
  const ec=parseInt(sel.value);
  if(isNaN(ec))return;
  let rows=[];
  for(let i=0;i<T.m;i++){
    const a=T.tab[i][ec];
    if(a.gt(ZERO)){
      const r=T.rhs[i].div(a);
      rows.push({i,bv:T.vn[T.basis[i]],b:T.rhs[i].plain(),a:a.plain(),r:r.plain()});
    }
  }
  const prev=document.getElementById('ratio-preview');
  if(!prev)return;
  if(!rows.length){prev.innerHTML=`<span style="color:var(--red)">Không có hàng nào có a<sub>ij</sub> > 0 → hàm mục tiêu không bị chặn!</span>`;return}
  let minR=null,minI=-1;
  rows.forEach(r=>{if(minR===null||parseFloat(r.r.replace(/[^0-9.\-]/g,''))<parseFloat(minR.replace(/[^0-9.\-]/g,''))){minR=r.r;minI=r.i}});
  let h=`<div class="ratio-lbl">Tỉ số θ = b / a<sub>i,col</sub>:</div>
  <table class="rtbl"><thead><tr><th>Hàng</th><th>Cơ sở</th><th>b</th><th>a<sub>ij</sub></th><th>θ</th><th></th></tr></thead><tbody>`;
  rows.forEach(r=>{
    const isMin=r.i===minI;
    h+=`<tr class="${isMin?'r-min':''}"><td>${r.i+1}</td><td>${r.bv}</td><td>${r.b}</td><td>${r.a}</td><td><strong>${r.r}</strong></td><td>${isMin?'<span class="r-pick">← Min</span>':''}</td></tr>`;
  });
  h+=`</tbody></table>`;
  prev.innerHTML=h;
  const rowSel=document.getElementById('mc-row');
  if(rowSel&&minI!==-1)rowSel.value=String(minI);
}

function manualPivot(){
  if(!manualState)return;
  const ec=parseInt(document.getElementById('mc-col')?.value);
  const lr=parseInt(document.getElementById('mc-row')?.value);
  if(isNaN(ec)||isNaN(lr)){alert('Vui lòng chọn cả biến vào và biến ra!');return}
  const a=manualState.T.tab[lr][ec];
  if(a.isZero()||a.val()===0){alert('Phần tử chốt = 0, không thể xoay!');return}
  _applyManualPivot(ec,lr,'primal');
}

function manualAutoStep(){
  if(!manualState)return;
  const T=manualState.T;
  const dualFeas=T.obj.every(v=>v.lte(q(1e-9)));
  const hasNegRhs=T.rhs.some(v=>v.lt(q(-1e-9)));
  let ec,lr,mode;
  if(dualFeas&&hasNegRhs){
    const dp=findDual(T);if(!dp){alert('Bài toán vô nghiệm!');return}
    ec=dp.ec;lr=dp.lr;mode='dual';
  }else{
    ec=findEnter(T);if(ec===-1){manualFinish();return}
    lr=findLeave(T,ec);if(lr===-1){alert('Bài toán không bị chặn!');return}
    mode='primal';
  }
  _applyManualPivot(ec,lr,mode);
}

function _applyManualPivot(ec,lr,mode){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const snap=cloneT(T);
  manualState.step++;
  const stepNum=manualState.step;
  doPivot(T,lr,ec);
  const solDiv=document.getElementById('sol');
  const mc=document.getElementById('mc');if(mc)mc.remove();
  let html=renderStep(snap,ec,lr,stepNum,`${mode==='dual'?'Đơn hình đối ngẫu':'Đơn hình thường'} — Bước ${stepNum}`,mode,inp.ot);
  manualState.step++;
  html+=renderStep(cloneT(T),-1,-1,manualState.step,`Bảng sau phép xoay — Bước ${manualState.step}`,'after',inp.ot);
  const dualFeas2=T.obj.every(v=>v.lte(q(1e-9)));
  const hasNeg2=T.rhs.some(v=>v.lt(q(-1e-9)));
  const nextEnter=findEnter(T);
  const isOpt=nextEnter===-1&&!hasNeg2;
  if(isOpt){
    const stuck=T.basis.some((bv,i)=>T.artSet.has(bv)&&Math.abs(T.rhs[i].val())>1e-8);
    if(!stuck){
      html+=renderStep(cloneT(T),-1,-1,manualState.step+1,'Bảng đơn hình tối ưu cuối cùng','optimal',inp.ot);
      html+=buildResultPanel(T,inp.n,inp.ot,false);
      if(inp.sint){
        html+=`<div class="gom-div"><div class="gom-div-line"></div><div class="gom-div-pill">&#10022; Cắt Gomory — Nghiệm Nguyên</div><div class="gom-div-line"></div></div>`;
        html+=buildGomoryControls(T,inp.n,0);
        solDiv.insertAdjacentHTML('beforeend',html);
        manualState.phase='gomory';
        manualState.gomIter=0;
        setStatus('run','Gomory thủ công — chọn hàng cắt');
      } else {
        solDiv.insertAdjacentHTML('beforeend',html);
        manualState=null;
        setStatus('ok','Hoàn tất ✓');
      }
      return;
    }
  }
  html+=buildManualControls(T,inp.ot,manualState.step);
  solDiv.insertAdjacentHTML('beforeend',html);
  solDiv.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
}

function manualAutoAll(){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const solDiv=document.getElementById('sol');
  const mc=document.getElementById('mc');if(mc)mc.remove();
  let html='',status='';
  for(let it=0;it<200;it++){
    const dualFeas=T.obj.every(v=>v.lte(q(1e-9)));
    const hasNegRhs=T.rhs.findIndex(v=>v.lt(q(-1e-9)));
    if(dualFeas&&hasNegRhs>=0){
      const dp=findDual(T);if(!dp){status='infeasible';break}
      const snap=cloneT(T);
      html+=renderStep(snap,dp.ec,dp.lr,manualState.step++,`Đơn hình đối ngẫu — Bước ${manualState.step-1}`,'dual',inp.ot);
      doPivot(T,dp.lr,dp.ec);
      html+=renderStep(cloneT(T),-1,-1,manualState.step++,`Sau phép xoay — Bước ${manualState.step-1}`,'after',inp.ot);
      continue;
    }
    const ec=findEnter(T);if(ec===-1){status='optimal';break}
    const lr=findLeave(T,ec);if(lr===-1){status='unbounded';break}
    const snap=cloneT(T);
    html+=renderStep(snap,ec,lr,manualState.step++,`Đơn hình thường — Bước ${manualState.step-1}`,'primal',inp.ot);
    doPivot(T,lr,ec);
    html+=renderStep(cloneT(T),-1,-1,manualState.step++,`Sau phép xoay — Bước ${manualState.step-1}`,'after',inp.ot);
  }
  if(status==='optimal'){
    html+=renderStep(cloneT(T),-1,-1,manualState.step,'Bảng đơn hình tối ưu cuối cùng','optimal',inp.ot);
    html+=buildResultPanel(T,inp.n,inp.ot,false);
    if(inp.sint){
      html+=`<div class="gom-div"><div class="gom-div-line"></div><div class="gom-div-pill">&#10022; Cắt Gomory — Nghiệm Nguyên</div><div class="gom-div-line"></div></div>`;
      html+=buildGomoryControls(T,inp.n,0);
      solDiv.insertAdjacentHTML('beforeend',html);
      manualState.phase='gomory';
      manualState.gomIter=0;
      setStatus('run','Gomory thủ công — chọn hàng cắt');
      return;
    }
  }else if(status==='unbounded'){html+=mkAlert('warn','Bài toán không bị chặn.')}
  else if(status==='infeasible'){html+=mkAlert('warn','Bài toán vô nghiệm.')}
  solDiv.insertAdjacentHTML('beforeend',html);
  manualState=null;
  setStatus('ok','Hoàn tất (tự động)');
}

function manualFinish(){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const mc=document.getElementById('mc');if(mc)mc.remove();
  const sol=document.getElementById('sol');

  if(manualState.phase==='lp'){
    let html=renderStep(cloneT(T),-1,-1,manualState.step+1,'Bảng đơn hình tối ưu cuối cùng','optimal',inp.ot);
    html+=buildResultPanel(T,inp.n,inp.ot,false);
    if(inp.sint){
      html+=`<div class="gom-div"><div class="gom-div-line"></div><div class="gom-div-pill">&#10022; Cắt Gomory — Nghiệm Nguyên</div><div class="gom-div-line"></div></div>`;
      html+=buildGomoryControls(T,inp.n,0);
      sol.insertAdjacentHTML('beforeend',html);
      manualState.phase='gomory';
      manualState.gomIter=0;
      setStatus('run','Gomory thủ công — chọn hàng cắt');
    } else {
      sol.insertAdjacentHTML('beforeend',html);
      manualState=null;
      setStatus('ok','Hoàn tất ✓');
    }
  } else {
    const EPS=q(1,1000000);
    let allInt=true;
    for(let i=0;i<T.m;i++){
      if(T.basis[i]<manualState.origN){
        const fp=T.rhs[i].fracPart();
        if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))){allInt=false;break}
      }
    }
    if(allInt){
      let html=renderStep(cloneT(T),-1,-1,manualState.step+1,'Tất cả biến gốc là nguyên — Nghiệm nguyên tối ưu','optimal',inp.ot);
      html+=buildResultPanel(T,manualState.origN,inp.ot,true);
      html+=mkAlert('ok',`Tìm được nghiệm nguyên tối ưu sau ${manualState.gomIter} lần cắt Gomory.`);
      sol.insertAdjacentHTML('beforeend',html);
      manualState=null;
      setStatus('ok','Hoàn tất ✓');
    } else {
      let html=buildGomoryControls(T,manualState.origN,manualState.gomIter);
      sol.insertAdjacentHTML('beforeend',html);
      setStatus('run','Gomory thủ công — chọn hàng cắt');
    }
  }
}

/* ═══════════════════════════════════════════════════
   MANUAL GOMORY CONTROLS
   ═══════════════════════════════════════════════════ */
function buildGomoryControls(T,origN,iterNum){
  const EPS=q(1,1000000);
  let rowOpts='<option value="">-- Chọn hàng để cắt --</option>';
  let hasFrac=false;
  for(let i=0;i<T.m;i++){
    if(T.basis[i]<origN){
      const fp=T.rhs[i].fracPart();
      if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))){
        hasFrac=true;
        rowOpts+=`<option value="${i}">${T.vn[T.basis[i]]} = ${T.rhs[i].plain()} &nbsp;(phần lẻ f₀ = ${fp.plain()})</option>`;
      }
    }
  }
  if(!hasFrac){
    setTimeout(()=>manualFinish(),50);
    return'';
  }
  return`<div class="manual-ctrl" id="mc" style="border-color:#9333ea;background:linear-gradient(135deg,#faf5ff,white)">
    <div class="mc-title" style="color:#9333ea">Gomory Cắt #${iterNum+1} — Chọn hàng</div>
    <div class="mc-hint" style="background:#f3e8ff;border-color:#9333ea;color:#4c1d95">
      Chọn hàng biến cơ sở có giá trị <strong>không nguyên</strong> để tạo điều kiện cắt Gomory.
      Thông thường chọn hàng có phần lẻ <strong>lớn nhất</strong>.
    </div>
    <div class="mc-row">
      <div class="mc-field"><label>Hàng biến cơ sở (biến có phần lẻ)</label><select id="mc-gom-row" onchange="previewGomoryCut(${origN})">${rowOpts}</select></div>
      <button class="mc-btn" style="background:#9333ea" onclick="applyGomoryCut(${origN},${iterNum+1})">Tạo điều kiện cắt →</button>
    </div>
    <div id="gom-preview"></div>
    <div class="mc-auto-row">
      <button class="mc-btn mc-auto" onclick="gomoryAutoStep(${origN},${iterNum+1})">Tự động bước này</button>
      <button class="mc-btn mc-fin" onclick="gomoryAutoAll(${origN},${iterNum+1})">Tự động tất cả Gomory</button>
    </div>
  </div>`;
}

function previewGomoryCut(origN){
  const sel=document.getElementById('mc-gom-row');
  if(!sel||!manualState)return;
  const fr=parseInt(sel.value);
  if(isNaN(fr))return;
  const T=manualState.T;
  const EPS=q(1,1000000);
  const f0=T.rhs[fr].fracPart();
  let terms=[];
  for(let j=0;j<T.NV;j++){
    if(!T.basis.includes(j)){
      const fp=T.tab[fr][j].fracPart().neg();
      if(fp.neg().gt(EPS)) terms.push(`${fp.neg().plain()}·${T.vn[j]}`);
    }
  }
  const prev=document.getElementById('gom-preview');
  if(prev) prev.innerHTML=`<div class="info-box" style="background:#faf5ff;border-color:#e9d5ff;margin-top:10px;font-size:13px">
    <strong>${T.vn[T.basis[fr]]}</strong> = ${T.rhs[fr].plain()} → phần lẻ <strong>f₀ = ${f0.plain()}</strong><br>
    Điều kiện cắt: <code>${terms.join(' + ')||'0'}</code> ≥ <strong>${f0.plain()}</strong>
  </div>`;
}

function applyGomoryCut(origN, iterNum){
  if(!manualState)return;
  const sel=document.getElementById('mc-gom-row');
  const fr=parseInt(sel?.value);
  if(isNaN(fr)){alert('Vui lòng chọn hàng để cắt!');return}
  _doGomoryCut(fr,origN,iterNum);
}

function _doGomoryCut(fr,origN,iterNum){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const EPS=q(1,1000000);
  const bvName=T.vn[T.basis[fr]];
  const f0=T.rhs[fr].fracPart();
  manualState.gomIter=iterNum;

  const nvi=T.NV, nvn=`g${iterNum}`;
  T.vn.push(nvn); T.NV++;
  T.tab.forEach(r=>r.push(ZERO.clone()));
  T.obj.push(ZERO.clone()); T.origC.push(ZERO.clone());
  const cr=Array.from({length:T.NV},()=>ZERO.clone());
  for(let j=0;j<T.NV-1;j++) cr[j]=T.tab[fr][j].fracPart().neg();
  cr[nvi]=ONE.clone();
  T.tab.push(cr); T.rhs.push(f0.neg()); T.basis.push(nvi); T.m++;

  let desc=[];
  for(let j=0;j<T.NV-1;j++){
    if(!T.basis.includes(j)){const fp=cr[j].neg();if(fp.gt(EPS))desc.push(`${fp.str()}&#183;${T.vn[j]}`)}
  }

  const sol=document.getElementById('sol');
  const mc=document.getElementById('mc'); if(mc) mc.remove();

  let html=`<div class="step-card t-gomory"><div class="step-inner">
    <div class="step-head">
      <div class="step-badge">G${iterNum}</div>
      <div class="step-titles">
        <div class="step-title">Điều kiện cắt Gomory #${iterNum}</div>
        <div class="step-sub">Từ hàng <strong>${bvName}</strong> — phần lẻ f₀ = ${f0.str()}</div>
      </div>
      <div style="margin-left: auto; font-family: var(--sans); font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Gomory</div>
    </div>
    <div class="step-body">
      <div class="gom-box">
        Biến cơ sở <strong>${bvName}</strong> có giá trị không nguyên → phần lẻ <strong>f₀ = ${f0.str()}</strong><br>
        Điều kiện cắt: <code>${desc.join(' + ')||'0'}</code> ≥ <strong>${f0.str()}</strong><br>
        Thêm biến bù <strong><code>${nvn}</code></strong>, hàng mới RHS = <strong>−${f0.str()}</strong>
      </div>
      <div class="tbl-scroll">${buildTable(cloneT(T),-1,T.m-1,inp.ot)}</div>
    </div>
  </div></div>`;

  html+=buildManualDualControls(T,inp.ot,manualState.step,iterNum,origN);
  sol.insertAdjacentHTML('beforeend',html);
  sol.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
  setStatus('run',`Gomory #${iterNum} — Đối ngẫu thủ công`);
}

function buildManualDualControls(T,ot,step,iterNum,origN){
  const dualFeas=T.obj.every(v=>v.lte(q(1e-9)));
  const hasNeg=T.rhs.findIndex(v=>v.lt(q(-1e-9)));
  if(!dualFeas||hasNeg<0){
    setTimeout(()=>afterDualGomory(origN,iterNum),50);
    return'';
  }
  let rowOpts='<option value="">-- Chọn biến ra (b < 0) --</option>';
  for(let i=0;i<T.m;i++){
    if(T.rhs[i].lt(q(-1e-9))) rowOpts+=`<option value="${i}">${T.vn[T.basis[i]]} (b = ${T.rhs[i].plain()})</option>`;
  }
  let colOpts='<option value="">-- Chọn biến vào --</option>';
  for(let j=0;j<T.NV;j++){
    if(!T.basis.includes(j)) colOpts+=`<option value="${j}">${T.vn[j]}</option>`;
  }
  return`<div class="manual-ctrl" id="mc" style="border-color:#ea580c;background:linear-gradient(135deg,#fff7ed,white)">
    <div class="mc-title" style="color:#ea580c">Đơn hình đối ngẫu (sau Gomory #${iterNum})</div>
    <div class="mc-hint" style="background:#ffedd5;border-color:#ea580c;color:#9a3412">
      Sau khi thêm điều kiện cắt, RHS âm → dùng <strong>đơn hình đối ngẫu</strong> để phục hồi tính khả thi.<br>
      Chọn hàng có <strong>b &lt; 0</strong> làm biến ra, sau đó chọn cột vào theo tỉ số đối ngẫu.
    </div>
    <div class="mc-row">
      <div class="mc-field"><label>Biến ra (hàng có b &lt; 0)</label><select id="mc-dual-row" onchange="updateDualRatios(${iterNum},${origN})">${rowOpts}</select></div>
      <div class="mc-field"><label>Biến vào (cột)</label><select id="mc-dual-col">${colOpts}</select></div>
      <button class="mc-btn" style="background:#ea580c" onclick="applyDualPivotGomory(${iterNum},${origN})">Xoay đối ngẫu →</button>
    </div>
    <div id="dual-ratio-preview"></div>
    <div class="mc-auto-row">
      <button class="mc-btn mc-auto" onclick="dualAutoStepGomory(${iterNum},${origN})">Tự động bước này</button>
    </div>
  </div>`;
}

function updateDualRatios(iterNum, origN){
  if(!manualState)return;
  const T=manualState.T;
  const lr=parseInt(document.getElementById('mc-dual-row')?.value);
  if(isNaN(lr))return;
  const rows=[];
  for(let j=0;j<T.NV;j++){
    if(!T.basis.includes(j)){
      const a=T.tab[lr][j];
      if(a.lt(ZERO)){
        const r=T.obj[j].div(a);
        rows.push({j,vn:T.vn[j],cj:T.obj[j].plain(),aij:a.plain(),r:r.plain()});
      }
    }
  }
  const prev=document.getElementById('dual-ratio-preview');
  if(!prev)return;
  if(!rows.length){prev.innerHTML=`<span style="color:var(--red)">Không có a<sub>ij</sub> &lt; 0 → bài toán vô nghiệm!</span>`;return}
  let minR=null,minJ=-1;
  rows.forEach(r=>{if(minR===null||parseFloat(r.r.replace(/[^0-9.\-]/g,''))<parseFloat(minR.replace(/[^0-9.\-]/g,''))){minR=r.r;minJ=r.j}});
  let h=`<div class="ratio-lbl" style="margin-top:8px">Tỉ số đối ngẫu c<sub>j</sub> / |a<sub>ij</sub>| — chọn min:</div>
  <table class="rtbl"><thead><tr><th>Biến</th><th>c<sub>j</sub></th><th>a<sub>ij</sub></th><th>Tỉ số</th><th></th></tr></thead><tbody>`;
  rows.forEach(r=>{
    const isMin=r.j===minJ;
    h+=`<tr class="${isMin?'r-min':''}"><td>${r.vn}</td><td>${r.cj}</td><td>${r.aij}</td><td><strong>${r.r}</strong></td><td>${isMin?'<span class="r-pick">← Min</span>':''}</td></tr>`;
  });
  h+=`</tbody></table>`;
  prev.innerHTML=h;
  const colSel=document.getElementById('mc-dual-col');
  if(colSel) colSel.value=String(minJ);
}

function applyDualPivotGomory(iterNum,origN){
  if(!manualState)return;
  const lr=parseInt(document.getElementById('mc-dual-row')?.value);
  const ec=parseInt(document.getElementById('mc-dual-col')?.value);
  if(isNaN(lr)||isNaN(ec)){alert('Vui lòng chọn cả biến ra và biến vào!');return}
  _execDualStepGomory(lr,ec,iterNum,origN);
}

function dualAutoStepGomory(iterNum,origN){
  if(!manualState)return;
  const dp=findDual(manualState.T);
  if(!dp){afterDualGomory(origN,iterNum);return}
  _execDualStepGomory(dp.lr,dp.ec,iterNum,origN);
}

function _execDualStepGomory(lr,ec,iterNum,origN){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const snap=cloneT(T);
  const sol=document.getElementById('sol');
  const mc=document.getElementById('mc');if(mc)mc.remove();
  manualState.step++;
  doPivot(T,lr,ec);
  let html=renderStep(snap,ec,lr,manualState.step,`Đối ngẫu (G${iterNum}) — Bước ${manualState.step}`,'dual',inp.ot);
  manualState.step++;
  html+=renderStep(cloneT(T),-1,-1,manualState.step,`Sau phép xoay (G${iterNum}) — Bước ${manualState.step}`,'after',inp.ot);
  const stillNeg=T.rhs.some(v=>v.lt(q(-1e-9)));
  if(stillNeg){
    html+=buildManualDualControls(T,inp.ot,manualState.step,iterNum,origN);
  } else {
    html+=`<div class="info-box" style="background:#f0fdf4;border-color:#bbf7d0;margin-top:4px;font-size:13px">
      ✓ Bảng đã khả thi trở lại sau Gomory #${iterNum}. Kiểm tra nghiệm nguyên...
    </div>`;
    const EPS=q(1,1000000);
    let allInt=true;
    for(let i=0;i<T.m;i++){
      if(T.basis[i]<origN){const fp=T.rhs[i].fracPart();if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))){allInt=false;break}}
    }
    if(allInt){
      html+=renderStep(cloneT(T),-1,-1,manualState.step+1,'Tất cả biến gốc là nguyên — Nghiệm nguyên tối ưu','optimal',inp.ot);
      html+=buildResultPanel(T,origN,inp.ot,true);
      html+=mkAlert('ok',`Tìm được nghiệm nguyên tối ưu sau ${iterNum} lần cắt Gomory.`);
      sol.insertAdjacentHTML('beforeend',html);
      manualState=null;
      setStatus('ok','Hoàn tất ✓');
      return;
    }
    html+=buildGomoryControls(T,origN,iterNum);
    manualState.gomIter=iterNum;
  }
  sol.insertAdjacentHTML('beforeend',html);
  sol.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
}

function afterDualGomory(origN,iterNum){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const EPS=q(1,1000000);
  const sol=document.getElementById('sol');
  const mc=document.getElementById('mc');if(mc)mc.remove();
  let allInt=true;
  for(let i=0;i<T.m;i++){
    if(T.basis[i]<origN){const fp=T.rhs[i].fracPart();if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))){allInt=false;break}}
  }
  if(allInt){
    let html=renderStep(cloneT(T),-1,-1,manualState.step+1,'Tất cả biến gốc là nguyên','optimal',inp.ot);
    html+=buildResultPanel(T,origN,inp.ot,true);
    html+=mkAlert('ok',`Tìm được nghiệm nguyên tối ưu sau ${iterNum} lần cắt Gomory.`);
    sol.insertAdjacentHTML('beforeend',html);
    manualState=null;
    setStatus('ok','Hoàn tất ✓');
  } else {
    sol.insertAdjacentHTML('beforeend',buildGomoryControls(T,origN,iterNum));
  }
}

function gomoryAutoStep(origN,iterNum){
  if(!manualState)return;
  const T=manualState.T;
  const EPS=q(1,1000000);
  let fr=-1,mf=EPS.clone();
  for(let i=0;i<T.m;i++){
    if(T.basis[i]<origN){const fp=T.rhs[i].fracPart();if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))&&fp.gt(mf)){mf=fp.clone();fr=i}}
  }
  if(fr===-1){manualFinish();return}
  _doGomoryCut(fr,origN,iterNum);
  setTimeout(()=>{
    let di=0;
    while(di++<50){
      const dp=findDual(manualState?.T);if(!dp||!manualState)break;
      const mc=document.getElementById('mc');if(mc)mc.remove();
      const snap=cloneT(manualState.T);
      manualState.step++;
      const inp=manualState.inp;
      doPivot(manualState.T,dp.lr,dp.ec);
      let h=renderStep(snap,dp.ec,dp.lr,manualState.step,`Đối ngẫu (G${iterNum}) — Bước ${manualState.step}`,'dual',inp.ot);
      manualState.step++;
      h+=renderStep(cloneT(manualState.T),-1,-1,manualState.step,`Sau phép xoay (G${iterNum}) — Bước ${manualState.step}`,'after',inp.ot);
      document.getElementById('sol').insertAdjacentHTML('beforeend',h);
    }
    if(manualState){
      const mc2=document.getElementById('mc');if(mc2)mc2.remove();
      document.getElementById('sol').insertAdjacentHTML('beforeend',buildGomoryControls(manualState.T,origN,iterNum));
    }
  },100);
}

function gomoryAutoAll(origN,iterNum){
  if(!manualState)return;
  const T=manualState.T;
  const inp=manualState.inp;
  const mc=document.getElementById('mc');if(mc)mc.remove();
  let html=runGomory(T,inp,inp.ot,origN,manualState.step);
  document.getElementById('sol').insertAdjacentHTML('beforeend',html);
  manualState=null;
  setStatus('ok','Hoàn tất ✓');
}

/* ═══════════════════════════════════════════════════
   AUTO SOLVER ALGORITHMS (Sinh HTML tự động)
   ═══════════════════════════════════════════════════ */
function runSolver(inp){
  const{sfrac,sint,ot,n}=inp;
  let html='';
  const sf=buildSF(inp);
  let T=makeTab(sf);
  let step=0,status='';
  html+=buildProbHeader(inp,sf);
  html+=renderStep(cloneT(T),-1,-1,step++,'Bảng đơn hình khởi đầu','init',ot);
  for(let it=0;it<200;it++){
    const dualFeas=T.obj.every(v=>v.lte(q(1e-9)));
    const hasNegRhs=T.rhs.findIndex(v=>v.lt(q(-1e-9)));
    if(dualFeas&&hasNegRhs>=0){
      const dp=findDual(T);
      if(!dp){status='infeasible';break}
      const snap=cloneT(T);
      html+=renderStep(snap,dp.ec,dp.lr,step++,`Đơn hình đối ngẫu — Bước ${step-1}`,'dual',ot);
      doPivot(T,dp.lr,dp.ec);
      html+=renderStep(cloneT(T),-1,-1,step++,`Sau phép xoay (đối ngẫu) — Bước ${step-1}`,'after',ot);
      continue;
    }
    const ec=findEnter(T);
    if(ec===-1){status='optimal';break}
    const lr=findLeave(T,ec);
    if(lr===-1){status='unbounded';break}
    const snap=cloneT(T);
    html+=renderStep(snap,ec,lr,step++,`Đơn hình thường — Bước ${step-1}`,'primal',ot);
    doPivot(T,lr,ec);
    html+=renderStep(cloneT(T),-1,-1,step++,`Bảng sau phép xoay — Bước ${step-1}`,'after',ot);
  }
  if(status==='optimal'){
    const stuck=T.basis.some((bv,i)=>T.artSet.has(bv)&&Math.abs(T.rhs[i].val())>1e-8);
    if(stuck)return html+mkAlert('warn','Bài toán vô nghiệm: biến nhân tạo còn dương trong cơ sở.');
    html+=renderStep(cloneT(T),-1,-1,step,'Bảng đơn hình tối ưu cuối cùng','optimal',ot);
    html+=buildResultPanel(T,n,ot,false);
    if(sint){
      html+=`<div class="gom-div"><div class="gom-div-line"></div><div class="gom-div-pill">&#10022; Cắt Gomory — Nghiệm Nguyên</div><div class="gom-div-line"></div></div>`;
      html+=runGomory(T,inp,ot,n,step);
    }
  }else if(status==='unbounded'){html+=mkAlert('warn','Bài toán không bị chặn (Unbounded).')}
  else if(status==='infeasible'){html+=mkAlert('warn','Bài toán vô nghiệm.')}
  else{html+=mkAlert('warn','Vượt giới hạn lặp (200).')}
  return html;
}

function runGomory(T,inp,ot,origN,startStep){
  let html='',step=startStep+1;
  const EPS=q(1,1000000),MAX_G=30;
  for(let iter=1;iter<=MAX_G;iter++){
    let fr=-1,mf=EPS.clone();
    for(let i=0;i<T.m;i++){
      if(T.basis[i]<origN){
        const fp=T.rhs[i].fracPart();
        if(fp.gt(EPS)&&fp.lt(new Q(999999,1000000))&&fp.gt(mf)){mf=fp.clone();fr=i}
      }
    }
    if(fr===-1){
      html+=renderStep(cloneT(T),-1,-1,step++,'Tất cả biến gốc là nguyên — Nghiệm nguyên tối ưu','optimal',ot);
      html+=buildResultPanel(T,origN,ot,true);
      html+=mkAlert('ok',`Tìm được nghiệm nguyên tối ưu sau ${iter-1} lần cắt Gomory.`);
      return html;
    }
    const bvName=T.vn[T.basis[fr]];
    const f0=T.rhs[fr].fracPart();
    const nvi=T.NV,nvn=`g${iter}`;
    T.vn.push(nvn);T.NV++;
    T.tab.forEach(r=>r.push(ZERO.clone()));T.obj.push(ZERO.clone());T.origC.push(ZERO.clone());
    const cr=Array.from({length:T.NV},()=>ZERO.clone());
    for(let j=0;j<T.NV-1;j++)cr[j]=T.tab[fr][j].fracPart().neg();
    cr[nvi]=ONE.clone();
    T.tab.push(cr);T.rhs.push(f0.neg());T.basis.push(nvi);T.m++;
    let desc=[];
    for(let j=0;j<T.NV-1;j++){if(!T.basis.includes(j)){const fp=cr[j].neg();if(fp.gt(EPS))desc.push(`${fp.str()}&#183;${T.vn[j]}`)}}
    html+=`<div class="step-card t-gomory"><div class="step-inner">
      <div class="step-head">
        <div class="step-badge">G${iter}</div>
        <div class="step-titles"><div class="step-title">Thêm điều kiện cắt Gomory #${iter}</div>
        <div class="step-sub">Từ hàng <strong>${bvName}</strong> — phần lẻ f₀ = ${f0.str()}</div></div>
        <div style="margin-left: auto; font-family: var(--sans); font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Gomory</div>
      </div>
      <div class="step-body">
        <div class="gom-box">
          Biến cơ sở <strong>${bvName}</strong> có giá trị không nguyên → phần lẻ <strong>f₀ = ${f0.str()}</strong><br>
          Điều kiện cắt: <code>${desc.join(' + ')||'0'}</code> ≥ <strong>${f0.str()}</strong><br>
          Thêm biến bù <strong><code>${nvn}</code></strong>, hàng mới RHS = <strong>−${f0.str()}</strong>
        </div>
        <div class="tbl-scroll">${buildTable(cloneT(T),-1,T.m-1,ot)}</div>
      </div></div></div>`;
    let di=0;
    while(di++<50){
      const dp=findDual(T);if(!dp)break;
      const snap=cloneT(T);
      html+=renderStep(snap,dp.ec,dp.lr,step++,`Đối ngẫu (sau G${iter}) — Bước ${step-1}`,'dual',ot);
      doPivot(T,dp.lr,dp.ec);
      html+=renderStep(cloneT(T),-1,-1,step++,`Sau phép xoay (G${iter}) — Bước ${step-1}`,'after',ot);
    }
  }
  html+=mkAlert('warn',`Đạt giới hạn lặp Gomory (${MAX_G}).`);
  return html;
}

/* ═══════════════════════════════════════════════════
   RENDER UI COMPONENTS (Giao diện Sư phạm)
   ═══════════════════════════════════════════════════ */
function renderStep(snap, ec, lr, idx, title, type, ot) {
  const bMap = { init: '★', optimal: '✓', after: '→' };
  const badge = bMap[type] || String(idx);
  const pMap = { init: 'Khởi đầu', primal: 'Đơn Hình', dual: 'Đối Ngẫu', optimal: 'Tối Ưu', after: 'Kết Quả', gomory: 'Gomory' };

  let info = '';
  if (type === 'init') {
    const bNames = snap.basis.map(b => snap.vn[b]).join(', ');
    info = `<div class="info-box">
      Bước đầu tiên, ta thiết lập ma trận hệ số. Các biến cơ sở ban đầu là <strong>{ ${bNames} }</strong>.<br>
      Thuật toán sẽ kiểm tra hàng <strong>c<sub>j</sub></strong>. Quy tắc chọn cột là tìm biến có giá trị c<sub>j</sub> dương lớn nhất để đưa vào cơ sở (giúp tăng Z nhanh nhất).
    </div>`;
  } else if (type === 'optimal') {
    info = `<div class="info-box ib-opt">
      Tuyệt vời! Hãy nhìn vào hàng <strong>c<sub>j</sub></strong>. Tất cả các hệ số đều <strong>≤ 0</strong>. Điều này có nghĩa là ta không thể tăng giá trị hàm mục tiêu Z thêm được nữa.<br>
      → <strong>Thuật toán kết thúc. Bảng này đã đạt tối ưu!</strong>
    </div>`;
  } else if (type === 'after') {
    const bNames = snap.basis.map(b => snap.vn[b]).join(', ');
    let zv = snap.zv.clone(); if (ot === 'min') zv = zv.neg();
    info = `<div class="info-box">
      Sau phép biến đổi Gauss, hệ cơ sở mới của chúng ta là: <strong>{ ${bNames} }</strong>.<br>
      Giá trị hàm mục tiêu hiện tại đã đạt: <strong>Z = ${zv.plain()}</strong>. Tiếp tục kiểm tra bảng này đã tối ưu chưa.
    </div>`;
  } else if ((type === 'primal' || type === 'dual') && ec >= 0 && lr >= 0) {
    const pivVal = snap.tab[lr][ec].str();
    let enterReason = '';
    
    if (type === 'primal') {
      const _cjDisp = j => ot === 'min' ? snap.obj[j].neg() : snap.obj[j];
      enterReason = `
        <strong>1. Chọn biến vào (Cột):</strong> Trong hàng c<sub>j</sub>, biến <strong>${snap.vn[ec]}</strong> có hệ số dương lớn nhất (c<sub>j</sub> = ${_cjDisp(ec).plain()} > 0) nên được chọn làm biến vào.<br>
        <strong>2. Chọn biến ra (Hàng):</strong> Ta xét tỉ số θ = b / a<sub>ij</sub> với các a<sub>ij</sub> > 0. Hàng có tỉ số nhỏ nhất sẽ bị loại khỏi cơ sở để đảm bảo các biến không bị âm. Ở đây hàng <strong>${snap.vn[snap.basis[lr]]}</strong> có θ nhỏ nhất.`;
    } else {
      enterReason = `
        <strong>1. Chọn biến ra (Hàng):</strong> Bài toán đang mất tính khả thi vì vế phải có giá trị âm. Ta chọn hàng <strong>${snap.vn[snap.basis[lr]]}</strong> (có b = ${snap.rhs[lr].str()} < 0) làm biến ra.<br>
        <strong>2. Chọn biến vào (Cột):</strong> Tính tỉ số đối ngẫu |c<sub>j</sub> / a<sub>ij</sub>| với các a<sub>ij</sub> < 0 trên hàng biến ra. Biến <strong>${snap.vn[ec]}</strong> có tỉ số nhỏ nhất nên được chọn làm biến vào.`;
    }
    
    info = `<div class="info-box">${enterReason}</div>
    <div class="pchips">
      <div class="pchip c-enter"><span class="pchip-dot"></span><span class="pchip-lbl">Vào cơ sở</span><span class="pchip-val">${snap.vn[ec]}</span></div>
      <div class="pchip c-leave"><span class="pchip-dot"></span><span class="pchip-lbl">Ra cơ sở</span><span class="pchip-val">${snap.vn[snap.basis[lr]]}</span></div>
      <div class="pchip c-pivot"><span class="pchip-dot"></span><span class="pchip-lbl">Phần tử chốt</span><span class="pchip-val">${pivVal}</span></div>
    </div>`;
  }

  const subMap = { init: 'Thiết lập bảng Đơn hình ban đầu', optimal: 'Điều kiện tối ưu đã thỏa mãn', after: 'Cập nhật lại ma trận' };
  const sub = subMap[type] || (ec >= 0 && lr >= 0 ? `Biến ${snap.vn[ec]} thế chỗ biến ${snap.vn[snap.basis[lr]]}` : '');

  return `<div class="step-card t-${type}"><div class="step-inner">
    <div class="step-head">
      <div class="step-badge">${badge}</div>
      <div class="step-titles">
        <div class="step-title">${title}</div>
        ${sub ? `<div class="step-sub">${sub}</div>` : ''}
      </div>
      <div style="margin-left: auto; font-family: var(--sans); font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
        ${pMap[type] || type}
      </div>
    </div>
    <div class="step-body">
      ${info}
      <div class="tbl-scroll">${buildTable(snap, ec, lr, ot)}</div>
    </div>
  </div></div>`;
}

function buildTable(snap,ec,lr,ot){
  const{tab,rhs,obj,origC,zv,basis,vn,m,NV}=snap;
  let h=`<table class="stab"><thead><tr><th>Cơ sở</th>`;
  for(let j=0;j<NV;j++)h+=`<th${j===ec?' class="h-enter"':''}>${vn[j]}</th>`;
  h+=`<th>b (RHS)</th></tr></thead><tbody>`;
  for(let i=0;i<m;i++){
    const isLR=i===lr;
    h+=`<tr>`;
    h+=`<td class="${isLR?'c-basis-lv':'c-basis'}">${vn[basis[i]]}</td>`;
    for(let j=0;j<NV;j++){
      let cls='';
      if(isLR&&j===ec)cls='c-pivot';
      else if(isLR)cls='c-leave';
      else if(j===ec)cls='c-enter';
      h+=`<td class="${cls}">${tab[i][j].html()}</td>`;
    }
    h+=`<td class="c-rhs${isLR?' c-leave':''}">${rhs[i].html()}</td></tr>`;
  }
  h+=`<tr class="obj-row"><td>c<sub>j</sub></td>`;
  for(let j=0;j<NV;j++){
    const isBasis=basis.includes(j);
    const raw=obj[j];
    const dispVal=ot==='min'?raw.neg():raw;
    const rv=obj[j].val();
    if(isBasis){ h+=`<td class="cj-zero">0</td>`; continue; }
    let cls='';
    if(j===ec)     cls='cj-enter';
    else if(rv>1e-9) cls='cj-pos';
    else if(rv<-1e-9)cls='cj-neg';
    else             cls='cj-zero';
    h+=`<td class="${cls}">${dispVal.plain()}</td>`;
  }
  let zvDisp=zv.clone();if(ot==='min')zvDisp=zvDisp.neg();
  h+=`<td class="z-val">${zvDisp.plain()}</td>`;
  h+=`</tr></tbody></table>`;
  return h;
}

function buildProbHeader(inp,sf){
  const{n,m,ot,c,A,b,types}=inp;
  const lbl=ot==='max'?'Max Z =':'Min Z =';
  const objStr=c.map((ci,j)=>{const s=j>0?(ci>=0?' + ':' &#8722; '):'';const v=j>0?Math.abs(ci):ci;return`${s}${v}x<sub>${j+1}</sub>`}).join('');
  const conRows=A.map((row,i)=>{
    const lhs=row.map((a,j)=>{const s=j>0?(a>=0?' + ':' &#8722; '):'';const v=j>0?Math.abs(a):a;return`${s}${v}x<sub>${j+1}</sub>`}).join('');
    return`<div class="prob-con-row"><span class="prob-con-idx">${i+1}.</span><span class="prob-con-expr">${lhs}</span><span class="prob-con-sign">${types[i]}</span><span class="prob-con-rhs">${b[i]}</span></div>`;
  }).join('');
  const nn=Array.from({length:n},(_,i)=>`x<sub>${i+1}</sub>`).join(', ')+' &#8805; 0';
  const sfVars=sf.vn.slice(n).join(', ');
  return`<div class="prob-card">
    <div class="prob-eyebrow">Bài toán đầu vào</div>
    <div class="prob-obj"><span class="prob-obj-lbl">${lbl}</span><span class="prob-obj-expr">${objStr}</span></div>
    <div class="prob-con-lbl">Ràng buộc:</div>${conRows}
    <div class="prob-nn">${nn}</div>
    <div class="prob-sf">Biến bổ sung: <strong style="color:var(--primary)">${sfVars||'(không có)'}</strong></div>
  </div>`;
}

function buildResultPanel(T,origN,ot,isInt){
  const sol={};
  for(let i=0;i<T.m;i++)sol[T.vn[T.basis[i]]]=T.rhs[i].clone();
  for(let j=0;j<T.NV;j++)if(!(T.vn[j] in sol))sol[T.vn[j]]=ZERO.clone();
  let zv=T.zv.clone();if(ot==='min')zv=zv.neg();
  const zlbl=ot==='max'?'Z<sub>max</sub>':'Z<sub>min</sub>';
  let cards=`<div class="rc z-rc"><div class="rc-lbl">${zlbl}</div><div class="rc-val">${zv.plain()}</div></div>`;
  for(let j=0;j<origN;j++){const v=sol['x'+(j+1)]||ZERO;cards+=`<div class="rc"><div class="rc-lbl">x<sub>${j+1}</sub></div><div class="rc-val">${v.plain()}</div></div>`}
  return`<div class="result-panel${isInt?' is-int':''}">
    <div class="result-head"><div class="result-icon">${isInt?'&#11042;':'&#9670;'}</div><div class="result-title">${isInt?'Nghiệm Nguyên Tối Ưu':'Nghiệm Tối Ưu'}</div></div>
    <div class="result-cards">${cards}</div>
  </div>`;
}

function mkAlert(t,msg){return`<div class="alert-box ${t==='warn'?'a-warn':'a-ok'}"><span class="aico">${t==='warn'?'&#9888;':'&#10003;'}</span><span>${msg}</span></div>`}

/* ═══════════════════════════════════════════════════
   EXAMPLES & UTILS
   ═══════════════════════════════════════════════════ */
function ex(n){
  clrAll();
  if(n===1){
    document.getElementById('nv').value=2;document.getElementById('nc').value=3;
    document.getElementById('ot').value='max';buildForm();
    document.getElementById('c0').value=5;document.getElementById('c1').value=4;
    const rs=document.getElementById('condiv').querySelectorAll('.con-row');
    setRow(rs[0],[6,4],'≤',24);setRow(rs[1],[1,2],'≤',6);setRow(rs[2],[-1,1],'≤',1);
    document.getElementById('sint').checked=false;
  }else if(n===2){
    document.getElementById('nv').value=2;document.getElementById('nc').value=2;
    document.getElementById('ot').value='min';buildForm();
    document.getElementById('c0').value=2;document.getElementById('c1').value=3;
    const rs=document.getElementById('condiv').querySelectorAll('.con-row');
    setRow(rs[0],[1,2],'≥',4);setRow(rs[1],[2,1],'≥',3);
    document.getElementById('sint').checked=false;
  }else if(n===3){
    document.getElementById('nv').value=2;document.getElementById('nc').value=2;
    document.getElementById('ot').value='max';buildForm();
    document.getElementById('c0').value=1;document.getElementById('c1').value=1;
    const rs=document.getElementById('condiv').querySelectorAll('.con-row');
    setRow(rs[0],[2,2],'≤',7);setRow(rs[1],[2,10],'≤',15);
    document.getElementById('sint').checked=true;
  }
}
function setRow(row,cs,type,b){Array.from(row.querySelectorAll('.cc')).forEach((inp,i)=>inp.value=cs[i]??0);row.querySelector('select').value=type;row.querySelector('.rb').value=b}
function clrAll(){
  document.getElementById('objdiv').querySelectorAll('input').forEach(i=>i.value='');
  document.getElementById('condiv').querySelectorAll('input').forEach(i=>i.value='');
  document.getElementById('sol').innerHTML='';
  document.getElementById('placeholder').style.display='flex';
  manualState=null;
  setStatus('','Sẵn sàng');
}
function setStatus(t,txt){document.getElementById('sdot').className='sdot'+(t?' '+t:'');document.getElementById('stxt').textContent=txt}

// Khởi tạo trang web lần đầu
buildForm();