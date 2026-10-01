# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Approved
> **Depends on:** Ninguna (usa `assets/spritesheet.js` y `assets/sounds/` ya existentes)
> **Date:** 2026-10-01
> **Objective:** Un Arkanoid de un solo nivel, jugable en el navegador con teclado o mouse, con vidas, puntaje, pausa, sonidos y animación de explosión.

---

## Scope

**In:**

- Un nivel fijo de bloques de colores, paleta, bola y paredes en un canvas de 800x600.
- Movimiento de la paleta con teclado (flechas y A/D) y con mouse.
- Bola que parte sobre la paleta y se lanza con Espacio o clic.
- Rebote de la bola en la paleta según el punto de impacto, velocidad constante.
- 3 vidas, puntaje en pantalla, pausa, pantalla de game over y pantalla de victoria.
- Reinicio de la partida desde game over y victoria.
- Sonidos `ball-bounce.mp3` y `break-sound.mp3`.
- Animación de explosión al romper un bloque con `EXPLOSION_FRAMES`.

**Out of scope (para futuras specs):**

- Más de un nivel o progresión de niveles.
- Bloques gris de varios golpes (el sprite `block_gray` no se usa).
- Power-ups, láser, múltiples bolas.
- Guardar puntaje máximo entre sesiones.
- Soporte táctil y adaptación a pantallas pequeñas.
- Escalado del canvas a la ventana.
- Menú de opciones, volumen o silenciar.

## Data model

La spec no introduce persistencia. Todo el estado vive en memoria en `src/game.js`.

```js
// Constantes
const W = 800, H = 600;
const COLS = 10, ROWS = 6;
const BLOCK_W = 64, BLOCK_H = 24;      // se escalan desde 32x16
const GRID_X = 80, GRID_Y = 60;        // 80 + 10*64 + 80 = 800
const ROW_COLORS = ['red', 'yellow', 'green', 'cyan', 'magenta', 'hotpink'];
const PADDLE_W = 120, PADDLE_H = 14;   // se escala desde 162x14
const BALL_SIZE = 16;
const BALL_SPEED = 360;                // px/s
const PADDLE_SPEED = 520;              // px/s con teclado
const MAX_BOUNCE_ANGLE = 60;           // grados desde la vertical
const LIVES = 3;
const POINTS_PER_BLOCK = 10;

// Estado del juego
const state = {
  mode: 'ready',   // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  score: 0,
  lives: LIVES,
  paddle: { x, y, w: PADDLE_W, h: PADDLE_H },
  ball:   { x, y, vx, vy, size: BALL_SIZE },
  blocks: [/* { x, y, w, h, color, alive } */],
  explosions: [/* { x, y, w, h, color, elapsed } */],
};
```

Convenciones:

- Origen de coordenadas arriba a la izquierda.
- Velocidades en píxeles por segundo, el avance usa `dt` entre frames (`requestAnimationFrame`).
- `dt` se limita a 50 ms para no atravesar bloques tras cambiar de pestaña.
- Teclas: `ArrowLeft`/`A` y `ArrowRight`/`D` mueven; `Space` lanza; `P` o `Escape` pausa; `Enter` reinicia en `gameover` y `won`.

## Implementation plan

1. Crear `index.html` con un `<canvas id="game" width="800" height="600">`, el enlace a `style.css` y los `<script>` de `assets/spritesheet.js` y `src/game.js`. Crear `style.css` que centra el canvas con fondo oscuro, y `src/game.js` que llama a `loadSpritesheet` y pinta el fondo. Prueba manual: abrir `index.html` y ver el canvas vacío sin errores en consola.
2. En `src/game.js`, crear el loop con `requestAnimationFrame` y `dt`, y dibujar la paleta con `drawSprite`. Prueba manual: se ve la paleta abajo.
3. Agregar entrada de teclado y mouse que mueva la paleta, limitada a los bordes del canvas. Prueba manual: se mueve con flechas, A/D y mouse sin salirse.
4. Generar los 60 bloques desde `ROW_COLORS` y dibujarlos. Prueba manual: se ven 6 filas de 10 bloques.
5. Dibujar la bola sobre la paleta en modo `ready` (sigue a la paleta) y lanzarla con Espacio o clic con un ángulo inicial hacia arriba. Prueba manual: la bola sale al lanzar.
6. Rebote en paredes izquierda, derecha y techo, y rebote en la paleta con ángulo según el punto de impacto. Prueba manual: la bola rebota y el borde de la paleta la desvía más que el centro.
7. Colisión bola-bloque con resolución por menor solapamiento, que marca el bloque como roto e invierte la velocidad en ese eje. Prueba manual: los bloques desaparecen al golpearlos.
8. Puntaje y vidas: sumar 10 por bloque, dibujar puntaje y vidas en el HUD, y restar una vida cuando la bola cae por abajo (la bola vuelve a `ready`). Prueba manual: el HUD cambia.
9. Estados `gameover` (0 vidas) y `won` (0 bloques vivos) con texto centrado y reinicio con `Enter`. Prueba manual: se llega a ambas pantallas y `Enter` reinicia con 3 vidas, puntaje 0 y bloques completos.
10. Pausa con `P` o `Escape` en modo `playing`, con texto "PAUSA". Prueba manual: la bola se congela y se reanuda con la misma tecla.
11. Sonidos: `ball-bounce.mp3` en rebote contra pared o paleta y `break-sound.mp3` al romper un bloque, clonando el `Audio` para permitir solapes. Prueba manual: suenan tras el primer lanzamiento.
12. Animación de explosión: al romper un bloque, crear una entrada en `state.explosions` y dibujar el frame de `EXPLOSION_FRAMES[color]` según `elapsed / EXPLOSION_DURATION`, quitándola al terminar. Prueba manual: se ve la animación en el lugar del bloque.

