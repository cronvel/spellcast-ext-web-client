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



const Ngev = require( 'nextgen-events/lib/browser.js' ) ;
const Promise = require( 'seventh' ) ;
const domKit = require( 'dom-kit' ) ;
const svgKit = require( 'svg-kit' ) ;
const commonUtils = require( './commonUtils.js' ) ;



function noop() {}



function Dom() {
	this.$body = document.querySelector( 'body' ) ;
	this.$spellcast = document.querySelector( 'spellcast' ) ;
	this.$theme = document.querySelector( '#theme' ) ;
	this.$gfx = document.querySelector( '#gfx' ) ;
	this.$sceneImage = document.querySelector( '.scene-image' ) ;
	this.$main = document.querySelector( 'main' ) ;
	this.$mainBuffer = document.querySelector( '#main-buffer' ) ;
	this.$altBuffer = document.querySelector( '#alt-buffer' ) ;
	this.$closeAltButton = document.querySelector( '#button-close-alt' ) ;
	this.$dialogWrapper = document.querySelector( '#dialog-wrapper' ) ;
	this.$hint = document.querySelector( '#hint' ) ;
	this.$lobby = document.querySelector( '#lobby' ) ;
	this.$clientStatus = this.$lobby.querySelector( '.client-status' ) ;
	this.$status = document.querySelector( '#status' ) ;
	this.$panel = document.querySelector( '#panel' ) ;
	this.$music = document.querySelector( '#music' ) ;
	this.$sound0 = document.querySelector( '#sound0' ) ;
	this.$sound1 = document.querySelector( '#sound1' ) ;
	this.$sound2 = document.querySelector( '#sound2' ) ;
	this.$sound3 = document.querySelector( '#sound3' ) ;

	this.choices = [] ;

	this.newSegmentNeeded = null ;
	this.onSelect = null ;
	this.onLeave = null ;
	this.onEnter = null ;
	this.toMainBuffer() ;

	this.nextSoundChannel = 0 ;

	this.textureTheme = 'default' ;
	this.texturePacks = {} ;
	this.gEntities = {} ;
	/*
	this.sprites = {} ;
	this.vgs = {} ;
	this.markers = {} ;
	this.cards = {} ;
	*/
	this.gEntityLocations = {} ;
	this.animations = {} ;

	this.hintTimer = null ;
	this.sceneImageOnTimer = null ;
	this.onCommandSubmit = null ;

	// The number of UI loading in progress
	this.uiLoadingCount = 0 ;

	this.initEvents() ;
}

module.exports = Dom ;

Dom.prototype = Object.create( Ngev.prototype ) ;
Dom.prototype.constructor = Dom ;



Dom.prototype.cleanUrl = function( url ) {
	if ( url[ 0 ] === '/' ) { return window.location.pathname + url.slice( 1 ) ; }
	return window.location.pathname + 'script/' + url ;
} ;



// Return a Promise for on load/error events
Dom.prototype.addScript = function( url ) {
	console.log( "Adding script: " , url ) ;
	return domKit.addJsScript( url , this.$spellcast ) ;
} ;



Dom.prototype.setTheme = function( theme ) {
	this.$theme.setAttribute( 'href' , this.cleanUrl( theme.url ) ) ;
} ;



Dom.prototype.preload = function() {
	domKit.preload( [
		'icons/plugged.svg' ,
		'icons/plugging.svg' ,
		'icons/unplugged.svg' ,
		'icons/unreachable-plug.svg'
	] ) ;
} ;



Dom.prototype.initEvents = function() {
	this.$main.addEventListener( 'click' , () => this.emit( 'continue' ) , false ) ;

	this.$gfx.addEventListener( 'click' , event => {
		//console.warn( 'event' , event ) ;
		if ( event.target.classList.contains( 'scene-image' ) ) {
			this.toggleSceneImage() ;
		}
	} , false ) ;

	this.$dialogWrapper.addEventListener( 'click' , () => this.clearDialog() , false ) ;

	// Things that can get the .toggled class when clicked
	this.$lobby.addEventListener( 'click' , () => { this.$lobby.classList.toggle( 'toggled' ) ; } ) ;
	this.$status.addEventListener( 'click' , () => { this.$status.classList.toggle( 'toggled' ) ; } ) ;
	this.$panel.addEventListener( 'click' , () => { this.$panel.classList.toggle( 'toggled' ) ; } ) ;
} ;



Dom.prototype.toggleSceneImage = function() {
	if ( this.$gfx.classList.contains( 'toggled' ) ) { this.sceneImageOff() ; }
	else { this.sceneImageOn() ; }
} ;



Dom.prototype.sceneImageOn = function() {
	if ( this.sceneImageOnTimer !== null ) { clearTimeout( this.sceneImageOnTimer ) ; this.sceneImageOnTimer = null ; }

	this.$gfx.classList.add( 'toggled' ) ;
	this.$spellcast.classList.add( 'gfx-toggled' ) ;
	this.sceneImageOnTimer = setTimeout( this.sceneImageOff.bind( this ) , 8000 ) ;
} ;



Dom.prototype.sceneImageOff = function() {
	if ( this.sceneImageOnTimer !== null ) { clearTimeout( this.sceneImageOnTimer ) ; this.sceneImageOnTimer = null ; }

	this.$gfx.classList.remove( 'toggled' ) ;
	this.$spellcast.classList.remove( 'gfx-toggled' ) ;
} ;



// return true if switched
Dom.prototype.toMainBuffer = function() {
	if ( this.$activeBuffer === this.$mainBuffer ) { return ; }

	if ( this.$activeBuffer ) {
		// This is not defined at startup
		this.clearChoices() ;
		this.clearMessages() ;
		this.clearHint() ;
		this.clearHistory() ;
	}

	this.$activeBuffer = this.$mainBuffer ;
	this.$importantMessages = null ;
	this.$mainBuffer.classList.remove( 'inactive' ) ;
	this.$altBuffer.classList.add( 'inactive' ) ;
	this.$closeAltButton.classList.add( 'inactive' ) ;

	this.getSwitchedElements() ;

	return true ;
} ;



// return true if switched
Dom.prototype.toAltBuffer = function() {
	if ( this.$activeBuffer === this.$altBuffer ) { return ; }

	this.$activeBuffer = this.$altBuffer ;
	this.$importantMessages = this.$activeSegment ;
	this.$mainBuffer.classList.add( 'inactive' ) ;
	this.$altBuffer.classList.remove( 'inactive' ) ;
	this.$closeAltButton.classList.remove( 'inactive' ) ;

	this.getSwitchedElements() ;

	return true ;
} ;



// Get elements after a buffer switch
Dom.prototype.getSwitchedElements = function() {
	this.$history = this.$activeBuffer.querySelector( '.messages.history' ) ;
	this.$activeMessages = this.$activeBuffer.querySelector( '.messages.active' ) ;
	this.$choices = this.$activeBuffer.querySelector( '.choices' ) ;
	this.$chat = this.$activeBuffer.querySelector( '.chat' ) ;
	this.$chatForm = this.$chat.querySelector( '.chat-form' ) ;
	this.$chatInput = this.$chatForm.querySelector( '.chat-input' ) ;

	this.$activeSegment = this.$activeMessages.querySelector( 'segment:last-child' ) ;

	if ( ! this.$activeSegment ) { this.newSegment() ; }
	else { this.newSegmentOnContent() ; }
} ;



Dom.prototype.clientStatus = function( status ) {
	this.$clientStatus.setAttribute( 'data-status' , status ) ;
	//this.$clientStatus.setAttribute( 'alt' , status ) ;
	this.$clientStatus.setAttribute( 'title' , status ) ;
} ;



Dom.prototype.setMultiplayer = function( value , callback ) {
	callback = callback || noop ;

	if ( value || value === undefined ) {
		this.$spellcast.classList.add( 'multiplayer' ) ;
	}
	else {
		this.$spellcast.classList.remove( 'multiplayer' ) ;
	}

	callback() ;
} ;



Dom.prototype.clear = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$hint ) ;
	domKit.empty( this.$dialogWrapper ) ;
	domKit.empty( this.$activeMessages ) ;
	domKit.empty( this.$choices ) ;
	callback() ;
} ;



Dom.prototype.clearMessages = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$activeMessages ) ;
	callback() ;
} ;



Dom.prototype.clearHistory = function( callback ) {
	callback = callback || noop ;
	domKit.empty( this.$history ) ;
	callback() ;
} ;



Dom.prototype.newSegment = function( type ) {
	var $segment ,
		isInterSegment = type === 'inter-segment' ;

	this.newSegmentNeeded = null ;

	//var $lastSegment = this.$activeSegment ;

	if ( isInterSegment ) {
		if ( this.$activeSegment && this.$activeSegment.tagName.toLowerCase() === 'inter-segment' ) {
			return ;
		}

		$segment = document.createElement( 'inter-segment' ) ;
	}
	else {
		$segment = document.createElement( 'segment' ) ;
	}

	if ( this.$activeSegment && ! this.$activeSegment.children.length ) {
		this.$activeSegment.remove() ;
	}

	this.$activeSegment = $segment ;
	this.$activeMessages.appendChild( $segment ) ;

	if ( ! isInterSegment ) { this.moveToHistory() ; }
} ;



Dom.prototype.moveToHistory = function() {
	var i , iMax , children , $replayButton ;

	children = Array.from( this.$activeMessages.children ) ;
	iMax = children.length - 2 ;

	while ( iMax >= 0 && children[ iMax ].tagName.toLowerCase() === 'inter-segment' ) {
		iMax -- ;
	}

	if ( iMax < 0 ) { return ; }

	for ( i = 0 ; i <= iMax ; i ++ ) {
		// Remove replay button
		$replayButton = children[ i ].querySelector( '.replay-button' ) ;
		if ( $replayButton ) { domKit.remove( $replayButton ) ; }

		this.$history.appendChild( children[ i ] ) ;
	}

	children[ iMax ].scrollIntoView( false ) ;
} ;




// Postpone new segment creation until new content
Dom.prototype.newSegmentOnContent = function( type ) {
	type = type || 'segment' ;
	this.newSegmentNeeded = type ;
} ;



Dom.prototype.addSelectedChoice = function( text ) {
	var $text = document.createElement( 'p' ) ;
	$text.classList.add( 'chosen' ) ;
	$text.textContent = text ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }

	this.$activeSegment.appendChild( $text ) ;
} ;



