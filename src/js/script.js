class Game {
  static #POINTS_PER_LINES = {
    1: 10,
    2: 30,
    3: 90,
    4: 270,
  };

  static #BOARD_HEIGHT = 20;
  static #BOARD_WIDTH = 10;
  static #LINES_PER_LEVEL = 25;
  static #TETROMINO_TYPES = "IJLOSTZ";
  static #TETROMINO_SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [0, 0, 0],
      [2, 2, 2],
      [0, 0, 2],
    ],
    L: [
      [0, 0, 0],
      [3, 3, 3],
      [3, 0, 0],
    ],
    O: [
      [0, 0, 0, 0],
      [0, 4, 4, 0],
      [0, 4, 4, 0],
      [0, 0, 0, 0],
    ],
    S: [
      [0, 0, 0],
      [0, 5, 5],
      [5, 5, 0],
    ],
    T: [
      [0, 0, 0],
      [6, 6, 6],
      [0, 6, 0],
    ],
    Z: [
      [0, 0, 0],
      [7, 7, 0],
      [0, 7, 7],
    ],
  };

  #score = 0;
  #linesCleared = 0;
  #isGameOver = false;
  #gameBoard = [];
  #currentTetromino = null;
  #nextTetromino = null;

  constructor() {
    this.reset();
  }

  get level() {
    return Math.floor(this.#linesCleared / Game.#LINES_PER_LEVEL);
  }

  get score() {
    return this.#score;
  }

  get linesCleared() {
    return this.#linesCleared;
  }

  get isGameOver() {
    return this.#isGameOver;
  }

  get nextTetromino() {
    return this.#nextTetromino;
  }

  reset() {
    this.#score = 0;
    this.#linesCleared = 0;
    this.#isGameOver = false;
    this.#gameBoard = this.#createEmptyBoard();
    this.#currentTetromino = this.#generateRandomTetromino();
    this.#nextTetromino = this.#generateRandomTetromino();
  }

  getState() {
    const displayBoard = this.#createDisplayBoard();
    
    return {
      score: this.#score,
      level: this.level,
      lines: this.#linesCleared,
      nextPiece: this.#nextTetromino,
      playfield: displayBoard,
      isGameOver: this.#isGameOver,
    };
  }

  moveTetrominoLeft() {
    this.#currentTetromino.x -= 1;
    if (this.#hasCollision()) {
      this.#currentTetromino.x += 1;
    }
  }

  moveTetrominoRight() {
    this.#currentTetromino.x += 1;
    if (this.#hasCollision()) {
      this.#currentTetromino.x -= 1;
    }
  }

  moveTetrominoDown() {
    if (this.#isGameOver) return;

    this.#currentTetromino.y += 1;

    if (this.#hasCollision()) {
      this.#currentTetromino.y -= 1;
      this.#lockTetromino();
      const clearedLines = this.#clearCompleteLines();
      this.#updateScore(clearedLines);
      this.#switchToNextTetromino();
    }

    if (this.#hasCollision()) {
      this.#isGameOver = true;
    }
  }

  rotateTetromino() {
    this.#rotateMatrix(this.#currentTetromino.blocks, true);

    if (this.#hasCollision()) {
      this.#rotateMatrix(this.#currentTetromino.blocks, false);
    }
  }

  #createEmptyBoard() {
    const board = [];
    for (let row = 0; row < Game.#BOARD_HEIGHT; row++) {
      board[row] = new Array(Game.#BOARD_WIDTH).fill(0);
    }
    return board;
  }

  #createDisplayBoard() {
    const displayBoard = [];
    
    for (let row = 0; row < this.#gameBoard.length; row++) {
      displayBoard[row] = [...this.#gameBoard[row]];
    }

    const { y: tetrominoY, x: tetrominoX, blocks } = this.#currentTetromino;

    for (let row = 0; row < blocks.length; row++) {
      for (let col = 0; col < blocks[row].length; col++) {
        if (blocks[row][col]) {
          displayBoard[tetrominoY + row][tetrominoX + col] = blocks[row][col];
        }
      }
    }

    return displayBoard;
  }

  #generateRandomTetromino() {
    const randomIndex = Math.floor(Math.random() * Game.#TETROMINO_TYPES.length);
    const tetrominoType = Game.#TETROMINO_TYPES[randomIndex];
    const blocks = Game.#TETROMINO_SHAPES[tetrominoType].map(row => [...row]);

    return {
      blocks,
      x: Math.floor((Game.#BOARD_WIDTH - blocks[0].length) / 2),
      y: -1,
    };
  }

  #hasCollision() {
    const { y: tetrominoY, x: tetrominoX, blocks } = this.#currentTetromino;
    
    for (let row = 0; row < blocks.length; row++) {
      for (let col = 0; col < blocks[row].length; col++) {
        if (!blocks[row][col]) continue;
        
        const boardY = tetrominoY + row;
        const boardX = tetrominoX + col;
        
        if (boardY < 0) continue;
        
        const isOutOfBounds = 
          boardY >= Game.#BOARD_HEIGHT || 
          boardX < 0 || 
          boardX >= Game.#BOARD_WIDTH;
        
        const isOccupied = 
          boardY >= 0 && 
          this.#gameBoard[boardY] && 
          this.#gameBoard[boardY][boardX];
        
        if (isOutOfBounds || isOccupied) {
          return true;
        }
      }
    }

    return false;
  }

  #lockTetromino() {
    const { y: tetrominoY, x: tetrominoX, blocks } = this.#currentTetromino;
    
    for (let row = 0; row < blocks.length; row++) {
      for (let col = 0; col < blocks[row].length; col++) {
        if (blocks[row][col]) {
          this.#gameBoard[tetrominoY + row][tetrominoX + col] = blocks[row][col];
        }
      }
    }
  }

  #clearCompleteLines() {
    const completedLines = [];

    for (let row = Game.#BOARD_HEIGHT - 1; row >= 0; row--) {
      const blocksInRow = this.#gameBoard[row].filter(cell => cell !== 0).length;

      if (blocksInRow === 0) {
        break;
      } else if (blocksInRow === Game.#BOARD_WIDTH) {
        completedLines.unshift(row);
      }
    }

    for (const lineIndex of completedLines) {
      this.#gameBoard.splice(lineIndex, 1);
      this.#gameBoard.unshift(new Array(Game.#BOARD_WIDTH).fill(0));
    }

    return completedLines.length;
  }

  #updateScore(clearedLines) {
    if (clearedLines > 0) {
      this.#score += Game.#POINTS_PER_LINES[clearedLines] * (this.level + 1);
      this.#linesCleared += clearedLines;
    }
  }

  #switchToNextTetromino() {
    this.#currentTetromino = this.#nextTetromino;
    this.#nextTetromino = this.#generateRandomTetromino();
  }

  #rotateMatrix(matrix, clockwise = true) {
    const size = matrix.length;
    const centerX = Math.floor(size / 2);
    const maxIndex = size - 1;

    for (let i = 0; i < centerX; i++) {
      for (let j = i; j < maxIndex - i; j++) {
        const temp = matrix[i][j];

        if (clockwise) {
          matrix[i][j] = matrix[maxIndex - j][i];
          matrix[maxIndex - j][i] = matrix[maxIndex - i][maxIndex - j];
          matrix[maxIndex - i][maxIndex - j] = matrix[j][maxIndex - i];
          matrix[j][maxIndex - i] = temp;
        } else {
          matrix[i][j] = matrix[j][maxIndex - i];
          matrix[j][maxIndex - i] = matrix[maxIndex - i][maxIndex - j];
          matrix[maxIndex - i][maxIndex - j] = matrix[maxIndex - j][i];
          matrix[maxIndex - j][i] = temp;
        }
      }
    }
  }
}

