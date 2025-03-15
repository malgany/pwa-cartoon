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
    
    // Configuração do botão da galeria
    setupGalleryButton();
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
    const apiUrl = 'http://api-cartoon-production.up.railway.app:9999/upload-image';
    
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

// Configuração do botão da galeria
function setupGalleryButton() {
    const galleryButton = document.getElementById('gallery-button');
    
    if (galleryButton) {
        galleryButton.addEventListener('click', () => {
            // Remove o checkbox de salvar se existir
            removeSaveCheckbox();
            
            // Apenas mostra um snackbar informativo, conforme solicitado
            // não implementa funcionalidade real
            showSnackbar('Galeria do aplicativo será implementada em breve!');
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

// Detecta se o app pode ser instalado
window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o comportamento padrão
    e.preventDefault();
    
    // Armazena o evento para uso posterior
    deferredPrompt = e;
    
    // Aqui você poderia mostrar um botão ou banner de instalação
    console.log('O app está disponível para instalação');
    
    // Exemplo: mostrar um snackbar informando que o app pode ser instalado
    showSnackbar('Toque em "Instalar" para adicionar o SnapToon à sua tela inicial');
});

// Detecta quando o app é instalado
window.addEventListener('appinstalled', () => {
    console.log('SnapToon instalado com sucesso!');
    
    // Limpa a referência
    deferredPrompt = null;
    
    // Mostra uma mensagem de confirmação
    showSnackbar('SnapToon foi instalado com sucesso!');
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
    const apiUrl = 'http://api-cartoon-production.up.railway.app:9999/get-cartoon';
    
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
    const galleryButton = document.getElementById('gallery-button');
    
    if (cameraButton) {
        if (enabled) {
            cameraButton.removeAttribute('disabled');
            cameraButton.classList.remove('mdc-fab--disabled');
        } else {
            cameraButton.setAttribute('disabled', 'true');
            cameraButton.classList.add('mdc-fab--disabled');
        }
    }
    
    if (galleryButton) {
        if (enabled) {
            galleryButton.removeAttribute('disabled');
            galleryButton.classList.remove('mdc-fab--disabled');
        } else {
            galleryButton.setAttribute('disabled', 'true');
            galleryButton.classList.add('mdc-fab--disabled');
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
    
    // Usa diretamente o HTML do Material Design para o checkbox
    checkboxContainer.innerHTML = `
        <div class="mdc-form-field">
            <div class="mdc-checkbox save-checkbox">
                <input type="checkbox"
                        class="mdc-checkbox__native-control"
                        id="save-cartoon-checkbox"/>
                <div class="mdc-checkbox__background">
                    <svg class="mdc-checkbox__checkmark"
                        viewBox="0 0 24 24">
                        <path class="mdc-checkbox__checkmark-path"
                                fill="none"
                                d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
                    </svg>
                    <div class="mdc-checkbox__mixedmark"></div>
                </div>
                <div class="mdc-checkbox__ripple"></div>
            </div>
            <span id="save-checkbox-text" style="color: white; text-shadow: 0 0 3px rgba(0,0,0,0.7); margin-left: 8px;">Salvar?</span>
        </div>
    `;
    
    // Adiciona o checkbox dentro do preview container, após a imagem
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        // Garante que seja adicionado ao final do container
        previewContainer.appendChild(checkboxContainer);
    }
    
    // Obter referência ao checkbox e ao texto
    const checkbox = document.getElementById('save-cartoon-checkbox');
    const checkboxText = document.getElementById('save-checkbox-text');
    
    // Adiciona o evento de checkbox
    if (checkbox && checkboxText) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                saveImageToGallery(imageBase64);
                showSnackbar('Imagem salva na galeria!');
                checkboxText.textContent = 'Salvo!';
            } else {
                removeImageFromGallery(imageBase64);
                showSnackbar('Imagem removida da galeria!');
                checkboxText.textContent = 'Salvar?';
            }
        });
        
        // Inicializa o checkbox Material Design
        const mdcCheckbox = new mdc.checkbox.MDCCheckbox(document.querySelector('.save-checkbox'));
        new mdc.formField.MDCFormField(document.querySelector('.mdc-form-field')).input = mdcCheckbox;
    }
}

