
        // =========================================================
        // Configuração e Inicialização do Firebase
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

        // =========================================================
        // Variáveis Globais e Elementos HTML
        // =========================================================
        let todosProdutos = [];
        let todosClientes = {};
        let todasQuadras = {};
        let comandasAbertas = {};
        let carrinho = {};

        // Cache de reservas não pagas (aguardando/atrasada) para alertas e busca
        let __naoPagasCache = { hoje: '', list: [], byCliente: new Map() };
        let totalVenda = 0;
        let tipoFiltroHistorico = 'Ambos';
        
        let comandaAtualId = null; // Para rastrear qual comanda está sendo gerenciada
        let comandaAtualData = null; // Armazena os dados da comanda para o modal de pagamento

        // NOVO: Armazena as reservas buscadas para acesso no modal de seleção
        let reservasFuturasDoCliente = []; 

        const listaItensVendaEl = document.getElementById('lista-itens-venda');
        const campoCodigoBarrasEl = document.getElementById('campo-codigo-barras');
        const selecionarProdutoEl = document.getElementById('selecionar-produto');
        const quantidadeManualEl = document.getElementById('quantidade-manual');
        const totalVendaEl = document.getElementById('total-venda');
        const subtotalEl = document.getElementById('subtotal');
        const finalizarVendaBtn = document.getElementById('finalizar-venda-btn');
        const cortesiaPercaBtn = document.getElementById('cortesia-perca-btn');

        // Elementos da seção de Comandas
        const btnSalvarComanda = document.getElementById('btn-salvar-comanda');
        const clienteCadastradoInput = document.getElementById('cliente-cadastrado');
        const listaClientesDatalist = document.getElementById('lista-clientes-datalist');
        const listaComandasEl = document.getElementById('lista-comandas');
        const listaReservasDiaEl = document.getElementById('lista-reservas-dia');
        
        // Elementos do Modal de Adicionar Item
        const adicionarItemModal = new bootstrap.Modal(document.getElementById('adicionarItemModal'));
        const adicionarItemModalLabel = document.getElementById('adicionarItemModalLabel');
        const selecionarProdutoComandaEl = document.getElementById('selecionar-produto-comanda');
        const quantidadeProdutoComandaEl = document.getElementById('quantidade-produto-comanda');
        const btnAdicionarItemManual = document.getElementById('btn-adicionar-item-manual');

        // Elementos do Modal de Adicionar Reservas dentro da comanda
        const btnAbrirModalReservasComanda = document.getElementById('btn-abrir-modal-reservas-comanda');
        const modalAdicionarReservasComandaEl = document.getElementById('modalAdicionarReservasComanda');
        const modalAdicionarReservasComanda = modalAdicionarReservasComandaEl ? new bootstrap.Modal(modalAdicionarReservasComandaEl) : null;
        const modalAdicionarReservasComandaLabel = document.getElementById('modalAdicionarReservasComandaLabel');
        const reservasComandaInfoEl = document.getElementById('reservas-comanda-info');
        const reservasComandaBuscaEl = document.getElementById('reservas-comanda-busca');
        const reservasComandaTbodyEl = document.getElementById('reservas-comanda-tbody');
        const reservasComandaSelecionarTodasEl = document.getElementById('reservas-comanda-selecionar-todas');
        const btnAtualizarReservasComanda = document.getElementById('btn-atualizar-reservas-comanda');
        const btnConfirmarAdicionarReservasComanda = document.getElementById('btn-confirmar-adicionar-reservas-comanda');
        let reservasDisponiveisParaComanda = [];
        let modoReservasComanda = 'hoje';
        let clienteReservasComandaId = null;
        
        // Elementos do Modal de Pagamento
        const pagamentoModal = new bootstrap.Modal(document.getElementById('pagamentoModal'));
        const pagamentoModalLabel = document.getElementById('pagamentoModalLabel');
        const listaItensPagamentoEl = document.getElementById('lista-itens-pagamento');
        const valorRecebidoInput = document.getElementById('valor-recebido');
        const totalPagarEl = document.getElementById('total-pagar');
        const saldoRestanteEl = document.getElementById('saldo-restante');
        const btnFinalizarPagamentoModal = document.getElementById('btn-finalizar-pagamento-modal');

        // Elementos do Modal de Forma de Pagamento das Reservas
        const modalFormaPagamentoReservaEl = document.getElementById('modalFormaPagamentoReserva');
        const modalFormaPagamentoReserva = modalFormaPagamentoReservaEl ? new bootstrap.Modal(modalFormaPagamentoReservaEl) : null;
        const formaReservaSubtituloEl = document.getElementById('forma-reserva-subtitulo');
        const formaReservaTotalEl = document.getElementById('forma-reserva-total');
        const formaReservaDetalhesEl = document.getElementById('forma-reserva-detalhes');
        const formaReservaDinheiroEl = document.getElementById('forma-reserva-dinheiro');
        const formaReservaPixEl = document.getElementById('forma-reserva-pix');
        const formaReservaCartaoEl = document.getElementById('forma-reserva-cartao');
        const formaReservaFuncionarioEl = document.getElementById('forma-reserva-funcionario');
        const formaReservaTotalInformadoEl = document.getElementById('forma-reserva-total-informado');
        const formaReservaDiferencaEl = document.getElementById('forma-reserva-diferenca');
        const btnSalvarFormaPagamentoReserva = document.getElementById('btn-salvar-forma-pagamento-reserva');
        const btnPularRegistroFormaReserva = document.getElementById('btn-pular-registro-forma-reserva');
        let pagamentoReservasPendente = null;
        
        // Novos elementos para Reservas Futuras
        const clienteBuscaInput = document.getElementById('cliente-busca-reserva');
        const mesBuscaEl = document.getElementById('mes-busca');
        const anoBuscaEl = document.getElementById('ano-busca');
        const btnBuscarReservasFuturas = document.getElementById('btn-buscar-reservas-futuras');
        const modalReservasFuturas = new bootstrap.Modal(document.getElementById('modalReservasFuturas'));
        const modalReservasFuturasLabel = document.getElementById('modalReservasFuturasLabel');
        const nomeClienteModalEl = document.getElementById('nome-cliente-modal');
        const listaReservasFuturasEl = document.getElementById('lista-reservas-futuras');
        const btnAbrirComandaFuturas = document.getElementById('btn-abrir-comanda-futuras');
        const selecionarTodasReservasEl = document.getElementById('selecionar-todas-reservas');

        // Novos elementos para Histórico de Vendas
        const filtroDataEl = document.getElementById('filtro-data');
        const listaHistoricoEl = document.getElementById('lista-historico');
        const btnFiltroAmbos = document.getElementById('btn-filtro-ambos');
        const btnFiltroComandas = document.getElementById('btn-filtro-comandas');
        const btnFiltroVendas = document.getElementById('btn-filtro-vendas');
        
        // Modal de Detalhes da Venda/Comanda
        const modalDetalhesVenda = new bootstrap.Modal(document.getElementById('modalDetalhesVenda'));
        const modalDetalhesVendaLabel = document.getElementById('modalDetalhesVendaLabel');
        const detalhesTipoEl = document.getElementById('detalhes-tipo');
        const detalhesClienteEl = document.getElementById('detalhes-cliente');
        const detalhesTotalEl = document.getElementById('detalhes-total');
        const detalhesDataEl = document.getElementById('detalhes-data');
        const detalhesItensEl = document.getElementById('detalhes-itens');


        // =========================================================
        // Funções de Utilitário
        // =========================================================

        /**
         * Formata a data de AAAA-MM-DD para DD/MM/AAAA e calcula o dia da semana.
         * @param {string} dataString Data no formato AAAA-MM-DD.
         * @returns {{ formatoData: string, diaDaSemana: string }}
         */
        function formatarDataEObterDiaDaSemana(dataString) {
            const [ano, mes, dia] = dataString.split('-');
            // O mês em JS é 0-indexado, então subtraímos 1
            const dataObj = new Date(ano, mes - 1, dia); 

            const formatoData = `${dia}/${mes}/${ano}`;
            
            const diasDaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            // getDay() retorna 0 (domingo) a 6 (sábado)
            const diaDaSemana = diasDaSemana[dataObj.getDay()]; 

            return { formatoData, diaDaSemana };
        }


/**
 * Escapa HTML básico para evitar quebrar o layout ao inserir texto vindo do banco.
 * @param {any} s
 * @returns {string}
 */

function __limparBackdropBootstrapSeNecessario(){
  setTimeout(() => {
    if (document.querySelector('.modal.show')) return;
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }, 350);
}



function __calcularTotaisComandaParaExclusao(comandaData){
  const itens = Array.isArray(comandaData?.itens) ? comandaData.itens : [];
  const isReserva = (item) => {
    const nome = String(item?.nome || '').toLowerCase();
    const produtoId = String(item?.produtoId || '').toLowerCase();
    return produtoId === 'reserva-quadra' || nome.startsWith('reserva de quadra') || nome.includes('reserva de quadra');
  };
  const valorItem = (item) => Number(item?.preco_venda || item?.valor || 0) * Number(item?.quantidade || 1);
  const reservas = itens.filter(isReserva).reduce((s, item) => s + valorItem(item), 0);
  const produtos = itens.filter(item => !isReserva(item)).reduce((s, item) => s + valorItem(item), 0);
  const totalSalvo = Number(comandaData?.valor_total || 0);
  const total = totalSalvo > 0 ? totalSalvo : (reservas + produtos);
  return { total, reservas, produtos };
}

function __fecharModaisAdicionarReservaComanda(){
  const fecharOuter = () => {
    try {
      const outerEl = document.getElementById('adicionarItemModal');
      const outerInst = outerEl ? (bootstrap.Modal.getInstance(outerEl) || bootstrap.Modal.getOrCreateInstance(outerEl)) : adicionarItemModal;
      if (outerInst) outerInst.hide();
    } catch (_) {}
    __limparBackdropBootstrapSeNecessario();
  };

  try {
    const innerEl = document.getElementById('modalAdicionarReservasComanda');
    const innerInst = innerEl ? (bootstrap.Modal.getInstance(innerEl) || bootstrap.Modal.getOrCreateInstance(innerEl)) : modalAdicionarReservasComanda;
    if (innerEl && innerEl.classList.contains('show') && innerInst) {
      innerEl.addEventListener('hidden.bs.modal', fecharOuter, { once: true });
      innerInst.hide();
      setTimeout(fecharOuter, 260);
      return;
    }
    if (innerInst) innerInst.hide();
  } catch (_) {}
  fecharOuter();
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));
}



function __ensureCompactAcoesReservaCSS(){
  if (document.getElementById('css-acoes-reserva')) return;
  const st = document.createElement('style');
  st.id = 'css-acoes-reserva';
  st.textContent = `
    .acoes-reserva{display:flex; gap:10px; align-items:center; justify-content:flex-start;}
    .acoes-reserva .btn-acao-reserva{flex:1; min-width:120px; border-radius:999px; padding:8px 12px; font-weight:600;}
    @media (max-width: 768px){
      .acoes-reserva{flex-direction:column; align-items:stretch;}
      .acoes-reserva .btn-acao-reserva{min-width:auto;}
    }
  `;
  document.head.appendChild(st);
}

        // =========================================================
        // Funções da Venda Direta (Demais Funções Omitidas para Foco, mas mantidas no código final)
        // =========================================================

        /**
         * Carrega todos os produtos do Firebase, os ordena alfabeticamente
         * e os armazena na variável global 'todosProdutos'.
         */
        async function carregarProdutos() {
            try {
                const produtosRef = db.collection('produtos');
                const snapshot = await produtosRef.get();
                
                todosProdutos = [];
                selecionarProdutoEl.innerHTML = '<option selected disabled>Selecione um Produto...</option>';
                selecionarProdutoComandaEl.innerHTML = '<option selected disabled>Selecione um Produto...</option>';

                snapshot.forEach(doc => {
                    const produto = doc.data();
                    produto.id = doc.id;
                    todosProdutos.push(produto);
                });
                
                // Ordena os produtos por nome em ordem alfabética
                todosProdutos.sort((a, b) => a.nome.localeCompare(b.nome));

                todosProdutos.forEach(produto => {
                    // Adiciona a opção para a venda direta
                    const optionDireta = document.createElement('option');
                    optionDireta.value = produto.id;
                    optionDireta.textContent = produto.nome;
                    selecionarProdutoEl.appendChild(optionDireta);

                    // Adiciona a opção para o modal de comandas
                    const optionComanda = document.createElement('option');
                    optionComanda.value = produto.id;
                    optionComanda.textContent = produto.nome;
                    selecionarProdutoComandaEl.appendChild(optionComanda);
                });
                
                console.log("Produtos carregados com sucesso. Total:", todosProdutos.length);
                
                campoCodigoBarrasEl.disabled = false;
                selecionarProdutoEl.disabled = false;
                quantidadeManualEl.disabled = false;
                const btnAdicionarItemVenda2 = document.getElementById('btn-adicionar-item-venda');
                if (btnAdicionarItemVenda2) btnAdicionarItemVenda2.disabled = false;
                
                campoCodigoBarrasEl.focus();
            } catch (error) {
                console.error("Erro ao carregar os produtos:", error);
                const optionErro = document.createElement('option');
                optionErro.textContent = "Erro ao carregar produtos";
                selecionarProdutoEl.appendChild(optionErro);
                selecionarProdutoComandaEl.appendChild(optionErro.cloneNode(true));
            }
        }
        
        /**
         * Adiciona um produto ao carrinho ou aumenta sua quantidade.
         */
        function adicionarAoCarrinho(produto, quantidade = 1) {
            if (carrinho[produto.id]) {
                carrinho[produto.id].quantidade += quantidade;
            } else {
                carrinho[produto.id] = {
                    nome: produto.nome,
                    preco_venda: produto.preco_venda,
                    quantidade: quantidade,
                    produtoId: produto.id
                };
            }
            atualizarCarrinhoHTML();
            calcularTotal();
            finalizarVendaBtn.disabled = false;
            cortesiaPercaBtn.disabled = false;
        }

        /**
         * Remove um produto do carrinho.
         */
        function removerDoCarrinho(produtoId) {
            delete carrinho[produtoId];
            atualizarCarrinhoHTML();
            calcularTotal();
            if (Object.keys(carrinho).length === 0) {
                finalizarVendaBtn.disabled = true;
                cortesiaPercaBtn.disabled = true;
            }
        }

        /**
         * Atualiza a exibição do carrinho no HTML.
         */
        function atualizarCarrinhoHTML() {
            listaItensVendaEl.innerHTML = '';
            const itensDoCarrinho = Object.values(carrinho);
            if (itensDoCarrinho.length === 0) {
                listaItensVendaEl.innerHTML = '<li class="list-group-item text-muted small">Nenhum item adicionado.</li>';
                return;
            }
            
            itensDoCarrinho.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item item-venda small';
                li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span>${item.nome} (x${item.quantidade})</span>
                        <span class="fw-bold">R$ ${(item.preco_venda * item.quantidade).toFixed(2)}</span>
                        <button class="btn btn-sm btn-danger ms-2 p-0 px-1" onclick="removerDoCarrinho('${item.produtoId}')"><i class="bi bi-trash"></i></button>
                    </div>
                `;
                listaItensVendaEl.appendChild(li);
            });
        }
        
        /**
         * Calcula o total da venda e atualiza os valores na tela.
         */
        function calcularTotal() {
            totalVenda = Object.values(carrinho).reduce((total, item) => total + (item.preco_venda * item.quantidade), 0);
            subtotalEl.textContent = totalVenda.toFixed(2);
            totalVendaEl.textContent = totalVenda.toFixed(2);
        }
        
        /**
         * Lógica de finalização de VENDA: atualiza estoque, total vendido e registra na coleção 'Venda direta'.
         */
        async function finalizarVenda() {
            if (Object.keys(carrinho).length === 0) {
                alert("O carrinho está vazio!");
                return;
            }

            finalizarVendaBtn.disabled = true;
            cortesiaPercaBtn.disabled = true;

            try {
                const novaVenda = {
                    data_venda: firebase.firestore.Timestamp.now(),
                    valor_total: totalVenda,
                    itens: Object.values(carrinho).map(item => ({
                        nome: item.nome,
                        preco_venda: item.preco_venda,
                        quantidade: item.quantidade
                    }))
                };
                await db.collection('Venda direta').add(novaVenda);
                
                const batch = db.batch();
                for (const produtoId in carrinho) {
                    const item = carrinho[produtoId];
                    const produtoRef = db.collection('produtos').doc(produtoId);
                    const produtoOriginal = todosProdutos.find(p => p.id === produtoId);
                    
                    if (produtoOriginal) {
                        const novoEstoque = produtoOriginal.estoque - item.quantidade;
                        const novoTotalVendido = produtoOriginal.totalVendido + item.quantidade;

                        batch.update(produtoRef, {
                            estoque: novoEstoque,
                            totalVendido: novoTotalVendido
                        });
                    }
                }
                await batch.commit();

                // (sucesso silencioso)

                carrinho = {};
                totalVenda = 0;
                atualizarCarrinhoHTML();
                calcularTotal();
                
                await carregarProdutos();
                carregarHistoricoDeVendas(); // Recarrega o histórico após a venda
                
            } catch (error) {
                console.error("Erro ao finalizar a venda:", error);
                alert("Ocorreu um erro ao finalizar a venda. Tente novamente.");
            } finally {
                finalizarVendaBtn.disabled = false;
                cortesiaPercaBtn.disabled = false;
            }
        }
        
        /**
         * Lógica de finalização de CORTESIA/PERCA: atualiza estoque e registra na nova coleção 'Cortesia'.
         */
        async function finalizarCortesiaPerca() {
            if (Object.keys(carrinho).length === 0) {
                alert("O carrinho está vazio!");
                return;
            }
            
            finalizarVendaBtn.disabled = true;
            cortesiaPercaBtn.disabled = true;

            try {
                const novaCortesia = {
                    data_registro: firebase.firestore.Timestamp.now(),
                    motivo: "Cortesia ou Perda",
                    itens: Object.values(carrinho).map(item => ({
                        nome: item.nome,
                        quantidade: item.quantidade
                    }))
                };
                await db.collection('Cortesia').add(novaCortesia);
                
                const batch = db.batch();
                for (const produtoId in carrinho) {
                    const item = carrinho[produtoId];
                    const produtoRef = db.collection('produtos').doc(produtoId);
                    const produtoOriginal = todosProdutos.find(p => p.id === produtoId);
                    
                    if (produtoOriginal) {
                        const novoEstoque = produtoOriginal.estoque - item.quantidade;

                        batch.update(produtoRef, {
                            estoque: novoEstoque,
                        });
                    }
                }
                await batch.commit();

                // (sucesso silencioso)

                carrinho = {};
                totalVenda = 0;
                atualizarCarrinhoHTML();
                calcularTotal();

                await carregarProdutos();
                
            } catch (error) {
                console.error("Erro ao finalizar o registro de cortesia/perda:", error);
                alert("Ocorreu um erro ao finalizar o registro. Tente novamente.");
            } finally {
                finalizarVendaBtn.disabled = false;
                cortesiaPercaBtn.disabled = false;
            }
        }

        // =========================================================
        // Funções da Seção de Comandas (Demais Funções Omitidas para Foco, mas mantidas no código final)
        // =========================================================
        
        /**
         * Carrega todos os clientes do Firebase e popula o datalist de clientes.
         */
        async function carregarClientes() {
            try {
                const clientesRef = db.collection('clientes');
                const snapshot = await clientesRef.get();
                
                todosClientes = {};
                listaClientesDatalist.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const cliente = doc.data();
                    cliente.id = doc.id;
                    todosClientes[cliente.id] = cliente;
                    
                    const option = document.createElement('option');
                    option.value = cliente.nome;
                    listaClientesDatalist.appendChild(option);
                });
                console.log("Clientes carregados com sucesso.");
            } catch (error) {
                console.error("Erro ao carregar clientes:", error);
            }
        }
        
        /**
         * Retorna o nome de um cliente a partir de seu ID.
         */
        function getClienteNome(clienteId) {
            const cliente = todosClientes[clienteId];
            return cliente ? cliente.nome : `Cliente #${clienteId.slice(0, 4)}`;
        }

        /**
         * Carrega todas as quadras do Firebase e armazena para lookup.
         */
        async function carregarQuadras() {
            try {
                const quadrasRef = db.collection('quadras');
                const snapshot = await quadrasRef.get();
                
                todasQuadras = {};
                
                snapshot.forEach(doc => {
                    const quadra = doc.data();
                    quadra.id = doc.id;
                    todasQuadras[quadra.id] = quadra;
                });
                console.log("Quadras carregadas com sucesso. Total:", Object.keys(todasQuadras).length);
            } catch (error) {
                console.error("Erro ao carregar quadras:", error);
            }
        }

        /**
         * Retorna o nome de uma quadra a partir de seu ID.
         */
        function getQuadraNome(quadraId) {
            const quadra = todasQuadras[quadraId];
            return quadra ? quadra.nome : `Quadra #${quadraId.slice(0, 4)}`;
        }

