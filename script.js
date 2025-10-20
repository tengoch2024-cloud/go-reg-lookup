const $ = (s) => document.querySelector(s);

let DATA = [];
let GROUPS = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  toggleDisabled(true);
  await loadData();
  bindEvents();
  render();          // 初次渲染
  toggleDisabled(false);
});

function toggleDisabled(disabled){
  ['#btn-home','#btn-search','#group','#q'].forEach(id=>{
    const el = $(id); if (el) el.disabled = disabled;
  });
}

/* === 關鍵：更耐髒的欄位對應 === */
const getVal = (obj, keys) => {
  for (const k of keys) {
    // 容忍中文/空白差異：去除所有空白再比
    const found = Object.keys(obj).find(kk =>
      kk.replace(/\s+/g,'') === String(k).replace(/\s+/g,'')
    );
    if (found && obj[found] != null && String(obj[found]).trim() !== '') {
      return obj[found];
    }
  }
  return '';
};

const DIGITS = s => String(s ?? '').replace(/[^\d]/g,'');
const lastN = (s, n) => DIGITS(s).slice(-n);

async function loadData(){
  try{
    const res = await fetch(`./data.json?v=${Date.now()}`, { cache:'no-store' });
    let j = await res.json();
    if (j && Array.isArray(j.data)) j = j.data; // 相容 { ok:true, data:[...] }

    DATA = j.map((raw, i) => {
      const name = getVal(raw, ['maskedName','姓名','name','選手姓名']);
      const phone4 = getVal(raw, ['phoneLast4','phone','電話','手機']);
      const group  = String(getVal(raw, ['group','組別','報名組別'])).trim();
      const createdAt = Number(getVal(raw, ['createdAt','時間戳記','timestamp'])) || 0;

      return {
        seq: i + 1,
        name: name || '',
        phone3: lastN(phone4, 3),     // 末三碼顯示
        group: group || '',
        createdAt
      };
    }).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));

    // 建立群組選單（過濾空白、去重、排序）
    GROUPS = new Set(DATA.map(x=>x.group).filter(g=>String(g).trim()!==''));
    populateGroupSelect();
  }catch(err){
    console.error('loadData error:', err);
    $('#rows').innerHTML = '';
    $('#empty').hidden = false;
    $('#empty').textContent = '載入資料失敗或尚未部署。';
  }
}

function populateGroupSelect(){
  const sel = $('#group');
  if (!sel) return;
  // 清空保留第一個空選項
  sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
  const arr = [...GROUPS].sort((a,b)=> String(a).localeCompare(String(b), 'zh-Hant'));
  arr.forEach(g=>{
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    sel.appendChild(opt);
  });
}

function bindEvents(){
  $('#btn-home')?.addEventListener('click', () => {
    $('#group').value = '';
    $('#q').value = '';
    render();
  });
  $('#btn-search')?.addEventListener('click', render);
  $('#q')?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') render(); });
  $('#group')?.addEventListener('change', render);
}

function getFiltered(){
  const g = String($('#group').value || '').trim();
  const q = String($('#q').value || '').trim();
  const qNum = DIGITS(q);
  return DATA.filter(item=>{
    const okGroup = g ? item.group === g : true;
    if (!q) return okGroup;
    const hitName  = item.name.includes(q);
    const hitPhone = qNum ? item.phone3.endsWith(qNum) : false;
    return okGroup && (hitName || hitPhone);
  });
}

function render(){
  const list = getFiltered();
  const rowsEl = $('#rows');
  const emptyEl = $('#empty');

  const g = String($('#group').value || '').trim();
  const q = String($('#q').value || '').trim();
  $('#result-title').textContent =
    q && g ? `搜尋「${q}」且組別「${g}」的結果`
    : q ? `搜尋「${q}」的結果`
    : g ? `組別「${g}」的名單`
    : '查詢結果';

  if (!list.length){
    rowsEl.innerHTML = '';
    emptyEl.hidden = false;
    emptyEl.textContent = '目前沒有符合條件的資料';
    return;
  }
  emptyEl.hidden = true;

  rowsEl.innerHTML = list.map((r, i) => `
    <div class="tr">
      <div class="td td--num">${i+1}</div>
      <div class="td">${escapeHtml(r.name)}</div>
      <div class="td">*******${escapeHtml(r.phone3)}</div>
      <div class="td">${escapeHtml(r.group)}</div>
    </div>
  `).join('');
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
