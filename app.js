const DAYS=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const $=id=>document.getElementById(id);
const isoToday=()=>new Date().toISOString().slice(0,10);
let db=JSON.parse(localStorage.getItem("fitoraV3"))||{profiles:{},activeProfile:null,activeDate:isoToday()};
let activeDate=db.activeDate||isoToday();

function save(){db.activeDate=activeDate;localStorage.setItem("fitoraV3",JSON.stringify(db))}
function p(){return db.profiles[db.activeProfile]||null}
function initials(n="FITORA"){return n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function uid(){return Date.now()+Math.random()}
function dayIndex(date){let d=new Date(date+"T12:00:00").getDay();return d===0?6:d-1}
function data(date=activeDate){let x=p();if(!x)return null;x.days[date]??={meals:[],water:0,sleep:0,steps:0,mood:"",note:"",completedExercises:[]};return x.days[date]}
function pct(v,g){return g?Math.min(v/g*100,100):0}
function totals(d){return d.meals.reduce((a,m)=>({calories:a.calories+m.calories,protein:a.protein+m.protein,carbs:a.carbs+m.carbs,fat:a.fat+m.fat}),{calories:0,protein:0,carbs:0,fat:0})}
function calc(v){const bmr=10*v.weight+6.25*v.height-5*v.age+(v.sex==="male"?5:-161);const maintenance=bmr*Number(v.activity);const adj=v.goal==="lose"?-350:v.goal==="gain"?250:0;const calories=Math.max(1200,Math.round(maintenance+adj));const protein=Math.round(v.weight*v.proteinFactor);const fat=Math.round(v.weight*.8);const carbs=Math.max(0,Math.round((calories-protein*4-fat*9)/4));return{bmr:Math.round(bmr),maintenance:Math.round(maintenance),calories,protein,fat,carbs}}
function newProfile(){const id=String(uid());db.profiles[id]={id,name:"Yeni Kullanıcı",age:25,sex:"female",height:168,weight:60,activity:1.55,goal:"maintain",proteinFactor:1.6,waterGoal:2.2,stepGoal:8000,sleepGoal:8,calorieGoal:1900,proteinGoal:96,carbGoal:240,fatGoal:55,workoutDays:[1,3,5],workouts:{},days:{},measurements:[]};DAYS.forEach((_,i)=>db.profiles[id].workouts[i]=[]);db.activeProfile=id;save();closeAll();showPage("settings");fillSettings();render()}
function scoreFor(date){const x=p(),d=x?.days[date];if(!x||!d)return 0;const t=totals(d),di=dayIndex(date),ex=x.workouts[di]||[],work=ex.length?ex.filter(e=>d.completedExercises.includes(e.id)).length/ex.length*100:(x.workoutDays.includes(di)?0:100);return Math.round((pct(t.calories,x.calorieGoal)+pct(t.protein,x.proteinGoal)+pct(d.water,x.waterGoal)+pct(d.sleep,x.sleepGoal)+pct(d.steps,x.stepGoal)+work)/6)}
function streak(){let count=0;let d=new Date();for(let i=0;i<365;i++){const iso=d.toISOString().slice(0,10);if(scoreFor(iso)>=60)count++;else if(i>0)break;d.setDate(d.getDate()-1)}return count}
function setMetric(pre,val,goal,unit="g"){$(pre+"Now").textContent=Math.round(val);$(pre+"Goal").textContent=Math.round(goal);$(pre+"Bar").style.width=pct(val,goal)+"%";$(pre+"Remain").textContent=val>=goal?"Hedef tamamlandı":`${Math.round(goal-val)} ${unit} kaldı`}
function render(){const x=p();$("activeDate").value=activeDate;const dt=new Date(activeDate+"T12:00:00");$("dateLabel").textContent=dt.toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();if(!x){$("hello").textContent="FITORA’ya hoş geldin.";renderProfileList();openModal("profileModal");return}$("hello").textContent=`Merhaba, ${x.name}.`;$("profileName").textContent=x.name;$("avatar").textContent=initials(x.name);const d=data(),t=totals(d);setMetric("protein",t.protein,x.proteinGoal);setMetric("carb",t.carbs,x.carbGoal);setMetric("fat",t.fat,x.fatGoal);setMetric("cal",t.calories,x.calorieGoal,"kcal");const sc=scoreFor(activeDate);$("dailyScore").textContent="%"+sc;$("scoreInside").textContent="%"+sc;$("scoreRing").style.setProperty("--score",sc*3.6+"deg");const st=streak();$("streakText").textContent=`🔥 ${st} gün`;$("sideBar").style.width=Math.min(st*10,100)+"%";ensureV4();renderMeals();renderWellness();renderWorkout();renderWeek();renderProgress();renderInsight();renderFoodLibrary();renderRecipes();renderRecords();save()}
function mealHTML(m){return `<div class="list-item"><span class="list-icon">${m.type[0]}</span><span><strong>${m.name}</strong><br><small>${m.type} · ${m.calories} kcal</small></span><span class="list-meta">P ${m.protein}g · K ${m.carbs}g · Y ${m.fat}g</span><button class="remove" data-rm-meal="${m.id}">×</button></div>`}
function renderMeals(){const d=data(),html=d.meals.length?d.meals.map(mealHTML).join(""):`<div class="empty"><strong>Henüz öğün yok</strong><p>İlk öğününü ekle.</p></div>`;$("mealList").innerHTML=html;$("nutritionList").innerHTML=html;document.querySelectorAll("[data-rm-meal]").forEach(b=>b.onclick=()=>{d.meals=d.meals.filter(m=>m.id!=b.dataset.rmMeal);save();render()})}
function renderWellness(){const x=p(),d=data();$("waterMini").textContent=`${d.water} / ${x.waterGoal} L`;$("sleepMini").textContent=`${d.sleep} saat`;$("stepsMini").textContent=`${d.steps} adım`;$("moodMini").textContent=d.mood||"—";$("wellnessTag").textContent=(d.water&&d.sleep&&d.steps&&d.mood)?"Tamamlandı":"Eksik";$("waterInput").value=d.water;$("sleepInput").value=d.sleep;$("stepsInput").value=d.steps;$("moodInput").value=d.mood;$("noteInput").value=d.note}
function exHTML(e,d){const c=d.completedExercises.includes(e.id);return `<label class="list-item"><input type="checkbox" data-ex="${e.id}" ${c?"checked":""}><span><strong>${e.name}</strong><br><small>${e.sets}×${e.reps} · ${e.weight} kg</small></span><span>${c?"✓":""}</span></label>`}
function renderWorkout(){const x=p(),di=dayIndex(activeDate),d=data(),ex=x.workouts[di]||[];$("workoutTitle").textContent=x.workoutDays.includes(di)?DAYS[di]+" Programı":"Dinlenme günü";$("workoutDay").textContent=DAYS[di];$("miniWorkout").innerHTML=ex.length?ex.map(e=>exHTML(e,d)).join(""):`<div class="empty"><p>${x.workoutDays.includes(di)?"Program boş":"Bugün dinlenme günü"}</p></div>`;document.querySelectorAll("[data-ex]").forEach(i=>i.onchange=()=>{const id=Number(i.dataset.ex);d.completedExercises=i.checked?[...new Set([...d.completedExercises,id])]:d.completedExercises.filter(z=>z!==id);save();render()});$("weeklyWorkout").innerHTML=DAYS.map((day,i)=>`<article class="panel"><h3>${day}</h3>${(x.workouts[i]||[]).length?x.workouts[i].map(e=>`<div class="exercise-row"><span><strong>${e.name}</strong><br><small>${e.sets}×${e.reps} · ${e.weight} kg</small></span><span class="tag">${x.workoutDays.includes(i)?"Spor":"Ekstra"}</span><button class="remove" data-rm-ex="${i}-${e.id}">×</button></div>`).join(""):`<p class="muted">${x.workoutDays.includes(i)?"Program boş":"Dinlenme günü"}</p>`}</article>`).join("");document.querySelectorAll("[data-rm-ex]").forEach(b=>b.onclick=()=>{let[i,id]=b.dataset.rmEx.split("-").map(Number);x.workouts[i]=x.workouts[i].filter(e=>e.id!==id);save();render()})}
function renderWeek(){let rows=[];let sum=0;for(let i=6;i>=0;i--){let dt=new Date(activeDate+"T12:00:00");dt.setDate(dt.getDate()-i);let iso=dt.toISOString().slice(0,10),s=scoreFor(iso);sum+=s;rows.push(`<div class="week-col"><b>${s}%</b><div class="bar" style="height:${Math.max(s,4)}%"></div><small>${dt.toLocaleDateString("tr-TR",{weekday:"short"})}</small></div>`)}$("weekBars").innerHTML=rows.join("");$("weeklyAverage").textContent=`%${Math.round(sum/7)} ortalama`}
function renderInsight(){const x=p(),d=data(),t=totals(d),items=[];if(t.protein<x.proteinGoal*.7)items.push(`Protein hedefinin ${Math.round(pct(t.protein,x.proteinGoal))}%’indesin.`);if(d.water<x.waterGoal*.7)items.push("Su tüketimin hedefin altında.");if(d.sleep&&d.sleep<x.sleepGoal)items.push("Uyku süren hedefinden düşük.");if(d.steps<x.stepGoal*.5)items.push("Adım hedefin için biraz daha hareket edebilirsin.");$("insightTitle").textContent=items.length?"Bugün geliştirebileceğin alanlar var":"Harika gidiyorsun";$("insightText").textContent=items.slice(0,2).join(" ")||"Günlük hedeflerin dengeli ilerliyor."}
function renderProgress(){const x=p(),arr=[...x.measurements].sort((a,b)=>b.date.localeCompare(a.date)),last=arr[0];$("latestMeasurement").innerHTML=last?["weight","waist","hip","chest","arm","leg"].map(k=>`<div><small>${({weight:"Kilo",waist:"Bel",hip:"Kalça",chest:"Göğüs",arm:"Kol",leg:"Bacak"})[k]}</small><strong>${last[k]||"—"}${k==="weight"?" kg":" cm"}</strong></div>`).join(""):`<p class="muted">Henüz ölçüm yok.</p>`;if(arr.length>1){const first=arr[arr.length-1];$("changeSummary").innerHTML=`<div><small>Kilo değişimi</small><strong>${(last.weight-first.weight).toFixed(1)} kg</strong></div><div><small>Bel değişimi</small><strong>${((last.waist||0)-(first.waist||0)).toFixed(1)} cm</strong></div>`}else $("changeSummary").innerHTML=`<p class="muted">Karşılaştırma için en az iki kayıt gerekir.</p>`;$("measurementHistory").innerHTML=arr.length?arr.map(m=>`<div class="history-row"><span>${new Date(m.date+"T12:00:00").toLocaleDateString("tr-TR")}</span><strong>${m.weight} kg</strong><span>Bel ${m.waist||"—"}</span><button class="remove" data-rm-measure="${m.id}">×</button></div>`).join(""):`<p class="muted">Henüz kayıt yok.</p>`;document.querySelectorAll("[data-rm-measure]").forEach(b=>b.onclick=()=>{x.measurements=x.measurements.filter(m=>m.id!=b.dataset.rmMeasure);save();render()})}
function showPage(name){document.querySelectorAll(".page").forEach(e=>e.classList.remove("active"));document.querySelectorAll(".nav").forEach(e=>e.classList.remove("active"));$(name+"Page").classList.add("active");document.querySelector(`[data-page="${name}"]`)?.classList.add("active");if(name==="settings")fillSettings();$("sidebar").classList.remove("open")}
function fillSettings(){const x=p();if(!x)return;$("setName").value=x.name;$("setAge").value=x.age;$("setSex").value=x.sex;$("setHeight").value=x.height;$("setWeight").value=x.weight;$("setActivity").value=x.activity;$("setGoal").value=x.goal;$("setProteinFactor").value=x.proteinFactor;$("setWaterGoal").value=x.waterGoal;$("setStepGoal").value=x.stepGoal;$("setSleepGoal").value=x.sleepGoal;$("dayChecks").innerHTML=DAYS.map((d,i)=>`<label class="day-check"><input type="checkbox" value="${i}" ${x.workoutDays.includes(i)?"checked":""}> ${d}</label>`).join("");preview()}
function preview(){const v={age:Number($("setAge").value)||0,sex:$("setSex").value,height:Number($("setHeight").value)||0,weight:Number($("setWeight").value)||0,activity:Number($("setActivity").value),goal:$("setGoal").value,proteinFactor:Number($("setProteinFactor").value)||1.6},r=calc(v);$("calcPreview").innerHTML=`Bazal enerji: <strong>${r.bmr} kcal</strong> · Koruma: <strong>${r.maintenance} kcal</strong><br>Hedef: <strong>${r.calories} kcal</strong> · Protein: <strong>${r.protein} g</strong> · Karbonhidrat: <strong>${r.carbs} g</strong> · Yağ: <strong>${r.fat} g</strong>`}
function openModal(id){$(id).classList.add("open")}function closeAll(){document.querySelectorAll(".modal-wrap").forEach(m=>m.classList.remove("open"))}
function renderProfileList(){const arr=Object.values(db.profiles);$("profileList").innerHTML=arr.length?arr.map(x=>`<button class="profile-option" data-profile="${x.id}"><span class="avatar">${initials(x.name)}</span><span><strong>${x.name}</strong><br><small>${x.weight} kg · ${x.height} cm</small></span><b>→</b></button>`).join(""):`<p class="muted">Henüz profil yok.</p>`;document.querySelectorAll("[data-profile]").forEach(b=>b.onclick=()=>{db.activeProfile=b.dataset.profile;save();closeAll();render()})}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));
["quickAddMeal","addMealInline","addMealNutrition"].forEach(id=>$(id).onclick=()=>p()?openModal("mealModal"):newProfile());
$("addExerciseBtn").onclick=()=>p()?openModal("exerciseModal"):newProfile();
$("addMeasurementBtn").onclick=()=>p()?openModal("measurementModal"):newProfile();
$("profileBtn").onclick=()=>{renderProfileList();openModal("profileModal")};
$("newProfileBtn").onclick=newProfile;
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeAll);
document.querySelectorAll(".modal-wrap").forEach(m=>m.onclick=e=>{if(e.target===m)closeAll()});
$("prevDate").onclick=()=>{let d=new Date(activeDate+"T12:00:00");d.setDate(d.getDate()-1);activeDate=d.toISOString().slice(0,10);render()};
$("nextDate").onclick=()=>{let d=new Date(activeDate+"T12:00:00");d.setDate(d.getDate()+1);activeDate=d.toISOString().slice(0,10);render()};
$("activeDate").onchange=e=>{activeDate=e.target.value;render()};
$("mealForm").onsubmit=e=>{e.preventDefault();data().meals.push({id:uid(),name:$("mealName").value.trim(),type:$("mealType").value,calories:Number($("mealCalories").value),protein:Number($("mealProtein").value),carbs:Number($("mealCarb").value),fat:Number($("mealFat").value)});e.target.reset();closeAll();save();render()};
$("wellnessForm").onsubmit=e=>{e.preventDefault();const d=data();d.water=Number($("waterInput").value)||0;d.sleep=Number($("sleepInput").value)||0;d.steps=Number($("stepsInput").value)||0;d.mood=$("moodInput").value;d.note=$("noteInput").value.trim();save();render();showPage("dashboard")};
$("exerciseDay").innerHTML=DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join("");
$("exerciseForm").onsubmit=e=>{e.preventDefault();const x=p(),i=Number($("exerciseDay").value);x.workouts[i].push({id:uid(),name:$("exerciseName").value.trim(),sets:Number($("exerciseSets").value),reps:Number($("exerciseReps").value),weight:Number($("exerciseWeight").value)});e.target.reset();closeAll();save();render()};
$("measurementForm").onsubmit=e=>{e.preventDefault();const x=p(),m={id:uid(),date:activeDate,weight:Number($("mWeight").value),waist:Number($("mWaist").value)||null,hip:Number($("mHip").value)||null,chest:Number($("mChest").value)||null,arm:Number($("mArm").value)||null,leg:Number($("mLeg").value)||null};x.measurements.push(m);x.weight=m.weight;e.target.reset();closeAll();save();render()};
["setAge","setSex","setHeight","setWeight","setActivity","setGoal","setProteinFactor"].forEach(id=>$(id).addEventListener("input",preview));
$("profileForm").onsubmit=e=>{e.preventDefault();const x=p(),v={name:$("setName").value.trim(),age:Number($("setAge").value),sex:$("setSex").value,height:Number($("setHeight").value),weight:Number($("setWeight").value),activity:Number($("setActivity").value),goal:$("setGoal").value,proteinFactor:Number($("setProteinFactor").value),waterGoal:Number($("setWaterGoal").value),stepGoal:Number($("setStepGoal").value),sleepGoal:Number($("setSleepGoal").value)};const r=calc(v);Object.assign(x,v,{calorieGoal:r.calories,proteinGoal:r.protein,carbGoal:r.carbs,fatGoal:r.fat,workoutDays:[...document.querySelectorAll("#dayChecks input:checked")].map(e=>Number(e.value))});save();render();showPage("dashboard")};
$("deleteProfile").onclick=()=>{const x=p();if(x&&confirm(`${x.name} profili silinsin mi?`)){delete db.profiles[x.id];db.activeProfile=Object.keys(db.profiles)[0]||null;save();render()}};