/**
 * Retorna a ordem numérica da quadra (1-4) para ordenações consistentes.
 * Aceita ID da quadra; usa o nome da quadra se disponível.
 */
function __ordemQuadraById(quadraId){
    try{
        const nome = String(getQuadraNome(quadraId) || '').toLowerCase();
        // tenta extrair número "Quadra 01", "Quadra 1", etc.
        const m = nome.match(/quadra\s*0?(\d+)\b/);
        if (m) {
            const n = Number(m[1]);
            if (!Number.isNaN(n)) return n;
        }
        if (nome.includes('extern')) return 4;
        return 99;
    }catch(_){
        return 99;
    }
}


        /**
         * Salva uma nova comanda no banco de dados e recarrega a lista.
         */
        async function abrirNovaComanda() {
            const clienteNome = clienteCadastradoInput.value.trim();

            if (!clienteNome) {
                alert("Por favor, selecione ou digite o nome de um cliente.");
                return;
            }
            
            try {
                await db.collection('comandas').add({
                    cliente: clienteNome,
                    itens: [],
                    data_abertura: firebase.firestore.Timestamp.now(),
                    status_comanda: 'Aberta'
                });
            // (removido) alerta de comanda aberta com sucesso
clienteCadastradoInput.value = '';

                carregarComandasAbertas();
            } catch (error) {
                console.error("Erro ao abrir nova comanda:", error);
                alert("Erro ao abrir nova comanda. Tente novamente.");
            }
        }

        /**
         * Ação de abrir uma comanda a partir de uma ou mais reservas, criando um item para CADA reserva.
         */
        async function abrirComandaDeReservas(reservaIds, overrideValores) {
            try {
                if (reservaIds.length === 0) {
                    alert('Nenhuma reserva selecionada.');
                    return;
                }

                const reservasParaComanda = [];
                let clienteId = null;

                for (const reservaId of reservaIds) {
                    const reservaDoc = await db.collection('reservas').doc(reservaId).get();
                    if (reservaDoc.exists) {
                        const reservaData = reservaDoc.data();
                        reservaData.id = reservaId;
                        reservasParaComanda.push(reservaData);
                        if (!clienteId) {
                            clienteId = reservaData.id_cliente;
                        }
                    }
                }
                
                if (reservasParaComanda.length === 0) {
                     alert('Nenhuma reserva válida encontrada.');
                     return;
                }
                
                const clienteNome = getClienteNome(clienteId);

                const itensDaComanda = reservasParaComanda.map(reserva => ({
                    nome: `Reserva de Quadra ${getQuadraNome(reserva.id_quadra)} (${reserva.data_reserva} - ${reserva.hora_inicio})`,
                    preco_venda: (overrideValores && overrideValores[reserva.id] != null) ? Number(overrideValores[reserva.id]) : reserva.valor,
                    quantidade: 1,
                    produtoId: 'reserva-quadra',
                    reservaId: reserva.id,
                }));

                // Define uma reserva base para agrupamento (time) e cor do botão.
                // Usamos a primeira reserva (mais cedo) para representar o "time" no agrupamento.
                reservasParaComanda.sort((a,b)=>{
                    const da = String(a.data_reserva||'');
                    const db_ = String(b.data_reserva||'');
                    if (da !== db_) return da.localeCompare(db_);
                    const ha = String(a.hora_inicio||'');
                    const hb = String(b.hora_inicio||'');
                    if (ha !== hb) return ha.localeCompare(hb);
                    const qa = __ordemQuadraById(a.id_quadra);
                    const qb = __ordemQuadraById(b.id_quadra);
                    return qa - qb;
                });
                const reservaBase = reservasParaComanda[0] || null;
                const reservaTimeId = reservaBase ? reservaBase.id : '';
                const reservaTimeLabel = reservaBase ? `${clienteNome} • ${getQuadraNome(reservaBase.id_quadra)} • ${reservaBase.hora_inicio}` : '';

                const novaComanda = {
                    cliente: clienteNome,
                    reservas_vinculadas_ids: reservaIds,
                    itens: itensDaComanda,
                    // agrupamento por reserva/time (para organizar comandas do mesmo time)
                    reserva_time_id: reservaTimeId,
                    reserva_time_label: reservaTimeLabel,
                    reserva_time_vinculado_em: firebase.firestore.Timestamp.now(), 
                    reserva_time_principal: true,
                    data_abertura: firebase.firestore.Timestamp.now(),
                    status_comanda: 'Aberta'
                };
                const comandaRef = await db.collection('comandas').add(novaComanda);

                const batch = db.batch();
                for (const reserva of reservasParaComanda) {
                    const reservaRef = db.collection('reservas').doc(reserva.id);
                    batch.update(reservaRef, {
                        comanda_vinculada_id: comandaRef.id,
                        status_reserva: 'ativa'
                    });
                }
                await batch.commit();
            // (removido) alerta de comanda aberta com reservas
carregarComandasAbertas();
                carregarReservasDoDia();
            __ensureUIReservasNaoPagas();

            } catch (error) {
                console.error("Erro ao abrir comanda das reservas:", error);
                alert("Erro ao abrir comanda das reservas. Tente novamente.");
            }
        }

        /**
         * Carrega as comandas abertas do banco de dados e as exibe na tela.
         */
 
         

        

