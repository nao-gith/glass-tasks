import {useEffect,useRef,useState, type PointerEvent} from 'react';
import {ArrowRight,ArrowLeft,Check,Search,Plus,Sparkles,SlidersHorizontal,X,Trash2,Flag,CalendarDays,Cloud,LogOut,LoaderCircle,Undo2,MoreHorizontal} from 'lucide-react';
import {Task,Status,labels,statuses,nextStatus,makeTask,readLocal,api} from './model';

type User={name:string;email:string;id:string};
export default function App(){
 const [tasks,setTasks]=useState<Task[]>(()=>readLocal('gt.tasks',[]));
 const [draft,setDraft]=useState(()=>readLocal<string>('gt.draft',''));
 const [filter,setFilter]=useState<Status|'all'>('all');
 const [search,setSearch]=useState(''); const [searchOpen,setSearchOpen]=useState(false);
 const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
 const [user,setUser]=useState<User|null>(null); const [authReady,setAuthReady]=useState(false);
 const [account,setAccount]=useState(false); const [editing,setEditing]=useState<Task|null>(null);
 const [notice,setNotice]=useState(''); const [deleted,setDeleted]=useState<Task|null>(null);
 const [aiOpen,setAiOpen]=useState(false); const [aiBusy,setAiBusy]=useState(false); const [suggestions,setSuggestions]=useState<string[]>([]);
 const [order,setOrder]=useState('newest'); const input=useRef<HTMLTextAreaElement>(null);
 const userRef=useRef<User|null>(null); const busyRef=useRef(false); const tasksRef=useRef(tasks);tasksRef.current=tasks;
 function localSave(next:Task[]){try{localStorage.setItem('gt.tasks',JSON.stringify(next));return true}catch{setNotice('端末の保存容量が不足しています。データを保存できません。');return false}}
 useEffect(()=>{let live=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
 (async()=>{try{const r=await fetch('/api/session',{signal:controller.signal});if(!r.ok)throw Error();const d=await r.json();if(!live)return;setAuthReady(d.configured);if(d.user){const list=await api('/api/tasks');if(!live)return;userRef.current=d.user;setUser(d.user);setTasks(list.tasks)} }catch{if(live)setNotice('クラウドに接続できません。端末内のメモを表示しています。')}finally{clearTimeout(timeout);if(live)setLoading(false)}})();
 const reason=new URLSearchParams(location.search).get('auth_error');if(reason){setNotice('Googleログインを完了できませんでした。もう一度お試しください。');history.replaceState({},'',location.pathname)}
 return()=>{live=false;controller.abort();clearTimeout(timeout)}},[]);
 useEffect(()=>{try{localStorage.setItem('gt.draft',JSON.stringify(draft))}catch{setNotice('下書きを保存できません。端末の空き容量を確認してください。')}},[draft]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6500);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();input.current?.focus()}if(e.key==='Escape'){setEditing(null);setAccount(false);setAiOpen(false)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]);
 async function saveMany(changed:Task[],remove?:string){if(busyRef.current||loading)return false;busyRef.current=true;setBusy(true);
 try{if(userRef.current){await api('/api/tasks','POST',{tasks:changed,remove})}
 const next=tasksRef.current.filter(t=>t.id!==remove&&!changed.some(c=>c.id===t.id)).concat(changed);
 if(!userRef.current&&!localSave(next))return false;
 tasksRef.current=next;setTasks(next);return true}catch(e){setNotice((e as Error).message);return false}finally{busyRef.current=false;setBusy(false)}}
 async function add(){if(!draft.trim()||busy)return;const value=draft; if(await saveMany([makeTask(value)])){setDraft(current=>current===value?'':current);setNotice('追加しました');input.current?.focus()}}
 async function change(t:Task,status:Status){if(status===t.status)return;if(await saveMany([{...t,status,updatedAt:Date.now()}])){setNotice(labels[status]+'に変更しました');navigator.vibrate?.(12)}}
 async function remove(t:Task){if(await saveMany([],t.id)){setEditing(null);setDeleted(t);setNotice('削除しました')}}
 async function undo(){if(deleted&&await saveMany([deleted])){setDeleted(null);setNotice('元に戻しました')}}
 async function ai(){setAiOpen(true);setSuggestions([]);if(!user)return;setAiBusy(true);try{const d=await api('/api/organize','POST',{text:draft});setSuggestions(d.tasks)}catch(e){setNotice((e as Error).message)}finally{setAiBusy(false)}}
 async function importLocal(){const local=readLocal<Task[]>('gt.tasks',[]);if(!local.length){setNotice('取り込む端末内メモはありません');return}const additions=local.filter(t=>!tasksRef.current.some(x=>x.id===t.id));if(await saveMany(additions)){localStorage.removeItem('gt.tasks');setNotice('端末内メモを取り込みました')}}
 async function logout(){if(busy)return;try{await api('/api/logout','POST',{});userRef.current=null;setUser(null);setTasks(readLocal('gt.tasks',[]));setAccount(false)}catch(e){setNotice((e as Error).message)}}
 const counts=Object.fromEntries(statuses.map(s=>[s,tasks.filter(t=>t.status===s).length]));
 const shown=tasks.filter(t=>(filter==='all'||t.status===filter)&&t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b)=>order==='priority'?Number(b.priority)-Number(a.priority)||b.createdAt-a.createdAt:order==='due'?(a.due||'9999').localeCompare(b.due||'9999'):b.createdAt-a.createdAt);
 const today=new Date();
 const date=new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric'}).format(today);
 const weekday=new Intl.DateTimeFormat('ja-JP',{weekday:'long'}).format(today);
 const progress=tasks.length?Math.round(Number(counts.done)/tasks.length*100):0;
 useEffect(()=>{if(input.current){input.current.style.height='24px';input.current.style.height=Math.min(144,input.current.scrollHeight)+'px'}},[draft]);
 return <div className="app"><div className="ambient ambient-a"/><div className="ambient ambient-b"/>
 <header className="topbar"><div className="page-title"><h1>{date}</h1><p className="date">{weekday}</p></div><div className="header-actions"><div className="completion" role="img" aria-label={`${tasks.length}件中${counts.done}件完了、${progress}%`}><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20"/><circle cx="24" cy="24" r="20" style={{strokeDasharray:`${progress*1.257} 126`}}/></svg><span>{progress}<small>%</small></span></div><button className="account-button glass" aria-label="アカウント" onClick={()=>setAccount(true)}>{user?<span className="avatar">{user.name.slice(0,1)}</span>:<SlidersHorizontal size={17}/>}</button></div></header>
 <main><section className="composer glass" aria-label="クイックメモ">
 <textarea ref={input} autoFocus rows={1} aria-label="メモを入力" placeholder="メモを追加…" value={draft} maxLength={2000} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();add()}}}/>
 <button className="add-button" aria-label="タスクを追加" disabled={!draft.trim()||busy||loading} onClick={add}>{busy?<LoaderCircle className="spin" size={18}/>:<Plus size={20}/>}</button></section>
 {draft.trim()&&<div className="composer-footer"><span className="draft-label">下書き保存済み</span><button className="ai-button" disabled={aiBusy||loading} onClick={ai}><Sparkles size={14}/>AIで整理</button></div>}
 <section className="task-section" aria-label="タスク一覧"><div className="list-toolbar"><span className="list-caption">{tasks.length} 件のタスク</span><div className="list-tools"><select aria-label="並び順" value={order} onChange={e=>setOrder(e.target.value)}><option value="newest">追加した順</option><option value="priority">優先度順</option><option value="due">期限順</option></select><button className={'icon-button search-toggle '+(searchOpen?'active':'')} aria-label="検索を開く" onClick={()=>setSearchOpen(!searchOpen)}><Search size={16}/></button></div></div>
 {searchOpen&&<div className="search-box glass"><Search size={17}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="タスクを検索" aria-label="タスクを検索"/><button className="icon-button" aria-label="検索をクリア" onClick={()=>setSearch('')}><X size={16}/></button></div>}
 {statuses.filter(s=>filter==='all'||filter===s).map(s=>{const grouped=shown.filter(t=>t.status===s);if(search&&!grouped.length)return null;return <section className={'task-group group-'+s} key={s} aria-label={labels[s]+'のタスク'}><h2 className="group-heading"><span className="group-dot"/>{labels[s]}<span className="group-count">{grouped.length}</span></h2><div className="task-list">{grouped.map(t=><TaskCard key={t.id} task={t} disabled={busy||loading} onChange={status=>change(t,status)} onEdit={()=>setEditing({...t})}/>)}</div>{!grouped.length&&<div className="group-empty">タスクはありません</div>}</section>})}
 {search&&!shown.length&&<div className="empty"><Search size={24}/><h2>一致するタスクがありません</h2></div>}
 {shown.length>0&&<div className="swipe-hint"><ArrowLeft size={13}/><span>戻す</span><i/> <span>フリックで状態を変更</span><i/><span>進める</span><ArrowRight size={13}/></div>}
 </section>
 </main><footer className="footer"><Cloud size={12}/>{user?'Googleアカウントに保存':'この端末に保存'}</footer>
 <nav className="filter-dock" aria-label="タスクの表示"><div className="filters glass" role="tablist" aria-label="ステータスで絞り込み">{(['all',...statuses] as const).map(s=><button role="tab" aria-selected={filter===s} key={s} onClick={()=>setFilter(s)} className={filter===s?'selected':''}>{s==='all'?'すべて':labels[s]}<span>{s==='all'?tasks.length:counts[s]}</span></button>)}</div></nav>
 {loading&&<div className="loading-indicator glass" role="status" aria-label="同期を確認中"><LoaderCircle size={14} className="spin"/>同期を確認中</div>}
 {notice&&<div className="toast glass" role="status"><Check size={16}/>{notice}</div>}
 {deleted&&<button className="undo glass" disabled={busy} onClick={undo}><Undo2 size={16}/>削除を取り消す</button>}
 {account&&<Modal title="アカウント" onClose={()=>setAccount(false)}><div className="account-mark"><Cloud size={26}/></div>{user?<><h3>{user.name}</h3><p className="muted">{user.email}</p><button className="wide secondary" disabled={busy} onClick={importLocal}>端末内のメモを取り込む</button><button className="wide secondary" disabled={busy} onClick={logout}><LogOut size={17}/>ログアウト</button></>:<><p className="modal-copy">Googleでログインすると、別の端末でもタスクを使えます。</p>{authReady?<a className="wide primary google-login" href="/auth/google"><span className="google-g">G</span>Googleでログイン</a>:<p className="setup-note">Googleログインは準備中です。端末内のメモはそのまま利用できます。</p>}</>}</Modal>}
 {editing&&<Modal title="タスクを編集" onClose={()=>setEditing(null)}><label className="field">メモ<textarea aria-label="タスクの内容" maxLength={2000} value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><div className="field-row"><label className="field">ステータス<select aria-label="タスクのステータス" value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value as Status})}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label><label className="field">期限<input type="date" aria-label="タスクの期限" value={editing.due} onChange={e=>setEditing({...editing,due:e.target.value})}/></label></div><label className="priority-check"><input type="checkbox" checked={editing.priority} onChange={e=>setEditing({...editing,priority:e.target.checked})}/><Flag size={16}/>優先する</label><div className="modal-actions"><button className="delete-button" disabled={busy} onClick={()=>remove(editing)}><Trash2 size={17}/>削除</button><button className="primary" disabled={!editing.title.trim()||busy} onClick={async()=>{if(await saveMany([{...editing,title:editing.title.trim(),updatedAt:Date.now()}])){setEditing(null);setNotice('保存しました')}}}>保存</button></div></Modal>}
 {aiOpen&&<Modal title="AIで整理" onClose={()=>setAiOpen(false)}>{!user?<><p className="modal-copy">メモをタスクに分けます。利用するにはGoogleでログインしてください。</p>{authReady?<a href="/auth/google" className="wide primary">Googleでログイン</a>:<p className="setup-note">Googleログインの設定が必要です。</p>}</>:aiBusy?<div className="ai-loading" role="status"><Sparkles className="pulse"/>メモを整理しています…<div className="skeleton sk-card"/><div className="skeleton sk-card"/></div>:<><p className="muted">内容を確認して追加してください。</p>{suggestions.map((s,i)=><label className="suggestion" key={i}><span>{String(i+1).padStart(2,'0')}</span><input aria-label={'AI候補 '+(i+1)} value={s} maxLength={2000} onChange={e=>setSuggestions(suggestions.map((x,j)=>j===i?e.target.value:x))}/><button className="icon-button" aria-label={'候補 '+(i+1)+' を削除'} onClick={()=>setSuggestions(suggestions.filter((_,j)=>j!==i))}><X size={15}/></button></label>)}<button className="wide primary" disabled={busy||!suggestions.some(s=>s.trim())} onClick={async()=>{if(await saveMany(suggestions.filter(s=>s.trim()).map(makeTask))){setDraft('');setAiOpen(false);setNotice('タスクを追加しました')}}}>{suggestions.filter(s=>s.trim()).length} 件を追加</button>{!suggestions.length&&<button className="wide secondary" onClick={ai}>もう一度試す</button>}</>}</Modal>}
 </div>
}
function TaskCard({task:t,disabled,onChange,onEdit}:{task:Task;disabled:boolean;onChange:(s:Status)=>void;onEdit:()=>void}){
 const [offset,setOffset]=useState(0);const start=useRef<{x:number;y:number}|null>(null);
 function end(e:PointerEvent){if(!start.current)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;start.current=null;setOffset(0);if(!disabled&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)onChange(nextStatus(t.status,dx>0?1:-1))}
 const overdue=t.due&&t.status!=='done'&&t.due<new Date().toLocaleDateString('sv-SE');
 return <article className={'task-shell '+t.status} aria-label={t.title+'、'+labels[t.status]}><div className="swipe-under"><span><ArrowRight size={18}/>{labels[nextStatus(t.status,1)]}</span><span>{labels[nextStatus(t.status,-1)]}<ArrowLeft size={18}/></span></div><div className={'task-card '+(t.status==='done'?'completed':'')} style={{transform:`translateX(${offset}px)`}} onPointerDown={e=>{if((e.target as HTMLElement).closest('button'))return;start.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(start.current&&Math.abs(e.clientX-start.current.x)>Math.abs(e.clientY-start.current.y)*1.4)setOffset(Math.max(-110,Math.min(110,e.clientX-start.current.x)))}} onPointerUp={end} onPointerCancel={()=>{start.current=null;setOffset(0)}}>
 <button className={'task-check '+t.status} aria-label={t.title+'を'+(t.status==='done'?'未着手':'完了')+'にする'} disabled={disabled} onClick={()=>onChange(t.status==='done'?'todo':'done')}>{t.status==='done'?<Check size={13}/>:t.status==='doing'?<span/>:null}</button><div className="task-body"><p>{t.title}</p><div className="task-meta"><time dateTime={new Date(t.createdAt).toISOString()}>{new Intl.DateTimeFormat('ja-JP',{hour:'2-digit',minute:'2-digit'}).format(t.createdAt)}</time>{t.due&&<span className={overdue?'overdue':''}><CalendarDays size={11}/>{t.due.slice(5).replace('-','/')}</span>}{t.priority&&<span className="priority-tag"><Flag size={11}/>優先</span>}</div></div><button className="icon-button more" aria-label={t.title+'を編集'} onClick={onEdit}><MoreHorizontal size={17}/></button>
 </div></article>
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} className="modal glass" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="閉じる" onClick={onClose}><X size={20}/></button></div>{children}</dialog>
}
