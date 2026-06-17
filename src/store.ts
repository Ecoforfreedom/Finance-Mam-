import { create } from 'zustand';
import type { FieldSource, TaskItem } from './types/domain';
import { tasks as initialTasks } from './services/data';
type State={source?:FieldSource;openSource:(s?:FieldSource)=>void;demo:boolean;setDemo:(v:boolean)=>void;tasks:TaskItem[];updateTask:(id:string,status:TaskItem['status'])=>void;resetTasks:()=>void;};
const storageKey='future-fund-tasks-v1';
const loadTasks=()=>{try{const raw=localStorage.getItem(storageKey);return raw?JSON.parse(raw) as TaskItem[]:initialTasks;}catch{return initialTasks;}};
const persist=(items:TaskItem[])=>{try{localStorage.setItem(storageKey,JSON.stringify(items));}catch{}};
export const useAppStore=create<State>((set)=>({source:undefined,openSource:(s)=>set({source:s}),demo:false,setDemo:(v)=>set({demo:v}),tasks:loadTasks(),updateTask:(id,status)=>set(st=>{const tasks=st.tasks.map(t=>t.id===id?{...t,status}:t);persist(tasks);return{tasks};}),resetTasks:()=>set(()=>{persist(initialTasks);return{tasks:initialTasks};})}));