import {mkdir,rm,cp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url));
await rm(root+'dist',{recursive:true,force:true});
await mkdir(root+'dist',{recursive:true});
const html=(await readFile(root+'index.html','utf8')).replace('<script type="module" src="src/app.js"></script>','<script src="src/game.js"></script>');
await writeFile(root+'dist/index.html',html);
await mkdir(root+'dist/src',{recursive:true});
await cp(root+'src/style.css',root+'dist/src/style.css');
await cp(root+'assets',root+'dist/assets',{recursive:true});
await rm(root+'dist/assets/ASSET_PROVENANCE.md',{force:true});
for(const file of ['bgm.wav','warning.wav','caught.wav','event.wav','promotion.wav','clockout.wav','wrap.wav']){
 await rm(root+'dist/assets/'+file,{force:true});
}
await build({entryPoints:[root+'src/app.js'],outfile:root+'dist/src/game.js',bundle:true,format:'iife',target:['chrome61'],minify:true,legalComments:'none'});
await writeFile(root+'dist/build-info.json',JSON.stringify({version:'0.2.6',rules:'0.5-r1',target:'Chrome 61 / Android 8.1',media:'v03 event scenes + synthesized Web Audio music; no audio files',layout:'all screens landscape',builtAt:new Date().toISOString()},null,2));
console.log('Offline Chrome 61 build ready: dist/');
