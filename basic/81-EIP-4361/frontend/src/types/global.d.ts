declare module "*.svg";
declare module "*.png";
declare module "*.less";
declare module "*.docx";
declare module "*.json";

interface Point {
  h: number;
  i: string;
  isBounded: boolean;
  moved: boolean;
  static: boolean;
  w: number;
  x: number;
  y: number;
}

interface PointData {
  id: string;
  item: Record<string, unknown>;
  status: string;
  point: Point;
}
