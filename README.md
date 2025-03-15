# Meu Aplicativo PWA com Material Design

Este é um projeto de Progressive Web App (PWA) criado com HTML, CSS e JavaScript puro, utilizando os componentes e estilos do Material Design do Google.

## Recursos Implementados

- 📱 Design responsivo que funciona em qualquer dispositivo
- 🎨 Interface com Material Design do Google
- 🔄 Service Worker para funcionalidade offline
- 📲 Suporte para instalação como aplicativo nativo
- 📢 Detecção de status online/offline
- 🧩 Arquivo de manifesto para configuração do comportamento do app

## Bibliotecas Utilizadas

- Material Components Web (MDC Web) - Componentes de interface do Material Design
- Google Fonts - Para a fonte Roboto e ícones do Material Design

## Estrutura do Projeto

```
├── index.html          # Página principal
├── manifest.json       # Configurações do PWA
├── sw.js               # Service Worker
├── css/
│   └── styles.css      # Estilos da aplicação
├── js/
│   └── app.js          # Lógica JavaScript principal
└── images/
    └── icons/          # Ícones do aplicativo
        ├── icon-192x192.png
        └── icon-512x512.png
```

## Como Testar Localmente

Para testar este PWA localmente, você precisa servir os arquivos através de um servidor HTTP. Você pode usar qualquer servidor web de sua preferência.

Exemplo usando o servidor web Python:

```bash
# Se você tem Python 3 instalado
python -m http.server 8000

# Se você tem Python 2 instalado
python -m SimpleHTTPServer 8000
```

Em seguida, abra seu navegador e acesse: `http://localhost:8000`

## Requisitos para Instalação

Para que o PWA possa ser instalado no dispositivo do usuário, é necessário:

1. O site deve estar servido via HTTPS (exceto em localhost)
2. Ter um manifesto web válido
3. Ter um service worker registrado
4. Ter ícones do aplicativo
5. O usuário deve interagir com o site antes que o prompt de instalação seja exibido

## Recursos Adicionais

- [Material Design](https://material.io/) - Sistema de design do Google
- [Material Components Web](https://github.com/material-components/material-components-web) - Implementação dos componentes Material Design
- [Web.dev - Introdução a PWAs](https://web.dev/progressive-web-apps/)
- [MDN Web Docs - Progressive Web Apps](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)
- [Google Developers - PWA Checklist](https://web.dev/pwa-checklist/)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes. 