function __normTextoSemAcento(txt){
  return String(txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function __isComandaNaoPagou(comanda){
  if (!comanda) return false;
  const id = String(comanda.reserva_time_id || '').trim();
  const label = __normTextoSemAcento(comanda.reserva_time_label || comanda.comanda_grupo || '');
  return id === 'grp_nao_pagou' || label === 'nao pagou';
}

function __obsNaoPagoHtml(comanda){
  if (!__isComandaNaoPagou(comanda)) return '';
  const valor = escapeHtml(comanda.obs ?? comanda.obs_nao_pago ?? '');
  return `
    <div class="obs-nao-pagou-box mb-2">
      <label class="form-label small fw-bold mb-1">Obs:</label>
      <textarea class="form-control form-control-sm obs-nao-pagou-input" rows="2" placeholder="Motivo de não estar pago..." onblur="salvarObsNaoPagou('${escapeHtml(comanda.id)}', this)">${valor}</textarea>
      <div class="small text-muted mt-1 obs-nao-pagou-status">Salva ao sair do campo.</div>
    </div>
  `;
}

async function salvarObsNaoPagou(comandaId, el){
  try{
    const id = String(comandaId || '').trim();
    if (!id) return;
    const valor = String(el?.value || '').trim();
    await db.collection('comandas').doc(id).update({
      obs: valor,
      obs_nao_pago: valor,
      obs_atualizada_em: firebase.firestore.Timestamp.now()
    });
    const box = el?.closest('.obs-nao-pagou-box');
    const st = box ? box.querySelector('.obs-nao-pagou-status') : null;
    if (st) {
      st.textContent = 'Obs salva.';
      st.classList.remove('text-danger');
      st.classList.add('text-success');
      setTimeout(() => { st.textContent = 'Salva ao sair do campo.'; st.classList.remove('text-success'); }, 1600);
    }
  }catch(err){
    console.error('Erro ao salvar obs da comanda não paga:', err);
    const box = el?.closest('.obs-nao-pagou-box');
    const st = box ? box.querySelector('.obs-nao-pagou-status') : null;
    if (st) {
      st.textContent = 'Erro ao salvar.';
      st.classList.add('text-danger');
    }
  }
}

async function carregarComandasAbertas() {
  try {
    const snapshot = await db.collection('comandas')
      .where('status_comanda', '==', 'Aberta')
      .orderBy('data_abertura', 'desc')
      .get();

    listaComandasEl.innerHTML = '';

    if (snapshot.empty) {
      listaComandasEl.innerHTML = '<p class="text-center text-muted mt-3 small">Nenhuma comanda aberta.</p>';
      return;
    }

    const comandas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


// separa: sem vínculo, vínculos por RESERVA e vínculos por GRUPO (Evento/Não pagou/Funcionários)
const semVinculo = [];
const porReserva = new Map(); // vinculoId -> { label, items[] }
const porGrupo   = new Map(); // vinculoId -> { label, items[] }

const __slugify = (s) => String(s||'')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'_')
  .replace(/^_+|_+$/g,'')
  .slice(0,40);

const __isGrupoVinculo = (timeId, tipoCampo) => {
  const id = String(timeId||'').trim();
  const tipo = String(tipoCampo||'').toLowerCase().trim();
  if (!id) return false;
  if (tipo === 'grupo') return true;
  if (__grupoById(id)) return true;      // ids fixos (grp_evento, etc)
  if (/^grp_/i.test(id)) return true;    // fallback/legado
  return false;
};

comandas.forEach(c => {
  let timeId = String(c.reserva_time_id || '').trim();
  let label  = String(c.reserva_time_label || '').trim();

  // compat: se ainda existir comanda_grupo, tratar como vínculo tipo "grupo"
  const legacyGrupo = String(c.comanda_grupo || '').trim();
  if (!timeId && legacyGrupo){
    timeId = __grupoIdFromNome(legacyGrupo) || ('grp_' + __slugify(legacyGrupo));
    if (!label) label = legacyGrupo;
  }

  if (!timeId) {
    semVinculo.push(c);
    return;
  }

  const isGrupo = __isGrupoVinculo(timeId, c.reserva_time_tipo);
  const shortLabel = __shortTimeLabel(label || '');

  const map = isGrupo ? porGrupo : porReserva;
  if (!map.has(timeId)) map.set(timeId, { label: shortLabel, items: [] });
  map.get(timeId).items.push(c);
});

// ordena sem vínculo por data_abertura desc
semVinculo.sort((a,b) => {
  const da = (a.data_abertura && a.data_abertura.toMillis) ? a.data_abertura.toMillis() : 0;
  const dbb = (b.data_abertura && b.data_abertura.toMillis) ? b.data_abertura.toMillis() : 0;
  return dbb - da;
});

// ordena itens dentro de um vínculo (principal primeiro, depois mais recente)
const __sortItensDoVinculo = (items) => {
  items.sort((a,b) => {
    const isPrincipal = (c) => (c && (c.reserva_time_principal === true || (Array.isArray(c.itens) && c.itens.some(it => (it && (it.produtoId === 'reserva-quadra' || String(it.nome||'').toLowerCase().startsWith('reserva de quadra')))))));
    const pa = isPrincipal(a) ? 1 : 0;
    const pb = isPrincipal(b) ? 1 : 0;
    if (pa !== pb) return pb - pa;

    const da = (a.data_abertura && a.data_abertura.toMillis) ? a.data_abertura.toMillis() : 0;
    const dbb = (b.data_abertura && b.data_abertura.toMillis) ? b.data_abertura.toMillis() : 0;
    return dbb - da;
  });
};

// helpers para ordenar grupos de RESERVA por (horário, quadra)
const __quadraOrderFromText = (s) => {
  const q = String(s||'').toLowerCase();
  if (q.includes('quadra 01') || q.includes('quadra01') || q.includes('01')) return 1;
  if (q.includes('quadra 02') || q.includes('quadra02') || q.includes('02')) return 2;
  if (q.includes('quadra 03') || q.includes('quadra03') || q.includes('03')) return 3;
  if (q.includes('quadra 04') || q.includes('quadra04') || q.includes('extern')) return 4;
  return 99;
};
const __timeToMin = (hhmm) => {
  const m = String(hhmm||'').match(/(\d{2}):(\d{2})/);
  if (!m) return 99999;
  return (Number(m[1])*60) + Number(m[2]);
};
const __parseReservaOrder = (label) => {
  const parts = String(label||'').split('•').map(x=>x.trim()).filter(Boolean);
  const t = parts.length ? parts[parts.length-1] : '';
  const tmin = __timeToMin(t);
  const qord = __quadraOrderFromText(label);
  return { tmin, qord };
};

// monta arrays finais na ordem desejada
const reservaGrupos = Array.from(porReserva.entries()).map(([timeId, g]) => {
  __sortItensDoVinculo(g.items);
  const ord = __parseReservaOrder(g.label || '');
  return { timeId, label: g.label, items: g.items, tmin: ord.tmin, qord: ord.qord };
}).sort((a,b) => (a.tmin - b.tmin) || (a.qord - b.qord) || String(a.label||'').localeCompare(String(b.label||'')));

const grupoOrder = __VINCULO_GRUPOS.map(x => x.id);
const grupoGrupos = Array.from(porGrupo.entries()).map(([timeId, g]) => {
  __sortItensDoVinculo(g.items);
  return { timeId, label: g.label, items: g.items };
}).sort((a,b) => {
  const ia = grupoOrder.indexOf(a.timeId);
  const ib = grupoOrder.indexOf(b.timeId);
  const aIdx = ia === -1 ? 999 : ia;
  const bIdx = ib === -1 ? 999 : ib;
  return (aIdx - bIdx) || String(a.label||'').localeCompare(String(b.label||''));
});
    // Render helper
    function renderComandaCard(comanda, teamId){
      const totalComanda = comanda.itens
        ? comanda.itens.reduce((total, item) => total + (Number(item.preco_venda||0) * Number(item.quantidade||0)), 0)
        : 0;

      const card = document.createElement('div');
      card.className = 'card comanda-card shadow-sm';
      if (teamId){
        const { border } = __teamColor(teamId);
        card.style.borderLeft = `6px solid ${border}`;
      }

      const itensHtml = (comanda.itens && comanda.itens.length > 0)
        ? comanda.itens.map((item, index) => `
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span>${item.quantidade} - ${item.nome}</span>
              <button class="btn btn-sm btn-danger p-0 px-1" onclick="removerItemComanda('${comanda.id}', ${index})" title="Remover item">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          `).join('')
        : `<small class="text-muted">Nenhum item</small>`;

      // botão de vínculo
      const hasLink = !!(comanda.reserva_time_id);
      const linkLabel = hasLink ? __shortTimeLabel(comanda.reserva_time_label) : 'Vincular a Reserva';
      const teamStyle = hasLink ? `style="--team-color:${__teamColor(comanda.reserva_time_id).btn};"` : '';
      const teamBtnClass = hasLink ? 'btn-team' : 'btn-outline-primary';
      const obsNaoPagoHtml = __obsNaoPagoHtml(comanda);

      
card.innerHTML = `
        <div class="card-body position-relative">
          <div class="d-flex align-items-start justify-content-between gap-2">
            <div class="d-flex align-items-center flex-wrap gap-1">
              <h5 class="card-title mt-0 mb-0">${escapeHtml(comanda.cliente || '')}</h5>
              
            </div>
            <div class="d-flex align-items-center gap-1">
              
              <button class="btn btn-sm btn-outline-danger p-0 px-2" onclick="excluirComanda('${comanda.id}')" title="Excluir comanda">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div id="itens-comanda-${comanda.id}" class="mb-2 small">
            ${itensHtml}
          </div>

          <div class="divider"></div>

          <div class="total-box mb-2">Total: ${fmtBR(totalComanda)}</div>

          ${obsNaoPagoHtml}

          <div class="d-flex gap-2">
            <button class="btn btn-secondary btn-sm w-50" onclick="abrirModalAdicionarItem('${comanda.id}')">Adicionar Itens</button>
            <button class="btn btn-success btn-sm w-50" onclick="abrirModalPagamento('${comanda.id}')">Pagar</button>
          </div>

          <button class="btn ${teamBtnClass} btn-sm w-100 mt-2" ${teamStyle} onclick="abrirModalVincularReserva('${comanda.id}')">
            <i class="bi bi-people"></i> ${linkLabel}
          </button>
        </div>
      `;
      return card;
    }

    // ===== Sem vínculo (sem grupo e sem time) =====
    if (semVinculo.length){
      const box = document.createElement('div');
      box.className = 'comanda-group';
      box.innerHTML = `
        <div class="comanda-group-header">
          <div class="comanda-group-title"><span class="comanda-dot" style="--team-color:#6c757d"></span> Sem vínculo</div>
          <div class="comanda-count">${semVinculo.length}</div>
        </div>
        <div class="comandas-grid" id="grid-sem-vinculo"></div>
      `;
      listaComandasEl.appendChild(box);
      const grid = box.querySelector('#grid-sem-vinculo');
      semVinculo.forEach(c => grid.appendChild(renderComandaCard(c, '')));
    }


// ===== Vinculadas a reservas (ordem: horário -> quadra) =====
reservaGrupos.forEach(g => {
  const { btn } = __teamColor(g.timeId);
  const box = document.createElement('div');
  box.className = 'comanda-group';
  box.style.setProperty('--team-color', btn);
  box.innerHTML = `
    <div class="comanda-group-header">
      <div class="comanda-group-title">
        <span class="comanda-dot"></span>
        <span>${escapeHtml(g.label || '')}</span>
      </div>
      <div class="comanda-count">${g.items.length}</div>
    </div>
    <div class="comandas-grid"></div>
  `;
  const grid = box.querySelector('.comandas-grid');
  g.items.forEach(c => grid.appendChild(renderComandaCard(c, g.timeId)));
  listaComandasEl.appendChild(box);
});

// ===== Grupos fixos (Evento / Não pagou / Funcionários) =====
grupoGrupos.forEach(g => {
  const { btn } = __teamColor(g.timeId);
  const box = document.createElement('div');
  box.className = 'comanda-group';
  box.style.setProperty('--team-color', btn);
  box.innerHTML = `
    <div class="comanda-group-header">
      <div class="comanda-group-title">
        <span class="comanda-dot"></span>
        <span>${escapeHtml(g.label || '')}</span>
      </div>
      <div class="comanda-count">${g.items.length}</div>
    </div>
    <div class="comandas-grid"></div>
  `;
  const grid = box.querySelector('.comandas-grid');
  g.items.forEach(c => grid.appendChild(renderComandaCard(c, g.timeId)));
  listaComandasEl.appendChild(box);
});

  } catch (error) {
    console.error("Erro ao carregar comandas abertas:", error);
  }
}



        /**
         * Remove um item da comanda no banco de dados.
         */
        async function removerItemComanda(comandaId, itemIndex) {
            if (confirm("Tem certeza que deseja remover este item da comanda?")) {
                try {
                    const comandaRef = db.collection('comandas').doc(comandaId);
                    const comandaDoc = await comandaRef.get();
                    
                    if (comandaDoc.exists) {
                        const comandaData = comandaDoc.data();
                        const novosItens = comandaData.itens;
                        
                        novosItens.splice(itemIndex, 1);
                        
                        await comandaRef.update({
                            itens: novosItens
                        });
                        
                        carregarComandasAbertas();
                        // (sucesso silencioso)

                    }
                } catch (error) {
                    console.error("Erro ao remover item da comanda:", error);
                    alert("Erro ao remover item. Tente novamente.");
                }
            }
        }



        /**
         * Carrega as reservas do dia atual, agrupa-as por cliente e as exibe em uma tabela.
         */
        async function carregarReservasDoDia() {
            try {
                __ensureCompactAcoesReservaCSS();
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const hojeString = `${ano}-${mes}-${dia}`;
                
                console.log("Buscando reservas para a data:", hojeString);

                // Recarrega o cache sempre que a tabela do dia for atualizada,
                // para novas reservas aparecerem imediatamente nos avisos.
                await __carregarNaoPagasCache(hojeString, true);

                const reservasRef = db.collection('reservas');

                // Importante: busca somente pela data e filtra o status no JavaScript.
                // Assim aparecem também reservas novas/antigas que foram salvas sem
                // pagamento_reserva ou com nomes de campo diferentes.
                const snapshot = await reservasRef
                    .where('data_reserva', '==', hojeString)
                    .get();

                listaReservasDiaEl.innerHTML = '';

                const reservasAgrupadas = {};
                snapshot.forEach(doc => {
                    const reserva = doc.data() || {};
                    reserva.id = doc.id;

                    if (__isCanceladaReserva(reserva)) return;
                    if (!__isNaoPagaReserva(reserva)) return;

                    const clienteKey = String(reserva.id_cliente || reserva.clienteId || reserva.idCliente || '').trim() || 'sem_cliente';
                    if (!reservasAgrupadas[clienteKey]) reservasAgrupadas[clienteKey] = [];
                    reservasAgrupadas[clienteKey].push(reserva);
                });

                const clientesOrdenados = Object.keys(reservasAgrupadas).sort((a, b) => {
                    const ra = reservasAgrupadas[a][0] || {};
                    const rb = reservasAgrupadas[b][0] || {};
                    const ha = String(ra.hora_inicio || '99:99');
                    const hb = String(rb.hora_inicio || '99:99');
                    if (ha !== hb) return ha.localeCompare(hb);
                    return String(getClienteNome(a) || '').localeCompare(String(getClienteNome(b) || ''));
                });

                if (!clientesOrdenados.length) {
                    listaReservasDiaEl.innerHTML = `<tr><td colspan="6" class="text-center text-muted small">Nenhuma reserva para hoje.</td></tr>`;
                    return;
                }

                for (const clienteId in reservasAgrupadas) {
                    reservasAgrupadas[clienteId].sort((a, b) => {
                        const ha = String(a.hora_inicio || '99:99');
                        const hb = String(b.hora_inicio || '99:99');
                        if (ha !== hb) return ha.localeCompare(hb);
                        return __ordemQuadraById(a.id_quadra) - __ordemQuadraById(b.id_quadra);
                    });
                }

                for (const clienteId of clientesOrdenados) {
                    const reservasDoCliente = reservasAgrupadas[clienteId];
                    const clienteNome = clienteId === 'sem_cliente' ? 'Cliente não identificado' : getClienteNome(clienteId);
                    const reservaIds = reservasDoCliente.map(res => res.id);
                    
                    reservasDoCliente.forEach((reserva, index) => {
                        const tr = document.createElement('tr');
                        
                        const temComanda = !!reserva.comanda_vinculada_id;
                        const botaoTexto = temComanda ? 'Ver Comanda' : 'Abrir Comanda';
                        const acaoBotao = temComanda ? `abrirModalPagamento('${reserva.comanda_vinculada_id}')` : `abrirComandaDeReservasDoDia(['${reservaIds.join("','")}'])`;
                        const classeBotao = temComanda ? 'btn-info' : 'btn-success';

                        if (index === 0) {
                            tr.innerHTML = `
                                <td rowspan="${reservasDoCliente.length}" class="align-middle small">
  <div class="d-flex align-items-center justify-content-between gap-2">
    <span>${escapeHtml(clienteNome)}</span>
    ${clienteId === 'sem_cliente' ? '' : __badgeNaoPagoCliente(clienteId, hojeString)}
  </div>
</td>
                                <td class="small">${escapeHtml(getQuadraNome(reserva.id_quadra))}</td>
                                <td class="small">R$ <input type="number" step="0.01" class="form-control form-control-sm valor-input-reserva" id="valor-reserva-${reserva.id}" value="${Number(reserva.valor||0).toFixed(2)}" onchange="atualizarValorReserva('${reserva.id}', this.value)"></td>
                                <td class="small">${escapeHtml(reserva.hora_inicio || '')}</td>
                                <td class="small">${escapeHtml(reserva.hora_fim || '')}</td>
                                <td rowspan="${reservasDoCliente.length}" class="align-middle">
                                    <div class="acoes-reserva">
                                      <button class="btn ${classeBotao} btn-sm btn-acao-reserva" onclick="${acaoBotao}">
                                        ${botaoTexto}
                                      </button>
                                      ${clienteId === 'sem_cliente' ? '' : `<button class="btn btn-outline-secondary btn-sm btn-acao-reserva" onclick="abrirModalReservasCliente('${clienteId}')">Pagar mês</button>`}
                                    </div>
                                </td>
                            `;
                        } else {
                            tr.innerHTML = `
                                <td class="small">${escapeHtml(getQuadraNome(reserva.id_quadra))}</td>
                                <td class="small">R$ <input type="number" step="0.01" class="form-control form-control-sm valor-input-reserva" id="valor-reserva-${reserva.id}" value="${Number(reserva.valor||0).toFixed(2)}" onchange="atualizarValorReserva('${reserva.id}', this.value)"></td>
                                <td class="small">${escapeHtml(reserva.hora_inicio || '')}</td>
                                <td class="small">${escapeHtml(reserva.hora_fim || '')}</td>
                                <td></td>
                            `;
                        }
                        listaReservasDiaEl.appendChild(tr);
                    });
                }
            } catch (error) {
                console.error("Erro ao carregar reservas do dia:", error);
                listaReservasDiaEl.innerHTML = `<tr><td colspan="6" class="text-danger text-center small">Erro ao carregar reservas.</td></tr>`;
            }
        }

        let __unsubscribeReservasDoDia = null;
        function iniciarEscutaReservasDoDia() {
            try {
                const hojeString = (typeof __hojeStringLocal === 'function') ? __hojeStringLocal() : (() => {
                    const hoje = new Date();
                    return `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
                })();

                if (__unsubscribeReservasDoDia) {
                    __unsubscribeReservasDoDia();
                    __unsubscribeReservasDoDia = null;
                }

                __unsubscribeReservasDoDia = db.collection('reservas')
                    .where('data_reserva', '==', hojeString)
                    .onSnapshot(() => {
                        carregarReservasDoDia();
                    }, (erro) => {
                        console.warn('[reservas-do-dia] Listener em tempo real falhou, usando carregamento manual:', erro);
                        carregarReservasDoDia();
                    });
            } catch (erro) {
                console.warn('[reservas-do-dia] Não foi possível iniciar listener, usando carregamento manual:', erro);
                carregarReservasDoDia();
            }
        }

        

        // =========================================================
        // Ajuste (2026-01): edição do valor da reserva antes de abrir comanda
        // =========================================================

        // Atualiza valor da reserva ao editar (persiste no Firestore)
        
        // =========================================================
        // Reservas não pagas: alerta no "Reservas do Dia" + busca
        // =========================================================

        function __normStatusPagamento(r) {
            const v = (r && (r.pagamento_reserva ?? r.statusPagamento ?? r.status_pagamento ?? r.pagamento ?? r.status_pagamento_reserva)) ?? '';
            return String(v).toLowerCase().trim();
        }

        function __isCanceladaReserva(r) {
            const s = String((r && (r.status_reserva ?? r.statusReserva ?? r.status)) ?? '').toLowerCase().trim();
            const p = __normStatusPagamento(r);
            return s === 'cancelada' || p === 'cancelada' || p === 'canceled' || p === 'cancelado';
        }

        function __isNaoPagaReserva(r) {
            if (__isCanceladaReserva(r)) return false;
            const p = __normStatusPagamento(r);
            const statusReserva = String((r && (r.status_reserva ?? r.statusReserva ?? r.status)) ?? '').toLowerCase().trim();

            // Status claramente pagos não entram na lista de reservas pendentes.
            if (p === 'pago' || p === 'paga' || p === 'paid' || p === 'quitado' || p === 'quitada') return false;

            // Quando a reserva está vinculada em uma comanda, mas ainda não foi paga,
            // ela deve continuar aparecendo para "Ver Comanda".
            if (p === 'em comanda') return true;

            // Novas reservas ou reservas antigas podem vir sem pagamento_reserva.
            // Nesse caso, se não estiver cancelada/paga, tratamos como aguardando.
            if (!p) {
                if (statusReserva.includes('pago') || statusReserva.includes('paga')) return false;
                return true;
            }

            return (
                p === 'aguardando' ||
                p === 'atrasada' ||
                p === 'atrasado' ||
                p === 'pendente' ||
                p === 'aberto' ||
                p === 'aberta' ||
                p.includes('aguard') ||
                p.includes('atras') ||
                p.includes('pend')
            );
        }

        async function __carregarNaoPagasCache(hojeString, force = false) {
            if (!force && __naoPagasCache.hoje === hojeString && __naoPagasCache.list && __naoPagasCache.list.length) return;

            __naoPagasCache = { hoje: hojeString, list: [], byCliente: new Map() };

            const reservasRef = db.collection('reservas');

            let snap = null;
            try {
                // Busca por data e filtra status no JS para aceitar reservas antigas/novas
                // com campos diferentes de pagamento.
                snap = await reservasRef
                    .where('data_reserva', '<=', hojeString)
                    .orderBy('data_reserva', 'desc')
                    .limit(800)
                    .get();
            } catch (e) {
                console.warn('[naoPagas] Query com data_reserva falhou, tentando fallback:', e);
                try {
                    snap = await reservasRef
                        .limit(800)
                        .get();
                } catch (e2) {
                    console.error('[naoPagas] Falha ao buscar reservas não pagas:', e2);
                    return;
                }
            }

            const list = [];
            snap.forEach(doc => {
                const r = doc.data() || {};
                r.id = doc.id;

                // filtra por segurança
                if (!r.data_reserva) return;
                if (String(r.data_reserva) > String(hojeString)) return;
                if (!__isNaoPagaReserva(r)) return;

                list.push(r);
            });

            __naoPagasCache.list = list;
            const map = new Map();
            for (const r of list) {
                const cid = String(r.id_cliente || '').trim();
                if (!cid) continue;
                if (!map.has(cid)) map.set(cid, []);
                map.get(cid).push(r);
            }
            __naoPagasCache.byCliente = map;
        }

        function __badgeNaoPagoCliente(clienteId, hojeString) {
            try {
                const cid = String(clienteId || '').trim();
                const arr = (__naoPagasCache.byCliente && __naoPagasCache.byCliente.get(cid)) || [];
                // anteriores a hoje (não contar as de hoje para "pendências")
                const count = arr.filter(r => String(r.data_reserva || '') < String(hojeString)).length;
                if (!count) return '';
                return `
                  <button type="button"
                          class="btn btn-outline-danger btn-sm py-0 px-2"
                          title="Cliente possui ${count} reserva(s) não paga(s) anterior(es). Clique para ver."
                          onclick="abrirModalReservasCliente('${cid}')">
                    ⚠ ${count}
                  </button>`;
            } catch (_) { return ''; }
        }

        function __ensureUIReservasNaoPagas() {
            // 1) Botão no topo da seção "Reservas do Dia"
            const sec = document.getElementById('reservas-do-dia');
            if (sec && !document.getElementById('btnNaoPagas')) {
                const h2 = sec.querySelector('h2');
                if (h2) {
                    const wrap = document.createElement('div');
                    wrap.className = 'd-flex align-items-center justify-content-between gap-2 flex-wrap';
                    h2.parentNode.insertBefore(wrap, h2);
                    wrap.appendChild(h2);

                    const btn = document.createElement('button');
                    btn.id = 'btnNaoPagas';
                    btn.type = 'button';
                    btn.className = 'btn btn-outline-danger btn-sm';
                    btn.textContent = 'Buscar reservas não pagas';
                    btn.onclick = () => abrirModalReservasNaoPagas('');
                    wrap.appendChild(btn);
                }
            }

            // 2) Modal (injetado)
            if (!document.getElementById('modalNaoPagas')) {
                const container = document.createElement('div');
                container.innerHTML = `
                  <div class="modal fade" id="modalNaoPagas" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-scrollable">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title">Reservas não pagas</h5>
                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body">
                          <div class="d-flex gap-2 flex-wrap align-items-center mb-3">
                            <input id="naoPagasBusca" class="form-control form-control-sm" style="max-width: 360px"
                                   placeholder="Buscar por cliente, data, quadra ou horário..." />
                            <button class="btn btn-sm btn-outline-secondary" type="button" onclick="abrirModalReservasNaoPagas(__naoPagasFiltroClienteId || '')">Atualizar</button>
                            <div class="form-check ms-auto">
                              <input class="form-check-input" type="checkbox" id="naoPagasSomenteAnteriores" checked>
                              <label class="form-check-label small" for="naoPagasSomenteAnteriores">Somente anteriores a hoje</label>
                            </div>
                          </div>

                          <div class="table-responsive">
                            <table class="table table-sm table-striped align-middle">
                              <thead>
                                <tr class="small">
                                  <th style="width:36px;"><input type="checkbox" id="naoPagasSelAll"></th>
                                  <th>Data</th>
                                  <th>Cliente</th>
                                  <th>Quadra</th>
                                  <th>Horário</th>
                                  <th class="text-end">Valor</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody id="naoPagasTbody">
                                <tr><td colspan="7" class="text-center text-muted small">Carregando...</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div class="modal-footer">
                          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
                          <button type="button" class="btn btn-danger" onclick="__abrirComandaDasNaoPagasSelecionadas()">Abrir comanda das selecionadas</button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
                document.body.appendChild(container);

                // handlers
                setTimeout(() => {
                    const selAll = document.getElementById('naoPagasSelAll');
                    if (selAll) selAll.addEventListener('change', (e) => {
                        const checked = !!e.target.checked;
                        document.querySelectorAll('#naoPagasTbody input[type="checkbox"][data-reserva-id]').forEach(cb => {
                            cb.checked = checked;
                        });
                    });
                    const busca = document.getElementById('naoPagasBusca');
                    if (busca) busca.addEventListener('input', () => __renderNaoPagasTabela());
                    const chk = document.getElementById('naoPagasSomenteAnteriores');
                    if (chk) chk.addEventListener('change', () => __renderNaoPagasTabela());
                }, 0);
            }
        }

        let __naoPagasFiltroClienteId = '';

        async function abrirModalReservasNaoPagas(clienteId) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const hojeString = `${ano}-${mes}-${dia}`;

            __naoPagasFiltroClienteId = String(clienteId || '').trim();

            await __carregarNaoPagasCache(hojeString);

            const modalEl = document.getElementById('modalNaoPagas');
            if (!modalEl) return;

            // limpa busca
            const buscaEl = document.getElementById('naoPagasBusca');
            if (buscaEl) buscaEl.value = '';

            // abre
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            // render
            __renderNaoPagasTabela();
        }

        
        // =========================================================
        // Reservas do cliente (hoje + futuras + pendentes): selecionar, editar valores e abrir comanda
        // =========================================================

        let __clienteReservasCache = { clienteId: '', hoje: '', itens: [] };

        function __ensureUIModalReservasCliente() {
            if (document.getElementById('modalClienteReservas')) return;

            const html = `
<div class="modal fade" id="modalClienteReservas" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header" style="background:#f0f8f6;">
        <div>
          <h5 class="modal-title mb-0">Reservas do cliente</h5>
          <div id="clienteReservasSub" class="small text-muted mt-1"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input id="clienteReservasBusca" class="form-control" style="max-width:360px;" placeholder="Buscar por data, quadra ou horário..." />
          <button id="clienteReservasAtualizar" class="btn btn-outline-secondary">Atualizar</button>
          <div class="form-check ms-auto">
            <input class="form-check-input" type="checkbox" id="clienteReservasSomenteAbertas" checked>
            <label class="form-check-label" for="clienteReservasSomenteAbertas">Somente em aberto (aguardando/atrasada)</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="clienteReservasSomenteHojeFuturo" checked>
            <label class="form-check-label" for="clienteReservasSomenteHojeFuturo">Somente de hoje e futuras</label>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th style="width:28px;"><input type="checkbox" id="clienteReservasCheckAll"></th>
                <th style="width:110px;">Data</th>
                <th>Quadra</th>
                <th style="width:140px;">Horário</th>
                <th style="width:140px;">Valor</th>
                <th style="width:110px;">Status</th>
              </tr>
            </thead>
            <tbody id="clienteReservasTbody">
              <tr><td colspan="6" class="text-muted small">Carregando...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="small text-muted mt-2">
          Dica: edite o valor antes de abrir a comanda. Canceladas não aparecem.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Fechar</button>
        <button id="btnClienteReservasRemoverVinculo" class="btn btn-outline-danger me-auto" style="display:none;">Remover vínculo</button>
        <button id="btnClienteReservasAbrirComanda" class="btn btn-danger">Abrir comanda das selecionadas</button>
      </div>
    </div>
  </div>
</div>`;
            document.body.insertAdjacentHTML('beforeend', html);

            // listeners
            setTimeout(() => {
                const busca = document.getElementById('clienteReservasBusca');
                if (busca) busca.addEventListener('input', () => __renderClienteReservasTabela());
                const chkA = document.getElementById('clienteReservasSomenteAbertas');
                if (chkA) chkA.addEventListener('change', () => __renderClienteReservasTabela());
                const chkHF = document.getElementById('clienteReservasSomenteHojeFuturo');
                if (chkHF) chkHF.addEventListener('change', () => __renderClienteReservasTabela());
                const chkAll = document.getElementById('clienteReservasCheckAll');
                if (chkAll) chkAll.addEventListener('change', (e) => {
                    document.querySelectorAll('#clienteReservasTbody input[data-reserva-check]').forEach(el => { el.checked = !!e.target.checked; });
                });
                const btnA = document.getElementById('btnClienteReservasAbrirComanda');
                if (btnA) btnA.addEventListener('click', () => __clienteReservasAbrirComandaSelecionadas());
                const btnU = document.getElementById('clienteReservasAtualizar');
                if (btnU) btnU.addEventListener('click', async () => {
                    await __carregarReservasClienteCache(__clienteReservasCache.clienteId, __clienteReservasCache.hoje, true);
                    __renderClienteReservasTabela();
                });
                const btnRem = document.getElementById('btnClienteReservasRemoverVinculo');
                if (btnRem) btnRem.addEventListener('click', async () => {
                    await removerVinculoReservaDaComanda();
                });
            }, 0);
        }

        function __dedupeReservas(arr) {
            const map = new Map();
            (arr || []).forEach(r => {
                const key = `${r.id_quadra||''}|${r.hora_inicio||''}|${r.hora_fim||''}|${r.data_reserva||''}|${r.id_cliente||''}`;
                const cur = map.get(key);
                if (!cur) { map.set(key, r); return; }
                // prefere a que já tem comanda
                const curHas = !!cur.comanda_vinculada_id;
                const rHas = !!r.comanda_vinculada_id;
                if (rHas && !curHas) { map.set(key, r); return; }
                // senão fica com a "menor" id
                if (String(r.id||'') < String(cur.id||'')) map.set(key, r);
            });
            return Array.from(map.values());
        }

        async function __carregarReservasClienteCache(clienteId, hojeString, force=false) {
            const cid = String(clienteId||'').trim();
            if (!cid) return;
            if (!force && __clienteReservasCache.clienteId === cid && __clienteReservasCache.hoje === hojeString && Array.isArray(__clienteReservasCache.itens)) return;

            __clienteReservasCache = { clienteId: cid, hoje: hojeString, itens: [] };

            // janela: 45 dias para trás até 90 dias à frente
            const d0 = new Date(hojeString + 'T00:00:00');
            const start = new Date(d0.getTime()); start.setDate(start.getDate() - 45);
            const end = new Date(d0.getTime()); end.setDate(end.getDate() + 90);
            const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
            const endStr = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;

            try {
                let q = db.collection('reservas')
                    .where('id_cliente', '==', cid)
                    .where('data_reserva', '>=', startStr)
                    .orderBy('data_reserva')
                    .orderBy('hora_inicio');

                const snap = await q.get();
                const itens = [];
                snap.forEach(doc => {
                    const r = doc.data() || {};
                    r.id = doc.id;
                    // filtro janela fim
                    if (String(r.data_reserva||'') > String(endStr)) return;
                    if (__isCanceladaReserva(r)) return; // sem canceladas
                    itens.push(r);
                });

                __clienteReservasCache.itens = __dedupeReservas(itens);
            } catch (e) {
                console.error('Erro ao buscar reservas do cliente:', e);
                __clienteReservasCache.itens = [];
            }
        }

        async function abrirModalReservasCliente(clienteId) {
            __comandaAtual = null;
            __vinculoComandaId = null;
            __ensureUIModalReservasCliente();

            const hoje = new Date();
            const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;

            const cid = String(clienteId||'').trim();
            await __carregarReservasClienteCache(cid, hojeString);

            const sub = document.getElementById('clienteReservasSub');
            if (sub) sub.textContent = `${getClienteNome(cid)} • selecione reservas para abrir a comanda`;

            // botão remover vínculo só aparece se a comanda atual tem vínculo
            const btnRem = document.getElementById('btnClienteReservasRemoverVinculo');
            if (btnRem) {
                btnRem.style.display = (__comandaAtual && (__comandaAtual.reserva_time_id || __comandaAtual.reserva_time_tipo)) ? '' : 'none';
            }

            // limpa busca + checks
            const busca = document.getElementById('clienteReservasBusca');
            if (busca) busca.value = '';
            const chkAll = document.getElementById('clienteReservasCheckAll');
            if (chkAll) chkAll.checked = false;

            // render e abrir
            __renderClienteReservasTabela();
            const modal = new bootstrap.Modal(document.getElementById('modalClienteReservas'));
            modal.show();
        }

        function __sortReservasCliente(a,b) {
            const da = String(a.data_reserva||'');
            const db_ = String(b.data_reserva||'');
            if (da !== db_) return da.localeCompare(db_);
            const qa = __ordemQuadraById(a.id_quadra);
            const qb = __ordemQuadraById(b.id_quadra);
            if (qa !== qb) return qa - qb;
            const ha = String(a.hora_inicio||'');
            const hb = String(b.hora_inicio||'');
            if (ha !== hb) return ha.localeCompare(hb);
            return String(a.id||'').localeCompare(String(b.id||''));
        }

        function __renderClienteReservasTabela() {
            const tbody = document.getElementById('clienteReservasTbody');
            if (!tbody) return;

            const busca = (document.getElementById('clienteReservasBusca')?.value || '').toLowerCase().trim();
            const somenteAbertas = !!document.getElementById('clienteReservasSomenteAbertas')?.checked;
            const somenteHojeFuturo = !!document.getElementById('clienteReservasSomenteHojeFuturo')?.checked;
            const hojeString = __clienteReservasCache.hoje;

            let lista = (__clienteReservasCache.itens || []).slice();

            if (somenteAbertas) {
                lista = lista.filter(r => __isNaoPagaReserva(r));
            }
            if (somenteHojeFuturo) {
                lista = lista.filter(r => String(r.data_reserva||'') >= String(hojeString));
            }

            if (busca) {
                lista = lista.filter(r => {
                    const quadra = String(getQuadraNome(r.id_quadra)||'').toLowerCase();
                    const data = String(r.data_reserva||'').toLowerCase();
                    const hora = `${r.hora_inicio||''} - ${r.hora_fim||''}`.toLowerCase();
                    return quadra.includes(busca) || data.includes(busca) || hora.includes(busca);
                });
            }

            lista.sort(__sortReservasCliente);

            if (!lista.length) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-muted small">Nenhuma reserva encontrada.</td></tr>`;
                return;
            }

            tbody.innerHTML = lista.map(r => {
                const st = __normStatusPagamento(r);
                const badge = (st === 'atrasada') ? 'danger' : (st === 'aguardando' ? 'warning' : 'secondary');
                const valor = Number(r.valor || 0);
                return `
<tr>
  <td><input type="checkbox" data-reserva-check value="${r.id}"></td>
  <td class="small">${escapeHtml(__fmtDataBRComDia(r.data_reserva||''))}</td>
  <td class="small">${escapeHtml(getQuadraNome(r.id_quadra))}</td>
  <td class="small">${escapeHtml(String(r.hora_inicio||''))} - ${escapeHtml(String(r.hora_fim||''))}</td>
  <td class="small">
    <input type="number" step="0.01" class="form-control form-control-sm" style="max-width:120px;"
           data-reserva-valor="${r.id}" value="${valor.toFixed(2)}">
  </td>
  <td><span class="badge bg-${badge}">${escapeHtml(st||'')}</span></td>
</tr>`;
            }).join('');
        }

        async function __clienteReservasAbrirComandaSelecionadas() {
            const checks = Array.from(document.querySelectorAll('#clienteReservasTbody input[data-reserva-check]')).filter(c => c.checked);
            if (!checks.length) {
                alert('Selecione pelo menos uma reserva.');
                return;
            }
            const ids = checks.map(c => c.value);
            const valores = {};
            ids.forEach(id => {
                const inp = document.querySelector(`#clienteReservasTbody input[data-reserva-valor="${CSS.escape(id)}"]`);
                if (inp) valores[id] = Number(inp.value || 0);
            });

            await abrirComandaDeReservas(ids, valores);
        }
function __renderNaoPagasTabela() {
            const tbody = document.getElementById('naoPagasTbody');
            if (!tbody) return;

            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const hojeString = `${ano}-${mes}-${dia}`;

            const somenteAnteriores = document.getElementById('naoPagasSomenteAnteriores')?.checked ?? true;
            const q = String(document.getElementById('naoPagasBusca')?.value || '').toLowerCase().trim();

            let list = __naoPagasCache.list || [];

            if (__naoPagasFiltroClienteId) {
                list = list.filter(r => String(r.id_cliente || '').trim() === __naoPagasFiltroClienteId);
            }
            if (somenteAnteriores) {
                list = list.filter(r => String(r.data_reserva || '') < String(hojeString));
            }

            // busca textual
            if (q) {
                list = list.filter(r => {
                    const cliente = getClienteNome(r.id_cliente);
                    const quadra  = getQuadraNome(r.id_quadra);
                    const s = `${r.data_reserva||''} ${cliente||''} ${quadra||''} ${r.hora_inicio||''} ${r.hora_fim||''}`.toLowerCase();
                    return s.includes(q);
                });
            }

            // ordena: mais antigas primeiro (pra facilitar limpar pendências)
            list.sort((a,b) => {
                const da = String(a.data_reserva||'');
                const dbb = String(b.data_reserva||'');
                if (da !== dbb) return da.localeCompare(dbb);
                const ha = String(a.hora_inicio||'');
                const hb = String(b.hora_inicio||'');
                if (ha !== hb) return ha.localeCompare(hb);
                const qa = String(a.id_quadra||'');
                const qb = String(b.id_quadra||'');
                return qa.localeCompare(qb);
            });

            if (!list.length) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted small">Nenhuma reserva não paga encontrada.</td></tr>`;
                return;
            }

            tbody.innerHTML = list.map(r => {
                const cliente = getClienteNome(r.id_cliente);
                const quadra  = getQuadraNome(r.id_quadra);
                const valor = Number(r.valor||0);
                const st = __normStatusPagamento(r);
                const stLabel = st === 'atrasada' ? 'atrasada' : 'aguardando';
                return `
                  <tr class="small">
                    <td><input type="checkbox" data-reserva-id="${r.id}"></td>
                    <td>${escapeHtml(r.data_reserva||'')}</td>
                    <td>${escapeHtml(cliente||'')}</td>
                    <td>${escapeHtml(quadra||'')}</td>
                    <td>${escapeHtml((r.hora_inicio||'') + ' - ' + (r.hora_fim||''))}</td>
                    <td class="text-end">R$ ${valor.toFixed(2)}</td>
                    <td><span class="badge ${stLabel==='atrasada'?'bg-danger':'bg-warning text-dark'}">${escapeHtml(stLabel)}</span></td>
                  </tr>
                `;
            }).join('');
        }

        async function __abrirComandaDasNaoPagasSelecionadas() {
            const ids = Array.from(document.querySelectorAll('#naoPagasTbody input[type="checkbox"][data-reserva-id]:checked'))
                .map(cb => cb.getAttribute('data-reserva-id'))
                .filter(Boolean);

            if (!ids.length) {
                alert('Selecione pelo menos uma reserva não paga.');
                return;
            }
            // usa a função já existente que cria comanda e vincula reservas
            await abrirComandaDeReservasDoDia(ids);

            // fecha modal
            const modalEl = document.getElementById('modalNaoPagas');
            if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();
        }
