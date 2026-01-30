/***********************
 * Relatorios.js - HUB COMPLETO
 * Coleções usadas:
 * - comandas
 * - Venda direta
 * - reservas
 * - Cortesia
 * - produtos
 * - Faturamento (fechamento)
 ***********************/

// Firebase (IGUAL AO SEU)
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyCSo4NsaIlD9Mdfrlp-5jjxxrhcqnx5XuI",
  authDomain: "sistemaasadelta.firebaseapp.com",
  projectId: "sistemaasadelta",
  storageBucket: "sistemaasadelta.appspot.com",
  messagingSenderId: "379026766576",
  appId: "1:379026766576:web:c6d3f2b6a71e42a98f123d"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ===== Refs ===== */
const comandasRef     = db.collection("comandas");
const vendaDiretaRef  = db.collection("Venda direta");
const reservasRef     = db.collection("reservas");
const cortesiasRef    = db.collection("Cortesia");
const produtosRef     = db.collection("produtos");
const faturamentoRef  = db.collection("Faturamento");
const quadrasRef      = db.collection("quadras");
const clientesRef     = db.collection("clientes");

/* ===== Helpers ===== */
function moneyBR(v){
  const n = Number(v||0);
  return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}
function toDateSafe(v){
  if(!v) return null;
  if(typeof v.toDate === "function") return v.toDate();
  if(v instanceof Date) return v;
  if(typeof v === "string"){
    const d = new Date(v);
    if(!isNaN(d.getTime())) return d;
  }
  return null;
}
function dateTimeBR(d){
  if(!d) return "—";
  return d.toLocaleString("pt-BR");
}
function upperKey(s){ return String(s||"").trim().toUpperCase(); }
function showLoading(on){
  const el = document.getElementById("loading");
  if(el) el.classList.toggle("d-none", !on);
}
function getRange(){
  const startIso = document.getElementById("startDate").value;
  const endIso   = document.getElementById("endDate").value;
  if(!startIso || !endIso) return null;
  const start = new Date(startIso + "T00:00:00");
  const end   = new Date(endIso   + "T23:59:59");
  return { startIso, endIso, start, end };
}
function parseMoneyBR(input){
  const s = String(input||"").trim();
  if(!s) return null; // null = não digitou
  const clean = s.replace(/[R$\s]/g,"").replace(/\./g,"").replace(",",".");
  const n = Number(clean);
  if(Number.isNaN(n)) return null;
  return n;
}
function setSaldoLabel(value){
  const el = document.getElementById("fat_saldo");
  if(!el) return;
  if(value == null){ el.textContent = ""; return; }
  el.textContent = `Saldo: ${moneyBR(value)}`;
}
function calcSaldo(total, din, pix, cre, deb){
  const soma = Number(din||0)+Number(pix||0)+Number(cre||0)+Number(deb||0);
  return Number(total||0) - soma;
}

/* ===== Detecção robusta de item "Reserva de Quadra" ===== */
function isReservaItem(item){
  const pid  = String(item?.produtoId || "").toLowerCase();
  const nome = String(item?.nome || "").toLowerCase();

  if(pid === "reserva-quadra") return true;
  if(nome.includes("reserva de quadra")) return true;
  if(nome.includes("reserva quadra")) return true;
  if(nome.startsWith("reserva") && nome.includes("quadra")) return true;

  return false;
}

/* ===== Queries safe (fallback se faltar índice) ===== */
async function safeBetween(ref, field, start, end){
  try{
    return await ref.where(field, ">=", start).where(field, "<=", end).get();
  }catch(e){
    const snap = await ref.get();
    const docs = snap.docs.filter(d=>{
      const dt = toDateSafe(d.data()[field]);
      return dt && dt>=start && dt<=end;
    });
    return { docs };
  }
}
async function safeComandasPagas(start, end){
  try{
    return await comandasRef
      .where("status_comanda", "==", "Paga")
      .where("data_pagamento", ">=", start)
      .where("data_pagamento", "<=", end)
      .get();
  }catch(e){
    const snap = await comandasRef.get();
    const docs = snap.docs.filter(d=>{
      const c = d.data()||{};
      const dt = toDateSafe(c.data_pagamento);
      return String(c.status_comanda||"") === "Paga" && dt && dt>=start && dt<=end;
    });
    return { docs };
  }
}

