(function(){
  'use strict';

  var BUILD='24.0';
  var installed=false;
  var gravityTimer=null;
  var rgbInstalled=false;
  var rgbAnimationStarted=false;
  var rgbObjects=[];
  var RGB_TIME_ZONE='America/New_York';
  var TRUE_RGB_DEFAULT_ODDS=100000;
  var TRUE_RGB_KPOP_ODDS=101337;
  var TRUE_RGB_MILITARY_ODDS=1000000;
  var TRUE_RGB_MILITARY_ID=554;
  var TRUE_RGB_KPOP_IDS={559:true,560:true,561:true,562:true};
  var RGB_KPOP_SHOE_IDS={511:true,561:true};
  var RGB_WING_IDS={501:true,551:true};
  var RGB_KPOP_AUDIO_URL='/jams_vip.ogg';
  var RGB_KPOP_MAX_VOLUME=.58;
  var RGB_KPOP_FULL_DISTANCE=3;
  var RGB_KPOP_FADE_DISTANCE=16;
  var rgbKpopAudio=null;
  var rgbKpopAudioRetryAt=0;
  var rgbKpopAudioFailed=false;
  var rgbKpopGestureInstalled=false;
  var rgbKpopBroadcastActive=null;
  var rgbKpopBroadcastAt=0;

  // Build 24.0 RGB catalog. Normal RGB IDs are weekend-event variants.
  // Their True RGB counterparts use the same recovered item geometry/behavior
  // but a darker animated color cycle and only come from the off-week ultra-rare rolls.
  var RGB_ITEMS=[
    {id:500,trueId:550,baseId:110,name:'RGB Ball Cap',trueName:'True RGB Ball Cap'},
    {id:501,trueId:551,baseId:213,name:'RGB Wings',trueName:'True RGB Wings'},
    {id:502,trueId:552,baseId:181,name:'RGB Trance Eyes',trueName:'True RGB Trance Eyes'},
    {id:503,trueId:553,baseId:113,name:'RGB Jetpack',trueName:'True RGB Jetpack'},
    {id:504,trueId:554,baseId:247,name:'RGB Military Hat',trueName:'True RGB Military Hat'},
    {id:505,trueId:555,baseId:127,name:'RGB Mohawk',trueName:'True RGB Mohawk'},
    {id:506,trueId:556,baseId:173,name:'RGB Spiky Hair',trueName:'True RGB Spiky Hair'},
    {id:507,trueId:557,baseId:109,name:'Cute RGB Bob',trueName:'True RGB Cute Bob'},
    {id:508,trueId:558,baseId:58,name:'Short RGB Hair',trueName:'True RGB Short Hair'},
    {id:509,trueId:559,baseId:67,name:'RGB K-Pop Shirt',trueName:'True RGB K-Pop Shirt'},
    {id:510,trueId:560,baseId:57,name:'RGB K-Pop Pants',trueName:'True RGB K-Pop Pants'},
    {id:511,trueId:561,baseId:56,name:'RGB K-Pop Shoes',trueName:'True RGB K-Pop Shoes'},
    // Both RGB Stetsons now cycle the entire recovered Yellow Stetson texture.
    {id:512,trueId:562,baseId:105,name:'RGB Stetson',trueName:'True RGB Stetson'},
    {id:513,trueId:563,baseId:234,name:'RGB Sparkle Shoes',trueName:'True RGB Sparkle Shoes'},
    {id:514,trueId:564,baseId:233,name:'RGB Sparkle Gloves',trueName:'True RGB Sparkle Gloves'},
    {id:515,trueId:565,baseId:125,name:'RGB Retriever',trueName:'True RGB Retriever'},
    {id:516,trueId:566,baseId:387,name:'RGB Dual Lightsword',trueName:'True RGB Dual Lightsword',weapon:true},
    {id:517,trueId:567,baseId:379,name:'RGB Lightsword',trueName:'True RGB Lightsword',weapon:true},
    {id:518,trueId:568,baseId:20,name:'RGB Shirt',trueName:'True RGB Shirt'},
    {id:519,trueId:569,baseId:187,name:'RGB WC Shirt',trueName:'True RGB WC Shirt'},
    {id:520,trueId:570,baseId:23,name:'RGB Pants',trueName:'True RGB Pants'}
  ];
  var RGB_BY_ID={};
  var RGB_IDS=[];
  var TRUE_RGB_IDS=[];
  var RGB_WEAPON_IDS={516:true,517:true,566:true,567:true};
  for(var rgbIndex=0;rgbIndex<RGB_ITEMS.length;rgbIndex++){
    var rgbDef=RGB_ITEMS[rgbIndex];
    RGB_BY_ID[rgbDef.id]={
      id:rgbDef.id,baseId:rgbDef.baseId,name:rgbDef.name,trueRgb:false,
      weapon:!!rgbDef.weapon,stetson:!!rgbDef.stetson
    };
    RGB_BY_ID[rgbDef.trueId]={
      id:rgbDef.trueId,baseId:rgbDef.baseId,name:rgbDef.trueName,trueRgb:true,
      weapon:!!rgbDef.weapon,stetson:!!rgbDef.stetson
    };
    RGB_IDS.push(rgbDef.id);
    TRUE_RGB_IDS.push(rgbDef.trueId);
  }

  function randomHash(){
    try{
      if(window.crypto&&window.crypto.getRandomValues){
        var a=new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return (a[0]&0x7fffffff)>>>0;
      }
    }catch(error){}
    return Math.floor(Math.random()*0x7fffffff)>>>0;
  }

  function easternParts(date){
    date=date||new Date();
    try{
      var parts=new Intl.DateTimeFormat('en-US',{
        timeZone:RGB_TIME_ZONE,weekday:'short',year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(date);
      var out={weekday:'',year:0,month:0,day:0};
      for(var i=0;i<parts.length;i++){
        if(parts[i].type==='weekday')out.weekday=parts[i].value;
        else if(parts[i].type==='year')out.year=parseInt(parts[i].value,10)||0;
        else if(parts[i].type==='month')out.month=parseInt(parts[i].value,10)||0;
        else if(parts[i].type==='day')out.day=parseInt(parts[i].value,10)||0;
      }
      return out;
    }catch(error){
      var localDay=date.getDay();
      return {
        weekday:localDay===0?'Sun':localDay===6?'Sat':'Weekday',
        year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()
      };
    }
  }

  function isRgbWeekend(){
    var p=easternParts(new Date());
    return p.weekday==='Sat'||p.weekday==='Sun';
  }

  function weekendSeed(){
    var now=new Date();
    var p=easternParts(now);
    // Sunday shares Saturday's featured trio.
    if(p.weekday==='Sun'){
      now=new Date(now.getTime()-24*60*60*1000);
      p=easternParts(now);
    }
    var seed=((p.year*10000+p.month*100+p.day)^0x524742)&0x7fffffff;
    return seed||240;
  }

  function featuredRgbIds(){
    var pool=RGB_IDS.slice(),seed=weekendSeed();
    for(var i=pool.length-1;i>0;i--){
      seed=(Math.imul(seed,1103515245)+12345)&0x7fffffff;
      var j=seed%(i+1),tmp=pool[i];
      pool[i]=pool[j];pool[j]=tmp;
    }
    return pool.slice(0,3);
  }

  function isAnyRgbId(id){
    return !!RGB_BY_ID[id|0];
  }

  function isRgbWeaponId(id){
    return !!RGB_WEAPON_IDS[id|0];
  }

  function trueRgbOdds(id){
    id=id|0;
    if(id===TRUE_RGB_MILITARY_ID)return TRUE_RGB_MILITARY_ODDS;
    if(TRUE_RGB_KPOP_IDS[id])return TRUE_RGB_KPOP_ODDS;
    return TRUE_RGB_DEFAULT_ODDS;
  }

  function genericTrueRgbIds(){
    var out=[];
    for(var i=0;i<TRUE_RGB_IDS.length;i++){
      var id=TRUE_RGB_IDS[i]|0;
      if(id!==TRUE_RGB_MILITARY_ID&&!TRUE_RGB_KPOP_IDS[id])out.push(id);
    }
    return out;
  }

  function rollTrueRgbReward(){
    // Military Hat is intentionally absurdly rare.
    if(randomHash()%TRUE_RGB_MILITARY_ODDS===0)
      return {category:2,id:TRUE_RGB_MILITARY_ID,count:1,tier:'true-rgb'};

    // Each True RGB K-Pop piece, including the Stetson, has its own 1/101,337 roll.
    var kpop=[559,560,561,562];
    var start=randomHash()%kpop.length;
    for(var i=0;i<kpop.length;i++){
      var id=kpop[(start+i)%kpop.length];
      if(randomHash()%TRUE_RGB_KPOP_ODDS===0)
        return {category:2,id:id,count:1,tier:'true-rgb'};
    }

    // Everything else uses the general 1/100,000 True RGB event roll.
    if(randomHash()%TRUE_RGB_DEFAULT_ODDS===0){
      var pool=genericTrueRgbIds();
      if(pool.length){
        var pick=pool[randomHash()%pool.length];
        return {category:2,id:pick,count:1,tier:'true-rgb'};
      }
    }
    return null;
  }

  function inventoryCount(service,category,id){
    var total=0,slots=service&&service.state&&service.state.slots||[];
    for(var i=0;i<slots.length;i++){
      var item=slots[i];
      if(item&&(item.category|0)===(category|0)&&(item.id|0)===(id|0))total+=Math.max(0,item.count|0);
    }
    return total;
  }

  function rainbowRgb(phase){
    phase=((phase%1)+1)%1;
    var h=phase*6,i=Math.floor(h),f=h-i,q=1-f;
    switch(i%6){
      case 0:return [1,f,0];
      case 1:return [q,1,0];
      case 2:return [0,1,f];
      case 3:return [0,q,1];
      case 4:return [f,0,1];
      default:return [1,0,q];
    }
  }

  function rgbColorFor(def,color){
    var low=def&&def.trueRgb?0.10:0.28;
    var gain=def&&def.trueRgb?0.62:1.12;
    return [low+gain*color[0],low+gain*color[1],low+gain*color[2]];
  }

  function applyRgbColor(obj,def,color){
    if(!obj||!def)return false;
    var rgb=rgbColorFor(def,color);
    try{
      obj._build240RgbStetson=!!def.stetson;
      obj.c9=false;
      if(typeof obj.set_local_r==='function')obj.set_local_r(rgb[0]);
      if(typeof obj.set_local_g==='function')obj.set_local_g(rgb[1]);
      if(typeof obj.set_local_b==='function')obj.set_local_b(rgb[2]);
      if(typeof obj.set_r==='function')obj.set_r(rgb[0]);
      if(typeof obj.set_g==='function')obj.set_g(rgb[1]);
      if(typeof obj.set_b==='function')obj.set_b(rgb[2]);
      return true;
    }catch(error){return false}
  }

  function entityNode(ent,path){
    try{
      var node=ent&&ent.i33?ent.i33:ent;
      for(var i=0;i<path.length;i++)node=node&&node.f2?node.f2(path[i]):null;
      return node||null;
    }catch(error){return null}
  }

  function rgbDefAtSlot(ent,appearanceFallback,slot){
    var ap=ent&&ent.J33,id=ap&&ap.length?(ap[slot]|0):0;
    if(RGB_BY_ID[id])return RGB_BY_ID[id];
    id=appearanceFallback&&appearanceFallback.length?(appearanceFallback[slot]|0):0;
    return RGB_BY_ID[id]||null;
  }

  function tintDirectBodyParts(ent,color,appearanceFallback){
    var shirt=rgbDefAtSlot(ent,appearanceFallback,2);
    if(shirt){
      applyRgbColor(entityNode(ent,['front_shoulder','arm']),shirt,color);
      applyRgbColor(entityNode(ent,['back_shoulder','arm_back']),shirt,color);
      applyRgbColor(entityNode(ent,['torso']),shirt,color);
    }
    var pants=rgbDefAtSlot(ent,appearanceFallback,7);
    if(pants){
      applyRgbColor(entityNode(ent,['front_lowerleg','leg']),pants,color);
      applyRgbColor(entityNode(ent,['back_lowerleg','leg_back']),pants,color);
      applyRgbColor(entityNode(ent,['pants']),pants,color);
    }
  }

  function hasRgbKpopShoes(ent,appearanceFallback){
    var def=rgbDefAtSlot(ent,appearanceFallback,3);
    return !!(def&&RGB_KPOP_SHOE_IDS[def.id|0]);
  }

  function rgbKpopMusicState(){
    var service=window.q&&q.diggerzService;
    var local=window.l&&l.z39;
    var scale=window.l&&Number(l._44)||1;
    var state={present:false,factor:0,distance:Infinity};
    if(!local)return state;

    // A wearer always hears their own shoes at full intended volume.
    if(hasRgbKpopShoes(local,service&&service.state&&service.state.appearance)){
      state.present=true;state.factor=1;state.distance=0;return state;
    }

    var lx=Number(local.b6)/scale,ly=Number(local.b7)/scale;
    var peers=service&&service.pvpPeers||{};
    for(var key in peers){
      var peer=peers[key];
      var ent=service&&service.pvpEntityForPeer?service.pvpEntityForPeer(peer):null;
      var peerAppearance=peer&&peer.info&&peer.info.appearance;
      var remoteActive=peer&&peer._build240RgbKpopActive===true;
      if(!remoteActive&&!hasRgbKpopShoes(ent,peerAppearance))continue;
      state.present=true;

      var px=NaN,py=NaN;
      if(ent&&isFinite(Number(ent.b6))&&isFinite(Number(ent.b7))){
        px=Number(ent.b6)/scale;py=Number(ent.b7)/scale;
      }else if(peer&&isFinite(Number(peer.lastX))&&isFinite(Number(peer.lastY))){
        px=Number(peer.lastX);py=Number(peer.lastY);
      }else if(peer&&peer.info&&isFinite(Number(peer.info.x))&&isFinite(Number(peer.info.y))){
        px=Number(peer.info.x);py=Number(peer.info.y);
      }
      if(!isFinite(px)||!isFinite(py)||!isFinite(lx)||!isFinite(ly))continue;
      var distance=Math.hypot(px-lx,py-ly);
      if(distance<state.distance)state.distance=distance;
    }

    if(!state.present||!isFinite(state.distance))return state;
    if(state.distance<=RGB_KPOP_FULL_DISTANCE)state.factor=1;
    else if(state.distance>=RGB_KPOP_FADE_DISTANCE)state.factor=0;
    else{
      var t=(RGB_KPOP_FADE_DISTANCE-state.distance)/(RGB_KPOP_FADE_DISTANCE-RGB_KPOP_FULL_DISTANCE);
      state.factor=t*t*(3-2*t);
    }
    return state;
  }

  function rgbWingDef(ent,appearanceFallback){
    var def=rgbDefAtSlot(ent,appearanceFallback,5);
    return def&&RGB_WING_IDS[def.id|0]?def:null;
  }

  function spawnWingSparkles(ent,def,color,now){
    if(!ent||!def)return;
    if(ent._build240WingSparkAt&&now-ent._build240WingSparkAt<85)return;
    ent._build240WingSparkAt=now;
    var x=Number(ent.b6),y=Number(ent.b7);
    if(!isFinite(x)||!isFinite(y))return;
    try{
      var rt=window.DiggerzRuntime,z=rt&&rt.getZ&&rt.getZ(),f=rt&&rt.getF&&rt.getF();
      var service=window.q&&q.diggerzService,game=service&&service.game;
      if(!z||!f||!f.SPARK_PNG||!game)return;
      for(var si=0;si<2;si++){
        var sp=z.I9();
        sp.Init(f.SPARK_PNG());
        sp.D7(game);
        sp.b6=x+(si?1:-1)*(18+Math.random()*18)+(Math.random()-.5)*7;
        sp.b7=y-12+(Math.random()-.5)*40;
        sp.set_local_xScale(sp.set_local_yScale(.55+Math.random()*.35));
        applyRgbColor(sp,def,color);
        sp.F6(5,.95,0,520);
        sp.F6(3,.75,.08,520);
        sp.F6(4,.75,.08,520);
        game._9.push(sp);
      }
    }catch(error){}
  }

  function spawnKpopTrail(ent,def,color,now){
    if(!ent||!hasRgbKpopShoes(ent))return;
    var x=Number(ent.b6),y=Number(ent.b7);
    if(!isFinite(x)||!isFinite(y))return;
    var lx=Number(ent._build240TrailX),ly=Number(ent._build240TrailY);
    ent._build240TrailX=x;ent._build240TrailY=y;
    if(!isFinite(lx)||!isFinite(ly)||Math.hypot(x-lx,y-ly)<1.25)return;
    if(ent._build240TrailAt&&now-ent._build240TrailAt<95)return;
    ent._build240TrailAt=now;
    try{
      var rt=window.DiggerzRuntime,z=rt&&rt.getZ&&rt.getZ(),f=rt&&rt.getF&&rt.getF();
      var service=window.q&&q.diggerzService,game=service&&service.game;
      if(!z||!f||!f.STAR_PNG||!game)return;
      var sp=z.I9();
      sp.Init(f.STAR_PNG());
      sp.D7(game);
      sp.b6=x+(Math.random()-.5)*12;
      sp.b7=y+12+(Math.random()-.5)*7;
      sp.set_local_xScale(sp.set_local_yScale(.16+Math.random()*.08));
      applyRgbColor(sp,def,color);
      sp.F6(5,.95,0,520);
      sp.F6(3,.2,.04,520);
      sp.F6(4,.2,.04,520);
      game._9.push(sp);
    }catch(error){}
  }

  function ensureRgbKpopAudio(){
    if(rgbKpopAudio||rgbKpopAudioFailed)return rgbKpopAudio;
    try{
      rgbKpopAudio=new Audio(RGB_KPOP_AUDIO_URL);
      rgbKpopAudio.loop=true;
      rgbKpopAudio.preload='auto';
      rgbKpopAudio.volume=0;
      rgbKpopAudio.playsInline=true;
      rgbKpopAudio.onerror=function(){
        rgbKpopAudioFailed=true;
        try{rgbKpopAudio.pause()}catch(error){}
      };
      rgbKpopAudio.load();
    }catch(error){
      rgbKpopAudioFailed=true;
      rgbKpopAudio=null;
    }
    return rgbKpopAudio;
  }

  function tryPlayRgbKpop(){
    var audio=ensureRgbKpopAudio();
    if(!audio||rgbKpopAudioFailed)return;
    try{
      var p=audio.play();
      if(p&&p.catch)p.catch(function(){});
    }catch(error){}
  }

  function installRgbKpopGestureUnlock(){
    if(rgbKpopGestureInstalled)return;
    rgbKpopGestureInstalled=true;
    function unlock(){
      var state=rgbKpopMusicState();
      if(!state.present)return;
      var audio=ensureRgbKpopAudio();
      if(!audio)return;
      try{audio.volume=Math.max(audio.volume,Math.min(RGB_KPOP_MAX_VOLUME,state.factor*RGB_KPOP_MAX_VOLUME))}catch(error){}
      tryPlayRgbKpop();
    }
    document.addEventListener('pointerdown',unlock,{passive:true});
    document.addEventListener('touchstart',unlock,{passive:true});
    document.addEventListener('keydown',unlock);
  }

  function broadcastRgbKpopState(now){
    var service=window.q&&q.diggerzService;
    if(!service||typeof service.pvpSend!=='function')return;
    var local=window.l&&l.z39;
    var appearance=service.state&&service.state.appearance;
    var active=hasRgbKpopShoes(local,appearance);
    if(active!==rgbKpopBroadcastActive||now-rgbKpopBroadcastAt>=2000){
      rgbKpopBroadcastActive=active;
      rgbKpopBroadcastAt=now;
      try{service.pvpSend({t:'rgb-kpop-state',active:!!active})}catch(error){}
    }
  }

  function updateRgbKpopMusic(now){
    broadcastRgbKpopState(now||Date.now());
    var state=rgbKpopMusicState();

    if(!state.present){
      if(rgbKpopAudio&&!rgbKpopAudio.paused){
        try{
          rgbKpopAudio.volume=Math.max(0,rgbKpopAudio.volume-.035);
          if(rgbKpopAudio.volume<=.01){rgbKpopAudio.pause();rgbKpopAudio.currentTime=0}
        }catch(error){}
      }
      return;
    }

    var audio=ensureRgbKpopAudio();
    if(!audio)return;

    var target=Math.max(0,Math.min(RGB_KPOP_MAX_VOLUME,state.factor*RGB_KPOP_MAX_VOLUME));
    try{
      var current=isFinite(Number(audio.volume))?Number(audio.volume):0;
      var step=.045;
      if(current<target)current=Math.min(target,current+step);
      else if(current>target)current=Math.max(target,current-step);
      audio.volume=Math.max(0,Math.min(1,current));
    }catch(error){}

    if(audio.paused&&Date.now()>=rgbKpopAudioRetryAt){
      rgbKpopAudioRetryAt=Date.now()+1200;
      tryPlayRgbKpop();
    }
  }

  function animateEquippedRgb(color,now){
    var service=window.q&&q.diggerzService;
    var local=window.l&&l.z39;
    if(local){
      var localAppearance=service&&service.state&&service.state.appearance;
      tintDirectBodyParts(local,color,localAppearance);
      var ldef=rgbDefAtSlot(local,localAppearance,3);
      if(ldef&&RGB_KPOP_SHOE_IDS[ldef.id|0])spawnKpopTrail(local,ldef,color,now);
      var lwing=rgbWingDef(local,localAppearance);
      if(lwing)spawnWingSparkles(local,lwing,color,now);
    }
    try{
      var peers=service&&service.pvpPeers||{};
      for(var key in peers){
        var peer=peers[key];
        var ent=service.pvpEntityForPeer&&service.pvpEntityForPeer(peer);
        if(!ent)continue;
        var peerAppearance=peer&&peer.info&&peer.info.appearance;
        tintDirectBodyParts(ent,color,peerAppearance);
        var def=rgbDefAtSlot(ent,peerAppearance,3);
        if(def&&RGB_KPOP_SHOE_IDS[def.id|0])spawnKpopTrail(ent,def,color,now);
        var wing=rgbWingDef(ent,peerAppearance);
        if(wing)spawnWingSparkles(ent,wing,color,now);
      }
    }catch(error){}
    updateRgbKpopMusic(now);
  }

  function registerRgbObject(obj,def){
    if(!obj||!def)return obj;
    obj._build240Rgb=def;
    obj._build240RgbStetson=!!def.stetson;
    if(rgbObjects.indexOf(obj)<0)rgbObjects.push(obj);
    return obj;
  }

  function decorateRgbWeekendBox(box){
    if(!box)return box;
    return registerRgbObject(box,{trueRgb:false,box:true,name:'RGB Weekend Box'});
  }

  function animateRgbObjects(now){
    var phase=(Number(now)||Date.now())/3600;
    var color=rainbowRgb(phase);
    var kept=[];
    for(var i=0;i<rgbObjects.length;i++){
      var obj=rgbObjects[i],def=obj&&obj._build240Rgb;
      if(!obj||!def)continue;
      // Pooled display objects can be recycled. Only animate an object while it
      // still carries its RGB marker and has not been destroyed.
      if(obj.a0===1||obj.a2===false)continue;
      // c9=false makes the hue sweep affect the full recovered item image.
      // This also RGB-ifies Golden Wings' inherited sparkle children.
      if(applyRgbColor(obj,def,color))kept.push(obj);
    }
    rgbObjects=kept;
    animateEquippedRgb(color,Number(now)||Date.now());
    requestAnimationFrame(animateRgbObjects);
  }

  function trueRgbMessage(player,itemId){
    var odds=trueRgbOdds(itemId);
    return String(player||'Player')+' FOUND A TRUE RGB ITEM! 1/'+odds.toLocaleString('en-US')+' CHANCE!!! CONGRATS!!!';
  }

  function announceTrueRgb(service,player,itemId){
    var message=trueRgbMessage(player,itemId);
    try{service.message('^6'+message)}catch(error){}
    // Use the same full-screen center-message path used by Super Rare finds.
    try{service.centerMessage('^6'+message)}catch(error){}
    return message;
  }

  function announceTrueRgbLocal(service,itemId){
    var player=service&&service.playerName?service.playerName():'Player';
    return announceTrueRgb(service,player,itemId);
  }

  function installRgb(proto){
    if(rgbInstalled||proto.__build240Rgb)return true;
    if(!window.DiggerzRuntime)return false;
    var rt=window.DiggerzRuntime,h=rt.getH&&rt.getH(),Yf=rt.getYf&&rt.getYf();
    if(!h||typeof h.n7!=='function')return false;

    // Register the virtual variant IDs with every existing inventory/catalog
    // path. The item factory below maps each one onto its recovered base asset.
    var itemPool=window.DiggerzService.ITEM_POOL||[];
    for(var i=0;i<RGB_IDS.length;i++){
      if(itemPool.indexOf(RGB_IDS[i])<0)itemPool.push(RGB_IDS[i]);
      if(itemPool.indexOf(TRUE_RGB_IDS[i])<0)itemPool.push(TRUE_RGB_IDS[i]);
    }

    // Map virtual RGB IDs back to their recovered base IDs in the wearable
    // behavior factory too. This restores native properties such as Golden
    // Wings gravity/sparkles and the K-Pop Shoes dance animation.
    if(Yf&&typeof Yf.W48==='function'&&!Yf.__build240RgbMapped){
      var oldW48=Yf.W48;
      Yf.W48=function(a,b,c){
        var def=RGB_BY_ID[a|0];
        var out=oldW48.call(this,def?def.baseId:a,b,c);
        if(def&&out)registerRgbObject(out,def);
        return out;
      };
      Yf.__build240RgbMapped=true;
    }

    var oldN7=h.n7;
    h.n7=function(a,b,c,d,e,g,p,w,k){
      var def=(a|0)===2?RGB_BY_ID[c|0]:null;
      var args=arguments,out,obj;
      if(def){
        var mapped=[a,b,def.baseId,d,e,g,p,w,k];
        out=oldN7.apply(this,mapped);
        obj=out||b;
        if(obj){
          obj._1=def.name;
          registerRgbObject(obj,def);
        }
        return obj||out;
      }
      out=oldN7.apply(this,args);
      obj=out||b;
      // Clear a stale marker if the display-object pool recycled an old RGB root.
      if(obj&&obj._build240Rgb){obj._build240Rgb=null;obj._build240RgbStetson=false;}
      return out;
    };

    // RGB/True RGB are event-only paths and must never leak into the ordinary
    // weekday Super Rare candidate scan just because their catalog IDs exist.
    if(typeof proto.allSuperRareCandidates==='function'){
      var oldAllSuper=proto.allSuperRareCandidates;
      proto.allSuperRareCandidates=function(){
        var list=oldAllSuper.apply(this,arguments)||[],filtered=[];
        for(var n=0;n<list.length;n++){
          var item=list[n];
          if(item&&!isAnyRgbId(item.id|0))filtered.push(item);
        }
        return filtered;
      };
    }

    if(typeof proto.todaySuperRares==='function'){
      var oldToday=proto.todaySuperRares;
      proto.todaySuperRares=function(){
        if(isRgbWeekend()){
          var ids=featuredRgbIds(),list=[];
          for(var n=0;n<ids.length;n++)list.push({category:2,id:ids[n],count:1,tier:'super'});
          return list;
        }
        return oldToday.apply(this,arguments);
      };
    }

    if(typeof proto.superRareRewardAt==='function'){
      var oldSuper=proto.superRareRewardAt;
      proto.superRareRewardAt=function(hash){
        if(isRgbWeekend()){
          var ids=featuredRgbIds();
          if(!ids.length)return null;
          return {category:2,id:ids[Math.abs(hash|0)%ids.length],count:1,tier:'super'};
        }
        var reward=oldSuper.apply(this,arguments);
        // Belt-and-suspenders protection for an older cached candidate list.
        if(reward&&isAnyRgbId(reward.id|0))return null;
        return reward;
      };
    }

    // True RGB gets its own pickup celebration instead of the normal Super Rare
    // screen. The global relay happens only after the item actually entered the
    // inventory, so a full inventory cannot trigger a fake find announcement.
    if(typeof proto.pickup==='function'){
      var oldPickup=proto.pickup;
      proto.pickup=function(packet){
        var pos=packet&&packet.Q0,guid=null,key='',drop=null,before=0;
        try{
          if(packet){guid=packet.Q6();key=guid&&guid.q4?guid.q4():'';drop=key?this.drops[key]:null;packet.Q0=pos}
          if(drop&&drop.tier==='true-rgb'&&RGB_BY_ID[drop.id|0]&&RGB_BY_ID[drop.id|0].trueRgb){
            before=inventoryCount(this,drop.category,drop.id);
          }else drop=null;
        }catch(error){try{if(packet)packet.Q0=pos}catch(_e){}}
        var result=oldPickup.call(this,packet);
        if(drop){
          var after=inventoryCount(this,drop.category,drop.id);
          if(after>before){
            var itemName=RGB_BY_ID[drop.id|0].name;
            announceTrueRgbLocal(this,drop.id|0);
            try{
              if(typeof this.pvpSend==='function')this.pvpSend({t:'true-rgb-found',itemId:drop.id|0,itemName:itemName});
            }catch(error){}
          }
        }
        return result;
      };
    }

    // Every room/server client receives the same global True RGB celebration.
    if(typeof proto.pvpReceive==='function'){
      var oldReceive=proto.pvpReceive;
      proto.pvpReceive=function(message){
        // Multiplayer drop awards bypass the normal pickup() path, so announce
        // a True RGB find here after the server-authoritative item reaches inventory.
        if(message&&message.t==='drop-award'&&message.drop&&message.drop.tier==='true-rgb'){
          var award=message.drop,id=award.id|0,def=RGB_BY_ID[id];
          if(def&&def.trueRgb){
            var before=inventoryCount(this,award.category|0,id);
            var result=oldReceive.apply(this,arguments);
            var after=inventoryCount(this,award.category|0,id);
            if(after>before){
              announceTrueRgbLocal(this,id);
              try{if(typeof this.pvpSend==='function')this.pvpSend({t:'true-rgb-found',itemId:id,itemName:def.name})}catch(error){}
            }
            return result;
          }
        }
        if(message&&message.t==='rgb-kpop-state'){
          try{
            var peer=this.pvpPeerForConnection&&this.pvpPeerForConnection(message._serverFrom);
            if(peer)peer._build240RgbKpopActive=!!message.active;
          }catch(error){}
          return;
        }
        if(message&&message.t==='true-rgb-global'){
          var who=String(message.name||'Player');
          var id=message.itemId|0;
          announceTrueRgb(this,who,id);
          return;
        }
        return oldReceive.apply(this,arguments);
      };
    }

    proto.__build240Rgb=true;
    rgbInstalled=true;
    if(!rgbAnimationStarted){
      rgbAnimationStarted=true;
      installRgbKpopGestureUnlock();
      requestAnimationFrame(animateRgbObjects);
    }
    return true;
  }

  function dropPacket(service,drop,fromY,toY){
    if(!service||!drop||!drop.guid||!service.enqueue)return;
    var x=Number(drop.x)||0;
    var endY=Number(toY);
    var startY=Number(fromY);
    if(!isFinite(endY)||!isFinite(startY))return;
    service.enqueue(15,1,function(packet){
      packet.R8(drop.guid);
      packet.R4(drop.category|0);
      packet.r8(x);
      packet.r8(0);
      packet.r8(endY);
      packet.r8(x);
      packet.r8(0);
      packet.r8(startY);
      packet.R2(drop.id|0);
      packet.R2(Math.max(1,drop.count|0));
      packet.R0(0);
      packet.s0(true);
      packet.R9(String(drop.text||''));
    });
    drop.y=endY;
    drop._build240LastGravityAt=Date.now();
  }

  function shouldFall(service,drop){
    if(!service||!service.state||!drop||drop.isCoin)return false;
    if((drop.count|0)<=0)return false;
    var height=Number(service.state.height)||80;
    var y=Number(drop.y);
    var x=Math.round(Number(drop.x)||0);
    if(!isFinite(y)||y>=height-1.15)return false;
    var probeY=Math.floor(y+1.0);
    if(probeY<0||probeY>=height)return false;
    try{return !(service.tileAt(x,probeY)|0)}catch(error){return false}
  }

  function gravityStep(){
    try{
      var service=(window.q&&q.diggerzService)||(window.DiggerzPvp22&&window.DiggerzPvp22.service);
      if(!service||!service.drops||!service.state)return;
      var now=Date.now(),height=Number(service.state.height)||80;
      for(var key in service.drops){
        if(!Object.prototype.hasOwnProperty.call(service.drops,key))continue;
        var drop=service.drops[key];
        if(!drop||drop.isCoin)continue;
        if(!drop._build240BornAt)drop._build240BornAt=now;
        if(now-drop._build240BornAt<450)continue;
        if(drop._build240LastGravityAt&&now-drop._build240LastGravityAt<360)continue;
        if(!shouldFall(service,drop))continue;
        var oldY=Number(drop.y)||0;
        var newY=Math.min(height-1.2,oldY+0.72);
        if(newY>oldY+0.01)dropPacket(service,drop,oldY,newY);
      }
    }catch(error){}
  }

  function install(){
    if(installed)return true;
    if(!window.DiggerzService||!window.DiggerzService.prototype||!window.DiggerzRuntime)return false;
    var proto=window.DiggerzService.prototype;
    if(proto.__build240Patches&&proto.__build240Rgb){installed=true;return true}

    if(!proto.__build240Patches){
      proto.__build240Patches=true;

      // Track blocks placed after the world was loaded. Re-mining a placed block
      // cannot generate another bonus-loot roll. Build 24.0 also no longer
      // returns mined terrain itself to inventory.
      var oldSetTile=proto.setTile;
      if(typeof oldSetTile==='function'){
        proto.setTile=function(x,y,id,variant){
          var result=oldSetTile.call(this,x,y,id,variant);
          if(result!==false&&(id|0)>0){
            if(!this._build240PlacedTiles)this._build240PlacedTiles={};
            this._build240PlacedTiles[(x|0)+':'+(y|0)]=true;
          }
          return result;
        };
      }

      // Every successful natural-block break gets fresh independent randomness.
      // Monday-Friday first checks the ultra-rare True RGB tables. Saturday/Sunday
      // reserve Super Rare finds for the three featured normal RGB variants.
      proto.miningRewardAt=function(x,y){
        var placed=this._build240PlacedTiles&&this._build240PlacedTiles[(x|0)+':'+(y|0)];
        if(placed){
          delete this._build240PlacedTiles[(x|0)+':'+(y|0)];
          return null;
        }

        if(isRgbWeekend()){
          // RGB Weekend gets an extra independent Super Rare roll before the
          // normal mining table, making the featured trio roughly twice as
          // obtainable as ordinary daily Super Rares without reducing any
          // existing Rare/Common reward band.
          var rgbWeekendBonusRoll=randomHash()%10000;
          if(rgbWeekendBonusRoll<12){
            return this.superRareRewardAt(randomHash());
          }
        }else{
          var trueReward=rollTrueRgbReward();
          if(trueReward)return trueReward;
        }

        var hash=randomHash();
        var roll=hash%10000,item,list;
        if(roll<12)return this.superRareRewardAt(hash);
        if(roll<42){
          list=window.DiggerzService.RARE_REWARDS||[];
          if(list.length){
            item=list[Math.floor(hash/42)%list.length];
            return {category:item.category,id:item.id,count:item.count||1,tier:'rare'};
          }
          var rares=window.DiggerzService.RARE_DROPS||[];
          if(!rares.length)return null;
          return {category:2,id:rares[Math.floor(hash/42)%rares.length],count:1,tier:'rare'};
        }
        if(roll<1242){
          // Preserve the established Build 23.3 common-reward quantities/pool;
          // only the random source changed in Build 24.
          list=window.DiggerzService.COMMON_REWARDS||[];
          if(list.length){
            item=list[Math.floor(hash/642)%list.length];
            return {category:item.category,id:item.id,count:item.count||1,tier:item.category===1?'block':'weapon'};
          }
          if(roll<642){
            var blocks=window.DiggerzService.NORMAL_BLOCK_POOL||[];
            if(!blocks.length)return null;
            return {category:1,id:blocks[Math.floor(hash/642)%blocks.length],count:1,tier:'block'};
          }
          return this.normalWeaponRewardAt(hash);
        }
        return null;
      };

      // Mark newly-created pickups so the original spawn hop happens once,
      // then Build 24 gravity pulls them down through cleared space.
      var oldSpawnDrop=proto.spawnDrop;
      if(typeof oldSpawnDrop==='function'){
        proto.spawnDrop=function(){
          var before={},key;
          for(key in this.drops)before[key]=true;
          var result=oldSpawnDrop.apply(this,arguments);
          var now=Date.now();
          for(key in this.drops){
            if(!before[key]&&this.drops[key])this.drops[key]._build240BornAt=now;
          }
          return result;
        };
      }

      gravityTimer=setInterval(gravityStep,90);
    }

    if(!installRgb(proto))return false;

    installed=true;
    window.DiggerzBuild240={
      build:BUILD,
      patches:true,
      rgb:true,
      timeZone:RGB_TIME_ZONE,
      isRgbWeekend:isRgbWeekend,
      featuredRgbIds:featuredRgbIds,
      isRgbWeaponId:isRgbWeaponId,
      isAnyRgbId:isAnyRgbId,
      decorateRgbWeekendBox:decorateRgbWeekendBox,
      normalRgbIds:RGB_IDS.slice(),
      trueRgbIds:TRUE_RGB_IDS.slice()
    };
    return true;
  }

  function boot(){if(!install())setTimeout(boot,100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
}());


/* Build 24.0 — fanmade classic Roblox collab */
(function(){
  'use strict';

  var NOOB_MASK_ID=600;
  var NOOB_SHIRT_ID=601;
  var NOOB_PANTS_ID=602;
  var NOOB_GLOVES_ID=603;
  var ROBLOX_LAUNCHER_ID=604;
  var COLLAB_IDS={600:true,601:true,602:true,603:true,604:true};
  var BASE_IDS={600:42,601:20,602:23,603:66,604:139};
  var COLLAB_EXPIRES=Date.parse('2026-12-01T23:59:59-05:00');

  var NOOB_MASK_SRC='data:image/png;base64,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';
  var NOOB_SHIRT_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAbCAYAAAAZMl2nAAAC40lEQVR4nNWXS2sTURiGn8kZJ552dLCCSQ2ODS3WNA3opqJobRutYm8gqAsX/gEvOym4FC8BN6504x9w4aUtSBdtV65cuFAstYUKFaIuAtWR0GkmcRGnTi61aUwUXzibmXPmfeZ7zzDfgf9MUeA5sApkKxxpYByIVGKgVABwGxjUNM3X1NSEpmkIIX67yHEcbNsmlUph27YDvACuA7PVgESBKU3TAu3t7XwxRunpjRNr1TZgh4wDsx9sZqYnCXy9x9zcHLZtfwL61oNZDyQKTEkpA42dd+nqPseR2FZUsVEBi4FyvJpd4eX0Y76/HSWdTq8Ls96TJ3RdH5Cx+wwPDxFuVom0aMwvrW4KxIVZTGYYGxsn/eYalmU9Bc4Wz1PLrI0Cp9WWyzy8c2HTxiUGQiHcrNJ3YoDJ5Vl4d2+w3DxfmWsJwzDEtvDFgovVVMMLE2nRaAidgfzLl3xJ5UDiPvMK/UcCVRuXh4HGplaCwaAC3NoIJCqE8GtGhDOHG2oMotDf1YAdvAxQEk8xSMI0TWV76GhNIVw17xRoRgQhREk8xSDx1NaRkmr8yf4o1u5wF21tbSXxFIP4fapO9wFZM2Ov3Hg+iyGAQZ/vl70XJCqlRDMq+jVULb1BQdsRQ0qpZrPZNTMvSMI0TaWnN16wsJaxQL4qx473Y5pmQTxekHjSOcr5uF5T43I6uM9PMtcDnnhckKiU0q+3Xqo7hCt974WCeFyQhK7rylB8f8HkWsfiShUKQyc7MQxjLR4XJC6EYM+ucr+e+sjjNegF8QNEWjbuNeog1Qvyz7UG4jgOTja3dqNe+8PVYjKD4zglII5lWVy9OcPr9yt1hcg4OeY/rjLxYgbLsgBW4FeH9gwYCYVCOPsecKrvEOHdW1B/3yNvWktfMkxML/Bt4RFq6impVArynf6wC9IBTAFBKSVut15r2bbN8vKyW4ks+SPKDYp62I6fdGkqP7tUM2zgCRWed/66fgA2xu4eISRIOQAAAABJRU5ErkJggg==';
  var NOOB_PANTS_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAICAYAAACccC2SAAAA9ElEQVR4nLWTMUoDURCGv5ndPYLRxsbOnMMLWdvlAta5hCBiJblEGsEyWAUXt5CE9b03v0WiJpLO7AcDwzDD/zPDGBtOgCvgwmuvJaEQXjtVU2FuYBwHgUKUVCJSvAAzc3szc8Mqi9HtyJrzZm+mvJcjqR8mPoLl9VIKuZsbCGIVg4oeNLIK0CZ3hYgc5EX+KcLw20CQF5nIgULUCgGUbtrV1WnF3/MMRXpNdNMOoEfg2/pjpKCdtPTzHq0Fhb0N/RsBBbQW/bynnbRECoAn+P2FMTADzgC8GfRbvg0EcA/cAM+7rWPgAVhvm4aKT+AOuNwV/wJ//ZJ8riASjwAAAABJRU5ErkJggg==';
  var NOOB_FRONT_LEG_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAARCAYAAADHeGwwAAABNElEQVR4nLWUPU7DQBCFvxlvRAsFAin8pDUcg4YiLSfgLBQcghMgRQjoKJE4CUggCsqIxN6hsI1tvI4XFJ602r+Z92ZmVwMdCCApyAxkAeIjxqK0Twv/NltAgBxQdYqOEjSRoCUGPjf8MsdnHsAjJFh52RUQANORsnu1g9t24PpDKTkgg+w94/X8Db/0pfUKgb3rMbqlSJA1DMPwH57ns5eWgKtNajI3Lo5tbvSicWVWbHRTfwRraIP8HrDJ02FMuEOYVQstyY+B02HmaEyLSaoMuASSaPfhp3FACnwLnABMHiPKAzElEuCiKbABtHLofeDAsUid0sHDfrWcNgX+A+73AsOl6SAoECzPAHmzTCGBfKX3HyIHPittQG5AbM3jtvzPAsgRyB3IPLI9R7funj68PnwBCCZ4xhM/J2YAAAAASUVORK5CYII=';
  var NOOB_BACK_LEG_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAPCAYAAAD+pA/bAAABAUlEQVR4nLWUPU4DMRCFv+dstBIpaKAAEuoEjkFDkTNwFURBwTXoiVBA4io5QWhoKFBY0NoUa7M/kGQtlk+yPJal98YztkUNATj1+uyNd0kvU+ixnRyyq4yXxSsu//RCrlRsGhzeHmAG5sfuRhzYN8vy4rlmYBriACT7CWbH0JpCq0iqoWcqi0fAHT+NItJeyywEoQ6nwHkXyp5pMem7RDe0a2dbEmACZQ/OAEbzYVcGAq6rBimA+r7RDuzKxsl5hndHIZxCcZQSF53pJhKoXdP/4VcD+x5RnsCaRxkM8njFrWQVa92DXMdj7o8lQCegB9AKZP84PkAz0ASE4n60eL4AFXZQ+i2pkGIAAAAASUVORK5CYII=';
  var NOOB_HAND_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAQCAYAAAAWGF8bAAABY0lEQVR4nL2UvUoDQRSFv7t/2VSCPwjBQmzExFew0TJWWgu+gYXYWggW+hS2Nopom8pXEIJFUBKIqRVZ3I07FpNJJtkJQRAPfLDLzJx77u7ehX9SDbgDMiCfIAHugY3fmPUANYM3l6k4zBrAMkD6vOWsGK0/mssesA00pxk+AHWArLWPyj+sJW+Uwp8jXLs2t7fA3jTDBIiz10PIU1TaRj+2CQWLSDBPuHrFYMOmSelZ22pAyRwgqoBXAq9cQLwy5Ikd/bzYB1yYxCIRIhFI7ER9v4PEZC8H5uzuMLxluAOQdY5BIlTypJMUpAZRxtYC9BtvmoTDdiVYAImcrSIRSGlApNES07YxPBnWklDjxQ4s8/wTxCfrHJmTdbvlJYB+9wzER3217Ooj2d+EynXhkfp2wjaggsop4IME4+AXkRCRgHDl0hg2bPcqepRmjds0ujjGsIoe+oTiD2EaKXDjMvsz/QB75m13cv/lWQAAAABJRU5ErkJggg==';
  var NOOB_SHOE_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAoElEQVR4nNWVSw7CIBRFj03jwJ2UzbdJmzhzO12BcQCCA4phgG3FV4gvuSEwOfddfvAnpYAB0ICNZBJrD2AEOkn4DLgvZX41Erp+ZsBjzTkmcrsWMSEND+prwh1+K1dTOBK+mUIJ+GoKYwF4MoXTMt6By6d4hEsD5zBplrEtBAf/QL0rGLgWNHBLLSpgwrs78gAO7LiKE/5DsULSe8DV6gUFd+7PNDku5AAAAABJRU5ErkJggg==';
  var ROCKET_SRC='data:image/png;base64,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[... ELLIPSIZATION ...]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';
  var ROCKET_LAUNCH_SRC='data:audio/ogg;base64,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';
  var ROCKET_EXPLOSION_SRC='data:audio/ogg;base64,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';
  var OUCH_SRC='data:audio/ogg;base64,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';
  var OOF_SRC='data:audio/ogg;base64,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';
  var MULE_SRC='/mule.ogg';
  var EPIC_SEA_SRC='epic_sea.ogg';

  var overlayLayer=null,overlayNodes={},projectileNodes=[];
  var muleAudio=null,mulePvp=false,muleTrackKey='';
  var mapMusicAudio=null,mapMusicName='',mapMusicPvp=false,mapMusicKey='';
  var installed=false;

  function playOne(src,volume){
    try{var a=new Audio(src);a.volume=volume==null?.8:volume;a.play().catch(function(){});return a}catch(error){return null}
  }
  function fullNoob(ap){
    return !!(ap&&((ap[1]|0)===NOOB_MASK_ID)&&((ap[2]|0)===NOOB_SHIRT_ID)&&((ap[4]|0)===NOOB_GLOVES_ID)&&((ap[7]|0)===NOOB_PANTS_ID));
  }
  function mappedId(id){return BASE_IDS[id|0]||0}
  function applyCollabLook(obj,id,f,h){
    if(!obj)return obj;
    id=id|0;
    obj._build240CollabId=id;

    // IMPORTANT: h.n7/W48 build the collab item from a recovered base item.
    // The inventory equip code only allows an item to be worn when the rendered
    // object's h44 matches the ORIGINAL inventory item id. If h44 stays as the
    // borrowed base id (Pumpkin Mask 42 / Bazooka 139), item 600 cannot be
    // re-equipped and item 604 is stored/drawn as the wrong base item.
    // Restore the virtual collab identity and its real wearable slot here.
    try{
      obj.a4=2;
      obj.h44=id;
      if(id===NOOB_MASK_ID)obj.t46=1;
      else if(id===NOOB_SHIRT_ID)obj.t46=2;
      else if(id===NOOB_PANTS_ID)obj.t46=7;
      else if(id===NOOB_GLOVES_ID||id===ROBLOX_LAUNCHER_ID)obj.t46=4;
    }catch(error){}

    if(id===NOOB_MASK_ID){
      obj._1='Noob Mask';
    }else if(id===NOOB_SHIRT_ID){
      try{
        if(f&&f.WHITE_TORSO_PNG&&obj.Init)obj.Init(f.WHITE_TORSO_PNG());
        if(obj._9&&obj._9.length&&f&&f.WHITE_ARM_PNG&&obj._9[0]&&obj._9[0].Init)obj._9[0].Init(f.WHITE_ARM_PNG());
        if(obj.h4)obj.h4(4);
      }catch(error){}
      obj._1='Noob Shirt';
    }else if(id===NOOB_PANTS_ID){
      try{
        if(obj.set_local_r)obj.set_local_r(.58);
        if(obj.set_local_g)obj.set_local_g(1.12);
        if(obj.set_local_b)obj.set_local_b(.48);
        obj.c9=true;
      }catch(error){}
      obj._1='Noob Pants';
    }else if(id===NOOB_GLOVES_ID){
      try{
        if(f&&f.HAND_WHITE_PNG&&obj.Init)obj.Init(f.HAND_WHITE_PNG());
        if(obj.h4)obj.h4(9);
      }catch(error){}
      obj._1='Noob Gloves';
    }else if(id===ROBLOX_LAUNCHER_ID){
      obj._1='Roblox Rocket Launcher';
    }
    return obj;
  }

  function canvasMetrics(){
    var canvas=document.querySelector('canvas');
    if(!canvas)return{x:0,y:0,s:1};
    var r=canvas.getBoundingClientRect(),logicalW=window.q&&isFinite(q.SCREENWIDTH)&&q.SCREENWIDTH>0?q.SCREENWIDTH:r.width,logicalH=window.q&&isFinite(q.SCREENHEIGHT)&&q.SCREENHEIGHT>0?q.SCREENHEIGHT:r.height;
    var s=r.height/logicalH,gameW=logicalW*s;
    return{x:r.left+Math.max(0,(r.width-gameW)/2),y:r.top,s:s};
  }
  function child(root,name){try{return root&&root.f2?root.f2(name):null}catch(error){return null}}
  function entityAppearance(ent,fallback){return ent&&ent.J33&&ent.J33.length?ent.J33:fallback}
  function pointFor(ent,part){
    try{
      var n=ent&&ent.i33&&ent.i33.f2?ent.i33.f2(part):null;
      var wt=n&&n.__worldTransform;
      if(wt&&isFinite(wt.tx)&&isFinite(wt.ty))return{x:wt.tx,y:wt.ty,node:n};
      if(n&&isFinite(n.A7)&&isFinite(n.A8))return{x:n.A7,y:n.A8,node:n};
    }catch(error){}
    try{
      var ewt=ent&&ent.__worldTransform;
      if(ewt&&isFinite(ewt.tx)&&isFinite(ewt.ty))return{x:ewt.tx,y:ewt.ty,node:ent};
    }catch(error){}
    if(ent&&isFinite(ent.A7)&&isFinite(ent.A8))return{x:ent.A7,y:ent.A8,node:ent};
    return null;
  }

  function ensureLayer(){
    if(overlayLayer)return overlayLayer;
    overlayLayer=document.createElement('div');
    overlayLayer.id='diggerz-roblox240-layer';
    overlayLayer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147482200;overflow:hidden';
    document.body.appendChild(overlayLayer);
    var style=document.createElement('style');
    style.textContent='.diggerz-noob-mask240,.diggerz-rbx-launcher240{position:fixed;transform-origin:50% 50%;pointer-events:none}.diggerz-noob-mask240{image-rendering:pixelated}.diggerz-rbx-launcher240{image-rendering:auto}.diggerz-stud240{position:fixed;width:18px;height:12px;background:#8d8d8d;border:2px solid #252525;box-sizing:border-box;transform-origin:50% 50%;box-shadow:inset 2px 2px #c9c9c9,inset -2px -2px #555}.diggerz-stud240:before,.diggerz-stud240:after{content:"";position:absolute;width:4px;height:3px;top:-5px;background:#aaa;border:1px solid #333}.diggerz-stud240:before{left:2px}.diggerz-stud240:after{right:2px}.diggerz-noob-piece240{position:fixed;image-rendering:pixelated;pointer-events:none;z-index:2147482250;transition:transform 900ms cubic-bezier(.1,.8,.2,1),opacity 900ms linear}';
    document.head.appendChild(style);
    return overlayLayer;
  }
  function overlayImg(key,cls,src){
    ensureLayer();
    var img=overlayNodes[key];
    if(!img){img=document.createElement('img');img.className=cls;img.src=src;img.alt='';overlayLayer.appendChild(img);overlayNodes[key]=img}
    return img;
  }
  function hideNativeWear(ent,slotPart,hide){
    try{
      var part=ent&&ent.i33&&ent.i33.f2?ent.i33.f2(slotPart):null;
      var wear=part&&part.f2?part.f2('wear'):null;
      if(wear&&wear.set_local_alp)wear.set_local_alp(hide?0:1);
    }catch(error){}
  }
  function findCollabNode(root,id,depth){
    if(!root||depth>7)return null;
    try{if((root._build240CollabId|0)===(id|0))return root}catch(error){}
    var kids=null;
    try{kids=root._9}catch(error){}
    if(kids&&kids.length){
      for(var i=0;i<kids.length;i++){
        var hit=findCollabNode(kids[i],id,depth+1);
        if(hit)return hit;
      }
    }
    return null;
  }
  function collabNode(ent,id){
    return findCollabNode(ent&&ent.i33,id,0)||findCollabNode(ent,id,0);
  }
  function hideCollabNative(ent,id,hide){
    try{
      var node=collabNode(ent,id);
      if(node&&node.set_local_alp)node.set_local_alp(hide?0:1);
    }catch(error){}
  }
  function pointForNode(node){
    try{
      var wt=node&&node.__worldTransform;
      if(wt&&isFinite(wt.tx)&&isFinite(wt.ty))return{x:wt.tx,y:wt.ty,node:node};
      if(node&&isFinite(node.A7)&&isFinite(node.A8))return{x:node.A7,y:node.A8,node:node};
    }catch(error){}
    return null;
  }
  function collabEquipped(ent,ap,id,slot){
    if(ap&&((ap[slot]|0)===(id|0)))return true;
    return !!collabNode(ent,id);
  }
  function fullNoobEquipped(service,ent,ap){
    ap=ap||(service&&service.state&&service.state.appearance);
    if(fullNoob(ap))return true;
    return !!(collabEquipped(ent,ap,NOOB_MASK_ID,1)&&
      collabEquipped(ent,ap,NOOB_SHIRT_ID,2)&&
      collabEquipped(ent,ap,NOOB_GLOVES_ID,4)&&
      collabEquipped(ent,ap,NOOB_PANTS_ID,7));
  }
  function isLavaSource(source){
    if(source==null)return false;
    if(typeof source==='string')return source.toLowerCase().indexOf('lava')>=0;
    if(typeof source==='object'){
      var keys=['type','kind','name','source','damageType','tileName','label','cause'];
      for(var i=0;i<keys.length;i++){
        try{
          var v=source[keys[i]];
          if(v!=null&&String(v).toLowerCase().indexOf('lava')>=0)return true;
        }catch(error){}
      }
    }
    return false;
  }
  function renderPerson(key,ent,ap){
    var m=canvasMetrics();
    var maskOn=collabEquipped(ent,ap,NOOB_MASK_ID,1);
    var rocketOn=collabEquipped(ent,ap,ROBLOX_LAUNCHER_ID,4);
    var mask=overlayNodes[key+':mask'],rocket=overlayNodes[key+':rocket'];
    var face=ent&&ent.i33&&Number(ent.i33.b4)<0?-1:1;
    if(maskOn&&ent){
      var maskNative=collabNode(ent,NOOB_MASK_ID);
      var hp=pointForNode(maskNative)||pointFor(ent,'head');
      if(hp){
        hideNativeWear(ent,'head',true);
        hideCollabNative(ent,NOOB_MASK_ID,true);
        mask=overlayImg(key+':mask','diggerz-noob-mask240',NOOB_MASK_SRC);
        mask.style.display='block';
        mask.style.width=Math.max(28,56*m.s)+'px';
        mask.style.height=Math.max(25,50*m.s)+'px';
        mask.style.left=(m.x+(hp.x-28)*m.s)+'px';
        mask.style.top=(m.y+(hp.y-25)*m.s)+'px';
        mask.style.transform='scaleX('+(face<0?1:-1)+')';
      }
    }else{
      if(mask)mask.style.display='none';
      if(ent){hideNativeWear(ent,'head',false);hideCollabNative(ent,NOOB_MASK_ID,false)}
    }
    if(rocketOn&&ent){
      var rocketNative=collabNode(ent,ROBLOX_LAUNCHER_ID);
      var apnt=pointForNode(rocketNative)||pointFor(ent,'front_arm')||pointFor(ent,'torso');
      if(apnt){
        hideNativeWear(ent,'front_arm',true);
        hideCollabNative(ent,ROBLOX_LAUNCHER_ID,true);
        rocket=overlayImg(key+':rocket','diggerz-rbx-launcher240',ROCKET_SRC);
        rocket.style.display='block';
        rocket.style.width=Math.max(92,112*m.s)+'px';
        rocket.style.height='auto';
        rocket.style.left=(m.x+(apnt.x+(face<0?-101:-11))*m.s)+'px';
        rocket.style.top=(m.y+(apnt.y-14)*m.s)+'px';
        rocket.style.transform='scaleX('+face+')';
      }
    }else{
      if(rocket)rocket.style.display='none';
      if(ent){hideNativeWear(ent,'front_arm',false);hideCollabNative(ent,ROBLOX_LAUNCHER_ID,false)}
    }
  }

  function overlayLoop(){
    try{
      var svc=window.q&&q.diggerzService,seen={};
      var local=window.l&&l.z39,localAp=svc&&svc.state&&svc.state.appearance;
      seen.local=true;if(local)renderPerson('local',local,localAp);
      var peers=svc&&svc.pvpPeers||{};
      for(var k in peers){
        var p=peers[k],e=svc&&svc.pvpEntityForPeer?svc.pvpEntityForPeer(p):null,ap=p&&p.info&&p.info.appearance;
        seen[k]=true;if(e)renderPerson(k,e,ap);
      }
      for(var n in overlayNodes){
        var base=n.split(':')[0];
        if(base!=='local'&&!seen[base])overlayNodes[n].style.display='none';
      }
      var m=canvasMetrics(),keep=[],now=Date.now();
      for(var i=0;i<projectileNodes.length;i++){
        var rec=projectileNodes[i],pr=rec.projectile;
        if(!pr){try{if(rec.launchAudio){rec.launchAudio.pause();rec.launchAudio.currentTime=0}}catch(error){}continue}
        var x=isFinite(pr.A7)?pr.A7:pr.b6,y=isFinite(pr.A8)?pr.A8:pr.b7;
        if(isFinite(x)&&isFinite(y)){
          if(isFinite(rec.lastX)&&isFinite(rec.lastY)&&Math.abs(x-rec.lastX)+Math.abs(y-rec.lastY)>.25)rec.moved=true;
          rec.lastX=x;rec.lastY=y;
        }
        var age=now-(rec.createdAt||now);
        var ended=(pr.a0===1)||(pr.a2===false&&rec.moved&&age>60);
        if(ended){
          try{if(rec.launchAudio){rec.launchAudio.pause();rec.launchAudio.currentTime=0}}catch(error){}
          try{if(rec.moved&&window.DiggerzBuild240&&window.DiggerzBuild240.robloxRocketImpactSound)window.DiggerzBuild240.robloxRocketImpactSound(pr)}catch(error){}
          continue;
        }
        if(age<8000)keep.push(rec);
        else try{if(rec.launchAudio){rec.launchAudio.pause();rec.launchAudio.currentTime=0}}catch(error){}
      }
      projectileNodes=keep;
    }catch(error){}
    requestAnimationFrame(overlayLoop);
  }

  function explodeNoobAtPoint(p){
    if(!p)return;
    ensureLayer();
    var m=canvasMetrics();
    var parts=[
      [NOOB_MASK_SRC,56,50],[NOOB_SHIRT_SRC,34,27],[NOOB_PANTS_SRC,34,8],
      [NOOB_FRONT_LEG_SRC,24,17],[NOOB_BACK_LEG_SRC,24,15],
      [NOOB_HAND_SRC,20,16],[NOOB_HAND_SRC,20,16],[NOOB_SHOE_SRC,32,16],[NOOB_SHOE_SRC,32,16]
    ];
    for(var i=0;i<parts.length;i++){
      (function(part,index){
        var img=document.createElement('img');img.className='diggerz-noob-piece240';img.src=part[0];img.alt='';
        var scale=Math.max(.7,m.s),w=part[1]*scale,h=part[2]*scale;
        img.style.width=w+'px';img.style.height=h+'px';
        img.style.left=(m.x+p.x*m.s-w/2)+'px';img.style.top=(m.y+p.y*m.s-h/2)+'px';
        overlayLayer.appendChild(img);
        var ang=(Math.PI*2*index/parts.length)+(Math.random()-.5)*.35,dist=55+Math.random()*65,dx=Math.cos(ang)*dist,dy=Math.sin(ang)*dist-20;
        requestAnimationFrame(function(){img.style.transform='translate('+dx+'px,'+dy+'px) rotate('+((Math.random()*540)-270)+'deg)';img.style.opacity='0'});
        setTimeout(function(){try{img.remove()}catch(error){}},980);
      })(parts[i],i);
    }
  }
  function explodeNoobAt(ent){
    if(!ent)return;
    var p=pointFor(ent,'torso')||pointFor(ent,'head');
    if(p)explodeNoobAtPoint({x:p.x,y:p.y});
  }
  function scheduleNoobDeath(ent,volume){
    if(!ent)return;
    var p=pointFor(ent,'torso')||pointFor(ent,'head');
    if(!p)return;
    p={x:p.x,y:p.y};
    var started=Date.now(),done=false;
    function finish(){
      if(done)return;done=true;
      try{explodeNoobAtPoint(p);playOne(OOF_SRC,volume==null?.9:volume)}catch(error){}
    }
    function tick(){
      if(done)return;
      var age=Date.now()-started,gone=false;
      try{
        gone=!ent||ent.a0===1||ent.a2===false||
          (ent.i33&&(ent.i33.a0===1||ent.i33.a2===false))||
          (window.l&&window.l.z39&&window.l.z39!==ent);
      }catch(error){}
      if((gone&&age>=35)||age>=360){finish();return}
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function ensureMule(){
    if(muleAudio)return muleAudio;
    try{muleAudio=new Audio(MULE_SRC);muleAudio.loop=true;muleAudio.preload='auto';muleAudio.volume=.7}catch(error){muleAudio=null}
    return muleAudio;
  }
  function mulePlayAt(startedAt,serverNow,volume){
    var a=ensureMule();if(!a)return;
    a.volume=volume==null?.7:volume;
    function sync(){
      try{
        var elapsed=Math.max(0,((serverNow||Date.now())-(startedAt||Date.now()))/1000);
        if(isFinite(a.duration)&&a.duration>0)a.currentTime=elapsed%a.duration;
        a.play().catch(function(){});
      }catch(error){}
    }
    if(a.readyState>=1)sync();else a.addEventListener('loadedmetadata',sync,{once:true});
  }
  function stopMule(){if(muleAudio)try{muleAudio.pause();muleAudio.currentTime=0}catch(error){}mulePvp=false;muleTrackKey=''}
  function mapMusicUrl(name){
    name=String(name||'');
    return name==='epic_sea.ogg'?EPIC_SEA_SRC:name;
  }
  function ensureMapMusic(name){
    name=String(name||'');
    if(!name)return null;
    if(mapMusicAudio&&mapMusicName===name)return mapMusicAudio;
    if(mapMusicAudio)try{mapMusicAudio.pause();mapMusicAudio.currentTime=0}catch(error){}
    mapMusicName=name;
    try{
      mapMusicAudio=new Audio(mapMusicUrl(name));
      mapMusicAudio.loop=true;
      mapMusicAudio.preload='auto';
      mapMusicAudio.volume=.7;
    }catch(error){mapMusicAudio=null}
    return mapMusicAudio;
  }
  function mapMusicPlayAt(name,startedAt,serverNow,volume){
    var a=ensureMapMusic(name);if(!a)return;
    var key=String(name)+'|'+String(startedAt||0);
    a.volume=volume==null?.7:volume;
    function sync(){
      try{
        var elapsed=Math.max(0,((serverNow||Date.now())-(startedAt||Date.now()))/1000);
        if(isFinite(a.duration)&&a.duration>0)a.currentTime=elapsed%a.duration;
        a.play().catch(function(){});
      }catch(error){}
    }
    if(key===mapMusicKey){
      try{if(a.paused)a.play().catch(function(){})}catch(error){}
      return;
    }
    mapMusicKey=key;
    if(a.readyState>=1)sync();else a.addEventListener('loadedmetadata',sync,{once:true});
  }
  function stopMapMusic(){
    if(mapMusicAudio)try{mapMusicAudio.pause();mapMusicAudio.currentTime=0}catch(error){}
    mapMusicPvp=false;mapMusicKey='';
  }
  function announceMap(service,m){
    if(!m||m.t!=='room-state'||!window.DiggerzPvp22||window.DiggerzPvp22.mode!=='pvp')return;
    var name=String(m.mapName||(m.map&&m.map.name)||'Default Map');
    var author=String(m.mapAuthor||'').trim();
    var key=String(m.room||'')+'|'+name;
    if(service._build240EnteredMapKey===key)return;
    service._build240EnteredMapKey=key;
    try{
      service.message('Now entering: '+name);
      if(author)service.message('Map built by: '+author);
    }catch(error){}
  }
  function installTrackFive(){
    var sel=document.getElementById('diggerz-music-track'),play=document.getElementById('diggerz-music-play'),pause=document.getElementById('diggerz-music-pause'),restart=document.getElementById('diggerz-music-restart'),rewind=document.getElementById('diggerz-music-rewind');
    if(!sel||sel._build240Mule)return !!sel;
    var opt=document.createElement('option');opt.value='4';opt.textContent='Track 5 — M.U.L.E.';sel.appendChild(opt);
    var oldChange=sel.onchange,oldPlay=play&&play.onclick,oldPause=pause&&pause.onclick,oldRestart=restart&&restart.onclick,oldRewind=rewind&&rewind.onclick;
    sel.onchange=function(e){
      if((sel.value|0)===4){
        try{if(oldPause)oldPause.call(pause,e)}catch(error){}
        var a=ensureMule();if(a){a.volume=.7;a.currentTime=0;a.play().catch(function(){})}
        return;
      }
      if(!mulePvp&&muleAudio)try{muleAudio.pause()}catch(error){}
      if(oldChange)return oldChange.call(this,e);
    };
    if(play)play.onclick=function(e){if((sel.value|0)===4){var a=ensureMule();if(a)a.play().catch(function(){});return}if(oldPlay)return oldPlay.call(this,e)};
    if(pause)pause.onclick=function(e){if((sel.value|0)===4){if(muleAudio)muleAudio.pause();return}if(oldPause)return oldPause.call(this,e)};
    if(restart)restart.onclick=function(e){if((sel.value|0)===4){var a=ensureMule();if(a){a.currentTime=0;a.play().catch(function(){})}return}if(oldRestart)return oldRestart.call(this,e)};
    if(rewind)rewind.onclick=function(e){if((sel.value|0)===4){var a=ensureMule();if(a)a.currentTime=Math.max(0,a.currentTime-2);return}if(oldRewind)return oldRewind.call(this,e)};
    sel._build240Mule=true;return true;
  }

  function install(){
    if(installed)return true;
    if(!window.DiggerzService||!window.DiggerzService.prototype||!window.DiggerzRuntime||!window.DiggerzBuild240)return false;
    var proto=window.DiggerzService.prototype;
    if(proto.__build240RobloxCollab){installed=true;return true}
    var rt=window.DiggerzRuntime,h=rt.getH&&rt.getH(),Yf=rt.getYf&&rt.getYf(),f=rt.getF&&rt.getF();
    if(!h||typeof h.n7!=='function')return false;

    var pool=window.DiggerzService.ITEM_POOL||[];
    [600,601,602,603,604].forEach(function(id){if(pool.indexOf(id)<0)pool.push(id)});

    if(Yf&&typeof Yf.W48==='function'&&!Yf.__build240RobloxCollab){
      var oldW48=Yf.W48;
      Yf.W48=function(a,b,c){
        var id=a|0,mapped=mappedId(id);
        var out=oldW48.call(this,mapped||a,b,c);
        if(mapped&&out)applyCollabLook(out,id,f,h);
        return out;
      };
      Yf.__build240RobloxCollab=true;
    }

    var oldN7=h.n7;
    h.n7=function(a,b,id,d,e,g,p,w,k){
      var mapped=(a|0)===2?mappedId(id):0;
      if(mapped){
        var out=oldN7.call(this,a,b,mapped,d,e,g,p,w,k),obj=out||b;
        return applyCollabLook(obj,id,f,h)||out;
      }
      return oldN7.apply(this,arguments);
    };

    if(typeof proto.itemName==='function'){
      var oldName=proto.itemName;
      proto.itemName=function(category,id){
        if((category|0)===2){
          if((id|0)===600)return 'Noob Mask';
          if((id|0)===601)return 'Noob Shirt';
          if((id|0)===602)return 'Noob Pants';
          if((id|0)===603)return 'Noob Gloves';
          if((id|0)===604)return 'Roblox Rocket Launcher';
        }
        return oldName.apply(this,arguments);
      };
    }

    if(typeof proto.shopListings==='function'){
      var oldShop=proto.shopListings;
      proto.shopListings=function(){
        var list=(oldShop.apply(this,arguments)||[]).slice();
        if(Date.now()<=COLLAB_EXPIRES){
          var extra=[
            {shopId:2401,itemId:600,price:75,display:NOOB_MASK_SRC,name:'Noob Mask',description:'Classic Noob mask. Fanmade Roblox collab. Leaving Dec 1.'},
            {shopId:2402,itemId:601,price:75,display:NOOB_SHIRT_SRC,name:'Noob Shirt',description:'Plain default-style Noob blue shirt. Fanmade Roblox collab. Leaving Dec 1.'},
            {shopId:2403,itemId:602,price:75,name:'Noob Pants',description:'Classic light-green Noob pants. Fanmade Roblox collab. Leaving Dec 1.'},
            {shopId:2404,itemId:603,price:75,display:NOOB_HAND_SRC,name:'Noob Gloves',description:'Bright classic yellow Noob hands. Fanmade Roblox collab. Leaving Dec 1.'},
            {shopId:2405,itemId:604,price:300,quantity:1337,display:ROCKET_SRC,name:'Roblox Rocket Launcher',description:'Classic Roblox Rocket Launcher Bazooka skin. Includes 1,337 launchers per purchase. Fanmade Roblox collab. Leaving Dec 1.'}
          ];
          for(var i=0;i<extra.length;i++)list.push(extra[i]);
        }
        return list;
      };
    }

    if(typeof proto.allSuperRareCandidates==='function'){
      var oldSuper=proto.allSuperRareCandidates;
      proto.allSuperRareCandidates=function(){
        var list=oldSuper.apply(this,arguments)||[],out=[];
        for(var i=0;i<list.length;i++)if(list[i]&&!COLLAB_IDS[list[i].id|0])out.push(list[i]);
        return out;
      };
    }

    if(typeof proto.hurtLocalPlayer==='function'){
      var oldHurt=proto.hurtLocalPlayer;
      proto.hurtLocalPlayer=function(amount,source){
        var ent=window.l&&l.z39;
        var isFull=fullNoobEquipped(this,ent,this.state&&this.state.appearance);
        if(isFull&&isLavaSource(source))playOne(OUCH_SRC,.8);
        return oldHurt.apply(this,arguments);
      };
    }

    if(typeof proto.showLocalDeath==='function'){
      var oldDeath=proto.showLocalDeath;
      proto.showLocalDeath=function(source){
        var ent=window.l&&l.z39;
        if(!fullNoobEquipped(this,ent,this.state&&this.state.appearance))return oldDeath.apply(this,arguments);
        var result=oldDeath.apply(this,arguments);
        scheduleNoobDeath(ent,.9);
        return result;
      };
    }

    if(typeof proto.pvpReceive==='function'){
      var oldReceive=proto.pvpReceive;
      proto.pvpReceive=function(m){
        var pendingDeathEnt=null;
        try{
          if(m&&m.t==='room-state')announceMap(this,m);
          if(m&&m.t==='death'){
            var peer=this.pvpPeerForConnection&&this.pvpPeerForConnection(m._serverFrom),ap=peer&&peer.info&&peer.info.appearance,e=peer&&this.pvpEntityForPeer&&this.pvpEntityForPeer(peer);
            if(e&&fullNoobEquipped(this,e,ap))pendingDeathEnt=e;
          }
          if(m&&m.t==='battle-state'){
            if(m.mapMusic&&(m.phase==='build'||m.phase==='fight'||m.phase==='elimination')){
              stopMule();mapMusicPvp=true;mapMusicPlayAt(m.mapMusic,m.musicStartedAt,m.serverNow,m.phase==='build'?.7:.18);
            }else{
              if(mapMusicPvp)stopMapMusic();
              if((m.preMatchTrack|0)===4&&(m.phase==='build'||m.phase==='fight'||m.phase==='elimination')){
                mulePvp=true;muleTrackKey=String(m.musicStartedAt||0);mulePlayAt(m.musicStartedAt,m.serverNow,m.phase==='build'?.7:.18);
              }else if(m.phase==='waiting'){stopMule()}
            }
          }else if(m&&m.t==='battle-event'){
            if(m.mapMusic&&m.kind==='build-start'){
              stopMule();mapMusicPvp=true;mapMusicPlayAt(m.mapMusic,m.musicStartedAt,m.serverNow,.7);
            }else if((m.kind==='fight'||m.kind==='elimination')&&mapMusicPvp&&mapMusicAudio){
              mapMusicAudio.volume=.18;
            }else if(m.kind==='build-start'&&(m.preMatchTrack|0)===4){
              if(mapMusicPvp)stopMapMusic();mulePvp=true;muleTrackKey=String(m.musicStartedAt||0);mulePlayAt(m.musicStartedAt,m.serverNow,.7);
            }else if((m.kind==='fight'||m.kind==='elimination')&&mulePvp&&muleAudio)muleAudio.volume=.18;
          }else if(m&&m.t==='winner'){
            if(mapMusicPvp&&mapMusicAudio)mapMusicAudio.volume=.7;
            else if(mulePvp&&muleAudio)muleAudio.volume=.7;
          }
        }catch(error){}
        var receiveResult=oldReceive.apply(this,arguments);
        if(pendingDeathEnt)scheduleNoobDeath(pendingDeathEnt,.55);
        return receiveResult;
      }
    }

    proto.__build240RobloxCollab=true;
    installed=true;
    window.DiggerzBuild240.noobIds={mask:600,shirt:601,pants:602,gloves:603,launcher:604};
    window.DiggerzBuild240.wearingFullNoobSet=fullNoob;
    window.DiggerzBuild240.isRobloxLauncherEntity=function(ent){var ap=entityAppearance(ent,null);return collabEquipped(ent,ap,ROBLOX_LAUNCHER_ID,4)};
    window.DiggerzBuild240.registerRobloxRocketProjectile=function(projectile,shooter,fromX,fromY,toX,toY){
      try{
        if(!projectile||projectile._build240LaunchPlayed)return;
        projectile._build240LaunchPlayed=true;
        var launchAudio=null;
        try{
          launchAudio=new Audio(ROCKET_LAUNCH_SRC);
          launchAudio.volume=.75;
          launchAudio.loop=true;
          launchAudio.play().catch(function(){});
        }catch(error){launchAudio=null}
        projectileNodes.push({projectile:projectile,createdAt:Date.now(),lastX:fromX,lastY:fromY,moved:false,launchAudio:launchAudio});
      }catch(error){}
    };
    window.DiggerzBuild240.robloxRocketImpactSound=function(projectile){
      try{
        if(!projectile||projectile._build240ImpactPlayed)return;
        projectile._build240ImpactPlayed=true;
        for(var i=projectileNodes.length-1;i>=0;i--){
          var rec=projectileNodes[i];
          if(rec.projectile===projectile){
            try{if(rec.launchAudio){rec.launchAudio.pause();rec.launchAudio.currentTime=0}}catch(error){}
          }
        }
        playOne(ROCKET_EXPLOSION_SRC,.8);
      }catch(error){}
    };
    window.DiggerzBuild240.robloxRocketImpact=function(projectile){
      try{
        window.DiggerzBuild240.robloxRocketImpactSound(projectile);
        for(var i=projectileNodes.length-1;i>=0;i--)if(projectileNodes[i].projectile===projectile)projectileNodes.splice(i,1);
      }catch(error){}
    };
    requestAnimationFrame(overlayLoop);
    installTrackFive();
    setInterval(function(){
      installTrackFive();
      var P=window.DiggerzPvp22;
      if(mulePvp&&(!P||P.mode!=='pvp'||!P.joined))stopMule();
      if(mapMusicPvp&&(!P||P.mode!=='pvp'||!P.joined))stopMapMusic();
    },500);
    return true;
  }

  function boot(){if(!install())setTimeout(boot,150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
}());
