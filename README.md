# Arkanoid

Un clon de Arkanoid/Breakout hecho con **HTML, CSS y JavaScript puro**. Sin dependencias, sin build y sin servidor: se juega abriendo un archivo.

## Cómo jugar

1. Abre `index.html` en tu navegador (doble clic).
2. Mueve la paleta, pulsa **Espacio** o haz **clic** para lanzar la bola.
3. Rompe los 60 bloques sin perder las 3 vidas.

## Controles

| Acción | Teclado / Mouse |
| ------ | --------------- |
| Mover la paleta | `←` `→` o `A` `D` / mover el mouse |
| Lanzar la bola | `Espacio` o clic |
| Pausar / reanudar | `P` o `Esc` |
| Activar / desactivar sonido (en pausa) | `S` o `M`, o clic en el botón de sonido |
| Reiniciar (en Game Over o Victoria) | `Enter` |

## Reglas

- Cada bloque roto suma **10 puntos**.
- Empiezas con **3 vidas**; pierdes una cuando la bola cae por debajo de la paleta.
- El punto de impacto en la paleta define el ángulo de rebote: los bordes desvían la bola más que el centro (hasta 60°). La velocidad es constante.
- Ganas al romper todos los bloques. Con 0 vidas, es Game Over.
- La preferencia de sonido se guarda en `localStorage`.

## Estructura del proyecto

```
├── index.html            Página con el canvas de 800x600
├── style.css             Estilos (canvas centrado)
├── src/game.js           Lógica del juego: estado, loop, colisiones y dibujo
├── assets/
│   ├── spritesheet.js    Helper de sprites (loadSpritesheet, drawSprite, drawFrame)
│   ├── spritesheet-breakout.png
│   └── sounds/           ball-bounce.mp3, break-sound.mp3
└── specs/                Especificaciones de diseño (SPEC 01: MVP jugable)
```

Los scripts son globales (sin módulos ES), por eso el juego funciona directamente desde `file://`.

## Personalización

Las constantes al inicio de `src/game.js` permiten ajustar el juego sin tocar la lógica: `BALL_SPEED`, `PADDLE_W`, `PADDLE_SPEED`, `LIVES`, `POINTS_PER_BLOCK`, `MAX_BOUNCE_ANGLE`, `ROWS`/`COLS` y `ROW_COLORS`.

## Fuera de alcance (por ahora)

Un solo nivel fijo; sin power-ups, bloques de varios golpes, puntaje máximo persistente, soporte táctil ni canvas adaptable. Cada uno iría en su propia spec dentro de `specs/`.
