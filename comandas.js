
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
        
        // Elementos do Modal de Pagamento
        const pagamentoModal = new bootstrap.Modal(document.getElementById('pagamentoModal'));
        const pagamentoModalLabel = document.getElementById('pagamentoModalLabel');
        const listaItensPagamentoEl = document.getElementById('lista-itens-pagamento');
        const valorRecebidoInput = document.getElementById('valor-recebido');
        const totalPagarEl = document.getElementById('total-pagar');
        const saldoRestanteEl = document.getElementById('saldo-restante');
        const btnFinalizarPagamentoModal = document.getElementById('btn-finalizar-pagamento-modal');
        
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
        async function abrirComandaDeReservas(reservaIds) {
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
                    preco_venda: reserva.valor,
                    quantidade: 1,
                    produtoId: 'reserva-quadra',
                    reservaId: reserva.id,
                }));

                // Define uma reserva base para agrupamento (time) e cor do botão.
                // Usamos a primeira reserva (mais cedo) para representar o "time" no agrupamento.
                reservasParaComanda.sort((a,b)=> String(a.hora_inicio||'').localeCompare(String(b.hora_inicio||'')));
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

            } catch (error) {
                console.error("Erro ao abrir comanda das reservas:", error);
                alert("Erro ao abrir comanda das reservas. Tente novamente.");
            }
        }

        /**
         * Carrega as comandas abertas do banco de dados e as exibe na tela.
         */
 
         

        
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

    // separa: sem vínculo primeiro, depois por time
    const semVinculo = [];
    const porTime = new Map(); // timeId -> { label, items[] }

    comandas.forEach(c => {
      const timeId = c.reserva_time_id || '';
      if (!timeId) {
        semVinculo.push(c);
      } else {
        const label = __shortTimeLabel(c.reserva_time_label || '');
        if (!porTime.has(timeId)) porTime.set(timeId, { label, items: [] });
        porTime.get(timeId).items.push(c);
      }
    });

    // ordena dentro de cada grupo por data_abertura desc (já veio, mas garante)
    semVinculo.sort((a,b) => {
      const da = (a.data_abertura && a.data_abertura.toMillis) ? a.data_abertura.toMillis() : 0;
      const dbb = (b.data_abertura && b.data_abertura.toMillis) ? b.data_abertura.toMillis() : 0;
      return dbb - da;
    });
    const grupos = Array.from(porTime.entries()).map(([timeId, g]) => {
      g.items.sort((a,b) => {
        // comanda "principal" do horário primeiro (compatível com registros antigos)
        const isPrincipal = (c) => (c && (c.reserva_time_principal === true || (Array.isArray(c.itens) && c.itens.some(it => (it && (it.produtoId === 'reserva-quadra' || String(it.nome||'').startsWith('Reserva de Quadra')))))));
        const pa = isPrincipal(a) ? 1 : 0;
        const pb = isPrincipal(b) ? 1 : 0;
        if (pa !== pb) return pb - pa;

        const da = (a.data_abertura && a.data_abertura.toMillis) ? a.data_abertura.toMillis() : 0;
        const dbb = (b.data_abertura && b.data_abertura.toMillis) ? b.data_abertura.toMillis() : 0;
        return dbb - da;
      });
      // para ordenar grupos: pelo mais recente do grupo
      const top = g.items[0];
      const ts = (top && top.data_abertura && top.data_abertura.toMillis) ? top.data_abertura.toMillis() : 0;
      return { timeId, label: g.label, items: g.items, ts };
    }).sort((a,b) => b.ts - a.ts);

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

      card.innerHTML = `
        <div class="card-body position-relative">
          <div class="d-flex align-items-start justify-content-between gap-2">
            <h5 class="card-title mt-0 mb-0">${comanda.cliente || ''}</h5>
            <button class="btn btn-sm btn-outline-danger p-0 px-2" onclick="excluirComanda('${comanda.id}')" title="Excluir comanda">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="divider"></div>

          <div id="itens-comanda-${comanda.id}" class="mb-2 small">
            ${itensHtml}
          </div>

          <div class="divider"></div>

          <div class="total-box mb-2">Total: ${fmtBR(totalComanda)}</div>

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

    // Sem vínculo primeiro (sem grupo)
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

    // Grupos por time
    grupos.forEach(g => {
      const { btn } = __teamColor(g.timeId);
      const box = document.createElement('div');
      box.className = 'comanda-group';
      box.style.setProperty('--team-color', btn);
      box.innerHTML = `
        <div class="comanda-group-header">
          <div class="comanda-group-title"><span class="comanda-dot"></span></div>
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
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const dia = String(hoje.getDate()).padStart(2, '0');
                const hojeString = `${ano}-${mes}-${dia}`;
                
                console.log("Buscando reservas para a data:", hojeString);

                const reservasRef = db.collection('reservas');
                const snapshot = await reservasRef
                    .where('data_reserva', '==', hojeString)
                    .where('pagamento_reserva', 'in', ['aguardando', 'atrasada'])               
                    .orderBy('hora_inicio')
                    .orderBy('id_quadra')
                    .orderBy('id_cliente')
                    .get();

                listaReservasDiaEl.innerHTML = '';
                if (snapshot.empty) {
                    listaReservasDiaEl.innerHTML = `<tr><td colspan="6" class="text-center text-muted small">Nenhuma reserva para hoje.</td></tr>`;

                    return;
                

                }
                const reservasAgrupadas = {};

                snapshot.forEach(doc => {
                    const reserva = doc.data();
                    reserva.id = doc.id;
                    if (!reservasAgrupadas[reserva.id_cliente]) {
                        reservasAgrupadas[reserva.id_cliente] = [];
                    }
                    reservasAgrupadas[reserva.id_cliente].push(reserva);
                });

                for (const clienteId in reservasAgrupadas) {
                    const reservasDoCliente = reservasAgrupadas[clienteId];
                    const clienteNome = getClienteNome(clienteId);
                    const reservaIds = reservasDoCliente.map(res => res.id);
                    
                    reservasDoCliente.forEach((reserva, index) => {
                        const tr = document.createElement('tr');
                        
                        const temComanda = !!reserva.comanda_vinculada_id;
                        const botaoTexto = temComanda ? 'Ver Comanda' : 'Abrir Comanda';
                        const acaoBotao = temComanda ? `abrirModalPagamento('${reserva.comanda_vinculada_id}')` : `abrirComandaDeReservasDoDia(['${reservaIds.join("','")}'])`;
                        const classeBotao = temComanda ? 'btn-info' : 'btn-success';

                        if (index === 0) {
                            tr.innerHTML = `
                                <td rowspan="${reservasDoCliente.length}" class="align-middle small">${clienteNome}</td>
                                <td class="small">${getQuadraNome(reserva.id_quadra)}</td>
                                <td class="small">R$ <input type="number" step="0.01" class="form-control form-control-sm valor-input-reserva" id="valor-reserva-${reserva.id}" value="${Number(reserva.valor||0).toFixed(2)}" onchange="atualizarValorReserva('${reserva.id}', this.value)"></td>
                                <td class="small">${reserva.hora_inicio}</td>
                                <td class="small">${reserva.hora_fim}</td>
                                <td rowspan="${reservasDoCliente.length}" class="align-middle">
                                    <button class="btn ${classeBotao} btn-sm w-100" onclick="${acaoBotao}">
                                        ${botaoTexto}
                                    </button>
                                </td>
                            `;
                        } else {
                            tr.innerHTML = `
                                <td class="small">${getQuadraNome(reserva.id_quadra)}</td>
                                <td class="small">R$ <input type="number" step="0.01" class="form-control form-control-sm valor-input-reserva" id="valor-reserva-${reserva.id}" value="${Number(reserva.valor||0).toFixed(2)}" onchange="atualizarValorReserva('${reserva.id}', this.value)"></td>
                                <td class="small">${reserva.hora_inicio}</td>
                                <td class="small">${reserva.hora_fim}</td>
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

        

        // =========================================================
        // Ajuste (2026-01): edição do valor da reserva antes de abrir comanda
        // =========================================================

        // Atualiza valor da reserva ao editar (persiste no Firestore)
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

        /**
         * Exclui uma comanda do sistema.
         */
        async function excluirComanda(comandaId) {
            if (confirm("Tem certeza que deseja excluir esta comanda? Esta ação é irreversível.")) {
                try {
                    const comandaRef = db.collection('comandas').doc(comandaId);
                    const comandaDoc = await comandaRef.get();
                    const comandaData = comandaDoc.data();

                    if (comandaData.reservas_vinculadas_ids && comandaData.reservas_vinculadas_ids.length > 0) {
                        const batch = db.batch();
                        for (const reservaId of comandaData.reservas_vinculadas_ids) {
                            const reservaRef = db.collection('reservas').doc(reservaId);
                            batch.update(reservaRef, {
                                comanda_vinculada_id: null,
                                status_reserva: 'aguardando',
                                pagamento_reserva: 'aguardando'
                            });
                        }
                        await batch.commit();
                    }

                    await comandaRef.delete();
                    // (sucesso silencioso)

                    carregarComandasAbertas();
                    carregarReservasDoDia();
                } catch (error) {
                    console.error("Erro ao excluir comanda:", error);
                    alert("Erro ao excluir comanda. Tente novamente.");
                }
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

        /**
         * Finaliza o pagamento dos itens selecionados, atualizando a comanda.
         */
        async function finalizarPagamento() {
            const valorRecebido = parseFloat(valorRecebidoInput.value) || 0;
            const totalItensPagar = parseFloat(totalPagarEl.textContent.replace('R$ ', '')) || 0;

            if (totalItensPagar === 0) {
                alert("Nenhum item foi selecionado para pagamento.");
                return;
            }

            if (valorRecebido < totalItensPagar) {
                alert("O valor recebido é menor que o total dos itens selecionados. Por favor, insira o valor correto.");
                return;
            }

            if (!confirm(`Confirmar pagamento de R$ ${totalItensPagar.toFixed(2)}?`)) {
                return;
            }
            
            try {
                const comandaRef = db.collection('comandas').doc(comandaAtualId);
                const comandaDoc = await comandaRef.get();
                const comandaData = comandaDoc.data();
                
                const novosItensComanda = [];
                let todosItensForamPagos = true;

                // Armazena os itens que foram pagos para o registro histórico
                const itensPagos = [];

                comandaData.itens.forEach((item, index) => {
                    const checkbox = document.querySelector(`.item-pagar-checkbox[data-index="${index}"]`);
                    const qtdPagarInput = document.querySelector(`.qtd-pagar-input[data-index="${index}"]`);
                    let qtdPagar = parseInt(qtdPagarInput.value) || 0;

                    if (checkbox && checkbox.checked && qtdPagar > 0) {
                        itensPagos.push({ ...item, quantidade: qtdPagar });

                        if (qtdPagar < item.quantidade) {
                            todosItensForamPagos = false;
                            novosItensComanda.push({
                                ...item,
                                quantidade: item.quantidade - qtdPagar
                            });
                        }
                    } else {
                        novosItensComanda.push(item);
                        todosItensForamPagos = false;
                    }
                });

                if (todosItensForamPagos) {
            await comandaRef.update({
                status_comanda: 'Paga',
                data_pagamento: firebase.firestore.Timestamp.now(),
                valor_total: totalItensPagar
            });

            // Se a comanda estiver vinculada a reservas, atualiza o status de pagamento
            if (comandaData.reservas_vinculadas_ids && comandaData.reservas_vinculadas_ids.length > 0) {
                const batch = db.batch();
                for (const reservaId of comandaData.reservas_vinculadas_ids) {
                    const reservaRef = db.collection('reservas').doc(reservaId);
                    batch.update(reservaRef, {
                        pagamento_reserva: 'pago'
                    });
                }
                await batch.commit();
            }

                
                } else {
                    await comandaRef.update({
                        status_comanda: 'Aberta',
                        itens: novosItensComanda
                    });
                }

                // (sucesso silencioso)

                pagamentoModal.hide();
                carregarComandasAbertas();
                carregarHistoricoDeVendas(); // Recarrega o histórico após o pagamento
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

        // Event Listeners para Reservas Futuras (AGORA CHAMANDO AS FUNÇÕES ATUALIZADAS)
        btnBuscarReservasFuturas.addEventListener('click', buscarReservasFuturas);
        btnAbrirComandaFuturas.addEventListener('click', abrirComandaComReservasSelecionadas);

        selecionarTodasReservasEl.addEventListener('change', (event) => {
            const isChecked = event.target.checked;
            document.querySelectorAll('.reserva-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });

        btnFinalizarPagamentoModal.addEventListener('click', finalizarPagamento);
        valorRecebidoInput.addEventListener('input', (event) => {});

        // Event Listeners do Histórico
        filtroDataEl.addEventListener('change', carregarHistoricoDeVendas);
        btnFiltroAmbos.addEventListener('click', (e) => {
            tipoFiltroHistorico = 'Ambos';
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            carregarHistoricoDeVendas();
        });
        btnFiltroComandas.addEventListener('click', (e) => {
            tipoFiltroHistorico = 'Comandas';
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            carregarHistoricoDeVendas();
        });
        btnFiltroVendas.addEventListener('click', (e) => {
            tipoFiltroHistorico = 'Vendas';
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            carregarHistoricoDeVendas();
        });

        document.addEventListener('DOMContentLoaded', () => {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            filtroDataEl.value = `${ano}-${mes}-${dia}`;
            
            carregarProdutos();
            carregarClientes();
            carregarQuadras();
            carregarComandasAbertas();
            carregarReservasDoDia();
            popularSeletoresDeData();
            carregarHistoricoDeVendas();
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
let __vincularReservaModalInstance = null;

function fmtBR(v){
  const n = Number(v||0);
  return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}


/* ===== Helpers: cor consistente por reserva/time + label sem hora final ===== */
function __hashCode(str){
  str = String(str||'');
  let h=0;
  for(let i=0;i<str.length;i++){ h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function __teamColor(id){
  const h = __hashCode(id) % 360;
  // cor forte no botão, borda um pouco mais clara
  const btn = `hsl(${h}, 75%, 42%)`;
  const border = `hsl(${h}, 75%, 42%)`;
  return { btn, border };
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

    const modalEl = document.getElementById('vincularReservaModal');
    if (!modalEl) return;

    if (!__vincularReservaModalInstance){
      __vincularReservaModalInstance = new bootstrap.Modal(modalEl);
    }

    const listEl = document.getElementById('lista-reservas-vinculo');
    if (listEl) listEl.innerHTML = '<div class="text-muted small">Carregando reservas...</div>';

    const hoje = hojeYYYYMMDD();
    const snap = await db.collection('reservas')
      .where('data_reserva','==',hoje)
      .orderBy('hora_inicio')
      .get();

    if (!listEl) return;
    if (snap.empty){
      listEl.innerHTML = '<div class="text-muted small">Nenhuma reserva para hoje.</div>';
    } else {
      const itens = [];
      snap.forEach(doc=>{
        const r = doc.data()||{};
        const clienteNome = (window.getClienteNome ? window.getClienteNome(r.id_cliente) : (r.nome_cliente||'')) || '';
        const quadraNome = (window.getQuadraNome ? window.getQuadraNome(r.id_quadra) : (r.quadra||'')) || '';
        const label = `${clienteNome} • ${quadraNome} • ${r.hora_inicio || ''}-${r.hora_fim || ''}`;

        itens.push(`
          <label class="list-group-item d-flex align-items-center gap-2">
            <input class="form-check-input" type="radio" name="reserva-vinculo" value="${doc.id}" data-label="${label.replace(/"/g,'&quot;')}">
            <span class="small">${label}</span>
          </label>
        `);
      });
      listEl.innerHTML = `<div class="list-group">${itens.join('')}</div>`;
    }

    __vincularReservaModalInstance.show();
  }catch(err){
    console.error('Erro ao abrir modal de vínculo', err);
  }
}

async function salvarVinculoReserva(){
  try{
    if (!__vinculoComandaId) return;

    const selected = document.querySelector('input[name="reserva-vinculo"]:checked');
    if (!selected){
      alert('Selecione uma reserva para vincular.');
      return;
    }
    const reservaId = selected.value;
    const label = selected.getAttribute('data-label') || '';

    await db.collection('comandas').doc(__vinculoComandaId).update({
      reserva_time_id: reservaId,
      reserva_time_label: label,
      reserva_time_vinculado_em: firebase.firestore.Timestamp.now(),
      // quando vincula manualmente, não é a comanda "principal" do horário
      reserva_time_principal: false
    });

    if (__vincularReservaModalInstance) __vincularReservaModalInstance.hide();
    // atualiza lista de comandas pra refletir o label
    if (typeof carregarComandasAbertas === 'function') carregarComandasAbertas();
  }catch(err){
    console.error('Erro ao salvar vínculo', err);
    alert('Não consegui vincular a reserva. Tente novamente.');
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

  let somaReservasAPagar = 0;
  let somaReservasPagas = 0;
  let somaComandasAbertas = 0;
  let somaProdutosVendidos = 0;

  function recompute(){
    const total = somaReservasPagas + somaProdutosVendidos + somaComandasAbertas;
    els.reservasAPagar.textContent = fmtBR(somaReservasAPagar);
    els.reservasPagas.textContent = fmtBR(somaReservasPagas);
    els.comandasAbertas.textContent = fmtBR(somaComandasAbertas);
    els.produtosVendidos.textContent = fmtBR(somaProdutosVendidos);
    els.totalDia.textContent = fmtBR(total);
  }

  function anyToDate(v){
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v === 'string'){
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v + 'T00:00:00');
      const d = new Date(v);
      return isNaN(d) ? null : d;
    }
    return null;
  }
  function isTodayDate(d){
    const now = new Date();
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
  }

  const hoje = hojeYYYYMMDD();
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate()+1);

  // ===== Reservas A PAGAR (somente data_reserva HOJE, exclui canceladas e exclui pagas) =====
  db.collection('reservas').where('data_reserva','==',hoje).onSnapshot((snap)=>{
    let pagar = 0;
    snap.forEach(doc=>{
      const r = doc.data()||{};
      const status = String(r.status_reserva||'').toLowerCase();
      if (status === 'cancelada') return;
      const pag = String(r.pagamento_reserva||'').toLowerCase();
      if (pag === 'pago') return;
      const val = Number(r.valor || r.valor_total || 0);
      pagar += val;
    });
    somaReservasAPagar = pagar;
    recompute();
  });

  // ===== Reservas PAGAS HOJE (pela data do pagamento, não pela data da reserva) =====
  // usa data_pagamento_reserva (Timestamp) gravado quando a comanda/ação marca a reserva como paga
  db.collection('reservas')
    .where('pagamento_reserva','==','pago')
    .where('data_pagamento_reserva','>=', firebase.firestore.Timestamp.fromDate(start))
    .where('data_pagamento_reserva','<', firebase.firestore.Timestamp.fromDate(end))
    .onSnapshot((snap)=>{
      let pagas = 0;
      snap.forEach(doc=>{
        const r = doc.data()||{};
        const status = String(r.status_reserva||'').toLowerCase();
        if (status === 'cancelada') return;
        const val = Number(r.valor || r.valor_total || 0);
        pagas += val;
      });
      somaReservasPagas = pagas;
      recompute();
    });

  // ===== Comandas abertas (somente as abertas HOJE) =====
  db.collection('comandas').where('status_comanda','==','Aberta').onSnapshot((snap)=>{
    let total = 0;
    snap.forEach(doc=>{
      const c = doc.data()||{};
      const d = anyToDate(c.data_abertura);
      if (d && !isTodayDate(d)) return;
      (c.itens||[]).forEach(it=>{
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda||0);
        total += qtd * preco;
      });
    });
    somaComandasAbertas = total;
    recompute();
  });

  // ===== Produtos vendidos HOJE (comandas pagas hoje + venda direta hoje) =====
  db.collection('comandas').where('status_comanda','==','Paga').onSnapshot((snap)=>{
    let prod = 0;
    snap.forEach(doc=>{
      const c = doc.data()||{};
      const d = anyToDate(c.data_pagamento);
      if (!d || !isTodayDate(d)) return;
      (c.itens||[]).forEach(it=>{
        const nome = String(it?.nome||'');
        const isReserva = nome.toLowerCase().startsWith('reserva');
        if (isReserva) return;
        const qtd = Number(it?.quantidade||1);
        const preco = Number(it?.preco_venda||0);
        prod += qtd * preco;
      });
    });
    window.__prodComandasHoje = prod;
    somaProdutosVendidos = (window.__prodComandasHoje||0) + (window.__prodDiretaHoje||0);
    recompute();
  });

  db.collection('Venda direta').onSnapshot((snap)=>{
    let prod = 0;
    snap.forEach(doc=>{
      const v = doc.data()||{};
      const d = anyToDate(v.data_venda);
      if (!d || !isTodayDate(d)) return;
      (v.itens||[]).forEach(it=>{
        const nome = String(it?.nome||'');
        const isReserva = nome.toLowerCase().startsWith('reserva');
        if (isReserva) return;
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
});
