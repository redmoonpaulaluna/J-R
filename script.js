const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener('resize', resize);

let distance = 1;
let coins = 0;
let speed = 4;
let gameOver = false;

const gravity = 0.6;
const groundY = height - 150;

let player;
let obstacles = [];
let coinsOnField = [];

const hudDistance = document.getElementById('distance');
const hudCoins = document.getElementById('coins');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');

class Player {
  constructor() {
    this.width = 60;
    this.height = 80;
    this.x = 100;
    this.y = groundY - this.height;
    this.dy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideHeight = 50;
    this.slideTime = 0;
  }

  draw() {
    ctx.fillStyle = '#f2c94c'; // gelblicher Ton

    if (this.sliding) {
      // Sliding Körper
      ctx.fillRect(this.x, this.y + this.height - this.slideHeight, this.width, this.slideHeight);

      // Schwarze "Ohren" (Dreiecke)
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y + this.height - this.slideHeight);
      ctx.lineTo(this.x + 20, this.y + this.height - this.slideHeight - 15);
      ctx.lineTo(this.x + 30, this.y + this.height - this.slideHeight);
      ctx.fill();
    } else {
      // Stehender Körper
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Schwarze "Ohren"
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y);
      ctx.lineTo(this.x + 20, this.y - 20);
      ctx.lineTo(this.x + 30, this.y);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 10, this.y);
      ctx.lineTo(this.x + this.width - 20, this.y - 20);
      ctx.lineTo(this.x + this.width - 30, this.y);
      ctx.fill();
    }
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y > groundY - this.height && !this.sliding) {
      this.y = groundY - this.height;
      this.dy = 0;
      this.jumping = false;
    }

    if (this.sliding) {
      this.slideTime--;
      if (this.slideTime <= 0) {
        this.sliding = false;
        this.y = groundY - this.height;
      }
    }
  }

  jump() {
    if (!this.jumping && !this.sliding) {
      this.dy = -15;
      this.jumping = true;
    }
  }

  slide() {
    if (!this.jumping && !this.sliding) {
      this.sliding = true;
      this.slideTime = 30;
      this.y = groundY - this.slideHeight;
    }
  }

  getHitbox() {
    if (this.sliding) {
      return {
        x: this.x,
        y: this.y + this.height - this.slideHeight,
        width: this.width,
        height: this.slideHeight
      };
    }
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class Obstacle {
  constructor() {
    this.type = Math.random() < 0.5 ? 'top' : 'bottom'; // top = rote Kugel, bottom = Wolke
    this.radius = 30;
    this.x = width + 50;
    if (this.type === 'top') {
      this.y = groundY - this.radius * 2 - 80; // oben in der Luft
    } else {
      this.y = groundY - 130; // Wolke etwas höher über Boden
    }
  }

  draw() {
    if (this.type === 'top') {
      // Rote Kugel, obere Hälfte rot, untere Hälfte weiß (retro style)
      const cx = this.x;
      const cy = this.y + this.radius;

      // obere Hälfte rot
      ctx.fillStyle = '#bb2222';
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, Math.PI, 0, false);
      ctx.fill();

      // untere Hälfte weiß
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, 0, Math.PI, false);
      ctx.fill();

      // schwarze Umrandung (pixeliger Look)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // Wolke: mehrere weiße Kreise für Retro-Wolke
      ctx.fillStyle = 'white';
      const baseY = this.y;
      const baseX = this.x;

      ctx.beginPath();
      ctx.arc(baseX, baseY, 15, 0, Math.PI * 2);
      ctx.arc(baseX + 20, baseY + 5, 18, 0, Math.PI * 2);
      ctx.arc(baseX + 40, baseY, 15, 0, Math.PI * 2);
      ctx.arc(baseX + 25, baseY - 10, 20, 0, Math.PI * 2);
      ctx.fill();

      // Umrandung (pixel)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(baseX, baseY, 15, 0, Math.PI * 2);
      ctx.arc(baseX + 20, baseY + 5, 18, 0, Math.PI * 2);
      ctx.arc(baseX + 40, baseY, 15, 0, Math.PI * 2);
      ctx.arc(baseX + 25, baseY - 10, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  update() {
    this.x -= speed;
  }

  getHitbox() {
    if (this.type === 'top') {
      return {
        x: this.x - this.radius,
        y: this.y,
        width: this.radius * 2,
        height: this.radius * 2
      };
    } else {
      return {
        x: this.x,
        y: this.y - 20,
        width: 40 + 20,
        height: 30
      };
    }
  }
}

class Coin {
  constructor() {
    this.size = 24;
    this.x = width + 50;
    this.y = groundY - 100 - Math.random() * 150;
  }

  draw() {
    const radius = this.size / 2;

    // Außenrand (dunkelgelb)
    ctx.fillStyle = '#B8860B'; // dark goldenrod
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hauptfarbe (goldgelb)
    ctx.fillStyle = '#FFD700'; // gold
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Highlight (oben links)
    const highlightX = this.x - radius * 0.3;
    const highlightY = this.y - radius * 0.3;
    ctx.fillStyle = 'rgba(255, 255, 224, 0.7)';
    ctx.beginPath();
    ctx.ellipse(highlightX, highlightY, radius * 0.3, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Schatten (unten rechts)
    const shadowX = this.x + radius * 0.3;
    const shadowY = this.y + radius * 0.3;
    ctx.fillStyle = 'rgba(184, 134, 11, 0.6)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, radius * 0.3, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pixel-Art-Striche (retro-Effekt)
    ctx.strokeStyle = '#DAA520'; // goldenrod
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - radius * 0.5, this.y);
    ctx.lineTo(this.x + radius * 0.5, this.y);
    ctx.moveTo(this.x, this.y - radius * 0.5);
    ctx.lineTo(this.x, this.y + radius * 0.5);
    ctx.stroke();
  }

  update() {
    this.x -= speed;
  }

  getHitbox() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }
}

function isColliding(rect1, rect2) {
  return !(rect1.x > rect2.x + rect2.width ||
           rect1.x + rect1.width < rect2.x ||
           rect1.y > rect2.y + rect2.height ||
           rect1.y + rect1.height < rect2.y);
}

function updateHUD() {
  hudDistance.textContent = 'Distance: ' + distance.toFixed(0);
  hudCoins.textContent = 'Coins: ' + coins;
}

function spawnObstacle() {
  if (!gameOver && Math.random() < 0.02) {
    obstacles.push(new Obstacle());
  }
}

function spawnCoin() {
  if (!gameOver && Math.random() < 0.03) {
    coinsOnField.push(new Coin());
  }
}

function handleCollisions() {
  const playerHitbox = player.getHitbox();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, obstacles[i].getHitbox())) {
      gameOver = true;
      showGameOver();
      break;
    }
  }

  for (let i = coinsOnField.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, coinsOnField[i].getHitbox())) {
      coins++;
      coinsOnField.splice(i, 1);
    }
  }
}