async function atualizarValorReserva(reservaId, novoValor){
            try{
                const val = Number(String(novoValor).replace(',', '.'));
                if (!reservaId) return;
                if (!Number.isFinite(val) || val < 0) return;
                await db.collection('reservas').doc(reservaId).update({ valor: val });
            }catch(err){
                console.warn('Falha ao atualizar valor da reserva', err);
            }
        }

        // Ao abrir a comanda das reservas do dia, salva primeiro os valores editados
        async function abrirComandaDeReservasDoDia(reservaIds){
            try{
                if (!Array.isArray(reservaIds) || reservaIds.length === 0){
                    return abrirComandaDeReservas(reservaIds);
                }
                const batch = db.batch();
                reservaIds.forEach((rid)=>{
                    const inp = document.getElementById('valor-reserva-' + rid);
                    if (!inp) return;
                    const val = Number(String(inp.value).replace(',', '.'));
                    if (Number.isFinite(val) && val >= 0){
                        batch.update(db.collection('reservas').doc(rid), { valor: val });
                    }
                });
                await batch.commit();
            }catch(err){
                console.warn('Falha ao salvar valores antes de abrir a comanda', err);
            }
            return abrirComandaDeReservas(reservaIds);
        }

// =========================================================
        // Funções para Reservas Futuras (ALTERADAS)
        // =========================================================

        /**
         * Preenche os selects de mês e ano para a busca de reservas futuras.
         */
        function popularSeletoresDeData() {
            // Se a seção visual de reservas futuras foi removida da página, não faz nada.
            if (!mesBuscaEl || !anoBuscaEl) return;
            const hoje = new Date();
            const anoAtual = hoje.getFullYear();
            const mesAtual = hoje.getMonth();

            const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            meses.forEach((mes, index) => {
                const option = document.createElement('option');
                option.value = String(index + 1).padStart(2, '0'); // Garante 01, 02, etc.
                option.textContent = mes;
                if (index === mesAtual) {
                    option.selected = true;
                }
                mesBuscaEl.appendChild(option);
            });

            for (let ano = anoAtual; ano <= anoAtual + 5; ano++) {
                const option = document.createElement('option');
                option.value = ano;
                option.textContent = ano;
                if (ano === anoAtual) {
                    option.selected = true;
                }
                anoBuscaEl.appendChild(option);
            }
        }

        /**
         * Busca reservas futuras com base no cliente, mês e ano selecionados.
         */
        async function buscarReservasFuturas() {
            if (!clienteBuscaInput || !mesBuscaEl || !anoBuscaEl) {
                console.warn('Seção de reservas futuras não está disponível nesta página.');
                return;
            }
            const clienteNome = clienteBuscaInput.value.trim();
            const mes = mesBuscaEl.value;
            const ano = anoBuscaEl.value;

            if (!clienteNome || !mes || !ano) {
                alert("Por favor, selecione um cliente, mês e ano.");
                return;
            }

            const clienteEncontrado = Object.values(todosClientes).find(c => c.nome === clienteNome);
            if (!clienteEncontrado) {
                alert("Cliente não encontrado. Por favor, selecione um cliente da lista.");
                return;
            }
            const clienteId = clienteEncontrado.id;

            const dataInicio = `${ano}-${mes}-01`;
            const dataFim = `${ano}-${mes}-${new Date(ano, mes, 0).getDate()}`;
            
            console.log(`Buscando reservas para o cliente ${clienteNome} (${clienteId}) de ${dataInicio} até ${dataFim}`);

            // Limpa o array global antes de carregar
            reservasFuturasDoCliente = []; 

            try {
                const reservasRef = db.collection('reservas');
                const snapshot = await reservasRef
                    .where('id_cliente', '==', clienteId)
                    .where('pagamento_reserva', 'in', ['aguardando', 'atrasada', 'atrasado'])
                    .where('data_reserva', '>=', dataInicio)
                    .where('data_reserva', '<=', dataFim)
                    .orderBy('data_reserva')
                    .orderBy('hora_inicio')
                    .get();

                listaReservasFuturasEl.innerHTML = '';
                
                if (snapshot.empty) {
                    listaReservasFuturasEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Nenhuma reserva pendente encontrada para este cliente e período.</td></tr>`;
                    btnAbrirComandaFuturas.disabled = true;
                } else {
                    snapshot.forEach(doc => {
                        const reserva = doc.data();
                        reserva.id = doc.id;
                        
                        // Armazena a reserva no array global
                        reservasFuturasDoCliente.push(reserva); 

                        // NOVO: Formata a data e obtém o dia da semana
                        const { formatoData, diaDaSemana } = formatarDataEObterDiaDaSemana(reserva.data_reserva);

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><input type="checkbox" class="form-check-input reserva-checkbox" value="${reserva.id}"></td>
                            
                            <td>${diaDaSemana}</td> 
                            
                            <td>${formatoData}</td> 
                            
                            <td>${getQuadraNome(reserva.id_quadra)}</td>
                            <td>${reserva.hora_inicio} - ${reserva.hora_fim}</td>
                            
                            <td class="text-end">
                                R$ <input type="number" id="valor-reserva-${reserva.id}" value="${reserva.valor.toFixed(2)}" class="form-control form-control-sm valor-input-reserva" step="0.01">
                            </td>
                            
                            <td>${reserva.pagamento_reserva}</td>
                        `;
                        // Destaca linhas com status de pagamento de risco
                        if (reserva.pagamento_reserva === 'atrasada' || reserva.pagamento_reserva === 'atrasado') {
                            tr.classList.add('table-danger');
                        }

                        listaReservasFuturasEl.appendChild(tr);
                    });
                    btnAbrirComandaFuturas.disabled = false;
                }

                modalReservasFuturasLabel.textContent = `Reservas Pendentes para ${clienteNome}`;
                nomeClienteModalEl.textContent = `Foram encontradas ${snapshot.size} reservas pendentes.`;
                modalReservasFuturas.show();

            } catch (error) {
                console.error("Erro ao buscar reservas futuras:", error);
                alert("Erro ao buscar reservas. Verifique o console para mais detalhes.");
            }
        }

        /**
         * Cria uma comanda para as reservas selecionadas no modal, usando os valores editados.
         */
        async function abrirComandaComReservasSelecionadas() {
            if (!clienteBuscaInput) {
                alert('A busca por reservas futuras foi removida desta página. Use o botão Adicionar Itens > Adicionar Reservas na comanda.');
                return;
            }
            const checkboxes = document.querySelectorAll('.reserva-checkbox:checked');
            if (checkboxes.length === 0) {
                alert('Selecione pelo menos uma reserva para abrir a comanda.');
                return;
            }

            const nomeCliente = clienteBuscaInput.value.trim();
            const clienteEncontrado = Object.values(todosClientes).find(c => c.nome === nomeCliente);
            const clienteId = clienteEncontrado ? clienteEncontrado.id : null;

            if (!clienteId) {
                alert('Erro: Cliente não encontrado. Recarregue a página.');
                return;
            }

            const itensComanda = [];
            let valorTotal = 0;
            const reservasIdsParaAtualizar = [];

            for (const checkbox of checkboxes) {
                const reservaId = checkbox.value;
                
                // LÊ O VALOR DO INPUT EDITÁVEL
                const inputValorEl = document.getElementById(`valor-reserva-${reservaId}`);
                const valorEditado = parseFloat(inputValorEl.value);

                // Busca a reserva no array global
                const reserva = reservasFuturasDoCliente.find(r => r.id === reservaId);
                
                if (reserva && !isNaN(valorEditado) && valorEditado >= 0) {
                    // Formata a data para a descrição do item
                    const { formatoData } = formatarDataEObterDiaDaSemana(reserva.data_reserva);

                    const item = {
                        id: reservaId, // ID da reserva para vincular
                        nome: `Reserva de Quadra ${getQuadraNome(reserva.id_quadra)} (${formatoData} - ${reserva.hora_inicio})`,
                        preco_venda: valorEditado, // Usa o valor editado
                        quantidade: 1,
                        produtoId: 'reserva-quadra',
                        reservaId: reserva.id
                    };
                    
                    itensComanda.push(item);
                    valorTotal += valorEditado;
                    reservasIdsParaAtualizar.push(reservaId);

                } else if (reserva) {
                    console.warn(`Valor inválido (${inputValorEl.value}) para a reserva ${reservaId}. Item ignorado.`);
                }
            }

            if (itensComanda.length === 0) {
                alert('Nenhum item de reserva válido foi selecionado.');
                return;
            }

            if (!confirm(`Confirmar abertura de comanda para o(a) cliente ${nomeCliente} com ${itensComanda.length} reserva(s), totalizando R$ ${valorTotal.toFixed(2)}?`)) {
                return;
            }
            
            // 2. Cria a nova comanda no Firestore
            try {
                const novaComanda = {
                    cliente: nomeCliente,
                    clienteId: clienteId,
                    reservas_vinculadas_ids: reservasIdsParaAtualizar,
                    itens: itensComanda,
                    data_abertura: firebase.firestore.Timestamp.now(),
                    status_comanda: 'Aberta'
                };

                const comandaRef = await db.collection('comandas').add(novaComanda);

                // 3. Atualiza o status das reservas
                const batch = db.batch();
                reservasIdsParaAtualizar.forEach(id => {
                    const reservaRef = db.collection('reservas').doc(id);
                    batch.update(reservaRef, { 
                        comanda_vinculada_id: comandaRef.id,
                        status_reserva: 'ativa', // Mantém o status original 'ativa'
                        pagamento_reserva: 'em comanda' // Atualiza o status de pagamento para 'em comanda'
                    }); 
                });
                await batch.commit();
            // (removido) alerta de comanda aberta com reservas
// Esconde o modal e recarrega a lista de comandas
                modalReservasFuturas.hide();
                clienteBuscaInput.value = '';
                carregarComandasAbertas();
                
            } catch (error) {
                console.error('Erro ao abrir comanda com reservas:', error);
                alert('Ocorreu um erro ao abrir a comanda.');
            }
        }


        /**
         * Adiciona um item à comanda atual no Firestore.
         */
        async function adicionarItemAComanda(comandaId, codigoBarra) {
            try {
                const comandaRef = db.collection('comandas').doc(comandaId);
                const comandaDoc = await comandaRef.get();
                const comandaData = comandaDoc.data();

                const produto = todosProdutos.find(p => p.codigo_barras === codigoBarra);
                if (!produto) {
                    alert('Produto com o código de barras não encontrado!');
                    return;
                }

                if (!comandaData.itens) {
                    comandaData.itens = [];
                }

                const itemExistente = comandaData.itens.find(item => item.produtoId === produto.id);
                
                if (itemExistente) {
                    itemExistente.quantidade += 1;
                } else {
                    comandaData.itens.push({
                        nome: produto.nome,
                        preco_venda: produto.preco_venda,
                        quantidade: 1,
                        produtoId: produto.id
                    });
                }
                
                await comandaRef.update({
                    itens: comandaData.itens
                });

                carregarComandasAbertas();
                
            } catch (error) {
                console.error("Erro ao adicionar item à comanda:", error);
                alert('Erro ao adicionar item. Tente novamente.');
            }
        }

        /**
         * Adiciona um item manual à comanda atual no Firestore.
         */
        async function adicionarItemManualAComanda(comandaId, produtoId, quantidade) {
            try {
                const comandaRef = db.collection('comandas').doc(comandaId);
                const comandaDoc = await comandaRef.get();
                const comandaData = comandaDoc.data();

                const produto = todosProdutos.find(p => p.id === produtoId);
                if (!produto) {
                    alert('Produto não encontrado!');
                    return;
                }

                if (!comandaData.itens) {
                    comandaData.itens = [];
                }

                const itemExistente = comandaData.itens.find(item => item.produtoId === produtoId);
                
                if (itemExistente) {
                    itemExistente.quantidade += quantidade;
                } else {
                    comandaData.itens.push({
                        nome: produto.nome,
                        preco_venda: produto.preco_venda,
                        quantidade: quantidade,
                        produtoId: produto.id
                    });
                }
                
                await comandaRef.update({
                    itens: comandaData.itens
                });

                carregarComandasAbertas();
                adicionarItemModal.hide();
                
            } catch (error) {
                console.error("Erro ao adicionar item à comanda:", error);
                alert('Erro ao adicionar item. Tente novamente.');
            }
        }

        /**
         * Abre o modal de Adicionar Item para uma comanda específica.
         */
        function abrirModalAdicionarItem(comandaId) {
            comandaAtualId = comandaId;
            adicionarItemModalLabel.textContent = `Adicionar Item`;
            
            selecionarProdutoComandaEl.value = '';
            quantidadeProdutoComandaEl.value = '1';
            
            adicionarItemModal.show();
        }


        // =========================================================
        // Adicionar reservas dentro do modal de itens da comanda
        // =========================================================

        function __hojeStringLocal() {
            const hoje = new Date();
            return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        }

        function __normNomeClienteComanda(nome) {
            return String(nome || '')
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        function __buscarClienteExatoPorNome(nome) {
            const alvo = __normNomeClienteComanda(nome);
            if (!alvo) return null;
            return Object.values(todosClientes || {}).find(c => __normNomeClienteComanda(c.nome) === alvo) || null;
        }

        function __reservaJaEstaNaComanda(comandaData, reservaId) {
            const rid = String(reservaId || '');
            if (!rid) return false;
            const itens = Array.isArray(comandaData?.itens) ? comandaData.itens : [];
            if (itens.some(item => String(item?.reservaId || item?.id || '') === rid)) return true;
            const ids = Array.isArray(comandaData?.reservas_vinculadas_ids) ? comandaData.reservas_vinculadas_ids : [];
            return ids.map(String).includes(rid);
        }

        async function __buscarReservasNaoPagasCliente(clienteId) {
            const cid = String(clienteId || '').trim();
            if (!cid) return [];

            try {
                // Busca pelo cliente e filtra pagamento no JS para não perder reservas
                // criadas com pagamento_reserva vazio ou em outro campo.
                const snap = await db.collection('reservas')
                    .where('id_cliente', '==', cid)
                    .get();

                const lista = [];
                snap.forEach(doc => {
                    const r = doc.data() || {};
                    r.id = doc.id;
                    if (__isNaoPagaReserva(r)) lista.push(r);
                });
                lista.sort(__sortReservasCliente);
                return lista;
            } catch (erro) {
                console.error('[reservas-comanda] Falha ao buscar reservas do cliente:', erro);
                return [];
            }
        }

        async function __buscarReservasNaoPagasDeHoje() {
            const hojeString = __hojeStringLocal();

            try {
                // Busca todas as reservas de hoje e filtra no JS.
                // Isso evita esconder reservas novas com pagamento_reserva vazio/diferente.
                const snap = await db.collection('reservas')
                    .where('data_reserva', '==', hojeString)
                    .get();

                const lista = [];
                snap.forEach(doc => {
                    const r = doc.data() || {};
                    r.id = doc.id;
                    if (__isNaoPagaReserva(r)) lista.push(r);
                });
                lista.sort(__sortReservasCliente);
                return lista;
            } catch (erro) {
                console.error('[reservas-comanda] Falha ao buscar reservas de hoje:', erro);
                return [];
            }
        }

        function __filtrarReservasParaComandaAtual(lista, comandaData) {
            const currentId = String(comandaAtualId || '');
            return (lista || [])
                .filter(r => r && r.id)
                .filter(r => !__isCanceladaReserva(r))
                .filter(r => {
                    const vinculo = String(r.comanda_vinculada_id || '').trim();
                    return !vinculo || vinculo === currentId;
                })
                .filter(r => !__reservaJaEstaNaComanda(comandaData, r.id));
        }

        function __textoDataReservaParaItem(dataReserva) {
            try {
                if (!dataReserva) return '';
                const { formatoData } = formatarDataEObterDiaDaSemana(String(dataReserva));
                return formatoData;
            } catch (_) {
                return String(dataReserva || '');
            }
        }

        function __renderReservasComandaTabela() {
            if (!reservasComandaTbodyEl) return;

            const q = String(reservasComandaBuscaEl?.value || '').toLowerCase().trim();
            let lista = (reservasDisponiveisParaComanda || []).slice();

            if (q) {
                lista = lista.filter(r => {
                    const cliente = getClienteNome(r.id_cliente);
                    const quadra = getQuadraNome(r.id_quadra);
                    const texto = `${cliente || ''} ${r.data_reserva || ''} ${quadra || ''} ${r.hora_inicio || ''} ${r.hora_fim || ''} ${__normStatusPagamento(r)}`.toLowerCase();
                    return texto.includes(q);
                });
            }

            lista.sort((a, b) => {
                const da = String(a.data_reserva || '');
                const dbb = String(b.data_reserva || '');
                if (da !== dbb) return da.localeCompare(dbb);
                const ha = String(a.hora_inicio || '');
                const hb = String(b.hora_inicio || '');
                if (ha !== hb) return ha.localeCompare(hb);
                return __ordemQuadraById(a.id_quadra) - __ordemQuadraById(b.id_quadra);
            });

            if (!lista.length) {
                reservasComandaTbodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted small">Nenhuma reserva não paga disponível para adicionar.</td></tr>`;
                return;
            }

            reservasComandaTbodyEl.innerHTML = lista.map(r => {
                const status = __normStatusPagamento(r) || 'aguardando';
                const badge = (status === 'atrasada' || status === 'atrasado') ? 'bg-danger' : 'bg-warning text-dark';
                const valor = Number(r.valor || 0);
                return `
<tr class="small">
  <td><input type="checkbox" class="form-check-input reserva-comanda-check" value="${escapeHtml(r.id)}"></td>
  <td>${escapeHtml(getClienteNome(r.id_cliente))}</td>
  <td>${escapeHtml(__fmtDataBRComDia ? __fmtDataBRComDia(r.data_reserva || '') : __textoDataReservaParaItem(r.data_reserva))}</td>
  <td>${escapeHtml(getQuadraNome(r.id_quadra))}</td>
  <td>${escapeHtml(String(r.hora_inicio || ''))} - ${escapeHtml(String(r.hora_fim || ''))}</td>
  <td class="text-end">
    <input type="number" step="0.01" min="0" class="form-control form-control-sm text-end reserva-comanda-valor" data-reserva-valor="${escapeHtml(r.id)}" value="${valor.toFixed(2)}">
  </td>
  <td><span class="badge ${badge}">${escapeHtml(status)}</span></td>
</tr>`;
            }).join('');

            if (reservasComandaSelecionarTodasEl) reservasComandaSelecionarTodasEl.checked = false;
        }

        async function abrirModalAdicionarReservasComanda() {
            if (!comandaAtualId) {
                alert('Abra o modal por uma comanda antes de adicionar reservas.');
                return;
            }

            if (!modalAdicionarReservasComanda) return;

            reservasDisponiveisParaComanda = [];
            modoReservasComanda = 'hoje';
            clienteReservasComandaId = null;
            if (reservasComandaBuscaEl) reservasComandaBuscaEl.value = '';
            if (reservasComandaSelecionarTodasEl) reservasComandaSelecionarTodasEl.checked = false;
            if (reservasComandaTbodyEl) reservasComandaTbodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-muted small">Carregando reservas...</td></tr>`;
            if (reservasComandaInfoEl) reservasComandaInfoEl.textContent = 'Verificando nome da comanda e buscando reservas...';
            if (modalAdicionarReservasComandaLabel) modalAdicionarReservasComandaLabel.textContent = 'Adicionar Reservas à Comanda';

            try {
                const comandaDoc = await db.collection('comandas').doc(comandaAtualId).get();
                if (!comandaDoc.exists) {
                    alert('Comanda não encontrada. Recarregue a página.');
                    return;
                }

                comandaAtualData = { id: comandaDoc.id, ...comandaDoc.data() };
                const nomeComanda = String(comandaAtualData.cliente || '').trim();
                let clienteEncontrado = null;

                if (comandaAtualData.clienteId && todosClientes[comandaAtualData.clienteId]) {
                    clienteEncontrado = todosClientes[comandaAtualData.clienteId];
                } else {
                    clienteEncontrado = __buscarClienteExatoPorNome(nomeComanda);
                }

                let lista = [];
                if (clienteEncontrado && clienteEncontrado.id) {
                    modoReservasComanda = 'cliente';
                    clienteReservasComandaId = clienteEncontrado.id;
                    lista = await __buscarReservasNaoPagasCliente(clienteEncontrado.id);
                    if (reservasComandaInfoEl) {
                        reservasComandaInfoEl.textContent = `Cliente encontrado: ${clienteEncontrado.nome}. Listando todas as reservas não pagas dele.`;
                    }
                    if (modalAdicionarReservasComandaLabel) {
                        modalAdicionarReservasComandaLabel.textContent = `Reservas de ${clienteEncontrado.nome}`;
                    }
                } else {
                    modoReservasComanda = 'hoje';
                    lista = await __buscarReservasNaoPagasDeHoje();
                    if (reservasComandaInfoEl) {
                        reservasComandaInfoEl.textContent = `Nome da comanda não encontrado exatamente em Clientes. Listando reservas não pagas de hoje para você selecionar.`;
                    }
                    if (modalAdicionarReservasComandaLabel) {
                        modalAdicionarReservasComandaLabel.textContent = 'Reservas não pagas de hoje';
                    }
                }

                reservasDisponiveisParaComanda = __filtrarReservasParaComandaAtual(lista, comandaAtualData);
                __renderReservasComandaTabela();
                modalAdicionarReservasComanda.show();
            } catch (erro) {
                console.error('Erro ao abrir reservas para adicionar à comanda:', erro);
                if (reservasComandaTbodyEl) reservasComandaTbodyEl.innerHTML = `<tr><td colspan="7" class="text-center text-danger small">Erro ao carregar reservas. Veja o console.</td></tr>`;
                modalAdicionarReservasComanda.show();
            }
        }

        async function adicionarReservasSelecionadasNaComandaAtual() {
            if (!comandaAtualId) {
                alert('Nenhuma comanda selecionada.');
                return;
            }

            const checks = Array.from(document.querySelectorAll('#reservas-comanda-tbody .reserva-comanda-check:checked'));
            if (!checks.length) {
                alert('Selecione pelo menos uma reserva.');
                return;
            }

            const reservaIds = checks.map(cb => cb.value).filter(Boolean);
            const valores = {};
            reservaIds.forEach(id => {
                const input = document.querySelector(`#reservas-comanda-tbody input[data-reserva-valor="${CSS.escape(id)}"]`);
                const valor = Number(String(input?.value || '0').replace(',', '.'));
                valores[id] = Number.isFinite(valor) && valor >= 0 ? valor : 0;
            });

            try {
                btnConfirmarAdicionarReservasComanda.disabled = true;

                const comandaRef = db.collection('comandas').doc(comandaAtualId);
                const comandaDoc = await comandaRef.get();
                if (!comandaDoc.exists) {
                    alert('Comanda não encontrada.');
                    return;
                }
                const comandaData = comandaDoc.data() || {};

                const reservasParaAdicionar = [];
                for (const reservaId of reservaIds) {
                    const reservaDoc = await db.collection('reservas').doc(reservaId).get();
                    if (!reservaDoc.exists) continue;
                    const r = reservaDoc.data() || {};
                    r.id = reservaDoc.id;

                    const vinculo = String(r.comanda_vinculada_id || '').trim();
                    if (vinculo && vinculo !== String(comandaAtualId)) continue;
                    if (__isCanceladaReserva(r)) continue;
                    if (__reservaJaEstaNaComanda(comandaData, r.id)) continue;
                    reservasParaAdicionar.push(r);
                }

                if (!reservasParaAdicionar.length) {
                    alert('Nenhuma reserva válida para adicionar. Talvez ela já esteja em outra comanda.');
                    return;
                }

                reservasParaAdicionar.sort(__sortReservasCliente);

                const itensAtuais = Array.isArray(comandaData.itens) ? [...comandaData.itens] : [];
                const novosItens = reservasParaAdicionar.map(reserva => ({
                    nome: `Reserva de Quadra ${getQuadraNome(reserva.id_quadra)} (${__textoDataReservaParaItem(reserva.data_reserva)} - ${reserva.hora_inicio || ''})`,
                    preco_venda: valores[reserva.id] != null ? Number(valores[reserva.id]) : Number(reserva.valor || 0),
                    quantidade: 1,
                    produtoId: 'reserva-quadra',
                    reservaId: reserva.id
                }));

                const idsAtuais = Array.isArray(comandaData.reservas_vinculadas_ids) ? comandaData.reservas_vinculadas_ids.map(String) : [];
                const idsFinais = Array.from(new Set([...idsAtuais, ...reservasParaAdicionar.map(r => String(r.id))]));

                const updateComanda = {
                    itens: [...itensAtuais, ...novosItens],
                    reservas_vinculadas_ids: idsFinais
                };

                const reservaBase = reservasParaAdicionar[0];
                if (!comandaData.reserva_time_id && reservaBase) {
                    const nomeClienteReserva = getClienteNome(reservaBase.id_cliente);
                    updateComanda.reserva_time_id = reservaBase.id;
                    updateComanda.reserva_time_label = `${nomeClienteReserva} • ${getQuadraNome(reservaBase.id_quadra)} • ${reservaBase.hora_inicio || ''}`;
                    updateComanda.reserva_time_vinculado_em = firebase.firestore.Timestamp.now();
                    updateComanda.reserva_time_principal = true;
                }
                if (!comandaData.clienteId && clienteReservasComandaId) {
                    updateComanda.clienteId = clienteReservasComandaId;
                }

                const batch = db.batch();
                batch.update(comandaRef, updateComanda);
                reservasParaAdicionar.forEach(reserva => {
                    const valorAtualizado = valores[reserva.id] != null ? Number(valores[reserva.id]) : Number(reserva.valor || 0);
                    batch.update(db.collection('reservas').doc(reserva.id), {
                        comanda_vinculada_id: comandaAtualId,
                        status_reserva: 'ativa',
                        valor: valorAtualizado
                    });
                });
                await batch.commit();

                __fecharModaisAdicionarReservaComanda();
                carregarComandasAbertas();
                carregarReservasDoDia();
                if (typeof initResumoDoDia === 'function') initResumoDoDia();
            } catch (erro) {
                console.error('Erro ao adicionar reservas à comanda:', erro);
                alert('Erro ao adicionar reservas à comanda. Veja o console.');
            } finally {
                btnConfirmarAdicionarReservasComanda.disabled = false;
            }
        }

        /**
         * Exclui uma comanda do sistema.
         */
        async function excluirComanda(comandaId) {
            if (!confirm("Tem certeza que deseja remover esta comanda da tela de abertas? Ela ficará salva como Excluída para aparecer no relatório.")) {
                return;
            }

            try {
                const comandaRef = db.collection('comandas').doc(comandaId);
                const comandaDoc = await comandaRef.get();
                if (!comandaDoc.exists) {
                    alert('Comanda não encontrada. Recarregue a página.');
                    return;
                }

                const comandaData = comandaDoc.data() || {};
                const agora = firebase.firestore.Timestamp.now();
                const totais = __calcularTotaisComandaParaExclusao(comandaData);
                const eraNaoPaga = String(comandaData.status_comanda || '').toLowerCase() !== 'paga';
                const vinculadaNaoPagou = __isComandaNaoPagou(comandaData);

                const batch = db.batch();

                if (Array.isArray(comandaData.reservas_vinculadas_ids) && comandaData.reservas_vinculadas_ids.length > 0) {
                    for (const reservaId of comandaData.reservas_vinculadas_ids) {
                        if (!reservaId) continue;
                        const reservaRef = db.collection('reservas').doc(String(reservaId));
                        batch.update(reservaRef, {
                            comanda_vinculada_id: null,
                            status_reserva: 'aguardando',
                            pagamento_reserva: 'aguardando'
                        });
                    }
                }

                batch.update(comandaRef, {
                    status_comanda: 'Excluída',
                    excluida: true,
                    fechada_nao_paga: eraNaoPaga || vinculadaNaoPagou,
                    data_exclusao: agora,
                    excluida_em: agora,
                    status_anterior_exclusao: comandaData.status_comanda || 'Aberta',
                    valor_total: totais.total,
                    valor_reservas: totais.reservas,
                    valor_produtos: totais.produtos,
                    motivo_nao_pago: comandaData.obs_nao_pago || comandaData.obs || '',
                    obs_exclusao: comandaData.obs_nao_pago || comandaData.obs || ''
                });

                await batch.commit();

                carregarComandasAbertas();
                carregarReservasDoDia();
                __ensureUIReservasNaoPagas();
                if (typeof initResumoDoDia === 'function') initResumoDoDia();
            } catch (error) {
                console.error("Erro ao excluir comanda:", error);
                alert("Erro ao excluir comanda. Tente novamente.");
            }
        }

        // =========================================================
        // LÓGICA DE PAGAMENTO (Demais Funções Omitidas para Foco, mas mantidas no código final)
        // =========================================================

        /**
         * Abre o novo modal de pagamento para uma comanda específica.
         */
        async function abrirModalPagamento(comandaId) {
            comandaAtualId = comandaId;
            
            try {
                const comandaDoc = await db.collection('comandas').doc(comandaId).get();
                if (!comandaDoc.exists) {
                    alert('Comanda não encontrada.');
                    return;
                }

                comandaAtualData = comandaDoc.data();
                comandaAtualData.id = comandaDoc.id;

                pagamentoModalLabel.textContent = `Pagamento Comanda de ${comandaAtualData.cliente}`;

                listaItensPagamentoEl.innerHTML = '';
                let totalComanda = 0;
                
                if (comandaAtualData.itens && comandaAtualData.itens.length > 0) {
                    comandaAtualData.itens.forEach((item, index) => {
                        const tr = document.createElement('tr');
                        const itemTotal = item.preco_venda * item.quantidade;
                        totalComanda += itemTotal;
                        
                        tr.innerHTML = `
                            <td><input type="checkbox" class="form-check-input item-pagar-checkbox" data-index="${index}" checked></td>
                            <td>${item.nome}</td>
                            <td>R$ ${item.preco_venda.toFixed(2)}</td>
                            <td>R$ ${itemTotal.toFixed(2)}</td>
                            <td>${item.quantidade}</td>
                            <td><input type="number" class="form-control form-control-sm qtd-pagar-input" min="0" max="${item.quantidade}" value="${item.quantidade}" data-index="${index}"></td>
                        `;
                        listaItensPagamentoEl.appendChild(tr);
                    });
                } else {
                    listaItensPagamentoEl.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Comanda vazia.</td></tr>`;
                    btnFinalizarPagamentoModal.disabled = true;
                }
                
                valorRecebidoInput.value = totalComanda.toFixed(2);

                document.querySelectorAll('.item-pagar-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        const index = e.target.dataset.index;
                        const qtdInput = document.querySelector(`.qtd-pagar-input[data-index="${index}"]`);
                        
                        if (e.target.checked) {
                            qtdInput.disabled = false;
                            qtdInput.value = comandaAtualData.itens[index].quantidade;
                        } else {
                            qtdInput.disabled = true;
                            qtdInput.value = '0';
                        }
                        atualizarTotaisPagamento();
                    });
                });

                document.querySelectorAll('.qtd-pagar-input').forEach(input => {
                    input.addEventListener('input', atualizarTotaisPagamento);
                });
                
                atualizarTotaisPagamento();
                pagamentoModal.show();
            } catch (error) {
                console.error("Erro ao carregar dados de pagamento:", error);
                alert('Erro ao carregar dados de pagamento. Tente novamente.');
            }
        }
        
        /**
         * Recalcula o total a pagar (dos itens selecionados) e o saldo restante da comanda.
         */
        function atualizarTotaisPagamento() {
            let totalItensSelecionados = 0;
            let totalComanda = 0;
            
            comandaAtualData.itens.forEach((item, index) => {
                const itemTotal = item.preco_venda * item.quantidade;
                totalComanda += itemTotal;
                
                const checkbox = document.querySelector(`.item-pagar-checkbox[data-index="${index}"]`);
                const qtdPagarInput = document.querySelector(`.qtd-pagar-input[data-index="${index}"]`);

                if (checkbox && checkbox.checked) {
                    let qtdPagar = parseFloat(qtdPagarInput.value) || 0;
                    
                    if (qtdPagar > item.quantidade) {
                        qtdPagar = item.quantidade;
                        qtdPagarInput.value = qtdPagar;
                    }
                    if (qtdPagar < 0) {
                        qtdPagar = 0;
                        qtdPagarInput.value = 0;
                    }

                    totalItensSelecionados += item.preco_venda * qtdPagar;
                } else if (qtdPagarInput) {
                    qtdPagarInput.value = 0;
                }
            });
            
            totalPagarEl.textContent = `R$ ${totalItensSelecionados.toFixed(2)}`;
            saldoRestanteEl.textContent = `R$ ${(totalComanda - totalItensSelecionados).toFixed(2)}`;
            btnFinalizarPagamentoModal.disabled = (totalItensSelecionados <= 0);
        }

        function __parseNumeroMoeda(valor) {
            if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
            let txt = String(valor || '').replace(/[R$\s]/g, '').trim();
            if (!txt) return 0;
            // Aceita tanto 400.00 quanto 400,00 e também 1.400,00
            if (txt.includes(',')) {
                txt = txt.replace(/\./g, '').replace(',', '.');
            }
            const n = Number(txt);
            return Number.isFinite(n) ? n : 0;
        }

        function __isItemReservaPago(item) {
            if (!item) return false;
            const produtoId = String(item.produtoId || '').toLowerCase();
            const nome = String(item.nome || '').toLowerCase();
            return !!item.reservaId || produtoId === 'reserva-quadra' || nome.startsWith('reserva de quadra');
        }

        function __sanitizeFirestore(obj) {
            if (obj === undefined) return null;
            if (obj === null) return null;
            if (obj instanceof Date) return obj;
            if (typeof obj !== 'object') return obj;
            if (typeof obj.toDate === 'function' || typeof obj.toMillis === 'function') return obj;
            if (Array.isArray(obj)) return obj.map(__sanitizeFirestore);
            const out = {};
            Object.keys(obj).forEach(k => {
                const v = obj[k];
                if (v !== undefined) out[k] = __sanitizeFirestore(v);
            });
            return out;
        }

        async function __montarContextoReservasPagas(comandaId, comandaData, itensReservasPagos, reservaIdsExtras = []) {
            const itens = (itensReservasPagos || []).filter(__isItemReservaPago);
            const idsItens = itens.map(i => String(i.reservaId || '').trim()).filter(Boolean);
            const reservaIds = Array.from(new Set([...idsItens, ...(reservaIdsExtras || []).map(String).filter(Boolean)]));
            if (!reservaIds.length && !itens.length) return null;

            const valorPorReserva = new Map();
            itens.forEach(item => {
                const rid = String(item.reservaId || '').trim();
                const valorItem = Number(item.preco_venda || 0) * Number(item.quantidade || 0);
                if (rid) valorPorReserva.set(rid, (valorPorReserva.get(rid) || 0) + valorItem);
            });

            const reservas = [];
            const clientesMap = new Map();
            let valorTotalReservas = itens.reduce((total, item) => total + (Number(item.preco_venda || 0) * Number(item.quantidade || 0)), 0);

            for (const reservaId of reservaIds) {
                try {
                    const reservaDoc = await db.collection('reservas').doc(reservaId).get();
                    if (!reservaDoc.exists) continue;
                    const reservaData = reservaDoc.data() || {};
                    const clienteId = String(reservaData.id_cliente || '').trim();
                    let clienteData = null;

                    if (clienteId) {
                        if (todosClientes && todosClientes[clienteId]) {
                            clienteData = { id: clienteId, ...todosClientes[clienteId] };
                        } else {
                            try {
                                const clienteDoc = await db.collection('clientes').doc(clienteId).get();
                                if (clienteDoc.exists) clienteData = { id: clienteDoc.id, ...clienteDoc.data() };
                            } catch (_) {}
                        }
                        if (clienteData) clientesMap.set(clienteId, clienteData);
                    }

                    const valorPagoItem = valorPorReserva.has(reservaId) ? valorPorReserva.get(reservaId) : Number(reservaData.valor || 0);
                    reservas.push({
                        id: reservaId,
                        valor_pago_item: valorPagoItem,
                        dados_reserva: { id: reservaId, ...reservaData },
                        cliente: clienteData,
                        cliente_nome: clienteData?.nome || getClienteNome(clienteId) || String(comandaData.cliente || '')
                    });

                    if (!valorPorReserva.has(reservaId) && !itens.length) {
                        valorTotalReservas += Number(reservaData.valor || 0);
                    }
                } catch (erro) {
                    console.warn('Não foi possível buscar dados completos da reserva paga:', reservaId, erro);
                }
            }

            const clientes = Array.from(clientesMap.values());
            const clientePrincipal = clientes[0] || null;
            return {
                comandaId,
                comanda: {
                    id: comandaId,
                    cliente: comandaData.cliente || '',
                    clienteId: comandaData.clienteId || clientePrincipal?.id || '',
                    reserva_time_id: comandaData.reserva_time_id || '',
                    reserva_time_label: comandaData.reserva_time_label || '',
                    data_abertura: comandaData.data_abertura || null
                },
                clientePrincipal,
                clientes,
                reservas,
                itens_reserva_pagos: itens,
                reservaIds: reservaIds,
                valor_total_reservas: valorTotalReservas
            };
        }

        function __limparModalFormaPagamentoReserva() {
            if (formaReservaDinheiroEl) formaReservaDinheiroEl.value = '';
            if (formaReservaPixEl) formaReservaPixEl.value = '';
            if (formaReservaCartaoEl) formaReservaCartaoEl.value = '';
            if (formaReservaFuncionarioEl) formaReservaFuncionarioEl.value = '';
            __atualizarTotaisFormaPagamentoReserva();
        }

        function __abrirModalFormaPagamentoReserva(contexto) {
            if (!contexto || !modalFormaPagamentoReserva) return;
            pagamentoReservasPendente = contexto;
            const valorTotal = Number(contexto.valor_total_reservas || 0);
            if (formaReservaTotalEl) formaReservaTotalEl.textContent = fmtBR(valorTotal);

            const nomes = (contexto.clientes || []).map(c => c && c.nome).filter(Boolean);
            const clienteTxt = nomes.length ? nomes.join(', ') : (contexto.comanda?.cliente || 'Cliente da comanda');
            if (formaReservaSubtituloEl) formaReservaSubtituloEl.textContent = `${clienteTxt} • ${contexto.reservas.length} reserva(s) paga(s)`;

            const detalhes = contexto.reservas.map(r => {
                const d = r.dados_reserva || {};
                return `${__textoDataReservaParaItem(d.data_reserva)} ${d.hora_inicio || ''} • ${getQuadraNome(d.id_quadra)} • ${fmtBR(r.valor_pago_item || d.valor || 0)}`;
            }).join(' | ');
            if (formaReservaDetalhesEl) formaReservaDetalhesEl.textContent = detalhes || 'Reservas pagas nesta comanda.';

            __limparModalFormaPagamentoReserva();
            modalFormaPagamentoReserva.show();
        }

        function __atualizarTotaisFormaPagamentoReserva() {
            const dinheiro = __parseNumeroMoeda(formaReservaDinheiroEl?.value || 0);
            const pix = __parseNumeroMoeda(formaReservaPixEl?.value || 0);
            const cartao = __parseNumeroMoeda(formaReservaCartaoEl?.value || 0);
            const total = dinheiro + pix + cartao;
            const esperado = Number(pagamentoReservasPendente?.valor_total_reservas || 0);
            const diferenca = total - esperado;
            if (formaReservaTotalInformadoEl) formaReservaTotalInformadoEl.textContent = fmtBR(total);
            if (formaReservaDiferencaEl) {
                formaReservaDiferencaEl.textContent = `Diferença: ${fmtBR(diferenca)}`;
                formaReservaDiferencaEl.className = Math.abs(diferenca) <= 0.01 ? 'text-success' : 'text-danger';
            }
        }

        async function salvarFormaPagamentoReservaPaga() {
            if (!pagamentoReservasPendente) {
                alert('Nenhuma reserva pendente para registrar.');
                return;
            }

            const valorTotal = Number(pagamentoReservasPendente.valor_total_reservas || 0);
            const dinheiro = __parseNumeroMoeda(formaReservaDinheiroEl?.value || 0);
            const pix = __parseNumeroMoeda(formaReservaPixEl?.value || 0);
            const cartao = __parseNumeroMoeda(formaReservaCartaoEl?.value || 0);
            const totalInformado = dinheiro + pix + cartao;
            const funcionario = String(formaReservaFuncionarioEl?.value || '').trim();

            if (!funcionario) {
                alert('Informe o funcionário que recebeu.');
                return;
            }
            if (Math.abs(totalInformado - valorTotal) > 0.01) {
                alert(`A soma das formas de pagamento precisa fechar o valor da reserva.\nValor da reserva: ${fmtBR(valorTotal)}\nInformado: ${fmtBR(totalInformado)}`);
                return;
            }

            try {
                if (btnSalvarFormaPagamentoReserva) btnSalvarFormaPagamentoReserva.disabled = true;

                const registro = __sanitizeFirestore({
                    data_registro: firebase.firestore.Timestamp.now(),
                    origem: 'comandas',
                    comanda_id: pagamentoReservasPendente.comandaId,
                    comanda: pagamentoReservasPendente.comanda,
                    cliente_id_principal: pagamentoReservasPendente.clientePrincipal?.id || pagamentoReservasPendente.comanda?.clienteId || '',
                    cliente_nome_principal: pagamentoReservasPendente.clientePrincipal?.nome || pagamentoReservasPendente.comanda?.cliente || '',
                    clientes: pagamentoReservasPendente.clientes,
                    valor_total_reserva: valorTotal,
                    pago_seguinte_forma: {
                        dinheiro,
                        pix,
                        cartao,
                        total_informado: totalInformado
                    },
                    funcionario_que_recebeu: funcionario,
                    reservas: pagamentoReservasPendente.reservas,
                    reservas_ids: pagamentoReservasPendente.reservaIds,
                    itens_reserva_pagos: pagamentoReservasPendente.itens_reserva_pagos
                });

                const docRef = await db.collection('Reservas pagas').add(registro);

                const batch = db.batch();
                (pagamentoReservasPendente.reservaIds || []).forEach(reservaId => {
                    batch.update(db.collection('reservas').doc(reservaId), {
                        registro_reserva_paga_id: docRef.id,
                        forma_pagamento_reserva_registrada: true,
                        forma_pagamento_reserva_registrada_em: firebase.firestore.Timestamp.now()
                    });
                });
                await batch.commit();

                pagamentoReservasPendente = null;
                if (modalFormaPagamentoReserva) modalFormaPagamentoReserva.hide();
                carregarReservasDoDia();
                if (typeof initResumoDoDia === 'function') initResumoDoDia();
            } catch (erro) {
                console.error('Erro ao registrar forma de pagamento da reserva:', erro);
                alert('Erro ao registrar a forma de pagamento da reserva. Veja o console.');
            } finally {
                if (btnSalvarFormaPagamentoReserva) btnSalvarFormaPagamentoReserva.disabled = false;
            }
        }

        /**
         * Finaliza o pagamento dos itens selecionados, atualizando a comanda.
         */
        async function finalizarPagamento() {
            const valorRecebido = __parseNumeroMoeda(valorRecebidoInput.value || 0);
            const totalItensPagar = __parseNumeroMoeda(totalPagarEl.textContent || 0);

            if (totalItensPagar === 0) {
                alert("Nenhum item foi selecionado para pagamento.");
                return;
            }

            if (valorRecebido < totalItensPagar) {
                alert("O valor recebido é menor que o total dos itens selecionados. Por favor, insira o valor correto.");
                return;
            }

            if (!confirm(`Confirmar pagamento de ${fmtBR(totalItensPagar)}?`)) {
                return;
            }
            
            try {
                const comandaRef = db.collection('comandas').doc(comandaAtualId);
                const comandaDoc = await comandaRef.get();
                if (!comandaDoc.exists) {
                    alert('Comanda não encontrada.');
                    return;
                }
                const comandaData = comandaDoc.data() || {};
                
                const novosItensComanda = [];
                let todosItensForamPagos = true;
                const itensPagos = [];

                (comandaData.itens || []).forEach((item, index) => {
                    const checkbox = document.querySelector(`.item-pagar-checkbox[data-index="${index}"]`);
                    const qtdPagarInput = document.querySelector(`.qtd-pagar-input[data-index="${index}"]`);
                    let qtdPagar = parseInt(qtdPagarInput?.value) || 0;

                    if (checkbox && checkbox.checked && qtdPagar > 0) {
                        if (qtdPagar > Number(item.quantidade || 0)) qtdPagar = Number(item.quantidade || 0);
                        itensPagos.push({ ...item, quantidade: qtdPagar });

                        if (qtdPagar < Number(item.quantidade || 0)) {
                            todosItensForamPagos = false;
                            novosItensComanda.push({
                                ...item,
                                quantidade: Number(item.quantidade || 0) - qtdPagar
                            });
                        }
                    } else {
                        novosItensComanda.push(item);
                        todosItensForamPagos = false;
                    }
                });

                const itensReservasPagos = itensPagos.filter(__isItemReservaPago);
                const idsReservaPagosPelosItens = itensReservasPagos.map(i => String(i.reservaId || '').trim()).filter(Boolean);
                const idsReservaExtrasSeComandaTodaPaga = todosItensForamPagos && Array.isArray(comandaData.reservas_vinculadas_ids)
                    ? comandaData.reservas_vinculadas_ids.map(String).filter(Boolean)
                    : [];
                const reservaIdsParaMarcarPagas = Array.from(new Set([...idsReservaPagosPelosItens, ...idsReservaExtrasSeComandaTodaPaga]));

                let contextoReservasPagas = null;
                if (itensReservasPagos.length || reservaIdsParaMarcarPagas.length) {
                    contextoReservasPagas = await __montarContextoReservasPagas(comandaAtualId, comandaData, itensReservasPagos, reservaIdsParaMarcarPagas);
                }

                const batch = db.batch();
                const agora = firebase.firestore.Timestamp.now();

                // Guarda histórico de pagamentos parciais.
                // Antes, quando a comanda era paga em partes, o item pago era removido da comanda
                // e no fechamento final ficava salvo apenas o último pagamento. Agora acumulamos tudo.
                const pagamentosParciaisAnteriores = Array.isArray(comandaData.pagamentos_parciais) ? comandaData.pagamentos_parciais : [];
                const itensPagosAcumuladosAnteriores = Array.isArray(comandaData.itens_pagos_acumulados) ? comandaData.itens_pagos_acumulados : [];
                const valorPagoAnterior = Number(comandaData.valor_pago_acumulado || comandaData.valor_total_pago || 0);
                const valorRecebidoAnterior = Number(comandaData.valor_recebido_acumulado || comandaData.valor_recebido_total || 0);

                const itensPagosRegistrados = itensPagos.map(item => __sanitizeFirestore({
                    ...item,
                    pago_em: agora,
                    valor_pago_item: Number(item.preco_venda || 0) * Number(item.quantidade || 0)
                }));

                const pagamentosParciaisAtualizados = [
                    ...pagamentosParciaisAnteriores,
                    __sanitizeFirestore({
                        data_pagamento: agora,
                        valor_pago: totalItensPagar,
                        valor_recebido: valorRecebido,
                        itens_pagos: itensPagosRegistrados
                    })
                ];

                const itensPagosAcumulados = [
                    ...itensPagosAcumuladosAnteriores,
                    ...itensPagosRegistrados
                ];

                const valorPagoAcumulado = valorPagoAnterior + totalItensPagar;
                const valorRecebidoAcumulado = valorRecebidoAnterior + valorRecebido;

                const somarItens = (lista, predicado = null) => (lista || []).reduce((soma, item) => {
                    if (predicado && !predicado(item)) return soma;
                    return soma + (Number(item.preco_venda || item.valor || 0) * Number(item.quantidade || 1));
                }, 0);

                const valorReservasAcumulado = somarItens(itensPagosAcumulados, __isItemReservaPago);
                const valorProdutosAcumulado = somarItens(itensPagosAcumulados, item => !__isItemReservaPago(item));

                if (todosItensForamPagos) {
                    batch.update(comandaRef, {
                        status_comanda: 'Paga',
                        data_pagamento: agora,
                        // Ao fechar, mantemos todos os itens pagos no campo itens para o relatório mostrar a comanda completa.
                        itens: itensPagosAcumulados,
                        valor_total: valorPagoAcumulado,
                        valor_recebido: valorRecebidoAcumulado,
                        valor_total_pago: valorPagoAcumulado,
                        valor_pago_acumulado: valorPagoAcumulado,
                        valor_recebido_total: valorRecebidoAcumulado,
                        valor_recebido_acumulado: valorRecebidoAcumulado,
                        valor_reservas: valorReservasAcumulado,
                        valor_produtos: valorProdutosAcumulado,
                        pagamentos_parciais: pagamentosParciaisAtualizados,
                        itens_pagos_acumulados: itensPagosAcumulados,
                        ultimo_pagamento_em: agora,
                        qtd_pagamentos_parciais: pagamentosParciaisAtualizados.length,
                        pagamento_parcial: pagamentosParciaisAtualizados.length > 1
                    });
                } else {
                    batch.update(comandaRef, {
                        status_comanda: 'Aberta',
                        itens: novosItensComanda,
                        valor_total_pago: valorPagoAcumulado,
                        valor_pago_acumulado: valorPagoAcumulado,
                        valor_recebido_total: valorRecebidoAcumulado,
                        valor_recebido_acumulado: valorRecebidoAcumulado,
                        pagamentos_parciais: pagamentosParciaisAtualizados,
                        itens_pagos_acumulados: itensPagosAcumulados,
                        ultimo_pagamento_em: agora,
                        qtd_pagamentos_parciais: pagamentosParciaisAtualizados.length,
                        pagamento_parcial: true
                    });
                }

                reservaIdsParaMarcarPagas.forEach(reservaId => {
                    batch.update(db.collection('reservas').doc(reservaId), {
                        pagamento_reserva: 'pago',
                        data_pagamento_reserva: agora,
                        comanda_pagamento_id: comandaAtualId
                    });
                });

                await batch.commit();

                pagamentoModal.hide();
                carregarComandasAbertas();
                carregarHistoricoDeVendas();
                carregarReservasDoDia();
                if (typeof initResumoDoDia === 'function') initResumoDoDia();

                if (contextoReservasPagas && Number(contextoReservasPagas.valor_total_reservas || 0) > 0) {
                    setTimeout(() => __abrirModalFormaPagamentoReserva(contextoReservasPagas), 250);
                }
            } catch (error) {
                console.error("Erro ao finalizar pagamento:", error);
                alert("Ocorreu um erro ao finalizar o pagamento. Tente novamente.");
            }
        }

       
        // =========================================================
        // Funções do Histórico de Vendas (Demais Funções Omitidas para Foco, mas mantidas no código final)
        // =========================================================

        function formatarData(timestamp) {
            if (!timestamp || !timestamp.toDate) return 'N/A';
            const date = timestamp.toDate();
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            const hora = String(date.getHours()).padStart(2, '0');
            const minuto = String(date.getMinutes()).padStart(2, '0');
            return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
        }
        
        async function carregarHistoricoDeVendas() {
            // Histórico foi movido para relatorioComandas.html.
            if (!filtroDataEl || !listaHistoricoEl) return;
            const dataFiltro = filtroDataEl.value;
            listaHistoricoEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>`;

            if (!dataFiltro) {
                listaHistoricoEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Selecione uma data para ver o histórico.</td></tr>`;
                return;
            }
            
            const [ano, mes, dia] = dataFiltro.split('-').map(Number);
            const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
            const dataFim = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));

            const timestampInicio = firebase.firestore.Timestamp.fromDate(dataInicio);
            const timestampFim = firebase.firestore.Timestamp.fromDate(dataFim);

            let historico = [];

            try {
                // Busca comandas pagas
                if (tipoFiltroHistorico === 'Comandas' || tipoFiltroHistorico === 'Ambos') {
                    const comandasRef = db.collection('comandas');
                    const comandasSnapshot = await comandasRef
                        .where('status_comanda', '==', 'Paga')
                        .where('data_pagamento', '>=', timestampInicio)
                        .where('data_pagamento', '<=', timestampFim)
                        .orderBy('data_pagamento', 'desc')
                        .get();
                    
                    comandasSnapshot.forEach(doc => {
                        const comanda = doc.data();
                        historico.push({
                            id: doc.id,
                            tipo: 'Comanda',
                            cliente: comanda.cliente,
                            data: comanda.data_pagamento,
                            total: comanda.valor_total,
                            itens: comanda.itens || []
                        });
                    });
                }
                
                // Busca vendas diretas
                if (tipoFiltroHistorico === 'Vendas' || tipoFiltroHistorico === 'Ambos') {
                    const vendasRef = db.collection('Venda direta');
                    const vendasSnapshot = await vendasRef
                        .where('data_venda', '>=', timestampInicio)
                        .where('data_venda', '<=', timestampFim)
                        .orderBy('data_venda', 'desc')
                        .get();

                    vendasSnapshot.forEach(doc => {
                        const venda = doc.data();
                        historico.push({
                            id: doc.id,
                            tipo: 'Venda Direta',
                            cliente: `ID #${doc.id.substring(0, 4)}`,
                            data: venda.data_venda,
                            total: venda.valor_total,
                            itens: venda.itens || []
                        });
                    });
                }

                // Ordena o histórico por data (mais recente primeiro)
                historico.sort((a, b) => b.data.toMillis() - a.data.toMillis());

                listaHistoricoEl.innerHTML = '';
                if (historico.length === 0) {
                    listaHistoricoEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhuma transação encontrada nesta data.</td></tr>`;
                    return;
                }

                historico.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.tipo}</td>
                        <td>${item.cliente}</td>
                        <td>${formatarData(item.data)}</td>
                        <td>R$ ${item.total.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-info py-0 px-2" onclick="abrirModalDetalhes('${item.id}', '${item.tipo}')">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    `;
                    listaHistoricoEl.appendChild(tr);
                });

            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
                listaHistoricoEl.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Erro ao carregar histórico.</td></tr>`;
            }
        }
        
        async function abrirModalDetalhes(id, tipo) {
            try {
                let docRef;
                if (tipo === 'Comanda') {
                    docRef = db.collection('comandas').doc(id);
                } else if (tipo === 'Venda Direta') {
                    docRef = db.collection('Venda direta').doc(id);
                }
                
                const doc = await docRef.get();
                if (!doc.exists) {
                    alert('Detalhes da transação não encontrados.');
                    return;
                }
                
                const data = doc.data();
                
                detalhesTipoEl.textContent = tipo;
                detalhesClienteEl.textContent = tipo === 'Comanda' ? data.cliente : `Venda Direta (ID #${id.substring(0, 4)})`;
                detalhesTotalEl.textContent = `R$ ${data.valor_total.toFixed(2)}`;
                detalhesDataEl.textContent = formatarData(tipo === 'Comanda' ? data.data_pagamento : data.data_venda);
                
                detalhesItensEl.innerHTML = '';
                if (data.itens && data.itens.length > 0) {
                    data.itens.forEach(item => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${item.nome}</td>
                            <td>${item.quantidade}</td>
                            <td>R$ ${item.preco_venda.toFixed(2)}</td>
                            <td>R$ ${(item.preco_venda * item.quantidade).toFixed(2)}</td>
                        `;
                        detalhesItensEl.appendChild(tr);
                    });
                } else {
                    detalhesItensEl.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum item registrado.</td></tr>`;
                }

                modalDetalhesVenda.show();
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
                alert('Erro ao carregar detalhes. Tente novamente.');
            }
        }


        // =========================================================
        // Event Listeners e Inicialização
        // =========================================================

        campoCodigoBarrasEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const codigoBarra = campoCodigoBarrasEl.value.trim();
                
                if (codigoBarra) {
                    const produtoEncontrado = todosProdutos.find(p => p.codigo_barras === codigoBarra);
                    
                    if (produtoEncontrado) {
                        adicionarAoCarrinho(produtoEncontrado);
                    } else {
                        alert("Produto com código de barras " + codigoBarra + " não encontrado.");
                    }
                    
                    campoCodigoBarrasEl.value = '';
                    campoCodigoBarrasEl.focus();
                }
            }
        });

        // Fluxo novo (2026-01): primeiro seleciona o produto, depois define a quantidade e clica em "Adicionar"
        const btnAdicionarItemVenda = document.getElementById('btn-adicionar-item-venda');

        function limparSelecaoVendaDireta(){
            selecionarProdutoEl.value = '';
            quantidadeManualEl.value = '1';
            selecionarProdutoEl.focus();
        }

        function adicionarSelecionadoAoCarrinho(){
            const produtoId = selecionarProdutoEl.value;
            const quantidade = parseInt(quantidadeManualEl.value, 10) || 0;
            if (!produtoId) return;
            if (!quantidade || quantidade <= 0) return;

            const produtoEncontrado = todosProdutos.find(p => p.id === produtoId);
            if (!produtoEncontrado) return;

            adicionarAoCarrinho(produtoEncontrado, quantidade);
            limparSelecaoVendaDireta();
        }

        selecionarProdutoEl.addEventListener('change', () => {
            // só muda o foco para quantidade, não adiciona automaticamente
            setTimeout(()=>quantidadeManualEl.focus(), 0);
        });

        if (btnAdicionarItemVenda){
            btnAdicionarItemVenda.addEventListener('click', adicionarSelecionadoAoCarrinho);
        }

        quantidadeManualEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter'){
                e.preventDefault();
                adicionarSelecionadoAoCarrinho();
            }
        });

        finalizarVendaBtn.addEventListener('click', finalizarVenda);
        cortesiaPercaBtn.addEventListener('click', finalizarCortesiaPerca);
        btnSalvarComanda.addEventListener('click', abrirNovaComanda);

        btnAdicionarItemManual.addEventListener('click', () => {
            const produtoId = selecionarProdutoComandaEl.value;
            const quantidade = parseInt(quantidadeProdutoComandaEl.value) || 1;
            
            if (produtoId && quantidade > 0) {
                adicionarItemManualAComanda(comandaAtualId, produtoId, quantidade);
            } else {
                alert('Selecione um produto e a quantidade.');
            }
        });

        if (btnAbrirModalReservasComanda) {
            btnAbrirModalReservasComanda.addEventListener('click', abrirModalAdicionarReservasComanda);
        }
        if (btnAtualizarReservasComanda) {
            btnAtualizarReservasComanda.addEventListener('click', abrirModalAdicionarReservasComanda);
        }
        if (reservasComandaBuscaEl) {
            reservasComandaBuscaEl.addEventListener('input', __renderReservasComandaTabela);
        }
        if (reservasComandaSelecionarTodasEl) {
            reservasComandaSelecionarTodasEl.addEventListener('change', (event) => {
                document.querySelectorAll('#reservas-comanda-tbody .reserva-comanda-check').forEach(cb => {
                    cb.checked = !!event.target.checked;
                });
            });
        }
        if (btnConfirmarAdicionarReservasComanda) {
            btnConfirmarAdicionarReservasComanda.addEventListener('click', adicionarReservasSelecionadasNaComandaAtual);
        }
        if (modalAdicionarReservasComandaEl) {
            modalAdicionarReservasComandaEl.addEventListener('hidden.bs.modal', () => {
                if (document.querySelector('.modal.show')) document.body.classList.add('modal-open');
            });
        }

        // Event Listeners para Reservas Futuras (se a seção existir na página)
        if (btnBuscarReservasFuturas) {
            btnBuscarReservasFuturas.addEventListener('click', buscarReservasFuturas);
        }
        if (btnAbrirComandaFuturas) {
            btnAbrirComandaFuturas.addEventListener('click', abrirComandaComReservasSelecionadas);
        }
        if (selecionarTodasReservasEl) {
            selecionarTodasReservasEl.addEventListener('change', (event) => {
                const isChecked = event.target.checked;
                document.querySelectorAll('.reserva-checkbox').forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
            });
        }

        btnFinalizarPagamentoModal.addEventListener('click', finalizarPagamento);
        valorRecebidoInput.addEventListener('input', (event) => {});
        [formaReservaDinheiroEl, formaReservaPixEl, formaReservaCartaoEl].filter(Boolean).forEach(el => {
            el.addEventListener('input', __atualizarTotaisFormaPagamentoReserva);
        });
        if (btnSalvarFormaPagamentoReserva) {
            btnSalvarFormaPagamentoReserva.addEventListener('click', salvarFormaPagamentoReservaPaga);
        }

        // Event Listeners do Histórico (mantido apenas se a seção existir; relatório agora fica na página própria)
        if (filtroDataEl) {
            filtroDataEl.addEventListener('change', carregarHistoricoDeVendas);
        }
        if (btnFiltroAmbos) {
            btnFiltroAmbos.addEventListener('click', (e) => {
                tipoFiltroHistorico = 'Ambos';
                document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                carregarHistoricoDeVendas();
            });
        }
        if (btnFiltroComandas) {
            btnFiltroComandas.addEventListener('click', (e) => {
                tipoFiltroHistorico = 'Comandas';
                document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                carregarHistoricoDeVendas();
            });
        }
        if (btnFiltroVendas) {
            btnFiltroVendas.addEventListener('click', (e) => {
                tipoFiltroHistorico = 'Vendas';
                document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                carregarHistoricoDeVendas();
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            if (filtroDataEl) filtroDataEl.value = `${ano}-${mes}-${dia}`;
            
            carregarProdutos();
            carregarClientes();
            carregarQuadras();
            carregarComandasAbertas();
            iniciarEscutaReservasDoDia();
            __ensureUIReservasNaoPagas();
            popularSeletoresDeData();
            if (filtroDataEl && listaHistoricoEl) carregarHistoricoDeVendas();
        });
    


(function(){
  function getOpenComandaNames(){
    const area = document.querySelector('#comandas-abertas') || document;
    const titles = Array.from(area.querySelectorAll('[data-comanda-nome], .comanda-nome, .card-title'))
      .map(el => (el.getAttribute('data-comanda-nome') || el.textContent || '').trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(titles));
  }
  function findNameInput(){
    return document.querySelector('#nome-comanda') ||
           document.querySelector('#nomeClienteComanda') ||
           document.querySelector('input[name="nome-comanda"], input[name="nomeClienteComanda"], input[placeholder*="Comanda" i]');
  }
  function hookOpenButton(){
    const btn = document.querySelector('#btn-abrir-comanda, button[data-action="abrir-comanda"]') ||
                Array.from(document.querySelectorAll('button, input[type="submit"]'))
                  .find(b=>/abrir\s*comanda/i.test(b.textContent||b.value||''));
    if(!btn) return;
    if(btn.dataset._dupGuard) return;
    btn.dataset._dupGuard = '1';
    btn.addEventListener('click', function(e){
      const input = findNameInput();
      if(!input) return;
      const nome = (input.value||'').trim().toLowerCase();
      if(!nome) return;
      const abertos = getOpenComandaNames();
      if(abertos.includes(nome)){
        e.preventDefault();
        e.stopPropagation();
        alert('Já existe uma comanda aberta com esse nome.');
      }
    }, true);
  }
  document.addEventListener('DOMContentLoaded', hookOpenButton);
  window.addEventListener('load', hookOpenButton);
})();



// Bloqueio de nome duplicado (case-insensitive + ignora acentos)
(function(){
  function norm(txt){
    return (txt||'')
      .normalize('NFD')                // separa acentos
      .replace(/[\u0300-\u036f]/g,'')// remove marcas
      .toLowerCase()                   // ignora maiúsc/minúsc
      .trim();
  }
  function getOpenComandaNames(){
    // Encontra a seção de "Comandas Abertas" para limitar a busca
    let scope = document;
    const header = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5'))
      .find(h => /comandas\s+abertas/i.test(h.textContent||''));
    if (header && header.parentElement) scope = header.parentElement;
    const titles = Array.from(scope.querySelectorAll('.card .card-title, .card h5, .card h4'))
      .map(el => norm(el.textContent))
      .filter(Boolean);
    return Array.from(new Set(titles));
  }
  function getNameInput(btn){
    const near = btn.closest('form,.row,.d-flex,.input-group,.container') || document;
    return near.querySelector('input[placeholder*="comanda" i]')
        || near.querySelector('input[aria-label*="comanda" i]')
        || near.querySelector('input[name*="comanda" i]')
        || document.querySelector('input[placeholder*="comanda" i]')
        || document.querySelector('input[aria-label*="comanda" i]')
        || document.querySelector('input[name*="comanda" i]');
  }
  document.addEventListener('click', function(e){
    const btn = e.target.closest('button, input[type="submit"]');
    if(!btn) return;
    const label = (btn.textContent || btn.value || '').trim();
    if(!/^abrir$/i.test(label)) return;
    const input = getNameInput(btn);
    if(!input) return;
    const nomeNorm = norm(input.value);
    if(!nomeNorm) return;
    const abertos = getOpenComandaNames();
    if (abertos.includes(nomeNorm)){
      e.preventDefault();
      e.stopImmediatePropagation();
      alert('Já existe uma comanda aberta com esse nome.');
    }
  }, true);
})();



// Auto-detecta cards de COMANDA e aplica classe 'modern-comanda' sem mudar funções
(function(){
  function tagComandas(){
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      if (card.classList.contains('modern-comanda')) return;
      const buttons = Array.from(card.querySelectorAll('button, a'));
      const hasPagar = buttons.some(b => /\bpagar\b/i.test(b.textContent||b.value||''));
      const hasAdicionar = buttons.some(b => /adicionar\s*itens/i.test(b.textContent||b.value||''));
      if (hasPagar && hasAdicionar) {
        card.classList.add('modern-comanda');
        const title = card.querySelector('h4, h5, .card-title');
        if (title) title.classList.add('modern-comanda-title');
        // Marca classes auxiliares nos botões para estilização (sem mudar comportamento)
        buttons.forEach(btn => {
          if (/\bpagar\b/i.test(btn.textContent||btn.value||'')) btn.classList.add('btn-acao','btn-success');
          if (/adicionar\s*itens/i.test(btn.textContent||btn.value||'')) btn.classList.add('btn-acao','btn-secondary');
        });
        // Tenta melhorar a área do total se houver elemento com "Total:"
        const totalLike = Array.from(card.querySelectorAll('*')).find(el => /^\s*Total:/i.test(el.textContent||''));
        if (totalLike) totalLike.classList.add('modern-total');
      }
    });
  }
  document.addEventListener('DOMContentLoaded', tagComandas);
  window.addEventListener('load', tagComandas);
  // Reaplica se algo no DOM mudar (ex.: carregamento assíncrono)
  const obs = new MutationObserver(tagComandas);
  obs.observe(document.documentElement, {childList:true, subtree:true});
})();



