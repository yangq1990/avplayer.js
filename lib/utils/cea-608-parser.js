'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 * This code was ported from the dash.js project at:
 *   https://github.com/Dash-Industry-Forum/dash.js/blob/development/externals/cea608-parser.js
 *   https://github.com/Dash-Industry-Forum/dash.js/commit/8269b26a761e0853bb21d78780ed945144ecdd4d#diff-71bc295a2d6b6b7093a1d3290d53a4b2
 *
 * The original copyright appears below:
 *
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2015-2016, DASH Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  1. Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  2. Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 *  Exceptions from regular ASCII. CodePoints are mapped to UTF-16 codes
 */

var specialCea608CharsCodes = {
    0x2a: 0xe1, // lowercase a, acute accent
    0x5c: 0xe9, // lowercase e, acute accent
    0x5e: 0xed, // lowercase i, acute accent
    0x5f: 0xf3, // lowercase o, acute accent
    0x60: 0xfa, // lowercase u, acute accent
    0x7b: 0xe7, // lowercase c with cedilla
    0x7c: 0xf7, // division symbol
    0x7d: 0xd1, // uppercase N tilde
    0x7e: 0xf1, // lowercase n tilde
    0x7f: 0x2588, // Full block
    // THIS BLOCK INCLUDES THE 16 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
    // THAT COME FROM HI BYTE=0x11 AND LOW BETWEEN 0x30 AND 0x3F
    // THIS MEANS THAT \x50 MUST BE ADDED TO THE VALUES
    0x80: 0xae, // Registered symbol (R)
    0x81: 0xb0, // degree sign
    0x82: 0xbd, // 1/2 symbol
    0x83: 0xbf, // Inverted (open) question mark
    0x84: 0x2122, // Trademark symbol (TM)
    0x85: 0xa2, // Cents symbol
    0x86: 0xa3, // Pounds sterling
    0x87: 0x266a, // Music 8'th note
    0x88: 0xe0, // lowercase a, grave accent
    0x89: 0x20, // transparent space (regular)
    0x8a: 0xe8, // lowercase e, grave accent
    0x8b: 0xe2, // lowercase a, circumflex accent
    0x8c: 0xea, // lowercase e, circumflex accent
    0x8d: 0xee, // lowercase i, circumflex accent
    0x8e: 0xf4, // lowercase o, circumflex accent
    0x8f: 0xfb, // lowercase u, circumflex accent
    // THIS BLOCK INCLUDES THE 32 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
    // THAT COME FROM HI BYTE=0x12 AND LOW BETWEEN 0x20 AND 0x3F
    0x90: 0xc1, // capital letter A with acute
    0x91: 0xc9, // capital letter E with acute
    0x92: 0xd3, // capital letter O with acute
    0x93: 0xda, // capital letter U with acute
    0x94: 0xdc, // capital letter U with diaresis
    0x95: 0xfc, // lowercase letter U with diaeresis
    0x96: 0x2018, // opening single quote
    0x97: 0xa1, // inverted exclamation mark
    0x98: 0x2a, // asterisk
    0x99: 0x2019, // closing single quote
    0x9a: 0x2501, // box drawings heavy horizontal
    0x9b: 0xa9, // copyright sign
    0x9c: 0x2120, // Service mark
    0x9d: 0x2022, // (round) bullet
    0x9e: 0x201c, // Left double quotation mark
    0x9f: 0x201d, // Right double quotation mark
    0xa0: 0xc0, // uppercase A, grave accent
    0xa1: 0xc2, // uppercase A, circumflex
    0xa2: 0xc7, // uppercase C with cedilla
    0xa3: 0xc8, // uppercase E, grave accent
    0xa4: 0xca, // uppercase E, circumflex
    0xa5: 0xcb, // capital letter E with diaresis
    0xa6: 0xeb, // lowercase letter e with diaresis
    0xa7: 0xce, // uppercase I, circumflex
    0xa8: 0xcf, // uppercase I, with diaresis
    0xa9: 0xef, // lowercase i, with diaresis
    0xaa: 0xd4, // uppercase O, circumflex
    0xab: 0xd9, // uppercase U, grave accent
    0xac: 0xf9, // lowercase u, grave accent
    0xad: 0xdb, // uppercase U, circumflex
    0xae: 0xab, // left-pointing double angle quotation mark
    0xaf: 0xbb, // right-pointing double angle quotation mark
    // THIS BLOCK INCLUDES THE 32 EXTENDED (TWO-BYTE) LINE 21 CHARACTERS
    // THAT COME FROM HI BYTE=0x13 AND LOW BETWEEN 0x20 AND 0x3F
    0xb0: 0xc3, // Uppercase A, tilde
    0xb1: 0xe3, // Lowercase a, tilde
    0xb2: 0xcd, // Uppercase I, acute accent
    0xb3: 0xcc, // Uppercase I, grave accent
    0xb4: 0xec, // Lowercase i, grave accent
    0xb5: 0xd2, // Uppercase O, grave accent
    0xb6: 0xf2, // Lowercase o, grave accent
    0xb7: 0xd5, // Uppercase O, tilde
    0xb8: 0xf5, // Lowercase o, tilde
    0xb9: 0x7b, // Open curly brace
    0xba: 0x7d, // Closing curly brace
    0xbb: 0x5c, // Backslash
    0xbc: 0x5e, // Caret
    0xbd: 0x5f, // Underscore
    0xbe: 0x7c, // Pipe (vertical line)
    0xbf: 0x223c, // Tilde operator
    0xc0: 0xc4, // Uppercase A, umlaut
    0xc1: 0xe4, // Lowercase A, umlaut
    0xc2: 0xd6, // Uppercase O, umlaut
    0xc3: 0xf6, // Lowercase o, umlaut
    0xc4: 0xdf, // Esszett (sharp S)
    0xc5: 0xa5, // Yen symbol
    0xc6: 0xa4, // Generic currency sign
    0xc7: 0x2503, // Box drawings heavy vertical
    0xc8: 0xc5, // Uppercase A, ring
    0xc9: 0xe5, // Lowercase A, ring
    0xca: 0xd8, // Uppercase O, stroke
    0xcb: 0xf8, // Lowercase o, strok
    0xcc: 0x250f, // Box drawings heavy down and right
    0xcd: 0x2513, // Box drawings heavy down and left
    0xce: 0x2517, // Box drawings heavy up and right
    0xcf: 0x251b // Box drawings heavy up and left
};