/* ================= FITORA V4 ================= */
const FOOD_DB=[
{id:1,name:"Tavuk Göğsü",category:"Protein",baseAmount:100,unit:"g",calories:165,protein:31,carbs:0,fat:3.6},
{id:2,name:"Hindi Göğsü",category:"Protein",baseAmount:100,unit:"g",calories:135,protein:29,carbs:0,fat:1.5},
{id:3,name:"Yumurta",category:"Protein",baseAmount:1,unit:"adet",calories:78,protein:6.3,carbs:.6,fat:5.3},
{id:4,name:"Ton Balığı",category:"Protein",baseAmount:100,unit:"g",calories:132,protein:29,carbs:0,fat:1},
{id:5,name:"Süzme Yoğurt",category:"Süt Ürünleri",baseAmount:200,unit:"g",calories:146,protein:16,carbs:8,fat:5},
{id:6,name:"Lor Peyniri",category:"Süt Ürünleri",baseAmount:100,unit:"g",calories:90,protein:17,carbs:3,fat:1.5},
{id:7,name:"Kefir",category:"Süt Ürünleri",baseAmount:250,unit:"ml",calories:150,protein:8,carbs:12,fat:7},
{id:8,name:"Yulaf",category:"Karbonhidrat",baseAmount:50,unit:"g",calories:190,protein:6.5,carbs:32,fat:3.5},
{id:9,name:"Pirinç",category:"Karbonhidrat",baseAmount:100,unit:"g",calories:130,protein:2.7,carbs:28,fat:.3},
{id:10,name:"Bulgur",category:"Karbonhidrat",baseAmount:100,unit:"g",calories:83,protein:3.1,carbs:18.6,fat:.2},
{id:11,name:"Tam Buğday Ekmek",category:"Karbonhidrat",baseAmount:1,unit:"dilim",calories:70,protein:3,carbs:12,fat:1},
{id:12,name:"Muz",category:"Meyve",baseAmount:1,unit:"adet",calories:105,protein:1.3,carbs:27,fat:.4},
{id:13,name:"Elma",category:"Meyve",baseAmount:1,unit:"adet",calories:95,protein:.5,carbs:25,fat:.3},
{id:14,name:"Avokado",category:"Yağ",baseAmount:100,unit:"g",calories:160,protein:2,carbs:8.5,fat:14.7},
{id:15,name:"Badem",category:"Yağ",baseAmount:25,unit:"g",calories:145,protein:5.3,carbs:5.4,fat:12.5},
{id:16,name:"Fıstık Ezmesi",category:"Yağ",baseAmount:1,unit:"yemek kaşığı",calories:94,protein:3.5,carbs:3.2,fat:8},
{id:17,name:"Mercimek",category:"Bakliyat",baseAmount:100,unit:"g",calories:116,protein:9,carbs:20,fat:.4},
{id:18,name:"Nohut",category:"Bakliyat",baseAmount:100,unit:"g",calories:164,protein:8.9,carbs:27.4,fat:2.6}
];

