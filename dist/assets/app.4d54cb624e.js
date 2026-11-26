(function(){const N={DATA_URL:"data/attractions.json",API:"https://api.themeparks.wiki/v1",PARKS:{dlp:"dae968d5-630d-4719-8b06-3d107e944401",daw:"ca888437-ebb4-4d50-aed2-d227f7096968"},TIMEOUT_MS:12e3,REFRESH_MS:3e5,LIVE_ENABLED:!0},bt=i=>(i||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(),Mt="chroniques-dernier-releve";async function we(i){const t=new AbortController,e=setTimeout(()=>t.abort(),N.TIMEOUT_MS);try{const o=await fetch(i,{signal:t.signal,headers:{Accept:"application/json"}});if(!o.ok)throw new Error("HTTP "+o.status);return await o.json()}finally{clearTimeout(e)}}function Lt(){try{const i=localStorage.getItem(Mt);return i?JSON.parse(i):null}catch{return null}}function ye(i,t){try{const e=Lt()||{parks:{}};e.parks[i]=t,e.releve=new Date().toISOString(),localStorage.setItem(Mt,JSON.stringify(e))}catch{}}function me(i,t){const e=t.map(bt),o=i.map(l=>({e:l,n:bt(l.name)})).sort((l,a)=>Number(l.n.includes("single rider"))-Number(a.n.includes("single rider")));return o.find(l=>e.includes(l.n))?.e||o.find(l=>e.some(a=>l.n.startsWith(a)))?.e||o.find(l=>e.some(a=>l.n.includes(a)||a.includes(l.n)))?.e||null}function xe(i){switch(i){case"OPERATING":return"open";case"REFURBISHMENT":return"refurb";case"DOWN":return"down";case"CLOSED":return"closed";default:return"unknown"}}function be(i){const t=i.queue||{},e=t.STANDBY?.waitTime,o=t.PAID_RETURN_TIME;return{kind:xe(i.status),wait:typeof e=="number"?e:null,singleRider:typeof t.SINGLE_RIDER?.waitTime=="number"?t.SINGLE_RIDER.waitTime:null,premier:o&&o.state==="AVAILABLE"?{prix:o.price?.formatted||null,debut:o.returnStart||null,fin:o.returnEnd||null}:null,updated:i.lastUpdated||null,source:"live"}}async function Me(i,t){const e=new Map,o=[];let l=0,a=[],n="ThemeParks.wiki";if(N.LIVE_ENABLED===!1)return{entries:e,mode:"unavailable",via:"",age:null,failures:o};(await Promise.allSettled(i.map(r=>we(`${N.API}/entity/${N.PARKS[r.id]}/live`)))).forEach((r,w)=>{const m=i[w];let b=null;if(r.status==="fulfilled"&&Array.isArray(r.value?.liveData))b=r.value.liveData,ye(m.id,b);else{const k=Lt();if(Array.isArray(k?.parks?.[m.id]))b=k.parks[m.id],k.releve&&a.push(k.releve),n="cache";else{o.push(`${m.name} — ${r.reason?.message||"pas de réponse"}`);return}}l++,t.filter(k=>k.park===m.id).forEach(k=>{const x=me(b,k.queueTimes?.aliases||[k.name]);x&&e.set(k.id,be(x))})});const p=l===0?"unavailable":l<i.length?"partial":"live";return{entries:e,mode:p,via:n,age:a.length?a.sort()[0]:null,failures:o}}const z={mesa:{a:"#2A1A22",b:"#5A2A28",accent:"#C4552F"},manor:{a:"#101D2B",b:"#27384E",accent:"#7E6CA8"},rocket:{a:"#0A1E2E",b:"#15455E",accent:"#3E97B5"},tower:{a:"#1A1A24",b:"#3B3547",accent:"#9B7BA6"},kitchen:{a:"#2B1D14",b:"#5C3A1F",accent:"#D08A33"},frost:{a:"#0D2430",b:"#1E5464",accent:"#6FB7C4"},locomotive:{a:"#1E1410",b:"#4A3326",accent:"#A8552C"},tram:{a:"#1C2418",b:"#3F5638",accent:"#6E8C4A"},riverboat:{a:"#122630",b:"#2F5F6B",accent:"#4E8FA0"},keelboat:{a:"#1A2218",b:"#3C4E33",accent:"#7A8F4C"},fort:{a:"#241A12",b:"#56402C",accent:"#996437"},launch:{a:"#0A1020",b:"#1E2A55",accent:"#C0392B"},globe:{a:"#101C2E",b:"#1E3A5F",accent:"#4A7FB5"},clocktower:{a:"#101826",b:"#2A3A52",accent:"#6B82A8"},bigtop:{a:"#2A1218",b:"#5E2430",accent:"#C0453F"},marionette:{a:"#241A10",b:"#4E3A20",accent:"#9C7338"},apple:{a:"#1C1012",b:"#4A1A20",accent:"#B8292F"},teacup:{a:"#152420",b:"#2E4A3E",accent:"#6FA88C"},carousel:{a:"#201428",b:"#443058",accent:"#8C6BA8"},pocketwatch:{a:"#1A2018",b:"#36442E",accent:"#7A8F4C"},dragon:{a:"#1E1410",b:"#48281C",accent:"#9E4A2C"},cottage:{a:"#14201A",b:"#2E4634",accent:"#6B9460"},circustrain:{a:"#221628",b:"#4A2E4E",accent:"#A05890"},marquee:{a:"#201A10",b:"#463A1E",accent:"#9E8438"},concert:{a:"#161C2E",b:"#303E62",accent:"#6E82BE"},crown:{a:"#1C1424",b:"#3E2C4E",accent:"#8A6CA0"},spaceport:{a:"#0E1626",b:"#24344E",accent:"#5C7FA8"},target:{a:"#1A1020",b:"#3E2040",accent:"#A8407A"},orrery:{a:"#161020",b:"#342A4E",accent:"#7E6BB0"},roadster:{a:"#101C1E",b:"#24423E",accent:"#4E8A72"},porthole:{a:"#08181E",b:"#163840",accent:"#2E7686"},beacon:{a:"#101428",b:"#2A2E56",accent:"#6670B8"},playground:{a:"#201A10",b:"#44361E",accent:"#90723A"},chest:{a:"#1E1206",b:"#452A10",accent:"#9C6A22"},temple:{a:"#1C1610",b:"#3E3020",accent:"#8A6B38"},treehouse:{a:"#121C10",b:"#2A4020",accent:"#5E8A3A"},galleon:{a:"#0E1A22",b:"#1E3A48",accent:"#44788E"},anchor:{a:"#101E24",b:"#204048",accent:"#3E8292"},isle:{a:"#14200E",b:"#2E4420",accent:"#6A9038"},lamp:{a:"#1E1408",b:"#48300E",accent:"#B07A1E"},shell:{a:"#0A1C22",b:"#17434C",accent:"#2E8A86"},controller:{a:"#201408",b:"#4C3010",accent:"#C4761A"},parachute:{a:"#14200E",b:"#2C4420",accent:"#6E9440"},spring:{a:"#1E1810",b:"#443624",accent:"#A8842E"},route66:{a:"#241408",b:"#523214",accent:"#C06A24"},cone:{a:"#201006",b:"#4E2610",accent:"#D4662A"},carpet:{a:"#1A1026",b:"#3C2454",accent:"#8A5CB8"},satellite:{a:"#0C1424",b:"#1E2C4E",accent:"#4A74B0"},zoetrope:{a:"#1C1408",b:"#423014",accent:"#A87C28"},lantern:{a:"#201406",b:"#4A2E0C",accent:"#D4941E"},web:{a:"#1A0C14",b:"#3E1828",accent:"#A8304E"},webshooter:{a:"#101A26",b:"#223C54",accent:"#3E7EA8"}},rt={poster:{gold:"#E6C77E",rule:"#C8993F",ink:"#EDE0C4",rays:.14,grid:0},night:{gold:"#F0DCA6",rule:"#C8993F",ink:"#F2E8D2",rays:.05,grid:0,dim:.55},blueprint:{gold:"#C6D8CE",rule:"#9AB0A4",ink:"#E6EFE8",rays:0,grid:.18,mono:"#16201C"},ticket:{gold:"#E6C77E",rule:"#C8993F",ink:"#EDE0C4",rays:.1,grid:0,stub:!0}},_t={a:"#0B2025",b:"#10262D"},At=(i,t,e)=>{const o=(l,a)=>parseInt(l.slice(1+a*2,3+a*2),16);return"#"+[0,1,2].map(l=>Math.round(o(i,l)*(1-e)+o(t,l)*e).toString(16).padStart(2,"0")).join("")};for(const i of Object.keys(z))z[i]={a:At(z[i].a,_t.a,.42),b:At(z[i].b,_t.b,.3),accent:z[i].accent};const st=i=>String(i).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),h=(i,t,e,o)=>`<path d="M${i} ${t-e}L${i+e} ${t}L${i} ${t+e}L${i-e} ${t}Z" fill="${o}"/>`;function g(i,t,e,o,l,a){let n="";for(let c=0;c<o;c++){const p=-Math.PI+c*Math.PI/o,r=p+Math.PI/(o*2.1);n+=`<path d="M${i} ${t}L${(i+Math.cos(p)*e).toFixed(1)} ${(t+Math.sin(p)*e).toFixed(1)}L${(i+Math.cos(r)*e).toFixed(1)} ${(t+Math.sin(r)*e).toFixed(1)}Z" fill="${l}" opacity="${a}"/>`}return n}function B(i,t,e,o,l,a){let n=`M${i-e/2} ${t}`;for(let c=0;c<l;c++){const p=e/2-c*e/(2*l),r=t-(c+1)*o/l;n+=`L${i-p} ${r+o/l}L${i-p+e/(2.6*l)} ${r+o/l}`}n+=`L${i} ${t-o}`;for(let c=l-1;c>=0;c--){const p=e/2-c*e/(2*l),r=t-(c+1)*o/l;n+=`L${i+p-e/(2.6*l)} ${r+o/l}L${i+p} ${r+o/l}`}return`<path d="${n}Z" fill="${a}"/>`}const jt={mesa:(i,t)=>`
    <circle cx="150" cy="86" r="44" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="150" cy="86" r="30" fill="${i.accent}"/>
    ${g(150,86,72,14,t.gold,.5)}
    ${B(150,206,190,96,4,i.accent)}
    ${B(150,206,104,58,3,t.gold)}
    <rect x="30" y="206" width="240" height="3" fill="${t.gold}"/>
    ${[0,1,2,3,4,5].map(e=>`<path d="M${54+e*34} 222 L${68+e*34} 214 L${82+e*34} 222" fill="none" stroke="${t.gold}" stroke-width="2.5" stroke-linejoin="miter"/>`).join("")}`,manor:(i,t)=>`
    <circle cx="150" cy="74" r="38" fill="${t.gold}" opacity=".9"/>
    <circle cx="150" cy="74" r="38" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <path d="M150 36 A38 38 0 0 0 150 112 Z" fill="${i.b}"/>
    ${B(150,224,150,110,4,i.accent)}
    <rect x="112" y="166" width="76" height="58" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M150 224 L150 184 A12 12 0 0 1 150 184 Z" fill="none"/>
    <path d="M138 224 L138 192 A12 12 0 0 1 162 192 L162 224Z" fill="${t.gold}"/>
    ${[124,170].map(e=>`<rect x="${e}" y="176" width="14" height="20" fill="${t.gold}"/>`).join("")}
    <rect x="30" y="224" width="240" height="3" fill="${t.gold}"/>
    ${[52,70,88,212,230,248].map(e=>`<path d="M${e} 224 L${e} 208" stroke="${t.gold}" stroke-width="2"/>`).join("")}`,rocket:(i,t)=>`
    ${g(150,120,130,18,t.gold,.32)}
    <circle cx="150" cy="120" r="74" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="150" cy="120" r="58" fill="none" stroke="${t.gold}" stroke-width="1"/>
    <ellipse cx="150" cy="120" rx="96" ry="26" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M150 48 L172 120 L150 164 L128 120 Z" fill="${i.accent}"/>
    <path d="M150 48 L172 120 L150 164 L128 120 Z" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <path d="M150 72 L160 120 L150 142 L140 120 Z" fill="${t.gold}"/>
    <path d="M128 132 L112 170 L140 154 Z M172 132 L188 170 L160 154 Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/>
    <path d="M150 170 L142 212 L150 226 L158 212 Z" fill="${t.gold}" opacity=".75"/>
    ${h(60,56,6,t.gold)}${h(240,56,6,t.gold)}${h(44,180,5,t.gold)}${h(256,180,5,t.gold)}`,tower:(i,t)=>{const e=(o,l,a)=>{let n="";const c=l*(a+7)-7;for(let p=0;p<l;p++)n+=`<rect x="${150-c/2+p*(a+7)}" y="${o}" width="${a}" height="13" fill="${t.gold}"/>`;return n};return`
    ${g(150,232,150,12,t.gold,.22)}
    <rect x="92" y="170" width="116" height="60" fill="${i.accent}"/>
    <rect x="108" y="124" width="84" height="46" fill="${i.accent}"/>
    <rect x="122" y="82" width="56" height="42" fill="${i.accent}"/>
    <rect x="136" y="54" width="28" height="28" fill="${i.accent}"/>
    <path d="M150 20 L158 54 L142 54 Z" fill="${t.gold}"/>
    ${e(182,6,11)}${e(136,5,11)}${e(94,4,11)}${e(62,2,9)}
    <rect x="92" y="170" width="116" height="60" fill="none" stroke="${t.gold}" stroke-width="1.5"/>
    <rect x="108" y="124" width="84" height="46" fill="none" stroke="${t.gold}" stroke-width="1.5"/>
    <rect x="122" y="82" width="56" height="42" fill="none" stroke="${t.gold}" stroke-width="1.5"/>
    <path d="M238 46 L210 110 L228 110 L206 166 L252 98 L232 98 L252 46 Z" fill="${t.gold}"/>
    <rect x="30" y="230" width="240" height="3" fill="${t.gold}"/>`},kitchen:(i,t)=>`
    ${g(150,118,118,16,t.gold,.26)}
    <path d="M104 150 A30 30 0 1 1 126 100 A32 32 0 1 1 174 100 A30 30 0 1 1 196 150 Z" fill="${t.gold}"/>
    <rect x="104" y="150" width="92" height="12" fill="${i.accent}"/>
    <rect x="98" y="162" width="104" height="16" fill="${t.gold}"/>
    <path d="M150 150 L150 106" stroke="${i.b}" stroke-width="2" opacity=".5"/>
    <path d="M90 214 A60 24 0 0 0 210 214 Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="80" y="206" width="140" height="10" rx="5" fill="${t.gold}"/>
    ${[118,150,182].map(e=>`<path d="M${e} 200 q-9 -13 0 -26 q9 -13 0 -24" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".65"/>`).join("")}
    ${h(56,120,6,t.gold)}${h(244,120,6,t.gold)}`,frost:(i,t)=>{let e="";for(let o=0;o<6;o++){const l=o*Math.PI/3-Math.PI/2,a=150+Math.cos(l)*62,n=108+Math.sin(l)*62;e+=`<line x1="150" y1="108" x2="${a.toFixed(1)}" y2="${n.toFixed(1)}"/>`,[.5,.76].forEach(c=>{const p=150+Math.cos(l)*62*c,r=108+Math.sin(l)*62*c;[-.62,.62].forEach(w=>{e+=`<line x1="${p.toFixed(1)}" y1="${r.toFixed(1)}" x2="${(p+Math.cos(l+w)*18).toFixed(1)}" y2="${(r+Math.sin(l+w)*18).toFixed(1)}"/>`})})}return`
    <circle cx="150" cy="108" r="78" fill="none" stroke="${t.gold}" stroke-width="1"/>
    <g class="a-turn" style="transform-origin:150px 108px" stroke="${t.gold}" stroke-width="3" stroke-linecap="round">${e}</g>
    ${h(150,108,7,t.gold)}
    ${B(150,226,200,76,4,i.accent)}
    ${B(150,226,108,46,3,t.gold)}
    <rect x="30" y="226" width="240" height="3" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7].map(o=>`<path d="M${44+o*30} 240 q7.5 -8 15 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".6"/>`).join("")}`},locomotive:(i,t)=>`
    ${g(96,48,130,13,t.gold,.3)}
    <rect x="18" y="214" width="264" height="4" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<rect x="${24+e*26}" y="218" width="16" height="5" fill="${t.gold}" opacity=".6"/>`).join("")}
    <rect x="206" y="118" width="70" height="78" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2].map(e=>`<rect x="${216+e*20}" y="130" width="12" height="18" fill="${t.gold}"/>`).join("")}
    <rect x="70" y="140" width="140" height="56" rx="28" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="96" y="140" width="5" height="56" fill="${t.gold}" opacity=".8"/>
    <rect x="140" y="140" width="5" height="56" fill="${t.gold}" opacity=".8"/>
    <rect x="184" y="140" width="5" height="56" fill="${t.gold}" opacity=".8"/>
    <path d="M84 118 L112 118 L106 140 L90 140Z" fill="${t.gold}"/>
    <path d="M80 110 L116 110 L116 118 L80 118Z" fill="${t.gold}"/>
    <circle cx="68" cy="152" r="11" fill="${t.gold}"/>
    <path d="M56 196 L36 214 L70 214Z" fill="${t.gold}"/>
    <circle cx="106" cy="196" r="22" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="106" cy="196" r="6" fill="${t.gold}"/>
    <circle cx="170" cy="196" r="22" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="170" cy="196" r="6" fill="${t.gold}"/>
    <circle cx="238" cy="200" r="14" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map(e=>`<ellipse class="a-smoke" style="animation-delay:${(e*.34).toFixed(2)}s" cx="${98-e*4}" cy="${96-e*19}" rx="${15+e*5}" ry="${9+e*3}" fill="${t.gold}" opacity="${(.5-e*.08).toFixed(2)}"/>`).join("")}`,tram:(i,t)=>`
    ${g(150,40,120,14,t.gold,.22)}
    <rect x="18" y="212" width="264" height="3" fill="${t.gold}"/>
    <rect x="18" y="222" width="264" height="3" fill="${t.gold}" opacity=".5"/>
    <rect x="72" y="96" width="156" height="104" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="66" y="86" width="168" height="12" fill="${t.gold}"/>
    <rect x="72" y="146" width="156" height="4" fill="${t.gold}" opacity=".8"/>
    ${[0,1,2,3].map(e=>`<rect x="${84+e*36}" y="106" width="24" height="30" fill="${t.gold}"/>`).join("")}
    ${[0,1,2,3].map(e=>`<rect x="${84+e*36}" y="158" width="24" height="30" fill="${t.gold}" opacity=".85"/>`).join("")}
    <circle cx="104" cy="204" r="16" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="196" cy="204" r="16" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="104" cy="204" r="4" fill="${t.gold}"/>
    <circle cx="196" cy="204" r="4" fill="${t.gold}"/>
    <rect x="46" y="118" width="7" height="82" fill="${t.gold}"/>
    ${h(49,110,7,t.gold)}
    <rect x="247" y="118" width="7" height="82" fill="${t.gold}" opacity=".7"/>`,riverboat:(i,t)=>`
    ${g(150,36,120,14,t.gold,.2)}
    <path d="M52 186 L248 186 L228 220 L72 220Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="72" y="150" width="156" height="36" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="98" y="116" width="104" height="34" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="124" y="92" width="52" height="24" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5].map(e=>`<rect x="${80+e*25}" y="160" width="14" height="16" fill="${t.gold}"/>`).join("")}
    ${[0,1,2,3].map(e=>`<rect x="${108+e*23}" y="126" width="13" height="15" fill="${t.gold}" opacity=".9"/>`).join("")}
    <rect x="128" y="40" width="10" height="52" fill="${t.gold}"/>
    <rect x="162" y="40" width="10" height="52" fill="${t.gold}"/>
    <rect x="122" y="34" width="22" height="8" fill="${t.gold}"/>
    <rect x="156" y="34" width="22" height="8" fill="${t.gold}"/>
    <g class="a-wheel" style="transform-origin:56px 178px"><circle cx="56" cy="178" r="30" fill="none" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2,3,4,5,6,7].map(e=>{const o=e*Math.PI/4;return`<line x1="56" y1="178" x2="${(56+Math.cos(o)*30).toFixed(1)}" y2="${(178+Math.sin(o)*30).toFixed(1)}" stroke="${t.gold}" stroke-width="2.5"/>`}).join("")}</g>
    <circle cx="56" cy="178" r="7" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<path d="M${18+e*28} 232 q7 -8 14 0 t14 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".55"/>`).join("")}`,keelboat:(i,t)=>`
    ${g(150,44,110,12,t.gold,.18)}
    <path d="M46 182 L254 182 L232 216 L68 216Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="104" y="128" width="98" height="54" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M98 128 L208 128 L202 114 L104 114Z" fill="${t.gold}"/>
    ${[0,1,2].map(e=>`<rect x="${118+e*30}" y="142" width="18" height="22" fill="${t.gold}"/>`).join("")}
    <rect x="68" y="60" width="6" height="122" fill="${t.gold}"/>
    <path d="M74 70 L74 112 L132 92Z" fill="${t.gold}" opacity=".85"/>
    ${h(71,54,7,t.gold)}
    <path d="M214 120 L262 176" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="150" cy="200" r="9" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<path d="M${18+e*28} 228 q7 -8 14 0 t14 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".55"/>`).join("")}`,fort:(i,t)=>`
    ${g(150,40,120,14,t.gold,.2)}
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>{const o=24+e*22;return`<rect x="${o}" y="150" width="18" height="72" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/><path d="M${o} 150 L${o+9} 136 L${o+18} 150Z" fill="${t.gold}"/>`}).join("")}
    <rect x="112" y="96" width="76" height="126" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M100 96 L200 96 L188 74 L112 74Z" fill="${t.gold}"/>
    <path d="M124 74 L150 48 L176 74Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="132" y="112" width="16" height="22" fill="${t.gold}"/>
    <rect x="152" y="112" width="16" height="22" fill="${t.gold}"/>
    <path d="M132 222 L132 172 Q150 156 168 172 L168 222Z" fill="${t.gold}"/>
    <rect x="147" y="18" width="6" height="32" fill="${t.gold}"/>
    <path d="M153 22 L186 32 L153 42Z" fill="${t.gold}"/>
    <rect x="18" y="222" width="264" height="4" fill="${t.gold}"/>`,launch:(i,t)=>`
    ${g(150,236,200,20,t.gold,.26)}
    ${[[42,58],[254,46],[76,112],[228,124],[150,34],[34,166],[266,172],[108,74],[196,88]].map(([e,o],l)=>h(e,o,l%3?3.5:5.5,t.gold)).join("")}
    <circle cx="150" cy="128" r="86" fill="none" stroke="${t.gold}" stroke-width="1" opacity=".55"/>
    <circle cx="150" cy="128" r="64" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".75"/>
    ${[0,1,2,3].map(e=>`<path d="M${98+e*7} ${212-e*26} L150 ${182-e*26} L${202-e*7} ${212-e*26}" fill="none" stroke="${t.gold}" stroke-width="${(4-e*.6).toFixed(1)}" opacity="${(1-e*.2).toFixed(2)}" stroke-linejoin="miter"/>`).join("")}
    <path d="M150 48 L178 142 L150 170 L122 142 Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M150 48 L164 142 L150 162 L136 142 Z" fill="${t.gold}"/>
    <path d="M122 132 L100 178 L134 158 Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/>
    <path d="M178 132 L200 178 L166 158 Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/>
    ${h(150,104,9,t.gold)}
    <rect x="18" y="232" width="264" height="3" fill="${t.gold}"/>`,globe:(i,t)=>`
    ${g(150,120,140,18,t.gold,.22)}
    <circle cx="150" cy="120" r="76" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map(e=>`<ellipse cx="150" cy="120" rx="${(76*Math.cos(e*Math.PI/5)).toFixed(1)}" ry="76" fill="none" stroke="${t.gold}" stroke-width="1.4" opacity=".8"/>`).join("")}
    ${[-46,-22,0,22,46].map(e=>`<line x1="${150-Math.sqrt(Math.max(0,5776-e*e)).toFixed(1)}" y1="${120+e}" x2="${150+Math.sqrt(Math.max(0,5776-e*e)).toFixed(1)}" y2="${120+e}" stroke="${t.gold}" stroke-width="1.4" opacity=".8"/>`).join("")}
    <path d="M150 120 L150 70" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    <path d="M150 120 L188 140" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    ${h(150,120,8,t.gold)}
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>{const o=e*Math.PI/6-Math.PI/2;return h(150+Math.cos(o)*94,120+Math.sin(o)*94,e%3?3:5,t.gold)}).join("")}
    <rect x="18" y="226" width="264" height="3" fill="${t.gold}"/>`,clocktower:(i,t)=>`
    ${[[46,52],[252,44],[82,34],[216,66],[34,120]].map(([e,o],l)=>h(e,o,l%2?4:6,t.gold)).join("")}
    ${B(150,232,120,96,4,i.accent)}
    <rect x="112" y="92" width="76" height="52" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="150" cy="118" r="30" fill="${i.a}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>{const o=e*Math.PI/6;return`<line x1="${(150+Math.cos(o)*24).toFixed(1)}" y1="${(118+Math.sin(o)*24).toFixed(1)}" x2="${(150+Math.cos(o)*28).toFixed(1)}" y2="${(118+Math.sin(o)*28).toFixed(1)}" stroke="${t.gold}" stroke-width="${e%3?1.5:2.5}"/>`}).join("")}
    <path class="a-hand-h" style="transform-origin:150px 118px" d="M150 118 L150 100" stroke="${t.gold}" stroke-width="3.5" stroke-linecap="round"/><path class="a-hand-m" style="transform-origin:150px 118px" d="M150 118 L168 126" stroke="${t.gold}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M124 92 L150 58 L176 92Z" fill="${t.gold}"/>
    <rect x="18" y="52" width="264" height="2.5" fill="${t.gold}" opacity=".6"/>
    <path d="M196 54 L196 78" stroke="${t.gold}" stroke-width="2"/>
    <path d="M182 78 L210 78 L204 98 L188 98Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>`,bigtop:(i,t)=>`
    ${g(150,44,130,16,t.gold,.22)}
    <path d="M40 212 L150 56 L260 212Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map(e=>`<path d="M150 56 L${80+e*35} 212" stroke="${t.gold}" stroke-width="2" opacity=".75"/>`).join("")}
    <path d="M126 212 L126 166 Q150 146 174 166 L174 212Z" fill="${t.gold}"/>
    <rect x="30" y="212" width="240" height="4" fill="${t.gold}"/>
    ${h(150,48,9,t.gold)}
    <rect x="147" y="18" width="6" height="26" fill="${t.gold}"/>
    <path d="M232 92 q22 24 0 52 q-10 -26 0 -52Z" fill="${t.gold}" opacity=".9"/>
    <path d="M232 92 L232 150" stroke="${i.a}" stroke-width="1.5"/>
    <path d="M68 92 q-22 24 0 52 q10 -26 0 -52Z" fill="${t.gold}" opacity=".6"/>`,marionette:(i,t)=>`
    ${g(150,36,110,14,t.gold,.18)}
    <rect x="96" y="44" width="108" height="9" rx="4" fill="${t.gold}"/>
    <rect x="146" y="30" width="8" height="26" fill="${t.gold}"/>
    ${[108,134,166,192].map(e=>`<line x1="${e}" y1="53" x2="${e<150?e+14:e-14}" y2="112" stroke="${t.gold}" stroke-width="1.4" opacity=".8"/>`).join("")}
    <circle cx="150" cy="124" r="22" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M150 128 L150 146 L164 134Z" fill="${t.gold}"/>
    <rect x="128" y="150" width="44" height="46" rx="5" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="98" y="156" width="28" height="9" rx="4" fill="${t.gold}"/>
    <rect x="174" y="156" width="28" height="9" rx="4" fill="${t.gold}"/>
    <rect x="132" y="198" width="11" height="32" rx="5" fill="${t.gold}"/>
    <rect x="157" y="198" width="11" height="32" rx="5" fill="${t.gold}"/>
    ${h(150,112,5,t.gold)}`,apple:(i,t)=>`
    ${g(150,40,120,14,t.gold,.2)}
    ${[50,78,222,250].map((e,o)=>`<path d="M${e} 230 L${e} 196 M${e-16} 200 L${e} 172 L${e+16} 200 M${e-13} 180 L${e} 156 L${e+13} 180" fill="none" stroke="${t.gold}" stroke-width="2" opacity="${o%2?.55:.8}"/>`).join("")}
    <path d="M150 88 C108 88 92 124 96 154 C100 188 124 214 150 214 C176 214 200 188 204 154 C208 124 192 88 150 88Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M150 88 C128 88 116 112 118 136" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".65"/>
    <rect x="146" y="58" width="8" height="34" rx="4" fill="${t.gold}"/>
    <path d="M154 70 q30 -14 44 6 q-30 12 -44 -6Z" fill="${t.gold}"/>
    ${h(150,150,10,t.gold)}
    <rect x="18" y="230" width="264" height="3" fill="${t.gold}"/>`,teacup:(i,t)=>`
    ${g(150,44,120,16,t.gold,.22)}
    <ellipse cx="150" cy="212" rx="112" ry="22" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="212" rx="78" ry="15" fill="none" stroke="${t.gold}" stroke-width="1.2" opacity=".7"/>
    <path d="M96 128 L108 190 Q150 206 192 190 L204 128Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="128" rx="54" ry="16" fill="${i.a}" stroke="${t.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="128" rx="38" ry="10" fill="none" stroke="${t.gold}" stroke-width="1.4" opacity=".8"/>
    <path d="M204 140 q34 10 20 36 q-10 16 -28 12" fill="none" stroke="${t.gold}" stroke-width="5"/>
    <path d="M110 150 L190 150" stroke="${t.gold}" stroke-width="2" opacity=".7"/>
    ${[124,150,176].map(e=>`<path d="M${e} 112 q-8 -14 0 -26 q8 -12 0 -24" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".55"/>`).join("")}
    ${h(150,196,5,t.gold)}`,carousel:(i,t)=>`
    ${g(150,34,126,18,t.gold,.24)}
    <g class="a-canopy" style="transform-origin:150px 60px"><path d="M44 86 L150 34 L256 86Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6].map(e=>`<path d="M${54+e*32} 86 L150 34" stroke="${t.gold}" stroke-width="1.4" opacity=".6"/>`).join("")}</g>
    <rect x="40" y="86" width="220" height="8" fill="${t.gold}"/>
    ${h(150,28,8,t.gold)}
    <rect x="146" y="94" width="8" height="120" fill="${t.gold}"/>
    <path d="M112 196 L112 160 Q118 136 142 132 L152 112 L158 132 Q186 138 190 164 L190 196 L176 196 L176 170 L126 170 L126 196Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M150 116 L138 128 L158 128Z" fill="${t.gold}"/>
    <circle cx="146" cy="140" r="3.5" fill="${t.gold}"/>
    <path d="M214 100 L214 216" stroke="${t.gold}" stroke-width="4"/>
    <path d="M208 96 L220 96 L214 76Z" fill="${t.gold}"/>
    <rect x="30" y="216" width="240" height="4" fill="${t.gold}"/>`,pocketwatch:(i,t)=>`
    ${[0,1,2,3,4,5].map(e=>`<rect x="${26+e*44}" y="186" width="30" height="48" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/>`).join("")}
    ${[0,1,2,3,4].map(e=>`<rect x="${48+e*44}" y="206" width="30" height="28" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5" opacity=".7"/>`).join("")}
    <circle cx="150" cy="112" r="70" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="150" cy="112" r="58" fill="${i.a}" stroke="${t.gold}" stroke-width="1.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>{const o=e*Math.PI/6;return`<line x1="${(150+Math.cos(o)*44).toFixed(1)}" y1="${(112+Math.sin(o)*44).toFixed(1)}" x2="${(150+Math.cos(o)*54).toFixed(1)}" y2="${(112+Math.sin(o)*54).toFixed(1)}" stroke="${t.gold}" stroke-width="${e%3?1.6:3}"/>`}).join("")}
    <g style="transform-origin:150px 112px"><path class="a-hand-h" style="transform-origin:150px 112px" d="M150 112 L150 74" stroke="${t.gold}" stroke-width="4" stroke-linecap="round"/><path class="a-hand-m" style="transform-origin:150px 112px" d="M150 112 L182 128" stroke="${t.gold}" stroke-width="4" stroke-linecap="round"/></g>
    ${h(150,112,6,t.gold)}
    <rect x="142" y="26" width="16" height="18" rx="4" fill="${t.gold}"/>
    <circle cx="150" cy="22" r="11" fill="none" stroke="${t.gold}" stroke-width="3.5"/>`,dragon:(i,t)=>`
    ${g(150,40,110,14,t.gold,.18)}
    <path d="M60 216 Q86 170 128 164 L116 138 L146 152 L150 118 L170 148 L200 134 L192 162 Q236 172 254 216Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M150 118 L164 92 L178 116" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M108 160 L78 120 L112 136" fill="${t.gold}" opacity=".9"/>
    <path d="M192 160 L222 120 L188 136" fill="${t.gold}" opacity=".9"/>
    <circle cx="136" cy="176" r="5" fill="${t.gold}"/>
    <circle cx="166" cy="176" r="5" fill="${t.gold}"/>
    <path d="M120 196 L132 204 L144 196 L156 204 L168 196 L180 204" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M44 208 q-18 -26 2 -44 q6 22 -2 44Z" fill="${t.gold}" opacity=".7"/>
    <path d="M256 208 q18 -26 -2 -44 q-6 22 2 44Z" fill="${t.gold}" opacity=".7"/>
    <rect x="18" y="216" width="264" height="4" fill="${t.gold}"/>`,cottage:(i,t)=>`
    ${g(150,36,118,14,t.gold,.2)}
    <rect x="108" y="128" width="84" height="66" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M96 128 L150 78 L204 128Z" fill="${t.gold}"/>
    <rect x="166" y="82" width="14" height="34" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="120" y="144" width="20" height="22" fill="${t.gold}"/>
    <path d="M152 194 L152 158 Q164 146 176 158 L176 194Z" fill="${t.gold}"/>
    <rect x="56" y="154" width="44" height="40" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M48 154 L78 124 L108 154Z" fill="${t.gold}" opacity=".85"/>
    <rect x="200" y="160" width="40" height="34" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M192 160 L220 132 L248 160Z" fill="${t.gold}" opacity=".85"/>
    <rect x="18" y="194" width="264" height="4" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<path d="M${18+e*28} 212 q7 -9 14 0 t14 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".6"/>`).join("")}
    <path d="M118 222 L182 222 L172 240 L128 240Z" fill="${t.gold}" opacity=".85"/>`,circustrain:(i,t)=>`
    ${g(96,44,120,13,t.gold,.22)}
    <rect x="18" y="206" width="264" height="4" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<rect x="${24+e*26}" y="210" width="16" height="5" fill="${t.gold}" opacity=".55"/>`).join("")}
    <rect x="54" y="140" width="76" height="52" rx="8" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M62 120 L94 120 L88 140 L68 140Z" fill="${t.gold}"/>
    <rect x="58" y="114" width="40" height="8" fill="${t.gold}"/>
    <circle cx="74" cy="192" r="15" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="112" cy="192" r="15" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <rect x="148" y="136" width="94" height="56" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5].map(e=>`<rect x="${158+e*15}" y="144" width="5" height="40" fill="${t.gold}"/>`).join("")}
    <path d="M142 136 L248 136 L240 118 L150 118Z" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6].map(e=>`<path d="M${152+e*14} 136 L${159+e*14} 126 L${166+e*14} 136Z" fill="${i.accent}"/>`).join("")}
    <circle cx="170" cy="192" r="14" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="222" cy="192" r="14" fill="none" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2,3].map(e=>`<ellipse class="a-smoke" style="animation-delay:${(e*.4).toFixed(2)}s" cx="${74-e*5}" cy="${100-e*20}" rx="${12+e*5}" ry="${7+e*3}" fill="${t.gold}" opacity="${(.45-e*.09).toFixed(2)}"/>`).join("")}`,marquee:(i,t)=>`
    ${g(150,30,120,16,t.gold,.22)}
    <path d="M56 56 L244 56 L228 110 L72 110Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11,12].map(e=>`<circle cx="${66+e*14}" cy="${118-Math.abs(e-6)*.6}" r="4.5" fill="${t.gold}"/>`).join("")}
    <rect x="86" y="68" width="128" height="30" fill="${i.a}" stroke="${t.gold}" stroke-width="1.5"/>
    ${h(150,83,9,t.gold)}
    <rect x="104" y="130" width="92" height="104" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M104 130 L150 162 L196 130" fill="none" stroke="${t.gold}" stroke-width="2"/>
    ${[66,234].map(e=>`<rect x="${e-7}" y="166" width="14" height="68" rx="7" fill="${t.gold}"/>`).join("")}
    ${[66,234].map(e=>`<circle cx="${e}" cy="160" r="10" fill="none" stroke="${t.gold}" stroke-width="3"/>`).join("")}
    <path d="M76 178 Q150 212 224 178" fill="none" stroke="${t.gold}" stroke-width="3.5"/>`,concert:(i,t)=>`
    ${g(150,34,124,16,t.gold,.24)}
    <path d="M34 58 L266 58 L266 72 L34 72Z" fill="${t.gold}"/>
    <path d="M40 72 Q78 132 44 220" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M260 72 Q222 132 256 220" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3].map(e=>`<path d="M${52+e*6} 76 Q${86+e*4} 136 ${56+e*6} 216" fill="none" stroke="${t.gold}" stroke-width="1.3" opacity=".6"/>`).join("")}
    ${[0,1,2,3].map(e=>`<path d="M${248-e*6} 76 Q${214-e*4} 136 ${244-e*6} 216" fill="none" stroke="${t.gold}" stroke-width="1.3" opacity=".6"/>`).join("")}
    <rect x="104" y="140" width="92" height="12" rx="4" fill="${t.gold}" transform="rotate(-10 150 146)"/>
    <rect x="146" y="152" width="8" height="58" fill="${t.gold}"/>
    <path d="M122 210 L178 210 L186 222 L114 222Z" fill="${t.gold}"/>
    <circle cx="126" cy="116" r="11" fill="${t.gold}"/>
    <rect x="135" y="80" width="5" height="38" fill="${t.gold}"/>
    <path d="M135 80 q22 6 26 22" fill="none" stroke="${t.gold}" stroke-width="4"/>
    <circle cx="198" cy="104" r="9" fill="${t.gold}"/>
    <rect x="205" y="74" width="4" height="32" fill="${t.gold}"/>
    <rect x="18" y="226" width="264" height="3" fill="${t.gold}"/>`,crown:(i,t)=>`
    ${g(150,38,122,16,t.gold,.22)}
    <path d="M64 126 L150 54 L236 126Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map(e=>`<path d="M${80+e*35} 126 L150 54" stroke="${t.gold}" stroke-width="1.3" opacity=".55"/>`).join("")}
    ${[0,1,2,3,4,5,6].map(e=>`<path d="M${72+e*26} 126 q13 16 26 0" fill="none" stroke="${t.gold}" stroke-width="2"/>`).join("")}
    <rect x="147" y="30" width="6" height="26" fill="${t.gold}"/>
    ${h(150,26,8,t.gold)}
    <path d="M104 212 L96 158 L122 182 L150 146 L178 182 L204 158 L196 212Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <rect x="100" y="212" width="100" height="14" fill="${t.gold}"/>
    ${[122,150,178].map(e=>h(e,196,6,t.gold)).join("")}
    ${h(96,154,5,t.gold)}${h(204,154,5,t.gold)}${h(150,142,5,t.gold)}
    <rect x="30" y="230" width="240" height="3" fill="${t.gold}"/>`,spaceport:(i,t)=>`
    ${g(150,30,126,18,t.gold,.2)}
    ${[[44,56],[256,48],[78,30],[222,36]].map(([e,o],l)=>h(e,o,l%2?4:6,t.gold)).join("")}
    <path d="M52 220 L52 108 Q150 56 248 108 L248 220" fill="none" stroke="${t.gold}" stroke-width="3.5"/>
    <path d="M70 220 L70 118 Q150 76 230 118 L230 220" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".7"/>
    <rect x="96" y="124" width="108" height="50" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3].map(e=>`<rect x="${106+e%2*52}" y="${134+Math.floor(e/2)*18}" width="${38-e%2*10}" height="8" fill="${t.gold}" opacity="${(.9-e*.12).toFixed(2)}"/>`).join("")}
    <rect x="40" y="220" width="220" height="6" fill="${t.gold}"/>
    ${[66,110,190,234].map(e=>`<rect x="${e-5}" y="186" width="10" height="34" fill="${t.gold}" opacity=".8"/>`).join("")}
    <circle cx="150" cy="200" r="16" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <ellipse cx="150" cy="200" rx="30" ry="8" fill="none" stroke="${t.gold}" stroke-width="2" transform="rotate(-18 150 200)"/>`,target:(i,t)=>`
    ${g(150,232,180,18,t.gold,.2)}
    <circle cx="150" cy="112" r="82" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="150" cy="112" r="62" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <circle class="a-ping" cx="150" cy="112" r="42" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <circle class="a-ping" style="animation-delay:.6s" cx="150" cy="112" r="22" fill="${t.gold}"/>
    ${[0,1,2,3].map(e=>{const o=e*Math.PI/2+Math.PI/4;return`<line x1="${(150+Math.cos(o)*82).toFixed(1)}" y1="${(112+Math.sin(o)*82).toFixed(1)}" x2="${(150+Math.cos(o)*104).toFixed(1)}" y2="${(112+Math.sin(o)*104).toFixed(1)}" stroke="${t.gold}" stroke-width="3"/>`}).join("")}
    <path d="M44 232 L140 124" stroke="${t.gold}" stroke-width="4" opacity=".9"/>
    <path d="M44 232 L140 124" stroke="${i.a}" stroke-width="1.4" stroke-dasharray="5 7"/>
    <path d="M24 236 L58 236 L66 222 L32 222Z" fill="${t.gold}"/>
    ${[["M212 60",6],["M236 92",4],["M74 70",5],["M58 136",4]].map(([e,o])=>h(Number(e.slice(1).split(" ")[0]),Number(e.split(" ")[1]),o,t.gold)).join("")}`,orrery:(i,t)=>`
    ${g(150,124,136,20,t.gold,.18)}
    <circle cx="150" cy="124" r="26" fill="${t.gold}"/>
    <circle cx="150" cy="124" r="34" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".7"/>
    ${[[96,16,-22,0],[122,12,14,1],[148,9,-8,2]].map(([e,o,l,a])=>`<g class="a-orbit a-orbit--${a}" style="transform-origin:150px 124px"><ellipse cx="150" cy="124" rx="${e}" ry="${o}" fill="none" stroke="${t.gold}" stroke-width="2.5" transform="rotate(${l} 150 124)"/></g>`).join("")}
    <circle cx="246" cy="98" r="13" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="58" cy="146" r="10" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="192" cy="186" r="8" fill="${t.gold}"/>
    ${[[88,74,-30],[214,160,24]].map(([e,o,l])=>`<g transform="rotate(${l} ${e} ${o})"><path d="M${e} ${o-20} L${e+9} ${o+8} L${e} ${o+16} L${e-9} ${o+8}Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.8"/><path d="M${e-9} ${o+6} L${e-18} ${o+20} L${e-3} ${o+14}Z M${e+9} ${o+6} L${e+18} ${o+20} L${e+3} ${o+14}Z" fill="${t.gold}"/></g>`).join("")}
    ${[0,1,2,3,4,5,6,7].map(e=>{const o=e*Math.PI/4;return`<line x1="${(150+Math.cos(o)*38).toFixed(1)}" y1="${(124+Math.sin(o)*38).toFixed(1)}" x2="${(150+Math.cos(o)*46).toFixed(1)}" y2="${(124+Math.sin(o)*46).toFixed(1)}" stroke="${t.gold}" stroke-width="2"/>`}).join("")}
    <rect x="146" y="150" width="8" height="78" fill="${t.gold}"/>
    <rect x="112" y="228" width="76" height="8" rx="4" fill="${t.gold}"/>`,roadster:(i,t)=>`
    ${g(150,34,120,14,t.gold,.18)}
    ${[[36,96],[62,72],[88,110],[212,110],[238,72],[264,96]].map(([e,o])=>`<rect x="${e-13}" y="${236-o}" width="26" height="${o}" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.5"/><path d="M${e-13} ${236-o} L${e} ${236-o-16} L${e+13} ${236-o}Z" fill="${t.gold}"/>`).join("")}
    <circle cx="150" cy="126" r="66" fill="none" stroke="${t.gold}" stroke-width="7"/>
    <circle cx="150" cy="126" r="20" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2].map(e=>{const o=e*2*Math.PI/3-Math.PI/2;return`<line x1="150" y1="126" x2="${(150+Math.cos(o)*62).toFixed(1)}" y2="${(126+Math.sin(o)*62).toFixed(1)}" stroke="${t.gold}" stroke-width="6"/>`}).join("")}
    ${h(150,126,7,t.gold)}
    <path d="M86 236 L124 196 L176 196 L214 236Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2].map(e=>`<rect x="146" y="${200+e*13}" width="8" height="8" fill="${t.gold}"/>`).join("")}`,porthole:(i,t)=>`
    <circle cx="150" cy="118" r="88" fill="${i.accent}" stroke="${t.gold}" stroke-width="4"/>
    <circle cx="150" cy="118" r="68" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(e=>{const o=e*Math.PI/8;return`<circle cx="${(150+Math.cos(o)*78).toFixed(1)}" cy="${(118+Math.sin(o)*78).toFixed(1)}" r="4" fill="${t.gold}"/>`}).join("")}
    ${[0,1,2,3].map(e=>`<path d="M${98+e*6} ${104+e*16} q24 -11 48 0 t48 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity="${(.8-e*.13).toFixed(2)}"/>`).join("")}
    <path d="M128 142 q22 -16 44 0 q-10 20 -22 20 q-12 0 -22 -20Z" fill="${t.gold}" opacity=".85"/>
    <path d="M172 150 L196 138 L196 164Z" fill="${t.gold}" opacity=".85"/>
    <rect x="116" y="212" width="68" height="20" rx="4" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M126 212 L126 196 Q150 182 174 196 L174 212Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="150" cy="200" r="9" fill="${t.gold}"/>
    <rect x="18" y="232" width="264" height="3" fill="${t.gold}"/>`,beacon:(i,t)=>`
    ${[0,1,2,3,4].map(e=>`<ellipse class="a-ping" style="animation-delay:${(e*.5).toFixed(2)}s" cx="150" cy="206" rx="${40+e*28}" ry="${10+e*7}" fill="none" stroke="${t.gold}" stroke-width="${(2.6-e*.4).toFixed(1)}" opacity="${(.9-e*.16).toFixed(2)}"/>`).join("")}
    <path d="M110 206 L132 92 L168 92 L190 206Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M132 92 L150 50 L168 92Z" fill="${t.gold}"/>
    ${[0,1,2].map(e=>`<rect x="${130-e*2}" y="${118+e*26}" width="${40+e*4}" height="9" fill="${t.gold}" opacity="${(.9-e*.16).toFixed(2)}"/>`).join("")}
    ${h(150,44,9,t.gold)}
    ${[0,1,2,3,4,5].map(e=>{const o=-Math.PI+e*Math.PI/5;return`<path d="M150 56 L${(150+Math.cos(o)*126).toFixed(1)} ${(56+Math.sin(o)*126).toFixed(1)}" stroke="${t.gold}" stroke-width="1.4" opacity=".4" stroke-dasharray="6 8"/>`}).join("")}
    ${[[48,112],[252,104],[72,168],[228,172]].map(([e,o],l)=>h(e,o,l%2?4:5.5,t.gold)).join("")}
    <rect x="30" y="228" width="240" height="4" fill="${t.gold}"/>`,playground:(i,t)=>`
    ${g(150,36,118,14,t.gold,.18)}
    <path d="M96 226 L128 110 L160 226Z" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <path d="M140 226 L172 110 L204 226Z" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <rect x="112" y="128" width="76" height="8" fill="${t.gold}"/>
    <rect x="118" y="136" width="64" height="40" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M106 132 L150 96 L194 132Z" fill="${t.gold}"/>
    <path d="M188 176 Q236 190 232 226" fill="none" stroke="${t.gold}" stroke-width="7" stroke-linecap="round"/>
    <path d="M188 176 Q236 190 232 226" fill="none" stroke="${i.a}" stroke-width="2" stroke-dasharray="5 7"/>
    <rect x="42" y="118" width="7" height="108" fill="${t.gold}"/>
    <rect x="42" y="118" width="68" height="7" fill="${t.gold}"/>
    <line x1="66" y1="125" x2="66" y2="180" stroke="${t.gold}" stroke-width="2"/>
    <line x1="92" y1="125" x2="92" y2="180" stroke="${t.gold}" stroke-width="2"/>
    <rect x="60" y="180" width="38" height="8" rx="4" fill="${t.gold}"/>
    <rect x="18" y="226" width="264" height="4" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8].map(e=>`<path d="M${22+e*31} 238 q8 -7 16 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".5"/>`).join("")}`,chest:(i,t)=>`
    ${g(150,40,124,16,t.gold,.2)}
    <path d="M62 112 Q150 56 238 112 L238 128 L62 128Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3].map(e=>`<path d="M${86+e*43} 108 Q${92+e*43} 74 150 68" fill="none" stroke="${t.gold}" stroke-width="1.6" opacity=".55"/>`).join("")}
    <rect x="62" y="128" width="176" height="76" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <rect x="62" y="126" width="176" height="10" fill="${t.gold}"/>
    ${[94,206].map(e=>`<rect x="${e-6}" y="112" width="12" height="92" fill="${t.gold}" opacity=".85"/>`).join("")}
    <rect x="136" y="140" width="28" height="30" rx="3" fill="${t.gold}"/>
    <circle cx="150" cy="152" r="5" fill="${i.a}"/>
    <path d="M150 156 L150 166" stroke="${i.a}" stroke-width="3"/>
    ${[0,1,2,3,4,5,6].map(e=>`<circle cx="${78+e*24}" cy="214" r="7" fill="${t.gold}" opacity="${(.95-e*.07).toFixed(2)}"/>`).join("")}
    ${[0,1,2,3,4,5].map(e=>`<circle cx="${92+e*24}" cy="228" r="6" fill="${t.gold}" opacity=".7"/>`).join("")}
    <path d="M34 96 L112 176" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    <path d="M266 96 L188 176" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="30" cy="92" r="9" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="270" cy="92" r="9" fill="none" stroke="${t.gold}" stroke-width="3"/>`,temple:(i,t)=>`
    ${g(150,36,118,14,t.gold,.2)}
    ${B(150,224,210,118,5,i.accent)}
    ${[0,1,2,3,4].map(e=>`<rect x="${150-(105-e*21)}" y="${224-(e+1)*23.6}" width="${(105-e*21)*2}" height="2" fill="${t.gold}" opacity=".6"/>`).join("")}
    <path d="M130 224 L130 166 Q150 150 170 166 L170 224Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    ${h(150,100,11,t.gold)}
    <circle cx="150" cy="100" r="22" fill="none" stroke="${t.gold}" stroke-width="2"/>
    <circle cx="86" cy="150" r="34" fill="none" stroke="${t.gold}" stroke-width="4"/>
    <path d="M52 150 L52 206" stroke="${t.gold}" stroke-width="4"/>
    <path d="M120 150 L120 206" stroke="${t.gold}" stroke-width="4"/>
    ${[0,1,2,3,4,5].map(e=>`<rect x="${50+e*14}" y="${206+e%2*2}" width="8" height="4" fill="${t.gold}" opacity=".6"/>`).join("")}
    <rect x="232" y="128" width="9" height="96" fill="${t.gold}"/>
    <path d="M226 128 q10 -30 20 0Z" fill="${t.gold}"/>
    ${[0,1,2].map(e=>`<path class="a-smoke" style="animation-delay:${(e*.3).toFixed(2)}s" d="M${230+e*3} ${118-e*12} q6 -12 10 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity="${(.8-e*.22).toFixed(2)}"/>`).join("")}
    <rect x="18" y="224" width="264" height="4" fill="${t.gold}"/>`,treehouse:(i,t)=>`
    ${g(150,34,116,14,t.gold,.18)}
    <path d="M138 226 L138 142 Q126 118 150 104 Q174 118 162 142 L162 226Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    ${[[-1,126],[1,126],[-1,160],[1,160]].map(([e,o])=>`<path d="M150 ${o} q${e*36} -14 ${e*62} -34" fill="none" stroke="${t.gold}" stroke-width="4" stroke-linecap="round"/>`).join("")}
    ${[[150,64,54],[86,92,34],[214,92,34]].map(([e,o,l])=>`<circle cx="${e}" cy="${o}" r="${l}" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>`).join("")}
    ${[[150,64,54],[86,92,34],[214,92,34]].map(([e,o,l])=>`<circle cx="${e}" cy="${o}" r="${l-10}" fill="none" stroke="${t.gold}" stroke-width="1.2" opacity=".55"/>`).join("")}
    <rect x="96" y="132" width="52" height="34" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M90 132 L122 108 L154 132Z" fill="${t.gold}"/>
    <rect x="106" y="142" width="14" height="18" fill="${t.gold}"/>
    <rect x="166" y="166" width="46" height="30" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M160 166 L189 144 L218 166Z" fill="${t.gold}"/>
    <g class="a-wheel" style="transform-origin:238px 206px"><circle cx="238" cy="206" r="26" fill="none" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2,3,4,5,6,7].map(e=>{const o=e*Math.PI/4;return`<line x1="238" y1="206" x2="${(238+Math.cos(o)*26).toFixed(1)}" y2="${(206+Math.sin(o)*26).toFixed(1)}" stroke="${t.gold}" stroke-width="2.2"/>`}).join("")}</g>
    <rect x="18" y="226" width="264" height="4" fill="${t.gold}"/>`,galleon:(i,t)=>`
    ${g(150,32,120,16,t.gold,.2)}
    <path d="M46 180 L254 180 L224 224 L76 224Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <rect x="46" y="172" width="208" height="10" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6].map(e=>`<rect x="${68+e*24}" y="190" width="14" height="12" fill="${t.gold}" opacity=".8"/>`).join("")}
    <path d="M214 180 L214 148 L254 148 L254 180Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2"/>
    <rect x="104" y="46" width="7" height="134" fill="${t.gold}"/>
    <rect x="186" y="62" width="7" height="118" fill="${t.gold}"/>
    <path d="M62 68 L104 68 L104 110 L62 110Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M111 68 L160 68 L160 110 L111 110Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M111 120 L172 120 L172 160 L111 160Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    <path d="M193 84 L238 84 L238 122 L193 122Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    ${h(107,40,8,t.gold)}
    <path d="M193 62 L232 70 L193 78Z" fill="${t.gold}"/>
    <path d="M46 180 L18 162" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<path d="M${18+e*28} 236 q7 -8 14 0 t14 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".5"/>`).join("")}`,anchor:(i,t)=>`
    ${g(150,232,170,18,t.gold,.18)}
    <circle cx="150" cy="54" r="18" fill="none" stroke="${t.gold}" stroke-width="6"/>
    <rect x="144" y="70" width="12" height="130" fill="${t.gold}"/>
    <rect x="108" y="92" width="84" height="11" rx="5" fill="${t.gold}"/>
    <path d="M150 200 Q98 200 82 150 L66 164 Q78 230 150 230 Q222 230 234 164 L218 150 Q202 200 150 200Z" fill="${t.gold}"/>
    <circle cx="150" cy="140" r="64" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".5"/>
    ${[0,1,2,3,4,5,6,7].map(e=>{const o=e*Math.PI/4+Math.PI/8;return`<line x1="${(150+Math.cos(o)*64).toFixed(1)}" y1="${(140+Math.sin(o)*64).toFixed(1)}" x2="${(150+Math.cos(o)*82).toFixed(1)}" y2="${(140+Math.sin(o)*82).toFixed(1)}" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>`}).join("")}
    ${[[44,70],[256,62],[70,196],[230,196]].map(([e,o],l)=>h(e,o,l%2?4:6,t.gold)).join("")}
    <path d="M18 240 q18 -12 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0" fill="none" stroke="${t.gold}" stroke-width="2.5" opacity=".6"/>`,isle:(i,t)=>`
    ${g(150,34,118,14,t.gold,.18)}
    <path d="M18 196 Q60 150 104 164 Q128 118 164 140 Q206 120 240 158 Q268 166 282 196Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M118 196 Q118 158 150 158 Q182 158 182 196Z" fill="${i.a}" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2].map(e=>`<path d="M${132+e*18} 196 L${132+e*18} 176" stroke="${t.gold}" stroke-width="2" opacity=".6"/>`).join("")}
    <path d="M26 112 q14 -26 34 -30 q-14 16 -14 32Z M26 112 q-16 -22 -4 -40 q12 14 14 34Z" fill="${t.gold}" opacity=".85"/>
    <rect x="40" y="110" width="6" height="56" fill="${t.gold}"/>
    <path d="M262 104 q-14 -24 -34 -28 q14 16 14 30Z M262 104 q16 -20 6 -38 q-12 14 -16 32Z" fill="${t.gold}" opacity=".85"/>
    <rect x="256" y="102" width="6" height="56" fill="${t.gold}"/>
    <path d="M40 142 Q150 188 258 136" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M40 122 Q150 168 258 116" fill="none" stroke="${t.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8].map(e=>{const o=(e+1)/10,l=40+218*o,a=122+46*(4*o*(1-o))-6*o,n=a+20;return`<line x1="${l.toFixed(1)}" y1="${a.toFixed(1)}" x2="${l.toFixed(1)}" y2="${n.toFixed(1)}" stroke="${t.gold}" stroke-width="2"/>`}).join("")}
    <rect x="18" y="196" width="264" height="4" fill="${t.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map(e=>`<path d="M${18+e*28} 216 q7 -9 14 0 t14 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".5"/>`).join("")}`,lamp:(i,t)=>`
    ${g(150,44,126,20,t.gold,.24)}
    <path d="M62 226 L62 136 Q62 76 150 76 Q238 76 238 136 L238 226" fill="none" stroke="${t.gold}" stroke-width="3.5"/>
    <path d="M82 226 L82 140 Q82 96 150 96 Q218 96 218 140 L218 226" fill="none" stroke="${t.gold}" stroke-width="1.4" opacity=".6"/>
    ${h(150,68,9,t.gold)}
    <path d="M96 190 Q96 158 150 158 Q204 158 204 190 Q204 206 150 206 Q96 206 96 190Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M204 176 L250 160 L246 188 L204 186Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.5"/>
    <path d="M96 180 q-32 2 -30 22 q2 16 22 12" fill="none" stroke="${t.gold}" stroke-width="5"/>
    <path class="a-flicker" style="transform-origin:150px 158px" d="M132 158 Q150 140 168 158Z" fill="${t.gold}"/>
    ${h(150,148,6,t.gold)}
    ${[0,1,2,3].map(e=>`<path d="M${248-e*4} ${152-e*20} q10 -16 16 0" fill="none" stroke="${t.gold}" stroke-width="2.2" opacity="${(.85-e*.18).toFixed(2)}"/>`).join("")}
    <rect x="62" y="226" width="176" height="6" fill="${t.gold}"/>
    ${[0,1,2,3,4,5].map(e=>`<rect x="${72+e*28}" y="214" width="12" height="12" fill="${t.gold}" opacity=".5"/>`).join("")}`,shell:(i,t)=>`
    ${[0,1,2,3,4].map(e=>`<path d="M10 ${54+e*46} q44 -20 88 0 t88 0 t88 0 t88 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity="${(.5-e*.07).toFixed(2)}"/>`).join("")}
    <path d="M44 184 Q44 92 150 92 Q256 92 256 184Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <path d="M150 92 L150 184 M70 136 L230 136 M62 160 L238 160" stroke="${t.gold}" stroke-width="1.6" opacity=".75"/>
    <path d="M104 100 L104 184 M196 100 L196 184" stroke="${t.gold}" stroke-width="1.6" opacity=".75"/>
    <path d="M150 104 L124 126 L136 156 L164 156 L176 126Z" fill="none" stroke="${t.gold}" stroke-width="2.2"/>
    <rect x="36" y="184" width="228" height="10" rx="5" fill="${t.gold}"/>
    <path d="M36 194 q10 20 30 18 M264 194 q-10 20 -30 18" fill="none" stroke="${t.gold}" stroke-width="5" stroke-linecap="round"/>
    ${h(150,78,8,t.gold)}
    ${[[52,70],[248,70]].map(([e,o])=>h(e,o,5,t.gold)).join("")}
    <path d="M18 240 q18 -14 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0" fill="none" stroke="${t.gold}" stroke-width="2.5" opacity=".6"/>`,controller:(i,t)=>`
    ${g(150,34,120,16,t.gold,.18)}
    <path d="M52 236 Q52 120 92 120 M248 236 Q248 120 208 120" fill="none" stroke="${t.gold}" stroke-width="3" opacity=".5"/>
    <rect x="86" y="96" width="128" height="104" rx="12" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <rect x="98" y="108" width="104" height="30" rx="4" fill="none" stroke="${t.gold}" stroke-width="2"/>
    ${[0,1,2].map(e=>`<rect x="${106+e*32}" y="116" width="20" height="14" fill="${t.gold}" opacity="${(.9-e*.22).toFixed(2)}"/>`).join("")}
    <circle cx="118" cy="168" r="17" fill="none" stroke="${t.gold}" stroke-width="2.6"/>
    <circle cx="182" cy="168" r="17" fill="none" stroke="${t.gold}" stroke-width="2.6"/>
    <circle cx="118" cy="162" r="7" fill="${t.gold}"/>
    <circle cx="182" cy="174" r="7" fill="${t.gold}"/>
    <path d="M196 96 L214 46" stroke="${t.gold}" stroke-width="4" stroke-linecap="round"/>
    <circle class="a-ping" cx="214" cy="44" r="7" fill="${t.gold}" style="transform-origin:214px 44px"/>
    ${[0,1,2].map(e=>`<path d="M${222+e*10} ${38-e*7} q${10+e*5} ${12+e*6} 0 ${26+e*12}" fill="none" stroke="${t.gold}" stroke-width="2" opacity="${(.8-e*.22).toFixed(2)}"/>`).join("")}
    <rect x="40" y="232" width="220" height="7" fill="${t.gold}"/>`,parachute:(i,t)=>`
    ${g(150,28,112,14,t.gold,.16)}
    <g class="a-canopy" style="transform-origin:150px 48px">
      <path d="M46 116 Q46 36 150 36 Q254 36 254 116 Q214 96 186 116 Q166 94 150 116 Q134 94 114 116 Q86 96 46 116Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
      ${[0,1,2,3].map(e=>`<path d="M${94+e*37} 110 Q${110+e*30} 44 150 36" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".65"/>`).join("")}
    </g>
    ${[[52,112],[116,114],[184,114],[248,112]].map(([e,o])=>`<path d="M${e} ${o} L150 190" stroke="${t.gold}" stroke-width="1.8" opacity=".8"/>`).join("")}
    <rect x="112" y="190" width="76" height="52" rx="4" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <path d="M112 216 L188 216 M150 190 L150 242" stroke="${t.gold}" stroke-width="1.6" opacity=".7"/>
    ${h(150,216,9,t.gold)}
    ${[[36,66],[264,66]].map(([e,o])=>h(e,o,5,t.gold)).join("")}`,spring:(i,t)=>`
    ${g(150,30,118,16,t.gold,.16)}
    <rect x="34" y="70" width="40" height="50" rx="6" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <rect x="226" y="150" width="40" height="50" rx="6" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2,3,4,5,6,7,8,9,10].map(e=>{const o=e/10,l=74+o*152,a=96+o*78,n=30-o*6;return`<ellipse cx="${l.toFixed(1)}" cy="${a.toFixed(1)}" rx="${(n*.42).toFixed(1)}" ry="${n.toFixed(1)}" fill="none" stroke="${t.gold}" stroke-width="2.6" opacity="${(.95-e*.045).toFixed(2)}"/>`}).join("")}
    ${h(54,60,7,t.gold)}${h(246,212,7,t.gold)}
    <rect x="30" y="238" width="240" height="6" fill="${t.gold}"/>
    ${[0,1,2,3,4,5].map(e=>`<rect x="${44+e*38}" y="228" width="14" height="10" fill="${t.gold}" opacity=".45"/>`).join("")}`,route66:(i,t)=>`
    ${[0,1,2,3].map(e=>`<path d="M${-20+e*90} 244 L${60+e*90} 150" stroke="${t.gold}" stroke-width="2" opacity=".28"/>`).join("")}
    <path d="M104 244 L128 118 L172 118 L196 244Z" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".4"/>
    <rect x="144" y="150" width="12" height="94" fill="${t.gold}"/>
    <path d="M88 52 L212 52 L212 120 Q212 150 150 164 Q88 150 88 120Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3.5"/>
    <path d="M98 62 L202 62 L202 118 Q202 142 150 154 Q98 142 98 118Z" fill="none" stroke="${t.gold}" stroke-width="1.4" opacity=".7"/>
    <text x="150" y="98" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="20" letter-spacing="2" fill="${t.gold}">ROUTE</text>
    <text x="150" y="134" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="30" letter-spacing="3" fill="${t.gold}">66</text>
    ${[[48,80],[252,80]].map(([e,o])=>h(e,o,6,t.gold)).join("")}
    <rect x="36" y="244" width="228" height="6" fill="${t.gold}"/>`,cone:(i,t)=>`
    ${g(150,34,116,14,t.gold,.14)}
    <ellipse cx="100" cy="206" rx="72" ry="22" fill="none" stroke="${t.gold}" stroke-width="2.4" opacity=".55"/>
    <ellipse cx="200" cy="206" rx="72" ry="22" fill="none" stroke="${t.gold}" stroke-width="2.4" opacity=".55"/>
    <path d="M124 214 L144 72 L156 72 L176 214Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <path d="M136 156 L164 156 M132 182 L168 182" stroke="${t.gold}" stroke-width="7"/>
    <ellipse cx="150" cy="214" rx="46" ry="13" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    ${h(150,62,7,t.gold)}
    ${[[52,112],[248,112]].map(([e,o])=>h(e,o,5,t.gold)).join("")}
    <rect x="30" y="238" width="240" height="6" fill="${t.gold}"/>`,carpet:(i,t)=>`
    ${g(150,30,114,18,t.gold,.18)}
    ${[0,1,2,3,4,5,6].map(e=>`${h(40+e*37,60+e%2*14,4,t.gold)}`).join("")}
    <path d="M40 150 Q90 112 150 134 Q210 156 260 118 L260 176 Q210 214 150 192 Q90 170 40 208Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <path d="M48 160 Q94 126 150 146 Q206 166 252 132" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".75"/>
    <path d="M48 196 Q94 162 150 182 Q206 202 252 168" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".75"/>
    <path d="M150 150 q-18 14 0 28 q18 -14 0 -28Z" fill="${t.gold}"/>
    ${[[108,152],[192,170]].map(([e,o])=>h(e,o,5,t.gold)).join("")}
    ${[0,1,2,3,4].map(e=>`<path d="M${42+e*5} ${206+e*1} l-10 16" stroke="${t.gold}" stroke-width="2" opacity=".8"/>`).join("")}
    ${[0,1,2,3,4].map(e=>`<path d="M${238+e*5} ${118+e*1} l10 -16" stroke="${t.gold}" stroke-width="2" opacity=".8"/>`).join("")}
    <path d="M18 242 q18 -10 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0" fill="none" stroke="${t.gold}" stroke-width="2" opacity=".45"/>`,satellite:(i,t)=>`
    ${[0,1,2,3,4,5,6].map(e=>`${h(30+e*40,44+e%3*18,e%2?3:4.5,t.gold)}`).join("")}
    <path d="M62 170 Q62 78 150 78 Q238 78 238 170Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
    <path d="M80 168 Q80 94 150 94 Q220 94 220 168" fill="none" stroke="${t.gold}" stroke-width="1.4" opacity=".65"/>
    <path d="M62 170 L238 170" stroke="${t.gold}" stroke-width="3"/>
    <path d="M150 170 L150 110" stroke="${t.gold}" stroke-width="3"/>
    <circle cx="150" cy="106" r="9" fill="${t.gold}"/>
    <circle class="a-ping" cx="150" cy="106" r="9" fill="none" stroke="${t.gold}" stroke-width="2" style="transform-origin:150px 106px"/>
    <path d="M144 170 L132 236 L168 236 L156 170Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.6"/>
    <rect x="110" y="236" width="80" height="8" rx="4" fill="${t.gold}"/>
    ${[0,1,2].map(e=>`<path d="M${196+e*16} ${60-e*6} q${14+e*6} ${18+e*8} 0 ${36+e*16}" fill="none" stroke="${t.gold}" stroke-width="2.2" opacity="${(.8-e*.2).toFixed(2)}"/>`).join("")}`,zoetrope:(i,t)=>`
    ${g(150,32,112,16,t.gold,.16)}
    <ellipse cx="150" cy="96" rx="92" ry="24" fill="none" stroke="${t.gold}" stroke-width="2.6"/>
    <g class="a-turn" style="transform-origin:150px 150px">
      <path d="M58 96 L58 186 Q58 208 150 208 Q242 208 242 186 L242 96" fill="${i.accent}" stroke="${t.gold}" stroke-width="3"/>
      ${[0,1,2,3,4,5,6,7].map(e=>`<rect x="${64+e*23}" y="104" width="7" height="62" fill="${t.gold}" opacity=".85"/>`).join("")}
    </g>
    <path d="M58 186 Q58 208 150 208 Q242 208 242 186" fill="none" stroke="${t.gold}" stroke-width="3"/>
    <rect x="144" y="208" width="12" height="26" fill="${t.gold}"/>
    <ellipse cx="150" cy="238" rx="58" ry="12" fill="${i.accent}" stroke="${t.gold}" stroke-width="2.6"/>
    ${h(150,62,8,t.gold)}
    ${[[44,74],[256,74]].map(([e,o])=>h(e,o,5,t.gold)).join("")}`,lantern:(i,t)=>`
    ${[[46,70,.5],[256,58,.45],[72,186,.35],[236,176,.4],[108,44,.3],[200,40,.3]].map(([e,o,l])=>`<g opacity="${l}"><path d="M${e-11} ${o} L${e-8} ${o-18} L${e+8} ${o-18} L${e+11} ${o} L${e+7} ${o+13} L${e-7} ${o+13}Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="1.6"/></g>`).join("")}
    <g class="a-flicker" style="transform-origin:150px 150px">
      <path d="M108 110 L116 64 L184 64 L192 110 L180 192 L120 192Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3.2"/>
      <path d="M120 110 L180 110 M124 150 L176 150" stroke="${t.gold}" stroke-width="1.6" opacity=".7"/>
      ${h(150,130,11,t.gold)}
      <path d="M116 64 L184 64 L178 50 L122 50Z" fill="${t.gold}"/>
      <path d="M120 192 L180 192 L172 206 L128 206Z" fill="${t.gold}" opacity=".8"/>
    </g>
    <path d="M150 206 L150 234" stroke="${t.gold}" stroke-width="2" opacity=".5" stroke-dasharray="4 5"/>
    ${[0,1,2,3,4,5].map(e=>`${h(34+e*46,240,4,t.gold)}`).join("")}`,web:(i,t)=>`
    ${[0,1,2,3,4,5,6,7].map(e=>{const o=-Math.PI+e*Math.PI/7;return`<line x1="150" y1="42" x2="${(150+Math.cos(o)*180).toFixed(1)}" y2="${(42+Math.abs(Math.sin(o))*210).toFixed(1)}" stroke="${t.gold}" stroke-width="2" opacity=".75"/>`}).join("")}
    ${[46,86,126,166,206].map((e,o)=>`<polyline points="${[0,1,2,3,4,5,6,7].map(a=>{const n=-Math.PI+a*Math.PI/7;return`${(150+Math.cos(n)*e*.86).toFixed(1)},${(42+Math.abs(Math.sin(n))*e).toFixed(1)}`}).join(" ")}" fill="none" stroke="${t.gold}" stroke-width="${(2.4-o*.22).toFixed(1)}" opacity="${(.9-o*.1).toFixed(2)}"/>`).join("")}
    <circle cx="150" cy="42" r="8" fill="${t.gold}"/>
    ${[[60,96],[240,96],[96,186],[204,186]].map(([e,o],l)=>h(e,o,l%2?4:5.5,i.accent)).join("")}
    <rect x="24" y="36" width="252" height="4" fill="${t.gold}"/>`,webshooter:(i,t)=>`
    ${g(150,32,110,14,t.gold,.14)}
    <path d="M88 108 Q150 86 212 108 L212 162 Q150 184 88 162Z" fill="${i.accent}" stroke="${t.gold}" stroke-width="3.2"/>
    <path d="M96 120 Q150 102 204 120 M96 150 Q150 168 204 150" fill="none" stroke="${t.gold}" stroke-width="1.5" opacity=".7"/>
    <rect x="128" y="118" width="44" height="34" rx="6" fill="none" stroke="${t.gold}" stroke-width="2.6"/>
    ${h(150,135,8,t.gold)}
    <rect x="140" y="152" width="20" height="26" rx="4" fill="${t.gold}"/>
    <circle cx="150" cy="184" r="9" fill="none" stroke="${t.gold}" stroke-width="3"/>
    ${[0,1,2,3].map(e=>`<path d="M150 194 q${(e-1.5)*26} ${24+e*6} ${(e-1.5)*44} ${44+e*4}" fill="none" stroke="${t.gold}" stroke-width="2.2" opacity="${(.85-e*.13).toFixed(2)}"/>`).join("")}
    ${[[56,96],[244,96]].map(([e,o])=>h(e,o,5,t.gold)).join("")}
    <rect x="30" y="242" width="240" height="5" fill="${t.gold}"/>`};function Et(i,t="poster",e={}){const o=rt[t]?rt[t]:rt.poster,l=jt[i]?i:"mesa";let a=z[l];t==="night"&&(a={a:"#06111A",b:"#0C2030",accent:a.accent}),t==="blueprint"&&(a={a:o.mono,b:o.mono,accent:"rgba(191,217,228,.14)"});const n="p"+Math.random().toString(36).slice(2,8),c=st((e.label||"").toUpperCase()),p=(e.lines&&e.lines.length?e.lines:[e.label||""]).map(u=>st(u.toUpperCase()));let r="";if(o.grid){for(let u=20;u<300;u+=20)r+=`<line x1="${u}" y1="60" x2="${u}" y2="300" stroke="${o.gold}" stroke-width=".7" opacity="${o.grid}"/>`;for(let u=60;u<300;u+=20)r+=`<line x1="18" y1="${u}" x2="282" y2="${u}" stroke="${o.gold}" stroke-width=".7" opacity="${o.grid}"/>`}const w=o.rays?g(150,60,290,22,o.gold,o.rays):"";let m="";t==="night"&&[[46,84],[254,96],[70,150],[230,168],[150,42],[96,62],[206,54]].forEach(([u,F],R)=>{m+=h(u,F,R%2?3:4.5,o.gold)});const b=Math.max(...p.map(u=>u.length)),k=Math.min(p.length===1?24:20,244/(b*.82)),x=p.length===1?356:346,j=p.map((u,F)=>`<text x="150" y="${(x+F*(k+7)).toFixed(1)}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="${k.toFixed(1)}" letter-spacing="${(k*.13).toFixed(1)}" fill="${o.gold}">${u}</text>`).join(""),L=(u,F,R,M)=>`<path d="M${u} ${F+M*26} L${u} ${F+M*12} L${u+R*7} ${F+M*12} L${u+R*7} ${F} L${u+R*26} ${F}" fill="none" stroke="${o.gold}" stroke-width="2"/>`,S=o.stub?`<g><line x1="18" y1="300" x2="282" y2="300" stroke="${o.gold}" stroke-width="1" stroke-dasharray="4 5"/>
       <text x="150" y="320" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="9" letter-spacing="5" fill="${o.gold}" opacity=".85">ADMIT ONE</text></g>`:"",O=e.fade?`<filter id="${n}f"><feColorMatrix type="saturate" values="0.14"/></filter>`:"";return`<svg viewBox="${e.paysage?"14 96 272 159":"0 0 300 420"}"" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${st(e.alt||"Planche gravée")}"${e.fade?` filter="url(#${n}f)" opacity=".74"`:""}>
  <defs>${O}
    <linearGradient id="${n}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.b}"/><stop offset="1" stop-color="${a.a}"/></linearGradient>
    <clipPath id="${n}c"><rect x="18" y="60" width="264" height="240"/></clipPath>
  </defs>

  <rect width="300" height="420" fill="#0B2025"/>

  <!-- Bandeau du land -->
  <text x="150" y="33" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="${c.length>18?9:10.5}" letter-spacing="${c.length>18?3:4.5}" fill="${o.gold}">${c}</text>
  <line x1="26" y1="44" x2="274" y2="44" stroke="${o.gold}" stroke-width="1"/>
  ${h(26,44,4,o.gold)}${h(274,44,4,o.gold)}

  <!-- Fenêtre illustrée -->
  <g clip-path="url(#${n}c)">
    <rect x="18" y="60" width="264" height="240" fill="url(#${n}g)"/>
    ${w}${r}
    <g transform="translate(18 60) scale(.88)" opacity="${o.dim||1}">${jt[l](a,o)}</g>
    ${m}
  </g>
  <rect x="18" y="60" width="264" height="240" fill="none" stroke="${o.gold}" stroke-width="2"/>
  <rect x="24" y="66" width="252" height="228" fill="none" stroke="${o.gold}" stroke-width=".8" opacity=".7"/>

  <!-- Plaque de titre -->
  ${S}
  <line x1="60" y1="${x-24}" x2="240" y2="${x-24}" stroke="${o.gold}" stroke-width="1"/>
  ${h(150,x-24,5,o.gold)}
  ${j}
  <line x1="92" y1="${x+(p.length===1?20:42)}" x2="208" y2="${x+(p.length===1?20:42)}" stroke="${o.gold}" stroke-width=".8" opacity=".75"/>

  <!-- Encadrement -->
  <rect x="8" y="8" width="284" height="404" fill="none" stroke="${o.gold}" stroke-width="1.5"/>
  ${L(14,14,1,1)}${L(286,14,-1,1)}${L(14,406,1,-1)}${L(286,406,-1,-1)}
