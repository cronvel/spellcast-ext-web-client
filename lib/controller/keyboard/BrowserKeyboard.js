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
			case "'":
			case "/":
			case "x":
			case "Tab":
			case "Alt":
				event.preventDefault() ;
				break ;
		}
		
		console.warn( "keydown event" , event.key , event.code , event.location , event ) ;

		var key = this.getKeyNameByCode( event ) ;

		if ( this.state[ key ] ) { return ; }
		this.state[ key ] = true ;

		this.controller.addKeyPressed( this , key ) ;
		this.controller.flushEvents() ;
	} ) ;

	document.addEventListener( 'keyup' , event => {
		var key = this.getKeyNameByCode( event ) ;

		if ( ! this.state[ key ] ) { return ; }
		this.state[ key ] = false ;

		this.controller.addKeyReleased( this , key ) ;
		this.controller.flushEvents() ;
	} ) ;
} ;



const LOCATION_PREFIX = [ '' , 'LEFT_' , 'RIGHT_' , 'KP_' ] ;



const TRANSLATE_KEY = {
	' ': 'SPACE' ,
	'ArrowUp': 'UP' ,
	'ArrowDown': 'DOWN' ,
	'ArrowLeft': 'LEFT' ,
	'ArrowRight': 'RIGHT' ,
	'PageUp': 'PAGE_UP' ,
	'PageDown': 'PAGE_DOWN' ,
	'Alt': 'ALT' ,	// Not really an alias, it just prevents it to become LEFT_ALT
	'AltGraph': 'ALT_GR' ,
} ;

BrowserKeyboard.prototype.getKeyNameByKey = function( event ) {
	var key = event.key ;

	if ( TRANSLATE_KEY[ key ] ) { return TRANSLATE_KEY[ key ] ; }

	return LOCATION_PREFIX[ event.location ] + key.toUpperCase() ;
	//return key.toUpperCase() + '_' + LOCATION_AFFIX[ event.location ] ;
} ;



const TRANSLATE_CODE = {
	'ArrowUp': 'UP' ,
	'ArrowDown': 'DOWN' ,
	'ArrowLeft': 'LEFT' ,
	'ArrowRight': 'RIGHT' ,
	'PageUp': 'PAGE_UP' ,
	'PageDown': 'PAGE_DOWN' ,
	'AltLeft': 'ALT' ,	// Not really an alias, it just prevents it to become LEFT_ALT
	'AltRight': 'ALT_GR' ,
	'ShiftLeft': 'LEFT_SHIFT' ,
	'ShiftRight': 'RIGHT_SHIFT' ,
	'ControlLeft': 'LEFT_CONTROL' ,
	'ControlRight': 'RIGHT_CONTROL' ,
} ;

BrowserKeyboard.prototype.getKeyNameByCode = function( event ) {
	var translated ,
		key = event.code ;

	if ( ( translated = layout[ this.layout ]?.[ key ] ) ) { return translated ; }
	else if ( ( translated = TRANSLATE_CODE[ key ] ) ) { return translated ; }
	else if ( key.startsWith( 'Key' ) ) { key = key.slice( 3 ) ; }
	else if ( key.startsWith( 'Digit' ) ) { key = key.slice( 5 ) ; }
	else { key = key.toUpperCase() ; }

	return LOCATION_PREFIX[ event.location ] + key.toUpperCase() ;
	//return key.toUpperCase() + '_' + LOCATION_AFFIX[ event.location ] ;
} ;



// Layout

const layout = {} ;

layout.AZERTY = {
	'KeyQ': 'A' ,
	'KeyA': 'Q' ,
	'KeyZ': 'W' ,
	'KeyW': 'Z' ,
	'KeyM': 'COMMA' ,	// ,?
	'Semicolon': 'M' ,
	'Comma': 'SEMICOLON' ,	// ;.
	'Period': 'COLON' ,	// :/
	'Slash': 'EXCLAMATION' ,	// !§
	'Quote': 'PERCENT' ,	// ù%
	'Backslash': 'MULTIPLY' ,	// *µ
	'BracketLeft': 'CARET' ,	// ^¨
	'BracketRight': 'DOLLAR' ,	// $£
	'IntlBackslash': 'LESSER_THAN' ,	// <>
	'Minus': 'RIGHT_PARENTHESIS' ,	// )°]
} ;