/**
 * Utils
 */
var getCharForByte = function getCharForByte(byte) {
    var charCode = byte;
    if (specialCea608CharsCodes.hasOwnProperty(byte)) {
        charCode = specialCea608CharsCodes[byte];
    }
    return String.fromCharCode(charCode);
};

var NR_ROWS = 15,
    NR_COLS = 100;
// Tables to look up row from PAC data
var rowsLowCh1 = { 0x11: 1, 0x12: 3, 0x15: 5, 0x16: 7, 0x17: 9, 0x10: 11, 0x13: 12, 0x14: 14 };
var rowsHighCh1 = { 0x11: 2, 0x12: 4, 0x15: 6, 0x16: 8, 0x17: 10, 0x13: 13, 0x14: 15 };
var rowsLowCh2 = { 0x19: 1, 0x1A: 3, 0x1D: 5, 0x1E: 7, 0x1F: 9, 0x18: 11, 0x1B: 12, 0x1C: 14 };
var rowsHighCh2 = { 0x19: 2, 0x1A: 4, 0x1D: 6, 0x1E: 8, 0x1F: 10, 0x1B: 13, 0x1C: 15 };

var backgroundColors = ['white', 'green', 'blue', 'cyan', 'red', 'yellow', 'magenta', 'black', 'transparent'];

/**
 * Simple logger class to be able to write with time-stamps and filter on level.
 */
var logger = {
    verboseFilter: { 'DATA': 3, 'DEBUG': 3, 'INFO': 2, 'WARNING': 2, 'TEXT': 1, 'ERROR': 0 },
    time: null,
    verboseLevel: 0, // Only write errors
    setTime: function setTime(newTime) {
        this.time = newTime;
    },
    log: function log(severity, msg) {
        var minLevel = this.verboseFilter[severity];
        if (this.verboseLevel >= minLevel) {
            console.log(this.time + ' [' + severity + '] ' + msg);
        }
    }
};

var numArrayToHexArray = function numArrayToHexArray(numArray) {
    var hexArray = [];
    for (var j = 0; j < numArray.length; j++) {
        hexArray.push(numArray[j].toString(16));
    }
    return hexArray;
};

var PenState = function () {
    function PenState(foreground, underline, italics, background, flash) {
        _classCallCheck(this, PenState);

        this.foreground = foreground || 'white';
        this.underline = underline || false;
        this.italics = italics || false;
        this.background = background || 'black';
        this.flash = flash || false;
    }

    _createClass(PenState, [{
        key: 'reset',
        value: function reset() {
            this.foreground = 'white';
            this.underline = false;
            this.italics = false;
            this.background = 'black';
            this.flash = false;
        }
    }, {
        key: 'setStyles',
        value: function setStyles(styles) {
            var attribs = ['foreground', 'underline', 'italics', 'background', 'flash'];
            for (var i = 0; i < attribs.length; i++) {
                var style = attribs[i];
                if (styles.hasOwnProperty(style)) {
                    this[style] = styles[style];
                }
            }
        }
    }, {
        key: 'isDefault',
        value: function isDefault() {
            return this.foreground === 'white' && !this.underline && !this.italics && this.background === 'black' && !this.flash;
        }
    }, {
        key: 'equals',
        value: function equals(other) {
            return this.foreground === other.foreground && this.underline === other.underline && this.italics === other.italics && this.background === other.background && this.flash === other.flash;
        }
    }, {
        key: 'copy',
        value: function copy(newPenState) {
            this.foreground = newPenState.foreground;
            this.underline = newPenState.underline;
            this.italics = newPenState.italics;
            this.background = newPenState.background;
            this.flash = newPenState.flash;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return 'color=' + this.foreground + ', underline=' + this.underline + ', italics=' + this.italics + ', background=' + this.background + ', flash=' + this.flash;
        }
    }]);

    return PenState;
}();

/**
 * Unicode character with styling and background.
 * @constructor
 */


