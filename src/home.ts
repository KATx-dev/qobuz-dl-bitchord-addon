export const homePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Qobuz TV</title>
<style>
html,body{margin:0;background:#101217;color:#f4f6f8;font:18px Arial,sans-serif;min-height:100%;}
body{padding:24px;box-sizing:border-box;}
main{max-width:980px;margin:0 auto;}
header{border-bottom:1px solid #343943;padding:8px 0 20px;margin-bottom:24px;}
h1{font-size:32px;margin:0 0 6px;letter-spacing:.5px;color:#fff;}
.sub{color:#9da6b2;font-size:15px;margin:0;}
form{display:flex;gap:10px;margin-bottom:20px;}
input,select,button{font:inherit;border-radius:4px;border:1px solid #48505c;box-sizing:border-box;}
input{background:#20242c;color:#fff;padding:13px 14px;flex:1;min-width:0;}
select{background:#20242c;color:#fff;padding:12px 10px;}
button{background:#d7ff45;color:#12150d;border:0;font-weight:bold;padding:12px 20px;cursor:pointer;}
button:focus,input:focus,select:focus{outline:3px solid #79b9ff;outline-offset:2px;}
#status{min-height:24px;color:#aeb7c3;margin:12px 0;}
#results{display:block;}
.card{display:flex;align-items:center;gap:16px;padding:14px 4px;border-top:1px solid #2c313a;}
.cover{width:64px;height:64px;background:#272c35;object-fit:cover;border-radius:3px;flex:none;}
.meta{flex:1;min-width:0;}
.title{font-size:20px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.artist{color:#aeb7c3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tag{color:#d7ff45;font-size:12px;text-transform:uppercase;margin-top:6px;}
.play{min-width:92px;}
.empty{color:#8f98a5;padding:20px 4px;}
.player{position:sticky;bottom:0;margin-top:22px;padding:16px;background:#1a1e25;border:1px solid #343943;border-radius:5px;}
.now{font-weight:bold;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
a{color:#9ecbff;}
@media(max-width:650px){body{padding:16px;}form{flex-wrap:wrap;}input{flex-basis:100%;}select,form button{flex:1;}.card{gap:10px}.title{font-size:17px}.play{min-width:70px;padding:10px 12px}}
</style>
</head>
<body>
<main>
<header><h1>Qobuz TV</h1><p class="sub">Simple music search for Sony Bravia / Vewd</p></header>
<form id="searchForm" onsubmit="return doSearch();">
<input id="query" type="text" placeholder="Search artist, album or track" autocomplete="off">
<select id="quality" title="Audio quality"><option value="LOSSLESS">Lossless</option><option value="HIGH">High</option><option value="LOW">Low</option></select>
<button type="submit">SEARCH</button>
</form>
<div id="status">Type a search and press Enter.</div>
<div id="results"></div>
<section class="player"><div id="nowPlaying" class="now">Nothing playing</div><audio id="audio" controls preload="none" style="width:100%"></audio></section>
</main>
<script>
(function(){
  var lastTracks=[];
  function el(id){return document.getElementById(id);}
  function esc(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function request(url, done){var x=new XMLHttpRequest();x.onreadystatechange=function(){if(x.readyState===4){if(x.status>=200&&x.status<300){try{done(null,JSON.parse(x.responseText));}catch(e){done(e);}}else{done(new Error('Request failed'));}}};x.open('GET',url,true);x.send();}
  window.doSearch=function(){var q=el('query').value.replace(/^\\s+|\\s+$/g,'');if(!q){el('status').innerHTML='Enter something to search.';return false;}el('status').innerHTML='Searching...';el('results').innerHTML='';var quality=el('quality').value;request('/search?q='+encodeURIComponent(q)+'&quality='+encodeURIComponent(quality)+'&atmos=auto',function(err,data){if(err||!data){el('status').innerHTML='Search is unavailable right now.';return;}lastTracks=data.tracks||[];if(!lastTracks.length){el('status').innerHTML='No tracks found.';return;}el('status').innerHTML=lastTracks.length+' result'+(lastTracks.length===1?'':'s')+' found';var html='';for(var i=0;i<lastTracks.length;i++){var t=lastTracks[i];html+='<div class="card"><img class="cover" src="'+esc(t.artworkURL||'')+'" alt=""><div class="meta"><div class="title">'+esc(t.title)+'</div><div class="artist">'+esc(t.artist||t.album||'Unknown artist')+'</div><div class="tag">'+esc(t.audioQuality||t.format||quality)+'</div></div><button class="play" onclick="playTrack('+i+')">PLAY</button></div>';}el('results').innerHTML=html;});return false;};
  window.playTrack=function(index){var t=lastTracks[index];if(!t){return;}el('nowPlaying').innerHTML='Loading: '+esc(t.title);var quality=el('quality').value;request('/stream/'+encodeURIComponent(t.id)+'?quality='+encodeURIComponent(quality)+'&atmos=auto',function(err,data){if(err||!data||!data.url){el('nowPlaying').innerHTML='This track is not available.';return;}el('nowPlaying').innerHTML='Playing: '+esc(t.title)+(t.artist?' — '+esc(t.artist):'');var audio=el('audio');audio.src=data.url;audio.load();audio.play();});};
})();
</script>
</body>
</html>`;
