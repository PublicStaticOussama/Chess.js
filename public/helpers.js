
/**
 * @typedef {import('./types').IPiece} IPiece
 * @typedef {import('./types').Symbol} Symbol
 * @typedef {import('./types').Color} Color
 * @typedef {import('./types').PromotiomPiece} PromotiomPiece
 */

const one_8 = [8,7,6,5,4,3,2,1];
const a_h = ['a','b','c','d','e','f','g','h'];

/** @param {Symbol} str */
function isUpperCase(str) {
    return str === str.toUpperCase() && str !== str.toLowerCase();
}

/** @param {Symbol} str */
function isLowerCase(str) {
    return str === str.toLowerCase() && str !== str.toUpperCase();
}

/**
 * @param {Symbol} str 
 * @returns {Color | "other"}
 */
function whatColor(str) {
    if (isUpperCase(str)) return 'w';
    else if (isLowerCase(str)) return 'b';
    else return 'other';
}

/** @param {Symbol} str */
function whatCase(str) {
    if (isUpperCase(str)) return 'upper';
    else if (isLowerCase(str)) return 'lower';
    else return 'other';
}

function notation_to_coords(str) {
    if (str == '-') return [-1,-1];
    let i = 8 - (+str[1])
    let j = a_h.indexOf(str[0])
    return [i, j];
}

function coordsToNotation(i, j) {
    const y = one_8.length - i
    const x = a_h[j]

    return `${y}-${x}`
}

/**
 * 
 * @param {PromotiomPiece} id 
 * @returns {Symbol}
 */
function pieceIdToSymbol(id) {
    if (id.startsWith("popup-w")) return id.replace("popup-w", "").toUpperCase()
    else return id.replace("popup-", "")
}

function emptyMask(mask) {
    if (!mask) mask = []
    for (let i=0;i<8;i++) {
        mask[i] = [0,0,0,0,0,0,0,0];
    }
    return mask;
}

function onesMask(mask) {
    if (!mask) mask = []
    for (let i=0;i<8;i++) {
        mask[i] = [1,1,1,1,1,1,1,1];
    }
    return mask;
}

function printPosition(position) {
    for (let i=0;i<position.length;i++) {
        str = ""
        for(let j=0;j<position[0].length;j++) {
            if (position[i][j]) {
                str += position[i][j].piece.symbol + "  "
            } else {
                str += "_  "
            }
            // console.log(tmp[i][j].cls + " ")
        }
        console.log(i, str)
    }
}

function printMask(mask) {
    for (let i=0;i<mask.length;i++) {
        str = ""
        for(let j=0;j<mask[0].length;j++) {
            str += mask[i][j] + "  "
        }
        console.log(i, str)
    }
}



function* items(obj) {
    for(const k in obj) {
        yield [k, obj[k]]
    }
}

function* enumerate(arr) {
    let i = 0
    for (const el of arr) {
        yield [i, el]
        i++
    }
}

function* range(start, end, step) {
    for (let i=start;i<end;i+=step) {
        yield i
    }
}

function getAbsolutePosition(element) {
    const rect = element.getBoundingClientRect();

    const absoluteTop = rect.top + window.scrollY;
    const absoluteLeft = rect.left + window.scrollX;

    return {
        top: absoluteTop,
        left: absoluteLeft
    };
}

/**
 * 
 * @param {HTMLDivElement} oldSquare 
 * @param {HTMLDivElement} newSquare 
 */
function animatePieceMove(oldSquare, newSquare, animate=true) {
    const {top: oldTop, left: oldLeft} = getAbsolutePosition(oldSquare)
    const {top: newTop, left: newLeft} = getAbsolutePosition(newSquare)

    console.log({top: oldTop, left: oldLeft});
    console.log({top: newTop, left: newLeft});
    
    const deltaY = oldTop - newTop
    const deltaX = oldLeft - newLeft

    const piece = newSquare.querySelector("img.piece")
    const x = `calc(${deltaX}px - 50%)`
    const y = `calc(${deltaY}px - 50%)`
    piece.style.transition = "none"
    piece.style.transform = `translate(${x}, ${y})`
    console.log(piece.style.transform)
    if (animate) setTimeout(() => {
        piece.style.transition = "0.17s"
        piece.style.transform = `translate(-50%, -50%)`
    }, 0);
    return piece
}

function animate(piece) {
    setTimeout(() => {
        piece.style.transition = "0.17s"
        piece.style.transform = `translate(-50%, -50%)`
    }, 0);
}



