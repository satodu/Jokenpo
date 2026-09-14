/**
 * ==========================================================================
 * JOKENPO. — GSAP ANIMATIONS & GAME ENGINE
 * Design System: Oriental Brutalismo Minimalista (Purple Accent)
 * 
 * Este arquivo foi estruturado para servir como CATÁLOGO DE ANIMAÇÕES DE UI.
 * Cada método dentro de `UIAnimations` é desacoplado, modular e comentado
 * para fácil consulta e reutilização em outros projetos.
 * ==========================================================================
 */

// ==========================================================================
// 1. ESTADO GLOBAL DO JOGO & PEERJS
// ==========================================================================
let myUsername = '';
let currentMode = null;
let myScore = 0;
let opponentScore = 0;

let peer = null;
let conn = null; // Conexão WebRTC P2P
let isHost = false;
let myMove = null;
let opponentMove = null;
let isAnimatingRound = false;

// ==========================================================================
// 2. ELEMENTOS DO DOM
// ==========================================================================
const screens = {
    login: document.getElementById('login-screen'),
    waiting: document.getElementById('waiting-screen'),
    game: document.getElementById('game-screen')
};

const dom = {
    usernameInput: document.getElementById('username'),
    roomIdDisplay: document.getElementById('room-id-display'),
    shareLinkInput: document.getElementById('share-link'),
    p1Name: document.getElementById('p1-name'),
    p2Name: document.getElementById('p2-name'),
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    gameStatus: document.getElementById('game-status'),
    arenaStage: document.getElementById('arena-stage'),
    arenaContent: document.getElementById('arena-content'),
    arenaDuel: document.getElementById('arena-duel'),
    duelFighterLeft: document.getElementById('duel-fighter-left'),
    duelFighterRight: document.getElementById('duel-fighter-right'),
    duelImgLeft: document.getElementById('duel-img-left'),
    duelImgRight: document.getElementById('duel-img-right'),
    duelLabelLeft: document.getElementById('duel-label-left'),
    duelLabelRight: document.getElementById('duel-label-right'),
    duelSpark: document.getElementById('duel-spark'),
    resultOverlay: document.getElementById('result-overlay'),
    resultMessage: document.getElementById('result-message'),
    resultStamp: document.getElementById('result-stamp')
};

