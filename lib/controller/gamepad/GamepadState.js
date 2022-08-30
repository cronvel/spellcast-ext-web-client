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



function GamepadState() {
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
		rightStick: 0 	// click on the right thumbstick
	} ;
}

module.exports = GamepadState ;



GamepadState.prototype.emitFromDiff = function( controller , old , gamepad ) {
	if ( this.dPad.up !== old.dPad.up ) { controller.addKeyAndGauge( gamepad , 'DPAD_UP' , this.dPad.up , old.dPad.up ) ; }
	if ( this.dPad.down !== old.dPad.down ) { controller.addKeyAndGauge( gamepad , 'DPAD_DOWN' , this.dPad.down , old.dPad.down ) ; }
	if ( this.dPad.left !== old.dPad.left ) { controller.addKeyAndGauge( gamepad , 'DPAD_LEFT' , this.dPad.left , old.dPad.left ) ; }
	if ( this.dPad.right !== old.dPad.right ) { controller.addKeyAndGauge( gamepad , 'DPAD_RIGHT' , this.dPad.right , old.dPad.right ) ; }

	if ( this.leftStick.x !== old.leftStick.x || this.leftStick.y !== old.leftStick.y ) {
		controller.addGauge2d( gamepad , 'LEFT_STICK' , this.leftStick.x , this.leftStick.y ) ;
	}

	if ( this.rightStick.x !== old.rightStick.x || this.rightStick.y !== old.rightStick.y ) {
		controller.addGauge2d( gamepad , 'RIGHT_STICK' , this.rightStick.x , this.rightStick.y ) ;
	}

	if ( this.button.top !== old.button.top ) { controller.addKeyAndGauge( gamepad , 'TOP_BUTTON' , this.button.top , old.button.top ) ; }
	if ( this.button.bottom !== old.button.bottom ) { controller.addKeyAndGauge( gamepad , 'BOTTOM_BUTTON' , this.button.bottom , old.button.bottom ) ; }
	if ( this.button.left !== old.button.left ) { controller.addKeyAndGauge( gamepad , 'LEFT_BUTTON' , this.button.left , old.button.left ) ; }
	if ( this.button.right !== old.button.right ) { controller.addKeyAndGauge( gamepad , 'RIGHT_BUTTON' , this.button.right , old.button.right ) ; }

	if ( this.shoulderButton.left !== old.shoulderButton.left ) { controller.addKeyAndGauge( gamepad , 'LEFT_SHOULDER' , this.shoulderButton.left , old.shoulderButton.left ) ; }
	if ( this.shoulderButton.right !== old.shoulderButton.right ) { controller.addKeyAndGauge( gamepad , 'RIGHT_SHOULDER' , this.shoulderButton.right , old.shoulderButton.right ) ; }
	if ( this.shoulderButton.leftTrigger !== old.shoulderButton.leftTrigger ) { controller.addKeyAndGauge( gamepad , 'LEFT_TRIGGER' , this.shoulderButton.leftTrigger , old.shoulderButton.leftTrigger ) ; }
	if ( this.shoulderButton.rightTrigger !== old.shoulderButton.rightTrigger ) { controller.addKeyAndGauge( gamepad , 'RIGHT_TRIGGER' , this.shoulderButton.rightTrigger , old.shoulderButton.rightTrigger ) ; }

	if ( this.specialButton.left !== old.specialButton.left ) { controller.addKeyAndGauge( gamepad , 'LEFT_SPECIAL_BUTTON' , this.specialButton.left , old.specialButton.left ) ; }
	if ( this.specialButton.right !== old.specialButton.right ) { controller.addKeyAndGauge( gamepad , 'RIGHT_SPECIAL_BUTTON' , this.specialButton.right , old.specialButton.right ) ; }
	if ( this.specialButton.center !== old.specialButton.center ) { controller.addKeyAndGauge( gamepad , 'CENTER_SPECIAL_BUTTON' , this.specialButton.center , old.specialButton.center ) ; }
	if ( this.specialButton.leftStick !== old.specialButton.leftStick ) { controller.addKeyAndGauge( gamepad , 'LEFT_STICK_BUTTON' , this.specialButton.leftStick , old.specialButton.leftStick ) ; }
	if ( this.specialButton.rightStick !== old.specialButton.rightStick ) { controller.addKeyAndGauge( gamepad , 'RIGHT_STICK_BUTTON' , this.specialButton.rightStick , old.specialButton.rightStick ) ; }

	controller.flushEvents() ;
} ;

