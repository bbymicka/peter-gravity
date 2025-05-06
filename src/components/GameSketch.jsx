import React, { useRef, useEffect } from 'react';

const GameSketch = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const initSketch = async () => {
      const sketch = (p) => {
        let centerX, centerY;
        let angle = 0;
        const orbitRadius = 220;
        let objetos = [];
        let massaPeter = 100;
        const massaMaxima = 100;
        let gameOver = false;
        let tempoInicial = 0;
        let tempoFinal = 0;

        let peterImg, peterNormalImg, peterDorImg, bgImg, tvImg, imgComida, imgFitness, gameOverImg;
        let crySound, gameOverSound;
        let started = false;
        let soundsLoaded = false;

        const mostrarPeterComDor = () => {
          peterImg = peterDorImg;
          if (crySound && crySound.isLoaded() && !crySound.isPlaying()) crySound.play();
          setTimeout(() => { peterImg = peterNormalImg; }, 500);
        };

        class Objeto {
          constructor(x, y, tipo) {
            this.x = x;
            this.y = y;
            this.tipo = tipo;
            this.raio = 20;
          }
          update() {
            const dx = centerX - this.x;
            const dy = centerY - this.y;
            const dist = Math.hypot(dx, dy);
            const velocidade = 2;
            this.x += (dx / dist) * velocidade;
            this.y += (dy / dist) * velocidade;
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

        p.setup = async () => {
          p.createCanvas(p.windowWidth, p.windowHeight - 1);
          centerX      = p.width / 2;
          centerY      = p.height / 2;
          tempoInicial = p.millis();

          try {
            peterNormalImg = await p.loadImage('/peter_normal.png');
            peterDorImg    = await p.loadImage('/peter_dor.png');
            peterImg       = peterNormalImg;
            bgImg          = await p.loadImage('/background.jpg');
            tvImg          = await p.loadImage('/tv.png');
            imgComida      = await p.loadImage('/food.png');
            imgFitness     = await p.loadImage('/dumbbell.png');
            gameOverImg    = await p.loadImage('/game_over.png');
          } catch (error) {
            console.error('Erro ao carregar imagens:', error);
          }
        };

        p.draw = () => {
          if (!started) {
            p.background(30);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(32);
            p.text('CLIQUE PARA INICIAR', p.width / 2, p.height / 2);
            return;
          }

          if (gameOver) {
            p.background(0, 150);
            p.imageMode(p.CENTER);
            if (gameOverImg) p.image(gameOverImg, p.width / 2, p.height / 2, 500, 300);
            p.fill(255);
            p.textSize(32);
            p.textAlign(p.CENTER, p.TOP);
            p.text(`Tempo de jogo: ${(tempoFinal / 1000).toFixed(1)}s`, p.width / 2, p.height / 2 + 180);
            p.noLoop();
            return;
          }

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

          if (p.random(1) < 0.01) {
            const side = p.floor(p.random(4));
            let x, y;
            if (side === 0)      { x = p.random(p.width); y = 0; }
            else if (side === 1) { x = p.width; y = p.random(p.height); }
            else if (side === 2) { x = p.random(p.width); y = p.height; }
            else                 { x = 0; y = p.random(p.height); }
            const tipo = p.random() < 0.5 ? 'comida' : 'fitness';
            objetos.push(new Objeto(x, y, tipo));
          }

          for (let i = objetos.length - 1; i >= 0; i--) {
            objetos[i].update();
            objetos[i].display();
            const d = p.dist(objetos[i].x, objetos[i].y, centerX, centerY);
            if (d < 160) {
              if (objetos[i].tipo === 'comida') {
                massaPeter += 5;
              } else {
                massaPeter -= 25;
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
          p.rect(barraX, barraY, p.map(massaPeter, 0, massaMaxima, 0, barraW), barraH);
          p.fill(255);
          p.textSize(14);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(`Massa: ${massaPeter}`, barraX + 5, barraY + barraH / 2);

          if (massaPeter <= 0 && !gameOver) {
            gameOver   = true;
            tempoFinal = p.millis() - tempoInicial;
            if (gameOverSound && gameOverSound.isLoaded()) gameOverSound.play();
          }
        };

        p.mousePressed = () => {
          if (!started) {
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

          if (gameOver) {
            massaPeter   = 100;
            objetos      = [];
            angle        = 0;
            gameOver     = false;
            tempoInicial = p.millis();
            tempoFinal   = 0;
            peterImg     = peterNormalImg;
            p.loop();
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