## Acceptance criteria

- [ ] Abrir `index.html` con doble clic muestra el juego sin errores en la consola.
- [ ] El canvas mide 800x600 y está centrado en la ventana.
- [ ] Se ven 60 bloques en 6 filas de 10, con los colores de `ROW_COLORS` y sin usar `block_gray`.
- [ ] La paleta se mueve con flechas, A/D y mouse, y nunca sale del canvas.
- [ ] Al inicio y tras perder una vida, la bola está sobre la paleta y la sigue hasta que se pulsa Espacio o clic.
- [ ] La bola rebota en las paredes laterales y el techo.
- [ ] Pegar en el borde izquierdo de la paleta lanza la bola hacia la izquierda y en el borde derecho hacia la derecha.
- [ ] La velocidad de la bola es constante (360 px/s) en todo momento.
- [ ] Romper un bloque suma exactamente 10 puntos y el bloque desaparece.
- [ ] La bola que cae por abajo resta una vida y se muestra el contador actualizado.
- [ ] Con 0 vidas aparece "GAME OVER" y `Enter` reinicia con 3 vidas, puntaje 0 y los 60 bloques.
- [ ] Al romper los 60 bloques aparece el mensaje de victoria y `Enter` reinicia la partida.
- [ ] `P` o `Escape` pausa y reanuda; en pausa la bola no se mueve.
- [ ] `ball-bounce.mp3` suena en cada rebote contra pared o paleta y `break-sound.mp3` al romper un bloque.
- [ ] Al romper un bloque se reproduce su animación de explosión de 4 frames y desaparece al terminar.
- [ ] La repo sigue sin dependencias externas ni paso de build.

## Decisions

- **Sí:** `index.html` + `style.css` + `src/game.js` sin módulos ES. `assets/spritesheet.js` ya es script global y así el juego funciona abriendo el archivo directo, sin servidor.
- **No:** varios scripts o inline en `index.html`. Un solo archivo de juego basta para un MVP y los demás archivos se pueden extraer en specs futuras.
- **Sí:** teclado y mouse a la vez. Cuesta pocas líneas y cubre ambas preferencias.
- **Sí:** un solo nivel fijo. Los niveles necesitan formato y progresión, y merecen su propia spec.
- **Sí:** rebote en paleta según punto de impacto con velocidad constante. Da control al jugador y evita bucles predecibles.
- **No:** rebote especular simple en la paleta. Hace el juego monótono.
- **Sí:** movimiento con `dt` en px/s. Mantiene la misma velocidad en monitores de 60 y 144 Hz.
- **Sí:** canvas fijo 800x600. Evita lógica de redimensionado; el escalado queda para otra spec.
- **No:** bloques gris de varios golpes. Requieren HP por bloque; el sprite gris queda sin usar.
- **Sí:** estado inicial `ready` con la bola sobre la paleta en lugar de una pantalla de título separada. Un solo gesto (Espacio o clic) inicia la partida.
- **Sí:** valores numéricos de las constantes (grilla 10x6, 360 px/s, 120 px de paleta, 10 puntos). Son valores iniciales de ajuste y se pueden cambiar sin tocar el diseño.
- **No:** guardar puntaje entre sesiones. Evita decidir clave y versionado de `localStorage` en el MVP.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| El navegador bloquea el audio hasta que hay un gesto del usuario | Los sonidos solo se disparan tras el lanzamiento, que ya es un gesto (Espacio o clic). |
| La bola atraviesa un bloque o la paleta a velocidad alta o con `dt` grande | Limitar `dt` a 50 ms; a 360 px/s eso son 18 px por frame, menos que el tamaño de bola y bloque. |
| `EXPLOSION_DURATION` podría no estar en milisegundos | Verificarlo en `assets/spritesheet.js` en el paso 12 y ajustar el cálculo del frame. |
| Dos rebotes en el mismo frame con una esquina de bloque | Resolver solo la colisión de menor solapamiento por frame y procesar un bloque por frame. |

## What is **not** in this spec

- Más niveles y progresión.
- Bloques de varios golpes (gris).
- Power-ups.
- Puntaje máximo persistente.
- Soporte táctil o móvil.
- Canvas escalable o responsive.
- Menú de opciones y control de volumen.

Cada uno de esos puntos, si llega, va en su propia spec.