(function(){
  function normalizeHyphenLines(root){
    // Substitui elementos que contenham só hifens por uma linha contínua
    const nodes = root.querySelectorAll('.modern-comanda *');
    nodes.forEach(el => {
      const txt = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) 
        ? (el.textContent || '').trim()
        : '';
      if (/^-{3,}$/.test(txt)) {
        const hr = document.createElement('div');
        hr.className = 'comanda-hr';
        el.replaceWith(hr);
      }
    });
  }
  function modernizeIcons(card){
    // Encontra botões de remover e troca o ícone para bi-x-circle
    const btns = card.querySelectorAll('button, a');
    btns.forEach(b => {
      const isRemover = /remover|excluir|apagar/i.test(b.getAttribute('aria-label')||'') ||
                        /remover|excluir|apagar/i.test(b.title||'') ||
                        /trash|lixeira|excluir/i.test((b.innerHTML||''));
      if (isRemover) {
        // Se existir um <i> de bootstrap icons, troca a classe
        const i = b.querySelector('i');
        if (i) { i.className = 'bi bi-dash-circle'; }
        b.classList.add('btn-remove');
      }
    });
  }
  function applyRefinements(){
    document.querySelectorAll('.modern-comanda').forEach(card => {
      normalizeHyphenLines(card);
      modernizeIcons(card);
    });
  }
  document.addEventListener('DOMContentLoaded', applyRefinements);
  window.addEventListener('load', applyRefinements);
  new MutationObserver(applyRefinements).observe(document.documentElement, {childList:true, subtree:true});
})();



