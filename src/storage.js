import {VERSION,FOCUS,ACTIONS} from './config.js';
const RUN='office-slack.run.v1',PROFILE='office-slack.profile.v1';
export const emptyProfile=()=>({schema:1,tutorialCompleted:false,unlockedTitles:[],bestCompletedRun:null,history:[],messages:[]});
function checksum(text){let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619);return(n>>>0).toString(16);}
export function validateRun(s){
 if(!s||s.schema!==1)throw Error('存档格式不支持，请重新开始。');
 if(s.configVersion!==VERSION)throw Error('存档规则版本不匹配，请保留备份后重新开始。');
 const required=['pendingAction','fake','returnScheduled','eventId','eventStatus','lastEvent','settlement','result','tutorialProtected','tutorialDone','notice'];
 if(!Number.isFinite(s.carryover)||s.carryover<0)throw Error('结转任务数值缺失或损坏。');
 if(required.some(k=>!(k in s)))throw Error('存档字段缺失。');
 const phases=['DAY_SETUP','RUNNING','TUTORIAL','EVENT_CHOICE','PAUSED','DAY_RESULT','EVALUATION','RUN_RESULT'];
 if(!phases.includes(s.phase)||!FOCUS[s.focus]||!ACTIONS[s.action])throw Error('存档状态无效。');
 const numeric=['randomState','day','dayRank','rank','energy','skillXp','favor','joy','warningStreak','reminderToken','elapsedMs','wrapMs','restMs','restEnergy','restJoy','progress','lowEnergyMs','idleSuccessMs','caughtCount','exposedCount','maxRank','completedDays','dayStartXp','joyTotal','joyTicks','seq','revision','eventDue','eventLatest'];
 if(numeric.some(k=>typeof s[k]!=='number'||!Number.isFinite(s[k])||s[k]<0))throw Error('存档数值缺失或损坏。');
 if(s.day<1||s.day>10||s.rank<1||s.rank>3||s.dayRank<1||s.dayRank>3||s.elapsedMs>60000||s.elapsedMs%100||['energy','favor','joy'].some(k=>s[k]>100))throw Error('存档数值超出范围。');
 if(['inputs','modifiers','patrols','dailyResults','log'].some(k=>!Array.isArray(s[k])))throw Error('存档列表缺失。');
 if(typeof s.runId!=='string'||typeof s.demo!=='boolean'||typeof s.tutorial!=='boolean'||typeof s.tutorialStage!=='string')throw Error('存档标识缺失。');
 if(['returnScheduled','tutorialProtected','tutorialDone'].some(k=>typeof s[k]!=='boolean')||typeof s.notice!=='string')throw Error('存档标记损坏。');
 if(s.action==='WRAP_UP'&&!['WORK','PRETEND','IDLE_THINK','IDLE_PHONE'].includes(s.pendingAction))throw Error('收手目标动作缺失。');
 if(s.fake&&(['start','end'].some(k=>!Number.isFinite(s.fake[k]))||['shown','done'].some(k=>typeof s.fake[k]!=='boolean')))throw Error('脚步信号存档损坏。');
 for(const p of s.patrols)if(['start','end','warnAt','workMs','pretendMs'].some(k=>!Number.isFinite(p[k]))||['warned','started','caught','exposed','penaltyApplied','settled'].some(k=>typeof p[k]!=='boolean')||typeof p.id!=='string')throw Error('巡视存档损坏。');
 for(const m of s.modifiers)if(['target','win','lose'].some(k=>!Number.isFinite(m[k])))throw Error('任务修正存档损坏。');
 if(['DAY_RESULT','EVALUATION'].includes(s.phase)&&(!s.settlement?.applied||!Array.isArray(s.settlement.deltas)))throw Error('结算凭据缺失。');
 if(s.phase==='RUN_RESULT'&&(!s.result||!Array.isArray(s.result.titles)))throw Error('结局存档缺失。');
 if((s.phase==='EVENT_CHOICE'||s.resumePhase==='EVENT_CHOICE')&&!/^E0[1-6]$/.test(s.eventId))throw Error('事件存档损坏。');
 if(s.phase==='PAUSED'&&!['RUNNING','EVENT_CHOICE','TUTORIAL'].includes(s.resumePhase))throw Error('暂停存档损坏。');
 return s;
}
export function encode(s){validateRun(s);const payload=JSON.stringify(s);return JSON.stringify({checksum:checksum(payload),payload});}
export function decode(raw){const e=JSON.parse(raw);if(typeof e.payload!=='string'||checksum(e.payload)!==e.checksum)throw Error('存档校验失败。');return validateRun(JSON.parse(e.payload));}
export function saveRun(store,s){if(s.demo)return;store.setItem(RUN,encode(s));}
export function readRun(store){const raw=store.getItem(RUN);if(!raw)return {run:null,error:null};try{return{run:decode(raw),error:null};}catch(e){return{run:null,error:`无法读取存档：${e.message} 原存档已保留，可导出排查。`};}}
export function rawSave(store){return store.getItem(RUN)||'';}
export function readProfile(store){
 try{const p=JSON.parse(store.getItem(PROFILE));if(p?.schema===1&&Array.isArray(p.unlockedTitles)&&Array.isArray(p.history)){if(!Array.isArray(p.messages))p.messages=[];return p;}}catch{/* 独立局内存档不受个人记录读取失败影响。 */}
 return emptyProfile();
}
export function saveProfile(store,p){store.setItem(PROFILE,JSON.stringify(p));}
export function recordResult(p,r){
 if(!r||r.demo||p.history.some(h=>h.runId===r.runId))return false;
 p.history.push(r);p.history=p.history.slice(-100);p.unlockedTitles=[...new Set([...p.unlockedTitles,...r.titles])];
 if(!r.failed&&r.days===10&&(!p.bestCompletedRun||r.careerScore>p.bestCompletedRun.careerScore))p.bestCompletedRun=r;
 return true;
}
export function recordMessage(p,message){
 const text=String(message||'').trim().slice(0,120);
 if(!text)return false;
 p.messages=[{text,createdAt:new Date().toISOString()},...(Array.isArray(p.messages)?p.messages:[])].slice(0,50);
 return true;
}