Dom.prototype.addMessage = function( text , options , callback ) {
	var triggered = false ;

	callback = callback || noop ;

	var triggerCallback = () => {
		if ( triggered ) { return ; }
		triggered = true ;

		if ( options.next ) {
			$text.scrollIntoView( false ) ;
			this.messageNext( options.next , callback ) ;
			return ;
		}

		callback() ;
	} ;


	var $text = document.createElement( 'p' ) ;
	$text.classList.add( 'text' ) ;

	if ( options.next ) { $text.classList.add( 'continue' ) ; }

	if ( options.class ) {
		domKit.class( $text , commonUtils.toClassObject( options.class ) , 's-' ) ;
	}

	if ( options.style ) {
		domKit.css( $text , options.style ) ;
	}

	// Because the text contains <span> tags
	//$text.textContent = text ;
	$text.innerHTML = text ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }

	this.$activeSegment.appendChild( $text ) ;

	if ( options.important && this.$importantMessages ) {
		// The message should be added to the main buffer too
		this.$importantMessages.appendChild( $text.cloneNode( true ) ) ;
	}

	// Slow-typing is not supported ATM
	//if ( options.slowTyping ) { return ; }

	triggerCallback() ;
} ;



Dom.prototype.messageNext = function( value , callback ) {
	var triggered = false ;

	var triggerCallback = () => {
		if ( triggered ) { return ; }
		triggered = true ;

		this.$spellcast.classList.remove( 'continue' ) ;
		callback() ;
	} ;

	this.$spellcast.classList.add( 'continue' ) ;
	this.once( 'continue' , triggerCallback ) ;

	if ( typeof value === 'number' && isFinite( value ) && value > 0 ) {
		setTimeout( triggerCallback , value * 1000 ) ;
	}
} ;



Dom.prototype.addSpeech = function( text , options , callback ) {
	var $button ;

	if ( options.speechReplay ) {
		if ( options.speechOnly && this.newSegmentNeeded ) {
			// Since there is no attached text, we need to handle the segment thing...
			this.newSegment( this.newSegmentNeeded ) ;
		}

		$button = document.createElement( 'button' ) ;
		$button.classList.add( 'replay-button' ) ;
		$button.setAttribute( 'disabled' , true ) ;
		$button.textContent = '▶' ;

		this.$activeSegment.appendChild( $button ) ;
	}

	this.speech( text , options , () => {
		if ( options.speechReplay ) {
			$button.removeAttribute( 'disabled' ) ;

			$button.addEventListener( 'click' , () => {
				this.speech( text , options ) ;
			} ) ;
		}
		callback() ;
	} ) ;
} ;



Dom.prototype.speech = function( text , options , callback ) {
	if ( options.useService ) {
		this.restServiceSpeech( text , options , callback ) ;
	}
	else {
		this.nativeBrowserSpeech( text , options , callback ) ;
	}
} ;



Dom.prototype.restServiceSpeech = function( text , options , callback ) {
	var url = /speech/ ;

	url += "?text=" + encodeURIComponent( text ) ;
	url += "&lang=" + encodeURIComponent( options.speechLang || 'en' ) ;
	url += "&volume=" + encodeURIComponent( options.speechVolume !== undefined ? options.speechVolume : 1 ) ;
	url += "&rate=" + encodeURIComponent( options.speechRate !== undefined ? options.speechRate : 1 ) ;
	url += "&pitch=" + encodeURIComponent( options.speechPitch !== undefined ? options.speechPitch : 1 ) ;
	//url += "&gender=" + encodeURIComponent( options.speechGender || 'female' ) ;

	//console.log( "Speech REST service URL:" , url ) ;
	this.sound( { url } , callback ) ;
} ;



Dom.prototype.nativeBrowserSpeech = function( text , options , callback ) {
	var speechSynthesis = window.speechSynthesis ,
		message , voices ;

	if ( ! speechSynthesis ) {
		// Not supported by this browser
		callback() ;
		return ;
	}

	message = new SpeechSynthesisUtterance( text ) ;
	//voices = window.speechSynthesis.getVoices() ;
	//message.voice = voices[10]; // Note: some voices don't support altering params
	//message.text = text ;
	message.lang = options.speechLang || 'en-US' ;
	message.volume = options.speechVolume !== undefined ? options.speechVolume : 1 ;	// 0 to 1
	message.rate = options.speechRate !== undefined ? options.speechRate : 1 ;	// 0.1 to 10
	message.pitch = options.speechPitch !== undefined ? options.speechPitch : 1 ;	//0 to 2
	if ( options.speechVoice ) { message.voiceURI = options.speechVoice ; }

	message.onend = event => {
		console.log( 'Speech: finished in ' + event.elapsedTime + ' seconds.' ) ;
		callback() ;
	} ;

	speechSynthesis.speak( message ) ;
} ;



Dom.prototype.addIndicators = function( indicators , isStatus , callback ) {
	callback = callback || noop ;

	if ( isStatus ) {
		domKit.empty( this.$status ) ;

		if ( indicators.length ) {
			this.$status.classList.remove( 'empty' ) ;
		}
		else {
			this.$status.classList.add( 'empty' ) ;
			callback() ;
			return ;
		}
	}

	var $indicatorList = document.createElement( 'indicator-list' ) ;

	indicators.forEach( ( data ) => {
		var $indicator , $label , $image , $widget , $innerBar , $outerBar ;
		$indicator = document.createElement( 'indicator' ) ;
		//$indicator.classList.add( data.type ) ;

		$label = document.createElement( 'label' ) ;
		$label.classList.add( 'label' ) ;

		if ( data.image ) {
			$indicator.classList.add( 'has-image' ) ;
			$image = document.createElement( 'img' ) ;
			$image.classList.add( 'image' ) ;
			$image.setAttribute( 'src' , this.cleanUrl( data.image ) ) ;

			if ( data.label ) {
				$image.setAttribute( 'alt' , data.label ) ;
				$image.setAttribute( 'title' , data.label ) ;
			}

			$label.appendChild( $image ) ;
		}
		else {
			$label.textContent = data.label ;
		}

		$indicator.appendChild( $label ) ;

		$widget = document.createElement( 'widget' ) ;
		$widget.classList.add( 'widget' ) ;
		$widget.classList.add( data.type ) ;
		$widget.setAttribute( 'data-value' , data.value ) ;

		switch ( data.type ) {
			case 'hbar' :
				$outerBar = document.createElement( 'outer-bar' ) ;
				$widget.appendChild( $outerBar ) ;

				$innerBar = document.createElement( 'inner-bar' ) ;

				if ( isNaN( data.value ) ) { data.value = 0 ; }
				else if ( data.value > 100 ) { data.value = 100 ; }
				else if ( data.value < 0 ) { data.value = 0 ; }

				if ( typeof data.color === 'string' ) { $innerBar.style.backgroundColor = data.color ; }

				$innerBar.style.width = '' + data.value + '%' ;

				$outerBar.appendChild( $innerBar ) ;
				break ;

			case 'vbar' :
				$outerBar = document.createElement( 'outer-bar' ) ;
				$widget.appendChild( $outerBar ) ;

				$innerBar = document.createElement( 'inner-bar' ) ;

				if ( isNaN( data.value ) ) { data.value = 0 ; }
				else if ( data.value > 100 ) { data.value = 100 ; }
				else if ( data.value < 0 ) { data.value = 0 ; }

				if ( typeof data.color === 'string' ) { $innerBar.style.backgroundColor = data.color ; }

				$innerBar.style.height = '' + data.value + '%' ;

				$outerBar.appendChild( $innerBar ) ;
				break ;

			case 'text' :	// jshint ignore:line
			default :
				$widget.textContent = data.value ;
		}

		$indicator.appendChild( $widget ) ;
		$indicatorList.appendChild( $indicator ) ;
	} ) ;

	if ( isStatus ) {
		this.$status.appendChild( $indicatorList ) ;
	}
	else {
		if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
		this.$activeSegment.appendChild( $indicatorList ) ;
	}

	callback() ;
} ;



Dom.prototype.createChoiceEventHandlers = function( onSelect ) {
	this.onSelect = ( event ) => {
		var $element = event.currentTarget ;
		var index = $element.getAttribute( 'data-select-index' ) ;
		if ( ! index ) { return ; }
		index = parseInt( index , 10 ) ;
		onSelect( index ) ;
	} ;

	this.onLeave = ( event ) => {
		this.clearHint() ;
		//event.stopPropagation() ; // useless for mouseleave events
	} ;

	this.onEnter = ( event ) => {
		var $element = event.currentTarget ;
		var hint = $element.getAttribute( 'data-button-hint' ) ;
		if ( ! hint ) { return ; }
		this.setHint( hint , { active: true } ) ;
		//event.stopPropagation() ;	// useless for mouseenter events
	} ;
} ;



Dom.prototype.addPanel = function( panel , clear , callback ) {
	callback = callback || noop ;


	// Clear part
	if ( clear ) {
		domKit.empty( this.$panel ) ;

		if ( panel.length ) {
			this.$panel.classList.remove( 'empty' ) ;
		}
		else {
			this.$panel.classList.add( 'empty' ) ;
			callback() ;
			return ;
		}
	}
	else if ( panel.length ) {
		this.$panel.classList.remove( 'empty' ) ;
	}


	panel.forEach( ( data ) => {
		var $button , $image , buttonId = 'button-' + data.id ;

		// Do not create it if there is already a button with this ID
		if ( document.getElementById( buttonId ) ) { return ; }

		$button = document.createElement( 'item' ) ;
		$button.classList.add( 'button' ) ;
		$button.classList.add( 'disabled' ) ;	// Disabled by default
		$button.setAttribute( 'id' , buttonId ) ;

		if ( data.image ) {
			$button.classList.add( 'has-image' ) ;

			if ( data.image.endsWith( '.svg' ) ) {
				// Pre-create the <svg> tag
				//$image = document.createElement( 'svg' ) ;	// <-- it doesn't work, it should be created with a NS
				$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
				//$image.setAttribute( 'xmlns' , 'http://www.w3.org/2000/svg' ) ;
				$image.classList.add( 'svg' ) ;

				svgKit.load( this.cleanUrl( data.image ) , {
					removeSvgStyle: true ,
					removeSize: true ,
					removeIds: true ,
					removeComments: true ,
					removeExoticNamespaces: true ,
					//removeDefaultStyles: true ,
					colorClass: true ,
					as: $image
				} ) ;
			}
			else {
				$image = document.createElement( 'img' ) ;
				$image.setAttribute( 'src' , this.cleanUrl( data.image ) ) ;
			}

			$image.classList.add( 'icon' ) ;
			$image.classList.add( 'image' ) ;

			if ( data.label ) {
				$image.setAttribute( 'alt' , data.label ) ;
				$image.setAttribute( 'title' , data.label ) ;
			}

			$button.appendChild( $image ) ;
		}
		else {
			$button.textContent = data.label ;
		}

		this.$panel.appendChild( $button ) ;
	} ) ;

	callback() ;
} ;



