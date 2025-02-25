/**
 * @typedef {import('./types').IPiece} IPiece
 * @typedef {import('./types').Symbol} Symbol
 * @typedef {import('./types').Color} Color
 * @typedef {import('./types').Id2Piece} Id2Piece
 * @typedef {import('./types').ISquare} ISquare
 * @typedef {import('./types').PromotiomPiece} PromotiomPiece
 */

class ChessGame {
    constructor(
        lifted_piece = null,
        cursor_piece = null,
        previous_square = null,
        square_hover_id = '',
        fifty_rule_count = 0,
        move_count = 0,
        position = [],
        cursor_move_mask = [],
        cursor_pins_mask = emptyMask(),
        cursor_check_mask = emptyMask(),
        cursor_king_mask = emptyMask(),
        turn = 'w',
        perspective = 'w',
        black_can_castle_k = true,
        black_can_castle_q = true,
        white_can_castle_k = true,
        white_can_castle_q = true,
        en_passant_pos = "-",
        white_pieces = [],
        black_pieces = [],
        captured_black = [],
        captured_white = [],
    ) {
        /** @type {HTMLImageElement | null} */
        this.lifted_piece = lifted_piece
        /** @type {HTMLImageElement | null} */
        this.cursor_piece = cursor_piece
        this.previous_square = previous_square
        this.square_hover_id = square_hover_id
        this.fifty_rule_count = fifty_rule_count
        this.move_count = move_count
        /** @type {ISquare[][]} */
        this.position = position
        this.cursor_move_mask = cursor_move_mask
        this.cursor_pins_mask = cursor_pins_mask
        this.cursor_check_mask = cursor_check_mask
        this.cursor_king_mask = cursor_king_mask
        /** @type {"w" | "b"} */
        this.turn = turn
        this.perspective = perspective
        this.black_can_castle_k = black_can_castle_k
        this.black_can_castle_q = black_can_castle_q
        this.white_can_castle_k = white_can_castle_k
        this.white_can_castle_q = white_can_castle_q
        this.en_passant_pos = en_passant_pos
        this.en_passant_capture_pos = []
        /** @type {Id2Piece} */
        this.white_pieces = white_pieces
        /** @type {Id2Piece} */
        this.black_pieces = black_pieces
        /** @type {IPiece[]} */
        this.captured_black = captured_black
        /** @type {IPiece[]} */
        this.captured_white = captured_white
        this.isInitialized = false
        this.standardPositionFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        this.imgs = {
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
        this.choosingPromotion = false
        this.promotion_i = -1
        this.promotion_j = -1
    }

    init() {
        
        this.board = document.querySelector('.board'); // frontent specific
        for (let i=0;i<8;i++) {
            this.position[i] = [null,null,null,null,null,null,null,null];
            this.cursor_move_mask[i] = [0,0,0,0,0,0,0,0];
        }
        this.isInitialized = true
    }
    
    getFEN() {
        if (!this.isInitialized) throw Error("uninitialized position")
        let fen = "";
        for(const row of this.position) {
            let num_empty = 0;
            let num_squares = 0;
            for(const square of row) {
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
        let fen_suffix_arr = []
        // turn
        fen_suffix_arr.push(this.turn);
        let white_castling = ""
        if (this.white_can_castle_k) white_castling += "K"
        if (this.white_can_castle_q) white_castling += "Q"
 
        let black_castling = ""
        if (this.black_can_castle_k) black_castling += "k"
        if (this.black_can_castle_q) black_castling += "q"

        if (white_castling && black_castling) {
            fen_suffix_arr.push(white_castling + black_castling)
        }
        
        if (!white_castling && !black_castling) {
            fen_suffix_arr.push("-")
        }
        fen_suffix_arr.push(this.en_passant_pos)
        fen_suffix_arr.push(this.fifty_rule_count)
        fen_suffix_arr.push(this.move_count)

        fen += " " + fen_suffix_arr.join(" ");
        return fen
    }

    /**
     * 
     * @param {Symbol} symbol 
     * @param {number} i 
     * @param {number} j 
     * @returns {ISquare}
     */
    createPieceSquare(symbol, i, j) {
        let src = ""
        if (whatColor(symbol) == 'w') src = this.imgs['w_'+symbol.toLowerCase()];
        if (whatColor(symbol) == 'b') src = this.imgs['_'+symbol];
        let piece_id = Math.random().toString(36).slice(2)
        const piece = {
            _id: piece_id,
            x: i,
            y: j,
            symbol
        }
        const square = {
            src,
            piece
        };
        return square
    }

    parseFEN(FEN) {
        if (!this.isInitialized) throw Error("uninitialized position")
        let symbolic_position = []
        for (let i=0;i<8;i++) {
            symbolic_position[i] = ["_","_","_","_","_","_","_","_"];
        }
        this.black_can_castle_k = false
        this.black_can_castle_q = false
        this.white_can_castle_k = false
        this.white_can_castle_q = false
        const [ranks_str, turn, castlings, en_passant_pos, fifty_rule_count, move_count] = FEN.split(" ")
        this.turn = turn
        this.en_passant_pos = en_passant_pos
        this.fifty_rule_count = +fifty_rule_count
        this.move_count = +move_count
        const ranks = ranks_str.split(' ')[0].split('/');
        if (castlings.includes("K")) this.white_can_castle_k = true
        if (castlings.includes("Q")) this.white_can_castle_q = true
        if (castlings.includes("k")) this.black_can_castle_k = true
        if (castlings.includes("q")) this.black_can_castle_q = true
        let ii=0;
        for (const rank of ranks) {
            let s = 0;
            let jj = 0;
            let offset = 0;
            while(rank.charAt(s)) {
                if(rank.charAt(s).match(/[1-8]/gi)) {
                    offset = +rank.charAt(s) - 1;
                    // // console.log(offset)
                    jj += offset
                }
                if(rank.charAt(s).match(/[a-zA-Z]/gi)) {
                    /** @type {ISquare} */
                    const pieceSquare = this.createPieceSquare(rank.charAt(s), ii, jj)
                    if(rank.charAt(s) == rank.charAt(s).toLowerCase()) this.black_pieces[pieceSquare.piece._id] = pieceSquare.piece;
                    else this.white_pieces[pieceSquare.piece._id] = pieceSquare.piece;

                    this.position[ii][jj] = pieceSquare
                    symbolic_position[ii][jj] = rank.charAt(s)
                }
                jj++;
                s++;
            }
            ii++
        }
        return symbolic_position
    }

    renderBoard() {
        let i = 0;
        $(".square").remove()
        for (let c_i=0;c_i<8;c_i++) {
            if (this.perspective == 'w') i = c_i;
            else if (this.perspective == 'b') i = 7-c_i;
            let j = 0
            for (let c_j=0;c_j<8;c_j++) {
                if (this.perspective == 'w') j = c_j;
                else if (this.perspective == 'b') j = 7-c_j;
                const square = document.createElement('div');
                square.id = `${one_8[i]}-${a_h[j]}`;
                square.classList.add('square');
                $(square).css({
                    // width: `min(10.868vh,10.868vw)`,
                    // height: `min(10.868vh,10.868vw)`,
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
                if(this.position[i][j]) {
                    const piece = document.createElement('img');
                    piece.src = this.position[i][j].src;
                    piece.classList.add('piece');
                    piece.classList.add('chess--'+this.position[i][j].piece.symbol);
                    square.appendChild(piece);
                }
                this.board.appendChild(square)
            }
        }
    }

    /**
     * @returns {"capture" | "move" | "invalid" | "castle_kingside" | "castle_queenside", | "black_promotion" | "white_promotion"}
     */

    request_move(new_i, new_j, old_i, old_j) {
        if(!this.choosingPromotion && (new_i != old_i || new_j != old_j)) {
            console.log("------------------------------------------");
            console.log("old:", old_i, old_j);
            printPosition(this.position)
            let piece_symbol = this.position[old_i][old_j].piece.symbol

            /** @type {Color | "other"} */
            let piece_color = whatColor(piece_symbol)

            if (piece_color != this.turn) return "invalid"
            
            const moved_piece_square = this.position[old_i][old_j]

            // TODO: CHECKING ALL THE MOVE MASKS
            const moveMask = this.cursor_move_mask[new_i][new_j]
            if (moveMask < 0.5 || moveMask > 2 || moveMask == 1.5) return "invalid"

            if (this.position[new_i][new_j]) {
                let existing_piece_symbol = this.position[new_i][new_j].piece.symbol
                if (whatColor(existing_piece_symbol) == whatColor(piece_symbol)) return "invalid"
            }

            const delta_move_i = new_i - old_i
            const delta_move_j = new_j - old_j

            // Castling
            if (moved_piece_square.piece.symbol.toLowerCase() == "k") {
                if (Math.abs(delta_move_j) == 1) {
                    if (piece_color == 'w') {
                        this.white_can_castle_k = false
                        this.white_can_castle_q = false
                    }
                    if (piece_color == 'b') {
                        this.black_can_castle_k = false
                        this.black_can_castle_q = false
                    }
                }
                if (Math.abs(delta_move_j) == 2) {
                    let side = null
                    if (delta_move_j == 2) { // king side
                        if (!this.position[old_i][this.position[old_i].length - 1]) throw Error("Rook must exists in :", old_i, this.position[old_i].length - 1)
                        this.position[new_i][new_j-1] = this.position[old_i][this.position[old_i].length - 1]
                        this.position[new_i][new_j] = this.position[old_i][old_j]
                        this.position[old_i][old_j] = null
                        this.position[old_i][this.position[old_i].length - 1] = null
                        moved_piece_square.piece.x = new_i
                        moved_piece_square.piece.y = new_j
                        this.position[new_i][new_j-1].piece.x = new_i
                        this.position[new_i][new_j-1].piece.y = new_j - 1
                        if (piece_color == 'w') this.white_can_castle_k = false
                        if (piece_color == 'b') this.black_can_castle_k = false
                        side = "kingside"
                    }
                    if (delta_move_j == -2) { // queen side
                        if (!this.position[old_i][0]) throw Error("Rook must exists in :", old_i, 0)
                        this.position[new_i][new_j+1] = this.position[old_i][0]
                        this.position[new_i][new_j] = this.position[old_i][old_j]
                        this.position[old_i][old_j] = null
                        this.position[old_i][0] = null
                        moved_piece_square.piece.x = new_i
                        moved_piece_square.piece.y = new_j
                        this.position[new_i][new_j+1].piece.x = new_i
                        this.position[new_i][new_j+1].piece.y = new_j + 1
                        if (piece_color == 'w') this.white_can_castle_q = false
                        if (piece_color == 'b') this.black_can_castle_q = false
                        side = "queenside"
                    }
                    this.turn = (this.turn == 'w')? 'b':'w';
                    this.move_count++;
                    this.en_passant_pos = '-'
                    return "castle_"+side
                } 
            }
            if (moved_piece_square.piece.symbol.toLowerCase() == "r") {
                if (old_j == (this.position[old_i].length - 1)) { // king side
                    if (piece_color == 'w') this.white_can_castle_k = false
                    if (piece_color == 'b') this.black_can_castle_k = false
                }
                if (old_j == 0) { // queen side
                    if (piece_color == 'w') this.white_can_castle_q = false
                    if (piece_color == 'b') this.black_can_castle_q = false
                }
            }

            // En Passant
            if (moved_piece_square.piece.symbol.toLowerCase() == "p") {
                // Capture
                const [en_i, en_j] = notation_to_coords(this.en_passant_pos)
                if (this.en_passant_pos != '-' && new_i == en_i && new_j == en_j && this.position[en_i - delta_move_i][en_j] && this.position[en_i - delta_move_i][en_j].piece.symbol.toLowerCase() == 'p') {
                    const captured_piece = this.position[en_i - delta_move_i][en_j]
                    if (whatColor(captured_piece.piece.symbol) == "w") {
                        this.captured_white.push(this.white_pieces[captured_piece.piece._id])
                        delete this.white_pieces[captured_piece.piece._id]
                    }
                    if (whatColor(captured_piece.piece.symbol) == "b") {
                        this.captured_black.push(this.black_pieces[captured_piece.piece._id])
                        delete this.black_pieces[captured_piece.piece._id]
                    }

                    moved_piece_square.piece.x = new_i
                    moved_piece_square.piece.y = new_j
                    this.en_passant_capture_pos = [en_i - delta_move_i, en_j]
                    this.position[en_i - delta_move_i][en_j] = null;
                    this.position[old_i][old_j] = null;
                    this.position[new_i][new_j] = moved_piece_square;
                    this.turn = (this.turn == 'w')? 'b':'w';
                    this.move_count++;
                    this.en_passant_pos = '-'
                    return "capture"
                }
            }

            if (this.position[new_i][new_j]) {
                let existing_piece_symbol = this.position[new_i][new_j].piece.symbol
                if (whatColor(existing_piece_symbol) != whatColor(piece_symbol)) {
                    // $(this).children('.piece').remove()
                    const captured_piece = this.position[new_i][new_j]
                    if (whatColor(captured_piece.piece.symbol) == "w") {
                        this.captured_white.push(this.white_pieces[captured_piece.piece._id])
                        delete this.white_pieces[captured_piece.piece._id]
                    }
                    if (whatColor(captured_piece.piece.symbol) == "b") {
                        this.captured_black.push(this.black_pieces[captured_piece.piece._id])
                        delete this.black_pieces[captured_piece.piece._id]
                    }

                    moved_piece_square.piece.x = new_i
                    moved_piece_square.piece.y = new_j
                    this.position[old_i][old_j] = null;
                    this.position[new_i][new_j] = moved_piece_square;
                    this.en_passant_pos = '-' // any capture results in eliminating the en passant move
                    if (piece_symbol.toLowerCase() == 'p') {
                        if (piece_color == 'b' && new_i == this.position.length - 1) {
                            this.choosingPromotion = true
                            this.promotion_i = new_i
                            this.promotion_j = new_j
                            return "black_promotion_capture"
                        }
                        if (piece_color == 'w' && new_i == 0) {
                            this.choosingPromotion = true
                            this.promotion_i = new_i
                            this.promotion_j = new_j
                            return "white_promotion_capture"
                        }
                        // no move count or turn toggle until promotion happens
                    }
                    this.turn = (this.turn == 'w')? 'b':'w';
                    this.move_count++;
                    return "capture"
                }
            }
            
            

            this.en_passant_pos = '-'
            // En Passant Initiation
            if (moved_piece_square.piece.symbol.toLowerCase() == "p" && Math.abs(delta_move_i) == 2) {
                if (new_j + 1 < this.position[new_i].length && this.position[new_i][new_j + 1] && whatColor(this.position[new_i][new_j + 1].piece.symbol) != whatColor(moved_piece_square.piece.symbol) && this.position[new_i][new_j + 1].piece.symbol.toLowerCase() == 'p') {
                    const en_passant_i = old_i + delta_move_i/2
                    const en_passant_j = new_j
                    this.en_passant_pos = a_h[en_passant_j] + one_8[en_passant_i]
                    console.log(this.en_passant_pos);
                }
                if (new_j - 1 >= 0 && this.position[new_i][new_j - 1] && whatColor(this.position[new_i][new_j - 1].piece.symbol) != whatColor(moved_piece_square.piece.symbol) && this.position[new_i][new_j - 1].piece.symbol.toLowerCase() == 'p') {
                    const en_passant_i = old_i + delta_move_i/2
                    const en_passant_j = new_j
                    this.en_passant_pos = a_h[en_passant_j] + one_8[en_passant_i]
                    console.log(this.en_passant_pos);
                }
            }

            moved_piece_square.piece.x = new_i
            moved_piece_square.piece.y = new_j
            this.position[old_i][old_j] = null;
            this.position[new_i][new_j] = moved_piece_square;
            if (piece_symbol.toLowerCase() == 'p') {
                if (piece_color == 'b' && new_i == this.position.length - 1) {
                    this.choosingPromotion = true
                    this.promotion_i = new_i
                    this.promotion_j = new_j
                    return "black_promotion"
                }
                if (piece_color == 'w' && new_i == 0) {
                    this.choosingPromotion = true
                    this.promotion_i = new_i
                    this.promotion_j = new_j
                    return "white_promotion"
                }
                // no move count or turn toggle until promotion happens
            }
            this.turn = (this.turn == 'w')? 'b':'w';
            this.move_count++;

            return "move"
        }
        return "invalid"
    }

    /**
     * @param {number} i 
     * @param {number} j 
     * @param {PromotiomPiece} new_piece_id
     */
    promote(i, j, new_piece_id) {
        const pawnSquare = this.position[i][j]
        const pieceSymbol = pieceIdToSymbol(new_piece_id)
        const prev_id = pawnSquare.piece._id
        const prev_symbol = pawnSquare.piece.symbol
        if (!pawnSquare) throw Error("No pawn was found at:", i, j)
        if (whatColor(prev_symbol) != whatColor(pieceSymbol)) throw Error("invalid promotion to a different colored piece")
        const promotedSquare = this.createPieceSquare(pieceSymbol, i, j)
        if (whatColor(prev_symbol) == 'w') {
            delete this.white_pieces[prev_id]
            this.white_pieces[promotedSquare.piece._id] = promotedSquare.piece
        }
        if (whatColor(prev_symbol) == 'b') {
            delete this.black_pieces[prev_id]
            this.black_pieces[promotedSquare.piece._id] = promotedSquare.piece
        }
        console.log("NEW ID:", promotedSquare.piece._id)
        console.log("AFTER PROMOTION:::", this.black_pieces);
        
        this.position[i][j] = promotedSquare
        this.choosingPromotion = false
        this.turn = (this.turn == 'w')? 'b':'w';
        this.move_count++;
    }

    update_promotion_ui(i, j) {
        if (!this.position[i][j]) throw Error("Cannot promte a piece that doesnt exists bruh")
        const promotion_coords = coordsToNotation(i, j)
        const promotion_square = $(this.board).children("#"+promotion_coords)[0]
        /** @type {HTMLImageElement} */
        const piece = $(promotion_square).children(".piece")[0]
        piece.src = this.position[i][j].src
    }

    /**
     * @param {number} new_i 
     * @param {number} new_j 
     * @param {boolean} capture 
     * @param {"castle_kingside" | "castle_queenside" | null} castle 
     */
    update_move_ui(new_i, new_j, capture=false, castle=null) {
        $(".square").removeClass("cursor-square");
        const selected_piece = this.lifted_piece || this.cursor_piece
        const coord_notation = coordsToNotation(new_i, new_j)
        const new_square = $(this.board).children("#"+coord_notation)[0]
        if (capture) {
            // En Passant
            if (this.en_passant_capture_pos.length) {
                const [ec_i, ec_j] = this.en_passant_capture_pos
                const en_passant_capture_coords = coordsToNotation(ec_i, ec_j)
                const captured_square = $(this.board).children("#"+en_passant_capture_coords)[0]
                $(captured_square).children('.piece').remove()
                this.en_passant_capture_pos = []
            } 
            // Normal Capture
            else $(new_square).children('.piece').remove()
        }
        $(new_square).append(selected_piece);
        $(selected_piece.parentNode).remove('.piece');
        if (!this.lifted_piece && this.cursor_piece) animatePieceMove(this.previous_square, new_square)
        if (castle) {
            if (castle == "castle_kingside") {
                const old_coords = coordsToNotation(new_i, this.position.length - 1)
                const oldSquare = $(this.board).children("#"+old_coords)[0]
                const new_coords = coordsToNotation(new_i, new_j - 1)
                const newRookSquare = $(this.board).children("#"+new_coords)[0]
                const rook = $(oldSquare).children("img.piece")[0]
                $(newRookSquare).append(rook);
                $(rook.parentNode).remove('.piece');
                animatePieceMove(oldSquare, newRookSquare)
            }
            if (castle == "castle_queenside") {
                const old_coords = coordsToNotation(new_i, 0)
                const oldSquare = $(this.board).children("#"+old_coords)[0]
                const new_coords = coordsToNotation(new_i, new_j + 1)
                const newRookSquare = $(this.board).children("#"+new_coords)[0]
                const rook = $(oldSquare).children("img.piece")[0]
                $(newRookSquare).append(rook);
                $(rook.parentNode).remove('.piece');
                animatePieceMove(oldSquare, newRookSquare)
            }
        }
        if (this.lifted_piece) {
            $(this.lifted_piece).css({
                transition: '0.2s',
                zIndex: 1,
                transform: `translate(-50%,-50%)`,
            });
            this.lifted_piece = null;
            return
        }
        this.cursor_piece = null;
    }

    reject_move_ui() {
        $(".square").removeClass("cursor-square");
        if (this.lifted_piece) {
            $(this.lifted_piece).css({
                transition: '0.17s',
                zIndex: 1,
                transform: `translate(-50%,-50%)`,
            });
            this.lifted_piece = null;
            return
        }
        this.cursor_piece = null;
    }

    setValidSquare(piece_symbol, i, j, mask=this.cursor_move_mask, mask_condition) { // super postions of same color squares and protected squares
        // let id = one_8[i] + "-" + a_h[j]
        // // console.log("=-->", i, j);
        if (this.position[i][j]) {
            if (whatColor(this.position[i][j].piece.symbol) != whatColor(piece_symbol)) {
                if (mask_condition) {
                    mask[i][j] = 2
                }
            } else {
                mask[i][j] = 1.5
            }
            return false
        } else {
            if (mask_condition) {
                mask[i][j] = 1
            }
        }
        return true
    }

    // 0.5 || 1 => highlighted square
    // 1.5 => protected square
    // 2 || 1.4

    updatePawnMoveMask(piece_symbol, i, j, mask) {
        let en_passant_coords = notation_to_coords(this.en_passant_pos)
        this.updatePinsMask(piece_symbol, i, j, this.cursor_pins_mask)
        this.updateCheckMask(piece_symbol, this.cursor_check_mask)

        // moves
        let i_1 = isUpperCase(piece_symbol) ? i - 1 : i + 1
        let in_bound = isUpperCase(piece_symbol) ? i_1 >= 0 : i_1 < this.position.length
        let pin_condition = in_bound ? this.cursor_pins_mask[i_1][j] == 1 : false
        let check_condition = in_bound ? this.cursor_check_mask[i_1][j] == 1 : false
        // // console.log(i_1, in_bound);
        if (in_bound) { 
            let sqr_piece = this.position[i_1][j]
            if (!sqr_piece && pin_condition && check_condition) {
                mask[i_1][j] = mask[i_1][j] == 0 ? 0.5 : mask[i_1][j]
            }
        }
        let rank_condition = isUpperCase(piece_symbol) ? i == this.position.length - 2 : i == 1
        let i_2 = isUpperCase(piece_symbol) ? i - 2 : i + 2
        
        let two_up_condition = isUpperCase(piece_symbol) ? i_2 >= 0 : i_2 < this.position.length
        pin_condition = two_up_condition ? this.cursor_pins_mask[i_2][j] == 1 : false
        check_condition = two_up_condition ? this.cursor_check_mask[i_2][j] == 1 : false
        // // console.log("=============== pin condition ===============>", pin_condition);
        if (rank_condition) { // initial rank
            if (two_up_condition) {
                let sqr_piece = this.position[i_2][j]
                if (!sqr_piece && pin_condition && check_condition) {
                    mask[i_2][j] = mask[i_2][j] == 0 ? 0.5 : mask[i_2][j]
                }
            }
        }
        // captures
        if (in_bound) {
            if (j - 1 >= 0) {
                let sqr_piece = this.position[i_1][j - 1]
                pin_condition = this.cursor_pins_mask[i_1][j - 1] == 1
                check_condition = this.cursor_check_mask[i_1][j - 1] == 1
                if (sqr_piece) {
                    // // console.log("=============== pin condition ===============>", pin_condition);
                    if (whatColor(sqr_piece.piece.symbol) != whatColor(piece_symbol)) {
                        if (pin_condition && check_condition) {
                            mask[i_1][j - 1] = 2 
                        }
                    } else {
                        mask[i_1][j - 1] = 1.5
                    }
                } else {
                    if (i_1 == en_passant_coords[0] && j - 1 == en_passant_coords[1] && pin_condition && check_condition) mask[i_1][j - 1] = 2
                    else mask[i_1][j - 1] = 1.5
                }
            }
            if (j + 1 < this.position[0].length) {
                let sqr_piece = this.position[i_1][j + 1]
                pin_condition = this.cursor_pins_mask[i_1][j + 1] == 1
                check_condition = this.cursor_check_mask[i_1][j + 1] == 1
                if (sqr_piece) {
                    // // console.log("=============== pin condition ===============>", pin_condition);
                    if (whatColor(sqr_piece.piece.symbol) != whatColor(piece_symbol)) {
                        if (pin_condition && check_condition) {
                            mask[i_1][j + 1] = 2
                        }
                    } else {
                        mask[i_1][j + 1] = 1.5
                    }
                } else {
                    if (i_1 == en_passant_coords[0] && j + 1 == en_passant_coords[1] && pin_condition && check_condition) mask[i_1][j + 1] = 2
                    else mask[i_1][j + 1] = 1.5
                }
            }
        }
    }

    updateKingMoveMask(piece_symbol, i, j, mask, deep=true) {
        const color = whatColor(piece_symbol)
        const enemy_pieces = color == "w" ? this.black_pieces : this.white_pieces
        console.log("KINNNNNG:", enemy_pieces)
        if (deep) {
            // console.log("Before overlap")
            this.overlapMasks(enemy_pieces, this.cursor_king_mask)
            printMask(this.cursor_king_mask)
            
        }
        let i_1 = i - 1
        let i_2 = i + 1
        let j_1 = j - 1
        let j_2 = j + 1
        let i_arr = [i, i_1, i_2]
        let j_arr = [j_1, j, j_2]
        for (let x=0;x<3;x++) {
            for (let y=0;y<3;y++) {
                // // console.log(i_arr[x], j_arr[y]);
                if ((i_arr[x] != i || j_arr[y] != j) && i_arr[x] >= 0 && i_arr[x] < this.position.length && j_arr[y] >= 0 && j_arr[y] < this.position[0].length) {
                    let condition = deep ? this.cursor_king_mask[i_arr[x]][j_arr[y]] < 1 : true
                    this.setValidSquare(piece_symbol, i_arr[x], j_arr[y], mask, condition)
                }
            }
        }
        // castling
        let can_castle_kingside = true
        let can_castle_queenside = true
        if (color == 'w') {
            can_castle_kingside = this.white_can_castle_k
            can_castle_queenside = this.white_can_castle_q
        }if (color == 'b') {
            can_castle_kingside = this.black_can_castle_k
            can_castle_queenside = this.black_can_castle_q
        }
        if (this.cursor_king_mask[i][j] < 1) { // not in check
            if (can_castle_kingside) {
                if (this.cursor_king_mask[i][j+1] < 1 && this.cursor_king_mask[i][j+2] < 1 && !this.position[i][j+1] && !this.position[i][j+2]) {
                    this.cursor_move_mask[i][j+2] = 1
                }
            }
            if (can_castle_queenside) {
                if (this.cursor_king_mask[i][j-1] < 1 && this.cursor_king_mask[i][j-2] < 1 && !this.position[i][j-1] && !this.position[i][j-2] && !this.position[i][j-3]) {
                    this.cursor_move_mask[i][j-2] = 1
                }
            }

        }
    }

    updateKnightMoveMask(piece_symbol, i, j, mask) {
        // // console.log("=====> updateKnightMoveMask")
        this.updatePinsMask(piece_symbol, i, j, this.cursor_pins_mask)
        this.updateCheckMask(piece_symbol, this.cursor_check_mask)
        // printMask(this.cursor_pins_mask)
        let i_arr = [i - 2, i - 1, i + 1, i + 2]
        let j_arr = [j - 2, j - 1, j + 1, j + 2]
        for (let x=0;x<4;x++) {
            for (let y=0;y<4;y++) {
                if ((Math.abs(i_arr[x] - i) + Math.abs(j_arr[y] - j) == 3) && i_arr[x] >= 0 && i_arr[x] < this.position.length && j_arr[y] >= 0 && j_arr[y] < this.position[0].length) {
                    // if (this.cursor_pins_mask[i_arr[x]][j_arr[y]] == 1 && this.cursor_check_mask[i_arr[x]][j_arr[y]] == 1)
                    let mask_condition = this.cursor_pins_mask[i_arr[x]][j_arr[y]] == 1 && this.cursor_check_mask[i_arr[x]][j_arr[y]] == 1
                    this.setValidSquare(piece_symbol, i_arr[x], j_arr[y], mask, mask_condition)
                }
            }
        }
    }

     updateBishopMoveMask(piece_symbol, i, j, mask, xray_through_king=false) {
        this.updatePinsMask(piece_symbol, i, j, this.cursor_pins_mask)
        this.updateCheckMask(piece_symbol, this.cursor_check_mask)
        // printMask(this.cursor_pins_mask)
        let width = this.position[0].length
        let height = this.position.length
        for (let ij=1;(i + ij < height && j + ij < width);ij++) {
            let i_1 = i + ij
            let j_1 = j + ij
            let mask_condition = this.cursor_pins_mask[i_1][j_1] == 1 && this.cursor_check_mask[i_1][j_1] == 1
            let collision = !this.setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            // // console.log(collision);
            if (collision) {
                let collision_piece = this.position[i_1][j_1].piece.symbol
                let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                if (collision_is_king)
                    continue
                break;
            }
        }
        for (let ij=1;(i - ij >= 0 && j - ij >= 0);ij++) {
            let i_1 = i - ij
            let j_1 = j - ij
            let mask_condition = this.cursor_pins_mask[i_1][j_1] == 1 && this.cursor_check_mask[i_1][j_1] == 1
            let collision = !this.setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            // // console.log(collision);
            if (collision) {
                let collision_piece = this.position[i_1][j_1].piece.symbol
                let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                if (collision_is_king)
                    continue
                break;
            }
        }
        for (let ij=1;(i + ij < height && j - ij >= 0);ij++) {
            let i_1 = i + ij
            let j_1 = j - ij
            let mask_condition = this.cursor_pins_mask[i_1][j_1] == 1 && this.cursor_check_mask[i_1][j_1] == 1
            let collision = !this.setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            // // console.log(collision);
            if (collision) {
                let collision_piece = this.position[i_1][j_1].piece.symbol
                let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                if (collision_is_king)
                    continue
                break;
            }
        }
        for (let ij=1;(i - ij >= 0 && j + ij < width);ij++) {
            let i_1 = i - ij
            let j_1 = j + ij
            let mask_condition = this.cursor_pins_mask[i_1][j_1] == 1 && this.cursor_check_mask[i_1][j_1] == 1
            let collision = !this.setValidSquare(piece_symbol, i_1, j_1, mask, mask_condition)
            // // console.log(collision);
            if (collision) {
                let collision_piece = this.position[i_1][j_1].piece.symbol
                let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                if (collision_is_king)
                    continue
                break;
            }
        }
    }

     updateRookMoveMask(piece_symbol, i, j, mask) {
        this.updatePinsMask(piece_symbol, i, j, this.cursor_pins_mask)
        this.updateCheckMask(piece_symbol, this.cursor_check_mask)
        // printMask(this.cursor_pins_mask)
        let width = this.position[0].length
        let height = this.position.length
        for (let x=i;x<height;x++) {
            if (x != i) {
                let condition = this.cursor_pins_mask[x][j] == 1 && this.cursor_check_mask[x][j] == 1 
                let collision = !this.setValidSquare(piece_symbol, x, j, mask, condition)
                // // console.log(collision);
                if (collision) {
                    let collision_piece = this.position[x][j].piece.symbol
                    let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                    if (collision_is_king)
                        continue
                    break;
                }
            }
        }
        for (let x=i;x>=0;x--) {
            if (x != i) {
                let condition = this.cursor_pins_mask[x][j] == 1 && this.cursor_check_mask[x][j] == 1
                let collision = !this.setValidSquare(piece_symbol, x, j, mask, condition)
                // // console.log(collision);
                if (collision) {
                    let collision_piece = this.position[x][j].piece.symbol
                    let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                    if (collision_is_king)
                        continue
                    break;
                }
            }
        }
        for (let y=j;y<width;y++) {
            if (y != j) {
                let condition = this.cursor_pins_mask[i][y] == 1 && this.cursor_check_mask[i][y] == 1
                let collision = !this.setValidSquare(piece_symbol, i, y, mask, condition)
                // // console.log(collision);
                if (collision) {
                    let collision_piece = this.position[i][y].piece.symbol
                    let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                    if (collision_is_king)
                        continue
                    break;
                }
            }
        }
        for (let y=j;y>=0;y--) {
            if (y != j) {
                let condition = this.cursor_pins_mask[i][y] == 1 && this.cursor_check_mask[i][y] == 1
                let collision = !this.setValidSquare(piece_symbol, i, y, mask, condition)
                // console.log(collision);
                if (collision) {
                    let collision_piece = this.position[i][y].piece.symbol
                    let collision_is_king = collision_piece.toLowerCase() == "k" && whatColor(collision_piece) != whatColor(piece_symbol)
                    if (collision_is_king)
                        continue
                    break;
                }
            }
        }
    }

     updateQueenMoveMask(piece_symbol, i, j, mask) {
        this.updateBishopMoveMask(piece_symbol, i, j, mask)
        this.updateRookMoveMask(piece_symbol, i, j, mask)
    }

     updateMoveMask(piece_symbol, i, j, mask, ignore_king=false, xray_through_king=false) {
        switch(piece_symbol) {
            case "p":
            case "P":
                this.updatePawnMoveMask(piece_symbol, i, j, mask)
                break;
            case "k":
            case "K":
                this.updateKingMoveMask(piece_symbol, i, j, mask, !ignore_king)
                break
            case "n":
            case "N":
                this.updateKnightMoveMask(piece_symbol, i, j, mask)
                break
            case "b":
            case "B":
                this.updateBishopMoveMask(piece_symbol, i, j, mask, xray_through_king)
                break
            case "r":
            case "R":
                this.updateRookMoveMask(piece_symbol, i, j, mask, xray_through_king)
                break
            case "q":
            case "Q":
                this.updateQueenMoveMask(piece_symbol, i, j, mask, xray_through_king)
                break
            
        }
    }

     updatePawnCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        /** @type {IPiece | null} */
        let myking = null
        let pieces = []
        if (color == "w") pieces = this.white_pieces
        else pieces = this.black_pieces
        for (const [_id, piece] of items(pieces)) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        let pawn_i = -1
        if (color == 'w') pawn_i = myking.x - 1
        if (color == 'b') pawn_i = myking.x + 1
        const pawn_right_j = myking.y + 1
        const pawn_left_j = myking.y - 1
        let in_bounds = false
        if (color == 'w') in_bounds = pawn_i >= 0
        if (color == 'b') in_bounds = pawn_i < this.position.length
        if (in_bounds) {
            if (pawn_right_j < this.position[pawn_i].length) {
                const right_piece = this.position[pawn_i][pawn_right_j]
                if(right_piece && right_piece.piece.symbol.toLocaleLowerCase() == 'p' && whatColor(right_piece.piece.symbol) != color) {
                    check_mask[pawn_i][pawn_right_j] = 1
                    return true
                }
            } 
            if (pawn_left_j >= 0 && this.position[pawn_i][pawn_left_j] && this.position[pawn_i][pawn_left_j].piece.symbol.toLocaleLowerCase() == 'p') {
                const left_piece = this.position[pawn_i][pawn_left_j]
                if(left_piece && left_piece.piece.symbol.toLocaleLowerCase() == 'p' && whatColor(left_piece.piece.symbol) != color) {
                    check_mask[pawn_i][pawn_left_j] = 1
                    return true
                }
            } 
        }
        return false
    }

     updateKnightCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        if (color == "w") pieces = this.white_pieces
        else pieces = this.black_pieces
        for (const [_id, piece] of items(pieces)) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        let i_arr = [myking.x - 2, myking.x - 1, myking.x + 1, myking.x + 2]
        let j_arr = [myking.y - 2, myking.y - 1, myking.y + 1, myking.y + 2]
        for (let x=0;x<4;x++) {
            for (let y=0;y<4;y++) {
                if ((Math.abs(i_arr[x] - myking.x) + Math.abs(j_arr[y] - myking.y) == 3) && i_arr[x] >= 0 && i_arr[x] < this.position.length && j_arr[y] >= 0 && j_arr[y] < this.position[0].length) {
                    if (this.position[i_arr[x]][j_arr[y]]) {
                        let tmp_piece = this.position[i_arr[x]][j_arr[y]].piece.symbol
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
    
     updateBishopCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        let width = this.position[0].length
        let height = this.position.length
        if (color == "w") pieces = this.white_pieces
        else pieces = this.black_pieces
        for (const [_id, piece] of items(pieces)) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        // bottom right
        let foe_piece = false
        for (let ij=1;(myking.x + ij < height && myking.y + ij < width);ij++) {
            if (this.position[myking.x + ij][myking.y + ij]) {
                let tmp_piece = this.position[myking.x + ij][myking.y + ij].piece.symbol
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
                if (this.position[myking.x + ij][myking.y + ij]) return true
            }
        }
        // top left
        foe_piece = false
        for (let ij=1;(myking.x - ij >= 0 && myking.y - ij >= 0);ij++) {
            if (this.position[myking.x - ij][myking.y - ij]) {
                let tmp_piece = this.position[myking.x - ij][myking.y - ij].piece.symbol
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
                if (this.position[myking.x - ij][myking.y - ij]) return true
            }
        }
        // bottom left
        foe_piece = false
        for (let ij=1;(myking.x + ij < height && myking.y - ij >= 0);ij++) {
            if (this.position[myking.x + ij][myking.y - ij]) {
                let tmp_piece = this.position[myking.x + ij][myking.y - ij].piece.symbol
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
                if (this.position[myking.x + ij][myking.y - ij]) return true
            }
        }
        // top right
        foe_piece = false
        for (let ij=1;(myking.x - ij >= 0 && myking.y + ij < width);ij++) {
            if (this.position[myking.x - ij][myking.y + ij]) {
                let tmp_piece = this.position[myking.x - ij][myking.y + ij].piece.symbol
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
                if (this.position[myking.x - ij][myking.y + ij]) return true
            }
        }
        return false
    }

     updateRookCheckMask(piece_symbol, check_mask) {
        let color = whatColor(piece_symbol)
        let myking = null
        let pieces = []
        if (color == "w") pieces = this.white_pieces
        else pieces = this.black_pieces
        for (const [_id, piece] of items(pieces)) {
            if (piece.symbol.toLowerCase() == 'k') {
                myking = piece
                break
            }
        }
        let foe_piece = false
        for (let x=myking.x+1;x<this.position.length;x++) {
            if (this.position[x][myking.y] && x != myking.x) {
                let tmp_piece = this.position[x][myking.y].piece.symbol
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let x=myking.x+1;x<this.position.length;x++) {
                check_mask[x][myking.y] = 1
                if (this.position[x][myking.y]) return true
                
            }
            return true
        }
        foe_piece = false
        for (let x=myking.x-1;x>=0;x--) {
            // console.log("|||||||||", x, myking.y);
            if (this.position[x][myking.y] && x != myking.x) {
                let tmp_piece = this.position[x][myking.y].piece.symbol
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    // console.log("||||||||||||||||||", tmp_piece);
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let x=myking.x-1;x>=0;x--) {
                check_mask[x][myking.y] = 1
                if (this.position[x][myking.y]) return true
            }
            return true
        }
        foe_piece = false
        for (let y=myking.y+1;y<this.position[0].length;y++) {
            if (this.position[myking.x][y] && y != myking.y) {
                let tmp_piece = this.position[myking.x][y].piece.symbol
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let y=myking.y+1;y<this.position[0].length;y++) {
                check_mask[myking.x][y] = 1
                if (this.position[myking.x][y]) return true
            }
            return true
        }
        foe_piece = false
        for (let y=myking.y-1;y>=0;y--) {
            if (this.position[myking.x][y] && y != myking.y) {
                let tmp_piece = this.position[myking.x][y].piece.symbol
                if (whatColor(tmp_piece) != color && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r')) {
                    foe_piece = true
                    break
                } else {
                    break
                }
            }
        }
        if (foe_piece) {
            for (let y=myking.y-1;y>=0;y--) {
                check_mask[myking.x][y] = 1
                if (this.position[myking.x][y]) return true
            }
            return true
        }
        return false
    }

     updateCheckMask(piece_symbol, check_mask) {
        emptyMask(check_mask)
        const pawnCheck = this.updatePawnCheckMask(piece_symbol, check_mask)
        const knightCheck = this.updateKnightCheckMask(piece_symbol, check_mask)
        const bishopCheck = this.updateBishopCheckMask(piece_symbol, check_mask)
        const rookCheck = this.updateRookCheckMask(piece_symbol, check_mask)
        // printMask(check_mask)
        let num_checks = knightCheck + bishopCheck + rookCheck + pawnCheck
        // let num_checks = knightCheck + bishopCheck + rookCheck 
        if (num_checks > 1) {
            // console.log("double check");
            emptyMask(check_mask)
        } else if (num_checks == 0) {
            onesMask(check_mask)
        }
        
    }

     updatePinsMaskByBishop(piece_symbol, i, j, pin_mask) {
        // emptyMask(pin_mask)
        let width = this.position[0].length
        let height = this.position.length
        // one diagonal
        let king = false
        let foe_piece = false
        let pinned_diagonal = false
        // console.log("_|", i + 1, j + 1)
        for (let ij=1;(i + ij < height && j + ij < width);ij++) {
            let i_1 = i + ij
            let j_1 = j + ij
            if (this.position[i_1][j_1]) {
                let tmp_piece = this.position[i_1][j_1].piece.symbol
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
        // console.log("|‾", i - 1, j - 1)
        for (let ij=1;(i - ij >= 0 && j - ij >= 0);ij++) {
            let i_1 = i - ij
            let j_1 = j - ij
            if (this.position[i_1][j_1]) {
                let tmp_piece = this.position[i_1][j_1].piece.symbol
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
            for (let ij=0;(i + ij < height && j + ij < width);ij++){
                pin_mask[i + ij][j + ij] = 1
            }
            for (let ij=0;(i - ij >= 0 && j - ij >= 0);ij++){
                pin_mask[i - ij][j - ij] = 1
            }
            return true
        }

        king = false
        foe_piece = false
        pinned_diagonal = false
        // console.log("|_", i + 1, j - 1)
        for (let ij=1;(i + ij < height && j - ij >= 0);ij++) {
            let i_1 = i + ij
            let j_1 = j - ij
            if (this.position[i_1][j_1]) {
                let tmp_piece = this.position[i_1][j_1].piece.symbol
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
        // console.log("‾|", i - 1, j + 1)
        for (let ij=1;(i - ij >= 0 && j + ij < width);ij++) {
            let i_1 = i - ij
            let j_1 = j + ij
            console.log(i_1, j_1)
            if (this.position[i_1][j_1]) {
                let tmp_piece = this.position[i_1][j_1].piece.symbol
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
            for (let ij=0;(i + ij < height && j - ij >= 0);ij++){
                pin_mask[i + ij][j - ij] = 1
            }
            for (let ij=0;(i - ij >= 0 && j + ij < width);ij++){
                pin_mask[i - ij][j + ij] = 1
            }
            return true
        }
        
        return false
    }

    updatePinsMaskByRook(piece_symbol, i, j, pin_mask) {
        let width = this.position[0].length
        let height = this.position.length
        let king = false
        let foe_piece = false
        let pinned_file = false
        for (let x=i+1;x<height;x++) {
            if (this.position[x][j]) {
                let tmp_piece = this.position[x][j].piece.symbol
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
        for (let x=i-1;x>=0;x--) {
            if (this.position[x][j]) {
                let tmp_piece = this.position[x][j].piece.symbol
                if (whatColor(tmp_piece) != whatColor(piece_symbol) && (tmp_piece.toLowerCase() == 'q' || tmp_piece.toLowerCase() == 'r') && king) {
                    pinned_file = true
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
            if (this.position[i][y]) {
                let tmp_piece = this.position[i][y].piece.symbol
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
            if (this.position[i][y]) {
                let tmp_piece = this.position[i][y].piece.symbol
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

    updatePinsMask(piece_symbol, i, j, pin_mask) {
        if (this.turn == whatColor(piece_symbol)) {
            emptyMask(pin_mask)
            if (this.updatePinsMaskByBishop(piece_symbol, i, j, pin_mask)) return
            if (this.updatePinsMaskByRook(piece_symbol, i, j, pin_mask)) return
            onesMask(pin_mask)
        }
    }

    overlapMasks(pieces, king_mask) {
        // console.log("enemy pieces:", pieces);
        
        emptyMask(king_mask)
        // printPosition(this.position)
        for (const [_id, piece] of items(pieces)) {
            let xray_through_king = true
            this.updateMoveMask(piece.symbol, piece.x, piece.y, king_mask, true, xray_through_king)
            // console.log(piece.symbol, ":")
            // printMask(this.cursor_king_mask)
        }
        $(".square").removeClass("highlited-square")
        $(".square").removeClass("capturable-square")
        $(".square").removeClass("protected-square")
        // console.log("=============================")
    }

    updateUiByMask() {
        for (const [i, row] of enumerate(this.cursor_move_mask)) {
            for (const [j, val] of enumerate(row)) {
                let id = one_8[i] + "-" + a_h[j]
                
                if (val >= 0.5 && val <= 1) {
                    $(`#${id}`).addClass("highlited-square")
                }
                if (val == 1.5) $(`#${id}`).addClass("protected-square")
                if (val == 2) $(`#${id}`).addClass("capturable-square")
            }
        }
    }

}

$(document).ready(function () {

    const chessGame = new ChessGame()
    chessGame.init()
    chessGame.parseFEN(chessGame.standardPositionFEN)
    // chessGame.parseFEN("rnbqkbnr/pppppp1p/8/8/6P1/R7/PPPPPP1p/RNBQKBN1 b Qkq - 0 10")
    chessGame.renderBoard()
    const boardElement = document.querySelector(".board")

    

    printPosition(chessGame.position)

    // ============================ Rendering ==============================;
    // renderBoard(chessGame.position, chessGame.perspective)
    
    // ============================ Event Handling ==============================;
    
    $("#flip-board").on("click", function(e) {
        if (chessGame.perspective == 'w') chessGame.perspective = 'b';
        else if (chessGame.perspective == 'b') chessGame.perspective = 'w';
        chessGame.renderBoard()
    })

    $(".popup-square").on("click", function(e) {
        const id = e.target.id
        chessGame.promote(chessGame.promotion_i, chessGame.promotion_j, id)
        chessGame.update_promotion_ui(chessGame.promotion_i, chessGame.promotion_j)
        $(".overlay").css({display: "none"})
        $(".promotion-popup#black").css({display: "none"})
        $(".promotion-popup#white").css({display: "none"})
        chessGame.previous_square = null
        chessGame.cursor_piece = null
        chessGame.lifted_piece = null
        chessGame.cursor_move_mask = emptyMask()
    })

    $('body').on('mousedown touchstart', '.square', eventHandlersFactory(chessGame).mouseDown);

    $('body').on('mouseup touchend', '.square', eventHandlersFactory(chessGame).mouseUp);

    $('body').on('touchmove mousemove', '.square', eventHandlersFactory(chessGame).mouseMove);

    $('body').on('click', '.square', eventHandlersFactory(chessGame).click);

    $('.board').on('touchmove mousemove', eventHandlersFactory(chessGame).boardMouseMove);

    $('.board').mouseleave(function() {
        $(chessGame.lifted_piece).css({
            transition: '0.17s',
            zIndex: 1,
            transform: `translate(-50%,-50%)`,
        });
        chessGame.lifted_piece = null;
    });

});