var StyledUnicodeChar = function () {
    function StyledUnicodeChar(uchar, foreground, underline, italics, background, flash) {
        _classCallCheck(this, StyledUnicodeChar);

        this.uchar = uchar || ' '; // unicode character
        this.penState = new PenState(foreground, underline, italics, background, flash);
    }

    _createClass(StyledUnicodeChar, [{
        key: 'reset',
        value: function reset() {
            this.uchar = ' ';
            this.penState.reset();
        }
    }, {
        key: 'setChar',
        value: function setChar(uchar, newPenState) {
            this.uchar = uchar;
            this.penState.copy(newPenState);
        }
    }, {
        key: 'setPenState',
        value: function setPenState(newPenState) {
            this.penState.copy(newPenState);
        }
    }, {
        key: 'equals',
        value: function equals(other) {
            return this.uchar === other.uchar && this.penState.equals(other.penState);
        }
    }, {
        key: 'copy',
        value: function copy(newChar) {
            this.uchar = newChar.uchar;
            this.penState.copy(newChar.penState);
        }
    }, {
        key: 'isEmpty',
        value: function isEmpty() {
            return this.uchar === ' ' && this.penState.isDefault();
        }
    }]);

    return StyledUnicodeChar;
}();

/**
 * CEA-608 row consisting of NR_COLS instances of StyledUnicodeChar.
 * @constructor
 */


var Row = function () {
    function Row() {
        _classCallCheck(this, Row);

        this.chars = [];
        for (var i = 0; i < NR_COLS; i++) {
            this.chars.push(new StyledUnicodeChar());
        }
        this.pos = 0;
        this.currPenState = new PenState();
    }

    _createClass(Row, [{
        key: 'equals',
        value: function equals(other) {
            var equal = true;
            for (var i = 0; i < NR_COLS; i++) {
                if (!this.chars[i].equals(other.chars[i])) {
                    equal = false;
                    break;
                }
            }
            return equal;
        }
    }, {
        key: 'copy',
        value: function copy(other) {
            for (var i = 0; i < NR_COLS; i++) {
                this.chars[i].copy(other.chars[i]);
            }
        }
    }, {
        key: 'isEmpty',
        value: function isEmpty() {
            var empty = true;
            for (var i = 0; i < NR_COLS; i++) {
                if (!this.chars[i].isEmpty()) {
                    empty = false;
                    break;
                }
            }
            return empty;
        }

        /**
         *  Set the cursor to a valid column.
         */

    }, {
        key: 'setCursor',
        value: function setCursor(absPos) {
            if (this.pos !== absPos) {
                this.pos = absPos;
            }
            if (this.pos < 0) {
                logger.log('ERROR', 'Negative cursor position ' + this.pos);
                this.pos = 0;
            } else if (this.pos > NR_COLS) {
                logger.log('ERROR', 'Too large cursor position ' + this.pos);
                this.pos = NR_COLS;
            }
        }

        /**
         * Move the cursor relative to current position.
         */

    }, {
        key: 'moveCursor',
        value: function moveCursor(relPos) {
            var newPos = this.pos + relPos;
            if (relPos > 1) {
                for (var i = this.pos + 1; i < newPos + 1; i++) {
                    this.chars[i].setPenState(this.currPenState);
                }
            }
            this.setCursor(newPos);
        }

        /**
         * Backspace, move one step back and clear character.
         */

    }, {
        key: 'backSpace',
        value: function backSpace() {
            this.moveCursor(-1);
            this.chars[this.pos].setChar(' ', this.currPenState);
        }
    }, {
        key: 'insertChar',
        value: function insertChar(byte) {
            if (byte >= 0x90) {
                //Extended char
                this.backSpace();
            }
            var char = getCharForByte(byte);
            if (this.pos >= NR_COLS) {
                logger.log('ERROR', 'Cannot insert ' + byte.toString(16) + ' (' + char + ') at position ' + this.pos + '. Skipping it!');
                return;
            }
            this.chars[this.pos].setChar(char, this.currPenState);
            this.moveCursor(1);
        }
    }, {
        key: 'clearFromPos',
        value: function clearFromPos(startPos) {
            var i;
            for (i = startPos; i < NR_COLS; i++) {
                this.chars[i].reset();
            }
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.clearFromPos(0);
            this.pos = 0;
            this.currPenState.reset();
        }
    }, {
        key: 'clearToEndOfRow',
        value: function clearToEndOfRow() {
            this.clearFromPos(this.pos);
        }
    }, {
        key: 'getTextString',
        value: function getTextString() {
            var chars = [];
            var empty = true;
            for (var i = 0; i < NR_COLS; i++) {
                var char = this.chars[i].uchar;
                if (char !== ' ') {
                    empty = false;
                }
                chars.push(char);
            }
            if (empty) {
                return '';
            } else {
                return chars.join('');
            }
        }
    }, {
        key: 'setPenStyles',
        value: function setPenStyles(styles) {
            this.currPenState.setStyles(styles);
            var currChar = this.chars[this.pos];
            currChar.setPenState(this.currPenState);
        }
    }]);

    return Row;
}();

/**
 * Keep a CEA-608 screen of 32x15 styled characters
 * @constructor
*/


