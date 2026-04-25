# 🎓 Aula de Programação: Criando um Arcade Modular Neon

Olá, aluno! Bem-vindo à nossa aula prática. Hoje vamos desvendar como construímos este Arcade utilizando **HTML5, CSS3 e JavaScript**. O objetivo não é apenas criar jogos, mas entender os conceitos de **arquitetura limpa, modularidade e lógica de games**.

---

## 👨‍🏫 Módulo 1: A Arquitetura (O Pensamento Modular)

Em projetos pequenos, costumamos colocar tudo em um único arquivo. Mas e se quisermos ter 10, 20 jogos?
Para isso, usamos a **Modularidade**.

### O Conceito de "Namespace"
No nosso projeto, cada jogo é um objeto JavaScript (ex: `SnakeGame`, `InvadersGame`).
- **Por que?** Isso evita que uma variável chamada `score` no jogo da cobrinha interfira na variável `score` do Space Invaders. Cada jogo tem seu próprio "espaço de nomes".

---

## 🎨 Módulo 2: O Visual (CSS & Canvas)

### O Palco (Canvas)
O elemento `<canvas>` no HTML é como uma lousa em branco. O JavaScript é o nosso giz.
- **Dica de Ouro:** Usamos `ctx.shadowBlur` e `ctx.shadowColor` para criar o efeito Neon. Isso simula o brilho de luzes reais no escuro.

### 3. Neon Run (Estilo Mario)
O novo desafio de plataforma!
- **Gravidade**: O jogador está constantemente sendo puxado para baixo (`velocityY += gravity`).
- **Colisão de Tiles**: O jogo verifica se os pés do jogador estão tocando uma plataforma para permitir o pulo (`grounded`).
- **Câmera Móvel**: O mundo é maior que a tela. Usamos `ctx.translate(-cameraX, 0)` para criar o efeito de rolagem (scrolling) conforme o jogador avança.

## 🛠️ Como Adicionar Novos Jogos
A arquitetura modular permite que você crie um novo arquivo `.js`, defina um objeto com as funções `init`, `start`, `stop`, `update` e `draw`, e o registre no `main.js`. 
    na tela do jogador, calculando o tamanho do Canvas dinamicamente.

---

## ⚙️ Módulo 3: O Coração do Jogo (Game Loop)

Um jogo não é estático; ele é um loop infinito que acontece muitas vezes por segundo.

### O "Batimento Cardíaco"
Usamos `requestAnimationFrame`. Ele é melhor que o `setInterval` porque sincroniza o desenho com a taxa de atualização do seu monitor.

```javascript
const interval = 1000 / 60; // 60 vezes por segundo
if (elapsed > interval) {
    update(); // 1. Calcula o que aconteceu (lógica)
}
draw(); // 2. Mostra o resultado (desenho)
```

---

## 🐍 Módulo 4: Estudo de Caso - Snake

Aqui aprendemos sobre **Arrays (Listas)**.
- A cobra é um array de coordenadas: `[{x:10, y:10}, {x:10, y:11}]`.
- **Movimento:** Para a cobra "andar", nós adicionamos uma nova cabeça na direção desejada (`unshift`) e removemos a ponta da cauda (`pop`).
- **Crescimento:** Se ela come a fruta, nós apenas *não* removemos a cauda naquele turno. Pronto, ela cresceu!

---
61: 
## 👾 Módulo 5: Estudo de Caso - Space Invaders

Aqui aprendemos sobre **Gerenciamento de Entidades**.
- Temos listas de inimigos, balas do jogador e balas dos inimigos.
- **Física Simples (Colisão AABB):** Verificamos se o retângulo de uma bala está "dentro" do retângulo de um inimigo.
- **Controle de FPS:** Como você notou na aula, se o loop rodar rápido demais, o jogo fica impossível. Por isso, travamos o processamento em 60 FPS para garantir que a experiência seja a mesma em qualquer computador.

---

## ♔ Módulo 6: Estudo de Caso - Chess (Xadrez)

Aqui aprendemos sobre **Lógica de Estados e Validação de Regras**.
- **Matriz 8x8**: O tabuleiro é representado por uma grade bidimensional onde cada célula pode conter uma peça ou ser nula.
- **Validação de Movimentos**: Cada tipo de peça tem seu próprio conjunto de direções e alcances. Usamos vetores de direção para calcular onde uma Rainha ou Bispo pode chegar até encontrar um obstáculo.
- **Interface por Cursor**: Como o arcade é focado em teclado, implementamos um sistema de cursor que navega pelas casas, facilitando a interação sem depender de mouse.

---

---

## 🧠 Módulo 6: O Maestro (main.js)

O `main.js` atua como um roteador.
1. Ele escuta os cliques no menu.
2. Esconde o menu e mostra o container do jogo.
3. Define qual objeto de jogo está ativo (`activeGame`).
4. Repassa os comandos do teclado para o jogo que você está jogando no momento.

---

## ☄️ Módulo 7: Estudo de Caso - Asteroids

Aqui aprendemos sobre **Física Vetorial e Matemática de Transformação**.
- **Vetores e Inércia**: A nave não para instantaneamente. Usamos vetores de empuxo (thrust) que se somam à velocidade atual, criando uma sensação de gravidade zero.
- **Trigonometria (Seno e Cosseno)**: Essencial para calcular a ponta da nave, a direção dos tiros e o movimento em 360 graus.
- **Divisão de Objetos**: Quando um asteróide grande é atingido, ele gera dois menores. Isso ensina como gerenciar dinamicamente listas de objetos em tempo de execução.

---

## 📝 Exercício para Você
Tente olhar o arquivo `snake.js` e mudar a variável `speed` inicial. O que acontece com a jogabilidade? Entender como os números afetam a diversão é o primeiro passo para ser um **Game Designer**.

**Dúvidas?** Explore os arquivos `.js` comentados e veja a mágica acontecer linha por linha!