Dom.prototype.clearChoices = function( callback ) {
	var $uiButton ;

	callback = callback || noop ;

	// First, unassign all UI buttons
	this.choices.forEach( ( choice ) => {
		if ( ! choice.button ) { return ; }

		var buttonId = 'button-' + choice.button ;

		$uiButton = document.getElementById( buttonId ) ;

		if ( $uiButton ) {
			//console.warn( 'remove' , 'button-' + choice.button ) ;
			$uiButton.removeAttribute( 'data-select-index' ) ;
			$uiButton.classList.add( 'disabled' ) ;
			$uiButton.removeEventListener( 'click' , this.onSelect ) ;
			$uiButton.removeEventListener( 'mouseleave' , this.onLeave ) ;
			$uiButton.removeEventListener( 'mouseenter' , this.onEnter ) ;
		}
	} ) ;

	domKit.empty( this.$choices ) ;

	// Reset
	this.choices.length = 0 ;
	this.onSelect = null ;
	this.onLeave = null ;
	this.onEnter = null ;

	callback() ;
} ;



Dom.prototype.addChoices = function( choices , onSelect , callback ) {
	if ( this.uiLoadingCount ) {
		this.once( 'uiLoaded' , this.addChoices.bind( this , choices , onSelect , callback ) ) ;
		return ;
	}

	var groupBreak = false ;
	var choicesFragment = document.createDocumentFragment() ;
	var $group = document.createElement( 'group' ) ;

	callback = callback || noop ;

	this.createChoiceEventHandlers( onSelect ) ;

	choices.forEach( ( choice ) => {

		var $uiButton ;

		// Add the choice to the list
		this.choices.push( choice ) ;

		if (
			choice.button &&
			( $uiButton = document.getElementById( 'button-' + choice.button ) ) &&
			! $uiButton.getAttribute( 'data-select-index' ) &&
			! $uiButton.classList.contains( 'inactive' )
		) {
			// groupBreak remainder
			if ( choice.groupBreak ) { groupBreak = true ; }

			// Assign to it the select index
			$uiButton.setAttribute( 'data-select-index' , choice.index ) ;
			$uiButton.classList.remove( 'disabled' ) ;

			// Add the click event to the next-item
			$uiButton.addEventListener( 'click' , this.onSelect ) ;

			if ( choice.label ) {
				$uiButton.setAttribute( 'data-button-hint' , choice.label ) ;
				$uiButton.addEventListener( 'mouseleave' , this.onLeave ) ;
				$uiButton.addEventListener( 'mouseenter' , this.onEnter ) ;
			}

			return ;
		}

		var $button = document.createElement( 'choice' ) ;
		$button.classList.add( 'choice' , choice.type ) ;
		$button.setAttribute( 'data-select-index' , choice.index ) ;
		$button.classList.remove( 'disabled' ) ;
		//$button.setAttribute( 'data-is-ordered' , !! choice.orderedList ) ;

		if ( choice.class ) {
			domKit.class( $button , commonUtils.toClassObject( choice.class ) , 's-' ) ;
		}

		if ( choice.style ) {
			domKit.css( $button , choice.style ) ;
		}

		if ( choice.image ) {
			$button.classList.add( 'has-image' ) ;
			var $image = document.createElement( 'img' ) ;
			$image.classList.add( 'image' ) ;
			$image.setAttribute( 'src' , this.cleanUrl( choice.image ) ) ;
			$button.appendChild( $image ) ;
		}

		var $label = document.createElement( 'span' ) ;
		$label.classList.add( 'label' ) ;
		$label.textContent = choice.label ;
		$button.appendChild( $label ) ;
		//$button.textContent = choice.label ;

		if ( choice.selectedBy && choice.selectedBy.length ) {
			var $selectedBy = document.createElement( 'span' ) ;
			$selectedBy.classList.add( 'italic' , 'brightBlack' ) ;

			// Add an extra space to separate from the label text
			$selectedBy.textContent = ' ' + choice.selectedBy.join( ', ' ) ;
			$button.appendChild( $selectedBy ) ;
		}

		// Add the click event to the next-item
		$button.addEventListener( 'click' , this.onSelect ) ;

		if ( choice.groupBreak || groupBreak ) {
			// Add current group to the fragment, and create a new group
			groupBreak = false ;
			choicesFragment.appendChild( $group ) ;
			$group = document.createElement( 'group' ) ;
		}

		$group.appendChild( $button ) ;
	} ) ;

	// Add the pending group to the fragment
	choicesFragment.appendChild( $group ) ;

	this.$choices.appendChild( choicesFragment ) ;

	callback() ;
} ;



Dom.prototype.getChoiceColumnsCount = function( choices ) {
	var count = 0 , maxCount = 0 ;

	choices.forEach( ( choice ) => {
		if ( choice.groupBreak ) {
			if ( count > maxCount ) { maxCount = count ; }
			count = 0 ;
		}

		count ++ ;
	} ) ;

	if ( count > maxCount ) { maxCount = count ; }
	return maxCount ;
} ;



// This is used when new choices replaces the previous scene choices
Dom.prototype.setChoices = function( choices , undecidedNames , onSelect , options , callback ) {
	options = options || {} ;
	callback = callback || noop ;

	this.clearChoices( () => {

		switch ( options.nextStyle ) {
			case 'inline' :
			case 'smallInline' :
			case 'list' :
			case 'smallList' :
				this.$choices.setAttribute( 'data-choice-style' , options.nextStyle ) ;
				break ;
			case 'table' :
				this.$choices.setAttribute( 'data-choice-style' , options.nextStyle ) ;
				this.$choices.classList.add( 'columns-' + this.getChoiceColumnsCount( choices ) ) ;
				break ;
			default :
				// Default to list
				this.$choices.setAttribute( 'data-choice-style' , 'list' ) ;
		}

		this.addChoices( choices , onSelect , callback ) ;

		if ( undecidedNames && undecidedNames.length ) {
			var $unassignedUsers = document.createElement( 'p' ) ;
			$unassignedUsers.classList.add( 'unassigned-users' ) ;
			$unassignedUsers.textContent = undecidedNames.join( ', ' ) ;
			this.$choices.appendChild( $unassignedUsers ) ;
		}

		if ( typeof options.timeout === 'number' ) { this.choiceTimeout( options.timeout ) ; }
	} ) ;
} ;



// This is used when the scene update its choices details (selectedBy, ...)
// /!\ For instance, it is the same than .setChoices
Dom.prototype.updateChoices = Dom.prototype.setChoices ;



Dom.prototype.choiceTimeout = function( timeout ) {
	var startTime = Date.now() , $timer , timer ;

	$timer = document.createElement( 'p' ) ;
	$timer.classList.add( 'timer' ) ;
	$timer.textContent = Math.round( timeout / 1000 ) ;

	this.$choices.appendChild( $timer ) ;

	timer = setInterval( () => {
		// If no parentNode, the element has been removed...
		if ( ! $timer.parentNode ) { clearInterval( timer ) ; return ; }

		$timer.textContent = Math.round( ( timeout + startTime - Date.now() ) / 1000 ) ;
	} , 1000 ) ;
} ;



Dom.prototype.textInputDisabled = function( options ) {
	var $form = document.createElement( 'form' ) ,
		$label = document.createElement( 'label' ) ,
		$input = document.createElement( 'input' ) ;

	$label.textContent = options.label ;

	$input.setAttribute( 'placeholder' , options.placeholder ) ;
	$input.setAttribute( 'disabled' , true ) ;
	$input.setAttribute( 'type' , 'text' ) ;
	$input.classList.add( 'text-input' ) ;

	$form.appendChild( $label ) ;
	$form.appendChild( $input ) ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
	this.$activeSegment.appendChild( $form ) ;
} ;



Dom.prototype.textInput = function( options , callback ) {
	var $form = document.createElement( 'form' ) ,
		$label = document.createElement( 'label' ) ,
		$input = document.createElement( 'input' ) ;

	// HINT: remove this class?
	$label.classList.add( 'text' ) ;
	$label.textContent = options.label ;

	$input.setAttribute( 'type' , 'text' ) ;
	$input.classList.add( 'text-input' ) ;

	$form.appendChild( $label ) ;
	$form.appendChild( $input ) ;

	if ( this.newSegmentNeeded ) { this.newSegment( this.newSegmentNeeded ) ; }
	this.$activeSegment.appendChild( $form ) ;

	$input.focus() ;

	var finalize = function( event ) {
		event.preventDefault() ;

		$form.removeEventListener( 'submit' , finalize ) ;
		$input.setAttribute( 'disabled' , true ) ;
		callback( $input.value ) ;
	} ;

	$form.addEventListener( 'submit' , finalize ) ;
} ;



Dom.prototype.enableCommand = function( callback ) {
	if ( ! this.onCommandSubmit ) {
		this.onCommandSubmit = ( event ) => {
			event.preventDefault() ;
			callback( this.$chatInput.value ) ;
			this.$chatInput.value = '' ;
		} ;

		this.$chatForm.addEventListener( 'submit' , this.onCommandSubmit ) ;

		this.$mainBuffer.classList.remove( 'chat-hidden' ) ;
		this.$chat.classList.remove( 'hidden' ) ;
		this.$chatInput.removeAttribute( 'disabled' ) ;
	}
} ;



Dom.prototype.disableCommand = function() {
	this.$chatForm.removeEventListener( 'submit' , this.onCommandSubmit ) ;
	this.onCommandSubmit = null ;

	this.$mainBuffer.classList.add( 'chat-hidden' ) ;
	this.$chat.classList.add( 'hidden' ) ;
	this.$chatInput.setAttribute( 'disabled' , true ) ;
} ;



Dom.prototype.clearHint = function() {
	if ( this.hintTimer !== null ) { clearTimeout( this.hintTimer ) ; this.hintTimer = null ; }

	//domKit.empty( this.$hint ) ;
	this.$hint.classList.add( 'empty' ) ;

	this.hintTimer = setTimeout( () => {
		domKit.empty( this.$hint ) ;
	} , 3000 ) ;
} ;



