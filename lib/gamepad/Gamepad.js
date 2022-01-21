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



const GamepadInput = require( './GamepadInput.js' ) ;

//const domKit = require( 'dom-kit' ) ;
//const Promise = require( 'seventh' ) ;
const LeanEvents = require( 'nextgen-events/lib/LeanEvents.js' ) ;



function Gamepad( gameports , index , id ) {
	this.gameports = gameports ;
	this.index = index ;
	this.playerPrefix = 'P' + ( index + 1 ) + '_' ;
	this.id = id ;
	this.isPolling = false ;
	
	this.input = new GamepadInput() ;
	this.lastInput = new GamepadInput() ;

	this.dispatchEmit = this.dispatchEmit.bind( this ) ;
}

module.exports = Gamepad ;

Gamepad.prototype = Object.create( LeanEvents.prototype ) ;
Gamepad.prototype.constructor = Gamepad ;



Gamepad.prototype.destroy = function() {
} ;



Gamepad.prototype.poll = function( poll = true ) {
	poll = !! poll ;
	if ( this.isPolling === poll ) { return ; }

	if ( poll ) { this.startPolling() ; }
	else { this.stopPolling() ; }
} ;



// Called when the internal state was updated
Gamepad.prototype.postProcess = function() {
	// Stick calibration and other related things should be done HERE, before emitting events
	
	// Emit event based on the diff beween the previous state and the new state
	this.input.emitFromDiff( this.lastInput , this.dispatchEmit ) ;
} ;



Gamepad.prototype.dispatchEmit = function( eventName , type , v1 , v2 ) {
	this.emit( eventName , type , v1 , v2 ) ;
	this.gameports.emit( eventName , this.playerPrefix + type , v1 , v2 ) ;
} ;

