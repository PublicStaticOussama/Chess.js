export type Symbol = "p" | "r" | "n" | "b" | "q" | "K" | "P" | "R" | "N" | "B" | "Q" | "K"

export type PromotiomPiece = "popup-b" | "popup-n" | "popup-r" | "popup-q" | "popup-wb" | "popup-wn" | "popup-wr" | "popup-wq"

export type Color = "w" | "b"

export interface IPiece {
    _id: string
    x: number
    y: number
    symbol: Symbol
}

export interface ISquare {
    piece: IPiece
    src?: string
}

export type Id2Piece = {
    [key: string]: IPiece;
}