/* ===== View state ===== */
let currentView = "vendas";
const viewIds = ["vendas","produtos","reservas","comandas"];

/* ===== Cache nomes ===== */
const cacheQuadras = new Map();
const cacheClientes = new Map();

async function getQuadraNome(id){
  const key = String(id||"");
  if(!key) return "—";
  if(cacheQuadras.has(key)) return cacheQuadras.get(key);
  try{
    const s = await quadrasRef.doc(key).get();
    const nome = s.exists ? (s.data()?.nome || s.data()?.titulo || key) : key;
    cacheQuadras.set(key, nome);
    return nome;
  }catch(_){
    cacheQuadras.set(key, key);
    return key;
  }
}
async function getClienteNome(id){
  const key = String(id||"");
  if(!key) return "—";
  if(cacheClientes.has(key)) return cacheClientes.get(key);
  try{
    const s = await clientesRef.doc(key).get();
    const nome = s.exists ? (s.data()?.nome || s.data()?.cliente || key) : key;
    cacheClientes.set(key, nome);
    return nome;
  }catch(_){
    cacheClientes.set(key, key);
    return key;
  }
}

/* ===== Faturamento state ===== */
let faturamentoDocAtual = null;
let faturamentoDocIdAtual = null;
let totalsAtual = { produtos:0, reservas:0, total:0 };

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  const today = new Date().toISOString().slice(0,10);
  document.getElementById("startDate").value = today;
  document.getElementById("endDate").value = today;

  document.querySelectorAll("[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("[data-view]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      setView(btn.getAttribute("data-view"));
    });
  });

  document.getElementById("btnAtualizar").addEventListener("click", reloadCurrentView);

  document.getElementById("globalSearch").addEventListener("input", (e)=>{
    applyFilter(e.target.value);
  });

  document.getElementById("btnSalvarFaturamento")?.addEventListener("click", salvarFaturamento);

  // saldo “ao digitar”
  ["fat_dinheiro","fat_pix","fat_credito","fat_debito"].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", ()=>{
      const din = parseMoneyBR(document.getElementById("fat_dinheiro").value);
      const pix = parseMoneyBR(document.getElementById("fat_pix").value);
      const cre = parseMoneyBR(document.getElementById("fat_credito").value);
      const deb = parseMoneyBR(document.getElementById("fat_debito").value);

      // regra: se vazio, usa salvo (se existir)
      const sd = (din===null) ? Number(faturamentoDocAtual?.valor_dinheiro||0) : din;
      const sp = (pix===null) ? Number(faturamentoDocAtual?.valor_pix||0) : pix;
      const sc = (cre===null) ? Number(faturamentoDocAtual?.valor_credito||0) : cre;
      const sb = (deb===null) ? Number(faturamentoDocAtual?.valor_debito||0) : deb;

      setSaldoLabel(calcSaldo(totalsAtual.total, sd, sp, sc, sb));
    });
  });

  // modal cliente
  document.getElementById("btnBuscaCliente")?.addEventListener("click", ()=>{
    const modal = new bootstrap.Modal(document.getElementById("modalCliente"));
    modal.show();
  });
  document.getElementById("mc_buscar")?.addEventListener("click", buscarComandasCliente);

  reloadCurrentView();
});

function setView(view){
  currentView = view;
  viewIds.forEach(v=>{
    const el = document.getElementById(`view-${v}`);
    if(el) el.classList.toggle("d-none", v !== view);
  });
  document.getElementById("globalSearch").value = "";
  applyFilter("");
  reloadCurrentView();
}

function applyFilter(term){
  const t = String(term||"").trim().toLowerCase();
  document.querySelectorAll(".report-view:not(.d-none) .js-filter-table tbody tr").forEach(tr=>{
    const txt = tr.innerText.toLowerCase();
    tr.style.display = (!t || txt.includes(t)) ? "" : "none";
  });
}

function reloadCurrentView(){
  const range = getRange();
  if(!range){
    alert("Selecione a data inicial e final.");
    return;
  }
  if(currentView === "vendas")   return gerarVendas(range);
  if(currentView === "produtos") return gerarProdutos();
  if(currentView === "reservas") return gerarReservas(range);
  if(currentView === "comandas") return gerarComandas(range);
}

