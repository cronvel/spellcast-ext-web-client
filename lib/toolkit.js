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



const toolkit = {} ;
module.exports = toolkit ;



const format = require( 'string-kit/lib/format.js' ) ;
const markupMethod = format.markupMethod ;
const escapeHtml = require( 'string-kit/lib/escape.js' ).html ;



const markupConfig = {
	endingMarkupReset: true ,
	markupReset: markupStack => {
		var str = '</span>'.repeat( markupStack.length ) ;
		markupStack.length = 0 ;
		return str ;
	} ,
	markup: {
		":": markupStack => {
			var str = '</span>'.repeat( markupStack.length ) ;
			markupStack.length = 0 ;
			return str ;
		} ,
		" ": markupStack => {
			var str = '</span>'.repeat( markupStack.length ) ;
			markupStack.length = 0 ;
			return str + ' ' ;
		} ,

		"-": '<span class="dim">' ,
		"+": '<span class="bold">' ,
		"_": '<span class="underline">' ,
		"/": '<span class="italic">' ,
		"!": '<span class="inverse">' ,

		"b": '<span class="blue">' ,
		"B": '<span class="bright blue">' ,
		"c": '<span class="cyan">' ,
		"C": '<span class="bright cyan">' ,
		"g": '<span class="green">' ,
		"G": '<span class="bright green">' ,
		"k": '<span class="black">' ,
		"K": '<span class="grey">' ,
		"m": '<span class="magenta">' ,
		"M": '<span class="bright magenta">' ,
		"r": '<span class="red">' ,
		"R": '<span class="bright red">' ,
		"w": '<span class="white">' ,
		"W": '<span class="bright white">' ,
		"y": '<span class="yellow">' ,
		"Y": '<span class="bright yellow">'
	}
} ;



// Catch-all keywords to key:value
const CATCH_ALL_KEYWORDS = {
	// Foreground colors
	defaultColor: [ 'color' , 'default' ] ,
	black: [ 'color' , 'black' ] ,
	red: [ 'color' , 'red' ] ,
	green: [ 'color' , 'green' ] ,
	yellow: [ 'color' , 'yellow' ] ,
	blue: [ 'color' , 'blue' ] ,
	magenta: [ 'color' , 'magenta' ] ,
	cyan: [ 'color' , 'cyan' ] ,
	white: [ 'color' , 'white' ] ,
	grey: [ 'color' , 'grey' ] ,
	gray: [ 'color' , 'gray' ] ,
	brightBlack: [ 'color' , 'brightBlack' ] ,
	brightRed: [ 'color' , 'brightRed' ] ,
	brightGreen: [ 'color' , 'brightGreen' ] ,
	brightYellow: [ 'color' , 'brightYellow' ] ,
	brightBlue: [ 'color' , 'brightBlue' ] ,
	brightMagenta: [ 'color' , 'brightMagenta' ] ,
	brightCyan: [ 'color' , 'brightCyan' ] ,
	brightWhite: [ 'color' , 'brightWhite' ] ,

	// Background colors
	defaultBgColor: [ 'bgColor' , 'default' ] ,
	bgBlack: [ 'bgColor' , 'black' ] ,
	bgRed: [ 'bgColor' , 'red' ] ,
	bgGreen: [ 'bgColor' , 'green' ] ,
	bgYellow: [ 'bgColor' , 'yellow' ] ,
	bgBlue: [ 'bgColor' , 'blue' ] ,
	bgMagenta: [ 'bgColor' , 'magenta' ] ,
	bgCyan: [ 'bgColor' , 'cyan' ] ,
	bgWhite: [ 'bgColor' , 'white' ] ,
	bgGrey: [ 'bgColor' , 'grey' ] ,
	bgGray: [ 'bgColor' , 'gray' ] ,
	bgBrightBlack: [ 'bgColor' , 'brightBlack' ] ,
	bgBrightRed: [ 'bgColor' , 'brightRed' ] ,
	bgBrightGreen: [ 'bgColor' , 'brightGreen' ] ,
	bgBrightYellow: [ 'bgColor' , 'brightYellow' ] ,
	bgBrightBlue: [ 'bgColor' , 'brightBlue' ] ,
	bgBrightMagenta: [ 'bgColor' , 'brightMagenta' ] ,
	bgBrightCyan: [ 'bgColor' , 'brightCyan' ] ,
	bgBrightWhite: [ 'bgColor' , 'brightWhite' ] ,

	// Other styles
	dim: [ 'dim' , true ] ,
	bold: [ 'bold' , true ] ,
	underline: [ 'underline' , true ] ,
	italic: [ 'italic' , true ] ,
	inverse: [ 'inverse' , true ] ,
	strike: [ 'strike' , true ]
} ;