const RECIPES=[
{name:"Proteinli Lorlu Krep",icon:"🥞",calories:390,protein:35,time:"15 dk",ingredients:"2 yumurta, 80 g lor, 40 g yulaf, baharat",steps:["Tüm malzemeleri karıştır.","Yapışmaz tavada iki tarafını pişir.","Sebzelerle servis et."]},
{name:"Tavuklu Fit Bowl",icon:"🥗",calories:520,protein:48,time:"25 dk",ingredients:"150 g tavuk, bulgur, yoğurt, salata",steps:["Tavuğu baharatlarla pişir.","Bulgur ve salatayı kaseye ekle.","Yoğurt sosuyla tamamla."]},
{name:"Yoğurtlu Protein Kasesi",icon:"🥣",calories:340,protein:29,time:"5 dk",ingredients:"200 g süzme yoğurt, whey, muz, tarçın",steps:["Yoğurt ve whey'i karıştır.","Muzu dilimle.","Tarçın ve isteğe göre badem ekle."]},
{name:"Ton Balıklı Sandviç",icon:"🥪",calories:410,protein:37,time:"10 dk",ingredients:"Ton balığı, tam buğday ekmek, yeşillik",steps:["Ton balığını yoğurtla karıştır.","Ekmek arasına yeşillikle ekle.","Soğuk servis et."]},
{name:"Yulaflı Omlet",icon:"🍳",calories:360,protein:25,time:"12 dk",ingredients:"2 yumurta, 35 g yulaf, sebze",steps:["Yumurta ve yulafı çırp.","Sebzeleri tavada çevir.","Karışımı ekleyip pişir."]},
{name:"Mercimekli Fit Salata",icon:"🥙",calories:430,protein:22,time:"15 dk",ingredients:"Mercimek, yeşillik, peynir, limon",steps:["Mercimeği süz.","Sebzelerle karıştır.","Limon ve baharat ekle."]}
];

