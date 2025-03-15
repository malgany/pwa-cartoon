// Inicialização do Material Design
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa botões FAB
    document.querySelectorAll('.mdc-fab').forEach(fab => {
        mdc.ripple.MDCRipple.attachTo(fab);
    });
    
    // Verifica se já passou pela tela de splash antes
    if (sessionStorage.getItem('splashShown')) {
        document.querySelector('.splash-screen').classList.add('hidden');
        document.querySelector('.main-content').classList.remove('hidden');
    } else {
        // Botão para avançar da tela de boas-vindas
        document.getElementById('get-started-button').addEventListener('click', function() {
            document.querySelector('.splash-screen').classList.add('hidden');
            document.querySelector('.main-content').classList.remove('hidden');
            // Marcar que já viu a splash
            sessionStorage.setItem('splashShown', 'true');
        });
    }
    
    // Configuração do botão da câmera
    setupCameraButton();
});

// Função para compactar imagem
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
    console.log(`📸 [Frontend] Iniciando compactação de imagem: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                // Calcular as dimensões mantendo a proporção
                let width = img.width;
                let height = img.height;
                console.log(`🔍 [Frontend] Dimensões originais: ${width}x${height}`);
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * maxHeight / height);
                        height = maxHeight;
                    }
                }
                
                console.log(`✂️ [Frontend] Dimensões após redimensionamento: ${width}x${height}`);
                
                // Criar canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para base64 com compressão
                const compressedImageData = canvas.toDataURL('image/jpeg', quality);
                console.log(`🗜️ [Frontend] Imagem compactada: ${(compressedImageData.length / 1024).toFixed(2)} KB (qualidade: ${quality})`);
                
                resolve(compressedImageData);
            };
            
            img.onerror = function() {
                console.error('❌ [Frontend] Erro ao carregar a imagem');
                reject(new Error('Erro ao carregar a imagem'));
            };
        };
        
        reader.onerror = function() {
            console.error('❌ [Frontend] Erro ao ler o arquivo');
            reject(new Error('Erro ao ler o arquivo'));
        };
    });
}

// Função para enviar imagem para a API
function uploadImage(imageData) {
    console.log(`📤 [Frontend] Iniciando envio da imagem (${(imageData.length / 1024).toFixed(2)} KB)`);
    showSnackbar('Enviando imagem...');
    
    // URL da API - ajuste conforme necessário
    const apiUrl = 'https://api-cartoon-production.up.railway.app/upload-image';
    
    // Enviar para a API
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageData })
    })
    .then(response => {
        if (!response.ok) {
            console.error(`❌ [Frontend] Erro na resposta da API: ${response.status} ${response.statusText}`);
            throw new Error('Erro ao enviar imagem');
        }
        return response.json();
    })
    .then(data => {
        console.log(`✅ [Frontend] Imagem enviada com sucesso!`, data);
        showSnackbar('Imagem enviada com sucesso!');
        return data;
    })
    .catch(error => {
        console.error(`❌ [Frontend] Erro ao enviar imagem:`, error);
        showSnackbar('Erro ao enviar imagem: ' + error.message);
        throw error;
    });
}

// Configuração do botão da câmera
function setupCameraButton() {
    const cameraButton = document.getElementById('camera-button');
    const cameraInput = document.getElementById('camera-input');
    const previewImage = document.querySelector('.preview-image');
    
    if (cameraButton && cameraInput) {
        // Quando o botão da câmera é clicado, aciona o input de arquivo
        cameraButton.addEventListener('click', () => {
            // Remove o checkbox de salvar se existir
            removeSaveCheckbox();
            
            // Limpa o valor do input para garantir que o evento change seja disparado mesmo se selecionar a mesma imagem
            cameraInput.value = '';
            cameraInput.click();
        });
        
        // Quando uma imagem é selecionada
        cameraInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                const file = event.target.files[0];
                console.log(`📱 [Frontend] Imagem capturada: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
                
                // Verifica se o arquivo é uma imagem
                if (file.type.match('image.*')) {
                    showSnackbar('Processando imagem...');
                    
                    // Remove o checkbox de salvar quando uma nova imagem é capturada
                    removeSaveCheckbox();
                    
                    // Compactar a imagem antes de enviar
                    compressImage(file)
                        .then(compressedImageData => {
                            // Exibir a imagem compactada no preview
                            if (previewImage) {
                                previewImage.src = compressedImageData;
                                console.log(`🖼️ [Frontend] Imagem exibida no preview`);
                                
                                // Desabilitar botões durante o processamento
                                toggleButtonsState(false);
                                
                                // Adiciona classe para efeito de transição
                                previewImage.classList.add('processing');
                            }
                            
                            // Enviar a imagem compactada para a API
                            return uploadImage(compressedImageData);
                        })
                        .then(responseData => {
                            console.log('📊 [Frontend] Resposta completa da API:', responseData);
                            
                            // Verifica se o upload retornou um ID de imagem
                            if (responseData && responseData.image.id) {
                                // Obtém a imagem cartoon usando o ID da imagem
                                return getCartoonImage(responseData.image.id);
                            } else {
                                throw new Error('ID da imagem não retornado pela API');
                            }
                        })
                        .then(cartoonData => {
                            // Exibe a imagem cartoon diretamente no preview
                            if (cartoonData && cartoonData.cartoonImageBase64) {
                                if (previewImage) {
                                    // Remove a classe de transição
                                    previewImage.classList.remove('processing');
                                    
                                    previewImage.src = cartoonData.cartoonImageBase64;
                                    console.log(`🖼️ [Frontend] Imagem cartoon base64 exibida no preview`);
                                    showSnackbar('Cartoon gerado com sucesso!');
                                    
                                    // Adiciona checkbox para salvar na galeria
                                    addSaveCheckbox(cartoonData.cartoonImageBase64);
                                }
                            } else {
                                throw new Error('Dados da imagem cartoon em base64 não retornados pela API');
                            }
                        })
                        .catch(error => {
                            console.error('❌ [Frontend] Erro no processo:', error);
                            showSnackbar('Erro: ' + error.message);
                            // Remove a classe de transição em caso de erro
                            if (previewImage) {
                                previewImage.classList.remove('processing');
                            }
                            // Reabilita os botões em caso de erro
                            toggleButtonsState(true);
                        });
                } else {
                    console.warn('⚠️ [Frontend] Arquivo selecionado não é uma imagem válida');
                    showSnackbar('Por favor, selecione uma imagem válida.');
                }
            }
        });
    }
}

