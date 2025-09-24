// --- Game state ---
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const winsEl = document.getElementById('wins');
const drawsEl = document.getElementById('draws');
const lossesEl = document.getElementById('losses');
const historyEl = document.getElementById('history');

const pickX = document.getElementById('pickX');
const pickO = document.getElementById('pickO');
const restartBtn = document.getElementById('restart');
const difficultySel = document.getElementById('difficulty');
const modeToggle = document.getElementById('modeToggle');
const playerXNameInput = document.getElementById('playerXName');
const playerONameInput = document.getElementById('playerOName');
const playerNamesDiv = document.getElementById('playerNames');

let cells = Array.from({length:9}, () => null);
let player = null; // 'X' or 'O'
let computer = null;
let turn = 'X';
let running = false;
let isPvP = false;
let playerXName = 'Player X';
let playerOName = 'Player O';

const stats = {wins:0, draws:0, losses:0};

// create cells
function buildBoard(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const btn = document.createElement('button');
    btn.className = 'board-cell aspect-square rounded-xl flex items-center justify-center text-4xl font-extrabold bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)]';
    btn.dataset.index = i;
    btn.addEventListener('click', onCellClick);
    boardEl.appendChild(btn);
  }
}

buildBoard();

function setStatus(text){ statusEl.textContent = text; }

function startGame(){
  cells = Array.from({length:9}, () => null);
  turn = 'X';
  running = !!player || isPvP;
  playerXName = playerXNameInput.value || 'Player X';
  playerOName = playerONameInput.value || 'Player O';
  updateBoardUI();
  if(isPvP) {
    setStatus(`${turn === 'X' ? playerXName : playerOName}'s turn`);
  } else if(!player) {
    setStatus('Choose X or O to start');
  } else {
    setStatus(turn === player ? "Your turn" : "Computer thinking...");
    if(running && turn === computer){
      window.requestAnimationFrame(() => computerMove());
    }
  }
}

function updateBoardUI(){
  const btns = boardEl.querySelectorAll('button');
  btns.forEach(b => {
    const i = +b.dataset.index;
    b.textContent = cells[i] || '';
    b.classList.toggle('opacity-40', !!cells[i]);
  });
}

// click handler when user taps a cell
function onCellClick(e){
  if(!running) return;
  const i = +e.currentTarget.dataset.index;
  if(cells[i]) return; // occupied
  if(isPvP) {
    makeMove(i, turn);
    return;
  }
  if(turn !== player) return; // not player's turn
  makeMove(i, player);
}

function makeMove(i, who){
  cells[i] = who;
  turn = who === 'X' ? 'O' : 'X';
  updateBoardUI();

  const winner = checkWinner(cells);
  if(winner){
    endGame(winner);
    return;
  }

  if(cells.every(Boolean)){
    endGame('draw');
    return;
  }

  if(isPvP) {
    setStatus(`${turn === 'X' ? playerXName : playerOName}'s turn`);
    return;
  }

  if(turn === computer){
    setStatus('Computer thinking...');
    setTimeout(() => computerMove(), 250);
  } else {
    setStatus('Your turn');
  }
}

// PvP/Com toggle button logic
modeToggle.addEventListener('click', () => {
    isPvP = !isPvP;
    if (isPvP) {
        modeToggle.textContent = 'PvP';
        playerNamesDiv.classList.remove('opacity-50');
        playerXNameInput.disabled = false;
        playerONameInput.disabled = false;
    } else {
        modeToggle.textContent = 'Computer';
        playerNamesDiv.classList.add('opacity-50');
        playerXNameInput.disabled = true;
        playerONameInput.disabled = true;
        playerXNameInput.value = '';
        playerONameInput.value = '';
    }
    startGame();
});

function endGame(result){
  running = false;
  if(result === 'draw'){
    setStatus('Draw');
    stats.draws++;
    drawsEl.textContent = stats.draws;
    pushHistory('Draw');
  } else {
    if(isPvP){
      const winnerName = result === 'X' ? playerXName : playerOName;
      setStatus(`${winnerName} wins`);
      pushHistory(`${winnerName} wins`);
    } else {
      setStatus(result === player ? 'You win 🎉' : 'Computer wins');
      if(result === player){
        stats.wins++; winsEl.textContent = stats.wins; pushHistory('Win');
      } else {
        stats.losses++; lossesEl.textContent = stats.losses; pushHistory('Loss');
      }
    }
    highlightWinningLine(result);
  }
}

playerXNameInput.addEventListener('input', ()=>{
  playerXName = playerXNameInput.value || 'Player X';
  if(isPvP) setStatus(`${turn === 'X' ? playerXName : playerOName}'s turn`);
});
playerONameInput.addEventListener('input', ()=>{
  playerOName = playerONameInput.value || 'Player O';
  if(isPvP) setStatus(`${turn === 'X' ? playerXName : playerOName}'s turn`);
});