</svg>`}const Ft="chroniques:parcours";let q=null;function G(){if(q)return q;q={epingles:[],faits:[]};try{const i=localStorage.getItem(Ft);if(i){const t=JSON.parse(i);Array.isArray(t.epingles)&&(q.epingles=t.epingles),Array.isArray(t.faits)&&(q.faits=t.faits)}}catch{}return q}function Ct(){try{localStorage.setItem(Ft,JSON.stringify(q))}catch{}}function Pt(i,t){const e=i.indexOf(t);return e===-1?i.push(t):i.splice(e,1),Ct(),e===-1}const X=i=>G().epingles.includes(i),Y=i=>G().faits.includes(i),Le=i=>Pt(G().epingles,i),Zt=i=>Pt(G().faits,i),pi=()=>[...G().epingles];function _e(){const i=G();return{epingles:i.epingles.length,faits:i.epingles.filter(t=>i.faits.includes(t)).length}}function Ae(){q={epingles:[],faits:[]},Ct()}const H=i=>String(i??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);function je(i){window.parkMapPoints={a:Object.fromEntries(i.filter(t=>t.coords).map(t=>[t.name,t.coords]))}}function Ee(i){const t=i.coords&&window.parkMapPreview?window.parkMapPreview("a",i.name):"";return t?`<section class="section" aria-labelledby="h-plan">
      <h3 class="section__title rule" id="h-plan"><span>Localisation</span></h3>
      <div class="plan-apercu">${t}</div>
      <p class="plan-note">Plan interactif © Disneyland Paris · touche le plan pour l'agrandir et zoomer.</p>
    </section>`:""}const dt={get actif(){return!!window.nearby?.active},basculer(){window.nearby&&(window.nearby.active?window.nearby.stop():window.nearby.start())},surChangement(i){window.nearby?.onChange(i)}};function Fe(i,t,e){const o=window.nearby;if(!o?.active)return o?.error?`<p class="autour__info autour__info--alerte">${H(o.error)}</p>`:"";if(!o.position)return'<p class="autour__info">Recherche de ta position…</p>';const l=r=>r*1.3/75;let a=i.filter(r=>r.coords).map(r=>({a:r,m:o.distanceTo("a",r.name),st:t(r)})).filter(r=>r.m!=null);e==="attente"?a=a.filter(r=>l(r.m)<=10&&r.st.kind==="open"&&typeof r.st.wait=="number").sort((r,w)=>r.st.wait-w.st.wait||r.m-w.m):a=a.sort((r,w)=>r.m-w.m),a=a.slice(0,8);const n=r=>r.kind==="open"?typeof r.wait=="number"?`${r.wait} min`:"Ouverte":{closed:"Fermée",refurb:"Rénovation",down:"Interrompue"}[r.kind]||"—",c=r=>r.kind==="open"?typeof r.wait=="number"&&r.wait<=15?" autour__attente--court":"":" autour__attente--ferme",p=a.map(({a:r,m:w,st:m})=>`<button type="button" class="autour__ligne" data-open="${H(r.id)}">
      <span><strong>${H(r.name)}</strong><small>${H(r.land)} · ${H(o.describe(w))}</small></span>
      <b class="autour__attente${c(m)}">${H(n(m))}</b></button>`).join("");return`<div class="autour__tete">
      <div><span class="autour__kicker">Autour de toi</span>
      <h2 class="autour__titre">${e==="attente"?"Le moins d’attente à 10 min de marche":"Les attractions les plus proches"}</h2></div>
      <div class="seg" role="group" aria-label="Trier">
        <button type="button" class="seg__btn" data-autour-tri="distance" aria-pressed="${e!=="attente"}">Plus proches</button>
        <button type="button" class="seg__btn" data-autour-tri="attente" aria-pressed="${e==="attente"}">Moins d’attente</button>
      </div></div>
    ${o.far?'<p class="autour__info autour__info--alerte">Tu sembles loin des Parcs : distances depuis ta position actuelle.</p>':""}
    <div class="autour__liste">${p||'<p class="autour__info">Aucune attraction ouverte à moins de 10 min de marche pour le moment.</p>'}</div>
    <p class="autour__info">Temps de marche estimés · ta position reste sur ton téléphone.</p>`}function v(i){const t=i.length;if(t<3)return i.map((n,c)=>`${c?"L":"M"}${n[0].toFixed(1)},${n[1].toFixed(1)}`).join("");const e=[],o=[],l=[];for(let n=0;n<t-1;n++)e[n]=i[n+1][0]-i[n][0],o[n]=(i[n+1][1]-i[n][1])/(e[n]||1);l[0]=o[0],l[t-1]=o[t-2];for(let n=1;n<t-1;n++)l[n]=o[n-1]*o[n]<=0?0:(o[n-1]+o[n])/2;for(let n=0;n<t-1;n++){if(o[n]===0){l[n]=l[n+1]=0;continue}const c=l[n]/o[n],p=l[n+1]/o[n],r=c*c+p*p;if(r>9){const w=3/Math.sqrt(r);l[n]=w*c*o[n],l[n+1]=w*p*o[n]}}let a=`M${i[0][0].toFixed(1)},${i[0][1].toFixed(1)}`;for(let n=0;n<t-1;n++){const[c,p]=i[n],[r,w]=i[n+1],m=e[n]/3;a+=`C${(c+m).toFixed(1)},${(p+l[n]*m).toFixed(1)} ${(r-m).toFixed(1)},${(w-l[n+1]*m).toFixed(1)} ${r.toFixed(1)},${w.toFixed(1)}`}return a}const ct=i=>`${String(Math.floor(i/60)).padStart(2,"0")}h${String(Math.round(i%60)).padStart(2,"0")}`;function St(i){const t=window.waitHistory;if(!i.disney||!t)return"";if(!t.ready)return'<p class="habitude__vide">Chargement de l’historique…</p>';const e=new Date,o=e.getHours()*60+e.getMinutes(),l=[0,6].includes(e.getDay())?"w":"j",a=t.curve(i.disney,l),n=t.today(i.disney),c=t.today(i.disney+":SR"),p=t.curve(i.disney+":SR",l),r=t.typical(i.disney+":SR"),w=c.length>0||p.length>1,m=e.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}),b=t.typical(i.disney);if(!a.length&&!n.length)return`<p class="habitude__date">${ht(m)}</p><p class="habitude__vide">Pas encore de relevé pour cette attraction aujourd’hui. Le Carnet note les attentes toutes les 5 minutes pendant l’ouverture : la courbe se dessine au fil de la journée.</p>`;const k=a.length?Math.min(a[0].slot*30,n[0]?.[0]??1440):Math.max(480,Math.floor(((n[0]?.[0]??540)-30)/30)*30),x=1063,j=Math.max(Math.min(1080,Math.max(n.length?n[n.length-1][0]+15:0,a.length?a[a.length-1].slot*30+30:0)),k+120),L=360,S=190,O=24,ot=6,u=10,F=20,R=Math.ceil(Math.max(30,...a.map(d=>d.wait),...n.map(d=>d[1]),...c.map(d=>d[1]))/20)*20,M=d=>O+(d-k)/(j-k)*(L-O-ot),_=d=>u+(S-u-F)*(1-d/R),yt=[];for(let d=0;d<=R;d+=20)yt.push(`<line x1="${O}" x2="${L-ot}" y1="${_(d)}" y2="${_(d)}" class="hb-g"/><text x="${O-5}" y="${_(d)+3}" class="hb-gl">${d}</text>`);const mt=j-k>420?120:60;for(let d=Math.ceil(k/mt)*mt;d<=j;d+=mt)yt.push(`<text x="${M(d)}" y="${S-6}" class="hb-h">${String(d/60).padStart(2,"0")}h</text>`);const xt=d=>{const y=[];if(d.length<=2)return y;const C=d[0][0],D=d[d.length-1][0];for(let P=C;P<=D+.1;P+=3){const ge=Math.min(10,1.5+Math.min(P-C,D-P)*.8),ci=2*ge*ge;let fe=0,ue=0;for(const[hi,$i]of d){const ke=Math.exp(-((hi-P)**2)/ci);fe+=ke,ue+=ke*$i}y.push([P,ue/fe])}return y},le=xt(n),A=(le.length?le:n).map(([d,y])=>[M(d),_(y)]),ne=v(A),oi=A.length>1?`<path class="hb-aire" mask="url(#hb-fondu)" d="${ne}L${A[A.length-1][0].toFixed(1)},${_(0)}L${A[0][0].toFixed(1)},${_(0)}Z"/>`:"",ae=A[0]?.[0]??0,re=A[A.length-1]?.[0]??L,li=`<linearGradient id="hb-fondu-g" gradientUnits="userSpaceOnUse" x1="${ae.toFixed(1)}" x2="${re.toFixed(1)}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${Math.min(.5,24/Math.max(1,re-ae)).toFixed(3)}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="hb-fondu"><rect x="0" y="0" width="${L}" height="${S}" fill="url(#hb-fondu-g)"/></mask>`,se=(xt(c).length?xt(c):c).map(([d,y])=>[M(d),_(y)]),ni=se.length>1?`<path class="hb-sr" d="${v(se)}"/>`:p.length>1?`<path class="hb-sr hb-sr--habit" d="${v(p.map(d=>[M(d.slot*30+15),_(d.wait)]))}"/>`:"",ai=a.length>1?`<path class="hb-habit" d="${v(a.map(d=>[M(d.slot*30+15),_(d.wait)]))}"/>`:"",ri=o>=k&&o<=j?`<line class="hb-now" x1="${M(o)}" x2="${M(o)}" y1="${u}" y2="${_(0)}"/>`:"",de=[];for(let d=Math.ceil(k/15)*15;d<=j;d+=15){const y=n.reduce((D,P)=>Math.abs(P[0]-d)<=8&&(!D||Math.abs(P[0]-d)<Math.abs(D[0]-d))?P:D,null),C=a.find(D=>D.slot===Math.floor(d/30));(y||C)&&de.push([d,y?y[1]:null,C?C.wait:null])}const ce=a.filter(d=>d.slot*30+30<=x+15),he=d=>d.length?d.reduce((y,C)=>C.wait<y.wait?C:y):null,Q=he(ce),V=he(ce.filter(d=>d.slot*30+30>o)),si=Q?`<circle class="hb-best" cx="${M(Q.slot*30+15).toFixed(1)}" cy="${_(Q.wait).toFixed(1)}" r="8"/><text class="hb-bestl" x="${M(Q.slot*30+15).toFixed(1)}" y="${(_(Q.wait)-12).toFixed(1)}">le + calme</text>`:"",di=x>k&&x<j?`<line class="hb-dep" x1="${M(x)}" x2="${M(x)}" y1="${u}" y2="${_(0)}"/><text class="hb-depl" x="${M(x)-3}" y="${u+9}">🚄</text>`:"",lt=[];n.length&&lt.push(`Maintenant : <b>${n[n.length-1][1]} min</b> (relevé de ${ct(n[n.length-1][0])}).`),b&&lt.push(`D’habitude à cette heure : ~${b.wait} min.`);const K=p.map(d=>[d,a.find(y=>y.slot===d.slot)]).filter(([d,y])=>y&&d.slot*30<1080),nt=K.length>=3?Math.round(K.reduce((d,[y,C])=>d+(C.wait-y.wait),0)/K.length):null,J=K.length>=3?K.reduce((d,y)=>y[1].wait-y[0].wait>d[1].wait-d[0].wait?y:d):null,$e=nt!=null?nt>=5?`En moyenne, le Single Rider te fait gagner <b>~${nt} min</b>${J&&J[1].wait-J[0].wait>nt+5?`, jusqu’à ~${J[1].wait-J[0].wait} min vers ${t.slotLabel(J[0].slot)}`:""}.`:"Ici, le Single Rider ne fait presque rien gagner en moyenne : prends la file classique.":"",pe=w?`👤 Single Rider : ${c.length?`<b>${c[c.length-1][1]} min</b> maintenant`:"pas encore de relevé aujourd’hui"}${r?`, ~${r.wait} min d’habitude à cette heure`:""}.`:"",W=n.length?n[n.length-1][1]:b?.wait;let at="";return V?at=V.slot===Math.floor(o/30)||typeof W=="number"&&W<=V.wait+3?`🎯 <b>C’est le bon moment</b> : ${typeof W=="number"?`~${W} min`:`~${V.wait} min`}, le plus calme d’ici ton départ (17h43).`:`🎯 Vise <b>${t.slotLabel(V.slot)}</b> : ~${V.wait} min d’habitude${typeof W=="number"?`, contre ${W} min maintenant`:""}.`:Q&&(at=`🎯 En général, le plus calme : <b>${t.slotLabel(Q.slot)}</b> (~${Q.wait} min).`),`<p class="habitude__date">${ht(m)}</p>
    ${at?`<p class="habitude__conseil">${at}</p>`:""}
    <p class="habitude__bulle" aria-live="polite">${n.length?`<b>${ct(n[n.length-1][0])}</b><span><i class="hb-k hb-k--auj"></i>Relevé : <strong>${n[n.length-1][1]} min</strong></span>${b?`<span><i class="hb-k hb-k--habit"></i>D’habitude : ${b.wait} min</span>`:""}${c.length?`<span><i class="hb-k hb-k--sr"></i>Single Rider : ${c[c.length-1][1]} min</span>`:""}`:"<span>Touche la courbe pour le détail</span>"}</p>
    <div class="habitude__cadre">
      <svg class="habitude__graph" viewBox="0 0 ${L} ${S}" role="img" aria-label="Attente relevée aujourd’hui, heure par heure" data-det="${ht(JSON.stringify(de))}" data-geo="${[k,j,L,O,ot].join(",")}">
        <defs><linearGradient id="hb-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--laiton)" stop-opacity=".38"/><stop offset=".7" stop-color="var(--laiton)" stop-opacity=".08"/><stop offset="1" stop-color="var(--laiton)" stop-opacity="0"/></linearGradient>${li}</defs>
        ${yt.join("")}${di}${ri}${oi}${ai}${ni}${si}${A.length?`<path class="hb-ligne" d="${ne}"/><circle class="hb-dernier" cx="${A[A.length-1][0].toFixed(1)}" cy="${A[A.length-1][1].toFixed(1)}" r="3.6"/>`:""}
        <line class="hb-curseur" x1="0" x2="0" y1="${u}" y2="${_(0)}" visibility="hidden"/>
      </svg>
    </div>
    <p class="habitude__legende"><span class="hb-k hb-k--auj"></span> aujourd’hui${a.length?` <span class="hb-k hb-k--habit"></span> d’habitude ${l==="w"?"le week-end":"en semaine"}`:""}${w?' <span style="white-space:nowrap"><span class="hb-k hb-k--sr"></span> Single Rider</span>':""}</p>
    ${lt.length?`<p class="habitude__texte">${lt.join(" ")}</p>`:""}
    ${pe?`<p class="habitude__texte">${pe}${$e?" "+$e:""}</p>`:""}
    <p class="plan-note">Relevés du Carnet toutes les 5 min (source ThemeParks.wiki)${t.days?` · ${t.days} jour${t.days>1?"s":""} d’historique`:""} · survole ou touche la courbe pour le détail.</p>`}const ht=H;let qt=!1;function Ce(){if(qt)return;qt=!0;const i=t=>{const e=t.target.closest?.(".habitude__graph");if(!e)return;const o=JSON.parse(e.dataset.det||"[]");if(!o.length)return;const[l,a,n,c,p]=e.dataset.geo.split(",").map(Number),r=e.getBoundingClientRect(),w=(t.clientX-r.left)/r.width*n,m=l+(w-c)/(n-c-p)*(a-l),b=o.reduce((L,S)=>Math.abs(S[0]-m)<Math.abs(L[0]-m)?S:L),k=c+(b[0]-l)/(a-l)*(n-c-p),x=e.querySelector(".hb-curseur");x.setAttribute("x1",k),x.setAttribute("x2",k),x.setAttribute("visibility","visible");const j=e.closest("#fiche-habitude")?.querySelector(".habitude__bulle");j&&(j.innerHTML=`<b>${ct(b[0])}</b>${b[1]!=null?`<span><i class="hb-k hb-k--auj"></i>Relevé : <strong>${b[1]} min</strong></span>`:""}${b[2]!=null?`<span><i class="hb-k hb-k--habit"></i>D’habitude : ${b[2]} min</span>`:""}`)};document.addEventListener("pointermove",i),document.addEventListener("pointerdown",i),document.addEventListener("pointerout",t=>{const e=t.target.closest?.(".habitude__graph");!e||e.contains(t.relatedTarget)||t.pointerType==="mouse"&&e.querySelector(".hb-curseur")?.setAttribute("visibility","hidden")})}function Pe(i){return i.disney?`<section class="section" aria-labelledby="h-habitude">
      <h3 class="section__title rule" id="h-habitude"><span>Historique du temps d’attente</span></h3>
      <div id="fiche-habitude">${St(i)}</div>
    </section>`:""}const f=(i,t=document)=>t.querySelector(i),$=i=>String(i??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),s={parks:[],attractions:[],art:{},live:new Map,mode:"loading",via:"",updatedAt:null,failures:[],age:null,filters:{park:"all",land:"all",state:"all",parcours:"all",sort:"land",envie:"all",q:""},openId:null},Ze=[{id:"all",label:"Toutes"},{id:"open",label:"Ouvertes"},{id:"closed",label:"Fermées / En rénovation"}];try{new URLSearchParams(location.search).get("tri")==="attente"&&(s.filters.sort="wait")}catch{}const Se=[{id:"land",label:"Par land"},{id:"wait",label:"⏱ Attente la plus courte"},{id:"sr",label:"SR · Single Rider"}],qe=[{id:"all",label:"Toutes"},{id:"abri",label:"☂️ À l’abri"},{id:"sensations",label:"🎢 Sensations"},{id:"scenique",label:"🎭 Attractions scéniques"},{id:"attente",label:"⚡ Peu d’attente"},{id:"sr",label:"👤 Single Rider"}],Te=new Set(["P1RA03","P1DA08","P2ZA02","P2XA09","P2EA00","P1NA07","P1G103","P1M115","P1NA12","P1AA04","P1DA09","P1DA04","P2AC01","P2AC02","P2XA03","P1NA10","P1NA13","P1NA01","P1NA08","P1M116","P1DA06","P1M117","P2YS03","P2MG32","P2GS54","P1AA03"]),Ie=i=>{const t=i.fiche?.type||"";return/dark ride|parcours scénique/i.test(t)&&!/à pied|chute/i.test(t)},Re=i=>{const t=i.fiche?.minHeight?.cm||0;return t>=102||t>0&&/montagnes russes|chute/i.test(i.fiche?.type||"")},Qe=[{id:"all",label:"Toutes"},{id:"epingles",label:"Mon parcours"},{id:"reste",label:"Reste à faire"}],tt=i=>(i||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),Tt=i=>s.parks.find(t=>t.id===i)?.name||i,De=i=>new Date(i+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});function E(i){const t=i.localStatus||{},e=s.live.get(i.id);if(t.status==="refurb")return{kind:"refurb",label:t.until?`En rénovation jusqu'au ${De(t.until)}`:"En rénovation",wait:null};if(t.status==="closed")return{kind:"closed",label:"Fermée",wait:null};if(!e)return{kind:"unknown",label:s.mode==="loading"?"Relevé en cours…":"Statut indisponible",wait:null};const o={open:"Ouverte",closed:"Fermée",refurb:"En rénovation",down:"Interrompue",unknown:"Statut indisponible"};return{kind:e.kind,label:o[e.kind]||o.unknown,wait:e.kind==="open"?e.wait:null,singleRider:e.singleRider,premier:e.premier}}function Be(i){const t=s.filters;if(t.park!=="all"&&i.park!==t.park||t.land!=="all"&&i.land!==t.land)return!1;const e=E(i).kind;if(t.state==="open"&&e!=="open"||t.state==="closed"&&e!=="closed"&&e!=="refurb"||t.envie==="abri"&&!Te.has(i.disney)||t.envie==="sensations"&&!Re(i)||t.envie==="scenique"&&!Ie(i))return!1;if(t.envie==="attente"){const o=E(i);if(o.kind!=="open"||o.wait==null||o.wait>10)return!1}return!(t.envie==="sr"&&i.fiche?.services?.singleRider!==!0||t.parcours==="epingles"&&!X(i.id)||t.parcours==="reste"&&(!X(i.id)||Y(i.id))||t.q&&!tt(i.name).includes(tt(t.q))&&!tt(i.tagline).includes(tt(t.q)))}const He=new Set(["adventure-isle","alices-curious-labyrinth","art-of-disney-animation","autopia","avengers-flight-force","big-thunder-mountain","blanche-neige","buzz-lightyear-laser-blast","cabane-des-robinson","carrousel-de-lancelot","cars-quatre-roues-rallye","cars-road-trip","casey-jr-circus-train","crushs-coaster","disneyland-railroad","dumbo","frontierland-playground","frozen-ever-after","galion-des-pirates","indiana-jones-temple-du-peril","its-a-small-world","la-taniere-du-dragon","mad-hatters-tea-cups","main-street-vehicles","meet-mickey-mouse","meet-spider-man","mickeys-philharmagic","mysteres-du-nautilus","orbitron","passage-aladdin","pays-des-contes-de-fees","peter-pans-flight","phantom-manor","pirates-beach","pirates-of-the-caribbean","princess-pavilion","raiponce-tangled-spin","ratatouille","rc-racer","river-rogue-keelboats","slinky-dog","spider-man-web-adventure","star-tours","star-wars-hyperspace-mountain","starport","stitch-live","tapis-volants","thunder-mesa-riverboat","tower-of-terror","toy-soldiers-parachute-drop","voyages-de-pinocchio"]);function It(i,t=!1){if(He.has(i.id)){const o=`app/attractions/${i.id}`;if(t)return`<div class="illu illu--photo"><img src="${o}.webp" alt="" loading="lazy" decoding="async"></div>`;const l=document.documentElement.classList.contains("eco");return`<div class="illu illu--photo"><img src="${o}-${l?400:800}.webp"${l?"":` srcset="${o}-400.webp 480w, ${o}-800.webp 800w" sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 400px"`} alt="" loading="lazy" decoding="async"></div>`}const e=s.art&&s.art[i.id];return e?`<div class="illu">${e}</div>`:`<div class="illu illu--planche">${Et(i.motif,"poster",{label:i.land,lines:i.posterLines,tag:i.tagline,paysage:!0,alt:`Planche gravée de ${i.name}`})}</div>`}const Rt=(i,t="poster",e=!1)=>Et(i.motif,t,{label:i.land,lines:i.posterLines,tag:i.tagline,fade:e,alt:`Planche gravée de ${i.name}`});function Oe(){return(s.filters.park==="all"?s.parks:s.parks.filter(t=>t.id===s.filters.park)).flatMap(t=>t.lands)}function T(i,t,e,o,l="chip"){return`<button type="button" class="${l}" data-group="${i}" data-id="${$(t)}" aria-pressed="${o}">${$(e)}</button>`}function U(){const i=s.filters;f("#filter-park").innerHTML=T("park","all","Tous",i.park==="all","seg__btn")+s.parks.map(o=>T("park",o.id,o.name,i.park===o.id,"seg__btn")).join("");const t=Oe();i.land!=="all"&&!t.includes(i.land)&&(i.land="all"),f("#filter-land").innerHTML=T("land","all","Tous",i.land==="all")+t.map(o=>T("land",o,o,i.land===o)).join(""),f("#filter-state").innerHTML=Ze.map(o=>T("state",o.id,o.label,i.state===o.id,"seg__btn")).join(""),f("#filter-sort").innerHTML=Se.map(o=>T("sort",o.id,o.label,i.sort===o.id,"seg__btn")).join(""),f("#filter-envie").innerHTML=qe.map(o=>T("envie",o.id,o.label,i.envie===o.id,"seg__btn")).join("");const e=f("#note-envie");e&&(e.hidden=i.envie!=="attente",e.textContent="Attente en direct de 10 min ou moins."),f("#filter-parcours").innerHTML=Qe.map(o=>T("parcours",o.id,o.label,i.parcours===o.id,"seg__btn")).join(""),Ne()}function Ne(){const i=f("#parcours-bilan");if(!i)return;const t=_e();if(i.hidden=t.epingles===0,t.epingles===0)return;const e=(o,l,a)=>`<b>${o}</b> ${o>1?a:l}`;i.innerHTML=`<span class="bilan__texte">${e(t.epingles,"attraction épinglée","attractions épinglées")} · ${e(t.faits,"faite","faites")}</span>
    <button type="button" class="bilan__vider" data-vider-parcours>Vider le carnet</button>`}function Qt(i,t){return`<button type="button" class="epingle${t?" epingle--on":""}" data-epingler="${$(i.id)}"
    aria-pressed="${t}" title="${t?"Retirer de mon parcours":"Ajouter à mon parcours"}">
    <span class="sr-only">${t?"Retirer":"Ajouter"} ${$(i.name)} ${t?"de":"à"} mon parcours</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>
  </button>`}function ze(i){const t=Y(i.id);return`<button type="button" class="btn-carnet${t?" btn-carnet--on":""}" data-fait="${$(i.id)}" aria-pressed="${t}">
    ${t?"✓ Déjà faite":"Marquer comme faite"}</button>`}function Ge(i){const t=[];return typeof i.singleRider=="number"&&t.push(`<span class="file file--sr">SR<b>${i.singleRider}<small>min</small></b></span>`),i.premier?.prix&&t.push(`<span class="file file--pa">PA<b>${$(i.premier.prix)}</b></span>`),`<div class="ribbon ribbon--${i.kind}">
    <div class="ribbon__etat"><span class="ribbon__libelle"><i class="lampe" aria-hidden="true"></i>${$(i.label)}</span>${t.length?`<div class="ribbon__files">${t.join("")}</div>`:""}</div>
    ${Ht(i,!1)}
  </div>`}let $t=new Map;function Dt(i){const t=E(i);return t.kind==="open"&&typeof t.wait=="number"?t.wait:t.kind==="open"?1e3:t.kind==="down"?2e3:t.kind==="unknown"?2500:3e3}const Ue=i=>i.fiche?.services?.singleRider===!0||typeof E(i).singleRider=="number";function Ve(i){const t=E(i);return t.kind==="open"&&typeof t.singleRider=="number"?t.singleRider:t.kind==="open"?1e3:2e3+Dt(i)}function I(){let i=s.attractions.filter(Be);s.filters.sort==="wait"&&(i=i.map((e,o)=>({a:e,i:o,r:Dt(e)})).sort((e,o)=>e.r-o.r||e.i-o.i).map(e=>e.a)),s.filters.sort==="sr"&&(i=i.filter(Ue).map((e,o)=>({a:e,i:o,r:Ve(e)})).sort((e,o)=>e.r-o.r||e.i-o.i).map(e=>e.a)),f("#count").textContent=`${i.length} attraction${i.length>1?"s":""} affichée${i.length>1?"s":""} sur ${s.attractions.length}`;const t=$t;$t=new Map(i.map(e=>[e.id,E(e).wait])),f("#grid").innerHTML=i.length?i.map((e,o)=>{const l=E(e),a=X(e.id),n=Y(e.id);return`<article class="card${n?" card--fait":""}" style="--i:${o}" data-etat="${l.kind}">
          <div class="card__art${l.kind==="closed"||l.kind==="refurb"?" card__art--fanee":""}" aria-hidden="true">${It(e)}</div>
          ${Qt(e,a)}
          ${n?'<span class="card__fait" aria-hidden="true">Fait</span>':""}
          <div class="card__body">
            <h2 class="card__title"><button type="button" class="card__btn" data-open="${$(e.id)}">${$(e.name)}</button></h2>
            <p class="card__park">${$(Tt(e.park))}</p>
            ${e.stub?'<span class="card__encours">Fiche en cours</span>':""}
          </div>
          ${Ge(l)}
        </article>`}).join(""):'<p class="empty">Aucune attraction ne correspond à ces critères. Modifie les filtres ou la recherche.</p>',Je(t)}function Je(i){i.size&&document.querySelectorAll(".card").forEach(t=>{const e=t.querySelector("[data-open]")?.dataset.open,o=t.querySelector(".ribbon__wait");!o||!e||!i.has(e)||i.get(e)!==$t.get(e)&&(o.classList.add("vient-de-changer"),o.addEventListener("animationend",()=>o.classList.remove("vient-de-changer"),{once:!0}))})}function Bt(){const i=f("#livebar"),t=s.age&&Date.now()-new Date(s.age).getTime()>12*6e4;i.dataset.mode=t&&s.mode!=="unavailable"?"stale":s.mode;const e=s.updatedAt?s.updatedAt.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"",o=(s.failures||[]).length?` Routes essayées — ${s.failures.join(" | ")}`:"",l=s.age?`relevé ${pt(s.age)}`:"à l'instant",a={loading:"Chargement des temps d'attente…",stale:`⚠️ Attentes ${s.age?pt(s.age):""} · réseau faible, nouvel essai automatique`,live:`Attentes en direct · mises à jour ${l}, toutes les 5 min`,partial:`Temps d'attente pour une partie des attractions seulement · ${l}`,unavailable:"Temps d'attente indisponibles pour le moment, nouvel essai automatique dans 5 min."}[i.dataset.mode];i.innerHTML=`<span>${$(a)}</span><button type="button" id="refresh" aria-label="Actualiser les temps d'attente">↻</button>`}function Ht(i,t){const e=i.kind==="open"&&typeof i.wait=="number"?i.wait:null,o=e===null?null:Math.min(e,120)/120*100;let l="";for(let c=15;c<120;c+=15){const p=c/120*100,r=c%30===0;l+=`<line x1="${p}" y1="${r?1:2.5}" x2="${p}" y2="6" stroke="var(--laiton)" stroke-width=".8" opacity="${r?.8:.4}"/>`}const a=o===null?"":`<svg class="attente__regle" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" y1="6" x2="100" y2="6" stroke="var(--cuivre)" stroke-width="1.4"/>
    <line x1="0" y1="6" x2="${o.toFixed(1)}" y2="6" stroke="currentColor" stroke-width="2.6"/>
    ${l}
    <polygon class="curseur" points="-4,0 4,0 0,6" transform="translate(${o.toFixed(1)} 0)" fill="currentColor"/>
  </svg>`,n=e!==null?`<span class="attente__val">${e}<small>min</small></span>`:'<span class="attente__val attente__val--nul">—</span>';return`<div class="attente${t?" attente--grand":""} ribbon--${i.kind}">
    ${n}${a}
    ${!t&&e!==null?`<span class="attente__legende">d'attente</span>`:""}
  </div>`}function pt(i){const t=Math.max(0,Math.round((Date.now()-new Date(i).getTime())/6e4));if(t<1)return"à l'instant";if(t===1)return"il y a 1 minute";if(t<60)return`il y a ${t} minutes`;const e=Math.round(t/60);return e===1?"il y a 1 heure":`il y a ${e} heures`}async function gt(){const i=f("#refresh");i&&(i.disabled=!0,i.textContent="Actualisation…");const t=await Me(s.parks,s.attractions).catch(e=>({entries:new Map,mode:"unavailable",via:"",age:null,failures:[e.message]}));s.live=t.entries,s.mode=t.mode,s.via=t.via,s.failures=t.failures||[],s.age=t.age||null,s.updatedAt=new Date,Bt(),I(),ft(),s.openId&&ut()}let Ot="distance";function ft(){const i=f("#autour"),t=f("#btn-pres");if(t&&t.setAttribute("aria-pressed",String(dt.actif)),!i)return;const e=Fe(s.attractions,E,Ot);i.hidden=!e,i.innerHTML=e}document.addEventListener("click",i=>{if(i.target.closest("#btn-pres")){dt.basculer();return}const t=i.target.closest("[data-autour-tri]");t&&(Ot=t.dataset.autourTri,ft())}),dt.surChangement(ft);const We={premierAccess:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',singleRider:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-5 4-8 8-8s8 3 8 8"/></svg>',photoPass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/></svg>',pmr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="4" r="2"/><path d="M10 7v7h6l3 6M10 11h6M7 14a5 5 0 1 0 7 6"/></svg>'};function et(i,t,e){let o="svc svc--unknown",l=`${t} : à confirmer`;return e===!0?(o="svc",l=t):e===!1?(o="svc svc--no",l=t):e==="transfer"&&(o="svc svc--partial",l="Accessible PMR avec transfert"),`<span class="${o}">${We[i]}${$(l)}</span>`}function Nt(i){const t=E(i),e=l=>new Date(l).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),o=[];return typeof t.singleRider=="number"?o.push(`<div class="file2"><span class="file2__nom">Single Rider</span><span class="file2__val">${t.singleRider}<small> min</small></span>
      <span class="file2__note">File isolée, un siège à la fois</span></div>`):t.kind==="open"&&o.push(`<div class="file2 file2--vide"><span class="file2__nom">Single Rider</span><span class="file2__val">—</span>
      <span class="file2__note">Non relevée en ce moment</span></div>`),t.premier?.prix?o.push(`<div class="file2"><span class="file2__nom">Premier Access</span><span class="file2__val">${$(t.premier.prix)}</span>
      <span class="file2__note">${t.premier.debut?`Retour entre ${e(t.premier.debut)} et ${e(t.premier.fin)}`:"Créneau de retour non communiqué"}</span></div>`):t.kind==="open"&&o.push(`<div class="file2 file2--vide"><span class="file2__nom">Premier Access</span><span class="file2__val">—</span>
      <span class="file2__note">Épuisé ou non proposé aujourd'hui</span></div>`),`<div class="live">
    <div class="live__principal">${Ht(t,!0)}<div class="live__status ribbon--${t.kind}"><span class="ribbon__libelle"><i class="lampe" aria-hidden="true"></i>${$(t.label)}</span></div></div>
    ${o.length?`<div class="live__files">${o.join("")}</div>`:""}
  </div>`}function ut(){const i=s.attractions.find(l=>l.id===s.openId),t=f("#fiche-live");i&&t&&(t.innerHTML=Nt(i));const e=f("#fiche-habitude");i&&e&&(e.innerHTML=St(i));const o=f("#fiche-meta");o&&(o.textContent=s.mode==="unavailable"?"Temps d'attente non disponibles.":s.mode==="loading"?"":`ThemeParks.wiki · ${s.age?`relevé ${pt(s.age)}`:"en direct"}`)}function Ke(i){const t=i.visitors,e=t?`
    <div class="chronicle">
      <h3>Ce qu'en disent les visiteurs</h3>
      <p>${$(t.summary)}</p>
      <div class="pros-cons">
        <div class="pros"><h4>Ce qui revient en bien</h4><ul>${t.praise.map(l=>`<li>${$(l)}</li>`).join("")}</ul></div>
        <div class="cons"><h4>Ce qui revient en mal</h4><ul>${t.gripes.map(l=>`<li>${$(l)}</li>`).join("")}</ul></div>
      </div>
      ${t.tip?`<p class="tip"><strong>À retenir</strong> ${$(t.tip)}</p>`:""}
      <p class="note">Synthèse des avis publics en ligne, rédigée pour ce site. Aucun avis n'est reproduit.</p>
    </div>`:"",o=i.review?`
    <div class="chronicle">
      <h3>L'avis du chroniqueur</h3>
      <p>${$(i.review.text)}</p>
      <div class="pros-cons">
        <div class="pros"><h4>Points forts</h4><ul>${i.review.pros.map(l=>`<li>${$(l)}</li>`).join("")}</ul></div>
        <div class="cons"><h4>Points faibles</h4><ul>${i.review.cons.map(l=>`<li>${$(l)}</li>`).join("")}</ul></div>
      </div>
    </div>`:"";return`
    ${e}
    ${o}
`}const zt=location.hostname.endsWith("github.io")?"https://carnet-parc-alexandre.alexandre-207cc.workers.dev":"";let Xe=null;function Gt(){const i=t=>new Promise(e=>{const o=document.createElement("script"),l=(window.carnetV||{})[t];o.src=zt+t+(l?"?v="+l:""),o.onload=o.onerror=e,document.head.append(o)});return Xe??=Promise.all([i("/mes-cliches.js"),i("/mes-photos.js"),i("/mes-galeries.js")])}function Ye(i){return(window.mesGaleries?.pour(i.name)||[]).map(t=>({type:"moi",src:zt+t.src,caption:"Ma photo"+(t.date?" · "+window.mesGaleries.date(t.date):""),credit:"A. Lalevee"}))}function kt(i){const t=Ye(i),e=(i.images||[]).map(a=>({type:"img",src:a.src,caption:a.caption||i.name,credit:a.credit})),o=(i.gallery||[]).map(a=>({type:"poster",variant:a.variant,caption:a.caption})),l=s.art&&s.art[i.id]?[{type:"illu",caption:"Illustration"}]:[];return[...t,...l,...e,...o]}function Ut(i,t,e){return t.type==="moi"?e?`<img src="${$(t.src)}-1600.webp" alt="${$(t.caption)}">`:`<img src="${$(t.src)}-400.webp" srcset="${$(t.src)}-400.webp 400w, ${$(t.src)}-800.webp 800w" sizes="(max-width: 620px) 45vw, 220px" alt="${$(t.caption)}" loading="lazy">`:t.type==="img"?`<img src="${$(t.src)}" alt="${$(t.caption)}" data-fallback="1">`:t.type==="illu"?`<div class="illu">${s.art[i.id]}</div>`:Rt(i,t.variant)}let ve=null;function ti(){return ve??=fetch("illustrations/index.json").then(i=>i.ok?i.json():{}).then(i=>{s.art=i||{}}).catch(()=>{})}function Vt(i,t){return t.map((e,o)=>`<button type="button" class="thumb" data-lightbox="${o}"><div class="thumb__art">${Ut(i,e)}</div><span class="cap">${$(e.caption)}</span></button>`).join("")}function Jt(i){ti(),Gt().then(()=>{const a=s.attractions.find(p=>p.id===i),n=f("#fiche .gallery");if(s.openId!==i||!a||!n)return;const c=kt(a);n.children.length!==c.length&&(n.innerHTML=Vt(a,c))});const t=s.attractions.find(a=>a.id===i);if(!t)return;s.openId=i;const e=t.fiche,o=f("#fiche"),l=kt(t);o.innerHTML=`
    <div class="fiche__bar">
      <button type="button" class="fiche__back" data-close>
        <span aria-hidden="true">←</span> Toutes les attractions
      </button>
      <span class="fiche__bar-nom">${$(t.name)}</span>
    </div>
    <div class="fiche__head">
      <div class="fiche__art${["closed","refurb"].includes(E(t).kind)?" card__art--fanee":""}" role="img" aria-label="Illustration de ${$(t.name)}">${It(t,!0)}</div>
      <div>
        <p class="fiche__kicker"><span class="tag tag--land">${$(t.land)}</span><span class="tag tag--park">${$(Tt(t.park))}</span></p>
        <h2 class="fiche__title" id="fiche-title">${$(t.name)}</h2>
        <p class="fiche__tagline">${$(t.tagline)}</p>
        <div id="fiche-live">${Nt(t)}</div>
        <div class="carnet">${ie(t)}</div>
        <p class="live__meta" id="fiche-meta"></p>
      </div>
    </div>

    <section class="section" aria-labelledby="h-tech">
      <h3 class="section__title rule" id="h-tech"><span>Fiche technique</span></h3>
      <div class="ticket">
       <div class="ticket__main">
        <div class="ticket__head"><span>Programme de l'attraction</span><b>E-Ticket</b></div>
        <dl class="ticket__rows">
          <div class="ticket__row"><dt>Date d'ouverture</dt><dd>${$(e.opening.label)}</dd></div>
          <div class="ticket__row"><dt>Constructeur</dt><dd>${$(e.builder)}</dd></div>
          <div class="ticket__row"><dt>Type d'attraction</dt><dd>${$(e.type)}</dd></div>
          <div class="ticket__row"><dt>Système de transport</dt><dd>${$(e.transport)}</dd></div>
          <div class="ticket__row"><dt>Durée du tour</dt><dd>${$(e.duration)}</dd></div>
          <div class="ticket__row"><dt>Taille minimale</dt><dd>${$(e.minHeight.label)}</dd></div>
          <div class="ticket__row ticket__row--wide"><dt>Capacité</dt><dd>${$(e.capacity)}</dd></div>
          ${Object.entries(e.extra||{}).map(([a,n])=>`<div class="ticket__row"><dt>${$(a)}</dt><dd>${$(n)}</dd></div>`).join("")}
          <div class="ticket__row ticket__row--wide"><dt>Services</dt><dd><div class="services">
            ${et("premierAccess","Disney Premier Access",e.services.premierAccess)}
            ${et("singleRider","Single Rider",e.services.singleRider)}
            ${et("photoPass","PhotoPass",e.services.photoPass)}
            ${et("pmr","Accessibilité PMR",e.services.pmr)}
          </div></dd></div>
        </dl>
        <p class="ticket__foot">Les mentions « à confirmer » sont à vérifier sur le site officiel avant ta visite.</p>
       </div>
       <aside class="ticket__stub" aria-hidden="true"><span class="stub__admit">Admit one</span><span class="stub__letter"><span>E</span></span><span class="stub__no">N° ${String(s.attractions.indexOf(t)+1).padStart(4,"0")}</span></aside>
      </div>
    </section>

    ${Pe(t)}

    ${Ee(t)}

    ${t.history||t.synopsis?`<section class="section" aria-labelledby="h-story">
      <h3 class="section__title rule" id="h-story"><span>L'histoire et le synopsis</span></h3>
      <div class="prose">${t.history?`<p>${$(t.history)}</p>`:""}${t.synopsis?`<p>${$(t.synopsis)}</p>`:""}</div>
    </section>`:`<section class="section"><p class="empty">Fiche en cours de rédaction : l'histoire, le synopsis et les anecdotes seront ajoutés.</p></section>`}

    ${t.secrets&&t.secrets.length?`<section class="section" aria-labelledby="h-secrets">
      <h3 class="section__title rule" id="h-secrets"><span>Les secrets des Imagineers</span></h3>
      <div class="parchment"><ol>${t.secrets.map(a=>`<li>${$(a)}</li>`).join("")}</ol></div>
    </section>`:""}

    ${l.length?`<section class="section" aria-labelledby="h-gal">
      <h3 class="section__title rule" id="h-gal"><span>Galerie</span></h3>
      <div class="gallery">
        ${Vt(t,l)}
      </div>
    </section>`:""}

    ${t.visitors||t.review?`<section class="section" aria-labelledby="h-rev">
      <h3 class="section__title rule" id="h-rev"><span>Avis</span></h3>
      <div class="reviews" id="reviews">${Ke(t)}</div>
    </section>`:""}

    ${(t.sources||[]).length?`<div class="sources"><strong>Sources</strong><ul>${(t.sources||[]).map(a=>`<li><a href="${$(a)}" target="_blank" rel="noopener">${$(a)}</a></li>`).join("")}</ul></div>`:""}`,Yt(o,t),ut(),Xt("fiche");try{location.hash!=="#"+i&&(location.hash=i)}catch{}}function Wt(i){document.documentElement.scrollTop=i,document.body.scrollTop=i}let Kt=0;function Xt(i){const t=f("#vue-liste"),e=f("#fiche");i==="fiche"&&e.hidden&&(Kt=window.scrollY);const o=i==="fiche",l=o?0:Kt,a=()=>{t.hidden=o,e.hidden=!o,document.body.classList.toggle("vue-fiche",o),Wt(l)};document.startViewTransition&&!matchMedia("(prefers-reduced-motion: reduce)").matches?document.startViewTransition(a).updateCallbackDone.then(()=>Wt(l)).catch(()=>{}):a()}function Yt(i,t){i.querySelectorAll("img[data-fallback]").forEach(e=>{e.addEventListener("error",()=>{e.replaceWith(Object.assign(document.createElement("div"),{innerHTML:Rt(t)}).firstElementChild)},{once:!0})})}function vt(){f("#fiche").hidden||(s.openId=null,Xt("liste"))}function te(){location.hash?history.back():vt()}let Z={id:null,i:0};function it(i,t){const e=s.attractions.find(n=>n.id===i),o=kt(e);Z={id:i,i:(t+o.length)%o.length};const l=o[Z.i],a=f("#lightbox");a.innerHTML=`
    <div class="lightbox__top"><strong>${$(e.name)} · ${Z.i+1}/${o.length}</strong><button type="button" class="fiche__close" style="float:none;position:static;margin:0" data-lb-close>Fermer ✕</button></div>
    <div class="lightbox__stage">
      <button type="button" class="lightbox__btn" data-lb="-1" aria-label="Image précédente">‹</button>
      <div class="lightbox__img">${Ut(e,l,!0)}</div>
      <button type="button" class="lightbox__btn" data-lb="1" aria-label="Image suivante">›</button>
    </div>
    <p class="lightbox__cap">${$(l.caption)}${l.credit?` · ${$(l.credit)}`:""}</p>`,Yt(a,e),a.open||a.showModal()}function ee(i){const t=E(i),e={};return i.coords&&(e.lat=i.coords[0],e.lng=i.coords[1]),t.kind==="open"&&typeof t.wait=="number"&&(e.wait=t.wait),e}function ie(i){return Qt(i,X(i.id)).replace('class="epingle','class="epingle epingle--plat')+ze(i)+(i.coords&&window.itinerary?window.itinerary.button("a",i.name):"")+(window.journal?window.journal.button("a",i.name,ee(i)):"")}function wt(){const i=s.attractions.find(e=>e.id===s.openId),t=f("#fiche .carnet");!i||!t||(t.innerHTML=ie(i))}function ei(){document.addEventListener("click",i=>{const t=i.target,e=t.closest("[data-group]");if(e){s.filters[e.dataset.group]=e.dataset.id,U(),I();return}const o=t.closest("[data-epingler]");if(o){Le(o.dataset.epingler),U(),I(),s.openId&&wt();return}const l=t.closest("[data-fait]");if(l){const p=Zt(l.dataset.fait),r=s.attractions.find(w=>w.id===l.dataset.fait);r&&window.journal&&(p?window.journal.add("a",r.name,ee(r)):window.journal.remove("a",r.name)),U(),I(),wt();return}if(t.closest("[data-vider-parcours]")){Ae(),U(),I();return}const a=t.closest("[data-open]");if(a)return Jt(a.dataset.open);if(t.closest("#refresh"))return gt();if(t.closest("[data-close]"))return te();const n=t.closest("[data-lightbox]");if(n)return it(s.openId,Number(n.dataset.lightbox));if(t.closest("[data-lb-close]"))return f("#lightbox").close();const c=t.closest("[data-lb]");if(c)return it(Z.id,Z.i+Number(c.dataset.lb));t.tagName==="DIALOG"&&t.close()}),document.addEventListener("keydown",i=>{if(f("#lightbox").open){i.key==="ArrowRight"&&it(Z.id,Z.i+1),i.key==="ArrowLeft"&&it(Z.id,Z.i-1);return}i.key==="Escape"&&!f("#fiche").hidden&&te()}),f("#search").addEventListener("input",i=>{s.filters.q=i.target.value.trim(),I()}),f("#fiche").addEventListener("close",()=>{s.openId=null;try{location.hash&&history.replaceState(null,"",location.pathname+location.search)}catch{try{location.hash=""}catch{}}}),window.addEventListener("hashchange",oe)}function oe(){const i=decodeURIComponent(location.hash.slice(1));i&&s.attractions.some(t=>t.id===i)?s.openId!==i&&Jt(i):i||vt()}async function ii(){Gt();try{const i=document.getElementById("app-data");let t;if(window.__CHRONIQUES_DATA__)t=window.__CHRONIQUES_DATA__;else if(i)t=JSON.parse(i.textContent);else{const e=await fetch(N.DATA_URL,{cache:"no-cache"});if(!e.ok)throw new Error("HTTP "+e.status);t=await e.json()}s.parks=t.parks,s.attractions=t.attractions,je(s.attractions),s.art={}}catch(i){f("#grid").innerHTML=`<p class="empty">Impossible de charger les attractions (${$(i.message)}). Sers le site via un serveur web local plutôt qu'en ouvrant le fichier directement.</p>`;return}try{history.scrollRestoration="manual"}catch{}U(),ei(),Bt(),I(),oe();try{document.documentElement.classList.toggle("eco",localStorage.getItem("carnet-eco-v1")==="1")}catch{}window.journal?.onChange(i=>{let t=!1;for(const e of i[window.journal.today()]||[]){const o=e.k==="a"&&s.attractions.find(l=>l.name===e.name);o&&!Y(o.id)&&(Zt(o.id),t=!0)}t&&(U(),I()),s.openId&&wt()}),window.waitHistory?.onChange(()=>{s.openId&&ut()}),window.waitHistory?.load(),setInterval(()=>{document.hidden||window.waitHistory?.load()},5*6e4),Ce(),gt(),setInterval(gt,N.REFRESH_MS)}ii()})();
