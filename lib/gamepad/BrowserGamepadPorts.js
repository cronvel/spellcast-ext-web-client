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



const GamepadPorts = require( './GamepadPorts.js' ) ;
const BrowserGamepad = require( './BrowserGamepad.js' ) ;

//const domKit = require( 'dom-kit' ) ;
//const Promise = require( 'seventh' ) ;



function BrowserGamepadPorts( bus ) {
	GamepadPorts.call( this , bus ) ;
	this.init() ;
}

module.exports = BrowserGamepadPorts ;

BrowserGamepadPorts.prototype = Object.create( GamepadPorts.prototype ) ;
BrowserGamepadPorts.prototype.constructor = BrowserGamepadPorts ;



BrowserGamepadPorts.prototype.init = function() {
	// First, get all gamepads already connected
	navigator.getGamepads().forEach( ( domGamepad , index ) => {
		if ( ! domGamepad ) { return ; }
		console.warn( "Gamepad #%d pre-connected: %s" , domGamepad.index , domGamepad.id ) ;
		this.addGamepad( new BrowserGamepad( this , domGamepad ) ) ;
	} ) ;

	// Now watch for new gamepad
	window.addEventListener( 'gamepadconnected' , event => {
		console.warn( "Gamepad #%d connected: %s" , event.gamepad.index , event.gamepad.id ) ;
		this.addGamepad( new BrowserGamepad( this , event.gamepad ) ) ;
	} ) ;

	// Watch for disconnecting gamepad
	window.addEventListener( 'gamepaddisconnected' , event => {
		console.warn( "Gamepad #%d disconnected: %s" , event.gamepad.index , event.gamepad.id ) ;
		this.removeGamepadByIndex( event.gamepad.index ) ;
	} ) ;
	
	//*
	this.bus.on( 'key' , ( type , gp , oType ) => {
		console.warn( "Key:" , type , oType ) ;
	} ) ;
	this.bus.on( 'change' , ( type , gp , oType , v1 , v2 ) => {
		console.warn( "Change:" , type , oType , v1 , v2 ) ;
	} ) ;
	//*/
} ;