// ===== Métricas do Dia (igual ao Relatorios para cálculo) =====
function __setupMetrics(){
  const fmt = (v) => 'R$ ' + (Math.round(v*100)/100).toFixed(2).replace('.', ',');
  function todayRange(){
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999);
    return [start, end];
  }
  const [start, end] = todayRange();

  if (!window.db && window.firebase && firebase.firestore) window.db = firebase.firestore();
  if (!window.db) return;

  const produtosRef = db.collection('produtos');
  const comandasRef = db.collection('comandas');
  const vendaDiretaRef = db.collection('Venda direta');
  const reservasRef = db.collection('reservas');

  const els = {
    reservasAPagar: document.getElementById('mReservasAPagar'),
    reservasPagas: document.getElementById('mReservasPagas'),
    comandasAbertas: document.getElementById('mComandasAbertas'),
    produtosVendidos: document.getElementById('mProdutosVendidos'),
    totalDia: document.getElementById('mTotalDia'),
  };
  if (!els.reservasAPagar) return;

  const priceByName = {};
  produtosRef.get().then(snap => {
    snap.forEach(doc => { const p = doc.data(); if (p && p.nome) priceByName[p.nome] = Number(p.preco_venda||0); });
  });

  // Acumuladores em memória
  let somaReservasPagas = 0;
  let somaProdutosVendidos = 0;
  let somaComandasAbertas = 0;

  function isTodayDate(d){
    if (!d) return false;
    return d >= start && d <= end;
  }
  function anyToDate(val){
    if (!val) return null;
    if (typeof val === 'object' && typeof val.toDate === 'function') return val.toDate();
    if (typeof val === 'string') return window.parsePortugueseDateString(val) || new Date(val);
    return null;
  }

  function recomputeTotal(){
    const pagar = parseFloat((els.reservasAPagar.textContent||'0').replace(/[R$\s.]/g,'').replace(',','.'))||0;
    els.totalDia.textContent = fmt(somaReservasPagas + somaProdutosVendidos + somaComandasAbertas);
  }

  // 1) Reservas a pagar hoje (coleção 'reservas')
  reservasRef.onSnapshot((snap)=>{
    let pagar = 0;
    snap.forEach(doc => {
      const r = doc.data()||{};
      if (!r.comanda_vinculada_id) return;
      const d = anyToDate(r.dataReserva) || anyToDate(r.data) || anyToDate(r.createdAt);
      if (!isTodayDate(d)) return;
      const status = (r.statusPagamento||r.status||'').toString().toLowerCase();
      const valor = Number(r.valor || r.valorTotal || r.preco || 0);
      if (status !== 'pago') pagar += valor;
    });
    els.reservasAPagar.textContent = fmt(pagar);
    recomputeTotal();
  });

  // 2) Comandas Abertas hoje (somando itens; reserva conta aqui)
  comandasRef.onSnapshot((snap)=>{
    let total = 0;
    snap.forEach(doc => {
      const c = doc.data()||{};
      const status = (c.status_comanda||'').toLowerCase();
      if (status === 'paga') return;
      const d = anyToDate(c.data_abertura);
      if (d && !isTodayDate(d)) return;
      (c.itens||[]).forEach(it => {
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda ?? priceByName[it?.nome] ?? 0);
        total += qtd * preco;
      });
    });
    somaComandasAbertas = total;
    els.comandasAbertas.textContent = fmt(total);
    recomputeTotal();
  });

  // 3) Reservas Pagas + Produtos Vendidos (comandas pagas + venda direta), igual ao Relatórios:
  //    - considerar itens cujo nome inicia com "Reserva" como reservas pagas
  //    - demais itens contam em "produtos vendidos"
  function processItems(itens, addReserva, addProduto){
    if (!Array.isArray(itens)) return;
    itens.forEach(item => {
      const qtd = Number(item?.quantidade||1);
      const preco = Number(item?.preco_venda ?? priceByName[item?.nome] ?? 0);
      const isReserva = (item?.nome||'').toString().toLowerCase().startsWith('reserva');
      if (isReserva) addReserva(qtd*preco);
      else addProduto(qtd*preco);
    });
  }

  // Comandas PAGAS do dia
  comandasRef.where('status_comanda','==','Paga').onSnapshot((snap)=>{
    let reservas = 0, produtos = 0;
    snap.forEach(doc => {
      const c = doc.data()||{};
      const d = anyToDate(c.data_abertura);
      if (!isTodayDate(d)) return;
      processItems(c.itens, v=>reservas+=v, v=>produtos+=v);
    });
    somaReservasPagas = reservas;
    somaProdutosVendidos = (window.__vendidosDiretaHoje||0) + produtos;
    els.reservasPagas.textContent = fmt(reservas);
    els.produtosVendidos.textContent = fmt(somaProdutosVendidos);
    recomputeTotal();
  });

  // Venda direta do dia
  vendaDiretaRef.onSnapshot((snap)=>{
    let reservas = 0, produtos = 0;
    snap.forEach(doc => {
      const v = doc.data()||{};
      const d = anyToDate(v.data_venda) || anyToDate(v.data);
      if (!isTodayDate(d)) return;
      processItems(v.itens, v=>reservas+=v, v=>produtos+=v);
    });
    window.__vendidosDiretaHoje = produtos;
    somaReservasPagas += reservas; // reservas pagas vindas de venda direta também contam
    els.reservasPagas.textContent = fmt(somaReservasPagas);
    somaProdutosVendidos = produtos + (somaProdutosVendidos - produtos); // já atualizado acima
    els.produtosVendidos.textContent = fmt((window.__vendidosDiretaHoje||0) + (somaProdutosVendidos - (window.__vendidosDiretaHoje||0)));
    recomputeTotal();
  });
}