/* =========================
   VENDAS
========================= */
async function gerarVendas(range){
  const { start, end, startIso, endIso } = range;
  showLoading(true);

  try{
    document.getElementById("v_totalProdutos").textContent = moneyBR(0);
    document.getElementById("v_totalReservas").textContent = moneyBR(0);
    document.getElementById("v_totalGeral").textContent = moneyBR(0);
    document.getElementById("v_tReservas").innerHTML = "";
    document.getElementById("v_tProdutos").innerHTML = "";
    document.getElementById("v_tCortesias").innerHTML = "";

    faturamentoDocAtual = null;
    faturamentoDocIdAtual = `FAT_${startIso}_A_${endIso}`;
    totalsAtual = { produtos:0, reservas:0, total:0 };

    // 1) Comandas pagas
    const snapCom = await safeComandasPagas(start, end);

    let totalReservas = 0;
    let totalProdutosCopa = 0;

    const aggProdutos = {}; // nome -> {nome,qtd,total}
    const reservasIdsSet = new Set();
    const linksComandaReserva = []; // {comandaId, dataPg, reservaIds[]}

    (snapCom.docs || []).forEach(doc=>{
      const c = doc.data()||{};
      const dtPg = toDateSafe(c.data_pagamento);
      const itens = Array.isArray(c.itens) ? c.itens : [];
      const rvIds = Array.isArray(c.reservas_vinculadas_ids) ? c.reservas_vinculadas_ids.map(String) : [];

      rvIds.forEach(id=> reservasIdsSet.add(String(id)));
      linksComandaReserva.push({ comandaId: doc.id, dataPg: dtPg, reservaIds: rvIds });

      itens.forEach(item=>{
        const qtd = Number(item?.quantidade||0);
        const pv  = Number(item?.preco_venda||0);
        const nome = String(item?.nome||"—");

        if(isReservaItem(item)){
          totalReservas += pv*qtd;
          if(item?.reservaId) reservasIdsSet.add(String(item.reservaId));
          return;
        }

        const key = upperKey(nome);
        const line = pv*qtd;
        totalProdutosCopa += line;
        if(!aggProdutos[key]) aggProdutos[key] = { nome, qtd:0, total:0 };
        aggProdutos[key].qtd += qtd;
        aggProdutos[key].total += line;
      });
    });

    // 2) Venda direta
    const snapVD = await safeBetween(vendaDiretaRef, "data_venda", start, end);
    let totalVendaDireta = 0;
    (snapVD.docs||[]).forEach(doc=>{
      const vd = doc.data()||{};
      const itens = Array.isArray(vd.itens) ? vd.itens : [];
      itens.forEach(item=>{
        const qtd = Number(item?.quantidade||0);
        const pv  = Number(item?.preco_venda||0);
        const nome = String(item?.nome||"—");
        const key = upperKey(nome);
        const line = pv*qtd;
        totalVendaDireta += line;

        if(!aggProdutos[key]) aggProdutos[key] = { nome, qtd:0, total:0 };
        aggProdutos[key].qtd += qtd;
        aggProdutos[key].total += line;
      });
    });

    const totalProdutos = totalProdutosCopa + totalVendaDireta;
    const totalGeral = totalProdutos + totalReservas;
    totalsAtual = { produtos: totalProdutos, reservas: totalReservas, total: totalGeral };

    document.getElementById("v_totalProdutos").textContent = moneyBR(totalProdutos);
    document.getElementById("v_totalReservas").textContent = moneyBR(totalReservas);
    document.getElementById("v_totalGeral").textContent = moneyBR(totalGeral);

    // 3) Tabela Reservas pagas (por comanda -> reservas)
    const reservasMap = {};
    for(const rid of Array.from(reservasIdsSet)){
      try{
        const s = await reservasRef.doc(rid).get();
        if(s.exists) reservasMap[rid] = s.data()||{};
      }catch(_){}
    }

    const linhas = [];
    for(const link of linksComandaReserva){
      for(const rid of (link.reservaIds||[])){
        const r = reservasMap[rid] || {};
        const quadraNome = await getQuadraNome(r.id_quadra);
        const clienteNome = await getClienteNome(r.id_cliente);

        linhas.push({
          dataPg: link.dataPg,
          dataReserva: r.data_reserva || "—",
          horario: `${r.hora_inicio||"—"} - ${r.hora_fim||"—"}`,
          quadra: quadraNome,
          cliente: clienteNome,
          valor: Number(r.valor||0),
          comandaId: link.comandaId
        });
      }
    }

    linhas.sort((a,b)=> (a.dataPg?.getTime?.()||0) - (b.dataPg?.getTime?.()||0));

    const tbodyRes = document.getElementById("v_tReservas");
    tbodyRes.innerHTML = linhas.length ? linhas.map(l=>`
      <tr>
        <td>${dateTimeBR(l.dataPg)}</td>
        <td>${String(l.dataReserva||"—")}</td>
        <td>${l.horario}</td>
        <td>${l.quadra}</td>
        <td>${l.cliente}</td>
        <td class="text-end">${moneyBR(l.valor)}</td>
        <td><span class="badge badge-soft">${l.comandaId}</span></td>
      </tr>
    `).join("") : `<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma reserva paga no período.</td></tr>`;

    // 4) Produtos vendidos
    const listaProd = Object.values(aggProdutos).sort((a,b)=>(b.total||0)-(a.total||0));
    const tbodyProd = document.getElementById("v_tProdutos");
    tbodyProd.innerHTML = listaProd.length ? listaProd.map(p=>`
      <tr>
        <td class="fw-semibold">${p.nome}</td>
        <td class="text-center">${Number(p.qtd||0)}</td>
        <td class="text-end">${moneyBR(p.total||0)}</td>
      </tr>
    `).join("") : `<tr><td colspan="3" class="text-center text-muted py-4">Nenhum item vendido no período.</td></tr>`;

    // 5) Cortesias/Perdas
    const snapCor = await safeBetween(cortesiasRef, "data_registro", start, end);
    const tbodyCor = document.getElementById("v_tCortesias");

    const rowsCor = [];
    (snapCor.docs||[]).forEach(doc=>{
      const c = doc.data()||{};
      const dt = toDateSafe(c.data_registro);
      const motivo = String(c.motivo||"—");
      const itens = Array.isArray(c.itens) ? c.itens : [];
      itens.forEach(it=>{
        rowsCor.push({
          dt,
          nome: String(it?.nome||"—"),
          qtd: Number(it?.quantidade||0),
          motivo
        });
      });
    });

    rowsCor.sort((a,b)=>(a.dt?.getTime?.()||0)-(b.dt?.getTime?.()||0));
    tbodyCor.innerHTML = rowsCor.length ? rowsCor.map(r=>`
      <tr>
        <td>${dateTimeBR(r.dt)}</td>
        <td class="fw-semibold">${r.nome}</td>
        <td class="text-center">${r.qtd}</td>
        <td>${r.motivo}</td>
      </tr>
    `).join("") : `<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma cortesia/perda no período.</td></tr>`;

    await carregarFaturamentoExistente(range);

  }catch(err){
    console.error(err);
    alert("Erro no relatório de vendas. Veja o console (F12).");
  }finally{
    showLoading(false);
  }
}