class View {
  static #TETROMINO_COLORS = {
    1: "#0000ff",
    2: "#00ff00", 
    3: "#ff0000",
    4: "#ff8000",
    5: "#ff00ff",
    6: "#ffff00",
    7: "#00ffff",
  };

  static #FONT_FAMILY = "'Courier New'";
  static #FONT_SIZE_LARGE = 18;
  static #FONT_SIZE_SMALL = 14;
  static #BORDER_WIDTH = 1;
  static #BORDER_COLOR = "#fff";
  static #TEXT_COLOR = "#fff";
  static #BLOCK_BORDER_COLOR = "#000";
  static #BLOCK_BORDER_WIDTH = 2;
  static #PANEL_OFFSET = 10;
  static #LINE_SPACING = 24;
  static #OVERLAY_COLOR = "rgba(0, 0, 0, 0.8)";

  #element;
  #width;
  #height;
  #canvas;
  #context;
  #boardArea;
  #panelArea;
  #blockDimensions;

  constructor(element, width, height, rows, columns) {
    this.#element = element;
    this.#width = width;
    this.#height = height;

    this.#initializeCanvas();
    this.#calculateDimensions(rows, columns);
    this.#element.appendChild(this.#canvas);
  }

  renderMainScreen(state, highScore) {
    this.#clearScreen();
    this.#renderGameBoard(state);
    this.#renderInfoPanel(state, highScore);
  }

  renderStartScreen() {
    this.#clearScreen();
    this.#renderCenteredText("                Press 1: Easy | 2: Medium | 3: Hard");
    this.#renderCenteredText("  Press Enter to Start", this.#height / 2 + 40);
  }

  renderPauseScreen() {
    this.#renderOverlay();
    this.#renderCenteredText("Press Enter to Resume");
  }

  renderEndScreen({ score }, highScore) {
    this.#clearScreen();
    
    const centerX = this.#width / 3;
    const centerY = this.#height / 2;
    const lineHeight = 48;

    this.#context.fillStyle = View.#TEXT_COLOR;
    this.#context.font = `${View.#FONT_SIZE_LARGE}px ${View.#FONT_FAMILY}`;
    this.#context.textAlign = "center";
    this.#context.textBaseline = "middle";
    
    this.#context.fillText("GAME OVER", centerX, centerY - lineHeight);
    this.#context.fillText(`Score: ${score}`, centerX, centerY);
    this.#context.fillText(`High Score: ${highScore}`, centerX, centerY + lineHeight);
    this.#context.fillText("Press Enter to Restart", centerX, centerY + lineHeight * 2);
  }

  #initializeCanvas() {
    this.#canvas = document.createElement("canvas");
    this.#canvas.width = this.#width;
    this.#canvas.height = this.#height;
    this.#context = this.#canvas.getContext("2d");
  }

  #calculateDimensions(rows, columns) {
    const boardWidth = (this.#width * 2) / 3;
    const boardHeight = this.#height;
    
    this.#boardArea = {
      x: View.#BORDER_WIDTH,
      y: View.#BORDER_WIDTH,
      width: boardWidth,
      height: boardHeight,
      innerWidth: boardWidth - View.#BORDER_WIDTH * 2,
      innerHeight: boardHeight - View.#BORDER_WIDTH * 2,
    };

    this.#panelArea = {
      x: boardWidth + View.#PANEL_OFFSET,
      y: 0,
      width: this.#width / 3,
      height: this.#height,
    };

    this.#blockDimensions = {
      width: this.#boardArea.innerWidth / columns,
      height: this.#boardArea.innerHeight / rows,
    };
  }

  #clearScreen() {
    this.#context.clearRect(0, 0, this.#width, this.#height);
  }

  #renderOverlay() {
    this.#context.fillStyle = View.#OVERLAY_COLOR;
    this.#context.fillRect(0, 0, this.#width, this.#height);
  }

  #renderCenteredText(text, y = this.#height / 2) {
    this.#context.fillStyle = View.#TEXT_COLOR;
    this.#context.font = `${View.#FONT_SIZE_LARGE}px ${View.#FONT_FAMILY}`;
    this.#context.textAlign = "center";
    this.#context.textBaseline = "middle";
    this.#context.fillText(text, this.#width / 3, y);
  }

  #renderGameBoard({ playfield }) {
    for (let row = 0; row < playfield.length; row++) {
      for (let col = 0; col < playfield[row].length; col++) {
        const blockValue = playfield[row][col];

        if (blockValue) {
          this.#renderBlock(
            this.#boardArea.x + col * this.#blockDimensions.width,
            this.#boardArea.y + row * this.#blockDimensions.height,
            this.#blockDimensions.width,
            this.#blockDimensions.height,
            View.#TETROMINO_COLORS[blockValue]
          );
        }
      }
    }

    this.#drawBoardBorder();
  }

  #drawBoardBorder() {
    this.#context.strokeStyle = View.#BORDER_COLOR;
    this.#context.lineWidth = View.#BORDER_WIDTH;
    this.#context.strokeRect(0, 0, this.#boardArea.width, this.#boardArea.height);
  }

  #renderInfoPanel({ level, score, lines, nextPiece }, highScore) {
    this.#context.textAlign = "start";
    this.#context.textBaseline = "top";
    this.#context.fillStyle = View.#TEXT_COLOR;
    this.#context.font = `${View.#FONT_SIZE_SMALL}px ${View.#FONT_FAMILY}`;

    const labels = [
      { text: `Score: ${score}`, y: 0 },
      { text: `Lines: ${lines}`, y: View.#LINE_SPACING },
      { text: `Level: ${level}`, y: View.#LINE_SPACING * 2 },
      { text: `High: ${highScore}`, y: View.#LINE_SPACING * 3 },
      { text: "Next:", y: View.#LINE_SPACING * 5 },
    ];

    labels.forEach(({ text, y }) => {
      this.#context.fillText(text, this.#panelArea.x, this.#panelArea.y + y);
    });

    this.#renderNextTetromino(nextPiece);
  }

  #renderNextTetromino(tetromino) {
    const scale = 0.5;
    const offsetY = 120;

    for (let row = 0; row < tetromino.blocks.length; row++) {
      for (let col = 0; col < tetromino.blocks[row].length; col++) {
        const blockValue = tetromino.blocks[row][col];

        if (blockValue) {
          this.#renderBlock(
            this.#panelArea.x + col * this.#blockDimensions.width * scale,
            this.#panelArea.y + offsetY + row * this.#blockDimensions.height * scale,
            this.#blockDimensions.width * scale,
            this.#blockDimensions.height * scale,
            View.#TETROMINO_COLORS[blockValue]
          );
        }
      }
    }
  }

  #renderBlock(x, y, width, height, color) {
    this.#context.fillStyle = color;
    this.#context.strokeStyle = View.#BLOCK_BORDER_COLOR;
    this.#context.lineWidth = View.#BLOCK_BORDER_WIDTH;

    this.#context.fillRect(x, y, width, height);
    this.#context.strokeRect(x, y, width, height);
  }
}