(function(){
  function ready(){ try{ return (window.db || (window.firebase && firebase.apps.length && (window.db=firebase.firestore()))); }catch(e){ return false; } }
  (function wait(t){ if(ready()) return __setupMetrics(); if(t<=0) return; setTimeout(()=>wait(t-1),300); })(40);
})();



window.__monthsPT = {'janeiro':0,'fevereiro':1,'março':2,'marco':2,'abril':3,'maio':4,'junho':5,'julho':6,'agosto':7,'setembro':8,'outubro':9,'novembro':10,'dezembro':11};
window.parsePortugueseDateString = function(dateString){
  if (!dateString || typeof dateString !== 'string') return null;
  const s = dateString.toLowerCase();
  // padrões comuns: "6 de novembro de 2025 às 13:45:12" ou "06/11/2025 13:45:12"
  let m = s.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4}).*?(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  let year,month,day,h=0,mi=0,se=0;
  if (m){
    day = +m[1]; month = window.__monthsPT[m[2]]; year = +m[3]; h=+(m[4]||0); mi=+(m[5]||0); se=+(m[6]||0);
  } else {
    m = s.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4}).*?(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) m = s.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
    if (m){ day=+m[1]; month=(+m[2])-1; year=+m[3]; h=+(m[4]||0); mi=+(m[5]||0); se=+(m[6]||0); }
  }
  if (month==null || isNaN(month)) return null;
  const d = new Date(year, month, day, h, mi, se);
  return d.toString()==='Invalid Date' ? null : d;
};





/* =========================================================
   Vincular Comanda a Reserva do Dia (registro de time)
   - salva em 'comandas': reserva_time_id, reserva_time_label, reserva_time_vinculado_em
   ========================================================= */
let __vinculoComandaId = null;
let __comandaAtual = null;
let __vinculoGrupoKey = '';
let __vincularReservaModalInstance = null;

function fmtBR(v){
  const n = Number(v||0);
  return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

function __fmtDataBRComDia(yyyyMMdd){
  // Espera "YYYY-MM-DD" ou Date/Timestamp; retorna "Seg 03-02-2026"
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  let d = null;
  try{
    if (!yyyyMMdd) return '';
    if (yyyyMMdd instanceof Date) d = yyyyMMdd;
    else if (typeof yyyyMMdd?.toDate === 'function') d = yyyyMMdd.toDate();
    else {
      const s = String(yyyyMMdd);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) d = new Date(s.slice(0,10)+'T00:00:00');
      else d = new Date(s);
    }
    if (!d || isNaN(d)) return String(yyyyMMdd||'');
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    const dia = dias[d.getDay()] || '';
    return `${dd}-${mm}-${dia}`;
  }catch(_){
    return String(yyyyMMdd||'');
  }
}



