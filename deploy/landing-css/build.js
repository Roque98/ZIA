const {PurgeCSS}=require('purgecss'); const csso=require('csso'); const fs=require('fs');
const R=require('path').resolve(__dirname,'../../wireframes/bexon')+'/';
(async()=>{
 const css=['bootstrap.min.css','bexon-icons.css','main.css','venobox.min.css'].map(f=>({raw:fs.readFileSync(R+'assets/css/'+f,'utf8').replace(/url\("?\.\.\/fonts/g,'url("../fonts').replace(/\/\*# sourceMappingURL=[^*]*\*\//g,'')}));
 const r=await new PurgeCSS().purge({content:[R+'index.html',R+'aviso-privacidad.html',R+'assets/js/landing.js',R+'assets/js/zia.js',R+'assets/js/zia-chat.js',R+'assets/js/zia-init.js',R+'assets/js/venobox.min.js'],css,
  safelist:{standard:[/^vbox/,/^venobox/,/^vb/,/^is-/,/^zchat/,/^sticky/,/^open/,/^show/],greedy:[/vbox/,/venobox/]},keyframes:false,fontFace:true,variables:false});
 const all=r.map(x=>x.css).join('\n');
 const out=csso.minify(all,{restructure:false}).css;
 fs.writeFileSync(R+'assets/css/base.min.css','/* Generado: bootstrap+bexon-icons+main+venobox purgados para la landing (ver deploy/README) */\n'+out);
 console.log(all.length,out.length);
})();