const parseMarkupConfig = {
	parse: true ,
	markupReset: markupStack => {
		markupStack.length = 0 ;
	} ,
	//shiftMarkup: { '#': 'background' } ,
	markup: {
		":": null ,
		" ": markupStack => {
			markupStack.length = 0 ;
			return [ null , ' ' ] ;
		} ,

		"-": { dim: true } ,
		"+": { bold: true } ,
		"_": { underline: true } ,
		"/": { italic: true } ,
		"!": { inverse: true } ,
		"~": { strike: true } ,

		"b": { color: "blue" } ,
		"B": { color: "brightBlue" } ,
		"c": { color: "cyan" } ,
		"C": { color: "brightCyan" } ,
		"g": { color: "green" } ,
		"G": { color: "brightGreen" } ,
		"k": { color: "black" } ,
		"K": { color: "grey" } ,
		"m": { color: "magenta" } ,
		"M": { color: "brightMagenta" } ,
		"r": { color: "red" } ,
		"R": { color: "brightRed" } ,
		"w": { color: "white" } ,
		"W": { color: "brightWhite" } ,
		"y": { color: "yellow" } ,
		"Y": { color: "brightYellow" }
	} ,
	shiftedMarkup: {
		background: {
			/*
			':': [ null , { defaultColor: true , bgDefaultColor: true } ] ,
			' ': markupStack => {
				markupStack.length = 0 ;
				return [ null , { defaultColor: true , bgDefaultColor: true } , ' ' ] ;
			} ,
			*/
			":": null ,
			" ": markupStack => {
				markupStack.length = 0 ;
				return [ null , ' ' ] ;
			} ,

			"b": { bgColor: "blue" } ,
			"B": { bgColor: "brightBlue" } ,
			"c": { bgColor: "cyan" } ,
			"C": { bgColor: "brightCyan" } ,
			"g": { bgColor: "green" } ,
			"G": { bgColor: "brightGreen" } ,
			"k": { bgColor: "black" } ,
			"K": { bgColor: "grey" } ,
			"m": { bgColor: "magenta" } ,
			"M": { bgColor: "brightMagenta" } ,
			"r": { bgColor: "red" } ,
			"R": { bgColor: "brightRed" } ,
			"w": { bgColor: "white" } ,
			"W": { bgColor: "brightWhite" } ,
			"y": { bgColor: "yellow" } ,
			"Y": { bgColor: "brightYellow" }
		}
	} ,
	dataMarkup: {
		color: 'color' ,
		fgColor: 'color' ,
		fg: 'color' ,
		c: 'color' ,
		bgColor: 'bgColor' ,
		bg: 'bgColor' ,
		fx: 'fx'
	} ,
	markupCatchAll: ( markupStack , key , value ) => {
		var attr = {} ;

		if ( value === undefined ) {
			if ( key[ 0 ] === '#' ) {
				attr.color = key ;
			}
			else if ( CATCH_ALL_KEYWORDS[ key ] ) {
				attr[ CATCH_ALL_KEYWORDS[ key ][ 0 ] ] = CATCH_ALL_KEYWORDS[ key ][ 1 ] ;
			}
			else {
				// Fallback: it's a foreground color
				attr.color = key ;
			}
		}

		markupStack.push( attr ) ;
		return attr || {} ;
	}
} ;



toolkit.markup = ( ... args ) => {
	args[ 0 ] = escapeHtml( args[ 0 ] ).replace( /\n/ , '<br />' ) ;
	return markupMethod.apply( markupConfig , args ) ;
} ;



toolkit.parseMarkup = ( ... args ) => {
	return markupMethod.apply( parseMarkupConfig , args ) ;
} ;



toolkit.stripMarkup = format.stripMarkup ;



// From Terminal-kit's misc.hexToRgba()
toolkit.hexToRgba = hex => {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) || 0 ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) || 0 ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) || 0 ,
		a: hex.length > 6 ? parseInt( hex.slice( 6 , 8 ) , 16 ) || 0 : 255
	} ;
} ;



toolkit.hexToRgb = hex => {
	// Strip the # if necessary
	if ( hex[ 0 ] === '#' ) { hex = hex.slice( 1 ) ; }

	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ] ;
	}

	return {
		r: parseInt( hex.slice( 0 , 2 ) , 16 ) || 0 ,
		g: parseInt( hex.slice( 2 , 4 ) , 16 ) || 0 ,
		b: parseInt( hex.slice( 4 , 6 ) , 16 ) || 0
	} ;
} ;



function to2HexDigits( n ) {
	if ( ! n || n < 0 ) { return '00' ; }
	if ( n < 16 ) { return '0' + n.toString( 16 ) ; }
	return n.toString( 16 ) ;
} ;



toolkit.rgbToHex =
toolkit.rgbaToHex = ( r , g , b , a = null ) => {
	if ( r && typeof r === 'object' ) {
		return typeof r.a !== 'number' ? '#' + to2HexDigits( r.r ) + to2HexDigits( r.g ) + to2HexDigits( r.b ) :
			'#' + to2HexDigits( r.r ) + to2HexDigits( r.g ) + to2HexDigits( r.b ) + to2HexDigits( r.a ) ;
	}

	return a === null ? '#' + to2HexDigits( r ) + to2HexDigits( g ) + to2HexDigits( b ) :
		'#' + to2HexDigits( r ) + to2HexDigits( g ) + to2HexDigits( b ) + to2HexDigits( a ) ;
} ;

