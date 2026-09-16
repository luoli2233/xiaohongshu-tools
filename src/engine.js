import {VERSION,STEP,DAY_MS,FOCUS,PATROLS,RANKS,ACTIONS,TITLES,EVENT_PLANS} from './config.js';
export const clamp=(v)=>Math.max(0,Math.min(100,Math.round(v*1e6)/1e6));
const round=v=>Math.round(v*1e6)/1e6;
export const skill=s=>Math.min(10,1+Math.floor(s.skillXp/40));
export const target=s=>FOCUS[s.focus].target+(s.dayRank-1)*3+s.carryover+s.modifiers.reduce((v,m)=>v+m.target,0);
export const balanceMultiplier=s=>s.energy>=70&&s.joy>=70?1.25:s.energy>=50&&s.joy>=40?1.15:1;
const idle=a=>a==='IDLE_THINK'||a==='IDLE_PHONE';
export function rand(s){s.randomState=(Math.imul(s.randomState,1664525)+1013904223)>>>0;return s.randomState/4294967296;}
function log(s,type,text,extra={}) {
 const e={id:`${s.runId}:${++s.seq}`,day:s.day,time:s.elapsedMs,type,text,...extra};s.log.push(e);
 // 最多约 10 分钟的操作日志；界面只显示最后一条，日末明细独立封账。
 if(s.log.length>2500)s.log.shift();if(type!=='RETURN_SCHEDULED')s.notice=text;s.revision++;
}
function change(s,key,delta,reason){const before=s[key];s[key]=['energy','favor','joy'].includes(key)?clamp(before+delta):Math.max(0,round(before+delta));log(s,'STAT_CHANGED',reason,{key,before,after:s[key]});}
export function newRun({seed=Date.now()>>>0,demo=false,tutorial=false}={}){
 return {schema:1,configVersion:VERSION,runId:`${Date.now().toString(36)}-${seed.toString(36)}`,demo,randomState:seed>>>0,
 phase:'DAY_SETUP',day:1,dayRank:1,rank:1,energy:80,skillXp:0,favor:50,joy:0,warningStreak:0,reminderToken:0,
 elapsedMs:0,action:'WORK',pendingAction:null,wrapMs:0,restMs:0,restEnergy:0,restJoy:0,inputs:[],
 focus:'daily',progress:0,carryover:0,lowEnergyMs:0,modifiers:[],patrols:[],fake:null,returnScheduled:false,
 eventId:null,eventStatus:'none',lastEvent:null,eventDue:15000,eventLatest:45000,
 idleSuccessMs:0,caughtCount:0,exposedCount:0,maxRank:1,completedDays:0,dailyResults:[],settlement:null,result:null,
 tutorial,tutorialStage:tutorial?'welcome':'done',tutorialProtected:tutorial,tutorialDone:false,
 dayStartXp:0,joyTotal:0,joyTicks:0,log:[],seq:0,revision:0,notice:'今天，也要给自己留一点快乐。'};
}
export function patrol(start,duration=5000,kind='base',id='p1'){
 return {id,start,end:start+duration,warnAt:start-2500,kind,warned:false,started:false,workMs:0,pretendMs:0,caught:false,exposed:false,penaltyApplied:false,settled:false};
}
function legal(p,others,fake){
 if(p.warnAt<8000||p.end>DAY_MS)return false;
 const spans=[...others,...(fake?[{warnAt:fake.start,end:fake.end}]:[])];
 return spans.every(q=>Math.abs(q.warnAt-p.warnAt)>=8000&&(p.end<=q.warnAt||p.warnAt>=q.end));
}
function chooseEvent(s){
 s.eventId=null;s.eventStatus='none';s.eventDue=15000;s.eventLatest=45000;
 if(s.day===1)return;
 const levelNeed=s.rank===1?3:5,favorNeed=s.rank===1?60:75;
 if([4,7].includes(s.day)&&s.rank<3&&skill(s)>=levelNeed&&s.favor<favorNeed){s.eventId='E05';s.eventDue=0;}
 else if([5,10].includes(s.day)){s.eventId='E06';s.eventDue=40000;s.eventLatest=50000;}
 else {
  let ids=(EVENT_PLANS[s.day]||['E02','E03','E04']).slice();if(s.energy<12||s.reminderToken)ids=ids.filter(id=>id!=='E01');ids=ids.filter(id=>id!==s.lastEvent);
  if(!ids.length)ids=['E04'];
  s.eventId=ids[Math.floor(rand(s)*ids.length)];
  if(s.eventId==='E02')s.eventLatest=30000;if(s.eventId==='E03')s.eventLatest=40000;
 }
 s.eventStatus='pending';
}
export function confirmFocus(s,focus){
 if(s.phase!=='DAY_SETUP'||!FOCUS[focus])return false;
 s.focus=s.tutorial&&s.day===1?'daily':focus;s.dayRank=s.rank;
 s.elapsedMs=0;s.progress=0;s.lowEnergyMs=0;s.modifiers=[];s.inputs=[];s.action='WORK';s.wrapMs=0;s.restMs=0;s.pendingAction=null;
 s.patrols=[];s.fake=null;s.returnScheduled=false;s.settlement=null;s.dayStartXp=s.skillXp;
 const cfg=PATROLS[s.rank];
 for(const [i,anchor] of cfg.anchors.entries()){
  let p;
  for(let n=0;n<20;n++){
   const jitter=s.tutorial&&s.day===1?0:(Math.floor(rand(s)*41)-20)*100;
   p=patrol(anchor+jitter,cfg.duration,'base',`d${s.day}-p${i}`);
   if(legal(p,s.patrols,null))break;p=null;
  }
  s.patrols.push(p||patrol(anchor,cfg.duration,'base',`d${s.day}-p${i}`));
 }
 if(!(s.tutorial&&s.day===1)&&rand(s)<.2){
  for(let i=0;i<20;i++){
   const start=8000+Math.floor(rand(s)*480)*100;
   const f={start,end:start+2500,shown:false,done:false};
   if(f.end<=60000&&s.patrols.every(p=>Math.abs(p.warnAt-start)>=8000&&(f.end<=p.warnAt||start>=p.end))){s.fake=f;break;}
  }
 }
 chooseEvent(s);s.phase='RUNNING';log(s,'DAY_STARTED',`第 ${s.day} 天，${FOCUS[s.focus].name}。今日目标 ${target(s)}。`);
 if(s.tutorial&&s.day===1&&s.tutorialStage==='welcome')s.phase='TUTORIAL';
 else maybeEvent(s);
 return true;
}
export function activePatrol(s){return s.patrols.find(p=>p.started&&!p.settled&&s.elapsedMs>=p.start&&s.elapsedMs<p.end);}
export function signal(s){
 const p=s.patrols.find(p=>p.warned&&!p.started&&s.elapsedMs<p.start);
 if(p)return {kind:'warning',remaining:p.start-s.elapsedMs};
 const f=s.fake;if(f?.shown&&!f.done)return {kind:'warning',remaining:f.end-s.elapsedMs};
 const a=activePatrol(s);if(a)return {kind:'watching',remaining:a.end-s.elapsedMs};
 return {kind:'safe',remaining:0};
}
function checkCaught(s,p){
 if(!(idle(s.action)||s.action==='WRAP_UP'))return;
 if(!p.caught){p.caught=true;s.caughtCount++;}
 if(!p.penaltyApplied){
  p.penaltyApplied=true;const protectedCatch=s.tutorialProtected&&s.day===1&&p===s.patrols[0];
  change(s,'favor',protectedCatch?-4:-12,protectedCatch?'首次教学保护：被抓，好感 −4':'摸鱼被发现：好感 −12');
  if(!protectedCatch)change(s,'joy',-5,'摸鱼被发现：快乐 −5');
  log(s,'PATROL_CAUGHT',protectedCatch?'这次少扣一点。下次记得留出收手时间。':'被看到了！已强制回到工作。',{patrolId:p.id});
 } else log(s,'PATROL_CAUGHT','这次巡视已经扣过分，先把状态稳住。',{patrolId:p.id});
 s.action='WORK';s.pendingAction=null;s.wrapMs=0;
}
function expose(s,p){
 if(p.exposed)return;
 const risky=p.pretendMs>=2000&&rand(s)<.012;
 if(p.pretendMs<4000&&!risky)return;
 p.exposed=true;s.exposedCount++;
 if(!p.penaltyApplied){p.penaltyApplied=true;change(s,'favor',-5,risky?'假装很忙被看穿：好感 −5':'装忙太久被识破：好感 −5');}
}
function settlePatrol(s,p){
 if(p.settled)return;expose(s,p);p.settled=true;
 if(!p.caught&&!p.exposed){
  if(p.workMs>=3000)change(s,'favor',4,'认真工作被看见了：好感 +4');
  else if(p.pretendMs>=1000&&p.pretendMs<4000)change(s,'favor',1,'暂时应付过去了：好感 +1');
 }
 log(s,'PATROL_ENDED',p.caught||p.exposed?'老板离开了。重新稳住节奏。':'老板走出了办公室。可以松口气了。',{patrolId:p.id});
 if(s.tutorial&&s.day===1&&p===s.patrols[0])s.tutorialProtected=false;
 if(p.kind==='base'&&!s.returnScheduled&&!(s.tutorial&&s.day===1)&&rand(s)<.2){
  const wait=s.reminderToken?4000:2500;const q=patrol(s.elapsedMs+3000+wait,PATROLS[s.dayRank].duration,'return',`d${s.day}-return`);q.warnAt=s.elapsedMs+3000;
  if(legal(q,s.patrols,s.fake)){s.patrols.push(q);s.returnScheduled=true;log(s,'RETURN_SCHEDULED','巡视日程已保存。',{patrolId:q.id});}
 }
}
export function queueAction(s,action){
 if(s.phase!=='RUNNING'||!['WORK','PRETEND','IDLE_THINK','IDLE_PHONE'].includes(action)||['WRAP_UP','APPROVED_REST'].includes(s.action))return false;
 applyAction(s,action);return true;
}
function applyAction(s,action){
 if(s.action===action||['WRAP_UP','APPROVED_REST'].includes(s.action))return;
 if(idle(s.action)){s.wrapMs=s.action==='IDLE_PHONE'?1200:200;s.pendingAction=action;s.action='WRAP_UP';}
 else s.action=action;
 log(s,'ACTION_CHANGED',ACTIONS[s.action==='WRAP_UP'?s.pendingAction:s.action]);
 const p=activePatrol(s);if(p)checkCaught(s,p);
}
function maybeEvent(s){
 if(s.phase!=='RUNNING'||s.eventStatus!=='pending'||s.elapsedMs<s.eventDue)return;
 if(s.elapsedMs>=s.eventLatest){s.eventStatus='cancelled';return;}
 if(signal(s).kind!=='safe'||s.action==='WRAP_UP')return;
 s.eventStatus='shown';s.phase='EVENT_CHOICE';log(s,'EVENT_SHOWN','收到一条新的办公室消息。',{eventId:s.eventId});
}
export function chooseOption(s,id,option){
 if(s.phase!=='EVENT_CHOICE'||s.eventId!==id||s.eventStatus!=='shown'||![0,1].includes(option))return false;
 const cost=id==='E01'&&option===0?12:id==='E03'&&option===1?5:0;
 if(s.energy<cost)return false;
 if(cost)change(s,'energy',-cost,'处理同事或电脑问题，消耗精力');
 if(option===0){
  if(id==='E01')s.reminderToken=1;
  if(['E02','E05','E06'].includes(id)){
   const spec={E02:[6,5,-3],E05:[8,10,-4],E06:[5,6,-3]}[id];const old=target(s);
   s.modifiers.push({id,target:spec[0],win:spec[1],lose:spec[2]});log(s,'TASK_TARGET_CHANGED',`任务目标 ${old} → ${target(s)}，日末统一验收。`);
  }
  if(id==='E03'||id==='E04'){
   const dur=id==='E03'?5000:4000;if(DAY_MS-s.elapsedMs<dur)return false;
   s.action='APPROVED_REST';s.pendingAction=null;s.wrapMs=0;s.restMs=dur;s.restEnergy=id==='E03'?2:3;s.restJoy=id==='E03'?.5:.7;
  }
 }else{
  if(id==='E02')change(s,'favor',-1,'说明当前排期：好感 −1');
  if(id==='E03')change(s,'favor',1,'主动报修：好感 +1');
  if(id==='E06'){change(s,'favor',-2,'说明明天处理：好感 −2');change(s,'joy',3,'守住下班时间：快乐 +3');}
 }
 s.lastEvent=id;s.eventStatus='used';s.phase='RUNNING';log(s,'EVENT_CHOSEN','选择已生效，继续今天的节奏。',{eventId:id,option});return true;
}
function updateWarnings(s){
 // 已发出的预警永不移动；提醒券只调整尚未开始且有完整提前量的下一次真实巡视。
 if(s.reminderToken){
  const p=s.patrols.filter(p=>!p.warned&&p.start-4000>=s.elapsedMs).sort((a,b)=>a.start-b.start)[0];
  if(p){const candidate={...p,warnAt:p.start-4000};if(legal(candidate,s.patrols.filter(q=>q!==p),s.fake))p.warnAt=candidate.warnAt;}
 }
 for(const p of s.patrols){
  if(!p.warned&&s.elapsedMs>=p.warnAt){p.warned=true;
   const use=s.reminderToken&&p.start-p.warnAt===4000;if(use)s.reminderToken=0;
   log(s,'PATROL_WARNED',use?'小周提醒：有脚步声！这次有 4 秒收手。':'门外传来脚步声。先把手机收好。',{patrolId:p.id});
  }
  if(!p.started&&s.elapsedMs>=p.start&&!p.settled){p.started=true;log(s,'PATROL_STARTED',p.kind==='return'?'“对了，还有件事。”老板折返了！':'老板来了，正在看你的工作。',{patrolId:p.id});checkCaught(s,p);}
 }
 const f=s.fake;if(f){if(!f.shown&&s.elapsedMs>=f.start){f.shown=true;log(s,'PATROL_WARNED','门外传来脚步声。先把手机收好。');}if(!f.done&&s.elapsedMs>=f.end){f.done=true;log(s,'FALSE_SIGNAL','是隔壁同事路过。先松口气。');}}
}
export function tick(s){
 if(s.phase!=='RUNNING')return false;
 const p=activePatrol(s),oldEnergy=s.energy,oldSkill=skill(s),oldProgress=s.progress;
 if(p)checkCaught(s,p);
 const a=s.action;
 if(a==='WORK'){
  const efficiency=oldEnergy>=30?1:oldEnergy>0?.5:0,c=FOCUS[s.focus],balance=balanceMultiplier(s);
  s.skillXp=round(s.skillXp+.1*c.xp*efficiency*balance);s.progress=round(s.progress+.1*c.progress*efficiency*balance);s.energy=clamp(s.energy-.1*c.energy);
  if(p&&efficiency>0)p.workMs+=STEP;
  if(oldEnergy<30){s.lowEnergyMs+=STEP;if(s.lowEnergyMs>=10000){s.lowEnergyMs-=10000;s.progress=Math.max(0,round(s.progress-3));change(s,'favor',-2,'太累出错了：进度 −3，好感 −2');}}
 }else if(idle(a)){
  const oldJoy=s.joy;s.energy=clamp(s.energy+(a==='IDLE_PHONE'?.3:.2));s.joy=clamp(s.joy+(a==='IDLE_PHONE'?.07:.04));
  if(!p&&(s.energy>oldEnergy||s.joy>oldJoy))s.idleSuccessMs+=STEP;
 }else if(a==='PRETEND'){s.energy=clamp(s.energy-.02);if(p){p.pretendMs+=STEP;expose(s,p);}}
 else if(a==='WRAP_UP')s.wrapMs=Math.max(0,s.wrapMs-STEP);
 else if(a==='APPROVED_REST'){s.energy=clamp(s.energy+.1*s.restEnergy);s.joy=clamp(s.joy+.1*s.restJoy);s.restMs=Math.max(0,s.restMs-STEP);}
 s.elapsedMs+=STEP;
 for(const q of [...s.patrols])if(q.started&&!q.settled&&s.elapsedMs>=q.end)settlePatrol(s,q);
 if(a==='WRAP_UP'&&s.wrapMs===0){s.action=s.pendingAction;s.pendingAction=null;}
 if(a==='APPROVED_REST'&&s.restMs===0)s.action='WORK';
 if(s.elapsedMs>=DAY_MS){s.inputs=[];settleDay(s);return true;}
 s.joyTotal=round(s.joyTotal+s.joy);s.joyTicks++;
 if(oldEnergy>=30&&s.energy<30)log(s,'LOW_ENERGY','有点累了，工作效率降为一半。');
 if(oldEnergy>0&&s.energy===0)log(s,'NO_ENERGY','精力见底，先休息才能继续产出。');
 if(skill(s)>oldSkill)log(s,'SKILL_UP',`技能提升到 ${skill(s)} 级。`);
 if(oldProgress<target(s)&&s.progress>=target(s))log(s,'TASK_REACHED','今日目标已达到，最终在下班时结算。');
 updateWarnings(s);
 if(s.tutorial&&s.day===1){
  if(s.elapsedMs===5000&&s.tutorialStage==='work'){s.tutorialStage='think';s.phase='TUTORIAL';}
  if(s.elapsedMs===8000&&s.tutorialStage==='thinking'){s.tutorialStage='phone';s.phase='TUTORIAL';}
 }
 maybeEvent(s);return true;
}
export function tutorialNext(s,skip=false){
 if(s.phase!=='TUTORIAL')return;
 if(skip){s.tutorial=false;s.tutorialProtected=false;s.tutorialStage='done';s.tutorialDone=true;s.phase='RUNNING';return;}
 if(s.tutorialStage==='welcome')s.tutorialStage='instruction';
 else if(s.tutorialStage==='instruction'){s.tutorialStage='work';s.phase='RUNNING';}
 else if(s.tutorialStage==='think'){s.action='IDLE_THINK';s.tutorialStage='thinking';s.phase='RUNNING';}
 else if(s.tutorialStage==='phone'){s.tutorialStage='done';s.tutorialDone=true;s.phase='RUNNING';}
}
export function evaluate(s){
 const from=s.rank,level=skill(s),needSkill=from===1?3:5,needFavor=from===1?60:75;
 let kind='maintain',text='这次职级不变。下一轮继续。',failed=false;
 if(s.favor<25){
  if(s.rank>1){s.rank--;s.warningStreak=0;kind='demote';text='好感低于 25，职级下调一级。技能还在，仍有机会回来。';}
  else {s.warningStreak++;kind='warning';text='收到第一次警告。下次评估前将好感恢复到 25。';if(s.warningStreak>=2){failed=true;kind='failed';text='连续两次低好感评估。这次，带着经验重新出发。';}}
 }else{
  const had=s.warningStreak;s.warningStreak=0;
  if(s.rank<3&&level>=needSkill&&s.favor>=needFavor){s.rank++;kind='promote';text=`评估通过，晋升为${RANKS[s.rank]}！`;}
  else if(s.rank===3&&level>=5&&s.favor>=75){kind='excellent';text='本轮表现优秀。也别忘了照顾精力。';}
  else if(had)text='状态稳住了，警告已经清除。';
 }
 s.maxRank=Math.max(s.maxRank,s.rank);
 return {from,to:s.rank,kind,text,failed,level,favor:s.favor,needSkill,needFavor,skillGap:Math.max(0,needSkill-level),favorGap:Math.max(0,round(needFavor-s.favor))};
}
export function settleDay(s){
 if(s.settlement?.day===s.day)return s.settlement;
 const met=s.progress>=target(s),cfg=FOCUS[s.focus];
 const deltas=[{reason:cfg.name,value:met?cfg.win:cfg.lose},...s.modifiers.map(m=>({reason:m.id,value:met?m.win:m.lose}))];
 const beforeFavor=s.favor;change(s,'favor',deltas.reduce((v,d)=>v+d.value,0),met?'今天的任务交齐了，可以安心收工。':`任务未达标，还差 ${round(target(s)-s.progress)} 点进度。`);
 const assessment=[3,6,9].includes(s.day)?evaluate(s):null;
 const beforeRestEnergy=s.energy;const failed=assessment?.failed||false;s.completedDays=s.day;
 const result={id:`${s.runId}:day:${s.day}`,day:s.day,met,target:target(s),progress:s.progress,deltas,actualFavor:round(s.favor-beforeFavor),xpGain:round(s.skillXp-s.dayStartXp),assessment,beforeRestEnergy,afterRestEnergy:failed?s.energy:clamp(s.energy+30),applied:true,log:s.log.filter(e=>e.day===s.day&&e.type==='STAT_CHANGED')};
 result.unfinished=round(Math.max(0,result.target-s.progress));
 result.carryoverNext=failed||s.day===10?0:result.unfinished;
 s.settlement=result;s.dailyResults.push(result);
 if(failed||s.day===10)finishRun(s,failed,beforeRestEnergy);
 s.energy=result.afterRestEnergy;s.phase='DAY_RESULT';log(s,'DAY_SETTLED',met?'今天的任务交齐了，可以安心收工。':'今天没交齐。明天给任务多留一点时间。',{settlementId:result.id});return result;
}
export function finishRun(s,failed=false,beforeRestEnergy=s.energy){
 if(s.result)return s.result;
 const averageJoy=s.joyTicks?Math.round(s.joyTotal/s.joyTicks):Math.round(s.joy);
 const happiness=Math.round(s.joy*.7+beforeRestEnergy*.3),titles=[];
 if(failed)titles.push('END06');else {
  if(s.rank===3)titles.push('END01');if(s.idleSuccessMs>=120000&&s.caughtCount<=1)titles.push('END02');
  if(skill(s)>=6&&s.favor>=25&&s.favor<60)titles.push('END03');if(s.rank>=2&&happiness>=60)titles.push('END04');titles.push('END05');
 }
 s.result={runId:s.runId,configVersion:s.configVersion,demo:s.demo,failed,days:s.day,rank:s.rank,skill:skill(s),favor:s.favor,joy:s.joy,averageJoy,beforeRestEnergy,happiness,idleSuccessMs:s.idleSuccessMs,caughtCount:s.caughtCount,titles,careerScore:Math.round((s.rank-1)*25+skill(s)*3+s.favor*.2),createdAt:new Date().toISOString()};
 log(s,'RUN_FINISHED',TITLES.find(t=>t.id===titles[0]).text);return s.result;
}
export function acknowledge(s,id){
 if(!['DAY_RESULT','EVALUATION'].includes(s.phase)||s.settlement?.id!==id)return false;
 if(s.phase==='DAY_RESULT'&&s.settlement.assessment){s.phase='EVALUATION';return true;}
 if(s.result)s.phase='RUN_RESULT';else{s.carryover=s.settlement.carryoverNext;s.day++;s.phase='DAY_SETUP';s.inputs=[];}return true;
}
export function pause(s,reason='manual'){
 if(['RUNNING','EVENT_CHOICE','TUTORIAL'].includes(s.phase)){s.resumePhase=s.phase;s.phase='PAUSED';s.inputs=[];log(s,'PAUSED',reason==='background'?'已暂停，回来后点击继续。':'休息一下，时间停在这里。');return true;}return false;
}
export function resume(s){if(s.phase!=='PAUSED')return false;s.phase=s.resumePhase||'RUNNING';delete s.resumePhase;return true;}
export function demoSnapshot(kind,seed=42){
 const s=newRun({seed,demo:true});
 if(kind==='promotion'){s.day=3;s.skillXp=80;s.favor=57;confirmFocus(s,'daily');s.progress=target(s);s.elapsedMs=60000;settleDay(s);}
 else if(kind==='career'||kind==='balance'){
  s.day=10;s.rank=kind==='career'?3:2;s.skillXp=kind==='career'?240:180;s.favor=kind==='career'?88:68;s.joy=kind==='career'?45:90;s.joyTotal=s.joy*500;s.joyTicks=500;
  s.energy=kind==='career'?35:80;s.idleSuccessMs=145000;confirmFocus(s,'daily');s.progress=target(s);s.elapsedMs=60000;settleDay(s);
 }else {confirmFocus(s,'daily');s.patrols=[patrol(14500,5000,'base','demo-p1')];s.fake=null;s.elapsedMs=13000;s.patrols[0].warned=true;s.action=kind==='caught'?'IDLE_PHONE':'WORK';s.notice='演示数据：首次巡视即将开始。';}
 return s;
}
