import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './Game.css';
import useInterval from '../../hooks/UseInterval';

export type Coordinate = {
  x: number;
  y: number;
};

export enum DirectionValue {
  DEFAULT = 'right',
  LEFT = 'left',
  UP = 'up',
  RIGHT = 'right',
  DOWN = 'down',
}

export type GameProps = {
  canvasWidth: number;
  canvasHeight: number;
  cell: number;
  speed: number;
  backgroundColour: string;
  objectColour: string;
  leftKey: string;
  upKey: string;
  rightKey: string;
  downKey: string;
};

const getInitSnake = (c: number, w: number, h: number): Coordinate[] => {
  const y = Math.floor(h / c / 2) * c;

  if (3 * c > w || y + c > h) {
    throw new Error('no enough room to init snake');
  }

  return [
    { x: 3 * c, y },
    { x: 2 * c, y },
    { x: c, y },
  ];
};

const directionReducer = (state: string, action: DirectionValue) => {
  if (action === DirectionValue.DEFAULT) {
    return action;
  }

  const opposites: string[][] = [
    [DirectionValue.LEFT, DirectionValue.RIGHT],
    [DirectionValue.UP, DirectionValue.DOWN],
  ];
  const isOpposite = opposites.some(
    (x: string[]) =>
      [state, action as string].filter((y: string) => x.includes(y)).length > 1
  );

  return isOpposite ? state : action;
};

function getSnakeCoordinate(
  current: Coordinate[],
  cell: number,
  direction: DirectionValue
): Coordinate[] {
  const m: Record<DirectionValue, Coordinate> = {
    left: { x: -1, y: 0 },
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
  };
  const tail: Coordinate[] = current.slice(0, -1);
  const head: Coordinate = {
    x: current[0].x + cell * m[direction].x,
    y: current[0].y + cell * m[direction].y,
  };

  return [head, ...tail];
}

function getRandomAppleCoordinate(
  cell: number,
  ctx: CanvasRenderingContext2D
): Coordinate {
  const { width, height } = ctx.canvas;
  return {
    x: Math.floor(Math.random() * ((width - cell) / cell)) * cell,
    y: Math.floor(Math.random() * ((height - cell) / cell)) * cell,
  };
}

function getAppleCoordinate(
  s: Coordinate[],
  cell: number,
  ctx: CanvasRenderingContext2D
): Coordinate {
  const newApple = getRandomAppleCoordinate(cell, ctx);
  return s.some((i: Coordinate) => newApple.x === i.x && newApple.y === i.y)
    ? getAppleCoordinate(s, cell, ctx)
    : newApple;
}

const ateApple = (a: Coordinate, s: Coordinate[]): boolean =>
  s[0].x === a.x && s[0].y === a.y;

const hitWall = (
  { x, y }: Coordinate,
  ctx: CanvasRenderingContext2D
): boolean => x < 0 || x > ctx.canvas.width || y < 0 || y > ctx.canvas.height;

const hitTail = (s: Coordinate[]): boolean =>
  s.slice(1).some((i: Coordinate) => i.x === s[0].x && i.y === s[0].y);

const drawRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colour: string,
  isFilled: boolean
): void => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);

  if (isFilled) {
    ctx.fillStyle = colour;
    ctx.fill();
    return;
  }

  ctx.strokeStyle = colour;
  ctx.stroke();
};

const createGameFrame = (
  ctx: CanvasRenderingContext2D,
  s: Coordinate[],
  a: Coordinate,
  cell: number,
  objectColour: string,
  backgroundColour: string
) => {
  // background
  drawRect(
    ctx,
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height,
    backgroundColour,
    true
  );

  // apple
  drawRect(ctx, a.x, a.y, cell, cell, objectColour, false);

  // snake
  s.forEach((c: Coordinate) =>
    drawRect(ctx, c.x, c.y, cell, cell, objectColour, true)
  );
};

const Game: React.FC<GameProps> = ({
  canvasWidth,
  canvasHeight,
  cell,
  speed,
  backgroundColour,
  objectColour,
  leftKey,
  upKey,
  rightKey,
  downKey,
}: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D>();

  const [score, setScore] = useState<number>(0);
  const [isPlaying, setPlaying] = useState<boolean>(false);
  const [isGameOver, setGameOver] = useState<boolean>(false);
  const keyMap = useMemo<Record<string, DirectionValue>>(
    () => ({
      [leftKey]: DirectionValue.LEFT,
      [upKey]: DirectionValue.UP,
      [rightKey]: DirectionValue.RIGHT,
      [downKey]: DirectionValue.DOWN,
    }),
    [leftKey, upKey, rightKey, downKey]
  );

  const [apple, setApple] = useState<Coordinate | null>(null);
  const [snake, setSnake] = useState<Coordinate[]>(() =>
    getInitSnake(cell, canvasWidth, canvasHeight)
  );
  const [direction, dispatchDirection] = useReducer(
    directionReducer,
    DirectionValue.DEFAULT
  );

  useInterval(
    () => {
      try {
        if (!canvasCtx) {
          throw new Error('system error');
        }

        const newSnake = getSnakeCoordinate(
          snake,
          cell,
          direction as DirectionValue
        );

        const newApple = apple || getAppleCoordinate(snake, cell, canvasCtx);
        setApple(newApple);

        createGameFrame(
          canvasCtx,
          newSnake,
          newApple,
          cell,
          objectColour,
          backgroundColour
        );

        if (hitWall(newSnake[0], canvasCtx)) {
          throw new Error('hit the wall');
        }

        if (hitTail(newSnake)) {
          throw new Error('hit the tail');
        }

        if (ateApple(newApple, snake)) {
          setApple(null);
          newSnake.push(newApple);
          setScore(score + 1);
        }

        setSnake(newSnake);
      } catch (e) {
        // eslint-disable-next-line
        console.log(e);
        setPlaying(false);
        setGameOver(true);
      }
    },
    isPlaying && canvasCtx ? speed : null
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      return;
    }

    drawRect(
      ctx,
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
      backgroundColour,
      true
    );
    setCanvasCtx(ctx);
  }, [backgroundColour]);

  useEffect(() => {
    if (isPlaying && isGameOver) {
      setSnake(getInitSnake(cell, canvasWidth, canvasHeight));
      dispatchDirection(DirectionValue.DEFAULT);
      setApple(null);
      setScore(0);
      setGameOver(false);
    }
  }, [cell, canvasWidth, canvasHeight, isPlaying, isGameOver]);

  function setKeyboardResp(
    m: Record<string, DirectionValue>
  ): ({ key }: KeyboardEvent) => void {
    return ({ key }: KeyboardEvent) => {
      if (Object.keys(m).includes(key)) {
        dispatchDirection(m[key]);
      }
    };
  }

  useEffect(() => {
    document.addEventListener('keydown', setKeyboardResp(keyMap));
    return function cleanup() {
      document.removeEventListener('keydown', setKeyboardResp(keyMap));
    };
  }, [keyMap, direction]);

  return (
    <div className="snake-game">
      <button type="button" onClick={() => setPlaying(!isPlaying)}>
        {isPlaying ? 'pause' : 'play'}
      </button>
      {!isPlaying && isGameOver && <p>Game Over</p>}
      <p>Score: {score}</p>
      <div>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      </div>
    </div>
  );
};

export default Game;