async function carregarFaturamentoExistente(range){
  const status = document.getElementById("fat_status");
  if(status) status.textContent = "";

  ["fat_dinheiro","fat_pix","fat_credito","fat_debito"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });

  setSaldoLabel(calcSaldo(totalsAtual.total, 0,0,0,0));

  try{
    const ref = faturamentoRef.doc(faturamentoDocIdAtual);
    const snap = await ref.get();
    if(!snap.exists){
      faturamentoDocAtual = null;
      if(status) status.textContent = "Nenhum fechamento salvo ainda para este período.";
      return;
    }

    faturamentoDocAtual = snap.data()||{};
    const din = Number(faturamentoDocAtual.valor_dinheiro||0);
    const pix = Number(faturamentoDocAtual.valor_pix||0);
    const cre = Number(faturamentoDocAtual.valor_credito||0);
    const deb = Number(faturamentoDocAtual.valor_debito||0);

    document.getElementById("fat_dinheiro").value = din.toFixed(2).replace(".",",");
    document.getElementById("fat_pix").value     = pix.toFixed(2).replace(".",",");
    document.getElementById("fat_credito").value = cre.toFixed(2).replace(".",",");
    document.getElementById("fat_debito").value  = deb.toFixed(2).replace(".",",");

    if(status) status.textContent = "Fechamento carregado do banco (você pode alterar e salvar).";

    setSaldoLabel(calcSaldo(totalsAtual.total, din, pix, cre, deb));
  }catch(err){
    console.error(err);
    if(status) status.textContent = "Não consegui carregar o fechamento salvo.";
  }
}

