// 讀取 data.json（部署時由 GitHub Actions 自動生成）
async function loadData(){
  try{
    const res = await fetch('./data.json?v='+Date.now(), { cache:'no-store' });
    const arr = await res.json();
    arr.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    render(arr);
  }catch(e){
    document.querySelector('#results').innerHTML =
      '<p class="empty">載入資料失敗或尚未部署。</p>';
  }
}

function render(arr){
  const root=document.querySelector('#results');
  if(!arr.length){root.innerHTML='<p class="empty">目前沒有資料</p>';return;}
  const head='<div class="item header"><div>#</div><div>姓名</div><div>電話末4碼</div><div>組別</div></div>';
  const rows=arr.map((r,i)=>
    `<div class="item"><div>${i+1}</div><div>${r.maskedName||''}</div><div>${r.phoneLast4||''}</div><div>${r.group||''}</div></div>`
  ).join('');
  root.innerHTML=head+rows;
}

document.addEventListener('DOMContentLoaded',loadData);
