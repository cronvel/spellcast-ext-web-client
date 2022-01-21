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



function GamepadInput() {
	this.dPad = {
		up: 0 ,
		down: 0 ,
		left: 0 ,
		right: 0
	} ;

	this.leftStick = { x: 0 , y: 0 } ;
	this.rightStick = { x: 0 , y: 0 } ;

	this.button = {
		top: 0 ,
		bottom: 0 ,
		left: 0 ,
		right: 0
	} ;

	this.shoulderButton = {
		left: 0 ,
		right: 0 ,
		leftTrigger: 0 ,
		rightTrigger: 0
	} ;

	this.specialButton = {
		left: 0 ,		// select/back/whatever
		right: 0 ,		// start
		center: 0 ,		// some gamepad have a button below "select" and "start"
		leftStick: 0 ,	// click on the left thumbstick
		rightStick: 0 ,	// click on the right thumbstick
	} ;
}

module.exports = GamepadInput ;



GamepadInput.prototype.emitFromDiff = function( base , emit ) {
	if ( base.dPad.up !== this.dPad.up ) { this.emitBoth( emit , base.dPad.up , this.dPad.up , 'DPAD_UP' ) ; }
	if ( base.dPad.down !== this.dPad.down ) { this.emitBoth( emit , base.dPad.down , this.dPad.down , 'DPAD_DOWN' ) ; }
	if ( base.dPad.left !== this.dPad.left ) { this.emitBoth( emit , base.dPad.left , this.dPad.left , 'DPAD_LEFT' ) ; }
	if ( base.dPad.right !== this.dPad.right ) { this.emitBoth( emit , base.dPad.right , this.dPad.right , 'DPAD_RIGHT' ) ; }

	if ( base.leftStick.x !== this.leftStick.x || base.leftStick.y !== this.leftStick.y ) {
		emit( 'change' , 'LEFT_STICK' , this.leftStick.x , this.leftStick.y ) ;
	}

	if ( base.rightStick.x !== this.rightStick.x || base.rightStick.y !== this.rightStick.y ) {
		emit( 'change' , 'RIGHT_STICK' , this.rightStick.x , this.rightStick.y ) ;
	}

	if ( base.button.top !== this.button.top ) { this.emitBoth( emit , base.button.top , this.button.top , 'TOP_BUTTON' ) ; }
	if ( base.button.bottom !== this.button.bottom ) { this.emitBoth( emit , base.button.bottom , this.button.bottom , 'BOTTOM_BUTTON' ) ; }
	if ( base.button.left !== this.button.left ) { this.emitBoth( emit , base.button.left , this.button.left , 'LEFT_BUTTON' ) ; }
	if ( base.button.right !== this.button.right ) { this.emitBoth( emit , base.button.right , this.button.right , 'RIGHT_BUTTON' ) ; }

	if ( base.shoulderButton.left !== this.shoulderButton.left ) { this.emitBoth( emit , base.shoulderButton.left , this.shoulderButton.left , 'LEFT_SHOULDER' ) ; }
	if ( base.shoulderButton.right !== this.shoulderButton.right ) { this.emitBoth( emit , base.shoulderButton.right , this.shoulderButton.right , 'RIGHT_SHOULDER' ) ; }
	if ( base.shoulderButton.leftTrigger !== this.shoulderButton.leftTrigger ) { this.emitBoth( emit , base.shoulderButton.leftTrigger , this.shoulderButton.leftTrigger , 'LEFT_TRIGGER' ) ; }
	if ( base.shoulderButton.rightTrigger !== this.shoulderButton.rightTrigger ) { this.emitBoth( emit , base.shoulderButton.rightTrigger , this.shoulderButton.rightTrigger , 'RIGHT_TRIGGER' ) ; }

	if ( base.specialButton.left !== this.specialButton.left ) { this.emitBoth( emit , base.specialButton.left , this.specialButton.left , 'LEFT_SPECIAL_BUTTON' ) ; }
	if ( base.specialButton.right !== this.specialButton.right ) { this.emitBoth( emit , base.specialButton.right , this.specialButton.right , 'RIGHT_SPECIAL_BUTTON' ) ; }
	if ( base.specialButton.center !== this.specialButton.center ) { this.emitBoth( emit , base.specialButton.center , this.specialButton.center , 'CENTER_SPECIAL_BUTTON' ) ; }
	if ( base.specialButton.leftStick !== this.specialButton.leftStick ) { this.emitBoth( emit , base.specialButton.leftStick , this.specialButton.leftStick , 'LEFT_STICK_BUTTON' ) ; }
	if ( base.specialButton.rightStick !== this.specialButton.rightStick ) { this.emitBoth( emit , base.specialButton.rightStick , this.specialButton.rightStick , 'RIGHT_STICK_BUTTON' ) ; }
} ;



GamepadInput.prototype.emitBoth = function( emit , baseValue , newValue , type ) {
	if ( ! newValue ) { emit( 'key' , type + '_RELEASED' , 0 ) ; }
	else if ( ! baseValue ) { emit( 'key' , type + '_PRESSED' , 1 ) ; }

	emit( 'change' , type , newValue ) ;
} ;