Dom.prototype.setHint = function( text , classes ) {
	if ( this.hintTimer !== null ) { clearTimeout( this.hintTimer ) ; this.hintTimer = null ; }

	//this.clearHint() ;
	//domKit.empty( this.$hint ) ;

	if ( this.$hint.textContent ) {
		this.$hint.classList.add( 'empty' ) ;
		this.hintTimer = setTimeout( () => {
			domKit.empty( this.$hint ) ;
			this.setHint( text , classes ) ;
		} , 300 ) ;
		return ;
	}

	this.$hint.textContent = text ;
	this.$hint.classList.remove( 'empty' ) ;

	domKit.class( this.$hint , {
		passive: !! classes.passive ,
		active: !! classes.active
	} ) ;

	this.hintTimer = setTimeout( this.clearHint.bind( this ) , 3000 ) ;
} ;



// /!\ DEPRECATED??? /!\
Dom.prototype.setBigHint = function( text , classes ) {
	var $hint = document.createElement( 'h2' ) ;
	$hint.textContent = text ;
	if ( classes ) { domKit.class( $hint , classes ) ; }
	domKit.empty( this.$hint ) ;
	this.$hint.appendChild( $hint ) ;
} ;



Dom.prototype.clearDialog = function() {
	this.$dialogWrapper.classList.add( 'empty' ) ;
	this.$dialogWrapper.classList.remove( 'modal' ) ;

	/*
		Try to remove children of this.$dialogWrapper after an eventual transition.
		Start a race with a transition start and setTimeout, the first to win inhibit the other.
	*/
	var raceWon = false ;

	var onStart = () => {
		this.$dialogWrapper.removeEventListener( 'transitionstart' , onStart ) ;
		if ( raceWon ) { return ; }
		raceWon = true ;
		this.$dialogWrapper.addEventListener( 'transitionend' , onEnd ) ;
	} ;

	var onEnd = () => {
		this.$dialogWrapper.removeEventListener( 'transitionend' , onEnd ) ;
		domKit.empty( this.$dialogWrapper ) ;
	} ;

	this.$dialogWrapper.addEventListener( 'transitionstart' , onStart ) ;

	setTimeout( () => {
		if ( raceWon ) { return ; }
		raceWon = true ;
		domKit.empty( this.$dialogWrapper ) ;
	} , 10 ) ;
} ;



/*
	Common options:
	* modal: create a modal dialog
	* title: specify a dialog title
	* big: dialog for small text written in BIG font
	* fun: use a fun font
	* alert: dialog for alerts, critical stuffs...
*/
Dom.prototype.setDialog = function( text , options , callback ) {
	options = options || {} ;
	callback = callback || noop ;

	if ( options.contentDelay && ! this.newSegmentNeeded ) {
		// The contentDelay options wait depending on the content size before actually trigger the dialog box.
		// It is used to let the user read the content before being interupted by the dialog box.
		delete options.contentDelay ;
		var contentLength = this.$activeSegment.innerHTML.replace( /<[^>]+>|&[a-z]+;/g , '' ).length ;
		var delay = Math.min( contentLength * 10 , 5000 ) ;
		console.warn( 'contentLength/delay' , contentLength , delay ) ;
		setTimeout( this.setDialog.bind( this , text , options , callback ) , delay ) ;
		return ;
	}

	var $dialog = document.createElement( 'div' ) ;
	$dialog.classList.add( 'dialog' ) ;

	if ( options.title ) {
		var $title = document.createElement( 'h2' ) ;
		$title.classList.add( 'title' ) ;
		$title.textContent = options.title ;
		$dialog.appendChild( $title ) ;
	}

	var $message = document.createElement( 'div' ) ;
	$message.classList.add( 'message' ) ;
	$message.textContent = text ;
	$dialog.appendChild( $message ) ;

	if ( options.slow ) { this.$dialogWrapper.classList.add( 'slow' ) ; }
	else { this.$dialogWrapper.classList.remove( 'slow' ) ; }

	if ( options.big ) { $dialog.classList.add( 'big' ) ; }
	if ( options.fun ) { $dialog.classList.add( 'fun' ) ; }
	if ( options.alert ) { $dialog.classList.add( 'alert' ) ; }

	if ( options.modal ) {
		$dialog.classList.add( 'modal' ) ;
		this.$dialogWrapper.classList.add( 'modal' ) ;
	}
	else {
		this.$dialogWrapper.classList.remove( 'modal' ) ;
	}

	domKit.empty( this.$dialogWrapper ) ;
	this.$dialogWrapper.appendChild( $dialog ) ;
	this.$dialogWrapper.classList.remove( 'empty' ) ;

	callback() ;
} ;



/* GFX */



Dom.prototype.setSceneImage = function( data ) {
	var cleaned = false ;

	var $oldSceneImage = this.$sceneImage ;

	this.$sceneImage = document.createElement( 'div' ) ;
	this.$sceneImage.classList.add( 'scene-image' ) ;

	if ( data.url ) {
		this.$sceneImage.style.backgroundImage = 'url("' + this.cleanUrl( data.url ) + '")' ;
	}

	if ( data.origin && typeof data.origin === 'string' ) {
		this.$sceneImage.style.backgroundPosition = data.origin ;
	}

	var cleanUp = () => {
		if ( cleaned ) { return ; }
		cleaned = true ;
		$oldSceneImage.remove() ;
	} ;

	if ( $oldSceneImage ) {
		$oldSceneImage.addEventListener( 'transitionend' , cleanUp , false ) ;
		this.$gfx.insertBefore( this.$sceneImage , $oldSceneImage ) ;
		$oldSceneImage.classList.add( 'hidden' ) ;

		// For some very obscure reason, sometime we don't get the 'transitionend' event,
		// Maybe no transition happend at all... So we need to clean up anyway after a while...
		setTimeout( cleanUp , 2000 ) ;
	}
	else {
		this.$gfx.insertBefore( this.$sceneImage , this.$gfx.firstChild || null ) ;
	}

	switch ( data.position ) {
		case 'left' :
			this.$spellcast.setAttribute( 'data-image-position' , 'left' ) ;
			break ;
		case 'right' :	// jshint ignore:line
		default :
			this.$spellcast.setAttribute( 'data-image-position' , 'right' ) ;
			break ;
	}
} ;



Dom.prototype.setTextureTheme = function( theme ) {
	this.textureTheme = theme ;
} ;



Dom.prototype.defineTexturePack = function( uid , data ) {
	this.texturePacks[ uid ] = data ;
	console.warn( "All texture packes so far:" , this.texturePacks ) ;
} ;



Dom.prototype.clearGEntity = function( id ) {
	var gEntity = this.gEntities[ id ] ;

	if ( ! gEntity ) {
		console.warn( 'Unknown gEntity id: ' , id ) ;
		return ;
	}
	
	if ( gEntity.$locationSlot ) { gEntity.$locationSlot.remove() ; }
	gEntity.$wrapper.remove() ;
	/*
	gEntity.$image.remove() ;
	if ( gEntity.$mask ) { gEntity.$mask.remove() ; }
	*/

	delete this.gEntities[ id ] ;
} ;



Dom.prototype.showGEntity = function( id , data ) {
	if ( this.gEntities[ id ] ) { this.clearGEntity( id ) ; }

	var gEntity = this.gEntities[ id ] = this.createGEntity( data ) ;

	return this.updateGEntity( gEntity , data , true ) ;
} ;


function GEntity( data ) {
	this.usage = data.usage || 'sprite' ;	// immutable

	this.show = false ;
	this.persistent = true ;
	this.button = null ;
	this.theme = null ;
	this.texturePack = null ;
	this.variant = 'default' ;
	this.position = { x: 0 , y: 0 , z: 0 ) ;
	this.positionMode = 'default' ;
	this.size = { x: 1 , y: 1 , z: 1 } ;
	this.sizeMode = 'default' ;
	//this.rotation = TO BE DEFINED....

	this.data = {} ;
	this.meta = {} ;
	this.engine = {} ;

	this.transitions = {
		position: null ,
		size: null ,
		//rotation: null ,
		opacity: null ,
		color: null ,
		effect: null
	} ;
}

GEntity.prototype = Object.create( Ngev.prototype ) ;
GEntity.prototype.constructor = GEntity ;


// /!\ A GEntity class must be created /!\
Dom.prototype.createGEntity = function( data ) {
	var gEntity = new Ngev() ;

	if ( data.type !== 'marker' ) {
		gEntity.$wrapper = document.createElement( 'div' ) ;
		// At creation, the visibility is turned off, the initial update will turn it on again
		gEntity.$wrapper.style.visibility = 'hidden' ;
		gEntity.$wrapper.style.transition = 'none' ;
		gEntity.$wrapper.classList.add( 'g-entity-wrapper' , data.type + '-wrapper' ) ;
		this.$gfx.append( gEntity.$wrapper ) ;
	}

	gEntity.size = { mode: 'relative' , xy: 1 } ;
	gEntity.position = { mode: 'relative' , x: 0 , y: 0 } ;
	gEntity.transform = {} ;

	Object.assign( gEntity , data ) ;
	gEntity.defineStates( 'loaded' , 'loading' ) ;

	return gEntity ;
} ;




Dom.prototype.showSprite = function( id , data ) {
	if ( ! data.url || typeof data.url !== 'string' ) { return Promise.resolved ; }

	if ( this.sprites[ id ] ) { this.clearGEntity( this.sprites[ id ] ) ; }

	var sprite = this.sprites[ id ] = this.createGEntity( {
		actionCallback: data.actionCallback ,
		action: null ,
		type: 'sprite' ,
		location: null ,
		class: data.class ,
		style: {} ,
		animation: null
	} ) ;

	return this.updateGEntity( sprite , data , true ) ;
} ;



Dom.prototype.showVg = function( id , data ) {
	if ( ( ! data.url || typeof data.url !== 'string' ) && ( ! data.vgObject || typeof data.vgObject !== 'object' ) ) { return Promise.resolved ; }

	if ( this.vgs[ id ] ) { this.clearGEntity( this.vgs[ id ] ) ; }

	var vg = this.vgs[ id ] = this.createGEntity( {
		actionCallback: data.actionCallback ,
		action: null ,
		type: 'vg' ,
		vgObject: null ,
		class: data.class ,
		style: {} ,
		area: {} ,
		animation: null
	} ) ;

	return this.updateGEntity( vg , data , true ) ;
} ;



Dom.prototype.showMarker = function( id , data ) {
	if ( ! data.url || typeof data.url !== 'string' ) { return Promise.resolved ; }

	if ( this.markers[ id ] ) { this.clearGEntity( this.markers[ id ] ) ; }

	var marker = this.markers[ id ] = this.createGEntity( {
		actionCallback: data.actionCallback ,
		action: null ,
		type: 'marker' ,
		vg: null ,
		location: null ,
		class: data.class ,
		style: {} ,
		animation: null
	} ) ;

	return this.updateGEntity( marker , data , true ) ;
} ;



