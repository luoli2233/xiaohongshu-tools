// Locally synthesized, low-volume pentatonic loop; no audio assets or network.
export function createMusic(){
 let ctx=null,timer=null,next=0,beat=0,enabled=true;
 const voices=new Set(),notes=[72,76,79,76,74,77,81,77,72,76,79,83,74,77,79,0];
 function tone(midi,time,length,volume,type='triangle'){
  if(!midi)return;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.value=440*Math.pow(2,(midi-69)/12);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.02);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  osc.connect(gain);gain.connect(ctx.destination);voices.add(osc);
  osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(time);osc.stop(time+length+.02);
 }
 function schedule(){
  if(!enabled||document.hidden||ctx.state!=='running')return;
  if(next<ctx.currentTime)next=ctx.currentTime+.04;
  while(next<ctx.currentTime+.2){tone(notes[beat%16],next,.34,.035);if(beat%4===0)tone([48,53,48,55][Math.floor(beat/4)%4],next,1.3,.025,'sine');next+=.375;beat++;}
 }
 function stop(){clearInterval(timer);timer=null;for(const osc of voices){try{osc.stop();}catch{}}voices.clear();}
 function start(){
  if(!enabled||document.hidden)return;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx=ctx||new Audio();ctx.resume().then(()=>{if(!enabled||document.hidden)return;if(!timer){next=ctx.currentTime+.04;schedule();timer=setInterval(schedule,100);}}).catch(()=>{});}catch{}
 }
 return {start,stop,setEnabled(value){enabled=value;if(value)start();else stop();}};
}