var CaptionScreen = function () {
    function CaptionScreen() {
        _classCallCheck(this, CaptionScreen);

        this.rows = [];
        for (var i = 0; i < NR_ROWS; i++) {
            this.rows.push(new Row()); // Note that we use zero-based numbering (0-14)
        }
        this.currRow = NR_ROWS - 1;
        this.nrRollUpRows = null;
        this.reset();
    }

    _createClass(CaptionScreen, [{
        key: 'reset',
        value: function reset() {
            for (var i = 0; i < NR_ROWS; i++) {
                this.rows[i].clear();
            }
            this.currRow = NR_ROWS - 1;
        }
    }, {
        key: 'equals',
        value: function equals(other) {
            var equal = true;
            for (var i = 0; i < NR_ROWS; i++) {
                if (!this.rows[i].equals(other.rows[i])) {
                    equal = false;
                    break;
                }
            }
            return equal;
        }
    }, {
        key: 'copy',
        value: function copy(other) {
            for (var i = 0; i < NR_ROWS; i++) {
                this.rows[i].copy(other.rows[i]);
            }
        }
    }, {
        key: 'isEmpty',
        value: function isEmpty() {
            var empty = true;
            for (var i = 0; i < NR_ROWS; i++) {
                if (!this.rows[i].isEmpty()) {
                    empty = false;
                    break;
                }
            }
            return empty;
        }
    }, {
        key: 'backSpace',
        value: function backSpace() {
            var row = this.rows[this.currRow];
            row.backSpace();
        }
    }, {
        key: 'clearToEndOfRow',
        value: function clearToEndOfRow() {
            var row = this.rows[this.currRow];
            row.clearToEndOfRow();
        }

        /**
         * Insert a character (without styling) in the current row.
         */

    }, {
        key: 'insertChar',
        value: function insertChar(char) {
            var row = this.rows[this.currRow];
            row.insertChar(char);
        }
    }, {
        key: 'setPen',
        value: function setPen(styles) {
            var row = this.rows[this.currRow];
            row.setPenStyles(styles);
        }
    }, {
        key: 'moveCursor',
        value: function moveCursor(relPos) {
            var row = this.rows[this.currRow];
            row.moveCursor(relPos);
        }
    }, {
        key: 'setCursor',
        value: function setCursor(absPos) {
            logger.log('INFO', 'setCursor: ' + absPos);
            var row = this.rows[this.currRow];
            row.setCursor(absPos);
        }
    }, {
        key: 'setPAC',
        value: function setPAC(pacData) {
            logger.log('INFO', 'pacData = ' + JSON.stringify(pacData));
            var newRow = pacData.row - 1;
            if (this.nrRollUpRows && newRow < this.nrRollUpRows - 1) {
                newRow = this.nrRollUpRows - 1;
            }

            //Make sure this only affects Roll-up Captions by checking this.nrRollUpRows
            if (this.nrRollUpRows && this.currRow !== newRow) {
                //clear all rows first
                for (var i = 0; i < NR_ROWS; i++) {
                    this.rows[i].clear();
                }

                //Copy this.nrRollUpRows rows from lastOutputScreen and place it in the newRow location
                //topRowIndex - the start of rows to copy (inclusive index)
                var topRowIndex = this.currRow + 1 - this.nrRollUpRows;
                //We only copy if the last position was already shown.
                //We use the cueStartTime value to check this.
                var lastOutputScreen = this.lastOutputScreen;
                if (lastOutputScreen) {
                    var prevLineTime = lastOutputScreen.rows[topRowIndex].cueStartTime;
                    if (prevLineTime && prevLineTime < logger.time) {
                        for (var _i = 0; _i < this.nrRollUpRows; _i++) {
                            this.rows[newRow - this.nrRollUpRows + _i + 1].copy(lastOutputScreen.rows[topRowIndex + _i]);
                        }
                    }
                }
            }

            this.currRow = newRow;
            var row = this.rows[this.currRow];
            if (pacData.indent !== null) {
                var indent = pacData.indent;
                var prevPos = Math.max(indent - 1, 0);
                row.setCursor(pacData.indent);
                pacData.color = row.chars[prevPos].penState.foreground;
            }
            var styles = { foreground: pacData.color, underline: pacData.underline, italics: pacData.italics, background: 'black', flash: false };
            this.setPen(styles);
        }

        /**
         * Set background/extra foreground, but first do back_space, and then insert space (backwards compatibility).
         */

    }, {
        key: 'setBkgData',
        value: function setBkgData(bkgData) {

            logger.log('INFO', 'bkgData = ' + JSON.stringify(bkgData));
            this.backSpace();
            this.setPen(bkgData);
            this.insertChar(0x20); //Space
        }
    }, {
        key: 'setRollUpRows',
        value: function setRollUpRows(nrRows) {
            this.nrRollUpRows = nrRows;
        }
    }, {
        key: 'rollUp',
        value: function rollUp() {
            if (this.nrRollUpRows === null) {
                logger.log('DEBUG', 'roll_up but nrRollUpRows not set yet');
                return; //Not properly setup
            }
            logger.log('TEXT', this.getDisplayText());
            var topRowIndex = this.currRow + 1 - this.nrRollUpRows;
            var topRow = this.rows.splice(topRowIndex, 1)[0];
            topRow.clear();
            this.rows.splice(this.currRow, 0, topRow);
            logger.log('INFO', 'Rolling up');
            //logger.log('TEXT', this.get_display_text())
        }

        /**
         * Get all non-empty rows with as unicode text.
         */

    }, {
        key: 'getDisplayText',
        value: function getDisplayText(asOneRow) {
            asOneRow = asOneRow || false;
            var displayText = [];
            var text = '';
            var rowNr = -1;
            for (var i = 0; i < NR_ROWS; i++) {
                var rowText = this.rows[i].getTextString();
                if (rowText) {
                    rowNr = i + 1;
                    if (asOneRow) {
                        displayText.push('Row ' + rowNr + ': \'' + rowText + '\'');
                    } else {
                        displayText.push(rowText.trim());
                    }
                }
            }
            if (displayText.length > 0) {
                if (asOneRow) {
                    text = '[' + displayText.join(' | ') + ']';
                } else {
                    text = displayText.join('\n');
                }
            }
            return text;
        }
    }, {
        key: 'getTextAndFormat',
        value: function getTextAndFormat() {
            return this.rows;
        }
    }]);

    return CaptionScreen;
}();

