(function(){
  'use strict';

  /* Build 23.7 native UI overhaul:
     - moves Music Player and Admin UI into the existing OpenFL/Diggerz UI system
     - keeps old DOM panels hidden
     - uses the existing $b/dg text-input system for admin authentication and fields
     - clips/scrolls admin contents inside a fixed native popup
  */

  var P = window.DiggerzPvp22;
  var nativeReady = false;
  var musicButton = null, musicPanel = null, musicContent = null;
  var adminButton = null, adminPanel = null, adminContent = null;
  var musicHowl = null, musicTrack = -1, musicOpen = false;
  var adminOpen = false, adminScroll = 0, musicScroll = 0;
  var adminFields = [], activeField = null;
  var adminCatalog = [], adminChoices = {}, adminCategory = 2;
  var musicTracks = [
    {name:'Track 1', src:'/music_theme.ogg'},
    {name:'Track 2', src:'/music_theme2.ogg'},
    {name:'Track 3', src:'/music_theme3.ogg'},
    {name:'Track 4', src:'/music_theme4.ogg'},
    {name:'M.U.L.E. (Bitblaster Mix)', src:'/mule.ogg'}
  ];

  function service(){ return window.Main && window.Main.diggerzService ? window.Main.diggerzService : null }
  function inGame(){ return !!(window.l && l.z39 && l.z38) }
  function isDigTrade(){ return !!(P && P.joined && P.mode==='digtrade' && service()) }
  function isPvP(){ return !!(P && P.joined && P.mode==='pvp') }

  function killOldOverlays(){
    try{
      var a=document.getElementById('diggerz-admin-toggle'); if(a)a.style.display='none';
      var b=document.getElementById('diggerz-admin-panel'); if(b)b.style.display='none';
      var c=document.getElementById('diggerz-admin-modal'); if(c)c.style.display='none';
      var m=document.getElementById('diggerz-music-player'); if(m)m.style.display='none';
    }catch(e){}
  }

  function add(root,obj){ if(root&&obj){ obj.D7(root); root._9.push(obj); } return obj }
  function text(root,x,y,s,font,scale){
    var t=new xa(x,y,String(s||''),font||q.MAIN_FONT); t.D7(root,!0); if(scale)t.set_local_xScale(t.set_local_yScale(scale)); root._9.push(t); return t;
  }
  function nativeButton(root,x,y,w,label,fn){
    var b=z.I9(); b.Init(u.REDBUTTON_PNG()); b.D7(root); b.b6=x; b.b7=y;
    var scale=w/b._5.width; b.set_local_xScale(scale); b.set_local_yScale(scale);
    b.F6(5,0,1,350); b._1='Native237Button';
    /* Darkened red-button art: black/charcoal with a subtle RGB light pulse. */
    b.set_local_r(.12); b.set_local_g(.14); b.set_local_b(.17);
    root._9.push(b);
    var o=new ob(0,0,'',q.MAIN_FONT); o.D7(b); o.E37(label); o.b7=2; o.C33=fn; o.B8=5; b._9.push(o);
    return {sprite:b,label:o,setText:function(v){o.E37(String(v))}};
  }
  function closeNative(panel){
    if(!panel)return;
    try{if(panel.C39)panel.C39();else{panel.a0=1;E.u4(panel,0,300,1,.5,0,1,0)}}catch(e){panel.a0=1}
    try{if(panel===adminPanel||panel===musicPanel)q.hasAModal=false}catch(e){}
  }

  function buildMusicButton(){
    if(musicButton || !q || !q.children)return;
    musicButton=nativeButton(q,118,38,170,'Music Player',function(){
      if(!isDigTrade())return;
      if(musicPanel && musicPanel.a0!==1){ closeNative(musicPanel); musicOpen=false; }
      else openMusicPanel();
    });
    musicButton.sprite._1='DiggerzNativeMusicButton';
  }

  function playMusic(i){
    i=Math.max(0,Math.min(musicTracks.length-1,i|0));
    if(musicHowl && musicTrack===i){ try{musicHowl.play()}catch(e){} return }
    if(musicHowl)try{musicHowl.stop();musicHowl.unload()}catch(e){}
    musicTrack=i;
    if(typeof Howl==='undefined')return;
    musicHowl=new Howl({src:[musicTracks[i].src],preload:true,loop:true,volume:.7});
    try{musicHowl.play()}catch(e){}
  }
  function stopMusic(){
    if(musicHowl){try{musicHowl.stop();musicHowl.unload()}catch(e){}}
    musicHowl=null; musicTrack=-1;
  }
  function openMusicPanel(){
    if(!musicPanel){
      musicPanel=new ja(520,510,true); musicPanel.A7=q.CENTERX; musicPanel.A8=q.CENTERY; musicPanel._1='DiggerzNativeMusicPanel';
      E.u4(musicPanel,0,300,0,.5,1,0,1); q.children.push(musicPanel);
      text(musicPanel,0,-215,'MUSIC PLAYER',q.MAIN_FONT_BIG,.85);
      nativeButton(musicPanel,170,-215,90,'Close',function(){musicOpen=false;closeNative(musicPanel)});
      musicContent=z.I9(); musicContent.D7(musicPanel); musicContent.A7=0; musicContent.A8=0; musicContent.set_scrollRect(new r(-230,-165,460,330)); musicPanel._9.push(musicContent);
      var y=-135;
      musicTracks.forEach(function(t,i){
        var row=nativeButton(musicContent,0,y,390,t.name,function(){playMusic(i)});
        row.sprite.set_local_r(.12);row.sprite.set_local_g(.14);row.sprite.set_local_b(.17); y+=58;
      });
      text(musicPanel,0,205,'Click a track to play it. Closing this window does not stop it.',q.MAIN_FONT_SMALL,.8);
    }
    musicOpen=true; musicPanel.a0=0; musicPanel.A7=q.CENTERX; musicPanel.A8=q.CENTERY; musicScroll=0; try{q.hasAModal=true}catch(e){}
    try{musicPanel.set_scrollRect(null)}catch(e){}
    if(musicContent)musicContent.set_scrollRect(new r(-230,-165,460,330));
  }

  function makeAdminField(root,y,label,initial,max,onEnter,password){
    text(root,-245,y-24,label,q.MAIN_FONT_SMALL,.9);
    var bg=new ja(490,50,true); bg.D7(root); bg.b6=0; bg.b7=y; bg.set_local_alp(.78); root._9.push(bg);
    var field=new dg(0,0,String(initial||''),q.MAIN_FONT,!!password,max||160,470); field.D7(bg); field.b6=-205; field.b7=4; bg._9.push(field);
    field.q39=function(){ if(typeof onEnter==='function')onEnter(field.q35); };
    field.q38=function(){ field.q35=field.q35||''; field.E37(field.q35); };
    var hit=new ob(0,0,' ',q.MAIN_FONT,1,1,true); hit.D7(bg); hit.b6=0; hit.b7=0; hit.set_local_alp(.015); hit.C33=function(){activateField(field)}; bg._9.push(hit);
    field.Q31=false;
    adminFields.push(field);
    return field;
  }
  function activateField(field){
    adminFields.forEach(function(f){f.Q31=false});
    activeField=field; if(field){field.Q31=true;try{q.thisMain.stage.set_focus(field.Q30)}catch(e){}}
  }
  function setField(field,v){if(field){field.q35=String(v||'');field.E37(field.q35)}}
  function adminSay(msg){
    if(!adminPanel)return;
    var s=adminPanel._1Status; if(s)s.E37(String(msg||''));
  }
  function loadCatalog(){
    var s=service(); if(!s||!s.adminCatalog)return;
    adminCatalog=s.adminCatalog(adminCategory)||[]; adminChoices={};
    var totals={},used={};
    adminCatalog.forEach(function(e){totals[e.name]=(totals[e.name]||0)+1});
    adminCatalog.forEach(function(e){
      var label=e.name;
      if(totals[e.name]>1){used[e.name]=(used[e.name]||0)+1;label=e.name+' (Variant '+used[e.name]+')'}
      adminChoices[label.toLowerCase()]={id:e.id,name:e.name,label:label};
      if(!adminChoices[e.name.toLowerCase()])adminChoices[e.name.toLowerCase()]={id:e.id,name:e.name,label:label};
    });
  }
  function itemChoice(value){
    var v=String(value||'').trim().toLowerCase(); if(adminChoices[v])return adminChoices[v];
    var found=null; for(var k in adminChoices)if(k.indexOf(v)>=0&&adminChoices[k].label.toLowerCase()===k){if(found)return null;found=adminChoices[k]}
    return found;
  }
  function doSpawnItem(){
    var s=service();if(!s)return adminSay('Admin service is not connected.');
    var c=itemChoice(adminPanel.fields.item.q35);if(!c)return adminSay('Pick an exact item name from the catalog.');
    adminSay(s.adminSpawnItem(adminCategory,c.id,+adminPanel.fields.count.q35||1,adminPanel.fields.player.q35));
  }
  function doCoins(){var s=service();if(s)adminSay(s.adminSpawnCoins(+adminPanel.fields.coins.q35||1,adminPanel.fields.player.q35));}
  function doKill(){var s=service();if(s)adminSay(s.adminKillPlayer(adminPanel.fields.player.q35));}
  function doTeleport(){var s=service();if(s)adminSay(s.adminTeleportTo(adminPanel.fields.player.q35));}
  function doMessage(){var s=service();if(!s)return;var scope=adminPanel.messageScope||'server';adminSay(s.adminScreenMessage(adminPanel.fields.message.q35,scope));}
  function openMap(){try{window.open('/map-editor','diggerz-map-editor')}catch(e){}}

  function openAdminPanel(){
    if(!inGame()||!window.DiggerzAdminSessionToken)return;
    if(!adminPanel){
      adminPanel=new ja(620,650,true); adminPanel.A7=q.CENTERX; adminPanel.A8=q.CENTERY; adminPanel._1='DiggerzNativeAdminPanel';
      E.u4(adminPanel,0,300,0,.5,1,0,1); q.children.push(adminPanel);
      text(adminPanel,0,-292,'Admin',q.MAIN_FONT_BIG,.9);
      nativeButton(adminPanel,220,-292,95,'Close',function(){adminOpen=false;closeNative(adminPanel)});
      adminContent=z.I9(); adminContent.D7(adminPanel); adminContent.A7=0; adminContent.A8=0; adminContent.set_scrollRect(new r(-285,-245,570,490)); adminPanel._9.push(adminContent);
      var y=-220;
      text(adminContent,-245,y,'Spawn Item',q.MAIN_FONT_BIG,.62);y+=48;
      var typeBtn=nativeButton(adminContent,-120,y,190,'Type: Item',function(){adminCategory=adminCategory===2?1:2;typeBtn.setText(adminCategory===2?'Type: Item':'Type: Block');loadCatalog();});y+=60;
      adminPanel.fields={};
      adminPanel.fields.item=makeAdminField(adminContent,y,'Item Name','',180,doSpawnItem,false);y+=72;
      adminPanel.fields.count=makeAdminField(adminContent,y,'Count','1',6,doSpawnItem,false);y+=72;
      nativeButton(adminContent,0,y,300,'Give Selected Item',doSpawnItem);y+=75;
      text(adminContent,-245,y,'Coins',q.MAIN_FONT_BIG,.62);y+=48;
      adminPanel.fields.coins=makeAdminField(adminContent,y,'Amount','1000',10,doCoins,false);y+=72;
      nativeButton(adminContent,0,y,250,'Give Coins',doCoins);y+=75;
      text(adminContent,-245,y,'Players',q.MAIN_FONT_BIG,.62);y+=48;
      adminPanel.fields.player=makeAdminField(adminContent,y,'Player Name','',24,doTeleport,false);y+=72;
      nativeButton(adminContent,-105,y,190,'Teleport To',doTeleport);nativeButton(adminContent,105,y,190,'Kill Player',doKill);y+=72;
      nativeButton(adminContent,-105,y,190,'Kick Player',function(){adminSay('Use the moderation tools in the server panel for Kick/Ban.')});
      nativeButton(adminContent,105,y,190,'Ban Player',function(){adminSay('Use the moderation server controls for timed/permanent bans.')});y+=82;
      text(adminContent,-245,y,'On-Screen Message',q.MAIN_FONT_BIG,.62);y+=48;
      adminPanel.fields.message=makeAdminField(adminContent,y,'Message','',180,doMessage,false);y+=72;
      nativeButton(adminContent,-105,y,190,'This Server',function(){adminPanel.messageScope='server';doMessage()});
      nativeButton(adminContent,105,y,190,'Global',function(){adminPanel.messageScope='global';doMessage()});y+=75;
      text(adminContent,-245,y,'Map / PvP',q.MAIN_FONT_BIG,.62);y+=48;
      nativeButton(adminContent,-105,y,190,'Open Map Editor',openMap);
      nativeButton(adminContent,105,y,190,'PvP Override',function(){var s=service();if(s)adminSay(s.adminSetPvp(true))});y+=78;
      text(adminContent,-245,y,'Scroll with the mouse wheel. Contents are clipped to this window.',q.MAIN_FONT_SMALL,.78);y+=40;
      adminContent._nativeContentHeight=y+245;
      var status=text(adminPanel,0,285,'Ready.',q.MAIN_FONT_SMALL,.82);adminPanel._1Status=status;
      loadCatalog();
    }
    adminOpen=true;adminPanel.a0=0;adminPanel.A7=q.CENTERX;adminPanel.A8=q.CENTERY;adminScroll=0; try{q.hasAModal=true}catch(e){}
    adminFields.forEach(function(f){f.Q31=false});
    activeField=null;
  }

  async function nativeAdminCodePrompt(){
    return await new Promise(function(resolve){
      var done=false;
      function finish(value){if(done)return;done=true;resolve(value)}
      var p=new $b(q.thisMain,'Admin Code:','',64,function(){
        var box=q.GetChildByType($b),value=box&&box.F30?String(box.F30.q35||'').trim():'';finish(value||null);
      },400,200,true,false);
      p._1='native-admin-code'; p.B8=4; q.children.push(p); try{q.thisMain.stage.set_focus(p.F30.Q30)}catch(e){}
    });
  }
  async function requestAdminAccess(){
    if(window.__diggerzNativeAdminBusy)return; window.__diggerzNativeAdminBusy=true;
    try{
      var code=await nativeAdminCodePrompt(); if(!code)return;
      var response=await fetch('/api/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code}),cache:'no-store'});
      var data={};try{data=await response.json()}catch(e){}
      if(!response.ok||!data.ok||!data.token){
        var s=service(); if(s&&s.adminWrongCodePenalty)s.adminWrongCodePenalty();
        return;
      }
      window.DiggerzAdminSessionToken=String(data.token);
      window.DiggerzAdminSessionRole=String(data.role||'');
      window.DiggerzAdminSessionExpiresAt=+data.expiresAt||0;
      var svc=service();
      if(svc){
        if(data.role==='owner'&&svc.adminAuthorizeOwner)svc.adminAuthorizeOwner(window.DiggerzAdminSessionToken,data.role,data.expiresAt);
        if(data.role==='lime'&&svc.adminAuthorizeLime)svc.adminAuthorizeLime(window.DiggerzAdminSessionToken,data.role,data.expiresAt);
        if(data.role==='owner'&&svc.adminApplyOwnerTag)svc.adminApplyOwnerTag();
        if(data.role==='lime'&&svc.adminApplyLimeTag)svc.adminApplyLimeTag();
      }
      if(adminButton)adminButton.sprite.a0=0;
    }catch(e){}
    finally{window.__diggerzNativeAdminBusy=false}
  }

  function buildAdminButton(){
    if(adminButton)return;
    adminButton=nativeButton(q,q.SCREENWIDTH-90,38,150,'ADMIN',openAdminPanel);
    adminButton.sprite._1='DiggerzNativeAdminButton';
  }

  function updateNativeUi(){
    killOldOverlays();
    if(!nativeReady){buildMusicButton();buildAdminButton();nativeReady=true}
    var role=String(window.DiggerzAdminSessionRole||'');
    var authorized=!!window.DiggerzAdminSessionToken && (+window.DiggerzAdminSessionExpiresAt||0)>Date.now() && (role==='owner'||role==='lime');
    var game=inGame();
    if(musicButton){musicButton.sprite.a0=isDigTrade()?0:1;musicButton.sprite.A7=118;musicButton.sprite.A8=38}
    if(adminButton){adminButton.sprite.a0=(authorized&&game)?0:1;adminButton.sprite.A7=Math.max(90,q.SCREENWIDTH-95);adminButton.sprite.A8=38}
    if(!game){
      if(adminOpen){adminOpen=false;closeNative(adminPanel)}
      if(musicOpen){musicOpen=false;closeNative(musicPanel)}
      stopMusic();
    }else if(!isDigTrade()){
      if(musicOpen){musicOpen=false;closeNative(musicPanel)}
      stopMusic();
    }
    if(q.mWheel){
      if(adminOpen&&adminContent){adminScroll=Math.max(0,Math.min(950,adminScroll-q.mWheel*45));adminContent.A8=-adminScroll;q.mWheel=0}
      else if(musicOpen&&musicContent){musicScroll=Math.max(0,Math.min(150,musicScroll-q.mWheel*45));musicContent.A8=-musicScroll;q.mWheel=0}
    }
    if(adminOpen&&!authorized){adminOpen=false;closeNative(adminPanel)}
    /* Subtle RGB-derived lighting on the dark buttons, using the same channel
       animation style already used by the game's RGB effects. */
    var ph=Date.now()/900, rr=.12+.025*(.5+.5*Math.sin(ph)), gg=.14+.025*(.5+.5*Math.sin(ph+2.094)), bb=.17+.025*(.5+.5*Math.sin(ph+4.188));
    [musicButton,adminButton].forEach(function(b){if(b&&b.sprite){try{b.sprite.set_local_r(rr);b.sprite.set_local_g(gg);b.sprite.set_local_b(bb)}catch(e){}}});
    requestAnimationFrame(updateNativeUi);
  }

  function install(){
    if(!window.q||!window.l||typeof ja==='undefined'||typeof $b==='undefined'||typeof dg==='undefined'){setTimeout(install,100);return}
    buildMusicButton();buildAdminButton();
    /* Replace the old browser prompt used after the Konami sequence. */
    try{
      if(typeof requestOwnerCode==='function'){} // retained only for older builds
    }catch(e){}
    updateNativeUi();
  }

  /* Patch the existing Konami handler's prompt line by providing a global hook
     that the source-level replacement below calls. */
  window.DiggerzNativeAdmin237={promptCode:nativeAdminCodePrompt,request:requestAdminAccess};
  install();
})();
