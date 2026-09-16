// 单位：时间统一使用毫秒；动作配置为每秒最终速率，不重复乘倍率。
export const VERSION = '0.5-r1';
export const weekday = day => ['周一','周二','周三','周四','周五','周六'][(day-1)%6];
export const STEP = 100;
export const DAY_MS = 60000;
export const RANKS = ['','初级员工','熟练员工','项目负责人'];
export const ACTIONS = { WORK:'努力工作', IDLE_THINK:'放空一下', IDLE_PHONE:'刷会儿手机', PRETEND:'假装很忙', WRAP_UP:'正在收好', APPROVED_REST:'获准休息' };
export const FOCUS = {
  daily: {name:'日常工作', subtitle:'稳稳交付，留点余地', xp:1, progress:1, energy:1.5, target:24, win:3, lose:-4},
  study: {name:'学习进修', subtitle:'多长本事，慢一点交付', xp:1.4, progress:.6, energy:1.5, target:14, win:1, lose:-2},
  urgent: {name:'紧急任务', subtitle:'冲一把，让成果被看见', xp:.8, progress:1.2, energy:1.95, target:28, win:7, lose:-6},
};
export const PATROLS = {1:{anchors:[14500,31000,47000],duration:5000},2:{anchors:[20000,43000],duration:6000},3:{anchors:[30000],duration:7000}};
export const EVENT_PLANS={2:['E01','E03'],3:['E02','E04'],4:['E04','E05'],5:['E06'],6:['E01','E02'],7:['E03','E05'],8:['E01','E04'],9:['E02','E03'],10:['E06']};
export const TITLES = [
  {id:'END01',name:'升职机器',condition:'完成十天，成为项目负责人',text:'一路晋升。你把一次次选择变成了被看见的成果。'},
  {id:'END02',name:'带薪摸鱼大师',condition:'完成十天，成功摸鱼 ≥120秒，被抓 ≤1次',text:'活干了，鱼也摸了。节奏刚刚好。'},
  {id:'END03',name:'低调技术骨干',condition:'完成十天，技能 ≥6，好感 ≥25 且 <60',text:'能力在线，存在感随缘。'},
  {id:'END04',name:'职场平衡大师',condition:'完成十天，职级 ≥2，幸福感 ≥60',text:'成长没有落下，快乐也有着落。你找到了能长久坚持的节奏。'},
  {id:'END05',name:'今日平安下班',condition:'完整完成十个工作日',text:'这十天辛苦了。顺利收工，也值得记一笔。'},
  {id:'END06',name:'重新出发',condition:'初级员工连续两次低好感评估',text:'带上经验，下一次重新安排节奏。'},
];
export const EVENTS = {
 E01:{title:'同事的表格快到截止时间了',art:'event-e01',text:'小周挪过椅子：“这张表越改越不对，你能帮我看一眼吗？下次老板来，我提前报信。”',options:[{label:'帮他理一遍',cost:12,detail:'精力 −12 · 获得一张提醒券'},{label:'先顾自己的任务',detail:'无属性变化'}]},
 E02:{title:'老板说“顺手加一点”',art:'event-e02',text:'新附件落进聊天框。接下它可能成为表现机会，也会压缩今天留给自己的空间。',options:[{label:'接下挑战，一起交付',detail:'目标 +6 · 达标好感 +5，否则 −3'},{label:'摆出排期，守住边界',detail:'好感 −1 · 不增加目标'}]},
 E03:{title:'电脑先进入了休息状态',art:'event-e03',text:'加载图标转了一圈又一圈。你点了一下，它好像转得更认真了。',options:[{label:'等它缓一缓',detail:'获准休息 5秒 · 精力共 +10 · 快乐共 +2.5',rest:5000},{label:'主动报修',cost:5,detail:'精力 −5 · 好感 +1'}]},
 E04:{title:'群里有人喊下午茶',art:'event-e04',text:'“茶水间有点心，来晚了只剩纸盒。”你抬头看了看今天的任务。',options:[{label:'去拿一份',rest:4000,detail:'获准休息 4秒 · 精力共 +12 · 快乐共 +2.8'},{label:'这次先不去了',detail:'无属性变化'}]},
 E05:{title:'关键任务点名了你',art:'event-e05',text:'这是一次能力证明，也是一场精力豪赌。你可以争取被看见，也可以把已有承诺稳稳交付。',options:[{label:'接住机会，让成果说话',detail:'目标 +8 · 达标好感 +10，否则 −4'},{label:'先把承诺的事情做好',detail:'无属性变化'}]},
 E06:{title:'下班前的新消息',art:'event-e06',text:'距离下班已经不远。“这个今天能不能再推进一下？”你看向右上角的倒计时。',options:[{label:'再冲一下',detail:'目标 +5 · 日末达标额外好感 +6，否则 −3'},{label:'说明明天处理',detail:'好感 −2 · 快乐 +3'}]},
};
