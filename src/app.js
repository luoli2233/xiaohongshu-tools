import {FOCUS,RANKS,ACTIONS,TITLES,EVENTS,STEP,VERSION,weekday} from './config.js';
import {createMusic} from './music.js';
const music=createMusic();
document.getElementById('sound').textContent='音乐 / 音效：开';
import {newRun,confirmFocus,tick,queueAction,skill,target,signal,balanceMultiplier,chooseOption,acknowledge,pause,resume,tutorialNext,demoSnapshot,settleDay} from './engine.js';
import {readRun,saveRun,readProfile,saveProfile,recordResult,recordMessage,rawSave} from './storage.js';
const $=id=>document.getElementById(id),dialog=$('modal');
const debug=new URLSearchParams(location.search).get('debug')==='1';
let store;try{store=localStorage;}catch{store={getItem:()=>null,setItem:()=>{throw Error('浏览器禁止本地存储');}};}
let profile=readProfile(store),loaded=readRun(store),run=null,screen='MENU',idleMode='IDLE_THINK',selectedFocus='daily',selectedTitle='',unlockedThisRun=[],lastModal='',lastNotice='',lastAudioCue='',accumulator=0,lastTime=performance.now(),savedAt=-1,savedRevision=-1,sound=true,audio=null,lastFocus=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v).toFixed(1);
const btn=(label,cmd,cls='primary',attrs='')=>`<button class="${cls}" data-cmd="${cmd}" ${attrs}>${label}</button>`;
const row=(a,b)=>`<div class="modal-row"><span>${a}</span><strong>${b}</strong></div>`;
const heading=(kicker,title)=>`<div class="modal-kicker">${kicker}</div><h2 id="modal-title" class="modal-heading">${title}</h2>`;
function storageError(){if($('storage-error'))return;const el=document.createElement('div');el.id='storage-error';el.className='storage-banner';el.textContent='存档写入失败。当前仍可游玩，请在暂停页导出日志与快照。';document.body.append(el);}
function persist(){
 if(!run||run.demo)return;
 try{
  saveRun(store,run);loaded={run:structuredClone(run),error:null};
  if(run.tutorialDone)profile.tutorialCompleted=true;
  if(run.result){unlockedThisRun=run.result.titles.filter(id=>!profile.unlockedTitles.includes(id));recordResult(profile,run.result);}
  saveProfile(store,profile);savedAt=run.elapsedMs;savedRevision=run.revision;
 }catch{storageError();}
}
function openModal(content,key){
 if(lastModal===key&&dialog.open)return;
 const wasOpen=dialog.open;lastModal=key;
 if(!wasOpen)lastFocus=document.activeElement;
 $('modal-content').innerHTML=content;
 if(run?.phase==='DAY_SETUP'&&run.carryover)$('modal-content').insertAdjacentHTML('afterbegin',`<p class="inline-note">${weekday(run.day)} · 昨日结转 ${n(run.carryover)} 点，叠加到今天所选任务。</p>`);
 if(run?.phase==='DAY_RESULT')$('modal-content').insertAdjacentHTML('afterbegin',`<p class="inline-note">${run.result?`本局未完成：${n(run.settlement.unfinished)} 点。已结束，不再结转。`:`结转下一工作日：${n(run.settlement.carryoverNext)} 点（${weekday(run.day+1)}）。`}</p>`);
 dialog.classList.toggle('event-modal',run?.phase==='EVENT_CHOICE');
 if(run?.phase==='EVENT_CHOICE'){
  const e=EVENTS[run.eventId],panel=document.createElement('div');panel.className='event-scene';
  const img=document.createElement('img');img.src=`assets/${e.art}.jpg`;img.alt=e.title;panel.appendChild(img);
  $('modal-content').insertBefore(panel,$('modal-content').firstChild);
 }
 if(!wasOpen)dialog.showModal();
 queueMicrotask(()=>{const el=dialog.querySelector('button:not(:disabled),input');el?.focus({preventScroll:true});});
}
function closeModal(){if(dialog.open){dialog.close();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}lastModal='';}
function menu(){
 const save=loaded.run;
 return heading('A LITTLE WORK. A LITTLE JOY.','今天，<br>也要快乐下班。')+`<div class="menu-fish" aria-hidden="true">&gt;&lt;((°&gt; ─ ─</div><p class="modal-copy">在认真工作和偷偷放松之间，<br>找到属于你的节奏。老板可随时会来。</p><div class="ticket"><div><b>10</b><span>个工作日</span></div><div><b>60s</b><span>每日有效时间</span></div><div><b>6</b><span>种结局称号</span></div></div>`+
  (loaded.error?`<p class="error">${escape(loaded.error)}</p>`+btn('导出原始存档','backup','secondary'):'')+
  (save?btn(save.result?'查看上局结果':`继续 · 第 ${save.day} 天`,'continue'):'')+
  btn(save?'开始新的一局':'打卡上班 →','new',save?'secondary':'primary')+
  btn('我的称号与记录','records','secondary')+
  `<p class="inline-note">点选持续动作，无需长按。可以随时暂停。<br>本机自动存档 · 不需要登录</p>`+
  (debug?btn('开发演示台','debug','secondary'):'');
}
function setup(){
 const next=[3,6,9].find(d=>d>=run.day);
 return heading(`DAY ${String(run.day).padStart(2,'0')} / 10`,run.day===1?'新的一天，选个节奏。':'今天，把节奏找回来。')+
  `<p class="modal-copy">${RANKS[run.rank]} · 精力 ${n(run.energy)} · 技能 ${skill(run)}<br>${next?`下次评估：第 ${next} 天日末`:'今天是最后一个工作日'}</p>`+
  Object.entries(FOCUS).map(([id,f])=>`<button class="choice ${selectedFocus===id?'selected':''}" data-focus="${id}" aria-pressed="${selectedFocus===id}" ${run.tutorial&&run.day===1&&id!=='daily'?'disabled':''}><b>${f.name}</b><small>${f.subtitle}<br>目标 ${f.target+(run.rank-1)*3+run.carryover} · 达标好感 +${f.win} / 未达标 ${f.lose}<br>每秒：经验 +${f.xp} · 进度 +${f.progress} · 精力 −${f.energy}</small></button>`).join('')+
  btn('确认重点，开始上班 →','start-day')+(run.tutorial&&run.day===1?'<p class="inline-note">首局教学先从日常工作开始。</p>':'');
}
function tutorial(){
 const copy={welcome:['欢迎入职。','先把今天的事做好，也记得给自己留口气。工作提供成长，摸鱼恢复精力和快乐。','认识一下工位'],instruction:['点一下，就会持续工作。','不用一直按。先工作 5 秒，看看技能和精力的变化。','努力工作'],think:['本事在涨，电量在掉。','工作 5 秒完成！现在试试发呆 3 秒，让精力缓一缓。','放空一下'],phone:['精力回来了。','手机每秒恢复更快，但收手需要 1.2 秒；发呆只需 0.2 秒。听到脚步声，记得提前收好。','明白了，继续']};
 const a=copy[run.tutorialStage]||copy.welcome;return heading('FIRST DAY GUIDE',a[0])+`<p class="modal-copy">${a[1]}</p>`+btn(a[2],'tutorial-next')+btn('跳过教学（取消首次保护）','tutorial-skip','secondary');
}
function eventView(){
 const e=EVENTS[run.eventId];return heading('OFFICE MESSAGE',e.title)+`<p class="modal-copy">${e.text}</p><span class="badge">时间已暂停，选好再继续</span>`+e.options.map((o,i)=>{const disabled=run.energy<(o.cost||0)||60000-run.elapsedMs<(o.rest||0);return btn(`${o.label}<small>${o.detail}${disabled?`<br>精力或剩余时间不足，无法选择`:''}</small>`,`event-${i}`,'choice',disabled?'disabled':'');}).join('');
}
function goalView(){
 const need=run.rank===1?[3,60]:[5,75];return heading('CAREER CHECKPOINT','成长，也要被看见。')+`<p class="modal-copy">第 3、6、9 天日末进行评估。${run.rank===3?'已是最高职级，以下为优秀门槛。':'两项同时达标，才能晋升。'}</p>`+row('当前职级',RANKS[run.rank])+row('技能门槛',`${skill(run)} / ${need[0]} · 差 ${Math.max(0,need[0]-skill(run))} 级`)+row('老板好感',`${n(run.favor)} / ${need[1]} · 差 ${n(Math.max(0,need[1]-run.favor))}`)+row('低好感警告',`${run.warningStreak} / 2`)+`<p class="inline-note">正式评估时好感低于 25 会降职或警告。技能不足可多选学习进修；好感不足可通过真实工作巡视认可和交付提升。</p>`+btn('回到工位','close-overlay');
}
function dayResult(){
 const d=run.settlement;return heading(`DAY ${String(run.day).padStart(2,'0')} / CLOCK OUT`,d.met?'今日任务，顺利交付！':'辛苦了，先下班吧。')+row('今日交付',`${n(d.progress)} / ${d.target}`)+row('技能成长',`经验 +${n(d.xpGain)}`)+d.deltas.map(m=>row(m.reason.startsWith('E')?EVENTS[m.reason].title:m.reason,`好感 ${m.value>=0?'+':''}${m.value}`)).join('')+row('实际任务好感变化',`${d.actualFavor>=0?'+':''}${n(d.actualFavor)}`)+row('下班恢复精力',`${n(d.beforeRestEnergy)} → ${n(d.afterRestEnergy)}`)+`<p class="inline-note">${d.met?'交付和成长都已记下。':'未达标差 '+n(d.target-d.progress)+' 点进度，明天给任务多留一点时间。'}${run.day===10?' 最终幸福感使用下班恢复前精力。':''}</p><details><summary class="inline-note">今天的奖惩明细（${d.log.length} 条）</summary><ul class="log-list">${d.log.map(e=>`<li>${n(e.time/1000)}s · ${escape(e.text)}${e.key==='favor'?`（${n(e.before)} → ${n(e.after)}）`:''}</li>`).join('')}</ul></details>`+btn(d.assessment?'查看职级评估 →':run.result?'看看我的结局 →':'迎接下一天 →','ack');
}
function assessment(){
 const a=run.settlement.assessment;return heading('CAREER REVIEW / DAY '+run.day,a.kind==='promote'?'新的职级，新的开始。':a.failed?'这段旅程，先到这里。':'这一次的职场答卷。')+`<p class="modal-copy">${a.text}</p>`+row('职级变化',`${RANKS[a.from]} → ${RANKS[a.to]}`)+row('技能门槛',`${a.level} / ${a.needSkill} · 还差 ${a.skillGap} 级`)+row('好感门槛',`${n(a.favor)} / ${a.needFavor} · 还差 ${n(a.favorGap)}`)+`<p class="inline-note">${a.skillGap?'可以多选学习进修，积累真实经验。':''}${a.favorGap?'试试紧急任务或巡视时认真工作，让成果被看见。':''}<br>下一天才使用新职级的任务和巡视安排。</p>`+btn(run.result?'查看本局结局 →':'下一天 →','ack');
}
function resultView(){
 const r=run.result;if(!r.titles.includes(selectedTitle))selectedTitle=r.titles[0];const t=TITLES.find(t=>t.id===selectedTitle);
 const prompts={END01:'你做过哪个让自己真正成长的选择？',END02:'你有哪些不耽误正事的摸鱼诀窍？',END03:'你如何在低调和专业之间找到位置？',END04:'你怎样平衡工作、学业和自己的生活？',END05:'今天有什么值得好好下班的理由？',END06:'如果重新开始，你会先调整哪一步？'};
 const joyReview=r.averageJoy<25?'这十天你的平均快乐偏低。能坚持下来已经不容易，下一局可以少背一点压力，把休息也当成正经策略。':r.averageJoy<55?'你的平均快乐还在恢复区。你已经在试着找节奏了，偶尔慢一点不是退步，是给自己留余量。':'你的平均快乐很稳。会交付，也会照顾自己，这种节奏值得夸一句：很会过日子。';
 const unlocked=unlockedThisRun.includes(selectedTitle)?'<span class="badge">新称号已解锁</span>':'';
 return heading(r.demo?'DEMO / 演示数据':'YOUR OFFICE STORY',t.name)+unlocked+`<p class="modal-copy">${t.text}</p><div class="ticket"><div><b>${r.careerScore}</b><span>职场成绩 / 100</span></div><div><b>${r.happiness}</b><span>打工幸福感 / 100</span></div><div><b>${r.averageJoy}</b><span>平均快乐 / 100</span></div></div>`+row('最终身份',`${RANKS[r.rank]} · 技能 ${r.skill}`)+row('成功摸鱼',`${n(r.idleSuccessMs/1000)} 秒`)+row('完成工作日 / 被抓',`${r.days} 天 / ${r.caughtCount} 次`)+`<p class="inline-note">${joyReview}</p><p class="inline-note">选择展示称号，再留下一句你的经验。</p><div class="tag-grid">${r.titles.map(id=>`<button data-title="${id}" class="${id===selectedTitle?'selected':''}">${TITLES.find(t=>t.id===id).name}</button>`).join('')}</div><label class="inline-note" for="experience">${prompts[selectedTitle]}</label><textarea id="experience" class="experience" maxlength="120" placeholder="写下你的答案，最多 120 字"></textarea>`+btn('留下留言','leave-message','secondary')+btn('再来一局，换个活法 →','new')+btn('返回首页','home','secondary');
}
function records(){const messages=(profile.messages||[]).slice(0,5).map(m=>row('留言',`<span style="font-weight:400">${escape(m.text)}</span>`)).join('');return heading('YOUR COLLECTION','每一种活法，都值得记住。')+TITLES.map(t=>row((profile.unlockedTitles.includes(t.id)?'已解锁 · ':'未解锁 · ')+t.name,`<span style="font-weight:400">${t.condition}</span>`)).join('')+(messages?`<p class="inline-note">最近留言</p>${messages}`:'')+`<p class="inline-note">个人最佳按完整正式局的职场成绩比较。${profile.bestCompletedRun?`最高 ${profile.bestCompletedRun.careerScore} 分，幸福感 ${profile.bestCompletedRun.happiness}。`:'完成第一局后，最佳记录会出现在这里。'}<br>已记录 ${profile.history.length} 局（本机最近 100 局）。</p>`+btn('回到首页','home');}
function debugView(){return heading('DEVELOPMENT ONLY','开发演示台')+`<p class="modal-copy">所有快照均标记演示数据。正式存档和个人纪录不会被覆盖。</p><label class="inline-note" for="seed">固定随机种子</label><input id="seed" class="debug-input" type="number" value="42"><div class="debug-grid">${[['safe','安全巡视'],['caught','手机被抓'],['promotion','第 3 天晋升'],['career','晋升路线结局'],['balance','幸福路线结局'],['practice','完整练习局']].map(([id,label])=>btn(label,'demo-'+id,'secondary')).join('')}</div>`+(run?.demo?`<div class="debug-grid"><label class="inline-note">工作日<input id="debug-day" class="debug-input" type="number" min="1" max="10" value="${run.day}"></label><label class="inline-note">精力<input id="debug-energy" class="debug-input" type="number" min="0" max="100" value="${run.energy}"></label><label class="inline-note">经验<input id="debug-xp" class="debug-input" type="number" min="0" value="${run.skillXp}"></label><label class="inline-note">好感<input id="debug-favor" class="debug-input" type="number" min="0" max="100" value="${run.favor}"></label></div>`+btn('按以上属性建立演示日','demo-custom','secondary')+btn('模拟当前日末','demo-end','secondary')+btn('导出快照和日志','export','secondary'):'')+btn('返回首页','home','secondary');}
function renderModal(){
 const phase=screen||run?.phase;
 if(phase==='RUNNING'){closeModal();return;}
 const key=`${phase}:${run?.day||0}:${phase==='TUTORIAL'?run.tutorialStage:''}:${phase==='DAY_SETUP'?selectedFocus:''}:${phase==='RUN_RESULT'?selectedTitle:''}`;
 if(lastModal===key&&dialog.open)return;
 let content='';
 if(phase==='MENU')content=menu();
 else if(phase==='OVERWRITE')content=heading('A FRESH START','重新开始这一局？')+`<p class="modal-copy">新的正式局会覆盖当前进度，已解锁称号保留。</p>`+btn('确认，开始新局','confirm-new')+btn('保留进度，返回','cancel-new','secondary');
 else if(phase==='RECORDS')content=records();
 else if(phase==='DEBUG')content=debugView();
 else if(phase==='GOAL')content=goalView();
 else if(phase==='DAY_SETUP')content=setup();
 else if(phase==='TUTORIAL')content=tutorial();
 else if(phase==='EVENT_CHOICE')content=eventView();
 else if(phase==='DAY_RESULT')content=dayResult();
 else if(phase==='EVALUATION')content=assessment();
 else if(phase==='RUN_RESULT')content=resultView();
 else if(phase==='PAUSED')content=heading('TAKE A BREATHER','暂停一下，也没关系。')+`<p class="modal-copy">第 ${run.day} 天 · 已过 ${n(run.elapsedMs/1000)} 秒<br>当前动作：${ACTIONS[run.action]}<br>时间、收益和老板巡视都已暂停。</p>`+btn('继续上班 →','resume')+btn('保存并回到首页','home','secondary')+btn('导出快照和日志','export','secondary')+(debug?btn('打开开发演示台','debug','secondary'):'')+btn('重新开始','new','secondary');
 if(content)openModal(content,key);
}
function render(){
 const s=run||newRun({demo:true});
 document.querySelector('.room-label').textContent=`工位 008 / 第 ${s.day} 天 · ${weekday(s.day)}也要快乐`;
 $('day-label').textContent=run?`第 ${s.day} 天 / 10 天 · ${RANKS[s.rank]}${s.demo?' · 演示':''}`:'打工人的快乐生存指南';
 $('timer').textContent=run?`下班 ${n((60000-s.elapsedMs)/1000)}s`:'10 DAYS';
 for(const k of ['energy','joy']){$(k).textContent=n(s[k]);$(k+'-bar').style.width=s[k]+'%';}
 $('favor').textContent=Math.floor(s.favor);$('favor-bar').style.width=s.favor+'%';$('skill').textContent='Lv.'+skill(s);
 $('xp-label').textContent=skill(s)===10?'已满级':`${Math.floor(s.skillXp%40)} / 40`;$('skill-bar').style.width=skill(s)===10?'100%':s.skillXp%40/40*100+'%';
 const balance=balanceMultiplier(s);$('task-name').textContent=`今日任务 / ${FOCUS[s.focus].name}${balance>1?' · 状态协同 ×'+balance.toFixed(2):''}`;$('task-value').textContent=`${n(s.progress)} / ${target(s)}`;$('task-bar').style.width=Math.min(100,s.progress/target(s)*100)+'%';
 const risk=signal(s);$('risk').className='risk '+risk.kind;
 const recentPatrol=s.patrols&&s.patrols.find(p=>p.started&&!p.settled&&(p.caught||p.exposed));
 const eventArt=run?.phase==='EVENT_CHOICE'?EVENTS[run.eventId]?.art:s.action==='APPROVED_REST'?EVENTS[s.lastEvent]?.art:null;
 const art=!run?'home':eventArt?eventArt:recentPatrol?(recentPatrol.caught?'caught':'exposed'):risk.kind==='watching'?'boss':s.action==='WORK'?'work':s.action==='IDLE_PHONE'?'phone':s.action==='PRETEND'?'pretend':s.action==='WRAP_UP'?'wrap':'think';
 const artEl=$('scene-art'),artSrc='assets/'+art+'.jpg';if(artEl.getAttribute('src')!==artSrc)artEl.setAttribute('src',artSrc);
 $('risk-text').textContent=risk.kind==='warning'?`有脚步声 · ${n(risk.remaining/1000)} 秒后靠近`:risk.kind==='watching'?`老板观察中 · ${n(risk.remaining/1000)} 秒`:s.action==='PRETEND'?'正在假装很忙 · 可能被看穿':'暂时风平浪静 · 把握自己的节奏';
 $('speech').textContent=s.notice;
 $('speech').hidden=s.action==='WRAP_UP';
 $('action-label').textContent=s.action==='WRAP_UP'?'':s.action==='APPROVED_REST'?`获准休息 · ${n(s.restMs/1000)}s`:s.action==='PRETEND'?'假装很忙 · 低收益但可能被识破':s.reminderToken?'提醒券 ×1 · 下次提前提醒':ACTIONS[s.action];
 if(s.carryover)$('task-name').textContent+=` · 含结转 ${n(s.carryover)}`;
 const locked=!!screen||s.phase!=='RUNNING'||['WRAP_UP','APPROVED_REST'].includes(s.action);
 for(const b of document.querySelectorAll('[data-action]')){b.disabled=locked;b.setAttribute('aria-pressed',String(s.action===b.dataset.action));}
 $('idle-action').disabled=locked;$('idle-action').setAttribute('aria-pressed',String(s.action.startsWith('IDLE')));
 for(const b of document.querySelectorAll('[data-mode]')){b.disabled=locked;b.setAttribute('aria-pressed',String(idleMode===b.dataset.mode));}
 $('pause').disabled=!run||!!screen||s.phase!=='RUNNING';$('goal').disabled=!run||!!screen||s.phase!=='RUNNING';
 if(lastNotice!==s.notice){lastNotice=s.notice;$('live').textContent=s.notice;}
 const cue=(run&&run.phase==='EVENT_CHOICE')?'event':(run&&run.phase==='DAY_RESULT')?'clockout':(run&&run.phase==='EVALUATION'&&run.settlement.assessment.kind==='promote')?'promotion':recentPatrol&&recentPatrol.caught?'caught':risk.kind==='warning'?'warning':s.action==='WRAP_UP'?'wrap':'';
 if(cue&&cue!==lastAudioCue)playSfx(cue);lastAudioCue=cue;
 renderModal();
}
function beginNew(){run=newRun({tutorial:!profile.tutorialCompleted});selectedFocus='daily';screen=null;savedAt=-1;savedRevision=-1;accumulator=0;persist();}
function showCopyable(title,data){const value=typeof data==='string'?data:JSON.stringify(data,null,2);openModal(heading('COPY DATA',title)+`<p class="modal-copy">长按或全选下方内容后复制保存。</p><textarea id="copy-data" class="copy-data" readonly>${escape(value)}</textarea>`+btn('返回','copy-close','secondary'),'COPY_DATA');const field=$('copy-data');if(field){field.focus();field.select();}}
function leaveMessage(){
 const message=$('experience')?.value.trim();
 if(!run.demo&&recordMessage(profile,message))saveProfile(store,profile);
 run=null;loaded=readRun(store);screen='MENU';lastModal='';render();
}
function command(cmd){
 if(cmd==='new'){if(loaded.run){screen='OVERWRITE';}else beginNew();}
 else if(cmd==='confirm-new')beginNew();
 else if(cmd==='cancel-new')screen='MENU';
 else if(cmd==='continue'){run=structuredClone(loaded.run);if(run.phase==='RUNNING')pause(run,'background');screen=null;selectedFocus=run.focus;accumulator=0;}
 else if(cmd==='start-day'){confirmFocus(run,selectedFocus);accumulator=0;persist();}
 else if(cmd==='tutorial-next'||cmd==='tutorial-skip'){tutorialNext(run,cmd==='tutorial-skip');persist();accumulator=0;}
 else if(cmd.startsWith('event-')){chooseOption(run,run.eventId,Number(cmd.slice(-1)));persist();accumulator=0;}
 else if(cmd==='ack'){acknowledge(run,run.settlement.id);selectedFocus='daily';persist();}
 else if(cmd==='resume'){resume(run);accumulator=0;lastTime=performance.now();}
 else if(cmd==='home'){if(run){pause(run);persist();}screen='MENU';loaded=readRun(store);}
 else if(cmd==='records')screen='RECORDS';
 else if(cmd==='debug'&&debug){if(run)pause(run);screen='DEBUG';}
 else if(cmd==='close-overlay'){screen=null;resume(run);accumulator=0;lastTime=performance.now();}
 else if(cmd==='export')showCopyable('本局快照和日志',{exportVersion:1,run,log:run?.log});
 else if(cmd==='backup')showCopyable('原始存档备份',rawSave(store));
 else if(cmd==='copy-close'){lastModal='';render();}
 else if(cmd==='leave-message'){leaveMessage();return;}
 else if(cmd.startsWith('demo-')&&debug){
  const seed=Number($('seed')?.value||42)>>>0,kind=cmd.slice(5);
  if(kind==='end'){if(run?.demo){settleDay(run);screen=null;}}
  else if(kind==='custom'&&run?.demo){
   const vals=['day','energy','xp','favor'].map(k=>Number($('debug-'+k).value));
   if(vals.some(v=>!Number.isFinite(v)))return;
   run=newRun({demo:true,seed});run.day=Math.max(1,Math.min(10,Math.floor(vals[0])));run.energy=Math.max(0,Math.min(100,vals[1]));run.skillXp=Math.max(0,vals[2]);run.favor=Math.max(0,Math.min(100,vals[3]));screen=null;selectedFocus='daily';
  }else{run=kind==='practice'?newRun({demo:true,seed}):demoSnapshot(kind,seed);screen=null;selectedFocus='daily';}
  accumulator=0;
 }
 lastModal='';render();
}
function blip(){if(!sound)return;try{audio ||=new AudioContext();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='square';osc.frequency.value=440;gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.07);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.08);}catch{/* 音频不可用不影响规则。 */}}
function playSfx(name){if(!sound)return;blip();}
function startMusic(){music.start();}
function toggleSound(){sound=!sound;music.setEnabled(sound);$('sound').textContent='音乐 / 音效：'+(sound?'开':'关');$('sound').setAttribute('aria-pressed',String(sound));if(sound)blip();}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;startMusic();blip();
 if(b.dataset.cmd)command(b.dataset.cmd);
 if(b.dataset.focus){selectedFocus=b.dataset.focus;lastModal='';render();}
 if(b.dataset.title){selectedTitle=b.dataset.title;lastModal='';render();}
 if(b.dataset.action&&run){queueAction(run,b.dataset.action);persist();render();}
 if(b.dataset.mode&&run){idleMode=b.dataset.mode;if(run.action.startsWith('IDLE'))queueAction(run,idleMode);persist();render();}
});
$('idle-action').addEventListener('click',()=>{if(run){queueAction(run,idleMode);persist();render();}});
$('pause').addEventListener('click',()=>{pause(run);accumulator=0;persist();render();});
$('goal').addEventListener('click',()=>{pause(run);persist();screen='GOAL';render();});
$('sound').addEventListener('click',toggleSound);
dialog.addEventListener('cancel',e=>{e.preventDefault();if(screen==='GOAL')command('close-overlay');else if(run?.phase==='PAUSED'&&!screen)command('resume');});
document.addEventListener('keydown',e=>{
 startMusic();
 if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||screen||dialog.open||!run)return;
 const map={'1':'WORK','2':idleMode,'3':'PRETEND','4':'IDLE_THINK','5':'IDLE_PHONE'};
 if(map[e.key]){e.preventDefault();queueAction(run,map[e.key]);persist();render();}
 if(e.key==='Escape'||e.key.toLowerCase()==='p'){pause(run);persist();render();}
});
function background(){music.stop();if(run){pause(run,'background');accumulator=0;persist();render();}lastTime=performance.now();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else lastTime=performance.now();});
window.addEventListener('blur',background);window.addEventListener('pagehide',background);
function frame(now){
 const delta=now-lastTime;lastTime=now;
 if(run&&!screen&&run.phase==='RUNNING'){
  accumulator+=delta;let count=0;
  while(accumulator>=STEP&&run.phase==='RUNNING'&&count<600){tick(run);accumulator-=STEP;count++;}
  if(run.phase!=='RUNNING')accumulator=0;
  if(run.elapsedMs-savedAt>=2000||run.revision!==savedRevision)persist();
  if(count)render();
 }else accumulator=0;
 requestAnimationFrame(frame);
}
if(debug){window.officeDebug={getState:()=>structuredClone(run),getProfile:()=>structuredClone(profile),snapshot:(kind,seed=42)=>{run=demoSnapshot(kind,seed);screen=null;render();},advance:steps=>{if(!run?.demo)throw Error('Only demo can advance');for(let i=0;i<steps;i++)tick(run);render();},command};}
render();requestAnimationFrame(frame);
