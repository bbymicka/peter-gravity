import React, { useRef, useEffect } from 'react';

const GameSketch = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const initSketch = async () => {
      const sketch = (p) => {
        /* ---------- VARIÁVEIS DO JOGO ---------- */
        let centerX, centerY;
        let angle = 0;
        const orbitRadius = 220;
        let objetos = [];
        let massaPeter = 100;
        const massaMaxima = 100;
        let gameOver = false;
        let tempoInicial = 0;
        let tempoFinal = 0;
        let dificuldade = 0.01;
        let tempoUltimaAjuste = 0;

        /* ---------- VARIÁVEIS DA TELA START ---------- */
        let started = false;
        let soundsLoaded = false;
        let bgStartImg, logoImg, playBtnImg;
        let playBtnW = 0, playBtnH = 0;

        /* ---------- IMAGENS / SONS ---------- */
        let peterImg, peterNormalImg, peterDorImg, bgImg, tvImg,
            imgComida, imgFitness, gameOverImg;
        let crySound, gameOverSound;

        /* ---------- CLASSE OBJETO (restaurada) ---------- */
        class Objeto {
          constructor(x, y, tipo) {
            this.x = x;
            this.y = y;
            this.tipo = tipo;
            this.raio = 20;
            this.velocidade = tipo === 'fitness' ? p.random(2, 4.5) : 2;
          }
          update() {
            const dx = centerX - this.x;
            const dy = centerY - this.y;
            const dist = Math.hypot(dx, dy);
            this.x += (dx / dist) * this.velocidade;
            this.y += (dy / dist) * this.velocidade;
          }
          display() {
            p.imageMode(p.CENTER);
            if (this.tipo === 'comida' && imgComida) {
              p.image(imgComida, this.x, this.y, 100, 100);
            } else if (this.tipo === 'fitness' && imgFitness) {
              p.image(imgFitness, this.x, this.y, 100, 80);
            } else {
              p.noStroke();
              p.fill(this.tipo === 'comida' ? 'orange' : 'green');
              p.ellipse(this.x, this.y, this.raio * 2);
            }
          }
        }

        /* ---------- FUNÇÕES AUXILIARES ---------- */
        const mostrarPeterComDor = () => {
          peterImg = peterDorImg;
          if (crySound && crySound.isLoaded() && !crySound.isPlaying()) {
            crySound.play();
          }
          setTimeout(() => { peterImg = peterNormalImg; }, 500);
        };

        /* ---------- SETUP ---------- */
        p.setup = async () => {
          p.createCanvas(p.windowWidth, p.windowHeight - 1);
          centerX = p.width / 2;
          centerY = p.height / 2;
          tempoInicial = p.millis();

          try {
            // imagens gameplay
            peterNormalImg = await p.loadImage('/peter_normal.png');
            peterDorImg    = await p.loadImage('/peter_dor.png');
            peterImg       = peterNormalImg;
            bgImg          = await p.loadImage('/background.jpg');
            tvImg          = await p.loadImage('/tv.png');
            imgComida      = await p.loadImage('/food.png');
            imgFitness     = await p.loadImage('/dumbbell.png');
            gameOverImg    = await p.loadImage('/game_over.png');

            // imagens tela start
            bgStartImg = await p.loadImage('/background-start.png');
            logoImg    = await p.loadImage('/pg-logo.png');
            playBtnImg = await p.loadImage('/button-play.png');
          } catch (err) {
            console.error('Erro ao carregar imagens:', err);
          }
        };

        /* ---------- DRAW ---------- */
        p.draw = () => {
          /* --- TELA START --- */
          if (!started) {
            if (bgStartImg) {
              p.imageMode(p.CORNER);
              p.image(bgStartImg, 0, 0, p.width, p.height);
            } else {
              p.background(30);
            }

            if (logoImg) {
              const maxW = p.width * 0.25;
              const s    = maxW / logoImg.width;
              const w    = logoImg.width  * s;
              const h    = logoImg.height * s;
              const yBounce = Math.sin(p.millis() * 0.004) * 10;
              p.image(
                logoImg,
                20,
                p.height - h - 20 + yBounce,
                w, h
              );
            }

            if (playBtnImg) {
              const maxW = p.width * 0.135;
              const s    = maxW / playBtnImg.width;
              playBtnW   = playBtnImg.width  * s;
              playBtnH   = playBtnImg.height * s;
              p.image(
                playBtnImg,
                p.width - playBtnW - 80,
                p.height - playBtnH - 120,
                playBtnW,
                playBtnH
              );
            }
            return;
          }

          /* --- GAME OVER --- */
          if (gameOver) {
            p.background(0, 150);
            p.imageMode(p.CENTER);
            if (gameOverImg) p.image(gameOverImg, p.width / 2, p.height / 2, 500, 300);
            p.fill(255);
            p.textSize(32);
            p.textAlign(p.CENTER, p.TOP);
            p.text(`Tempo de jogo: ${(tempoFinal / 1000).toFixed(1)}s`,
                   p.width / 2, p.height / 2 + 180);
            p.noLoop();
            return;
          }

          /* --- GAMEPLAY (resto inalterado) --- */
          if (bgImg) {
            p.imageMode(p.CORNER);
            p.image(bgImg, 0, 0, p.width, p.height);
          } else {
            p.background(240);
          }

          if (peterImg) {
            p.imageMode(p.CENTER);
            p.image(peterImg, centerX, centerY, 320, 320);
          } else {
            p.fill(200);
            p.ellipse(centerX, centerY, 100, 100);
          }

          const tvX = centerX + orbitRadius * p.cos(angle);
          const tvY = centerY + orbitRadius * p.sin(angle);
          if (tvImg) {
            p.imageMode(p.CENTER);
            p.image(tvImg, tvX, tvY, 190, 125);
          }

          if (p.millis() - tempoUltimaAjuste > 10000) {
            dificuldade += 0.002;
            tempoUltimaAjuste = p.millis();
          }

          if (p.random(1) < dificuldade) {
            const side = p.floor(p.random(4));
            const pos  = [
              [p.random(p.width), 0],
              [p.width, p.random(p.height)],
              [p.random(p.width), p.height],
              [0, p.random(p.height)]
            ][side];
            const tipo = p.random() < 0.5 ? 'comida' : 'fitness';
            objetos.push(new Objeto(pos[0], pos[1], tipo));
          }

          for (let i = objetos.length - 1; i >= 0; i--) {
            objetos[i].update();
            objetos[i].display();
            if (p.dist(objetos[i].x, objetos[i].y, centerX, centerY) < 160) {
              if (objetos[i].tipo === 'comida') {
                massaPeter += 2;
              } else {
                massaPeter -= 50;
                mostrarPeterComDor();
              }
              objetos.splice(i, 1);
            }
          }

          angle += 0.03;

          const barraX = 20, barraY = 20, barraW = 200, barraH = 20;
          p.noStroke();
          p.fill(100);
          p.rect(barraX, barraY, barraW, barraH);
          p.fill(massaPeter > 30 ? 'green' : 'red');
          p.rect(barraX, barraY,
                 p.map(massaPeter, 0, massaMaxima, 0, barraW), barraH);
          p.fill(255);
          p.textSize(14);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(`Massa: ${massaPeter}`, barraX + 5, barraY + barraH / 2);

          if (massaPeter <= 0 && !gameOver) {
            gameOver = true;
            tempoFinal = p.millis() - tempoInicial;
            if (gameOverSound && gameOverSound.isLoaded()) gameOverSound.play();
          }
        };

        /* ---------- MOUSE ---------- */
        p.mousePressed = () => {
          if (!started) {
            const mx = p.mouseX, my = p.mouseY;
            const btnX = p.width - playBtnW - 20;
            const btnY = p.height - playBtnH - 20;
            const dentro = mx >= btnX && mx <= btnX + playBtnW &&
                           my >= btnY && my <= btnY + playBtnH;
            if (!dentro) return;

            const ctx = p.getAudioContext();
            if (ctx.state !== 'running') ctx.resume();

            if (!soundsLoaded) {
              soundsLoaded = true;
              p.loadSound('/peter_dor_song.mp3',
                (snd) => { crySound = snd; },
                (err) => console.error('Erro crySound', err)
              );
              p.loadSound('/birdSong.mp3',
                (snd) => { gameOverSound = snd; },
                (err) => console.error('Erro gameOverSound', err)
              );
            }

            started = true;
            tempoInicial = p.millis();
            p.loop();
            return;
          }

          if (gameOver && gameOverSound && gameOverSound.isPlaying()) {
            gameOverSound.stop();
          }

          if (gameOver) {
            massaPeter   = 100;
            objetos      = [];
            angle        = 0;
            gameOver     = false;
            tempoInicial = p.millis();
            tempoFinal   = 0;
            peterImg     = peterNormalImg;
            p.loop();
            return;
          }

          // destruir halteres
          for (let i = objetos.length - 1; i >= 0; i--) {
            const obj = objetos[i];
            if (obj.tipo === 'fitness' &&
                p.dist(p.mouseX, p.mouseY, obj.x, obj.y) < 40) {
              objetos.splice(i, 1);
              break;
            }
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight - 1);
          centerX = p.width / 2;
          centerY = p.height / 2;
        };
      };

      const canvas = new window.p5(sketch, sketchRef.current);
      return () => canvas.remove();
    };

    let cleanup;
    initSketch().then((c) => { cleanup = c; });
    return () => { if (cleanup) cleanup(); };
  }, []);

  return <div ref={sketchRef} />;
};

export default GameSketch;