let selectedFoodCategory="Tümü";
let timerSeconds=90,timerRemaining=90,timerInterval=null;

function ensureV4(){
  const x=p();if(!x)return;
  x.records??=[];
  x.favoriteFoods??=[];
}

function renderFoodLibrary(){
  if(!$("foodCatalog"))return;
  const query=($("foodSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const categories=["Tümü",...new Set(FOOD_DB.map(f=>f.category))];
  $("foodCategories").innerHTML=categories.map(c=>`<button class="${selectedFoodCategory===c?"active":""}" data-food-category="${c}">${c}</button>`).join("");
  const filtered=FOOD_DB.filter(f=>(selectedFoodCategory==="Tümü"||f.category===selectedFoodCategory)&&f.name.toLocaleLowerCase("tr-TR").includes(query));
  $("foodCatalog").innerHTML=filtered.length?filtered.map(f=>`<article class="food-card">
    <div class="food-card-top"><div><h3>${f.name}</h3><p>${f.category} · ${f.baseAmount} ${f.unit}</p></div><span class="food-calorie">${f.calories}</span></div>
    <div class="food-macros"><span>Protein<br><b>${f.protein} g</b></span><span>Karbonhidrat<br><b>${f.carbs} g</b></span><span>Yağ<br><b>${f.fat} g</b></span></div>
    <div class="food-card-actions">
      <button class="secondary-action" data-add-food="${f.id}">Standart porsiyon</button>
      <button class="primary" data-custom-food="${f.id}">Miktar seç</button>
    </div>
  </article>`).join(""):`<div class="empty"><p>Aramana uygun besin bulunamadı.</p></div>`;
  document.querySelectorAll("[data-food-category]").forEach(b=>b.onclick=()=>{selectedFoodCategory=b.dataset.foodCategory;renderFoodLibrary()});
  document.querySelectorAll("[data-add-food]").forEach(b=>b.onclick=()=>quickAddFood(Number(b.dataset.addFood)));
  document.querySelectorAll("[data-custom-food]").forEach(b=>b.onclick=()=>openQuantityModal(Number(b.dataset.customFood)));
}

function quickAddFood(id){
  if(!p())return newProfile();
  const f=FOOD_DB.find(x=>x.id===id);
  data().meals.push({id:uid(),name:`${f.name} (${f.baseAmount} ${f.unit})`,type:"Ara Öğün",calories:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat});
  save();render();showPage("dashboard");
}

function renderRecipes(){
  if(!$("recipeGrid"))return;
  $("recipeGrid").innerHTML=RECIPES.map((r,i)=>`<article class="recipe-card">
    <div class="recipe-cover">${r.icon}</div>
    <div class="recipe-body"><h3>${r.name}</h3><p class="muted">${r.ingredients}</p>
    <div class="recipe-stats"><span>${r.calories} kcal</span><span>${r.protein} g protein</span><span>${r.time}</span></div>
    <ol class="recipe-steps">${r.steps.map(s=>`<li>${s}</li>`).join("")}</ol>
    <button class="text-btn" data-recipe-add="${i}">Makroları öğüne ekle →</button></div>
  </article>`).join("");
  document.querySelectorAll("[data-recipe-add]").forEach(b=>b.onclick=()=>{
    const r=RECIPES[Number(b.dataset.recipeAdd)];
    data().meals.push({id:uid(),name:r.name,type:"Ana Öğün",calories:r.calories,protein:r.protein,carbs:Math.round((r.calories-r.protein*4-12*9)/4),fat:12});
    save();render();showPage("dashboard");
  });
}

function renderRecords(){
  if(!$("recordList")||!p())return;
  const arr=[...p().records].sort((a,b)=>b.date.localeCompare(a.date));
  $("recordList").innerHTML=arr.length?arr.map(r=>`<div class="record-row">
    <span><strong>${r.exercise}</strong><br><small class="record-date">${new Date(r.date+"T12:00:00").toLocaleDateString("tr-TR")}</small></span>
    <span class="record-value">${r.weight} kg</span><span>${r.reps} tekrar</span>
    <button class="remove" data-rm-record="${r.id}">×</button>
  </div>`).join(""):`<div class="empty"><p>Henüz kişisel rekor kaydı yok.</p></div>`;
  document.querySelectorAll("[data-rm-record]").forEach(b=>b.onclick=()=>{p().records=p().records.filter(r=>r.id!=b.dataset.rmRecord);save();renderRecords()});
}

function updateTimerDisplay(){
  if(!$("timerDisplay"))return;
  const m=String(Math.floor(timerRemaining/60)).padStart(2,"0");
  const s=String(timerRemaining%60).padStart(2,"0");
  $("timerDisplay").textContent=`${m}:${s}`;
}

function setTimer(seconds){
  clearInterval(timerInterval);timerInterval=null;
  timerSeconds=seconds;timerRemaining=seconds;updateTimerDisplay();
}
function startTimer(){
  if(timerInterval)return;
  timerInterval=setInterval(()=>{
    if(timerRemaining>0){timerRemaining--;updateTimerDisplay()}
    else{clearInterval(timerInterval);timerInterval=null;document.title="Süre doldu! | FITORA";setTimeout(()=>document.title="FITORA V4",3000)}
  },1000)
}
function pauseTimer(){clearInterval(timerInterval);timerInterval=null}

$("foodSearch")?.addEventListener("input",renderFoodLibrary);
document.querySelectorAll("[data-timer-seconds]").forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.timerSeconds)));
$("timerStart")?.addEventListener("click",startTimer);
$("timerPause")?.addEventListener("click",pauseTimer);
$("timerReset")?.addEventListener("click",()=>setTimer(timerSeconds));
$("recordForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  ensureV4();
  p().records.push({id:uid(),date:activeDate,exercise:$("recordExercise").value.trim(),weight:Number($("recordWeight").value),reps:Number($("recordReps").value)});
  e.target.reset();save();renderRecords();
});