async function salvarFaturamento(){
  const range = getRange();
  if(!range) return alert("Selecione a data inicial e final.");

  const status = document.getElementById("fat_status");
  if(status) status.textContent = "Salvando...";

  const vDin = parseMoneyBR(document.getElementById("fat_dinheiro").value);
  const vPix = parseMoneyBR(document.getElementById("fat_pix").value);
  const vCre = parseMoneyBR(document.getElementById("fat_credito").value);
  const vDeb = parseMoneyBR(document.getElementById("fat_debito").value);

  const old = faturamentoDocAtual || {};
  const din = (vDin===null) ? Number(old.valor_dinheiro||0) : vDin;
  const pix = (vPix===null) ? Number(old.valor_pix||0) : vPix;
  const cre = (vCre===null) ? Number(old.valor_credito||0) : vCre;
  const deb = (vDeb===null) ? Number(old.valor_debito||0) : vDeb;

  const payload = {
    periodo_inicio: range.startIso,
    periodo_fim: range.endIso,

    produtos_copa: Number(totalsAtual.produtos||0),
    Reservas_pagas: Number(totalsAtual.reservas||0),
    total_de_faturamento: Number(totalsAtual.total||0),

    valor_dinheiro: din,
    valor_pix: pix,
    valor_credito: cre,
    valor_debito: deb,

    saldo: calcSaldo(totalsAtual.total, din, pix, cre, deb),

    updated_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    const ref = faturamentoRef.doc(faturamentoDocIdAtual);
    const snap = await ref.get();
    if(!snap.exists) payload.created_at = firebase.firestore.FieldValue.serverTimestamp();

    await ref.set(payload, { merge: true });
    faturamentoDocAtual = payload;

    setSaldoLabel(payload.saldo);
    if(status) status.textContent = `Salvo!`;
  }catch(err){
    console.error(err);
    if(status) status.textContent = "Erro ao salvar (veja o console).";
    alert("Erro ao salvar faturamento. Veja o console (F12).");
  }
}

/* =========================
   PRODUTOS
========================= */
function daysBetweenInclusive(fromDate, toDate){
  const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const b = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  const diff = Math.floor((b - a) / (1000*60*60*24));
  return Math.max(1, diff + 1);
}
async function gerarProdutos(){
  showLoading(true);
  try{
    const snap = await produtosRef.get();
    const all = (snap.docs||[]).map(d=>({ id:d.id, ...d.data() }));

    document.getElementById("p_totalCad").textContent = String(all.length);

    const now = new Date();
    const enriched = all.map(p=>{
      const totalVendido = Number(p.totalVendido||0);
      const estoque = Number(p.estoque||0);
      const minimo = Number(p.estoque_minimo||0);
      const dtIni = toDateSafe(p.data_inicio_media) || toDateSafe(p.data_cadastro) || now;
      const dias = daysBetweenInclusive(dtIni, now);
      const mediaDia = totalVendido / dias;
      const alvo7 = 7 * mediaDia;
      const sugerida = Math.max(0, Math.ceil(alvo7 - estoque));
      return { ...p, _mediaDia: mediaDia, _sugerida: sugerida, _dias: dias };
    });

    const faltantes = enriched.filter(p=> Number(p.estoque||0) <= Number(p.estoque_minimo||0));
    document.getElementById("p_faltantesQtd").textContent = String(faltantes.length);
    document.getElementById("p_sugTotal").textContent = String(faltantes.reduce((s,p)=>s+(p._sugerida||0),0));

    const tbodyF = document.getElementById("p_tFaltantes");
    const faltSort = [...faltantes].sort((a,b)=> (b._sugerida||0)-(a._sugerida||0));
    tbodyF.innerHTML = faltSort.length ? faltSort.map(p=>`
      <tr>
        <td class="fw-semibold">${String(p.nome||"—")}</td>
        <td>${String(p.fornecedor||"—")}</td>
        <td class="text-center">${Number(p.estoque||0)}</td>
        <td class="text-center">${Number(p.estoque_minimo||0)}</td>
        <td class="text-center">${(p._mediaDia||0).toFixed(2).replace(".",",")}</td>
        <td class="text-center fw-bold">${Number(p._sugerida||0)}</td>
      </tr>
    `).join("") : `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum produto faltante.</td></tr>`;

    const byVendidoDesc = [...enriched].sort((a,b)=>Number(b.totalVendido||0)-Number(a.totalVendido||0));
    const top = byVendidoDesc.slice(0, 15);
    const bot = [...enriched].sort((a,b)=>Number(a.totalVendido||0)-Number(b.totalVendido||0)).slice(0, 15);

    document.getElementById("p_tMaisVendidos").innerHTML = top.length ? top.map(p=>`
      <tr>
        <td class="fw-semibold">${String(p.nome||"—")}</td>
        <td class="text-center">${Number(p.totalVendido||0)}</td>
        <td class="text-center">${(p._mediaDia||0).toFixed(2).replace(".",",")}</td>
      </tr>
    `).join("") : `<tr><td colspan="3" class="text-center text-muted py-4">Sem dados.</td></tr>`;

    document.getElementById("p_tMenosVendidos").innerHTML = bot.length ? bot.map(p=>`
      <tr>
        <td class="fw-semibold">${String(p.nome||"—")}</td>
        <td class="text-center">${Number(p.totalVendido||0)}</td>
        <td class="text-center">${(p._mediaDia||0).toFixed(2).replace(".",",")}</td>
      </tr>
    `).join("") : `<tr><td colspan="3" class="text-center text-muted py-4">Sem dados.</td></tr>`;

  }catch(err){
    console.error(err);
    alert("Erro no relatório de produtos. Veja o console.");
  }finally{
    showLoading(false);
  }
}

