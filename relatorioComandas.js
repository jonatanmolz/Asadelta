// =========================================================
// Relatório de Comandas - AsaDelta Esportes
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCSo4NsaIlD9Mdfrlp-5jjxxrhcqnx5XuI",
  authDomain: "sistemaasadelta.firebaseapp.com",
  projectId: "sistemaasadelta",
  storageBucket: "sistemaasadelta.appspot.com",
  messagingSenderId: "379026766576",
  appId: "1:379026766576:web:869c9b6f849d4f6d61a2b7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let todasComandas = [];
let todosRegistrosReservasPagas = [];
let resultadoAtual = [];
let modoAtual = 'todas';
let modalDetalhe = null;

const el = (id) => document.getElementById(id);

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function norm(s){
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function fmtBR(valor){
  return Number(valor || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

function parseNumero(valor){
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(String(valor).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function hojeISO(){
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function toDate(v){
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [a,m,d] = s.split('-').map(Number);
      return new Date(a, m - 1, d, 12, 0, 0);
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function fmtDataHora(v){
  const d = toDate(v);
  if (!d) return '-';
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function inputDateToRange(inicio, fim){
  const start = inicio ? toDate(inicio) : null;
  const end = fim ? toDate(fim) : null;
  if (start) start.setHours(0,0,0,0);
  if (end) end.setHours(23,59,59,999);
  return { start, end };
}

function inRange(dateValue, start, end){
  const d = toDate(dateValue);
  if (!start && !end) return true;
  if (!d) return false;
  return (!start || d >= start) && (!end || d <= end);
}

function timestampFromDate(d){
  return firebase.firestore.Timestamp.fromDate(d);
}

function isItemReserva(item){
  const nome = norm(item?.nome);
  const pid = norm(item?.produtoId);
  return pid === 'reserva-quadra' || nome.startsWith('reserva de quadra') || nome.includes('reserva de quadra');
}

function valorItem(item){
  return Number(item?.preco_venda || item?.valor || 0) * Number(item?.quantidade || 1);
}

function itensPendentesComanda(comanda){
  return Array.isArray(comanda?.itens) ? comanda.itens : [];
}

function itensPagosAcumulados(comanda){
  if (Array.isArray(comanda?.itens_pagos_acumulados)) return comanda.itens_pagos_acumulados;
  if (Array.isArray(comanda?.itens_pagos_total)) return comanda.itens_pagos_total;
  if (Array.isArray(comanda?.itens_pagos)) return comanda.itens_pagos;
  return [];
}

function itensComanda(comanda){
  const status = norm(comanda?.status_comanda);
  const pagos = itensPagosAcumulados(comanda);
  const pendentes = itensPendentesComanda(comanda);

  // Comandas pagas em partes: durante a comanda aberta, os itens pagos saem de `itens`.
  // Para o relatório enxergar a comanda completa, juntamos histórico pago + itens pendentes.
  // Quando já está paga e existe histórico acumulado, usamos o histórico para evitar duplicar.
  if (pagos.length) {
    if (status === 'paga') return pagos;
    return [...pagos, ...pendentes];
  }
  return pendentes;
}

function totalComanda(comanda){
  const status = norm(comanda?.status_comanda);
  const valorSalvo = Number(comanda?.valor_total || 0);
  const valorPagoAcumulado = Number(comanda?.valor_pago_acumulado || comanda?.valor_total_pago || 0);

  if (status === 'paga' && valorSalvo > 0) return valorSalvo;
  if (status === 'excluida' && valorSalvo > 0) return valorSalvo;

  if (valorPagoAcumulado > 0) {
    // Aberta com pagamento parcial: soma o que já foi pago + o que ainda está pendente.
    return valorPagoAcumulado + itensPendentesComanda(comanda).reduce((s, item) => s + valorItem(item), 0);
  }

  return itensComanda(comanda).reduce((s, item) => s + valorItem(item), 0);
}

function totalReservasComanda(comanda){
  const salvo = Number(comanda?.valor_reservas || 0);
  if (salvo > 0 && norm(comanda?.status_comanda) === 'excluida') return salvo;
  return itensComanda(comanda).filter(isItemReserva).reduce((s, item) => s + valorItem(item), 0);
}

function totalProdutosComanda(comanda){
  const salvo = Number(comanda?.valor_produtos || 0);
  if (salvo > 0 && norm(comanda?.status_comanda) === 'excluida') return salvo;
  return itensComanda(comanda).filter(item => !isItemReserva(item)).reduce((s, item) => s + valorItem(item), 0);
}

function dataExclusaoComanda(c){
  return c?.data_exclusao || c?.excluida_em || c?.data_excluida || null;
}

function dataOrdenacaoComanda(c){
  const status = norm(c?.status_comanda);
  if (status === 'paga') return c?.data_pagamento || c?.ultimo_pagamento_em || c?.data_abertura;
  if (status === 'excluida') return dataExclusaoComanda(c) || c?.ultimo_pagamento_em || c?.data_abertura;
  return c?.ultimo_pagamento_em || c?.data_abertura || c?.data_pagamento || dataExclusaoComanda(c);
}

function resumoItens(comanda){
  const itens = agruparItensRelatorio(itensComanda(comanda));
  if (!itens.length) return '<span class="text-muted">Sem itens</span>';
  return `<ul class="item-lista">${itens.slice(0, 4).map(item => `<li>${escapeHtml(item.quantidade || 1)}x ${escapeHtml(item.nome || '')} <span class="valor">${fmtBR(valorItem(item))}</span></li>`).join('')}${itens.length > 4 ? `<li class="text-muted">+ ${itens.length - 4} item(ns)</li>` : ''}</ul>`;
}

function safeArr(v){
  return Array.isArray(v) ? v : [];
}


function agruparItensRelatorio(itens){
  const mapa = new Map();
  safeArr(itens).forEach(item => {
    const preco = Number(item?.preco_venda || item?.valor || 0);
    const key = [item?.produtoId || '', item?.reservaId || '', item?.nome || '', preco.toFixed(4)].join('||');
    if (!mapa.has(key)) {
      mapa.set(key, { ...item, quantidade: 0, preco_venda: preco });
    }
    const atual = mapa.get(key);
    atual.quantidade += Number(item?.quantidade || 1);
  });
  return Array.from(mapa.values());
}

function getFiltros(){
  const dataInicio = el('filtro-data-inicio').value;
  const dataFim = el('filtro-data-fim').value;

  // Quando as duas datas estão vazias, o relatório busca todo o histórico.
  // Os campos continuam liberados para o usuário selecionar novas datas depois de limpar.
  const buscarTudoPorDataVazia = !dataInicio && !dataFim;

  return {
    dataInicio,
    dataFim,
    tipoData: el('filtro-tipo-data').value,
    cliente: norm(el('filtro-cliente').value),
    item: norm(el('filtro-item').value),
    valorMin: parseNumero(el('filtro-valor-min').value),
    valorMax: parseNumero(el('filtro-valor-max').value),
    status: el('filtro-status').value,
    tipoRelatorio: el('filtro-tipo-relatorio').value,
    buscarTudo: buscarTudoPorDataVazia
  };
}

function garantirFiltroInicialData(){
  // A data inicial da página é preenchida no DOMContentLoaded.
  // Depois de limpar os filtros, datas vazias significam consulta geral.
}

function atualizarEstadoBuscarTudo(){
  // Mantido por compatibilidade. Não desabilita mais os campos de data.
  ['filtro-data-inicio','filtro-data-fim','filtro-tipo-data'].forEach(id => {
    const campo = el(id);
    if (campo) campo.disabled = false;
  });
}

function passaFiltroDataComanda(c, filtros){
  if (filtros.buscarTudo) return true;
  const { start, end } = inputDateToRange(filtros.dataInicio, filtros.dataFim);
  if (!start && !end) return true;
  if (filtros.tipoData === 'abertura') return inRange(c.data_abertura, start, end);
  if (filtros.tipoData === 'pagamento') return inRange(c.data_pagamento, start, end) || inRange(c.ultimo_pagamento_em, start, end);
  if (filtros.tipoData === 'exclusao') return inRange(dataExclusaoComanda(c), start, end);
  return inRange(c.data_abertura, start, end) || inRange(c.data_pagamento, start, end) || inRange(c.ultimo_pagamento_em, start, end) || inRange(dataExclusaoComanda(c), start, end);
}

function passaFiltroComanda(c, filtros){
  if (!passaFiltroDataComanda(c, filtros)) return false;
  if (filtros.status !== 'todas' && norm(c.status_comanda) !== norm(filtros.status)) return false;

  const total = totalComanda(c);
  if (filtros.valorMin !== null && total < filtros.valorMin) return false;
  if (filtros.valorMax !== null && total > filtros.valorMax) return false;

  const textoCliente = norm(`${c.cliente || ''} ${c.cliente_nome || ''} ${c.reserva_time_label || ''}`);
  if (filtros.cliente && !textoCliente.includes(filtros.cliente)) return false;

  const textoItens = norm(itensComanda(c).map(i => `${i.nome || ''} ${i.produtoId || ''} ${i.reservaId || ''}`).join(' '));
  if (filtros.item && !textoItens.includes(filtros.item)) return false;

  const temReserva = totalReservasComanda(c) > 0 || (Array.isArray(c.reservas_vinculadas_ids) && c.reservas_vinculadas_ids.length > 0);
  const temProduto = itensComanda(c).some(item => !isItemReserva(item));
  if (filtros.tipoRelatorio === 'com-reserva' && !temReserva) return false;
  if (filtros.tipoRelatorio === 'com-produto' && !temProduto) return false;

  return true;
}

function badgeStatus(status){
  const s = String(status || '').trim();
  const n = norm(s);
  let cls = 'badge-aberta';
  if (n === 'paga') cls = 'badge-paga';
  if (n === 'excluida') cls = 'badge-excluida';
  return `<span class="badge-soft ${cls}">${escapeHtml(s || '-')}</span>`;
}

function montarResumoReservasRegistro(reg){
  const reservas = safeArr(reg.reservas);
  if (!reservas.length) {
    const itens = safeArr(reg.itens_reserva_pagos);
    if (itens.length) return itens.map(i => i.nome || 'Reserva').join(' | ');
    return 'Reserva paga';
  }
  return reservas.map(r => {
    const quadra = r.quadra_nome || r.nome_quadra || r.id_quadra || 'Quadra';
    const data = r.data_reserva || '';
    const hora = r.hora_inicio || '';
    return `${data} ${quadra} ${hora}`.trim();
  }).join(' | ');
}

function valorRegistroReserva(reg){
  const direto = Number(reg.valor_total_reserva || reg.valor_total || 0);
  if (direto > 0) return direto;
  return safeArr(reg.itens_reserva_pagos).reduce((s, item) => s + valorItem(item), 0);
}

function montarReservasPagasUnificadas(){
  const registrosNovos = todosRegistrosReservasPagas.map(reg => {
    const forma = reg.pago_seguinte_forma || reg.forma_pagamento || {};
    return {
      id: reg.id,
      origem: 'novo',
      origemLabel: 'Reservas pagas',
      data: reg.data_registro || reg.data_pagamento || reg.comanda?.data_pagamento || reg.comanda?.data_abertura,
      cliente: reg.cliente_nome_principal || reg.comanda?.cliente || safeArr(reg.clientes)[0]?.nome || '-',
      resumoReserva: montarResumoReservasRegistro(reg),
      valor: valorRegistroReserva(reg),
      dinheiro: Number(forma.dinheiro || 0),
      pix: Number(forma.pix || 0),
      cartao: Number(forma.cartao || 0),
      funcionario: reg.funcionario_que_recebeu || reg.funcionario || '',
      comandaId: reg.comanda_id || reg.comanda?.id || '',
      raw: reg,
      temForma: true
    };
  });

  const comandasComRegistroNovo = new Set(registrosNovos.map(r => String(r.comandaId || '')).filter(Boolean));
  const antigos = todasComandas
    .filter(c => norm(c.status_comanda) === 'paga')
    .filter(c => !comandasComRegistroNovo.has(String(c.id || '')))
    .filter(c => totalReservasComanda(c) > 0)
    .map(c => ({
      id: `antigo-${c.id}`,
      origem: 'antigo',
      origemLabel: 'Antigo / sem forma',
      data: c.data_pagamento || c.data_abertura,
      cliente: c.cliente || '-',
      resumoReserva: itensComanda(c).filter(isItemReserva).map(i => i.nome || 'Reserva').join(' | '),
      valor: totalReservasComanda(c),
      dinheiro: null,
      pix: null,
      cartao: null,
      funcionario: '',
      comandaId: c.id,
      raw: c,
      temForma: false
    }));

  return [...registrosNovos, ...antigos].sort((a,b) => (toDate(b.data)?.getTime() || 0) - (toDate(a.data)?.getTime() || 0));
}

function passaFiltroReservaPaga(r, filtros){
  if (!filtros.buscarTudo) {
    const { start, end } = inputDateToRange(filtros.dataInicio, filtros.dataFim);
    if ((start || end) && !inRange(r.data, start, end)) return false;
  }
  if (filtros.cliente && !norm(r.cliente).includes(filtros.cliente)) return false;
  if (filtros.item && !norm(r.resumoReserva).includes(filtros.item)) return false;
  if (filtros.valorMin !== null && Number(r.valor || 0) < filtros.valorMin) return false;
  if (filtros.valorMax !== null && Number(r.valor || 0) > filtros.valorMax) return false;
  return true;
}

function atualizarResumo(comandas, reservasPagas){
  const valorComandas = comandas.reduce((s,c) => s + totalComanda(c), 0);
  const reservas = comandas.reduce((s,c) => s + totalReservasComanda(c), 0);
  const produtos = comandas.reduce((s,c) => s + totalProdutosComanda(c), 0);
  const antigas = reservasPagas.filter(r => !r.temForma).length;

  el('resumo-comandas').textContent = comandas.length;
  el('resumo-valor-comandas').textContent = fmtBR(valorComandas);
  el('resumo-reservas').textContent = fmtBR(reservas || reservasPagas.reduce((s,r)=>s+Number(r.valor||0),0));
  el('resumo-produtos').textContent = fmtBR(produtos);
  el('resumo-registros-reservas').textContent = reservasPagas.length;
  el('resumo-antigas-sem-forma').textContent = antigas;
}


function tituloTopClientes(tipo){
  if (tipo === 'top-reservas') return 'Top reservas por cliente';
  if (tipo === 'top-produtos') return 'Top produtos por cliente';
  return 'Top compradores por cliente';
}

function isGrupoNaoPagou(c){
  const texto = norm(`${c?.reserva_time_id || ''} ${c?.reserva_time_label || ''} ${c?.comanda_grupo || ''} ${c?.grupo || ''}`);
  return texto.includes('nao pagou') || texto.includes('nao_pago') || texto.includes('grp_nao_pagou');
}

function isComandaValidaParaRanking(c){
  const status = norm(c?.status_comanda || c?.status || '');
  if (isGrupoNaoPagou(c)) return false;
  if (status.includes('cancel')) return false;
  return status === 'paga';
}

function montarTopClientes(comandas, tipo){
  const mapa = new Map();

  comandas.forEach(c => {
    // Ranking de melhores clientes deve considerar somente venda de fato concluída.
    // Exclui comandas abertas, excluídas/canceladas e vínculos marcados como "Não pagou".
    if (!isComandaValidaParaRanking(c)) return;

    const cliente = String(c.cliente || c.cliente_nome || 'Cliente sem nome').trim() || 'Cliente sem nome';
    const key = norm(cliente) || `sem_nome_${c.id || Math.random()}`;
    const reservas = totalReservasComanda(c);
    const produtos = totalProdutosComanda(c);
    const total = totalComanda(c);
    const valorRanking = tipo === 'top-reservas' ? reservas : tipo === 'top-produtos' ? produtos : total;

    if (valorRanking <= 0) return;

    if (!mapa.has(key)) {
      mapa.set(key, {
        id: `top-${mapa.size}`,
        cliente,
        qtdComandas: 0,
        qtdReservas: 0,
        qtdProdutos: 0,
        valorReservas: 0,
        valorProdutos: 0,
        valorTotal: 0,
        valorRanking: 0,
        ultimaData: null,
        comandas: []
      });
    }

    const item = mapa.get(key);
    item.qtdComandas += 1;
    item.valorReservas += reservas;
    item.valorProdutos += produtos;
    item.valorTotal += total;
    item.valorRanking += valorRanking;
    item.qtdReservas += itensComanda(c).filter(isItemReserva).reduce((s, it) => s + Number(it.quantidade || 1), 0);
    item.qtdProdutos += itensComanda(c).filter(it => !isItemReserva(it)).reduce((s, it) => s + Number(it.quantidade || 1), 0);
    item.comandas.push(c);

    const data = toDate(dataOrdenacaoComanda(c));
    if (data && (!item.ultimaData || data > item.ultimaData)) item.ultimaData = data;
  });

  return Array.from(mapa.values())
    .sort((a,b) => (b.valorRanking - a.valorRanking) || (b.valorTotal - a.valorTotal) || a.cliente.localeCompare(b.cliente))
    .map((item, index) => ({ ...item, posicao: index + 1 }));
}

function renderTopClientes(ranking, tipo){
  modoAtual = tipo;
  resultadoAtual = ranking;
  el('titulo-tabela').textContent = tituloTopClientes(tipo);

  const colunaDestaque = tipo === 'top-reservas'
    ? 'Total em reservas'
    : tipo === 'top-produtos'
      ? 'Total em produtos'
      : 'Total comprado';

  el('thead-relatorio').innerHTML = `
    <tr>
      <th class="text-center">#</th>
      <th>Cliente</th>
      <th class="text-end">Comandas</th>
      <th class="text-end">Reservas</th>
      <th class="text-end">Produtos</th>
      <th class="text-end">Qtd. reservas</th>
      <th class="text-end">Qtd. produtos</th>
      <th class="text-end">${colunaDestaque}</th>
      <th>Última movimentação</th>
      <th></th>
    </tr>`;

  if (!ranking.length) {
    el('tbody-relatorio').innerHTML = `<tr><td colspan="10" class="text-center text-muted p-4">Nenhum cliente encontrado para montar o ranking com os filtros informados.</td></tr>`;
    return;
  }

  el('tbody-relatorio').innerHTML = ranking.map(item => `
    <tr>
      <td class="text-center"><span class="rank-badge">${item.posicao}</span></td>
      <td><strong>${escapeHtml(item.cliente)}</strong></td>
      <td class="text-end">${item.qtdComandas}</td>
      <td class="text-end valor">${fmtBR(item.valorReservas)}</td>
      <td class="text-end valor">${fmtBR(item.valorProdutos)}</td>
      <td class="text-end">${item.qtdReservas}</td>
      <td class="text-end">${item.qtdProdutos}</td>
      <td class="text-end valor">${fmtBR(item.valorRanking)}</td>
      <td>${item.ultimaData ? fmtDataHora(item.ultimaData) : '-'}</td>
      <td class="text-end"><button class="btn btn-outline-primary btn-sm" onclick="abrirDetalheTopCliente('${escapeHtml(item.id)}')">Detalhes</button></td>
    </tr>`).join('');
}

function zerarResumo(){
  atualizarResumo([], []);
}

function renderComandas(comandas){
  modoAtual = 'comandas';
  resultadoAtual = comandas;
  el('titulo-tabela').textContent = 'Comandas encontradas';
  el('thead-relatorio').innerHTML = `
    <tr>
      <th>Abertura</th>
      <th>Pagamento</th>
      <th>Exclusão</th>
      <th>Cliente</th>
      <th>Status</th>
      <th>Itens</th>
      <th class="text-end">Reservas</th>
      <th class="text-end">Produtos</th>
      <th class="text-end">Total</th>
      <th></th>
    </tr>`;

  if (!comandas.length) {
    el('tbody-relatorio').innerHTML = `<tr><td colspan="10" class="text-center text-muted p-4">Nenhuma comanda encontrada para os filtros informados.</td></tr>`;
    return;
  }

  el('tbody-relatorio').innerHTML = comandas.map(c => `
    <tr>
      <td>${fmtDataHora(c.data_abertura)}</td>
      <td>${fmtDataHora(c.data_pagamento)}</td>
      <td>${fmtDataHora(dataExclusaoComanda(c))}</td>
      <td><strong>${escapeHtml(c.cliente || '-')}</strong><div class="small text-muted">${escapeHtml(c.reserva_time_label || c.comanda_grupo || '')}</div></td>
      <td>${badgeStatus(c.status_comanda)}</td>
      <td class="text-truncate-2">${resumoItens(c)}</td>
      <td class="text-end valor">${fmtBR(totalReservasComanda(c))}</td>
      <td class="text-end valor">${fmtBR(totalProdutosComanda(c))}</td>
      <td class="text-end valor">${fmtBR(totalComanda(c))}</td>
      <td class="text-end"><button class="btn btn-outline-primary btn-sm" onclick="abrirDetalheComanda('${escapeHtml(c.id)}')">Detalhes</button></td>
    </tr>`).join('');
}

function renderReservasPagas(reservasPagas){
  modoAtual = 'reservas-pagas';
  resultadoAtual = reservasPagas;
  el('titulo-tabela').textContent = 'Reservas pagas e formas de pagamento';
  el('thead-relatorio').innerHTML = `
    <tr>
      <th>Data</th>
      <th>Cliente</th>
      <th>Reserva</th>
      <th class="text-end">Valor reserva</th>
      <th class="text-end">Dinheiro</th>
      <th class="text-end">Pix</th>
      <th class="text-end">Cartão</th>
      <th>Funcionário</th>
      <th>Origem</th>
      <th></th>
    </tr>`;

  if (!reservasPagas.length) {
    el('tbody-relatorio').innerHTML = `<tr><td colspan="10" class="text-center text-muted p-4">Nenhuma reserva paga encontrada para os filtros informados.</td></tr>`;
    return;
  }

  el('tbody-relatorio').innerHTML = reservasPagas.map(r => `
    <tr>
      <td>${fmtDataHora(r.data)}</td>
      <td><strong>${escapeHtml(r.cliente || '-')}</strong></td>
      <td class="text-truncate-2">${escapeHtml(r.resumoReserva || '-')}</td>
      <td class="text-end valor">${fmtBR(r.valor)}</td>
      <td class="text-end">${r.temForma ? fmtBR(r.dinheiro) : '<span class="text-muted">-</span>'}</td>
      <td class="text-end">${r.temForma ? fmtBR(r.pix) : '<span class="text-muted">-</span>'}</td>
      <td class="text-end">${r.temForma ? fmtBR(r.cartao) : '<span class="text-muted">-</span>'}</td>
      <td>${escapeHtml(r.funcionario || (r.temForma ? '-' : 'Não informado'))}</td>
      <td><span class="badge-soft ${r.temForma ? 'badge-novo' : 'badge-antigo'}">${escapeHtml(r.origemLabel)}</span></td>
      <td class="text-end"><button class="btn btn-outline-primary btn-sm" onclick="abrirDetalheReservaPaga('${escapeHtml(r.id)}')">Detalhes</button></td>
    </tr>`).join('');
}

function aplicarFiltros(){
  const filtros = getFiltros();
  const comandasFiltradas = todasComandas
    .filter(c => passaFiltroComanda(c, filtros))
    .sort((a,b) => (toDate(dataOrdenacaoComanda(b))?.getTime() || 0) - (toDate(dataOrdenacaoComanda(a))?.getTime() || 0));
  const reservasPagasTodas = montarReservasPagasUnificadas();
  const reservasPagasFiltradas = reservasPagasTodas.filter(r => passaFiltroReservaPaga(r, filtros));

  atualizarResumo(comandasFiltradas, reservasPagasFiltradas);

  if (filtros.tipoRelatorio === 'reservas-pagas') {
    renderReservasPagas(reservasPagasFiltradas);
  } else if (['top-compradores', 'top-reservas', 'top-produtos'].includes(filtros.tipoRelatorio)) {
    renderTopClientes(montarTopClientes(comandasFiltradas, filtros.tipoRelatorio), filtros.tipoRelatorio);
  } else {
    renderComandas(comandasFiltradas);
  }

  const modo = filtros.buscarTudo ? 'todos os períodos' : `${filtros.dataInicio || '...'} até ${filtros.dataFim || '...'}`;
  el('status-carregamento').textContent = `Base carregada: ${todasComandas.length} comandas • ${todosRegistrosReservasPagas.length} registros em Reservas pagas • Período: ${modo}`;
}

async function consultarComandasPorData(filtros){
  if (filtros.buscarTudo) {
    const snap = await db.collection('comandas').get();
    const lista = [];
    snap.forEach(doc => lista.push({ id: doc.id, ...(doc.data() || {}) }));
    return lista;
  }

  const { start, end } = inputDateToRange(filtros.dataInicio, filtros.dataFim);
  if (!start && !end) return [];

  const campos = filtros.tipoData === 'abertura' ? ['data_abertura']
    : filtros.tipoData === 'pagamento' ? ['data_pagamento', 'ultimo_pagamento_em']
    : filtros.tipoData === 'exclusao' ? ['data_exclusao', 'excluida_em']
    : ['data_abertura', 'data_pagamento', 'ultimo_pagamento_em', 'data_exclusao', 'excluida_em'];

  const byId = new Map();
  for (const campo of campos) {
    try {
      let ref = db.collection('comandas');
      if (start) ref = ref.where(campo, '>=', timestampFromDate(start));
      if (end) ref = ref.where(campo, '<=', timestampFromDate(end));
      const snap = await ref.get();
      snap.forEach(doc => byId.set(doc.id, { id: doc.id, ...(doc.data() || {}) }));
    } catch (erro) {
      console.warn(`Falha ao consultar comandas pelo campo ${campo}. Continuando com os outros campos.`, erro);
    }
  }

  return Array.from(byId.values());
}

async function consultarReservasPagasPorData(filtros){
  try {
    if (filtros.buscarTudo) {
      const snap = await db.collection('Reservas pagas').get();
      const lista = [];
      snap.forEach(doc => lista.push({ id: doc.id, ...(doc.data() || {}) }));
      return lista;
    }

    const { start, end } = inputDateToRange(filtros.dataInicio, filtros.dataFim);
    if (!start && !end) return [];

    const campos = ['data_registro', 'data_pagamento'];
    const byId = new Map();
    for (const campo of campos) {
      try {
        let ref = db.collection('Reservas pagas');
        if (start) ref = ref.where(campo, '>=', timestampFromDate(start));
        if (end) ref = ref.where(campo, '<=', timestampFromDate(end));
        const snap = await ref.get();
        snap.forEach(doc => byId.set(doc.id, { id: doc.id, ...(doc.data() || {}) }));
      } catch (erroCampo) {
        console.warn(`Falha ao consultar Reservas pagas pelo campo ${campo}.`, erroCampo);
      }
    }
    return Array.from(byId.values());
  } catch (err) {
    console.warn('Não foi possível ler a coleção Reservas pagas. Continuando somente com comandas antigas.', err);
    return [];
  }
}

async function carregarBase(){
  garantirFiltroInicialData();
  atualizarEstadoBuscarTudo();
  const filtros = getFiltros();

  el('status-carregamento').textContent = filtros.buscarTudo
    ? 'Carregando todos os períodos...'
    : 'Carregando somente o período filtrado...';
  el('tbody-relatorio').innerHTML = `<tr><td class="text-center text-muted p-4">Carregando dados...</td></tr>`;
  zerarResumo();

  try {
    const [comandas, reservasPagas] = await Promise.all([
      consultarComandasPorData(filtros),
      consultarReservasPagasPorData(filtros)
    ]);

    todasComandas = comandas.sort((a,b) => (toDate(dataOrdenacaoComanda(b))?.getTime() || 0) - (toDate(dataOrdenacaoComanda(a))?.getTime() || 0));
    todosRegistrosReservasPagas = reservasPagas.sort((a,b) => (toDate(b.data_registro || b.data_pagamento)?.getTime() || 0) - (toDate(a.data_registro || a.data_pagamento)?.getTime() || 0));

    aplicarFiltros();
  } catch (erro) {
    console.error('Erro ao carregar relatório:', erro);
    el('status-carregamento').textContent = 'Erro ao carregar dados.';
    el('tbody-relatorio').innerHTML = `<tr><td class="text-center text-danger p-4">Erro ao carregar relatório. Veja o console do navegador.</td></tr>`;
  }
}

function detalheItensHtml(itens){
  const lista = agruparItensRelatorio(itens);
  if (!lista.length) return '<p class="text-muted">Sem itens.</p>';
  return `<div class="table-responsive"><table class="table table-sm table-bordered"><thead><tr><th>Item</th><th class="text-end">Qtd.</th><th class="text-end">Valor unit.</th><th class="text-end">Total</th><th>Reserva ID</th></tr></thead><tbody>${lista.map(item => `<tr><td>${escapeHtml(item.nome || '')}</td><td class="text-end">${escapeHtml(item.quantidade || 1)}</td><td class="text-end">${fmtBR(item.preco_venda || 0)}</td><td class="text-end">${fmtBR(valorItem(item))}</td><td>${escapeHtml(item.reservaId || '')}</td></tr>`).join('')}</tbody></table></div>`;
}


function historicoPagamentosHtml(comanda){
  const pagamentos = safeArr(comanda?.pagamentos_parciais);
  if (!pagamentos.length) return '';
  return `
    <h6 class="mt-3">Histórico de pagamentos</h6>
    <div class="table-responsive">
      <table class="table table-sm table-bordered">
        <thead><tr><th>Data</th><th class="text-end">Valor pago</th><th class="text-end">Valor recebido</th><th>Itens pagos</th></tr></thead>
        <tbody>
          ${pagamentos.map(p => {
            const itens = agruparItensRelatorio(safeArr(p.itens_pagos)).map(i => `${i.quantidade || 1}x ${i.nome || ''}`).join(' | ');
            return `<tr><td>${fmtDataHora(p.data_pagamento)}</td><td class="text-end">${fmtBR(p.valor_pago || 0)}</td><td class="text-end">${fmtBR(p.valor_recebido || 0)}</td><td>${escapeHtml(itens || '-')}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}


function idsReservasDaComanda(comanda){
  const ids = new Set();
  safeArr(comanda?.reservas_vinculadas_ids).forEach(id => {
    if (id) ids.add(String(id));
  });
  safeArr(comanda?.reservas_ids).forEach(id => {
    if (id) ids.add(String(id));
  });
  itensComanda(comanda).forEach(item => {
    if (item?.reservaId) ids.add(String(item.reservaId));
    if (item?.reserva_id) ids.add(String(item.reserva_id));
  });
  return ids;
}

function idsReservasDoRegistroPago(registroRaw){
  const ids = new Set();
  safeArr(registroRaw?.reservas_ids).forEach(id => {
    if (id) ids.add(String(id));
  });
  safeArr(registroRaw?.reservaIds).forEach(id => {
    if (id) ids.add(String(id));
  });
  safeArr(registroRaw?.reservas).forEach(r => {
    const id = r?.id || r?.reservaId || r?.reserva_id;
    if (id) ids.add(String(id));
  });
  safeArr(registroRaw?.itens_reserva_pagos).forEach(item => {
    const id = item?.reservaId || item?.reserva_id;
    if (id) ids.add(String(id));
  });
  return ids;
}

function registrosReservasPagasDaComanda(comanda){
  const comandaId = String(comanda?.id || '');
  const idsComanda = idsReservasDaComanda(comanda);

  return montarReservasPagasUnificadas().filter(reg => {
    if (comandaId && String(reg.comandaId || '') === comandaId) return true;

    const idsRegistro = idsReservasDoRegistroPago(reg.raw || {});
    for (const id of idsRegistro) {
      if (idsComanda.has(id)) return true;
    }
    return false;
  });
}

function formaPagamentoReservasComandaHtml(comanda){
  const temReserva = totalReservasComanda(comanda) > 0 || idsReservasDaComanda(comanda).size > 0;
  if (!temReserva) return '';

  const registros = registrosReservasPagasDaComanda(comanda);
  if (!registros.length) {
    return `
      <h6 class="mt-3">Forma de pagamento das reservas</h6>
      <div class="alert alert-warning py-2 mb-3">
        Esta comanda possui reserva, mas não encontrei registro na coleção <strong>Reservas pagas</strong> para exibir dinheiro, pix, cartão e funcionário.
        Pode ser uma comanda antiga ou um pagamento anterior à nova forma de registro.
      </div>`;
  }

  const totalReserva = registros.reduce((s, r) => s + Number(r.valor || 0), 0);
  const totalDinheiro = registros.reduce((s, r) => s + (r.temForma ? Number(r.dinheiro || 0) : 0), 0);
  const totalPix = registros.reduce((s, r) => s + (r.temForma ? Number(r.pix || 0) : 0), 0);
  const totalCartao = registros.reduce((s, r) => s + (r.temForma ? Number(r.cartao || 0) : 0), 0);

  return `
    <h6 class="mt-3">Forma de pagamento das reservas</h6>
    <div class="row g-2 mb-2">
      <div class="col-md-3"><div class="metric-card"><span>Valor reservas</span><strong>${fmtBR(totalReserva)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Dinheiro</span><strong>${fmtBR(totalDinheiro)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Pix</span><strong>${fmtBR(totalPix)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Cartão</span><strong>${fmtBR(totalCartao)}</strong></div></div>
    </div>
    <div class="table-responsive mb-3">
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Data registro</th>
            <th>Reserva</th>
            <th class="text-end">Valor</th>
            <th class="text-end">Dinheiro</th>
            <th class="text-end">Pix</th>
            <th class="text-end">Cartão</th>
            <th>Funcionário</th>
            <th>Origem</th>
          </tr>
        </thead>
        <tbody>
          ${registros.map(r => `
            <tr>
              <td>${fmtDataHora(r.data)}</td>
              <td>${escapeHtml(r.resumoReserva || '-')}</td>
              <td class="text-end">${fmtBR(r.valor)}</td>
              <td class="text-end">${r.temForma ? fmtBR(r.dinheiro) : '<span class="text-muted">-</span>'}</td>
              <td class="text-end">${r.temForma ? fmtBR(r.pix) : '<span class="text-muted">-</span>'}</td>
              <td class="text-end">${r.temForma ? fmtBR(r.cartao) : '<span class="text-muted">-</span>'}</td>
              <td>${escapeHtml(r.funcionario || (r.temForma ? '-' : 'Registro antigo'))}</td>
              <td><span class="badge-soft ${r.temForma ? 'badge-novo' : 'badge-antigo'}">${escapeHtml(r.origemLabel)}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

window.abrirDetalheComanda = function(comandaId){
  const c = todasComandas.find(x => String(x.id) === String(comandaId));
  if (!c) return;
  el('modalDetalheRelatorioLabel').textContent = `Comanda - ${c.cliente || ''}`;
  const obs = c.obs_exclusao || c.motivo_nao_pago || c.obs_nao_pago || c.obs || '';
  el('modal-detalhe-body').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-3"><div class="metric-card"><span>Status</span><strong>${escapeHtml(c.status_comanda || '-')}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Abertura</span><strong>${fmtDataHora(c.data_abertura)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Pagamento</span><strong>${fmtDataHora(c.data_pagamento)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Exclusão</span><strong>${fmtDataHora(dataExclusaoComanda(c))}</strong></div></div>
    </div>
    <div class="row g-2 mb-3">
      <div class="col-md-4"><div class="metric-card"><span>Total</span><strong>${fmtBR(totalComanda(c))}</strong></div></div>
      <div class="col-md-4"><div class="metric-card"><span>Reservas</span><strong>${fmtBR(totalReservasComanda(c))}</strong></div></div>
      <div class="col-md-4"><div class="metric-card"><span>Produtos</span><strong>${fmtBR(totalProdutosComanda(c))}</strong></div></div>
    </div>
    <p><strong>Cliente:</strong> ${escapeHtml(c.cliente || '-')}</p>
    <p><strong>Vínculo:</strong> ${escapeHtml(c.reserva_time_label || c.comanda_grupo || '-')}</p>
    <p><strong>Reservas vinculadas:</strong> ${escapeHtml(safeArr(c.reservas_vinculadas_ids).join(', ') || '-')}</p>
    <p><strong>Obs / motivo:</strong> ${escapeHtml(obs || '-')}</p>
    <h6>Itens</h6>
    ${detalheItensHtml(itensComanda(c))}
    ${formaPagamentoReservasComandaHtml(c)}
    ${historicoPagamentosHtml(c)}
  `;
  modalDetalhe.show();
};

window.abrirDetalheReservaPaga = function(id){
  const registros = montarReservasPagasUnificadas();
  const r = registros.find(x => String(x.id) === String(id));
  if (!r) return;
  el('modalDetalheRelatorioLabel').textContent = `Reserva paga - ${r.cliente || ''}`;
  const raw = r.raw || {};
  const itens = r.origem === 'antigo' ? itensComanda(raw).filter(isItemReserva) : safeArr(raw.itens_reserva_pagos);
  el('modal-detalhe-body').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-3"><div class="metric-card"><span>Valor reserva</span><strong>${fmtBR(r.valor)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Dinheiro</span><strong>${r.temForma ? fmtBR(r.dinheiro) : 'Antigo'}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Pix</span><strong>${r.temForma ? fmtBR(r.pix) : 'Sem forma'}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Cartão</span><strong>${r.temForma ? fmtBR(r.cartao) : '-'}</strong></div></div>
    </div>
    <p><strong>Cliente:</strong> ${escapeHtml(r.cliente || '-')}</p>
    <p><strong>Data:</strong> ${fmtDataHora(r.data)}</p>
    <p><strong>Reserva:</strong> ${escapeHtml(r.resumoReserva || '-')}</p>
    <p><strong>Funcionário que recebeu:</strong> ${escapeHtml(r.funcionario || (r.temForma ? '-' : 'Registro antigo sem informação'))}</p>
    <p><strong>Origem:</strong> ${escapeHtml(r.origemLabel)}</p>
    <p><strong>Comanda ID:</strong> ${escapeHtml(r.comandaId || '-')}</p>
    <h6>Itens de reserva</h6>
    ${detalheItensHtml(itens)}
  `;
  modalDetalhe.show();
};


window.abrirDetalheTopCliente = function(id){
  const item = resultadoAtual.find(x => String(x.id) === String(id));
  if (!item) return;

  el('modalDetalheRelatorioLabel').textContent = `Top cliente - ${item.cliente || ''}`;
  const linhas = item.comandas
    .slice()
    .sort((a,b) => (toDate(dataOrdenacaoComanda(b))?.getTime() || 0) - (toDate(dataOrdenacaoComanda(a))?.getTime() || 0))
    .map(c => `
      <tr>
        <td>${fmtDataHora(dataOrdenacaoComanda(c))}</td>
        <td>${badgeStatus(c.status_comanda)}</td>
        <td class="text-truncate-2">${resumoItens(c)}</td>
        <td class="text-end">${fmtBR(totalReservasComanda(c))}</td>
        <td class="text-end">${fmtBR(totalProdutosComanda(c))}</td>
        <td class="text-end valor">${fmtBR(totalComanda(c))}</td>
      </tr>`).join('');

  el('modal-detalhe-body').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-3"><div class="metric-card"><span>Comandas</span><strong>${item.qtdComandas}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Reservas</span><strong>${fmtBR(item.valorReservas)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Produtos</span><strong>${fmtBR(item.valorProdutos)}</strong></div></div>
      <div class="col-md-3"><div class="metric-card"><span>Total</span><strong>${fmtBR(item.valorTotal)}</strong></div></div>
    </div>
    <p><strong>Cliente:</strong> ${escapeHtml(item.cliente || '-')}</p>
    <p><strong>Qtd. reservas:</strong> ${escapeHtml(item.qtdReservas || 0)} &nbsp; <strong>Qtd. produtos:</strong> ${escapeHtml(item.qtdProdutos || 0)}</p>
    <h6>Comandas usadas neste ranking</h6>
    <div class="table-responsive">
      <table class="table table-sm table-bordered align-middle">
        <thead>
          <tr>
            <th>Data</th>
            <th>Status</th>
            <th>Itens</th>
            <th class="text-end">Reservas</th>
            <th class="text-end">Produtos</th>
            <th class="text-end">Total</th>
          </tr>
        </thead>
        <tbody>${linhas || '<tr><td colspan="6" class="text-center text-muted">Sem comandas.</td></tr>'}</tbody>
      </table>
    </div>`;

  modalDetalhe.show();
};

function limparFiltros(){
  ['filtro-cliente','filtro-item','filtro-valor-min','filtro-valor-max'].forEach(id => el(id).value = '');

  // Limpar filtros remove as datas e deixa os campos livres.
  // Datas vazias significam consultar todos os períodos; depois o usuário pode selecionar novas datas normalmente.
  el('filtro-data-inicio').value = '';
  el('filtro-data-fim').value = '';
  el('filtro-tipo-data').value = 'qualquer';
  el('filtro-status').value = 'todas';
  el('filtro-tipo-relatorio').value = 'todas';
  atualizarEstadoBuscarTudo();
  carregarBase();
}

function csvEscape(v){
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function exportarCSV(){
  let linhas = [];
  if (modoAtual === 'reservas-pagas') {
    linhas.push(['Data','Cliente','Reserva','Valor','Dinheiro','Pix','Cartão','Funcionário','Origem','Comanda ID']);
    resultadoAtual.forEach(r => linhas.push([
      fmtDataHora(r.data), r.cliente, r.resumoReserva, Number(r.valor || 0).toFixed(2),
      r.temForma ? Number(r.dinheiro || 0).toFixed(2) : '',
      r.temForma ? Number(r.pix || 0).toFixed(2) : '',
      r.temForma ? Number(r.cartao || 0).toFixed(2) : '',
      r.funcionario || '', r.origemLabel, r.comandaId || ''
    ]));
  } else if (['top-compradores', 'top-reservas', 'top-produtos'].includes(modoAtual)) {
    linhas.push(['Posição','Cliente','Comandas','Valor reservas','Valor produtos','Qtd reservas','Qtd produtos','Total ranking','Total geral','Última movimentação']);
    resultadoAtual.forEach(item => linhas.push([
      item.posicao, item.cliente, item.qtdComandas,
      Number(item.valorReservas || 0).toFixed(2),
      Number(item.valorProdutos || 0).toFixed(2),
      item.qtdReservas || 0, item.qtdProdutos || 0,
      Number(item.valorRanking || 0).toFixed(2),
      Number(item.valorTotal || 0).toFixed(2),
      item.ultimaData ? fmtDataHora(item.ultimaData) : ''
    ]));
  } else {
    linhas.push(['Abertura','Pagamento','Exclusão','Cliente','Status','Obs/Motivo','Itens','Reservas','Produtos','Total','Reservas vinculadas']);
    resultadoAtual.forEach(c => linhas.push([
      fmtDataHora(c.data_abertura), fmtDataHora(c.data_pagamento), fmtDataHora(dataExclusaoComanda(c)), c.cliente || '', c.status_comanda || '',
      c.obs_exclusao || c.motivo_nao_pago || c.obs_nao_pago || c.obs || '',
      agruparItensRelatorio(itensComanda(c)).map(i => `${i.quantidade || 1}x ${i.nome || ''} (${Number(valorItem(i)).toFixed(2)})`).join(' | '),
      totalReservasComanda(c).toFixed(2), totalProdutosComanda(c).toFixed(2), totalComanda(c).toFixed(2),
      safeArr(c.reservas_vinculadas_ids).join(' | ')
    ]));
  }

  const csv = linhas.map(l => l.map(csvEscape).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-comandas-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  modalDetalhe = new bootstrap.Modal(document.getElementById('modalDetalheRelatorio'));

  const hoje = hojeISO();
  el('filtro-data-inicio').value = hoje;
  el('filtro-data-fim').value = hoje;
  atualizarEstadoBuscarTudo();

  el('btn-buscar').addEventListener('click', carregarBase);
  el('btn-limpar').addEventListener('click', limparFiltros);
  el('btn-atualizar-base').addEventListener('click', carregarBase);
  el('btn-exportar-csv').addEventListener('click', exportarCSV);

  ['filtro-cliente','filtro-item','filtro-valor-min','filtro-valor-max'].forEach(id => {
    el(id).addEventListener('keydown', ev => {
      if (ev.key === 'Enter') carregarBase();
    });
  });

  ['filtro-status','filtro-tipo-relatorio'].forEach(id => {
    el(id).addEventListener('change', aplicarFiltros);
  });

  carregarBase();
});