const savedTheme=localStorage.getItem("fitoraTheme")||"dark";
if(savedTheme==="light")document.body.classList.add("light-theme");
function syncThemeIcon(){$("themeToggle").textContent=document.body.classList.contains("light-theme")?"☀":"☾"}
$("themeToggle")?.addEventListener("click",()=>{
  document.body.classList.toggle("light-theme");
  localStorage.setItem("fitoraTheme",document.body.classList.contains("light-theme")?"light":"dark");
  syncThemeIcon();
});
syncThemeIcon();
updateTimerDisplay();


let selectedQuantityFood=null;

function roundMacro(value){
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function openQuantityModal(id){
  if(!p())return newProfile();
  selectedQuantityFood=FOOD_DB.find(f=>f.id===id);
  if(!selectedQuantityFood)return;

  $("quantityFoodName").textContent=selectedQuantityFood.name;
  $("quantityBaseText").textContent=`Temel değer: ${selectedQuantityFood.baseAmount} ${selectedQuantityFood.unit}`;
  $("quantityBaseCalories").textContent=`${selectedQuantityFood.calories} kcal`;
  $("quantityAmount").value=selectedQuantityFood.baseAmount;
  $("quantityUnit").innerHTML=`<option value="${selectedQuantityFood.unit}">${selectedQuantityFood.unit}</option>`;
  updateQuantityPreview();
  openModal("quantityModal");
}

function calculatedQuantityValues(){
  if(!selectedQuantityFood)return null;
  const amount=Number($("quantityAmount").value)||0;
  const multiplier=amount/selectedQuantityFood.baseAmount;
  return {
    amount,
    multiplier,
    calories:roundMacro(selectedQuantityFood.calories*multiplier),
    protein:roundMacro(selectedQuantityFood.protein*multiplier),
    carbs:roundMacro(selectedQuantityFood.carbs*multiplier),
    fat:roundMacro(selectedQuantityFood.fat*multiplier)
  };
}

function updateQuantityPreview(){
  const values=calculatedQuantityValues();
  if(!values)return;
  $("previewCalories").textContent=`${values.calories} kcal`;
  $("previewProtein").textContent=`${values.protein} g`;
  $("previewCarbs").textContent=`${values.carbs} g`;
  $("previewFat").textContent=`${values.fat} g`;
}

$("quantityAmount")?.addEventListener("input",updateQuantityPreview);

$("quantityForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const values=calculatedQuantityValues();
  if(!selectedQuantityFood||!values||values.amount<=0)return;

  data().meals.push({
    id:uid(),
    name:`${selectedQuantityFood.name} (${values.amount} ${selectedQuantityFood.unit})`,
    type:$("quantityMealType").value,
    calories:values.calories,
    protein:values.protein,
    carbs:values.carbs,
    fat:values.fat
  });

  save();
  closeAll();
  render();
  showPage("dashboard");
});


