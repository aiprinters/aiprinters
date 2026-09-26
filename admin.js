const sb=window.supabase.createClient('https://yceukuehpffktbpengfx.supabase.co','sb_publishable_-8xFlxnjkipxyDihmKphzg_iTveTcqC');
const $=s=>document.querySelector(s);
let schoolsCache=[];let editFieldsData=[];let requestsCache=[];let confirmCallback=null;let servicesCatCache=[];
const STATUSES=['Received','Under Printing','Printed','Delivered'];
function askConfirm(text,cb){$('#confirmText').textContent=text;confirmCallback=cb;$('#confirmDialog').showModal()}
$('#confirmYes').onclick=()=>{$('#confirmDialog').close();let cb=confirmCallback;confirmCallback=null;if(cb)cb()};
$('#confirmCancel').onclick=()=>{$('#confirmDialog').close();confirmCallback=null};
async function show(){let {data:{session}}=await sb.auth.getSession();$('#login').hidden=!!session;$('#admin').hidden=!session;if(session){await list();await loadRequests();await loadServices();renderStats()}}
async function loadServices(){let {data,error}=await sb.from('services').select('*').order('created_at');if(error){$('#servicesList').innerHTML='<p>Could not load services.</p>';return}
servicesCatCache=data;
$('#servicesList').innerHTML=data.map(s=>`<article style="text-align:center"><div style="font-size:28px">${s.icon||'🖨️'}</div><h3 style="margin:8px 0 0;font-size:14px">${s.name}</h3><div class="card-actions" style="justify-content:center"><button class="button outline manage-products" data-id="${s.id}" data-name="${s.name}">Manage Products</button><button class="button outline del-service" data-id="${s.id}" data-name="${s.name}">Delete</button></div></article>`).join('')||'<p class="hint">No services yet. Add one above.</p>';
document.querySelectorAll('.del-service').forEach(b=>b.onclick=()=>askConfirm(`Delete "${b.dataset.name}" from the services catalog?`,async()=>{let {error}=await sb.from('services').delete().eq('id',b.dataset.id);if(error){alert('Could not delete: '+error.message);return}loadServices()}));
document.querySelectorAll('.manage-products').forEach(b=>b.onclick=()=>openProducts(b.dataset.id,b.dataset.name));
}
let currentServiceId=null;
function openProducts(id,name){currentServiceId=id;$('#productsTitle').textContent='Products in '+name;$('#prodTitle').value='';$('#prodDesc').value='';$('#prodRate').value='';$('#prodPhoto').value='';$('#prodMessage').textContent='';loadProducts();$('#productsDialog').showModal()}
$('#closeProducts').onclick=()=>$('#productsDialog').close();
async function loadProducts(){let {data,error}=await sb.from('products').select('*').eq('service_id',currentServiceId).order('created_at');if(error){$('#productsList').innerHTML='<p>Could not load products.</p>';return}
$('#productsList').innerHTML=data.map(p=>{let img=p.photo_path?sb.storage.from('product-photos').getPublicUrl(p.photo_path).data.publicUrl:'';return `<article><div style="height:90px;border-radius:8px;overflow:hidden;background:#f0f2f6;margin-bottom:8px">${img?`<img src="${img}" style="width:100%;height:100%;object-fit:cover">`:''}</div><h3 style="font-size:13px;margin:0 0 4px">${p.title}</h3>${p.rate?`<p style="color:#1f6fd6;font-weight:700">₹${p.rate}</p>`:''}<button class="button outline del-product" data-id="${p.id}" data-title="${p.title}">Delete</button></article>`}).join('')||'<p class="hint">No products yet.</p>';
document.querySelectorAll('.del-product').forEach(b=>b.onclick=()=>askConfirm(`Delete "${b.dataset.title}"?`,async()=>{let {error}=await sb.from('products').delete().eq('id',b.dataset.id);if(error){alert('Could not delete: '+error.message);return}loadProducts()}));
}
$('#addProduct').onclick=async()=>{let title=$('#prodTitle').value.trim();if(!title)return;let photo=$('#prodPhoto').files[0];let photoPath=null;if(photo){let path=`${currentServiceId}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;let up=await sb.storage.from('product-photos').upload(path,photo,{contentType:photo.type});if(up.error){$('#prodMessage').textContent='Could not upload photo: '+up.error.message;return}photoPath=path}
let {error}=await sb.from('products').insert({service_id:currentServiceId,title,description:$('#prodDesc').value.trim(),rate:$('#prodRate').value||null,photo_path:photoPath});
$('#prodMessage').textContent=error?'Could not save: '+error.message:'Product added.';if(!error){$('#prodTitle').value='';$('#prodDesc').value='';$('#prodRate').value='';$('#prodPhoto').value='';loadProducts()}};
$('#addService').onclick=async()=>{let name=$('#svcName').value.trim();if(!name)return;let {error}=await sb.from('services').insert({name,icon:$('#svcIcon').value.trim()||'🖨️'});$('#svcMessage').textContent=error?'Could not save: '+error.message:'Service added.';if(!error){$('#svcName').value='';$('#svcIcon').value='';loadServices()}};
function renderStats(){let total=requestsCache.length;let pending=requestsCache.filter(r=>!r.status||r.status==='Received').length;let printed=requestsCache.filter(r=>r.status==='Printed'||r.status==='Delivered').length;$('#statsBar').innerHTML=[['Schools',schoolsCache.length,'#316bff'],['Total Requests',total,'#7352db'],['Pending',pending,'#c98a00'],['Printed/Delivered',printed,'#18905e']].map(([label,val,color])=>`<article style="text-align:center"><div style="font:700 26px Outfit;color:${color}">${val}</div><p>${label}</p></article>`).join('')}
async function list(){let {data,error}=await sb.from('schools').select('*').order('created_at',{ascending:false});if(error){$('#schoolList').innerHTML='<p>Could not load schools. Please sign in again.</p>';return}
schoolsCache=data;renderStats();let filter=$('#schoolSearch').value;
let shown=filter?data.filter(s=>s.name.toLowerCase().includes(filter.toLowerCase())):data;
$('#schoolList').innerHTML=shown.map(s=>{let link=`${location.origin}/teacher.html?school=${encodeURIComponent(s.access_code)}`;return `<article><h2>${s.name}</h2><p>${s.contact_name||'No contact added'} · ${s.form_fields.length} fields</p><p class="linkbox">${link}</p><div class="card-actions"><button class="button outline copy" data-link="${link}">Copy link</button><button class="button outline wa" data-link="${link}">WhatsApp</button><button class="button outline edit" data-id="${s.id}">Edit</button><button class="button outline del-school" data-id="${s.id}" data-name="${s.name}">Delete</button></div></article>`}).join('')||'<p>No schools found.</p>';
document.querySelectorAll('.copy').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.link);b.textContent='Copied!'});
document.querySelectorAll('.wa').forEach(b=>b.onclick=()=>window.open(`https://wa.me/?text=${encodeURIComponent(b.dataset.link)}`,'_blank'));
document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openEdit(b.dataset.id));
document.querySelectorAll('.del-school').forEach(b=>b.onclick=()=>askConfirm(`Delete "${b.dataset.name}" and its teacher link permanently? This cannot be undone.`,async()=>{let {error}=await sb.from('schools').delete().eq('id',b.dataset.id);if(error){alert('Could not delete: '+error.message);return}list()}));
}
$('#schoolSearch').oninput=()=>list();
$('#clearSearch').onclick=()=>{$('#schoolSearch').value='';list()};
function renderEditFields(){$('#editFields').innerHTML=editFieldsData.map((f,i)=>`<div class="field-row"><input type="text" data-i="${i}" value="${f.label}"><label><input type="checkbox" data-i="${i}" class="req" ${f.required?'checked':''}> Required</label><button type="button" data-remove="${i}">×</button></div>`).join('')||'<p class="hint">No fields yet. Click "+ Add field".</p>';
document.querySelectorAll('#editFields input[type=text]').forEach(inp=>inp.oninput=()=>{editFieldsData[+inp.dataset.i].label=inp.value});
document.querySelectorAll('#editFields .req').forEach(cb=>cb.onchange=()=>{editFieldsData[+cb.dataset.i].required=cb.checked});
document.querySelectorAll('#editFields [data-remove]').forEach(b=>b.onclick=()=>{editFieldsData.splice(+b.dataset.remove,1);renderEditFields()});
}
function openEdit(id){let s=schoolsCache.find(x=>x.id===id);if(!s)return;$('#editId').value=s.id;$('#editName').value=s.name;$('#editContact').value=s.contact_name||'';$('#editAccessCode').value=s.access_code;editFieldsData=JSON.parse(JSON.stringify(s.form_fields||[]));renderEditFields();$('#editMessage').textContent='';$('#editDialog').showModal()}
$('#addEditField').onclick=()=>{editFieldsData.push({label:'New field',type:'text',required:false});renderEditFields()};
$('#editForm').addEventListener('submit',async e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();let id=$('#editId').value;let {error}=await sb.from('schools').update({name:$('#editName').value,contact_name:$('#editContact').value,access_code:$('#editAccessCode').value.trim(),form_fields:editFieldsData}).eq('id',id);if(error){$('#editMessage').textContent='Could not save: '+error.message;return}$('#editDialog').close();list()});
async function loadRequests(){let {data,error}=await sb.from('id_card_requests').select('*, schools(name)').order('created_at',{ascending:false});if(error){$('#requestsList').innerHTML='<p>Could not load requests.</p>';return}
requestsCache=data;renderStats();
let lastViewed=localStorage.getItem('lastViewedRequests');
let newCount=lastViewed?data.filter(r=>new Date(r.created_at)>new Date(lastViewed)).length:data.length;
if(newCount>0){$('#reqBadge').hidden=false;$('#reqBadge').textContent=newCount}else{$('#reqBadge').hidden=true}
$('#filterSchool').innerHTML='<option value="">All schools</option>'+schoolsCache.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
renderRequestsList();
}
function renderRequestsList(){
let q=($('#reqSearch').value||'').toLowerCase();
let schoolFilter=$('#filterSchool').value;
let statusFilter=$('#filterStatus').value;
let sortOrder=$('#sortOrder').value;
let data=requestsCache.filter(r=>{
  if(schoolFilter&&r.school_id!==schoolFilter)return false;
  if(statusFilter&&(r.status||'Received')!==statusFilter)return false;
  if(q&&!(`${r.student_name||''} ${r.schools?.name||''}`).toLowerCase().includes(q))return false;
  return true;
});
data=[...data].sort((a,b)=>sortOrder==='oldest'?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
let groups={};data.forEach(r=>{let key=r.schools?.name||'Unknown school';(groups[key]=groups[key]||[]).push(r)});
$('#requestsList').innerHTML=Object.entries(groups).map(([schoolName,reqs])=>{let cards=reqs.map(r=>{let skip=['Class Teacher name'];let extra=Object.entries(r.student_data||{}).filter(([k])=>!skip.includes(k)).map(([k,v])=>`<p><strong>${k}:</strong> ${v||'—'}</p>`).join('');let teacherName=r.student_data?.['Class Teacher name'];return `<article class="request-card"><input type="checkbox" class="req-check" data-id="${r.id}"><div class="request-photo" data-path="${r.photo_path||''}">Loading…</div><div class="request-info"><h3>${r.student_name||'Student'}</h3>${extra}${teacherName?`<p><strong>Class Teacher:</strong> ${teacherName}</p>`:''}<p class="hint">${r.created_at?new Date(r.created_at).toLocaleString():''}</p>${r.notes?`<p class="hint">Note: ${r.notes}</p>`:''}<p class="hint">Request type: ${r.request_type||''}</p><div class="card-actions"><select class="status-select" data-id="${r.id}">${STATUSES.map(s=>`<option ${s===(r.status||'Received')?'selected':''}>${s}</option>`).join('')}</select><a class="button outline dl" data-path="${r.photo_path||''}" href="#">Download</a><button class="button outline del-req" data-id="${r.id}">Delete</button></div></div></article>`}).join('');return `<h3 class="group-heading">${schoolName} <span class="hint">(${reqs.length})</span></h3><div class="cards">${cards}</div>`}).join('')||'<p>No requests match these filters.</p>';
document.querySelectorAll('.request-photo').forEach(async el=>{let path=el.dataset.path;if(!path){el.textContent='No photo';return}let {data:signed}=await sb.storage.from('student-photos').createSignedUrl(path,3600);if(signed?.signedUrl){el.innerHTML=`<img src="${signed.signedUrl}" alt="">`}else{el.textContent='No photo'}});
document.querySelectorAll('.dl').forEach(async a=>{let path=a.dataset.path;if(!path)return;let {data:signed}=await sb.storage.from('student-photos').createSignedUrl(path,3600,{download:true});if(signed?.signedUrl)a.href=signed.signedUrl});
document.querySelectorAll('.status-select').forEach(s=>s.onchange=async()=>{await sb.from('id_card_requests').update({status:s.value}).eq('id',s.dataset.id);loadRequests()});
document.querySelectorAll('.del-req').forEach(b=>b.onclick=()=>askConfirm('Delete this request permanently? This cannot be undone.',async()=>{let {error}=await sb.from('id_card_requests').delete().eq('id',b.dataset.id);if(error){alert('Could not delete: '+error.message);return}loadRequests()}));
}
$('#reqSearch').oninput=renderRequestsList;
$('#filterSchool').onchange=renderRequestsList;
$('#filterStatus').onchange=renderRequestsList;
$('#sortOrder').onchange=renderRequestsList;
$('#clearReqFilters').onclick=()=>{$('#reqSearch').value='';$('#filterSchool').value='';$('#filterStatus').value='';$('#sortOrder').value='newest';renderRequestsList()};
document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab));if(b.dataset.tab==='requestsTab'){localStorage.setItem('lastViewedRequests',new Date().toISOString());$('#reqBadge').hidden=true}});
$('#applyBulk').onclick=async()=>{let ids=[...document.querySelectorAll('.req-check:checked')].map(c=>c.dataset.id);let val=$('#bulkStatus').value;if(!ids.length||!val)return;let {error}=await sb.from('id_card_requests').update({status:val}).in('id',ids);if(error){alert('Could not update: '+error.message);return}loadRequests()};
$('#exportCsv').onclick=()=>{let rows=[['Student','School','Type','Status','Class Teacher','Submitted']];requestsCache.forEach(r=>{rows.push([r.student_name||'',r.schools?.name||'',r.request_type||'',r.status||'Received',r.student_data?.['Class Teacher name']||'',r.created_at?new Date(r.created_at).toLocaleString():''])});let csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');let blob=new Blob([csv],{type:'text/csv'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='id-card-requests.csv';a.click()};
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===b.dataset.section))});
$('#sendLogin').onclick=async()=>{let email=$('#email').value;if(!email)return;let {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/admin.html'}});$('#loginMessage').textContent=error?'Could not send the sign-in link.':'Check your email and open the secure sign-in link.'};
$('#addSchool').onclick=async()=>{let names=$('#fieldNames').value.split(',').map(x=>x.trim()).filter(Boolean);let {error}=await sb.from('schools').insert({name:$('#name').value,contact_name:$('#contact').value,access_code:$('#accessCode').value.trim(),form_fields:names.map((label,i)=>({label,type:'text',required:i<3}))});$('#adminMessage').textContent=error?'Could not save: '+error.message:'School saved.';if(!error){['name','contact','accessCode','fieldNames'].forEach(id=>$('#'+id).value='');list()}};
$('#signOut').onclick=async()=>{await sb.auth.signOut();show()};
show();