//var modes = ['MODE_ROLL-UP', 'MODE_POP-ON', 'MODE_PAINT-ON', 'MODE_TEXT'];

var Cea608Channel = function () {
    function Cea608Channel(channelNumber, outputFilter) {
        _classCallCheck(this, Cea608Channel);

        this.chNr = channelNumber;
        this.outputFilter = outputFilter;
        this.mode = null;
        this.verbose = 0;
        this.displayedMemory = new CaptionScreen();
        this.nonDisplayedMemory = new CaptionScreen();
        this.lastOutputScreen = new CaptionScreen();
        this.currRollUpRow = this.displayedMemory.rows[NR_ROWS - 1];
        this.writeScreen = this.displayedMemory;
        this.mode = null;
        this.cueStartTime = null; // Keeps track of where a cue started.
    }

    _createClass(Cea608Channel, [{
        key: 'reset',
        value: function reset() {
            this.mode = null;
            this.displayedMemory.reset();
            this.nonDisplayedMemory.reset();
            this.lastOutputScreen.reset();
            this.currRollUpRow = this.displayedMemory.rows[NR_ROWS - 1];
            this.writeScreen = this.displayedMemory;
            this.mode = null;
            this.cueStartTime = null;
            this.lastCueEndTime = null;
        }
    }, {
        key: 'getHandler',
        value: function getHandler() {
            return this.outputFilter;
        }
    }, {
        key: 'setHandler',
        value: function setHandler(newHandler) {
            this.outputFilter = newHandler;
        }
    }, {
        key: 'setPAC',
        value: function setPAC(pacData) {
            this.writeScreen.setPAC(pacData);
        }
    }, {
        key: 'setBkgData',
        value: function setBkgData(bkgData) {
            this.writeScreen.setBkgData(bkgData);
        }
    }, {
        key: 'setMode',
        value: function setMode(newMode) {
            if (newMode === this.mode) {
                return;
            }
            this.mode = newMode;
            logger.log('INFO', 'MODE=' + newMode);
            if (this.mode === 'MODE_POP-ON') {
                this.writeScreen = this.nonDisplayedMemory;
            } else {
                this.writeScreen = this.displayedMemory;
                this.writeScreen.reset();
            }
            if (this.mode !== 'MODE_ROLL-UP') {
                this.displayedMemory.nrRollUpRows = null;
                this.nonDisplayedMemory.nrRollUpRows = null;
            }
            this.mode = newMode;
        }
    }, {
        key: 'insertChars',
        value: function insertChars(chars) {
            for (var i = 0; i < chars.length; i++) {
                this.writeScreen.insertChar(chars[i]);
            }
            var screen = this.writeScreen === this.displayedMemory ? 'DISP' : 'NON_DISP';
            logger.log('INFO', screen + ': ' + this.writeScreen.getDisplayText(true));
            if (this.mode === 'MODE_PAINT-ON' || this.mode === 'MODE_ROLL-UP') {
                logger.log('TEXT', 'DISPLAYED: ' + this.displayedMemory.getDisplayText(true));
                this.outputDataUpdate();
            }
        }
    }, {
        key: 'ccRCL',
        value: function ccRCL() {
            // Resume Caption Loading (switch mode to Pop On)
            logger.log('INFO', 'RCL - Resume Caption Loading');
            this.setMode('MODE_POP-ON');
        }
    }, {
        key: 'ccBS',
        value: function ccBS() {
            // BackSpace
            logger.log('INFO', 'BS - BackSpace');
            if (this.mode === 'MODE_TEXT') {
                return;
            }
            this.writeScreen.backSpace();
            if (this.writeScreen === this.displayedMemory) {
                this.outputDataUpdate();
            }
        }
    }, {
        key: 'ccAOF',
        value: function ccAOF() {
            // Reserved (formerly Alarm Off)
            return;
        }
    }, {
        key: 'ccAON',
        value: function ccAON() {
            // Reserved (formerly Alarm On)
            return;
        }
    }, {
        key: 'ccDER',
        value: function ccDER() {
            // Delete to End of Row
            logger.log('INFO', 'DER- Delete to End of Row');
            this.writeScreen.clearToEndOfRow();
            this.outputDataUpdate();
        }
    }, {
        key: 'ccRU',
        value: function ccRU(nrRows) {
            //Roll-Up Captions-2,3,or 4 Rows
            logger.log('INFO', 'RU(' + nrRows + ') - Roll Up');
            this.writeScreen = this.displayedMemory;
            this.setMode('MODE_ROLL-UP');
            this.writeScreen.setRollUpRows(nrRows);
        }
    }, {
        key: 'ccFON',
        value: function ccFON() {
            //Flash On
            logger.log('INFO', 'FON - Flash On');
            this.writeScreen.setPen({ flash: true });
        }
    }, {
        key: 'ccRDC',
        value: function ccRDC() {
            // Resume Direct Captioning (switch mode to PaintOn)
            logger.log('INFO', 'RDC - Resume Direct Captioning');
            this.setMode('MODE_PAINT-ON');
        }
    }, {
        key: 'ccTR',
        value: function ccTR() {
            // Text Restart in text mode (not supported, however)
            logger.log('INFO', 'TR');
            this.setMode('MODE_TEXT');
        }
    }, {
        key: 'ccRTD',
        value: function ccRTD() {
            // Resume Text Display in Text mode (not supported, however)
            logger.log('INFO', 'RTD');
            this.setMode('MODE_TEXT');
        }
    }, {
        key: 'ccEDM',
        value: function ccEDM() {
            // Erase Displayed Memory
            logger.log('INFO', 'EDM - Erase Displayed Memory');
            this.displayedMemory.reset();
            this.outputDataUpdate();
        }
    }, {
        key: 'ccCR',
        value: function ccCR() {
            // Carriage Return
            logger.log('CR - Carriage Return');
            this.writeScreen.rollUp();
            this.outputDataUpdate();
        }
    }, {
        key: 'ccENM',
        value: function ccENM() {
            //Erase Non-Displayed Memory
            logger.log('INFO', 'ENM - Erase Non-displayed Memory');
            this.nonDisplayedMemory.reset();
        }
    }, {
        key: 'ccEOC',
        value: function ccEOC() {
            //End of Caption (Flip Memories)
            logger.log('INFO', 'EOC - End Of Caption');
            if (this.mode === 'MODE_POP-ON') {
                var tmp = this.displayedMemory;
                this.displayedMemory = this.nonDisplayedMemory;
                this.nonDisplayedMemory = tmp;
                this.writeScreen = this.nonDisplayedMemory;
                logger.log('TEXT', 'DISP: ' + this.displayedMemory.getDisplayText());
            }
            this.outputDataUpdate();
        }
    }, {
        key: 'ccTO',
        value: function ccTO(nrCols) {
            // Tab Offset 1,2, or 3 columns
            logger.log('INFO', 'TO(' + nrCols + ') - Tab Offset');
            this.writeScreen.moveCursor(nrCols);
        }
    }, {
        key: 'ccMIDROW',
        value: function ccMIDROW(secondByte) {
            // Parse MIDROW command
            var styles = { flash: false };
            styles.underline = secondByte % 2 === 1;
            styles.italics = secondByte >= 0x2e;
            if (!styles.italics) {
                var colorIndex = Math.floor(secondByte / 2) - 0x10;
                var colors = ['white', 'green', 'blue', 'cyan', 'red', 'yellow', 'magenta'];
                styles.foreground = colors[colorIndex];
            } else {
                styles.foreground = 'white';
            }
            logger.log('INFO', 'MIDROW: ' + JSON.stringify(styles));
            this.writeScreen.setPen(styles);
        }
    }, {
        key: 'outputDataUpdate',
        value: function outputDataUpdate() {
            var t = logger.time;
            if (t === null) {
                return;
            }
            if (this.outputFilter) {
                if (this.outputFilter.updateData) {
                    this.outputFilter.updateData(t, this.displayedMemory);
                }
                if (this.cueStartTime === null && !this.displayedMemory.isEmpty()) {
                    // Start of a new cue
                    this.cueStartTime = t;
                } else {
                    if (!this.displayedMemory.equals(this.lastOutputScreen)) {
                        if (this.outputFilter.newCue) {
                            this.outputFilter.newCue(this.cueStartTime, t, this.lastOutputScreen);
                        }
                        this.cueStartTime = this.displayedMemory.isEmpty() ? null : t;
                    }
                }
                this.lastOutputScreen.copy(this.displayedMemory);
            }
        }
    }, {
        key: 'cueSplitAtTime',
        value: function cueSplitAtTime(t) {
            if (this.outputFilter) {
                if (!this.displayedMemory.isEmpty()) {
                    if (this.outputFilter.newCue) {
                        this.outputFilter.newCue(this.cueStartTime, t, this.displayedMemory);
                    }
                    this.cueStartTime = t;
                }
            }
        }
    }]);

    return Cea608Channel;
}();