function position_to_FEN(position_array, turn="w", black_castled_k=false, black_castled_q=false, white_castled_k=false, white_castled_q=false, en_passant_pos="-", fifty_rule_count=0, move_count=0) {
    let fen = "";
    for(const row of position_array) {
        num_empty = 0;
        num_squares = 0;
        for(const square of row) {
            // num_squares++;
            if(square) {
                if (num_empty > 0) {
                    fen += num_empty;
                    num_empty = 0
                }
                fen += square.piece.symbol;
            } else {
                num_empty++;
            }
        }
        if (num_empty) fen += num_empty;
        fen += "/";
    }
    fen = fen.slice(0, -1);
    fen_suffix_arr = []
    // turn
    fen_suffix_arr.push(turn);
    let white_castling = ""
    if (!white_castled_k) white_castling += "K"
    if (!white_castled_q) white_castling += "Q"
    if (white_castling) {
        fen_suffix_arr.push(white_castling)
    } 
    let black_castling = ""
    if (!black_castled_k) black_castling += "k"
    if (!black_castled_q) black_castling += "q"
    if (black_castling) {
        fen_suffix_arr.push(black_castling)
    }
    if (!white_castling && !black_castling) {
        fen_suffix_arr.push("-")
    }
    fen_suffix_arr.push(en_passant_pos)
    fen_suffix_arr.push(fifty_rule_count)
    fen_suffix_arr.push(move_count)
    // en passent stuff
    fen += " " + fen_suffix_arr.join(" ");
    return fen
}