var cardAutoIncrement = 0 ;

Dom.prototype.showCard = function( id , data ) {
	if ( ! data.url || typeof data.url !== 'string' ) { return Promise.resolved ; }

	if ( this.cards[ id ] ) { this.clearGEntity( this.cards[ id ] ) ; }

	var card = this.cards[ id ] = this.createGEntity( {
		actionCallback: data.actionCallback ,
		action: null ,
		type: 'card' ,
		location: 'showing' ,
		$locationSlot: null ,
		pose: null ,
		order: cardAutoIncrement ++ ,	// used as flex's order
		class: data.class ,
		style: {} ,
		imageStyle: {} ,
		animation: null ,
		contents: {}
	} ) ;

	this.createCardMarkup( card ) ;

	return this.updateGEntity( card , data , true ) ;
} ;



Dom.prototype.updateSprite = function( id , data ) {
	if ( ! this.sprites[ id ] ) {
		console.warn( 'Unknown sprite id: ' , id ) ;
		return Promise.resolved ;
	}

	return this.updateGEntity( this.sprites[ id ] , data ) ;
} ;



Dom.prototype.updateVg = function( id , data ) {
	if ( ! this.vgs[ id ] ) {
		console.warn( 'Unknown VG id: ' , id ) ;
		return Promise.resolved ;
	}

	return this.updateGEntity( this.vgs[ id ] , data ) ;
} ;



Dom.prototype.updateMarker = function( id , data ) {
	if ( ! this.markers[ id ] ) {
		console.warn( 'Unknown marker id: ' , id ) ;
		return Promise.resolved ;
	}

	return this.updateGEntity( this.markers[ id ] , data ) ;
} ;



Dom.prototype.updateCard = function( id , data ) {
	if ( ! this.cards[ id ] ) {
		console.warn( 'Unknown card id: ' , id ) ;
		return Promise.resolved ;
	}

	return this.updateGEntity( this.cards[ id ] , data ) ;
} ;