// Função para salvar imagem na galeria (localStorage)
function saveImageToGallery(imageBase64) {
    try {
        // Obtém a galeria atual ou cria uma nova
        let gallery = JSON.parse(localStorage.getItem('snaptoon_gallery')) || [];
        
        // Gera um ID único para a imagem
        const imageId = 'img_' + Date.now();
        
        // Limita o número de imagens armazenadas para evitar exceder a cota
        const MAX_GALLERY_IMAGES = 5; // Limita a 5 imagens
        
        // Se já atingimos o limite, remove a imagem mais antiga
        if (gallery.length >= MAX_GALLERY_IMAGES) {
            // Ordena por data (do mais antigo para o mais recente)
            gallery.sort((a, b) => new Date(a.date) - new Date(b.date));
            // Remove a imagem mais antiga
            gallery.shift();
            console.log('🗑️ [Frontend] Imagem mais antiga removida para liberar espaço');
        }
        
        // Adiciona a nova imagem
        gallery.push({
            id: imageId,
            data: imageBase64,
            date: new Date().toISOString()
        });
        
        try {
            // Tenta salvar a galeria atualizada
            localStorage.setItem('snaptoon_gallery', JSON.stringify(gallery));
            console.log(`💾 [Frontend] Imagem salva na galeria local com ID: ${imageId}`);
            return imageId;
        } catch (storageError) {
            // Se ainda falhar por falta de espaço, remove imagens até conseguir salvar
            console.warn('⚠️ [Frontend] Erro de armazenamento, tentando liberar espaço:', storageError);
            
            // Enquanto houver imagens e ainda não conseguir salvar
            while (gallery.length > 1) {
                // Remove a imagem mais antiga e tenta novamente
                gallery.shift();
                try {
                    localStorage.setItem('snaptoon_gallery', JSON.stringify(gallery));
                    console.log('🗑️ [Frontend] Removidas imagens antigas para liberar espaço');
                    showSnackbar('Algumas imagens antigas foram removidas para liberar espaço');
                    return imageId;
                } catch (e) {
                    // Continua o loop se ainda não funcionar
                    if (gallery.length <= 1) {
                        throw new Error('Não foi possível liberar espaço suficiente');
                    }
                }
            }
            
            // Se chegar aqui, não foi possível salvar
            throw new Error('Não foi possível liberar espaço suficiente');
        }
    } catch (error) {
        console.error('❌ [Frontend] Erro ao salvar na galeria:', error);
        showSnackbar('Erro ao salvar imagem: Armazenamento cheio. Tente liberar espaço removendo imagens antigas.');
        
        // Desmarca o checkbox em caso de erro
        const checkbox = document.getElementById('save-cartoon-checkbox');
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // Volta o texto para "Salvar?"
        const checkboxText = document.getElementById('save-checkbox-text');
        if (checkboxText) {
            checkboxText.textContent = 'Salvar?';
        }
        
        return null;
    }
}

// Função para remover imagem da galeria
function removeImageFromGallery(imageBase64) {
    try {
        // Obtém a galeria atual
        let gallery = JSON.parse(localStorage.getItem('snaptoon_gallery')) || [];
        
        // Filtra para remover a imagem
        gallery = gallery.filter(item => item.data !== imageBase64);
        
        // Salva a galeria atualizada
        localStorage.setItem('snaptoon_gallery', JSON.stringify(gallery));
        
        console.log(`🗑️ [Frontend] Imagem removida da galeria local`);
    } catch (error) {
        console.error('❌ [Frontend] Erro ao remover da galeria:', error);
        showSnackbar('Erro ao remover imagem: ' + error.message);
    }
}