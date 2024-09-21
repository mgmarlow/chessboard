import {
  h,
  init,
  styleModule,
  propsModule,
  eventListenersModule,
  VNode,
} from "snabbdom";
import bb from "./img/cburnett/bb.svg";
import bw from "./img/cburnett/wb.svg";
import kb from "./img/cburnett/bk.svg";
import kw from "./img/cburnett/wk.svg";
import nb from "./img/cburnett/bn.svg";
import nw from "./img/cburnett/wn.svg";
import pb from "./img/cburnett/bp.svg";
import pw from "./img/cburnett/wp.svg";
import qb from "./img/cburnett/bq.svg";
import qw from "./img/cburnett/wq.svg";
import rb from "./img/cburnett/br.svg";
import rw from "./img/cburnett/wr.svg";

let vnode: VNode;

const patch = init([styleModule, propsModule, eventListenersModule]);

const isObject = (value: any) =>
  value != null && (typeof value == "object" || typeof value == "function");

const classnames = (...args: (string | Record<string, boolean>)[]) => {
  let classes = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] && typeof args[i] === "string") {
      classes += args[i];
    } else if (isObject(args[i])) {
      Object.entries(args[i]).forEach(([key, value]) => {
        if (value) {
          classes += key;
        }
      });
    }
  }

  return classes;
};

const WHITE_PIECES = ["P", "N", "B", "R", "Q", "K"];
const BLACK_PIECES = ["p", "n", "b", "r", "q", "k"];

type WhitePieceSymbol = "p" | "n" | "b" | "r" | "q" | "k";
type BlackPieceSymbol = "P" | "N" | "B" | "R" | "Q" | "K";
export type PieceSymbol = WhitePieceSymbol | BlackPieceSymbol;
type MaybePieceSymbol = PieceSymbol | ".";

const isWhitePiece = (token: string): token is WhitePieceSymbol =>
  WHITE_PIECES.includes(token);
const isBlackPiece = (token: string): token is BlackPieceSymbol =>
  BLACK_PIECES.includes(token);
const isPiece = (token: string): token is PieceSymbol =>
  isWhitePiece(token) || isBlackPiece(token);

type Color = "w" | "b";

const squares = (fen: string): MaybePieceSymbol[][] => {
  const [board] = fen.split(" ");
  const squares: MaybePieceSymbol[][] = [];

  let row: MaybePieceSymbol[] = [];
  for (let i = 0; i < board.length; i++) {
    const token = board[i];
    if (token === "/") {
      squares.push(row);
      row = [];
      continue;
    }

    if (isPiece(token)) {
      row.push(token);
      continue;
    }

    const n = parseInt(token);
    if (isNaN(n)) {
      throw new Error("invalid FEN: expecting integer");
    }
    for (let j = 0; j < n; j++) {
      row.push(".");
    }
  }

  // Flush final row
  squares.push(row);

  return squares;
};

const img = (type: PieceSymbol) => {
  switch (type) {
    case "P":
      return pw;
    case "p":
      return pb;
    case "N":
      return nw;
    case "n":
      return nb;
    case "B":
      return bw;
    case "b":
      return bb;
    case "R":
      return rw;
    case "r":
      return rb;
    case "Q":
      return qw;
    case "q":
      return qb;
    case "K":
      return kw;
    case "k":
      return kb;
  }
};

// TODO:
// const hPromotion = (ctrl: Ctrl) => {
//   const options: PieceSymbol[] = ["N", "B", "R", "Q"];

//   const contents = options.map((piece) =>
//     h("button.promote", { on: { click: () => ctrl.handlePromote(piece) } }, [
//       h("img", { props: { src: img(piece) } }),
//     ]),
//   );

//   return h("div.promotions", {}, [h("p", "Promote to:"), ...contents]);
// };

