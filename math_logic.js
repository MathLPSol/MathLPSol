/* ═══════════════════════════════════════════════════
   RATIONAL ARITHMETIC WITH BIGINT (Độ chính xác tuyệt đối)
   ═══════════════════════════════════════════════════ */
function igcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a || 1n;
}

class Q {
  constructor(p, q = 1n) {
    let bp = typeof p === 'bigint' ? p : BigInt(p);
    let bq = typeof q === 'bigint' ? q : BigInt(q);
    if (bq === 0n) throw new Error('Phân số có mẫu bằng 0');
    
    let g = igcd(bp, bq);
    this.p = bp / g;
    this.q = bq / g;
    
    if (this.q < 0n) {
      this.p = -this.p;
      this.q = -this.q;
    }
  }

  static fromFloat(val) {
    if (Number.isInteger(val)) return new Q(BigInt(val), 1n);
    let s = Number(val).toFixed(12).replace(/0+$/, '');
    if (s.endsWith('.')) s = s.slice(0, -1);
    
    let parts = s.split('.');
    if (parts.length === 1) return new Q(BigInt(parts[0]), 1n);
    
    let pStr = parts[0] + parts[1];
    let p = BigInt(pStr);
    let q = 10n ** BigInt(parts[1].length);
    return new Q(p, q);
  }

  add(b) { return new Q(this.p * b.q + b.p * this.q, this.q * b.q); }
  sub(b) { return new Q(this.p * b.q - b.p * this.q, this.q * b.q); }
  mul(b) { return new Q(this.p * b.p, this.q * b.q); }
  div(b) { return new Q(this.p * b.q, this.q * b.p); }
  neg() { return new Q(-this.p, this.q); }

  eq(b) { return this.p * b.q === b.p * this.q; }
  lt(b) { return this.p * b.q < b.p * this.q; }
  lte(b) { return this.p * b.q <= b.p * this.q; }
  gt(b) { return this.p * b.q > b.p * this.q; }
  gte(b) { return this.p * b.q >= b.p * this.q; }
  isZero() { return this.p === 0n; }

  val() { return Number(this.p) / Number(this.q); }
  clone() { return new Q(this.p, this.q); }

  floorInt() {
    let res = this.p / this.q;
    if (this.p < 0n && this.p % this.q !== 0n) res -= 1n;
    return res;
  }
  
  fracPart() { return new Q(this.p - this.floorInt() * this.q, this.q); }
  isInteger() { return this.p % this.q === 0n; }
  str() { return this.isInteger() ? this.floorInt().toString() : this.p + '/' + this.q; }
  
  html() {
    const isZ = this.isZero();
    const isP = this.p > 0n;
    const cls = isZ ? 'vzer' : isP ? 'vpos' : 'vneg';
    return `<span class="${cls}">${this._fmt()}</span>`;
  }
  
  plain() { return this._fmt(); }
  
  _fmt() {
    if (this.isInteger()) return this.floorInt().toString();
    const neg = this.p < 0n;
    const num = neg ? -this.p : this.p;
    const den = this.q;
    const sign = neg ? '<span class="frac-sign">&#8722;</span>' : '';
    return `${sign}<span class="frac"><span class="frac-num">${num}</span><span class="frac-bar"></span><span class="frac-den">${den}</span></span>`;
  }
}

const ZERO = new Q(0n, 1n);
const ONE = new Q(1n, 1n);

function q(p, d) {
  if (d !== undefined) return new Q(BigInt(p), BigInt(d));
  if (typeof p === 'number') return Q.fromFloat(p);
  return new Q(BigInt(p), 1n);
}

/* ═══════════════════════════════════════════════════
   STANDARD FORM & MA TRẬN
   ═══════════════════════════════════════════════════ */
function buildSF(inp) {
  const { n, m, ot, c, A, b, types } = inp;
  const Aq = A.map(r => r.map(v => q(v)));
  const bq = b.map(v => q(v));
  const tw = [...types];
  
  for (let i = 0; i < m; i++) {
    if (bq[i].lt(ZERO)) {
      Aq[i] = Aq[i].map(v => v.neg());
      bq[i] = bq[i].neg();
      if (tw[i] === '≤') tw[i] = '≥';
      else if (tw[i] === '≥') tw[i] = '≤';
    }
  }
  
  const vn = [], vt = [];
  for (let j = 0; j < n; j++) { vn[j] = `x${j+1}`; vt[j] = 'x'; }
  
  let xi = n, sc = 0, ec2 = 0, ac = 0;
  const slk = [], art = [], artSet = new Set();
  
  for (let i = 0; i < m; i++) {
    if (tw[i] === '≤') {
      vn[xi] = `s${++sc}`; vt[xi] = 's'; slk.push(xi); art.push(-1); xi++;
    } else if (tw[i] === '≥') {
      vn[xi] = `e${++ec2}`; vt[xi] = 'e'; slk.push(xi); xi++;
      vn[xi] = `a${++ac}`; vt[xi] = 'art'; art.push(xi); artSet.add(xi); xi++;
    } else {
      slk.push(-1); vn[xi] = `a${++ac}`; vt[xi] = 'art'; art.push(xi); artSet.add(xi); xi++;
    }
  }
  
  const NV = xi;
  const rows = [], basis = [];
  
  for (let i = 0; i < m; i++) {
    const coefs = Array.from({ length: NV }, () => ZERO.clone());
    for (let j = 0; j < n; j++) coefs[j] = Aq[i][j].clone();
    const si = slk[i], ai = art[i];
    if (si >= 0) coefs[si] = tw[i] === '≤' ? ONE.clone() : new Q(-1n);
    if (ai >= 0) coefs[ai] = ONE.clone();
    rows.push({ coefs, rhs: bq[i].clone() });
    basis.push(ai >= 0 ? ai : si);
  }
  
  const obj = Array.from({ length: NV }, () => ZERO.clone());
  for (let j = 0; j < n; j++) obj[j] = ot === 'max' ? q(c[j]) : q(c[j]).neg();
  
  const BM = new Q(10000000000n, 1n);
  for (let i = 0; i < m; i++) if (art[i] >= 0) obj[art[i]] = BM.neg();
  
  const origC = Array.from({ length: NV }, () => ZERO.clone());
  for (let j = 0; j < n; j++) origC[j] = q(c[j]);
  
  return { vn, vt, rows, basis, obj, origC, NV, m, n, artSet, ot };
}

