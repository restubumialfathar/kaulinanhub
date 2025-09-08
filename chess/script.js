const board = document.getElementById("chessBoard");
const status = document.getElementById("status");
const turnIndicator = document.getElementById("turnIndicator");
const promotionModal = document.getElementById("promotionModal");
let promotionCallback = null;

const pieces = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let chessBoard = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

let selected = null;
let turn = "white";
let enPassantTarget = null;

const isWhite = piece => piece && piece === piece.toUpperCase();
const isBlack = piece => piece && piece === piece.toLowerCase();

function updateTurnIndicator(){
  if(turn==="white"){
    turnIndicator.textContent = "Giliran Bodas";
    turnIndicator.style.top = "";
    turnIndicator.style.bottom = "80px";
    turnIndicator.style.left = "220px";
  } else {
    turnIndicator.textContent = "Giliran Hideung";
    turnIndicator.style.top = "75px";
    turnIndicator.style.bottom = "";
    turnIndicator.style.left = "950px";
  }
}

function renderBoard(){
  board.innerHTML = "";
  for(let i=0;i<8;i++){
    for(let j=0;j<8;j++){
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((i+j)%2===0 ? "white":"black");
      square.dataset.row = i;
      square.dataset.col = j;

      const pieceChar = pieces[chessBoard[i][j]] || "";
      if(pieceChar){
        const span = document.createElement("span");
        span.textContent = pieceChar;
        if(isWhite(chessBoard[i][j])) span.classList.add("white");
        else span.classList.add("black");
        square.appendChild(span);
      }

      square.addEventListener("click",()=>selectSquare(i,j));
      board.appendChild(square);
    }
  }

  if(selected){
    const sq = document.querySelector(`.square[data-row='${selected.row}'][data-col='${selected.col}']`);
    sq.classList.add("selected");
    const moves = getValidMoves(selected.row,selected.col);
    moves.forEach(m=>{
      document.querySelector(`.square[data-row='${m.row}'][data-col='${m.col}']`).classList.add("valid-move");
    });
  }

  updateTurnIndicator();
  checkGameState();
}

function selectSquare(r,c){
  const piece = chessBoard[r][c];
  if(selected){
    const moves = getValidMoves(selected.row,selected.col);
    const valid = moves.some(m=>m.row===r && m.col===c);
    if(valid){
      const fromPiece = chessBoard[selected.row][selected.col];

      // Handle en-passant
      if(fromPiece.toLowerCase()==='p' && enPassantTarget && r===enPassantTarget.row && c===enPassantTarget.col){
        chessBoard[selected.row][c]=""; // remove captured pawn
      }

      chessBoard[r][c]=fromPiece;
      chessBoard[selected.row][selected.col]="";

      // Pawn promotion
      if(fromPiece.toLowerCase()==='p' && (r===0 || r===7)){
        promotionModal.classList.remove("hidden");
        promotionCallback = (newPiece)=>{
          chessBoard[r][c]=turn==="white"?newPiece.toUpperCase():newPiece.toLowerCase();
          promotionModal.classList.add("hidden");
          renderBoard();
          turn=turn==="white"?"black":"white";
        };
        return;
      }

      enPassantTarget = (fromPiece.toLowerCase()==='p' && Math.abs(r-selected.row)===2)?{row:(r+selected.row)/2,col:c}:null;

      selected=null;
      turn=turn==="white"?"black":"white";
      renderBoard();
      checkGameState();
    } else {selected=null; renderBoard();}
  } else if(piece && ((turn==="white" && isWhite(piece)) || (turn==="black" && isBlack(piece)))){
    selected={row:r,col:c};
    renderBoard();
  }
}

function getValidMoves(r,c){
  const piece = chessBoard[r][c];
  if(!piece) return [];
  const whitePiece = isWhite(piece);
  if((turn==="white" && !whitePiece) || (turn==="black" && whitePiece)) return [];

  const moves=[];
  const dirs = { 
    N:[[ -2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],
    K:[[ -1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],
    B:[[ -1,-1],[-1,1],[1,-1],[1,1]],
    R:[[ -1,0],[1,0],[0,-1],[0,1]],
    Q:[[ -1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  };

  const addSlide = (dr,dc)=>{
    let nr=r+dr,nc=c+dc;
    while(nr>=0 && nr<8 && nc>=0 && nc<8){
      if(!chessBoard[nr][nc]) moves.push({row:nr,col:nc});
      else {if(isWhite(chessBoard[nr][nc])!==whitePiece) moves.push({row:nr,col:nc}); break;}
      nr+=dr; nc+=dc;
    }
  }

  switch(piece.toLowerCase()){
    case 'p': 
      const dir = whitePiece?-1:1;
      if(!chessBoard[r+dir][c]) moves.push({row:r+dir,col:c});
      if((r===6 && whitePiece || r===1 && !whitePiece) && !chessBoard[r+2*dir][c]) moves.push({row:r+2*dir,col:c});
      if(c>0 && chessBoard[r+dir][c-1] && isWhite(chessBoard[r+dir][c-1])!==whitePiece) moves.push({row:r+dir,col:c-1});
      if(c<7 && chessBoard[r+dir][c+1] && isWhite(chessBoard[r+dir][c+1])!==whitePiece) moves.push({row:r+dir,col:c+1});
      if(enPassantTarget && enPassantTarget.row===r+dir && Math.abs(enPassantTarget.col-c)===1) moves.push({...enPassantTarget});
      break;
    case 'n': dirs.N.forEach(d=>{const nr=r+d[0],nc=c+d[1]; if(nr>=0 && nr<8 && nc>=0 && nc<8 && (!chessBoard[nr][nc] || isWhite(chessBoard[nr][nc])!==whitePiece)) moves.push({row:nr,col:nc})}); break;
    case 'b': dirs.B.forEach(d=>addSlide(d[0],d[1])); break;
    case 'r': dirs.R.forEach(d=>addSlide(d[0],d[1])); break;
    case 'q': dirs.Q.forEach(d=>addSlide(d[0],d[1])); break;
    case 'k': dirs.K.forEach(d=>{const nr=r+d[0],nc=c+d[1]; if(nr>=0 && nr<8 && nc>=0 && nc<8 && (!chessBoard[nr][nc] || isWhite(chessBoard[nr][nc])!==whitePiece)) moves.push({row:nr,col:nc})}); break;
  }

  return moves;
}

function checkGameState(){
  let whiteKing=false, blackKing=false;
  for(let i=0;i<8;i++) for(let j=0;j<8;j++){
    if(chessBoard[i][j]==='K') whiteKing=true;
    if(chessBoard[i][j]==='k') blackKing=true;
  }
  if(!whiteKing){status.textContent="Hideung Meunang!"; board.style.pointerEvents="none";}
  else if(!blackKing){status.textContent="Bodas Meunang!"; board.style.pointerEvents="none";}
}

promotionModal.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(promotionCallback){
      promotionCallback(btn.dataset.piece);
      promotionCallback=null;
    }
  });
});

renderBoard();