// Função para mostrar um snackbar com mensagem
function showSnackbar(message) {
    // Verifica se já existe um snackbar
    let snackbarContainer = document.querySelector('.mdc-snackbar');
    
    // Se não existir, cria um novo
    if (!snackbarContainer) {
        snackbarContainer = document.createElement('div');
        snackbarContainer.className = 'mdc-snackbar';
        
        const snackbarSurface = document.createElement('div');
        snackbarSurface.className = 'mdc-snackbar__surface';
        
        const snackbarLabel = document.createElement('div');
        snackbarLabel.className = 'mdc-snackbar__label';
        snackbarLabel.setAttribute('role', 'status');
        snackbarLabel.setAttribute('aria-live', 'polite');
        
        snackbarSurface.appendChild(snackbarLabel);
        snackbarContainer.appendChild(snackbarSurface);
        document.body.appendChild(snackbarContainer);
    }
    
    // Configura e mostra o snackbar
    const snackbar = new mdc.snackbar.MDCSnackbar(snackbarContainer);
    snackbarContainer.querySelector('.mdc-snackbar__label').textContent = message;
    snackbar.open();
}

// Detecta se o app está sendo executado em modo standalone (instalado)
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    console.log('SnapToon está instalado e rodando em modo standalone');
}

// Variável para armazenar o evento de instalação
let deferredPrompt;