Dom.prototype.animateSprite = function( spriteId , animationId ) {
	if ( ! this.sprites[ spriteId ] ) {
		console.warn( 'Unknown sprite id: ' , spriteId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.sprites[ spriteId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateVg = function( gEntityId , animationId ) {
	if ( ! this.vgs[ gEntityId ] ) {
		console.warn( 'Unknown VG id: ' , gEntityId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.vgs[ gEntityId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateMarker = function( markerId , animationId ) {
	if ( ! this.markers[ markerId ] ) {
		console.warn( 'Unknown marker id: ' , markerId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.markers[ markerId ] , this.animations[ animationId ] ) ;
} ;



Dom.prototype.animateCard = function( cardId , animationId ) {
	if ( ! this.cards[ cardId ] ) {
		console.warn( 'Unknown card id: ' , cardId ) ;
		return Promise.resolved ;
	}

	if ( ! this.animations[ animationId ] ) {
		console.warn( 'Unknown animation id: ' , animationId ) ;
		return Promise.resolved ;
	}

	return this.animateGEntity( this.cards[ cardId ] , this.animations[ animationId ] ) ;
} ;



/*
	Execute only DOM and critical stuff first.
*/
Dom.prototype.updateGEntity = async function( gEntity , data , initial = false ) {
	// The order matters
	if ( data.vgObject ) { this.updateGEntityVgObject( gEntity , data ) ; }
	else if ( data.vgMorph ) { this.updateGEntityVgMorph( gEntity , data ) ; }

	if ( data.url ) { await this.updateGEntityImage( gEntity , data ) ; }
	if ( data.backUrl ) { await this.updateGEntityBackImage( gEntity , data ) ; }
	if ( data.maskUrl ) { await this.updateGEntityMask( gEntity , data ) ; }
	if ( data.content ) { this.updateGEntityContent( gEntity , data ) ; }

	if ( data.button !== undefined ) { this.updateGEntityButton( gEntity , data ) ; }
	//if ( data.action !== undefined ) { this.updateGEntityAction( gEntity , data ) ; }

	if ( data.area ) {
		this.updateVgArea( gEntity , data.area ) ;
	}

	if ( gEntity.type === 'marker' && ( data.vg || data.location ) ) {
		this.updateMarkerLocation( gEntity , data.vg , data.location ) ;
	}

	// For some unknown reasons, that timeout removes animation glitches
	//await Promise.resolveTimeout( 5 ) ;
	return this.updateGEntityCosmetics( gEntity , data , initial ) ;
} ;



/*
	Execute less important things, like things triggering animations
*/
Dom.prototype.updateGEntityCosmetics = async function( gEntity , data , initial = false ) {
	// The order matters

	// Should comes first: Transition,
	// Either remove them (for initial value) or set them to the user value before changing anything
	if ( ! initial && gEntity.type !== 'marker' && data.transition !== undefined ) {
		if ( data.transition === null ) {
			gEntity.$wrapper.style.transition = '' ;	// reset it to default stylesheet value
		}
		else if ( ! data.transition ) {
			gEntity.$wrapper.style.transition = 'none' ;
		}
		else {
			gEntity.$wrapper.style.transition = 'all ' + data.transition + 's' ;
		}
	}


	if ( data.location !== undefined && gEntity.type !== 'marker' ) {
		// Should be triggered first, or pose/style would conflict with it
		await this.moveGEntityToLocation( gEntity , data ) ;
	}

	if ( data.pose !== undefined ) { this.updateGEntityPose( gEntity , data ) ; }
	if ( data.meta ) { this.updateGEntityMeta( gEntity , data ) ; }

	// Use data.style, NOT gEntity.style: we have to set only new/updated styles
	if ( data.style && gEntity.$wrapper ) {
		delete data.style.position ;	// Forbidden style
		Object.assign( gEntity.style , data.style ) ;
		domKit.css( gEntity.$wrapper , data.style ) ;
	}

	if ( data.imageStyle && gEntity.$image ) {
		delete data.imageStyle.position ;	// Forbidden style
		Object.assign( gEntity.imageStyle , data.imageStyle ) ;
		domKit.css( gEntity.$image , data.imageStyle ) ;
	}

	if ( data.backImageStyle && gEntity.$backImage ) {
		delete data.backImageStyle.position ;	// Forbidden style
		Object.assign( gEntity.backImageStyle , data.backImageStyle ) ;
		domKit.css( gEntity.$backImage , data.backImageStyle ) ;
	}

	if ( data.maskStyle && gEntity.$mask ) {
		delete data.maskStyle.position ;	// Forbidden style
		Object.assign( gEntity.maskStyle , data.maskStyle ) ;
		domKit.css( gEntity.$mask , data.maskStyle ) ;
	}

	if ( data.size || data.position ) { this.updateGEntityTransform( gEntity , data ) ; }

	if ( data.class ) {
		data.class = commonUtils.toClassObject( data.class ) ;
		Object.assign( gEntity.class , data.class ) ;
		domKit.class( gEntity.$wrapper || gEntity.$image , data.class , 's-' ) ;
	}

	// Should comes last: for initial update, restore the transition value and turn visibility on
	if ( initial && gEntity.type !== 'marker' ) {
		// At creation, the visibility is turned off, now we need to turn it on again
		gEntity.$wrapper.style.visibility = 'visible' ;

		// If it's done immediately, the transition can kick in nonetheless
		//await Promise.resolveTimeout( 5 ) ;
		await Promise.resolveAtAnimationFrame() ;

		if ( data.transition === undefined || data.transition === null ) {
			gEntity.$wrapper.style.transition = '' ;	// reset it to default stylesheet value
		}
		else if ( ! data.transition ) {
			gEntity.$wrapper.style.transition = 'none' ;
		}
		else {
			gEntity.$wrapper.style.transition = 'all ' + data.transition + 's' ;
		}
	}
} ;



// Load/replace the gEntity image (data.url)
Dom.prototype.updateGEntityImage = function( gEntity , data ) {
	var promise = new Promise() ;

	gEntity.vgObject = null ;

	if ( gEntity.type === 'card' ) {
		gEntity.$image.style.backgroundImage = 'url("' + this.cleanUrl( data.url ) + '")' ;
		promise.resolve() ;
		return promise ;
	}

	if ( data.url.endsWith( '.svg' ) ) {
		// Always wipe any existing $image element and pre-create the <svg> tag
		if ( gEntity.$image ) { gEntity.$image.remove() ; }

		if ( gEntity.type === 'marker' ) {
			// If it's a marker, load it inside a <g> tag, that will be part of the main VG's <svg>
			// <svg> inside <svg> are great, but Chrome sucks at it (it does not support CSS transform, etc)
			gEntity.$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'g' ) ;
		}
		else {
			gEntity.$image = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
			gEntity.$image.classList.add( 'svg' ) ;
		}

		switch ( gEntity.type ) {
			case 'vg' :
				// Stop event propagation
				gEntity.onClick = ( event ) => {
					//gEntity.actionCallback( gEntity.action ) ;
					event.stopPropagation() ;
				} ;

				gEntity.$image.addEventListener( 'click' , gEntity.onClick ) ;
				gEntity.$image.classList.add( 'vg' ) ;
				this.uiLoadingCount ++ ;
				break ;
			case 'sprite' :
				gEntity.$image.classList.add( 'sprite' ) ;
				break ;
			case 'marker' :
				gEntity.$image.classList.add( 'marker' ) ;
				break ;
		}

		svgKit.load( this.cleanUrl( data.url ) , {
			removeSvgStyle: true ,
			//removeSize: true ,
			//removeIds: true ,
			removeComments: true ,
			removeExoticNamespaces: true ,
			//removeDefaultStyles: true ,
			as: gEntity.$image
		} ).then( () => {
			console.warn( "loaded!" ) ;
			if ( gEntity.type === 'vg' ) {
				this.setVgButtons( gEntity.$image ) ;
				this.setVgPassiveHints( gEntity.$image ) ;
				gEntity.emit( 'loaded' ) ;
				if ( -- this.uiLoadingCount <= 0 ) { this.emit( 'uiLoaded' ) ; }
			}
			else {
				gEntity.emit( 'loaded' ) ;
			}

			promise.resolve() ;
		} ) ;

		console.warn( "Aft load" ) ;
		gEntity.emit( 'loading' ) ;
	}
	else {
		if ( ! gEntity.$image || gEntity.$image.tagName.toLowerCase() !== 'img' ) {
			if ( gEntity.$image ) { gEntity.$image.remove() ; }

			gEntity.$image = document.createElement( 'img' ) ;

			// /!\ support VG that are not SVG??? /!\
			gEntity.$image.classList.add( gEntity.type ) ;
		}

		gEntity.$image.setAttribute( 'src' , this.cleanUrl( data.url ) ) ;
		gEntity.$image.onload = () => promise.resolve() ;
	}

	if ( gEntity.type !== 'marker' ) {
		gEntity.$wrapper.append( gEntity.$image ) ;
	}

	return promise ;
} ;



Dom.prototype.updateGEntityVgObject = function( gEntity , data ) {
	var vgObject = data.vgObject ;

	if ( ! ( vgObject instanceof svgKit.VG ) ) {
		vgObject = svgKit.objectToVG( vgObject ) ;
		if ( ! ( vgObject instanceof svgKit.VG ) ) {
			// Do nothing if it's not a VG object
			return ;
		}
	}

	// Save it now!
	gEntity.vgObject = vgObject ;

	// Always wipe any existing $image element and pre-create the <svg> tag
	if ( gEntity.$image ) { gEntity.$image.remove() ; }

	if ( gEntity.type === 'marker' ) {
		// If it's a marker, load it inside a <g> tag, that will be part of the main VG's <svg>
		// <svg> inside <svg> are great, but Chrome sucks at it (it does not support CSS transform, etc)
		gEntity.$image = vgObject.renderDom( { overrideTag: 'g' } ) ;
	}
	else {
		// Add a removeSvgStyle:true options?
		gEntity.$image = vgObject.renderDom() ;
		gEntity.$image.classList.add( 'svg' ) ;
		gEntity.$image.classList.add( 'vg-object' ) ;
	}

	switch ( gEntity.type ) {
		case 'vg' :
			// Stop event propagation
			gEntity.onClick = ( event ) => {
				//gEntity.actionCallback( gEntity.action ) ;
				event.stopPropagation() ;
			} ;

			gEntity.$image.addEventListener( 'click' , gEntity.onClick ) ;
			gEntity.$image.classList.add( 'vg' ) ;
			this.setVgButtons( gEntity.$image ) ;
			this.setVgPassiveHints( gEntity.$image ) ;
			break ;
		case 'sprite' :
			gEntity.$image.classList.add( 'sprite' ) ;
			break ;
		case 'marker' :
			gEntity.$image.classList.add( 'marker' ) ;
			break ;
	}

	if ( gEntity.type !== 'marker' ) {
		gEntity.$wrapper.append( gEntity.$image ) ;
	}

	return ;
} ;



Dom.prototype.updateGEntityVgMorph = function( gEntity , data ) {
	var vgObject = gEntity.vgObject ;

	if ( ! vgObject ) {
		// Do nothing if it's not a VG object
		console.warn( "Has no VG object, abort..." ) ;
		return ;
	}

	//console.warn( "Got morph log:" , data.vgMorph ) ;
	vgObject.importMorphLog( data.vgMorph ) ;
	//console.warn( "After importing morph log:" , vgObject ) ;
	vgObject.morphDom() ;

	return ;
} ;



// Load/replace the gEntity backImage (data.backUrl)
// /!\ Not async ATM: how to get a "load" event on a background-image???
Dom.prototype.updateGEntityBackImage = function( gEntity , data ) {
	if ( gEntity.type === 'card' ) {
		gEntity.$backImage.style.backgroundImage = 'url("' + this.cleanUrl( data.backUrl ) + '")' ;
		//gEntity.$image.onload = () => promise.resolve() ;
	}

	return Promise.resolved ;
} ;



// Load/replace the gEntity mask (data.maskUrl)
Dom.prototype.updateGEntityMask = function( gEntity , data ) {
	var promise = new Promise() ;

	if ( data.maskUrl.endsWith( '.svg' ) && gEntity.type === 'sprite' ) {
		console.warn( 'has mask!' ) ;

		// Always wipe any existing $mask element and pre-create the <svg> tag
		if ( gEntity.$mask ) { gEntity.$mask.remove() ; }

		gEntity.$mask = document.createElementNS( 'http://www.w3.org/2000/svg' , 'svg' ) ;
		gEntity.$mask.classList.add( 'sprite-mask' ) ;

		svgKit.load( this.cleanUrl( data.maskUrl ) , {
			removeSvgStyle: true ,
			removeSize: true ,
			removeIds: true ,
			removeComments: true ,
			removeExoticNamespaces: true ,
			//removeDefaultStyles: true ,
			as: gEntity.$mask
		} ).then( () => promise.resolve() ) ;

		gEntity.$wrapper.append( gEntity.$mask ) ;
		gEntity.$wrapper.classList.add( 'has-mask' ) ;
	}
	else if ( gEntity.$mask ) {
		gEntity.$mask.remove() ;
		gEntity.$wrapper.classList.remove( 'has-mask' ) ;
		promise.resolve() ;
	}

	return promise ;
} ;



// Update “framework” size/position
Dom.prototype.updateGEntityTransform = function( gEntity , data ) {
	var wrapperAspect , imageAspect , imageWidth , imageHeight ,
		scale , xMinOffset , yMinOffset , xFactor , yFactor ;

	// For instance, marker are excluded
	if ( ! gEntity.$wrapper || ! gEntity.$image ) { return ; }


	// First, assign new size and position
	// /!\ Size and position MUST be checked! /!\
	if ( data.size ) {
		gEntity.size = data.size ;
	}

	if ( data.position ) {
		gEntity.position = data.position ;
	}


	// Pre-compute few thing necessary for the following stuff
	if ( gEntity.$image.tagName.toLowerCase() === 'svg' ) {
		// The SVG element is not a DOM HTML element, it does not have offsetWidth/offsetHeight,
		// hence it' a little bit trickier to get its real boxmodel size

		wrapperAspect = gEntity.$wrapper.offsetWidth / gEntity.$wrapper.offsetHeight ;
		imageAspect = gEntity.$image.width.baseVal.value / gEntity.$image.height.baseVal.value ;

		if ( imageAspect > wrapperAspect ) {
			imageWidth = gEntity.$wrapper.offsetWidth ;
			imageHeight = imageWidth / imageAspect ;
		}
		else {
			imageHeight = gEntity.$wrapper.offsetHeight ;
			imageWidth = imageHeight * imageAspect ;
		}
		console.log( "dbg svg:" , {
			wrapperAspect , imageAspect , imageWidth , imageHeight
		} ) ;
	}
	else {
		imageWidth = gEntity.$image.offsetWidth ;
		imageHeight = gEntity.$image.offsetHeight ;
	}


	// Compute scaling -- should comes first for this to work!
	switch ( gEntity.size.mode ) {
		case 'area' :
		case 'areaMin' :
		default :
			// In this mode, the sprite is scaled relative to its container area.
			scale = gEntity.transform.scaleX = gEntity.transform.scaleY = gEntity.size.xy ;
			console.log( "transform after .updateGEntitySize()" , gEntity.transform ) ;
			break ;
	}


	// Compute position
	switch ( gEntity.position.mode ) {
		case 'areaInSpriteOut' :
			// In this mode, the sprite is positioned relative to its container area -1,-1 being bottom-left and 1,1 being top-right and 0,0 being the center
			// Any value in [-1,1] ensure the whole sprite is inside the area.
			// For values <-1 or >1 the extra are scaled using the sprite scale, e.g.:
			// x=-1.5 means that the sprite is on the left, its left half being invisible (outside the container), its right half being visible (inside the container).

			xMinOffset = yMinOffset = 0 ;
			xFactor = this.$gfx.offsetWidth - imageWidth ;
			yFactor = this.$gfx.offsetHeight - imageHeight ;

			if ( scale !== undefined ) {
				xMinOffset = -0.5 * imageWidth * ( 1 - scale ) ;
				yMinOffset = -0.5 * imageHeight * ( 1 - scale ) ;
				xFactor += imageWidth * ( 1 - scale ) ;
				yFactor += imageHeight * ( 1 - scale ) ;
			}

			console.log( "dbg:" , { xMinOffset , xFactor , yFactor } ) ;

			if ( gEntity.position.x < -1 ) {
				gEntity.transform.translateX = xMinOffset + ( gEntity.position.x + 1 ) * imageWidth * scale ;
			}
			else if ( gEntity.position.x > 1 ) {
				gEntity.transform.translateX = xMinOffset + xFactor + ( gEntity.position.x - 1 ) * imageWidth * scale ;
			}
			else {
				gEntity.transform.translateX = xMinOffset + ( 0.5 + gEntity.position.x / 2 ) * xFactor ;
			}

			if ( gEntity.position.y < -1 ) {
				gEntity.transform.translateY = yMinOffset + yFactor - ( gEntity.position.y + 1 ) * imageHeight * scale ;
			}
			else if ( gEntity.position.y > 1 ) {
				gEntity.transform.translateY = yMinOffset - ( gEntity.position.y - 1 ) * imageHeight * scale ;
			}
			else {
				gEntity.transform.translateY = yMinOffset + ( 0.5 - gEntity.position.y / 2 ) * yFactor ;
			}

			console.log( "transform after .updateGEntityPosition()" , gEntity.transform ) ;
			break ;

		case 'area' :
		default :
			// In this mode, the sprite is positioned relative to its container area -1,-1 being bottom-left and 1,1 being top-right and 0,0 being the center
			// Any value in [-1,1] ensure the whole sprite is inside the area.
			// Values <-1 or >1 still use the same linear coordinate (so are scaled using the container size).

			xMinOffset = yMinOffset = 0 ;
			xFactor = this.$gfx.offsetWidth - imageWidth ;
			yFactor = this.$gfx.offsetHeight - imageHeight ;

			if ( scale !== undefined ) {
				xMinOffset = -0.5 * imageWidth * ( 1 - scale ) ;
				yMinOffset = -0.5 * imageHeight * ( 1 - scale ) ;
				xFactor += imageWidth * ( 1 - scale ) ;
				yFactor += imageHeight * ( 1 - scale ) ;
			}

			console.log( "dbg:" , { xMinOffset , xFactor , yFactor } ) ;
			gEntity.transform.translateX = xMinOffset + ( 0.5 + gEntity.position.x / 2 ) * xFactor ;
			gEntity.transform.translateY = yMinOffset + ( 0.5 - gEntity.position.y / 2 ) * yFactor ;

			console.log( "transform after .updateGEntityPosition()" , gEntity.transform ) ;
			break ;
	}

	// Finally, create the transformation CSS string
	domKit.transform( gEntity.$wrapper , gEntity.transform ) ;
} ;



// Update content (data.content), card-only
Dom.prototype.updateGEntityContent = function( gEntity , data ) {
	var content , $content ;

	if ( gEntity.type !== 'card' ) { return ; }

	for ( let contentName in data.content ) {
		content = data.content[ contentName ] ;
		$content = gEntity.contents[ contentName ] ;

		if ( ! $content ) {
			$content = gEntity.contents[ contentName ] = document.createElement( 'div' ) ;
			$content.classList.add( 'content-' + contentName ) ;
			gEntity.$front.append( $content ) ;
		}

		$content.textContent = content ;
		$content.setAttribute( 'content' , content ) ;
	}
} ;



// Update pose (data.pose)
Dom.prototype.updateGEntityPose = function( gEntity , data ) {
	if ( typeof data.pose === 'string' ) {
		gEntity.$wrapper.setAttribute( 'pose' , data.pose ) ;
		gEntity.pose = data.pose ;
	}
	else {
		gEntity.$wrapper.removeAttribute( 'pose' ) ;
		gEntity.pose = null ;
	}
} ;



// Update meta (data.meta)
Dom.prototype.updateGEntityMeta = function( gEntity , data ) {
	var meta , metaName ;

	for ( metaName in data.meta ) {
		meta = data.meta[ metaName ] ;

		if ( meta ) {
			gEntity.$wrapper.classList.add( 'meta-' + metaName ) ;

			if ( typeof meta === 'number' || typeof meta === 'string' ) {
				gEntity.$wrapper.setAttribute( 'meta-' + metaName , meta ) ;
			}
		}
		else {
			gEntity.$wrapper.classList.remove( 'meta-' + metaName ) ;

			if ( gEntity.$wrapper.hasAttribute( 'meta-' + metaName ) ) {
				gEntity.$wrapper.removeAttribute( 'meta-' + metaName ) ;
			}
		}
	}
} ;



// Button ID (data.button)
Dom.prototype.updateGEntityButton = function( gEntity , data ) {
	var $element = gEntity.$mask || gEntity.$wrapper ;

	var buttonId = data.button ;

	$element.setAttribute( 'id' , 'button-' + buttonId ) ;
	$element.classList.add( 'button' ) ;
	$element.classList.add( 'disabled' ) ;
} ;



// /!\ DEPRECATED /!\
// Click action (data.action)
Dom.prototype.updateGEntityAction = function( gEntity , data ) {
	var $element = gEntity.$mask || gEntity.$image ;

	if ( data.action && ! gEntity.action ) {
		gEntity.onClick = ( event ) => {
			gEntity.actionCallback( gEntity.action ) ;
			event.stopPropagation() ;
		} ;

		$element.classList.add( 'button' ) ;
		$element.addEventListener( 'click' , gEntity.onClick ) ;
	}
	else if ( ! data.action && gEntity.action ) {
		$element.classList.remove( 'button' ) ;
		$element.removeEventListener( 'click' , gEntity.onClick ) ;
	}

	gEntity.action = data.action || null ;
} ;



// Move to a location and perform a FLIP (First Last Invert Play)
Dom.prototype.moveGEntityToLocation = function( gEntity , data ) {
	var promise = new Promise() ,
		locationName = data.location ;

	if ( gEntity.location === locationName ) { promise.resolve() ; return promise ; }

	var $location , $oldLocation , oldLocationName , $slot , $oldSlot , direction , oldDirection ,
		siblingGEntities , siblingSlotRectsBefore , siblingSlotRectsAfter ,
		slotSize , slotBbox , oldSlotBbox ;

	// Timeout value used to enable FLIP transition
	var flipTimeout = 10 ;

	oldLocationName = gEntity.location ;
	$oldLocation = oldLocationName ? this.gEntityLocations[ oldLocationName ] : this.$gfx ;
	$oldSlot = gEntity.$locationSlot || this.$gfx ;
	gEntity.location = locationName ;

	$location = locationName ? this.gEntityLocations[ locationName ] : this.$gfx ;

	if ( ! $location ) {
		// Create the location if it doesn't exist
		$location = this.gEntityLocations[ locationName ] = document.createElement( 'div' ) ;
		$location.classList.add( 'g-entity-location' ) ;
		$location.classList.add( 'g-entity-location-' + locationName ) ;
		this.$gfx.append( $location ) ;
	}

	// Save computed styles now
	var gEntityComputedStyle = window.getComputedStyle( gEntity.$wrapper ) ;
	var locationComputedStyle = window.getComputedStyle( $location ) ;

	// GEntity size
	var gEntityWidth = parseFloat( gEntityComputedStyle.width ) ;
	var gEntityHeight = parseFloat( gEntityComputedStyle.height ) ;

	if ( $location === this.$gfx ) {
		$slot = this.$gfx ;
	}
	else {
		$slot = gEntity.$locationSlot = document.createElement( 'div' ) ;
		$slot.classList.add( 'g-entity-slot' ) ;
		$slot.style.order = gEntity.order ;
		//$slot.style.zIndex = gEntity.order ;	// Not needed, rendering preserve ordering, not DOM precedence, so it's ok
	}

	// Before appending, save all rects of existing sibling slots
	siblingGEntities = [ ... Object.values( this.cards ) , ... Object.values( this.sprites ) , ... Object.values( this.vgs ) ]
		.filter( e => e !== gEntity && e.location && ( e.location === locationName || e.location === oldLocationName ) ) ;

	siblingSlotRectsBefore = siblingGEntities.map( e => e.$locationSlot.getBoundingClientRect() ) ;


	// Insert the slot, if it's not $gfx
	if ( $slot !== this.$gfx ) {
		// We should preserve the :last-child pseudo selector, since there isn't any :last-ordered-child for flex-box...
		if ( $location.lastChild && parseFloat( $location.lastChild.style.order ) > gEntity.order ) {
			// The last entity has a greater order, so we prepend instead
			$location.prepend( $slot ) ;
		}
		else {
			$location.append( $slot ) ;
		}
	}

	// Save the old slot BBox
	oldSlotBbox = $oldSlot.getBoundingClientRect() ;

	// Remove that slot now
	if ( $oldSlot !== this.$gfx ) { $oldSlot.remove() ; }


	// Get slots rects after
	siblingSlotRectsAfter = siblingGEntities.map( e => e.$locationSlot.getBoundingClientRect() ) ;

	// Immediately compute the translation delta and the FLIP for siblings
	siblingGEntities.forEach( ( siblingGEntity , index ) => {
		var beforeRect = siblingSlotRectsBefore[ index ] ,
			afterRect = siblingSlotRectsAfter[ index ] ;

		var transitionStr = siblingGEntity.$wrapper.style.transition ;
		var transformStr = siblingGEntity.$wrapper.style.transform ;

		// Get the local transform, and patch it!
		var transformDelta = Object.assign( {} , siblingGEntity.localTransform ) ;
		transformDelta.translateX += beforeRect.left - afterRect.left ;
		transformDelta.translateY += beforeRect.top - beforeRect.top ;

		// First, disable transitions, so the transform will apply now!
		siblingGEntity.$wrapper.style.transition = 'none' ;
		siblingGEntity.$wrapper.style.transform = domKit.stringifyTransform( transformDelta ) ;

		setTimeout( () => {
			// Re-enable transitions, restore the transform value
			siblingGEntity.$wrapper.style.transition = transitionStr ;
			siblingGEntity.$wrapper.style.transform = transformStr ;
		} , flipTimeout ) ;
	} ) ;


	var targetTransform = { translateX: 0 , translateY: 0 } ;

	// Scale transform
	switch ( locationComputedStyle.flexDirection ) {
		case 'row' :
		case 'row-reverse' :
			slotSize = parseFloat( locationComputedStyle.height ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityHeight ;
			break ;
		case 'column' :
		case 'column-reverse' :
			slotSize = parseFloat( locationComputedStyle.width ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityWidth ;
			break ;
		default :
			slotSize = parseFloat( locationComputedStyle.height ) ;
			targetTransform.scaleX = targetTransform.scaleY = slotSize / gEntityHeight ;
			console.warn( 'flex-direction' , locationComputedStyle.flexDirection ) ;
	}

	// Translation compensation due to scaling, since the origin is in the middle
	targetTransform.translateX -= ( gEntityWidth - gEntityWidth * targetTransform.scaleX ) / 2 ;
	targetTransform.translateY -= ( gEntityHeight - gEntityHeight * targetTransform.scaleY ) / 2 ;

	var localTransform = gEntity.localTransform ;
	gEntity.localTransform = targetTransform ;

	// If this is not a true slot, then just put the gEntity on this slot immediately
	if ( $oldSlot === this.$gfx ) {
		gEntity.$wrapper.style.transform = domKit.stringifyTransform( targetTransform ) ;
		$slot.append( gEntity.$wrapper ) ;
		promise.resolve() ;
		return promise ;
	}


	// Computed styles
	var oldLocationComputedStyle = window.getComputedStyle( $oldLocation ) ;

	// Old location direction
	switch ( oldLocationComputedStyle.flexDirection ) {
		case 'column' :
		case 'column-reverse' :
			oldDirection = 'column' ;
			break ;
		default :
			oldDirection = 'row' ;
	}

	// Compute the FLIP (First Last Invert Play)
	slotBbox = $slot.getBoundingClientRect() ;
	//console.warn( 'bboxes' , slotBbox ,  oldSlotBbox ) ;

	// Old/new difference
	var sourceTransform = {
		translateX: oldSlotBbox.left + localTransform.translateX - slotBbox.left ,
		translateY: oldSlotBbox.top + localTransform.translateY - slotBbox.top ,
		scaleX: localTransform.scaleX ,
		scaleY: localTransform.scaleY
	} ;

	gEntity.$wrapper.style.transform = domKit.stringifyTransform( sourceTransform ) ;
	$slot.append( gEntity.$wrapper ) ;

	// Do not initiate the new transform value in the same synchronous flow,
	// it would not animate anything
	setTimeout( () => {
		gEntity.$wrapper.style.transform = domKit.stringifyTransform( targetTransform ) ;
		promise.resolve() ;
	} , flipTimeout ) ;

	return promise ;
} ;



Dom.prototype.updateVgArea = function( vg , areaData ) {
	var area ;

	if ( vg.type !== 'vg' ) { return ; }

	if ( ! vg.hasState( 'loaded' ) ) {
		vg.once( 'loaded' , this.updateVgArea.bind( this , vg , areaData ) ) ;
		return ;
	}

	for ( area in areaData ) {
		if ( ! vg.area[ area ] ) { vg.area[ area ] = {} ; }
		if ( ! vg.area[ area ].meta ) { vg.area[ area ].meta = {} ; }

		if ( areaData[ area ].hint !== undefined ) { vg.area[ area ].hint = areaData[ area ].hint || null ; }
		if ( areaData[ area ].meta ) { Object.assign( vg.area[ area ].meta , areaData[ area ].meta ) ; }

		Array.from( vg.$image.querySelectorAll( '[area=' + area + ']' ) ).forEach( ( $element ) => {
			var metaName ;

			if ( areaData[ area ].hint !== undefined ) {
				if ( areaData[ area ].hint ) {
					$element.setAttribute( 'data-passive-hint' , areaData[ area ].hint ) ;
					$element.classList.add( 'passive-hint' ) ;
				}
				else {
					$element.removeAttribute( 'data-passive-hint' ) ;
					$element.classList.remove( 'passive-hint' ) ;
				}
			}

			if ( areaData[ area ].meta ) {
				for ( metaName in areaData[ area ].meta ) {
					if ( areaData[ area ].meta[ metaName ] ) {
						$element.classList.add( 'meta-' + metaName ) ;
					}
					else {
						$element.classList.remove( 'meta-' + metaName ) ;
					}
				}
			}
		} ) ;
	}
} ;



Dom.prototype.updateMarkerLocation = function( marker , vgId , areaId ) {
	var vg , $area , areaBBox , markerViewBox , width , height , originX , originY , posX , posY ;


	// First, check that everything is ready and OK...
	if ( ! marker.hasState( 'loaded' ) ) {
		marker.once( 'loaded' , this.updateMarkerLocation.bind( this , marker , vgId , areaId ) ) ;
		return ;
	}

	if ( ! vgId ) { vgId = marker.vg ; }
	if ( ! areaId ) { areaId = marker.location ; }

	if ( ! this.vgs[ vgId ] ) {
		console.warn( 'Unknown VG id: ' , vgId ) ;
		return ;
	}

	vg = this.vgs[ vgId ] ;

	if ( ! vg.hasState( 'loaded' ) ) {
		vg.once( 'loaded' , this.updateMarkerLocation.bind( this , marker , vgId , areaId ) ) ;
		return ;
	}

	$area = vg.$image.querySelector( '[area=' + areaId + ']' ) ;

	if ( ! $area ) {
		console.warn( 'VG ' + vgId + ': area not found' , areaId ) ;
		return ;
	}


	// Once everything is ok, update the marker
	marker.vg = vgId ;
	marker.location = areaId ;


	// Get or compute the area active point
	areaBBox = $area.getBBox() ;
	posX = areaBBox.x + areaBBox.width / 2 ;
	posY = areaBBox.y + areaBBox.height / 2 ;


	// Now, compute the SVG marker position
	markerViewBox = svgKit.getViewBox( marker.$image ) ;
	width = parseFloat( marker.$image.getAttribute( 'width' ) ) || markerViewBox.width ;
	height = parseFloat( marker.$image.getAttribute( 'height' ) ) || markerViewBox.height ;

	if ( ! isNaN( originX = parseFloat( marker.$image.getAttribute( 'originX' ) ) ) ) {
		posX -= ( ( originX - markerViewBox.x ) / markerViewBox.width ) * width ;
	}

	if ( ! isNaN( originY = parseFloat( marker.$image.getAttribute( 'originY' ) ) ) ) {
		posY -= ( ( originY - markerViewBox.y ) / markerViewBox.height ) * height ;
	}

	//* Using CSS transform (Chrome and Firefox both support transition here)
	marker.$image.style.transform =
		'translate(' + posX + 'px , ' + posY + 'px )' +
		'scale(' + width / markerViewBox.width + ' , ' + height / markerViewBox.height + ')' ;
	//*/

	/* Using SVG's transform attribute (Chrome allows transition but not Firefox)
	marker.$image.setAttribute( 'transform' ,
		'translate(' + posX + ' , ' + posY + ' )' +
		'scale(' + width / markerViewBox.width + ' , ' + height / markerViewBox.height + ')'
	) ;
	//*/

	// Append the <g> tag to the main VG's <svg> now, if needed
	if ( marker.$image.ownerSVGElement !== vg.$image ) {
		vg.$image.append( marker.$image ) ;
	}
} ;



Dom.prototype.createGEntityLocation = function( locationName ) {
	var $location ;

	if ( this.gEntityLocations[ locationName ] ) { return ; }

	$location = this.gEntityLocations[ locationName ] = document.createElement( 'div' ) ;
	$location.classList.add( 'g-entity-location' ) ;
	$location.classList.add( 'g-entity-location-' + locationName ) ;
	this.$gfx.append( $location ) ;
} ;



Dom.prototype.createCardMarkup = function( card ) {
	// .$wrapper is the placeholder, hover effects happen on it
	card.$card = document.createElement( 'div' ) ;
	card.$card.classList.add( 'card' ) ;
	card.$wrapper.append( card.$card ) ;

	card.$front = document.createElement( 'div' ) ;
	card.$front.classList.add( 'front' ) ;
	card.$card.append( card.$front ) ;

	card.$image = document.createElement( 'div' ) ;
	card.$image.classList.add( 'card-image' ) ;
	card.$front.append( card.$image ) ;

	card.$back = document.createElement( 'div' ) ;
	card.$back.classList.add( 'back' ) ;
	card.$card.append( card.$back ) ;

	card.$backImage = document.createElement( 'div' ) ;
	card.$backImage.classList.add( 'card-image' ) ;
	card.$back.append( card.$backImage ) ;
} ;



Dom.prototype.animateGEntity = async function( gEntity , animation ) {
	var frame , frameIndex = 0 ;

	gEntity.animation = animation.id ;

	// What should be done if an animation is already running???

	//console.warn( "Animation: " , animation ) ;

	// If there is no frames, quit now
	if ( ! Array.isArray( animation.frames ) || ! animation.frames.length ) { return ; }

	for ( frame of animation.frames ) {
		// Update the gEntity
		await this.updateGEntity( gEntity , frame ) ;
		await Promise.resolveTimeout( frame.duration * 1000 ) ;
	}

	// Restore something here?
	gEntity.animation = null ;
} ;



Dom.prototype.defineAnimation = function( id , data ) {
	data.id = id ;
	this.animations[ id ] = data ;
} ;



Dom.prototype.setVgButtons = function( $svg ) {
	Array.from( $svg.querySelectorAll( '[button]' ) ).forEach( ( $element ) => {
		var buttonId = $element.getAttribute( 'button' ) ;

		$element.setAttribute( 'id' , 'button-' + buttonId ) ;

		if ( ! $element.getAttribute( 'area' ) ) {
			// Create a default area's name equals to the button's ID, if not present
			$element.setAttribute( 'area' , buttonId ) ;
		}

		$element.classList.add( 'button' ) ;
		$element.classList.add( 'disabled' ) ;
	} ) ;
} ;



Dom.prototype.setVgPassiveHints = function( $svg ) {
	Array.from( $svg.querySelectorAll( '[hint]' ) ).forEach( ( $element ) => {
		var hint = $element.getAttribute( 'hint' ) ;

		$element.setAttribute( 'data-passive-hint' , hint ) ;
		$element.classList.add( 'passive-hint' ) ;

		$element.addEventListener( 'mouseleave' , ( event ) => {
			this.clearHint() ;
			//event.stopPropagation() ; // useless for mouseleave events
		} ) ;

		$element.addEventListener( 'mouseenter' , ( event ) => {
			var $element_ = event.currentTarget ;
			var hint_ = $element_.getAttribute( 'data-passive-hint' ) ;
			if ( ! hint_ ) { return ; }
			this.setHint( hint_ , { passive: true } ) ;
			//event.stopPropagation() ; // useless for mouseenter events
		} ) ;
	} ) ;
} ;



/* SFX */



// maybe callback?
Dom.prototype.sound = function( data , callback ) {
	var endHandler ,
		$element = this[ '$sound' + this.nextSoundChannel ] ;

	console.warn( '$sound' + this.nextSoundChannel , data , $element ) ;
	this.nextSoundChannel = ( this.nextSoundChannel + 1 ) % 4 ;

	$element.setAttribute( 'src' , this.cleanUrl( data.url ) ) ;
	$element.play() ;

	if ( callback ) {
		endHandler = () => {
			$element.removeEventListener( 'ended' , endHandler ) ;
			callback() ;
		} ;

		$element.addEventListener( 'ended' , endHandler ) ;
	}
} ;



Dom.prototype.music = function( data ) {
	var oldSrc = this.$music.getAttribute( 'src' ) ;

	if ( data.url ) {
		data.url = this.cleanUrl( data.url ) ;

		if ( oldSrc ) {
			if ( oldSrc !== data.url ) {
				soundFadeOut( this.$music , () => {
					this.$music.setAttribute( 'src' , data.url ) ;
					this.$music.play() ;
					soundFadeIn( this.$music ) ;
				} ) ;
			}
			else if ( this.$music.ended ) {
				// We are receiving a music event for the same last music url,
				// but last playback ended, so play it again.
				this.$music.play() ;
			}
		}
		else {
			this.$music.volume = 0 ;
			this.$music.setAttribute( 'src' , data.url ) ;
			this.$music.play() ;
			soundFadeIn( this.$music ) ;
		}
	}
	else if ( oldSrc ) {
		soundFadeOut( this.$music , () => {
			this.$music.removeAttribute( 'src' ) ;
		} ) ;
	}
} ;



var SOUND_FADE_TIMEOUT = 10 ;
var SOUND_FADE_VALUE = 0.01 ;



function soundFadeIn( $element , callback ) {
	if ( $element.__fadeTimer ) { clearTimeout( $element.__fadeTimer ) ; $element.__fadeTimer = null ; }

	if ( $element.volume >= 1 ) {
		if ( callback ) { callback() ; }
		return ;
	}

	$element.volume = Math.min( 1 , $element.volume + SOUND_FADE_VALUE ) ;
	$element.__fadeTimer = setTimeout( soundFadeIn.bind( undefined , $element , callback ) , SOUND_FADE_TIMEOUT ) ;
}



function soundFadeOut( $element , callback ) {
	if ( $element.__fadeTimer ) { clearTimeout( $element.__fadeTimer ) ; $element.__fadeTimer = null ; }

	if ( $element.volume <= 0 ) {
		if ( callback ) { callback() ; }
		return ;
	}

	$element.volume = Math.max( 0 , $element.volume - SOUND_FADE_VALUE ) ;
	$element.__fadeTimer = setTimeout( soundFadeOut.bind( undefined , $element , callback ) , SOUND_FADE_TIMEOUT ) ;
}

