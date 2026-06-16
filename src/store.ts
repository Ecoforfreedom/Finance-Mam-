import { create } from 'zustand';
import type { FieldSource, TaskItem } from './types/domain';
import { tasks as initialTasks } from './services/data';
type State={source?:FieldSource;openSource:(s?:FieldSource)=>void;demo:boolean;setDemo:(v:boolean)=>void;tasks:TaskItem[];updateTask:(id:string,status:TaskItem['status'])=>void;};
export const useAppStore=create<State>((set)=>({source:undefined,openSource:(s)=>set({source:s}),demo:false,setDemo:(v)=>set({demo:v}),tasks:initialTasks,updateTask:(id,status)=>set(st=>({tasks:st.tasks.map(t=>t.id===id?{...t,status}:t)}))}));