// Função para mostrar o botão de instalação
function showInstallButton() {
    const installContainer = document.getElementById('install-container');
    if (installContainer) {
        installContainer.classList.remove('hidden');
        
        // Configura o botão de instalação
        const installButton = document.getElementById('install-button');
        if (installButton) {
            // Inicializa o ripple do Material Design
            new mdc.ripple.MDCRipple(installButton);
            
            // Adiciona o evento de clique
            installButton.addEventListener('click', async () => {
                // Esconde o botão de instalação
                installContainer.classList.add('hidden');
                
                // Mostra o prompt de instalação
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    
                    // Espera a resposta do usuário
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`👤 [Frontend] Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
                    
                    // Limpa o evento
                    deferredPrompt = null;
                }
            });
        }
        
        // Esconde o botão após 10 segundos
        setTimeout(() => {
            installContainer.classList.add('hidden');
        }, 10000);
    }
}

// Detecta se o app pode ser instalado
window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o comportamento padrão
    e.preventDefault();
    
    // Armazena o evento para uso posterior
    deferredPrompt = e;
    
    // Mostra o botão de instalação automaticamente
    showInstallButton();
});

// Detecta quando o app é instalado
window.addEventListener('appinstalled', () => {
    console.log('✅ [Frontend] SnapToon instalado com sucesso!');
    
    // Esconde o botão de instalação
    const installContainer = document.getElementById('install-container');
    if (installContainer) {
        installContainer.classList.add('hidden');
    }
    
    // Limpa a referência
    deferredPrompt = null;
    
    // Mostra uma mensagem de confirmação
    showSnackbar('SnapToon foi instalado com sucesso! 🎉');
});

// Função para obter a imagem em cartoon da API
function getCartoonImage(imageId) {
    console.log(`🎨 [Frontend] Solicitando imagem cartoon para ID: ${imageId}`);
    showSnackbar('Gerando cartoon...');
    
    // Remove o checkbox de salvar durante o processamento
    removeSaveCheckbox();
    
    // Desabilita os botões durante o processamento
    toggleButtonsState(false);
    
    // URL da API - ajuste conforme necessário
    const apiUrl = 'https://api-cartoon-production.up.railway.app/get-cartoon';
    
    // Enviar para a API
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId })
    })
    .then(response => {
        if (!response.ok) {
            console.error(`❌ [Frontend] Erro na resposta da API: ${response.status} ${response.statusText}`);
            // Reabilita os botões em caso de erro
            toggleButtonsState(true);
            throw new Error('Erro ao obter imagem cartoon');
        }
        return response.json();
    })
    .then(data => {
        console.log(`✅ [Frontend] Imagem cartoon recebida com sucesso!`);
        showSnackbar('Cartoon gerado com sucesso!');
        // Reabilita os botões após o processamento
        toggleButtonsState(true);
        return data;
    })
    .catch(error => {
        console.error(`❌ [Frontend] Erro ao obter imagem cartoon:`, error);
        showSnackbar('Erro ao obter imagem cartoon: ' + error.message);
        // Reabilita os botões em caso de erro
        toggleButtonsState(true);
        throw error;
    });
}

// Função para habilitar/desabilitar os botões
function toggleButtonsState(enabled) {
    const cameraButton = document.getElementById('camera-button');
    
    if (cameraButton) {
        if (enabled) {
            cameraButton.removeAttribute('disabled');
            cameraButton.classList.remove('mdc-fab--disabled');
        } else {
            cameraButton.setAttribute('disabled', 'true');
            cameraButton.classList.add('mdc-fab--disabled');
        }
    }
}

// Função para remover o checkbox de salvar
function removeSaveCheckbox() {
    const existingCheckbox = document.querySelector('.save-checkbox-container');
    if (existingCheckbox) {
        existingCheckbox.remove();
    }
}

// Função para adicionar checkbox de salvamento
function addSaveCheckbox(imageBase64) {
    // Remove qualquer checkbox existente
    removeSaveCheckbox();
    
    // Cria o container para o checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'save-checkbox-container';
    
    // Usa diretamente o HTML do Material Design para o checkbox e botão
    checkboxContainer.innerHTML = `
        <div class="mdc-form-field">
            <button class="mdc-button mdc-button--raised" id="save-device-button">
                <span class="mdc-button__ripple"></span>
                <span class="mdc-button__label">Salvar no Dispositivo</span>
            </button>
        </div>
    `;
    
    // Adiciona o container dentro do preview container, após a imagem
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        previewContainer.appendChild(checkboxContainer);
    }
    
    // Adiciona o evento de clique no botão
    const saveButton = document.getElementById('save-device-button');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const saved = await saveImageToDevice(imageBase64);
            if (saved) {
                saveButton.textContent = 'Salvo!';
                setTimeout(() => {
                    saveButton.textContent = 'Salvar no Dispositivo';
                }, 2000);
            }
        });
        
        // Inicializa o botão Material Design
        new mdc.ripple.MDCRipple(saveButton);
    }
}

// Função para salvar imagem no dispositivo
async function saveImageToDevice(imageBase64) {
    try {
        // Remove o cabeçalho da string base64 se existir
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        
        // Converte base64 para Blob
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        
        try {
            // Verifica se o navegador suporta a API
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `snaptoon_${Date.now()}.jpg`,
                    types: [{
                        description: 'Imagem JPEG',
                        accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
                    }]
                });
                
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                console.log('✅ [Frontend] Imagem salva no dispositivo com sucesso!');
                showSnackbar('Imagem salva no dispositivo!');
                return true;
            } else {
                // Fallback para navegadores que não suportam a API
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `snaptoon_${Date.now()}.jpg`;
                link.click();
                URL.revokeObjectURL(link.href);
                
                console.log('✅ [Frontend] Imagem baixada usando método alternativo');
                showSnackbar('Imagem baixada para o dispositivo!');
                return true;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('ℹ️ [Frontend] Usuário cancelou o salvamento');
                return false;
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ [Frontend] Erro ao salvar imagem:', error);
        showSnackbar('Erro ao salvar imagem: ' + error.message);
        return false;
    }
}