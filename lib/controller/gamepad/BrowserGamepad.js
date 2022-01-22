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



const Gamepad = require( './Gamepad.js' ) ;

//const domKit = require( 'dom-kit' ) ;
//const Promise = require( 'seventh' ) ;



function BrowserGamepad( gamepadHub , domGamepad ) {
	Gamepad.call( this , gamepadHub , domGamepad.index , domGamepad.id ) ;
	
	this.domGamepad = domGamepad ;
	this.lastDomGamepadTimestamp = 0 ;	// store the last domGamepad.timestamp

	this.pollingTimer = null ;
	this.doPolling = this.doPolling.bind( this ) ;
	
	this.initMapping() ;

	
	console.warn(
		"New Gamepad #%d: %s (%d buttons, %d axes)" ,
		this.domGamepad.index , this.domGamepad.id , this.domGamepad.buttons.length ,
		this.domGamepad.axes.length , this
	) ;
}

module.exports = BrowserGamepad ;

BrowserGamepad.prototype = Object.create( Gamepad.prototype ) ;
BrowserGamepad.prototype.constructor = BrowserGamepad ;



BrowserGamepad.prototype.destroy = function() {
	console.warn( "Gamepad #%d destroyed: %s" , this.domGamepad.index , this.domGamepad.id ) ;

	if ( this.pollingTimer ) {
		this.pollingTimer = null ;
		cancelAnimationFrame( this.pollingTimer ) ;
	}
} ;



BrowserGamepad.prototype.startPolling = function() {
	this.doPolling() ;
} ;



BrowserGamepad.prototype.doPolling = function() {
	//console.warn( "doPolling() for" , this.index ) ;
	if ( this.pollingTimer ) {
		this.pollingTimer = null ;
		cancelAnimationFrame( this.pollingTimer ) ;
	}
	
	// First check if there is something new, avoiding wasting computing for nothing
	if ( this.lastDomGamepadTimestamp < this.domGamepad.timestamp ) {
		// Swap state and lastState
		var tmp = this.lastState ; this.lastState = this.state ; this.state = tmp ;

		// Map the underlying browser gamepad to our gamepad state structure
		this.map() ;
		
		// Update for the new value timestamp
		this.lastDomGamepadTimestamp = this.domGamepad.timestamp ;

		// Things to do after updating
		this.postProcess() ;
	}

	this.pollingTimer = requestAnimationFrame( this.doPolling ) ;
} ;



BrowserGamepad.prototype.initMapping = function() {
	if ( this.domGamepad.mapping ) {
		console.warn( "The browser supports the Gamepad '%d' with this mapping: %s:" , this.domGamepad.id , this.domGamepad.mapping ) ;
		return ;
	}

	if ( drivers[ this.domGamepad.id ] ) {
		console.warn( "Found driver for Gamepad:" , this.domGamepad.id ) ;
		this.map = drivers[ this.domGamepad.id ] ;
	}
	else {
		console.warn( "Driver NOT FOUND for Gamepad ID:" , this.domGamepad.id ) ;
	}
} ;



// This is the standard mapping
BrowserGamepad.prototype.map = function() {
	var state = this.state ;
	
	state.button.bottom = this.domGamepad.buttons[ 0 ]?.value || 0 ;
	state.button.right = this.domGamepad.buttons[ 1 ]?.value || 0 ;
	state.button.left = this.domGamepad.buttons[ 2 ]?.value || 0 ;
	state.button.top = this.domGamepad.buttons[ 3 ]?.value || 0 ;

	state.shoulderButton.left = this.domGamepad.buttons[ 4 ]?.value || 0 ;
	state.shoulderButton.right = this.domGamepad.buttons[ 5 ]?.value || 0 ;
	state.shoulderButton.leftTrigger = this.domGamepad.buttons[ 6 ]?.value || 0 ;
	state.shoulderButton.rightTrigger = this.domGamepad.buttons[ 7 ]?.value || 0 ;

	state.specialButton.left = this.domGamepad.buttons[ 8 ]?.value || 0 ;
	state.specialButton.right = this.domGamepad.buttons[ 9 ]?.value || 0 ;
	state.specialButton.leftStick = this.domGamepad.buttons[ 10 ]?.value || 0 ;
	state.specialButton.rightStick = this.domGamepad.buttons[ 11 ]?.value || 0 ;

	state.dPad.top = this.domGamepad.buttons[ 12 ]?.value || 0 ;
	state.dPad.bottom = this.domGamepad.buttons[ 13 ]?.value || 0 ;
	state.dPad.left = this.domGamepad.buttons[ 14 ]?.value || 0 ;
	state.dPad.right = this.domGamepad.buttons[ 15 ]?.value || 0 ;

	state.specialButton.center = this.domGamepad.buttons[ 16 ]?.value || 0 ;
	
	state.leftStick.x = this.domGamepad.axes[ 0 ] || 0 ;
	state.leftStick.y = this.domGamepad.axes[ 1 ] || 0 ;
	state.rightStick.x = this.domGamepad.axes[ 2 ] || 0 ;
	state.rightStick.y = this.domGamepad.axes[ 3 ] || 0 ;
} ;



// Drivers, when no standard gamepad mapping was possible

const drivers = {} ;

drivers['046d-c21d-Logitech Gamepad F310'] = function() {
	var state = this.state ;

	state.button.bottom = this.domGamepad.buttons[ 0 ].value ;
	state.button.right = this.domGamepad.buttons[ 1 ].value ;
	state.button.left = this.domGamepad.buttons[ 2 ].value ;
	state.button.top = this.domGamepad.buttons[ 3 ].value ;

	state.shoulderButton.left = this.domGamepad.buttons[ 4 ].value ;
	state.shoulderButton.right = this.domGamepad.buttons[ 5 ].value ;

	state.specialButton.left = this.domGamepad.buttons[ 6 ].value ;
	state.specialButton.right = this.domGamepad.buttons[ 7 ].value ;
	state.specialButton.center = this.domGamepad.buttons[ 8 ].value ;
	state.specialButton.leftStick = this.domGamepad.buttons[ 9 ].value ;
	state.specialButton.rightStick = this.domGamepad.buttons[ 10 ].value ;

	state.leftStick.x = this.domGamepad.axes[ 0 ] ;
	state.leftStick.y = this.domGamepad.axes[ 1 ] ;
	state.shoulderButton.leftTrigger = this.domGamepad.axes[ 2 ] * 0.5 + 0.5 ;

	state.rightStick.x = this.domGamepad.axes[ 3 ] ;
	state.rightStick.y = this.domGamepad.axes[ 4 ] ;
	state.shoulderButton.rightTrigger = this.domGamepad.axes[ 5 ] * 0.5 + 0.5 ;
	
	state.dPad.left = + ( this.domGamepad.axes[ 6 ] < 0 ) ;
	state.dPad.right = + ( this.domGamepad.axes[ 6 ] > 0 ) ;
	state.dPad.up = + ( this.domGamepad.axes[ 7 ] < 0 ) ;
	state.dPad.down = + ( this.domGamepad.axes[ 7 ] > 0 ) ;
} ;