/* ================= FITORA V6 USDA SEARCH ================= */
const FITORA_API_URL = "https://fitora-0p45.onrender.com";
let selectedOnlineFood=null;

async function checkBackend(){
  const status=$("apiStatus");
  if(!status)return;
  try{
    const response=await fetch(`${FITORA_API_URL}/api/health`);
    if(!response.ok)throw new Error("Backend yanıt vermedi.");
    const result=await response.json();
    if(result.usda_key_configured){
      status.textContent="Backend bağlı · USDA API anahtarı hazır.";
      status.className="api-status success";
    }else{
      status.textContent="Backend bağlı; ancak USDA_API_KEY ayarlanmamış.";
      status.className="api-status error";
    }
  }catch(error){
    status.textContent="Backend çalışmıyor. backend/run_backend.bat dosyasını başlat.";
    status.className="api-status error";
  }
}

function onlineFoodCard(food){
  const brand=food.brand?`<p class="food-brand">${food.brand}</p>`:"<p>USDA genel besin kaydı</p>";
  return `<article class="food-card online-food-card">
    <div class="food-card-top">
      <div><span class="source-badge">USDA</span><h3>${food.name}</h3>${brand}</div>
      <span class="food-calorie">${food.calories}</span>
    </div>
    <div class="food-macros">
      <span>Protein<br><b>${food.protein} g</b></span>
      <span>Karbonhidrat<br><b>${food.carbs} g</b></span>
      <span>Yağ<br><b>${food.fat} g</b></span>
    </div>
    <p class="muted">Değerler ${food.basis} içindir.</p>
    <button class="primary" data-online-food="${food.fdc_id}">Miktar seç ve ekle</button>
  </article>`;
}

