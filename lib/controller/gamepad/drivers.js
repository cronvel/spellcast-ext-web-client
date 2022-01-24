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



exports['046d-c21d-Logitech Gamepad F310'] = ( state , buttons , axes ) => {
	state.button.bottom = buttons[ 0 ] ;
	state.button.right = buttons[ 1 ] ;
	state.button.left = buttons[ 2 ] ;
	state.button.top = buttons[ 3 ] ;

	state.shoulderButton.left = buttons[ 4 ] ;
	state.shoulderButton.right = buttons[ 5 ] ;

	state.specialButton.left = buttons[ 6 ] ;
	state.specialButton.right = buttons[ 7 ] ;
	state.specialButton.center = buttons[ 8 ] ;
	state.specialButton.leftStick = buttons[ 9 ] ;
	state.specialButton.rightStick = buttons[ 10 ] ;

	state.leftStick.x = axes[ 0 ] ;
	state.leftStick.y = axes[ 1 ] ;
	state.shoulderButton.leftTrigger = axes[ 2 ] * 0.5 + 0.5 ;

	state.rightStick.x = axes[ 3 ] ;
	state.rightStick.y = axes[ 4 ] ;
	state.shoulderButton.rightTrigger = axes[ 5 ] * 0.5 + 0.5 ;
	
	state.dPad.left = + ( axes[ 6 ] < 0 ) ;
	state.dPad.right = + ( axes[ 6 ] > 0 ) ;
	state.dPad.up = + ( axes[ 7 ] < 0 ) ;
	state.dPad.down = + ( axes[ 7 ] > 0 ) ;
} ;

exports['0810-0001-Twin USB Joystick'] = ( state , buttons , axes ) => {
	console.warn( "Twin Joystick" , buttons , axes ) ;
	state.button.top = buttons[ 0 ] ;
	state.button.right = buttons[ 1 ] ;
	state.button.bottom = buttons[ 2 ] ;
	state.button.left = buttons[ 3 ] ;

	state.shoulderButton.leftTrigger = buttons[ 4 ] ;
	state.shoulderButton.rightTrigger = buttons[ 5 ] ;
	state.shoulderButton.left = buttons[ 6 ] ;
	state.shoulderButton.right = buttons[ 7 ] ;

	state.specialButton.left = buttons[ 8 ] ;
	state.specialButton.right = buttons[ 9 ] ;

	state.leftStick.x = axes[ 0 ] ;
	state.leftStick.y = axes[ 1 ] ;
	state.rightStick.y = axes[ 2 ] ;
	state.rightStick.x = axes[ 3 ] ;
	
	state.dPad.left = + ( axes[ 4 ] < 0 ) ;
	state.dPad.right = + ( axes[ 4 ] > 0 ) ;
	state.dPad.up = + ( axes[ 5 ] < 0 ) ;
	state.dPad.down = + ( axes[ 5 ] > 0 ) ;
} ;

