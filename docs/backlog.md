# Backlog — Carrinho

Ideias fora do escopo da tarefa atual, registradas aqui em vez de entrarem no código sem pedido.

- **Swipe-to-delete de verdade nos itens do carrinho.** A T-22 (RF-31) implementou a exclusão só pelo botão de lixeira, sem o gesto de arrastar, para não precisar adicionar `react-native-gesture-handler` sem aprovação (decisão do usuário em 2026-09-07). Se quiser o gesto de swipe depois, é a dependência mais direta para isso (ou dá pra tentar com `PanResponder` puro do React Native, mais trabalhoso e menos polido).
