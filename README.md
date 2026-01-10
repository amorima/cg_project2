# 🐑 Simulador de Rebanho de Ovelhas

![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)
![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=for-the-badge&logo=webgl)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-v3.18-FF6F00?style=for-the-badge&logo=tensorflow)
![ML5.js](https://img.shields.io/badge/ML5.js-v0.12-247BA0?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

Simulador interativo de rebanho de ovelhas desenvolvido no âmbito da unidade curricular de **Computação Gráfica** (Licenciatura em TSIW - ESMAD). O projeto combina renderização 3D, animação de objetos articulados e interação multimodal (visão computacional e áudio).

---

## 📋 Índice

- [🐑 Simulador de Rebanho de Ovelhas](#-simulador-de-rebanho-de-ovelhas)
  - [📋 Índice](#-índice)
  - [🎯 Sobre o Projeto](#-sobre-o-projeto)
    - [Cumprimento dos Requisitos Académicos](#cumprimento-dos-requisitos-académicos)
  - [✨ Funcionalidades e Requisitos](#-funcionalidades-e-requisitos)
  - [🎮 Controlos](#-controlos)
  - [🛠 Desafios e Soluções Técnicas](#-desafios-e-soluções-técnicas)
    - [1. Colisão com Terreno Complexo (Maior Desafio)](#1-colisão-com-terreno-complexo-maior-desafio)
    - [2. Reconhecimento de Áudio](#2-reconhecimento-de-áudio)
    - [3. Importação de Assets Antigos (GLTF/GLB)](#3-importação-de-assets-antigos-gltfglb)
    - [4. Robustez do Rastreamento Facial](#4-robustez-do-rastreamento-facial)
  - [📦 Recursos e Créditos](#-recursos-e-créditos)
  - [🤖 Utilização de Inteligência Artificial](#-utilização-de-inteligência-artificial)
  - [🚀 Instalação e Execução](#-instalação-e-execução)

---

## 🎯 Sobre o Projeto

O objetivo deste projeto foi criar uma cena 3D interativa onde o utilizador assume o papel de um cão pastor. O controlo do cão pastor é feito de forma inovadora através de **rastreamento facial** (movimento da cabeça) e **comandos de voz**, guiando um rebanho de ovelhas com comportamento autónomo.

### Cumprimento dos Requisitos Académicos

- **Objeto Articulado:** O Cão Pastor e as Ovelhas foram construídos exclusivamente com **geometrias primitivas** do Three.js (`BoxGeometry`, `IcosahedronGeometry`), cumprindo a hierarquia de, no mínimo, 3 partes articuladas (tronco, cabeça, pernas, cauda).
- **Animação:** Implementação de animações contínuas (ciclo de marcha/corrida em _loop_) e animações dependentes da interação do utilizador (reação ao susto/voz).
- **Integração Avançada:** Importação de modelos externos para o cenário (GLTF), texturas, iluminação com sombras dinâmicas e algoritmos de para o rebanho (_Flocking_).

---

## ✨ Funcionalidades e Requisitos

- **Interação Multimodal:** Controlo da personagem principal sem necessidade de rato ou teclado (Webcam + Microfone).
- **Algoritmo de Flocking:** As ovelhas seguem regras de Coesão, Separação e Alinhamento.
- **Terreno Importado:** Integração de um modelo GLB complexo ("The River") com sistema de colisão adaptado.
- **Performance:** Normalização do _loop_ de renderização utilizando `performance.now()` e cálculo de _delta time_, garantindo consistência da física e animação independentemente da taxa de atualização do dispositivo (Hz).
- **Modos de Câmara:**
  - **Cinemática:** Intro orbital automática.
  - **Padrão:** Controlo orbital.
  - **FPS:** Primeira pessoa.

---

## 🎮 Controlos

| Ação                 | Input               | Descrição                                                                           |
| :------------------- | :------------------ | :---------------------------------------------------------------------------------- |
| **Mover Cão**        | Movimento da Cabeça | O nariz do utilizador controla a posição alvo no terreno (mapeamento Facial -> 3D). |
| **Assustar Ovelhas** | Comando de Voz      | Dizer uma palavra de gatilho (treinada como "Fujam") dispersa o rebanho. |
| **Debug Visual**     | Tecla `9`           | Visualiza os raios de colisão e zonas de influência.                                |


---

## 🛠 Desafios e Soluções Técnicas

Durante o desenvolvimento, foram encontrados diversos obstáculos técnicos que exigiram investigação e adaptação da arquitetura inicial.

### 1. Colisão com Terreno Complexo (Maior Desafio)

A implementação de colisão num terreno importado (GLB) revelou-se mais complexa do que num plano gerado proceduralmente.

- **Problema:** O _Raycasting_ detetava a "bounding box" das copas das árvores como barreiras intransponíveis, fazendo com que as ovelhas ficassem presas no "ar" ou impedidas de passar por baixo da folhagem.
- **Solução:** Foi necessário filtrar os objetos intersetados pelo raycaster e implementar um sistema de **Fallback Anti-Stuck**. Se uma ovelha detetar que a sua posição não se alterou significativamente durante 1 segundo (enquanto tentava mover-se), as colisões são desativadas temporariamente por 2 segundos, permitindo-lhe atravessar o obstáculo e retomar o fluxo normal.

### 2. Reconhecimento de Áudio

Foram testadas três abordagens para o comando de voz, com resultados variados:

- **ML5.js SoundClassifier:** Demonstrou pouca precisão para este caso de uso específico.
- **Web Speech API (Nativo):** Embora funcione, introduzia uma latência inaceitável e dependia excessivamente da velocidade da internet.
- **Google Teachable Machine (Solução Final):** Treinei um modelo personalizado com a minha voz.
  - _Limitação:_ Como a palavra de gatilho é curta, o modelo ainda gera alguns falsos positivos. Foi implementado um _threshold_ de confiança elevado (>90%) para mitigar disparos acidentais.

### 3. Importação de Assets Antigos (GLTF/GLB)

O asset do terreno escolhido ("The River") era antigo e utilizava a extensão `KHR_materials_pbrSpecularGlossiness`.

- **Erro:** O Three.js moderno descontinuou o suporte nativo direto a esta extensão, resultando em erros de renderização (materiais pretos) ou falha no carregamento.
- **Solução:** Utilizei a ferramenta **gltf.report** para converter o ficheiro, transformando os materiais para o workflow _Metal/Roughness_ suportado pelo standard atual.

### 4. Robustez do Rastreamento Facial

Transpor a posição 2D do nariz (FaceMesh) para um ponto 3D no terreno (Raycasting) exigiu calibração.

- **Desafio:** Diferentes resoluções de ecrã e distâncias da câmara afetavam a jogabilidade.
- **Solução:** Implementação de normalização de coordenadas (NDC) robusta e suavização do movimento (Lerp) para evitar que o cão "tremesse" com micro-movimentos da cabeça do utilizador.

---

## 📦 Recursos e Créditos

Este projeto não seria possível sem a comunidade open-source e artistas 3D.

- **Inspiração da Ovelha (CodePen):** [Ellie Zen - Sheep](https://codepen.io/elliezen/pen/GWbBrx)
- **Modelo de Terreno:** ["The River" by Sketchfab](https://sketchfab.com/3d-models/the-river-2a8453f6f5834671ab82a3afc1d6bd26) (Adaptado)
- **Efeitos Sonoros:** [ElevenLabs - Sheep Sounds](https://elevenlabs.io/pt/sound-effects/sheep)
- **Investigação Técnica:** [Awesome Three.js Repo](https://github.com/AxiomeCG/awesome-threejs)

---

## 🤖 Utilização de Inteligência Artificial

De forma transparente e alinhada com as boas práticas académicas, informo que foram utilizadas ferramentas de IA Generativa (ChatGPT/Claude) nas seguintes vertentes:

1.  **Investigação e Análise:** Comparação de stacks tecnológicas (ex: alternativas ao ML5 para áudio).
2.  **Debugging:** Apoio na identificação de erros na lógica de matrizes e colisões.
3.  **Documentação:** Criação de esqueletos de documentação (CSS e Readme) e comentários de código.
4.  **Validação:** "Rubber ducking" para validar a lógica do sistema e matemática (ex. _flocking_).

---

## 🚀 Instalação e Execução

Devido às políticas de segurança dos browsers (CORS) e ao carregamento de modelos externos/Webcam, **este projeto necessita de um servidor local**.

1.  Clone o repositório.
2.  Na raiz do projeto, corra um servidor local.
    - Exemplo com Python: `python -m http.server`
    - Exemplo com Node: `npx http-server`
    - Exemplo VS Code: Extensão "Live Server"
3.  Aceda a `localhost:8000` (ou a porta indicada).

**Nota:** Permita o acesso à Webcam e Microfone quando solicitado pelo browser.

---

**Autor:** António Amorim | **P.Porto - Escola Superior de Media Artes e Design** | **Licenciatura em Tecnologias e Sistemas de Informação para a Web** | **Ano:** 2025/2026
