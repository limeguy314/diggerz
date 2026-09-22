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

  /* Native Customize redesign for Build 23.7. */
  var customizeOpen=false,customizeScene=null,customizeBg=null,customizePlayer=null,customizeHowl=null;
  var customizeClothing=null,customizeCountry=null,customizeScroll=0,customizeHue=0;
  var CUSTOMIZE_HUE_KEY='diggerz.skinHue.v1';
  function customizeSvc(){return service()||(q&&q.DiggerzShopService?q.DiggerzShopService:null)}
  function getHue(){try{var v=parseFloat(localStorage.getItem(CUSTOMIZE_HUE_KEY));return isFinite(v)?((v%360)+360)%360:0}catch(e){return 0}}
  function setHue(v){customizeHue=((v%360)+360)%360;try{localStorage.setItem(CUSTOMIZE_HUE_KEY,String(Math.round(customizeHue)))}catch(e){}}
  customizeHue=getHue();
  function hueRgb(h){h=((h%360)+360)%360/60;var x=1-Math.abs(h%2-1);if(h<1)return[1,x,0];if(h<2)return[x,1,0];if(h<3)return[0,1,x];if(h<4)return[0,x,1];if(h<5)return[x,0,1];return[1,0,x]}
  function tintFc(fc){if(!fc||!fc.i33)return;var c=hueRgb(customizeHue),n=['head','front_arm','back_arm','torso'];for(var i=0;i<n.length;i++)try{var p=fc.i33.f2(n[i]);if(p){p.set_local_r(c[0]);p.set_local_g(c[1]);p.set_local_b(c[2])}}catch(e){} }
  function patchHue(){try{var Fc=window.DiggerzRuntime.getFc();if(Fc.prototype.__h237)return;var old=Fc.prototype.m38;Fc.prototype.m38=function(a,b){var r=old.call(this,a,b);tintFc(this);return r};Fc.prototype.__h237=true}catch(e){}}
  function cstate(){var s=customizeSvc();if(!s||!s.state)return{appearance:[0,0,0,0,0,0,0,0,0,0,0],appearanceText:'',slots:[]};var a=(s.state.appearance||[]).slice(0,11);while(a.length<11)a.push(0);return{appearance:a,appearanceText:s.state.appearanceText||'',slots:s.state.slots||[]}}
  function csave(){var s=customizeSvc();if(s&&s.markDirty){s.markDirty();if(s.save)s.save(true)}}
  function refreshPreview(){var st=cstate();if(customizePlayer)try{customizePlayer.l9=Math.max(.01,q.player.l9||90);customizePlayer.m38(st.appearance,st.appearanceText);customizePlayer.i32=oa.MODE_IDLE;customizePlayer.i33._38(customizePlayer.I32,true,0,1);tintFc(customizePlayer)}catch(e){}if(l&&l.z39)try{l.z39.m38(st.appearance,st.appearanceText);tintFc(l.z39)}catch(e){} }
  function equipClothing(item){var s=customizeSvc();if(!s||!s.state||!item)return;var G=window.DiggerzRuntime,X=G.getItemSprite(),H=G.getH(),probe;try{probe=new X(customizeClothing,2,item.id,item.variant||0,0,item.count||1,item.extra||0,item.text||'',0)}catch(e){return}var slot=probe.t46;if(slot<0||slot===4||slot===8||slot===10)return;var ap=s.state.appearance||[];while(ap.length<11)ap.push(0);var same=ap[slot]===item.id;for(var i=0;i<s.state.slots.length;i++){var o=s.state.slots[i];if(o&&o!==item&&o.category===2&&o.count>0)try{var qx=new X(customizeClothing,2,o.id,o.variant||0,0,o.count||1,o.extra||0,o.text||'',0);if(qx.t46===slot)o.variant=0}catch(e){}}ap[slot]=same?0:item.id;if(!same)item.variant=1;s.state.appearance=ap;s.state.appearanceText=item.text||'';if(s.sendPlayer)s.sendPlayer();if(s.sendInventory)s.sendInventory();csave();buildClothes();refreshPreview()}
  function buildClothes(){if(!customizeClothing)return;customizeClothing._9=[];var st=cstate(),G=window.DiggerzRuntime,H=G.getH(),X=G.getItemSprite(),col=0,row=0;for(var i=0;i<st.slots.length;i++){var item=st.slots[i];if(!item||item.category!==2||item.count<=0)continue;var icon;try{icon=new X(customizeClothing,2,item.id,item.variant||0,0,item.count||1,item.extra||0,item.text||'',0)}catch(e){continue}if(icon.t46===4||icon.t46===8||icon.t46===10)continue;icon.D7(customizeClothing);icon.b6=-135+col*68;icon.b7=-145+row*68;icon.h0(56,56);icon.C33=(function(it){return function(){equipClothing(it)}})(item);customizeClothing._9.push(icon);if(++col>=4){col=0;row++}}customizeClothing.A8=-customizeScroll;try{customizeClothing.set_scrollRect(new r(-150,-150,300,300))}catch(e){}}
  function buildCountries(){if(!customizeCountry)return;customizeCountry._9=[];var Lo=window.DiggerzRuntime.getCountryFlag(),col=0,row=0;for(var i=0;i<255;i++){try{var f1=new Lo(customizeCountry,i);f1.b6=-165+col*38;f1.b7=-115+row*30;f1.set_local_xScale(f1.set_local_yScale(.5));f1.C33=(function(idx){return function(){q.player.L0=idx;q.SaveGlobals();refreshPreview()}})(i);customizeCountry._9.push(f1)}catch(e){}if(++col>=9){col=0;row++}}try{customizeCountry.set_scrollRect(new r(-160,-125,320,250))}catch(e){}}
  function makePreview(root){var box=z.I9();box.Init(f.INV_BKND_PNG());box.D7(root);box.h0(240,360);box.set_local_alp(.72);root._9.push(box);var holder=new z;holder.D7(box);holder.A7=0;holder.A8=15;holder.set_local_xScale(holder.set_local_yScale(1.6));box._9.push(holder);var G=window.DiggerzRuntime,Fc=G.getFc(),Cd=G.getGuid(),id=new Cd;customizePlayer=new Fc(holder,1,0,0,q.thisMain.userName||'Player',id,q.player.L0||224,0);customizePlayer.q7=id;customizePlayer.l9=q.player.l9||90;var st=cstate();customizePlayer.m38(st.appearance,st.appearanceText);customizePlayer.i32=oa.MODE_IDLE;customizePlayer.i33._38(customizePlayer.I32,true,0,1);tintFc(customizePlayer);holder._9.push(customizePlayer)}
  var customizeHiddenChildren=[];
  function hideMenuForCustomize(){
    customizeHiddenChildren=[];
    try{
      var arr=q.children||[];
      for(var i=0;i<arr.length;i++){
        var ch=arr[i];
        if(!ch||ch===customizeBg||ch===customizeScene)continue;
        customizeHiddenChildren.push({obj:ch,alp:(typeof ch.a7==='number'?ch.a7:1),local:(typeof ch.a7==='number'?ch.a7:1)});
        try{ch.set_alp(0);ch.set_local_alp(0)}catch(e){try{ch.a7=0}catch(e2){}}
      }
    }catch(e){}
  }
  function restoreMenuAfterCustomize(){
    try{for(var i=0;i<customizeHiddenChildren.length;i++){var it=customizeHiddenChildren[i];if(it&&it.obj){try{it.obj.set_alp(it.alp);it.obj.set_local_alp(it.local)}catch(e){}}}}catch(e){}
    customizeHiddenChildren=[];
  }
  function closeCustomize(){
    if(!customizeOpen)return;
    customizeOpen=false;
    if(customizeHowl){try{customizeHowl.stop();customizeHowl.unload()}catch(e){}customizeHowl=null}
    try{q.hasAModal=false}catch(e){}
    try{if(customizeScene)customizeScene.a0=1}catch(e){}
    try{if(customizeBg)customizeBg.a0=1}catch(e){}
    setTimeout(function(){
      try{if(customizeScene){customizeScene.e1();var i=q.children.indexOf(customizeScene);if(i>=0)q.children.splice(i,1)}}catch(e){}
      try{if(customizeBg){var j=q.children.indexOf(customizeBg);if(j>=0)q.children.splice(j,1)}}catch(e){}
      customizeScene=null;customizeBg=null;customizePlayer=null;
      restoreMenuAfterCustomize();
      try{q.InitTitleScreen()}catch(e){}
    },120);
  }
  function openCustomize(){
    if(customizeOpen)return;
    customizeOpen=true;
    patchHue();
    /* Hide the complete existing menu layer first. This avoids the legacy
       Settings/Customize screen remaining visible underneath the new screen. */
    hideMenuForCustomize();
    if(typeof Howl!=='undefined'){
      try{customizeHowl=new Howl({src:['/music_theme3.ogg'],loop:true,volume:.7,preload:true});customizeHowl.play()}catch(e){}
    }
    /* Beta background: make it visible immediately, then use the normal game
       animation only for the optional visual transition. */
    customizeBg=z.I9();
    customizeBg.Init(f.B273_0_PNG());
    customizeBg.A7=q.CENTERX; customizeBg.A8=q.CENTERY;
    try{
      customizeBg.set_local_xScale((q.SCREENWIDTH+80)/customizeBg._5.width);
      customizeBg.set_local_yScale((q.SCREENHEIGHT+80)/customizeBg._5.height);
    }catch(e){}
    customizeBg.B8=-999;
    customizeBg.set_alp(1); customizeBg.set_local_alp(1);
    q.children.splice(0,0,customizeBg);

    /* The previous version depended on an F6 alpha tween which could leave the
       scene at alpha 0 on this generated OpenFL build. Build it fully visible. */
    customizeScene=new ja(700,700,true);
    customizeScene.A7=q.CENTERX; customizeScene.A8=q.CENTERY;
    var cs=Math.min(1,(q.SCREENWIDTH-20)/700,(q.SCREENHEIGHT-20)/700);
    customizeScene.set_local_xScale(cs); customizeScene.set_local_yScale(cs);
    customizeScene.set_alp(1); customizeScene.set_local_alp(1);
    q.children.push(customizeScene);

    text(customizeScene,0,-315,'Customize',q.MAIN_FONT_BIG,1.05);
    var x=new yo(customizeScene);x.b6=-315;x.b7=-320;x.C33=closeCustomize;customizeScene._9.push(x);
    text(customizeScene,-170,-300,'YOUR CHARACTER',q.MAIN_FONT_SMALL,.78);
    makePreview(customizeScene);
    text(customizeScene,175,-300,'CLOTHING',q.MAIN_FONT_SMALL,.78);
    customizeClothing=z.I9(); customizeClothing.D7(customizeScene); customizeClothing.b6=175; customizeClothing.b7=-15; customizeClothing.set_local_alp(.85); customizeScene._9.push(customizeClothing);
    buildClothes();
    text(customizeScene,-170,165,'Skin Tone',q.MAIN_FONT_BIG,.62);
    customizeSkinSlider=new vl(customizeScene,-170,195,300,42,2,f.HEAD_PNG(),Th.n7(),null,q.player.l9);
    customizeSkinSlider.b6=-170; customizeSkinSlider.b7=195; customizeSkinSlider.d49.set_alp(0);
    customizeSkinSlider.D45=function(){q.player.l9=Math.max(.01,customizeSkinSlider.D43);q.SaveGlobals();refreshPreview()}; customizeScene._9.push(customizeSkinSlider);
    text(customizeScene,-170,245,'Skin Hue',q.MAIN_FONT_BIG,.62);
    customizeHueSlider=new vl(customizeScene,-170,275,300,42,2,f.HEAD_PNG(),Th.n7(),null,customizeHue/3.6);
    customizeHueSlider.b6=-170; customizeHueSlider.b7=275; customizeHueSlider.d49.set_alp(0);
    customizeHueSlider.D45=function(){setHue(customizeHueSlider.D43*3.6);refreshPreview()}; customizeScene._9.push(customizeHueSlider);
    text(customizeScene,175,165,'Country',q.MAIN_FONT_BIG,.62);
    customizeCountry=z.I9(); customizeCountry.D7(customizeScene); customizeCountry.b6=175; customizeCountry.b7=225; customizeCountry.set_local_alp(.9); customizeScene._9.push(customizeCountry);
    buildCountries();
    text(customizeScene,175,365,'Click clothing to equip it.',q.MAIN_FONT_SMALL,.65);
    try{q.hasAModal=true}catch(e){}
  }

  async function nativeAdminCodePrompt(){
    /* Restore the normal browser/Chrome prompt for Admin authentication. */
    try{
      var value=window.prompt('Admin Code:','');
      return value==null?null:String(value).trim();
    }catch(e){return null}
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
      if(!customizeOpen)stopMusic();
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
    if(!window.q||!window.l||typeof ja==='undefined'||typeof dg==='undefined'){setTimeout(install,100);return}
    patchHue();
    /* The actual Game Settings button is rewritten in the bundled Op prototype.
       Keep a second direct hook for builds where the prototype is exposed, but
       never invoke the legacy Customize method as a fallback. */
    try{var GS=window.DiggerzRuntime.getGameSettings();if(GS&&!GS.prototype.__c237){GS.prototype._56=function(){openCustomize()};GS.prototype.__c237=true}}catch(e){}
    buildMusicButton();buildAdminButton();
    /* Replace the old browser prompt used after the Konami sequence. */
    try{
      if(typeof requestOwnerCode==='function'){} // retained only for older builds
    }catch(e){}
    updateNativeUi();
  }

  /* Patch the existing Konami handler's prompt line by providing a global hook
     that the source-level replacement below calls. */
  /* Public bridge used by the rewritten Game Settings Customize button. */
  window.DiggerzNativeCustomize237={open:openCustomize,close:closeCustomize};

  window.DiggerzNativeAdmin237={promptCode:nativeAdminCodePrompt,request:requestAdminAccess};
  install();
})();