function pushHistory(text){
  const li = document.createElement('li');
  const time = new Date().toLocaleTimeString();
  li.textContent = `${time} — ${text}`;
  historyEl.prepend(li);
  while(historyEl.children.length>8) historyEl.removeChild(historyEl.lastChild);
}

function highlightWinningLine(who){
  const winning = winningLine(cells);
  if(!winning) return;
  winning.forEach(i => {
    const b = boardEl.querySelector(`button[data-index='${i}']`);
    if(b){ b.classList.add('ring-2','ring-offset-2','ring-indigo-500'); }
  });
}

// Checks
function checkWinner(b){
  const w = winningLine(b);
  return w ? b[w[0]] : null;
}

function winningLine(b){
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for(const line of lines){
    const [a,c,d] = line;
    if(b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

// --- Computer AI ---
function computerMove(){
  const diff = difficultySel.value;
  let idx;
  if(diff === 'easy'){
    const empties = cells.map((v,i)=> v?null:i).filter(v=>v!==null);
    idx = empties[Math.floor(Math.random()*empties.length)];
  } else if(diff === 'medium'){
    // medium: sometimes random, sometimes minimax
    if(Math.random() < 0.45){
      const empties = cells.map((v,i)=> v?null:i).filter(v=>v!==null);
      idx = empties[Math.floor(Math.random()*empties.length)];
    } else {
      idx = bestMove(cells, computer);
    }
  } else {
    idx = bestMove(cells, computer);
  }

  if(idx==null){ // fallback
    const empties = cells.map((v,i)=> v?null:i).filter(v=>v!==null);
    idx = empties[0];
  }

  makeMove(idx, computer);
}

// Minimax implementation
function bestMove(board, who){
  // returns index of best move for who
  const opponent = who === 'X' ? 'O' : 'X';

  // if board empty, take center or corner for speed
  if(board.every(v=>v===null)){
    return 4; // center
  }

  let bestScore = -Infinity;
  let move = null;
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i] = who;
      const score = minimax(board, 0, false, who, opponent);
      board[i] = null;
      if(score > bestScore){ bestScore = score; move = i; }
    }
  }
  return move;
}

function minimax(board, depth, isMaximizing, me, opp){
  const winner = checkWinner(board);
  if(winner === me) return 10 - depth;
  if(winner === opp) return depth - 10;
  if(board.every(Boolean)) return 0;

  if(isMaximizing){
    let best = -Infinity;
    for(let i=0;i<9;i++){
      if(!board[i]){
        board[i] = me;
        const val = minimax(board, depth+1, false, me, opp);
        board[i] = null;
        best = Math.max(best, val);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for(let i=0;i<9;i++){
      if(!board[i]){
        board[i] = opp;
        const val = minimax(board, depth+1, true, me, opp);
        board[i] = null;
        best = Math.min(best, val);
      }
    }
    return best;
  }
}

// --- UI bindings ---
pickX.addEventListener('click', ()=>{
  player = 'X'; computer = 'O';
  pickX.classList.add('bg-gradient-to-r','from-indigo-600','to-cyan-400','text-slate-900');
  pickO.classList.remove('bg-gradient-to-r','from-indigo-600','to-cyan-400','text-slate-900');
  startGame();
});
pickO.addEventListener('click', ()=>{
  player = 'O'; computer = 'X';
  pickO.classList.add('bg-gradient-to-r','from-indigo-600','to-cyan-400','text-slate-900');
  pickX.classList.remove('bg-gradient-to-r','from-indigo-600','to-cyan-400','text-slate-900');
  startGame();
});

restartBtn.addEventListener('click', ()=>{
  // reset UI highlights
  boardEl.querySelectorAll('button').forEach(b=>{b.classList.remove('ring-2','ring-offset-2','ring-indigo-500')});
  startGame();
});

difficultySel.addEventListener('change', ()=>{
  // no special action needed
});

// allow keyboard 1-9 moves when it's player's turn
window.addEventListener('keydown', (e)=>{
  if(!running) return;
  if(isPvP) {
    const keyMap = {"1":6,"2":7,"3":8,"4":3,"5":4,"6":5,"7":0,"8":1,"9":2};
    if(keyMap[e.key] != null){
      const i = keyMap[e.key];
      if(!cells[i]) makeMove(i, turn);
    }
    return;
  }
  if(turn !== player) return;
  const keyMap = {"1":6,"2":7,"3":8,"4":3,"5":4,"6":5,"7":0,"8":1,"9":2};
  if(keyMap[e.key] != null){
    const i = keyMap[e.key];
    if(!cells[i]) makeMove(i, player);
  }
});

// initialize
startGame();