function eventHandlersFactory(chessGame) {
    return {
        mouseDown: function(e) {
            e.preventDefault();
            console.log("NANDATO");
            
            if (chessGame.cursor_piece) {

                let i = 8 - (+this.id.split("-")[0])
                let j = a_h.indexOf(this.id.split("-")[1])
                let ii = 8 - (+chessGame.cursor_piece.parentNode.id.split("-")[0])
                let jj = a_h.indexOf(chessGame.cursor_piece.parentNode.id.split("-")[1])
                
                const newSquare = chessGame.position[i][j]
                const oldSquare = chessGame.position[ii][jj]
                if (newSquare && oldSquare && whatColor(newSquare.piece.symbol) == whatColor(oldSquare.piece.symbol)) {
                    $(".square").removeClass("highlited-square")
                    $(".square").removeClass("capturable-square")
                    $(".square").removeClass("protected-square")
                    chessGame.cursor_move_mask = emptyMask()
                }
            }
            if ($(this).children('.piece').length) {
                console.log("BRUUUUUZZAAAAAAAAAAA");
                chessGame.lifted_piece = $(this).children('.piece')[0];
                let i = 8 - (+this.id.split("-")[0])
                let j = a_h.indexOf(this.id.split("-")[1])
                let piece_symbol = chessGame.position[i][j].piece.symbol
                console.log(piece_symbol, whatColor(piece_symbol), "==", chessGame.turn);
                if (whatColor(piece_symbol) == chessGame.turn) {
                    console.log("this should work buddy", piece_symbol);
                    // printMask(chessGame.cursor_move_mask)
                    chessGame.updateMovePossibilities(piece_symbol, i, j, chessGame.cursor_move_mask)
                    // chessGame.updateUiByMask()
                }
                $(chessGame.lifted_piece).css({
                    transition: 'none',
                    zIndex: 9999,
                });
            }

        },
        mouseUp: function (e) {
            if(chessGame.lifted_piece) {
                // get old position and new position from UI event
                let p_i = 8 - (+chessGame.lifted_piece.parentNode.id.split("-")[0])
                let p_j = a_h.indexOf(chessGame.lifted_piece.parentNode.id.split("-")[1])
                let i = 8 - (+this.id.split("-")[0])
                let j = a_h.indexOf(this.id.split("-")[1])
                // if (!chessGame.position[i][j] || !chessGame.position[p_i][p_j] || (chessGame.position[i][j] && chessGame.position[p_i][p_j] && whatColor(chessGame.position[i][j].piece.symbol) != whatColor(chessGame.position[p_i][p_j].piece.symbol))) {
                // if ((i != ii || j != jj) && (!chessGame.position[i][j] || !chessGame.position[p_i][p_j] || (chessGame.position[i][j] && chessGame.position[p_i][p_j] && whatColor(chessGame.position[i][j].piece.symbol) != whatColor(chessGame.position[p_i][p_j].piece.symbol)))) {
                const response = chessGame.request_move(i, j, p_i, p_j)
                // printMask(chessGame.cursor_move_mask)
                if (response != 'invalid') {
                    chessGame.update_move_ui(i, j, ((response == "capture") || response.endsWith("_capture")), response)
                    console.log("RESPONSE IS:", response);
                    console.log($(".promotion-popup#black"));
                    
                    if (response == "black_promotion" || response == "black_promotion_capture") {
                        $(".overlay").css({display: "block"})
                        $(".promotion-popup#black").css({display: "flex"})
                    }
                    if (response == "white_promotion"  || response == "white_promotion_capture") {
                        $(".overlay").css({display: "block"})
                        $(".promotion-popup#white").css({display: "flex"})
                    }
                    $(".square").removeClass("highlited-square")
                    $(".square").removeClass("capturable-square")
                    $(".square").removeClass("protected-square")
                    chessGame.previous_square = null
                    chessGame.cursor_piece = null
                    chessGame.cursor_move_mask = emptyMask()
                }
                else {
                    chessGame.reject_move_ui()
                }
                // }
            }
            
        },
        mouseMove: function (e) {
            chessGame.square_hover_id = this.id;
        },
        click: function (e) {
            // console.log("**********************************", chessGame.cursor_piece);
            if (!chessGame.cursor_piece) {
                
                if ($(this).children('.piece').length) {
                    chessGame.previous_square = this
                    $(this).addClass("cursor-square");
                    chessGame.cursor_piece = $(this).children('.piece')[0];
                }
            } else {
                let i = 8 - (+this.id.split("-")[0])
                let j = a_h.indexOf(this.id.split("-")[1])
                let ii = 8 - (+chessGame.previous_square.id.split("-")[0])
                let jj = a_h.indexOf(chessGame.previous_square.id.split("-")[1])
                if (i != ii || j != jj) {
                    const newSquare = chessGame.position[i][j]
                    const oldSquare = chessGame.position[ii][jj]
                    if (newSquare && oldSquare && whatColor(newSquare.piece.symbol) == whatColor(oldSquare.piece.symbol)) {
                        chessGame.cursor_move_mask = emptyMask()
                        $(".square").removeClass("highlited-square")
                        $(".square").removeClass("capturable-square")
                        $(".square").removeClass("protected-square")
                        if (whatColor(newSquare.piece.symbol) == chessGame.turn) {
                            chessGame.updateMovePossibilities(newSquare.piece.symbol, i, j, chessGame.cursor_move_mask)
                            // chessGame.updateUiByMask()
                        }
                        chessGame.previous_square = this
                        $(this).addClass("cursor-square");
                        chessGame.cursor_piece = $(this).children('.piece')[0];
                        return
                    }
                }
                const response = chessGame.request_move(i, j, ii, jj)
                
                if (response != 'invalid') {
                    chessGame.update_move_ui(i, j, ((response == "capture") || response.endsWith("_capture")), response)
                    if (response == "black_promotion" || response == "black_promotion_capture") {
                        $(".overlay").css({display: "block"})
                        $(".promotion-popup#black").css({display: "flex"})
                    }
                    if (response == "white_promotion"  || response == "white_promotion_capture") {
                        $(".overlay").css({display: "block"})
                        $(".promotion-popup#white").css({display: "flex"})
                    }
                    chessGame.previous_square = null
                    chessGame.cursor_piece = null
                    chessGame.cursor_move_mask = emptyMask()
                }
                else {
                    chessGame.reject_move_ui()
                    chessGame.cursor_move_mask = emptyMask()
                }
                $(".square").removeClass("highlited-square")
                $(".square").removeClass("capturable-square")
                $(".square").removeClass("protected-square")



                
            }
            // // console.log("**********************************", chessGame.cursor_piece);
        },
        boardMouseMove: function (e) {
            // const coord = chessGame.tmp_piece.parentNode.id.split(',');
            if (chessGame.lifted_piece) {
                const square = chessGame.lifted_piece.parentNode
                const squareRect = square.getBoundingClientRect();
                var x = e.pageX - squareRect.left - squareRect.width + squareRect.width / 10
                var y = e.pageY - squareRect.top - squareRect.height - squareRect.height / 10
                if (e.type == "touchmove") {
                    x = e.originalEvent.touches[0].pageX - squareRect.left - squareRect.width + squareRect.width / 10
                    y = e.originalEvent.touches[0].pageY - squareRect.top - squareRect.height - squareRect.height / 10
                }
                $(chessGame.lifted_piece).css({
                    transform: `translate(${x}px,${y}px)`,
                });
                
            }
            
        }
    }
}