/*
	Spellcast's Web Client Extension

	Copyright (c) 2014 - 2021 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



//const domKit = require( 'dom-kit' ) ;
//const Promise = require( 'seventh' ) ;
const Keyboard = require( './Keyboard.js' ) ;



function BrowserKeyboard( controller ) {
	Keyboard.call( this , controller ) ;

	this.codeToKey = {} ;

	this.initEvents() ;
}

module.exports = BrowserKeyboard ;

BrowserKeyboard.prototype = Object.create( Keyboard.prototype ) ;
BrowserKeyboard.prototype.constructor = BrowserKeyboard ;



BrowserKeyboard.prototype.initEvents = function() {
	// Prevent nasty browser shorthand
	document.addEventListener( 'keydown' , event => {
		switch ( event.key ) {
			// Prevent Firefox from opening the Quick Find, since 3D clients don't use HTML input/textarea for their 3D inputs
			case "'" :
			case "/" :
			case "x" :
			case "Tab" :
			case "Alt" :
				event.preventDefault() ;
				break ;
		}

		//console.warn( "keydown event" , event.key , event.code , event.location , event ) ;

		var key = this.codeToKey[ event.code ] ;

		if ( ! key ) { key = this.getKey( event ) ; }

		if ( this.state[ key ] ) { return ; }
		this.state[ key ] = true ;

		this.controller.addKeyPressed( this , key ) ;
		this.controller.flushEvents() ;
	} ) ;

	document.addEventListener( 'keyup' , event => {
		var key = this.codeToKey[ event.code ] ;

		if ( ! key ) { key = this.getKey( event ) ; }

		if ( ! this.state[ key ] ) { return ; }
		this.state[ key ] = false ;

		this.controller.addKeyReleased( this , key ) ;
		this.controller.flushEvents() ;
	} ) ;
} ;



// To be used with event.location
const LOCATION_PREFIX = [ '' , 'LEFT_' , 'RIGHT_' , 'KP_' ] ;

const EVENT_KEY_TO_KEY = {
	// Generic
	'+': 'PLUS' ,
	'-': 'HYPHEN' ,
	'*': 'ASTERISK' ,
	'/': 'SLASH' ,
	'.': 'PERIOD' ,
	'@': 'AT' ,
	// This will allow Azerty (French) Keyboard to work properly:
	',': 'COMMA' ,
	';': 'SEMICOLON' ,
	':': 'COLON' ,
	'!': 'EXCLAMATION' ,
	'Ù': 'PERCENT' ,
	'^': 'CARET' ,	// Won't work, got 'Dead' instead of '^' since it's a Dead key (don't produce output, combine with next key)
	'$': 'DOLLAR' ,
	'<': 'LESSER_THAN' ,
	')': 'LEFT_PARENTHESIS'
} ;

// Add A-Z letters
for ( let c = 65 ; c <= 90 ; c ++ ) {
	let l = String.fromCharCode( c ) ;
	EVENT_KEY_TO_KEY[ l ] = l ;
}

BrowserKeyboard.prototype.getKey = function( event ) {
	var key , eventKey , expectedKey ;

	// First, check with event.key, if there is no modifiers, else use event.code
	if ( ! event.metaKey && ! event.shiftKey && ! event.ctrlKey && ! event.altKey ) {
		eventKey = event.key.toUpperCase() ;
		expectedKey = EVENT_KEY_TO_KEY[ eventKey ] ;

		if ( expectedKey ) {
			key = this.codeToKey[ event.code ] = LOCATION_PREFIX[ event.location ] + expectedKey ;
		}
		else {
			key = this.codeToKey[ event.code ] = this.getKeyByCode( event.code ) ;
		}
	}
	else {
		key = this.getKeyByCode( event.code ) ;
	}

	return key ;
} ;



const TRANSLATE_CODE = {
	'ArrowUp': 'UP' ,
	'ArrowDown': 'DOWN' ,
	'ArrowLeft': 'LEFT' ,
	'ArrowRight': 'RIGHT' ,
	'PageUp': 'PAGE_UP' ,
	'PageDown': 'PAGE_DOWN' ,
	'BracketLeft': 'LEFT_BRACKET' ,
	'BracketRight': 'RIGHT_BRACKET' ,
	'AltLeft': 'ALT' ,	// Not really an alias, it just prevents it to become LEFT_ALT
	'AltRight': 'ALT_GR' ,
	'ShiftLeft': 'LEFT_SHIFT' ,
	'ShiftRight': 'RIGHT_SHIFT' ,
	'ControlLeft': 'LEFT_CONTROL' ,
	'ControlRight': 'RIGHT_CONTROL'
} ;

BrowserKeyboard.prototype.getKeyByCode = function( code ) {
	var key ;

	if ( ( key = TRANSLATE_CODE[ code ] ) ) { return key ; }
	else if ( code.startsWith( 'Key' ) ) { key = code.slice( 3 ) ; }
	else if ( code.startsWith( 'Digit' ) ) { key = code.slice( 5 ) ; }
	else if ( code.startsWith( 'Numpad' ) ) { key = 'KP_' + code.slice( 6 ).toUpperCase() ; }
	else { key = code.toUpperCase() ; }

	return key ;
} ;

