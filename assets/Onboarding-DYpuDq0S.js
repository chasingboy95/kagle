import{o as e,t}from"./jsx-runtime-CZcjcDnw.js";import{t as n}from"./react-9A9D8-nk.js";import{S as r,b as i,x as a}from"./index-B5fke7h5.js";import{t as o}from"./useModalFocus-CaFsfHZc.js";var s=e(n(),1),c=t(),l=[{title:`什么是凯格尔训练`,body:`凯格尔训练通过反复收缩和放松盆底肌来增强肌肉力量。

训练时请收缩盆底肌（像憋尿一样的感觉），同时保持腹部、大腿和臀部放松，避免代偿用力。

本应用提供计时和节奏引导，不能判断动作是否正确。`},{title:`训练中的呼吸与安全`,body:`训练时请保持自然呼吸，不要屏气。

如果在训练中出现疼痛、头晕或明显不适，请立即停止，并咨询医生或物理治疗师。

孕妇、产后不久或患有特定疾病者，建议在专业人士指导下进行。`},{title:`关于本应用`,body:`本应用仅提供计时和节奏引导，不是医疗设备，不能诊断或治疗任何疾病。

训练参数（收缩/保持/放松时间、次数）均为节奏模板，不代表个体化治疗建议。

所有数据仅存储在您的设备本地，不会上传至任何服务器。`}];function u({onComplete:e}){let[t,n]=(0,s.useState)(0),u=(0,s.useRef)(null),d=i(),f=t===l.length-1,p=(0,s.useCallback)(()=>e(),[e]);return o(u,p),(0,c.jsx)(r,{children:(0,c.jsx)(a.div,{ref:u,initial:!d&&{opacity:0},animate:{opacity:1},exit:{opacity:0},className:`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4 pb-8 sm:pb-0`,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`onboarding-title`,"aria-describedby":`onboarding-body`,children:(0,c.jsxs)(a.div,{initial:!d&&{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:d?0:.25},className:`w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl px-6 py-6 space-y-5`,children:[(0,c.jsx)(`div`,{className:`flex justify-center gap-1.5`,role:`status`,"aria-label":`第 ${t+1} 页，共 ${l.length} 页`,children:l.map((e,n)=>(0,c.jsx)(`div`,{className:`w-1.5 h-1.5 rounded-full transition-colors ${n===t?`bg-indigo-400`:`bg-white/15`}`},n))}),(0,c.jsx)(`h2`,{id:`onboarding-title`,className:`text-lg font-semibold text-slate-100 text-center`,children:l[t].title}),(0,c.jsx)(`p`,{id:`onboarding-body`,className:`text-sm text-slate-400 leading-relaxed whitespace-pre-line text-center`,children:l[t].body}),(0,c.jsxs)(`div`,{className:`flex gap-3 pt-2`,children:[(0,c.jsx)(`button`,{type:`button`,onClick:p,className:`flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors`,children:`跳过`}),(0,c.jsx)(`button`,{type:`button`,onClick:()=>{f?e():n(e=>e+1)},"data-autofocus":!0,className:`flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 transition-colors`,children:f?`开始训练`:`下一步`})]})]},t)})})}export{u as default};