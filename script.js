// State
let myUsername = '';
let currentMode = null;
let myScore = 0;
let opponentScore = 0;

// PeerJS State
let peer = null;
let conn = null; // Connection to opponent
let isHost = false;
let myMove = null;
let opponentMove = null;

// DOM Elements
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
    resultOverlay: document.getElementById('result-overlay'),
    resultMessage: document.getElementById('result-message')
};

// Check for room in URL (Peer ID of host)
const urlParams = new URLSearchParams(window.location.search);
const invitePeerId = urlParams.get('room');

if (invitePeerId) {
    // If invited, adjust UI to focus on joining
    const pvcBtn = document.querySelector('button[onclick="joinGame(\'pvc\')"]');
    const pvpBtn = document.querySelector('button[onclick="joinGame(\'pvp\')"]');

    if (pvcBtn) pvcBtn.style.display = 'none';
    if (pvpBtn) {
        pvpBtn.textContent = 'Entrar no Jogo';
        pvpBtn.classList.add('btn-primary'); // Make it pop more
        pvpBtn.classList.remove('btn-secondary');
    }
}

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function joinGame(mode) {
    const username = dom.usernameInput.value.trim() || 'Jogador';
    myUsername = username;
    currentMode = mode;

    if (mode === 'pvc') {
        startGamePvC();
    } else {
        // PvP Mode via PeerJS
        initializePeer();
    }
}

function initializePeer() {
    showScreen('waiting');
    dom.gameStatus.textContent = 'Inicializando conexão...';

    // Create Peer
    peer = new Peer(); // Auto-generate ID

    peer.on('open', (id) => {
        console.log('My Peer ID:', id);

        if (invitePeerId) {
            // We are JOINING a game
            isHost = false;
            connectToHost(invitePeerId);
        } else {
            // We are HOSTING a game
            isHost = true;
            setupHostUI(id);
        }
    });

    peer.on('connection', (c) => {
        // Incoming connection (only expected if Host)
        if (conn && conn.open) {
            c.close(); // Already connected
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
    dom.roomIdDisplay.textContent = `ID da Sala: ${id}`;

    const protocol = window.location.protocol;
    const host = window.location.host;
    const pathname = window.location.pathname; // Important for github pages usually /repo/
    const shareUrl = `${protocol}//${host}${pathname}?room=${id}`;

    dom.shareLinkInput.value = shareUrl;
    dom.gameStatus.textContent = 'Aguardando oponente conectar...';
}

function connectToHost(hostId) {
    dom.roomIdDisplay.textContent = 'Conectando ao host...';
    conn = peer.connect(hostId, {
        metadata: { username: myUsername }
    });
    setupConnectionHandlers();
}

function setupConnectionHandlers() {
    conn.on('open', () => {
        console.log('Connected!');
        // Send my username
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
            // Opponent sent their name
            dom.p2Name.textContent = data.username;
            if (isHost && conn) {
                // Determine who is p1/p2 visually is local, but let's sync
                // Send back my name just in case
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
            // Host sent result (for Joiner) or Sync
            // Actually simpler: Host calculates, sends result. Joiner trusts Host.
            // Or both calculate. Let's have Host calculate to allow P2P authoritative simple logic.
            if (!isHost) {
                handleResult(data);
            }
            break;
    }
}

function startGamePvC() {
    dom.p1Name.textContent = myUsername;
    dom.p2Name.textContent = 'Computador';
    showScreen('game');
    dom.gameStatus.textContent = 'Escolha sua jogada!';
}

function startGamePvP() {
    dom.p1Name.textContent = myUsername; // Me (always left)
    // p2Name already set
    showScreen('game');
    dom.gameStatus.textContent = 'Batalha iniciada!';
}

function makeMove(move) {
    if (currentMode === 'pvc') {
        const computerMove = ['Pedra', 'Papel', 'Tesoura'][Math.floor(Math.random() * 3)];
        const result = getWinner(move, computerMove);
        showResult(move, computerMove, result);
    } else {
        // PvP
        if (!conn) return;
        myMove = move;
        dom.gameStatus.textContent = `Você escolheu ${move}. Aguardando oponente...`;

        // Send move to opponent
        conn.send({ type: 'move', move: move });

        checkRoundComplete();
    }
}

function checkRoundComplete() {
    if (myMove && opponentMove) {
        // Both have moved
        // Logic can be done locally by both if honest, or Host can authorize.
        // Let's do local consistency for simplicity (Trust model).
        const result = getWinner(myMove, opponentMove);
        showResult(myMove, opponentMove, result);

        // PeerJS generic handling - if Host, maybe send official result?
        // Not strictly necessary if deterministic.

        // Reset moves
        myMove = null;
        opponentMove = null;
    }
}

function showResult(myM, opM, result) {
    let message = '';
    let color = '';

    if (result === 'Vitória') {
        message = 'VOCÊ VENCEU! 🎉';
        color = 'var(--success)';
        myScore++;
        if (typeof Wowify !== 'undefined') {
            Wowify.startParty({
                confettiDuration: 3000,
                colors: ['#bb00ff', '#00ffff', '#ffffff']
            });
        }
    } else if (result === 'Derrota') {
        message = 'VOCÊ PERDEU 💀';
        color = 'var(--danger)';
        opponentScore++;
    } else {
        message = 'EMPATE 🤝';
        color = 'var(--secondary)';
    }

    const myEmoji = getEmoji(myM);
    const opEmoji = getEmoji(opM);

    // Update Score UI
    dom.p1Score.textContent = myScore;
    dom.p2Score.textContent = opponentScore;

    // Update overlay
    dom.resultMessage.textContent = message;
    dom.resultMessage.style.color = color;

    const existingDetails = dom.resultOverlay.querySelector('.result-details');
    if (existingDetails) existingDetails.remove();

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'result-details';
    detailsDiv.style.fontSize = '1.5rem';
    detailsDiv.style.marginTop = '10px';
    detailsDiv.style.marginBottom = '20px';
    detailsDiv.innerHTML = `Você <span style="font-size: 2rem">${myEmoji}</span> VS <span style="font-size: 2rem">${opEmoji}</span> Oponente`;

    dom.resultMessage.after(detailsDiv);

    setTimeout(() => {
        dom.resultOverlay.classList.remove('hidden');
    }, 500);
}

function resetRound() {
    dom.resultOverlay.classList.add('hidden');
    dom.gameStatus.textContent = 'Escolha sua jogada!';
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

    // Reset Scores
    myScore = 0;
    opponentScore = 0;
    dom.p1Score.textContent = '0';
    dom.p2Score.textContent = '0';

    dom.resultOverlay.classList.add('hidden');
    dom.gameStatus.textContent = 'Escolha sua jogada!';
    showScreen('login');
}

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

function getEmoji(move) {
    switch (move) {
        case 'Pedra': return '✊';
        case 'Papel': return '✋';
        case 'Tesoura': return '✌️';
        default: return move;
    }
}

function copyLink() {
    const copyText = dom.shareLinkInput;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);

    const originalText = document.querySelector('.share-container button').textContent;
    document.querySelector('.share-container button').textContent = 'Copiado!';
    setTimeout(() => {
        document.querySelector('.share-container button').textContent = originalText;
    }, 2000);
}