// ==========================================================================
// 3. CATÁLOGO DE ANIMAÇÕES DE UI (GSAP 3)
// ==========================================================================
const UIAnimations = {
    /**
     * [Catálogo #01: Transição Staggered de Telas]
     * Suaviza a troca de telas com saída acelerada e entrada em cascata (stagger)
     * dos blocos internos (bento-card, títulos, botões e campos).
     */
    screenTransition(outgoingKey, incomingKey, onComplete) {
        const outgoingEl = screens[outgoingKey];
        const incomingEl = screens[incomingKey];

        if (!window.gsap) {
            if (outgoingEl) outgoingEl.classList.remove('active');
            if (incomingEl) incomingEl.classList.add('active');
            if (onComplete) onComplete();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });

        // 1. Saída da tela atual
        if (outgoingEl && outgoingEl.classList.contains('active')) {
            tl.to(outgoingEl, {
                opacity: 0,
                y: -10,
                scale: 0.98,
                duration: 0.18,
                ease: 'power2.in',
                onComplete: () => {
                    outgoingEl.classList.remove('active');
                    gsap.set(outgoingEl, { clearProps: 'all' });
                }
            });
        }

        // 2. Entrada da nova tela
        tl.call(() => {
            incomingEl.classList.add('active');
        });

        const childTargets = incomingEl.querySelectorAll('.bento-card, .brand-crest, .title-display, .title-sub, .input-wrapper, .mode-selection, .game-scoreboard, .arena, .controls, .waiting-box');

        tl.fromTo(incomingEl, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.15, ease: 'none' }
        );

        if (childTargets.length > 0) {
            tl.fromTo(childTargets,
                { opacity: 0, y: 22, scale: 0.96 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.42,
                    stagger: 0.05,
                    ease: 'power3.out',
                    clearProps: 'transform,opacity'
                },
                '-=0.1'
            );
        }
    },

    /**
     * [Catálogo #02: Impacto Tátil do Selo Hanko]
     * Simula a gravidade de um carimbo oriental tradicional de madeira batendo no papel:
     * Surge em escala ampliada com leve rotação angular e despenca com overshoot elástico.
     */
    hankoStampSlam(overlayEl, stampEl) {
        if (!window.gsap) {
            overlayEl.classList.remove('hidden');
            return;
        }

        overlayEl.classList.remove('hidden');
        const modalContent = overlayEl.querySelector('.result-content');

        const tl = gsap.timeline();

        // Fade no backdrop escuro
        tl.fromTo(overlayEl,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: 'power2.out' }
        );

        // Modal escala suave
        tl.fromTo(modalContent,
            { scale: 0.9, opacity: 0, y: 15 },
            { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' },
            '-=0.1'
        );

        // Selo despenca com impacto
        tl.fromTo(stampEl,
            { scale: 3.5, rotation: -16, opacity: 0 },
            { 
                scale: 1, 
                rotation: 0, 
                opacity: 1, 
                duration: 0.45, 
                ease: 'back.out(2.4)' 
            },
            '-=0.15'
        );

        // Leve tremor no card do modal simulando o golpe físico
        tl.to(modalContent, {
            y: 4,
            duration: 0.06,
            yoyo: true,
            repeat: 3,
            ease: 'none'
        }, '-=0.1');

        // Detalhes do duelo entram em cascata
        const details = overlayEl.querySelectorAll('#result-message, .result-details, button');
        tl.fromTo(details,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.25, stagger: 0.06, ease: 'power2.out' },
            '-=0.1'
        );
    },

    /**
     * [Catálogo #03: Duelo & Choque de Mãos na Arena]
     * Dá vida ao confronto: As duas mãos ilustradas são arremessadas ao centro,
     * colidem com uma centelha (spark kanji) e geram tremor de impacto antes do modal.
     */
    clashBattle({ myMove, opponentMove, myName, opName, onComplete }) {
        if (!window.gsap) {
            if (onComplete) onComplete();
            return;
        }

        const duel = dom.arenaDuel;
        const leftFighter = dom.duelFighterLeft;
        const rightFighter = dom.duelFighterRight;
        const spark = dom.duelSpark;

        // Configurar imagens e rótulos
        dom.duelImgLeft.src = getHandImage(myMove);
        dom.duelImgRight.src = getHandImage(opponentMove);
        dom.duelLabelLeft.textContent = myName ? myName.toUpperCase() : 'VOCÊ';
        dom.duelLabelRight.textContent = opName ? opName.toUpperCase() : 'RIVAL';

        // Esconder texto de status temporariamente e exibir palco de duelo
        gsap.to(dom.arenaContent, { opacity: 0, duration: 0.15 });
        duel.classList.remove('hidden');
        gsap.set(duel, { opacity: 1 });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to(duel, {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        duel.classList.add('hidden');
                        gsap.set(dom.arenaContent, { opacity: 1 });
                        if (onComplete) onComplete();
                    }
                });
            }
        });

        // 1. Entrada veloz das mãos dos combatentes
        tl.fromTo(leftFighter,
            { x: -140, opacity: 0, scale: 0.7 },
            { x: -15, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
        );

        tl.fromTo(rightFighter,
            { x: 140, opacity: 0, scale: 0.7 },
            { x: 15, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' },
            '<'
        );

        // 2. Antecipação (pequeno recuo tático)
        tl.to(leftFighter, { x: -35, duration: 0.12, ease: 'power1.in' }, '+=0.06');
        tl.to(rightFighter, { x: 35, duration: 0.12, ease: 'power1.in' }, '<');

        // 3. Colisão violenta ao centro
        tl.to(leftFighter, { x: 18, duration: 0.1, ease: 'power4.in' });
        tl.to(rightFighter, { x: -18, duration: 0.1, ease: 'power4.in' }, '<');

        // 4. Centelha / Flash de impacto roxo
        tl.fromTo(spark,
            { scale: 0, opacity: 0, rotation: -45 },
            { scale: 1.5, opacity: 1, rotation: 0, duration: 0.15, ease: 'back.out(3)' },
            '<0.05'
        );

        // 5. Screen shake na arena
        tl.to(dom.arenaStage, {
            x: 6,
            y: -4,
            duration: 0.04,
            yoyo: true,
            repeat: 4,
            ease: 'none'
        }, '<');

        // Recuo pós-impacto
        tl.to(leftFighter, { x: -10, duration: 0.18, ease: 'power2.out' });
        tl.to(rightFighter, { x: 10, duration: 0.18, ease: 'power2.out' }, '<');
        tl.to(spark, { scale: 0.8, opacity: 0, duration: 0.2 }, '<');

        // Pausa dramática para o jogador absorver o confronto
        tl.to({}, { duration: 0.35 });
    },

    /**
     * [Catálogo #04: Contador Numérico Rolante & Pulso de Score]
     * Anima a evolução da pontuação com elasticidade e destaque luminoso em roxo.
     */
    scoreRoll(element, newScore) {
        if (!window.gsap) {
            element.textContent = newScore;
            return;
        }

        gsap.timeline()
            .to(element, {
                scale: 1.4,
                color: '#ffffff',
                textShadow: '0 0 15px var(--accent)',
                duration: 0.15,
                ease: 'power2.out'
            })
            .call(() => {
                element.textContent = newScore;
            })
            .to(element, {
                scale: 1,
                color: 'var(--accent)',
                textShadow: 'none',
                duration: 0.4,
                ease: 'elastic.out(1.2, 0.4)'
            });
    },

    /**
     * [Catálogo #05: Feedback Tátil de Clique em Botões]
     * Comprime o elemento de forma responsiva e o projeta de volta com elasticidade.
     */
    buttonPress(btnElement) {
        if (!window.gsap || !btnElement) return;

        gsap.timeline()
            .to(btnElement, { scale: 0.92, duration: 0.08, ease: 'power2.in' })
            .to(btnElement, { scale: 1, duration: 0.22, ease: 'back.out(2)' });
    },

    /**
     * [Catálogo #06: Atmosfera Zen & Respiração de Luz]
     * Cria vida de fundo contínua sem pesar o processador: respiração suave
     * na luz ambiente violeta e pulso ritmado nas cruzes técnicas.
     */
    initAtmosphere() {
        if (!window.gsap) return;

        const glow = document.querySelector('.ambient-glow');
        if (glow) {
            gsap.to(glow, {
                scale: 1.15,
                opacity: 0.85,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }

        const crosses = document.querySelectorAll('.tech-crosses');
        if (crosses.length > 0) {
            gsap.to(crosses, {
                opacity: 0.55,
                duration: 2.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }

        // Respiração suave nos decalques ortogonais integrados ao background
        const decals = document.querySelectorAll('.corner-decal');
        if (decals.length > 0) {
            gsap.to(decals, {
                opacity: 0.45,
                duration: 4.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.5
            });
        }
    },

    /**
     * [Catálogo #07: Feedback Cinemático de Cópia com Selo Hanko '済']
     * 1. O botão comprime e projeta em escala com borda e glow roxos.
     * 2. O texto transiciona com o selo Hanko '済' (Sumi/Concluído).
     * 3. O input realiza um flash de escaneamento luminoso e pulso de escala.
     * 4. Uma badge flutuante '[ 済 // LINK COPIADO ]' emerge acima do input em arco e se dissolve.
     * 5. Restauração suave e temporizada de volta ao estado original.
     */
    copySuccess(btnElement, inputElement, containerElement) {
        if (!btnElement) return;

        const originalText = btnElement.textContent;
        btnElement.classList.add('copied');
        btnElement.innerHTML = '<span class="hanko-seal" style="padding: 0 0.25rem; font-size: 0.65rem; border-color: #ffffff; color: #ffffff;">済</span> COPIADO!';

        if (window.gsap) {
            // 1. Efeito do botão com impacto de mola
            gsap.timeline()
                .to(btnElement, { scale: 0.88, duration: 0.08, ease: 'power2.in' })
                .to(btnElement, {
                    scale: 1.08,
                    boxShadow: '0 0 25px var(--accent)',
                    duration: 0.18,
                    ease: 'back.out(2.5)'
                })
                .to(btnElement, { scale: 1, duration: 0.2, ease: 'power2.out' });

            // 2. Flash de escaneamento luminoso no input
            if (inputElement) {
                gsap.timeline()
                    .to(inputElement, {
                        borderColor: 'var(--accent)',
                        boxShadow: '0 0 20px var(--accent-glow)',
                        scale: 1.015,
                        duration: 0.15,
                        ease: 'power2.out'
                    })
                    .to(inputElement, { scale: 1, duration: 0.2, ease: 'power2.out' })
                    .to(inputElement, {
                        borderColor: 'var(--surface-card-border)',
                        boxShadow: 'none',
                        duration: 0.6,
                        delay: 1.2
                    });
            }

            // 3. Badge flutuante oriental Hanko
            if (containerElement) {
                const existingBadge = containerElement.querySelector('.copy-badge');
                if (existingBadge) existingBadge.remove();

                const badge = document.createElement('div');
                badge.className = 'copy-badge';
                badge.innerHTML = '<span class="hanko-seal" style="padding: 0 0.25rem; font-size: 0.65rem;">済</span> LINK COPIADO // 共有';
                containerElement.appendChild(badge);

                gsap.timeline({
                    onComplete: () => badge.remove()
                })
                .fromTo(badge,
                    { opacity: 0, y: 10, scale: 0.75 },
                    { opacity: 1, y: -6, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }
                )
                .to(badge, {
                    opacity: 0,
                    y: -18,
                    duration: 0.3,
                    ease: 'power2.in',
                    delay: 1.5
                });
            }
        }

        // Restauração temporizada
        setTimeout(() => {
            if (btnElement) {
                if (window.gsap) {
                    gsap.to(btnElement, {
                        scale: 0.95,
                        duration: 0.1,
                        onComplete: () => {
                            btnElement.textContent = originalText;
                            btnElement.classList.remove('copied');
                            gsap.to(btnElement, { scale: 1, duration: 0.2, clearProps: 'all' });
                        }
                    });
                } else {
                    btnElement.textContent = originalText;
                    btnElement.classList.remove('copied');
                }
            }
        }, 2200);
    }
};

// ==========================================================================
// 4. INICIALIZAÇÃO & VERIFICAÇÃO DE URL (CONVITE P2P)
// ==========================================================================
const urlParams = new URLSearchParams(window.location.search);
const invitePeerId = urlParams.get('room');

if (invitePeerId) {
    const pvcBtn = document.getElementById('btn-pvc');
    const pvpBtn = document.getElementById('btn-pvp');

    if (pvcBtn) pvcBtn.style.display = 'none';
    if (pvpBtn) {
        pvpBtn.textContent = 'ENTRAR NO COMBATE';
        pvpBtn.classList.add('btn-primary');
        pvpBtn.classList.remove('btn-secondary');
    }
}

// Inicia animações de atmosfera de fundo
document.addEventListener('DOMContentLoaded', () => {
    UIAnimations.initAtmosphere();
});

// ==========================================================================
// 5. NAVEGAÇÃO DE TELAS & GERENCIAMENTO DE MODOS
// ==========================================================================
let currentScreenKey = 'login';

function showScreen(screenKey) {
    if (currentScreenKey === screenKey) return;
    const oldKey = currentScreenKey;
    currentScreenKey = screenKey;
    UIAnimations.screenTransition(oldKey, screenKey);
}

function joinGame(mode) {
    const activeBtn = mode === 'pvc' ? document.getElementById('btn-pvc') : document.getElementById('btn-pvp');
    UIAnimations.buttonPress(activeBtn);

    const username = dom.usernameInput.value.trim() || 'JOGADOR';
    myUsername = username;
    currentMode = mode;

    if (mode === 'pvc') {
        startGamePvC();
    } else {
        initializePeer();
    }
}

// ==========================================================================
// 6. REDE P2P WEBRTC (PEERJS)
// ==========================================================================
function initializePeer() {
    showScreen('waiting');
    dom.roomIdDisplay.textContent = 'INICIALIZANDO CONEXÃO...';

    peer = new Peer();

    peer.on('open', (id) => {
        console.log('My Peer ID:', id);

        if (invitePeerId) {
            isHost = false;
            connectToHost(invitePeerId);
        } else {
            isHost = true;
            setupHostUI(id);
        }
    });

    peer.on('connection', (c) => {
        if (conn && conn.open) {
            c.close();
            return;
        }
        conn = c;
        setupConnectionHandlers();
    });

    peer.on('error', (err) => {
        console.error(err);
        alert('Erro na conexão P2P: ' + err.type);
        leaveGame();
    });
}

function setupHostUI(id) {
    dom.roomIdDisplay.textContent = `SALA // ID: ${id}`;

    const protocol = window.location.protocol;
    const host = window.location.host;
    const pathname = window.location.pathname;
    const shareUrl = `${protocol}//${host}${pathname}?room=${id}`;

    dom.shareLinkInput.value = shareUrl;
    dom.gameStatus.textContent = 'Aguardando conexão do rival...';
}

function connectToHost(hostId) {
    dom.roomIdDisplay.textContent = 'CONECTANDO AO HOST...';
    conn = peer.connect(hostId, {
        metadata: { username: myUsername }
    });
    setupConnectionHandlers();
}

function setupConnectionHandlers() {
    conn.on('open', () => {
        console.log('Connected to peer!');
        conn.send({ type: 'hello', username: myUsername });
    });

    conn.on('data', (data) => {
        handleData(data);
    });

    conn.on('close', () => {
        alert('Oponente desconectou!');
        leaveGame();
    });
}

function handleData(data) {
    switch (data.type) {
        case 'hello':
            dom.p2Name.textContent = data.username;
            if (isHost && conn) {
                conn.send({ type: 'hello_ack', username: myUsername });
                startGamePvP();
            }
            break;

        case 'hello_ack':
            dom.p2Name.textContent = data.username;
            startGamePvP();
            break;

        case 'move':
            opponentMove = data.move;
            checkRoundComplete();
            break;

        case 'result':
            if (!isHost) {
                handleResult(data);
            }
            break;
    }
}

function startGamePvC() {
    dom.p1Name.textContent = myUsername;
    dom.p2Name.textContent = 'BOT.AI';
    showScreen('game');
    dom.gameStatus.textContent = 'Escolha sua jogada para iniciar o combate.';
}

function startGamePvP() {
    dom.p1Name.textContent = myUsername;
    showScreen('game');
    dom.gameStatus.textContent = 'Batalha iniciada! Faça seu movimento.';
}

// ==========================================================================
// 7. MECÂNICA DE BATALHA COM ANIMAÇÃO GSAP
// ==========================================================================
function makeMove(move) {
    if (isAnimatingRound) return;

    const moveBtn = document.querySelector(`.move-btn[data-move="${move}"]`);
    UIAnimations.buttonPress(moveBtn);

    if (currentMode === 'pvc') {
        isAnimatingRound = true;
        const computerMove = ['Pedra', 'Papel', 'Tesoura'][Math.floor(Math.random() * 3)];
        const result = getWinner(move, computerMove);

        dom.gameStatus.textContent = 'Confronto em andamento...';

        UIAnimations.clashBattle({
            myMove: move,
            opponentMove: computerMove,
            myName: myUsername,
            opName: 'BOT.AI',
            onComplete: () => {
                showResult(move, computerMove, result);
                isAnimatingRound = false;
            }
        });
    } else {
        if (!conn) return;
        myMove = move;
        dom.gameStatus.textContent = `Golpe selecionado: ${move.toUpperCase()}. Aguardando oponente...`;

        conn.send({ type: 'move', move: move });
        checkRoundComplete();
    }
}

function checkRoundComplete() {
    if (myMove && opponentMove && !isAnimatingRound) {
        isAnimatingRound = true;
        const result = getWinner(myMove, opponentMove);
        const opName = dom.p2Name.textContent || 'RIVAL';

        dom.gameStatus.textContent = 'Ambos os golpes desferidos! Confronto!';

        UIAnimations.clashBattle({
            myMove: myMove,
            opponentMove: opponentMove,
            myName: myUsername,
            opName: opName,
            onComplete: () => {
                showResult(myMove, opponentMove, result);
                myMove = null;
                opponentMove = null;
                isAnimatingRound = false;
            }
        });
    }
}

// ==========================================================================
// 8. RESULTADO, PONTUAÇÃO & CARIMBO HANKO
// ==========================================================================
function showResult(myM, opM, result) {
    let message = '';
    let stamp = '勝';
    let stampBorder = 'var(--accent)';
    let resultColor = 'var(--text-primary)';

    if (result === 'Vitória') {
        message = 'VITÓRIA.';
        stamp = '勝';
        stampBorder = 'var(--accent)';
        resultColor = 'var(--accent)';
        myScore++;
        UIAnimations.scoreRoll(dom.p1Score, myScore);

        if (typeof Wowify !== 'undefined') {
            Wowify.startParty({
                confettiDuration: 2800,
                colors: ['#a855f7', '#c084fc', '#dedfd7', '#ffffff']
            });
        }
    } else if (result === 'Derrota') {
        message = 'DERROTA.';
        stamp = '敗';
        stampBorder = 'var(--danger)';
        resultColor = 'var(--danger)';
        opponentScore++;
        UIAnimations.scoreRoll(dom.p2Score, opponentScore);
    } else {
        message = 'EMPATE.';
        stamp = '分';
        stampBorder = 'var(--text-muted)';
        resultColor = 'var(--text-muted)';
    }

    if (dom.resultStamp) {
        dom.resultStamp.textContent = stamp;
        dom.resultStamp.style.color = stampBorder;
        dom.resultStamp.style.borderColor = stampBorder;
    }

    dom.resultMessage.textContent = message;
    dom.resultMessage.style.color = resultColor;

    const myImg = getHandImage(myM);
    const opImg = getHandImage(opM);

    const existingDetails = dom.resultOverlay.querySelector('.result-details');
    if (existingDetails) existingDetails.remove();

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'result-details';
    detailsDiv.style.width = '100%';
    detailsDiv.innerHTML = `
        <div class="result-clash">
            <div class="clash-side">
                <span class="clash-tag">VOCÊ</span>
                <img src="${myImg}" alt="${myM}" class="clash-thumb">
                <span class="clash-label">${myM.toUpperCase()}</span>
            </div>
            <span class="clash-vs">VS</span>
            <div class="clash-side">
                <span class="clash-tag">RIVAL</span>
                <img src="${opImg}" alt="${opM}" class="clash-thumb">
                <span class="clash-label">${opM.toUpperCase()}</span>
            </div>
        </div>
    `;

    dom.resultMessage.after(detailsDiv);
    UIAnimations.hankoStampSlam(dom.resultOverlay, dom.resultStamp);
}

function resetRound() {
    const btn = dom.resultOverlay.querySelector('button');
    UIAnimations.buttonPress(btn);

    if (window.gsap) {
        gsap.to(dom.resultOverlay, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                dom.resultOverlay.classList.add('hidden');
                gsap.set(dom.resultOverlay, { clearProps: 'all' });
                dom.gameStatus.textContent = 'Escolha sua jogada para a próxima rodada.';
            }
        });
    } else {
        dom.resultOverlay.classList.add('hidden');
        dom.gameStatus.textContent = 'Escolha sua jogada para a próxima rodada.';
    }
}

function leaveGame() {
    if (peer) {
        peer.destroy();
        peer = null;
    }
    if (conn) {
        conn.close();
        conn = null;
    }

    currentMode = null;
    isHost = false;
    myMove = null;
    opponentMove = null;
    isAnimatingRound = false;

    myScore = 0;
    opponentScore = 0;
    dom.p1Score.textContent = '0';
    dom.p2Score.textContent = '0';

    dom.resultOverlay.classList.add('hidden');
    dom.gameStatus.textContent = 'Escolha sua jogada para iniciar o combate.';
    showScreen('login');
}

// ==========================================================================
// 9. FUNÇÕES UTILITÁRIAS & COPIAR LINK COM ANIMAÇÃO GSAP
// ==========================================================================
function getWinner(p1, p2) {
    if (p1 === p2) return 'Empate';
    if (
        (p1 === 'Pedra' && p2 === 'Tesoura') ||
        (p1 === 'Papel' && p2 === 'Pedra') ||
        (p1 === 'Tesoura' && p2 === 'Papel')
    ) {
        return 'Vitória';
    }
    return 'Derrota';
}

function getHandImage(move) {
    switch (move) {
        case 'Pedra': return 'hand_rock.jpg';
        case 'Papel': return 'hand_paper.jpg';
        case 'Tesoura': return 'hand_scissors.jpg';
        default: return '';
    }
}

function copyLink() {
    const copyText = dom.shareLinkInput;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);

    const btn = document.querySelector('.share-input-group button');
    const container = document.querySelector('.share-container');

    // Dispara animação cinemática com selo Hanko e escaneamento do input
    UIAnimations.copySuccess(btn, copyText, container);
}