const hSquare = (
  square: string,
  piece: MaybePieceSymbol,
  bg: Color,
  {
    onMousedown,
    onMouseup,
    onClick,
  }: {
    onMousedown: (sq: string) => void;
    onMouseup: (sq: string) => void;
    onClick: (sq: string, piece: MaybePieceSymbol) => void;
  },
) => {
  const contents = isPiece(piece)
    ? [
        h("img", {
          props: { src: img(piece) },
          on: {
            // Avoid image drag.
            mousedown: (evt) => {
              evt.preventDefault();
            },
          },
        }),
      ]
    : undefined;

  const classes = classnames(`div#${square}`, ".square", `.${bg}`);

  return h(
    classes,
    {
      style: {
        display: "inline-block",
        webkitUserSelect: "none",
        userSelect: "none",
        width: "64px",
        height: "64px",
        backgroundColor: bg === "w" ? "#f0d9b5" : "#b58863",
      },
      on: {
        click: (_evt) => {
          onClick(square, piece);
        },
        mousedown: (evt) => {
          evt.preventDefault();
          onMousedown(square);
        },
        mouseup: (evt) => {
          evt.preventDefault();
          onMouseup(square);
        },
      },
    },
    contents,
  );
};

// prettier-ignore
const SQUARES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
]

const hBoard = (board: Chessboard) => {
  const allSquares = squares(board.position);

  if (board.orientation === "b") {
    allSquares.reverse();
  }

  const handleMousedown = (sq: string) => {
    const result = board.fireOnDragStart(sq);

    if (result !== false) {
      board.dragging = sq;
    }
  };

  const handleMouseup = (sq: string) => {
    if (board.dragging) {
      board.fireOnDrop(board.dragging, sq);
    }

    board.dragging = undefined;
  };

  return h(
    "div.board",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gridTemplateRows: "auto",
        columnGap: "0",
        maxWidth: "512px",
      },
    },
    allSquares.flatMap((rank, ri) => {
      if (board.orientation === "b") {
        rank.reverse();
      }

      return rank.map((piece, fi) => {
        const bg = (ri + fi) % 2 === 0 ? "w" : "b";
        const squareIndex =
          board.orientation === "w" ? ri * 8 + fi : (7 - ri) * 8 + (7 - fi);
        const square = SQUARES[squareIndex];
        return hSquare(square, piece, bg, {
          onMousedown: handleMousedown,
          onMouseup: handleMouseup,
          onClick: board.fireOnClick,
        });
      });
    }),
  );
};

const view = (ctrl: Chessboard) => hBoard(ctrl);

interface Options {
  position: string;
  orientation?: Color;
  onClick?: (sq: string, piece: PieceSymbol | undefined) => void;
  onDragStart?: (sq: string) => boolean;
  onDragEnd?: () => void;
  onDrop?: (from: string, to: string) => void;
}

export default class Chessboard {
  public orientation: Color;
  public dragging?: string;

  private _position: string;

  constructor(
    id: string | HTMLDivElement,
    private options: Options,
  ) {
    const container =
      typeof id === "string" ? document.querySelector<HTMLDivElement>(id)! : id;
    this._position = this.options.position;
    this.orientation = this.options.orientation || "w";
    vnode = patch(container, view(this));
    window.addEventListener("mouseup", this.fireOnDragEnd);
  }

  cleanup() {
    window.removeEventListener("mouseup", this.fireOnDragEnd);
  }

  render() {
    vnode = patch(vnode, view(this));
  }

  get position(): string {
    return this._position;
  }

  set position(fen: string) {
    this._position = fen;
    this.render();
  }

  fireOnClick = (sq: string, piece: MaybePieceSymbol) => {
    this.options.onClick?.(sq, isPiece(piece) ? piece : undefined);
  }

  fireOnDragStart = (sq: string): boolean | undefined => {
    return this.options.onDragStart?.(sq);
  }

  fireOnDragEnd = () => {
    this.options.onDragEnd?.();
  }

  fireOnDrop(from: string, to: string) {
    this.options.onDrop?.(from, to);
  }
}
