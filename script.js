const $ = (s) => document.querySelector(s);

let DATA = [];          // 轉換後的資料
let GROUPS = new Set(); // 群組列表

/* 初始化 */
document.addEventListener('DOMContentLoaded', async () => {
  disableControls(true);
  await loadData();
  bindEvents();
  disableControls(false);
  render(); // 初始顯示（無條件）
});

function disableControls(disabled){
  $('#btn-home').disabled = disabled;
  $('#btn-search').disabled = disabled;
  $('#group').disabled = disabled;
  $('#q').disabled = disabled;
}

/* 讀取資料（相容兩種格式：純陣列 or {ok:true,data:[…]}） */
async function loadData(){
  try{
    const res = await fetch(`./data.json?v=${Date.now()}`, { cache:'no-store' });
    let j = await res.json();
    if (j && Array.isArray(j.data)) j = j.data;

    const last3 = (s)=> String(s||'').replace(/[^\d]/g,'').slice(-3);
    DATA = j.map((r, i) => ({
      seq: i + 1,
      name: r.maskedName ?? r.name ?? '',
      phone3: last3(r.phoneLast4 ?? r.phone),
      group: r.group ?? '',
      createdAt: Number(r.createdAt||0) || 0
    })).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));

    GROUPS = new Set(DATA.map(x=>x.group).filter(Boolean));
    populateGroupSelect();
  }catch(err){
    console.error(err);
    $('#rows').innerHTML = '';
    $('#empty').hidden = false;
    $('#empty').textContent = '載入資料失敗或尚未部署。';
  }
}

/* 綁定事件 */
function bindEvents(){
  $('#btn-home').addEventListener('click', () => {
    $('#group').value = '';
    $('#q').value = '';
    render();
  });
  $('#btn-search').addEventListener('click', () => render());
  $('#q').addEventListener('keydown', (e)=>{ if(e.key === 'Enter') render(); });
  $('#group').addEventListener('change', () => render());
}

/* 產生群組下拉 */
function populateGroupSelect(){
  const sel = $('#group');
  sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
  [...GROUPS].sort().forEach(g=>{
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    sel.appendChild(opt);
  });
}

/* 依條件篩選 */
function getFiltered(){
  const g = $('#group').value.trim();
  const q = $('#q').value.trim();
  const qNum = q.replace(/[^\d]/g,''); // 只取數字比電話
  return DATA.filter(item=>{
    const okGroup = g ? item.group === g : true;
    if (!q) return okGroup;
    const hitName = item.name.includes(q);
    const hitPhone = qNum ? item.phone3.endsWith(qNum) : false;
    return okGroup && (hitName || hitPhone);
  });
}

/* 結果渲染 */
function render(){
  const list = getFiltered();
  const rowsEl = $('#rows');
  const emptyEl = $('#empty');

  const g = $('#group').value.trim();
  const q = $('#q').value.trim();
  $('#result-title').textContent =
    q && g ? `搜尋「${q}」且組別「${g}」的結果`
    : q ? `搜尋「${q}」的結果`
    : g ? `組別「${g}」的名單`
    : '查詢結果';

  if (!list.length){
    rowsEl.innerHTML = '';
    emptyEl.textContent = '目前沒有符合條件的資料';
    emptyEl.hidden = false;
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