/* ===== Helpers: cor consistente por reserva/time + label sem hora final ===== */
function __hashCode(str){
  str = String(str||'');
  let h=0;
  for(let i=0;i<str.length;i++){ h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function __teamColor(id){
  const gid = __grupoById(id);
  if (gid){
    return { btn: gid.color, border: gid.color };
  }
  const h = __hashCode(id) % 360;
  const btn = `hsl(${h}, 75%, 42%)`;
  const border = `hsl(${h}, 75%, 42%)`;
  return { btn, border };
}
// =========================================================
// Vínculos especiais (tratados como "reserva"): grupos fixos
// =========================================================
const __VINCULO_GRUPOS = [
  { id: 'grp_evento',       label: 'Evento',        color: '#6f42c1', icon: 'bi-calendar-event' },
  { id: 'grp_nao_pagou',    label: 'Não pagou',     color: '#dc3545', icon: 'bi-exclamation-triangle' },
  { id: 'grp_funcionarios', label: 'Funcionários',  color: '#0d6efd', icon: 'bi-person-badge' }
];

function __grupoById(id){
  const k = String(id||'').trim();
  return __VINCULO_GRUPOS.find(g => g.id === k) || null;
}

function __grupoIdFromNome(nome){
  const n = String(nome||'').trim();
  const g = __VINCULO_GRUPOS.find(x => x.label === n);
  return g ? g.id : '';
}
function __isReservaCancelada(r){
  const pr = String((r && r.pagamento_reserva) || '').toLowerCase();
  const sr = String((r && r.status_reserva) || '').toLowerCase();
  return pr.includes('cancel') || sr.includes('cancel');
}

function __shortTimeLabel(label){
  // remove hora final: "Nome • Quadra 01 • 17:30-18:30" -> "... • 17:30"
  if(!label) return '';
  const parts = String(label).split('•').map(s=>s.trim()).filter(Boolean);
  if(parts.length===0) return String(label);
  const last = parts[parts.length-1];
  const m = last.match(/(\d{2}:\d{2})/);
  if(m){
    parts[parts.length-1] = m[1];
    return parts.join(' • ');
  }
  return parts.join(' • ');
}

function hojeYYYYMMDD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

async function abrirModalVincularReserva(comandaId){
  try{
    __vinculoComandaId = comandaId;

    // pega vínculo atual pra pré-selecionar no modal
    let vinculoAtualId = '';
    try{
      const cdoc = await db.collection('comandas').doc(comandaId).get();
      if (cdoc && cdoc.exists){
        const __cd = (cdoc.data()||{});
        __comandaAtual = __cd;
        vinculoAtualId = String(__cd.reserva_time_id || '').trim();
        // compat legado: comanda_grupo
        if (!vinculoAtualId){
          const lg = String((cdoc.data()||{}).comanda_grupo || '').trim();
          if (lg) vinculoAtualId = __grupoIdFromNome(lg) || ('grp_' + lg);
        }
      }
    }catch(_){}

    const modalEl = document.getElementById('vincularReservaModal');
    if (!modalEl) return;

    // garante modal bem largo (sem depender do HTML)
    try{
      const dlg = modalEl.querySelector('.modal-dialog');
      if (dlg) dlg.classList.add('modal-xl');
    }catch(_){}

    if (!__vincularReservaModalInstance){
      __vincularReservaModalInstance = new bootstrap.Modal(modalEl);
    }

    // botão "Remover vínculo" (aparece só se já existir vínculo)
    const __btnRem = __ensureBtnRemoverVinculo();
    if (__btnRem) __btnRem.style.display = vinculoAtualId ? '' : 'none';

    const listEl = document.getElementById('lista-reservas-vinculo');
    if (!listEl) return;

    listEl.innerHTML = `
      <div class="mb-2">
        <input type="text" class="form-control form-control-sm" id="filtro-reservas-vinculo" placeholder="Buscar por nome, quadra ou horário...">
      </div>
      <div class="text-muted small">Carregando...</div>
    `;

    const hoje = hojeYYYYMMDD();
    const snap = await db.collection('reservas')
      .where('data_reserva','==',hoje)
      .orderBy('hora_inicio')
      .get();

    const reservas = [];
    snap.forEach(doc=>{
      const r = doc.data()||{};
      r.id = doc.id;
      reservas.push(r);
    });

    // Remove duplicatas (às vezes reservas fixas podem gerar 2 docs iguais no mesmo horário/quadra)
    // Critério: mesma quadra + hora_inicio + hora_fim + cliente (id_cliente/nome)
    const __dedup = new Map();
    for (const r of reservas){
      const k = [
        String(r.id_quadra||''),
        String(r.hora_inicio||''),
        String(r.hora_fim||''),
        String(r.id_cliente||r.nome_cliente||'')
      ].join('|');

      const cur = __dedup.get(k);
      if (!cur){
        __dedup.set(k, r);
      } else {
        // prefere manter o que já tem comanda vinculada; se ambos ou nenhum, mantém o de id "menor"
        const aHas = !!cur.comanda_vinculada_id;
        const bHas = !!r.comanda_vinculada_id;
        if (!aHas && bHas){
          __dedup.set(k, r);
        } else if (aHas === bHas){
          const aid = String(cur.id||'');
          const bid = String(r.id||'');
          if (bid && (!aid || bid < aid)) __dedup.set(k, r);
        }
      }
    }
    reservas.length = 0;
    __dedup.forEach(v => reservas.push(v));


    const quadraOrder = (quadraNome) => {
      const q = String(quadraNome||'').toLowerCase();
      if (q.includes('01')) return 1;
      if (q.includes('02')) return 2;
      if (q.includes('03')) return 3;
      if (q.includes('04') || q.includes('extern')) return 4;
      // fallback: pega primeiro dígito
      const m = q.match(/\b(\d)\b/);
      if (m) return Number(m[1]);
      return 99;
    };

    const mkReservaCard = (r, disabled) => {
      const clienteNome = (window.getClienteNome ? window.getClienteNome(r.id_cliente) : (r.nome_cliente||'')) || '';
      const quadraNome = (window.getQuadraNome ? window.getQuadraNome(r.id_quadra) : (r.quadra||'')) || '';
      const hora = `${r.hora_inicio || ''}${r.hora_fim ? (' - ' + r.hora_fim) : ''}`.trim();
      const status = String(r.pagamento_reserva || r.status_reserva || '').trim() || (disabled ? 'cancelada' : '');
      const label = `${clienteNome} • ${quadraNome} • ${hora}`;

      const badgeClass = disabled ? 'bg-secondary' : 'bg-success';
      const wrapClass = disabled ? 'is-cancelada' : '';
      const disabledAttr = disabled ? 'disabled' : '';

      const hasComanda = !!r.comanda_vinculada_id;
      const extraBadge = hasComanda ? `<span class="badge bg-warning text-dark ms-1">já tem comanda</span>` : '';

      return `
        <label class="vinculo-reserva-card ${wrapClass}">
          <input class="form-check-input me-2" type="radio" name="vinculo-escolha"
            value="${r.id}" data-type="reserva" data-label="${escapeHtml(label)}" ${disabledAttr}>
          <div class="vrc-content">
            <div class="vrc-top">
              <div class="vrc-name">${escapeHtml(clienteNome || '—')}</div>
              <div class="vrc-badges">
                <span class="badge bg-light text-dark">${escapeHtml(quadraNome || '—')}</span>
                ${extraBadge}
              </div>
            </div>
            <div class="vrc-meta">
              <span class="vrc-time">${escapeHtml(hora || '—')}</span>
              ${status ? `<span class="badge ${badgeClass}">${escapeHtml(status)}</span>` : ''}
            </div>
          </div>
        </label>
      `;
    };

    const mkGrupoCard = (g) => {
      return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <label class="vinculo-reserva-card vinculo-grupo-card" style="border-left:6px solid ${g.color};">
            <input class="form-check-input me-2" type="radio" name="vinculo-escolha"
              value="${g.id}" data-type="grupo" data-label="${escapeHtml(g.label)}">
            <div class="vrc-content">
              <div class="vrc-top">
                <div class="vrc-name">${escapeHtml(g.label)}</div>
                <div class="vrc-badges">
                  <span class="badge" style="background:${g.color}; color:#fff;"><i class="bi ${g.icon}"></i></span>
                </div>
              </div>
              <div class="vrc-meta">
                <span class="vrc-time">—</span>
                <span class="badge bg-success">vincular</span>
              </div>
            </div>
          </label>
        </div>
      `;
    };

    // agrupa por quadra (1..4) ignorando canceladas (não exibimos no modal)
    const colsAtivas = {1:[],2:[],3:[],4:[]};

    reservas.forEach(r=>{
      if (__isReservaCancelada(r)) return; // não mostrar canceladas no modal
      const quadraNome = (window.getQuadraNome ? window.getQuadraNome(r.id_quadra) : (r.quadra||'')) || '';
      const ord = quadraOrder(quadraNome);
      if (![1,2,3,4].includes(ord)) return;
      colsAtivas[ord].push(r);
    });

    [1,2,3,4].forEach(k=>{
      colsAtivas[k].sort((a,b)=> String(a.hora_inicio||'').localeCompare(String(b.hora_inicio||'')));
    });

    const quadraLabel = (k) => (k===4 ? 'Quadra 04 (externa)' : `Quadra 0${k}`);


    const renderQuadraCol = (k, lista) => {
      const items = (lista||[]);
      return `
        <div class="vinculo-quadra-col" data-quadra="${k}">
          <div class="vqc-head">
            <div class="vqc-title">${escapeHtml(quadraLabel(k))}</div>
            <div class="vqc-count">${items.length}</div>
          </div>
          <div class="vqc-list">
            ${items.map(r=>mkReservaCard(r, false)).join('')}
          </div>
        </div>
      `;
    };

    listEl.innerHTML = `
      <div class="mb-2 small text-muted">
        Selecione a reserva do time em que esse cliente está jogando (apenas para registro) <b>ou</b> vincule direto a um grupo.
      </div>

      <div class="mb-2">
        <input type="text" class="form-control form-control-sm" id="filtro-reservas-vinculo" placeholder="Buscar por nome, quadra ou horário...">
      </div>

      <div class="mb-2">
        <div class="small text-muted mb-1">Grupos</div>
        <div class="row g-2">
          ${__VINCULO_GRUPOS.map(mkGrupoCard).join('')}
        </div>
      </div>

      <div class="mb-2">
        <div class="small text-muted mb-1">Reservas de hoje (ordem por quadra)</div>
        <div class="vinculo-quadras-wrap" id="wrap-vinculo-ativas">
          ${[1,2,3,4].map(k=>renderQuadraCol(k, colsAtivas[k], false)).join('')}
        </div>
      </div>
    `;

    // filtro: aplica para todos os cards (grupos + reservas)
    const filtro = document.getElementById('filtro-reservas-vinculo');
    if (filtro){
      filtro.addEventListener('input', () => {
        const q = String(filtro.value||'').toLowerCase().trim();
        const cards = listEl.querySelectorAll('.vinculo-reserva-card');
        cards.forEach(card=>{
          const txt = card.innerText.toLowerCase();
          card.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
      });
    }

    // pré-seleciona
    if (vinculoAtualId){
      const radio = listEl.querySelector(`input[name="vinculo-escolha"][value="${CSS.escape(vinculoAtualId)}"]`);
      if (radio && !radio.disabled) radio.checked = true;
    }

    __vincularReservaModalInstance.show();
  }catch(err){
    console.error('Erro ao abrir modal de vínculo', err);
  }
}


async function salvarVinculoReserva(){
  try{
    if (!__vinculoComandaId) return;

    const selected = document.querySelector('input[name="vinculo-escolha"]:checked');
    if (!selected){
      alert('Selecione uma reserva ou um grupo para vincular.');
      return;
    }

    const vinculoId = String(selected.value||'').trim();
    const tipo = String(selected.getAttribute('data-type')||'reserva').trim();
    const label = selected.getAttribute('data-label') || '';

    if (tipo === 'reserva'){
      // segurança: não permitir vincular em reserva cancelada
      try{
        const rDoc = await db.collection('reservas').doc(vinculoId).get();
        if (rDoc.exists && __isReservaCancelada(rDoc.data())){
          alert('Esta reserva está cancelada. Não é possível vincular.');
          return;
        }
      }catch(_){}
    }

    await db.collection('comandas').doc(__vinculoComandaId).update({
      reserva_time_id: vinculoId,
      reserva_time_label: label,
      reserva_time_vinculado_em: firebase.firestore.Timestamp.now(),
      reserva_time_principal: false,
      reserva_time_tipo: (tipo === 'grupo' ? 'grupo' : 'reserva'),
      // remove legado (se existir)
      comanda_grupo: firebase.firestore.FieldValue.delete()
    });

    if (__vincularReservaModalInstance) __vincularReservaModalInstance.hide();
    if (typeof carregarComandasAbertas === 'function') carregarComandasAbertas();
  }catch(err){
    console.error('Erro ao salvar vínculo', err);
    alert('Não consegui vincular. Tente novamente.');
  }
}



// =========================================================
// Remover vínculo (reserva/grupo) da comanda
// =========================================================
function __ensureBtnRemoverVinculo(){
  try{
    const modalEl = document.getElementById('vincularReservaModal');
    if (!modalEl) return null;
    const footer = modalEl.querySelector('.modal-footer');
    if (!footer) return null;

    let btn = document.getElementById('btn-remover-vinculo-reserva');
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'btn-remover-vinculo-reserva';
      btn.className = 'btn btn-outline-danger me-auto';
      btn.textContent = 'Remover vínculo';
      footer.insertBefore(btn, footer.firstChild);
      btn.addEventListener('click', removerVinculoReserva);
    }
    return btn;
  }catch(_){
    return null;
  }
}

async function removerVinculoReserva(){
  try{
    if (!__vinculoComandaId) return;
    const ok = confirm('Remover o vínculo desta comanda?');
    if (!ok) return;

    await db.collection('comandas').doc(__vinculoComandaId).update({
      reserva_time_id: firebase.firestore.FieldValue.delete(),
      reserva_time_label: firebase.firestore.FieldValue.delete(),
      reserva_time_tipo: firebase.firestore.FieldValue.delete(),
      reserva_time_vinculado_em: firebase.firestore.FieldValue.delete(),
      reserva_time_principal: firebase.firestore.FieldValue.delete(),
      comanda_grupo: firebase.firestore.FieldValue.delete()
    });

    if (__vincularReservaModalInstance) __vincularReservaModalInstance.hide();
    if (typeof carregarComandasAbertas === 'function') carregarComandasAbertas();
  }catch(err){
    console.error('Erro ao remover vínculo', err);
    alert('Não consegui remover o vínculo. Tente novamente.');
  }
}

// =========================================================
// Definir/Remover grupo manual da comanda
// =========================================================
async function definirGrupoComanda(comandaId, grupo){
  try{
    const ref = db.collection('comandas').doc(comandaId);
    const nome = String(grupo || '').trim();

    if (!nome){
      await ref.update({
        reserva_time_id: firebase.firestore.FieldValue.delete(),
        reserva_time_label: firebase.firestore.FieldValue.delete(),
        reserva_time_tipo: firebase.firestore.FieldValue.delete(),
        comanda_grupo: firebase.firestore.FieldValue.delete()
      });
    } else {
      const gid = __grupoIdFromNome(nome) || ('grp_' + nome);
      await ref.update({
        reserva_time_id: gid,
        reserva_time_label: nome,
        reserva_time_tipo: 'grupo',
        reserva_time_vinculado_em: firebase.firestore.Timestamp.now(),
        comanda_grupo: firebase.firestore.FieldValue.delete()
      });
    }

    if (typeof carregarComandasAbertas === 'function') carregarComandasAbertas();
  }catch(err){
    console.error('Erro ao definir grupo da comanda', err);
    alert('Não consegui atualizar o vínculo da comanda.');
  }
}

/* =========================================================
   Resumo do Dia (corrigido)
   - Reservas: coleção 'reservas' usando data_reserva == hoje
   - Comandas abertas: status_comanda == 'Aberta' (filtra data_abertura se existir)
   - Produtos vendidos: comandas pagas (data_pagamento) + Venda direta (data_venda)
   ========================================================= */

function initResumoDoDia(){
  const els = {
    reservasAPagar: document.getElementById('mReservasAPagar'),
    reservasPagas: document.getElementById('mReservasPagas'),
    comandasAbertas: document.getElementById('mComandasAbertas'),
    produtosVendidos: document.getElementById('mProdutosVendidos'),
    totalDia: document.getElementById('mTotalDia')
  };
  const hasAll = Object.values(els).every(Boolean);
  if (!hasAll) return;

  let somaReservasAPagar = 0;      // reservas do dia (data_reserva==hoje) com status "aguardando"
  let somaReservasPagas = 0;       // reservas pagas hoje (pela soma de itens "Reserva..." em comandas pagas hoje)
  let somaComandasAbertas = 0;     // soma de todas as comandas em aberto
  let somaProdutosVendidos = 0;    // produtos pagos hoje (comandas pagas hoje + venda direta hoje), sem itens "Reserva..."

  function recompute(){
    const total = somaReservasPagas + somaProdutosVendidos;
    els.reservasAPagar.textContent   = fmtBR(somaReservasAPagar);
    els.reservasPagas.textContent    = fmtBR(somaReservasPagas);
    els.comandasAbertas.textContent  = fmtBR(somaComandasAbertas);
    els.produtosVendidos.textContent = fmtBR(somaProdutosVendidos);
    els.totalDia.textContent         = fmtBR(total);
  }

  function anyToDate(v){
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v === 'string'){
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00');
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }
    return null;
  }
  function isTodayDate(d){
    const now = new Date();
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
  }

  const hojeStr = hojeYYYYMMDD();

  // ===== status pagamento reserva normalizado =====
  function __normStatusLocal(r){
    try{
      if (typeof __normStatusPagamento === 'function') return __normStatusPagamento(r);
    }catch(_){}
    const v = (x)=>String(x||'').toLowerCase().trim();
    const s = v(r.pagamento_reserva) || v(r.statusPagamento) || v(r.status_pagamento) || v(r.pagamento) || v(r.status_pagamento_reserva);
    if (!s) return '';
    if (s.includes('cancel')) return 'cancelada';
    if (s.includes('atras')) return 'atrasada';
    if (s.includes('aguard') || s.includes('pend') || s.includes('abert')) return 'aguardando';
    if (s.includes('pago') || s.includes('paga') || s.includes('paid')) return 'pago';
    return s;
  }
  function __isReservaCancelada(r){
    const stR = String(r.status_reserva||'').toLowerCase();
    if (stR.includes('cancel')) return true;
    const stP = __normStatusLocal(r);
    return stP === 'cancelada';
  }

  // ===== 1) Reservas a pagar (hoje, status aguardando) =====
  db.collection('reservas').where('data_reserva','==',hojeStr).onSnapshot((snap)=>{
    let pagar = 0;
    snap.forEach(doc=>{
      const r = doc.data()||{};
      if (__isReservaCancelada(r)) return;
      const st = __normStatusLocal(r);
      if (st !== 'aguardando') return;
      const val = Number(r.valor || r.valor_total || r.valor_reserva || 0);
      pagar += val;
    });
    somaReservasAPagar = pagar;
    recompute();
  });

  // ===== 2) Reservas pagas hoje (PELAS COMANDAS pagas hoje) =====
  // Soma apenas itens cujo nome começa com "Reserva" (ex.: "Reserva de Quadra ...")
  db.collection('comandas').where('status_comanda','==','Paga').onSnapshot((snap)=>{
    let reservasPagas = 0;
    let prodComandas = 0;

    snap.forEach(doc=>{
      const c = doc.data()||{};
      const d = anyToDate(c.data_pagamento);
      if (!d || !isTodayDate(d)) return;

      (c.itens||[]).forEach(it=>{
        const nome = String(it?.nome||'');
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda||0);
        const totalItem = qtd * preco;

        if (nome.toLowerCase().startsWith('reserva')) reservasPagas += totalItem;
        else prodComandas += totalItem;
      });
    });

    somaReservasPagas = reservasPagas;
    window.__prodComandasHoje = prodComandas;
    somaProdutosVendidos = (window.__prodComandasHoje||0) + (window.__prodDiretaHoje||0);
    recompute();
  });

  // ===== 3) Comandas abertas (todas em aberto) =====
  db.collection('comandas').where('status_comanda','==','Aberta').onSnapshot((snap)=>{
    let total = 0;
    snap.forEach(doc=>{
      const c = doc.data()||{};
      (c.itens||[]).forEach(it=>{
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda||0);
        total += qtd * preco;
      });
    });
    somaComandasAbertas = total;
    recompute();
  });

  // ===== 4) Venda direta (produtos hoje) =====
  db.collection('Venda direta').onSnapshot((snap)=>{
    let prod = 0;
    snap.forEach(doc=>{
      const v = doc.data()||{};
      const d = anyToDate(v.data_venda);
      if (!d || !isTodayDate(d)) return;
      (v.itens||[]).forEach(it=>{
        const nome = String(it?.nome||'');
        if (nome.toLowerCase().startsWith('reserva')) return;
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda||0);
        prod += qtd * preco;
      });
    });
    window.__prodDiretaHoje = prod;
    somaProdutosVendidos = (window.__prodComandasHoje||0) + (window.__prodDiretaHoje||0);
    recompute();
  });
}



document.addEventListener('DOMContentLoaded', ()=>{
  // botão salvar do vínculo
  const btnSalvar = document.getElementById('btn-salvar-vinculo-reserva');
  if (btnSalvar){
    btnSalvar.addEventListener('click', salvarVinculoReserva);
  }
  initResumoDoDia();
  __ensureBtnRemoverVinculo();

});
