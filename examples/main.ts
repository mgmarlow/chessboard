import { Chess } from "chess.js";
import Chessboard from "../lib/Chessboard";

document.addEventListener("DOMContentLoaded", () => {
  const chess = new Chess();
  new Chessboard("#app", {
    position: chess.fen(),
  });
});