function showGameOver() {
  finalScore.textContent = `Distance: ${distance.toFixed(0)} | Coins: ${coins}`;
  gameOverScreen.style.display = 'block';
}

function animate() {
  if (gameOver) return;

  ctx.clearRect(0, 0, width, height);

  player.update();
  player.draw();

  obstacles.forEach((ob) => {
    ob.update();
    ob.draw();
  });

  coinsOnField.forEach((coin) => {
    coin.update();
    coin.draw();
  });

  obstacles = obstacles.filter(ob => ob.x + 60 > 0);
  coinsOnField = coinsOnField.filter(c => c.x + c.size > 0);

  spawnObstacle();
  spawnCoin();

  handleCollisions();

  distance += speed * 0.1;
  speed += 0.0005;

  updateHUD();

  requestAnimationFrame(animate);
}

// Touch controls
let touchStartY = null;
let touchEndY = null;

canvas.addEventListener('touchstart', (e) => {
  if (gameOver) return;
  touchStartY = e.changedTouches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
  if (gameOver) return;
  touchEndY = e.changedTouches[0].clientY;
  handleSwipe();
});

function handleSwipe() {
  if (touchStartY !== null && touchEndY !== null) {
    const diff = touchStartY - touchEndY;
    if (diff > 50) {
      player.jump();
    } else if (diff < -50) {
      player.slide();
    }
  }
  touchStartY = null;
  touchEndY = null;
}

// Keyboard controls
window.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.code === 'ArrowUp') player.jump();
  if (e.code === 'ArrowDown') player.slide();
});

function init() {
  player = new Player();
  obstacles = [];
  coinsOnField = [];
  distance = 1;
  coins = 0;
  speed = 4;
  gameOver = false;
  gameOverScreen.style.display = 'none';
  updateHUD();
  animate();
}

function startGame() {
  init();
}

startGame();
