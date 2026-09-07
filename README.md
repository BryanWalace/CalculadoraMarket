<div align="center">

# 🛒 Carrinho

**Soma o valor da compra em tempo real, lendo o preço da etiqueta pela câmera.**
Custo zero. 100% offline. Sem backend, sem conta, sem chamada de rede.

[![Build APK](https://github.com/BryanWalace/CalculadoraMarket/actions/workflows/build-apk.yml/badge.svg)](https://github.com/BryanWalace/CalculadoraMarket/actions/workflows/build-apk.yml)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![100% offline](https://img.shields.io/badge/rede-zero%20chamadas-success)](#-privacidade)

[**📲 Baixar o APK e testar agora**](https://github.com/BryanWalace/CalculadoraMarket/releases/latest/download/app-release.apk)

</div>

---

## 📲 Baixar e instalar no Android

1. No navegador **do celular**, abra:
   👉 **https://github.com/BryanWalace/CalculadoraMarket/releases/latest/download/app-release.apk**
2. Baixe o arquivo `app-release.apk`.
3. Ao abrir, o Android vai pedir para permitir "instalar apps de fontes desconhecidas" — permita para esse arquivo.
4. Instale e abra o app. Ele só vai pedir a permissão de câmera no momento em que você for fotografar uma etiqueta.

Esse link é **fixo** — a cada mudança no código, um novo APK é compilado automaticamente (veja o badge de build acima) e substitui o anterior, sempre no mesmo endereço.

> Assinado com a chave de debug padrão do Android (o próprio Gradle gera essa chave) — serve para instalar e testar no seu aparelho, não é uma versão para publicar na Play Store.

## ✨ O que o app faz

- 📷 Fotografa a etiqueta de preço e lê o texto direto no aparelho (OCR on-device, via ML Kit)
- 🧮 Soma o total da compra em tempo real conforme os itens são adicionados
- ✏️ Adição e edição manual de itens, por unidade (`un`) ou peso (`kg`)
- 💰 Orçamento opcional por carrinho, com barra de progresso e aviso ao estourar
- ↩️ Desfazer exclusão de item (5s de janela)
- 🧾 Histórico de compras finalizadas, com resumo de gastos do mês
- 📤 Exportação de compras em CSV ou texto simples
- 🌗 Tema claro/escuro automático
- 🔒 Zero permissão além da câmera, zero chamada de rede, nenhuma foto na galeria pública

## 🧱 Stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (`strict`) · `expo-router` · `expo-camera` + `@react-native-ml-kit/text-recognition` (OCR) · `expo-sqlite` · `zustand` · `zod` · Jest + React Native Testing Library

## 💻 Como rodar em desenvolvimento

Pré-requisitos: Node.js e um dispositivo/emulador Android. O app usa código nativo (câmera, ML Kit), então **não roda no Expo Go**.

```bash
npm install
npx expo prebuild        # gera os projetos nativos android/ e ios/
npx expo run:android     # builda e instala o dev client no dispositivo/emulador
```

Depois da primeira instalação, no dia a dia basta:

```bash
npx expo start --dev-client
```

## 🔧 Comandos úteis

| Comando                | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `npm run lint`         | ESLint                                   |
| `npm test`             | Suíte de testes (Jest)                   |
| `npx tsc --noEmit`     | Checagem de tipos                        |
| `npx expo prebuild`    | Gera os projetos nativos `android`/`ios` |
| `npx expo run:android` | Build e instalação local no Android      |

## 📦 Gerar um build Android

**Automático (recomendado):** todo push em `master` dispara o workflow [`build-apk.yml`](.github/workflows/build-apk.yml), que compila e publica o APK em [Releases](https://github.com/BryanWalace/CalculadoraMarket/releases) — é o link do topo deste README. Também dá pra disparar manualmente pela aba **Actions → Build Android APK → Run workflow**.

**Local:**

```bash
npx expo prebuild
npx expo run:android --variant release
```

O APK gerado fica em `android/app/build/outputs/apk/release/`.

**EAS Build (nuvem, conta Expo):**

```bash
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

`app.json` ainda não tem um `android.package` fixo — sem ele, cada `expo prebuild` gera um nome tipo `com.anonymous.carrinho`. Antes de publicar de verdade, defina um identificador próprio (ex.: `com.seudominio.carrinho`) em `app.json`.

## 🔒 Privacidade

O Carrinho pede **só uma permissão: Câmera**, solicitada apenas no momento em que o usuário toca para fotografar uma etiqueta — nunca na abertura do app. Nenhuma outra permissão é usada: sem localização, contatos, microfone ou armazenamento externo (as fotos ficam só no diretório privado do app, nunca na galeria pública).

O app não faz **nenhuma chamada de rede**: todo o reconhecimento de texto roda on-device via ML Kit, e todos os dados (carrinho, histórico, fotos) ficam só no aparelho, em SQLite e no armazenamento privado do app. Ver a tela "Privacidade" dentro do app para a explicação em linguagem simples.

## 🗂️ Estrutura do projeto

```
app/             — rotas do expo-router
src/
  features/
    cart/        — lista atual, itens, orçamento
    scanner/     — câmera, OCR, tela de confirmação
    history/     — histórico, resumo de gastos, exportação
  lib/           — funções puras (money, ocr-parser, format, theme, haptics...)
  db/            — schema, migrations, queries (SQLite)
docs/
  spec.md        — requisitos funcionais
  plan.md        — arquitetura, modelo de dados, ADRs
  tasks.md       — checklist de implementação
  backlog.md     — ideias fora do escopo atual
```

Convenções completas de código, stack e processo de trabalho estão em [CLAUDE.md](CLAUDE.md).
