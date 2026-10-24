export type Status='todo'|'doing'|'done';
export type Task={id:string;title:string;status:Status;priority:boolean;due:string;createdAt:number;updatedAt:number};
export const labels:Record<Status,string>={todo:'未着手',doing:'進行中',done:'完了'};
export const statuses:Status[]=['todo','doing','done'];
export function nextStatus(s:Status,delta:number):Status{return statuses[Math.max(0,Math.min(2,statuses.indexOf(s)+delta))]}
export function makeTask(title:string):Task{const now=Date.now();return{id:crypto.randomUUID(),title:title.trim(),status:'todo',priority:false,due:'',createdAt:now,updatedAt:now}}
export function readLocal<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
export async function api(path:string,method='GET',body?:unknown){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),path==='/api/organize'?45000:12000);try{const r=await fetch(path,{method,signal:controller.signal,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw new Error(d.error||'通信できません。もう一度お試しください。');return d}catch(e){if(e instanceof Error&&e.name==='AbortError')throw new Error('接続がタイムアウトしました。入力内容は保持されています。');throw e}finally{clearTimeout(timer)}}
