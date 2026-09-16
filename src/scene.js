// 原生像素绘制：场景和角色均为工程内原创程序美术，可逐层替换为 sprite atlas。
import {signal} from './engine.js';
const C={ink:'#303047',wall:'#cec2bd',shadow:'#a798a6',wood:'#ce9f75',light:'#f4d3a0',skin:'#f3bd9d',hair:'#403541',shirt:'#a292c7'};
export function drawScene(canvas,s,time=0,reduced=false){
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const frame=(x,y,w,h,fill,border=C.ink,n=2)=>{r(x,y,w,h,border);r(x+n,y+n,w-n*2,h-n*2,fill);};
 const line=(x,y,x2,y2,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
 const txt=(text,x,y,size=5,color=C.ink)=>{c.fillStyle=color;c.font=`bold ${size}px "Microsoft YaHei",sans-serif`;c.fillText(text,x,y);};
 const phase=reduced?0:Math.floor(time/350)%2;
 r(0,0,240,224,C.wall);r(0,0,240,9,'#9b8f9f');r(0,9,240,3,'#e4d6c4');
 // 窗外、窗框、暖光。
 frame(7,18,76,90,'#f4d5a3','#767789',3);r(11,21,68,39,'#f6dbad');r(13,24,32,6,'#ffe9ba');r(24,29,28,4,'#ffe9ba');r(62,25,13,5,'#ffe9ba');
 r(12, sixty(),17,43,'#a6b5c1');r(30,49,22,54,'#a3a6b9');r(54,70,24,32,'#b1b6c0');r(43,42,4,7,'#a3a6b9');
 for(let x=15;x<76;x+=9)for(let y=57;y<101;y+=10)if(!(x>52&&y<72))r(x,y,3,5,'#d5d1c9');
 r(43,20,4,86,'#807d8c');r(10, sixty()+8,70,3,'#807d8c');r(5,108,81,5,'#e2d0b8');r(9,113,73,3,'#9d8990');
 // 右边门与墙上公告。
 frame(185,41,48,100,'#665369','#756775',3);r(190,46,36,92,'#f1d1a3');r(193,49,33,7,'#ffe8b9');r(205,56,21,82,'#d9b493');r(213,68,11,22,'#b5a5a2');
 r(185,43,11,98,'#9a705e');r(187,48,2,87,'#b78d74');r(192,99,3,8,'#dfc9a5');r(196,140,39,4,'#8b7e85');
 frame(99,27,60,42,'#f3e3c5','#9a8a8c',2);txt('努力工作',110,41,7);txt('快乐生活',110,53,7);txt(':)  — 行政部',114,62,4,'#8a7885');
 frame(163,17,13,13,'#fff0cf','#686076',2);r(168,21,1,5,C.ink);r(168,25,4,1,C.ink);
 // 地砖与斜阳。
 r(0,139,240,85,'#b5aaae');
 for(let y=143;y<225;y+=17){line(0,y,240,y,'#968f9f');r(0,y+1,240,1,'#d9c7b7');}
 for(let x=-70;x<310;x+=35)line(x,139,x+60,224,'#918a9c');
 c.fillStyle='#eed2a37a';c.beginPath();c.moveTo(10,115);c.lineTo(82,115);c.lineTo(172,224);c.lineTo(69,224);c.fill();
 function plant(x,y,size=1){
  const leaf=(dx,dy,w,h,color)=>r(x+dx*size,y+dy*size,w*size,h*size,color);
  leaf(-1,-20,2,23,'#65705e');leaf(-11,-17,9,5,'#668765');leaf(-13,-23,8,6,'#78936b');leaf(-8,-26,4,6,'#92a675');leaf(1,-24,9,5,'#64845f');leaf(5,-30,7,6,'#81996a');leaf(0,-31,4,9,'#77916b');leaf(1,-13,12,5,'#7c9568');leaf(10,-18,5,6,'#91a774');leaf(-9,-9,9,4,'#91a774');
  frame(x-8*size,y,17*size,16*size,'#d4c8bb','#817b8c',size);leaf(-5,2,3,11,'#ece0c9');
 }
 plant(165,121,1);plant(73,87,.6);
 // 后排同事和工位。
 r(3,120,109,7,C.ink);r(5,116,107,7,'#cca585');r(5,116,107,2,'#efd1a0');r(8,127,5,28,'#797889');r(103,126,4,27,'#797889');
 r(34,106,29,30,'#53576c');r(37,110,24,24,'#65667e');r(42,100,27,15,'#94a6be');r(43,89,23,16,C.skin);r(41,79,26,14,C.hair);r(39,83,5,13,C.hair);r(43,77,18,4,C.hair);r(63,89,4,8,C.hair);
 frame(66,91,35,23,'#9db1c2',C.ink,2);r(69,94,29,3,'#d9e0d9');for(let i=0;i<4;i++)r(70,100+i*3,19-i*3,1,'#dee2dc');r(80,114,6,4,'#565a70');r(75,118,18,2,'#565a70');
 frame(13,91,9,23,'#c4b296','#716877',1);r(25,88,7,26,'#998dba');r(27,91,3,16,'#b9a6d4');
 // 老板：预警时门边可辨识轮廓，观察时进入场景。
 const risk=s?signal(s):{kind:'safe'};
 if(risk.kind==='watching'){
  const bx=196,by=89;
  r(bx+2,by+37,7,18,'#4a4b62');r(bx+12,by+37,7,18,'#4a4b62');r(bx,by+53,10,4,C.ink);r(bx+12,by+53,10,4,C.ink);
  r(bx-2,by+14,23,26,'#a5b5cb');r(bx-5,by+17,5,20,'#879bb9');r(bx+21,by+17,5,19,'#879bb9');r(bx-5,by+35,5,5,C.skin);
  r(bx+7,by+15,4,21,C.ink);r(bx+6,by+16,6,3,'#e1d9d2');frame(bx+16,by+28,11,14,'#987d64',C.ink,1);
  r(bx,by-3,20,18,C.skin);r(bx-2,by-6,22,8,C.hair);r(bx+2,by-9,14,4,C.hair);r(bx-2,by,3,8,C.hair);
  frame(bx,by+3,8,6,C.skin,C.ink,1);frame(bx+11,by+3,8,6,C.skin,C.ink,1);r(bx+8,by+5,3,1,C.ink);r(bx+6,by+11,8,1,'#b47568');
 }
 // 主角椅子，成年职场人物。
 frame(98,135,51,62,'#626078',C.ink,3);r(106,139,34,3,'#8d829a');r(114,196,6,13,'#67667a');r(101,209,36,3,C.ink);
 const action=s?.action||'IDLE_THINK',thinking=action==='IDLE_THINK',phone=action==='IDLE_PHONE',wrap=action==='WRAP_UP',rest=action==='APPROVED_REST';
 const bob=(action==='WORK'||action==='PRETEND')?phase:0;
 r(90,144,40,42,C.shirt);r(96,143,29,6,'#c5b3dc');r(106,143,8,31,'#efddce');r(106,145,2,25,'#7a6d93');r(88,149,8,25,'#a092bf');r(125,149,10,25,'#81739e');
 const hy=109+(thinking?2:0);
 r(85,hy-7,42,42,C.hair);r(82,hy,8,32,C.hair);r(91,hy-12,29,8,C.hair);r(125,hy+1,7,31,C.hair);
 r(92,hy+4,32,30,C.skin);r(88,hy+15,6,10,'#e6a78e');r(123,hy+15,6,10,'#e6a78e');
 r(90,hy-3,33,12,C.hair);r(91,hy+6,11,9,C.hair);r(97,hy+13,4,4,C.hair);r(104,hy+5,8,8,C.hair);r(118,hy+5,8,13,C.hair);
 r(91,hy-3,5,5,'#74505a');r(96,hy-6,7,3,'#74505a');r(89,hy+9,3,13,'#644653');
 if(thinking||rest){r(100,hy+20,5,1,C.ink);r(114,hy+20,5,1,C.ink);}else{r(101,hy+18,3,5,C.ink);r(115,hy+18,3,5,C.ink);r(102,hy+18,1,1,'#fff0d9');r(116,hy+18,1,1,'#fff0d9');}
 r(96,hy+25,5,2,'#e8988d');r(119,hy+25,4,2,'#e8988d');r(108,hy+28,5,1,'#9f6b68');r(106,hy+34,9,7,C.skin);
 // 前景桌子 / 显示器 / 键盘。
 r(0,180,240,44,'#997d76');r(0,177,240,29,C.wood);r(0,177,240,3,'#ebc598');r(0,205,240,4,'#725e67');r(9,209,8,15,'#615968');r(215,209,8,15,'#615968');
 for(let i=0;i<7;i++)r(5+i*35,183+(i%3)*5,20,1,'#dcb589');
 r(84,170+bob,22,7,C.skin);r(118,169+bob,17,7,C.skin);
 frame(61,181,63,12,'#737384',C.ink,2);for(let x=65;x<119;x+=6)for(let y=184;y<190;y+=4)r(x,y,4,2,'#b9b0b3');r(80,190,24,1,'#c5b8b2');
 frame(12,136,66,49,'#58596f',C.ink,3);r(16,140,58,39,'#67667b');r(19,143,3,30,'#7c7a8c');r(39,185,10,9,C.ink);r(26,194,38,4,C.ink);
 frame(52,151,16,19,'#f0cd84','#d4ab73',1);txt('加油',55,158,5,'#695a65');txt(':)',57,165,6,'#695a65');
 if(phone||wrap){const py=wrap?167+Math.floor((1200-(s?.wrapMs||0))/200):163;frame(106,py,15,22,'#67718e',C.ink,2);r(110,py+3,7,12,'#adc6c6');r(111,py+17,4,1,'#dacdcc');r(101,py+10,6,5,C.skin);r(119,py+9,7,5,C.skin);}
 if(action==='PRETEND'){frame(119,155-bob*2,19,23,'#f3e4ce',C.ink,1);for(let i=0;i<4;i++)r(122,160+i*4-bob*2,12-i,1,'#a69dac');}
 if(thinking){r(130,119,3,3,'#fff0ce');r(137,112,4,4,'#fff0ce');txt('…',142,106,9,'#77667c');}
 frame(161,184,35,15,'#e9d5b8','#95808b',1);r(165,181,35,14,'#fbebd0');for(let i=0;i<4;i++)r(169,184+i*2,22-i*2,1,'#b9a6a7');
 frame(144,175,13,19,'#eadac5','#6c6274',2);frame(156,179,6,10,C.wood,'#6c6274',2);r(147,176,7,2,'#937266');txt('休',147,186,5,'#6c6274');
 if(rest){r(146,166-phase*3,1,5,'#fff1d2');r(151,162+phase*2,1,6,'#fff1d2');}
 plant(12,185,1.3);frame(220,184,15,22,'#9ba8b8',C.ink,2);r(222,171,2,18,'#ead3ad');r(226,169,2,20,'#676a90');r(230,173,2,16,'#b67d87');
 function sixty(){return 60;}
}
