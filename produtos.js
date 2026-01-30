// =========================
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

// =========================
// Helpers
// =========================
const money = (n) => (Number(n || 0)).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
const toInt = (v) => {
  const n = parseInt(String(v).replace(",", "."), 10);
  return isNaN(n) ? null : n;
};
const toFloat = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
};
const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const todayISO = () => new Date().toISOString().slice(0,10); // YYYY-MM-DD
const todayLabel = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

function startOfDay(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function diasDesdeInclusive(inicioDate){
  const ini = startOfDay(inicioDate).getTime();
  const hoje = startOfDay(new Date()).getTime();
  return Math.max(1, Math.floor((hoje - ini)/86400000) + 1);
}

// =========================
// Estado
// =========================
let produtosCache = [];
let inicioMediaGlobal = null; // Date
let diasMediaGlobal = null;   // number

// =========================
// Média GLOBAL (config/medias)
// =========================
const refMedias = db.collection("config").doc("medias");

// Listener para atualizar badge em tempo real
refMedias.onSnapshot(async (snap) => {
  if (!snap.exists || !snap.data()?.inicio_media) {
    // Se não existir, inicializa sem zerar totalVendido (não mexe nos seus números)
    await refMedias.set({ inicio_media: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
    return;
  }
  const t = snap.data().inicio_media;
  inicioMediaGlobal = t.toDate ? t.toDate() : new Date();
  diasMediaGlobal = diasDesdeInclusive(inicioMediaGlobal);
  atualizarBadgeDiasMedia();
  renderTabelaProdutos(produtosCache); // recalc média
});

function atualizarBadgeDiasMedia(){
  const el = document.getElementById("diasMediaInfo");
  if (!el) return;
  if (!diasMediaGlobal) el.textContent = "Dias da média: —";
  else el.textContent = `Dias da média: 1-${diasMediaGlobal}`;
}

// =========================
// Produtos (snapshot)
// =========================
db.collection('produtos').orderBy('nome').onSnapshot(snap => {
  produtosCache = [];
  snap.forEach(doc => produtosCache.push({ id: doc.id, ...doc.data() }));
  renderTabelaProdutos(produtosCache);
  preencherSelectFornecedores();
  rebuildComboSelects(); // mantém selects do combo sempre atualizados
});

// =========================
// Combo UI
// =========================
function onTipoChange(){
  const tipo = (document.getElementById("tipo").value || "normal");
  const editor = document.getElementById("comboEditor");
  const isCombo = tipo === "combo";

  editor.style.display = isCombo ? "block" : "none";

  // para combo, estoque/minimo/custo não fazem sentido
  document.getElementById("estoque").disabled = isCombo;
  document.getElementById("estoque_minimo").disabled = isCombo;
  document.getElementById("preco_custo").disabled = isCombo;

  if (isCombo && document.getElementById("tbodyCombo").children.length === 0){
    addItemCombo();
    addItemCombo();
  }
  atualizarCustoComboEstimado();
}

function addItemCombo(item = null){
  const tbody = document.getElementById("tbodyCombo");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="text-start">
      <select class="form-select form-select-sm combo-produto"></select>
    </td>
    <td>
      <input type="number" class="form-control form-control-sm combo-qtd" step="0.01" min="0" value="${item?.qtd ?? 1}">
    </td>
    <td class="text-end">
      <button class="btn btn-sm btn-outline-danger" type="button"><i class="bi bi-trash"></i></button>
    </td>
  `;

  const sel = tr.querySelector(".combo-produto");
  const qtd = tr.querySelector(".combo-qtd");
  const del = tr.querySelector("button");

  sel.addEventListener("change", atualizarCustoComboEstimado);
  qtd.addEventListener("input", atualizarCustoComboEstimado);
  del.addEventListener("click", () => {
    tr.remove();
    atualizarCustoComboEstimado();
  });

  tbody.appendChild(tr);
  preencherSelectCombo(sel, item?.produtoId || "");
  atualizarCustoComboEstimado();
}

function rebuildComboSelects(){
  // atualiza todos os selects existentes
  document.querySelectorAll(".combo-produto").forEach(sel => {
    const current = sel.value;
    preencherSelectCombo(sel, current);
  });
  atualizarCustoComboEstimado();
}

function preencherSelectCombo(selectEl, selectedId){
  const normals = produtosCache.filter(p => (p.tipo || "normal") !== "combo");
  selectEl.innerHTML = `<option value="">Selecione...</option>` + normals
    .map(p => `<option value="${p.id}" ${p.id===selectedId?"selected":""}>${p.nome || ""}</option>`)
    .join("");
}

function lerItensCombo(){
  const itens = [];
  document.querySelectorAll("#tbodyCombo tr").forEach(tr => {
    const produtoId = tr.querySelector(".combo-produto")?.value || "";
    const qtd = toFloat(tr.querySelector(".combo-qtd")?.value);
    if (!produtoId) return;
    if (!qtd || qtd <= 0) return;
    itens.push({ produtoId, qtd: round2(qtd) });
  });
  return itens;
}

function custoComboEstimado(itens){
  let total = 0;
  itens.forEach(it => {
    const p = produtosCache.find(x => x.id === it.produtoId);
    total += (Number(p?.preco_custo || 0) * Number(it.qtd || 0));
  });
  return round2(total);
}

function atualizarCustoComboEstimado(){
  const el = document.getElementById("comboCustoEstimado");
  if (!el) return;
  const itens = lerItensCombo();
  const c = custoComboEstimado(itens);
  el.textContent = `Custo estimado: R$ ${money(c)}`;
}

// expõe para o HTML
window.onTipoChange = onTipoChange;
window.addItemCombo = addItemCombo;

// =========================
// Render Tabela (com média global correta)
// =========================
function renderTabelaProdutos(lista){
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = '';

  const dias = diasMediaGlobal || 1;

  lista.forEach(p => {
    const tipo = p.tipo || "normal";
    const isCombo = tipo === "combo";

    const estoque = Number(p.estoque || 0);
    const min = Number(p.estoque_minimo || 0);
    const custo = Number(p.preco_custo || 0);
    const venda = Number(p.preco_venda || 0);

    // Para combo: custo exibido = custo estimado pela receita (itens_combo)
    let custoExibido = custo;
    if (isCombo){
      const itens = Array.isArray(p.itens_combo) ? p.itens_combo : [];
      custoExibido = custoComboEstimado(itens);
    }

    const lucro = venda - custoExibido;

    // ✅ média global correta
    const totalVendido = Number(p.totalVendido || 0);
    const mediaDiaria = totalVendido / dias;

    let classeLinha = '';
    if (isCombo) classeLinha = 'table-combo';
    else if (estoque <= 0) classeLinha = 'table-danger';
    else if (estoque <= min) classeLinha = 'table-warning';

    tbody.innerHTML += `
      <tr class="${classeLinha}">
        <td class="text-start fw-bold-custom">${(p.nome || '').toUpperCase()}</td>

        <td>${p.fornecedor ? `<span class="badge-soft px-2 py-1 rounded">${p.fornecedor}</span>` : '<span class="text-muted">—</span>'}</td>

        <td>R$ ${money(custoExibido)}</td>
        <td class="text-success fw-bold">R$ ${money(venda)}</td>
        <td class="text-muted small">R$ ${money(lucro)}</td>

        <td class="fw-bold">${isCombo ? "—" : estoque}</td>
        <td class="text-muted">${isCombo ? "—" : min}</td>

        <td>${totalVendido}</td>
        <td class="text-primary fw-bold">${money(mediaDiaria)}</td>

        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="editar('${p.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="excluir('${p.id}', '${(p.nome||'').replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });

  atualizarBadgeDiasMedia();
  filtrar();
}

window.renderTabelaProdutos = renderTabelaProdutos;

// =========================
// Reset média global (como combinamos)
// - grava data início em config/medias.inicio_media
// - zera totalVendido de todos
// =========================
async function resetarMediaGlobal(){
  if (!confirm("Resetar média de vendas?\n\nIsso vai:\n• registrar a data de início da média (GLOBAL)\n• zerar totalVendido de TODOS os produtos\n\nConfirma?")) return;

  await refMedias.set({
    inicio_media: firebase.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge:true });

  const batch = db.batch();
  produtosCache.forEach(p => {
    batch.update(db.collection('produtos').doc(p.id), { totalVendido: 0 });
  });
  await batch.commit();

  alert("Média resetada com sucesso!");
}
window.resetarMediaGlobal = resetarMediaGlobal;

// =========================
// CRUD Produto (com tipo, barcode e combo)
// =========================
async function salvarProduto(){
  const id = document.getElementById('idProduto').value.trim();
  const nome = document.getElementById('nome').value.trim();
  const fornecedor = document.getElementById('fornecedor').value.trim();
  const preco_venda = round2(toFloat(document.getElementById('preco_venda').value) || 0);
  const codigo_barras = (document.getElementById('codigo_barras').value || "").trim();
  const tipo = (document.getElementById('tipo').value || "normal");

  if (!nome){
    alert("Informe o nome do produto.");
    return;
  }

  const payload = {
    nome: nome.toUpperCase(),
    fornecedor: fornecedor || "",
    preco_venda,
    codigo_barras,
    tipo
  };

  if (tipo === "combo"){
    const itens_combo = lerItensCombo();
    if (itens_combo.length < 2){
      alert("Combo precisa de pelo menos 2 itens.");
      return;
    }
    payload.itens_combo = itens_combo;

    // combo não controla estoque próprio (como combinamos)
    payload.estoque = 0;
    payload.estoque_minimo = 0;
    payload.preco_custo = 0;
  } else {
    payload.itens_combo = [];
    payload.preco_custo = round2(toFloat(document.getElementById('preco_custo').value) || 0);
    payload.estoque = Math.max(0, toInt(document.getElementById('estoque').value) ?? 0);
    payload.estoque_minimo = Math.max(0, toInt(document.getElementById('estoque_minimo').value) ?? 0);
  }

  if (id){
    await db.collection('produtos').doc(id).update(payload);
  } else {
    await db.collection('produtos').add({
      ...payload,
      totalVendido: 0,
      data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  limpar();
}
window.salvarProduto = salvarProduto;

function editar(id){
  const p = produtosCache.find(x => x.id === id);
  if (!p) return;

  document.getElementById('idProduto').value = p.id;
  document.getElementById('nome').value = p.nome || '';
  document.getElementById('fornecedor').value = p.fornecedor || '';
  document.getElementById('preco_custo').value = round2(p.preco_custo || 0);
  document.getElementById('preco_venda').value = round2(p.preco_venda || 0);
  document.getElementById('estoque').value = p.estoque || 0;
  document.getElementById('estoque_minimo').value = p.estoque_minimo || 0;
  document.getElementById('codigo_barras').value = p.codigo_barras || '';
  document.getElementById('tipo').value = p.tipo || 'normal';

  // combo itens
  const tbody = document.getElementById("tbodyCombo");
  tbody.innerHTML = "";
  if ((p.tipo || "normal") === "combo"){
    document.getElementById("comboEditor").style.display = "block";
    const itens = Array.isArray(p.itens_combo) ? p.itens_combo : [];
    if (itens.length === 0){
      addItemCombo(); addItemCombo();
    } else {
      itens.forEach(it => addItemCombo(it));
    }
  } else {
    document.getElementById("comboEditor").style.display = "none";
  }

  onTipoChange();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.editar = editar;

function limpar(){
  document.getElementById('idProduto').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('fornecedor').value = '';
  document.getElementById('preco_custo').value = 0;
  document.getElementById('preco_venda').value = 0;
  document.getElementById('estoque').value = 0;
  document.getElementById('estoque_minimo').value = 0;
  document.getElementById('codigo_barras').value = '';
  document.getElementById('tipo').value = 'normal';

  document.getElementById("tbodyCombo").innerHTML = "";
  document.getElementById("comboEditor").style.display = "none";

  onTipoChange();
}
window.limpar = limpar;

async function excluir(id, nome){
  if (!confirm(`Remover ${nome}?`)) return;
  await db.collection('produtos').doc(id).delete();
}
window.excluir = excluir;

function filtrar(){
  const termo = (document.getElementById('busca').value || '').toLowerCase();
  const linhas = document.querySelectorAll('#tabelaProdutos tr');
  linhas.forEach(l => {
    l.style.display = l.innerText.toLowerCase().includes(termo) ? '' : 'none';
  });
}
window.filtrar = filtrar;

// =========================
// VENDA (NORMAL ou COMBO)
// ✅ para o sistema entender o combo quando vender
// - diminui estoque dos itens do combo conforme qtd
// - soma totalVendido dos itens consumidos (qtd*consumo)
// - soma totalVendido do combo (qtd combos vendidos)
// =========================
async function registrarVenda(produtoId, qtdVenda = 1){
  qtdVenda = Number(qtdVenda || 1);

  await db.runTransaction(async (tx) => {
    const ref = db.collection("produtos").doc(produtoId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Produto não encontrado: " + produtoId);

    const prod = snap.data();
    const tipo = prod.tipo || "normal";

    if (tipo === "combo"){
      const itens = Array.isArray(prod.itens_combo) ? prod.itens_combo : [];
      if (!itens.length) throw new Error("Combo sem itens.");

      // baixa itens
      for (const it of itens){
        const refItem = db.collection("produtos").doc(it.produtoId);
        const snapItem = await tx.get(refItem);
        if (!snapItem.exists) throw new Error("Item do combo não encontrado: " + it.produtoId);

        const pItem = snapItem.data();
        if ((pItem.tipo || "normal") === "combo") throw new Error("Não permitido: combo dentro de combo.");

        const consumo = Number(it.qtd || 0) * qtdVenda;
        const estoqueAtual = Number(pItem.estoque || 0);
        const vendidoAtual = Number(pItem.totalVendido || 0);

        tx.update(refItem, {
          estoque: Math.max(0, estoqueAtual - consumo),
          totalVendido: vendidoAtual + consumo
        });
      }

      // incrementa totalVendido do combo
      tx.update(ref, {
        totalVendido: Number(prod.totalVendido || 0) + qtdVenda
      });

    } else {
      const estoqueAtual = Number(prod.estoque || 0);
      const vendidoAtual = Number(prod.totalVendido || 0);

      tx.update(ref, {
        estoque: Math.max(0, estoqueAtual - qtdVenda),
        totalVendido: vendidoAtual + qtdVenda
      });
    }
  });
}

// expõe para outras páginas (Comandas/Vendas Diretas)
window.AsadeltaEstoque = window.AsadeltaEstoque || {};
window.AsadeltaEstoque.registrarVenda = registrarVenda;

// =========================
// CONFERÊNCIA / COMPRA / RELATÓRIOS / SUGESTÃO
// ✅ Mantidos do seu original (sem remover nada)
// =========================
let conferenciaModal;
function abrirModalConferencia(){
  if (!conferenciaModal) conferenciaModal = new bootstrap.Modal(document.getElementById('modalConferencia'));
  carregarTabelaConferencia();
  document.getElementById('conferenciaStatus').textContent = '';
  conferenciaModal.show();
}
window.abrirModalConferencia = abrirModalConferencia;

function carregarTabelaConferencia(){
  const tbody = document.getElementById('tbodyConferencia');
  tbody.innerHTML = '';

  // combo não entra na conferência (não tem estoque próprio)
  produtosCache.filter(p => (p.tipo || "normal") !== "combo").forEach(p => {
    const venda = Number(p.preco_venda || 0);
    const estoque = Number(p.estoque || 0);

    tbody.innerHTML += `
      <tr>
        <td class="text-start fw-bold">${p.nome || ''}</td>
        <td>${p.fornecedor || '<span class="text-muted">—</span>'}</td>
        <td>R$ ${money(venda)}</td>
        <td class="fw-bold">${estoque}</td>
        <td>
          <input type="number" class="form-control form-control-sm"
                 min="0" step="1"
                 data-produto-id="${p.id}"
                 data-estoque-atual="${estoque}"
                 placeholder="(em branco = OK)">
        </td>
      </tr>
    `;
  });
}

async function confirmarConferencia(){
  const status = document.getElementById('conferenciaStatus');
  status.textContent = 'Processando...';

  const inputs = Array.from(document.querySelectorAll('#tbodyConferencia input'));
  const itens = [];
  const batch = db.batch();

  let totalEntradaQtd = 0, totalPerdaQtd = 0;
  let totalEntradaValor = 0, totalPerdaValor = 0;

  inputs.forEach(inp => {
    const id = inp.dataset.produtoId;
    const atual = Number(inp.dataset.estoqueAtual || 0);
    const val = inp.value.trim();
    if (val === '') return;
    const conferido = toInt(val);
    if (conferido === null) return;
    if (conferido === atual) return;

    const p = produtosCache.find(x => x.id === id);
    if (!p) return;

    const venda = Number(p.preco_venda || 0);
    const diff = conferido - atual;

    const qtdAbs = Math.abs(diff);
    const valorAbs = round2(qtdAbs * venda);

    if (diff > 0) { totalEntradaQtd += qtdAbs; totalEntradaValor += valorAbs; }
    else { totalPerdaQtd += qtdAbs; totalPerdaValor += valorAbs; }

    itens.push({
      produtoId: id,
      produto: p.nome || '',
      fornecedor: p.fornecedor || '',
      venda: round2(venda),
      estoqueAntes: atual,
      estoqueDepois: conferido,
      diff,
      tipoAjuste: diff > 0 ? 'entrada de ajuste' : 'perda/quebra',
      valor: valorAbs
    });

    batch.update(db.collection('produtos').doc(id), { estoque: Math.max(0, conferido) });
  });

  if (itens.length === 0){
    status.textContent = 'Nada para ajustar (todos OK).';
    return;
  }

  const dataISO = todayISO();
  const dataLabel = todayLabel();
  const relatorio = {
    tipo: 'conferencia_estoque',
    dataISO,
    dataLabel,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    totais: {
      entradaQtd: totalEntradaQtd,
      perdaQtd: totalPerdaQtd,
      entradaValor: round2(totalEntradaValor),
      perdaValor: round2(totalPerdaValor),
      saldoValor: round2(totalEntradaValor - totalPerdaValor)
    },
    itens
  };

  try{
    await batch.commit();
    const docRef = await db.collection('relatorios').add(relatorio);
    gerarPdfConferencia({ id: docRef.id, ...relatorio });
    status.textContent = 'Ajuste concluído e relatório gerado.';
  }catch(e){
    console.error(e);
    alert('Erro ao ajustar estoque/salvar relatório: ' + (e.message || e));
    status.textContent = '';
  }
}
window.confirmarConferencia = confirmarConferencia;

function gerarPdfConferencia(rel){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Relatório - Conferência de Estoque', 14, 16);
  doc.setFontSize(10);
  doc.text(`Data: ${rel.dataLabel}`, 14, 22);

  const head = [[ 'Produto', 'Antes', 'Depois', 'Ajuste', 'Qtd', 'Venda (un)', 'Valor' ]];
  const body = rel.itens.map(i => {
    const qtdAbs = Math.abs(i.diff);
    const ajuste = i.diff > 0 ? `entrada de ajuste +${qtdAbs}` : `perda/quebra -${qtdAbs}`;
    return [
      i.produto,
      String(i.estoqueAntes),
      String(i.estoqueDepois),
      ajuste,
      String(qtdAbs),
      `R$ ${money(i.venda)}`,
      `R$ ${money(i.valor)}`
    ];
  });

  doc.autoTable({
    startY: 26,
    head,
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 126, 52] }
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.text(`Entradas: ${rel.totais.entradaQtd} itens | R$ ${money(rel.totais.entradaValor)}`, 14, y);
  doc.text(`Perdas/Quebras: ${rel.totais.perdaQtd} itens | R$ ${money(rel.totais.perdaValor)}`, 14, y+6);
  doc.text(`Saldo (entradas - perdas): R$ ${money(rel.totais.saldoValor)}`, 14, y+12);

  doc.save(`${rel.dataLabel}_conferencia_estoque.pdf`);
}

// =========================
// COMPRA (mantida)
// =========================
let compraModal;

function abrirModalCompra(){
  if (!compraModal) compraModal = new bootstrap.Modal(document.getElementById('modalCompra'));
  preencherSelectFornecedores(true);
  document.getElementById('compraStatus').textContent = '';
  compraModal.show();
}
window.abrirModalCompra = abrirModalCompra;

function preencherSelectFornecedores(forceSelectFirst=false){
  const select = document.getElementById('selectFornecedorCompra');
  if (!select) return;

  // combos não entram na compra
  const fornecedores = Array.from(new Set(produtosCache
    .filter(p => (p.tipo || "normal") !== "combo")
    .map(p => (p.fornecedor || '').trim())
    .filter(f => f.length > 0)))
    .sort((a,b)=>a.localeCompare(b));

  const current = select.value;
  select.innerHTML = fornecedores.length
    ? fornecedores.map(f => `<option value="${f}">${f}</option>`).join('')
    : `<option value="">(Nenhum fornecedor cadastrado)</option>`;

  if (fornecedores.length){
    if (forceSelectFirst) select.value = fornecedores[0];
    else if (current && fornecedores.includes(current)) select.value = current;
  }

  carregarTabelaCompra();
}

function carregarTabelaCompra(){
  const select = document.getElementById('selectFornecedorCompra');
  const fornecedor = (select && select.value) ? select.value : '';
  const tbody = document.getElementById('tbodyCompra');
  tbody.innerHTML = '';

  const lista = produtosCache
    .filter(p => (p.tipo || "normal") !== "combo")
    .filter(p => (p.fornecedor || '').trim() === fornecedor);

  if (!fornecedor){
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Cadastre fornecedor nos produtos para usar Compra.</td></tr>`;
    return;
  }
  if (lista.length === 0){
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum produto com esse fornecedor.</td></tr>`;
    return;
  }

  lista.forEach(p => {
    const estoque = Number(p.estoque || 0);
    const custo = Number(p.preco_custo || 0);
    tbody.innerHTML += `
      <tr>
        <td class="text-start fw-bold">${p.nome || ''}</td>
        <td class="fw-bold">${estoque}</td>
        <td>R$ ${money(custo)}</td>
        <td><input type="number" class="form-control form-control-sm" min="0" step="1"
                   data-produto-id="${p.id}" placeholder="Qtd"></td>
        <td><input type="number" class="form-control form-control-sm" min="0" step="0.01"
                   data-custo-id="${p.id}" placeholder="(em branco = custo atual)"></td>
      </tr>
    `;
  });
}
window.carregarTabelaCompra = carregarTabelaCompra;

async function confirmarCompra(){
  const status = document.getElementById('compraStatus');
  status.textContent = 'Processando...';

  const select = document.getElementById('selectFornecedorCompra');
  const fornecedor = (select && select.value) ? select.value : '';
  if (!fornecedor){
    status.textContent = '';
    alert('Selecione um fornecedor.');
    return;
  }

  const qtdInputs = Array.from(document.querySelectorAll('#tbodyCompra input[data-produto-id]'));
  const itens = [];
  const batch = db.batch();

  let totalItens = 0;
  let totalPago = 0;

  qtdInputs.forEach(inpQtd => {
    const id = inpQtd.dataset.produtoId;
    const qtdStr = inpQtd.value.trim();
    if (qtdStr === '') return;
    const qtd = toInt(qtdStr);
    if (qtd === null || qtd <= 0) return;

    const p = produtosCache.find(x => x.id === id);
    if (!p) return;

    const custoAtual = Number(p.preco_custo || 0);
    const estoqueAtual = Number(p.estoque || 0);

    const inpCusto = document.querySelector(`#tbodyCompra input[data-custo-id="${id}"]`);
    const custoInformado = inpCusto ? inpCusto.value.trim() : '';
    const custoPago = round2((custoInformado === '' ? custoAtual : (toFloat(custoInformado) || custoAtual)));

    const novoEstoque = estoqueAtual + qtd;
    const novoCusto = novoEstoque > 0
      ? round2(((estoqueAtual * custoAtual) + (qtd * custoPago)) / novoEstoque)
      : 0;

    const itemTotal = round2(qtd * custoPago);

    itens.push({
      produtoId: id,
      produto: p.nome || '',
      fornecedor,
      qtd,
      custoPago,
      custoAntes: round2(custoAtual),
      custoDepois: novoCusto,
      estoqueAntes: estoqueAtual,
      estoqueDepois: novoEstoque,
      totalPago: itemTotal
    });

    totalItens += qtd;
    totalPago += itemTotal;

    batch.update(db.collection('produtos').doc(id), {
      estoque: novoEstoque,
      preco_custo: novoCusto
    });
  });

  if (itens.length === 0){
    status.textContent = 'Nenhum item lançado.';
    return;
  }

  const relatorio = {
    tipo: 'compra',
    dataISO: todayISO(),
    dataLabel: todayLabel(),
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    fornecedor,
    totais: { itens: totalItens, totalPago: round2(totalPago) },
    itens
  };

  try{
    await batch.commit();
    const docRef = await db.collection('relatorios').add(relatorio);
    gerarPdfCompra({ id: docRef.id, ...relatorio });
    status.textContent = 'Compra salva e relatório gerado.';
  }catch(e){
    console.error(e);
    alert('Erro ao salvar compra/relatório: ' + (e.message || e));
    status.textContent = '';
  }
}
window.confirmarCompra = confirmarCompra;

function gerarPdfCompra(rel){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Relatório - Compra', 14, 16);
  doc.setFontSize(10);
  doc.text(`Data: ${rel.dataLabel}`, 14, 22);
  doc.text(`Fornecedor: ${rel.fornecedor}`, 14, 28);

  const head = [[ 'Produto', 'Qtd', 'Custo pago (un)', 'Total pago', 'Custo antes', 'Custo depois', 'Estoque antes', 'Estoque depois' ]];
  const body = rel.itens.map(i => ([
    i.produto,
    String(i.qtd),
    `R$ ${money(i.custoPago)}`,
    `R$ ${money(i.totalPago)}`,
    `R$ ${money(i.custoAntes)}`,
    `R$ ${money(i.custoDepois)}`,
    String(i.estoqueAntes),
    String(i.estoqueDepois)
  ]));

  doc.autoTable({
    startY: 32,
    head,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 126, 52] }
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.text(`Total de itens: ${rel.totais.itens}`, 14, y);
  doc.text(`Total pago: R$ ${money(rel.totais.totalPago)}`, 14, y+6);

  doc.save(`${rel.dataLabel}_compra.pdf`);
}

// =========================
// Relatório de compras (sugestão) - usa média GLOBAL
// =========================
async function gerarRelatorioCompras(){
  if (!produtosCache || !produtosCache.length){
    alert('Aguarde os produtos carregarem para gerar o relatório.');
    return;
  }

  const dias = diasMediaGlobal || 1;
  const itens = [];
  let totalSugQtd = 0;
  let totalCusto = 0;

  produtosCache
    .filter(p => (p.tipo || "normal") !== "combo")
    .forEach(p => {
      const estoque = Number(p.estoque || 0);
      const min = Number(p.estoque_minimo || 0);
      const custo = Number(p.preco_custo || 0);

      const mediaDiaria = Number(p.totalVendido || 0) / dias;

      const alvo = (Number(min) + (7 * Number(mediaDiaria || 0)));
      const sugestao = Math.max(0, Math.ceil(alvo - estoque));

      if (sugestao <= 0) return;

      const custoTotal = round2(sugestao * custo);

      itens.push({
        produtoId: p.id,
        produto: p.nome || '',
        fornecedor: p.fornecedor || '',
        estoqueAtual: estoque,
        estoqueMinimo: min,
        mediaDiaria: round2(mediaDiaria),
        custo: round2(custo),
        estoqueAlvo: round2(alvo),
        sugestaoCompra: sugestao,
        custoTotal
      });

      totalSugQtd += sugestao;
      totalCusto += custoTotal;
    });

  if (!itens.length){
    alert('Nenhum produto faltante considerando: estoque mínimo + 7 dias de média.');
    return;
  }

  itens.sort((a,b) => (a.fornecedor||'').localeCompare(b.fornecedor||'') || (a.produto||'').localeCompare(b.produto||''));

  const relatorio = {
    tipo: 'sugestao_compra',
    dataISO: todayISO(),
    dataLabel: todayLabel(),
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    fornecedor: 'Vários',
    totais: { itensQtd: totalSugQtd, totalCusto: round2(totalCusto) },
    itens
  };

  try{
    const docRef = await db.collection('relatorios').add(relatorio);
    gerarPdfSugestaoCompra({ id: docRef.id, ...relatorio });
  }catch(e){
    console.error(e);
    alert('Erro ao salvar relatório de compras: ' + (e.message || e));
  }
}
window.gerarRelatorioCompras = gerarRelatorioCompras;

function gerarPdfSugestaoCompra(rel){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('Relatório - Produtos faltantes (Sugestão de compra)', 14, 16);
  doc.setFontSize(10);
  doc.text(`Data: ${rel.dataLabel}`, 14, 22);
  doc.text(`Regra: Sugestão = (Estoque mínimo + 7 × média/dia) - estoque atual`, 14, 28);

  const head = [[ 'Produto', 'Fornecedor', 'Estoque', 'Mínimo', 'Média/dia', 'Custo (un)', 'Alvo', 'Sug. compra', 'Custo total' ]];
  const body = (rel.itens || []).map(i => ([
    i.produto,
    i.fornecedor || '—',
    String(i.estoqueAtual),
    String(i.estoqueMinimo),
    money(i.mediaDiaria),
    `R$ ${money(i.custo)}`,
    money(i.estoqueAlvo),
    String(i.sugestaoCompra),
    `R$ ${money(i.custoTotal)}`
  ]));

  doc.autoTable({
    startY: 32,
    head,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 126, 52] }
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.text(`Total sugerido (unidades): ${rel.totais?.itensQtd || 0}`, 14, y);
  doc.text(`Custo total estimado: R$ ${money(rel.totais?.totalCusto || 0)}`, 14, y+6);

  doc.save(`${rel.dataLabel}_sugestao_compra.pdf`);
}

// =========================
// RELATÓRIOS (mantidos)
// =========================
let relatoriosModal;

function abrirModalRelatorios(){
  if (!relatoriosModal) relatoriosModal = new bootstrap.Modal(document.getElementById('modalRelatorios'));
  document.getElementById('relatoriosStatus').textContent = '';

  const fim = todayISO();
  const iniDate = new Date();
  iniDate.setDate(iniDate.getDate() - 7);
  const ini = iniDate.toISOString().slice(0,10);

  const inpIni = document.getElementById('relInicio');
  const inpFim = document.getElementById('relFim');
  if (!inpIni.value) inpIni.value = ini;
  if (!inpFim.value) inpFim.value = fim;

  document.getElementById('tbodyRelatorios').innerHTML = `<tr><td colspan="5" class="text-center text-muted">Informe um período e clique em Buscar.</td></tr>`;
  relatoriosModal.show();
}
window.abrirModalRelatorios = abrirModalRelatorios;

async function buscarRelatorios(){
  const status = document.getElementById('relatoriosStatus');
  status.textContent = 'Buscando...';

  const ini = document.getElementById('relInicio').value;
  const fim = document.getElementById('relFim').value;
  const tipo = document.getElementById('relTipo').value;

  if (!ini || !fim){
    status.textContent = '';
    alert('Informe data início e data fim.');
    return;
  }

  try{
    let query = db.collection('relatorios')
      .orderBy('dataISO')
      .startAt(ini)
      .endAt(fim);

    const snap = await query.get();
    const rows = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (tipo && d.tipo !== tipo) return;
      rows.push({ id: doc.id, ...d });
    });

    renderRelatorios(rows);
    status.textContent = `${rows.length} relatório(s) encontrado(s).`;
  }catch(e){
    console.error(e);
    status.textContent = '';
    alert('Erro ao buscar relatórios: ' + (e.message || e));
  }
}
window.buscarRelatorios = buscarRelatorios;

function renderRelatorios(lista){
  const tbody = document.getElementById('tbodyRelatorios');
  if (!lista.length){
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum relatório no período.</td></tr>`;
    return;
  }

  const tipoLabel = (t) => t === 'conferencia_estoque' ? 'Conferência de estoque' : (t === 'compra' ? 'Compra' : (t === 'sugestao_compra' ? 'Sugestão de compra' : t));

  tbody.innerHTML = '';
  lista.forEach(r => {
    let resumo = '';
    if (r.tipo === 'conferencia_estoque'){
      resumo = `Entradas: ${r.totais?.entradaQtd||0} | Perdas: ${r.totais?.perdaQtd||0} | Saldo: R$ ${money(r.totais?.saldoValor||0)}`;
    } else if (r.tipo === 'compra'){
      resumo = `Itens: ${r.totais?.itens||0} | Total pago: R$ ${money(r.totais?.totalPago||0)}`;
    } else if (r.tipo === 'sugestao_compra'){
      resumo = `Itens sugeridos: ${r.totais?.itensQtd||0} | Total custo: R$ ${money(r.totais?.totalCusto||0)}`;
    } else resumo = '—';

    tbody.innerHTML += `
      <tr>
        <td class="fw-bold">${r.dataLabel || r.dataISO || ''}</td>
        <td>${tipoLabel(r.tipo)}</td>
        <td>${r.fornecedor || '<span class="text-muted">—</span>'}</td>
        <td>${resumo}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success" onclick="baixarRelatorio('${r.id}')">
            <i class="bi bi-download"></i> Baixar PDF
          </button>
        </td>
      </tr>
    `;
  });
}

async function baixarRelatorio(id){
  try{
    const docRef = db.collection('relatorios').doc(id);
    const snap = await docRef.get();
    if (!snap.exists){
      alert('Relatório não encontrado.');
      return;
    }
    const rel = { id: snap.id, ...snap.data() };
    if (rel.tipo === 'conferencia_estoque') gerarPdfConferencia(rel);
    else if (rel.tipo === 'compra') gerarPdfCompra(rel);
    else if (rel.tipo === 'sugestao_compra') gerarPdfSugestaoCompra(rel);
    else alert('Tipo de relatório não suportado: ' + rel.tipo);
  }catch(e){
    console.error(e);
    alert('Erro ao baixar relatório: ' + (e.message || e));
  }
}
window.baixarRelatorio = baixarRelatorio;

// =========================
// Init visual do tipo (para quando abrir)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  onTipoChange();
});
