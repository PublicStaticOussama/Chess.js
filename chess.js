const one_8 = [8,7,6,5,4,3,2,1];
const a_h = ['a','b','c','d','e','f','g','h'];

function isUpperCase(str) {
    return str === str.toUpperCase() && str !== str.toLowerCase();
}
function isLowerCase(str) {
    return str === str.toLowerCase() && str !== str.toUpperCase();
}

function whatColor(str) {
    if (isUpperCase(str)) return 'w';
    else if (isLowerCase(str)) return 'b';
    else return 'other';
}

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

$(document).ready(function () {
    const globals = {
        lifted_piece: null,
        cursor_piece: null,
        previous_square: null,
        square_hover_id: '',
        fifty_rule_count: 0,
        move_count: 0,
        position: [],
        cursor_move_mask: [],
        cursor_pins_mask: emptyMask(),
        cursor_check_mask: emptyMask(),
        cursor_king_mask: emptyMask(),
        turn: 'w',
        perspective: 'w',
        black_castled_k: false,
        black_castled_q: false,
        white_castled_k: false,
        white_castled_q: false,
        en_passant_pos: "-",
        white_pieces: [],
        black_pieces: [],
        captured_black: [],
        captured_white: [],
    };
    const imgs = {
        w_b: 'https://i.postimg.cc/Kvm1WtZm/w-b.png',
        w_p: 'https://i.postimg.cc/8CfcvHbm/w-p.png',
        w_q: 'https://i.postimg.cc/76gLsZdC/w-q.png',
        w_r: 'https://i.postimg.cc/kGqgkdPT/w-r.png',
        w_n: 'https://i.postimg.cc/bwBddM1v/w-n.png',
        w_k: 'https://i.postimg.cc/Vk6df1rT/w-k.png',
        _q: 'https://i.postimg.cc/fyfJLRv4/q.png',
        _p: 'https://i.postimg.cc/W1bJdgK5/p.png',
        _n: 'https://i.postimg.cc/nhR9BMfp/n.png',
        _k: 'https://i.postimg.cc/MZVBNWVm/k.png',
        _b: 'https://i.postimg.cc/LXZPHS7R/b.png',
        _r: 'https://i.postimg.cc/2jQqT0NH/r.png',
    }
    const board = document.querySelector('.board');
    for (let i=0;i<8;i++) {
        globals.position[i] = [null,null,null,null,null,null,null,null];
        globals.cursor_move_mask[i] = [0,0,0,0,0,0,0,0];
    }

    function renderBoard(position, perspective) {
        let i = 0;
        $(".square").remove()
        for (let c_i=0;c_i<8;c_i++) {
            if (perspective == 'w') i = c_i;
            else if (perspective == 'b') i = 7-c_i;
            let j = 0
            for (let c_j=0;c_j<8;c_j++) {
                if (perspective == 'w') j = c_j;
                else if (perspective == 'b') j = 7-c_j;
                // if (position[i][j]) $('.chess--'+position[i][j].cls).remove()
                const square = document.createElement('div');
                square.id = `${one_8[i]}-${a_h[j]}`;
                square.classList.add('square');
                $(square).css({
                    width: `min(10.868vh,10.868vw)`,
                    height: `min(10.868vh,10.868vw)`,
                    backgroundColor: ((j+i)%2==0)?'#EEEED2':'#769656',
                });
                if(c_j==0) {
                    const num = document.createElement('div');
                    num.classList.add('coord');
                    num.innerHTML = one_8[i];
                    $(num).css({
                        left: '4px',
                        top: '5px',
                        color: ((j+i)%2==0)?'#769656':'#EEEED2',
                    });
                    square.appendChild(num);
                }
                if(c_i==7) {
                    const num = document.createElement('div');
                    num.classList.add('coord');
                    num.innerHTML = a_h[j];
                    $(num).css({
                        bottom: '4px',
                        right: '5px',
                        color: ((j+i)%2==0)?'#769656':'#EEEED2',
                    });
                    square.appendChild(num);
                }
                if(position[i][j]) {
                    const piece = document.createElement('img');
                    piece.src = position[i][j].src;
                    piece.classList.add('piece');
                    piece.classList.add('chess--'+position[i][j].cls);
                    square.appendChild(piece);
                }
                board.appendChild(square)
            }
        }
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
                    fen += square.cls;
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

    function printPosition(position) {
        for (let i=0;i<position.length;i++) {
            str = ""
            for(let j=0;j<position[0].length;j++) {
                if (position[i][j]) {
                    str += position[i][j].cls + "  "
                } else {
                    str += "_  "
                }
                // console.log(tmp[i][j].cls + " ")
            }
            console.log(str)
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

    function setValidSquare(piece_symbol, i, j, mask=globals.cursor_move_mask, mask_condition) {
        let id = one_8[i] + "-" + a_h[j]
        console.log("=-->", i, j);
        if (globals.position[i][j]) {
            if (whatColor(globals.position[i][j].cls) != whatColor(piece_symbol)) {
                if (mask_condition) {
                    mask[i][j] = 2
                    $(`#${id}`).addClass("capturable-square")
                }
            } else {
                mask[i][j] = 1.5
                $(`#${id}`).addClass("protected-square")
                console.log(">---->", i, j);
            }
            return false
        } else {
            if (mask_condition) {
                mask[i][j] = 1
                $(`#${id}`).addClass("highlited-square")
            }
        }
        return true
    }

    function updatePawnMoveMask(piece_symbol, i, j, mask) {
        let en_passant_coords = notation_to_coords(globals.en_passant_pos)
        updatePinsMask(piece_symbol, i, j, globals.cursor_pins_mask)
        updateCheckMask(piece_symbol, globals.cursor_check_mask)
        // en passant
        // printMask(globals.cursor_check_mask)
        
        // moves
        let i_1 = isUpperCase(piece_symbol) ? i - 1 : i + 1
        let pin_condition = globals.cursor_pins_mask[i_1][j] == 1
        let check_condition = globals.cursor_check_mask[i_1][j] == 1
        console.log("=============== pin condition ===============>", pin_condition, check_condition);
        let one_up_condition = isUpperCase(piece_symbol) ? i_1 >= 0 : i_1 < globals.position.length
        // console.log(i_1, one_up_condition);
        if (one_up_condition) { 
            let sqr_piece = globals.position[i_1][j]
            if (!sqr_piece && pin_condition && check_condition) {
                mask[i_1][j] = mask[i_1][j] == 0 ? 0.5 : mask[i_1][j]
                let id = one_8[i_1] + "-" + a_h[j]
                $(`#${id}`).addClass("highlited-square")
            }
        }
        let rank_condition = isUpperCase(piece_symbol) ? i == globals.position.length - 2 : i == 1
        let i_2 = isUpperCase(piece_symbol) ? i - 2 : i + 2
        pin_condition = globals.cursor_pins_mask[i_2][j] == 1
        check_condition = globals.cursor_check_mask[i_2][j] == 1
        console.log("=============== pin condition ===============>", pin_condition);
        let two_up_condition = isUpperCase(piece_symbol) ? i_2 >= 0 : i_2 < globals.position.length
        if (rank_condition) { // initial rank
            if (two_up_condition) {
                let sqr_piece = globals.position[i_2][j]
                if (!sqr_piece && pin_condition && check_condition) {
                    mask[i_2][j] = mask[i_2][j] == 0 ? 0.5 : mask[i_2][j]
                    let id = one_8[i_2] + "-" + a_h[j]
                    $(`#${id}`).addClass("highlited-square")
                }
            }
        }
        // captures
        if (one_up_condition) {
            if (j - 1 >= 0) {
                let sqr_piece = globals.position[i_1][j - 1]
                pin_condition = globals.cursor_pins_mask[i_1][j - 1] == 1
                check_condition = globals.cursor_check_mask[i_1][j - 1] == 1
                if ((sqr_piece || (i_1 == en_passant_coords[0] && j - 1 == en_passant_coords[1]))) {
                    let id = one_8[i_1] + "-" + a_h[j - 1]
                    console.log("=============== pin condition ===============>", pin_condition);
                    if (whatColor(sqr_piece.cls) != whatColor(piece_symbol)) {
                        if (pin_condition && check_condition) {
                            mask[i_1][j - 1] = 2 
                            $(`#${id}`).addClass("capturable-square")
                        }
                    } else {
                        mask[i_1][j - 1] = 1.5
                        $(`#${id}`).addClass("protected-square")
                    }
                }
            }
            if (j + 1 < globals.position[0].length) {
                let sqr_piece = globals.position[i_1][j + 1]
                pin_condition = globals.cursor_pins_mask[i_1][j + 1] == 1
                check_condition = globals.cursor_check_mask[i_1][j + 1] == 1
                if ((sqr_piece || (i_1 == en_passant_coords[0] && j - 1 == en_passant_coords[1]))) {
                    let id = one_8[i_1] + "-" + a_h[j + 1]
                    console.log("=============== pin condition ===============>", pin_condition);
                    if (whatColor(sqr_piece.cls) != whatColor(piece_symbol)) {
                        if (pin_condition && check_condition) {
                            mask[i_1][j + 1] = 2
                            $(`#${id}`).addClass("capturable-square")
                        }
                    } else {
                        mask[i_1][j + 1] = 1.5
                        $(`#${id}`).addClass("protected-square")
                    }
                }
            }
        }
    }

    function updateKingMoveMask(piece_symbol, i, j, mask, deep=true) {
        const color = whatColor(piece_symbol)
        const enemy_pieces = color == "w" ? globals.black_pieces : globals.white_pieces
        if (deep) {
            printMask(globals.cursor_king_mask)
            overlapMasks(enemy_pieces, globals.cursor_king_mask)
            printMask(globals.cursor_king_mask)
        }
        let i_1 = i - 1
        let i_2 = i + 1
        let j_1 = j - 1
        let j_2 = j + 1
        let i_arr = [i, i_1, i_2]
        let j_arr = [j_1, j, j_2]
        for (let x=0;x<3;x++) {
            for (let y=0;y<3;y++) {
                console.log(i_arr[x], j_arr[y]);
                if ((i_arr[x] != i || j_arr[y] != j) && i_arr[x] >= 0 && i_arr[x] < globals.position.length && j_arr[y] >= 0 && j_arr[y] < globals.position[0].length) {
                    let condition = deep ? globals.cursor_king_mask[i_arr[x]][j_arr[y]] < 1 : true
                    setValidSquare(piece_symbol, i_arr[x], j_arr[y], mask, condition)
                }
            }
        }
        // castling
    }

    function updateKnightMoveMask(piece_symbol, i, j, mask) {
        updatePinsMask(piece_symbol, i, j, globals.cursor_pins_mask)
        updateCheckMask(piece_symbol, globals.cursor_check_mask)
        // printMask(globals.cursor_pins_mask)
        let i_arr = [i - 2, i - 1, i + 1, i + 2]
        let j_arr = [j - 2, j - 1, j + 1, j + 2]
        for (let x=0;x<4;x++) {
            for (let y=0;y<4;y++) {
                if ((Math.abs(i_arr[x] - i) + Math.abs(j_arr[y] - j) == 3) && i_arr[x] >= 0 && i_arr[x] < globals.position.length && j_arr[y] >= 0 && j_arr[y] < globals.position[0].length) {
                    // if (globals.cursor_pins_mask[i_arr[x]][j_arr[y]] == 1 && globals.cursor_check_mask[i_arr[x]][j_arr[y]] == 1)
                    let mask_condition = globals.cursor_pins_mask[i_arr[x]][j_arr[y]] == 1 && globals.cursor_check_mask[i_arr[x]][j_arr[y]] == 1
                    setValidSquare(piece_symbol, i_arr[x], j_arr[y], mask, mask_condition)
                }
            }
        }
    }

    function updateBishopMoveMask(piece_symbol, i, j, mask) {
        updatePinsMask(piece_symbol, i, j, globals.cursor_pins_mask)
        updateCheckMask(piece_symbol, globals.cursor_check_mask)
        // printMask(globals.cursor_pins_mask)
        let width = globals.position[0].length
        let height = globals.position.length
        for (let ij=1;(i + ij < height && j + ij < width);ij++) {
            let i_1 = i + ij
            let j_1 = j + ij
            let mask_condition = globals.cursor_pins_mask[i_1][j_1] == 1 && globals.cursor_check_mask[i_1][j_1] == 1
            let breakk = !setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            console.log(breakk);
            if (breakk) {
                break;
            }
        }
        for (let ij=1;(i - ij >= 0 && j - ij >= 0);ij++) {
            let i_1 = i - ij
            let j_1 = j - ij
            let mask_condition = globals.cursor_pins_mask[i_1][j_1] == 1 && globals.cursor_check_mask[i_1][j_1] == 1
            let breakk = !setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            console.log(breakk);
            if (breakk) {
                break;
            }
        }
        for (let ij=1;(i + ij < height && j - ij >= 0);ij++) {
            let i_1 = i + ij
            let j_1 = j - ij
            let mask_condition = globals.cursor_pins_mask[i_1][j_1] == 1 && globals.cursor_check_mask[i_1][j_1] == 1
            let breakk = !setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            console.log(breakk);
            if (breakk) {
                break;
            }
        }
        for (let ij=1;(i - ij >= 0 && j + ij < width);ij++) {
            let i_1 = i - ij
            let j_1 = j + ij
            let mask_condition = globals.cursor_pins_mask[i_1][j_1] == 1 && globals.cursor_check_mask[i_1][j_1] == 1
            let breakk = !setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            console.log(breakk);
            if (breakk) {
                break;
            }
        }
    }

    function updateRookMoveMask(piece_symbol, i, j, mask) {
        updatePinsMask(piece_symbol, i, j, globals.cursor_pins_mask)
        updateCheckMask(piece_symbol, globals.cursor_check_mask)
        // printMask(globals.cursor_pins_mask)
        let width = globals.position[0].length
        let height = globals.position.length
        for (let x=i;x<height;x++) {
            if (x != i) {
                let condition = globals.cursor_pins_mask[x][j] == 1 && globals.cursor_check_mask[x][j] == 1 
                let breakk = !setValidSquare(piece_symbol, x, j, mask, condition)
                console.log(breakk);
                if (breakk) {
                    break;
                }
            }
        }
        for (let x=i;x>=0;x--) {
            if (x != i) {
                let condition = globals.cursor_pins_mask[x][j] == 1 && globals.cursor_check_mask[x][j] == 1
                let breakk = !setValidSquare(piece_symbol, x, j, mask, condition)
                console.log(breakk);
                if (breakk) {
                    break;
                }
            }
        }
        for (let y=j;y<width;y++) {
            if (y != j) {
                let condition = globals.cursor_pins_mask[i][y] == 1 && globals.cursor_check_mask[i][y] == 1
                let breakk = !setValidSquare(piece_symbol, i, y, mask, condition)
                console.log(breakk);
                if (breakk) {
                    break;
                }
            }
        }
        for (let y=j;y>=0;y--) {
            if (y != j) {
                let condition = globals.cursor_pins_mask[i][y] == 1 && globals.cursor_check_mask[i][y] == 1
                let breakk = !setValidSquare(piece_symbol, i, y, mask, condition)
                console.log(breakk);
                if (breakk) {
                    break;
                }
            }
        }
    }

    function updateQueenMoveMask(piece_symbol, i, j, mask) {
        updateBishopMoveMask(piece_symbol, i, j, mask)
        updateRookMoveMask(piece_symbol, i, j, mask)
    }

    function updateMoveMask(piece_symbol, i, j, mask, ignore_king=false) {
        switch(piece_symbol) {
            case "p":
            case "P":
                updatePawnMoveMask(piece_symbol, i, j, mask)
                break;
            case "k":
            case "K":
                updateKingMoveMask(piece_symbol, i, j, mask, !ignore_king)
                break
            case "n":
            case "N":
                updateKnightMoveMask(piece_symbol, i, j, mask)
                break
            case "b":
            case "B":
                updateBishopMoveMask(piece_symbol, i, j, mask)
                break
            case "r":
            case "R":
                updateRookMoveMask(piece_symbol, i, j, mask)
                break
            case "q":
            case "Q":
                updateQueenMoveMask(piece_symbol, i, j, mask)
                break
            
        }
    }

    function updateKnightCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        if (color == "w") pieces = globals.white_pieces
        else pieces = globals.black_pieces
        for (const piece of pieces) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        let i_arr = [myking.x - 2, myking.x - 1, myking.x + 1, myking.x + 2]
        let j_arr = [myking.y - 2, myking.y - 1, myking.y + 1, myking.y + 2]
        for (let x=0;x<4;x++) {
            for (let y=0;y<4;y++) {
                if ((Math.abs(i_arr[x] - myking.x) + Math.abs(j_arr[y] - myking.y) == 3) && i_arr[x] >= 0 && i_arr[x] < globals.position.length && j_arr[y] >= 0 && j_arr[y] < globals.position[0].length) {
                    if (globals.position[i_arr[x]][j_arr[y]]) {
                        let tmp_piece = globals.position[i_arr[x]][j_arr[y]].cls
                        if (tmp_piece.toLowerCase() == 'n' && whatColor(tmp_piece) != color) {
                            check_mask[i_arr[x]][j_arr[y]] = 1
                            return true
                        }
                    }
                }
            }
        }
        return false
    }
    
    function updateBishopCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        let width = globals.position[0].length
        let height = globals.position.length
        if (color == "w") pieces = globals.white_pieces
        else pieces = globals.black_pieces
        for (const piece of pieces) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        // bottom right
        let foe_piece = false
        for (let ij=1;(myking.x + ij < height && myking.y + ij < width);ij++) {
            if (globals.position[myking.x + ij][myking.y + ij]) {
                let tmp_piece = globals.position[myking.x + ij][myking.y + ij].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let ij=1;(myking.x + ij < height && myking.y + ij < width);ij++) {
                check_mask[myking.x + ij][myking.y + ij] = 1
                if (globals.position[myking.x + ij][myking.y + ij]) return true
            }
        }
        // top left
        foe_piece = false
        for (let ij=1;(myking.x - ij >= 0 && myking.y - ij >= 0);ij++) {
            if (globals.position[myking.x - ij][myking.y - ij]) {
                let tmp_piece = globals.position[myking.x - ij][myking.y - ij].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let ij=1;(myking.x - ij >= 0 && myking.y - ij >= 0);ij++) {
                check_mask[myking.x - ij][myking.y - ij] = 1
                if (globals.position[myking.x - ij][myking.y - ij]) return true
            }
        }
        // bottom left
        foe_piece = false
        for (let ij=1;(myking.x + ij < height && myking.y - ij >= 0);ij++) {
            if (globals.position[myking.x + ij][myking.y - ij]) {
                let tmp_piece = globals.position[myking.x + ij][myking.y - ij].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let ij=1;(myking.x + ij < height && myking.y - ij >= 0);ij++) {
                check_mask[myking.x + ij][myking.y - ij] = 1
                if (globals.position[myking.x + ij][myking.y - ij]) return true
            }
        }
        // top right
        foe_piece = false
        for (let ij=1;(myking.x - ij >= 0 && myking.y + ij < width);ij++) {
            if (globals.position[myking.x - ij][myking.y + ij]) {
                let tmp_piece = globals.position[myking.x - ij][myking.y + ij].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let ij=1;(myking.x - ij >= 0 && myking.y + ij < width);ij++) {
                check_mask[myking.x - ij][myking.y + ij] = 1
                if (globals.position[myking.x - ij][myking.y + ij]) return true
            }
        }
        return false
    }

    function updateRookCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        if (color == "w") pieces = globals.white_pieces
        else pieces = globals.black_pieces
        for (const piece of pieces) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        let foe_piece = false
        for (let x=myking.x;x<globals.position.length;x++) {
            if (globals.position[x][myking.y] && x != myking.x) {
                let tmp_piece = globals.position[x][myking.y].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let x=myking.x;x<globals.position.length;x++) {
                check_mask[x][myking.y] = 1
                if (globals.position[x][myking.y]) return true
            }
        }
        foe_piece = false
        for (let x=myking.x;x>=0;x--) {
            console.log("|||||||||", x, myking.y);
            if (globals.position[x][myking.y] && x != myking.x) {
                let tmp_piece = globals.position[x][myking.y].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    console.log("||||||||||||||||||", tmp_piece);
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let x=myking.x;x>=0;x--) {
                check_mask[x][myking.y] = 1
                if (globals.position[x][myking.y]) return true
            }
        }
        foe_piece = false
        for (let y=myking.y;y<globals.position[0].length;y++) {
            if (globals.position[myking.x][y] && y != myking.y) {
                let tmp_piece = globals.position[myking.x][y].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let y=myking.y;y<globals.position[0].length;y++) {
                check_mask[myking.x][y] = 1
                if (globals.position[myking.x][y]) return true
            }
        }
        foe_piece = false
        for (let y=myking.y;y>=0;y--) {
            if (globals.position[myking.x][y] && y != myking.y) {
                let tmp_piece = globals.position[myking.x][y].cls
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let y=myking.y;y>=0;y--) {
                check_mask[myking.x][y] = 1
                if (globals.position[myking.x][y]) return true
            }
        }
        return false
    }

    function updateCheckMask(piece_symbol, check_mask) {
        emptyMask(check_mask)
        let knightCheck = updateKnightCheckMask(piece_symbol, check_mask)
        let bishopCheck = updateBishopCheckMask(piece_symbol, check_mask)
        let rookCheck = updateRookCheckMask(piece_symbol, check_mask)
        printMask(check_mask)
        let num_checks = knightCheck + bishopCheck + rookCheck
        if (num_checks > 1) {
            console.log("double check");
            emptyMask(check_mask)
        } else if (num_checks == 0) {
            onesMask(check_mask)
        }
        
    }

    function updatePinsMaskByBishop(piece_symbol, i, j, pin_mask) {
        // emptyMask(pin_mask)
        let width = globals.position[0].length
        let height = globals.position.length
        // one diagonal
        let king = false
        let foe_piece = false
        let pinned_diagonal = false
        for (let ij=1;(i + ij < height && j + ij < width);ij++) {
            let i_1 = i + ij
            let j_1 = j + ij
            if (globals.position[i_1][j_1]) {
                let tmp_piece = globals.position[i_1][j_1].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k') {
                        console.log("kiiiinnnnnnnggggggg", tmp_piece);
                        king = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        for (let ij=1;(i - ij >= 0 && j - ij >= 0);ij++) {
            let i_1 = i - ij
            let j_1 = j - ij
            if (globals.position[i_1][j_1]) {
                let tmp_piece = globals.position[i_1][j_1].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b') && king) {
                    console.log("foeeeee pieeeece", tmp_piece);
                    pinned_diagonal = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k' && foe_piece) {
                        pinned_diagonal = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        if (pinned_diagonal) {
            for (let ij=0;(i + ij < height && j + ij < width);ij++)
                pin_mask[i + ij][j + ij] = 1
            for (let ij=0;(i - ij >= 0 && j - ij >= 0);ij++)
                pin_mask[i - ij][j - ij] = 1
            return true
        }

        king = false
        foe_piece = false
        pinned_diagonal = false
        for (let ij=1;(i + ij < height && j - ij >= 0);ij++) {
            let i_1 = i + ij
            let j_1 = j - ij
            if (globals.position[i_1][j_1]) {
                let tmp_piece = globals.position[i_1][j_1].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b')) {
                    foe_piece = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k') {
                        king = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        for (let ij=1;(i - ij >= 0 && j + ij < width);ij++) {
            let i_1 = i - ij
            let j_1 = j + ij
            if (globals.position[i_1][j_1]) {
                let tmp_piece = globals.position[i_1][j_1].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'b') && king) {
                    pinned_diagonal = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k' && foe_piece) {
                        pinned_diagonal = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        if (pinned_diagonal) {
            for (let ij=0;(i + ij < height && j - ij >= 0);ij++)
                pin_mask[ij][j - ij] = 1
            for (let ij=0;(i - ij >= 0 && j + ij < width);ij++)
                pin_mask[i - ij][j + ij] = 1
            return true
        }
        return false

    }

    function updatePinsMaskByRook(piece_symbol, i, j, pin_mask) {
        let width = globals.position[0].length
        let height = globals.position.length
        let king = false
        let foe_piece = false
        let pinned_file = false
        for (let x=i+1;x<height;x++) {
            if (globals.position[x][j]) {
                let tmp_piece = globals.position[x][j].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k') {
                        king = true
                        console.log("filleeee kinnnnnnnnng", tmp_piece);
                        break
                    } else {
                        break
                    }
                }
            }
        }
        for (let x=i-1;x>=0;x--) {
            if (globals.position[x][j]) {
                let tmp_piece = globals.position[x][j].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r') && king) {
                    pinned_file = true
                    console.log("filleeee foeeeee pieeeceee", tmp_piece);
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k' && foe_piece) {
                        pinned_file = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        if (pinned_file) {
            for (let x=0;x<height;x++)
                pin_mask[x][j] = 1
            return true
        }
        king = false
        foe_piece = false
        let pinned_rank = false
        for (let y=j+1;y<width;y++) {
            if (globals.position[i][y]) {
                let tmp_piece = globals.position[i][y].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k') {
                        king = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        for (let y=j-1;y>=0;y--) {
            if (globals.position[i][y]) {
                let tmp_piece = globals.position[i][y].cls
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r') && king) {
                    pinned_rank = true
                    break
                } else {
                    if (tmp_piece.toLowerCase() == 'k' && foe_piece) {
                        pinned_rank = true
                        break
                    } else {
                        break
                    }
                }
            }
        }
        if (pinned_rank) {
            for (let y=0;y<width;y++)
                pin_mask[i][y] = 1
            return true
        }

        return false
    }

    function updatePinsMask(piece_symbol, i, j, pin_mask) {
        emptyMask(pin_mask)
        if (updatePinsMaskByBishop(piece_symbol, i, j, pin_mask)) return
        if (updatePinsMaskByRook(piece_symbol, i, j, pin_mask)) return
        onesMask(pin_mask)
    }

    function overlapMasks(pieces, king_mask) {
        emptyMask(king_mask)
        for (const piece of pieces) {
            updateMoveMask(piece.symbol, piece.x, piece.y, king_mask, true)
            // printMask(globals.cursor_king_mask)
        }
        $(".square").removeClass("highlited-square")
        $(".square").removeClass("capturable-square")
        $(".square").removeClass("protected-square")
        console.log("=============================")
    }

    const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const ranks_str = FEN.split(" ")[0]
    const ranks = ranks_str.split(' ')[0].split('/');
    let ii=0;
    for (const rank of ranks) {
        let s = 0;
        let jj = 0;
        let offset = 0;
        while(rank.charAt(s)) {
            if(rank.charAt(s).match(/[1-8]/gi)) {
                offset = +rank.charAt(s) - 1;
                // console.log(offset)
                jj += offset
            }
            if(rank.charAt(s).match(/[a-zA-Z]/gi)) {
                let src;
                let piece = null
                if(rank.charAt(s) == rank.charAt(s).toLowerCase()) {
                    src = imgs['_'+rank.charAt(s)];
                    piece = {
                        x: ii,
                        y: jj,
                        symbol: rank.charAt(s)
                    }
                    globals.black_pieces.push(piece);
                } else {
                    src = imgs['w_'+rank.charAt(s).toLowerCase()];
                    piece = {
                        x: ii,
                        y: jj,
                        symbol: rank.charAt(s)
                    }
                    globals.white_pieces.push(piece);
                }
                // piece.classList.add('piece');
                // console.log(document.getElementById(`#${one_8[ii]},${a_h[offset+s]}`));
                // $(`#${one_8[ii]},${a_h[offset+s]}`).append(piece);
                globals.position[ii][jj] = {
                    src,
                    piece,
                    cls: rank.charAt(s),
                };
            }
            jj++;
            s++;
        }
        ii++
    }

    printPosition(globals.position)
    console.log(position_to_FEN(
        globals.position,
        globals.turn,
        globals.black_castled_k,
        globals.black_castled_q,
        globals.white_castled_k,
        globals.white_castled_q,
        globals.en_passant_pos,
        globals.fifty_rule_count,
        globals.move_count
    ))


    // ============================ Rendering ==============================;
    renderBoard(globals.position, globals.perspective)
    

    // ============================ Event Handling ==============================;
    
    $("#flip-board").on("click", function(e) {
        if (globals.perspective == 'w') globals.perspective = 'b';
        else if (globals.perspective == 'b') globals.perspective = 'w';
        renderBoard(globals.position, globals.perspective)
    })

    $('body').on('mousedown touchstart', '.square', function (e) {
        e.preventDefault();
        // if (globals.previous_square) {
        //     $(globals.previous_square).removeClass("cursor-square");
        //     globals.cursor_piece = null
        // }
        $(".square").removeClass("highlited-square")
        $(".square").removeClass("capturable-square")
        $(".square").removeClass("protected-square")
        console.log("Mouse down:", $(this).children('.piece'))
        if ($(this).children('.piece').length) {
            globals.lifted_piece = $(this).children('.piece')[0];
            let i = 8 - (+this.id.split("-")[0])
            let j = a_h.indexOf(this.id.split("-")[1])
            let piece_symbol = globals.lifted_piece.classList[1].split('--')[1]
            console.log(piece_symbol);
            if (whatColor(piece_symbol) == globals.turn) {
                updateMoveMask(piece_symbol, i, j, globals.cursor_move_mask)
            }
            $(globals.lifted_piece).css({
                transition: 'none',
                zIndex: 9999,
            });
        }

    });

    $('body').on('mouseup touchend', '.square', function (e) {
        console.log(this.id);
        
        if(globals.lifted_piece) {
            $(".square").removeClass("highlited-square")
            $(".square").removeClass("capturable-square")
            $(".square").removeClass("protected-square")
            globals.cursor_move_mask = emptyMask()
            let piece_symbol = globals.lifted_piece.classList[1].split('--')[1]
            if (globals.cursor_piece && globals.cursor_piece.parentNode.id != this.id) {
                let lifted_symbol = globals.lifted_piece.classList[1].split('--')[1]
                let cursor_symbol = globals.cursor_piece.classList[1].split('--')[1]
                if (whatCase(cursor_symbol) == whatCase(lifted_symbol)) {
                    $(globals.cursor_piece.parentNode).removeClass("cursor-square");
                    globals.cursor_piece = null
                }
            } 
            if(this.id != globals.lifted_piece.parentNode.id) {
                if (whatColor(piece_symbol) != globals.turn) {
                    $(globals.lifted_piece).css({
                        transition: '0.17s',
                        zIndex: 1,
                        transform: `translate(-50%,-50%)`,
                    });
                    globals.lifted_piece = null;
                    return
                }
                if ($(this).children('.piece').length >= 1) {
                    const piece = $(this).children('.piece')[0]
                    let existing_piece_symbol = piece.classList[1].split('--')[1]
                    if (whatCase(existing_piece_symbol) != whatCase(piece_symbol)) {
                        $(this).children('.piece').remove()
                    } else {
                        $(globals.lifted_piece).css({
                            transition: '0.17s',
                            zIndex: 1,
                            transform: `translate(-50%,-50%)`,
                        });
                        globals.lifted_piece = null;
                        return
                    }
                } 
                let src = globals.lifted_piece.src;
                let cls = globals.lifted_piece.classList[1].split('--')[1];
                let p_i = 8 - (+globals.lifted_piece.parentNode.id.split("-")[0])
                let p_j = a_h.indexOf(globals.lifted_piece.parentNode.id.split("-")[1])
                let i = 8 - (+this.id.split("-")[0])
                let j = a_h.indexOf(this.id.split("-")[1])

                let tmp = globals.position[p_i][p_j]
                tmp.piece.x = i
                tmp.piece.y = j
                globals.position[p_i][p_j] = null;
                globals.position[i][j] = tmp;

                $(this).append(globals.lifted_piece);
                $(globals.lifted_piece.parentNode).remove('.piece');
                globals.turn = (globals.turn == 'w')? 'b':'w';
                globals.move_count++;
                console.log(position_to_FEN(
                    globals.position,
                    globals.turn,
                    globals.black_castled_k,
                    globals.black_castled_q,
                    globals.white_castled_k,
                    globals.white_castled_q,
                    globals.en_passant_pos,
                    globals.fifty_rule_count,
                    globals.move_count
                ))
            }
            
            $(globals.lifted_piece).css({
                transition: '0.17s',
                zIndex: 1,
                transform: `translate(-50%,-50%)`,
            });
            globals.lifted_piece = null;
        }
        
    });

    $('body').on('touchmove mousemove', '.square', function (e) {
        globals.square_hover_id = this.id;
    });

    $('body').on('click', '.square', function (e) {
        console.log("**********************************", globals.cursor_piece);
        if (!globals.cursor_piece) {
            if ($(this).children('.piece').length) {
                globals.previous_square = this
                // $(this).css({
                //     backgroundColor: '#d13d53',
                // });
                $(this).addClass("cursor-square");
                globals.cursor_piece = $(this).children('.piece')[0];
            }
        } else {
            let i = 8 - (+this.id.split("-")[0])
            let j = a_h.indexOf(this.id.split("-")[1])
            console.log(this.id)
            let ii = 8 - (+globals.previous_square.id.split("-")[0])
            let jj = a_h.indexOf(globals.previous_square.id.split("-")[1])
            $(globals.previous_square).removeClass("cursor-square");
            console.log(jj+ii)
            if(this.id != globals.cursor_piece.parentNode.id) {
                let piece_symbol = globals.cursor_piece.classList[1].split('--')[1]
                if (whatColor(piece_symbol) != globals.turn) {
                    $(globals.cursor_piece).css({
                        transition: '0.17s',
                        zIndex: 1,
                        transform: `translate(-50%,-50%)`,
                    });
                    globals.cursor_piece = null;
                    console.log("**********************************", globals.cursor_piece);
                    return
                }
                if ($(this).children('.piece').length >= 1) {
                    const piece = $(this).children('.piece')[0]
                    let existing_piece = piece.classList[1].split('--')[1]
                    console.log("-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*", piece_symbol, existing_piece)
                    if (whatCase(existing_piece) != whatCase(piece_symbol)) {
                        $(this).children('.piece').remove()
                    } else {
                        $(globals.cursor_piece).css({
                            transition: '0.17s',
                            zIndex: 1,
                            transform: `translate(-50%,-50%)`,
                        });
                        globals.cursor_piece = null;
                        console.log("**********************************", globals.cursor_piece);
                        return
                    }
                } 
                let src = globals.cursor_piece.src;
                console.log(i, j)
                console.log(ii, jj)
                let tmp = globals.position[ii][jj]
                tmp.piece.x = i
                tmp.piece.y = j
                globals.position[ii][jj] = null;
                globals.position[i][j] = tmp;
                $(this).append(globals.cursor_piece);
                $(globals.cursor_piece.parentNode).remove('.piece');
                console.log(globals.position)
                printPosition(globals.position)
                globals.turn = (globals.turn == 'w')? 'b':'w';
                globals.move_count++;
                console.log(position_to_FEN(
                    globals.position,
                    globals.turn,
                    globals.black_castled_k,
                    globals.black_castled_q,
                    globals.white_castled_k,
                    globals.white_castled_q,
                    globals.en_passant_pos,
                    globals.fifty_rule_count,
                    globals.move_count
                ))
            }
            globals.cursor_piece = null
            console.log("**********************************", globals.cursor_piece);
            
        }
        // console.log("**********************************", globals.cursor_piece);
    });

    $('.board').on('touchmove mousemove', function (e) {
        // const coord = globals.tmp_piece.parentNode.id.split(',');
        if (globals.lifted_piece) {
            var x = e.pageX - globals.lifted_piece.parentNode.offsetLeft - board.offsetHeight/8.005;
            var y = e.pageY - globals.lifted_piece.parentNode.offsetTop - board.offsetHeight/8.005;
            if (e.type == "touchmove") {
                x = e.originalEvent.touches[0].pageX - globals.lifted_piece.parentNode.offsetLeft - board.offsetHeight/8.005;
                y = e.originalEvent.touches[0].pageY - globals.lifted_piece.parentNode.offsetTop - board.offsetHeight/8.005;
            }
            $(globals.lifted_piece).css({
                transform: `translate(${x}px,${y}px)`,
            });
        }
        
    });

    $('.board').mouseleave(function() {
        $(globals.lifted_piece).css({
            transition: '0.17s',
            zIndex: 1,
            transform: `translate(-50%,-50%)`,
        });
        globals.lifted_piece = null;
    });

});