function makeTab(sf) {
  const { vn, rows, basis, obj, origC, NV, m, artSet } = sf;
  const tab = rows.map(r => r.coefs.map(v => v.clone()));
  const rhs = rows.map(r => r.rhs.clone());
  const o = obj.map(v => v.clone());
  let zv = ZERO.clone();
  
  for (let i = 0; i < m; i++) {
    const bv = basis[i];
    if (!o[bv].isZero()) {
      const coef = o[bv].clone();
      for (let j = 0; j < NV; j++) o[j] = o[j].sub(coef.mul(tab[i][j]));
      zv = zv.sub(coef.mul(rhs[i]));
    }
  }
  return { tab, rhs, obj: o, origC: [...origC], zv, basis: [...basis], vn: [...vn], m, NV, artSet };
}

function cloneT(T) {
  return {
    tab: T.tab.map(r => r.map(v => v.clone())),
    rhs: T.rhs.map(v => v.clone()),
    obj: T.obj.map(v => v.clone()),
    origC: [...T.origC],
    zv: T.zv.clone(),
    basis: [...T.basis],
    vn: [...T.vn],
    m: T.m, NV: T.NV, artSet: new Set(T.artSet)
  };
}

/* ═══════════════════════════════════════════════════
   GAUSS ELIMINATION PIVOT
   ═══════════════════════════════════════════════════ */
function doPivot(T, lr, ec) {
  const piv = T.tab[lr][ec];
  if (piv.isZero()) throw 'Phần tử chốt bằng 0';
  const pi = ONE.div(piv);
  
  for (let j = 0; j < T.NV; j++) T.tab[lr][j] = T.tab[lr][j].mul(pi);
  T.rhs[lr] = T.rhs[lr].mul(pi);
  
  for (let i = 0; i < T.m; i++) {
    if (i === lr) continue;
    const f = T.tab[i][ec];
    if (f.isZero()) continue;
    for (let j = 0; j < T.NV; j++) T.tab[i][j] = T.tab[i][j].sub(f.mul(T.tab[lr][j]));
    T.rhs[i] = T.rhs[i].sub(f.mul(T.rhs[lr]));
  }
  
  const fo = T.obj[ec];
  if (!fo.isZero()) {
    for (let j = 0; j < T.NV; j++) T.obj[j] = T.obj[j].sub(fo.mul(T.tab[lr][j]));
    T.zv = T.zv.sub(fo.mul(T.rhs[lr]));
  }
  T.basis[lr] = ec;
}

/* ═══════════════════════════════════════════════════
   AUTO PIVOT SELECTION (Tối ưu hóa)
   ═══════════════════════════════════════════════════ */
function findEnter(T) {
  let best = -1;
  let bv = ZERO.clone();
  for (let j = 0; j < T.NV; j++) {
    if (!T.basis.includes(j) && T.obj[j].gt(bv)) {
      bv = T.obj[j].clone();
      best = j;
    }
  }
  return best;
}

function findLeave(T, ec) {
  let best = -1;
  let br = null;
  for (let i = 0; i < T.m; i++) {
    const a = T.tab[i][ec];
    if (a.gt(ZERO)) {
      const r = T.rhs[i].div(a);
      if (br === null || r.lt(br) || (r.eq(br) && T.basis[i] < T.basis[best])) {
        br = r;
        best = i;
      }
    }
  }
  return best;
}

function findDual(T) {
  let lr = -1;
  let mn = ZERO.clone();
  
  // Chọn biến ra: Ưu tiên b_i âm nhất
  for (let i = 0; i < T.m; i++) {
    if (T.rhs[i].lt(mn)) { 
      mn = T.rhs[i].clone(); 
      lr = i; 
    }
  }
  if (lr === -1) return null;

  let ec = -1;
  let mr = null;
  
  // Chọn biến vào: Xét tỉ số đối ngẫu
  for (let j = 0; j < T.NV; j++) {
    const a = T.tab[lr][j];
    if (a.lt(ZERO)) {
      const r = T.obj[j].div(a);
      
      // TỐI ƯU HÓA: Xử lý trùng tỉ số (Tie-breaking)
      // Khi r bằng mr (tỉ số bằng nhau như trường hợp s1 và g1 của bạn),
      // thuật toán sẽ ưu tiên biến có index j lớn hơn (j > ec).
      // Các biến g1, g2... nằm ở cuối ma trận nên luôn có index lớn.
      // Việc ưu tiên đưa chúng vào cơ sở giúp loại bỏ lát cắt dư thừa, hội tụ cực nhanh.
      if (mr === null || r.lt(mr) || (r.eq(mr) && ec !== -1 && j > ec)) { 
        mr = r; 
        ec = j; 
      }
    }
  }
  if (ec === -1) return null;
  return { lr, ec };
}