(function(window, document) {

    window.app = window.app || {};

    window.app.loadFEN = function(sFEN, selector, squareSize, pieceSet) {

        var getPos = function(col) {
            var row = 0;
            while (col >= 8) {
                row++;
                col -= 8;
            }
            return {
                col: col,
                row: row
            };
        };

        var boardElt = document.getElementById(selector);
        boardElt.style.width = (squareSize * 8) + 'px';
        boardElt.style.height = (squareSize * 8) + 'px';

        // FEN example
        // 1b6/4Q3/q3PpK1/3Bkp2/1npRp1p1/r5P1/2NN2rB/4R3 w - - 0 1
        var fragments = sFEN.split(/\s/g)[0];
        var i;

        for (i = 0; i < 64; i++) {
            var col = i % 8;
            var row = i === 0 ? 0 : (Math.floor((i / 8)));

            var field = document.createElement('div');
            field.style.top = (row * squareSize) + 'px';
            field.style.left = (col * squareSize) + 'px';
            field.style.width = squareSize + 'px';
            field.style.height = squareSize + 'px';
            field.className = 'square ' + (((i % 2 === 0 && row % 2 === 0) || (i % 2 == 1 && row % 2 == 1)) ? 'w' : 'b');

            boardElt.appendChild(field);
        }

        var curCol = 0,
            color;
        for (i = 0; i < fragments.length; i++) {
            var curChar = fragments.substr(i, 1);

            if (curChar.match(/[A-Z]/i) || curChar === '$') {
                var boardPos = getPos(curCol);
                var piece = document.createElement('div');
                piece.style.top = (boardPos.row * squareSize) + 'px';
                piece.style.left = (boardPos.col * squareSize) + 'px';
                piece.style.width = squareSize + 'px';
                piece.style.height = squareSize + 'px';
                piece.className = 'piece';

                if (curChar === '$') {
                    piece.style.backgroundImage = 'url(images/pieces/duck.svg)';
                } else {

                    if (curChar.match(/[A-Z]/)) {
                        color = 'w';
                    }
                    if (curChar.match(/[a-z]/)) {
                        color = 'b';
                    }

                    piece.style.backgroundImage = 'url(images/pieces/' + pieceSet + '/' + color + curChar.toUpperCase() + '.svg)';
                }

                boardElt.appendChild(piece);
                curCol++;
            }
            if (curChar.match(/[0-8]/)) {
                curCol += parseInt(curChar);
            }
        }
    };

})(this, this.document);

window.onload = function() {

    cast.receiver.logger.setLevelValue(0);
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

    // handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
        console.log('Received Ready event: ' + JSON.stringify(event.data));
        window.castReceiverManager.setApplicationState("Application status is ready...");
    };

    // handler for 'senderconnected' event
    castReceiverManager.onSenderConnected = function(event) {
        console.log('Received Sender Connected event: ' + event.data);
        console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };

    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
        console.log('Received Sender Disconnected event: ' + event.data);
        if (window.castReceiverManager.getSenders().length === 0) {
            window.close();
        }
    };

    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus =
        window.castReceiverManager.getCastMessageBus(
            'urn:x-cast:nl.jwtc.chess.channel');

    
    var squareSize = Math.ceil(screen.height / 9);
    var marginTop = Math.ceil(squareSize / 2);
    
    document.getElementById('board').style.marginTop = marginTop + 'px';
    
    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function(event) {
        console.log('Message [' + event.senderId + ']: ' + event.data);
        // display the message from the sender

        try {
            // new version
            var data = JSON.parse(event.data);
            window.app.loadFEN(data.FEN, 'board', squareSize, data.pieceSet);
        } catch {
            // old version is just FEN string
            window.app.loadFEN(event.data, 'board', squareSize, 'merida');
        }

        window.castReceiverManager.setApplicationState(event.data);

        // inform all senders on the CastMessageBus of the incoming message event
        // sender message listener will be invoked
        window.messageBus.send(event.senderId, event.data);
    };

    // initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({
        statusText: "Application is starting"
    });
    console.log('Receiver Manager started');
};