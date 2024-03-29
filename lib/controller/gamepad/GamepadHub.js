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
const LeanEvents = require( 'nextgen-events/lib/LeanEvents.js' ) ;



function GamepadHub( controller ) {
	this.gamepads = [] ;
	this.controller = controller ;
}

module.exports = GamepadHub ;

GamepadHub.prototype = Object.create( LeanEvents.prototype ) ;
GamepadHub.prototype.constructor = GamepadHub ;



GamepadHub.prototype.addGamepad = function( gamepad ) {
	if ( this.gamepads[ gamepad.index ] ) {
		this.gamepads[ gamepad.index ].destroy() ;
	}

	this.gamepads[ gamepad.index ] = gamepad ;
	this.emit( 'newGamepad' , gamepad ) ;
} ;



GamepadHub.prototype.removeGamepad = function( gamepad ) { this.removeGamepadByIndex( gamepad.index ) ; } ;

GamepadHub.prototype.removeGamepadByIndex = function( index ) {
	if ( this.gamepads[ index ] ) {
		let gamepad = this.gamepads[ index ] ;
		gamepad.destroy() ;
		delete this.gamepads[ index ] ;
		this.emit( 'removedGamepad' , gamepad ) ;
	}
} ;