async function searchOnlineFoods(query){
  const results=$("onlineFoodResults");
  const status=$("apiStatus");
  results.innerHTML='<div class="search-loading">USDA veritabanında aranıyor…</div>';

  try{
    const response=await fetch(`${FITORA_API_URL}/api/foods/search?q=${encodeURIComponent(query)}&page_size=12`);
    const payload=await response.json();

    if(!response.ok){
      throw new Error(payload.detail||"Besin araması başarısız.");
    }

    window.fitoraOnlineFoods=payload.foods;
    status.textContent=`“${payload.searched_query}” sorgusunda ${payload.total_hits} sonuç bulundu. İlk uygun sonuçlar gösteriliyor.`;
    status.className="api-status success";

    results.innerHTML=payload.foods.length
      ?payload.foods.map(onlineFoodCard).join("")
      :'<div class="search-loading">Uygun besin sonucu bulunamadı.</div>';

    document.querySelectorAll("[data-online-food]").forEach(button=>{
      button.onclick=()=>openOnlineQuantityModal(Number(button.dataset.onlineFood));
    });
  }catch(error){
    results.innerHTML=`<div class="search-loading">${error.message}</div>`;
    status.textContent=error.message;
    status.className="api-status error";
  }
}

function openOnlineQuantityModal(fdcId){
  selectedOnlineFood=(window.fitoraOnlineFoods||[]).find(food=>food.fdc_id===fdcId);
  if(!selectedOnlineFood)return;

  $("onlineFoodName").textContent=selectedOnlineFood.name;
  $("onlineFoodSource").textContent=`${selectedOnlineFood.brand||"USDA genel kaydı"} · Değerler 100 g içindir.`;
  $("onlineFoodAmount").value=100;
  updateOnlinePreview();
  openModal("onlineQuantityModal");
}

