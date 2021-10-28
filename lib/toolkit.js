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



const markupMethod = require( 'string-kit/lib/format.js' ).markupMethod ;
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



const parseMarkupConfig = {
	markupReset: markupStack => {
		markupStack.length = 0 ;
	} ,
	parse: true ,
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
	}
} ;



toolkit.markup = ( ... args ) => {
	args[ 0 ] = escapeHtml( args[ 0 ] ).replace( /\n/ , '<br />' ) ;
	return markupMethod.apply( markupConfig , args ) ;
} ;



toolkit.parseMarkup = ( ... args ) => {
	return markupMethod.apply( parseMarkupConfig , args ) ;
} ;



const MARKUP_REGEX = /\^\[([^\]]*)]|\^(.)|([^^]+)/g ;

toolkit.stripMarkup = text => text.replace(
	MARKUP_REGEX ,
	( match , complex , markup , raw ) =>
		raw ? raw :
		markup === '^' ? '^' :
		''
) ;

