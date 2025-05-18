document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const themeToggle = document.getElementById('theme-toggle');
    const modemForm = document.getElementById('modem-form');
    const dataTable = document.getElementById('data-table').querySelector('tbody');
    const searchResultsTable = document.getElementById('search-results-table').querySelector('tbody');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchNodeButton = document.getElementById('search-node-button');
    const listIdsButton = document.getElementById('list-ids-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    const idsListContainer = document.getElementById('ids-list-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Inicializar timestamp com data e hora atual
    document.getElementById('timestamp').value = new Date().toISOString().slice(0, 16);
    
    // Dados
    let modemData = JSON.parse(localStorage.getItem('modemData')) || [];
    let lastId = parseInt(localStorage.getItem('lastId')) || 0;
    let searchResults = [];
    
    // Alternar tema claro/escuro
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        
        // Salvar preferência de tema
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDarkTheme);
    });
    
    // Carregar preferência de tema
    if (localStorage.getItem('darkTheme') === 'true') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    // Alternar entre abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            button.classList.add('active');
            
            // Mostrar conteúdo correspondente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Adicionar novo registro
    modemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Incrementar ID
        lastId++;
        
        // Obter valores do formulário
        const newRecord = {
            id: lastId,
            timestamp: document.getElementById('timestamp').value,
            node: document.getElementById('node').value,
            mac: document.getElementById('mac').value,
            name: document.getElementById('name').value,
            snrDownstream: parseFloat(document.getElementById('snr-downstream').value),
            snrUpstream: parseFloat(document.getElementById('snr-upstream').value),
            powerDownstream: parseFloat(document.getElementById('power-downstream').value),
            powerUpstream: parseFloat(document.getElementById('power-upstream').value)
        };
        
        // Adicionar ao array de dados
        modemData.push(newRecord);
        
        // Salvar no localStorage
        saveData();
        
        // Atualizar tabela
        renderDataTable();
        
        // Limpar formulário e definir timestamp atual
        modemForm.reset();
        document.getElementById('timestamp').value = new Date().toISOString().slice(0, 16);
        
        // Mostrar mensagem de sucesso
        alert('Registro salvo com sucesso!');
    });
    
    // Buscar registros
    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            alert('Digite um termo para buscar!');
            return;
        }
        
        searchResults = modemData.filter(record => {
            return (
                record.id.toString().includes(searchTerm) ||
                record.mac.toLowerCase().includes(searchTerm) ||
                record.node.toLowerCase().includes(searchTerm)
            );
        });
        
        renderSearchResults();
        
        // Mudar para a aba de resultados
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('[data-tab="search-results"]').classList.add('active');
        document.getElementById('search-results').classList.add('active');
    });
    
    // Buscar por Node com destaque visual
    searchNodeButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            alert('Digite um Node para buscar!');
            return;
        }
        
        searchResults = modemData.filter(record => {
            return record.node.toLowerCase().includes(searchTerm);
        });
        
        renderSearchResults(true); // true para destacar os resultados
        
        // Mudar para a aba de resultados
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('[data-tab="search-results"]').classList.add('active');
        document.getElementById('search-results').classList.add('active');
    });
    
    // Listar todos os IDs
    listIdsButton.addEventListener('click', function() {
        renderIdsList();
        
        // Mudar para a aba de IDs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector('[data-tab="ids-list"]').classList.add('active');
        document.getElementById('ids-list').classList.add('active');
    });
    
    // Exportar para CSV
    exportCsvButton.addEventListener('click', function() {
        if (modemData.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }
        
        // Cabeçalhos do CSV
        let csvContent = 'ID,Timestamp,Node,MAC,Nome,SNR Downstream,SNR Upstream,Potência Downstream,Potência Upstream\n';
        
        // Adicionar dados
        modemData.forEach(record => {
            csvContent += `${record.id},${record.timestamp},${record.node},${record.mac},${record.name},${record.snrDownstream},${record.snrUpstream},${record.powerDownstream},${record.powerUpstream}\n`;
        });
        
        // Criar blob e link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `modem_data_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // Renderizar tabela de dados
    function renderDataTable() {
        dataTable.innerHTML = '';
        
        if (modemData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="10" style="text-align: center;">Nenhum registro encontrado</td>';
            dataTable.appendChild(emptyRow);
            return;
        }
        
        modemData.forEach(record => {
            const row = createTableRow(record);
            dataTable.appendChild(row);
        });
    }
    
    // Renderizar resultados da busca
    function renderSearchResults(highlight = false) {
        searchResultsTable.innerHTML = '';
        
        if (searchResults.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="10" style="text-align: center;">Nenhum resultado encontrado</td>';
            searchResultsTable.appendChild(emptyRow);
            return;
        }
        
        searchResults.forEach(record => {
            const row = createTableRow(record);
            
            if (highlight) {
                row.classList.add('highlight');
            }
            
            searchResultsTable.appendChild(row);
        });
    }
    
    // Renderizar lista de IDs
    function renderIdsList() {
        idsListContainer.innerHTML = '';
        
        if (modemData.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'Nenhum ID registrado';
            idsListContainer.appendChild(emptyItem);
            return;
        }
        
        modemData.forEach(record => {
            const listItem = document.createElement('li');
            listItem.textContent = `ID: ${record.id}`;
            listItem.setAttribute('data-id', record.id);
            
            listItem.addEventListener('click', () => {
                searchResults = modemData.filter(item => item.id === record.id);
                renderSearchResults();
                
                // Mudar para a aba de resultados
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                document.querySelector('[data-tab="search-results"]').classList.add('active');
                document.getElementById('search-results').classList.add('active');
            });
            
            idsListContainer.appendChild(listItem);
        });
    }
    
    // Criar linha da tabela
    function createTableRow(record) {
        const row = document.createElement('tr');
        
        // Formatar timestamp para exibição
        const timestamp = new Date(record.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${timestamp}</td>
            <td>${record.node}</td>
            <td>${record.mac}</td>
            <td>${record.name}</td>
            <td>${record.snrDownstream} dB</td>
            <td>${record.snrUpstream} dB</td>
            <td>${record.powerDownstream} dBmV</td>
            <td>${record.powerUpstream} dBmV</td>
            <td class="action-buttons">
                <button class="btn danger delete-btn" data-id="${record.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Adicionar evento para botão de excluir
        row.querySelector('.delete-btn').addEventListener('click', function() {
            const recordId = parseInt(this.getAttribute('data-id'));
            deleteRecord(recordId);
        });
        
        return row;
    }
    
    // Excluir registro
    function deleteRecord(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            modemData = modemData.filter(record => record.id !== id);
            searchResults = searchResults.filter(record => record.id !== id);
            
            saveData();
            renderDataTable();
            renderSearchResults();
            renderIdsList();
        }
    }
    
    // Salvar dados no localStorage
    function saveData() {
        localStorage.setItem('modemData', JSON.stringify(modemData));
        localStorage.setItem('lastId', lastId.toString());
    }
    
    // Inicializar tabelas
    renderDataTable();
});
