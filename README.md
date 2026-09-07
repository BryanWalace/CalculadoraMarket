# Carrinho

Carrinho é um app Android que soma o valor de uma compra de mercado em tempo real, lendo etiquetas de preço pela câmera via OCR on-device. Custo zero, 100% offline, sem backend.

Ver [docs/spec.md](docs/spec.md) para os requisitos funcionais e [docs/plan.md](docs/plan.md) para a arquitetura.

## Como rodar em desenvolvimento

Pré-requisitos: Node.js, um dispositivo ou emulador Android (o app usa código nativo — ML Kit e câmera —, então **não roda no Expo Go**).

```bash
npm install
npx expo prebuild        # gera os projetos nativos android/ e ios/
npx expo run:android     # builda e instala o dev client no dispositivo/emulador
```

Depois da primeira instalação, para os dias seguintes basta:

```bash
npx expo start --dev-client
```

## Comandos úteis

| Comando                                  | Descrição                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run lint`                           | ESLint                                                                        |
| `npm test`                               | Suíte de testes (Jest)                                                        |
| `npx tsc --noEmit`                       | Checagem de tipos                                                             |
| `npx expo prebuild`                      | Gera os projetos nativos `android`/`ios`                                      |
| `npx expo run:android`                   | Build e instalação local no Android (gratuito, sem depender de cota de nuvem) |
| `eas build -p android --profile preview` | Alternativa via EAS Build, plano gratuito                                     |

## Gerar um build Android

**Opção 1 — build local (gratuito, recomendado para uso pessoal):**

```bash
npx expo prebuild
npx expo run:android --variant release
```

O APK gerado fica em `android/app/build/outputs/apk/release/`.

**Opção 2 — EAS Build (nuvem, plano gratuito):**

```bash
npx eas build -p android --profile preview
```

Antes de gerar um build para distribuir, troque o identificador de pacote `com.placeholder.appid` em `app.json` (`android.package`) por um nome de pacote próprio (ex.: `com.seudominio.carrinho`).

## Permissões usadas

O Carrinho pede **só uma permissão**: **Câmera**, solicitada apenas no momento em que o usuário toca para fotografar uma etiqueta (nunca na abertura do app). Nenhuma outra permissão é usada — sem localização, contatos, microfone ou armazenamento externo (as fotos das etiquetas ficam só no diretório privado do app, nunca na galeria pública).

O app não faz nenhuma chamada de rede: todo o reconhecimento de texto roda on-device via ML Kit, e todos os dados (carrinho, histórico, fotos) ficam só no aparelho, em SQLite e no armazenamento privado do app. Ver a tela "Privacidade" dentro do app para a explicação em linguagem simples.

## Estrutura do projeto

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