var Cea608Parser = function () {
    function Cea608Parser(field, out1, out2) {
        _classCallCheck(this, Cea608Parser);

        this.field = field || 1;
        this.outputs = [out1, out2];
        this.channels = [new Cea608Channel(1, out1), new Cea608Channel(2, out2)];
        this.currChNr = -1; // Will be 1 or 2
        this.lastCmdA = null; // First byte of last command
        this.lastCmdB = null; // Second byte of last command
        this.bufferedData = [];
        this.startTime = null;
        this.lastTime = null;
        this.dataCounters = { 'padding': 0, 'char': 0, 'cmd': 0, 'other': 0 };
    }

    _createClass(Cea608Parser, [{
        key: 'getHandler',
        value: function getHandler(index) {
            return this.channels[index].getHandler();
        }
    }, {
        key: 'setHandler',
        value: function setHandler(index, newHandler) {
            this.channels[index].setHandler(newHandler);
        }

        /**
         * Add data for time t in forms of list of bytes (unsigned ints). The bytes are treated as pairs.
         */

    }, {
        key: 'addData',
        value: function addData(t, byteList) {
            var cmdFound,
                a,
                b,
                charsFound = false;

            this.lastTime = t;
            logger.setTime(t);

            for (var i = 0; i < byteList.length; i += 2) {
                a = byteList[i] & 0x7f;
                b = byteList[i + 1] & 0x7f;
                if (a === 0 && b === 0) {
                    this.dataCounters.padding += 2;
                    continue;
                } else {
                    logger.log('DATA', '[' + numArrayToHexArray([byteList[i], byteList[i + 1]]) + '] -> (' + numArrayToHexArray([a, b]) + ')');
                }
                cmdFound = this.parseCmd(a, b);
                if (!cmdFound) {
                    cmdFound = this.parseMidrow(a, b);
                }
                if (!cmdFound) {
                    cmdFound = this.parsePAC(a, b);
                }
                if (!cmdFound) {
                    cmdFound = this.parseBackgroundAttributes(a, b);
                }
                if (!cmdFound) {
                    charsFound = this.parseChars(a, b);
                    if (charsFound) {
                        if (this.currChNr && this.currChNr >= 0) {
                            var channel = this.channels[this.currChNr - 1];
                            channel.insertChars(charsFound);
                        } else {
                            logger.log('WARNING', 'No channel found yet. TEXT-MODE?');
                        }
                    }
                }
                if (cmdFound) {
                    this.dataCounters.cmd += 2;
                } else if (charsFound) {
                    this.dataCounters.char += 2;
                } else {
                    this.dataCounters.other += 2;
                    logger.log('WARNING', 'Couldn\'t parse cleaned data ' + numArrayToHexArray([a, b]) + ' orig: ' + numArrayToHexArray([byteList[i], byteList[i + 1]]));
                }
            }
        }

        /**
         * Parse Command.
         * @returns {Boolean} Tells if a command was found
         */

    }, {
        key: 'parseCmd',
        value: function parseCmd(a, b) {
            var chNr = null;

            var cond1 = (a === 0x14 || a === 0x1C) && 0x20 <= b && b <= 0x2F;
            var cond2 = (a === 0x17 || a === 0x1F) && 0x21 <= b && b <= 0x23;
            if (!(cond1 || cond2)) {
                return false;
            }

            if (a === this.lastCmdA && b === this.lastCmdB) {
                this.lastCmdA = null;
                this.lastCmdB = null; // Repeated commands are dropped (once)
                logger.log('DEBUG', 'Repeated command (' + numArrayToHexArray([a, b]) + ') is dropped');
                return true;
            }

            if (a === 0x14 || a === 0x17) {
                chNr = 1;
            } else {
                chNr = 2; // (a === 0x1C || a=== 0x1f)
            }

            var channel = this.channels[chNr - 1];

            if (a === 0x14 || a === 0x1C) {
                if (b === 0x20) {
                    channel.ccRCL();
                } else if (b === 0x21) {
                    channel.ccBS();
                } else if (b === 0x22) {
                    channel.ccAOF();
                } else if (b === 0x23) {
                    channel.ccAON();
                } else if (b === 0x24) {
                    channel.ccDER();
                } else if (b === 0x25) {
                    channel.ccRU(2);
                } else if (b === 0x26) {
                    channel.ccRU(3);
                } else if (b === 0x27) {
                    channel.ccRU(4);
                } else if (b === 0x28) {
                    channel.ccFON();
                } else if (b === 0x29) {
                    channel.ccRDC();
                } else if (b === 0x2A) {
                    channel.ccTR();
                } else if (b === 0x2B) {
                    channel.ccRTD();
                } else if (b === 0x2C) {
                    channel.ccEDM();
                } else if (b === 0x2D) {
                    channel.ccCR();
                } else if (b === 0x2E) {
                    channel.ccENM();
                } else if (b === 0x2F) {
                    channel.ccEOC();
                }
            } else {
                //a == 0x17 || a == 0x1F
                channel.ccTO(b - 0x20);
            }
            this.lastCmdA = a;
            this.lastCmdB = b;
            this.currChNr = chNr;
            return true;
        }

        /**
         * Parse midrow styling command
         * @returns {Boolean}
         */

    }, {
        key: 'parseMidrow',
        value: function parseMidrow(a, b) {
            var chNr = null;

            if ((a === 0x11 || a === 0x19) && 0x20 <= b && b <= 0x2f) {
                if (a === 0x11) {
                    chNr = 1;
                } else {
                    chNr = 2;
                }
                if (chNr !== this.currChNr) {
                    logger.log('ERROR', 'Mismatch channel in midrow parsing');
                    return false;
                }
                var channel = this.channels[chNr - 1];
                channel.ccMIDROW(b);
                logger.log('DEBUG', 'MIDROW (' + numArrayToHexArray([a, b]) + ')');
                return true;
            }
            return false;
        }
        /**
         * Parse Preable Access Codes (Table 53).
         * @returns {Boolean} Tells if PAC found
         */

    }, {
        key: 'parsePAC',
        value: function parsePAC(a, b) {

            var chNr = null;
            var row = null;

            var case1 = (0x11 <= a && a <= 0x17 || 0x19 <= a && a <= 0x1F) && 0x40 <= b && b <= 0x7F;
            var case2 = (a === 0x10 || a === 0x18) && 0x40 <= b && b <= 0x5F;
            if (!(case1 || case2)) {
                return false;
            }

            if (a === this.lastCmdA && b === this.lastCmdB) {
                this.lastCmdA = null;
                this.lastCmdB = null;
                return true; // Repeated commands are dropped (once)
            }

            chNr = a <= 0x17 ? 1 : 2;

            if (0x40 <= b && b <= 0x5F) {
                row = chNr === 1 ? rowsLowCh1[a] : rowsLowCh2[a];
            } else {
                // 0x60 <= b <= 0x7F
                row = chNr === 1 ? rowsHighCh1[a] : rowsHighCh2[a];
            }
            var pacData = this.interpretPAC(row, b);
            var channel = this.channels[chNr - 1];
            channel.setPAC(pacData);
            this.lastCmdA = a;
            this.lastCmdB = b;
            this.currChNr = chNr;
            return true;
        }

        /**
         * Interpret the second byte of the pac, and return the information.
         * @returns {Object} pacData with style parameters.
         */

    }, {
        key: 'interpretPAC',
        value: function interpretPAC(row, byte) {
            var pacIndex = byte;
            var pacData = { color: null, italics: false, indent: null, underline: false, row: row };

            if (byte > 0x5F) {
                pacIndex = byte - 0x60;
            } else {
                pacIndex = byte - 0x40;
            }
            pacData.underline = (pacIndex & 1) === 1;
            if (pacIndex <= 0xd) {
                pacData.color = ['white', 'green', 'blue', 'cyan', 'red', 'yellow', 'magenta', 'white'][Math.floor(pacIndex / 2)];
            } else if (pacIndex <= 0xf) {
                pacData.italics = true;
                pacData.color = 'white';
            } else {
                pacData.indent = Math.floor((pacIndex - 0x10) / 2) * 4;
            }
            return pacData; // Note that row has zero offset. The spec uses 1.
        }

        /**
         * Parse characters.
         * @returns An array with 1 to 2 codes corresponding to chars, if found. null otherwise.
         */

    }, {
        key: 'parseChars',
        value: function parseChars(a, b) {

            var channelNr = null,
                charCodes = null,
                charCode1 = null;

            if (a >= 0x19) {
                channelNr = 2;
                charCode1 = a - 8;
            } else {
                channelNr = 1;
                charCode1 = a;
            }
            if (0x11 <= charCode1 && charCode1 <= 0x13) {
                // Special character
                var oneCode = b;
                if (charCode1 === 0x11) {
                    oneCode = b + 0x50;
                } else if (charCode1 === 0x12) {
                    oneCode = b + 0x70;
                } else {
                    oneCode = b + 0x90;
                }
                logger.log('INFO', 'Special char \'' + getCharForByte(oneCode) + '\' in channel ' + channelNr);
                charCodes = [oneCode];
            } else if (0x20 <= a && a <= 0x7f) {
                charCodes = b === 0 ? [a] : [a, b];
            }
            if (charCodes) {
                var hexCodes = numArrayToHexArray(charCodes);
                logger.log('DEBUG', 'Char codes =  ' + hexCodes.join(','));
                this.lastCmdA = null;
                this.lastCmdB = null;
            }
            return charCodes;
        }

        /**
        * Parse extended background attributes as well as new foreground color black.
        * @returns{Boolean} Tells if background attributes are found
        */

    }, {
        key: 'parseBackgroundAttributes',
        value: function parseBackgroundAttributes(a, b) {
            var bkgData, index, chNr, channel;

            var case1 = (a === 0x10 || a === 0x18) && 0x20 <= b && b <= 0x2f;
            var case2 = (a === 0x17 || a === 0x1f) && 0x2d <= b && b <= 0x2f;
            if (!(case1 || case2)) {
                return false;
            }
            bkgData = {};
            if (a === 0x10 || a === 0x18) {
                index = Math.floor((b - 0x20) / 2);
                bkgData.background = backgroundColors[index];
                if (b % 2 === 1) {
                    bkgData.background = bkgData.background + '_semi';
                }
            } else if (b === 0x2d) {
                bkgData.background = 'transparent';
            } else {
                bkgData.foreground = 'black';
                if (b === 0x2f) {
                    bkgData.underline = true;
                }
            }
            chNr = a < 0x18 ? 1 : 2;
            channel = this.channels[chNr - 1];
            channel.setBkgData(bkgData);
            this.lastCmdA = null;
            this.lastCmdB = null;
            return true;
        }

        /**
         * Reset state of parser and its channels.
         */

    }, {
        key: 'reset',
        value: function reset() {
            for (var i = 0; i < this.channels.length; i++) {
                if (this.channels[i]) {
                    this.channels[i].reset();
                }
            }
            this.lastCmdA = null;
            this.lastCmdB = null;
        }

        /**
         * Trigger the generation of a cue, and the start of a new one if displayScreens are not empty.
         */

    }, {
        key: 'cueSplitAtTime',
        value: function cueSplitAtTime(t) {
            for (var i = 0; i < this.channels.length; i++) {
                if (this.channels[i]) {
                    this.channels[i].cueSplitAtTime(t);
                }
            }
        }
    }]);

    return Cea608Parser;
}();

exports.default = Cea608Parser;