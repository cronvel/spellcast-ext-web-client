/*
	Spellcast's Web Client Extension

	Copyright (c) 2014 - 2020 Cédric Ronvel

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



// In this mode, the sprite is positioned relative to its container area -1,-1 being bottom-left and 1,1 being top-right and 0,0 being the center
// Any value in [-1,1] ensure the whole sprite is inside the area.
// Values <-1 or >1 still use the same linear coordinate (so are scaled using the container size).
exports.default =
exports.contain =
exports.area = ( transform , position , areaWidth , areaHeight , imageWidth , imageHeight ) => {
	var xMinOffset , yMinOffset , xFactor , yFactor ;

	xFactor = areaWidth - imageWidth ;
	yFactor = areaHeight - imageHeight ;

	xMinOffset = -0.5 * imageWidth * ( 1 - transform.scaleX ) ;
	yMinOffset = -0.5 * imageHeight * ( 1 - transform.scaleY ) ;
	xFactor += imageWidth * ( 1 - transform.scaleX ) ;
	yFactor += imageHeight * ( 1 - transform.scaleY ) ;

	console.log( "dbg:" , { xMinOffset , xFactor , yFactor } ) ;
	transform.translateX = xMinOffset + ( 0.5 + position.x / 2 ) * xFactor ;
	transform.translateY = yMinOffset + ( 0.5 - position.y / 2 ) * yFactor ;

	// What should be done for the z-axis?
	transform.translateZ = position.z ;
} ;



// In this mode, the sprite is positioned relative to its container area -1,-1 being bottom-left and 1,1 being top-right and 0,0 being the center
// Any value in [-1,1] ensure the whole sprite is inside the area.
// For values <-1 or >1 the extra are scaled using the sprite scale, e.g.:
// x=-1.5 means that the sprite is on the left, its left half being invisible (outside the container), its right half being visible (inside the container).
exports.areaInSpriteOut = ( transform , position , areaWidth , areaHeight , imageWidth , imageHeight ) => {
	var xMinOffset , yMinOffset , xFactor , yFactor ;

	xFactor = areaWidth - imageWidth ,
	yFactor = areaHeight - imageHeight ;

	xMinOffset = -0.5 * imageWidth * ( 1 - transform.scaleX ) ;
	yMinOffset = -0.5 * imageHeight * ( 1 - transform.scaleY ) ;
	xFactor += imageWidth * ( 1 - transform.scaleX ) ;
	yFactor += imageHeight * ( 1 - transform.scaleY ) ;

	console.log( "dbg:" , { xMinOffset , xFactor , yFactor } ) ;

	if ( position.x < -1 ) {
		transform.translateX = xMinOffset + ( position.x + 1 ) * imageWidth * transform.scaleX ;
	}
	else if ( position.x > 1 ) {
		transform.translateX = xMinOffset + xFactor + ( position.x - 1 ) * imageWidth * transform.scaleX ;
	}
	else {
		transform.translateX = xMinOffset + ( 0.5 + position.x / 2 ) * xFactor ;
	}

	if ( position.y < -1 ) {
		transform.translateY = yMinOffset + yFactor - ( position.y + 1 ) * imageHeight * transform.scaleY ;
	}
	else if ( position.y > 1 ) {
		transform.translateY = yMinOffset - ( position.y - 1 ) * imageHeight * transform.scaleY ;
	}
	else {
		transform.translateY = yMinOffset + ( 0.5 - position.y / 2 ) * yFactor ;
	}

	// What should be done for the z-axis?
	transform.translateZ = position.z ;
} ;