function getOnlineCalculatedValues(){
  if(!selectedOnlineFood)return null;
  const amount=Number($("onlineFoodAmount").value)||0;
  const multiplier=amount/100;
  return{
    amount,
    calories:roundMacro(selectedOnlineFood.calories*multiplier),
    protein:roundMacro(selectedOnlineFood.protein*multiplier),
    carbs:roundMacro(selectedOnlineFood.carbs*multiplier),
    fat:roundMacro(selectedOnlineFood.fat*multiplier)
  };
}

function updateOnlinePreview(){
  const values=getOnlineCalculatedValues();
  if(!values)return;
  $("onlinePreviewCalories").textContent=`${values.calories} kcal`;
  $("onlinePreviewProtein").textContent=`${values.protein} g`;
  $("onlinePreviewCarbs").textContent=`${values.carbs} g`;
  $("onlinePreviewFat").textContent=`${values.fat} g`;
}

$("onlineFoodSearchForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  const query=$("onlineFoodQuery").value.trim();
  if(query.length>=2)searchOnlineFoods(query);
});

$("onlineFoodAmount")?.addEventListener("input",updateOnlinePreview);

$("onlineQuantityForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  if(!p())return newProfile();

  const values=getOnlineCalculatedValues();
  if(!selectedOnlineFood||!values||values.amount<=0)return;

  data().meals.push({
    id:uid(),
    name:`${selectedOnlineFood.name} (${values.amount} g)`,
    type:$("onlineMealType").value,
    calories:values.calories,
    protein:values.protein,
    carbs:values.carbs,
    fat:values.fat,
    source:"USDA FoodData Central",
    fdcId:selectedOnlineFood.fdc_id
  });

  save();
  closeAll();
  render();
  showPage("dashboard");
});

checkBackend();

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("apiStatus");
  const form = document.getElementById("onlineFoodSearchForm");
  const input = document.getElementById("onlineFoodQuery");
  const results = document.getElementById("onlineFoodResults");

  async function backendKontrol() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/health");
      const data = await response.json();

      if (data.usda_key_configured) {
        status.textContent = "Backend bağlı · USDA API anahtarı hazır.";
        status.className = "api-status success";
      } else {
        status.textContent = "Backend bağlı fakat API anahtarı okunamadı.";
        status.className = "api-status error";
      }
    } catch (error) {
      status.textContent = "Backend bağlantısı kurulamadı.";
      status.className = "api-status error";
      console.error(error);
    }
  }

  async function besinAra(query) {
    results.innerHTML = `
      <div class="search-loading">
        Besinler aranıyor...
      </div>
    `;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/foods/search?q=${encodeURIComponent(query)}&page_size=12`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Besin araması başarısız.");
      }

      if (!data.foods.length) {
        results.innerHTML = `
          <div class="search-loading">
            Besin bulunamadı.
          </div>
        `;
        return;
      }

      results.innerHTML = data.foods
        .map(
          food => `
            <article class="food-card">
              <div class="food-card-top">
                <div>
                  <span class="source-badge">USDA</span>
                  <h3>${food.name}</h3>
                  <p>${food.brand || "Genel besin kaydı"}</p>
                </div>

                <span class="food-calorie">
                  ${food.calories} kcal
                </span>
              </div>

              <div class="food-macros">
                <span>
                  Protein
                  <br>
                  <b>${food.protein} g</b>
                </span>

                <span>
                  Karbonhidrat
                  <br>
                  <b>${food.carbs} g</b>
                </span>

                <span>
                  Yağ
                  <br>
                  <b>${food.fat} g</b>
                </span>
              </div>

              <p class="muted">
                Değerler 100 gram içindir.
              </p>
            </article>
          `
        )
        .join("");

      status.textContent = `${data.foods.length} besin sonucu gösteriliyor.`;
      status.className = "api-status success";
    } catch (error) {
      results.innerHTML = `
        <div class="search-loading">
          ${error.message}
        </div>
      `;

      status.textContent = error.message;
      status.className = "api-status error";
      console.error(error);
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const query = input.value.trim();

    if (query.length < 2) {
      status.textContent = "En az iki harf yazmalısın.";
      return;
    }

    besinAra(query);
  });

  backendKontrol();
});

render();
checkBackend();