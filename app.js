(function () {
  // ====== Data: předdefinované fondy (podle tvého seznamu) ======
  var FUNDS = [
    // Peněžní trh
    { id:"mm_bnp_usd_mm", cls:"Peněžní trh", name:"BNP Paribas Funds USD Money Market", ccy:"USD" },

    // Smíšené
    { id:"mix_gs_patr", cls:"Smíšené", name:"Goldman Sachs Patrimonial Aggressive X Cap (CZK) (hedged i)", ccy:"CZK" },
    { id:"mix_allianz_dma", cls:"Smíšené", name:"Allianz Dynamic Multi Asset Strategy SRI 50 AT (H2-CZK)", ccy:"CZK" },

    // Dluhopisové
    { id:"bond_bnp_struct", cls:"Dluhopisové", name:"BNP PARIBAS FLEXI I STRUCTURED CREDIT INCOME – CZK", ccy:"CZK" },
    { id:"bond_fid_eur_hy", cls:"Dluhopisové", name:"Fidelity Funds - European High Yield Fund A-ACC-CZK(hedged)", ccy:"CZK" },

    // Akciové
    { id:"eq_allianz_us", cls:"Akciové", name:"Allianz Best Styles US Equity AT USD", ccy:"USD" },
    { id:"eq_bnp_disrupt", cls:"Akciové", name:"BNP PARIBAS DISRUPTIVE TECHNOLOGY - CZK", ccy:"CZK" },
    { id:"eq_fid_america", cls:"Akciové", name:"Fidelity Funds - America Fund A-ACC-CZK (hedged)", ccy:"CZK" },
    { id:"eq_gs_ce", cls:"Akciové", name:"Goldman Sachs Central Europe Equity P Cap (CZK)", ccy:"CZK" },
    { id:"eq_vig_ce", cls:"Akciové", name:"VIG Central European Equity Fund", ccy:"CZK" },

    // Alternativní
    { id:"alt_bnp_com", cls:"Alternativní", name:"BNP PARIBAS FLEXI I COMMODITIES - CZK", ccy:"CZK" },
    { id:"alt_conseq_re", cls:"Alternativní", name:"Conseq realitní (CZK)", ccy:"CZK" },
    { id:"alt_realita", cls:"Alternativní", name:"Realita nemovitostní otevřený podílový fond, ATRIS investiční společnost, a.s.", ccy:"CZK" },
    { id:"alt_vig_alfa", cls:"Alternativní", name:"VIG ALFA ABSOLUTE RETURN INVESTMENT FUND C", ccy:"CZK" },

    // FKI
    { id:"fki_clcf", cls:"FKI", name:"CLCF Real Estate Opportunitities", ccy:"CZK" },
    { id:"fki_emun", cls:"FKI", name:"EMUN SEMI LIQUID PRIVATE EQUITY CZK", ccy:"CZK" },
    { id:"fki_bnp_pc", cls:"FKI", name:"BNP Paribas Alternative Strategies Diversified PrivateCredit C Vintage H1 2025 (CZK RH) C / ELTIF", ccy:"CZK" }
  ];

  var STORAGE = {
    portfolio: "kkip_portfolio_v1",
    defaults: "kkip_fund_defaults_v1",
    history: "kkip_history_v1",
    client: "kkip_client_v1"
  };

  function $(id){ return document.getElementById(id); }

  function uniq(arr){
    var map = {}, out = [], i;
    for(i=0;i<arr.length;i++){
      if(!map[arr[i]]){ map[arr[i]]=true; out.push(arr[i]); }
    }
    return out;
  }

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

  function fmtMoney(x, ccy){
    if(isNaN(x) || x===null) return "—";
    try{
      return new Intl.NumberFormat("cs-CZ", { style:"currency", currency: ccy || "CZK", maximumFractionDigits:0 }).format(x);
    }catch(e){
      return Math.round(x).toLocaleString("cs-CZ") + " " + (ccy||"CZK");
    }
  }

  function nowStr(){
    return new Date().toLocaleString("cs-CZ");
  }

  function clamp(n, a, b){
    if(n<a) return a;
    if(n>b) return b;
    return n;
  }

  // ====== UI init ======
  var portfolio = readJSON(STORAGE.portfolio, []);
  var defaults = readJSON(STORAGE.defaults, {});

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
    if(useCustom){
      // u vlastního fondu nech měnu volitelnou
      $("customFundWrap").className = "";
      return;
    } else {
      $("customFundWrap").className = "hidden";
    }

    var id = $("fundSelect").value;
    var f = FUNDS.find(function(x){ return x.id === id; });
    if(!f) return;

    // currency
    $("currency").value = f.ccy;

    // defaults (sri/return/url/perf/entryFee)
    var d = defaults[id] || {};
    $("fundReturn").value = (d.ret!==undefined && d.ret!==null) ? d.ret : "";
    $("fundSri").value = (d.sri!==undefined && d.sri!==null) ? d.sri : "";
    $("fundUrl").value = d.url ? d.url : "";
    $("entryFee").value = (d.entryFee!==undefined && d.entryFee!==null) ? d.entryFee : 0;
    $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);

    // perf checkbox uses current per-fund default, else global default
    var perfGlobal = $("perfDefault").checked;
    $("perfThis").checked = (d.perf!==undefined) ? !!d.perf : !!perfGlobal;
  }

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
      tr.appendChild(tdText(p.sri || ""));
      tr.appendChild(tdText((p.ret!=="" && p.ret!==null && p.ret!==undefined) ? (Number(p.ret).toFixed(2)) : ""));
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
      } else {
        tdLink.textContent = "";
      }
      tr.appendChild(tdLink);

      var tdAct = document.createElement("td");
      var btn = document.createElement("button");
      btn.textContent = "Odebrat";
      btn.className = "secondary";
      btn.onclick = function(){
        portfolio.splice(idx,1);
        writeJSON(STORAGE.portfolio, portfolio);
        renderPortfolio();
      };
      tdAct.appendChild(btn);
      tr.appendChild(tdAct);

      body.appendChild(tr);
    });
  }

  function saveDefaultsForSelected(){
    var useCustom = $("customFundToggle").checked;
    if(useCustom){
      alert("U vlastního fondu se defaulty neukládají do roletky. Přidej ho do portfolia a tam upravuj.");
      return;
    }
    var id = $("fundSelect").value;
    var d = defaults[id] || {};
    d.ret = ($("fundReturn").value === "") ? "" : Number(String($("fundReturn").value).replace(",", "."));
    d.sri = ($("fundSri").value === "") ? "" : Number(String($("fundSri").value).replace(",", "."));
    d.url = $("fundUrl").value || "";
    d.entryFee = Number(String($("entryFee").value).replace(",", ".")) || 0;
    d.perf = !!$("perfThis").checked;
    defaults[id] = d;
    writeJSON(STORAGE.defaults, defaults);
    alert("Uloženo (do tohoto zařízení).");
  }

  function addFundToPortfolio(){
    var useCustom = $("customFundToggle").checked;

    var cls, name, ccy;
    if(useCustom){
      name = ($("customFundName").value || "").trim();
      if(!name){
        alert("Napiš název vlastního fondu.");
        return;
      }
      cls = $("assetClass").value;
      ccy = $("currency").value;
    } else {
      var id = $("fundSelect").value;
      var f = FUNDS.find(function(x){ return x.id === id; });
      if(!f) return;
      cls = f.cls;
      name = f.name;
      ccy = f.ccy;
    }

    var p = {
      id: useCustom ? ("custom_"+Date.now()) : $("fundSelect").value,
      name: name,
      cls: cls,
      ccy: ccy,
      sri: ($("fundSri").value === "") ? "" : Number(String($("fundSri").value).replace(",", ".")),
      ret: ($("fundReturn").value === "") ? "" : Number(String($("fundReturn").value).replace(",", ".")),
      url: $("fundUrl").value || "",
      lump: Number(String($("lump").value).replace(",", ".")) || 0,
      monthly: Number(String($("monthly").value).replace(",", ".")) || 0,
      entryFee: Number(String($("entryFee").value).replace(",", ".")) || 0,
      perf: !!$("perfThis").checked
    };

    portfolio.push(p);
    writeJSON(STORAGE.portfolio, portfolio);
    renderPortfolio();
  }

  function resetAll(){
    if(!confirm("Resetovat portfolio, uložené defaulty a historii v tomto prohlížeči?")) return;
    localStorage.removeItem(STORAGE.portfolio);
    localStorage.removeItem(STORAGE.defaults);
    localStorage.removeItem(STORAGE.history);
    portfolio = [];
    defaults = {};
    renderPortfolio();
    renderHistory();
    $("kpiInvested").textContent = "—";
    $("kpiPortfolio").textContent = "—";
    $("kpiSavings").textContent = "—";
    $("kpiFees").textContent = "Vstupní poplatky: —";
    $("kpiWavg").textContent = "Vážený výnos / SRI: —";
  }

  // ====== Výpočet ======
  function calc(){
    if(!portfolio.length){
      alert("Nejdřív přidej fond do portfolia.");
      return;
    }

    var years = clamp(parseInt($("years").value,10) || 10, 1, 50);
    var savRate = (Number(String($("savingsRate").value).replace(",", ".")) || 0) / 100;
    var infl = (Number(String($("inflationRate").value).replace(",", ".")) || 0) / 100;
    var real = !!$("realToggle").checked;

    var months = years * 12;
    var discM = real ? infl/12 : 0;

    // zde počítáme „součtem“ (pokud bude víc měn, je to orientační)
    var investedGross = 0;
    var entryFeesPaid = 0;

    // vážené metriky
    var totalEnd = 0;
    var wRet = 0;
    var wSri = 0;

    // spořák
    var savBal = 0;

    // portfolio: pro každou položku zvlášť
    portfolio.forEach(function(p){
      var bal = 0;
      var feePct = clamp((Number(p.entryFee)||0)/100, 0, 0.025);
      var lump = Number(p.lump)||0;
      var mon = Number(p.monthly)||0;

      // jednoráz
      var fee0 = lump * feePct;
      bal += (lump - fee0);
      investedGross += lump;
      entryFeesPaid += fee0;

      // spořák start
      savBal += lump;

      // return
      var r = (Number(p.ret)||0)/100;
      if(p.perf && r > 0.08){
        r = r - ((r-0.08)*0.10);
      }

      for(var m=1;m<=months;m++){
        // monthly contrib
        var f1 = mon * feePct;
        bal += (mon - f1);
        investedGross += mon;
        entryFeesPaid += f1;

        savBal += mon;

        // growth
        bal *= (1 + r/12);
        if(real) bal /= (1 + discM);

        // savings growth
        savBal *= (1 + savRate/12);
        if(real) savBal /= (1 + discM);
      }

      totalEnd += bal;
      // vážení podle koncové hodnoty
      wRet += bal * ((Number(p.ret)||0));
      wSri += bal * ((Number(p.sri)||0));
    });

    var investedShown = investedGross;
    var feesShown = entryFeesPaid;
    if(real){
      var discY = Math.pow(1+infl, years);
      investedShown = investedGross / discY;
      feesShown = entryFeesPaid / discY;
    }

    $("kpiInvested").textContent = fmtMoney(investedShown, "CZK");
    $("kpiPortfolio").textContent = fmtMoney(totalEnd, "CZK");
    $("kpiSavings").textContent = fmtMoney(savBal, "CZK");
    $("kpiFees").textContent = "Vstupní poplatky: " + fmtMoney(feesShown, "CZK");

    var wavgRet = (totalEnd>0) ? (wRet/totalEnd) : 0;
    var wavgSri = (totalEnd>0) ? (wSri/totalEnd) : 0;
    $("kpiWavg").textContent = (isNaN(wavgRet) ? "—" : (Number(wavgRet).toFixed(2)+" %")) + " • " + (isNaN(wavgSri) ? "—" : (Number(wavgSri).toFixed(2)));

    $("kpiMode").textContent = "Režim: " + (real ? "reálný" : "nominální");

    // historie
    var hist = readJSON(STORAGE.history, []);
    hist.unshift({
      ts: nowStr(),
      client: ($("clientName").value || "—"),
      invested: investedShown,
      portfolio: totalEnd,
      savings: savBal,
      diff: (totalEnd - savBal)
    });
    writeJSON(STORAGE.history, hist.slice(0,50));
    renderHistory();
  }

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

    hist.forEach(function(h){
      var tr = document.createElement("tr");
      function td(t){ var x=document.createElement("td"); x.textContent=t; return x; }
      tr.appendChild(td(h.ts));
      tr.appendChild(td(h.client));
      tr.appendChild(td(fmtMoney(h.invested,"CZK")));
      tr.appendChild(td(fmtMoney(h.portfolio,"CZK")));
      tr.appendChild(td(fmtMoney(h.savings,"CZK")));
      tr.appendChild(td(fmtMoney(h.diff,"CZK")));
      body.appendChild(tr);
    });
  }

  function clearHistory(){
    if(!confirm("Vymazat historii simulací v tomto zařízení?")) return;
    localStorage.removeItem(STORAGE.history);
    renderHistory();
  }

  // ====== Bind events ======
  function bind(){
    $("assetClass").onchange = fillFundsForClass;
    $("fundSelect").onchange = applySelectedFundToInputs;

    $("entryFee").oninput = function(){
      $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);
    };

    $("perfDefault").onchange = function(){
      // když nejsou uložené defaulty, ať se změna projeví i na aktuálním výběru
      applySelectedFundToInputs();
    };

    $("customFundToggle").onchange = function(){
      if($("customFundToggle").checked){
        $("customFundWrap").className = "";
      } else {
        $("customFundWrap").className = "hidden";
        applySelectedFundToInputs();
      }
    };

    $("btnSaveDefaults").onclick = saveDefaultsForSelected;
    $("btnAdd").onclick = addFundToPortfolio;
    $("btnCalc").onclick = calc;
    $("btnReset").onclick = resetAll;
    $("btnClearHistory").onclick = clearHistory;
  }

  // ====== Init ======
  function init(){
    fillAssetClasses();

    // klient persist
    var cn = localStorage.getItem(STORAGE.client) || "";
    $("clientName").value = cn;
    $("clientName").oninput = function(){ localStorage.setItem(STORAGE.client, $("clientName").value || ""); };

    fillFundsForClass();
    renderPortfolio();
    renderHistory();
    $("entryFeeLbl").textContent = Number($("entryFee").value).toFixed(1);
  }

  bind();
  init();
})();
