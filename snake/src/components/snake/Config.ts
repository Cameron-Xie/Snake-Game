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
