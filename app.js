(function () {
  // ====== FUND LIST (tvůj seznam) ======
  var FUNDS = [
    { id:"mm_bnp_usd_mm", cls:"Peněžní trh", name:"BNP Paribas Funds USD Money Market", ccy:"USD" },

    { id:"mix_gs_patr", cls:"Smíšené", name:"Goldman Sachs Patrimonial Aggressive X Cap (CZK) (hedged i)", ccy:"CZK" },
    { id:"mix_allianz_dma", cls:"Smíšené", name:"Allianz Dynamic Multi Asset Strategy SRI 50 AT (H2-CZK)", ccy:"CZK" },

    { id:"bond_bnp_struct", cls:"Dluhopisové", name:"BNP PARIBAS FLEXI I STRUCTURED CREDIT INCOME – CZK", ccy:"CZK" },
    { id:"bond_fid_eur_hy", cls:"Dluhopisové", name:"Fidelity Funds - European High Yield Fund A-ACC-CZK(hedged)", ccy:"CZK" },

    { id:"eq_allianz_us", cls:"Akciové", name:"Allianz Best Styles US Equity AT USD", ccy:"USD" },
    { id:"eq_bnp_disrupt", cls:"Akciové", name:"BNP PARIBAS DISRUPTIVE TECHNOLOGY - CZK", ccy:"CZK" },
    { id:"eq_fid_america", cls:"Akciové", name:"Fidelity Funds - America Fund A-ACC-CZK (hedged)", ccy:"CZK" },
    { id:"eq_gs_ce", cls:"Akciové", name:"Goldman Sachs Central Europe Equity P Cap (CZK)", ccy:"CZK" },
    { id:"eq_vig_ce", cls:"Akciové", name:"VIG Central European Equity Fund", ccy:"CZK" },

    { id:"alt_bnp_com", cls:"Alternativní", name:"BNP PARIBAS FLEXI I COMMODITIES - CZK", ccy:"CZK" },
    { id:"alt_conseq_re", cls:"Alternativní", name:"Conseq realitní (CZK)", ccy:"CZK" },
    { id:"alt_realita", cls:"Alternativní", name:"Realita nemovitostní otevřený podílový fond, ATRIS investiční společnost, a.s.", ccy:"CZK" },
    { id:"alt_vig_alfa", cls:"Alternativní", name:"VIG ALFA ABSOLUTE RETURN INVESTMENT FUND C", ccy:"CZK" },

    { id:"fki_clcf", cls:"FKI", name:"CLCF Real Estate Opportunitities", ccy:"CZK" },
    { id:"fki_emun", cls:"FKI", name:"EMUN SEMI LIQUID PRIVATE EQUITY CZK", ccy:"CZK" },
    { id:"fki_bnp_pc", cls:"FKI", name:"BNP Paribas Alternative Strategies Diversified PrivateCredit C Vintage H1 2025 (CZK RH) C / ELTIF", ccy:"CZK" }
  ];

  var STORAGE = {
    portfolio: "kkip_portfolio_v3",
    defaults: "kkip_defaults_v3",
    history:  "kkip_history_v3",
    clients:  "kkip_clients_v3"
  };

  function $(id){ return document.getElementById(id); }

  function readJSON(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  }
  function writeJSON(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }

  function uniq(arr){
    var map = {}, out = [], i;
    for(i=0;i<arr.length;i++){
      if(!map[arr[i]]){ map[arr[i]]=true; out.push(arr[i]); }
    }
    return out;
  }

  function toNum(x){
    if(x===null || x===undefined) return 0;
    var s = String(x).replace(",", ".");
    var n = Number(s);
    return isNaN(n) ? 0 : n;
  }

  function clamp(n, a, b){
    if(n<a) return a;
    if(n>b) return b;
    return n;
  }

  function fmtMoney(x, ccy){
    if(x===null || x===undefined || isNaN(x)) return "—";
    try{
      return new Intl.NumberFormat("cs-CZ", {
        style:"currency",
        currency: ccy || "CZK",
        maximumFractionDigits:0
      }).format(x);
    }catch(e){
      return Math.round(x).toLocaleString("cs-CZ") + " " + (ccy || "CZK");
    }
  }

  function nowStr(){
    return new Date().toLocaleString("cs-CZ");
  }

  // ====== State ======
  var portfolio = readJSON(STORAGE.portfolio, []);
  var defaults  = readJSON(STORAGE.defaults, {});
  var clients   = readJSON(STORAGE.clients, []);

  // ====== Dropdowns ======
  function fillAssetClasses(){
    var classes = uniq(FUNDS.map(function(f){ return f.cls; }));
    var sel = $("assetClass");
    sel.innerHTML = "";
    for(var i=0;i<classes.length;i++){
      var opt = document.createElement("option");
      opt.value = classes[i];
      opt.textContent = classes[i];
      sel.appendChild(opt);
    }
  }

  function fillFundsForClass(){
    var cls = $("assetClass").value;
    var sel = $("fundSelect");
    sel.innerHTML = "";
    var items = FUNDS.filter(function(f){ return f.cls === cls; });
    for(var i=0;i<items.length;i++){
      var opt = document.createElement("option");
      opt.value = items[i].id;
      opt.textContent = items[i].name + " (" + items[i].ccy + ")";
      sel.appendChild(opt);
    }
    applySelectedFundToInputs();
  }

  function applySelectedFundToInputs(){
    var useCustom = $("customFundToggle").checked;
    $("customFundWrap").className = useCustom ? "" : "hidden";

    if(useCustom){
      // custom: currency stays as selected, don't auto-fill
      var perfGlobal = $("perfGlobalDefault").checked;
      $("perfThisFund").checked = perfGlobal;
      return;
    }

    var id = $("fundSelect").value;
    var f = null;
    for(var i=0;i<FUNDS.length;i++){
      if(FUNDS[i].id === id){ f = FUNDS[i]; break; }
    }
    if(!f) return;

    $("currency").value = f.ccy;

    var d = defaults[id] || {};
    $("fundReturn").value = (d.ret!==undefined) ? d.ret : "";
    $("fundSri").value    = (d.sri!==undefined) ? d.sri : "";
    $("fundUrl").value    = d.url ? d.url : "";
    $("entryFee").value   = (d.entryFee!==undefined) ? d.entryFee : 0;
    $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);

    var perfGlobal = $("perfGlobalDefault").checked;
    $("perfThisFund").checked = (d.perf!==undefined) ? !!d.perf : !!perfGlobal;
  }

  // ====== Portfolio table ======
  function renderPortfolio(){
    var body = $("portfolioBody");
    body.innerHTML = "";
    if(!portfolio.length){
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = 11;
      td0.className = "small";
      td0.textContent = "Přidejte fond do portfolia.";
      tr0.appendChild(td0);
      body.appendChild(tr0);
      return;
    }

    portfolio.forEach(function(p, idx){
      var tr = document.createElement("tr");

      function tdText(t){
        var td = document.createElement("td");
        td.textContent = t;
        return td;
      }

      tr.appendChild(tdText(p.name));
      tr.appendChild(tdText(p.cls));
      tr.appendChild(tdText(p.ccy));
      tr.appendChild(tdText(p.sri===0 ? "" : (p.sri || "")));
      tr.appendChild(tdText(p.ret===0 ? "0.00" : ((p.ret!=="" && p.ret!==null && p.ret!==undefined) ? Number(p.ret).toFixed(2) : "")));
      tr.appendChild(tdText(fmtMoney(p.lump, p.ccy)));
      tr.appendChild(tdText(fmtMoney(p.monthly, p.ccy)));
      tr.appendChild(tdText(Number(p.entryFee||0).toFixed(1) + "%"));
      tr.appendChild(tdText(p.perf ? "ON" : "OFF"));

      var tdLink = document.createElement("td");
      if(p.url){
        var a = document.createElement("a");
        a.href = p.url;
        a.textContent = "web";
        a.target = "_blank";
        a.style.color = "#1f3c88";
        tdLink.appendChild(a);
      }
      tr.appendChild(tdLink);

      var tdAct = document.createElement("td");
      var btn = document.createElement("button");
      btn.textContent = "Odebrat";
      btn.className = "secondary";
      btn.onclick = function(){
        portfolio.splice(idx, 1);
        writeJSON(STORAGE.portfolio, portfolio);
        renderPortfolio();
      };
      tdAct.appendChild(btn);
      tr.appendChild(tdAct);

      body.appendChild(tr);
    });
  }

  function saveDefaultsForSelected(){
    if($("customFundToggle").checked){
      alert("U vlastního fondu se defaulty do roletky neukládají.");
      return;
    }
    var id = $("fundSelect").value;
    var d = defaults[id] || {};
    d.ret = ($("fundReturn").value === "") ? "" : toNum($("fundReturn").value);
    d.sri = ($("fundSri").value === "") ? "" : toNum($("fundSri").value);
    d.url = $("fundUrl").value || "";
    d.entryFee = toNum($("entryFee").value);
    d.perf = !!$("perfThisFund").checked;
    defaults[id] = d;
    writeJSON(STORAGE.defaults, defaults);
    alert("Uloženo (do tohoto zařízení).");
  }

  function addFundToPortfolio(){
    var useCustom = $("customFundToggle").checked;

    var cls = $("assetClass").value;
    var name = "";
    var ccy = $("currency").value;

    if(useCustom){
      name = ($("customFundName").value || "").trim();
      if(!name){
        alert("Napiš název vlastního fondu.");
        return;
      }
    } else {
      var id = $("fundSelect").value;
      var f = null;
      for(var i=0;i<FUNDS.length;i++){
        if(FUNDS[i].id === id){ f = FUNDS[i]; break; }
      }
      if(!f) return;
      cls = f.cls;
      name = f.name;
      ccy = f.ccy;
    }

    var item = {
      id: useCustom ? ("custom_"+Date.now()) : $("fundSelect").value,
      name: name,
      cls: cls,
      ccy: ccy,
      sri: ($("fundSri").value === "") ? "" : toNum($("fundSri").value),
      ret: ($("fundReturn").value === "") ? "" : toNum($("fundReturn").value),
      url: $("fundUrl").value || "",
      lump: toNum($("lump").value),
      monthly: toNum($("monthly").value),
      entryFee: toNum($("entryFee").value),
      perf: !!$("perfThisFund").checked
    };

    portfolio.push(item);
    writeJSON(STORAGE.portfolio, portfolio);
    renderPortfolio();
  }

  function resetAll(){
    if(!confirm("Resetovat portfolio, defaulty a historii v tomto prohlížeči?")) return;
    localStorage.removeItem(STORAGE.portfolio);
    localStorage.removeItem(STORAGE.defaults);
    localStorage.removeItem(STORAGE.history);
    portfolio = [];
    defaults = {};
    renderPortfolio();
    renderHistory();
    clearCharts();
    $("kpiInvested").textContent = "—";
    $("kpiPortfolio").textContent = "—";
    $("kpiSavings").textContent = "—";
    $("kpiFees").textContent = "Vstupní poplatky: —";
    $("kpiWavg").textContent = "Vážený výnos / SRI: —";
  }

  // ====== Model B: Roční kapitalizace, ale smysluplně ======
  // Jednoráz: PV*(1+r)^n
  // Pravidelně (měsíčně): převod na roční příspěvek A=monthly*12 a anuity: A * ((1+r)^n - 1)/r
  // Poplatek: sníží PV i A (aplikuje se na každý vklad)
  function fvModelB(lump, monthly, r, years, entryFeePct){
    var n = years;
    var rate = r;
    if(rate < -0.99) rate = -0.99;

    var fee = clamp(entryFeePct, 0, 0.025);
    var PV = Math.max(0, lump) * (1 - fee);
    var A  = Math.max(0, monthly) * 12 * (1 - fee);

    var fvLump = PV * Math.pow(1 + rate, n);
    var fvAnnu = 0;
    if(rate === 0){
      fvAnnu = A * n;
    }else{
      fvAnnu = A * ((Math.pow(1 + rate, n) - 1) / rate);
    }
    return fvLump + fvAnnu;
  }

  function totalInvestedGross(lump, monthly, years){
    return Math.max(0,lump) + Math.max(0,monthly) * 12 * years;
  }

  function entryFeesPaid(lump, monthly, years, entryFeePct){
    var fee = clamp(entryFeePct, 0, 0.025);
    return Math.max(0,lump)*fee + Math.max(0,monthly)*fee*12*years;
  }

  // ====== Calculation + charts ======
  var lastCalc = null;

  function calculate(){
    if(!portfolio.length){
      alert("Nejdřív přidej fond do portfolia.");
      return;
    }

    var years = clamp(parseInt($("years").value,10) || 10, 1, 50);
    var savRate = toNum($("savingsRate").value)/100;
    var infl = toNum($("inflationRate").value)/100;
    var real = !!$("realToggle").checked;

    // portfolio end sum
    var endSum = 0;
    var investedSum = 0;
    var feesSum = 0;

    // weights for wavg (podle investovaného brutto)
    var wRet = 0;
    var wSri = 0;
    var wTot = 0;

    // time series (roční body)
    var labels = [];
    var seriesPort = [];
    var seriesSav = [];

    // accumulate yearly by simulating per year (B styl)
    // Pro jednoduchost: každému fondu počítáme FV v roce y a sčítáme
    for(var y=1; y<=years; y++){
      labels.push(y);

      var yearEndPort = 0;
      var yearInvested = 0;
      var yearFees = 0;

      for(var i=0;i<portfolio.length;i++){
        var p = portfolio[i];

        var r = toNum(p.ret)/100;
        // perf fee: 10% z části nad 8%
        if(p.perf && r > 0.08){
          r = r - ((r - 0.08) * 0.10);
        }

        var feePct = toNum(p.entryFee)/100;
        var fv = fvModelB(toNum(p.lump), toNum(p.monthly), r, y, feePct);
        yearEndPort += fv;

        yearInvested += totalInvestedGross(toNum(p.lump), toNum(p.monthly), y);
        yearFees += entryFeesPaid(toNum(p.lump), toNum(p.monthly), y, feePct);
      }

      // spořák: jedno „portfolio“ s jedním r
      // (stejná logika B, bez vstupních poplatků)
      var savFV = 0;
      // spořák pracuje s celkovými vklady (součet všech fondů) – aby srovnání dávalo smysl
      var totalLump = 0, totalMonthly = 0;
      for(var j=0;j<portfolio.length;j++){
        totalLump += Math.max(0, toNum(portfolio[j].lump));
        totalMonthly += Math.max(0, toNum(portfolio[j].monthly));
      }
      savFV = fvModelB(totalLump, totalMonthly, savRate, y, 0);

      // reálné hodnoty pro graf podle přepínače
      if(real){
        var disc = Math.pow(1 + infl, y);
        seriesPort.push(yearEndPort / disc);
        seriesSav.push(savFV / disc);
      }else{
        seriesPort.push(yearEndPort);
        seriesSav.push(savFV);
      }

      // poslední rok ukládáme i KPI
      if(y === years){
        endSum = yearEndPort;
        investedSum = yearInvested;
        feesSum = yearFees;
      }
    }

    // KPI wavg podle investovaného brutto
    for(var k=0;k<portfolio.length;k++){
      var pp = portfolio[k];
      var inv = totalInvestedGross(toNum(pp.lump), toNum(pp.monthly), years);
      if(inv <= 0) continue;
      wTot += inv;
      wRet += inv * toNum(pp.ret);
      wSri += inv * (toNum(pp.sri) || 0);
    }
    var wavgRet = (wTot>0) ? (wRet/wTot) : 0;
    var wavgSri = (wTot>0) ? (wSri/wTot) : 0;

    // spořák end (v režimu real/nominál)
    var totalL0 = 0, totalM0 = 0;
    for(var m=0;m<portfolio.length;m++){
      totalL0 += Math.max(0, toNum(portfolio[m].lump));
      totalM0 += Math.max(0, toNum(portfolio[m].monthly));
    }
    var savEndNom = fvModelB(totalL0, totalM0, savRate, years, 0);
    var discEnd = real ? Math.pow(1+infl, years) : 1;

    // show KPI in CZK (multi currency note: orientační)
    $("kpiInvested").textContent = fmtMoney(investedSum / discEnd, "CZK");
    $("kpiPortfolio").textContent = fmtMoney(endSum / discEnd, "CZK");
    $("kpiSavings").textContent = fmtMoney(savEndNom / discEnd, "CZK");
    $("kpiFees").textContent = "Vstupní poplatky: " + fmtMoney(feesSum / discEnd, "CZK");
    $("kpiWavg").textContent = (Number(wavgRet).toFixed(2) + " %") + " • " + (Number(wavgSri).toFixed(2));
    $("kpiMode").textContent = "Režim: " + (real ? "reálný" : "nominální");

    // history
    var hist = readJSON(STORAGE.history, []);
    hist.unshift({
      ts: nowStr(),
      client: ($("clientName").value || "—"),
      invested: investedSum / discEnd,
      portfolio: endSum / discEnd,
      savings: savEndNom / discEnd,
      diff: (endSum - savEndNom) / discEnd
    });
    writeJSON(STORAGE.history, hist.slice(0, 60));
    renderHistory();

    // charts
    drawLineChart($("lineChart"), labels, seriesPort, seriesSav);

    // pies based on end-year FV per fund (nominální nebo reálné dle přepínače)
    var byClass = {};
    var byCcy = {};
    for(var t=0;t<portfolio.length;t++){
      var q = portfolio[t];
      var rr = toNum(q.ret)/100;
      if(q.perf && rr > 0.08){
        rr = rr - ((rr - 0.08) * 0.10);
      }
      var fvp = fvModelB(toNum(q.lump), toNum(q.monthly), rr, years, toNum(q.entryFee)/100);
      if(real) fvp = fvp / Math.pow(1+infl, years);

      byClass[q.cls] = (byClass[q.cls] || 0) + fvp;
      byCcy[q.ccy] = (byCcy[q.ccy] || 0) + fvp;
    }

    drawPie($("pieClass"), byClass);
    drawPie($("pieCcy"), byCcy);

    // store lastCalc for PDF
    lastCalc = {
      client: ($("clientName").value || "—"),
      date: new Date().toLocaleDateString("cs-CZ"),
      years: years,
      savingsRate: savRate,
      inflation: infl,
      real: real,
      invested: investedSum / discEnd,
      fees: feesSum / discEnd,
      portEnd: endSum / discEnd,
      savEnd: savEndNom / discEnd,
      diff: (endSum - savEndNom) / discEnd,
      wavgRet: wavgRet,
      wavgSri: wavgSri,
      line: { labels: labels, port: seriesPort, sav: seriesSav },
      pies: { byClass: byClass, byCcy: byCcy },
      portfolio: JSON.parse(JSON.stringify(portfolio))
    };
  }

  // ====== History ======
  function renderHistory(){
    var body = $("historyBody");
    var hist = readJSON(STORAGE.history, []);
    body.innerHTML = "";
    if(!hist.length){
      var tr0 = document.createElement("tr");
      var td0 = document.createElement("td");
      td0.colSpan = 6;
      td0.className = "small";
      td0.textContent = "Zatím žádná uložená simulace.";
      tr0.appendChild(td0);
      body.appendChild(tr0);
      return;
    }
    for(var i=0;i<hist.length;i++){
      var h = hist[i];
      var tr = document.createElement("tr");
      function td(t){ var x=document.createElement("td"); x.textContent=t; return x; }
      tr.appendChild(td(h.ts));
      tr.appendChild(td(h.client));
      tr.appendChild(td(fmtMoney(h.invested,"CZK")));
      tr.appendChild(td(fmtMoney(h.portfolio,"CZK")));
      tr.appendChild(td(fmtMoney(h.savings,"CZK")));
      tr.appendChild(td(fmtMoney(h.diff,"CZK")));
      body.appendChild(tr);
    }
  }

  function clearHistory(){
    if(!confirm("Vymazat historii simulací v tomto zařízení?")) return;
    localStorage.removeItem(STORAGE.history);
    renderHistory();
  }

  // ====== Charts (Canvas) ======
  function clearCharts(){
    var c1 = $("lineChart").getContext("2d"); c1.clearRect(0,0,$("lineChart").width,$("lineChart").height);
    var c2 = $("pieClass").getContext("2d"); c2.clearRect(0,0,$("pieClass").width,$("pieClass").height);
    var c3 = $("pieCcy").getContext("2d"); c3.clearRect(0,0,$("pieCcy").width,$("pieCcy").height);
  }

  function drawLineChart(canvas, labels, port, sav){
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    if(!labels.length){ return; }

    // bounds
    var maxV = 0;
    for(var i=0;i<port.length;i++){ if(port[i]>maxV) maxV = port[i]; }
    for(var j=0;j<sav.length;j++){ if(sav[j]>maxV) maxV = sav[j]; }
    if(maxV <= 0) maxV = 1;

    var padL=54, padR=18, padT=14, padB=34;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;

    function xAt(idx){
      if(labels.length===1) return padL;
      return padL + (idx/(labels.length-1))*plotW;
    }
    function yAt(v){
      var t = v / (maxV*1.05);
      return padT + (1 - t)*plotH;
    }

    // grid
    ctx.strokeStyle = "#e9eef9";
    ctx.lineWidth = 1;
    for(var g=0; g<=5; g++){
      var y = padT + (g/5)*plotH;
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle="#cfd8ea";
    ctx.beginPath();
    ctx.moveTo(padL,padT); ctx.lineTo(padL,h-padB); ctx.lineTo(w-padR,h-padB);
    ctx.stroke();

    // y labels
    ctx.fillStyle="#6b7a90";
    ctx.font="12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial";
    for(var gg=0; gg<=5; gg++){
      var vv = (maxV*1.05) * (1 - gg/5);
      var yy = padT + (gg/5)*plotH;
      ctx.fillText(Math.round(vv).toLocaleString("cs-CZ"), 8, yy+4);
    }

    // x labels
    var step = Math.max(1, Math.floor(labels.length/6));
    for(var k=0;k<labels.length;k+=step){
      ctx.fillText(String(labels[k]), xAt(k)-4, h-12);
    }
    if((labels.length-1)%step!==0){
      ctx.fillText(String(labels[labels.length-1]), xAt(labels.length-1)-4, h-12);
    }

    // series
    function drawSeries(data, color){
      ctx.strokeStyle=color;
      ctx.lineWidth=2;
      ctx.beginPath();
      for(var i2=0;i2<data.length;i2++){
        var x = xAt(i2);
        var y = yAt(data[i2]);
        if(i2===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    drawSeries(port, "#1f3c88"); // KKIP
    drawSeries(sav, "#0f766e");  // savings

    // legend
    ctx.fillStyle="#1f3c88"; ctx.fillRect(padL, 8, 10, 10);
    ctx.fillStyle="#13233a"; ctx.fillText("KKIP portfolio", padL+14, 18);
    ctx.fillStyle="#0f766e"; ctx.fillRect(padL+120, 8, 10, 10);
    ctx.fillStyle="#13233a"; ctx.fillText("Spořicí účet", padL+134, 18);
  }

  function drawPie(canvas, map){
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    var items = [];
    for(var k in map){
      if(map.hasOwnProperty(k)){
        items.push({ label:k, value: map[k] });
      }
    }
    items.sort(function(a,b){ return b.value - a.value; });

    var total = 0;
    for(var i=0;i<items.length;i++) total += items[i].value;
    if(total <= 0){
      ctx.fillStyle="#6b7a90";
      ctx.font="13px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial";
      ctx.fillText("Není co zobrazit", 14, 24);
      return;
    }

    var cx = Math.floor(w*0.33), cy = Math.floor(h*0.52);
    var r = Math.floor(Math.min(w,h)*0.34);
    var colors = ["#1f3c88","#274aa8","#0f766e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#64748b","#22c55e","#e11d48"];

    var ang = -Math.PI/2;
    for(var j=0;j<items.length;j++){
      var frac = items[j].value / total;
      var a2 = ang + frac * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,ang,a2);
      ctx.closePath();
      ctx.fillStyle = colors[j % colors.length];
      ctx.fill();
      ang = a2;
    }

    // center
    ctx.beginPath();
    ctx.arc(cx,cy,Math.floor(r*0.58),0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();

    // legend
    ctx.font="12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial";
    var lx = Math.floor(w*0.62), ly = 24;
    for(var z=0; z<items.length && z<8; z++){
      var pct = (items[z].value/total)*100;
      ctx.fillStyle = colors[z % colors.length];
      ctx.fillRect(lx, ly-10, 10, 10);
      ctx.fillStyle="#13233a";
      var label = items[z].label.length>20 ? (items[z].label.slice(0,20)+"…") : items[z].label;
      ctx.fillText(label, lx+14, ly);
      ctx.fillStyle="#6b7a90";
      ctx.fillText(pct.toFixed(1)+" %", lx+14, ly+14);
      ly += 30;
    }
  }

  // ====== Clients (save/load) ======
  function refreshClientSelect(){
    var sel = $("clientSelect");
    sel.innerHTML = "";
    var opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "—";
    sel.appendChild(opt0);

    for(var i=0;i<clients.length;i++){
      var c = clients[i];
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    }
  }

  function saveClient(){
    var name = ($("clientName").value || "").trim();
    if(!name){
      alert("Vyplň jméno klienta.");
      return;
    }
    var id = "c_" + Date.now();
    var snapshot = {
      id: id,
      name: name,
      savedAt: nowStr(),
      form: {
        years: $("years").value,
        savingsRate: $("savingsRate").value,
        realToggle: $("realToggle").checked,
        inflationRate: $("inflationRate").value,
        perfGlobalDefault: $("perfGlobalDefault").checked
      },
      portfolio: JSON.parse(JSON.stringify(portfolio))
    };
    clients.unshift(snapshot);
    clients = clients.slice(0, 80);
    writeJSON(STORAGE.clients, clients);
    refreshClientSelect();
    $("clientSelect").value = id;
    alert("Klient uložen.");
  }

  function loadClient(){
    var id = $("clientSelect").value;
    if(!id){ alert("Vyber klienta."); return; }
    var c = null;
    for(var i=0;i<clients.length;i++){ if(clients[i].id===id){ c=clients[i]; break; } }
    if(!c){ alert("Klient nenalezen."); return; }

    $("clientName").value = c.name;
    $("years").value = c.form.years;
    $("savingsRate").value = c.form.savingsRate;
    $("realToggle").checked = !!c.form.realToggle;
    $("inflationRate").value = c.form.inflationRate;
    $("perfGlobalDefault").checked = !!c.form.perfGlobalDefault;

    portfolio = c.portfolio || [];
    writeJSON(STORAGE.portfolio, portfolio);
    renderPortfolio();
    alert("Načteno.");
  }

  function deleteClient(){
    var id = $("clientSelect").value;
    if(!id){ alert("Vyber klienta."); return; }
    if(!confirm("Opravdu smazat klienta?")) return;
    clients = clients.filter(function(x){ return x.id !== id; });
    writeJSON(STORAGE.clients, clients);
    refreshClientSelect();
    alert("Smazáno.");
  }

  // ====== PDF export (4 pages) ======
  function canvasToDataURL(id){
    try{
      return $(id).toDataURL("image/png");
    }catch(e){
      return "";
    }
  }

  function escapeHtml(s){
    return String(s||"")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function buildPDF(){
    if(!lastCalc){
      alert("Nejdřív klikni na Vypočítat.");
      return;
    }

    // Ensure charts are drawn (already by calc)
    var imgLine = canvasToDataURL("lineChart");
    var imgPieClass = canvasToDataURL("pieClass");
    var imgPieCcy = canvasToDataURL("pieCcy");

    // Prepare pages (A4)
    var css =
      "html,body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#13233a}" +
      ".page{width:210mm;min-height:297mm;padding:14mm 14mm 12mm;box-sizing:border-box;page-break-after:always}" +
      ".brand{background:#1f3c88;color:#fff;padding:10mm;border-radius:10px}" +
      ".title{font-size:26px;font-weight:900;margin:0}" +
      ".sub{opacity:.92;margin-top:4px}" +
      ".meta{margin-top:8mm;font-size:13px;line-height:1.5}" +
      ".boxrow{display:flex;gap:10mm;margin-top:8mm}" +
      ".box{flex:1;border:1px solid #d9e1ef;border-radius:12px;padding:8mm;background:#fff}" +
      ".boxt{font-size:12px;color:#6b7a90}" +
      ".boxv{font-size:22px;font-weight:900;margin-top:2mm}" +
      ".two{display:flex;gap:10mm;margin-top:8mm}" +
      ".card{flex:1;border:1px solid #d9e1ef;border-radius:12px;padding:6mm}" +
      "table{width:100%;border-collapse:collapse;margin-top:6mm;font-size:12px}" +
      "th,td{border-bottom:1px solid #e6edf9;padding:7px;vertical-align:top;text-align:left}" +
      "th{background:#f7f9ff;color:#40506b;font-weight:900}" +
      ".h2{font-size:16px;font-weight:900;margin:8mm 0 0}" +
      ".img{width:100%;border:1px solid #d9e1ef;border-radius:12px;overflow:hidden}" +
      ".footer{position:absolute;left:14mm;right:14mm;bottom:10mm;color:#6b7a90;font-size:10px}" +
      ".p{position:relative}" +
      ".mut{color:#6b7a90}" +
      ".tag{display:inline-block;background:#eef2ff;border:1px solid #d8e0ff;color:#1f3c88;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900}";

    // Table rows
    var rows = "";
    for(var i=0;i<lastCalc.portfolio.length;i++){
      var p = lastCalc.portfolio[i];
      rows += "<tr>" +
        "<td><strong>"+escapeHtml(p.name)+"</strong></td>" +
        "<td>"+escapeHtml(p.cls)+"</td>" +
        "<td>"+escapeHtml(p.ccy)+"</td>" +
        "<td>"+escapeHtml(p.sri)+"</td>" +
        "<td>"+escapeHtml(p.ret)+"</td>" +
        "<td>"+escapeHtml(String(p.lump))+"</td>" +
        "<td>"+escapeHtml(String(p.monthly))+"</td>" +
        "<td>"+escapeHtml(String(p.entryFee))+"%</td>" +
        "<td>"+(p.perf ? "ON" : "OFF")+"</td>" +
        "</tr>";
    }

    var disclaimer = "Tento dokument slouží pouze pro informační účely a nepředstavuje závaznou nabídku. Minulé výnosy nejsou zárukou budoucích.";

    var page1 =
      '<div class="page p">' +
        '<div class="brand">' +
          '<div class="title">Prezentace portfolia</div>' +
          '<div class="sub">KKIP • interní návrh</div>' +
        '</div>' +
        '<div class="meta">' +
          '<div><span class="tag">Klient</span> <strong>'+escapeHtml(lastCalc.client)+'</strong></div>' +
          '<div style="margin-top:4mm"><span class="tag">Datum</span> '+escapeHtml(lastCalc.date)+'</div>' +
          '<div style="margin-top:4mm"><span class="tag">Zpracovala</span> Martina Tea Norman</div>' +
          '<div style="margin-top:2mm" class="mut">724 307 822 • martina.tea.norman@kkip.cz</div>' +
        '</div>' +
        '<div class="footer">'+escapeHtml(disclaimer)+'</div>' +
      '</div>';

    var page2 =
      '<div class="page p">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end">' +
          '<div style="font-size:20px;font-weight:900">Přehled portfolia</div>' +
          '<div class="mut">Horizont: <strong>'+escapeHtml(String(lastCalc.years))+'</strong> let</div>' +
        '</div>' +
        '<div class="boxrow">' +
          '<div class="box"><div class="boxt">Vloženo (brutto)</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.invested,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">KKIP portfolio</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.portEnd,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">Spořicí účet</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.savEnd,"CZK"))+'</div></div>' +
        '</div>' +
        '<div style="margin-top:4mm" class="mut">Vážený výnos / SRI: <strong>'+escapeHtml(Number(lastCalc.wavgRet).toFixed(2))+' %</strong> • <strong>'+escapeHtml(Number(lastCalc.wavgSri).toFixed(2))+'</strong></div>' +
        '<div class="two">' +
          '<div class="card"><div style="font-weight:900;margin-bottom:4mm">Alokace dle tříd aktiv</div>' +
            (imgPieClass ? ('<img class="img" src="'+imgPieClass+'" />') : '<div class="mut">Graf není k dispozici.</div>') +
          '</div>' +
          '<div class="card"><div style="font-weight:900;margin-bottom:4mm">Alokace dle měny</div>' +
            (imgPieCcy ? ('<img class="img" src="'+imgPieCcy+'" />') : '<div class="mut">Graf není k dispozici.</div>') +
          '</div>' +
        '</div>' +
        '<div class="h2">Seznam fondů</div>' +
        '<table><thead><tr>' +
          '<th>Fond</th><th>Třída</th><th>Měna</th><th>SRI</th><th>Výnos %</th><th>Jednoráz</th><th>Měsíčně</th><th>Vstup</th><th>Perf.</th>' +
        '</tr></thead><tbody>'+rows+'</tbody></table>' +
        '<div class="footer">'+escapeHtml(disclaimer)+'</div>' +
      '</div>';

    var page3 =
      '<div class="page p">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end">' +
          '<div style="font-size:20px;font-weight:900">Investiční výhled – nominální</div>' +
          '<div class="mut">Spořicí účet: <strong>'+escapeHtml(String((lastCalc.savingsRate*100).toFixed(1)))+' %</strong></div>' +
        '</div>' +
        '<div class="boxrow">' +
          '<div class="box"><div class="boxt">KKIP portfolio</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.portEnd,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">Spořicí účet</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.savEnd,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">Rozdíl</div><div class="boxv">'+escapeHtml(fmtMoney(lastCalc.diff,"CZK"))+'</div></div>' +
        '</div>' +
        '<div class="h2">Projekce (roční body)</div>' +
        (imgLine ? ('<img class="img" src="'+imgLine+'" />') : '<div class="mut">Graf není k dispozici.</div>') +
        '<div class="footer">'+escapeHtml(disclaimer)+'</div>' +
      '</div>';

    // Real page: přepočet pouze pro prezentaci
    var disc = Math.pow(1 + (lastCalc.inflation || 0), lastCalc.years);
    var portReal = lastCalc.portEnd / disc;
    var savReal = lastCalc.savEnd / disc;
    var invReal = lastCalc.invested / disc;
    var diffReal = portReal - savReal;

    var page4 =
      '<div class="page p">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end">' +
          '<div style="font-size:20px;font-weight:900">Investiční výhled – reálný</div>' +
          '<div class="mut">Inflace: <strong>'+escapeHtml(String(((lastCalc.inflation||0)*100).toFixed(1)))+' %</strong></div>' +
        '</div>' +
        '<div class="boxrow">' +
          '<div class="box"><div class="boxt">Vloženo (reálně)</div><div class="boxv">'+escapeHtml(fmtMoney(invReal,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">KKIP (reálně)</div><div class="boxv">'+escapeHtml(fmtMoney(portReal,"CZK"))+'</div></div>' +
          '<div class="box"><div class="boxt">Spořák (reálně)</div><div class="boxv">'+escapeHtml(fmtMoney(savReal,"CZK"))+'</div></div>' +
        '</div>' +
        '<div style="margin-top:4mm" class="mut">Rozdíl (reálně): <strong>'+escapeHtml(fmtMoney(diffReal,"CZK"))+'</strong></div>' +
        '<div class="h2">Poznámka</div>' +
        '<div class="mut" style="margin-top:3mm;line-height:1.45">' +
          'Reálné hodnoty jsou očištěné o inflaci a slouží pouze pro orientační srovnání kupní síly.' +
        '</div>' +
        '<div class="footer">'+escapeHtml(disclaimer)+'</div>' +
      '</div>';

    var html =
      '<!doctype html><html><head><meta charset="utf-8"/>' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
      '<title>PDF – '+escapeHtml(lastCalc.client)+'</title>' +
      '<style>'+css+' @media print{.page{page-break-after:always}}</style>' +
      '</head><body>' + page1 + page2 + page3 + page4 + '</body></html>';

    var w = window.open("", "_blank");
    w.document.open();
    w.document.write(html);
    w.document.close();

    // wait for images to load, then open print
    setTimeout(function(){
      w.focus();
      w.print();
    }, 700);
  }

  // ====== Bind events ======
  function bind(){
    $("assetClass").onchange = fillFundsForClass;
    $("fundSelect").onchange = applySelectedFundToInputs;

    $("entryFee").oninput = function(){
      $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);
    };

    $("perfGlobalDefault").onchange = function(){
      applySelectedFundToInputs();
    };

    $("customFundToggle").onchange = function(){
      $("customFundWrap").className = $("customFundToggle").checked ? "" : "hidden";
      applySelectedFundToInputs();
    };

    $("btnSaveDefaults").onclick = saveDefaultsForSelected;
    $("btnAddFund").onclick = addFundToPortfolio;
    $("btnReset").onclick = resetAll;
    $("btnCalc").onclick = calculate;
    $("btnClearHistory").onclick = clearHistory;

    $("btnSaveClient").onclick = saveClient;
    $("btnLoadClient").onclick = loadClient;
    $("btnDeleteClient").onclick = deleteClient;

    $("btnPDF").onclick = buildPDF;
  }

  // ====== Init ======
  function init(){
    fillAssetClasses();
    fillFundsForClass();
    renderPortfolio();
    renderHistory();
    refreshClientSelect();
    $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);
    clearCharts();
  }

  bind();
  init();
})();