/* =========================
   RESERVAS
========================= */
async function gerarReservas(range){
  const { start, end } = range;
  showLoading(true);

  try{
    document.getElementById("r_tPagas").innerHTML = "";
    document.getElementById("r_tAbertas").innerHTML = "";
    document.getElementById("r_tRanking").innerHTML = "";
    document.getElementById("r_qtdPagas").textContent = "0";
    document.getElementById("r_qtdAbertas").textContent = "0";
    document.getElementById("r_topCliente").textContent = "—";

    const snap = await reservasRef.get();
    const all = (snap.docs||[]).map(d=>({ id:d.id, ...d.data() }));

    const inPeriod = all.filter(r=>{
      const ds = String(r.data_reserva||"");
      if(!ds) return false;
      const d = new Date(ds + "T12:00:00");
      return d>=start && d<=end;
    });

    const pagas = inPeriod.filter(r=> String(r.pagamento_reserva||"").toLowerCase() === "pago");
    const abertas = inPeriod.filter(r=> String(r.pagamento_reserva||"").toLowerCase() !== "pago" && String(r.status_reserva||"").toLowerCase() !== "cancelada");

    document.getElementById("r_qtdPagas").textContent = String(pagas.length);
    document.getElementById("r_qtdAbertas").textContent = String(abertas.length);

    const map = {};
    for(const r of inPeriod){
      const cid = String(r.id_cliente||"");
      if(!map[cid]) map[cid] = { qtd:0, total:0 };
      map[cid].qtd += 1;
      map[cid].total += Number(r.valor||0);
    }

    const ranking = Object.entries(map).map(([cid, v])=>({ cid, ...v }))
      .sort((a,b)=> (b.qtd-a.qtd) || (b.total-a.total));

    if(ranking[0]){
      const topName = await getClienteNome(ranking[0].cid);
      document.getElementById("r_topCliente").textContent = `${topName} (${ranking[0].qtd})`;
    }

    const tbodyP = document.getElementById("r_tPagas");
    if(!pagas.length){
      tbodyP.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma reserva paga no período.</td></tr>`;
    }else{
      const rows = [];
      for(const r of pagas){
        const quadra = await getQuadraNome(r.id_quadra);
        const cliente = await getClienteNome(r.id_cliente);
        rows.push(`
          <tr>
            <td>${String(r.data_reserva||"—")}</td>
            <td>${String(r.hora_inicio||"—")} - ${String(r.hora_fim||"—")}</td>
            <td>${quadra}</td>
            <td>${cliente}</td>
            <td class="text-end">${moneyBR(r.valor||0)}</td>
            <td><span class="badge badge-soft">pago</span></td>
          </tr>
        `);
      }
      tbodyP.innerHTML = rows.join("");
    }

    const tbodyA = document.getElementById("r_tAbertas");
    if(!abertas.length){
      tbodyA.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma reserva em aberto no período.</td></tr>`;
    }else{
      const rows = [];
      for(const r of abertas){
        const quadra = await getQuadraNome(r.id_quadra);
        const cliente = await getClienteNome(r.id_cliente);
        rows.push(`
          <tr>
            <td>${String(r.data_reserva||"—")}</td>
            <td>${String(r.hora_inicio||"—")} - ${String(r.hora_fim||"—")}</td>
            <td>${quadra}</td>
            <td>${cliente}</td>
            <td class="text-end">${moneyBR(r.valor||0)}</td>
            <td>${String(r.pagamento_reserva||"—")}</td>
          </tr>
        `);
      }
      tbodyA.innerHTML = rows.join("");
    }

    const tbodyR = document.getElementById("r_tRanking");
    if(!ranking.length){
      tbodyR.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Sem dados no período.</td></tr>`;
    }else{
      const rows = [];
      for(const it of ranking.slice(0, 30)){
        const nome = await getClienteNome(it.cid);
        rows.push(`
          <tr>
            <td class="fw-semibold">${nome}</td>
            <td class="text-center">${it.qtd}</td>
            <td class="text-end">${moneyBR(it.total||0)}</td>
          </tr>
        `);
      }
      tbodyR.innerHTML = rows.join("");
    }

  }catch(err){
    console.error(err);
    alert("Erro no relatório de reservas. Veja o console.");
  }finally{
    showLoading(false);
  }
}

/* =========================
   COMANDAS (EXCLUINDO RESERVAS)
========================= */
function sumProdutosFromItens(itens){
  const lista = Array.isArray(itens) ? itens : [];
  return lista.reduce((s,it)=>{
    if(isReservaItem(it)) return s;
    const qtd = Number(it?.quantidade||0);
    const pv  = Number(it?.preco_venda||0);
    return s + (pv*qtd);
  }, 0);
}
function itensSemReserva(itens){
  const lista = Array.isArray(itens) ? itens : [];
  return lista.filter(it=> !isReservaItem(it));
}

async function gerarComandas(range){
  const { start, end } = range;
  showLoading(true);

  try{
    document.getElementById("c_tTopClientes").innerHTML = "";
    document.getElementById("c_tTopProdutos").innerHTML = "";
    document.getElementById("c_tComandas").innerHTML = "";
    document.getElementById("c_topClienteProdutos").textContent = "—";

    const snap = await safeBetween(comandasRef, "data_pagamento", start, end);
    const docs = (snap.docs||[]).map(d=>({ id:d.id, ...d.data() }))
      .filter(c=>{
        const dt = toDateSafe(c.data_pagamento);
        return dt && dt>=start && dt<=end;
      });

    // ranking clientes e produtos (SOMENTE PRODUTOS)
    const mapCliProdutos = {}; // cliente -> {qtd, total}
    const mapProd = {};        // produto -> {nome,qtd,total}

    docs.forEach(c=>{
      const cliente = String(c.cliente||"—");
      const itens = Array.isArray(c.itens) ? c.itens : [];

      const itensOk = itensSemReserva(itens);
      const totalProdutosComanda = sumProdutosFromItens(itens);

      if(!mapCliProdutos[cliente]) mapCliProdutos[cliente] = { qtd:0, total:0 };
      if(itensOk.length > 0) mapCliProdutos[cliente].qtd += 1;
      mapCliProdutos[cliente].total += totalProdutosComanda;

      itensOk.forEach(it=>{
        const nome = String(it?.nome||"—");
        const qtd  = Number(it?.quantidade||0);
        const pv   = Number(it?.preco_venda||0);
        const line = pv*qtd;

        const key = upperKey(nome);
        if(!mapProd[key]) mapProd[key] = { nome, qtd:0, total:0 };
        mapProd[key].qtd += qtd;
        mapProd[key].total += line;
      });
    });

    const topClientes = Object.entries(mapCliProdutos)
      .map(([cliente, v])=>({ cliente, ...v }))
      .sort((a,b)=> (b.total-a.total));

    if(topClientes[0]){
      document.getElementById("c_topClienteProdutos").textContent =
        `${topClientes[0].cliente} (${moneyBR(topClientes[0].total)})`;
    }

    const topProdutos = Object.values(mapProd).sort((a,b)=> (b.total-a.total));

    document.getElementById("c_tTopClientes").innerHTML = topClientes.length ? topClientes.slice(0, 30).map(x=>`
      <tr>
        <td class="fw-semibold">${x.cliente}</td>
        <td class="text-center">${x.qtd}</td>
        <td class="text-end">${moneyBR(x.total||0)}</td>
      </tr>
    `).join("") : `<tr><td colspan="3" class="text-center text-muted py-4">Sem dados no período.</td></tr>`;

    document.getElementById("c_tTopProdutos").innerHTML = topProdutos.length ? topProdutos.slice(0, 30).map(x=>`
      <tr>
        <td class="fw-semibold">${x.nome}</td>
        <td class="text-center">${x.qtd}</td>
        <td class="text-end">${moneyBR(x.total||0)}</td>
      </tr>
    `).join("") : `<tr><td colspan="3" class="text-center text-muted py-4">Sem dados no período.</td></tr>`;

    // tabela comandas (exibe total PRODUTOS + preview sem reserva)
    const rows = docs
      .sort((a,b)=>(toDateSafe(a.data_pagamento)?.getTime?.()||0)-(toDateSafe(b.data_pagamento)?.getTime?.()||0))
      .map(c=>{
        const itens = Array.isArray(c.itens) ? c.itens : [];
        const ok = itensSemReserva(itens);

        const totalProdutos = sumProdutosFromItens(itens);
        const mini = ok.slice(0, 3).map(i=>`${i.nome} (${i.quantidade})`).join(", ");
        const more = ok.length > 3 ? ` +${ok.length-3}` : "";

        return `
          <tr>
            <td>${dateTimeBR(toDateSafe(c.data_pagamento))}</td>
            <td class="fw-semibold">${String(c.cliente||"—")}</td>
            <td>${String(c.status_comanda||"—")}</td>
            <td class="text-end">${moneyBR(totalProdutos)}</td>
            <td class="text-muted small">${mini ? (mini+more) : "—"}</td>
          </tr>
        `;
      });

    document.getElementById("c_tComandas").innerHTML = rows.length
      ? rows.join("")
      : `<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma comanda no período.</td></tr>`;

  }catch(err){
    console.error(err);
    alert("Erro no relatório de comandas. Veja o console.");
  }finally{
    showLoading(false);
  }
}

/* =========================
   MODAL: Buscar comandas por cliente (SEM RESERVAS)
========================= */
async function buscarComandasCliente(){
  const nome = String(document.getElementById("mc_nome").value||"").trim().toLowerCase();
  const soPagas = document.getElementById("mc_soPagas").value === "sim";
  const status = document.getElementById("mc_status");
  const tbody = document.getElementById("mc_result");

  if(!nome){
    alert("Digite o nome do cliente.");
    return;
  }

  status.textContent = "Buscando...";
  tbody.innerHTML = "";

  try{
    const snap = soPagas
      ? await comandasRef.where("status_comanda","==","Paga").get()
      : await comandasRef.get();

    const all = (snap.docs||[]).map(d=>({ id:d.id, ...d.data() }));
    const filtered = all.filter(c=> String(c.cliente||"").toLowerCase().includes(nome));

    filtered.sort((a,b)=>(toDateSafe(b.data_pagamento)?.getTime?.()||0)-(toDateSafe(a.data_pagamento)?.getTime?.()||0));

    status.textContent = `${filtered.length} comanda(s) encontradas.`;

    if(!filtered.length){
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma comanda encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c=>{
      const itens = Array.isArray(c.itens) ? c.itens : [];
      const ok = itensSemReserva(itens);
      const totalProdutos = sumProdutosFromItens(itens);

      const itensHtml = ok.map(it=>`
        <div class="small">
          <b>${it.nome||"—"}</b>
          <span class="text-muted"> x${Number(it.quantidade||0)}</span>
          <span class="text-muted"> • ${moneyBR((Number(it.preco_venda||0) * Number(it.quantidade||0))||0)}</span>
        </div>
      `).join("");

      return `
        <tr>
          <td>${dateTimeBR(toDateSafe(c.data_pagamento))}</td>
          <td class="fw-semibold">${String(c.cliente||"—")}</td>
          <td>${String(c.status_comanda||"—")}</td>
          <td class="text-end">${moneyBR(totalProdutos)}</td>
          <td>${itensHtml || '<span class="text-muted">—</span>'}</td>
        </tr>
      `;
    }).join("");

  }catch(err){
    console.error(err);
    status.textContent = "Erro ao buscar. Veja o console.";
    alert("Erro ao buscar comandas. Veja o console (F12).");
  }
}