class Controller {
  static #KEY_CODES = {
    ENTER: 13,
    SPACE: 32,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    ONE: 49,
    TWO: 50,
    THREE: 51,
  };

  static #INITIAL_SPEED = 1000;
  static #SPEED_DECREASE_PER_LEVEL = 100;
  static #MINIMUM_SPEED = 100;

  #game;
  #view;
  #dropTimerId = null;
  #isPlaying = false;
  #difficulty = "medium";
  #highScore = 0;

  constructor(game, view) {
    this.#game = game;
    this.#view = view;

    this.#loadHighScore();
    this.#initializeEventListeners();
    this.#view.renderStartScreen();
  }

  get isPlaying() {
    return this.#isPlaying;
  }

    #initializeEventListeners() {
    document.addEventListener("keydown", (event) => {
      switch (event.keyCode) {
        case Controller.#KEY_CODES.ENTER:
          if (this.#isPlaying) {
            this.#pause();
          } else if (this.#game.isGameOver) {
            this.#restart();
          } else {
            this.#start();
          }
          break;

        case Controller.#KEY_CODES.ONE:
          this.#difficulty = "easy";
          this.#view.renderCenteredText("Difficulty: Easy");
          break;

        case Controller.#KEY_CODES.TWO:
          this.#difficulty = "medium";
          this.#view.renderCenteredText("Difficulty: Medium");
          break;

        case Controller.#KEY_CODES.THREE:
          this.#difficulty = "hard";
          this.#view.renderCenteredText("Difficulty: Hard");
          break;

        case Controller.#KEY_CODES.LEFT_ARROW:
          if (this.#isPlaying) {
            this.#game.moveTetrominoLeft();
            this.#updateView();
          }
          break;

        case Controller.#KEY_CODES.RIGHT_ARROW:
          if (this.#isPlaying) {
            this.#game.moveTetrominoRight();
            this.#updateView();
          }
          break;

        case Controller.#KEY_CODES.DOWN_ARROW:
          if (this.#isPlaying) {
            this.#game.moveTetrominoDown();
            this.#updateView();
          }
          break;

        case Controller.#KEY_CODES.UP_ARROW:
          if (this.#isPlaying) {
            this.#game.rotateTetromino();
            this.#updateView();
          }
          break;

        case Controller.#KEY_CODES.SPACE:
          if (this.#isPlaying) {
            while (!this.#game.isGameOver) {
              const before = this.#game.getState().playfield;
              this.#game.moveTetrominoDown();
              const after = this.#game.getState().playfield;
              if (JSON.stringify(before) === JSON.stringify(after)) break;
            }
            this.#updateView();
          }
          break;
      }
    });
  }

  #start() {
    if (this.#isPlaying) return;

    this.#isPlaying = true;
    this.#setGameSpeed();
    this.#updateView();
    this.#dropLoop();
  }

  #pause() {
    if (!this.#isPlaying) return;

    this.#isPlaying = false;
    clearTimeout(this.#dropTimerId);
    this.#view.renderPauseScreen();
  }

  #restart() {
    this.#game.reset();
    this.#isPlaying = false;
    this.#view.renderStartScreen();
  }

  #dropLoop() {
    if (!this.#isPlaying) return;

    this.#game.moveTetrominoDown();
    this.#updateView();

    if (this.#game.isGameOver) {
      this.#endGame();
      return;
    }

    const speed = this.#calculateSpeed();
    this.#dropTimerId = setTimeout(() => this.#dropLoop(), speed);
  }

  #calculateSpeed() {
    const baseSpeed = Controller.#INITIAL_SPEED;
    const decrease = this.#game.level * Controller.#SPEED_DECREASE_PER_LEVEL;

    let speed = baseSpeed - decrease;
    if (this.#difficulty === "easy") speed *= 1.2;
    if (this.#difficulty === "hard") speed *= 0.7;

    return Math.max(speed, Controller.#MINIMUM_SPEED);
  }

  #setGameSpeed() {
    clearTimeout(this.#dropTimerId);
    this.#dropTimerId = setTimeout(() => this.#dropLoop(), this.#calculateSpeed());
  }

  #updateView() {
    const state = this.#game.getState();
    this.#view.renderMainScreen(state, this.#highScore);
  }

  #endGame() {
    this.#isPlaying = false;
    clearTimeout(this.#dropTimerId);

    const state = this.#game.getState();
    if (state.score > this.#highScore) {
      this.#highScore = state.score;
      this.#saveHighScore();
    }

    this.#view.renderEndScreen(state, this.#highScore);
  }

  #saveHighScore() {
    localStorage.setItem("tetrisHighScore", this.#highScore);
  }

  #loadHighScore() {
    const saved = localStorage.getItem("tetrisHighScore");
    if (saved) {
      this.#highScore = parseInt(saved, 10);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  const game = new Game();
  const view = new View(root, 480, 640, 20, 10);
  const controller = new Controller(game, view);
  window.tetris = { game, view, controller };
});
