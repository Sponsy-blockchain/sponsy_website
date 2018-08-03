/*!
 * jQuery Validation Plugin v1.16.0
 *
 * http://jqueryvalidation.org/
 *
 * Copyright (c) 2016 Jörn Zaefferer
 * Released under the MIT license
 */
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( ["jquery"], factory );
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory( require( "jquery" ) );
	} else {
		factory( jQuery );
	}
}(function( $ ) {

$.extend( $.fn, {

	// http://jqueryvalidation.org/validate/
	validate: function( options ) {

		// If nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// Check if a validator for this form was already created
		var validator = $.data( this[ 0 ], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[ 0 ] );
		$.data( this[ 0 ], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.on( "click.validate", ":submit", function( event ) {
				if ( validator.settings.submitHandler ) {
					validator.submitButton = event.target;
				}

				// Allow suppressing validation by adding a cancel class to the submit button
				if ( $( this ).hasClass( "cancel" ) ) {
					validator.cancelSubmit = true;
				}

				// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
				if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
					validator.cancelSubmit = true;
				}
			} );

			// Validate the form on submit
			this.on( "submit.validate", function( event ) {
				if ( validator.settings.debug ) {

					// Prevent form submit to be able to see console output
					event.preventDefault();
				}
				function handle() {
					var hidden, result;
					if ( validator.settings.submitHandler ) {
						if ( validator.submitButton ) {

							// Insert a hidden input as a replacement for the missing submit button
							hidden = $( "<input type='hidden'/>" )
								.attr( "name", validator.submitButton.name )
								.val( $( validator.submitButton ).val() )
								.appendTo( validator.currentForm );
						}
						result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( validator.submitButton ) {

							// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						if ( result !== undefined ) {
							return result;
						}
						return false;
					}
					return true;
				}

				// Prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			} );
		}

		return validator;
	},

	// http://jqueryvalidation.org/valid/
	valid: function() {
		var valid, validator, errorList;

		if ( $( this[ 0 ] ).is( "form" ) ) {
			valid = this.validate().form();
		} else {
			errorList = [];
			valid = true;
			validator = $( this[ 0 ].form ).validate();
			this.each( function() {
				valid = validator.element( this ) && valid;
				if ( !valid ) {
					errorList = errorList.concat( validator.errorList );
				}
			} );
			validator.errorList = errorList;
		}
		return valid;
	},

	// http://jqueryvalidation.org/rules/
	rules: function( command, argument ) {
		var element = this[ 0 ],
			settings, staticRules, existingRules, data, param, filtered;

		// If nothing is selected, return empty object; can't chain anyway
		if ( element == null || element.form == null ) {
			return;
		}

		if ( command ) {
			settings = $.data( element.form, "validator" ).settings;
			staticRules = settings.rules;
			existingRules = $.validator.staticRules( element );
			switch ( command ) {
			case "add":
				$.extend( existingRules, $.validator.normalizeRule( argument ) );

				// Remove messages from rules, but allow them to be set separately
				delete existingRules.messages;
				staticRules[ element.name ] = existingRules;
				if ( argument.messages ) {
					settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[ element.name ];
					return existingRules;
				}
				filtered = {};
				$.each( argument.split( /\s/ ), function( index, method ) {
					filtered[ method ] = existingRules[ method ];
					delete existingRules[ method ];
					if ( method === "required" ) {
						$( element ).removeAttr( "aria-required" );
					}
				} );
				return filtered;
			}
		}

		data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules( element ),
			$.validator.attributeRules( element ),
			$.validator.dataRules( element ),
			$.validator.staticRules( element )
		), element );

		// Make sure required is at front
		if ( data.required ) {
			param = data.required;
			delete data.required;
			data = $.extend( { required: param }, data );
			$( element ).attr( "aria-required", "true" );
		}

		// Make sure remote is at back
		if ( data.remote ) {
			param = data.remote;
			delete data.remote;
			data = $.extend( data, { remote: param } );
		}

		return data;
	}
} );

// Custom selectors
$.extend( $.expr.pseudos || $.expr[ ":" ], {		// '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support

	// http://jqueryvalidation.org/blank-selector/
	blank: function( a ) {
		return !$.trim( "" + $( a ).val() );
	},

	// http://jqueryvalidation.org/filled-selector/
	filled: function( a ) {
		var val = $( a ).val();
		return val !== null && !!$.trim( "" + val );
	},

	// http://jqueryvalidation.org/unchecked-selector/
	unchecked: function( a ) {
		return !$( a ).prop( "checked" );
	}
} );

// Constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

// http://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray( arguments );
			args.unshift( source );
			return $.validator.format.apply( this, args );
		};
	}
	if ( params === undefined ) {
		return source;
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray( arguments ).slice( 1 );
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each( params, function( i, n ) {
		source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
			return n;
		} );
	} );
	return source;
};

$.extend( $.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		pendingClass: "pending",
		validClass: "valid",
		errorElement: "label",
		focusCleanup: false,
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function( element ) {
			this.lastActive = element;

			// Hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.hideThese( this.errorsFor( element ) );
			}
		},
		onfocusout: function( element ) {
			if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
				this.element( element );
			}
		},
		onkeyup: function( element, event ) {

			// Avoid revalidate the field when pressing one of the following keys
			// Shift       => 16
			// Ctrl        => 17
			// Alt         => 18
			// Caps lock   => 20
			// End         => 35
			// Home        => 36
			// Left arrow  => 37
			// Up arrow    => 38
			// Right arrow => 39
			// Down arrow  => 40
			// Insert      => 45
			// Num lock    => 144
			// AltGr key   => 225
			var excludedKeys = [
				16, 17, 18, 20, 35, 36, 37,
				38, 39, 40, 45, 144, 225
			];

			if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
				return;
			} else if ( element.name in this.submitted || element.name in this.invalid ) {
				this.element( element );
			}
		},
		onclick: function( element ) {

			// Click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element( element );

			// Or option elements, check parent select in that case
			} else if ( element.parentNode.name in this.submitted ) {
				this.element( element.parentNode );
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
			} else {
				$( element ).addClass( errorClass ).removeClass( validClass );
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
			} else {
				$( element ).removeClass( errorClass ).addClass( validClass );
			}
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.setDefaults/
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format( "Please enter no more than {0} characters." ),
		minlength: $.validator.format( "Please enter at least {0} characters." ),
		rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
		range: $.validator.format( "Please enter a value between {0} and {1}." ),
		max: $.validator.format( "Please enter a value less than or equal to {0}." ),
		min: $.validator.format( "Please enter a value greater than or equal to {0}." ),
		step: $.validator.format( "Please enter a multiple of {0}." )
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $( this.settings.errorLabelContainer );
			this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
			this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = ( this.groups = {} ),
				rules;
			$.each( this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split( /\s/ );
				}
				$.each( value, function( index, name ) {
					groups[ name ] = key;
				} );
			} );
			rules = this.settings.rules;
			$.each( rules, function( key, value ) {
				rules[ key ] = $.validator.normalizeRule( value );
			} );

			function delegate( event ) {

				// Set form expando on contenteditable
				if ( !this.form && this.hasAttribute( "contenteditable" ) ) {
					this.form = $( this ).closest( "form" )[ 0 ];
				}

				var validator = $.data( this.form, "validator" ),
					eventType = "on" + event.type.replace( /^validate/, "" ),
					settings = validator.settings;
				if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
					settings[ eventType ].call( validator, this, event );
				}
			}

			$( this.currentForm )
				.on( "focusin.validate focusout.validate keyup.validate",
					":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
					"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
					"[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate )

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on( "click.validate", "select, option, [type='radio'], [type='checkbox']", delegate );

			if ( this.settings.invalidHandler ) {
				$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
			}

			// Add aria-required to any Static/Data/Class required fields before first validation
			// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
			$( this.currentForm ).find( "[required], [data-rule-required], .required" ).attr( "aria-required", "true" );
		},

		// http://jqueryvalidation.org/Validator.form/
		form: function() {
			this.checkForm();
			$.extend( this.submitted, this.errorMap );
			this.invalid = $.extend( {}, this.errorMap );
			if ( !this.valid() ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
				this.check( elements[ i ] );
			}
			return this.valid();
		},

		// http://jqueryvalidation.org/Validator.element/
		element: function( element ) {
			var cleanElement = this.clean( element ),
				checkElement = this.validationTargetFor( cleanElement ),
				v = this,
				result = true,
				rs, group;

			if ( checkElement === undefined ) {
				delete this.invalid[ cleanElement.name ];
			} else {
				this.prepareElement( checkElement );
				this.currentElements = $( checkElement );

				// If this element is grouped, then validate all group elements already
				// containing a value
				group = this.groups[ checkElement.name ];
				if ( group ) {
					$.each( this.groups, function( name, testgroup ) {
						if ( testgroup === group && name !== checkElement.name ) {
							cleanElement = v.validationTargetFor( v.clean( v.findByName( name ) ) );
							if ( cleanElement && cleanElement.name in v.invalid ) {
								v.currentElements.push( cleanElement );
								result = v.check( cleanElement ) && result;
							}
						}
					} );
				}

				rs = this.check( checkElement ) !== false;
				result = result && rs;
				if ( rs ) {
					this.invalid[ checkElement.name ] = false;
				} else {
					this.invalid[ checkElement.name ] = true;
				}

				if ( !this.numberOfInvalids() ) {

					// Hide error containers on last error
					this.toHide = this.toHide.add( this.containers );
				}
				this.showErrors();

				// Add aria-invalid status for screen readers
				$( element ).attr( "aria-invalid", !rs );
			}

			return result;
		},

		// http://jqueryvalidation.org/Validator.showErrors/
		showErrors: function( errors ) {
			if ( errors ) {
				var validator = this;

				// Add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = $.map( this.errorMap, function( message, name ) {
					return {
						message: message,
						element: validator.findByName( name )[ 0 ]
					};
				} );

				// Remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !( element.name in errors );
				} );
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// http://jqueryvalidation.org/Validator.resetForm/
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.invalid = {};
			this.submitted = {};
			this.prepareForm();
			this.hideErrors();
			var elements = this.elements()
				.removeData( "previousValue" )
				.removeAttr( "aria-invalid" );

			this.resetElements( elements );
		},

		resetElements: function( elements ) {
			var i;

			if ( this.settings.unhighlight ) {
				for ( i = 0; elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ],
						this.settings.errorClass, "" );
					this.findByName( elements[ i ].name ).removeClass( this.settings.validClass );
				}
			} else {
				elements
					.removeClass( this.settings.errorClass )
					.removeClass( this.settings.validClass );
			}
		},

		numberOfInvalids: function() {
			return this.objectLength( this.invalid );
		},

		objectLength: function( obj ) {
			/* jshint unused: false */
			var count = 0,
				i;
			for ( i in obj ) {
				if ( obj[ i ] ) {
					count++;
				}
			}
			return count;
		},

		hideErrors: function() {
			this.hideThese( this.toHide );
		},

		hideThese: function( errors ) {
			errors.not( this.containers ).text( "" );
			this.addWrapper( errors ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [] )
					.filter( ":visible" )
					.focus()

					// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger( "focusin" );
				} catch ( e ) {

					// Ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep( this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			} ).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// Select all valid inputs inside the form (no submit or reset buttons)
			return $( this.currentForm )
			.find( "input, select, textarea, [contenteditable]" )
			.not( ":submit, :reset, :image, :disabled" )
			.not( this.settings.ignore )
			.filter( function() {
				var name = this.name || $( this ).attr( "name" ); // For contenteditable
				if ( !name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this );
				}

				// Set form expando on contenteditable
				if ( this.hasAttribute( "contenteditable" ) ) {
					this.form = $( this ).closest( "form" )[ 0 ];
				}

				// Select only the first element for each name, and only those with rules specified
				if ( name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
					return false;
				}

				rulesCache[ name ] = true;
				return true;
			} );
		},

		clean: function( selector ) {
			return $( selector )[ 0 ];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.split( " " ).join( "." );
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		resetInternals: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $( [] );
			this.toHide = $( [] );
		},

		reset: function() {
			this.resetInternals();
			this.currentElements = $( [] );
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor( element );
		},

		elementValue: function( element ) {
			var $element = $( element ),
				type = element.type,
				val, idx;

			if ( type === "radio" || type === "checkbox" ) {
				return this.findByName( element.name ).filter( ":checked" ).val();
			} else if ( type === "number" && typeof element.validity !== "undefined" ) {
				return element.validity.badInput ? "NaN" : $element.val();
			}

			if ( element.hasAttribute( "contenteditable" ) ) {
				val = $element.text();
			} else {
				val = $element.val();
			}

			if ( type === "file" ) {

				// Modern browser (chrome & safari)
				if ( val.substr( 0, 12 ) === "C:\\fakepath\\" ) {
					return val.substr( 12 );
				}

				// Legacy browsers
				// Unix-based path
				idx = val.lastIndexOf( "/" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Windows-based path
				idx = val.lastIndexOf( "\\" );
				if ( idx >= 0 ) {
					return val.substr( idx + 1 );
				}

				// Just the file name
				return val;
			}

			if ( typeof val === "string" ) {
				return val.replace( /\r/g, "" );
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $( element ).rules(),
				rulesCount = $.map( rules, function( n, i ) {
					return i;
				} ).length,
				dependencyMismatch = false,
				val = this.elementValue( element ),
				result, method, rule;

			// If a normalizer is defined for this element, then
			// call it to retreive the changed value instead
			// of using the real one.
			// Note that `this` in the normalizer is `element`.
			if ( typeof rules.normalizer === "function" ) {
				val = rules.normalizer.call( element, val );

				if ( typeof val !== "string" ) {
					throw new TypeError( "The normalizer should return a string value." );
				}

				// Delete the normalizer from rules to avoid treating
				// it as a pre-defined method.
				delete rules.normalizer;
			}

			for ( method in rules ) {
				rule = { method: method, parameters: rules[ method ] };
				try {
					result = $.validator.methods[ method ].call( this, val, element, rule.parameters );

					// If a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" && rulesCount === 1 ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor( element ) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch ( e ) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					if ( e instanceof TypeError ) {
						e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
					}

					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength( rules ) ) {
				this.successList.push( element );
			}
			return true;
		},

		// Return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		// return the generic message if present and no method specific message is present
		customDataMessage: function( element, method ) {
			return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
				method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
		},

		// Return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[ name ];
			return m && ( m.constructor === String ? m : m[ method ] );
		},

		// Return the first defined argument, allowing empty strings
		findDefined: function() {
			for ( var i = 0; i < arguments.length; i++ ) {
				if ( arguments[ i ] !== undefined ) {
					return arguments[ i ];
				}
			}
			return undefined;
		},

		// The second parameter 'rule' used to be a string, and extended to an object literal
		// of the following form:
		// rule = {
		//     method: "method name",
		//     parameters: "the given method parameters"
		// }
		//
		// The old behavior still supported, kept to maintain backward compatibility with
		// old code, and will be removed in the next major release.
		defaultMessage: function( element, rule ) {
			if ( typeof rule === "string" ) {
				rule = { method: rule };
			}

			var message = this.findDefined(
					this.customMessage( element.name, rule.method ),
					this.customDataMessage( element, rule.method ),

					// 'title' is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					$.validator.messages[ rule.method ],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call( this, rule.parameters, element );
			} else if ( theregex.test( message ) ) {
				message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
			}

			return message;
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule );

			this.errorList.push( {
				message: message,
				element: element,
				method: rule.method
			} );

			this.errorMap[ element.name ] = message;
			this.submitted[ element.name ] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements, error;
			for ( i = 0; this.errorList[ i ]; i++ ) {
				error = this.errorList[ i ];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if ( this.settings.success ) {
				for ( i = 0; this.successList[ i ]; i++ ) {
					this.showLabel( this.successList[ i ] );
				}
			}
			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
					this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not( this.invalidElements() );
		},

		invalidElements: function() {
			return $( this.errorList ).map( function() {
				return this.element;
			} );
		},

		showLabel: function( element, message ) {
			var place, group, errorID, v,
				error = this.errorsFor( element ),
				elementID = this.idOrName( element ),
				describedBy = $( element ).attr( "aria-describedby" );

			if ( error.length ) {

				// Refresh error/success class
				error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// Replace message on existing label
				error.html( message );
			} else {

				// Create error element
				error = $( "<" + this.settings.errorElement + ">" )
					.attr( "id", elementID + "-error" )
					.addClass( this.settings.errorClass )
					.html( message || "" );

				// Maintain reference to the element to be placed into the DOM
				place = error;
				if ( this.settings.wrapper ) {

					// Make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
				}
				if ( this.labelContainer.length ) {
					this.labelContainer.append( place );
				} else if ( this.settings.errorPlacement ) {
					this.settings.errorPlacement.call( this, place, $( element ) );
				} else {
					place.insertAfter( element );
				}

				// Link error back to the element
				if ( error.is( "label" ) ) {

					// If the error is a label, then associate using 'for'
					error.attr( "for", elementID );

					// If the element is not a child of an associated label, then it's necessary
					// to explicitly apply aria-describedby
				} else if ( error.parents( "label[for='" + this.escapeCssMeta( elementID ) + "']" ).length === 0 ) {
					errorID = error.attr( "id" );

					// Respect existing non-error aria-describedby
					if ( !describedBy ) {
						describedBy = errorID;
					} else if ( !describedBy.match( new RegExp( "\\b" + this.escapeCssMeta( errorID ) + "\\b" ) ) ) {

						// Add to end of list if not already present
						describedBy += " " + errorID;
					}
					$( element ).attr( "aria-describedby", describedBy );

					// If this element is grouped, then assign to all elements in the same group
					group = this.groups[ element.name ];
					if ( group ) {
						v = this;
						$.each( v.groups, function( name, testgroup ) {
							if ( testgroup === group ) {
								$( "[name='" + v.escapeCssMeta( name ) + "']", v.currentForm )
									.attr( "aria-describedby", error.attr( "id" ) );
							}
						} );
					}
				}
			}
			if ( !message && this.settings.success ) {
				error.text( "" );
				if ( typeof this.settings.success === "string" ) {
					error.addClass( this.settings.success );
				} else {
					this.settings.success( error, element );
				}
			}
			this.toShow = this.toShow.add( error );
		},

		errorsFor: function( element ) {
			var name = this.escapeCssMeta( this.idOrName( element ) ),
				describer = $( element ).attr( "aria-describedby" ),
				selector = "label[for='" + name + "'], label[for='" + name + "'] *";

			// 'aria-describedby' should directly reference the error element
			if ( describer ) {
				selector = selector + ", #" + this.escapeCssMeta( describer )
					.replace( /\s+/g, ", #" );
			}

			return this
				.errors()
				.filter( selector );
		},

		// See https://api.jquery.com/category/selectors/, for CSS
		// meta-characters that should be escaped in order to be used with JQuery
		// as a literal part of a name/id or any selector.
		escapeCssMeta: function( string ) {
			return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
		},

		idOrName: function( element ) {
			return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
		},

		validationTargetFor: function( element ) {

			// If radio/checkbox, validate first element in group instead
			if ( this.checkable( element ) ) {
				element = this.findByName( element.name );
			}

			// Always apply ignore filter
			return $( element ).not( this.settings.ignore )[ 0 ];
		},

		checkable: function( element ) {
			return ( /radio|checkbox/i ).test( element.type );
		},

		findByName: function( name ) {
			return $( this.currentForm ).find( "[name='" + this.escapeCssMeta( name ) + "']" );
		},

		getLength: function( value, element ) {
			switch ( element.nodeName.toLowerCase() ) {
			case "select":
				return $( "option:selected", element ).length;
			case "input":
				if ( this.checkable( element ) ) {
					return this.findByName( element.name ).filter( ":checked" ).length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[ typeof param ] ? this.dependTypes[ typeof param ]( param, element ) : true;
		},

		dependTypes: {
			"boolean": function( param ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$( param, element.form ).length;
			},
			"function": function( param, element ) {
				return param( element );
			}
		},

		optional: function( element ) {
			var val = this.elementValue( element );
			return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
		},

		startRequest: function( element ) {
			if ( !this.pending[ element.name ] ) {
				this.pendingRequest++;
				$( element ).addClass( this.settings.pendingClass );
				this.pending[ element.name ] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;

			// Sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[ element.name ];
			$( element ).removeClass( this.settings.pendingClass );
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$( this.currentForm ).submit();
				this.formSubmitted = false;
			} else if ( !valid && this.pendingRequest === 0 && this.formSubmitted ) {
				$( this.currentForm ).triggerHandler( "invalid-form", [ this ] );
				this.formSubmitted = false;
			}
		},

		previousValue: function( element, method ) {
			method = typeof method === "string" && method || "remote";

			return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, { method: method } )
			} );
		},

		// Cleans up all forms and elements, removes validator-specific events
		destroy: function() {
			this.resetForm();

			$( this.currentForm )
				.off( ".validate" )
				.removeData( "validator" )
				.find( ".validate-equalTo-blur" )
					.off( ".validate-equalTo" )
					.removeClass( "validate-equalTo-blur" );
		}

	},

	classRuleSettings: {
		required: { required: true },
		email: { email: true },
		url: { url: true },
		date: { date: true },
		dateISO: { dateISO: true },
		number: { number: true },
		digits: { digits: true },
		creditcard: { creditcard: true }
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[ className ] = rules;
		} else {
			$.extend( this.classRuleSettings, className );
		}
	},

	classRules: function( element ) {
		var rules = {},
			classes = $( element ).attr( "class" );

		if ( classes ) {
			$.each( classes.split( " " ), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend( rules, $.validator.classRuleSettings[ this ] );
				}
			} );
		}
		return rules;
	},

	normalizeAttributeRule: function( rules, type, method, value ) {

		// Convert the value to a number for number inputs, and for text for backwards compability
		// allows type="date" and others to be compared as strings
		if ( /min|max|step/.test( method ) && ( type === null || /number|range|text/.test( type ) ) ) {
			value = Number( value );

			// Support Opera Mini, which returns NaN for undefined minlength
			if ( isNaN( value ) ) {
				value = undefined;
			}
		}

		if ( value || value === 0 ) {
			rules[ method ] = value;
		} else if ( type === method && type !== "range" ) {

			// Exception: the jquery validate 'range' method
			// does not test for the html5 'range' type
			rules[ method ] = true;
		}
	},

	attributeRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {

			// Support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = element.getAttribute( method );

				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}

				// Force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr( method );
			}

			this.normalizeAttributeRule( rules, type, method, value );
		}

		// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test( rules.maxlength ) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var rules = {},
			$element = $( element ),
			type = element.getAttribute( "type" ),
			method, value;

		for ( method in $.validator.methods ) {
			value = $element.data( "rule" + method.charAt( 0 ).toUpperCase() + method.substring( 1 ).toLowerCase() );
			this.normalizeAttributeRule( rules, type, method, value );
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {},
			validator = $.data( element.form, "validator" );

		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule( validator.settings.rules[ element.name ] ) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {

		// Handle dependency check
		$.each( rules, function( prop, val ) {

			// Ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[ prop ];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch ( typeof val.depends ) {
				case "string":
					keepRule = !!$( val.depends, element.form ).length;
					break;
				case "function":
					keepRule = val.depends.call( element, element );
					break;
				}
				if ( keepRule ) {
					rules[ prop ] = val.param !== undefined ? val.param : true;
				} else {
					$.data( element.form, "validator" ).resetElements( $( element ) );
					delete rules[ prop ];
				}
			}
		} );

		// Evaluate parameters
		$.each( rules, function( rule, parameter ) {
			rules[ rule ] = $.isFunction( parameter ) && rule !== "normalizer" ? parameter( element ) : parameter;
		} );

		// Clean number parameters
		$.each( [ "minlength", "maxlength" ], function() {
			if ( rules[ this ] ) {
				rules[ this ] = Number( rules[ this ] );
			}
		} );
		$.each( [ "rangelength", "range" ], function() {
			var parts;
			if ( rules[ this ] ) {
				if ( $.isArray( rules[ this ] ) ) {
					rules[ this ] = [ Number( rules[ this ][ 0 ] ), Number( rules[ this ][ 1 ] ) ];
				} else if ( typeof rules[ this ] === "string" ) {
					parts = rules[ this ].replace( /[\[\]]/g, "" ).split( /[\s,]+/ );
					rules[ this ] = [ Number( parts[ 0 ] ), Number( parts[ 1 ] ) ];
				}
			}
		} );

		if ( $.validator.autoCreateRanges ) {

			// Auto-create ranges
			if ( rules.min != null && rules.max != null ) {
				rules.range = [ rules.min, rules.max ];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength != null && rules.maxlength != null ) {
				rules.rangelength = [ rules.minlength, rules.maxlength ];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each( data.split( /\s/ ), function() {
				transformed[ this ] = true;
			} );
			data = transformed;
		}
		return data;
	},

	// http://jqueryvalidation.org/jQuery.validator.addMethod/
	addMethod: function( name, method, message ) {
		$.validator.methods[ name ] = method;
		$.validator.messages[ name ] = message !== undefined ? message : $.validator.messages[ name ];
		if ( method.length < 3 ) {
			$.validator.addClassRules( name, $.validator.normalizeRule( name ) );
		}
	},

	// http://jqueryvalidation.org/jQuery.validator.methods/
	methods: {

		// http://jqueryvalidation.org/required-method/
		required: function( value, element, param ) {

			// Check if dependency is met
			if ( !this.depend( param, element ) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {

				// Could be an array for select-multiple or a string, both are fine this way
				var val = $( element ).val();
				return val && val.length > 0;
			}
			if ( this.checkable( element ) ) {
				return this.getLength( value, element ) > 0;
			}
			return value.length > 0;
		},

		// http://jqueryvalidation.org/email-method/
		email: function( value, element ) {

			// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
			// Retrieved 2014-01-14
			// If you have a problem with this implementation, report a bug against the above spec
			// Or use custom methods to implement your own email validation
			return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
		},

		// http://jqueryvalidation.org/url-method/
		url: function( value, element ) {

			// Copyright (c) 2010-2013 Diego Perini, MIT licensed
			// https://gist.github.com/dperini/729294
			// see also https://mathiasbynens.be/demo/url-regex
			// modified to allow protocol-relative URLs
			return this.optional( element ) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
		},

		// http://jqueryvalidation.org/date-method/
		date: function( value, element ) {
			return this.optional( element ) || !/Invalid|NaN/.test( new Date( value ).toString() );
		},

		// http://jqueryvalidation.org/dateISO-method/
		dateISO: function( value, element ) {
			return this.optional( element ) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
		},

		// http://jqueryvalidation.org/number-method/
		number: function( value, element ) {
			return this.optional( element ) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
		},

		// http://jqueryvalidation.org/digits-method/
		digits: function( value, element ) {
			return this.optional( element ) || /^\d+$/.test( value );
		},

		// http://jqueryvalidation.org/minlength-method/
		minlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length >= param;
		},

		// http://jqueryvalidation.org/maxlength-method/
		maxlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || length <= param;
		},

		// http://jqueryvalidation.org/rangelength-method/
		rangelength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength( value, element );
			return this.optional( element ) || ( length >= param[ 0 ] && length <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/min-method/
		min: function( value, element, param ) {
			return this.optional( element ) || value >= param;
		},

		// http://jqueryvalidation.org/max-method/
		max: function( value, element, param ) {
			return this.optional( element ) || value <= param;
		},

		// http://jqueryvalidation.org/range-method/
		range: function( value, element, param ) {
			return this.optional( element ) || ( value >= param[ 0 ] && value <= param[ 1 ] );
		},

		// http://jqueryvalidation.org/step-method/
		step: function( value, element, param ) {
			var type = $( element ).attr( "type" ),
				errorMessage = "Step attribute on input type " + type + " is not supported.",
				supportedTypes = [ "text", "number", "range" ],
				re = new RegExp( "\\b" + type + "\\b" ),
				notSupported = type && !re.test( supportedTypes.join() ),
				decimalPlaces = function( num ) {
					var match = ( "" + num ).match( /(?:\.(\d+))?$/ );
					if ( !match ) {
						return 0;
					}

					// Number of digits right of decimal point.
					return match[ 1 ] ? match[ 1 ].length : 0;
				},
				toInt = function( num ) {
					return Math.round( num * Math.pow( 10, decimals ) );
				},
				valid = true,
				decimals;

			// Works only for text, number and range input types
			// TODO find a way to support input types date, datetime, datetime-local, month, time and week
			if ( notSupported ) {
				throw new Error( errorMessage );
			}

			decimals = decimalPlaces( param );

			// Value can't have too many decimals
			if ( decimalPlaces( value ) > decimals || toInt( value ) % toInt( param ) !== 0 ) {
				valid = false;
			}

			return this.optional( element ) || valid;
		},

		// http://jqueryvalidation.org/equalTo-method/
		equalTo: function( value, element, param ) {

			// Bind to the blur event of the target in order to revalidate whenever the target field is updated
			var target = $( param );
			if ( this.settings.onfocusout && target.not( ".validate-equalTo-blur" ).length ) {
				target.addClass( "validate-equalTo-blur" ).on( "blur.validate-equalTo", function() {
					$( element ).valid();
				} );
			}
			return value === target.val();
		},

		// http://jqueryvalidation.org/remote-method/
		remote: function( value, element, param, method ) {
			if ( this.optional( element ) ) {
				return "dependency-mismatch";
			}

			method = typeof method === "string" && method || "remote";

			var previous = this.previousValue( element, method ),
				validator, data, optionDataString;

			if ( !this.settings.messages[ element.name ] ) {
				this.settings.messages[ element.name ] = {};
			}
			previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
			this.settings.messages[ element.name ][ method ] = previous.message;

			param = typeof param === "string" && { url: param } || param;
			optionDataString = $.param( $.extend( { data: value }, param.data ) );
			if ( previous.old === optionDataString ) {
				return previous.valid;
			}

			previous.old = optionDataString;
			validator = this;
			this.startRequest( element );
			data = {};
			data[ element.name ] = value;
			$.ajax( $.extend( true, {
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				context: validator.currentForm,
				success: function( response ) {
					var valid = response === true || response === "true",
						errors, message, submitted;

					validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
					if ( valid ) {
						submitted = validator.formSubmitted;
						validator.resetInternals();
						validator.toHide = validator.errorsFor( element );
						validator.formSubmitted = submitted;
						validator.successList.push( element );
						validator.invalid[ element.name ] = false;
						validator.showErrors();
					} else {
						errors = {};
						message = response || validator.defaultMessage( element, { method: method, parameters: value } );
						errors[ element.name ] = previous.message = message;
						validator.invalid[ element.name ] = true;
						validator.showErrors( errors );
					}
					previous.valid = valid;
					validator.stopRequest( element, valid );
				}
			}, param ) );
			return "pending";
		}
	}

} );

// Ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

var pendingRequests = {},
	ajax;

// Use a prefilter if available (1.5+)
if ( $.ajaxPrefilter ) {
	$.ajaxPrefilter( function( settings, _, xhr ) {
		var port = settings.port;
		if ( settings.mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = xhr;
		}
	} );
} else {

	// Proxy ajax
	ajax = $.ajax;
	$.ajax = function( settings ) {
		var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
			port = ( "port" in settings ? settings : $.ajaxSettings ).port;
		if ( mode === "abort" ) {
			if ( pendingRequests[ port ] ) {
				pendingRequests[ port ].abort();
			}
			pendingRequests[ port ] = ajax.apply( this, arguments );
			return pendingRequests[ port ];
		}
		return ajax.apply( this, arguments );
	};
}
return $;
}));
/*! Magnific Popup - v1.1.0 - 2016-02-20
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2016 Dmitry Semenov; */
;(function (factory) { 
if (typeof define === 'function' && define.amd) { 
 // AMD. Register as an anonymous module. 
 define(['jquery'], factory); 
 } else if (typeof exports === 'object') { 
 // Node/CommonJS 
 factory(require('jquery')); 
 } else { 
 // Browser globals 
 factory(window.jQuery || window.Zepto); 
 } 
 }(function($) { 

/*>>core*/
/**
 * 
 * Magnific Popup Core JS file
 * 
 */


/**
 * Private static constants
 */
var CLOSE_EVENT = 'Close',
	BEFORE_CLOSE_EVENT = 'BeforeClose',
	AFTER_CLOSE_EVENT = 'AfterClose',
	BEFORE_APPEND_EVENT = 'BeforeAppend',
	MARKUP_PARSE_EVENT = 'MarkupParse',
	OPEN_EVENT = 'Open',
	CHANGE_EVENT = 'Change',
	NS = 'mfp',
	EVENT_NS = '.' + NS,
	READY_CLASS = 'mfp-ready',
	REMOVING_CLASS = 'mfp-removing',
	PREVENT_CLOSE_CLASS = 'mfp-prevent-close';


/**
 * Private vars 
 */
/*jshint -W079 */
var mfp, // As we have only one instance of MagnificPopup object, we define it locally to not to use 'this'
	MagnificPopup = function(){},
	_isJQ = !!(window.jQuery),
	_prevStatus,
	_window = $(window),
	_document,
	_prevContentType,
	_wrapClasses,
	_currPopupType;


/**
 * Private functions
 */
var _mfpOn = function(name, f) {
		mfp.ev.on(NS + name + EVENT_NS, f);
	},
	_getEl = function(className, appendTo, html, raw) {
		var el = document.createElement('div');
		el.className = 'mfp-'+className;
		if(html) {
			el.innerHTML = html;
		}
		if(!raw) {
			el = $(el);
			if(appendTo) {
				el.appendTo(appendTo);
			}
		} else if(appendTo) {
			appendTo.appendChild(el);
		}
		return el;
	},
	_mfpTrigger = function(e, data) {
		mfp.ev.triggerHandler(NS + e, data);

		if(mfp.st.callbacks) {
			// converts "mfpEventName" to "eventName" callback and triggers it if it's present
			e = e.charAt(0).toLowerCase() + e.slice(1);
			if(mfp.st.callbacks[e]) {
				mfp.st.callbacks[e].apply(mfp, $.isArray(data) ? data : [data]);
			}
		}
	},
	_getCloseBtn = function(type) {
		if(type !== _currPopupType || !mfp.currTemplate.closeBtn) {
			mfp.currTemplate.closeBtn = $( mfp.st.closeMarkup.replace('%title%', mfp.st.tClose ) );
			_currPopupType = type;
		}
		return mfp.currTemplate.closeBtn;
	},
	// Initialize Magnific Popup only when called at least once
	_checkInstance = function() {
		if(!$.magnificPopup.instance) {
			/*jshint -W020 */
			mfp = new MagnificPopup();
			mfp.init();
			$.magnificPopup.instance = mfp;
		}
	},
	// CSS transition detection, http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
	supportsTransitions = function() {
		var s = document.createElement('p').style, // 's' for style. better to create an element if body yet to exist
			v = ['ms','O','Moz','Webkit']; // 'v' for vendor

		if( s['transition'] !== undefined ) {
			return true; 
		}
			
		while( v.length ) {
			if( v.pop() + 'Transition' in s ) {
				return true;
			}
		}
				
		return false;
	};



/**
 * Public functions
 */
MagnificPopup.prototype = {

	constructor: MagnificPopup,

	/**
	 * Initializes Magnific Popup plugin. 
	 * This function is triggered only once when $.fn.magnificPopup or $.magnificPopup is executed
	 */
	init: function() {
		var appVersion = navigator.appVersion;
		mfp.isLowIE = mfp.isIE8 = document.all && !document.addEventListener;
		mfp.isAndroid = (/android/gi).test(appVersion);
		mfp.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);
		mfp.supportsTransition = supportsTransitions();

		// We disable fixed positioned lightbox on devices that don't handle it nicely.
		// If you know a better way of detecting this - let me know.
		mfp.probablyMobile = (mfp.isAndroid || mfp.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent) );
		_document = $(document);

		mfp.popupsCache = {};
	},

	/**
	 * Opens popup
	 * @param  data [description]
	 */
	open: function(data) {

		var i;

		if(data.isObj === false) { 
			// convert jQuery collection to array to avoid conflicts later
			mfp.items = data.items.toArray();

			mfp.index = 0;
			var items = data.items,
				item;
			for(i = 0; i < items.length; i++) {
				item = items[i];
				if(item.parsed) {
					item = item.el[0];
				}
				if(item === data.el[0]) {
					mfp.index = i;
					break;
				}
			}
		} else {
			mfp.items = $.isArray(data.items) ? data.items : [data.items];
			mfp.index = data.index || 0;
		}

		// if popup is already opened - we just update the content
		if(mfp.isOpen) {
			mfp.updateItemHTML();
			return;
		}
		
		mfp.types = []; 
		_wrapClasses = '';
		if(data.mainEl && data.mainEl.length) {
			mfp.ev = data.mainEl.eq(0);
		} else {
			mfp.ev = _document;
		}

		if(data.key) {
			if(!mfp.popupsCache[data.key]) {
				mfp.popupsCache[data.key] = {};
			}
			mfp.currTemplate = mfp.popupsCache[data.key];
		} else {
			mfp.currTemplate = {};
		}



		mfp.st = $.extend(true, {}, $.magnificPopup.defaults, data ); 
		mfp.fixedContentPos = mfp.st.fixedContentPos === 'auto' ? !mfp.probablyMobile : mfp.st.fixedContentPos;

		if(mfp.st.modal) {
			mfp.st.closeOnContentClick = false;
			mfp.st.closeOnBgClick = false;
			mfp.st.showCloseBtn = false;
			mfp.st.enableEscapeKey = false;
		}
		

		// Building markup
		// main containers are created only once
		if(!mfp.bgOverlay) {

			// Dark overlay
			mfp.bgOverlay = _getEl('bg').on('click'+EVENT_NS, function() {
				mfp.close();
			});

			mfp.wrap = _getEl('wrap').attr('tabindex', -1).on('click'+EVENT_NS, function(e) {
				if(mfp._checkIfClose(e.target)) {
					mfp.close();
				}
			});

			mfp.container = _getEl('container', mfp.wrap);
		}

		mfp.contentContainer = _getEl('content');
		if(mfp.st.preloader) {
			mfp.preloader = _getEl('preloader', mfp.container, mfp.st.tLoading);
		}


		// Initializing modules
		var modules = $.magnificPopup.modules;
		for(i = 0; i < modules.length; i++) {
			var n = modules[i];
			n = n.charAt(0).toUpperCase() + n.slice(1);
			mfp['init'+n].call(mfp);
		}
		_mfpTrigger('BeforeOpen');


		if(mfp.st.showCloseBtn) {
			// Close button
			if(!mfp.st.closeBtnInside) {
				mfp.wrap.append( _getCloseBtn() );
			} else {
				_mfpOn(MARKUP_PARSE_EVENT, function(e, template, values, item) {
					values.close_replaceWith = _getCloseBtn(item.type);
				});
				_wrapClasses += ' mfp-close-btn-in';
			}
		}

		if(mfp.st.alignTop) {
			_wrapClasses += ' mfp-align-top';
		}

	

		if(mfp.fixedContentPos) {
			mfp.wrap.css({
				overflow: mfp.st.overflowY,
				overflowX: 'hidden',
				overflowY: mfp.st.overflowY
			});
		} else {
			mfp.wrap.css({ 
				top: _window.scrollTop(),
				position: 'absolute'
			});
		}
		if( mfp.st.fixedBgPos === false || (mfp.st.fixedBgPos === 'auto' && !mfp.fixedContentPos) ) {
			mfp.bgOverlay.css({
				height: _document.height(),
				position: 'absolute'
			});
		}

		

		if(mfp.st.enableEscapeKey) {
			// Close on ESC key
			_document.on('keyup' + EVENT_NS, function(e) {
				if(e.keyCode === 27) {
					mfp.close();
				}
			});
		}

		_window.on('resize' + EVENT_NS, function() {
			mfp.updateSize();
		});


		if(!mfp.st.closeOnContentClick) {
			_wrapClasses += ' mfp-auto-cursor';
		}
		
		if(_wrapClasses)
			mfp.wrap.addClass(_wrapClasses);


		// this triggers recalculation of layout, so we get it once to not to trigger twice
		var windowHeight = mfp.wH = _window.height();

		
		var windowStyles = {};

		if( mfp.fixedContentPos ) {
            if(mfp._hasScrollBar(windowHeight)){
                var s = mfp._getScrollbarSize();
                if(s) {
                    windowStyles.marginRight = s;
                }
            }
        }

		if(mfp.fixedContentPos) {
			if(!mfp.isIE7) {
				windowStyles.overflow = 'hidden';
			} else {
				// ie7 double-scroll bug
				$('body, html').css('overflow', 'hidden');
			}
		}

		
		
		var classesToadd = mfp.st.mainClass;
		if(mfp.isIE7) {
			classesToadd += ' mfp-ie7';
		}
		if(classesToadd) {
			mfp._addClassToMFP( classesToadd );
		}

		// add content
		mfp.updateItemHTML();

		_mfpTrigger('BuildControls');

		// remove scrollbar, add margin e.t.c
		$('html').css(windowStyles);
		
		// add everything to DOM
		mfp.bgOverlay.add(mfp.wrap).prependTo( mfp.st.prependTo || $(document.body) );

		// Save last focused element
		mfp._lastFocusedEl = document.activeElement;
		
		// Wait for next cycle to allow CSS transition
		setTimeout(function() {
			
			if(mfp.content) {
				mfp._addClassToMFP(READY_CLASS);
				mfp._setFocus();
			} else {
				// if content is not defined (not loaded e.t.c) we add class only for BG
				mfp.bgOverlay.addClass(READY_CLASS);
			}
			
			// Trap the focus in popup
			_document.on('focusin' + EVENT_NS, mfp._onFocusIn);

		}, 16);

		mfp.isOpen = true;
		mfp.updateSize(windowHeight);
		_mfpTrigger(OPEN_EVENT);

		return data;
	},

	/**
	 * Closes the popup
	 */
	close: function() {
		if(!mfp.isOpen) return;
		_mfpTrigger(BEFORE_CLOSE_EVENT);

		mfp.isOpen = false;
		// for CSS3 animation
		if(mfp.st.removalDelay && !mfp.isLowIE && mfp.supportsTransition )  {
			mfp._addClassToMFP(REMOVING_CLASS);
			setTimeout(function() {
				mfp._close();
			}, mfp.st.removalDelay);
		} else {
			mfp._close();
		}
	},

	/**
	 * Helper for close() function
	 */
	_close: function() {
		_mfpTrigger(CLOSE_EVENT);

		var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

		mfp.bgOverlay.detach();
		mfp.wrap.detach();
		mfp.container.empty();

		if(mfp.st.mainClass) {
			classesToRemove += mfp.st.mainClass + ' ';
		}

		mfp._removeClassFromMFP(classesToRemove);

		if(mfp.fixedContentPos) {
			var windowStyles = {marginRight: ''};
			if(mfp.isIE7) {
				$('body, html').css('overflow', '');
			} else {
				windowStyles.overflow = '';
			}
			$('html').css(windowStyles);
		}
		
		_document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
		mfp.ev.off(EVENT_NS);

		// clean up DOM elements that aren't removed
		mfp.wrap.attr('class', 'mfp-wrap').removeAttr('style');
		mfp.bgOverlay.attr('class', 'mfp-bg');
		mfp.container.attr('class', 'mfp-container');

		// remove close button from target element
		if(mfp.st.showCloseBtn &&
		(!mfp.st.closeBtnInside || mfp.currTemplate[mfp.currItem.type] === true)) {
			if(mfp.currTemplate.closeBtn)
				mfp.currTemplate.closeBtn.detach();
		}


		if(mfp.st.autoFocusLast && mfp._lastFocusedEl) {
			$(mfp._lastFocusedEl).focus(); // put tab focus back
		}
		mfp.currItem = null;	
		mfp.content = null;
		mfp.currTemplate = null;
		mfp.prevHeight = 0;

		_mfpTrigger(AFTER_CLOSE_EVENT);
	},
	
	updateSize: function(winHeight) {

		if(mfp.isIOS) {
			// fixes iOS nav bars https://github.com/dimsemenov/Magnific-Popup/issues/2
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			var height = window.innerHeight * zoomLevel;
			mfp.wrap.css('height', height);
			mfp.wH = height;
		} else {
			mfp.wH = winHeight || _window.height();
		}
		// Fixes #84: popup incorrectly positioned with position:relative on body
		if(!mfp.fixedContentPos) {
			mfp.wrap.css('height', mfp.wH);
		}

		_mfpTrigger('Resize');

	},

	/**
	 * Set content of popup based on current index
	 */
	updateItemHTML: function() {
		var item = mfp.items[mfp.index];

		// Detach and perform modifications
		mfp.contentContainer.detach();

		if(mfp.content)
			mfp.content.detach();

		if(!item.parsed) {
			item = mfp.parseEl( mfp.index );
		}

		var type = item.type;

		_mfpTrigger('BeforeChange', [mfp.currItem ? mfp.currItem.type : '', type]);
		// BeforeChange event works like so:
		// _mfpOn('BeforeChange', function(e, prevType, newType) { });

		mfp.currItem = item;

		if(!mfp.currTemplate[type]) {
			var markup = mfp.st[type] ? mfp.st[type].markup : false;

			// allows to modify markup
			_mfpTrigger('FirstMarkupParse', markup);

			if(markup) {
				mfp.currTemplate[type] = $(markup);
			} else {
				// if there is no markup found we just define that template is parsed
				mfp.currTemplate[type] = true;
			}
		}

		if(_prevContentType && _prevContentType !== item.type) {
			mfp.container.removeClass('mfp-'+_prevContentType+'-holder');
		}

		var newContent = mfp['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, mfp.currTemplate[type]);
		mfp.appendContent(newContent, type);

		item.preloaded = true;

		_mfpTrigger(CHANGE_EVENT, item);
		_prevContentType = item.type;

		// Append container back after its content changed
		mfp.container.prepend(mfp.contentContainer);

		_mfpTrigger('AfterChange');
	},


	/**
	 * Set HTML content of popup
	 */
	appendContent: function(newContent, type) {
		mfp.content = newContent;

		if(newContent) {
			if(mfp.st.showCloseBtn && mfp.st.closeBtnInside &&
				mfp.currTemplate[type] === true) {
				// if there is no markup, we just append close button element inside
				if(!mfp.content.find('.mfp-close').length) {
					mfp.content.append(_getCloseBtn());
				}
			} else {
				mfp.content = newContent;
			}
		} else {
			mfp.content = '';
		}

		_mfpTrigger(BEFORE_APPEND_EVENT);
		mfp.container.addClass('mfp-'+type+'-holder');

		mfp.contentContainer.append(mfp.content);
	},


	/**
	 * Creates Magnific Popup data object based on given data
	 * @param  {int} index Index of item to parse
	 */
	parseEl: function(index) {
		var item = mfp.items[index],
			type;

		if(item.tagName) {
			item = { el: $(item) };
		} else {
			type = item.type;
			item = { data: item, src: item.src };
		}

		if(item.el) {
			var types = mfp.types;

			// check for 'mfp-TYPE' class
			for(var i = 0; i < types.length; i++) {
				if( item.el.hasClass('mfp-'+types[i]) ) {
					type = types[i];
					break;
				}
			}

			item.src = item.el.attr('data-mfp-src');
			if(!item.src) {
				item.src = item.el.attr('href');
			}
		}

		item.type = type || mfp.st.type || 'inline';
		item.index = index;
		item.parsed = true;
		mfp.items[index] = item;
		_mfpTrigger('ElementParse', item);

		return mfp.items[index];
	},


	/**
	 * Initializes single popup or a group of popups
	 */
	addGroup: function(el, options) {
		var eHandler = function(e) {
			e.mfpEl = this;
			mfp._openClick(e, el, options);
		};

		if(!options) {
			options = {};
		}

		var eName = 'click.magnificPopup';
		options.mainEl = el;

		if(options.items) {
			options.isObj = true;
			el.off(eName).on(eName, eHandler);
		} else {
			options.isObj = false;
			if(options.delegate) {
				el.off(eName).on(eName, options.delegate , eHandler);
			} else {
				options.items = el;
				el.off(eName).on(eName, eHandler);
			}
		}
	},
	_openClick: function(e, el, options) {
		var midClick = options.midClick !== undefined ? options.midClick : $.magnificPopup.defaults.midClick;


		if(!midClick && ( e.which === 2 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey ) ) {
			return;
		}

		var disableOn = options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn;

		if(disableOn) {
			if($.isFunction(disableOn)) {
				if( !disableOn.call(mfp) ) {
					return true;
				}
			} else { // else it's number
				if( _window.width() < disableOn ) {
					return true;
				}
			}
		}

		if(e.type) {
			e.preventDefault();

			// This will prevent popup from closing if element is inside and popup is already opened
			if(mfp.isOpen) {
				e.stopPropagation();
			}
		}

		options.el = $(e.mfpEl);
		if(options.delegate) {
			options.items = el.find(options.delegate);
		}
		mfp.open(options);
	},


	/**
	 * Updates text on preloader
	 */
	updateStatus: function(status, text) {

		if(mfp.preloader) {
			if(_prevStatus !== status) {
				mfp.container.removeClass('mfp-s-'+_prevStatus);
			}

			if(!text && status === 'loading') {
				text = mfp.st.tLoading;
			}

			var data = {
				status: status,
				text: text
			};
			// allows to modify status
			_mfpTrigger('UpdateStatus', data);

			status = data.status;
			text = data.text;

			mfp.preloader.html(text);

			mfp.preloader.find('a').on('click', function(e) {
				e.stopImmediatePropagation();
			});

			mfp.container.addClass('mfp-s-'+status);
			_prevStatus = status;
		}
	},


	/*
		"Private" helpers that aren't private at all
	 */
	// Check to close popup or not
	// "target" is an element that was clicked
	_checkIfClose: function(target) {

		if($(target).hasClass(PREVENT_CLOSE_CLASS)) {
			return;
		}

		var closeOnContent = mfp.st.closeOnContentClick;
		var closeOnBg = mfp.st.closeOnBgClick;

		if(closeOnContent && closeOnBg) {
			return true;
		} else {

			// We close the popup if click is on close button or on preloader. Or if there is no content.
			if(!mfp.content || $(target).hasClass('mfp-close') || (mfp.preloader && target === mfp.preloader[0]) ) {
				return true;
			}

			// if click is outside the content
			if(  (target !== mfp.content[0] && !$.contains(mfp.content[0], target))  ) {
				if(closeOnBg) {
					// last check, if the clicked element is in DOM, (in case it's removed onclick)
					if( $.contains(document, target) ) {
						return true;
					}
				}
			} else if(closeOnContent) {
				return true;
			}

		}
		return false;
	},
	_addClassToMFP: function(cName) {
		mfp.bgOverlay.addClass(cName);
		mfp.wrap.addClass(cName);
	},
	_removeClassFromMFP: function(cName) {
		this.bgOverlay.removeClass(cName);
		mfp.wrap.removeClass(cName);
	},
	_hasScrollBar: function(winHeight) {
		return (  (mfp.isIE7 ? _document.height() : document.body.scrollHeight) > (winHeight || _window.height()) );
	},
	_setFocus: function() {
		(mfp.st.focus ? mfp.content.find(mfp.st.focus).eq(0) : mfp.wrap).focus();
	},
	_onFocusIn: function(e) {
		if( e.target !== mfp.wrap[0] && !$.contains(mfp.wrap[0], e.target) ) {
			mfp._setFocus();
			return false;
		}
	},
	_parseMarkup: function(template, values, item) {
		var arr;
		if(item.data) {
			values = $.extend(item.data, values);
		}
		_mfpTrigger(MARKUP_PARSE_EVENT, [template, values, item] );

		$.each(values, function(key, value) {
			if(value === undefined || value === false) {
				return true;
			}
			arr = key.split('_');
			if(arr.length > 1) {
				var el = template.find(EVENT_NS + '-'+arr[0]);

				if(el.length > 0) {
					var attr = arr[1];
					if(attr === 'replaceWith') {
						if(el[0] !== value[0]) {
							el.replaceWith(value);
						}
					} else if(attr === 'img') {
						if(el.is('img')) {
							el.attr('src', value);
						} else {
							el.replaceWith( $('<img>').attr('src', value).attr('class', el.attr('class')) );
						}
					} else {
						el.attr(arr[1], value);
					}
				}

			} else {
				template.find(EVENT_NS + '-'+key).html(value);
			}
		});
	},

	_getScrollbarSize: function() {
		// thx David
		if(mfp.scrollbarSize === undefined) {
			var scrollDiv = document.createElement("div");
			scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			mfp.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return mfp.scrollbarSize;
	}

}; /* MagnificPopup core prototype end */




/**
 * Public static functions
 */
$.magnificPopup = {
	instance: null,
	proto: MagnificPopup.prototype,
	modules: [],

	open: function(options, index) {
		_checkInstance();

		if(!options) {
			options = {};
		} else {
			options = $.extend(true, {}, options);
		}

		options.isObj = true;
		options.index = index || 0;
		return this.instance.open(options);
	},

	close: function() {
		return $.magnificPopup.instance && $.magnificPopup.instance.close();
	},

	registerModule: function(name, module) {
		if(module.options) {
			$.magnificPopup.defaults[name] = module.options;
		}
		$.extend(this.proto, module.proto);
		this.modules.push(name);
	},

	defaults: {

		// Info about options is in docs:
		// http://dimsemenov.com/plugins/magnific-popup/documentation.html#options

		disableOn: 0,

		key: null,

		midClick: false,

		mainClass: '',

		preloader: true,

		focus: '', // CSS selector of input to focus after popup is opened

		closeOnContentClick: false,

		closeOnBgClick: true,

		closeBtnInside: true,

		showCloseBtn: true,

		enableEscapeKey: true,

		modal: false,

		alignTop: false,

		removalDelay: 0,

		prependTo: null,

		fixedContentPos: 'auto',

		fixedBgPos: 'auto',

		overflowY: 'auto',

		closeMarkup: '<button title="%title%" type="button" class="mfp-close">&#215;</button>',

		tClose: 'Close (Esc)',

		tLoading: 'Loading...',

		autoFocusLast: true

	}
};



$.fn.magnificPopup = function(options) {
	_checkInstance();

	var jqEl = $(this);

	// We call some API method of first param is a string
	if (typeof options === "string" ) {

		if(options === 'open') {
			var items,
				itemOpts = _isJQ ? jqEl.data('magnificPopup') : jqEl[0].magnificPopup,
				index = parseInt(arguments[1], 10) || 0;

			if(itemOpts.items) {
				items = itemOpts.items[index];
			} else {
				items = jqEl;
				if(itemOpts.delegate) {
					items = items.find(itemOpts.delegate);
				}
				items = items.eq( index );
			}
			mfp._openClick({mfpEl:items}, jqEl, itemOpts);
		} else {
			if(mfp.isOpen)
				mfp[options].apply(mfp, Array.prototype.slice.call(arguments, 1));
		}

	} else {
		// clone options obj
		options = $.extend(true, {}, options);

		/*
		 * As Zepto doesn't support .data() method for objects
		 * and it works only in normal browsers
		 * we assign "options" object directly to the DOM element. FTW!
		 */
		if(_isJQ) {
			jqEl.data('magnificPopup', options);
		} else {
			jqEl[0].magnificPopup = options;
		}

		mfp.addGroup(jqEl, options);

	}
	return jqEl;
};

/*>>core*/

/*>>inline*/

var INLINE_NS = 'inline',
	_hiddenClass,
	_inlinePlaceholder,
	_lastInlineElement,
	_putInlineElementsBack = function() {
		if(_lastInlineElement) {
			_inlinePlaceholder.after( _lastInlineElement.addClass(_hiddenClass) ).detach();
			_lastInlineElement = null;
		}
	};

$.magnificPopup.registerModule(INLINE_NS, {
	options: {
		hiddenClass: 'hide', // will be appended with `mfp-` prefix
		markup: '',
		tNotFound: 'Content not found'
	},
	proto: {

		initInline: function() {
			mfp.types.push(INLINE_NS);

			_mfpOn(CLOSE_EVENT+'.'+INLINE_NS, function() {
				_putInlineElementsBack();
			});
		},

		getInline: function(item, template) {

			_putInlineElementsBack();

			if(item.src) {
				var inlineSt = mfp.st.inline,
					el = $(item.src);

				if(el.length) {

					// If target element has parent - we replace it with placeholder and put it back after popup is closed
					var parent = el[0].parentNode;
					if(parent && parent.tagName) {
						if(!_inlinePlaceholder) {
							_hiddenClass = inlineSt.hiddenClass;
							_inlinePlaceholder = _getEl(_hiddenClass);
							_hiddenClass = 'mfp-'+_hiddenClass;
						}
						// replace target inline element with placeholder
						_lastInlineElement = el.after(_inlinePlaceholder).detach().removeClass(_hiddenClass);
					}

					mfp.updateStatus('ready');
				} else {
					mfp.updateStatus('error', inlineSt.tNotFound);
					el = $('<div>');
				}

				item.inlineElement = el;
				return el;
			}

			mfp.updateStatus('ready');
			mfp._parseMarkup(template, {}, item);
			return template;
		}
	}
});

/*>>inline*/

/*>>ajax*/
var AJAX_NS = 'ajax',
	_ajaxCur,
	_removeAjaxCursor = function() {
		if(_ajaxCur) {
			$(document.body).removeClass(_ajaxCur);
		}
	},
	_destroyAjaxRequest = function() {
		_removeAjaxCursor();
		if(mfp.req) {
			mfp.req.abort();
		}
	};

$.magnificPopup.registerModule(AJAX_NS, {

	options: {
		settings: null,
		cursor: 'mfp-ajax-cur',
		tError: '<a href="%url%">The content</a> could not be loaded.'
	},

	proto: {
		initAjax: function() {
			mfp.types.push(AJAX_NS);
			_ajaxCur = mfp.st.ajax.cursor;

			_mfpOn(CLOSE_EVENT+'.'+AJAX_NS, _destroyAjaxRequest);
			_mfpOn('BeforeChange.' + AJAX_NS, _destroyAjaxRequest);
		},
		getAjax: function(item) {

			if(_ajaxCur) {
				$(document.body).addClass(_ajaxCur);
			}

			mfp.updateStatus('loading');

			var opts = $.extend({
				url: item.src,
				success: function(data, textStatus, jqXHR) {
					var temp = {
						data:data,
						xhr:jqXHR
					};

					_mfpTrigger('ParseAjax', temp);

					mfp.appendContent( $(temp.data), AJAX_NS );

					item.finished = true;

					_removeAjaxCursor();

					mfp._setFocus();

					setTimeout(function() {
						mfp.wrap.addClass(READY_CLASS);
					}, 16);

					mfp.updateStatus('ready');

					_mfpTrigger('AjaxContentAdded');
				},
				error: function() {
					_removeAjaxCursor();
					item.finished = item.loadError = true;
					mfp.updateStatus('error', mfp.st.ajax.tError.replace('%url%', item.src));
				}
			}, mfp.st.ajax.settings);

			mfp.req = $.ajax(opts);

			return '';
		}
	}
});

/*>>ajax*/

/*>>image*/
var _imgInterval,
	_getTitle = function(item) {
		if(item.data && item.data.title !== undefined)
			return item.data.title;

		var src = mfp.st.image.titleSrc;

		if(src) {
			if($.isFunction(src)) {
				return src.call(mfp, item);
			} else if(item.el) {
				return item.el.attr(src) || '';
			}
		}
		return '';
	};

$.magnificPopup.registerModule('image', {

	options: {
		markup: '<div class="mfp-figure">'+
					'<div class="mfp-close"></div>'+
					'<figure>'+
						'<div class="mfp-img"></div>'+
						'<figcaption>'+
							'<div class="mfp-bottom-bar">'+
								'<div class="mfp-title"></div>'+
								'<div class="mfp-counter"></div>'+
							'</div>'+
						'</figcaption>'+
					'</figure>'+
				'</div>',
		cursor: 'mfp-zoom-out-cur',
		titleSrc: 'title',
		verticalFit: true,
		tError: '<a href="%url%">The image</a> could not be loaded.'
	},

	proto: {
		initImage: function() {
			var imgSt = mfp.st.image,
				ns = '.image';

			mfp.types.push('image');

			_mfpOn(OPEN_EVENT+ns, function() {
				if(mfp.currItem.type === 'image' && imgSt.cursor) {
					$(document.body).addClass(imgSt.cursor);
				}
			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(imgSt.cursor) {
					$(document.body).removeClass(imgSt.cursor);
				}
				_window.off('resize' + EVENT_NS);
			});

			_mfpOn('Resize'+ns, mfp.resizeImage);
			if(mfp.isLowIE) {
				_mfpOn('AfterChange', mfp.resizeImage);
			}
		},
		resizeImage: function() {
			var item = mfp.currItem;
			if(!item || !item.img) return;

			if(mfp.st.image.verticalFit) {
				var decr = 0;
				// fix box-sizing in ie7/8
				if(mfp.isLowIE) {
					decr = parseInt(item.img.css('padding-top'), 10) + parseInt(item.img.css('padding-bottom'),10);
				}
				item.img.css('max-height', mfp.wH-decr);
			}
		},
		_onImageHasSize: function(item) {
			if(item.img) {

				item.hasSize = true;

				if(_imgInterval) {
					clearInterval(_imgInterval);
				}

				item.isCheckingImgSize = false;

				_mfpTrigger('ImageHasSize', item);

				if(item.imgHidden) {
					if(mfp.content)
						mfp.content.removeClass('mfp-loading');

					item.imgHidden = false;
				}

			}
		},

		/**
		 * Function that loops until the image has size to display elements that rely on it asap
		 */
		findImageSize: function(item) {

			var counter = 0,
				img = item.img[0],
				mfpSetInterval = function(delay) {

					if(_imgInterval) {
						clearInterval(_imgInterval);
					}
					// decelerating interval that checks for size of an image
					_imgInterval = setInterval(function() {
						if(img.naturalWidth > 0) {
							mfp._onImageHasSize(item);
							return;
						}

						if(counter > 200) {
							clearInterval(_imgInterval);
						}

						counter++;
						if(counter === 3) {
							mfpSetInterval(10);
						} else if(counter === 40) {
							mfpSetInterval(50);
						} else if(counter === 100) {
							mfpSetInterval(500);
						}
					}, delay);
				};

			mfpSetInterval(1);
		},

		getImage: function(item, template) {

			var guard = 0,

				// image load complete handler
				onLoadComplete = function() {
					if(item) {
						if (item.img[0].complete) {
							item.img.off('.mfploader');

							if(item === mfp.currItem){
								mfp._onImageHasSize(item);

								mfp.updateStatus('ready');
							}

							item.hasSize = true;
							item.loaded = true;

							_mfpTrigger('ImageLoadComplete');

						}
						else {
							// if image complete check fails 200 times (20 sec), we assume that there was an error.
							guard++;
							if(guard < 200) {
								setTimeout(onLoadComplete,100);
							} else {
								onLoadError();
							}
						}
					}
				},

				// image error handler
				onLoadError = function() {
					if(item) {
						item.img.off('.mfploader');
						if(item === mfp.currItem){
							mfp._onImageHasSize(item);
							mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
						}

						item.hasSize = true;
						item.loaded = true;
						item.loadError = true;
					}
				},
				imgSt = mfp.st.image;


			var el = template.find('.mfp-img');
			if(el.length) {
				var img = document.createElement('img');
				img.className = 'mfp-img';
				if(item.el && item.el.find('img').length) {
					img.alt = item.el.find('img').attr('alt');
				}
				item.img = $(img).on('load.mfploader', onLoadComplete).on('error.mfploader', onLoadError);
				img.src = item.src;

				// without clone() "error" event is not firing when IMG is replaced by new IMG
				// TODO: find a way to avoid such cloning
				if(el.is('img')) {
					item.img = item.img.clone();
				}

				img = item.img[0];
				if(img.naturalWidth > 0) {
					item.hasSize = true;
				} else if(!img.width) {
					item.hasSize = false;
				}
			}

			mfp._parseMarkup(template, {
				title: _getTitle(item),
				img_replaceWith: item.img
			}, item);

			mfp.resizeImage();

			if(item.hasSize) {
				if(_imgInterval) clearInterval(_imgInterval);

				if(item.loadError) {
					template.addClass('mfp-loading');
					mfp.updateStatus('error', imgSt.tError.replace('%url%', item.src) );
				} else {
					template.removeClass('mfp-loading');
					mfp.updateStatus('ready');
				}
				return template;
			}

			mfp.updateStatus('loading');
			item.loading = true;

			if(!item.hasSize) {
				item.imgHidden = true;
				template.addClass('mfp-loading');
				mfp.findImageSize(item);
			}

			return template;
		}
	}
});

/*>>image*/

/*>>zoom*/
var hasMozTransform,
	getHasMozTransform = function() {
		if(hasMozTransform === undefined) {
			hasMozTransform = document.createElement('p').style.MozTransform !== undefined;
		}
		return hasMozTransform;
	};

$.magnificPopup.registerModule('zoom', {

	options: {
		enabled: false,
		easing: 'ease-in-out',
		duration: 300,
		opener: function(element) {
			return element.is('img') ? element : element.find('img');
		}
	},

	proto: {

		initZoom: function() {
			var zoomSt = mfp.st.zoom,
				ns = '.zoom',
				image;

			if(!zoomSt.enabled || !mfp.supportsTransition) {
				return;
			}

			var duration = zoomSt.duration,
				getElToAnimate = function(image) {
					var newImg = image.clone().removeAttr('style').removeAttr('class').addClass('mfp-animated-image'),
						transition = 'all '+(zoomSt.duration/1000)+'s ' + zoomSt.easing,
						cssObj = {
							position: 'fixed',
							zIndex: 9999,
							left: 0,
							top: 0,
							'-webkit-backface-visibility': 'hidden'
						},
						t = 'transition';

					cssObj['-webkit-'+t] = cssObj['-moz-'+t] = cssObj['-o-'+t] = cssObj[t] = transition;

					newImg.css(cssObj);
					return newImg;
				},
				showMainContent = function() {
					mfp.content.css('visibility', 'visible');
				},
				openTimeout,
				animatedImg;

			_mfpOn('BuildControls'+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);
					mfp.content.css('visibility', 'hidden');

					// Basically, all code below does is clones existing image, puts in on top of the current one and animated it

					image = mfp._getItemToZoom();

					if(!image) {
						showMainContent();
						return;
					}

					animatedImg = getElToAnimate(image);

					animatedImg.css( mfp._getOffset() );

					mfp.wrap.append(animatedImg);

					openTimeout = setTimeout(function() {
						animatedImg.css( mfp._getOffset( true ) );
						openTimeout = setTimeout(function() {

							showMainContent();

							setTimeout(function() {
								animatedImg.remove();
								image = animatedImg = null;
								_mfpTrigger('ZoomAnimationEnded');
							}, 16); // avoid blink when switching images

						}, duration); // this timeout equals animation duration

					}, 16); // by adding this timeout we avoid short glitch at the beginning of animation


					// Lots of timeouts...
				}
			});
			_mfpOn(BEFORE_CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {

					clearTimeout(openTimeout);

					mfp.st.removalDelay = duration;

					if(!image) {
						image = mfp._getItemToZoom();
						if(!image) {
							return;
						}
						animatedImg = getElToAnimate(image);
					}

					animatedImg.css( mfp._getOffset(true) );
					mfp.wrap.append(animatedImg);
					mfp.content.css('visibility', 'hidden');

					setTimeout(function() {
						animatedImg.css( mfp._getOffset() );
					}, 16);
				}

			});

			_mfpOn(CLOSE_EVENT+ns, function() {
				if(mfp._allowZoom()) {
					showMainContent();
					if(animatedImg) {
						animatedImg.remove();
					}
					image = null;
				}
			});
		},

		_allowZoom: function() {
			return mfp.currItem.type === 'image';
		},

		_getItemToZoom: function() {
			if(mfp.currItem.hasSize) {
				return mfp.currItem.img;
			} else {
				return false;
			}
		},

		// Get element postion relative to viewport
		_getOffset: function(isLarge) {
			var el;
			if(isLarge) {
				el = mfp.currItem.img;
			} else {
				el = mfp.st.zoom.opener(mfp.currItem.el || mfp.currItem);
			}

			var offset = el.offset();
			var paddingTop = parseInt(el.css('padding-top'),10);
			var paddingBottom = parseInt(el.css('padding-bottom'),10);
			offset.top -= ( $(window).scrollTop() - paddingTop );


			/*

			Animating left + top + width/height looks glitchy in Firefox, but perfect in Chrome. And vice-versa.

			 */
			var obj = {
				width: el.width(),
				// fix Zepto height+padding issue
				height: (_isJQ ? el.innerHeight() : el[0].offsetHeight) - paddingBottom - paddingTop
			};

			// I hate to do this, but there is no another option
			if( getHasMozTransform() ) {
				obj['-moz-transform'] = obj['transform'] = 'translate(' + offset.left + 'px,' + offset.top + 'px)';
			} else {
				obj.left = offset.left;
				obj.top = offset.top;
			}
			return obj;
		}

	}
});



/*>>zoom*/

/*>>iframe*/

var IFRAME_NS = 'iframe',
	_emptyPage = '//about:blank',

	_fixIframeBugs = function(isShowing) {
		if(mfp.currTemplate[IFRAME_NS]) {
			var el = mfp.currTemplate[IFRAME_NS].find('iframe');
			if(el.length) {
				// reset src after the popup is closed to avoid "video keeps playing after popup is closed" bug
				if(!isShowing) {
					el[0].src = _emptyPage;
				}

				// IE8 black screen bug fix
				if(mfp.isIE8) {
					el.css('display', isShowing ? 'block' : 'none');
				}
			}
		}
	};

$.magnificPopup.registerModule(IFRAME_NS, {

	options: {
		markup: '<div class="mfp-iframe-scaler">'+
					'<div class="mfp-close"></div>'+
					'<iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe>'+
				'</div>',

		srcAction: 'iframe_src',

		// we don't care and support only one default type of URL by default
		patterns: {
			youtube: {
				index: 'youtube.com',
				id: 'v=',
				src: '//www.youtube.com/embed/%id%?autoplay=1'
			},
			vimeo: {
				index: 'vimeo.com/',
				id: '/',
				src: '//player.vimeo.com/video/%id%?autoplay=1'
			},
			gmaps: {
				index: '//maps.google.',
				src: '%id%&output=embed'
			}
		}
	},

	proto: {
		initIframe: function() {
			mfp.types.push(IFRAME_NS);

			_mfpOn('BeforeChange', function(e, prevType, newType) {
				if(prevType !== newType) {
					if(prevType === IFRAME_NS) {
						_fixIframeBugs(); // iframe if removed
					} else if(newType === IFRAME_NS) {
						_fixIframeBugs(true); // iframe is showing
					}
				}// else {
					// iframe source is switched, don't do anything
				//}
			});

			_mfpOn(CLOSE_EVENT + '.' + IFRAME_NS, function() {
				_fixIframeBugs();
			});
		},

		getIframe: function(item, template) {
			var embedSrc = item.src;
			var iframeSt = mfp.st.iframe;

			$.each(iframeSt.patterns, function() {
				if(embedSrc.indexOf( this.index ) > -1) {
					if(this.id) {
						if(typeof this.id === 'string') {
							embedSrc = embedSrc.substr(embedSrc.lastIndexOf(this.id)+this.id.length, embedSrc.length);
						} else {
							embedSrc = this.id.call( this, embedSrc );
						}
					}
					embedSrc = this.src.replace('%id%', embedSrc );
					return false; // break;
				}
			});

			var dataObj = {};
			if(iframeSt.srcAction) {
				dataObj[iframeSt.srcAction] = embedSrc;
			}
			mfp._parseMarkup(template, dataObj, item);

			mfp.updateStatus('ready');

			return template;
		}
	}
});



/*>>iframe*/

/*>>gallery*/
/**
 * Get looped index depending on number of slides
 */
var _getLoopedId = function(index) {
		var numSlides = mfp.items.length;
		if(index > numSlides - 1) {
			return index - numSlides;
		} else  if(index < 0) {
			return numSlides + index;
		}
		return index;
	},
	_replaceCurrTotal = function(text, curr, total) {
		return text.replace(/%curr%/gi, curr + 1).replace(/%total%/gi, total);
	};

$.magnificPopup.registerModule('gallery', {

	options: {
		enabled: false,
		arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
		preload: [0,2],
		navigateByImgClick: true,
		arrows: true,

		tPrev: 'Previous (Left arrow key)',
		tNext: 'Next (Right arrow key)',
		tCounter: '%curr% of %total%'
	},

	proto: {
		initGallery: function() {

			var gSt = mfp.st.gallery,
				ns = '.mfp-gallery';

			mfp.direction = true; // true - next, false - prev

			if(!gSt || !gSt.enabled ) return false;

			_wrapClasses += ' mfp-gallery';

			_mfpOn(OPEN_EVENT+ns, function() {

				if(gSt.navigateByImgClick) {
					mfp.wrap.on('click'+ns, '.mfp-img', function() {
						if(mfp.items.length > 1) {
							mfp.next();
							return false;
						}
					});
				}

				_document.on('keydown'+ns, function(e) {
					if (e.keyCode === 37) {
						mfp.prev();
					} else if (e.keyCode === 39) {
						mfp.next();
					}
				});
			});

			_mfpOn('UpdateStatus'+ns, function(e, data) {
				if(data.text) {
					data.text = _replaceCurrTotal(data.text, mfp.currItem.index, mfp.items.length);
				}
			});

			_mfpOn(MARKUP_PARSE_EVENT+ns, function(e, element, values, item) {
				var l = mfp.items.length;
				values.counter = l > 1 ? _replaceCurrTotal(gSt.tCounter, item.index, l) : '';
			});

			_mfpOn('BuildControls' + ns, function() {
				if(mfp.items.length > 1 && gSt.arrows && !mfp.arrowLeft) {
					var markup = gSt.arrowMarkup,
						arrowLeft = mfp.arrowLeft = $( markup.replace(/%title%/gi, gSt.tPrev).replace(/%dir%/gi, 'left') ).addClass(PREVENT_CLOSE_CLASS),
						arrowRight = mfp.arrowRight = $( markup.replace(/%title%/gi, gSt.tNext).replace(/%dir%/gi, 'right') ).addClass(PREVENT_CLOSE_CLASS);

					arrowLeft.click(function() {
						mfp.prev();
					});
					arrowRight.click(function() {
						mfp.next();
					});

					mfp.container.append(arrowLeft.add(arrowRight));
				}
			});

			_mfpOn(CHANGE_EVENT+ns, function() {
				if(mfp._preloadTimeout) clearTimeout(mfp._preloadTimeout);

				mfp._preloadTimeout = setTimeout(function() {
					mfp.preloadNearbyImages();
					mfp._preloadTimeout = null;
				}, 16);
			});


			_mfpOn(CLOSE_EVENT+ns, function() {
				_document.off(ns);
				mfp.wrap.off('click'+ns);
				mfp.arrowRight = mfp.arrowLeft = null;
			});

		},
		next: function() {
			mfp.direction = true;
			mfp.index = _getLoopedId(mfp.index + 1);
			mfp.updateItemHTML();
		},
		prev: function() {
			mfp.direction = false;
			mfp.index = _getLoopedId(mfp.index - 1);
			mfp.updateItemHTML();
		},
		goTo: function(newIndex) {
			mfp.direction = (newIndex >= mfp.index);
			mfp.index = newIndex;
			mfp.updateItemHTML();
		},
		preloadNearbyImages: function() {
			var p = mfp.st.gallery.preload,
				preloadBefore = Math.min(p[0], mfp.items.length),
				preloadAfter = Math.min(p[1], mfp.items.length),
				i;

			for(i = 1; i <= (mfp.direction ? preloadAfter : preloadBefore); i++) {
				mfp._preloadItem(mfp.index+i);
			}
			for(i = 1; i <= (mfp.direction ? preloadBefore : preloadAfter); i++) {
				mfp._preloadItem(mfp.index-i);
			}
		},
		_preloadItem: function(index) {
			index = _getLoopedId(index);

			if(mfp.items[index].preloaded) {
				return;
			}

			var item = mfp.items[index];
			if(!item.parsed) {
				item = mfp.parseEl( index );
			}

			_mfpTrigger('LazyLoad', item);

			if(item.type === 'image') {
				item.img = $('<img class="mfp-img" />').on('load.mfploader', function() {
					item.hasSize = true;
				}).on('error.mfploader', function() {
					item.hasSize = true;
					item.loadError = true;
					_mfpTrigger('LazyLoadError', item);
				}).attr('src', item.src);
			}


			item.preloaded = true;
		}
	}
});

/*>>gallery*/

/*>>retina*/

var RETINA_NS = 'retina';

$.magnificPopup.registerModule(RETINA_NS, {
	options: {
		replaceSrc: function(item) {
			return item.src.replace(/\.\w+$/, function(m) { return '@2x' + m; });
		},
		ratio: 1 // Function or number.  Set to 1 to disable.
	},
	proto: {
		initRetina: function() {
			if(window.devicePixelRatio > 1) {

				var st = mfp.st.retina,
					ratio = st.ratio;

				ratio = !isNaN(ratio) ? ratio : ratio();

				if(ratio > 1) {
					_mfpOn('ImageHasSize' + '.' + RETINA_NS, function(e, item) {
						item.img.css({
							'max-width': item.img[0].naturalWidth / ratio,
							'width': '100%'
						});
					});
					_mfpOn('ElementParse' + '.' + RETINA_NS, function(e, item) {
						item.src = st.replaceSrc(item, ratio);
					});
				}
			}

		}
	}
});

/*>>retina*/
 _checkInstance(); }));

/*!

* jquery.inputmask.bundle.js

* https://github.com/RobinHerbots/jquery.inputmask

* Copyright (c) 2010 - 2017 Robin Herbots

* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)

* Version: 3.3.5-10

*/

!function($) {

	function Inputmask(alias, options) {

		return this instanceof Inputmask ? ($.isPlainObject(alias) ? options = alias : (options = options || {},

		options.alias = alias), this.el = void 0, this.opts = $.extend(!0, {}, this.defaults, options),

		this.maskset = void 0, this.noMasksCache = options && void 0 !== options.definitions,

		this.userOptions = options || {}, this.events = {}, this.dataAttribute = "data-inputmask",

		this.isRTL = this.opts.numericInput, this.refreshValue = !1, resolveAlias(this.opts.alias, options, this.opts),

		void 0) : new Inputmask(alias, options);

	}

	function resolveAlias(aliasStr, options, opts) {

		var aliasDefinition = opts.aliases[aliasStr];

		return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, void 0, opts),

		$.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr),

		!1);

	}

	function generateMaskSet(opts, nocache) {

		function generateMask(mask, metadata, opts) {

			if (null !== mask && "" !== mask) {

				if (1 === mask.length && opts.greedy === !1 && 0 !== opts.repeat && (opts.placeholder = ""),

				opts.repeat > 0 || "*" === opts.repeat || "+" === opts.repeat) {

					var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;

					mask = opts.groupmarker.start + mask + opts.groupmarker.end + opts.quantifiermarker.start + repeatStart + "," + opts.repeat + opts.quantifiermarker.end;

				}

				var masksetDefinition;

				return void 0 === Inputmask.prototype.masksCache[mask] || nocache === !0 ? (masksetDefinition = {

					mask: mask,

					maskToken: Inputmask.prototype.analyseMask(mask, opts),

					validPositions: {},

					_buffer: void 0,

					buffer: void 0,

					tests: {},

					metadata: metadata,

					maskLength: void 0

				}, nocache !== !0 && (Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask] = masksetDefinition,

				masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]),

				masksetDefinition;

			}

		}

		var ms;

		if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {

			if (opts.mask.length > 1) {

				opts.keepStatic = null === opts.keepStatic || opts.keepStatic;

				var altMask = opts.groupmarker.start;

				return $.each(opts.numericInput ? opts.mask.reverse() : opts.mask, function(ndx, msk) {

					altMask.length > 1 && (altMask += opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start),

					altMask += void 0 === msk.mask || $.isFunction(msk.mask) ? msk : msk.mask;

				}), altMask += opts.groupmarker.end, generateMask(altMask, opts.mask, opts);

			}

			opts.mask = opts.mask.pop();

		}

		return opts.mask && (ms = void 0 === opts.mask.mask || $.isFunction(opts.mask.mask) ? generateMask(opts.mask, opts.mask, opts) : generateMask(opts.mask.mask, opts.mask, opts)),

		ms;

	}

	function maskScope(actionObj, maskset, opts) {

		function getMaskTemplate(baseOnInput, minimalPos, includeMode) {

			minimalPos = minimalPos || 0;

			var ndxIntlzr, test, testPos, maskTemplate = [], pos = 0, lvp = getLastValidPosition();

			maxLength = void 0 !== el ? el.maxLength : void 0, maxLength === -1 && (maxLength = void 0);

			do baseOnInput === !0 && getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos],

			test = testPos.match, ndxIntlzr = testPos.locator.slice(), maskTemplate.push(includeMode === !0 ? testPos.input : includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),

			test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && maskTemplate.push(includeMode === !1 ? test.nativeDef : getPlaceholder(pos, test))),

			pos++; while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || minimalPos > pos);

			return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), getMaskSet().maskLength = pos + 1,

			maskTemplate;

		}

		function getMaskSet() {

			return maskset;

		}

		function resetMaskSet(soft) {

			var maskset = getMaskSet();

			maskset.buffer = void 0, soft !== !0 && (maskset._buffer = void 0, maskset.validPositions = {},

			maskset.p = 0);

		}

		function getLastValidPosition(closestTo, strict, validPositions) {

			var before = -1, after = -1, valids = validPositions || getMaskSet().validPositions;

			void 0 === closestTo && (closestTo = -1);

			for (var posNdx in valids) {

				var psNdx = parseInt(posNdx);

				valids[psNdx] && (strict || valids[psNdx].generatedInput !== !0) && (psNdx <= closestTo && (before = psNdx),

				psNdx >= closestTo && (after = psNdx));

			}

			return before !== -1 && closestTo - before > 1 || after < closestTo ? before : after;

		}

		function stripValidPositions(start, end, nocheck, strict) {

			function IsEnclosedStatic(pos) {

				var posMatch = getMaskSet().validPositions[pos];

				if (void 0 !== posMatch && null === posMatch.match.fn) {

					var prevMatch = getMaskSet().validPositions[pos - 1], nextMatch = getMaskSet().validPositions[pos + 1];

					return void 0 !== prevMatch && void 0 !== nextMatch;

				}

				return !1;

			}

			var i, startPos = start, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), needsValidation = !1;

			for (getMaskSet().p = start, i = end - 1; i >= startPos; i--) void 0 !== getMaskSet().validPositions[i] && (nocheck !== !0 && (!getMaskSet().validPositions[i].match.optionality && IsEnclosedStatic(i) || opts.canClearPosition(getMaskSet(), i, getLastValidPosition(), strict, opts) === !1) || delete getMaskSet().validPositions[i]);

			for (resetMaskSet(!0), i = startPos + 1; i <= getLastValidPosition(); ) {

				for (;void 0 !== getMaskSet().validPositions[startPos]; ) startPos++;

				if (i < startPos && (i = startPos + 1), void 0 === getMaskSet().validPositions[i] && isMask(i)) i++; else {

					var t = getTestTemplate(i);

					needsValidation === !1 && positionsClone[startPos] && positionsClone[startPos].match.def === t.match.def ? (getMaskSet().validPositions[startPos] = $.extend(!0, {}, positionsClone[startPos]),

					getMaskSet().validPositions[startPos].input = t.input, delete getMaskSet().validPositions[i],

					i++) : positionCanMatchDefinition(startPos, t.match.def) ? isValid(startPos, t.input || getPlaceholder(i), !0) !== !1 && (delete getMaskSet().validPositions[i],

					i++, needsValidation = !0) : isMask(i) || (i++, startPos--), startPos++;

				}

			}

			resetMaskSet(!0);

		}

		function determineTestTemplate(tests, guessNextBest) {

			for (var testPos, testPositions = tests, lvp = getLastValidPosition(), lvTest = getMaskSet().validPositions[lvp] || getTests(0)[0], lvTestAltArr = void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation].toString().split(",") : [], ndx = 0; ndx < testPositions.length && (testPos = testPositions[ndx],

			!(testPos.match && (opts.greedy && testPos.match.optionalQuantifier !== !0 || (testPos.match.optionality === !1 || testPos.match.newBlockMarker === !1) && testPos.match.optionalQuantifier !== !0) && (void 0 === lvTest.alternation || lvTest.alternation !== testPos.alternation || void 0 !== testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAltArr))) || guessNextBest === !0 && (null !== testPos.match.fn || /[0-9a-bA-Z]/.test(testPos.match.def))); ndx++) ;

			return testPos;

		}

		function getTestTemplate(pos, ndxIntlzr, tstPs) {

			return getMaskSet().validPositions[pos] || determineTestTemplate(getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));

		}

		function getTest(pos) {

			return getMaskSet().validPositions[pos] ? getMaskSet().validPositions[pos] : getTests(pos)[0];

		}

		function positionCanMatchDefinition(pos, def) {

			for (var valid = !1, tests = getTests(pos), tndx = 0; tndx < tests.length; tndx++) if (tests[tndx].match && tests[tndx].match.def === def) {

				valid = !0;

				break;

			}

			return valid;

		}

		function getTests(pos, ndxIntlzr, tstPs) {

			function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {

				function handleMatch(match, loopNdx, quantifierRecurse) {

					function isFirstMatch(latestMatch, tokenGroup) {

						var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);

						return firstMatch || $.each(tokenGroup.matches, function(ndx, match) {

							if (match.isQuantifier === !0 && (firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]))) return !1;

						}), firstMatch;

					}

					function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {

						var bestMatch, indexPos;

						return (getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) && $.each(getMaskSet().tests[pos] || [ getMaskSet().validPositions[pos] ], function(ndx, lmnt) {

							var alternation = void 0 !== targetAlternation ? targetAlternation : lmnt.alternation, ndxPos = void 0 !== lmnt.locator[alternation] ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;

							(void 0 === indexPos || ndxPos < indexPos) && ndxPos !== -1 && (bestMatch = lmnt,

							indexPos = ndxPos);

						}), bestMatch ? bestMatch.locator.slice((void 0 !== targetAlternation ? targetAlternation : bestMatch.alternation) + 1) : void 0 !== targetAlternation ? resolveNdxInitializer(pos, alternateNdx) : void 0;

					}

					function staticCanMatchDefinition(source, target) {

						return null === source.match.fn && null !== target.match.fn && target.match.fn.test(source.match.def, getMaskSet(), pos, !1, opts, !1);

					}

					if (testPos > 1e4) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;

					if (testPos === pos && void 0 === match.matches) return matches.push({

						match: match,

						locator: loopNdx.reverse(),

						cd: cacheDependency

					}), !0;

					if (void 0 !== match.matches) {

						if (match.isGroup && quantifierRecurse !== match) {

							if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx)) return !0;

						} else if (match.isOptional) {

							var optionalToken = match;

							if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) {

								if (latestMatch = matches[matches.length - 1].match, !isFirstMatch(latestMatch, optionalToken)) return !0;

								insertStop = !0, testPos = pos;

							}

						} else if (match.isAlternator) {

							var maltMatches, alternateToken = match, malternateMatches = [], currentMatches = matches.slice(), loopNdxCnt = loopNdx.length, altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;

							if (altIndex === -1 || "string" == typeof altIndex) {

								var amndx, currentPos = testPos, ndxInitializerClone = ndxInitializer.slice(), altIndexArr = [];

								if ("string" == typeof altIndex) altIndexArr = altIndex.split(","); else for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx);

								for (var ndx = 0; ndx < altIndexArr.length; ndx++) {

									if (amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(),

									match = handleMatch(alternateToken.matches[amndx] || maskToken.matches[amndx], [ amndx ].concat(loopNdx), quantifierRecurse) || match,

									match !== !0 && void 0 !== match && altIndexArr[altIndexArr.length - 1] < alternateToken.matches.length) {

										var ntndx = $.inArray(match, maskToken.matches) + 1;

										maskToken.matches.length > ntndx && (match = handleMatch(maskToken.matches[ntndx], [ ntndx ].concat(loopNdx.slice(1, loopNdx.length)), quantifierRecurse),

										match && (altIndexArr.push(ntndx.toString()), $.each(matches, function(ndx, lmnt) {

											lmnt.alternation = loopNdx.length - 1;

										})));

									}

									maltMatches = matches.slice(), testPos = currentPos, matches = [];

									for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {

										var altMatch = maltMatches[ndx1], hasMatch = !1;

										altMatch.alternation = altMatch.alternation || loopNdxCnt;

										for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {

											var altMatch2 = malternateMatches[ndx2];

											if (("string" != typeof altIndex || $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr) !== -1) && (altMatch.match.def === altMatch2.match.def || staticCanMatchDefinition(altMatch, altMatch2))) {

												hasMatch = altMatch.match.nativeDef === altMatch2.match.nativeDef, altMatch.alternation == altMatch2.alternation && altMatch2.locator[altMatch2.alternation].toString().indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.locator[altMatch2.alternation] = altMatch2.locator[altMatch2.alternation] + "," + altMatch.locator[altMatch.alternation],

												altMatch2.alternation = altMatch.alternation, null == altMatch.match.fn && (altMatch2.na = altMatch2.na || altMatch.locator[altMatch.alternation].toString(),

												altMatch2.na.indexOf(altMatch.locator[altMatch.alternation]) === -1 && (altMatch2.na = altMatch2.na + "," + altMatch.locator[altMatch.alternation])));

												break;

											}

										}

										hasMatch || malternateMatches.push(altMatch);

									}

								}

								"string" == typeof altIndex && (malternateMatches = $.map(malternateMatches, function(lmnt, ndx) {

									if (isFinite(ndx)) {

										var mamatch, alternation = lmnt.alternation, altLocArr = lmnt.locator[alternation].toString().split(",");

										lmnt.locator[alternation] = void 0, lmnt.alternation = void 0;

										for (var alndx = 0; alndx < altLocArr.length; alndx++) mamatch = $.inArray(altLocArr[alndx], altIndexArr) !== -1,

										mamatch && (void 0 !== lmnt.locator[alternation] ? (lmnt.locator[alternation] += ",",

										lmnt.locator[alternation] += altLocArr[alndx]) : lmnt.locator[alternation] = parseInt(altLocArr[alndx]),

										lmnt.alternation = alternation);

										if (void 0 !== lmnt.locator[alternation]) return lmnt;

									}

								})), matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = matches.length > 0,

								ndxInitializer = ndxInitializerClone.slice();

							} else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [ altIndex ].concat(loopNdx), quantifierRecurse);

							if (match) return !0;

						} else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) for (var qt = match, qndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {

							var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];

							if (match = handleMatch(tokenGroup, [ qndx ].concat(loopNdx), tokenGroup)) {

								if (latestMatch = matches[matches.length - 1].match, latestMatch.optionalQuantifier = qndx > qt.quantifier.min - 1,

								isFirstMatch(latestMatch, tokenGroup)) {

									if (qndx > qt.quantifier.min - 1) {

										insertStop = !0, testPos = pos;

										break;

									}

									return !0;

								}

								return !0;

							}

						} else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) return !0;

					} else testPos++;

				}

				for (var tndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++) if (maskToken.matches[tndx].isQuantifier !== !0) {

					var match = handleMatch(maskToken.matches[tndx], [ tndx ].concat(loopNdx), quantifierRecurse);

					if (match && testPos === pos) return match;

					if (testPos > pos) break;

				}

			}

			function mergeLocators(tests) {

				var locator = [];

				return $.isArray(tests) || (tests = [ tests ]), tests.length > 0 && (void 0 === tests[0].alternation ? (locator = determineTestTemplate(tests.slice()).locator.slice(),

				0 === locator.length && (locator = tests[0].locator.slice())) : $.each(tests, function(ndx, tst) {

					if ("" !== tst.def) if (0 === locator.length) locator = tst.locator.slice(); else for (var i = 0; i < locator.length; i++) tst.locator[i] && locator[i].toString().indexOf(tst.locator[i]) === -1 && (locator[i] += "," + tst.locator[i]);

				})), locator;

			}

			function filterTests(tests) {

				return opts.keepStatic && pos > 0 && tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0) && tests[0].match.optionality !== !0 && tests[0].match.optionalQuantifier !== !0 && null === tests[0].match.fn && !/[0-9a-bA-Z]/.test(tests[0].match.def) ? [ determineTestTemplate(tests) ] : tests;

			}

			var latestMatch, maskTokens = getMaskSet().maskToken, testPos = ndxIntlzr ? tstPs : 0, ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [ 0 ], matches = [], insertStop = !1, cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";

			if (pos > -1) {

				if (void 0 === ndxIntlzr) {

					for (var test, previousPos = pos - 1; void 0 === (test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) && previousPos > -1; ) previousPos--;

					void 0 !== test && previousPos > -1 && (ndxInitializer = mergeLocators(test), cacheDependency = ndxInitializer.join(""),

					testPos = previousPos);

				}

				if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) return filterTests(getMaskSet().tests[pos]);

				for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {

					var match = resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [ mtndx ]);

					if (match && testPos === pos || testPos > pos) break;

				}

			}

			return (0 === matches.length || insertStop) && matches.push({

				match: {

					fn: null,

					cardinality: 0,

					optionality: !0,

					casing: null,

					def: "",

					placeholder: ""

				},

				locator: [],

				cd: cacheDependency

			}), void 0 !== ndxIntlzr && getMaskSet().tests[pos] ? filterTests($.extend(!0, [], matches)) : (getMaskSet().tests[pos] = $.extend(!0, [], matches),

			filterTests(getMaskSet().tests[pos]));

		}

		function getBufferTemplate() {

			return void 0 === getMaskSet()._buffer && (getMaskSet()._buffer = getMaskTemplate(!1, 1),

			void 0 === getMaskSet().buffer && getMaskSet()._buffer.slice()), getMaskSet()._buffer;

		}

		function getBuffer(noCache) {

			return void 0 !== getMaskSet().buffer && noCache !== !0 || (getMaskSet().buffer = getMaskTemplate(!0, getLastValidPosition(), !0)),

			getMaskSet().buffer;

		}

		function refreshFromBuffer(start, end, buffer) {

			var i;

			if (start === !0) resetMaskSet(), start = 0, end = buffer.length; else for (i = start; i < end; i++) delete getMaskSet().validPositions[i];

			for (i = start; i < end; i++) resetMaskSet(!0), buffer[i] !== opts.skipOptionalPartCharacter && isValid(i, buffer[i], !0, !0);

		}

		function casing(elem, test, pos) {

			switch (opts.casing || test.casing) {

			  case "upper":

				elem = elem.toUpperCase();

				break;



			  case "lower":

				elem = elem.toLowerCase();

				break;



			  case "title":

				var posBefore = getMaskSet().validPositions[pos - 1];

				elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase();

			}

			return elem;

		}

		function checkAlternationMatch(altArr1, altArr2) {

			for (var altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, alndx = 0; alndx < altArr1.length; alndx++) if ($.inArray(altArr1[alndx], altArrC) !== -1) {

				isMatch = !0;

				break;

			}

			return isMatch;

		}

		function isValid(pos, c, strict, fromSetValid, fromAlternate) {

			function isSelection(posObj) {

				var selection = isRTL ? posObj.begin - posObj.end > 1 || posObj.begin - posObj.end === 1 && opts.insertMode : posObj.end - posObj.begin > 1 || posObj.end - posObj.begin === 1 && opts.insertMode;

				return selection && 0 === posObj.begin && posObj.end === getMaskSet().maskLength ? "full" : selection;

			}

			function _isValid(position, c, strict) {

				var rslt = !1;

				return $.each(getTests(position), function(ndx, tst) {

					for (var test = tst.match, loopend = c ? 1 : 0, chrs = "", i = test.cardinality; i > loopend; i--) chrs += getBufferElement(position - (i - 1));

					if (c && (chrs += c), getBuffer(!0), rslt = null != test.fn ? test.fn.test(chrs, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {

						c: test.placeholder || test.def,

						pos: position

					}, rslt !== !1) {

						var elem = void 0 !== rslt.c ? rslt.c : c;

						elem = elem === opts.skipOptionalPartCharacter && null === test.fn ? test.placeholder || test.def : elem;

						var validatedPos = position, possibleModifiedBuffer = getBuffer();

						if (void 0 !== rslt.remove && ($.isArray(rslt.remove) || (rslt.remove = [ rslt.remove ]),

						$.each(rslt.remove.sort(function(a, b) {

							return b - a;

						}), function(ndx, lmnt) {

							stripValidPositions(lmnt, lmnt + 1, !0);

						})), void 0 !== rslt.insert && ($.isArray(rslt.insert) || (rslt.insert = [ rslt.insert ]),

						$.each(rslt.insert.sort(function(a, b) {

							return a - b;

						}), function(ndx, lmnt) {

							isValid(lmnt.pos, lmnt.c, !0, fromSetValid);

						})), rslt.refreshFromBuffer) {

							var refresh = rslt.refreshFromBuffer;

							if (strict = !0, refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, possibleModifiedBuffer),

							void 0 === rslt.pos && void 0 === rslt.c) return rslt.pos = getLastValidPosition(),

							!1;

							if (validatedPos = void 0 !== rslt.pos ? rslt.pos : position, validatedPos !== position) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0, fromSetValid)),

							!1;

						} else if (rslt !== !0 && void 0 !== rslt.pos && rslt.pos !== position && (validatedPos = rslt.pos,

						refreshFromBuffer(position, validatedPos, getBuffer().slice()), validatedPos !== position)) return rslt = $.extend(rslt, isValid(validatedPos, elem, !0)),

						!1;

						return (rslt === !0 || void 0 !== rslt.pos || void 0 !== rslt.c) && (ndx > 0 && resetMaskSet(!0),

						setValidPosition(validatedPos, $.extend({}, tst, {

							input: casing(elem, test, validatedPos)

						}), fromSetValid, isSelection(pos)) || (rslt = !1), !1);

					}

				}), rslt;

			}

			function alternate(pos, c, strict) {

				var lastAlt, alternation, altPos, prevAltPos, i, validPos, altNdxs, decisionPos, validPsClone = $.extend(!0, {}, getMaskSet().validPositions), isValidRslt = !1, lAltPos = getLastValidPosition();

				for (prevAltPos = getMaskSet().validPositions[lAltPos]; lAltPos >= 0; lAltPos--) if (altPos = getMaskSet().validPositions[lAltPos],

				altPos && void 0 !== altPos.alternation) {

					if (lastAlt = lAltPos, alternation = getMaskSet().validPositions[lastAlt].alternation,

					prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;

					prevAltPos = altPos;

				}

				if (void 0 !== alternation) {

					decisionPos = parseInt(lastAlt);

					var decisionTaker = void 0 !== prevAltPos.locator[prevAltPos.alternation || alternation] ? prevAltPos.locator[prevAltPos.alternation || alternation] : altNdxs[0];

					decisionTaker.length > 0 && (decisionTaker = decisionTaker.split(",")[0]);

					var possibilityPos = getMaskSet().validPositions[decisionPos], prevPos = getMaskSet().validPositions[decisionPos - 1];

					$.each(getTests(decisionPos, prevPos ? prevPos.locator : void 0, decisionPos - 1), function(ndx, test) {

						altNdxs = test.locator[alternation] ? test.locator[alternation].toString().split(",") : [];

						for (var mndx = 0; mndx < altNdxs.length; mndx++) {

							var validInputs = [], staticInputsBeforePos = 0, staticInputsBeforePosAlternate = 0, verifyValidInput = !1;

							if (decisionTaker < altNdxs[mndx] && (void 0 === test.na || $.inArray(altNdxs[mndx], test.na.split(",")) === -1)) {

								getMaskSet().validPositions[decisionPos] = $.extend(!0, {}, test);

								var possibilities = getMaskSet().validPositions[decisionPos].locator;

								for (getMaskSet().validPositions[decisionPos].locator[alternation] = parseInt(altNdxs[mndx]),

								null == test.match.fn ? (possibilityPos.input !== test.match.def && (verifyValidInput = !0,

								possibilityPos.generatedInput !== !0 && validInputs.push(possibilityPos.input)),

								staticInputsBeforePosAlternate++, getMaskSet().validPositions[decisionPos].generatedInput = !/[0-9a-bA-Z]/.test(test.match.def),

								getMaskSet().validPositions[decisionPos].input = test.match.def) : getMaskSet().validPositions[decisionPos].input = possibilityPos.input,

								i = decisionPos + 1; i < getLastValidPosition(void 0, !0) + 1; i++) validPos = getMaskSet().validPositions[i],

								validPos && validPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(validPos.input) ? validInputs.push(validPos.input) : i < pos && staticInputsBeforePos++,

								delete getMaskSet().validPositions[i];

								for (verifyValidInput && validInputs[0] === test.match.def && validInputs.shift(),

								resetMaskSet(!0), isValidRslt = !0; validInputs.length > 0; ) {

									var input = validInputs.shift();

									if (input !== opts.skipOptionalPartCharacter && !(isValidRslt = isValid(getLastValidPosition(void 0, !0) + 1, input, !1, fromSetValid, !0))) break;

								}

								if (isValidRslt) {

									getMaskSet().validPositions[decisionPos].locator = possibilities;

									var targetLvp = getLastValidPosition(pos) + 1;

									for (i = decisionPos + 1; i < getLastValidPosition() + 1; i++) validPos = getMaskSet().validPositions[i],

									(void 0 === validPos || null == validPos.match.fn) && i < pos + (staticInputsBeforePosAlternate - staticInputsBeforePos) && staticInputsBeforePosAlternate++;

									pos += staticInputsBeforePosAlternate - staticInputsBeforePos, isValidRslt = isValid(pos > targetLvp ? targetLvp : pos, c, strict, fromSetValid, !0);

								}

								if (isValidRslt) return !1;

								resetMaskSet(), getMaskSet().validPositions = $.extend(!0, {}, validPsClone);

							}

						}

					});

				}

				return isValidRslt;

			}

			function trackbackAlternations(originalPos, newPos) {

				var vp = getMaskSet().validPositions[newPos];

				if (vp) for (var targetLocator = vp.locator, tll = targetLocator.length, ps = originalPos; ps < newPos; ps++) if (void 0 === getMaskSet().validPositions[ps] && !isMask(ps, !0)) {

					var tests = getTests(ps), bestMatch = tests[0], equality = -1;

					$.each(tests, function(ndx, tst) {

						for (var i = 0; i < tll && (void 0 !== tst.locator[i] && checkAlternationMatch(tst.locator[i].toString().split(","), targetLocator[i].toString().split(","))); i++) equality < i && (equality = i,

						bestMatch = tst);

					}), setValidPosition(ps, $.extend({}, bestMatch, {

						input: bestMatch.match.placeholder || bestMatch.match.def

					}), !0);

				}

			}

			function setValidPosition(pos, validTest, fromSetValid, isSelection) {

				if (isSelection || opts.insertMode && void 0 !== getMaskSet().validPositions[pos] && void 0 === fromSetValid) {

					var i, positionsClone = $.extend(!0, {}, getMaskSet().validPositions), lvp = getLastValidPosition(void 0, !0);

					for (i = pos; i <= lvp; i++) delete getMaskSet().validPositions[i];

					getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);

					var j, valid = !0, vps = getMaskSet().validPositions, needsValidation = !1, initialLength = getMaskSet().maskLength;

					for (i = j = pos; i <= lvp; i++) {

						var t = positionsClone[i];

						if (void 0 !== t) for (var posMatch = j; posMatch < getMaskSet().maskLength && (null === t.match.fn && vps[i] && (vps[i].match.optionalQuantifier === !0 || vps[i].match.optionality === !0) || null != t.match.fn); ) {

							if (posMatch++, needsValidation === !1 && positionsClone[posMatch] && positionsClone[posMatch].match.def === t.match.def) getMaskSet().validPositions[posMatch] = $.extend(!0, {}, positionsClone[posMatch]),

							getMaskSet().validPositions[posMatch].input = t.input, fillMissingNonMask(posMatch),

							j = posMatch, valid = !0; else if (positionCanMatchDefinition(posMatch, t.match.def)) {

								var result = isValid(posMatch, t.input, !0, !0);

								valid = result !== !1, j = result.caret || result.insert ? getLastValidPosition() : posMatch,

								needsValidation = !0;

							} else valid = t.generatedInput === !0;

							if (getMaskSet().maskLength < initialLength && (getMaskSet().maskLength = initialLength),

							valid) break;

						}

						if (!valid) break;

					}

					if (!valid) return getMaskSet().validPositions = $.extend(!0, {}, positionsClone),

					resetMaskSet(!0), !1;

				} else getMaskSet().validPositions[pos] = $.extend(!0, {}, validTest);

				return resetMaskSet(!0), !0;

			}

			function fillMissingNonMask(maskPos) {

				for (var pndx = maskPos - 1; pndx > -1 && !getMaskSet().validPositions[pndx]; pndx--) ;

				var testTemplate, testsFromPos;

				for (pndx++; pndx < maskPos; pndx++) void 0 === getMaskSet().validPositions[pndx] && (opts.jitMasking === !1 || opts.jitMasking > pndx) && (testsFromPos = getTests(pndx, getTestTemplate(pndx - 1).locator, pndx - 1).slice(),

				"" === testsFromPos[testsFromPos.length - 1].match.def && testsFromPos.pop(), testTemplate = determineTestTemplate(testsFromPos),

				testTemplate && (testTemplate.match.def === opts.radixPointDefinitionSymbol || !isMask(pndx, !0) || $.inArray(opts.radixPoint, getBuffer()) < pndx && testTemplate.match.fn && testTemplate.match.fn.test(getPlaceholder(pndx), getMaskSet(), pndx, !1, opts)) && (result = _isValid(pndx, testTemplate.match.placeholder || (null == testTemplate.match.fn ? testTemplate.match.def : "" !== getPlaceholder(pndx) ? getPlaceholder(pndx) : getBuffer()[pndx]), !0),

				result !== !1 && (getMaskSet().validPositions[result.pos || pndx].generatedInput = !0)));

			}

			strict = strict === !0;

			var maskPos = pos;

			void 0 !== pos.begin && (maskPos = isRTL && !isSelection(pos) ? pos.end : pos.begin);

			var result = !1, positionsClone = $.extend(!0, {}, getMaskSet().validPositions);

			if (fillMissingNonMask(maskPos), isSelection(pos) && (handleRemove(void 0, Inputmask.keyCode.DELETE, pos),

			maskPos = getMaskSet().p), maskPos < getMaskSet().maskLength && (result = _isValid(maskPos, c, strict),

			(!strict || fromSetValid === !0) && result === !1)) {

				var currentPosValid = getMaskSet().validPositions[maskPos];

				if (!currentPosValid || null !== currentPosValid.match.fn || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {

					if ((opts.insertMode || void 0 === getMaskSet().validPositions[seekNext(maskPos)]) && !isMask(maskPos, !0)) {

						var testsFromPos = getTests(maskPos).slice();

						"" === testsFromPos[testsFromPos.length - 1].match.def && testsFromPos.pop();

						var staticChar = determineTestTemplate(testsFromPos, !0);

						staticChar && null === staticChar.match.fn && (staticChar = staticChar.match.placeholder || staticChar.match.def,

						_isValid(maskPos, staticChar, strict), getMaskSet().validPositions[maskPos].generatedInput = !0);

						for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) if (result = _isValid(nPos, c, strict),

						result !== !1) {

							trackbackAlternations(maskPos, void 0 !== result.pos ? result.pos : nPos), maskPos = nPos;

							break;

						}

					}

				} else result = {

					caret: seekNext(maskPos)

				};

			}

			return result === !1 && opts.keepStatic && !strict && fromAlternate !== !0 && (result = alternate(maskPos, c, strict)),

			result === !0 && (result = {

				pos: maskPos

			}), $.isFunction(opts.postValidation) && result !== !1 && !strict && fromSetValid !== !0 && (result = !!opts.postValidation(getBuffer(!0), result, opts) && result),

			void 0 === result.pos && (result.pos = maskPos), result === !1 && (resetMaskSet(!0),

			getMaskSet().validPositions = $.extend(!0, {}, positionsClone)), result;

		}

		function isMask(pos, strict) {

			var test;

			if (strict ? (test = getTestTemplate(pos).match, "" === test.def && (test = getTest(pos).match)) : test = getTest(pos).match,

			null != test.fn) return test.fn;

			if (strict !== !0 && pos > -1) {

				var tests = getTests(pos);

				return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0);

			}

			return !1;

		}

		function seekNext(pos, newBlock) {

			var maskL = getMaskSet().maskLength;

			if (pos >= maskL) return maskL;

			for (var position = pos; ++position < maskL && (newBlock === !0 && (getTest(position).match.newBlockMarker !== !0 || !isMask(position)) || newBlock !== !0 && !isMask(position)); ) ;

			return position;

		}

		function seekPrevious(pos, newBlock) {

			var tests, position = pos;

			if (position <= 0) return 0;

			for (;--position > 0 && (newBlock === !0 && getTest(position).match.newBlockMarker !== !0 || newBlock !== !0 && !isMask(position) && (tests = getTests(position),

			tests.length < 2 || 2 === tests.length && "" === tests[1].match.def)); ) ;

			return position;

		}

		function getBufferElement(position) {

			return void 0 === getMaskSet().validPositions[position] ? getPlaceholder(position) : getMaskSet().validPositions[position].input;

		}

		function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {

			if (event && $.isFunction(opts.onBeforeWrite)) {

				var result = opts.onBeforeWrite(event, buffer, caretPos, opts);

				if (result) {

					if (result.refreshFromBuffer) {

						var refresh = result.refreshFromBuffer;

						refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer || buffer),

						buffer = getBuffer(!0);

					}

					void 0 !== caretPos && (caretPos = void 0 !== result.caret ? result.caret : caretPos);

				}

			}

			input.inputmask._valueSet(buffer.join("")), void 0 === caretPos || void 0 !== event && "blur" === event.type ? renderColorMask(input, buffer, caretPos) : caret(input, caretPos),

			triggerInputEvent === !0 && (skipInputEvent = !0, $(input).trigger("input"));

		}

		function getPlaceholder(pos, test) {

			if (test = test || getTest(pos).match, void 0 !== test.placeholder) return test.placeholder;

			if (null === test.fn) {

				if (pos > -1 && void 0 === getMaskSet().validPositions[pos]) {

					var prevTest, tests = getTests(pos), staticAlternations = [];

					if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)) for (var i = 0; i < tests.length; i++) if (tests[i].match.optionality !== !0 && tests[i].match.optionalQuantifier !== !0 && (null === tests[i].match.fn || void 0 === prevTest || tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, !0, opts) !== !1) && (staticAlternations.push(tests[i]),

					null === tests[i].match.fn && (prevTest = tests[i]), staticAlternations.length > 1 && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length);

				}

				return test.def;

			}

			return opts.placeholder.charAt(pos % opts.placeholder.length);

		}

		function checkVal(input, writeOut, strict, nptvl, initiatingEvent, stickyCaret) {

			function isTemplateMatch() {

				var isMatch = !1, charCodeNdx = getBufferTemplate().slice(initialNdx, seekNext(initialNdx)).join("").indexOf(charCodes);

				if (charCodeNdx !== -1 && !isMask(initialNdx)) {

					isMatch = !0;

					for (var bufferTemplateArr = getBufferTemplate().slice(initialNdx, initialNdx + charCodeNdx), i = 0; i < bufferTemplateArr.length; i++) if (" " !== bufferTemplateArr[i]) {

						isMatch = !1;

						break;

					}

				}

				return isMatch;

			}

			var inputValue = nptvl.slice(), charCodes = "", initialNdx = 0, result = void 0;

			if (resetMaskSet(), getMaskSet().p = seekNext(-1), !strict) if (opts.autoUnmask !== !0) {

				var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""), matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));

				matches && matches.length > 0 && (inputValue.splice(0, matches.length * staticInput.length),

				initialNdx = seekNext(initialNdx));

			} else initialNdx = seekNext(initialNdx);

			if ($.each(inputValue, function(ndx, charCode) {

				if (void 0 !== charCode) {

					var keypress = new $.Event("keypress");

					keypress.which = charCode.charCodeAt(0), charCodes += charCode;

					var lvp = getLastValidPosition(void 0, !0), lvTest = getMaskSet().validPositions[lvp], nextTest = getTestTemplate(lvp + 1, lvTest ? lvTest.locator.slice() : void 0, lvp);

					if (!isTemplateMatch() || strict || opts.autoUnmask) {

						var pos = strict ? ndx : null == nextTest.match.fn && nextTest.match.optionality && lvp + 1 < getMaskSet().p ? lvp + 1 : getMaskSet().p;

						result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, pos),

						initialNdx = pos + 1, charCodes = "";

					} else result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, !0, lvp + 1);

					if (!strict && $.isFunction(opts.onBeforeWrite) && (result = opts.onBeforeWrite(keypress, getBuffer(), result.forwardPosition, opts),

					result && result.refreshFromBuffer)) {

						var refresh = result.refreshFromBuffer;

						refreshFromBuffer(refresh === !0 ? refresh : refresh.start, refresh.end, result.buffer),

						resetMaskSet(!0), result.caret && (getMaskSet().p = result.caret);

					}

				}

			}), writeOut) {

				var caretPos = void 0, lvp = getLastValidPosition();

				document.activeElement === input && (initiatingEvent || result) && (caretPos = caret(input).begin,

				initiatingEvent && result === !1 && (caretPos = seekNext(getLastValidPosition(caretPos))),

				result && stickyCaret !== !0 && (caretPos < lvp + 1 || lvp === -1) && (caretPos = opts.numericInput && void 0 === result.caret ? seekPrevious(result.forwardPosition) : result.forwardPosition)),

				writeBuffer(input, getBuffer(), caretPos, initiatingEvent || new $.Event("checkval"));

			}

		}

		function unmaskedvalue(input) {

			if (input) {

				if (void 0 === input.inputmask) return input.value;

				input.inputmask && input.inputmask.refreshValue && EventHandlers.setValueEvent.call(input);

			}

			var umValue = [], vps = getMaskSet().validPositions;

			for (var pndx in vps) vps[pndx].match && null != vps[pndx].match.fn && umValue.push(vps[pndx].input);

			var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");

			if ($.isFunction(opts.onUnMask)) {

				var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");

				unmaskedValue = opts.onUnMask(bufferValue, unmaskedValue, opts) || unmaskedValue;

			}

			return unmaskedValue;

		}

		function caret(input, begin, end, notranslate) {

			function translatePosition(pos) {

				if (notranslate !== !0 && isRTL && "number" == typeof pos && (!opts.greedy || "" !== opts.placeholder)) {

					var bffrLght = getBuffer().join("").length;

					pos = bffrLght - pos;

				}

				return pos;

			}

			var range;

			if ("number" != typeof begin) return input.setSelectionRange ? (begin = input.selectionStart,

			end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0),

			range.commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset,

			end = range.endOffset)) : document.selection && document.selection.createRange && (range = document.selection.createRange(),

			begin = 0 - range.duplicate().moveStart("character", -input.inputmask._valueGet().length),

			end = begin + range.text.length), {

				begin: translatePosition(begin),

				end: translatePosition(end)

			};

			begin = translatePosition(begin), end = translatePosition(end), end = "number" == typeof end ? end : begin;

			var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;

			if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, mobile || opts.insertMode !== !1 || begin !== end || end++,

			input.setSelectionRange) input.selectionStart = begin, input.selectionEnd = end; else if (window.getSelection) {

				if (range = document.createRange(), void 0 === input.firstChild || null === input.firstChild) {

					var textNode = document.createTextNode("");

					input.appendChild(textNode);

				}

				range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length),

				range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length),

				range.collapse(!0);

				var sel = window.getSelection();

				sel.removeAllRanges(), sel.addRange(range);

			} else input.createTextRange && (range = input.createTextRange(), range.collapse(!0),

			range.moveEnd("character", end), range.moveStart("character", begin), range.select());

			renderColorMask(input, void 0, {

				begin: begin,

				end: end

			});

		}

		function determineLastRequiredPosition(returnDefinition) {

			var pos, testPos, buffer = getBuffer(), bl = buffer.length, lvp = getLastValidPosition(), positions = {}, lvTest = getMaskSet().validPositions[lvp], ndxIntlzr = void 0 !== lvTest ? lvTest.locator.slice() : void 0;

			for (pos = lvp + 1; pos < buffer.length; pos++) testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),

			ndxIntlzr = testPos.locator.slice(), positions[pos] = $.extend(!0, {}, testPos);

			var lvTestAlt = lvTest && void 0 !== lvTest.alternation ? lvTest.locator[lvTest.alternation] : void 0;

			for (pos = bl - 1; pos > lvp && (testPos = positions[pos], (testPos.match.optionality || testPos.match.optionalQuantifier || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && null != testPos.match.fn || null === testPos.match.fn && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;

			return returnDefinition ? {

				l: bl,

				def: positions[bl] ? positions[bl].match : void 0

			} : bl;

		}

		function clearOptionalTail(buffer) {

			for (var validPos, rl = determineLastRequiredPosition(), bl = buffer.length; rl < bl && !isMask(rl + 1) && (validPos = getTest(rl + 1)) && validPos.match.optionality !== !0 && validPos.match.optionalQuantifier !== !0; ) rl++;

			for (;(validPos = getTest(rl - 1)) && validPos.match.optionality && validPos.input === opts.skipOptionalPartCharacter; ) rl--;

			return buffer.splice(rl), buffer;

		}

		function isComplete(buffer) {

			if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);

			if ("*" !== opts.repeat) {

				var complete = !1, lrp = determineLastRequiredPosition(!0), aml = seekPrevious(lrp.l);

				if (void 0 === lrp.def || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {

					complete = !0;

					for (var i = 0; i <= aml; i++) {

						var test = getTestTemplate(i).match;

						if (null !== test.fn && void 0 === getMaskSet().validPositions[i] && test.optionality !== !0 && test.optionalQuantifier !== !0 || null === test.fn && buffer[i] !== getPlaceholder(i, test)) {

							complete = !1;

							break;

						}

					}

				}

				return complete;

			}

		}

		function handleRemove(input, k, pos, strict) {

			function generalize() {

				if (opts.keepStatic) {

					for (var validInputs = [], lastAlt = getLastValidPosition(-1, !0), positionsClone = $.extend(!0, {}, getMaskSet().validPositions), prevAltPos = getMaskSet().validPositions[lastAlt]; lastAlt >= 0; lastAlt--) {

						var altPos = getMaskSet().validPositions[lastAlt];

						if (altPos) {

							if (altPos.generatedInput !== !0 && /[0-9a-bA-Z]/.test(altPos.input) && validInputs.push(altPos.input),

							delete getMaskSet().validPositions[lastAlt], void 0 !== altPos.alternation && altPos.locator[altPos.alternation] !== prevAltPos.locator[altPos.alternation]) break;

							prevAltPos = altPos;

						}

					}

					if (lastAlt > -1) for (getMaskSet().p = seekNext(getLastValidPosition(-1, !0)); validInputs.length > 0; ) {

						var keypress = new $.Event("keypress");

						keypress.which = validInputs.pop().charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !1, !1, getMaskSet().p);

					} else getMaskSet().validPositions = $.extend(!0, {}, positionsClone);

				}

			}

			if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE),

			isRTL)) {

				var pend = pos.end;

				pos.end = pos.begin, pos.begin = pend;

			}

			k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || opts.insertMode === !1) ? (pos.begin = seekPrevious(pos.begin),

			void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.begin--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0) ? pos.end + 1 : seekNext(pos.end) + 1,

			void 0 === getMaskSet().validPositions[pos.begin] || getMaskSet().validPositions[pos.begin].input !== opts.groupSeparator && getMaskSet().validPositions[pos.begin].input !== opts.radixPoint || pos.end++),

			stripValidPositions(pos.begin, pos.end, !1, strict), strict !== !0 && generalize();

			var lvp = getLastValidPosition(pos.begin, !0);

			lvp < pos.begin ? getMaskSet().p = seekNext(lvp) : strict !== !0 && (getMaskSet().p = pos.begin);

		}

		function initializeColorMask(input) {

			function findCaretPos(clientx) {

				var caretPos, e = document.createElement("span");

				for (var style in computedStyle) isNaN(style) && style.indexOf("font") !== -1 && (e.style[style] = computedStyle[style]);

				e.style.textTransform = computedStyle.textTransform, e.style.letterSpacing = computedStyle.letterSpacing,

				e.style.position = "absolute", e.style.height = "auto", e.style.width = "auto",

				e.style.visibility = "hidden", e.style.whiteSpace = "nowrap", document.body.appendChild(e);

				var itl, inputText = input.inputmask._valueGet(), previousWidth = 0;

				for (caretPos = 0, itl = inputText.length; caretPos <= itl; caretPos++) {

					if (e.innerHTML += inputText.charAt(caretPos) || "_", e.offsetWidth >= clientx) {

						var offset1 = clientx - previousWidth, offset2 = e.offsetWidth - clientx;

						e.innerHTML = inputText.charAt(caretPos), offset1 -= e.offsetWidth / 3, caretPos = offset1 < offset2 ? caretPos - 1 : caretPos;

						break;

					}

					previousWidth = e.offsetWidth;

				}

				return document.body.removeChild(e), caretPos;

			}

			function position() {

				colorMask.style.position = "absolute", colorMask.style.top = offset.top + "px",

				colorMask.style.left = offset.left + "px", colorMask.style.width = parseInt(input.offsetWidth) - parseInt(computedStyle.paddingLeft) - parseInt(computedStyle.paddingRight) - parseInt(computedStyle.borderLeftWidth) - parseInt(computedStyle.borderRightWidth) + "px",

				colorMask.style.height = parseInt(input.offsetHeight) - parseInt(computedStyle.paddingTop) - parseInt(computedStyle.paddingBottom) - parseInt(computedStyle.borderTopWidth) - parseInt(computedStyle.borderBottomWidth) + "px",

				colorMask.style.lineHeight = colorMask.style.height, colorMask.style.zIndex = isNaN(computedStyle.zIndex) ? -1 : computedStyle.zIndex - 1,

				colorMask.style.webkitAppearance = "textfield", colorMask.style.mozAppearance = "textfield",

				colorMask.style.Appearance = "textfield";

			}

			var offset = $(input).position(), computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null);

			input.parentNode;

			colorMask = document.createElement("div"), document.body.appendChild(colorMask);

			for (var style in computedStyle) isNaN(style) && "cssText" !== style && style.indexOf("webkit") == -1 && (colorMask.style[style] = computedStyle[style]);

			input.style.backgroundColor = "transparent", input.style.color = "transparent",

			input.style.webkitAppearance = "caret", input.style.mozAppearance = "caret", input.style.Appearance = "caret",

			position(), $(window).on("resize", function(e) {

				offset = $(input).position(), computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null),

				position();

			}), $(input).on("click", function(e) {

				return caret(input, findCaretPos(e.clientX)), EventHandlers.clickEvent.call(this, [ e ]);

			}), $(input).on("keydown", function(e) {

				e.shiftKey || opts.insertMode === !1 || setTimeout(function() {

					renderColorMask(input);

				}, 0);

			});

		}

		function renderColorMask(input, buffer, caretPos) {

			function handleStatic() {

				isStatic || null !== test.fn && void 0 !== testPos.input ? isStatic && null !== test.fn && void 0 !== testPos.input && (isStatic = !1,

				maskTemplate += "</span>") : (isStatic = !0, maskTemplate += "<span class='im-static''>");

			}

			if (void 0 !== colorMask) {

				buffer = buffer || getBuffer(), void 0 === caretPos ? caretPos = caret(input) : void 0 === caretPos.begin && (caretPos = {

					begin: caretPos,

					end: caretPos

				});

				var maskTemplate = "", isStatic = !1;

				if ("" != buffer) {

					var ndxIntlzr, test, testPos, pos = 0, lvp = getLastValidPosition();

					do pos === caretPos.begin && document.activeElement === input && (maskTemplate += "<span class='im-caret' style='border-right-width: 1px;border-right-style: solid;'></span>"),

					getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos],

					test = testPos.match, ndxIntlzr = testPos.locator.slice(), handleStatic(), maskTemplate += testPos.input) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),

					test = testPos.match, ndxIntlzr = testPos.locator.slice(), (opts.jitMasking === !1 || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && (handleStatic(),

					maskTemplate += getPlaceholder(pos, test))), pos++; while ((void 0 === maxLength || pos < maxLength) && (null !== test.fn || "" !== test.def) || lvp > pos);

				}

				colorMask.innerHTML = maskTemplate;

			}

		}

		function mask(elem) {

			function isElementTypeSupported(input, opts) {

				function patchValueProperty(npt) {

					function patchValhook(type) {

						if ($.valHooks && (void 0 === $.valHooks[type] || $.valHooks[type].inputmaskpatch !== !0)) {

							var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function(elem) {

								return elem.value;

							}, valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function(elem, value) {

								return elem.value = value, elem;

							};

							$.valHooks[type] = {

								get: function(elem) {

									if (elem.inputmask) {

										if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();

										var result = valhookGet(elem);

										return getLastValidPosition(void 0, void 0, elem.inputmask.maskset.validPositions) !== -1 || opts.nullable !== !0 ? result : "";

									}

									return valhookGet(elem);

								},

								set: function(elem, value) {

									var result, $elem = $(elem);

									return result = valhookSet(elem, value), elem.inputmask && $elem.trigger("setvalue"),

									result;

								},

								inputmaskpatch: !0

							};

						}

					}

					function getter() {

						return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : getLastValidPosition() !== -1 || opts.nullable !== !0 ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this);

					}

					function setter(value) {

						valueSet.call(this, value), this.inputmask && $(this).trigger("setvalue");

					}

					function installNativeValueSetFallback(npt) {

						EventRuler.on(npt, "mouseenter", function(event) {

							var $input = $(this), input = this, value = input.inputmask._valueGet();

							value !== getBuffer().join("") && $input.trigger("setvalue");

						});

					}

					var valueGet, valueSet;

					if (!npt.inputmask.__valueGet) {

						if (opts.noValuePatching !== !0) {

							if (Object.getOwnPropertyDescriptor) {

								"function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" == typeof "test".__proto__ ? function(object) {

									return object.__proto__;

								} : function(object) {

									return object.constructor.prototype;

								});

								var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : void 0;

								valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get,

								valueSet = valueProperty.set, Object.defineProperty(npt, "value", {

									get: getter,

									set: setter,

									configurable: !0

								})) : "INPUT" !== npt.tagName && (valueGet = function() {

									return this.textContent;

								}, valueSet = function(value) {

									this.textContent = value;

								}, Object.defineProperty(npt, "value", {

									get: getter,

									set: setter,

									configurable: !0

								}));

							} else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"),

							valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter),

							npt.__defineSetter__("value", setter));

							npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet;

						}

						npt.inputmask._valueGet = function(overruleRTL) {

							return isRTL && overruleRTL !== !0 ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);

						}, npt.inputmask._valueSet = function(value, overruleRTL) {

							valueSet.call(this.el, null === value || void 0 === value ? "" : overruleRTL !== !0 && isRTL ? value.split("").reverse().join("") : value);

						}, void 0 === valueGet && (valueGet = function() {

							return this.value;

						}, valueSet = function(value) {

							this.value = value;

						}, patchValhook(npt.type), installNativeValueSetFallback(npt));

					}

				}

				var elementType = input.getAttribute("type"), isSupported = "INPUT" === input.tagName && $.inArray(elementType, opts.supportsInputType) !== -1 || input.isContentEditable || "TEXTAREA" === input.tagName;

				if (!isSupported) if ("INPUT" === input.tagName) {

					var el = document.createElement("input");

					el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null;

				} else isSupported = "partial";

				return isSupported !== !1 && patchValueProperty(input), isSupported;

			}

			var isSupported = isElementTypeSupported(elem, opts);

			if (isSupported !== !1 && (el = elem, $el = $(el), ("rtl" === el.dir || opts.rightAlign) && (el.style.textAlign = "right"),

			("rtl" === el.dir || opts.numericInput) && (el.dir = "ltr", el.removeAttribute("dir"),

			el.inputmask.isRTL = !0, isRTL = !0), opts.colorMask === !0 && initializeColorMask(el),

			android && (el.hasOwnProperty("inputmode") && (el.inputmode = opts.inputmode, el.setAttribute("inputmode", opts.inputmode)),

			"rtfm" === opts.androidHack && (opts.colorMask !== !0 && initializeColorMask(el),

			el.type = "password")), EventRuler.off(el), isSupported === !0 && (EventRuler.on(el, "submit", EventHandlers.submitEvent),

			EventRuler.on(el, "reset", EventHandlers.resetEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent),

			EventRuler.on(el, "blur", EventHandlers.blurEvent), EventRuler.on(el, "focus", EventHandlers.focusEvent),

			EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), opts.colorMask !== !0 && EventRuler.on(el, "click", EventHandlers.clickEvent),

			EventRuler.on(el, "dblclick", EventHandlers.dblclickEvent), EventRuler.on(el, "paste", EventHandlers.pasteEvent),

			EventRuler.on(el, "dragdrop", EventHandlers.pasteEvent), EventRuler.on(el, "drop", EventHandlers.pasteEvent),

			EventRuler.on(el, "cut", EventHandlers.cutEvent), EventRuler.on(el, "complete", opts.oncomplete),

			EventRuler.on(el, "incomplete", opts.onincomplete), EventRuler.on(el, "cleared", opts.oncleared),

			opts.inputEventOnly !== !0 && (EventRuler.on(el, "keydown", EventHandlers.keydownEvent),

			EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "compositionstart", $.noop),

			EventRuler.on(el, "compositionupdate", $.noop), EventRuler.on(el, "compositionend", $.noop),

			EventRuler.on(el, "keyup", $.noop), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent)),

			EventRuler.on(el, "setvalue", EventHandlers.setValueEvent), getBufferTemplate(),

			"" !== el.inputmask._valueGet() || opts.clearMaskOnLostFocus === !1 || document.activeElement === el)) {

				var initialValue = $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(el.inputmask._valueGet(), opts) || el.inputmask._valueGet() : el.inputmask._valueGet();

				checkVal(el, !0, !1, initialValue.split(""));

				var buffer = getBuffer().slice();

				undoValue = buffer.join(""), isComplete(buffer) === !1 && opts.clearIncomplete && resetMaskSet(),

				opts.clearMaskOnLostFocus && document.activeElement !== el && (getLastValidPosition() === -1 ? buffer = [] : clearOptionalTail(buffer)),

				writeBuffer(el, buffer), document.activeElement === el && caret(el, seekNext(getLastValidPosition()));

			}

		}

		maskset = maskset || this.maskset, opts = opts || this.opts;

		var undoValue, $el, maxLength, colorMask, valueBuffer, el = this.el, isRTL = this.isRTL, skipKeyPressEvent = !1, skipInputEvent = !1, ignorable = !1, mouseEnter = !1, EventRuler = {

			on: function(input, eventName, eventHandler) {

				var ev = function(e) {

					if (void 0 === this.inputmask && "FORM" !== this.nodeName) {

						var imOpts = $.data(this, "_inputmask_opts");

						imOpts ? new Inputmask(imOpts).mask(this) : EventRuler.off(this);

					} else {

						if ("setvalue" === e.type || "FORM" === this.nodeName || !(this.disabled || this.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || opts.tabThrough === !1 && e.keyCode === Inputmask.keyCode.TAB))) {

							switch (e.type) {

							  case "input":

								if (skipInputEvent === !0) return skipInputEvent = !1, e.preventDefault();

								break;



							  case "keydown":

								skipKeyPressEvent = !1, skipInputEvent = !1;

								break;



							  case "keypress":

								if (skipKeyPressEvent === !0) return e.preventDefault();

								skipKeyPressEvent = !0;

								break;



							  case "click":

								if (iemobile || iphone) {

									var that = this, args = arguments;

									return setTimeout(function() {

										eventHandler.apply(that, args);

									}, 0), !1;

								}

							}

							var returnVal = eventHandler.apply(this, arguments);

							return returnVal === !1 && (e.preventDefault(), e.stopPropagation()), returnVal;

						}

						e.preventDefault();

					}

				};

				input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev),

				$.inArray(eventName, [ "submit", "reset" ]) !== -1 ? null != input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev);

			},

			off: function(input, event) {

				if (input.inputmask && input.inputmask.events) {

					var events;

					event ? (events = [], events[event] = input.inputmask.events[event]) : events = input.inputmask.events,

					$.each(events, function(eventName, evArr) {

						for (;evArr.length > 0; ) {

							var ev = evArr.pop();

							$.inArray(eventName, [ "submit", "reset" ]) !== -1 ? null != input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev);

						}

						delete input.inputmask.events[eventName];

					});

				}

			}

		}, EventHandlers = {

			keydownEvent: function(e) {

				function isInputEventSupported(eventName) {

					var el = document.createElement("input"), evName = "on" + eventName, isSupported = evName in el;

					return isSupported || (el.setAttribute(evName, "return;"), isSupported = "function" == typeof el[evName]),

					el = null, isSupported;

				}

				var input = this, $input = $(input), k = e.keyCode, pos = caret(input);

				if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut")) e.preventDefault(),

				handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join("")),

				input.inputmask._valueGet() === getBufferTemplate().join("") ? $input.trigger("cleared") : isComplete(getBuffer()) === !0 && $input.trigger("complete"); else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {

					e.preventDefault();

					var caretPos = seekNext(getLastValidPosition());

					opts.insertMode || caretPos !== getMaskSet().maskLength || e.shiftKey || caretPos--,

					caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0);

				} else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(),

				caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && e.altKey !== !0 ? (checkVal(input, !0, !1, undoValue.split("")),

				$input.trigger("click")) : k !== Inputmask.keyCode.INSERT || e.shiftKey || e.ctrlKey ? opts.tabThrough === !0 && k === Inputmask.keyCode.TAB ? (e.shiftKey === !0 ? (null === getTest(pos.begin).match.fn && (pos.begin = seekNext(pos.begin)),

				pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0),

				pos.end = seekNext(pos.begin, !0), pos.end < getMaskSet().maskLength && pos.end--),

				pos.begin < getMaskSet().maskLength && (e.preventDefault(), caret(input, pos.begin, pos.end))) : e.shiftKey || opts.insertMode === !1 && (k === Inputmask.keyCode.RIGHT ? setTimeout(function() {

					var caretPos = caret(input);

					caret(input, caretPos.begin);

				}, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function() {

					var caretPos = caret(input);

					caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1);

				}, 0)) : (opts.insertMode = !opts.insertMode, caret(input, opts.insertMode || pos.begin !== getMaskSet().maskLength ? pos.begin : pos.begin - 1));

				opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts), ignorable = $.inArray(k, opts.ignorables) !== -1;

			},

			keypressEvent: function(e, checkval, writeOut, strict, ndx) {

				var input = this, $input = $(input), k = e.which || e.charCode || e.keyCode;

				if (!(checkval === !0 || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""),

				setTimeout(function() {

					$input.trigger("change");

				}, 0)), !0;

				if (k) {

					46 === k && e.shiftKey === !1 && "," === opts.radixPoint && (k = 44);

					var forwardPosition, pos = checkval ? {

						begin: ndx,

						end: ndx

					} : caret(input), c = String.fromCharCode(k);

					getMaskSet().writeOutBuffer = !0;

					var valResult = isValid(pos, c, strict);

					if (valResult !== !1 && (resetMaskSet(!0), forwardPosition = void 0 !== valResult.caret ? valResult.caret : checkval ? valResult.pos + 1 : seekNext(valResult.pos),

					getMaskSet().p = forwardPosition), writeOut !== !1) {

						var self = this;

						if (setTimeout(function() {

							opts.onKeyValidation.call(self, k, valResult, opts);

						}, 0), getMaskSet().writeOutBuffer && valResult !== !1) {

							var buffer = getBuffer();

							writeBuffer(input, buffer, opts.numericInput && void 0 === valResult.caret ? seekPrevious(forwardPosition) : forwardPosition, e, checkval !== !0),

							checkval !== !0 && setTimeout(function() {

								isComplete(buffer) === !0 && $input.trigger("complete");

							}, 0);

						}

					}

					if (e.preventDefault(), checkval) return valResult.forwardPosition = forwardPosition,

					valResult;

				}

			},

			pasteEvent: function(e) {

				var tempValue, input = this, ev = e.originalEvent || e, $input = $(input), inputValue = input.inputmask._valueGet(!0), caretPos = caret(input);

				isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);

				var valueBeforeCaret = inputValue.substr(0, caretPos.begin), valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);

				if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""),

				valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""),

				isRTL && (tempValue = valueBeforeCaret, valueBeforeCaret = valueAfterCaret, valueAfterCaret = tempValue),

				window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret; else {

					if (!ev.clipboardData || !ev.clipboardData.getData) return !0;

					inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret;

				}

				var pasteValue = inputValue;

				if ($.isFunction(opts.onBeforePaste)) {

					if (pasteValue = opts.onBeforePaste(inputValue, opts), pasteValue === !1) return e.preventDefault();

					pasteValue || (pasteValue = inputValue);

				}

				return checkVal(input, !1, !1, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split("")),

				writeBuffer(input, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")),

				isComplete(getBuffer()) === !0 && $input.trigger("complete"), e.preventDefault();

			},

			inputFallBackEvent: function(e) {

				var input = this, inputValue = input.inputmask._valueGet();

				if (getBuffer().join("") !== inputValue) {

					var caretPos = caret(input);

					if (inputValue = inputValue.replace(new RegExp("(" + Inputmask.escapeRegex(getBufferTemplate().join("")) + ")*"), ""),

					iemobile) {

						var inputChar = inputValue.replace(getBuffer().join(""), "");

						if (1 === inputChar.length) {

							var keypress = new $.Event("keypress");

							return keypress.which = inputChar.charCodeAt(0), EventHandlers.keypressEvent.call(input, keypress, !0, !0, !1, getMaskSet().validPositions[caretPos.begin - 1] ? caretPos.begin : caretPos.begin - 1),

							!1;

						}

					}

					if (caretPos.begin > inputValue.length && (caret(input, inputValue.length), caretPos = caret(input)),

					getBuffer().length - inputValue.length !== 1 || inputValue.charAt(caretPos.begin) === getBuffer()[caretPos.begin] || inputValue.charAt(caretPos.begin + 1) === getBuffer()[caretPos.begin] || isMask(caretPos.begin)) {

						for (var lvp = getLastValidPosition() + 1, bufferTemplate = getBufferTemplate().join(""); null === inputValue.match(Inputmask.escapeRegex(bufferTemplate) + "$"); ) bufferTemplate = bufferTemplate.slice(1);

						inputValue = inputValue.replace(bufferTemplate, ""), inputValue = inputValue.split(""),

						checkVal(input, !0, !1, inputValue, e, caretPos.begin < lvp), isComplete(getBuffer()) === !0 && $(input).trigger("complete");

					} else e.keyCode = Inputmask.keyCode.BACKSPACE, EventHandlers.keydownEvent.call(input, e);

					e.preventDefault();

				}

			},

			setValueEvent: function(e) {

				this.inputmask.refreshValue = !1;

				var input = this, value = input.inputmask._valueGet();

				checkVal(input, !0, !1, ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(value, opts) || value : value).split("")),

				undoValue = getBuffer().join(""), (opts.clearMaskOnLostFocus || opts.clearIncomplete) && input.inputmask._valueGet() === getBufferTemplate().join("") && input.inputmask._valueSet("");

			},

			focusEvent: function(e) {

				var input = this, nptValue = input.inputmask._valueGet();

				opts.showMaskOnFocus && (!opts.showMaskOnHover || opts.showMaskOnHover && "" === nptValue) && (input.inputmask._valueGet() !== getBuffer().join("") ? writeBuffer(input, getBuffer(), seekNext(getLastValidPosition())) : mouseEnter === !1 && caret(input, seekNext(getLastValidPosition()))),

				opts.positionCaretOnTab === !0 && EventHandlers.clickEvent.apply(input, [ e, !0 ]),

				undoValue = getBuffer().join("");

			},

			mouseleaveEvent: function(e) {

				var input = this;

				if (mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== input) {

					var buffer = getBuffer().slice(), nptValue = input.inputmask._valueGet();

					nptValue !== input.getAttribute("placeholder") && "" !== nptValue && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer),

					writeBuffer(input, buffer));

				}

			},

			clickEvent: function(e, tabbed) {

				function doRadixFocus(clickPos) {

					if ("" !== opts.radixPoint) {

						var vps = getMaskSet().validPositions;

						if (void 0 === vps[clickPos] || vps[clickPos].input === getPlaceholder(clickPos)) {

							if (clickPos < seekNext(-1)) return !0;

							var radixPos = $.inArray(opts.radixPoint, getBuffer());

							if (radixPos !== -1) {

								for (var vp in vps) if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;

								return !0;

							}

						}

					}

					return !1;

				}

				var input = this;

				setTimeout(function() {

					if (document.activeElement === input) {

						var selectedCaret = caret(input);

						if (tabbed && (selectedCaret.begin = selectedCaret.end), selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {

						  case "none":

							break;



						  case "radixFocus":

							if (doRadixFocus(selectedCaret.begin)) {

								var radixPos = $.inArray(opts.radixPoint, getBuffer().join(""));

								caret(input, opts.numericInput ? seekNext(radixPos) : radixPos);

								break;

							}



						  default:

							var clickPosition = selectedCaret.begin, lvclickPosition = getLastValidPosition(clickPosition, !0), lastPosition = seekNext(lvclickPosition);

							if (clickPosition < lastPosition) caret(input, isMask(clickPosition) || isMask(clickPosition - 1) ? clickPosition : seekNext(clickPosition)); else {

								var placeholder = getPlaceholder(lastPosition);

								("" !== placeholder && getBuffer()[lastPosition] !== placeholder && getTest(lastPosition).match.optionalQuantifier !== !0 || !isMask(lastPosition) && getTest(lastPosition).match.def === placeholder) && (lastPosition = seekNext(lastPosition)),

								caret(input, lastPosition);

							}

						}

					}

				}, 0);

			},

			dblclickEvent: function(e) {

				var input = this;

				setTimeout(function() {

					caret(input, 0, seekNext(getLastValidPosition()));

				}, 0);

			},

			cutEvent: function(e) {

				var input = this, $input = $(input), pos = caret(input), ev = e.originalEvent || e, clipboardData = window.clipboardData || ev.clipboardData, clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);

				clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")),

				document.execCommand && document.execCommand("copy"), handleRemove(input, Inputmask.keyCode.DELETE, pos),

				writeBuffer(input, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join("")),

				input.inputmask._valueGet() === getBufferTemplate().join("") && $input.trigger("cleared");

			},

			blurEvent: function(e) {

				var $input = $(this), input = this;

				if (input.inputmask) {

					var nptValue = input.inputmask._valueGet(), buffer = getBuffer().slice();

					undoValue !== buffer.join("") && setTimeout(function() {

						$input.trigger("change"), undoValue = buffer.join("");

					}, 0), "" !== nptValue && (opts.clearMaskOnLostFocus && (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)),

					isComplete(buffer) === !1 && (setTimeout(function() {

						$input.trigger("incomplete");

					}, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())),

					writeBuffer(input, buffer, void 0, e));

				}

			},

			mouseenterEvent: function(e) {

				var input = this;

				mouseEnter = !0, document.activeElement !== input && opts.showMaskOnHover && input.inputmask._valueGet() !== getBuffer().join("") && writeBuffer(input, getBuffer());

			},

			submitEvent: function(e) {

				undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && getLastValidPosition() === -1 && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""),

				opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0),

				setTimeout(function() {

					writeBuffer(el, getBuffer());

				}, 0));

			},

			resetEvent: function(e) {

				el.inputmask.refreshValue = !0, setTimeout(function() {

					$el.trigger("setvalue");

				}, 0);

			}

		};

		if (void 0 !== actionObj) switch (actionObj.action) {

		  case "isComplete":

			return el = actionObj.el, isComplete(getBuffer());



		  case "unmaskedvalue":

			return void 0 !== el && void 0 === actionObj.value || (valueBuffer = actionObj.value,

			valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(valueBuffer, opts) || valueBuffer : valueBuffer).split(""),

			checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts)),

			unmaskedvalue(el);



		  case "mask":

			mask(el);

			break;



		  case "format":

			return valueBuffer = ($.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(actionObj.value, opts) || actionObj.value : actionObj.value).split(""),

			checkVal(void 0, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite(void 0, getBuffer(), 0, opts),

			actionObj.metadata ? {

				value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),

				metadata: maskScope.call(this, {

					action: "getmetadata"

				}, maskset, opts)

			} : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");



		  case "isValid":

			actionObj.value ? (valueBuffer = actionObj.value.split(""), checkVal(void 0, !1, !0, isRTL ? valueBuffer.reverse() : valueBuffer)) : actionObj.value = getBuffer().join("");

			for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--) ;

			return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === getBuffer().join("");



		  case "getemptymask":

			return getBufferTemplate().join("");



		  case "remove":

			if (el) {

				$el = $(el), el.inputmask._valueSet(unmaskedvalue(el)), EventRuler.off(el);

				var valueProperty;

				Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? (valueProperty = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"),

				valueProperty && el.inputmask.__valueGet && Object.defineProperty(el, "value", {

					get: el.inputmask.__valueGet,

					set: el.inputmask.__valueSet,

					configurable: !0

				})) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet),

				el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = void 0;

			}

			return el;



		  case "getmetadata":

			if ($.isArray(maskset.metadata)) {

				var maskTarget = getMaskTemplate(!0, 0, !1).join("");

				return $.each(maskset.metadata, function(ndx, mtdt) {

					if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1;

				}), maskTarget;

			}

			return maskset.metadata;

		}

	}

	var ua = navigator.userAgent, mobile = /mobile/i.test(ua), iemobile = /iemobile/i.test(ua), iphone = /iphone/i.test(ua) && !iemobile, android = /android/i.test(ua) && !iemobile;

	return Inputmask.prototype = {

		defaults: {

			placeholder: "_",

			optionalmarker: {

				start: "[",

				end: "]"

			},

			quantifiermarker: {

				start: "{",

				end: "}"

			},

			groupmarker: {

				start: "(",

				end: ")"

			},

			alternatormarker: "|",

			escapeChar: "\\",

			mask: null,

			oncomplete: $.noop,

			onincomplete: $.noop,

			oncleared: $.noop,

			repeat: 0,

			greedy: !0,

			autoUnmask: !1,

			removeMaskOnSubmit: !1,

			clearMaskOnLostFocus: !0,

			insertMode: !0,

			clearIncomplete: !1,

			aliases: {},

			alias: null,

			onKeyDown: $.noop,

			onBeforeMask: null,

			onBeforePaste: function(pastedValue, opts) {

				return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(pastedValue, opts) : pastedValue;

			},

			onBeforeWrite: null,

			onUnMask: null,

			showMaskOnFocus: !0,

			showMaskOnHover: !0,

			onKeyValidation: $.noop,

			skipOptionalPartCharacter: " ",

			numericInput: !1,

			rightAlign: !1,

			undoOnEscape: !0,

			radixPoint: "",

			radixPointDefinitionSymbol: void 0,

			groupSeparator: "",

			keepStatic: null,

			positionCaretOnTab: !0,

			tabThrough: !1,

			supportsInputType: [ "text", "tel", "password" ],

			definitions: {

				"9": {

					validator: "[0-9]",

					cardinality: 1,

					definitionSymbol: "*"

				},

				a: {

					validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",

					cardinality: 1,

					definitionSymbol: "*"

				},

				"*": {

					validator: "[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",

					cardinality: 1

				}

			},

			ignorables: [ 8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123 ],

			isComplete: null,

			canClearPosition: $.noop,

			postValidation: null,

			staticDefinitionSymbol: void 0,

			jitMasking: !1,

			nullable: !0,

			inputEventOnly: !1,

			noValuePatching: !1,

			positionCaretOnClick: "lvp",

			casing: null,

			inputmode: "verbatim",

			colorMask: !1,

			androidHack: !1

		},

		masksCache: {},

		mask: function(elems) {

			function importAttributeOptions(npt, opts, userOptions, dataAttribute) {

				function importOption(option, optionData) {

					optionData = void 0 !== optionData ? optionData : npt.getAttribute(dataAttribute + "-" + option),

					null !== optionData && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)),

					userOptions[option] = optionData);

				}

				var option, dataoptions, optionData, p, attrOptions = npt.getAttribute(dataAttribute);

				if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(new RegExp("'", "g"), '"'),

				dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) {

					optionData = void 0;

					for (p in dataoptions) if ("alias" === p.toLowerCase()) {

						optionData = dataoptions[p];

						break;

					}

				}

				importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts);

				for (option in opts) {

					if (dataoptions) {

						optionData = void 0;

						for (p in dataoptions) if (p.toLowerCase() === option.toLowerCase()) {

							optionData = dataoptions[p];

							break;

						}

					}

					importOption(option, optionData);

				}

				return $.extend(!0, opts, userOptions), opts;

			}

			var that = this;

			return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),

			elems = elems.nodeName ? [ elems ] : elems, $.each(elems, function(ndx, el) {

				var scopedOpts = $.extend(!0, {}, that.opts);

				importAttributeOptions(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute);

				var maskset = generateMaskSet(scopedOpts, that.noMasksCache);

				void 0 !== maskset && (void 0 !== el.inputmask && el.inputmask.remove(), el.inputmask = new Inputmask(),

				el.inputmask.opts = scopedOpts, el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions),

				el.inputmask.el = el, el.inputmask.maskset = maskset, $.data(el, "_inputmask_opts", scopedOpts),

				maskScope.call(el.inputmask, {

					action: "mask"

				}));

			}), elems && elems[0] ? elems[0].inputmask || this : this;

		},

		option: function(options, noremask) {

			return "string" == typeof options ? this.opts[options] : "object" == typeof options ? ($.extend(this.userOptions, options),

			this.el && noremask !== !0 && this.mask(this.el), this) : void 0;

		},

		unmaskedvalue: function(value) {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "unmaskedvalue",

				value: value

			});

		},

		remove: function() {

			return maskScope.call(this, {

				action: "remove"

			});

		},

		getemptymask: function() {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "getemptymask"

			});

		},

		hasMaskedValue: function() {

			return !this.opts.autoUnmask;

		},

		isComplete: function() {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "isComplete"

			});

		},

		getmetadata: function() {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "getmetadata"

			});

		},

		isValid: function(value) {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "isValid",

				value: value

			});

		},

		format: function(value, metadata) {

			return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),

			maskScope.call(this, {

				action: "format",

				value: value,

				metadata: metadata

			});

		},

		analyseMask: function(mask, opts) {

			function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {

				this.matches = [], this.openGroup = isGroup || !1, this.isGroup = isGroup || !1,

				this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1,

				this.quantifier = {

					min: 1,

					max: 1

				};

			}

			function insertTestDefinition(mtoken, element, position) {

				var maskdef = opts.definitions[element];

				position = void 0 !== position ? position : mtoken.matches.length;

				var prevMatch = mtoken.matches[position - 1];

				if (maskdef && !escaped) {

					maskdef.placeholder = $.isFunction(maskdef.placeholder) ? maskdef.placeholder(opts) : maskdef.placeholder;

					for (var prevalidators = maskdef.prevalidator, prevalidatorsL = prevalidators ? prevalidators.length : 0, i = 1; i < maskdef.cardinality; i++) {

						var prevalidator = prevalidatorsL >= i ? prevalidators[i - 1] : [], validator = prevalidator.validator, cardinality = prevalidator.cardinality;

						mtoken.matches.splice(position++, 0, {

							fn: validator ? "string" == typeof validator ? new RegExp(validator) : new function() {

								this.test = validator;

							}() : new RegExp("."),

							cardinality: cardinality ? cardinality : 1,

							optionality: mtoken.isOptional,

							newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),

							casing: maskdef.casing,

							def: maskdef.definitionSymbol || element,

							placeholder: maskdef.placeholder,

							nativeDef: element

						}), prevMatch = mtoken.matches[position - 1];

					}

					mtoken.matches.splice(position++, 0, {

						fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator) : new function() {

							this.test = maskdef.validator;

						}() : new RegExp("."),

						cardinality: maskdef.cardinality,

						optionality: mtoken.isOptional,

						newBlockMarker: void 0 === prevMatch || prevMatch.def !== (maskdef.definitionSymbol || element),

						casing: maskdef.casing,

						def: maskdef.definitionSymbol || element,

						placeholder: maskdef.placeholder,

						nativeDef: element

					});

				} else mtoken.matches.splice(position++, 0, {

					fn: null,

					cardinality: 0,

					optionality: mtoken.isOptional,

					newBlockMarker: void 0 === prevMatch || prevMatch.def !== element,

					casing: null,

					def: opts.staticDefinitionSymbol || element,

					placeholder: void 0 !== opts.staticDefinitionSymbol ? element : void 0,

					nativeDef: element

				}), escaped = !1;

			}

			function verifyGroupMarker(maskToken) {

				maskToken && maskToken.matches && $.each(maskToken.matches, function(ndx, token) {

					var nextToken = maskToken.matches[ndx + 1];

					(void 0 === nextToken || void 0 === nextToken.matches || nextToken.isQuantifier === !1) && token && token.isGroup && (token.isGroup = !1,

					insertTestDefinition(token, opts.groupmarker.start, 0), token.openGroup !== !0 && insertTestDefinition(token, opts.groupmarker.end)),

					verifyGroupMarker(token);

				});

			}

			function defaultCase() {

				if (openenings.length > 0) {

					if (currentOpeningToken = openenings[openenings.length - 1], insertTestDefinition(currentOpeningToken, m),

					currentOpeningToken.isAlternator) {

						alternator = openenings.pop();

						for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;

						openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1],

						currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);

					}

				} else insertTestDefinition(currentToken, m);

			}

			function reverseTokens(maskToken) {

				function reverseStatic(st) {

					return st === opts.optionalmarker.start ? st = opts.optionalmarker.end : st === opts.optionalmarker.end ? st = opts.optionalmarker.start : st === opts.groupmarker.start ? st = opts.groupmarker.end : st === opts.groupmarker.end && (st = opts.groupmarker.start),

					st;

				}

				maskToken.matches = maskToken.matches.reverse();

				for (var match in maskToken.matches) {

					var intMatch = parseInt(match);

					if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {

						var qt = maskToken.matches[match];

						maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt);

					}

					void 0 !== maskToken.matches[match].matches ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = reverseStatic(maskToken.matches[match]);

				}

				return maskToken;

			}

			for (var match, m, openingToken, currentOpeningToken, alternator, lastMatch, groupToken, tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g, escaped = !1, currentToken = new MaskToken(), openenings = [], maskTokens = []; match = tokenizer.exec(mask); ) if (m = match[0],

			escaped) defaultCase(); else switch (m.charAt(0)) {

			  case opts.escapeChar:

				escaped = !0;

				break;



			  case opts.optionalmarker.end:

			  case opts.groupmarker.end:

				if (openingToken = openenings.pop(), openingToken.openGroup = !1, void 0 !== openingToken) if (openenings.length > 0) {

					if (currentOpeningToken = openenings[openenings.length - 1], currentOpeningToken.matches.push(openingToken),

					currentOpeningToken.isAlternator) {

						alternator = openenings.pop();

						for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;

						openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1],

						currentOpeningToken.matches.push(alternator)) : currentToken.matches.push(alternator);

					}

				} else currentToken.matches.push(openingToken); else defaultCase();

				break;



			  case opts.optionalmarker.start:

				openenings.push(new MaskToken((!1), (!0)));

				break;



			  case opts.groupmarker.start:

				openenings.push(new MaskToken((!0)));

				break;



			  case opts.quantifiermarker.start:

				var quantifier = new MaskToken((!1), (!1), (!0));

				m = m.replace(/[{}]/g, "");

				var mq = m.split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);

				if ("*" !== mq1 && "+" !== mq1 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {

					min: mq0,

					max: mq1

				}, openenings.length > 0) {

					var matches = openenings[openenings.length - 1].matches;

					match = matches.pop(), match.isGroup || (groupToken = new MaskToken((!0)), groupToken.matches.push(match),

					match = groupToken), matches.push(match), matches.push(quantifier);

				} else match = currentToken.matches.pop(), match.isGroup || (groupToken = new MaskToken((!0)),

				groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match),

				currentToken.matches.push(quantifier);

				break;



			  case opts.alternatormarker:

				openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1],

				lastMatch = currentOpeningToken.matches.pop()) : lastMatch = currentToken.matches.pop(),

				lastMatch.isAlternator ? openenings.push(lastMatch) : (alternator = new MaskToken((!1), (!1), (!1), (!0)),

				alternator.matches.push(lastMatch), openenings.push(alternator));

				break;



			  default:

				defaultCase();

			}

			for (;openenings.length > 0; ) openingToken = openenings.pop(), currentToken.matches.push(openingToken);

			return currentToken.matches.length > 0 && (verifyGroupMarker(currentToken), maskTokens.push(currentToken)),

			opts.numericInput && reverseTokens(maskTokens[0]), maskTokens;

		}

	}, Inputmask.extendDefaults = function(options) {

		$.extend(!0, Inputmask.prototype.defaults, options);

	}, Inputmask.extendDefinitions = function(definition) {

		$.extend(!0, Inputmask.prototype.defaults.definitions, definition);

	}, Inputmask.extendAliases = function(alias) {

		$.extend(!0, Inputmask.prototype.defaults.aliases, alias);

	}, Inputmask.format = function(value, options, metadata) {

		return Inputmask(options).format(value, metadata);

	}, Inputmask.unmask = function(value, options) {

		return Inputmask(options).unmaskedvalue(value);

	}, Inputmask.isValid = function(value, options) {

		return Inputmask(options).isValid(value);

	}, Inputmask.remove = function(elems) {

		$.each(elems, function(ndx, el) {

			el.inputmask && el.inputmask.remove();

		});

	}, Inputmask.escapeRegex = function(str) {

		var specials = [ "/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^" ];

		return str.replace(new RegExp("(\\" + specials.join("|\\") + ")", "gim"), "\\$1");

	}, Inputmask.keyCode = {

		ALT: 18,

		BACKSPACE: 8,

		BACKSPACE_SAFARI: 127,

		CAPS_LOCK: 20,

		COMMA: 188,

		COMMAND: 91,

		COMMAND_LEFT: 91,

		COMMAND_RIGHT: 93,

		CONTROL: 17,

		DELETE: 46,

		DOWN: 40,

		END: 35,

		ENTER: 13,

		ESCAPE: 27,

		HOME: 36,

		INSERT: 45,

		LEFT: 37,

		MENU: 93,

		NUMPAD_ADD: 107,

		NUMPAD_DECIMAL: 110,

		NUMPAD_DIVIDE: 111,

		NUMPAD_ENTER: 108,

		NUMPAD_MULTIPLY: 106,

		NUMPAD_SUBTRACT: 109,

		PAGE_DOWN: 34,

		PAGE_UP: 33,

		PERIOD: 190,

		RIGHT: 39,

		SHIFT: 16,

		SPACE: 32,

		TAB: 9,

		UP: 38,

		WINDOWS: 91,

		X: 88

	}, window.Inputmask = Inputmask, Inputmask;

}(jQuery), function($, Inputmask) {

	return void 0 === $.fn.inputmask && ($.fn.inputmask = function(fn, options) {

		var nptmask, input = this[0];

		if (void 0 === options && (options = {}), "string" == typeof fn) switch (fn) {

		  case "unmaskedvalue":

			return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();



		  case "remove":

			return this.each(function() {

				this.inputmask && this.inputmask.remove();

			});



		  case "getemptymask":

			return input && input.inputmask ? input.inputmask.getemptymask() : "";



		  case "hasMaskedValue":

			return !(!input || !input.inputmask) && input.inputmask.hasMaskedValue();



		  case "isComplete":

			return !input || !input.inputmask || input.inputmask.isComplete();



		  case "getmetadata":

			return input && input.inputmask ? input.inputmask.getmetadata() : void 0;



		  case "setvalue":

			$(input).val(options), input && void 0 === input.inputmask && $(input).triggerHandler("setvalue");

			break;



		  case "option":

			if ("string" != typeof options) return this.each(function() {

				if (void 0 !== this.inputmask) return this.inputmask.option(options);

			});

			if (input && void 0 !== input.inputmask) return input.inputmask.option(options);

			break;



		  default:

			return options.alias = fn, nptmask = new Inputmask(options), this.each(function() {

				nptmask.mask(this);

			});

		} else {

			if ("object" == typeof fn) return nptmask = new Inputmask(fn), void 0 === fn.mask && void 0 === fn.alias ? this.each(function() {

				return void 0 !== this.inputmask ? this.inputmask.option(fn) : void nptmask.mask(this);

			}) : this.each(function() {

				nptmask.mask(this);

			});

			if (void 0 === fn) return this.each(function() {

				nptmask = new Inputmask(options), nptmask.mask(this);

			});

		}

	}), $.fn.inputmask;

}(jQuery, Inputmask), function($, Inputmask) {}(jQuery, Inputmask), function($, Inputmask) {

	function isLeapYear(year) {

		return isNaN(year) || 29 === new Date(year, 2, 0).getDate();

	}

	return Inputmask.extendAliases({

		"dd/mm/yyyy": {

			mask: "1/2/y",

			placeholder: "dd/mm/yyyy",

			regex: {

				val1pre: new RegExp("[0-3]"),

				val1: new RegExp("0[1-9]|[12][0-9]|3[01]"),

				val2pre: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|[12][0-9]|3[01])" + escapedSeparator + "[01])");

				},

				val2: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|[12][0-9])" + escapedSeparator + "(0[1-9]|1[012]))|(30" + escapedSeparator + "(0[13-9]|1[012]))|(31" + escapedSeparator + "(0[13578]|1[02]))");

				}

			},

			leapday: "29/02/",

			separator: "/",

			yearrange: {

				minyear: 1900,

				maxyear: 2099

			},

			isInYearRange: function(chrs, minyear, maxyear) {

				if (isNaN(chrs)) return !1;

				var enteredyear = parseInt(chrs.concat(minyear.toString().slice(chrs.length))), enteredyear2 = parseInt(chrs.concat(maxyear.toString().slice(chrs.length)));

				return !isNaN(enteredyear) && (minyear <= enteredyear && enteredyear <= maxyear) || !isNaN(enteredyear2) && (minyear <= enteredyear2 && enteredyear2 <= maxyear);

			},

			determinebaseyear: function(minyear, maxyear, hint) {

				var currentyear = new Date().getFullYear();

				if (minyear > currentyear) return minyear;

				if (maxyear < currentyear) {

					for (var maxYearPrefix = maxyear.toString().slice(0, 2), maxYearPostfix = maxyear.toString().slice(2, 4); maxyear < maxYearPrefix + hint; ) maxYearPrefix--;

					var maxxYear = maxYearPrefix + maxYearPostfix;

					return minyear > maxxYear ? minyear : maxxYear;

				}

				if (minyear <= currentyear && currentyear <= maxyear) {

					for (var currentYearPrefix = currentyear.toString().slice(0, 2); maxyear < currentYearPrefix + hint; ) currentYearPrefix--;

					var currentYearAndHint = currentYearPrefix + hint;

					return currentYearAndHint < minyear ? minyear : currentYearAndHint;

				}

				return currentyear;

			},

			onKeyDown: function(e, buffer, caretPos, opts) {

				var $input = $(this);

				if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {

					var today = new Date();

					$input.val(today.getDate().toString() + (today.getMonth() + 1).toString() + today.getFullYear().toString()),

					$input.trigger("setvalue");

				}

			},

			getFrontValue: function(mask, buffer, opts) {

				for (var start = 0, length = 0, i = 0; i < mask.length && "2" !== mask.charAt(i); i++) {

					var definition = opts.definitions[mask.charAt(i)];

					definition ? (start += length, length = definition.cardinality) : length++;

				}

				return buffer.join("").substr(start, length);

			},

			postValidation: function(buffer, currentResult, opts) {

				var dayMonthValue, year, bufferStr = buffer.join("");

				return 0 === opts.mask.indexOf("y") ? (year = bufferStr.substr(0, 4), dayMonthValue = bufferStr.substr(4, 11)) : (year = bufferStr.substr(6, 11),

				dayMonthValue = bufferStr.substr(0, 6)), currentResult && (dayMonthValue !== opts.leapday || isLeapYear(year));

			},

			definitions: {

				"1": {

					validator: function(chrs, maskset, pos, strict, opts) {

						var isValid = opts.regex.val1.test(chrs);

						return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val1.test("0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0",

						{

							refreshFromBuffer: {

								start: pos - 1,

								end: pos

							},

							pos: pos,

							c: chrs.charAt(0)

						});

					},

					cardinality: 2,

					prevalidator: [ {

						validator: function(chrs, maskset, pos, strict, opts) {

							var pchrs = chrs;

							isNaN(maskset.buffer[pos + 1]) || (pchrs += maskset.buffer[pos + 1]);

							var isValid = 1 === pchrs.length ? opts.regex.val1pre.test(pchrs) : opts.regex.val1.test(pchrs);

							if (!strict && !isValid) {

								if (isValid = opts.regex.val1.test(chrs + "0")) return maskset.buffer[pos] = chrs,

								maskset.buffer[++pos] = "0", {

									pos: pos,

									c: "0"

								};

								if (isValid = opts.regex.val1.test("0" + chrs)) return maskset.buffer[pos] = "0",

								pos++, {

									pos: pos

								};

							}

							return isValid;

						},

						cardinality: 1

					} ]

				},

				"2": {

					validator: function(chrs, maskset, pos, strict, opts) {

						var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);

						frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);

						var isValid = opts.regex.val2(opts.separator).test(frontValue + chrs);

						return strict || isValid || chrs.charAt(1) !== opts.separator && "-./".indexOf(chrs.charAt(1)) === -1 || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs.charAt(0))) ? isValid : (maskset.buffer[pos - 1] = "0",

						{

							refreshFromBuffer: {

								start: pos - 1,

								end: pos

							},

							pos: pos,

							c: chrs.charAt(0)

						});

					},

					cardinality: 2,

					prevalidator: [ {

						validator: function(chrs, maskset, pos, strict, opts) {

							isNaN(maskset.buffer[pos + 1]) || (chrs += maskset.buffer[pos + 1]);

							var frontValue = opts.getFrontValue(maskset.mask, maskset.buffer, opts);

							frontValue.indexOf(opts.placeholder[0]) !== -1 && (frontValue = "01" + opts.separator);

							var isValid = 1 === chrs.length ? opts.regex.val2pre(opts.separator).test(frontValue + chrs) : opts.regex.val2(opts.separator).test(frontValue + chrs);

							return strict || isValid || !(isValid = opts.regex.val2(opts.separator).test(frontValue + "0" + chrs)) ? isValid : (maskset.buffer[pos] = "0",

							pos++, {

								pos: pos

							});

						},

						cardinality: 1

					} ]

				},

				y: {

					validator: function(chrs, maskset, pos, strict, opts) {

						return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);

					},

					cardinality: 4,

					prevalidator: [ {

						validator: function(chrs, maskset, pos, strict, opts) {

							var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);

							if (!strict && !isValid) {

								var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 1);

								if (isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0),

								{

									pos: pos

								};

								if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs + "0").toString().slice(0, 2),

								isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(0),

								maskset.buffer[pos++] = yearPrefix.charAt(1), {

									pos: pos

								};

							}

							return isValid;

						},

						cardinality: 1

					}, {

						validator: function(chrs, maskset, pos, strict, opts) {

							var isValid = opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);

							if (!strict && !isValid) {

								var yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2);

								if (isValid = opts.isInYearRange(chrs[0] + yearPrefix[1] + chrs[1], opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos++] = yearPrefix.charAt(1),

								{

									pos: pos

								};

								if (yearPrefix = opts.determinebaseyear(opts.yearrange.minyear, opts.yearrange.maxyear, chrs).toString().slice(0, 2),

								isValid = opts.isInYearRange(yearPrefix + chrs, opts.yearrange.minyear, opts.yearrange.maxyear)) return maskset.buffer[pos - 1] = yearPrefix.charAt(0),

								maskset.buffer[pos++] = yearPrefix.charAt(1), maskset.buffer[pos++] = chrs.charAt(0),

								{

									refreshFromBuffer: {

										start: pos - 3,

										end: pos

									},

									pos: pos

								};

							}

							return isValid;

						},

						cardinality: 2

					}, {

						validator: function(chrs, maskset, pos, strict, opts) {

							return opts.isInYearRange(chrs, opts.yearrange.minyear, opts.yearrange.maxyear);

						},

						cardinality: 3

					} ]

				}

			},

			insertMode: !1,

			autoUnmask: !1

		},

		"mm/dd/yyyy": {

			placeholder: "mm/dd/yyyy",

			alias: "dd/mm/yyyy",

			regex: {

				val2pre: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");

				},

				val2: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");

				},

				val1pre: new RegExp("[01]"),

				val1: new RegExp("0[1-9]|1[012]")

			},

			leapday: "02/29/",

			onKeyDown: function(e, buffer, caretPos, opts) {

				var $input = $(this);

				if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {

					var today = new Date();

					$input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()),

					$input.trigger("setvalue");

				}

			}

		},

		"yyyy/mm/dd": {

			mask: "y/1/2",

			placeholder: "yyyy/mm/dd",

			alias: "mm/dd/yyyy",

			leapday: "/02/29",

			onKeyDown: function(e, buffer, caretPos, opts) {

				var $input = $(this);

				if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {

					var today = new Date();

					$input.val(today.getFullYear().toString() + (today.getMonth() + 1).toString() + today.getDate().toString()),

					$input.trigger("setvalue");

				}

			}

		},

		"dd.mm.yyyy": {

			mask: "1.2.y",

			placeholder: "dd.mm.yyyy",

			leapday: "29.02.",

			separator: ".",

			alias: "dd/mm/yyyy"

		},

		"dd-mm-yyyy": {

			mask: "1-2-y",

			placeholder: "dd-mm-yyyy",

			leapday: "29-02-",

			separator: "-",

			alias: "dd/mm/yyyy"

		},

		"mm.dd.yyyy": {

			mask: "1.2.y",

			placeholder: "mm.dd.yyyy",

			leapday: "02.29.",

			separator: ".",

			alias: "mm/dd/yyyy"

		},

		"mm-dd-yyyy": {

			mask: "1-2-y",

			placeholder: "mm-dd-yyyy",

			leapday: "02-29-",

			separator: "-",

			alias: "mm/dd/yyyy"

		},

		"yyyy.mm.dd": {

			mask: "y.1.2",

			placeholder: "yyyy.mm.dd",

			leapday: ".02.29",

			separator: ".",

			alias: "yyyy/mm/dd"

		},

		"yyyy-mm-dd": {

			mask: "y-1-2",

			placeholder: "yyyy-mm-dd",

			leapday: "-02-29",

			separator: "-",

			alias: "yyyy/mm/dd"

		},

		datetime: {

			mask: "1/2/y h:s",

			placeholder: "dd/mm/yyyy hh:mm",

			alias: "dd/mm/yyyy",

			regex: {

				hrspre: new RegExp("[012]"),

				hrs24: new RegExp("2[0-4]|1[3-9]"),

				hrs: new RegExp("[01][0-9]|2[0-4]"),

				ampm: new RegExp("^[a|p|A|P][m|M]"),

				mspre: new RegExp("[0-5]"),

				ms: new RegExp("[0-5][0-9]")

			},

			timeseparator: ":",

			hourFormat: "24",

			definitions: {

				h: {

					validator: function(chrs, maskset, pos, strict, opts) {

						if ("24" === opts.hourFormat && 24 === parseInt(chrs, 10)) return maskset.buffer[pos - 1] = "0",

						maskset.buffer[pos] = "0", {

							refreshFromBuffer: {

								start: pos - 1,

								end: pos

							},

							c: "0"

						};

						var isValid = opts.regex.hrs.test(chrs);

						if (!strict && !isValid && (chrs.charAt(1) === opts.timeseparator || "-.:".indexOf(chrs.charAt(1)) !== -1) && (isValid = opts.regex.hrs.test("0" + chrs.charAt(0)))) return maskset.buffer[pos - 1] = "0",

						maskset.buffer[pos] = chrs.charAt(0), pos++, {

							refreshFromBuffer: {

								start: pos - 2,

								end: pos

							},

							pos: pos,

							c: opts.timeseparator

						};

						if (isValid && "24" !== opts.hourFormat && opts.regex.hrs24.test(chrs)) {

							var tmp = parseInt(chrs, 10);

							return 24 === tmp ? (maskset.buffer[pos + 5] = "a", maskset.buffer[pos + 6] = "m") : (maskset.buffer[pos + 5] = "p",

							maskset.buffer[pos + 6] = "m"), tmp -= 12, tmp < 10 ? (maskset.buffer[pos] = tmp.toString(),

							maskset.buffer[pos - 1] = "0") : (maskset.buffer[pos] = tmp.toString().charAt(1),

							maskset.buffer[pos - 1] = tmp.toString().charAt(0)), {

								refreshFromBuffer: {

									start: pos - 1,

									end: pos + 6

								},

								c: maskset.buffer[pos]

							};

						}

						return isValid;

					},

					cardinality: 2,

					prevalidator: [ {

						validator: function(chrs, maskset, pos, strict, opts) {

							var isValid = opts.regex.hrspre.test(chrs);

							return strict || isValid || !(isValid = opts.regex.hrs.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0",

							pos++, {

								pos: pos

							});

						},

						cardinality: 1

					} ]

				},

				s: {

					validator: "[0-5][0-9]",

					cardinality: 2,

					prevalidator: [ {

						validator: function(chrs, maskset, pos, strict, opts) {

							var isValid = opts.regex.mspre.test(chrs);

							return strict || isValid || !(isValid = opts.regex.ms.test("0" + chrs)) ? isValid : (maskset.buffer[pos] = "0",

							pos++, {

								pos: pos

							});

						},

						cardinality: 1

					} ]

				},

				t: {

					validator: function(chrs, maskset, pos, strict, opts) {

						return opts.regex.ampm.test(chrs + "m");

					},

					casing: "lower",

					cardinality: 1

				}

			},

			insertMode: !1,

			autoUnmask: !1

		},

		datetime12: {

			mask: "1/2/y h:s t\\m",

			placeholder: "dd/mm/yyyy hh:mm xm",

			alias: "datetime",

			hourFormat: "12"

		},

		"mm/dd/yyyy hh:mm xm": {

			mask: "1/2/y h:s t\\m",

			placeholder: "mm/dd/yyyy hh:mm xm",

			alias: "datetime12",

			regex: {

				val2pre: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");

				},

				val2: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");

				},

				val1pre: new RegExp("[01]"),

				val1: new RegExp("0[1-9]|1[012]")

			},

			leapday: "02/29/",

			onKeyDown: function(e, buffer, caretPos, opts) {

				var $input = $(this);

				if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {

					var today = new Date();

					$input.val((today.getMonth() + 1).toString() + today.getDate().toString() + today.getFullYear().toString()),

					$input.trigger("setvalue");

				}

			}

		},

		"hh:mm t": {

			mask: "h:s t\\m",

			placeholder: "hh:mm xm",

			alias: "datetime",

			hourFormat: "12"

		},

		"h:s t": {

			mask: "h:s t\\m",

			placeholder: "hh:mm xm",

			alias: "datetime",

			hourFormat: "12"

		},

		"hh:mm:ss": {

			mask: "h:s:s",

			placeholder: "hh:mm:ss",

			alias: "datetime",

			autoUnmask: !1

		},

		"hh:mm": {

			mask: "h:s",

			placeholder: "hh:mm",

			alias: "datetime",

			autoUnmask: !1

		},

		date: {

			alias: "dd/mm/yyyy"

		},

		"mm/yyyy": {

			mask: "1/y",

			placeholder: "mm/yyyy",

			leapday: "donotuse",

			separator: "/",

			alias: "mm/dd/yyyy"

		},

		shamsi: {

			regex: {

				val2pre: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "[0-3])");

				},

				val2: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[1-9]|1[012])" + escapedSeparator + "30)|((0[1-6])" + escapedSeparator + "31)");

				},

				val1pre: new RegExp("[01]"),

				val1: new RegExp("0[1-9]|1[012]")

			},

			yearrange: {

				minyear: 1300,

				maxyear: 1499

			},

			mask: "y/1/2",

			leapday: "/12/30",

			placeholder: "yyyy/mm/dd",

			alias: "mm/dd/yyyy",

			clearIncomplete: !0

		},

		"yyyy-mm-dd hh:mm:ss": {

			mask: "y-1-2 h:s:s",

			placeholder: "yyyy-mm-dd hh:mm:ss",

			alias: "datetime",

			separator: "-",

			leapday: "-02-29",

			regex: {

				val2pre: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[13-9]|1[012])" + escapedSeparator + "[0-3])|(02" + escapedSeparator + "[0-2])");

				},

				val2: function(separator) {

					var escapedSeparator = Inputmask.escapeRegex.call(this, separator);

					return new RegExp("((0[1-9]|1[012])" + escapedSeparator + "(0[1-9]|[12][0-9]))|((0[13-9]|1[012])" + escapedSeparator + "30)|((0[13578]|1[02])" + escapedSeparator + "31)");

				},

				val1pre: new RegExp("[01]"),

				val1: new RegExp("0[1-9]|1[012]")

			},

			onKeyDown: function(e, buffer, caretPos, opts) {}

		}

	}), Inputmask;

}(jQuery, Inputmask), function($, Inputmask) {

	return Inputmask.extendDefinitions({

		A: {

			validator: "[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",

			cardinality: 1,

			casing: "upper"

		},

		"&": {

			validator: "[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",

			cardinality: 1,

			casing: "upper"

		},

		"#": {

			validator: "[0-9A-Fa-f]",

			cardinality: 1,

			casing: "upper"

		}

	}), Inputmask.extendAliases({

		url: {

			definitions: {

				i: {

					validator: ".",

					cardinality: 1

				}

			},

			mask: "(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",

			insertMode: !1,

			autoUnmask: !1,

			inputmode: "url"

		},

		ip: {

			mask: "i[i[i]].i[i[i]].i[i[i]].i[i[i]]",

			definitions: {

				i: {

					validator: function(chrs, maskset, pos, strict, opts) {

						return pos - 1 > -1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs,

						chrs = pos - 2 > -1 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : chrs = "00" + chrs,

						new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);

					},

					cardinality: 1

				}

			},

			onUnMask: function(maskedValue, unmaskedValue, opts) {

				return maskedValue;

			},

			inputmode: "numeric"

		},

		email: {

			mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",

			greedy: !1,

			onBeforePaste: function(pastedValue, opts) {

				return pastedValue = pastedValue.toLowerCase(), pastedValue.replace("mailto:", "");

			},

			definitions: {

				"*": {

					validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",

					cardinality: 1,

					casing: "lower"

				},

				"-": {

					validator: "[0-9A-Za-z-]",

					cardinality: 1,

					casing: "lower"

				}

			},

			onUnMask: function(maskedValue, unmaskedValue, opts) {

				return maskedValue;

			},

			inputmode: "email"

		},

		mac: {

			mask: "##:##:##:##:##:##"

		},

		vin: {

			mask: "V{13}9{4}",

			definitions: {

				V: {

					validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",

					cardinality: 1,

					casing: "upper"

				}

			},

			clearIncomplete: !0,

			autoUnmask: !0

		}

	}), Inputmask;

}(jQuery, Inputmask), function($, Inputmask) {

	return Inputmask.extendAliases({

		numeric: {

			mask: function(opts) {

				function autoEscape(txt) {

					for (var escapedTxt = "", i = 0; i < txt.length; i++) escapedTxt += opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? "\\" + txt.charAt(i) : txt.charAt(i);

					return escapedTxt;

				}

				if (0 !== opts.repeat && isNaN(opts.integerDigits) && (opts.integerDigits = opts.repeat),

				opts.repeat = 0, opts.groupSeparator === opts.radixPoint && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""),

				" " === opts.groupSeparator && (opts.skipOptionalPartCharacter = void 0), opts.autoGroup = opts.autoGroup && "" !== opts.groupSeparator,

				opts.autoGroup && ("string" == typeof opts.groupSize && isFinite(opts.groupSize) && (opts.groupSize = parseInt(opts.groupSize)),

				isFinite(opts.integerDigits))) {

					var seps = Math.floor(opts.integerDigits / opts.groupSize), mod = opts.integerDigits % opts.groupSize;

					opts.integerDigits = parseInt(opts.integerDigits) + (0 === mod ? seps - 1 : seps),

					opts.integerDigits < 1 && (opts.integerDigits = "*");

				}

				opts.placeholder.length > 1 && (opts.placeholder = opts.placeholder.charAt(0)),

				"radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && opts.integerOptional === !1 && (opts.positionCaretOnClick = "lvp"),

				opts.definitions[";"] = opts.definitions["~"], opts.definitions[";"].definitionSymbol = "~",

				opts.numericInput === !0 && (opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick,

				opts.digitsOptional = !1, isNaN(opts.digits) && (opts.digits = 2), opts.decimalProtect = !1);

				var mask = "[+]";

				if (mask += autoEscape(opts.prefix), mask += opts.integerOptional === !0 ? "~{1," + opts.integerDigits + "}" : "~{" + opts.integerDigits + "}",

				void 0 !== opts.digits) {

					opts.decimalProtect && (opts.radixPointDefinitionSymbol = ":");

					var dq = opts.digits.toString().split(",");

					isFinite(dq[0] && dq[1] && isFinite(dq[1])) ? mask += (opts.decimalProtect ? ":" : opts.radixPoint) + ";{" + opts.digits + "}" : (isNaN(opts.digits) || parseInt(opts.digits) > 0) && (mask += opts.digitsOptional ? "[" + (opts.decimalProtect ? ":" : opts.radixPoint) + ";{1," + opts.digits + "}]" : (opts.decimalProtect ? ":" : opts.radixPoint) + ";{" + opts.digits + "}");

				}

				return mask += autoEscape(opts.suffix), mask += "[-]", opts.greedy = !1, null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

				"," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, "."))),

				null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

				"," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, "."))),

				mask;

			},

			placeholder: "",

			greedy: !1,

			digits: "*",

			digitsOptional: !0,

			radixPoint: ".",

			positionCaretOnClick: "radixFocus",

			groupSize: 3,

			groupSeparator: "",

			autoGroup: !1,

			allowPlus: !0,

			allowMinus: !0,

			negationSymbol: {

				front: "-",

				back: ""

			},

			integerDigits: "+",

			integerOptional: !0,

			prefix: "",

			suffix: "",

			rightAlign: !0,

			decimalProtect: !0,

			min: null,

			max: null,

			step: 1,

			insertMode: !0,

			autoUnmask: !1,

			unmaskAsNumber: !1,

			inputmode: "numeric",

			postFormat: function(buffer, pos, opts) {

				opts.numericInput === !0 && (buffer = buffer.reverse(), isFinite(pos) && (pos = buffer.join("").length - pos - 1));

				var i, l;

				pos = pos >= buffer.length ? buffer.length - 1 : pos < 0 ? 0 : pos;

				var charAtPos = buffer[pos], cbuf = buffer.slice();

				charAtPos === opts.groupSeparator && (cbuf.splice(pos--, 1), charAtPos = cbuf[pos]);

				var isNegative = cbuf.join("").match(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)));

				isNegative = null !== isNegative && 1 === isNegative.length, pos > (isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length && pos < cbuf.length - opts.suffix.length && (cbuf[pos] = "!");

				var bufVal = cbuf.join(""), bufValOrigin = cbuf.join();

				if (isNegative && (bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), ""),

				bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), "")),

				bufVal = bufVal.replace(new RegExp(Inputmask.escapeRegex(opts.suffix) + "$"), ""),

				bufVal = bufVal.replace(new RegExp("^" + Inputmask.escapeRegex(opts.prefix)), ""),

				bufVal.length > 0 && opts.autoGroup || bufVal.indexOf(opts.groupSeparator) !== -1) {

					var escapedGroupSeparator = Inputmask.escapeRegex(opts.groupSeparator);

					bufVal = bufVal.replace(new RegExp(escapedGroupSeparator, "g"), "");

					var radixSplit = bufVal.split(charAtPos === opts.radixPoint ? "!" : opts.radixPoint);

					if (bufVal = "" === opts.radixPoint ? bufVal : radixSplit[0], charAtPos !== opts.negationSymbol.front && (bufVal = bufVal.replace("!", "?")),

					bufVal.length > opts.groupSize) for (var reg = new RegExp("([-+]?[\\d?]+)([\\d?]{" + opts.groupSize + "})"); reg.test(bufVal) && "" !== opts.groupSeparator; ) bufVal = bufVal.replace(reg, "$1" + opts.groupSeparator + "$2"),

					bufVal = bufVal.replace(opts.groupSeparator + opts.groupSeparator, opts.groupSeparator);

					bufVal = bufVal.replace("?", "!"), "" !== opts.radixPoint && radixSplit.length > 1 && (bufVal += (charAtPos === opts.radixPoint ? "!" : opts.radixPoint) + radixSplit[1]);

				}

				bufVal = opts.prefix + bufVal + opts.suffix, isNegative && (bufVal = opts.negationSymbol.front + bufVal + opts.negationSymbol.back);

				var needsRefresh = bufValOrigin !== bufVal.split("").join(), newPos = $.inArray("!", bufVal);

				if (newPos === -1 && (newPos = pos), needsRefresh) {

					for (buffer.length = bufVal.length, i = 0, l = bufVal.length; i < l; i++) buffer[i] = bufVal.charAt(i);

					buffer[newPos] = charAtPos;

				}

				return newPos = opts.numericInput && isFinite(pos) ? buffer.join("").length - newPos - 1 : newPos,

				opts.numericInput && (buffer = buffer.reverse(), $.inArray(opts.radixPoint, buffer) < newPos && buffer.join("").length - opts.suffix.length !== newPos && (newPos -= 1)),

				{

					pos: newPos,

					refreshFromBuffer: needsRefresh,

					buffer: buffer,

					isNegative: isNegative

				};

			},

			onBeforeWrite: function(e, buffer, caretPos, opts) {

				var rslt;

				if (e && ("blur" === e.type || "checkval" === e.type || "keydown" === e.type)) {

					var maskedValue = opts.numericInput ? buffer.slice().reverse().join("") : buffer.join(""), processValue = maskedValue.replace(opts.prefix, "");

					processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

					"," === opts.radixPoint && (processValue = processValue.replace(opts.radixPoint, "."));

					var isNegative = processValue.match(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"));

					if (isNegative = null !== isNegative && 1 === isNegative.length, processValue = processValue.replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), ""),

					processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),

					isNaN(opts.placeholder) && (processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.placeholder), "g"), "")),

					processValue = processValue === opts.negationSymbol.front ? processValue + "0" : processValue,

					"" !== processValue && isFinite(processValue)) {

						var floatValue = parseFloat(processValue), signedFloatValue = isNegative ? floatValue * -1 : floatValue;

						if (null !== opts.min && isFinite(opts.min) && signedFloatValue < parseFloat(opts.min) ? (floatValue = Math.abs(opts.min),

						isNegative = opts.min < 0, maskedValue = void 0) : null !== opts.max && isFinite(opts.max) && signedFloatValue > parseFloat(opts.max) && (floatValue = Math.abs(opts.max),

						isNegative = opts.max < 0, maskedValue = void 0), processValue = floatValue.toString().replace(".", opts.radixPoint).split(""),

						isFinite(opts.digits)) {

							var radixPosition = $.inArray(opts.radixPoint, processValue), rpb = $.inArray(opts.radixPoint, maskedValue);

							radixPosition === -1 && (processValue.push(opts.radixPoint), radixPosition = processValue.length - 1);

							for (var i = 1; i <= opts.digits; i++) opts.digitsOptional || void 0 !== processValue[radixPosition + i] && processValue[radixPosition + i] !== opts.placeholder.charAt(0) ? rpb !== -1 && void 0 !== maskedValue[rpb + i] && (processValue[radixPosition + i] = processValue[radixPosition + i] || maskedValue[rpb + i]) : processValue[radixPosition + i] = "0";

							processValue[processValue.length - 1] === opts.radixPoint && delete processValue[processValue.length - 1];

						}

						if (floatValue.toString() !== processValue && floatValue.toString() + "." !== processValue || isNegative) return processValue = (opts.prefix + processValue.join("")).split(""),

						!isNegative || 0 === floatValue && "blur" === e.type || (processValue.unshift(opts.negationSymbol.front),

						processValue.push(opts.negationSymbol.back)), opts.numericInput && (processValue = processValue.reverse()),

						rslt = opts.postFormat(processValue, opts.numericInput ? caretPos : caretPos - 1, opts),

						rslt.buffer && (rslt.refreshFromBuffer = rslt.buffer.join("") !== buffer.join("")),

						rslt;

					}

				}

				if (opts.autoGroup) return rslt = opts.postFormat(buffer, opts.numericInput ? caretPos : caretPos - 1, opts),

				rslt.caret = caretPos < (rslt.isNegative ? opts.negationSymbol.front.length : 0) + opts.prefix.length || caretPos > rslt.buffer.length - (rslt.isNegative ? opts.negationSymbol.back.length : 0) ? rslt.pos : rslt.pos + 1,

				rslt;

			},

			regex: {

				integerPart: function(opts) {

					return new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?\\d+");

				},

				integerNPart: function(opts) {

					return new RegExp("[\\d" + Inputmask.escapeRegex(opts.groupSeparator) + Inputmask.escapeRegex(opts.placeholder.charAt(0)) + "]+");

				}

			},

			signHandler: function(chrs, maskset, pos, strict, opts) {

				if (!strict && opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) {

					var matchRslt = maskset.buffer.join("").match(opts.regex.integerPart(opts));

					if (matchRslt && matchRslt[0].length > 0) return maskset.buffer[matchRslt.index] === ("-" === chrs ? "+" : opts.negationSymbol.front) ? "-" === chrs ? "" !== opts.negationSymbol.back ? {

						pos: 0,

						c: opts.negationSymbol.front,

						remove: 0,

						caret: pos,

						insert: {

							pos: maskset.buffer.length - 1,

							c: opts.negationSymbol.back

						}

					} : {

						pos: 0,

						c: opts.negationSymbol.front,

						remove: 0,

						caret: pos

					} : "" !== opts.negationSymbol.back ? {

						pos: 0,

						c: "+",

						remove: [ 0, maskset.buffer.length - 1 ],

						caret: pos

					} : {

						pos: 0,

						c: "+",

						remove: 0,

						caret: pos

					} : maskset.buffer[0] === ("-" === chrs ? opts.negationSymbol.front : "+") ? "-" === chrs && "" !== opts.negationSymbol.back ? {

						remove: [ 0, maskset.buffer.length - 1 ],

						caret: pos - 1

					} : {

						remove: 0,

						caret: pos - 1

					} : "-" === chrs ? "" !== opts.negationSymbol.back ? {

						pos: 0,

						c: opts.negationSymbol.front,

						caret: pos + 1,

						insert: {

							pos: maskset.buffer.length,

							c: opts.negationSymbol.back

						}

					} : {

						pos: 0,

						c: opts.negationSymbol.front,

						caret: pos + 1

					} : {

						pos: 0,

						c: chrs,

						caret: pos + 1

					};

				}

				return !1;

			},

			radixHandler: function(chrs, maskset, pos, strict, opts) {

				if (!strict && opts.numericInput !== !0 && chrs === opts.radixPoint && void 0 !== opts.digits && (isNaN(opts.digits) || parseInt(opts.digits) > 0)) {

					var radixPos = $.inArray(opts.radixPoint, maskset.buffer), integerValue = maskset.buffer.join("").match(opts.regex.integerPart(opts));

					if (radixPos !== -1 && maskset.validPositions[radixPos]) return maskset.validPositions[radixPos - 1] ? {

						caret: radixPos + 1

					} : {

						pos: integerValue.index,

						c: integerValue[0],

						caret: radixPos + 1

					};

					if (!integerValue || "0" === integerValue[0] && integerValue.index + 1 !== pos) return maskset.buffer[integerValue ? integerValue.index : pos] = "0",

					{

						pos: (integerValue ? integerValue.index : pos) + 1,

						c: opts.radixPoint

					};

				}

				return !1;

			},

			leadingZeroHandler: function(chrs, maskset, pos, strict, opts, isSelection) {

				if (!strict) {

					var initialPos = pos, buffer = opts.numericInput === !0 ? maskset.buffer.slice("").reverse() : maskset.buffer.slice("");

					opts.numericInput && (pos = buffer.join("").length - pos - 1), buffer.splice(0, opts.prefix.length),

					buffer.splice(buffer.length - opts.suffix.length, opts.suffix.length), pos -= opts.prefix.length;

					var radixPosition = $.inArray(opts.radixPoint, buffer), matchRslt = buffer.slice(0, radixPosition !== -1 ? radixPosition : void 0).join("").match(opts.regex.integerNPart(opts));

					if (matchRslt && (radixPosition === -1 || pos <= radixPosition || opts.numericInput)) {

						var decimalPart = radixPosition === -1 ? 0 : parseInt(buffer.slice(radixPosition + 1).join("")), leadingZero = 0 === matchRslt[0].indexOf("" !== opts.placeholder ? opts.placeholder.charAt(0) : "0");

						if (opts.numericInput) {

							if (leadingZero && 0 !== decimalPart && isSelection !== !0) return maskset.buffer.splice(buffer.length - matchRslt.index - 1 + opts.suffix.length, 1),

							{

								pos: initialPos,

								remove: buffer.length - matchRslt.index - 1 + opts.suffix.length

							};

						} else {

							if (leadingZero && (matchRslt.index + 1 === pos || isSelection !== !0 && 0 === decimalPart)) return maskset.buffer.splice(matchRslt.index + opts.prefix.length, 1),

							{

								pos: matchRslt.index + opts.prefix.length,

								remove: matchRslt.index + opts.prefix.length

							};

							if ("0" === chrs && pos <= matchRslt.index && matchRslt[0] !== opts.groupSeparator) return !1;

						}

					}

				}

				return !0;

			},

			definitions: {

				"~": {

					validator: function(chrs, maskset, pos, strict, opts, isSelection) {

						var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);

						if (!isValid && (isValid = opts.radixHandler(chrs, maskset, pos, strict, opts),

						!isValid && (isValid = strict ? new RegExp("[0-9" + Inputmask.escapeRegex(opts.groupSeparator) + "]").test(chrs) : new RegExp("[0-9]").test(chrs),

						isValid === !0 && (isValid = opts.leadingZeroHandler(chrs, maskset, pos, strict, opts, isSelection),

						isValid === !0 && opts.numericInput !== !0)))) {

							var radixPosition = $.inArray(opts.radixPoint, maskset.buffer);

							isValid = radixPosition !== -1 && (opts.digitsOptional === !1 || maskset.validPositions[pos]) && opts.numericInput !== !0 && pos > radixPosition && !strict ? {

								pos: pos,

								remove: pos

							} : {

								pos: pos

							};

						}

						return isValid;

					},

					cardinality: 1

				},

				"+": {

					validator: function(chrs, maskset, pos, strict, opts) {

						var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);

						return !isValid && (strict && opts.allowMinus && chrs === opts.negationSymbol.front || opts.allowMinus && "-" === chrs || opts.allowPlus && "+" === chrs) && (isValid = !(!strict && "-" === chrs) || ("" !== opts.negationSymbol.back ? {

							pos: pos,

							c: "-" === chrs ? opts.negationSymbol.front : "+",

							caret: pos + 1,

							insert: {

								pos: maskset.buffer.length,

								c: opts.negationSymbol.back

							}

						} : {

							pos: pos,

							c: "-" === chrs ? opts.negationSymbol.front : "+",

							caret: pos + 1

						})), isValid;

					},

					cardinality: 1,

					placeholder: ""

				},

				"-": {

					validator: function(chrs, maskset, pos, strict, opts) {

						var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);

						return !isValid && strict && opts.allowMinus && chrs === opts.negationSymbol.back && (isValid = !0),

						isValid;

					},

					cardinality: 1,

					placeholder: ""

				},

				":": {

					validator: function(chrs, maskset, pos, strict, opts) {

						var isValid = opts.signHandler(chrs, maskset, pos, strict, opts);

						if (!isValid) {

							var radix = "[" + Inputmask.escapeRegex(opts.radixPoint) + "]";

							isValid = new RegExp(radix).test(chrs), isValid && maskset.validPositions[pos] && maskset.validPositions[pos].match.placeholder === opts.radixPoint && (isValid = {

								caret: pos + 1

							});

						}

						return isValid;

					},

					cardinality: 1,

					placeholder: function(opts) {

						return opts.radixPoint;

					}

				}

			},

			onUnMask: function(maskedValue, unmaskedValue, opts) {

				if ("" === unmaskedValue && opts.nullable === !0) return unmaskedValue;

				var processValue = maskedValue.replace(opts.prefix, "");

				return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

				opts.unmaskAsNumber ? ("" !== opts.radixPoint && processValue.indexOf(opts.radixPoint) !== -1 && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")),

				Number(processValue)) : processValue;

			},

			isComplete: function(buffer, opts) {

				var maskedValue = buffer.join(""), bufClone = buffer.slice();

				if (opts.postFormat(bufClone, 0, opts), bufClone.join("") !== maskedValue) return !1;

				var processValue = maskedValue.replace(opts.prefix, "");

				return processValue = processValue.replace(opts.suffix, ""), processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

				"," === opts.radixPoint && (processValue = processValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")),

				isFinite(processValue);

			},

			onBeforeMask: function(initialValue, opts) {

				if (initialValue = initialValue.toString(), opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")),

				"" !== opts.radixPoint && isFinite(initialValue)) {

					var vs = initialValue.split("."), groupSize = "" !== opts.groupSeparator ? parseInt(opts.groupSize) : 0;

					2 === vs.length && (vs[0].length > groupSize || vs[1].length > groupSize) && (initialValue = initialValue.replace(".", opts.radixPoint));

				}

				var kommaMatches = initialValue.match(/,/g), dotMatches = initialValue.match(/\./g);

				if (dotMatches && kommaMatches ? dotMatches.length > kommaMatches.length ? (initialValue = initialValue.replace(/\./g, ""),

				initialValue = initialValue.replace(",", opts.radixPoint)) : kommaMatches.length > dotMatches.length ? (initialValue = initialValue.replace(/,/g, ""),

				initialValue = initialValue.replace(".", opts.radixPoint)) : initialValue = initialValue.indexOf(".") < initialValue.indexOf(",") ? initialValue.replace(/\./g, "") : initialValue = initialValue.replace(/,/g, "") : initialValue = initialValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),

				0 === opts.digits && (initialValue.indexOf(".") !== -1 ? initialValue = initialValue.substring(0, initialValue.indexOf(".")) : initialValue.indexOf(",") !== -1 && (initialValue = initialValue.substring(0, initialValue.indexOf(",")))),

				"" !== opts.radixPoint && isFinite(opts.digits) && initialValue.indexOf(opts.radixPoint) !== -1) {

					var valueParts = initialValue.split(opts.radixPoint), decPart = valueParts[1].match(new RegExp("\\d*"))[0];

					if (parseInt(opts.digits) < decPart.toString().length) {

						var digitsFactor = Math.pow(10, parseInt(opts.digits));

						initialValue = initialValue.replace(Inputmask.escapeRegex(opts.radixPoint), "."),

						initialValue = Math.round(parseFloat(initialValue) * digitsFactor) / digitsFactor,

						initialValue = initialValue.toString().replace(".", opts.radixPoint);

					}

				}

				return opts.numericInput === !0 && (initialValue = initialValue.split("").reverse().join("")),

				initialValue;

			},

			canClearPosition: function(maskset, position, lvp, strict, opts) {

				var positionInput = maskset.validPositions[position].input, canClear = positionInput !== opts.radixPoint || null !== maskset.validPositions[position].match.fn && opts.decimalProtect === !1 || isFinite(positionInput) || position === lvp || positionInput === opts.groupSeparator || positionInput === opts.negationSymbol.front || positionInput === opts.negationSymbol.back;

				return canClear;

			},

			onKeyDown: function(e, buffer, caretPos, opts) {

				var $input = $(this);

				if (e.ctrlKey) switch (e.keyCode) {

				  case Inputmask.keyCode.UP:

					$input.val(parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)), $input.trigger("setvalue");

					break;



				  case Inputmask.keyCode.DOWN:

					$input.val(parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)), $input.trigger("setvalue");

				}

			}

		},

		currency: {

			prefix: "$ ",

			groupSeparator: ",",

			alias: "numeric",

			placeholder: "0",

			autoGroup: !0,

			digits: 2,

			digitsOptional: !1,

			clearMaskOnLostFocus: !1

		},

		decimal: {

			alias: "numeric"

		},

		integer: {

			alias: "numeric",

			digits: 0,

			radixPoint: ""

		},

		percentage: {

			alias: "numeric",

			digits: 2,

			radixPoint: ".",

			placeholder: "0",

			autoGroup: !1,

			min: 0,

			max: 100,

			suffix: " %",

			allowPlus: !1,

			allowMinus: !1

		}

	}), Inputmask;

}(jQuery, Inputmask), function($, Inputmask) {

	function maskSort(a, b) {

		var maska = (a.mask || a).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""), maskb = (b.mask || b).replace(/#/g, "9").replace(/\)/, "9").replace(/[+()#-]/g, ""), maskas = (a.mask || a).split("#")[0], maskbs = (b.mask || b).split("#")[0];

		return 0 === maskbs.indexOf(maskas) ? -1 : 0 === maskas.indexOf(maskbs) ? 1 : maska.localeCompare(maskb);

	}

	var analyseMaskBase = Inputmask.prototype.analyseMask;

	return Inputmask.prototype.analyseMask = function(mask, opts) {

		function reduceVariations(masks, previousVariation, previousmaskGroup) {

			previousVariation = previousVariation || "", previousmaskGroup = previousmaskGroup || maskGroups,

			"" !== previousVariation && (previousmaskGroup[previousVariation] = {});

			for (var variation = "", maskGroup = previousmaskGroup[previousVariation] || previousmaskGroup, i = masks.length - 1; i >= 0; i--) mask = masks[i].mask || masks[i],

			variation = mask.substr(0, 1), maskGroup[variation] = maskGroup[variation] || [],

			maskGroup[variation].unshift(mask.substr(1)), masks.splice(i, 1);

			for (var ndx in maskGroup) maskGroup[ndx].length > 500 && reduceVariations(maskGroup[ndx].slice(), ndx, maskGroup);

		}

		function rebuild(maskGroup) {

			var mask = "", submasks = [];

			for (var ndx in maskGroup) $.isArray(maskGroup[ndx]) ? 1 === maskGroup[ndx].length ? submasks.push(ndx + maskGroup[ndx]) : submasks.push(ndx + opts.groupmarker.start + maskGroup[ndx].join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end) : submasks.push(ndx + rebuild(maskGroup[ndx]));

			return mask += 1 === submasks.length ? submasks[0] : opts.groupmarker.start + submasks.join(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start) + opts.groupmarker.end;

		}

		var maskGroups = {};

		opts.phoneCodes && opts.phoneCodes.length > 1e3 && (mask = mask.substr(1, mask.length - 2),

		reduceVariations(mask.split(opts.groupmarker.end + opts.alternatormarker + opts.groupmarker.start)),

		mask = rebuild(maskGroups));

		var mt = analyseMaskBase.call(this, mask, opts);

		return mt;

	}, Inputmask.extendAliases({

		abstractphone: {

			groupmarker: {

				start: "<",

				end: ">"

			},

			countrycode: "",

			phoneCodes: [],

			mask: function(opts) {

				return opts.definitions = {

					"#": opts.definitions[9]

				}, opts.phoneCodes.sort(maskSort);

			},

			keepStatic: !0,

			onBeforeMask: function(value, opts) {

				var processedValue = value.replace(/^0{1,2}/, "").replace(/[\s]/g, "");

				return (processedValue.indexOf(opts.countrycode) > 1 || processedValue.indexOf(opts.countrycode) === -1) && (processedValue = "+" + opts.countrycode + processedValue),

				processedValue;

			},

			onUnMask: function(maskedValue, unmaskedValue, opts) {

				return unmaskedValue;

			},

			inputmode: "tel"

		}

	}), Inputmask;

}(jQuery, Inputmask), function($, Inputmask) {

	return Inputmask.extendAliases({

		Regex: {

			mask: "r",

			greedy: !1,

			repeat: "*",

			regex: null,

			regexTokens: null,

			tokenizer: /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,

			quantifierFilter: /[0-9]+[^,]/,

			isComplete: function(buffer, opts) {

				return new RegExp(opts.regex).test(buffer.join(""));

			},

			definitions: {

				r: {

					validator: function(chrs, maskset, pos, strict, opts) {

						function RegexToken(isGroup, isQuantifier) {

							this.matches = [], this.isGroup = isGroup || !1, this.isQuantifier = isQuantifier || !1,

							this.quantifier = {

								min: 1,

								max: 1

							}, this.repeaterPart = void 0;

						}

						function analyseRegex() {

							var match, m, currentToken = new RegexToken(), opengroups = [];

							for (opts.regexTokens = []; match = opts.tokenizer.exec(opts.regex); ) switch (m = match[0],

							m.charAt(0)) {

							  case "(":

								opengroups.push(new RegexToken((!0)));

								break;



							  case ")":

								groupToken = opengroups.pop(), opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(groupToken) : currentToken.matches.push(groupToken);

								break;



							  case "{":

							  case "+":

							  case "*":

								var quantifierToken = new RegexToken((!1), (!0));

								m = m.replace(/[{}]/g, "");

								var mq = m.split(","), mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]), mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);

								if (quantifierToken.quantifier = {

									min: mq0,

									max: mq1

								}, opengroups.length > 0) {

									var matches = opengroups[opengroups.length - 1].matches;

									match = matches.pop(), match.isGroup || (groupToken = new RegexToken((!0)), groupToken.matches.push(match),

									match = groupToken), matches.push(match), matches.push(quantifierToken);

								} else match = currentToken.matches.pop(), match.isGroup || (groupToken = new RegexToken((!0)),

								groupToken.matches.push(match), match = groupToken), currentToken.matches.push(match),

								currentToken.matches.push(quantifierToken);

								break;



							  default:

								opengroups.length > 0 ? opengroups[opengroups.length - 1].matches.push(m) : currentToken.matches.push(m);

							}

							currentToken.matches.length > 0 && opts.regexTokens.push(currentToken);

						}

						function validateRegexToken(token, fromGroup) {

							var isvalid = !1;

							fromGroup && (regexPart += "(", openGroupCount++);

							for (var mndx = 0; mndx < token.matches.length; mndx++) {

								var matchToken = token.matches[mndx];

								if (matchToken.isGroup === !0) isvalid = validateRegexToken(matchToken, !0); else if (matchToken.isQuantifier === !0) {

									var crrntndx = $.inArray(matchToken, token.matches), matchGroup = token.matches[crrntndx - 1], regexPartBak = regexPart;

									if (isNaN(matchToken.quantifier.max)) {

										for (;matchToken.repeaterPart && matchToken.repeaterPart !== regexPart && matchToken.repeaterPart.length > regexPart.length && !(isvalid = validateRegexToken(matchGroup, !0)); ) ;

										isvalid = isvalid || validateRegexToken(matchGroup, !0), isvalid && (matchToken.repeaterPart = regexPart),

										regexPart = regexPartBak + matchToken.quantifier.max;

									} else {

										for (var i = 0, qm = matchToken.quantifier.max - 1; i < qm && !(isvalid = validateRegexToken(matchGroup, !0)); i++) ;

										regexPart = regexPartBak + "{" + matchToken.quantifier.min + "," + matchToken.quantifier.max + "}";

									}

								} else if (void 0 !== matchToken.matches) for (var k = 0; k < matchToken.length && !(isvalid = validateRegexToken(matchToken[k], fromGroup)); k++) ; else {

									var testExp;

									if ("[" == matchToken.charAt(0)) {

										testExp = regexPart, testExp += matchToken;

										for (var j = 0; j < openGroupCount; j++) testExp += ")";

										var exp = new RegExp("^(" + testExp + ")$");

										isvalid = exp.test(bufferStr);

									} else for (var l = 0, tl = matchToken.length; l < tl; l++) if ("\\" !== matchToken.charAt(l)) {

										testExp = regexPart, testExp += matchToken.substr(0, l + 1), testExp = testExp.replace(/\|$/, "");

										for (var j = 0; j < openGroupCount; j++) testExp += ")";

										var exp = new RegExp("^(" + testExp + ")$");

										if (isvalid = exp.test(bufferStr)) break;

									}

									regexPart += matchToken;

								}

								if (isvalid) break;

							}

							return fromGroup && (regexPart += ")", openGroupCount--), isvalid;

						}

						var bufferStr, groupToken, cbuffer = maskset.buffer.slice(), regexPart = "", isValid = !1, openGroupCount = 0;

						null === opts.regexTokens && analyseRegex(), cbuffer.splice(pos, 0, chrs), bufferStr = cbuffer.join("");

						for (var i = 0; i < opts.regexTokens.length; i++) {

							var regexToken = opts.regexTokens[i];

							if (isValid = validateRegexToken(regexToken, regexToken.isGroup)) break;

						}

						return isValid;

					},

					cardinality: 1

				}

			}

		}

	}), Inputmask;

}(jQuery, Inputmask);
//include _libs/carousel_slick/slick.js



// TweenMax

var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";_gsScope._gsDefine("TweenMax",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},r=function(t,e,i){var s,r,n=t.cycle;for(s in n)r=n[s],t[s]="function"==typeof r?r.call(e[i],i):r[i%r.length];delete t.cycle},n=function(t,e,s){i.call(this,t,e,s),this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._dirty=!0,this.render=n.prototype.render},a=1e-10,o=i._internals,l=o.isSelector,h=o.isArray,_=n.prototype=i.to({},.1,{}),u=[];n.version="1.18.0",_.constructor=n,_.kill()._gc=!1,n.killTweensOf=n.killDelayedCallsTo=i.killTweensOf,n.getTweensOf=i.getTweensOf,n.lagSmoothing=i.lagSmoothing,n.ticker=i.ticker,n.render=i.render,_.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),i.prototype.invalidate.call(this)},_.updateTo=function(t,e){var s,r=this.ratio,n=this.vars.immediateRender||t.immediateRender;e&&this._startTime<this._timeline._time&&(this._startTime=this._timeline._time,this._uncache(!1),this._gc?this._enabled(!0,!1):this._timeline.insert(this,this._startTime-this._delay));for(s in t)this.vars[s]=t[s];if(this._initted||n)if(e)this._initted=!1,n&&this.render(0,!0,!0);else if(this._gc&&this._enabled(!0,!1),this._notifyPluginsOfEnabled&&this._firstPT&&i._onPluginEvent("_onDisable",this),this._time/this._duration>.998){var a=this._time;this.render(0,!0,!1),this._initted=!1,this.render(a,!0,!1)}else if(this._time>0||n){this._initted=!1,this._init();for(var o,l=1/(1-r),h=this._firstPT;h;)o=h.s+h.c,h.c*=l,h.s=o-h.c,h=h._next}return this},_.render=function(t,e,i){this._initted||0===this._duration&&this.vars.repeat&&this.invalidate();var s,r,n,l,h,_,u,c,f=this._dirty?this.totalDuration():this._totalDuration,p=this._time,m=this._totalTime,d=this._cycle,g=this._duration,v=this._rawPrevTime;if(t>=f?(this._totalTime=f,this._cycle=this._repeat,this._yoyo&&0!==(1&this._cycle)?(this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0):(this._time=g,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1),this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===g&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>v||v===a)&&v!==t&&(i=!0,v>a&&(r="onReverseComplete")),this._rawPrevTime=c=!e||t||v===t?t:a)):1e-7>t?(this._totalTime=this._time=this._cycle=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==m||0===g&&v>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===g&&(this._initted||!this.vars.lazy||i)&&(v>=0&&(i=!0),this._rawPrevTime=c=!e||t||v===t?t:a)),this._initted||(i=!0)):(this._totalTime=this._time=t,0!==this._repeat&&(l=g+this._repeatDelay,this._cycle=this._totalTime/l>>0,0!==this._cycle&&this._cycle===this._totalTime/l&&this._cycle--,this._time=this._totalTime-this._cycle*l,this._yoyo&&0!==(1&this._cycle)&&(this._time=g-this._time),this._time>g?this._time=g:0>this._time&&(this._time=0)),this._easeType?(h=this._time/g,_=this._easeType,u=this._easePower,(1===_||3===_&&h>=.5)&&(h=1-h),3===_&&(h*=2),1===u?h*=h:2===u?h*=h*h:3===u?h*=h*h*h:4===u&&(h*=h*h*h*h),this.ratio=1===_?1-h:2===_?h:.5>this._time/g?h/2:1-h/2):this.ratio=this._ease.getRatio(this._time/g)),p===this._time&&!i&&d===this._cycle)return m!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=p,this._totalTime=m,this._rawPrevTime=v,this._cycle=d,o.lazyTweens.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/g):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==p&&t>=0&&(this._active=!0),0===m&&(2===this._initted&&t>0&&this._init(),this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._totalTime||0===g)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&this._startTime&&this._startAt.render(t,e,i),e||(this._totalTime!==m||s)&&this._callback("onUpdate")),this._cycle!==d&&(e||this._gc||this.vars.onRepeat&&this._callback("onRepeat")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&this._startTime&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===g&&this._rawPrevTime===a&&c!==a&&(this._rawPrevTime=0))},n.to=function(t,e,i){return new n(t,e,i)},n.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new n(t,e,i)},n.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new n(t,e,s)},n.staggerTo=n.allTo=function(t,e,a,o,_,c,f){o=o||0;var p,m,d,g,v=a.delay||0,y=[],T=function(){a.onComplete&&a.onComplete.apply(a.onCompleteScope||this,arguments),_.apply(f||a.callbackScope||this,c||u)},x=a.cycle,w=a.startAt&&a.startAt.cycle;for(h(t)||("string"==typeof t&&(t=i.selector(t)||t),l(t)&&(t=s(t))),t=t||[],0>o&&(t=s(t),t.reverse(),o*=-1),p=t.length-1,d=0;p>=d;d++){m={};for(g in a)m[g]=a[g];if(x&&r(m,t,d),w){w=m.startAt={};for(g in a.startAt)w[g]=a.startAt[g];r(m.startAt,t,d)}m.delay=v,d===p&&_&&(m.onComplete=T),y[d]=new n(t[d],e,m),v+=o}return y},n.staggerFrom=n.allFrom=function(t,e,i,s,r,a,o){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,n.staggerTo(t,e,i,s,r,a,o)},n.staggerFromTo=n.allFromTo=function(t,e,i,s,r,a,o,l){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,n.staggerTo(t,e,s,r,a,o,l)},n.delayedCall=function(t,e,i,s,r){return new n(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,useFrames:r,overwrite:0})},n.set=function(t,e){return new n(t,0,e)},n.isTweening=function(t){return i.getTweensOf(t,!0).length>0};var c=function(t,e){for(var s=[],r=0,n=t._first;n;)n instanceof i?s[r++]=n:(e&&(s[r++]=n),s=s.concat(c(n,e)),r=s.length),n=n._next;return s},f=n.getAllTweens=function(e){return c(t._rootTimeline,e).concat(c(t._rootFramesTimeline,e))};n.killAll=function(t,i,s,r){null==i&&(i=!0),null==s&&(s=!0);var n,a,o,l=f(0!=r),h=l.length,_=i&&s&&r;for(o=0;h>o;o++)a=l[o],(_||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&(t?a.totalTime(a._reversed?0:a.totalDuration()):a._enabled(!1,!1))},n.killChildTweensOf=function(t,e){if(null!=t){var r,a,_,u,c,f=o.tweenLookup;if("string"==typeof t&&(t=i.selector(t)||t),l(t)&&(t=s(t)),h(t))for(u=t.length;--u>-1;)n.killChildTweensOf(t[u],e);else{r=[];for(_ in f)for(a=f[_].target.parentNode;a;)a===t&&(r=r.concat(f[_].tweens)),a=a.parentNode;for(c=r.length,u=0;c>u;u++)e&&r[u].totalTime(r[u].totalDuration()),r[u]._enabled(!1,!1)}}};var p=function(t,i,s,r){i=i!==!1,s=s!==!1,r=r!==!1;for(var n,a,o=f(r),l=i&&s&&r,h=o.length;--h>-1;)a=o[h],(l||a instanceof e||(n=a.target===a.vars.onComplete)&&s||i&&!n)&&a.paused(t)};return n.pauseAll=function(t,e,i){p(!0,t,e,i)},n.resumeAll=function(t,e,i){p(!1,t,e,i)},n.globalTimeScale=function(e){var s=t._rootTimeline,r=i.ticker.time;return arguments.length?(e=e||a,s._startTime=r-(r-s._startTime)*s._timeScale/e,s=t._rootFramesTimeline,r=i.ticker.frame,s._startTime=r-(r-s._startTime)*s._timeScale/e,s._timeScale=t._rootTimeline._timeScale=e,e):s._timeScale},_.progress=function(t){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),!1):this._time/this.duration()},_.totalProgress=function(t){return arguments.length?this.totalTime(this.totalDuration()*t,!1):this._totalTime/this.totalDuration()},_.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},_.duration=function(e){return arguments.length?t.prototype.duration.call(this,e):this._duration},_.totalDuration=function(t){return arguments.length?-1===this._repeat?this:this.duration((t-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat,this._dirty=!1),this._totalDuration)},_.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},_.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},_.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},n},!0),_gsScope._gsDefine("TimelineLite",["core.Animation","core.SimpleTimeline","TweenLite"],function(t,e,i){var s=function(t){e.call(this,t),this._labels={},this.autoRemoveChildren=this.vars.autoRemoveChildren===!0,this.smoothChildTiming=this.vars.smoothChildTiming===!0,this._sortChildren=!0,this._onUpdate=this.vars.onUpdate;var i,s,r=this.vars;for(s in r)i=r[s],l(i)&&-1!==i.join("").indexOf("{self}")&&(r[s]=this._swapSelfInParams(i));l(r.tweens)&&this.add(r.tweens,0,r.align,r.stagger)},r=1e-10,n=i._internals,a=s._internals={},o=n.isSelector,l=n.isArray,h=n.lazyTweens,_=n.lazyRender,u=_gsScope._gsDefine.globals,c=function(t){var e,i={};for(e in t)i[e]=t[e];return i},f=function(t,e,i){var s,r,n=t.cycle;for(s in n)r=n[s],t[s]="function"==typeof r?r.call(e[i],i):r[i%r.length];delete t.cycle},p=a.pauseCallback=function(){},m=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},d=s.prototype=new e;return s.version="1.18.0",d.constructor=s,d.kill()._gc=d._forcingPlayhead=d._hasPause=!1,d.to=function(t,e,s,r){var n=s.repeat&&u.TweenMax||i;return e?this.add(new n(t,e,s),r):this.set(t,s,r)},d.from=function(t,e,s,r){return this.add((s.repeat&&u.TweenMax||i).from(t,e,s),r)},d.fromTo=function(t,e,s,r,n){var a=r.repeat&&u.TweenMax||i;return e?this.add(a.fromTo(t,e,s,r),n):this.set(t,r,n)},d.staggerTo=function(t,e,r,n,a,l,h,_){var u,p,d=new s({onComplete:l,onCompleteParams:h,callbackScope:_,smoothChildTiming:this.smoothChildTiming}),g=r.cycle;for("string"==typeof t&&(t=i.selector(t)||t),t=t||[],o(t)&&(t=m(t)),n=n||0,0>n&&(t=m(t),t.reverse(),n*=-1),p=0;t.length>p;p++)u=c(r),u.startAt&&(u.startAt=c(u.startAt),u.startAt.cycle&&f(u.startAt,t,p)),g&&f(u,t,p),d.to(t[p],e,u,p*n);return this.add(d,a)},d.staggerFrom=function(t,e,i,s,r,n,a,o){return i.immediateRender=0!=i.immediateRender,i.runBackwards=!0,this.staggerTo(t,e,i,s,r,n,a,o)},d.staggerFromTo=function(t,e,i,s,r,n,a,o,l){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,this.staggerTo(t,e,s,r,n,a,o,l)},d.call=function(t,e,s,r){return this.add(i.delayedCall(0,t,e,s),r)},d.set=function(t,e,s){return s=this._parseTimeOrLabel(s,0,!0),null==e.immediateRender&&(e.immediateRender=s===this._time&&!this._paused),this.add(new i(t,0,e),s)},s.exportRoot=function(t,e){t=t||{},null==t.smoothChildTiming&&(t.smoothChildTiming=!0);var r,n,a=new s(t),o=a._timeline;for(null==e&&(e=!0),o._remove(a,!0),a._startTime=0,a._rawPrevTime=a._time=a._totalTime=o._time,r=o._first;r;)n=r._next,e&&r instanceof i&&r.target===r.vars.onComplete||a.add(r,r._startTime-r._delay),r=n;return o.add(a,0),a},d.add=function(r,n,a,o){var h,_,u,c,f,p;if("number"!=typeof n&&(n=this._parseTimeOrLabel(n,0,!0,r)),!(r instanceof t)){if(r instanceof Array||r&&r.push&&l(r)){for(a=a||"normal",o=o||0,h=n,_=r.length,u=0;_>u;u++)l(c=r[u])&&(c=new s({tweens:c})),this.add(c,h),"string"!=typeof c&&"function"!=typeof c&&("sequence"===a?h=c._startTime+c.totalDuration()/c._timeScale:"start"===a&&(c._startTime-=c.delay())),h+=o;return this._uncache(!0)}if("string"==typeof r)return this.addLabel(r,n);if("function"!=typeof r)throw"Cannot add "+r+" into the timeline; it is not a tween, timeline, function, or string.";r=i.delayedCall(0,r)}if(e.prototype.add.call(this,r,n),(this._gc||this._time===this._duration)&&!this._paused&&this._duration<this.duration())for(f=this,p=f.rawTime()>r._startTime;f._timeline;)p&&f._timeline.smoothChildTiming?f.totalTime(f._totalTime,!0):f._gc&&f._enabled(!0,!1),f=f._timeline;return this},d.remove=function(e){if(e instanceof t){this._remove(e,!1);var i=e._timeline=e.vars.useFrames?t._rootFramesTimeline:t._rootTimeline;return e._startTime=(e._paused?e._pauseTime:i._time)-(e._reversed?e.totalDuration()-e._totalTime:e._totalTime)/e._timeScale,this}if(e instanceof Array||e&&e.push&&l(e)){for(var s=e.length;--s>-1;)this.remove(e[s]);return this}return"string"==typeof e?this.removeLabel(e):this.kill(null,e)},d._remove=function(t,i){e.prototype._remove.call(this,t,i);var s=this._last;return s?this._time>s._startTime+s._totalDuration/s._timeScale&&(this._time=this.duration(),this._totalTime=this._totalDuration):this._time=this._totalTime=this._duration=this._totalDuration=0,this},d.append=function(t,e){return this.add(t,this._parseTimeOrLabel(null,e,!0,t))},d.insert=d.insertMultiple=function(t,e,i,s){return this.add(t,e||0,i,s)},d.appendMultiple=function(t,e,i,s){return this.add(t,this._parseTimeOrLabel(null,e,!0,t),i,s)},d.addLabel=function(t,e){return this._labels[t]=this._parseTimeOrLabel(e),this},d.addPause=function(t,e,s,r){var n=i.delayedCall(0,p,s,r||this);return n.vars.onComplete=n.vars.onReverseComplete=e,n.data="isPause",this._hasPause=!0,this.add(n,t)},d.removeLabel=function(t){return delete this._labels[t],this},d.getLabelTime=function(t){return null!=this._labels[t]?this._labels[t]:-1},d._parseTimeOrLabel=function(e,i,s,r){var n;if(r instanceof t&&r.timeline===this)this.remove(r);else if(r&&(r instanceof Array||r.push&&l(r)))for(n=r.length;--n>-1;)r[n]instanceof t&&r[n].timeline===this&&this.remove(r[n]);if("string"==typeof i)return this._parseTimeOrLabel(i,s&&"number"==typeof e&&null==this._labels[i]?e-this.duration():0,s);if(i=i||0,"string"!=typeof e||!isNaN(e)&&null==this._labels[e])null==e&&(e=this.duration());else{if(n=e.indexOf("="),-1===n)return null==this._labels[e]?s?this._labels[e]=this.duration()+i:i:this._labels[e]+i;i=parseInt(e.charAt(n-1)+"1",10)*Number(e.substr(n+1)),e=n>1?this._parseTimeOrLabel(e.substr(0,n-1),0,s):this.duration()}return Number(e)+i},d.seek=function(t,e){return this.totalTime("number"==typeof t?t:this._parseTimeOrLabel(t),e!==!1)},d.stop=function(){return this.paused(!0)},d.gotoAndPlay=function(t,e){return this.play(t,e)},d.gotoAndStop=function(t,e){return this.pause(t,e)},d.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,a,o,l,u,c=this._dirty?this.totalDuration():this._totalDuration,f=this._time,p=this._startTime,m=this._timeScale,d=this._paused;if(t>=c)this._totalTime=this._time=c,this._reversed||this._hasPausedChild()||(n=!0,o="onComplete",l=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>this._rawPrevTime||this._rawPrevTime===r)&&this._rawPrevTime!==t&&this._first&&(l=!0,this._rawPrevTime>r&&(o="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,t=c+1e-4;else if(1e-7>t)if(this._totalTime=this._time=0,(0!==f||0===this._duration&&this._rawPrevTime!==r&&(this._rawPrevTime>0||0>t&&this._rawPrevTime>=0))&&(o="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(l=n=!0,o="onReverseComplete"):this._rawPrevTime>=0&&this._first&&(l=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(l=!0)}else{if(this._hasPause&&!this._forcingPlayhead&&!e){if(t>=f)for(s=this._first;s&&t>=s._startTime&&!u;)s._duration||"isPause"!==s.data||s.ratio||0===s._startTime&&0===this._rawPrevTime||(u=s),s=s._next;else for(s=this._last;s&&s._startTime>=t&&!u;)s._duration||"isPause"===s.data&&s._rawPrevTime>0&&(u=s),s=s._prev;u&&(this._time=t=u._startTime,this._totalTime=t+this._cycle*(this._totalDuration+this._repeatDelay))}this._totalTime=this._time=this._rawPrevTime=t}if(this._time!==f&&this._first||i||l||u){if(this._initted||(this._initted=!0),this._active||!this._paused&&this._time!==f&&t>0&&(this._active=!0),0===f&&this.vars.onStart&&0!==this._time&&(e||this._callback("onStart")),this._time>=f)for(s=this._first;s&&(a=s._next,!this._paused||d);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(u===s&&this.pause(),s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=a;else for(s=this._last;s&&(a=s._prev,!this._paused||d);){if(s._active||f>=s._startTime&&!s._paused&&!s._gc){if(u===s){for(u=s._prev;u&&u.endTime()>this._time;)u.render(u._reversed?u.totalDuration()-(t-u._startTime)*u._timeScale:(t-u._startTime)*u._timeScale,e,i),u=u._prev;u=null,this.pause()}s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)}s=a}this._onUpdate&&(e||(h.length&&_(),this._callback("onUpdate"))),o&&(this._gc||(p===this._startTime||m!==this._timeScale)&&(0===this._time||c>=this.totalDuration())&&(n&&(h.length&&_(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[o]&&this._callback(o)))}},d._hasPausedChild=function(){for(var t=this._first;t;){if(t._paused||t instanceof s&&t._hasPausedChild())return!0;t=t._next}return!1},d.getChildren=function(t,e,s,r){r=r||-9999999999;for(var n=[],a=this._first,o=0;a;)r>a._startTime||(a instanceof i?e!==!1&&(n[o++]=a):(s!==!1&&(n[o++]=a),t!==!1&&(n=n.concat(a.getChildren(!0,e,s)),o=n.length))),a=a._next;return n},d.getTweensOf=function(t,e){var s,r,n=this._gc,a=[],o=0;for(n&&this._enabled(!0,!0),s=i.getTweensOf(t),r=s.length;--r>-1;)(s[r].timeline===this||e&&this._contains(s[r]))&&(a[o++]=s[r]);return n&&this._enabled(!1,!0),a},d.recent=function(){return this._recent},d._contains=function(t){for(var e=t.timeline;e;){if(e===this)return!0;e=e.timeline}return!1},d.shiftChildren=function(t,e,i){i=i||0;for(var s,r=this._first,n=this._labels;r;)r._startTime>=i&&(r._startTime+=t),r=r._next;if(e)for(s in n)n[s]>=i&&(n[s]+=t);return this._uncache(!0)},d._kill=function(t,e){if(!t&&!e)return this._enabled(!1,!1);for(var i=e?this.getTweensOf(e):this.getChildren(!0,!0,!1),s=i.length,r=!1;--s>-1;)i[s]._kill(t,e)&&(r=!0);return r},d.clear=function(t){var e=this.getChildren(!1,!0,!0),i=e.length;for(this._time=this._totalTime=0;--i>-1;)e[i]._enabled(!1,!1);return t!==!1&&(this._labels={}),this._uncache(!0)},d.invalidate=function(){for(var e=this._first;e;)e.invalidate(),e=e._next;return t.prototype.invalidate.call(this)},d._enabled=function(t,i){if(t===this._gc)for(var s=this._first;s;)s._enabled(t,!0),s=s._next;return e.prototype._enabled.call(this,t,i)},d.totalTime=function(){this._forcingPlayhead=!0;var e=t.prototype.totalTime.apply(this,arguments);return this._forcingPlayhead=!1,e},d.duration=function(t){return arguments.length?(0!==this.duration()&&0!==t&&this.timeScale(this._duration/t),this):(this._dirty&&this.totalDuration(),this._duration)},d.totalDuration=function(t){if(!arguments.length){if(this._dirty){for(var e,i,s=0,r=this._last,n=999999999999;r;)e=r._prev,r._dirty&&r.totalDuration(),r._startTime>n&&this._sortChildren&&!r._paused?this.add(r,r._startTime-r._delay):n=r._startTime,0>r._startTime&&!r._paused&&(s-=r._startTime,this._timeline.smoothChildTiming&&(this._startTime+=r._startTime/this._timeScale),this.shiftChildren(-r._startTime,!1,-9999999999),n=0),i=r._startTime+r._totalDuration/r._timeScale,i>s&&(s=i),r=e;this._duration=this._totalDuration=s,this._dirty=!1}return this._totalDuration}return 0!==this.totalDuration()&&0!==t&&this.timeScale(this._totalDuration/t),this},d.paused=function(e){if(!e)for(var i=this._first,s=this._time;i;)i._startTime===s&&"isPause"===i.data&&(i._rawPrevTime=0),i=i._next;return t.prototype.paused.apply(this,arguments)},d.usesFrames=function(){for(var e=this._timeline;e._timeline;)e=e._timeline;return e===t._rootFramesTimeline},d.rawTime=function(){return this._paused?this._totalTime:(this._timeline.rawTime()-this._startTime)*this._timeScale},s},!0),_gsScope._gsDefine("TimelineMax",["TimelineLite","TweenLite","easing.Ease"],function(t,e,i){var s=function(e){t.call(this,e),this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._cycle=0,this._yoyo=this.vars.yoyo===!0,this._dirty=!0},r=1e-10,n=e._internals,a=n.lazyTweens,o=n.lazyRender,l=new i(null,null,1,0),h=s.prototype=new t;return h.constructor=s,h.kill()._gc=!1,s.version="1.18.0",h.invalidate=function(){return this._yoyo=this.vars.yoyo===!0,this._repeat=this.vars.repeat||0,this._repeatDelay=this.vars.repeatDelay||0,this._uncache(!0),t.prototype.invalidate.call(this)},h.addCallback=function(t,i,s,r){return this.add(e.delayedCall(0,t,s,r),i)},h.removeCallback=function(t,e){if(t)if(null==e)this._kill(null,t);else for(var i=this.getTweensOf(t,!1),s=i.length,r=this._parseTimeOrLabel(e);--s>-1;)i[s]._startTime===r&&i[s]._enabled(!1,!1);return this},h.removePause=function(e){return this.removeCallback(t._internals.pauseCallback,e)},h.tweenTo=function(t,i){i=i||{};var s,r,n,a={ease:l,useFrames:this.usesFrames(),immediateRender:!1};for(r in i)a[r]=i[r];return a.time=this._parseTimeOrLabel(t),s=Math.abs(Number(a.time)-this._time)/this._timeScale||.001,n=new e(this,s,a),a.onStart=function(){n.target.paused(!0),n.vars.time!==n.target.time()&&s===n.duration()&&n.duration(Math.abs(n.vars.time-n.target.time())/n.target._timeScale),i.onStart&&n._callback("onStart")},n},h.tweenFromTo=function(t,e,i){i=i||{},t=this._parseTimeOrLabel(t),i.startAt={onComplete:this.seek,onCompleteParams:[t],callbackScope:this},i.immediateRender=i.immediateRender!==!1;var s=this.tweenTo(e,i);return s.duration(Math.abs(s.vars.time-t)/this._timeScale||.001)},h.render=function(t,e,i){this._gc&&this._enabled(!0,!1);var s,n,l,h,_,u,c,f=this._dirty?this.totalDuration():this._totalDuration,p=this._duration,m=this._time,d=this._totalTime,g=this._startTime,v=this._timeScale,y=this._rawPrevTime,T=this._paused,x=this._cycle;if(t>=f)this._locked||(this._totalTime=f,this._cycle=this._repeat),this._reversed||this._hasPausedChild()||(n=!0,h="onComplete",_=!!this._timeline.autoRemoveChildren,0===this._duration&&(0===t||0>y||y===r)&&y!==t&&this._first&&(_=!0,y>r&&(h="onReverseComplete"))),this._rawPrevTime=this._duration||!e||t||this._rawPrevTime===t?t:r,this._yoyo&&0!==(1&this._cycle)?this._time=t=0:(this._time=p,t=p+1e-4);else if(1e-7>t)if(this._locked||(this._totalTime=this._cycle=0),this._time=0,(0!==m||0===p&&y!==r&&(y>0||0>t&&y>=0)&&!this._locked)&&(h="onReverseComplete",n=this._reversed),0>t)this._active=!1,this._timeline.autoRemoveChildren&&this._reversed?(_=n=!0,h="onReverseComplete"):y>=0&&this._first&&(_=!0),this._rawPrevTime=t;else{if(this._rawPrevTime=p||!e||t||this._rawPrevTime===t?t:r,0===t&&n)for(s=this._first;s&&0===s._startTime;)s._duration||(n=!1),s=s._next;t=0,this._initted||(_=!0)}else if(0===p&&0>y&&(_=!0),this._time=this._rawPrevTime=t,this._locked||(this._totalTime=t,0!==this._repeat&&(u=p+this._repeatDelay,this._cycle=this._totalTime/u>>0,0!==this._cycle&&this._cycle===this._totalTime/u&&this._cycle--,this._time=this._totalTime-this._cycle*u,this._yoyo&&0!==(1&this._cycle)&&(this._time=p-this._time),this._time>p?(this._time=p,t=p+1e-4):0>this._time?this._time=t=0:t=this._time)),this._hasPause&&!this._forcingPlayhead&&!e){if(t=this._time,t>=m)for(s=this._first;s&&t>=s._startTime&&!c;)s._duration||"isPause"!==s.data||s.ratio||0===s._startTime&&0===this._rawPrevTime||(c=s),s=s._next;else for(s=this._last;s&&s._startTime>=t&&!c;)s._duration||"isPause"===s.data&&s._rawPrevTime>0&&(c=s),s=s._prev;c&&(this._time=t=c._startTime,this._totalTime=t+this._cycle*(this._totalDuration+this._repeatDelay))}if(this._cycle!==x&&!this._locked){var w=this._yoyo&&0!==(1&x),b=w===(this._yoyo&&0!==(1&this._cycle)),P=this._totalTime,k=this._cycle,S=this._rawPrevTime,R=this._time;if(this._totalTime=x*p,x>this._cycle?w=!w:this._totalTime+=p,this._time=m,this._rawPrevTime=0===p?y-1e-4:y,this._cycle=x,this._locked=!0,m=w?0:p,this.render(m,e,0===p),e||this._gc||this.vars.onRepeat&&this._callback("onRepeat"),b&&(m=w?p+1e-4:-1e-4,this.render(m,!0,!1)),this._locked=!1,this._paused&&!T)return;this._time=R,this._totalTime=P,this._cycle=k,this._rawPrevTime=S}if(!(this._time!==m&&this._first||i||_||c))return d!==this._totalTime&&this._onUpdate&&(e||this._callback("onUpdate")),void 0;if(this._initted||(this._initted=!0),this._active||!this._paused&&this._totalTime!==d&&t>0&&(this._active=!0),0===d&&this.vars.onStart&&0!==this._totalTime&&(e||this._callback("onStart")),this._time>=m)for(s=this._first;s&&(l=s._next,!this._paused||T);)(s._active||s._startTime<=this._time&&!s._paused&&!s._gc)&&(c===s&&this.pause(),s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)),s=l;else for(s=this._last;s&&(l=s._prev,!this._paused||T);){if(s._active||m>=s._startTime&&!s._paused&&!s._gc){if(c===s){for(c=s._prev;c&&c.endTime()>this._time;)c.render(c._reversed?c.totalDuration()-(t-c._startTime)*c._timeScale:(t-c._startTime)*c._timeScale,e,i),c=c._prev;c=null,this.pause()}s._reversed?s.render((s._dirty?s.totalDuration():s._totalDuration)-(t-s._startTime)*s._timeScale,e,i):s.render((t-s._startTime)*s._timeScale,e,i)}s=l}this._onUpdate&&(e||(a.length&&o(),this._callback("onUpdate"))),h&&(this._locked||this._gc||(g===this._startTime||v!==this._timeScale)&&(0===this._time||f>=this.totalDuration())&&(n&&(a.length&&o(),this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[h]&&this._callback(h)))},h.getActive=function(t,e,i){null==t&&(t=!0),null==e&&(e=!0),null==i&&(i=!1);var s,r,n=[],a=this.getChildren(t,e,i),o=0,l=a.length;for(s=0;l>s;s++)r=a[s],r.isActive()&&(n[o++]=r);return n},h.getLabelAfter=function(t){t||0!==t&&(t=this._time);var e,i=this.getLabelsArray(),s=i.length;for(e=0;s>e;e++)if(i[e].time>t)return i[e].name;return null},h.getLabelBefore=function(t){null==t&&(t=this._time);for(var e=this.getLabelsArray(),i=e.length;--i>-1;)if(t>e[i].time)return e[i].name;return null},h.getLabelsArray=function(){var t,e=[],i=0;for(t in this._labels)e[i++]={time:this._labels[t],name:t};return e.sort(function(t,e){return t.time-e.time}),e},h.progress=function(t,e){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&0!==(1&this._cycle)?1-t:t)+this._cycle*(this._duration+this._repeatDelay),e):this._time/this.duration()},h.totalProgress=function(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this._totalTime/this.totalDuration()},h.totalDuration=function(e){return arguments.length?-1===this._repeat?this:this.duration((e-this._repeat*this._repeatDelay)/(this._repeat+1)):(this._dirty&&(t.prototype.totalDuration.call(this),this._totalDuration=-1===this._repeat?999999999999:this._duration*(this._repeat+1)+this._repeatDelay*this._repeat),this._totalDuration)},h.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),t>this._duration&&(t=this._duration),this._yoyo&&0!==(1&this._cycle)?t=this._duration-t+this._cycle*(this._duration+this._repeatDelay):0!==this._repeat&&(t+=this._cycle*(this._duration+this._repeatDelay)),this.totalTime(t,e)):this._time},h.repeat=function(t){return arguments.length?(this._repeat=t,this._uncache(!0)):this._repeat},h.repeatDelay=function(t){return arguments.length?(this._repeatDelay=t,this._uncache(!0)):this._repeatDelay},h.yoyo=function(t){return arguments.length?(this._yoyo=t,this):this._yoyo},h.currentLabel=function(t){return arguments.length?this.seek(t,!0):this.getLabelBefore(this._time+1e-8)},s},!0),function(){var t=180/Math.PI,e=[],i=[],s=[],r={},n=_gsScope._gsDefine.globals,a=function(t,e,i,s){this.a=t,this.b=e,this.c=i,this.d=s,this.da=s-t,this.ca=i-t,this.ba=e-t},o=",x,y,z,left,top,right,bottom,marginTop,marginLeft,marginRight,marginBottom,paddingLeft,paddingTop,paddingRight,paddingBottom,backgroundPosition,backgroundPosition_y,",l=function(t,e,i,s){var r={a:t},n={},a={},o={c:s},l=(t+e)/2,h=(e+i)/2,_=(i+s)/2,u=(l+h)/2,c=(h+_)/2,f=(c-u)/8;return r.b=l+(t-l)/4,n.b=u+f,r.c=n.a=(r.b+n.b)/2,n.c=a.a=(u+c)/2,a.b=c-f,o.b=_+(s-_)/4,a.c=o.a=(a.b+o.b)/2,[r,n,a,o]},h=function(t,r,n,a,o){var h,_,u,c,f,p,m,d,g,v,y,T,x,w=t.length-1,b=0,P=t[0].a;for(h=0;w>h;h++)f=t[b],_=f.a,u=f.d,c=t[b+1].d,o?(y=e[h],T=i[h],x=.25*(T+y)*r/(a?.5:s[h]||.5),p=u-(u-_)*(a?.5*r:0!==y?x/y:0),m=u+(c-u)*(a?.5*r:0!==T?x/T:0),d=u-(p+((m-p)*(3*y/(y+T)+.5)/4||0))):(p=u-.5*(u-_)*r,m=u+.5*(c-u)*r,d=u-(p+m)/2),p+=d,m+=d,f.c=g=p,f.b=0!==h?P:P=f.a+.6*(f.c-f.a),f.da=u-_,f.ca=g-_,f.ba=P-_,n?(v=l(_,P,g,u),t.splice(b,1,v[0],v[1],v[2],v[3]),b+=4):b++,P=m;f=t[b],f.b=P,f.c=P+.4*(f.d-P),f.da=f.d-f.a,f.ca=f.c-f.a,f.ba=P-f.a,n&&(v=l(f.a,P,f.c,f.d),t.splice(b,1,v[0],v[1],v[2],v[3]))},_=function(t,s,r,n){var o,l,h,_,u,c,f=[];if(n)for(t=[n].concat(t),l=t.length;--l>-1;)"string"==typeof(c=t[l][s])&&"="===c.charAt(1)&&(t[l][s]=n[s]+Number(c.charAt(0)+c.substr(2)));if(o=t.length-2,0>o)return f[0]=new a(t[0][s],0,0,t[-1>o?0:1][s]),f;for(l=0;o>l;l++)h=t[l][s],_=t[l+1][s],f[l]=new a(h,0,0,_),r&&(u=t[l+2][s],e[l]=(e[l]||0)+(_-h)*(_-h),i[l]=(i[l]||0)+(u-_)*(u-_));return f[l]=new a(t[l][s],0,0,t[l+1][s]),f},u=function(t,n,a,l,u,c){var f,p,m,d,g,v,y,T,x={},w=[],b=c||t[0];u="string"==typeof u?","+u+",":o,null==n&&(n=1);for(p in t[0])w.push(p);if(t.length>1){for(T=t[t.length-1],y=!0,f=w.length;--f>-1;)if(p=w[f],Math.abs(b[p]-T[p])>.05){y=!1;break}y&&(t=t.concat(),c&&t.unshift(c),t.push(t[1]),c=t[t.length-3])}for(e.length=i.length=s.length=0,f=w.length;--f>-1;)p=w[f],r[p]=-1!==u.indexOf(","+p+","),x[p]=_(t,p,r[p],c);for(f=e.length;--f>-1;)e[f]=Math.sqrt(e[f]),i[f]=Math.sqrt(i[f]);if(!l){for(f=w.length;--f>-1;)if(r[p])for(m=x[w[f]],v=m.length-1,d=0;v>d;d++)g=m[d+1].da/i[d]+m[d].da/e[d],s[d]=(s[d]||0)+g*g;for(f=s.length;--f>-1;)s[f]=Math.sqrt(s[f])}for(f=w.length,d=a?4:1;--f>-1;)p=w[f],m=x[p],h(m,n,a,l,r[p]),y&&(m.splice(0,d),m.splice(m.length-d,d));return x},c=function(t,e,i){e=e||"soft";var s,r,n,o,l,h,_,u,c,f,p,m={},d="cubic"===e?3:2,g="soft"===e,v=[];if(g&&i&&(t=[i].concat(t)),null==t||d+1>t.length)throw"invalid Bezier data";for(c in t[0])v.push(c);for(h=v.length;--h>-1;){for(c=v[h],m[c]=l=[],f=0,u=t.length,_=0;u>_;_++)s=null==i?t[_][c]:"string"==typeof(p=t[_][c])&&"="===p.charAt(1)?i[c]+Number(p.charAt(0)+p.substr(2)):Number(p),g&&_>1&&u-1>_&&(l[f++]=(s+l[f-2])/2),l[f++]=s;for(u=f-d+1,f=0,_=0;u>_;_+=d)s=l[_],r=l[_+1],n=l[_+2],o=2===d?0:l[_+3],l[f++]=p=3===d?new a(s,r,n,o):new a(s,(2*r+s)/3,(2*r+n)/3,n);l.length=f}return m},f=function(t,e,i){for(var s,r,n,a,o,l,h,_,u,c,f,p=1/i,m=t.length;--m>-1;)for(c=t[m],n=c.a,a=c.d-n,o=c.c-n,l=c.b-n,s=r=0,_=1;i>=_;_++)h=p*_,u=1-h,s=r-(r=(h*h*a+3*u*(h*o+u*l))*h),f=m*i+_-1,e[f]=(e[f]||0)+s*s},p=function(t,e){e=e>>0||6;var i,s,r,n,a=[],o=[],l=0,h=0,_=e-1,u=[],c=[];for(i in t)f(t[i],a,e);for(r=a.length,s=0;r>s;s++)l+=Math.sqrt(a[s]),n=s%e,c[n]=l,n===_&&(h+=l,n=s/e>>0,u[n]=c,o[n]=h,l=0,c=[]);return{length:h,lengths:o,segments:u}},m=_gsScope._gsDefine.plugin({propName:"bezier",priority:-1,version:"1.3.4",API:2,global:!0,init:function(t,e,i){this._target=t,e instanceof Array&&(e={values:e}),this._func={},this._round={},this._props=[],this._timeRes=null==e.timeResolution?6:parseInt(e.timeResolution,10);var s,r,n,a,o,l=e.values||[],h={},_=l[0],f=e.autoRotate||i.vars.orientToBezier;this._autoRotate=f?f instanceof Array?f:[["x","y","rotation",f===!0?0:Number(f)||0]]:null;

for(s in _)this._props.push(s);for(n=this._props.length;--n>-1;)s=this._props[n],this._overwriteProps.push(s),r=this._func[s]="function"==typeof t[s],h[s]=r?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]():parseFloat(t[s]),o||h[s]!==l[0][s]&&(o=h);if(this._beziers="cubic"!==e.type&&"quadratic"!==e.type&&"soft"!==e.type?u(l,isNaN(e.curviness)?1:e.curviness,!1,"thruBasic"===e.type,e.correlate,o):c(l,e.type,h),this._segCount=this._beziers[s].length,this._timeRes){var m=p(this._beziers,this._timeRes);this._length=m.length,this._lengths=m.lengths,this._segments=m.segments,this._l1=this._li=this._s1=this._si=0,this._l2=this._lengths[0],this._curSeg=this._segments[0],this._s2=this._curSeg[0],this._prec=1/this._curSeg.length}if(f=this._autoRotate)for(this._initialRotations=[],f[0]instanceof Array||(this._autoRotate=f=[f]),n=f.length;--n>-1;){for(a=0;3>a;a++)s=f[n][a],this._func[s]="function"==typeof t[s]?t[s.indexOf("set")||"function"!=typeof t["get"+s.substr(3)]?s:"get"+s.substr(3)]:!1;s=f[n][2],this._initialRotations[n]=this._func[s]?this._func[s].call(this._target):this._target[s]}return this._startRatio=i.vars.runBackwards?1:0,!0},set:function(e){var i,s,r,n,a,o,l,h,_,u,c=this._segCount,f=this._func,p=this._target,m=e!==this._startRatio;if(this._timeRes){if(_=this._lengths,u=this._curSeg,e*=this._length,r=this._li,e>this._l2&&c-1>r){for(h=c-1;h>r&&e>=(this._l2=_[++r]););this._l1=_[r-1],this._li=r,this._curSeg=u=this._segments[r],this._s2=u[this._s1=this._si=0]}else if(this._l1>e&&r>0){for(;r>0&&(this._l1=_[--r])>=e;);0===r&&this._l1>e?this._l1=0:r++,this._l2=_[r],this._li=r,this._curSeg=u=this._segments[r],this._s1=u[(this._si=u.length-1)-1]||0,this._s2=u[this._si]}if(i=r,e-=this._l1,r=this._si,e>this._s2&&u.length-1>r){for(h=u.length-1;h>r&&e>=(this._s2=u[++r]););this._s1=u[r-1],this._si=r}else if(this._s1>e&&r>0){for(;r>0&&(this._s1=u[--r])>=e;);0===r&&this._s1>e?this._s1=0:r++,this._s2=u[r],this._si=r}o=(r+(e-this._s1)/(this._s2-this._s1))*this._prec}else i=0>e?0:e>=1?c-1:c*e>>0,o=(e-i*(1/c))*c;for(s=1-o,r=this._props.length;--r>-1;)n=this._props[r],a=this._beziers[n][i],l=(o*o*a.da+3*s*(o*a.ca+s*a.ba))*o+a.a,this._round[n]&&(l=Math.round(l)),f[n]?p[n](l):p[n]=l;if(this._autoRotate){var d,g,v,y,T,x,w,b=this._autoRotate;for(r=b.length;--r>-1;)n=b[r][2],x=b[r][3]||0,w=b[r][4]===!0?1:t,a=this._beziers[b[r][0]],d=this._beziers[b[r][1]],a&&d&&(a=a[i],d=d[i],g=a.a+(a.b-a.a)*o,y=a.b+(a.c-a.b)*o,g+=(y-g)*o,y+=(a.c+(a.d-a.c)*o-y)*o,v=d.a+(d.b-d.a)*o,T=d.b+(d.c-d.b)*o,v+=(T-v)*o,T+=(d.c+(d.d-d.c)*o-T)*o,l=m?Math.atan2(T-v,y-g)*w+x:this._initialRotations[r],f[n]?p[n](l):p[n]=l)}}}),d=m.prototype;m.bezierThrough=u,m.cubicToQuadratic=l,m._autoCSS=!0,m.quadraticToCubic=function(t,e,i){return new a(t,(2*e+t)/3,(2*e+i)/3,i)},m._cssRegister=function(){var t=n.CSSPlugin;if(t){var e=t._internals,i=e._parseToProxy,s=e._setPluginRatio,r=e.CSSPropTween;e._registerComplexSpecialProp("bezier",{parser:function(t,e,n,a,o,l){e instanceof Array&&(e={values:e}),l=new m;var h,_,u,c=e.values,f=c.length-1,p=[],d={};if(0>f)return o;for(h=0;f>=h;h++)u=i(t,c[h],a,o,l,f!==h),p[h]=u.end;for(_ in e)d[_]=e[_];return d.values=p,o=new r(t,"bezier",0,0,u.pt,2),o.data=u,o.plugin=l,o.setRatio=s,0===d.autoRotate&&(d.autoRotate=!0),!d.autoRotate||d.autoRotate instanceof Array||(h=d.autoRotate===!0?0:Number(d.autoRotate),d.autoRotate=null!=u.end.left?[["left","top","rotation",h,!1]]:null!=u.end.x?[["x","y","rotation",h,!1]]:!1),d.autoRotate&&(a._transform||a._enableTransforms(!1),u.autoRotate=a._target._gsTransform),l._onInitTween(u.proxy,d,a._tween),o}})}},d._roundProps=function(t,e){for(var i=this._overwriteProps,s=i.length;--s>-1;)(t[i[s]]||t.bezier||t.bezierThrough)&&(this._round[i[s]]=e)},d._kill=function(t){var e,i,s=this._props;for(e in this._beziers)if(e in t)for(delete this._beziers[e],delete this._func[e],i=s.length;--i>-1;)s[i]===e&&s.splice(i,1);return this._super._kill.call(this,t)}}(),_gsScope._gsDefine("plugins.CSSPlugin",["plugins.TweenPlugin","TweenLite"],function(t,e){var i,s,r,n,a=function(){t.call(this,"css"),this._overwriteProps.length=0,this.setRatio=a.prototype.setRatio},o=_gsScope._gsDefine.globals,l={},h=a.prototype=new t("css");h.constructor=a,a.version="1.18.0",a.API=2,a.defaultTransformPerspective=0,a.defaultSkewType="compensated",a.defaultSmoothOrigin=!0,h="px",a.suffixMap={top:h,right:h,bottom:h,left:h,width:h,height:h,fontSize:h,padding:h,margin:h,perspective:h,lineHeight:""};var _,u,c,f,p,m,d=/(?:\d|\-\d|\.\d|\-\.\d)+/g,g=/(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g,v=/(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi,y=/(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g,T=/(?:\d|\-|\+|=|#|\.)*/g,x=/opacity *= *([^)]*)/i,w=/opacity:([^;]*)/i,b=/alpha\(opacity *=.+?\)/i,P=/^(rgb|hsl)/,k=/([A-Z])/g,S=/-([a-z])/gi,R=/(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi,O=function(t,e){return e.toUpperCase()},A=/(?:Left|Right|Width)/i,C=/(M11|M12|M21|M22)=[\d\-\.e]+/gi,D=/progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i,M=/,(?=[^\)]*(?:\(|$))/gi,z=Math.PI/180,F=180/Math.PI,I={},E=document,N=function(t){return E.createElementNS?E.createElementNS("http://www.w3.org/1999/xhtml",t):E.createElement(t)},L=N("div"),X=N("img"),B=a._internals={_specialProps:l},j=navigator.userAgent,Y=function(){var t=j.indexOf("Android"),e=N("a");return c=-1!==j.indexOf("Safari")&&-1===j.indexOf("Chrome")&&(-1===t||Number(j.substr(t+8,1))>3),p=c&&6>Number(j.substr(j.indexOf("Version/")+8,1)),f=-1!==j.indexOf("Firefox"),(/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(j)||/Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(j))&&(m=parseFloat(RegExp.$1)),e?(e.style.cssText="top:1px;opacity:.55;",/^0.55/.test(e.style.opacity)):!1}(),U=function(t){return x.test("string"==typeof t?t:(t.currentStyle?t.currentStyle.filter:t.style.filter)||"")?parseFloat(RegExp.$1)/100:1},q=function(t){window.console&&console.log(t)},V="",G="",W=function(t,e){e=e||L;var i,s,r=e.style;if(void 0!==r[t])return t;for(t=t.charAt(0).toUpperCase()+t.substr(1),i=["O","Moz","ms","Ms","Webkit"],s=5;--s>-1&&void 0===r[i[s]+t];);return s>=0?(G=3===s?"ms":i[s],V="-"+G.toLowerCase()+"-",G+t):null},Z=E.defaultView?E.defaultView.getComputedStyle:function(){},Q=a.getStyle=function(t,e,i,s,r){var n;return Y||"opacity"!==e?(!s&&t.style[e]?n=t.style[e]:(i=i||Z(t))?n=i[e]||i.getPropertyValue(e)||i.getPropertyValue(e.replace(k,"-$1").toLowerCase()):t.currentStyle&&(n=t.currentStyle[e]),null==r||n&&"none"!==n&&"auto"!==n&&"auto auto"!==n?n:r):U(t)},$=B.convertToPixels=function(t,i,s,r,n){if("px"===r||!r)return s;if("auto"===r||!s)return 0;var o,l,h,_=A.test(i),u=t,c=L.style,f=0>s;if(f&&(s=-s),"%"===r&&-1!==i.indexOf("border"))o=s/100*(_?t.clientWidth:t.clientHeight);else{if(c.cssText="border:0 solid red;position:"+Q(t,"position")+";line-height:0;","%"!==r&&u.appendChild&&"v"!==r.charAt(0)&&"rem"!==r)c[_?"borderLeftWidth":"borderTopWidth"]=s+r;else{if(u=t.parentNode||E.body,l=u._gsCache,h=e.ticker.frame,l&&_&&l.time===h)return l.width*s/100;c[_?"width":"height"]=s+r}u.appendChild(L),o=parseFloat(L[_?"offsetWidth":"offsetHeight"]),u.removeChild(L),_&&"%"===r&&a.cacheWidths!==!1&&(l=u._gsCache=u._gsCache||{},l.time=h,l.width=100*(o/s)),0!==o||n||(o=$(t,i,s,r,!0))}return f?-o:o},H=B.calculateOffset=function(t,e,i){if("absolute"!==Q(t,"position",i))return 0;var s="left"===e?"Left":"Top",r=Q(t,"margin"+s,i);return t["offset"+s]-($(t,e,parseFloat(r),r.replace(T,""))||0)},K=function(t,e){var i,s,r,n={};if(e=e||Z(t,null))if(i=e.length)for(;--i>-1;)r=e[i],(-1===r.indexOf("-transform")||ke===r)&&(n[r.replace(S,O)]=e.getPropertyValue(r));else for(i in e)(-1===i.indexOf("Transform")||Pe===i)&&(n[i]=e[i]);else if(e=t.currentStyle||t.style)for(i in e)"string"==typeof i&&void 0===n[i]&&(n[i.replace(S,O)]=e[i]);return Y||(n.opacity=U(t)),s=Ne(t,e,!1),n.rotation=s.rotation,n.skewX=s.skewX,n.scaleX=s.scaleX,n.scaleY=s.scaleY,n.x=s.x,n.y=s.y,Re&&(n.z=s.z,n.rotationX=s.rotationX,n.rotationY=s.rotationY,n.scaleZ=s.scaleZ),n.filters&&delete n.filters,n},J=function(t,e,i,s,r){var n,a,o,l={},h=t.style;for(a in i)"cssText"!==a&&"length"!==a&&isNaN(a)&&(e[a]!==(n=i[a])||r&&r[a])&&-1===a.indexOf("Origin")&&("number"==typeof n||"string"==typeof n)&&(l[a]="auto"!==n||"left"!==a&&"top"!==a?""!==n&&"auto"!==n&&"none"!==n||"string"!=typeof e[a]||""===e[a].replace(y,"")?n:0:H(t,a),void 0!==h[a]&&(o=new pe(h,a,h[a],o)));if(s)for(a in s)"className"!==a&&(l[a]=s[a]);return{difs:l,firstMPT:o}},te={width:["Left","Right"],height:["Top","Bottom"]},ee=["marginLeft","marginRight","marginTop","marginBottom"],ie=function(t,e,i){var s=parseFloat("width"===e?t.offsetWidth:t.offsetHeight),r=te[e],n=r.length;for(i=i||Z(t,null);--n>-1;)s-=parseFloat(Q(t,"padding"+r[n],i,!0))||0,s-=parseFloat(Q(t,"border"+r[n]+"Width",i,!0))||0;return s},se=function(t,e){if("contain"===t||"auto"===t||"auto auto"===t)return t+" ";(null==t||""===t)&&(t="0 0");var i=t.split(" "),s=-1!==t.indexOf("left")?"0%":-1!==t.indexOf("right")?"100%":i[0],r=-1!==t.indexOf("top")?"0%":-1!==t.indexOf("bottom")?"100%":i[1];return null==r?r="center"===s?"50%":"0":"center"===r&&(r="50%"),("center"===s||isNaN(parseFloat(s))&&-1===(s+"").indexOf("="))&&(s="50%"),t=s+" "+r+(i.length>2?" "+i[2]:""),e&&(e.oxp=-1!==s.indexOf("%"),e.oyp=-1!==r.indexOf("%"),e.oxr="="===s.charAt(1),e.oyr="="===r.charAt(1),e.ox=parseFloat(s.replace(y,"")),e.oy=parseFloat(r.replace(y,"")),e.v=t),e||t},re=function(t,e){return"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2)):parseFloat(t)-parseFloat(e)},ne=function(t,e){return null==t?e:"string"==typeof t&&"="===t.charAt(1)?parseInt(t.charAt(0)+"1",10)*parseFloat(t.substr(2))+e:parseFloat(t)},ae=function(t,e,i,s){var r,n,a,o,l,h=1e-6;return null==t?o=e:"number"==typeof t?o=t:(r=360,n=t.split("_"),l="="===t.charAt(1),a=(l?parseInt(t.charAt(0)+"1",10)*parseFloat(n[0].substr(2)):parseFloat(n[0]))*(-1===t.indexOf("rad")?1:F)-(l?0:e),n.length&&(s&&(s[i]=e+a),-1!==t.indexOf("short")&&(a%=r,a!==a%(r/2)&&(a=0>a?a+r:a-r)),-1!==t.indexOf("_cw")&&0>a?a=(a+9999999999*r)%r-(0|a/r)*r:-1!==t.indexOf("ccw")&&a>0&&(a=(a-9999999999*r)%r-(0|a/r)*r)),o=e+a),h>o&&o>-h&&(o=0),o},oe={aqua:[0,255,255],lime:[0,255,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,255],navy:[0,0,128],white:[255,255,255],fuchsia:[255,0,255],olive:[128,128,0],yellow:[255,255,0],orange:[255,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[255,0,0],pink:[255,192,203],cyan:[0,255,255],transparent:[255,255,255,0]},le=function(t,e,i){return t=0>t?t+1:t>1?t-1:t,0|255*(1>6*t?e+6*(i-e)*t:.5>t?i:2>3*t?e+6*(i-e)*(2/3-t):e)+.5},he=a.parseColor=function(t,e){var i,s,r,n,a,o,l,h,_,u,c;if(t)if("number"==typeof t)i=[t>>16,255&t>>8,255&t];else{if(","===t.charAt(t.length-1)&&(t=t.substr(0,t.length-1)),oe[t])i=oe[t];else if("#"===t.charAt(0))4===t.length&&(s=t.charAt(1),r=t.charAt(2),n=t.charAt(3),t="#"+s+s+r+r+n+n),t=parseInt(t.substr(1),16),i=[t>>16,255&t>>8,255&t];else if("hsl"===t.substr(0,3))if(i=c=t.match(d),e){if(-1!==t.indexOf("="))return t.match(g)}else a=Number(i[0])%360/360,o=Number(i[1])/100,l=Number(i[2])/100,r=.5>=l?l*(o+1):l+o-l*o,s=2*l-r,i.length>3&&(i[3]=Number(t[3])),i[0]=le(a+1/3,s,r),i[1]=le(a,s,r),i[2]=le(a-1/3,s,r);else i=t.match(d)||oe.transparent;i[0]=Number(i[0]),i[1]=Number(i[1]),i[2]=Number(i[2]),i.length>3&&(i[3]=Number(i[3]))}else i=oe.black;return e&&!c&&(s=i[0]/255,r=i[1]/255,n=i[2]/255,h=Math.max(s,r,n),_=Math.min(s,r,n),l=(h+_)/2,h===_?a=o=0:(u=h-_,o=l>.5?u/(2-h-_):u/(h+_),a=h===s?(r-n)/u+(n>r?6:0):h===r?(n-s)/u+2:(s-r)/u+4,a*=60),i[0]=0|a+.5,i[1]=0|100*o+.5,i[2]=0|100*l+.5),i},_e=function(t,e){var i,s,r,n=t.match(ue)||[],a=0,o=n.length?"":t;for(i=0;n.length>i;i++)s=n[i],r=t.substr(a,t.indexOf(s,a)-a),a+=r.length+s.length,s=he(s,e),3===s.length&&s.push(1),o+=r+(e?"hsla("+s[0]+","+s[1]+"%,"+s[2]+"%,"+s[3]:"rgba("+s.join(","))+")";return o},ue="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";for(h in oe)ue+="|"+h+"\\b";ue=RegExp(ue+")","gi"),a.colorStringFilter=function(t){var e,i=t[0]+t[1];ue.lastIndex=0,ue.test(i)&&(e=-1!==i.indexOf("hsl(")||-1!==i.indexOf("hsla("),t[0]=_e(t[0],e),t[1]=_e(t[1],e))},e.defaultStringFilter||(e.defaultStringFilter=a.colorStringFilter);var ce=function(t,e,i,s){if(null==t)return function(t){return t};var r,n=e?(t.match(ue)||[""])[0]:"",a=t.split(n).join("").match(v)||[],o=t.substr(0,t.indexOf(a[0])),l=")"===t.charAt(t.length-1)?")":"",h=-1!==t.indexOf(" ")?" ":",",_=a.length,u=_>0?a[0].replace(d,""):"";return _?r=e?function(t){var e,c,f,p;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(p=t.replace(M,"|").split("|"),f=0;p.length>f;f++)p[f]=r(p[f]);return p.join(",")}if(e=(t.match(ue)||[n])[0],c=t.split(e).join("").match(v)||[],f=c.length,_>f--)for(;_>++f;)c[f]=i?c[0|(f-1)/2]:a[f];return o+c.join(h)+h+e+l+(-1!==t.indexOf("inset")?" inset":"")}:function(t){var e,n,c;if("number"==typeof t)t+=u;else if(s&&M.test(t)){for(n=t.replace(M,"|").split("|"),c=0;n.length>c;c++)n[c]=r(n[c]);return n.join(",")}if(e=t.match(v)||[],c=e.length,_>c--)for(;_>++c;)e[c]=i?e[0|(c-1)/2]:a[c];return o+e.join(h)+l}:function(t){return t}},fe=function(t){return t=t.split(","),function(e,i,s,r,n,a,o){var l,h=(i+"").split(" ");for(o={},l=0;4>l;l++)o[t[l]]=h[l]=h[l]||h[(l-1)/2>>0];return r.parse(e,o,n,a)}},pe=(B._setPluginRatio=function(t){this.plugin.setRatio(t);for(var e,i,s,r,n=this.data,a=n.proxy,o=n.firstMPT,l=1e-6;o;)e=a[o.v],o.r?e=Math.round(e):l>e&&e>-l&&(e=0),o.t[o.p]=e,o=o._next;if(n.autoRotate&&(n.autoRotate.rotation=a.rotation),1===t)for(o=n.firstMPT;o;){if(i=o.t,i.type){if(1===i.type){for(r=i.xs0+i.s+i.xs1,s=1;i.l>s;s++)r+=i["xn"+s]+i["xs"+(s+1)];i.e=r}}else i.e=i.s+i.xs0;o=o._next}},function(t,e,i,s,r){this.t=t,this.p=e,this.v=i,this.r=r,s&&(s._prev=this,this._next=s)}),me=(B._parseToProxy=function(t,e,i,s,r,n){var a,o,l,h,_,u=s,c={},f={},p=i._transform,m=I;for(i._transform=null,I=e,s=_=i.parse(t,e,s,r),I=m,n&&(i._transform=p,u&&(u._prev=null,u._prev&&(u._prev._next=null)));s&&s!==u;){if(1>=s.type&&(o=s.p,f[o]=s.s+s.c,c[o]=s.s,n||(h=new pe(s,"s",o,h,s.r),s.c=0),1===s.type))for(a=s.l;--a>0;)l="xn"+a,o=s.p+"_"+l,f[o]=s.data[l],c[o]=s[l],n||(h=new pe(s,l,o,h,s.rxp[l]));s=s._next}return{proxy:c,end:f,firstMPT:h,pt:_}},B.CSSPropTween=function(t,e,s,r,a,o,l,h,_,u,c){this.t=t,this.p=e,this.s=s,this.c=r,this.n=l||e,t instanceof me||n.push(this.n),this.r=h,this.type=o||0,_&&(this.pr=_,i=!0),this.b=void 0===u?s:u,this.e=void 0===c?s+r:c,a&&(this._next=a,a._prev=this)}),de=function(t,e,i,s,r,n){var a=new me(t,e,i,s-i,r,-1,n);return a.b=i,a.e=a.xs0=s,a},ge=a.parseComplex=function(t,e,i,s,r,n,a,o,l,h){i=i||n||"",a=new me(t,e,0,0,a,h?2:1,null,!1,o,i,s),s+="";var u,c,f,p,m,v,y,T,x,w,b,P,k,S=i.split(", ").join(",").split(" "),R=s.split(", ").join(",").split(" "),O=S.length,A=_!==!1;for((-1!==s.indexOf(",")||-1!==i.indexOf(","))&&(S=S.join(" ").replace(M,", ").split(" "),R=R.join(" ").replace(M,", ").split(" "),O=S.length),O!==R.length&&(S=(n||"").split(" "),O=S.length),a.plugin=l,a.setRatio=h,ue.lastIndex=0,u=0;O>u;u++)if(p=S[u],m=R[u],T=parseFloat(p),T||0===T)a.appendXtra("",T,re(m,T),m.replace(g,""),A&&-1!==m.indexOf("px"),!0);else if(r&&ue.test(p))P=","===m.charAt(m.length-1)?"),":")",k=-1!==m.indexOf("hsl")&&Y,p=he(p,k),m=he(m,k),x=p.length+m.length>6,x&&!Y&&0===m[3]?(a["xs"+a.l]+=a.l?" transparent":"transparent",a.e=a.e.split(R[u]).join("transparent")):(Y||(x=!1),k?a.appendXtra(x?"hsla(":"hsl(",p[0],re(m[0],p[0]),",",!1,!0).appendXtra("",p[1],re(m[1],p[1]),"%,",!1).appendXtra("",p[2],re(m[2],p[2]),x?"%,":"%"+P,!1):a.appendXtra(x?"rgba(":"rgb(",p[0],m[0]-p[0],",",!0,!0).appendXtra("",p[1],m[1]-p[1],",",!0).appendXtra("",p[2],m[2]-p[2],x?",":P,!0),x&&(p=4>p.length?1:p[3],a.appendXtra("",p,(4>m.length?1:m[3])-p,P,!1))),ue.lastIndex=0;else if(v=p.match(d)){if(y=m.match(g),!y||y.length!==v.length)return a;for(f=0,c=0;v.length>c;c++)b=v[c],w=p.indexOf(b,f),a.appendXtra(p.substr(f,w-f),Number(b),re(y[c],b),"",A&&"px"===p.substr(w+b.length,2),0===c),f=w+b.length;a["xs"+a.l]+=p.substr(f)}else a["xs"+a.l]+=a.l?" "+p:p;if(-1!==s.indexOf("=")&&a.data){for(P=a.xs0+a.data.s,u=1;a.l>u;u++)P+=a["xs"+u]+a.data["xn"+u];a.e=P+a["xs"+u]}return a.l||(a.type=-1,a.xs0=a.e),a.xfirst||a},ve=9;for(h=me.prototype,h.l=h.pr=0;--ve>0;)h["xn"+ve]=0,h["xs"+ve]="";h.xs0="",h._next=h._prev=h.xfirst=h.data=h.plugin=h.setRatio=h.rxp=null,h.appendXtra=function(t,e,i,s,r,n){var a=this,o=a.l;return a["xs"+o]+=n&&o?" "+t:t||"",i||0===o||a.plugin?(a.l++,a.type=a.setRatio?2:1,a["xs"+a.l]=s||"",o>0?(a.data["xn"+o]=e+i,a.rxp["xn"+o]=r,a["xn"+o]=e,a.plugin||(a.xfirst=new me(a,"xn"+o,e,i,a.xfirst||a,0,a.n,r,a.pr),a.xfirst.xs0=0),a):(a.data={s:e+i},a.rxp={},a.s=e,a.c=i,a.r=r,a)):(a["xs"+o]+=e+(s||""),a)};var ye=function(t,e){e=e||{},this.p=e.prefix?W(t)||t:t,l[t]=l[this.p]=this,this.format=e.formatter||ce(e.defaultValue,e.color,e.collapsible,e.multi),e.parser&&(this.parse=e.parser),this.clrs=e.color,this.multi=e.multi,this.keyword=e.keyword,this.dflt=e.defaultValue,this.pr=e.priority||0},Te=B._registerComplexSpecialProp=function(t,e,i){"object"!=typeof e&&(e={parser:i});var s,r,n=t.split(","),a=e.defaultValue;for(i=i||[a],s=0;n.length>s;s++)e.prefix=0===s&&e.prefix,e.defaultValue=i[s]||a,r=new ye(n[s],e)},xe=function(t){if(!l[t]){var e=t.charAt(0).toUpperCase()+t.substr(1)+"Plugin";Te(t,{parser:function(t,i,s,r,n,a,h){var _=o.com.greensock.plugins[e];return _?(_._cssRegister(),l[s].parse(t,i,s,r,n,a,h)):(q("Error: "+e+" js file not loaded."),n)}})}};h=ye.prototype,h.parseComplex=function(t,e,i,s,r,n){var a,o,l,h,_,u,c=this.keyword;if(this.multi&&(M.test(i)||M.test(e)?(o=e.replace(M,"|").split("|"),l=i.replace(M,"|").split("|")):c&&(o=[e],l=[i])),l){for(h=l.length>o.length?l.length:o.length,a=0;h>a;a++)e=o[a]=o[a]||this.dflt,i=l[a]=l[a]||this.dflt,c&&(_=e.indexOf(c),u=i.indexOf(c),_!==u&&(-1===u?o[a]=o[a].split(c).join(""):-1===_&&(o[a]+=" "+c)));e=o.join(", "),i=l.join(", ")}return ge(t,this.p,e,i,this.clrs,this.dflt,s,this.pr,r,n)},h.parse=function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,this.p,r,!1,this.dflt)),this.format(e),n,a)},a.registerSpecialProp=function(t,e,i){Te(t,{parser:function(t,s,r,n,a,o){var l=new me(t,r,0,0,a,2,r,!1,i);return l.plugin=o,l.setRatio=e(t,s,n._tween,r),l},priority:i})},a.useSVGTransformAttr=c||f;var we,be="scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","),Pe=W("transform"),ke=V+"transform",Se=W("transformOrigin"),Re=null!==W("perspective"),Oe=B.Transform=function(){this.perspective=parseFloat(a.defaultTransformPerspective)||0,this.force3D=a.defaultForce3D!==!1&&Re?a.defaultForce3D||"auto":!1},Ae=window.SVGElement,Ce=function(t,e,i){var s,r=E.createElementNS("http://www.w3.org/2000/svg",t),n=/([a-z])([A-Z])/g;for(s in i)r.setAttributeNS(null,s.replace(n,"$1-$2").toLowerCase(),i[s]);return e.appendChild(r),r},De=E.documentElement,Me=function(){var t,e,i,s=m||/Android/i.test(j)&&!window.chrome;return E.createElementNS&&!s&&(t=Ce("svg",De),e=Ce("rect",t,{width:100,height:50,x:100}),i=e.getBoundingClientRect().width,e.style[Se]="50% 50%",e.style[Pe]="scaleX(0.5)",s=i===e.getBoundingClientRect().width&&!(f&&Re),De.removeChild(t)),s}(),ze=function(t,e,i,s,r){var n,o,l,h,_,u,c,f,p,m,d,g,v,y,T=t._gsTransform,x=Ee(t,!0);T&&(v=T.xOrigin,y=T.yOrigin),(!s||2>(n=s.split(" ")).length)&&(c=t.getBBox(),e=se(e).split(" "),n=[(-1!==e[0].indexOf("%")?parseFloat(e[0])/100*c.width:parseFloat(e[0]))+c.x,(-1!==e[1].indexOf("%")?parseFloat(e[1])/100*c.height:parseFloat(e[1]))+c.y]),i.xOrigin=h=parseFloat(n[0]),i.yOrigin=_=parseFloat(n[1]),s&&x!==Ie&&(u=x[0],c=x[1],f=x[2],p=x[3],m=x[4],d=x[5],g=u*p-c*f,o=h*(p/g)+_*(-f/g)+(f*d-p*m)/g,l=h*(-c/g)+_*(u/g)-(u*d-c*m)/g,h=i.xOrigin=n[0]=o,_=i.yOrigin=n[1]=l),T&&(r||r!==!1&&a.defaultSmoothOrigin!==!1?(o=h-v,l=_-y,T.xOffset+=o*x[0]+l*x[2]-o,T.yOffset+=o*x[1]+l*x[3]-l):T.xOffset=T.yOffset=0),t.setAttribute("data-svg-origin",n.join(" "))},Fe=function(t){return!!(Ae&&"function"==typeof t.getBBox&&t.getCTM&&(!t.parentNode||t.parentNode.getBBox&&t.parentNode.getCTM))},Ie=[1,0,0,1,0,0],Ee=function(t,e){var i,s,r,n,a,o=t._gsTransform||new Oe,l=1e5;if(Pe?s=Q(t,ke,null,!0):t.currentStyle&&(s=t.currentStyle.filter.match(C),s=s&&4===s.length?[s[0].substr(4),Number(s[2].substr(4)),Number(s[1].substr(4)),s[3].substr(4),o.x||0,o.y||0].join(","):""),i=!s||"none"===s||"matrix(1, 0, 0, 1, 0, 0)"===s,(o.svg||t.getBBox&&Fe(t))&&(i&&-1!==(t.style[Pe]+"").indexOf("matrix")&&(s=t.style[Pe],i=0),r=t.getAttribute("transform"),i&&r&&(-1!==r.indexOf("matrix")?(s=r,i=0):-1!==r.indexOf("translate")&&(s="matrix(1,0,0,1,"+r.match(/(?:\-|\b)[\d\-\.e]+\b/gi).join(",")+")",i=0))),i)return Ie;for(r=(s||"").match(/(?:\-|\b)[\d\-\.e]+\b/gi)||[],ve=r.length;--ve>-1;)n=Number(r[ve]),r[ve]=(a=n-(n|=0))?(0|a*l+(0>a?-.5:.5))/l+n:n;return e&&r.length>6?[r[0],r[1],r[4],r[5],r[12],r[13]]:r},Ne=B.getTransform=function(t,i,s,n){if(t._gsTransform&&s&&!n)return t._gsTransform;var o,l,h,_,u,c,f=s?t._gsTransform||new Oe:new Oe,p=0>f.scaleX,m=2e-5,d=1e5,g=Re?parseFloat(Q(t,Se,i,!1,"0 0 0").split(" ")[2])||f.zOrigin||0:0,v=parseFloat(a.defaultTransformPerspective)||0;if(f.svg=!(!t.getBBox||!Fe(t)),f.svg&&(ze(t,Q(t,Se,r,!1,"50% 50%")+"",f,t.getAttribute("data-svg-origin")),we=a.useSVGTransformAttr||Me),o=Ee(t),o!==Ie){if(16===o.length){var y,T,x,w,b,P=o[0],k=o[1],S=o[2],R=o[3],O=o[4],A=o[5],C=o[6],D=o[7],M=o[8],z=o[9],I=o[10],E=o[12],N=o[13],L=o[14],X=o[11],B=Math.atan2(C,I);f.zOrigin&&(L=-f.zOrigin,E=M*L-o[12],N=z*L-o[13],L=I*L+f.zOrigin-o[14]),f.rotationX=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),y=O*w+M*b,T=A*w+z*b,x=C*w+I*b,M=O*-b+M*w,z=A*-b+z*w,I=C*-b+I*w,X=D*-b+X*w,O=y,A=T,C=x),B=Math.atan2(M,I),f.rotationY=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),y=P*w-M*b,T=k*w-z*b,x=S*w-I*b,z=k*b+z*w,I=S*b+I*w,X=R*b+X*w,P=y,k=T,S=x),B=Math.atan2(k,P),f.rotation=B*F,B&&(w=Math.cos(-B),b=Math.sin(-B),P=P*w+O*b,T=k*w+A*b,A=k*-b+A*w,C=S*-b+C*w,k=T),f.rotationX&&Math.abs(f.rotationX)+Math.abs(f.rotation)>359.9&&(f.rotationX=f.rotation=0,f.rotationY+=180),f.scaleX=(0|Math.sqrt(P*P+k*k)*d+.5)/d,f.scaleY=(0|Math.sqrt(A*A+z*z)*d+.5)/d,f.scaleZ=(0|Math.sqrt(C*C+I*I)*d+.5)/d,f.skewX=0,f.perspective=X?1/(0>X?-X:X):0,f.x=E,f.y=N,f.z=L,f.svg&&(f.x-=f.xOrigin-(f.xOrigin*P-f.yOrigin*O),f.y-=f.yOrigin-(f.yOrigin*k-f.xOrigin*A))}else if(!(Re&&!n&&o.length&&f.x===o[4]&&f.y===o[5]&&(f.rotationX||f.rotationY)||void 0!==f.x&&"none"===Q(t,"display",i))){var j=o.length>=6,Y=j?o[0]:1,U=o[1]||0,q=o[2]||0,V=j?o[3]:1;f.x=o[4]||0,f.y=o[5]||0,h=Math.sqrt(Y*Y+U*U),_=Math.sqrt(V*V+q*q),u=Y||U?Math.atan2(U,Y)*F:f.rotation||0,c=q||V?Math.atan2(q,V)*F+u:f.skewX||0,Math.abs(c)>90&&270>Math.abs(c)&&(p?(h*=-1,c+=0>=u?180:-180,u+=0>=u?180:-180):(_*=-1,c+=0>=c?180:-180)),f.scaleX=h,f.scaleY=_,f.rotation=u,f.skewX=c,Re&&(f.rotationX=f.rotationY=f.z=0,f.perspective=v,f.scaleZ=1),f.svg&&(f.x-=f.xOrigin-(f.xOrigin*Y+f.yOrigin*q),f.y-=f.yOrigin-(f.xOrigin*U+f.yOrigin*V))}f.zOrigin=g;for(l in f)m>f[l]&&f[l]>-m&&(f[l]=0)}return s&&(t._gsTransform=f,f.svg&&(we&&t.style[Pe]?e.delayedCall(.001,function(){je(t.style,Pe)}):!we&&t.getAttribute("transform")&&e.delayedCall(.001,function(){t.removeAttribute("transform")}))),f},Le=function(t){var e,i,s=this.data,r=-s.rotation*z,n=r+s.skewX*z,a=1e5,o=(0|Math.cos(r)*s.scaleX*a)/a,l=(0|Math.sin(r)*s.scaleX*a)/a,h=(0|Math.sin(n)*-s.scaleY*a)/a,_=(0|Math.cos(n)*s.scaleY*a)/a,u=this.t.style,c=this.t.currentStyle;if(c){i=l,l=-h,h=-i,e=c.filter,u.filter="";var f,p,d=this.t.offsetWidth,g=this.t.offsetHeight,v="absolute"!==c.position,y="progid:DXImageTransform.Microsoft.Matrix(M11="+o+", M12="+l+", M21="+h+", M22="+_,w=s.x+d*s.xPercent/100,b=s.y+g*s.yPercent/100;if(null!=s.ox&&(f=(s.oxp?.01*d*s.ox:s.ox)-d/2,p=(s.oyp?.01*g*s.oy:s.oy)-g/2,w+=f-(f*o+p*l),b+=p-(f*h+p*_)),v?(f=d/2,p=g/2,y+=", Dx="+(f-(f*o+p*l)+w)+", Dy="+(p-(f*h+p*_)+b)+")"):y+=", sizingMethod='auto expand')",u.filter=-1!==e.indexOf("DXImageTransform.Microsoft.Matrix(")?e.replace(D,y):y+" "+e,(0===t||1===t)&&1===o&&0===l&&0===h&&1===_&&(v&&-1===y.indexOf("Dx=0, Dy=0")||x.test(e)&&100!==parseFloat(RegExp.$1)||-1===e.indexOf("gradient("&&e.indexOf("Alpha"))&&u.removeAttribute("filter")),!v){var P,k,S,R=8>m?1:-1;for(f=s.ieOffsetX||0,p=s.ieOffsetY||0,s.ieOffsetX=Math.round((d-((0>o?-o:o)*d+(0>l?-l:l)*g))/2+w),s.ieOffsetY=Math.round((g-((0>_?-_:_)*g+(0>h?-h:h)*d))/2+b),ve=0;4>ve;ve++)k=ee[ve],P=c[k],i=-1!==P.indexOf("px")?parseFloat(P):$(this.t,k,parseFloat(P),P.replace(T,""))||0,S=i!==s[k]?2>ve?-s.ieOffsetX:-s.ieOffsetY:2>ve?f-s.ieOffsetX:p-s.ieOffsetY,u[k]=(s[k]=Math.round(i-S*(0===ve||2===ve?1:R)))+"px"}}},Xe=B.set3DTransformRatio=B.setTransformRatio=function(t){var e,i,s,r,n,a,o,l,h,_,u,c,p,m,d,g,v,y,T,x,w,b,P,k=this.data,S=this.t.style,R=k.rotation,O=k.rotationX,A=k.rotationY,C=k.scaleX,D=k.scaleY,M=k.scaleZ,F=k.x,I=k.y,E=k.z,N=k.svg,L=k.perspective,X=k.force3D;if(!(((1!==t&&0!==t||"auto"!==X||this.tween._totalTime!==this.tween._totalDuration&&this.tween._totalTime)&&X||E||L||A||O)&&(!we||!N)&&Re))return R||k.skewX||N?(R*=z,b=k.skewX*z,P=1e5,e=Math.cos(R)*C,r=Math.sin(R)*C,i=Math.sin(R-b)*-D,n=Math.cos(R-b)*D,b&&"simple"===k.skewType&&(v=Math.tan(b),v=Math.sqrt(1+v*v),i*=v,n*=v,k.skewY&&(e*=v,r*=v)),N&&(F+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,I+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset,we&&(k.xPercent||k.yPercent)&&(m=this.t.getBBox(),F+=.01*k.xPercent*m.width,I+=.01*k.yPercent*m.height),m=1e-6,m>F&&F>-m&&(F=0),m>I&&I>-m&&(I=0)),T=(0|e*P)/P+","+(0|r*P)/P+","+(0|i*P)/P+","+(0|n*P)/P+","+F+","+I+")",N&&we?this.t.setAttribute("transform","matrix("+T):S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+T):S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix(":"matrix(")+C+",0,0,"+D+","+F+","+I+")",void 0;if(f&&(m=1e-4,m>C&&C>-m&&(C=M=2e-5),m>D&&D>-m&&(D=M=2e-5),!L||k.z||k.rotationX||k.rotationY||(L=0)),R||k.skewX)R*=z,d=e=Math.cos(R),g=r=Math.sin(R),k.skewX&&(R-=k.skewX*z,d=Math.cos(R),g=Math.sin(R),"simple"===k.skewType&&(v=Math.tan(k.skewX*z),v=Math.sqrt(1+v*v),d*=v,g*=v,k.skewY&&(e*=v,r*=v))),i=-g,n=d;else{if(!(A||O||1!==M||L||N))return S[Pe]=(k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) translate3d(":"translate3d(")+F+"px,"+I+"px,"+E+"px)"+(1!==C||1!==D?" scale("+C+","+D+")":""),void 0;e=n=1,i=r=0}h=1,s=a=o=l=_=u=0,c=L?-1/L:0,p=k.zOrigin,m=1e-6,x=",",w="0",R=A*z,R&&(d=Math.cos(R),g=Math.sin(R),o=-g,_=c*-g,s=e*g,a=r*g,h=d,c*=d,e*=d,r*=d),R=O*z,R&&(d=Math.cos(R),g=Math.sin(R),v=i*d+s*g,y=n*d+a*g,l=h*g,u=c*g,s=i*-g+s*d,a=n*-g+a*d,h*=d,c*=d,i=v,n=y),1!==M&&(s*=M,a*=M,h*=M,c*=M),1!==D&&(i*=D,n*=D,l*=D,u*=D),1!==C&&(e*=C,r*=C,o*=C,_*=C),(p||N)&&(p&&(F+=s*-p,I+=a*-p,E+=h*-p+p),N&&(F+=k.xOrigin-(k.xOrigin*e+k.yOrigin*i)+k.xOffset,I+=k.yOrigin-(k.xOrigin*r+k.yOrigin*n)+k.yOffset),m>F&&F>-m&&(F=w),m>I&&I>-m&&(I=w),m>E&&E>-m&&(E=0)),T=k.xPercent||k.yPercent?"translate("+k.xPercent+"%,"+k.yPercent+"%) matrix3d(":"matrix3d(",T+=(m>e&&e>-m?w:e)+x+(m>r&&r>-m?w:r)+x+(m>o&&o>-m?w:o),T+=x+(m>_&&_>-m?w:_)+x+(m>i&&i>-m?w:i)+x+(m>n&&n>-m?w:n),O||A?(T+=x+(m>l&&l>-m?w:l)+x+(m>u&&u>-m?w:u)+x+(m>s&&s>-m?w:s),T+=x+(m>a&&a>-m?w:a)+x+(m>h&&h>-m?w:h)+x+(m>c&&c>-m?w:c)+x):T+=",0,0,0,0,1,0,",T+=F+x+I+x+E+x+(L?1+-E/L:1)+")",S[Pe]=T};h=Oe.prototype,h.x=h.y=h.z=h.skewX=h.skewY=h.rotation=h.rotationX=h.rotationY=h.zOrigin=h.xPercent=h.yPercent=h.xOffset=h.yOffset=0,h.scaleX=h.scaleY=h.scaleZ=1,Te("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,svgOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent,smoothOrigin",{parser:function(t,e,i,s,n,o,l){if(s._lastParsedTransform===l)return n;s._lastParsedTransform=l;var h,_,u,c,f,p,m,d,g,v,y=t._gsTransform,T=t.style,x=1e-6,w=be.length,b=l,P={},k="transformOrigin";if(l.display?(c=Q(t,"display"),T.display="block",h=Ne(t,r,!0,l.parseTransform),T.display=c):h=Ne(t,r,!0,l.parseTransform),s._transform=h,"string"==typeof b.transform&&Pe)c=L.style,c[Pe]=b.transform,c.display="block",c.position="absolute",E.body.appendChild(L),_=Ne(L,null,!1),E.body.removeChild(L),_.perspective||(_.perspective=h.perspective),null!=b.xPercent&&(_.xPercent=ne(b.xPercent,h.xPercent)),null!=b.yPercent&&(_.yPercent=ne(b.yPercent,h.yPercent));else if("object"==typeof b){if(_={scaleX:ne(null!=b.scaleX?b.scaleX:b.scale,h.scaleX),scaleY:ne(null!=b.scaleY?b.scaleY:b.scale,h.scaleY),scaleZ:ne(b.scaleZ,h.scaleZ),x:ne(b.x,h.x),y:ne(b.y,h.y),z:ne(b.z,h.z),xPercent:ne(b.xPercent,h.xPercent),yPercent:ne(b.yPercent,h.yPercent),perspective:ne(b.transformPerspective,h.perspective)},d=b.directionalRotation,null!=d)if("object"==typeof d)for(c in d)b[c]=d[c];else b.rotation=d;"string"==typeof b.x&&-1!==b.x.indexOf("%")&&(_.x=0,_.xPercent=ne(b.x,h.xPercent)),"string"==typeof b.y&&-1!==b.y.indexOf("%")&&(_.y=0,_.yPercent=ne(b.y,h.yPercent)),_.rotation=ae("rotation"in b?b.rotation:"shortRotation"in b?b.shortRotation+"_short":"rotationZ"in b?b.rotationZ:h.rotation,h.rotation,"rotation",P),Re&&(_.rotationX=ae("rotationX"in b?b.rotationX:"shortRotationX"in b?b.shortRotationX+"_short":h.rotationX||0,h.rotationX,"rotationX",P),_.rotationY=ae("rotationY"in b?b.rotationY:"shortRotationY"in b?b.shortRotationY+"_short":h.rotationY||0,h.rotationY,"rotationY",P)),_.skewX=null==b.skewX?h.skewX:ae(b.skewX,h.skewX),_.skewY=null==b.skewY?h.skewY:ae(b.skewY,h.skewY),(u=_.skewY-h.skewY)&&(_.skewX+=u,_.rotation+=u)}for(Re&&null!=b.force3D&&(h.force3D=b.force3D,m=!0),h.skewType=b.skewType||h.skewType||a.defaultSkewType,p=h.force3D||h.z||h.rotationX||h.rotationY||_.z||_.rotationX||_.rotationY||_.perspective,p||null==b.scale||(_.scaleZ=1);--w>-1;)i=be[w],f=_[i]-h[i],(f>x||-x>f||null!=b[i]||null!=I[i])&&(m=!0,n=new me(h,i,h[i],f,n),i in P&&(n.e=P[i]),n.xs0=0,n.plugin=o,s._overwriteProps.push(n.n));return f=b.transformOrigin,h.svg&&(f||b.svgOrigin)&&(g=h.xOffset,v=h.yOffset,ze(t,se(f),_,b.svgOrigin,b.smoothOrigin),n=de(h,"xOrigin",(y?h:_).xOrigin,_.xOrigin,n,k),n=de(h,"yOrigin",(y?h:_).yOrigin,_.yOrigin,n,k),(g!==h.xOffset||v!==h.yOffset)&&(n=de(h,"xOffset",y?g:h.xOffset,h.xOffset,n,k),n=de(h,"yOffset",y?v:h.yOffset,h.yOffset,n,k)),f=we?null:"0px 0px"),(f||Re&&p&&h.zOrigin)&&(Pe?(m=!0,i=Se,f=(f||Q(t,i,r,!1,"50% 50%"))+"",n=new me(T,i,0,0,n,-1,k),n.b=T[i],n.plugin=o,Re?(c=h.zOrigin,f=f.split(" "),h.zOrigin=(f.length>2&&(0===c||"0px"!==f[2])?parseFloat(f[2]):c)||0,n.xs0=n.e=f[0]+" "+(f[1]||"50%")+" 0px",n=new me(h,"zOrigin",0,0,n,-1,n.n),n.b=c,n.xs0=n.e=h.zOrigin):n.xs0=n.e=f):se(f+"",h)),m&&(s._transformType=h.svg&&we||!p&&3!==this._transformType?2:3),n},prefix:!0}),Te("boxShadow",{defaultValue:"0px 0px 0px 0px #999",prefix:!0,color:!0,multi:!0,keyword:"inset"}),Te("borderRadius",{defaultValue:"0px",parser:function(t,e,i,n,a){e=this.format(e);var o,l,h,_,u,c,f,p,m,d,g,v,y,T,x,w,b=["borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius"],P=t.style;for(m=parseFloat(t.offsetWidth),d=parseFloat(t.offsetHeight),o=e.split(" "),l=0;b.length>l;l++)this.p.indexOf("border")&&(b[l]=W(b[l])),u=_=Q(t,b[l],r,!1,"0px"),-1!==u.indexOf(" ")&&(_=u.split(" "),u=_[0],_=_[1]),c=h=o[l],f=parseFloat(u),v=u.substr((f+"").length),y="="===c.charAt(1),y?(p=parseInt(c.charAt(0)+"1",10),c=c.substr(2),p*=parseFloat(c),g=c.substr((p+"").length-(0>p?1:0))||""):(p=parseFloat(c),g=c.substr((p+"").length)),""===g&&(g=s[i]||v),g!==v&&(T=$(t,"borderLeft",f,v),x=$(t,"borderTop",f,v),"%"===g?(u=100*(T/m)+"%",_=100*(x/d)+"%"):"em"===g?(w=$(t,"borderLeft",1,"em"),u=T/w+"em",_=x/w+"em"):(u=T+"px",_=x+"px"),y&&(c=parseFloat(u)+p+g,h=parseFloat(_)+p+g)),a=ge(P,b[l],u+" "+_,c+" "+h,!1,"0px",a);return a},prefix:!0,formatter:ce("0px 0px 0px 0px",!1,!0)}),Te("backgroundPosition",{defaultValue:"0 0",parser:function(t,e,i,s,n,a){var o,l,h,_,u,c,f="background-position",p=r||Z(t,null),d=this.format((p?m?p.getPropertyValue(f+"-x")+" "+p.getPropertyValue(f+"-y"):p.getPropertyValue(f):t.currentStyle.backgroundPositionX+" "+t.currentStyle.backgroundPositionY)||"0 0"),g=this.format(e);

if(-1!==d.indexOf("%")!=(-1!==g.indexOf("%"))&&(c=Q(t,"backgroundImage").replace(R,""),c&&"none"!==c)){for(o=d.split(" "),l=g.split(" "),X.setAttribute("src",c),h=2;--h>-1;)d=o[h],_=-1!==d.indexOf("%"),_!==(-1!==l[h].indexOf("%"))&&(u=0===h?t.offsetWidth-X.width:t.offsetHeight-X.height,o[h]=_?parseFloat(d)/100*u+"px":100*(parseFloat(d)/u)+"%");d=o.join(" ")}return this.parseComplex(t.style,d,g,n,a)},formatter:se}),Te("backgroundSize",{defaultValue:"0 0",formatter:se}),Te("perspective",{defaultValue:"0px",prefix:!0}),Te("perspectiveOrigin",{defaultValue:"50% 50%",prefix:!0}),Te("transformStyle",{prefix:!0}),Te("backfaceVisibility",{prefix:!0}),Te("userSelect",{prefix:!0}),Te("margin",{parser:fe("marginTop,marginRight,marginBottom,marginLeft")}),Te("padding",{parser:fe("paddingTop,paddingRight,paddingBottom,paddingLeft")}),Te("clip",{defaultValue:"rect(0px,0px,0px,0px)",parser:function(t,e,i,s,n,a){var o,l,h;return 9>m?(l=t.currentStyle,h=8>m?" ":",",o="rect("+l.clipTop+h+l.clipRight+h+l.clipBottom+h+l.clipLeft+")",e=this.format(e).split(",").join(h)):(o=this.format(Q(t,this.p,r,!1,this.dflt)),e=this.format(e)),this.parseComplex(t.style,o,e,n,a)}}),Te("textShadow",{defaultValue:"0px 0px 0px #999",color:!0,multi:!0}),Te("autoRound,strictUnits",{parser:function(t,e,i,s,r){return r}}),Te("border",{defaultValue:"0px solid #000",parser:function(t,e,i,s,n,a){return this.parseComplex(t.style,this.format(Q(t,"borderTopWidth",r,!1,"0px")+" "+Q(t,"borderTopStyle",r,!1,"solid")+" "+Q(t,"borderTopColor",r,!1,"#000")),this.format(e),n,a)},color:!0,formatter:function(t){var e=t.split(" ");return e[0]+" "+(e[1]||"solid")+" "+(t.match(ue)||["#000"])[0]}}),Te("borderWidth",{parser:fe("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}),Te("float,cssFloat,styleFloat",{parser:function(t,e,i,s,r){var n=t.style,a="cssFloat"in n?"cssFloat":"styleFloat";return new me(n,a,0,0,r,-1,i,!1,0,n[a],e)}});var Be=function(t){var e,i=this.t,s=i.filter||Q(this.data,"filter")||"",r=0|this.s+this.c*t;100===r&&(-1===s.indexOf("atrix(")&&-1===s.indexOf("radient(")&&-1===s.indexOf("oader(")?(i.removeAttribute("filter"),e=!Q(this.data,"filter")):(i.filter=s.replace(b,""),e=!0)),e||(this.xn1&&(i.filter=s=s||"alpha(opacity="+r+")"),-1===s.indexOf("pacity")?0===r&&this.xn1||(i.filter=s+" alpha(opacity="+r+")"):i.filter=s.replace(x,"opacity="+r))};Te("opacity,alpha,autoAlpha",{defaultValue:"1",parser:function(t,e,i,s,n,a){var o=parseFloat(Q(t,"opacity",r,!1,"1")),l=t.style,h="autoAlpha"===i;return"string"==typeof e&&"="===e.charAt(1)&&(e=("-"===e.charAt(0)?-1:1)*parseFloat(e.substr(2))+o),h&&1===o&&"hidden"===Q(t,"visibility",r)&&0!==e&&(o=0),Y?n=new me(l,"opacity",o,e-o,n):(n=new me(l,"opacity",100*o,100*(e-o),n),n.xn1=h?1:0,l.zoom=1,n.type=2,n.b="alpha(opacity="+n.s+")",n.e="alpha(opacity="+(n.s+n.c)+")",n.data=t,n.plugin=a,n.setRatio=Be),h&&(n=new me(l,"visibility",0,0,n,-1,null,!1,0,0!==o?"inherit":"hidden",0===e?"hidden":"inherit"),n.xs0="inherit",s._overwriteProps.push(n.n),s._overwriteProps.push(i)),n}});var je=function(t,e){e&&(t.removeProperty?(("ms"===e.substr(0,2)||"webkit"===e.substr(0,6))&&(e="-"+e),t.removeProperty(e.replace(k,"-$1").toLowerCase())):t.removeAttribute(e))},Ye=function(t){if(this.t._gsClassPT=this,1===t||0===t){this.t.setAttribute("class",0===t?this.b:this.e);for(var e=this.data,i=this.t.style;e;)e.v?i[e.p]=e.v:je(i,e.p),e=e._next;1===t&&this.t._gsClassPT===this&&(this.t._gsClassPT=null)}else this.t.getAttribute("class")!==this.e&&this.t.setAttribute("class",this.e)};Te("className",{parser:function(t,e,s,n,a,o,l){var h,_,u,c,f,p=t.getAttribute("class")||"",m=t.style.cssText;if(a=n._classNamePT=new me(t,s,0,0,a,2),a.setRatio=Ye,a.pr=-11,i=!0,a.b=p,_=K(t,r),u=t._gsClassPT){for(c={},f=u.data;f;)c[f.p]=1,f=f._next;u.setRatio(1)}return t._gsClassPT=a,a.e="="!==e.charAt(1)?e:p.replace(RegExp("\\s*\\b"+e.substr(2)+"\\b"),"")+("+"===e.charAt(0)?" "+e.substr(2):""),t.setAttribute("class",a.e),h=J(t,_,K(t),l,c),t.setAttribute("class",p),a.data=h.firstMPT,t.style.cssText=m,a=a.xfirst=n.parse(t,h.difs,a,o)}});var Ue=function(t){if((1===t||0===t)&&this.data._totalTime===this.data._totalDuration&&"isFromStart"!==this.data.data){var e,i,s,r,n,a=this.t.style,o=l.transform.parse;if("all"===this.e)a.cssText="",r=!0;else for(e=this.e.split(" ").join("").split(","),s=e.length;--s>-1;)i=e[s],l[i]&&(l[i].parse===o?r=!0:i="transformOrigin"===i?Se:l[i].p),je(a,i);r&&(je(a,Pe),n=this.t._gsTransform,n&&(n.svg&&this.t.removeAttribute("data-svg-origin"),delete this.t._gsTransform))}};for(Te("clearProps",{parser:function(t,e,s,r,n){return n=new me(t,s,0,0,n,2),n.setRatio=Ue,n.e=e,n.pr=-10,n.data=r._tween,i=!0,n}}),h="bezier,throwProps,physicsProps,physics2D".split(","),ve=h.length;ve--;)xe(h[ve]);h=a.prototype,h._firstPT=h._lastParsedTransform=h._transform=null,h._onInitTween=function(t,e,o){if(!t.nodeType)return!1;this._target=t,this._tween=o,this._vars=e,_=e.autoRound,i=!1,s=e.suffixMap||a.suffixMap,r=Z(t,""),n=this._overwriteProps;var h,f,m,d,g,v,y,T,x,b=t.style;if(u&&""===b.zIndex&&(h=Q(t,"zIndex",r),("auto"===h||""===h)&&this._addLazySet(b,"zIndex",0)),"string"==typeof e&&(d=b.cssText,h=K(t,r),b.cssText=d+";"+e,h=J(t,h,K(t)).difs,!Y&&w.test(e)&&(h.opacity=parseFloat(RegExp.$1)),e=h,b.cssText=d),this._firstPT=f=e.className?l.className.parse(t,e.className,"className",this,null,null,e):this.parse(t,e,null),this._transformType){for(x=3===this._transformType,Pe?c&&(u=!0,""===b.zIndex&&(y=Q(t,"zIndex",r),("auto"===y||""===y)&&this._addLazySet(b,"zIndex",0)),p&&this._addLazySet(b,"WebkitBackfaceVisibility",this._vars.WebkitBackfaceVisibility||(x?"visible":"hidden"))):b.zoom=1,m=f;m&&m._next;)m=m._next;T=new me(t,"transform",0,0,null,2),this._linkCSSP(T,null,m),T.setRatio=Pe?Xe:Le,T.data=this._transform||Ne(t,r,!0),T.tween=o,T.pr=-1,n.pop()}if(i){for(;f;){for(v=f._next,m=d;m&&m.pr>f.pr;)m=m._next;(f._prev=m?m._prev:g)?f._prev._next=f:d=f,(f._next=m)?m._prev=f:g=f,f=v}this._firstPT=d}return!0},h.parse=function(t,e,i,n){var a,o,h,u,c,f,p,m,d,g,v=t.style;for(a in e)f=e[a],o=l[a],o?i=o.parse(t,f,a,this,i,n,e):(c=Q(t,a,r)+"",d="string"==typeof f,"color"===a||"fill"===a||"stroke"===a||-1!==a.indexOf("Color")||d&&P.test(f)?(d||(f=he(f),f=(f.length>3?"rgba(":"rgb(")+f.join(",")+")"),i=ge(v,a,c,f,!0,"transparent",i,0,n)):!d||-1===f.indexOf(" ")&&-1===f.indexOf(",")?(h=parseFloat(c),p=h||0===h?c.substr((h+"").length):"",(""===c||"auto"===c)&&("width"===a||"height"===a?(h=ie(t,a,r),p="px"):"left"===a||"top"===a?(h=H(t,a,r),p="px"):(h="opacity"!==a?0:1,p="")),g=d&&"="===f.charAt(1),g?(u=parseInt(f.charAt(0)+"1",10),f=f.substr(2),u*=parseFloat(f),m=f.replace(T,"")):(u=parseFloat(f),m=d?f.replace(T,""):""),""===m&&(m=a in s?s[a]:p),f=u||0===u?(g?u+h:u)+m:e[a],p!==m&&""!==m&&(u||0===u)&&h&&(h=$(t,a,h,p),"%"===m?(h/=$(t,a,100,"%")/100,e.strictUnits!==!0&&(c=h+"%")):"em"===m||"rem"===m?h/=$(t,a,1,m):"px"!==m&&(u=$(t,a,u,m),m="px"),g&&(u||0===u)&&(f=u+h+m)),g&&(u+=h),!h&&0!==h||!u&&0!==u?void 0!==v[a]&&(f||"NaN"!=f+""&&null!=f)?(i=new me(v,a,u||h||0,0,i,-1,a,!1,0,c,f),i.xs0="none"!==f||"display"!==a&&-1===a.indexOf("Style")?f:c):q("invalid "+a+" tween value: "+e[a]):(i=new me(v,a,h,u-h,i,0,a,_!==!1&&("px"===m||"zIndex"===a),0,c,f),i.xs0=m)):i=ge(v,a,c,f,!0,null,i,0,n)),n&&i&&!i.plugin&&(i.plugin=n);return i},h.setRatio=function(t){var e,i,s,r=this._firstPT,n=1e-6;if(1!==t||this._tween._time!==this._tween._duration&&0!==this._tween._time)if(t||this._tween._time!==this._tween._duration&&0!==this._tween._time||this._tween._rawPrevTime===-1e-6)for(;r;){if(e=r.c*t+r.s,r.r?e=Math.round(e):n>e&&e>-n&&(e=0),r.type)if(1===r.type)if(s=r.l,2===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2;else if(3===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3;else if(4===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4;else if(5===s)r.t[r.p]=r.xs0+e+r.xs1+r.xn1+r.xs2+r.xn2+r.xs3+r.xn3+r.xs4+r.xn4+r.xs5;else{for(i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}else-1===r.type?r.t[r.p]=r.xs0:r.setRatio&&r.setRatio(t);else r.t[r.p]=e+r.xs0;r=r._next}else for(;r;)2!==r.type?r.t[r.p]=r.b:r.setRatio(t),r=r._next;else for(;r;){if(2!==r.type)if(r.r&&-1!==r.type)if(e=Math.round(r.s+r.c),r.type){if(1===r.type){for(s=r.l,i=r.xs0+e+r.xs1,s=1;r.l>s;s++)i+=r["xn"+s]+r["xs"+(s+1)];r.t[r.p]=i}}else r.t[r.p]=e+r.xs0;else r.t[r.p]=r.e;else r.setRatio(t);r=r._next}},h._enableTransforms=function(t){this._transform=this._transform||Ne(this._target,r,!0),this._transformType=this._transform.svg&&we||!t&&3!==this._transformType?2:3};var qe=function(){this.t[this.p]=this.e,this.data._linkCSSP(this,this._next,null,!0)};h._addLazySet=function(t,e,i){var s=this._firstPT=new me(t,e,0,0,this._firstPT,2);s.e=i,s.setRatio=qe,s.data=this},h._linkCSSP=function(t,e,i,s){return t&&(e&&(e._prev=t),t._next&&(t._next._prev=t._prev),t._prev?t._prev._next=t._next:this._firstPT===t&&(this._firstPT=t._next,s=!0),i?i._next=t:s||null!==this._firstPT||(this._firstPT=t),t._next=e,t._prev=i),t},h._kill=function(e){var i,s,r,n=e;if(e.autoAlpha||e.alpha){n={};for(s in e)n[s]=e[s];n.opacity=1,n.autoAlpha&&(n.visibility=1)}return e.className&&(i=this._classNamePT)&&(r=i.xfirst,r&&r._prev?this._linkCSSP(r._prev,i._next,r._prev._prev):r===this._firstPT&&(this._firstPT=i._next),i._next&&this._linkCSSP(i._next,i._next._next,r._prev),this._classNamePT=null),t.prototype._kill.call(this,n)};var Ve=function(t,e,i){var s,r,n,a;if(t.slice)for(r=t.length;--r>-1;)Ve(t[r],e,i);else for(s=t.childNodes,r=s.length;--r>-1;)n=s[r],a=n.type,n.style&&(e.push(K(n)),i&&i.push(n)),1!==a&&9!==a&&11!==a||!n.childNodes.length||Ve(n,e,i)};return a.cascadeTo=function(t,i,s){var r,n,a,o,l=e.to(t,i,s),h=[l],_=[],u=[],c=[],f=e._internals.reservedProps;for(t=l._targets||l.target,Ve(t,_,c),l.render(i,!0,!0),Ve(t,u),l.render(0,!0,!0),l._enabled(!0),r=c.length;--r>-1;)if(n=J(c[r],_[r],u[r]),n.firstMPT){n=n.difs;for(a in s)f[a]&&(n[a]=s[a]);o={};for(a in n)o[a]=_[r][a];h.push(e.fromTo(c[r],i,o,n))}return h},t.activate([a]),a},!0),function(){var t=_gsScope._gsDefine.plugin({propName:"roundProps",version:"1.5",priority:-1,API:2,init:function(t,e,i){return this._tween=i,!0}}),e=function(t){for(;t;)t.f||t.blob||(t.r=1),t=t._next},i=t.prototype;i._onInitAllProps=function(){for(var t,i,s,r=this._tween,n=r.vars.roundProps.join?r.vars.roundProps:r.vars.roundProps.split(","),a=n.length,o={},l=r._propLookup.roundProps;--a>-1;)o[n[a]]=1;for(a=n.length;--a>-1;)for(t=n[a],i=r._firstPT;i;)s=i._next,i.pg?i.t._roundProps(o,!0):i.n===t&&(2===i.f&&i.t?e(i.t._firstPT):(this._add(i.t,t,i.s,i.c),s&&(s._prev=i._prev),i._prev?i._prev._next=s:r._firstPT===i&&(r._firstPT=s),i._next=i._prev=null,r._propLookup[t]=l)),i=s;return!1},i._add=function(t,e,i,s){this._addTween(t,e,i,i+s,e,!0),this._overwriteProps.push(e)}}(),function(){_gsScope._gsDefine.plugin({propName:"attr",API:2,version:"0.5.0",init:function(t,e){var i;if("function"!=typeof t.setAttribute)return!1;for(i in e)this._addTween(t,"setAttribute",t.getAttribute(i)+"",e[i]+"",i,!1,i),this._overwriteProps.push(i);return!0}})}(),_gsScope._gsDefine.plugin({propName:"directionalRotation",version:"0.2.1",API:2,init:function(t,e){"object"!=typeof e&&(e={rotation:e}),this.finals={};var i,s,r,n,a,o,l=e.useRadians===!0?2*Math.PI:360,h=1e-6;for(i in e)"useRadians"!==i&&(o=(e[i]+"").split("_"),s=o[0],r=parseFloat("function"!=typeof t[i]?t[i]:t[i.indexOf("set")||"function"!=typeof t["get"+i.substr(3)]?i:"get"+i.substr(3)]()),n=this.finals[i]="string"==typeof s&&"="===s.charAt(1)?r+parseInt(s.charAt(0)+"1",10)*Number(s.substr(2)):Number(s)||0,a=n-r,o.length&&(s=o.join("_"),-1!==s.indexOf("short")&&(a%=l,a!==a%(l/2)&&(a=0>a?a+l:a-l)),-1!==s.indexOf("_cw")&&0>a?a=(a+9999999999*l)%l-(0|a/l)*l:-1!==s.indexOf("ccw")&&a>0&&(a=(a-9999999999*l)%l-(0|a/l)*l)),(a>h||-h>a)&&(this._addTween(t,i,r,r+a,i),this._overwriteProps.push(i)));return!0},set:function(t){var e;if(1!==t)this._super.setRatio.call(this,t);else for(e=this._firstPT;e;)e.f?e.t[e.p](this.finals[e.p]):e.t[e.p]=this.finals[e.p],e=e._next}})._autoCSS=!0,_gsScope._gsDefine("easing.Back",["easing.Ease"],function(t){var e,i,s,r=_gsScope.GreenSockGlobals||_gsScope,n=r.com.greensock,a=2*Math.PI,o=Math.PI/2,l=n._class,h=function(e,i){var s=l("easing."+e,function(){},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,s},_=t.register||function(){},u=function(t,e,i,s){var r=l("easing."+t,{easeOut:new e,easeIn:new i,easeInOut:new s},!0);return _(r,t),r},c=function(t,e,i){this.t=t,this.v=e,i&&(this.next=i,i.prev=this,this.c=i.v-e,this.gap=i.t-t)},f=function(e,i){var s=l("easing."+e,function(t){this._p1=t||0===t?t:1.70158,this._p2=1.525*this._p1},!0),r=s.prototype=new t;return r.constructor=s,r.getRatio=i,r.config=function(t){return new s(t)},s},p=u("Back",f("BackOut",function(t){return(t-=1)*t*((this._p1+1)*t+this._p1)+1}),f("BackIn",function(t){return t*t*((this._p1+1)*t-this._p1)}),f("BackInOut",function(t){return 1>(t*=2)?.5*t*t*((this._p2+1)*t-this._p2):.5*((t-=2)*t*((this._p2+1)*t+this._p2)+2)})),m=l("easing.SlowMo",function(t,e,i){e=e||0===e?e:.7,null==t?t=.7:t>1&&(t=1),this._p=1!==t?e:0,this._p1=(1-t)/2,this._p2=t,this._p3=this._p1+this._p2,this._calcEnd=i===!0},!0),d=m.prototype=new t;return d.constructor=m,d.getRatio=function(t){var e=t+(.5-t)*this._p;return this._p1>t?this._calcEnd?1-(t=1-t/this._p1)*t:e-(t=1-t/this._p1)*t*t*t*e:t>this._p3?this._calcEnd?1-(t=(t-this._p3)/this._p1)*t:e+(t-e)*(t=(t-this._p3)/this._p1)*t*t*t:this._calcEnd?1:e},m.ease=new m(.7,.7),d.config=m.config=function(t,e,i){return new m(t,e,i)},e=l("easing.SteppedEase",function(t){t=t||1,this._p1=1/t,this._p2=t+1},!0),d=e.prototype=new t,d.constructor=e,d.getRatio=function(t){return 0>t?t=0:t>=1&&(t=.999999999),(this._p2*t>>0)*this._p1},d.config=e.config=function(t){return new e(t)},i=l("easing.RoughEase",function(e){e=e||{};for(var i,s,r,n,a,o,l=e.taper||"none",h=[],_=0,u=0|(e.points||20),f=u,p=e.randomize!==!1,m=e.clamp===!0,d=e.template instanceof t?e.template:null,g="number"==typeof e.strength?.4*e.strength:.4;--f>-1;)i=p?Math.random():1/u*f,s=d?d.getRatio(i):i,"none"===l?r=g:"out"===l?(n=1-i,r=n*n*g):"in"===l?r=i*i*g:.5>i?(n=2*i,r=.5*n*n*g):(n=2*(1-i),r=.5*n*n*g),p?s+=Math.random()*r-.5*r:f%2?s+=.5*r:s-=.5*r,m&&(s>1?s=1:0>s&&(s=0)),h[_++]={x:i,y:s};for(h.sort(function(t,e){return t.x-e.x}),o=new c(1,1,null),f=u;--f>-1;)a=h[f],o=new c(a.x,a.y,o);this._prev=new c(0,0,0!==o.t?o:o.next)},!0),d=i.prototype=new t,d.constructor=i,d.getRatio=function(t){var e=this._prev;if(t>e.t){for(;e.next&&t>=e.t;)e=e.next;e=e.prev}else for(;e.prev&&e.t>=t;)e=e.prev;return this._prev=e,e.v+(t-e.t)/e.gap*e.c},d.config=function(t){return new i(t)},i.ease=new i,u("Bounce",h("BounceOut",function(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}),h("BounceIn",function(t){return 1/2.75>(t=1-t)?1-7.5625*t*t:2/2.75>t?1-(7.5625*(t-=1.5/2.75)*t+.75):2.5/2.75>t?1-(7.5625*(t-=2.25/2.75)*t+.9375):1-(7.5625*(t-=2.625/2.75)*t+.984375)}),h("BounceInOut",function(t){var e=.5>t;return t=e?1-2*t:2*t-1,t=1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375,e?.5*(1-t):.5*t+.5})),u("Circ",h("CircOut",function(t){return Math.sqrt(1-(t-=1)*t)}),h("CircIn",function(t){return-(Math.sqrt(1-t*t)-1)}),h("CircInOut",function(t){return 1>(t*=2)?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)})),s=function(e,i,s){var r=l("easing."+e,function(t,e){this._p1=t>=1?t:1,this._p2=(e||s)/(1>t?t:1),this._p3=this._p2/a*(Math.asin(1/this._p1)||0),this._p2=a/this._p2},!0),n=r.prototype=new t;return n.constructor=r,n.getRatio=i,n.config=function(t,e){return new r(t,e)},r},u("Elastic",s("ElasticOut",function(t){return this._p1*Math.pow(2,-10*t)*Math.sin((t-this._p3)*this._p2)+1},.3),s("ElasticIn",function(t){return-(this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2))},.3),s("ElasticInOut",function(t){return 1>(t*=2)?-.5*this._p1*Math.pow(2,10*(t-=1))*Math.sin((t-this._p3)*this._p2):.5*this._p1*Math.pow(2,-10*(t-=1))*Math.sin((t-this._p3)*this._p2)+1},.45)),u("Expo",h("ExpoOut",function(t){return 1-Math.pow(2,-10*t)}),h("ExpoIn",function(t){return Math.pow(2,10*(t-1))-.001}),h("ExpoInOut",function(t){return 1>(t*=2)?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))})),u("Sine",h("SineOut",function(t){return Math.sin(t*o)}),h("SineIn",function(t){return-Math.cos(t*o)+1}),h("SineInOut",function(t){return-.5*(Math.cos(Math.PI*t)-1)})),l("easing.EaseLookup",{find:function(e){return t.map[e]}},!0),_(r.SlowMo,"SlowMo","ease,"),_(i,"RoughEase","ease,"),_(e,"SteppedEase","ease,"),p},!0)}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()(),function(t,e){"use strict";var i=t.GreenSockGlobals=t.GreenSockGlobals||t;if(!i.TweenLite){var s,r,n,a,o,l=function(t){var e,s=t.split("."),r=i;for(e=0;s.length>e;e++)r[s[e]]=r=r[s[e]]||{};return r},h=l("com.greensock"),_=1e-10,u=function(t){var e,i=[],s=t.length;for(e=0;e!==s;i.push(t[e++]));return i},c=function(){},f=function(){var t=Object.prototype.toString,e=t.call([]);return function(i){return null!=i&&(i instanceof Array||"object"==typeof i&&!!i.push&&t.call(i)===e)}}(),p={},m=function(s,r,n,a){this.sc=p[s]?p[s].sc:[],p[s]=this,this.gsClass=null,this.func=n;var o=[];this.check=function(h){for(var _,u,c,f,d,g=r.length,v=g;--g>-1;)(_=p[r[g]]||new m(r[g],[])).gsClass?(o[g]=_.gsClass,v--):h&&_.sc.push(this);if(0===v&&n)for(u=("com.greensock."+s).split("."),c=u.pop(),f=l(u.join("."))[c]=this.gsClass=n.apply(n,o),a&&(i[c]=f,d="undefined"!=typeof module&&module.exports,!d&&"function"==typeof define&&define.amd?define((t.GreenSockAMDPath?t.GreenSockAMDPath+"/":"")+s.split(".").pop(),[],function(){return f}):s===e&&d&&(module.exports=f)),g=0;this.sc.length>g;g++)this.sc[g].check()},this.check(!0)},d=t._gsDefine=function(t,e,i,s){return new m(t,e,i,s)},g=h._class=function(t,e,i){return e=e||function(){},d(t,[],function(){return e},i),e};d.globals=i;var v=[0,0,1,1],y=[],T=g("easing.Ease",function(t,e,i,s){this._func=t,this._type=i||0,this._power=s||0,this._params=e?v.concat(e):v},!0),x=T.map={},w=T.register=function(t,e,i,s){for(var r,n,a,o,l=e.split(","),_=l.length,u=(i||"easeIn,easeOut,easeInOut").split(",");--_>-1;)for(n=l[_],r=s?g("easing."+n,null,!0):h.easing[n]||{},a=u.length;--a>-1;)o=u[a],x[n+"."+o]=x[o+n]=r[o]=t.getRatio?t:t[o]||new t};for(n=T.prototype,n._calcEnd=!1,n.getRatio=function(t){if(this._func)return this._params[0]=t,this._func.apply(null,this._params);var e=this._type,i=this._power,s=1===e?1-t:2===e?t:.5>t?2*t:2*(1-t);return 1===i?s*=s:2===i?s*=s*s:3===i?s*=s*s*s:4===i&&(s*=s*s*s*s),1===e?1-s:2===e?s:.5>t?s/2:1-s/2},s=["Linear","Quad","Cubic","Quart","Quint,Strong"],r=s.length;--r>-1;)n=s[r]+",Power"+r,w(new T(null,null,1,r),n,"easeOut",!0),w(new T(null,null,2,r),n,"easeIn"+(0===r?",easeNone":"")),w(new T(null,null,3,r),n,"easeInOut");x.linear=h.easing.Linear.easeIn,x.swing=h.easing.Quad.easeInOut;var b=g("events.EventDispatcher",function(t){this._listeners={},this._eventTarget=t||this});n=b.prototype,n.addEventListener=function(t,e,i,s,r){r=r||0;var n,l,h=this._listeners[t],_=0;for(null==h&&(this._listeners[t]=h=[]),l=h.length;--l>-1;)n=h[l],n.c===e&&n.s===i?h.splice(l,1):0===_&&r>n.pr&&(_=l+1);h.splice(_,0,{c:e,s:i,up:s,pr:r}),this!==a||o||a.wake()},n.removeEventListener=function(t,e){var i,s=this._listeners[t];if(s)for(i=s.length;--i>-1;)if(s[i].c===e)return s.splice(i,1),void 0},n.dispatchEvent=function(t){var e,i,s,r=this._listeners[t];if(r)for(e=r.length,i=this._eventTarget;--e>-1;)s=r[e],s&&(s.up?s.c.call(s.s||i,{type:t,target:i}):s.c.call(s.s||i))};var P=t.requestAnimationFrame,k=t.cancelAnimationFrame,S=Date.now||function(){return(new Date).getTime()},R=S();for(s=["ms","moz","webkit","o"],r=s.length;--r>-1&&!P;)P=t[s[r]+"RequestAnimationFrame"],k=t[s[r]+"CancelAnimationFrame"]||t[s[r]+"CancelRequestAnimationFrame"];g("Ticker",function(t,e){var i,s,r,n,l,h=this,u=S(),f=e!==!1&&P,p=500,m=33,d="tick",g=function(t){var e,a,o=S()-R;o>p&&(u+=o-m),R+=o,h.time=(R-u)/1e3,e=h.time-l,(!i||e>0||t===!0)&&(h.frame++,l+=e+(e>=n?.004:n-e),a=!0),t!==!0&&(r=s(g)),a&&h.dispatchEvent(d)};b.call(h),h.time=h.frame=0,h.tick=function(){g(!0)},h.lagSmoothing=function(t,e){p=t||1/_,m=Math.min(e,p,0)},h.sleep=function(){null!=r&&(f&&k?k(r):clearTimeout(r),s=c,r=null,h===a&&(o=!1))},h.wake=function(){null!==r?h.sleep():h.frame>10&&(R=S()-p+5),s=0===i?c:f&&P?P:function(t){return setTimeout(t,0|1e3*(l-h.time)+1)},h===a&&(o=!0),g(2)},h.fps=function(t){return arguments.length?(i=t,n=1/(i||60),l=this.time+n,h.wake(),void 0):i},h.useRAF=function(t){return arguments.length?(h.sleep(),f=t,h.fps(i),void 0):f},h.fps(t),setTimeout(function(){f&&5>h.frame&&h.useRAF(!1)},1500)}),n=h.Ticker.prototype=new h.events.EventDispatcher,n.constructor=h.Ticker;var O=g("core.Animation",function(t,e){if(this.vars=e=e||{},this._duration=this._totalDuration=t||0,this._delay=Number(e.delay)||0,this._timeScale=1,this._active=e.immediateRender===!0,this.data=e.data,this._reversed=e.reversed===!0,W){o||a.wake();var i=this.vars.useFrames?G:W;i.add(this,i._time),this.vars.paused&&this.paused(!0)}});a=O.ticker=new h.Ticker,n=O.prototype,n._dirty=n._gc=n._initted=n._paused=!1,n._totalTime=n._time=0,n._rawPrevTime=-1,n._next=n._last=n._onUpdate=n._timeline=n.timeline=null,n._paused=!1;var A=function(){o&&S()-R>2e3&&a.wake(),setTimeout(A,2e3)};A(),n.play=function(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},n.pause=function(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},n.resume=function(t,e){return null!=t&&this.seek(t,e),this.paused(!1)},n.seek=function(t,e){return this.totalTime(Number(t),e!==!1)},n.restart=function(t,e){return this.reversed(!1).paused(!1).totalTime(t?-this._delay:0,e!==!1,!0)},n.reverse=function(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},n.render=function(){},n.invalidate=function(){return this._time=this._totalTime=0,this._initted=this._gc=!1,this._rawPrevTime=-1,(this._gc||!this.timeline)&&this._enabled(!0),this},n.isActive=function(){var t,e=this._timeline,i=this._startTime;return!e||!this._gc&&!this._paused&&e.isActive()&&(t=e.rawTime())>=i&&i+this.totalDuration()/this._timeScale>t},n._enabled=function(t,e){return o||a.wake(),this._gc=!t,this._active=this.isActive(),e!==!0&&(t&&!this.timeline?this._timeline.add(this,this._startTime-this._delay):!t&&this.timeline&&this._timeline._remove(this,!0)),!1},n._kill=function(){return this._enabled(!1,!1)},n.kill=function(t,e){return this._kill(t,e),this},n._uncache=function(t){for(var e=t?this:this.timeline;e;)e._dirty=!0,e=e.timeline;return this},n._swapSelfInParams=function(t){for(var e=t.length,i=t.concat();--e>-1;)"{self}"===t[e]&&(i[e]=this);return i},n._callback=function(t){var e=this.vars;e[t].apply(e[t+"Scope"]||e.callbackScope||this,e[t+"Params"]||y)},n.eventCallback=function(t,e,i,s){if("on"===(t||"").substr(0,2)){var r=this.vars;if(1===arguments.length)return r[t];null==e?delete r[t]:(r[t]=e,r[t+"Params"]=f(i)&&-1!==i.join("").indexOf("{self}")?this._swapSelfInParams(i):i,r[t+"Scope"]=s),"onUpdate"===t&&(this._onUpdate=e)}return this},n.delay=function(t){return arguments.length?(this._timeline.smoothChildTiming&&this.startTime(this._startTime+t-this._delay),this._delay=t,this):this._delay},n.duration=function(t){return arguments.length?(this._duration=this._totalDuration=t,this._uncache(!0),this._timeline.smoothChildTiming&&this._time>0&&this._time<this._duration&&0!==t&&this.totalTime(this._totalTime*(t/this._duration),!0),this):(this._dirty=!1,this._duration)},n.totalDuration=function(t){return this._dirty=!1,arguments.length?this.duration(t):this._totalDuration},n.time=function(t,e){return arguments.length?(this._dirty&&this.totalDuration(),this.totalTime(t>this._duration?this._duration:t,e)):this._time},n.totalTime=function(t,e,i){if(o||a.wake(),!arguments.length)return this._totalTime;if(this._timeline){if(0>t&&!i&&(t+=this.totalDuration()),this._timeline.smoothChildTiming){this._dirty&&this.totalDuration();var s=this._totalDuration,r=this._timeline;if(t>s&&!i&&(t=s),this._startTime=(this._paused?this._pauseTime:r._time)-(this._reversed?s-t:t)/this._timeScale,r._dirty||this._uncache(!1),r._timeline)for(;r._timeline;)r._timeline._time!==(r._startTime+r._totalTime)/r._timeScale&&r.totalTime(r._totalTime,!0),r=r._timeline}this._gc&&this._enabled(!0,!1),(this._totalTime!==t||0===this._duration)&&(F.length&&Q(),this.render(t,e,!1),F.length&&Q())}return this},n.progress=n.totalProgress=function(t,e){var i=this.duration();return arguments.length?this.totalTime(i*t,e):i?this._time/i:this.ratio},n.startTime=function(t){return arguments.length?(t!==this._startTime&&(this._startTime=t,this.timeline&&this.timeline._sortChildren&&this.timeline.add(this,t-this._delay)),this):this._startTime},n.endTime=function(t){return this._startTime+(0!=t?this.totalDuration():this.duration())/this._timeScale},n.timeScale=function(t){if(!arguments.length)return this._timeScale;if(t=t||_,this._timeline&&this._timeline.smoothChildTiming){var e=this._pauseTime,i=e||0===e?e:this._timeline.totalTime();this._startTime=i-(i-this._startTime)*this._timeScale/t}return this._timeScale=t,this._uncache(!1)},n.reversed=function(t){return arguments.length?(t!=this._reversed&&(this._reversed=t,this.totalTime(this._timeline&&!this._timeline.smoothChildTiming?this.totalDuration()-this._totalTime:this._totalTime,!0)),this):this._reversed},n.paused=function(t){if(!arguments.length)return this._paused;var e,i,s=this._timeline;return t!=this._paused&&s&&(o||t||a.wake(),e=s.rawTime(),i=e-this._pauseTime,!t&&s.smoothChildTiming&&(this._startTime+=i,this._uncache(!1)),this._pauseTime=t?e:null,this._paused=t,this._active=this.isActive(),!t&&0!==i&&this._initted&&this.duration()&&(e=s.smoothChildTiming?this._totalTime:(e-this._startTime)/this._timeScale,this.render(e,e===this._totalTime,!0))),this._gc&&!t&&this._enabled(!0,!1),this};var C=g("core.SimpleTimeline",function(t){O.call(this,0,t),this.autoRemoveChildren=this.smoothChildTiming=!0});n=C.prototype=new O,n.constructor=C,n.kill()._gc=!1,n._first=n._last=n._recent=null,n._sortChildren=!1,n.add=n.insert=function(t,e){var i,s;if(t._startTime=Number(e||0)+t._delay,t._paused&&this!==t._timeline&&(t._pauseTime=t._startTime+(this.rawTime()-t._startTime)/t._timeScale),t.timeline&&t.timeline._remove(t,!0),t.timeline=t._timeline=this,t._gc&&t._enabled(!0,!0),i=this._last,this._sortChildren)for(s=t._startTime;i&&i._startTime>s;)i=i._prev;return i?(t._next=i._next,i._next=t):(t._next=this._first,this._first=t),t._next?t._next._prev=t:this._last=t,t._prev=i,this._recent=t,this._timeline&&this._uncache(!0),this},n._remove=function(t,e){return t.timeline===this&&(e||t._enabled(!1,!0),t._prev?t._prev._next=t._next:this._first===t&&(this._first=t._next),t._next?t._next._prev=t._prev:this._last===t&&(this._last=t._prev),t._next=t._prev=t.timeline=null,t===this._recent&&(this._recent=this._last),this._timeline&&this._uncache(!0)),this},n.render=function(t,e,i){var s,r=this._first;for(this._totalTime=this._time=this._rawPrevTime=t;r;)s=r._next,(r._active||t>=r._startTime&&!r._paused)&&(r._reversed?r.render((r._dirty?r.totalDuration():r._totalDuration)-(t-r._startTime)*r._timeScale,e,i):r.render((t-r._startTime)*r._timeScale,e,i)),r=s},n.rawTime=function(){return o||a.wake(),this._totalTime};var D=g("TweenLite",function(e,i,s){if(O.call(this,i,s),this.render=D.prototype.render,null==e)throw"Cannot tween a null target.";this.target=e="string"!=typeof e?e:D.selector(e)||e;var r,n,a,o=e.jquery||e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType),l=this.vars.overwrite;if(this._overwrite=l=null==l?V[D.defaultOverwrite]:"number"==typeof l?l>>0:V[l],(o||e instanceof Array||e.push&&f(e))&&"number"!=typeof e[0])for(this._targets=a=u(e),this._propLookup=[],this._siblings=[],r=0;a.length>r;r++)n=a[r],n?"string"!=typeof n?n.length&&n!==t&&n[0]&&(n[0]===t||n[0].nodeType&&n[0].style&&!n.nodeType)?(a.splice(r--,1),this._targets=a=a.concat(u(n))):(this._siblings[r]=$(n,this,!1),1===l&&this._siblings[r].length>1&&K(n,this,null,1,this._siblings[r])):(n=a[r--]=D.selector(n),"string"==typeof n&&a.splice(r+1,1)):a.splice(r--,1);else this._propLookup={},this._siblings=$(e,this,!1),1===l&&this._siblings.length>1&&K(e,this,null,1,this._siblings);(this.vars.immediateRender||0===i&&0===this._delay&&this.vars.immediateRender!==!1)&&(this._time=-_,this.render(-this._delay))},!0),M=function(e){return e&&e.length&&e!==t&&e[0]&&(e[0]===t||e[0].nodeType&&e[0].style&&!e.nodeType)},z=function(t,e){var i,s={};for(i in t)q[i]||i in e&&"transform"!==i&&"x"!==i&&"y"!==i&&"width"!==i&&"height"!==i&&"className"!==i&&"border"!==i||!(!j[i]||j[i]&&j[i]._autoCSS)||(s[i]=t[i],delete t[i]);t.css=s};n=D.prototype=new O,n.constructor=D,n.kill()._gc=!1,n.ratio=0,n._firstPT=n._targets=n._overwrittenProps=n._startAt=null,n._notifyPluginsOfEnabled=n._lazy=!1,D.version="1.18.0",D.defaultEase=n._ease=new T(null,null,1,1),D.defaultOverwrite="auto",D.ticker=a,D.autoSleep=120,D.lagSmoothing=function(t,e){a.lagSmoothing(t,e)},D.selector=t.$||t.jQuery||function(e){var i=t.$||t.jQuery;return i?(D.selector=i,i(e)):"undefined"==typeof document?e:document.querySelectorAll?document.querySelectorAll(e):document.getElementById("#"===e.charAt(0)?e.substr(1):e)};var F=[],I={},E=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,N=function(t){for(var e,i=this._firstPT,s=1e-6;i;)e=i.blob?t?this.join(""):this.start:i.c*t+i.s,i.r?e=Math.round(e):s>e&&e>-s&&(e=0),i.f?i.fp?i.t[i.p](i.fp,e):i.t[i.p](e):i.t[i.p]=e,i=i._next},L=function(t,e,i,s){var r,n,a,o,l,h,_,u=[t,e],c=0,f="",p=0;for(u.start=t,i&&(i(u),t=u[0],e=u[1]),u.length=0,r=t.match(E)||[],n=e.match(E)||[],s&&(s._next=null,s.blob=1,u._firstPT=s),l=n.length,o=0;l>o;o++)_=n[o],h=e.substr(c,e.indexOf(_,c)-c),f+=h||!o?h:",",c+=h.length,p?p=(p+1)%5:"rgba("===h.substr(-5)&&(p=1),_===r[o]||o>=r.length?f+=_:(f&&(u.push(f),f=""),a=parseFloat(r[o]),u.push(a),u._firstPT={_next:u._firstPT,t:u,p:u.length-1,s:a,c:("="===_.charAt(1)?parseInt(_.charAt(0)+"1",10)*parseFloat(_.substr(2)):parseFloat(_)-a)||0,f:0,r:p&&4>p}),c+=_.length;return f+=e.substr(c),f&&u.push(f),u.setRatio=N,u},X=function(t,e,i,s,r,n,a,o){var l,h,_="get"===i?t[e]:i,u=typeof t[e],c="string"==typeof s&&"="===s.charAt(1),f={t:t,p:e,s:_,f:"function"===u,pg:0,n:r||e,r:n,pr:0,c:c?parseInt(s.charAt(0)+"1",10)*parseFloat(s.substr(2)):parseFloat(s)-_||0};return"number"!==u&&("function"===u&&"get"===i&&(h=e.indexOf("set")||"function"!=typeof t["get"+e.substr(3)]?e:"get"+e.substr(3),f.s=_=a?t[h](a):t[h]()),"string"==typeof _&&(a||isNaN(_))?(f.fp=a,l=L(_,s,o||D.defaultStringFilter,f),f={t:l,p:"setRatio",s:0,c:1,f:2,pg:0,n:r||e,pr:0}):c||(f.c=parseFloat(s)-parseFloat(_)||0)),f.c?((f._next=this._firstPT)&&(f._next._prev=f),this._firstPT=f,f):void 0},B=D._internals={isArray:f,isSelector:M,lazyTweens:F,blobDif:L},j=D._plugins={},Y=B.tweenLookup={},U=0,q=B.reservedProps={ease:1,delay:1,overwrite:1,onComplete:1,onCompleteParams:1,onCompleteScope:1,useFrames:1,runBackwards:1,startAt:1,onUpdate:1,onUpdateParams:1,onUpdateScope:1,onStart:1,onStartParams:1,onStartScope:1,onReverseComplete:1,onReverseCompleteParams:1,onReverseCompleteScope:1,onRepeat:1,onRepeatParams:1,onRepeatScope:1,easeParams:1,yoyo:1,immediateRender:1,repeat:1,repeatDelay:1,data:1,paused:1,reversed:1,autoCSS:1,lazy:1,onOverwrite:1,callbackScope:1,stringFilter:1},V={none:0,all:1,auto:2,concurrent:3,allOnStart:4,preexisting:5,"true":1,"false":0},G=O._rootFramesTimeline=new C,W=O._rootTimeline=new C,Z=30,Q=B.lazyRender=function(){var t,e=F.length;for(I={};--e>-1;)t=F[e],t&&t._lazy!==!1&&(t.render(t._lazy[0],t._lazy[1],!0),t._lazy=!1);F.length=0};W._startTime=a.time,G._startTime=a.frame,W._active=G._active=!0,setTimeout(Q,1),O._updateRoot=D.render=function(){var t,e,i;if(F.length&&Q(),W.render((a.time-W._startTime)*W._timeScale,!1,!1),G.render((a.frame-G._startTime)*G._timeScale,!1,!1),F.length&&Q(),a.frame>=Z){Z=a.frame+(parseInt(D.autoSleep,10)||120);

for(i in Y){for(e=Y[i].tweens,t=e.length;--t>-1;)e[t]._gc&&e.splice(t,1);0===e.length&&delete Y[i]}if(i=W._first,(!i||i._paused)&&D.autoSleep&&!G._first&&1===a._listeners.tick.length){for(;i&&i._paused;)i=i._next;i||a.sleep()}}},a.addEventListener("tick",O._updateRoot);var $=function(t,e,i){var s,r,n=t._gsTweenID;if(Y[n||(t._gsTweenID=n="t"+U++)]||(Y[n]={target:t,tweens:[]}),e&&(s=Y[n].tweens,s[r=s.length]=e,i))for(;--r>-1;)s[r]===e&&s.splice(r,1);return Y[n].tweens},H=function(t,e,i,s){var r,n,a=t.vars.onOverwrite;return a&&(r=a(t,e,i,s)),a=D.onOverwrite,a&&(n=a(t,e,i,s)),r!==!1&&n!==!1},K=function(t,e,i,s,r){var n,a,o,l;if(1===s||s>=4){for(l=r.length,n=0;l>n;n++)if((o=r[n])!==e)o._gc||o._kill(null,t,e)&&(a=!0);else if(5===s)break;return a}var h,u=e._startTime+_,c=[],f=0,p=0===e._duration;for(n=r.length;--n>-1;)(o=r[n])===e||o._gc||o._paused||(o._timeline!==e._timeline?(h=h||J(e,0,p),0===J(o,h,p)&&(c[f++]=o)):u>=o._startTime&&o._startTime+o.totalDuration()/o._timeScale>u&&((p||!o._initted)&&2e-10>=u-o._startTime||(c[f++]=o)));for(n=f;--n>-1;)if(o=c[n],2===s&&o._kill(i,t,e)&&(a=!0),2!==s||!o._firstPT&&o._initted){if(2!==s&&!H(o,e))continue;o._enabled(!1,!1)&&(a=!0)}return a},J=function(t,e,i){for(var s=t._timeline,r=s._timeScale,n=t._startTime;s._timeline;){if(n+=s._startTime,r*=s._timeScale,s._paused)return-100;s=s._timeline}return n/=r,n>e?n-e:i&&n===e||!t._initted&&2*_>n-e?_:(n+=t.totalDuration()/t._timeScale/r)>e+_?0:n-e-_};n._init=function(){var t,e,i,s,r,n=this.vars,a=this._overwrittenProps,o=this._duration,l=!!n.immediateRender,h=n.ease;if(n.startAt){this._startAt&&(this._startAt.render(-1,!0),this._startAt.kill()),r={};for(s in n.startAt)r[s]=n.startAt[s];if(r.overwrite=!1,r.immediateRender=!0,r.lazy=l&&n.lazy!==!1,r.startAt=r.delay=null,this._startAt=D.to(this.target,0,r),l)if(this._time>0)this._startAt=null;else if(0!==o)return}else if(n.runBackwards&&0!==o)if(this._startAt)this._startAt.render(-1,!0),this._startAt.kill(),this._startAt=null;else{0!==this._time&&(l=!1),i={};for(s in n)q[s]&&"autoCSS"!==s||(i[s]=n[s]);if(i.overwrite=0,i.data="isFromStart",i.lazy=l&&n.lazy!==!1,i.immediateRender=l,this._startAt=D.to(this.target,0,i),l){if(0===this._time)return}else this._startAt._init(),this._startAt._enabled(!1),this.vars.immediateRender&&(this._startAt=null)}if(this._ease=h=h?h instanceof T?h:"function"==typeof h?new T(h,n.easeParams):x[h]||D.defaultEase:D.defaultEase,n.easeParams instanceof Array&&h.config&&(this._ease=h.config.apply(h,n.easeParams)),this._easeType=this._ease._type,this._easePower=this._ease._power,this._firstPT=null,this._targets)for(t=this._targets.length;--t>-1;)this._initProps(this._targets[t],this._propLookup[t]={},this._siblings[t],a?a[t]:null)&&(e=!0);else e=this._initProps(this.target,this._propLookup,this._siblings,a);if(e&&D._onPluginEvent("_onInitAllProps",this),a&&(this._firstPT||"function"!=typeof this.target&&this._enabled(!1,!1)),n.runBackwards)for(i=this._firstPT;i;)i.s+=i.c,i.c=-i.c,i=i._next;this._onUpdate=n.onUpdate,this._initted=!0},n._initProps=function(e,i,s,r){var n,a,o,l,h,_;if(null==e)return!1;I[e._gsTweenID]&&Q(),this.vars.css||e.style&&e!==t&&e.nodeType&&j.css&&this.vars.autoCSS!==!1&&z(this.vars,e);for(n in this.vars)if(_=this.vars[n],q[n])_&&(_ instanceof Array||_.push&&f(_))&&-1!==_.join("").indexOf("{self}")&&(this.vars[n]=_=this._swapSelfInParams(_,this));else if(j[n]&&(l=new j[n])._onInitTween(e,this.vars[n],this)){for(this._firstPT=h={_next:this._firstPT,t:l,p:"setRatio",s:0,c:1,f:1,n:n,pg:1,pr:l._priority},a=l._overwriteProps.length;--a>-1;)i[l._overwriteProps[a]]=this._firstPT;(l._priority||l._onInitAllProps)&&(o=!0),(l._onDisable||l._onEnable)&&(this._notifyPluginsOfEnabled=!0),h._next&&(h._next._prev=h)}else i[n]=X.call(this,e,n,"get",_,n,0,null,this.vars.stringFilter);return r&&this._kill(r,e)?this._initProps(e,i,s,r):this._overwrite>1&&this._firstPT&&s.length>1&&K(e,this,i,this._overwrite,s)?(this._kill(i,e),this._initProps(e,i,s,r)):(this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration)&&(I[e._gsTweenID]=!0),o)},n.render=function(t,e,i){var s,r,n,a,o=this._time,l=this._duration,h=this._rawPrevTime;if(t>=l)this._totalTime=this._time=l,this.ratio=this._ease._calcEnd?this._ease.getRatio(1):1,this._reversed||(s=!0,r="onComplete",i=i||this._timeline.autoRemoveChildren),0===l&&(this._initted||!this.vars.lazy||i)&&(this._startTime===this._timeline._duration&&(t=0),(0===t||0>h||h===_&&"isPause"!==this.data)&&h!==t&&(i=!0,h>_&&(r="onReverseComplete")),this._rawPrevTime=a=!e||t||h===t?t:_);else if(1e-7>t)this._totalTime=this._time=0,this.ratio=this._ease._calcEnd?this._ease.getRatio(0):0,(0!==o||0===l&&h>0)&&(r="onReverseComplete",s=this._reversed),0>t&&(this._active=!1,0===l&&(this._initted||!this.vars.lazy||i)&&(h>=0&&(h!==_||"isPause"!==this.data)&&(i=!0),this._rawPrevTime=a=!e||t||h===t?t:_)),this._initted||(i=!0);else if(this._totalTime=this._time=t,this._easeType){var u=t/l,c=this._easeType,f=this._easePower;(1===c||3===c&&u>=.5)&&(u=1-u),3===c&&(u*=2),1===f?u*=u:2===f?u*=u*u:3===f?u*=u*u*u:4===f&&(u*=u*u*u*u),this.ratio=1===c?1-u:2===c?u:.5>t/l?u/2:1-u/2}else this.ratio=this._ease.getRatio(t/l);if(this._time!==o||i){if(!this._initted){if(this._init(),!this._initted||this._gc)return;if(!i&&this._firstPT&&(this.vars.lazy!==!1&&this._duration||this.vars.lazy&&!this._duration))return this._time=this._totalTime=o,this._rawPrevTime=h,F.push(this),this._lazy=[t,e],void 0;this._time&&!s?this.ratio=this._ease.getRatio(this._time/l):s&&this._ease._calcEnd&&(this.ratio=this._ease.getRatio(0===this._time?0:1))}for(this._lazy!==!1&&(this._lazy=!1),this._active||!this._paused&&this._time!==o&&t>=0&&(this._active=!0),0===o&&(this._startAt&&(t>=0?this._startAt.render(t,e,i):r||(r="_dummyGS")),this.vars.onStart&&(0!==this._time||0===l)&&(e||this._callback("onStart"))),n=this._firstPT;n;)n.f?n.t[n.p](n.c*this.ratio+n.s):n.t[n.p]=n.c*this.ratio+n.s,n=n._next;this._onUpdate&&(0>t&&this._startAt&&t!==-1e-4&&this._startAt.render(t,e,i),e||(this._time!==o||s)&&this._callback("onUpdate")),r&&(!this._gc||i)&&(0>t&&this._startAt&&!this._onUpdate&&t!==-1e-4&&this._startAt.render(t,e,i),s&&(this._timeline.autoRemoveChildren&&this._enabled(!1,!1),this._active=!1),!e&&this.vars[r]&&this._callback(r),0===l&&this._rawPrevTime===_&&a!==_&&(this._rawPrevTime=0))}},n._kill=function(t,e,i){if("all"===t&&(t=null),null==t&&(null==e||e===this.target))return this._lazy=!1,this._enabled(!1,!1);e="string"!=typeof e?e||this._targets||this.target:D.selector(e)||e;var s,r,n,a,o,l,h,_,u,c=i&&this._time&&i._startTime===this._startTime&&this._timeline===i._timeline;if((f(e)||M(e))&&"number"!=typeof e[0])for(s=e.length;--s>-1;)this._kill(t,e[s],i)&&(l=!0);else{if(this._targets){for(s=this._targets.length;--s>-1;)if(e===this._targets[s]){o=this._propLookup[s]||{},this._overwrittenProps=this._overwrittenProps||[],r=this._overwrittenProps[s]=t?this._overwrittenProps[s]||{}:"all";break}}else{if(e!==this.target)return!1;o=this._propLookup,r=this._overwrittenProps=t?this._overwrittenProps||{}:"all"}if(o){if(h=t||o,_=t!==r&&"all"!==r&&t!==o&&("object"!=typeof t||!t._tempKill),i&&(D.onOverwrite||this.vars.onOverwrite)){for(n in h)o[n]&&(u||(u=[]),u.push(n));if((u||!t)&&!H(this,i,e,u))return!1}for(n in h)(a=o[n])&&(c&&(a.f?a.t[a.p](a.s):a.t[a.p]=a.s,l=!0),a.pg&&a.t._kill(h)&&(l=!0),a.pg&&0!==a.t._overwriteProps.length||(a._prev?a._prev._next=a._next:a===this._firstPT&&(this._firstPT=a._next),a._next&&(a._next._prev=a._prev),a._next=a._prev=null),delete o[n]),_&&(r[n]=1);!this._firstPT&&this._initted&&this._enabled(!1,!1)}}return l},n.invalidate=function(){return this._notifyPluginsOfEnabled&&D._onPluginEvent("_onDisable",this),this._firstPT=this._overwrittenProps=this._startAt=this._onUpdate=null,this._notifyPluginsOfEnabled=this._active=this._lazy=!1,this._propLookup=this._targets?{}:[],O.prototype.invalidate.call(this),this.vars.immediateRender&&(this._time=-_,this.render(-this._delay)),this},n._enabled=function(t,e){if(o||a.wake(),t&&this._gc){var i,s=this._targets;if(s)for(i=s.length;--i>-1;)this._siblings[i]=$(s[i],this,!0);else this._siblings=$(this.target,this,!0)}return O.prototype._enabled.call(this,t,e),this._notifyPluginsOfEnabled&&this._firstPT?D._onPluginEvent(t?"_onEnable":"_onDisable",this):!1},D.to=function(t,e,i){return new D(t,e,i)},D.from=function(t,e,i){return i.runBackwards=!0,i.immediateRender=0!=i.immediateRender,new D(t,e,i)},D.fromTo=function(t,e,i,s){return s.startAt=i,s.immediateRender=0!=s.immediateRender&&0!=i.immediateRender,new D(t,e,s)},D.delayedCall=function(t,e,i,s,r){return new D(e,0,{delay:t,onComplete:e,onCompleteParams:i,callbackScope:s,onReverseComplete:e,onReverseCompleteParams:i,immediateRender:!1,lazy:!1,useFrames:r,overwrite:0})},D.set=function(t,e){return new D(t,0,e)},D.getTweensOf=function(t,e){if(null==t)return[];t="string"!=typeof t?t:D.selector(t)||t;var i,s,r,n;if((f(t)||M(t))&&"number"!=typeof t[0]){for(i=t.length,s=[];--i>-1;)s=s.concat(D.getTweensOf(t[i],e));for(i=s.length;--i>-1;)for(n=s[i],r=i;--r>-1;)n===s[r]&&s.splice(i,1)}else for(s=$(t).concat(),i=s.length;--i>-1;)(s[i]._gc||e&&!s[i].isActive())&&s.splice(i,1);return s},D.killTweensOf=D.killDelayedCallsTo=function(t,e,i){"object"==typeof e&&(i=e,e=!1);for(var s=D.getTweensOf(t,e),r=s.length;--r>-1;)s[r]._kill(i,t)};var te=g("plugins.TweenPlugin",function(t,e){this._overwriteProps=(t||"").split(","),this._propName=this._overwriteProps[0],this._priority=e||0,this._super=te.prototype},!0);if(n=te.prototype,te.version="1.18.0",te.API=2,n._firstPT=null,n._addTween=X,n.setRatio=N,n._kill=function(t){var e,i=this._overwriteProps,s=this._firstPT;if(null!=t[this._propName])this._overwriteProps=[];else for(e=i.length;--e>-1;)null!=t[i[e]]&&i.splice(e,1);for(;s;)null!=t[s.n]&&(s._next&&(s._next._prev=s._prev),s._prev?(s._prev._next=s._next,s._prev=null):this._firstPT===s&&(this._firstPT=s._next)),s=s._next;return!1},n._roundProps=function(t,e){for(var i=this._firstPT;i;)(t[this._propName]||null!=i.n&&t[i.n.split(this._propName+"_").join("")])&&(i.r=e),i=i._next},D._onPluginEvent=function(t,e){var i,s,r,n,a,o=e._firstPT;if("_onInitAllProps"===t){for(;o;){for(a=o._next,s=r;s&&s.pr>o.pr;)s=s._next;(o._prev=s?s._prev:n)?o._prev._next=o:r=o,(o._next=s)?s._prev=o:n=o,o=a}o=e._firstPT=r}for(;o;)o.pg&&"function"==typeof o.t[t]&&o.t[t]()&&(i=!0),o=o._next;return i},te.activate=function(t){for(var e=t.length;--e>-1;)t[e].API===te.API&&(j[(new t[e])._propName]=t[e]);return!0},d.plugin=function(t){if(!(t&&t.propName&&t.init&&t.API))throw"illegal plugin definition.";var e,i=t.propName,s=t.priority||0,r=t.overwriteProps,n={init:"_onInitTween",set:"setRatio",kill:"_kill",round:"_roundProps",initAll:"_onInitAllProps"},a=g("plugins."+i.charAt(0).toUpperCase()+i.substr(1)+"Plugin",function(){te.call(this,i,s),this._overwriteProps=r||[]},t.global===!0),o=a.prototype=new te(i);o.constructor=a,a.API=t.API;for(e in n)"function"==typeof t[e]&&(o[n[e]]=t[e]);return a.version=t.version,te.activate([a]),a},s=t._gsQueue){for(r=0;s.length>r;r++)s[r]();for(n in p)p[n].func||t.console.log("GSAP encountered missing dependency: com.greensock."+n)}o=!1}}("undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window,"TweenMax");



// MorphSVGPlugin

var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";var a=Math.PI/180,b=180/Math.PI,c=/[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,d=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,e=/[achlmqstvz]/gi,f=/\d+e[\-\+]\d+/gi,g=_gsScope._gsDefine.globals.TweenLite,h="codepen",i="MorphSVGPlugin",j=String.fromCharCode(103,114,101,101,110,115,111,99,107,46,99,111,109),k=String.fromCharCode(47,114,101,113,117,105,114,101,115,45,109,101,109,98,101,114,115,104,105,112,47),l=function(a){for(var b=-1!==('http://codepen.io').indexOf(String.fromCharCode(103,114,101,101,110,115,111,99,107))&&-1!==a.indexOf(String.fromCharCode(108,111,99,97,108,104,111,115,116)),c=[j,String.fromCharCode(99,111,100,101,112,101,110,46,105,111),String.fromCharCode(99,111,100,101,112,101,110,46,100,101,118),String.fromCharCode(99,115,115,45,116,114,105,99,107,115,46,99,111,109),String.fromCharCode(99,100,112,110,46,105,111),String.fromCharCode(103,97,110,110,111,110,46,116,118),String.fromCharCode(99,111,100,101,99,97,110,121,111,110,46,110,101,116),String.fromCharCode(116,104,101,109,101,102,111,114,101,115,116,46,110,101,116),String.fromCharCode(99,101,114,101,98,114,97,120,46,99,111,46,117,107),String.fromCharCode(116,121,109,112,97,110,117,115,46,110,101,116),String.fromCharCode(116,119,101,101,110,109,97,120,46,99,111,109),String.fromCharCode(116,119,101,101,110,108,105,116,101,46,99,111,109),String.fromCharCode(112,108,110,107,114,46,99,111),String.fromCharCode(104,111,116,106,97,114,46,99,111,109),String.fromCharCode(106,115,102,105,100,100,108,101,46,110,101,116)],d=c.length;--d>-1;)if(-1!==a.indexOf(c[d]))return!0;return b&&window&&window.console&&console.log(String.fromCharCode(87,65,82,78,73,78,71,58,32,97,32,115,112,101,99,105,97,108,32,118,101,114,115,105,111,110,32,111,102,32)+i+String.fromCharCode(32,105,115,32,114,117,110,110,105,110,103,32,108,111,99,97,108,108,121,44,32,98,117,116,32,105,116,32,119,105,108,108,32,110,111,116,32,119,111,114,107,32,111,110,32,97,32,108,105,118,101,32,100,111,109,97,105,110,32,98,101,99,97,117,115,101,32,105,116,32,105,115,32,97,32,109,101,109,98,101,114,115,104,105,112,32,98,101,110,101,102,105,116,32,111,102,32,67,108,117,98,32,71,114,101,101,110,83,111,99,107,46,32,80,108,101,97,115,101,32,115,105,103,110,32,117,112,32,97,116,32,104,116,116,112,58,47,47,103,114,101,101,110,115,111,99,107,46,99,111,109,47,99,108,117,98,47,32,97,110,100,32,116,104,101,110,32,100,111,119,110,108,111,97,100,32,116,104,101,32,39,114,101,97,108,39,32,118,101,114,115,105,111,110,32,102,114,111,109,32,121,111,117,114,32,71,114,101,101,110,83,111,99,107,32,97,99,99,111,117,110,116,32,119,104,105,99,104,32,104,97,115,32,110,111,32,115,117,99,104,32,108,105,109,105,116,97,116,105,111,110,115,46,32,84,104,101,32,102,105,108,101,32,121,111,117,39,114,101,32,117,115,105,110,103,32,119,97,115,32,108,105,107,101,108,121,32,100,111,119,110,108,111,97,100,101,100,32,102,114,111,109,32,101,108,115,101,119,104,101,114,101,32,111,110,32,116,104,101,32,119,101,98,32,97,110,100,32,105,115,32,114,101,115,116,114,105,99,116,101,100,32,116,111,32,108,111,99,97,108,32,117,115,101,32,111,114,32,111,110,32,115,105,116,101,115,32,108,105,107,101,32,99,111,100,101,112,101,110,46,105,111,46)),b}('codepen.io'),m=function(a){window.console&&console.log(a)},n=function(b,c){var g,h,i,j,k,l,d=Math.ceil(Math.abs(c)/90),e=0,f=[];for(b*=a,c*=a,g=c/d,h=4/3*Math.sin(g/2)/(1+Math.cos(g/2)),l=0;d>l;l++)i=b+l*g,j=Math.cos(i),k=Math.sin(i),f[e++]=j-h*k,f[e++]=k+h*j,i+=g,j=Math.cos(i),k=Math.sin(i),f[e++]=j+h*k,f[e++]=k-h*j,f[e++]=j,f[e++]=k;return f},o=function(c,d,e,f,g,h,i,j,k){if(c!==j||d!==k){e=Math.abs(e),f=Math.abs(f);var l=g%360*a,m=Math.cos(l),o=Math.sin(l),p=(c-j)/2,q=(d-k)/2,r=m*p+o*q,s=-o*p+m*q,t=e*e,u=f*f,v=r*r,w=s*s,x=v/t+w/u;x>1&&(e=Math.sqrt(x)*e,f=Math.sqrt(x)*f,t=e*e,u=f*f);var y=h===i?-1:1,z=(t*u-t*w-u*v)/(t*w+u*v);0>z&&(z=0);var A=y*Math.sqrt(z),B=A*(e*s/f),C=A*-(f*r/e),D=(c+j)/2,E=(d+k)/2,F=D+(m*B-o*C),G=E+(o*B+m*C),H=(r-B)/e,I=(s-C)/f,J=(-r-B)/e,K=(-s-C)/f,L=Math.sqrt(H*H+I*I),M=H;y=0>I?-1:1;var N=y*Math.acos(M/L)*b;L=Math.sqrt((H*H+I*I)*(J*J+K*K)),M=H*J+I*K,y=0>H*K-I*J?-1:1;var O=y*Math.acos(M/L)*b;!i&&O>0?O-=360:i&&0>O&&(O+=360),O%=360,N%=360;var V,W,X,P=n(N,O),Q=m*e,R=o*e,S=o*-f,T=m*f,U=P.length-2;for(V=0;U>V;V+=2)W=P[V],X=P[V+1],P[V]=W*Q+X*S+F,P[V+1]=W*R+X*T+G;return P[P.length-2]=j,P[P.length-1]=k,P}},p=function(a){var k,l,n,p,q,r,s,t,u,v,w,x,y,b=(a+"").replace(f,function(a){var b=+a;return 1e-4>b&&b>-1e-4?0:a}).match(c)||[],d=[],e=0,g=0,h=b.length,i=2,j=0;if(!a||!isNaN(b[0])||isNaN(b[1]))return m("ERROR: malformed path data: "+a),d;for(k=0;h>k;k++)if(y=q,isNaN(b[k])?(q=b[k].toUpperCase(),r=q!==b[k]):k--,n=+b[k+1],p=+b[k+2],r&&(n+=e,p+=g),0===k&&(t=n,u=p),"M"===q)s&&s.length<8&&(d.length-=1,i=0),e=t=n,g=u=p,s=[n,p],j+=i,i=2,d.push(s),k+=2,q="L";else if("C"===q)s||(s=[0,0]),s[i++]=n,s[i++]=p,r||(e=g=0),s[i++]=e+1*b[k+3],s[i++]=g+1*b[k+4],s[i++]=e+=1*b[k+5],s[i++]=g+=1*b[k+6],k+=6;else if("S"===q)"C"===y||"S"===y?(v=e-s[i-4],w=g-s[i-3],s[i++]=e+v,s[i++]=g+w):(s[i++]=e,s[i++]=g),s[i++]=n,s[i++]=p,r||(e=g=0),s[i++]=e+=1*b[k+3],s[i++]=g+=1*b[k+4],k+=4;else if("Q"===q)v=n-e,w=p-g,s[i++]=e+2*v/3,s[i++]=g+2*w/3,r||(e=g=0),e+=1*b[k+3],g+=1*b[k+4],v=n-e,w=p-g,s[i++]=e+2*v/3,s[i++]=g+2*w/3,s[i++]=e,s[i++]=g,k+=4;else if("T"===q)v=e-s[i-4],w=g-s[i-3],s[i++]=e+v,s[i++]=g+w,v=e+1.5*v-n,w=g+1.5*w-p,s[i++]=n+2*v/3,s[i++]=p+2*w/3,s[i++]=e=n,s[i++]=g=p,k+=2;else if("H"===q)p=g,s[i++]=e+(n-e)/3,s[i++]=g+(p-g)/3,s[i++]=e+2*(n-e)/3,s[i++]=g+2*(p-g)/3,s[i++]=e=n,s[i++]=p,k+=1;else if("V"===q)p=n,n=e,r&&(p+=g-e),s[i++]=n,s[i++]=g+(p-g)/3,s[i++]=n,s[i++]=g+2*(p-g)/3,s[i++]=n,s[i++]=g=p,k+=1;else if("L"===q||"Z"===q)"Z"===q&&(n=t,p=u,s.closed=!0),("L"===q||Math.abs(e-n)>.5||Math.abs(g-p)>.5)&&(s[i++]=e+(n-e)/3,s[i++]=g+(p-g)/3,s[i++]=e+2*(n-e)/3,s[i++]=g+2*(p-g)/3,s[i++]=n,s[i++]=p,"L"===q&&(k+=2)),e=n,g=p;else if("A"===q){for(x=o(e,g,1*b[k+1],1*b[k+2],1*b[k+3],1*b[k+4],1*b[k+5],(r?e:0)+1*b[k+6],(r?g:0)+1*b[k+7]),l=0;l<x.length;l++)s[i++]=x[l];e=s[i-2],g=s[i-1],k+=7}else m("Error: malformed path data: "+a);return d.totalPoints=j+i,d},q=function(a,b){var g,h,i,j,k,l,m,n,o,p,q,r,s,t,c=0,d=.999999,e=a.length,f=b/((e-2)/6);for(s=2;e>s;s+=6)for(c+=f;c>d;)g=a[s-2],h=a[s-1],i=a[s],j=a[s+1],k=a[s+2],l=a[s+3],m=a[s+4],n=a[s+5],t=1/(Math.floor(c)+1),o=g+(i-g)*t,q=i+(k-i)*t,o+=(q-o)*t,q+=(k+(m-k)*t-q)*t,p=h+(j-h)*t,r=j+(l-j)*t,p+=(r-p)*t,r+=(l+(n-l)*t-r)*t,a.splice(s,4,g+(i-g)*t,h+(j-h)*t,o,p,o+(q-o)*t,p+(r-p)*t,q,r,k+(m-k)*t,l+(n-l)*t),s+=6,e+=6,c--;return a},r=function(a){var e,f,g,h,b="",c=a.length,d=100;for(f=0;c>f;f++){for(h=a[f],b+="M"+h[0]+","+h[1]+" C",e=h.length,g=2;e>g;g++)b+=(h[g++]*d|0)/d+","+(h[g++]*d|0)/d+" "+(h[g++]*d|0)/d+","+(h[g++]*d|0)/d+" "+(h[g++]*d|0)/d+","+(h[g]*d|0)/d+" ";h.closed&&(b+="z")}return b},s=function(a){for(var b=[],c=a.length-1,d=0;--c>-1;)b[d++]=a[c],b[d++]=a[c+1],c--;for(c=0;d>c;c++)a[c]=b[c];a.reversed=a.reversed?!1:!0},t=function(a){var e,b=a.length,c=0,d=0;for(e=0;b>e;e++)c+=a[e++],d+=a[e];return[c/(b/2),d/(b/2)]},u=function(a){var g,h,i,b=a.length,c=a[0],d=c,e=a[1],f=e;for(i=6;b>i;i+=6)g=a[i],h=a[i+1],g>c?c=g:d>g&&(d=g),h>e?e=h:f>h&&(f=h);return a.centerX=(c+d)/2,a.centerY=(e+f)/2,a.size=(c-d)*(e-f)},v=function(a){for(var g,h,i,j,k,b=a.length,c=a[0][0],d=c,e=a[0][1],f=e;--b>-1;)for(k=a[b],g=k.length,j=6;g>j;j+=6)h=k[j],i=k[j+1],h>c?c=h:d>h&&(d=h),i>e?e=i:f>i&&(f=i);return a.centerX=(c+d)/2,a.centerY=(e+f)/2,a.size=(c-d)*(e-f)},w=function(a,b){return b.length-a.length},x=function(a,b){var c=a.size||u(a),d=b.size||u(b);return Math.abs(d-c)<(c+d)/20?b.centerX-a.centerX||b.centerY-a.centerY:d-c},y=function(a,b){var f,g,c=a.slice(0),d=a.length,e=d-2;for(b=0|b,f=0;d>f;f++)g=(f+b)%e,a[f++]=c[g],a[f]=c[g+1]},z=function(a,b,c,d,e){var i,j,k,l,f=a.length,g=0,h=f-2;for(c*=6,j=0;f>j;j+=6)i=(j+c)%h,l=a[i]-(b[j]-d),k=a[i+1]-(b[j+1]-e),g+=Math.sqrt(k*k+l*l);return g},A=function(a,b,c){var k,l,m,d=a.length,e=t(a),f=t(b),g=f[0]-e[0],h=f[1]-e[1],i=z(a,b,0,g,h),j=0;for(m=6;d>m;m+=6)l=z(a,b,m/6,g,h),i>l&&(i=l,j=m);if(c)for(k=a.slice(0),s(k),m=6;d>m;m+=6)l=z(k,b,m/6,g,h),i>l&&(i=l,j=-m);return j/6},B=function(a,b,c){for(var h,i,j,k,l,m,d=a.length,e=99999999999,f=0,g=0;--d>-1;)for(h=a[d],m=h.length,l=0;m>l;l+=6)i=h[l]-b,j=h[l+1]-c,k=Math.sqrt(i*i+j*j),e>k&&(e=k,f=h[l],g=h[l+1]);return[f,g]},C=function(a,b,c,d,e,f){var m,n,o,p,q,g=b.length,h=0,i=Math.min(a.size||u(a),b[c].size||u(b[c]))*d,j=999999999999,k=a.centerX+e,l=a.centerY+f;for(n=c;g>n&&(m=b[n].size||u(b[n]),!(i>m));n++)o=b[n].centerX-k,p=b[n].centerY-l,q=Math.sqrt(o*o+p*p),j>q&&(h=n,j=q);return q=b[h],b.splice(h,1),q},D=function(a,b,c,d){var p,r,t,z,D,E,F,e=b.length-a.length,f=e>0?b:a,g=e>0?a:b,h=0,i="complexity"===d?w:x,j="position"===d?0:"number"==typeof d?d:.8,k=g.length,l="object"==typeof c&&c.push?c.slice(0):[c],n="reverse"===l[0]||l[0]<0,o="log"===c;if(g[0]){if(f.length>1&&(a.sort(i),b.sort(i),E=f.size||v(f),E=g.size||v(g),E=f.centerX-g.centerX,F=f.centerY-g.centerY,i===x))for(k=0;k<g.length;k++)f.splice(k,0,C(g[k],f,k,j,E,F));if(e)for(0>e&&(e=-e),f[0].length>g[0].length&&q(g[0],(f[0].length-g[0].length)/6|0),k=g.length;e>h;)z=f[k].size||u(f[k]),t=B(g,f[k].centerX,f[k].centerY),z=t[0],D=t[1],g[k++]=[z,D,z,D,z,D,z,D],g.totalPoints+=8,h++;for(k=0;k<a.length;k++)p=b[k],r=a[k],e=p.length-r.length,0>e?q(p,-e/6|0):e>0&&q(r,e/6|0),n&&!r.reversed&&s(r),c=l[k]||0===l[k]?l[k]:"auto",c&&(r.closed||Math.abs(r[0]-r[r.length-2])<.5&&Math.abs(r[1]-r[r.length-1])<.5?"auto"===c||"log"===c?(l[k]=c=A(r,p,0===k),0>c&&(n=!0,s(r),c=-c),y(r,6*c)):"reverse"!==c&&(k&&0>c&&s(r),y(r,6*(0>c?-c:c))):!n&&("auto"===c&&Math.abs(p[0]-r[0])+Math.abs(p[1]-r[1])+Math.abs(p[p.length-2]-r[r.length-2])+Math.abs(p[p.length-1]-r[r.length-1])>Math.abs(p[0]-r[r.length-2])+Math.abs(p[1]-r[r.length-1])+Math.abs(p[p.length-2]-r[0])+Math.abs(p[p.length-1]-r[1])||c%2)?(s(r),l[k]=-1,n=!0):"auto"===c?l[k]=0:"reverse"===c&&(l[k]=-1),r.closed!==p.closed&&(r.closed=p.closed=!1));return o&&m("shapeIndex:["+l.join(",")+"]"),l}},E=function(a,b,c,d){var e=p(a[0]),f=p(a[1]);D(e,f,b||0===b?b:"auto",c)&&(a[0]=r(e),a[1]=r(f),("log"===d||d===!0)&&m('precompile:["'+a[0]+'","'+a[1]+'"]'))},F=function(a,b,c){return b||c||a||0===a?function(d){E(d,a,b,c)}:E},G=function(a,b){if(!b)return a;var g,h,i,c=a.match(d)||[],e=c.length,f="";for("reverse"===b?(h=e-1,g=-2):(h=(2*(parseInt(b,10)||0)+1+100*e)%e,g=2),i=0;e>i;i+=2)f+=c[h-1]+","+c[h]+" ",h=(h+g)%e;return f},H=function(a,b){var h,i,j,k,l,m,n,c=0,d=parseFloat(a[0]),e=parseFloat(a[1]),f=d+","+e+" ",g=.999999;for(j=a.length,h=.5*b/(.5*j-1),i=0;j-2>i;i+=2){if(c+=h,m=parseFloat(a[i+2]),n=parseFloat(a[i+3]),c>g)for(l=1/(Math.floor(c)+1),k=1;c>g;)f+=(d+(m-d)*l*k).toFixed(2)+","+(e+(n-e)*l*k).toFixed(2)+" ",c--,k++;f+=m+","+n+" ",d=m,e=n}return f},I=function(a){var b=a[0].match(d)||[],c=a[1].match(d)||[],e=c.length-b.length;e>0?a[0]=H(b,e):a[1]=H(c,-e)},J=function(a){return isNaN(a)?I:function(b){I(b),b[1]=G(b[1],parseInt(a,10))}},K=function(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg","path"),d=Array.prototype.slice.call(a.attributes),e=d.length;for(b=","+b+",";--e>-1;)-1===b.indexOf(","+d[e].nodeName+",")&&c.setAttributeNS(null,d[e].nodeName,d[e].nodeValue);return c},L=function(a,b){var f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,c=a.tagName.toLowerCase(),e=.552284749831;return"path"!==c&&a.getBBox?(k=K(a,"x,y,width,height,cx,cy,rx,ry,r,x1,x2,y1,y2,points"),"rect"===c?(i=+a.getAttribute("rx")||0,j=+a.getAttribute("ry")||0,g=+a.getAttribute("x")||0,h=+a.getAttribute("y")||0,o=(+a.getAttribute("width")||0)-2*i,p=(+a.getAttribute("height")||0)-2*j,i||j?(q=g+i*(1-e),r=g+i,s=r+o,t=s+i*e,u=s+i,v=h+j*(1-e),w=h+j,x=w+p,y=x+j*e,z=x+j,f="M"+u+","+w+" V"+x+" C"+[u,y,t,z,s,z,s-(s-r)/3,z,r+(s-r)/3,z,r,z,q,z,g,y,g,x,g,x-(x-w)/3,g,w+(x-w)/3,g,w,g,v,q,h,r,h,r+(s-r)/3,h,s-(s-r)/3,h,s,h,t,h,u,v,u,w].join(",")+"z"):f="M"+(g+o)+","+h+" v"+p+" h"+-o+" v"+-p+" h"+o+"z"):"circle"===c||"ellipse"===c?("circle"===c?(i=j=+a.getAttribute("r")||0,m=i*e):(i=+a.getAttribute("rx")||0,j=+a.getAttribute("ry")||0,m=j*e),g=+a.getAttribute("cx")||0,h=+a.getAttribute("cy")||0,l=i*e,f="M"+(g+i)+","+h+" C"+[g+i,h+m,g+l,h+j,g,h+j,g-l,h+j,g-i,h+m,g-i,h,g-i,h-m,g-l,h-j,g,h-j,g+l,h-j,g+i,h-m,g+i,h].join(",")+"z"):"line"===c?f="M"+a.getAttribute("x1")+","+a.getAttribute("y1")+" L"+a.getAttribute("x2")+","+a.getAttribute("y2"):("polyline"===c||"polygon"===c)&&(n=(a.getAttribute("points")+"").match(d)||[],g=n.shift(),h=n.shift(),f="M"+g+","+h+" L"+n.join(","),"polygon"===c&&(f+=","+g+","+h+"z")),k.setAttribute("d",f),b&&a.parentNode&&(a.parentNode.insertBefore(k,a),a.parentNode.removeChild(a)),k):a},M=function(a,b,c){var f,h,e="string"==typeof a;return(!e||(a.match(d)||[]).length<3)&&(f=e?g.selector(a):a&&a[0]?a:[a],f&&f[0]?(f=f[0],h=f.nodeName.toUpperCase(),b&&"PATH"!==h&&(f=L(f,!1),h="PATH"),a=f.getAttribute("PATH"===h?"d":"points")||"",f===c&&(a=f.getAttributeNS(null,"data-original")||a)):(m("WARNING: invalid morph to: "+a),a=!1)),a},N="Use MorphSVGPlugin.convertToPath(elementOrSelectorText) to convert to a path before morphing.",O=_gsScope._gsDefine.plugin({propName:"morphSVG",API:2,global:!0,version:"0.8.4",init:function(a,b,c){var d,f,g,n,o;return"function"!=typeof a.setAttribute?!1:l?(d=a.nodeName.toUpperCase(),o="POLYLINE"===d||"POLYGON"===d,"PATH"===d||o?(f="PATH"===d?"d":"points",("string"==typeof b||b.getBBox||b[0])&&(b={shape:b}),n=M(b.shape||b.d||b.points||"","d"===f,a),o&&e.test(n)?(m("WARNING: a <"+d+"> cannot accept path data. "+N),!1):(n&&(this._target=a,a.getAttributeNS(null,"data-original")||a.setAttributeNS(null,"data-original",a.getAttribute(f)),g=this._addTween(a,"setAttribute",a.getAttribute(f)+"",n+"","morphSVG",!1,f,"object"==typeof b.precompile?function(a){a[0]=b.precompile[0],a[1]=b.precompile[1]}:"d"===f?F(b.shapeIndex,b.map||O.defaultMap,b.precompile):J(b.shapeIndex)),g&&(this._overwriteProps.push("morphSVG"),g.end=n,g.endProp=f)),l)):(m("WARNING: cannot morph a <"+d+"> SVG element. "+N),!1)):(window.location.href="http://"+j+k+"?plugin="+i+"&source="+h,!1)},set:function(a){var b;if(this._super.setRatio.call(this,a),1===a)for(b=this._firstPT;b;)b.end&&this._target.setAttribute(b.endProp,b.end),b=b._next}});O.pathFilter=E,O.pointsFilter=I,O.subdivideRawBezier=q,O.defaultMap="size",O.pathDataToRawBezier=function(a){return p(M(a,!0))},O.equalizeSegmentQuantity=D,O.convertToPath=function(a,b){"string"==typeof a&&(a=g.selector(a));for(var c=a&&0!==a.length?a.length&&a[0]&&a[0].nodeType?Array.prototype.slice.call(a,0):[a]:[],d=c.length;--d>-1;)c[d]=L(c[d],b!==!1);return c},O.pathDataToBezier=function(a,b){var e,f,h,i,j,k,l,m,c=p(M(a,!0))[0]||[],d=0;if(b=b||{},m=b.align||b.relative,i=b.matrix||[1,0,0,1,0,0],j=b.offsetX||0,k=b.offsetY||0,"relative"===m||m===!0?(j-=c[0]*i[0]+c[1]*i[2],k-=c[0]*i[1]+c[1]*i[3],d="+="):(j+=i[4],k+=i[5],m&&(m="string"==typeof m?g.selector(m):m&&m[0]?m:[m],m&&m[0]&&(l=m[0].getBBox()||{x:0,y:0},j-=l.x,k-=l.y))),e=[],h=c.length,i)for(f=0;h>f;f+=2)e.push({x:d+(c[f]*i[0]+c[f+1]*i[2]+j),y:d+(c[f]*i[1]+c[f+1]*i[3]+k)});else for(f=0;h>f;f+=2)e.push({x:d+(c[f]+j),y:d+(c[f+1]+k)});return e}}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()();

// findShapeIndex

function findShapeIndex(e,t,n){n=n||{};var i,o,r,a,l,d,s,p,c,u,h,g=document,f=(window.GreenSockGlobals||window).TweenLite,y=function(e){return g.querySelectorAll(e)},b=function(e,t){var n,i=g.createElementNS("http://www.w3.org/2000/svg",e),o=/([a-z])([A-Z])/g;for(n in t)i.setAttributeNS(null,n.replace(o,"$1-$2").toLowerCase(),t[n]);return i},x=/(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,k=function(e,t){var n,i;return("string"!=typeof e||(e.match(x)||[]).length<3)&&(n=f.selector(e),n&&n[0]?(n=n[0],i=n.nodeName.toUpperCase(),t&&"PATH"!==i&&(n=MorphSVGPlugin.convertToPath(n,!1)[0],i="PATH"),e=n.getAttribute("PATH"===i?"d":"points")||""):(console.log("WARNING: invalid morph to: "+e),e=!1)),e},v=function(){var e=g.createElement("div"),t=g.createElement("div"),l=y("body")[0];return r=g.createElement("div"),a=g.createElement("div"),t.setAttribute("id","shapeIndexLabel"),i=b("circle",{cx:0,cy:0,r:(n.startStrokeWidth||3)+3,fill:n.startStroke||"red"}),o=b("circle",{cx:0,cy:0,r:(n.endStrokeWidth||3)+3,fill:n.endStroke||"yellow"}),f.set(e,{padding:"0px",position:"absolute",bottom:0,fontSize:"20px",textAlign:"center",backgroundColor:"black",color:"#91e600",border:"1px solid #999",left:"50%",xPercent:-50,yPercent:-50,userSelect:"none",fontFamily:"sans-serif"}),f.set(t,{display:"inline-block",minWidth:"210px",marginRight:"10px",textAlign:"center",marginLeft:"10px"}),f.set([r,a],{display:"inline-block",padding:"0 15px",color:"#ccc",height:"50px",lineHeight:"48px",cursor:"pointer"}),f.set(a,{borderRight:"1px solid #999"}),f.set(r,{borderLeft:"1px solid #999"}),a.innerHTML=" - ",r.innerHTML=" + ",e.appendChild(a),e.appendChild(t),e.appendChild(r),l&&l.appendChild(e),t},m=y("#shapeIndexLabel")[0]||v(),S=0,w=function(){l.reversed(!l.reversed()).resume(),d.reversed(!d.reversed()).resume()},A={x:0,y:0},L=function(e,t,n){return s=MorphSVGPlugin.pathDataToRawBezier(e),p=MorphSVGPlugin.pathDataToRawBezier(t),MorphSVGPlugin.equalizeSegmentQuantity(s,p,n),[s[0][0],s[0][1],p[0][0],p[0][1]]},T=function(){var r=L(e.getAttribute("d"),k(t,!0),S);A.x=r[0],A.y=r[1],i.setAttribute("cx",A.x),i.setAttribute("cy",A.y),o.setAttribute("cx",r[2]),o.setAttribute("cy",r[3]),l=f.to(e,n.duration||3,{delay:.5,morphSVG:{shape:t,shapeIndex:S},ease:n.ease||"Linear.easeNone",onComplete:w,onReverseComplete:w}),d=f.to(A,n.duration||3,{delay:.5,x:r[2],y:r[3],ease:n.ease||"Linear.easeNone",onUpdate:function(){i.setAttribute("cx",A.x),i.setAttribute("cy",A.y)}})},C=function(){m.innerHTML="shapeIndex: "+S+(S===c?" (auto)":""),l.seek(0).kill(),d.seek(0).kill(),T(),f.fromTo(m.parentNode,.4,{backgroundColor:"#777"},{backgroundColor:"black",ease:Linear.easeNone})},N=function(){S=(S+1)%(u+1),C()},P=function(){S=(S-1)%(u+1),C()};return"string"==typeof e&&(e=f.selector(e)[0]),e?e.nodeName&&"PATH"!==e.nodeName.toUpperCase()?void console.log("ERROR: target of findShapeIndex() must be a path."):(e.push&&e[0]&&e[0].nodeName&&(e=e[0]),e.parentNode&&(e.parentNode.appendChild(o),e.parentNode.appendChild(i)),("string"!=typeof t||(t.match(x)||[]).length<3)&&(h=f.selector(t),h&&h[0]&&(h=h[0],f.set(h,{display:"block",strokeWidth:n.endStrokeWidth||3,stroke:n.endStroke||"yellow",fill:n.endFill||"none",visibility:"visible",opacity:n.endOpacity||.7}))),f.set(e,{display:"block",strokeWidth:n.startStrokeWidth||3,stroke:n.startStroke||"red",fill:n.startFill||"none",visibility:"visible",opacity:n.startOpacity||.7}),s=MorphSVGPlugin.pathDataToRawBezier(e.getAttribute("d")),p=MorphSVGPlugin.pathDataToRawBezier(k(t,!0)),c=S=Math.round(MorphSVGPlugin.equalizeSegmentQuantity(s,p,"auto")[0]),u=s[0].length/6|0,f.killTweensOf(e,!1,{morphSVG:!0}),T(),m.innerHTML="shapeIndex: "+S+(S===c?" (auto)":""),window.addEventListener("keydown",function(e){var t=e.keyCode;38===t||39===t||85===t?N():(37===t||40===t||68===t)&&P()}),r.addEventListener("click",N),void a.addEventListener("click",P)):void console.log("ERROR: target not found for findShapeIndex(). Please use a valid target.")}

 
/*! ScrollMagic v2.0.5 | (c) 2015 Jan Paepke (@janpaepke) | license & info: http://scrollmagic.io */
!function(e,t){"function"==typeof define&&define.amd?define(t):"object"==typeof exports?module.exports=t():e.ScrollMagic=t()}(this,function(){"use strict";var e=function(){};e.version="2.0.5",window.addEventListener("mousewheel",function(){});var t="data-scrollmagic-pin-spacer";e.Controller=function(r){var o,s,a="ScrollMagic.Controller",l="FORWARD",c="REVERSE",u="PAUSED",f=n.defaults,d=this,h=i.extend({},f,r),g=[],p=!1,v=0,m=u,w=!0,y=0,S=!0,b=function(){for(var e in h)f.hasOwnProperty(e)||delete h[e];if(h.container=i.get.elements(h.container)[0],!h.container)throw a+" init failed.";w=h.container===window||h.container===document.body||!document.body.contains(h.container),w&&(h.container=window),y=z(),h.container.addEventListener("resize",T),h.container.addEventListener("scroll",T),h.refreshInterval=parseInt(h.refreshInterval)||f.refreshInterval,E()},E=function(){h.refreshInterval>0&&(s=window.setTimeout(A,h.refreshInterval))},x=function(){return h.vertical?i.get.scrollTop(h.container):i.get.scrollLeft(h.container)},z=function(){return h.vertical?i.get.height(h.container):i.get.width(h.container)},C=this._setScrollPos=function(e){h.vertical?w?window.scrollTo(i.get.scrollLeft(),e):h.container.scrollTop=e:w?window.scrollTo(e,i.get.scrollTop()):h.container.scrollLeft=e},F=function(){if(S&&p){var e=i.type.Array(p)?p:g.slice(0);p=!1;var t=v;v=d.scrollPos();var n=v-t;0!==n&&(m=n>0?l:c),m===c&&e.reverse(),e.forEach(function(e){e.update(!0)})}},L=function(){o=i.rAF(F)},T=function(e){"resize"==e.type&&(y=z(),m=u),p!==!0&&(p=!0,L())},A=function(){if(!w&&y!=z()){var e;try{e=new Event("resize",{bubbles:!1,cancelable:!1})}catch(t){e=document.createEvent("Event"),e.initEvent("resize",!1,!1)}h.container.dispatchEvent(e)}g.forEach(function(e){e.refresh()}),E()};this._options=h;var O=function(e){if(e.length<=1)return e;var t=e.slice(0);return t.sort(function(e,t){return e.scrollOffset()>t.scrollOffset()?1:-1}),t};return this.addScene=function(t){if(i.type.Array(t))t.forEach(function(e){d.addScene(e)});else if(t instanceof e.Scene)if(t.controller()!==d)t.addTo(d);else if(g.indexOf(t)<0){g.push(t),g=O(g),t.on("shift.controller_sort",function(){g=O(g)});for(var n in h.globalSceneOptions)t[n]&&t[n].call(t,h.globalSceneOptions[n])}return d},this.removeScene=function(e){if(i.type.Array(e))e.forEach(function(e){d.removeScene(e)});else{var t=g.indexOf(e);t>-1&&(e.off("shift.controller_sort"),g.splice(t,1),e.remove())}return d},this.updateScene=function(t,n){return i.type.Array(t)?t.forEach(function(e){d.updateScene(e,n)}):n?t.update(!0):p!==!0&&t instanceof e.Scene&&(p=p||[],-1==p.indexOf(t)&&p.push(t),p=O(p),L()),d},this.update=function(e){return T({type:"resize"}),e&&F(),d},this.scrollTo=function(n,r){if(i.type.Number(n))C.call(h.container,n,r);else if(n instanceof e.Scene)n.controller()===d&&d.scrollTo(n.scrollOffset(),r);else if(i.type.Function(n))C=n;else{var o=i.get.elements(n)[0];if(o){for(;o.parentNode.hasAttribute(t);)o=o.parentNode;var s=h.vertical?"top":"left",a=i.get.offset(h.container),l=i.get.offset(o);w||(a[s]-=d.scrollPos()),d.scrollTo(l[s]-a[s],r)}}return d},this.scrollPos=function(e){return arguments.length?(i.type.Function(e)&&(x=e),d):x.call(d)},this.info=function(e){var t={size:y,vertical:h.vertical,scrollPos:v,scrollDirection:m,container:h.container,isDocument:w};return arguments.length?void 0!==t[e]?t[e]:void 0:t},this.loglevel=function(){return d},this.enabled=function(e){return arguments.length?(S!=e&&(S=!!e,d.updateScene(g,!0)),d):S},this.destroy=function(e){window.clearTimeout(s);for(var t=g.length;t--;)g[t].destroy(e);return h.container.removeEventListener("resize",T),h.container.removeEventListener("scroll",T),i.cAF(o),null},b(),d};var n={defaults:{container:window,vertical:!0,globalSceneOptions:{},loglevel:2,refreshInterval:100}};e.Controller.addOption=function(e,t){n.defaults[e]=t},e.Controller.extend=function(t){var n=this;e.Controller=function(){return n.apply(this,arguments),this.$super=i.extend({},this),t.apply(this,arguments)||this},i.extend(e.Controller,n),e.Controller.prototype=n.prototype,e.Controller.prototype.constructor=e.Controller},e.Scene=function(n){var o,s,a="BEFORE",l="DURING",c="AFTER",u=r.defaults,f=this,d=i.extend({},u,n),h=a,g=0,p={start:0,end:0},v=0,m=!0,w=function(){for(var e in d)u.hasOwnProperty(e)||delete d[e];for(var t in u)L(t);C()},y={};this.on=function(e,t){return i.type.Function(t)&&(e=e.trim().split(" "),e.forEach(function(e){var n=e.split("."),r=n[0],i=n[1];"*"!=r&&(y[r]||(y[r]=[]),y[r].push({namespace:i||"",callback:t}))})),f},this.off=function(e,t){return e?(e=e.trim().split(" "),e.forEach(function(e){var n=e.split("."),r=n[0],i=n[1]||"",o="*"===r?Object.keys(y):[r];o.forEach(function(e){for(var n=y[e]||[],r=n.length;r--;){var o=n[r];!o||i!==o.namespace&&"*"!==i||t&&t!=o.callback||n.splice(r,1)}n.length||delete y[e]})}),f):f},this.trigger=function(t,n){if(t){var r=t.trim().split("."),i=r[0],o=r[1],s=y[i];s&&s.forEach(function(t){o&&o!==t.namespace||t.callback.call(f,new e.Event(i,t.namespace,f,n))})}return f},f.on("change.internal",function(e){"loglevel"!==e.what&&"tweenChanges"!==e.what&&("triggerElement"===e.what?E():"reverse"===e.what&&f.update())}).on("shift.internal",function(){S(),f.update()}),this.addTo=function(t){return t instanceof e.Controller&&s!=t&&(s&&s.removeScene(f),s=t,C(),b(!0),E(!0),S(),s.info("container").addEventListener("resize",x),t.addScene(f),f.trigger("add",{controller:s}),f.update()),f},this.enabled=function(e){return arguments.length?(m!=e&&(m=!!e,f.update(!0)),f):m},this.remove=function(){if(s){s.info("container").removeEventListener("resize",x);var e=s;s=void 0,e.removeScene(f),f.trigger("remove")}return f},this.destroy=function(e){return f.trigger("destroy",{reset:e}),f.remove(),f.off("*.*"),null},this.update=function(e){if(s)if(e)if(s.enabled()&&m){var t,n=s.info("scrollPos");t=d.duration>0?(n-p.start)/(p.end-p.start):n>=p.start?1:0,f.trigger("update",{startPos:p.start,endPos:p.end,scrollPos:n}),f.progress(t)}else T&&h===l&&O(!0);else s.updateScene(f,!1);return f},this.refresh=function(){return b(),E(),f},this.progress=function(e){if(arguments.length){var t=!1,n=h,r=s?s.info("scrollDirection"):"PAUSED",i=d.reverse||e>=g;if(0===d.duration?(t=g!=e,g=1>e&&i?0:1,h=0===g?a:l):0>e&&h!==a&&i?(g=0,h=a,t=!0):e>=0&&1>e&&i?(g=e,h=l,t=!0):e>=1&&h!==c?(g=1,h=c,t=!0):h!==l||i||O(),t){var o={progress:g,state:h,scrollDirection:r},u=h!=n,p=function(e){f.trigger(e,o)};u&&n!==l&&(p("enter"),p(n===a?"start":"end")),p("progress"),u&&h!==l&&(p(h===a?"start":"end"),p("leave"))}return f}return g};var S=function(){p={start:v+d.offset},s&&d.triggerElement&&(p.start-=s.info("size")*d.triggerHook),p.end=p.start+d.duration},b=function(e){if(o){var t="duration";F(t,o.call(f))&&!e&&(f.trigger("change",{what:t,newval:d[t]}),f.trigger("shift",{reason:t}))}},E=function(e){var n=0,r=d.triggerElement;if(s&&r){for(var o=s.info(),a=i.get.offset(o.container),l=o.vertical?"top":"left";r.parentNode.hasAttribute(t);)r=r.parentNode;var c=i.get.offset(r);o.isDocument||(a[l]-=s.scrollPos()),n=c[l]-a[l]}var u=n!=v;v=n,u&&!e&&f.trigger("shift",{reason:"triggerElementPosition"})},x=function(){d.triggerHook>0&&f.trigger("shift",{reason:"containerResize"})},z=i.extend(r.validate,{duration:function(e){if(i.type.String(e)&&e.match(/^(\.|\d)*\d+%$/)){var t=parseFloat(e)/100;e=function(){return s?s.info("size")*t:0}}if(i.type.Function(e)){o=e;try{e=parseFloat(o())}catch(n){e=-1}}if(e=parseFloat(e),!i.type.Number(e)||0>e)throw o?(o=void 0,0):0;return e}}),C=function(e){e=arguments.length?[e]:Object.keys(z),e.forEach(function(e){var t;if(z[e])try{t=z[e](d[e])}catch(n){t=u[e]}finally{d[e]=t}})},F=function(e,t){var n=!1,r=d[e];return d[e]!=t&&(d[e]=t,C(e),n=r!=d[e]),n},L=function(e){f[e]||(f[e]=function(t){return arguments.length?("duration"===e&&(o=void 0),F(e,t)&&(f.trigger("change",{what:e,newval:d[e]}),r.shifts.indexOf(e)>-1&&f.trigger("shift",{reason:e})),f):d[e]})};this.controller=function(){return s},this.state=function(){return h},this.scrollOffset=function(){return p.start},this.triggerPosition=function(){var e=d.offset;return s&&(e+=d.triggerElement?v:s.info("size")*f.triggerHook()),e};var T,A;f.on("shift.internal",function(e){var t="duration"===e.reason;(h===c&&t||h===l&&0===d.duration)&&O(),t&&_()}).on("progress.internal",function(){O()}).on("add.internal",function(){_()}).on("destroy.internal",function(e){f.removePin(e.reset)});var O=function(e){if(T&&s){var t=s.info(),n=A.spacer.firstChild;if(e||h!==l){var r={position:A.inFlow?"relative":"absolute",top:0,left:0},o=i.css(n,"position")!=r.position;A.pushFollowers?d.duration>0&&(h===c&&0===parseFloat(i.css(A.spacer,"padding-top"))?o=!0:h===a&&0===parseFloat(i.css(A.spacer,"padding-bottom"))&&(o=!0)):r[t.vertical?"top":"left"]=d.duration*g,i.css(n,r),o&&_()}else{"fixed"!=i.css(n,"position")&&(i.css(n,{position:"fixed"}),_());var u=i.get.offset(A.spacer,!0),f=d.reverse||0===d.duration?t.scrollPos-p.start:Math.round(g*d.duration*10)/10;u[t.vertical?"top":"left"]+=f,i.css(A.spacer.firstChild,{top:u.top,left:u.left})}}},_=function(){if(T&&s&&A.inFlow){var e=h===l,t=s.info("vertical"),n=A.spacer.firstChild,r=i.isMarginCollapseType(i.css(A.spacer,"display")),o={};A.relSize.width||A.relSize.autoFullWidth?e?i.css(T,{width:i.get.width(A.spacer)}):i.css(T,{width:"100%"}):(o["min-width"]=i.get.width(t?T:n,!0,!0),o.width=e?o["min-width"]:"auto"),A.relSize.height?e?i.css(T,{height:i.get.height(A.spacer)-(A.pushFollowers?d.duration:0)}):i.css(T,{height:"100%"}):(o["min-height"]=i.get.height(t?n:T,!0,!r),o.height=e?o["min-height"]:"auto"),A.pushFollowers&&(o["padding"+(t?"Top":"Left")]=d.duration*g,o["padding"+(t?"Bottom":"Right")]=d.duration*(1-g)),i.css(A.spacer,o)}},N=function(){s&&T&&h===l&&!s.info("isDocument")&&O()},P=function(){s&&T&&h===l&&((A.relSize.width||A.relSize.autoFullWidth)&&i.get.width(window)!=i.get.width(A.spacer.parentNode)||A.relSize.height&&i.get.height(window)!=i.get.height(A.spacer.parentNode))&&_()},D=function(e){s&&T&&h===l&&!s.info("isDocument")&&(e.preventDefault(),s._setScrollPos(s.info("scrollPos")-((e.wheelDelta||e[s.info("vertical")?"wheelDeltaY":"wheelDeltaX"])/3||30*-e.detail)))};this.setPin=function(e,n){var r={pushFollowers:!0,spacerClass:"scrollmagic-pin-spacer"};if(n=i.extend({},r,n),e=i.get.elements(e)[0],!e)return f;if("fixed"===i.css(e,"position"))return f;if(T){if(T===e)return f;f.removePin()}T=e;var o=T.parentNode.style.display,s=["top","left","bottom","right","margin","marginLeft","marginRight","marginTop","marginBottom"];T.parentNode.style.display="none";var a="absolute"!=i.css(T,"position"),l=i.css(T,s.concat(["display"])),c=i.css(T,["width","height"]);T.parentNode.style.display=o,!a&&n.pushFollowers&&(n.pushFollowers=!1);var u=T.parentNode.insertBefore(document.createElement("div"),T),d=i.extend(l,{position:a?"relative":"absolute",boxSizing:"content-box",mozBoxSizing:"content-box",webkitBoxSizing:"content-box"});if(a||i.extend(d,i.css(T,["width","height"])),i.css(u,d),u.setAttribute(t,""),i.addClass(u,n.spacerClass),A={spacer:u,relSize:{width:"%"===c.width.slice(-1),height:"%"===c.height.slice(-1),autoFullWidth:"auto"===c.width&&a&&i.isMarginCollapseType(l.display)},pushFollowers:n.pushFollowers,inFlow:a},!T.___origStyle){T.___origStyle={};var h=T.style,g=s.concat(["width","height","position","boxSizing","mozBoxSizing","webkitBoxSizing"]);g.forEach(function(e){T.___origStyle[e]=h[e]||""})}return A.relSize.width&&i.css(u,{width:c.width}),A.relSize.height&&i.css(u,{height:c.height}),u.appendChild(T),i.css(T,{position:a?"relative":"absolute",margin:"auto",top:"auto",left:"auto",bottom:"auto",right:"auto"}),(A.relSize.width||A.relSize.autoFullWidth)&&i.css(T,{boxSizing:"border-box",mozBoxSizing:"border-box",webkitBoxSizing:"border-box"}),window.addEventListener("scroll",N),window.addEventListener("resize",N),window.addEventListener("resize",P),T.addEventListener("mousewheel",D),T.addEventListener("DOMMouseScroll",D),O(),f},this.removePin=function(e){if(T){if(h===l&&O(!0),e||!s){var n=A.spacer.firstChild;if(n.hasAttribute(t)){var r=A.spacer.style,o=["margin","marginLeft","marginRight","marginTop","marginBottom"];margins={},o.forEach(function(e){margins[e]=r[e]||""}),i.css(n,margins)}A.spacer.parentNode.insertBefore(n,A.spacer),A.spacer.parentNode.removeChild(A.spacer),T.parentNode.hasAttribute(t)||(i.css(T,T.___origStyle),delete T.___origStyle)}window.removeEventListener("scroll",N),window.removeEventListener("resize",N),window.removeEventListener("resize",P),T.removeEventListener("mousewheel",D),T.removeEventListener("DOMMouseScroll",D),T=void 0}return f};var R,k=[];return f.on("destroy.internal",function(e){f.removeClassToggle(e.reset)}),this.setClassToggle=function(e,t){var n=i.get.elements(e);return 0!==n.length&&i.type.String(t)?(k.length>0&&f.removeClassToggle(),R=t,k=n,f.on("enter.internal_class leave.internal_class",function(e){var t="enter"===e.type?i.addClass:i.removeClass;k.forEach(function(e){t(e,R)})}),f):f},this.removeClassToggle=function(e){return e&&k.forEach(function(e){i.removeClass(e,R)}),f.off("start.internal_class end.internal_class"),R=void 0,k=[],f},w(),f};var r={defaults:{duration:0,offset:0,triggerElement:void 0,triggerHook:.5,reverse:!0,loglevel:2},validate:{offset:function(e){if(e=parseFloat(e),!i.type.Number(e))throw 0;return e},triggerElement:function(e){if(e=e||void 0){var t=i.get.elements(e)[0];if(!t)throw 0;e=t}return e},triggerHook:function(e){var t={onCenter:.5,onEnter:1,onLeave:0};if(i.type.Number(e))e=Math.max(0,Math.min(parseFloat(e),1));else{if(!(e in t))throw 0;e=t[e]}return e},reverse:function(e){return!!e}},shifts:["duration","offset","triggerHook"]};e.Scene.addOption=function(e,t,n,i){e in r.defaults||(r.defaults[e]=t,r.validate[e]=n,i&&r.shifts.push(e))},e.Scene.extend=function(t){var n=this;e.Scene=function(){return n.apply(this,arguments),this.$super=i.extend({},this),t.apply(this,arguments)||this},i.extend(e.Scene,n),e.Scene.prototype=n.prototype,e.Scene.prototype.constructor=e.Scene},e.Event=function(e,t,n,r){r=r||{};for(var i in r)this[i]=r[i];return this.type=e,this.target=this.currentTarget=n,this.namespace=t||"",this.timeStamp=this.timestamp=Date.now(),this};var i=e._util=function(e){var t,n={},r=function(e){return parseFloat(e)||0},i=function(t){return t.currentStyle?t.currentStyle:e.getComputedStyle(t)},o=function(t,n,o,s){if(n=n===document?e:n,n===e)s=!1;else if(!f.DomElement(n))return 0;t=t.charAt(0).toUpperCase()+t.substr(1).toLowerCase();var a=(o?n["offset"+t]||n["outer"+t]:n["client"+t]||n["inner"+t])||0;if(o&&s){var l=i(n);a+="Height"===t?r(l.marginTop)+r(l.marginBottom):r(l.marginLeft)+r(l.marginRight)}return a},s=function(e){return e.replace(/^[^a-z]+([a-z])/g,"$1").replace(/-([a-z])/g,function(e){return e[1].toUpperCase()})};n.extend=function(e){for(e=e||{},t=1;t<arguments.length;t++)if(arguments[t])for(var n in arguments[t])arguments[t].hasOwnProperty(n)&&(e[n]=arguments[t][n]);return e},n.isMarginCollapseType=function(e){return["block","flex","list-item","table","-webkit-box"].indexOf(e)>-1};var a=0,l=["ms","moz","webkit","o"],c=e.requestAnimationFrame,u=e.cancelAnimationFrame;for(t=0;!c&&t<l.length;++t)c=e[l[t]+"RequestAnimationFrame"],u=e[l[t]+"CancelAnimationFrame"]||e[l[t]+"CancelRequestAnimationFrame"];c||(c=function(t){var n=(new Date).getTime(),r=Math.max(0,16-(n-a)),i=e.setTimeout(function(){t(n+r)},r);return a=n+r,i}),u||(u=function(t){e.clearTimeout(t)}),n.rAF=c.bind(e),n.cAF=u.bind(e);var f=n.type=function(e){return Object.prototype.toString.call(e).replace(/^\[object (.+)\]$/,"$1").toLowerCase()};f.String=function(e){return"string"===f(e)},f.Function=function(e){return"function"===f(e)},f.Array=function(e){return Array.isArray(e)},f.Number=function(e){return!f.Array(e)&&e-parseFloat(e)+1>=0},f.DomElement=function(e){return"object"==typeof HTMLElement?e instanceof HTMLElement:e&&"object"==typeof e&&null!==e&&1===e.nodeType&&"string"==typeof e.nodeName};var d=n.get={};return d.elements=function(t){var n=[];if(f.String(t))try{t=document.querySelectorAll(t)}catch(r){return n}if("nodelist"===f(t)||f.Array(t))for(var i=0,o=n.length=t.length;o>i;i++){var s=t[i];n[i]=f.DomElement(s)?s:d.elements(s)}else(f.DomElement(t)||t===document||t===e)&&(n=[t]);return n},d.scrollTop=function(t){return t&&"number"==typeof t.scrollTop?t.scrollTop:e.pageYOffset||0},d.scrollLeft=function(t){return t&&"number"==typeof t.scrollLeft?t.scrollLeft:e.pageXOffset||0},d.width=function(e,t,n){return o("width",e,t,n)},d.height=function(e,t,n){return o("height",e,t,n)},d.offset=function(e,t){var n={top:0,left:0};if(e&&e.getBoundingClientRect){var r=e.getBoundingClientRect();n.top=r.top,n.left=r.left,t||(n.top+=d.scrollTop(),n.left+=d.scrollLeft())}return n},n.addClass=function(e,t){t&&(e.classList?e.classList.add(t):e.className+=" "+t)},n.removeClass=function(e,t){t&&(e.classList?e.classList.remove(t):e.className=e.className.replace(RegExp("(^|\\b)"+t.split(" ").join("|")+"(\\b|$)","gi")," "))},n.css=function(e,t){if(f.String(t))return i(e)[s(t)];if(f.Array(t)){var n={},r=i(e);return t.forEach(function(e){n[e]=r[s(e)]}),n}for(var o in t){var a=t[o];a==parseFloat(a)&&(a+="px"),e.style[s(o)]=a}},n}(window||{});return e});
/*!
 * ScrollMagic v2.0.5 (2015-04-29)
 * The javascript library for magical scroll interactions.
 * (c) 2015 Jan Paepke (@janpaepke)
 * Project Website: http://scrollmagic.io
 * 
 * @version 2.0.5
 * @license Dual licensed under MIT license and GPL.
 * @author Jan Paepke - e-mail@janpaepke.de
 *
 * @file ScrollMagic GSAP Animation Plugin.
 *
 * requires: GSAP ~1.14
 * Powered by the Greensock Animation Platform (GSAP): http://www.greensock.com/js
 * Greensock License info at http://www.greensock.com/licensing/
 */
/**
 * This plugin is meant to be used in conjunction with the Greensock Animation Plattform.  
 * It offers an easy API to trigger Tweens or synchronize them to the scrollbar movement.
 *
 * Both the `lite` and the `max` versions of the GSAP library are supported.  
 * The most basic requirement is `TweenLite`.
 * 
 * To have access to this extension, please include `plugins/animation.gsap.js`.
 * @requires {@link http://greensock.com/gsap|GSAP ~1.14.x}
 * @mixin animation.GSAP
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['ScrollMagic', 'TweenMax', 'TimelineMax'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		// Loads whole gsap package onto global scope.
		require('gsap');
		factory(require('scrollmagic'), TweenMax, TimelineMax);
	} else {
		// Browser globals
		factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic), root.TweenMax || root.TweenLite, root.TimelineMax || root.TimelineLite);
	}
}(this, function (ScrollMagic, Tween, Timeline) {
	"use strict";
	var NAMESPACE = "animation.gsap";

	var
	console = window.console || {},
		err = Function.prototype.bind.call(console.error || console.log ||
		function () {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}
	if (!Tween) {
		err("(" + NAMESPACE + ") -> ERROR: TweenLite or TweenMax could not be found. Please make sure GSAP is loaded before ScrollMagic or use an asynchronous loader like requirejs.");
	}

/*
	 * ----------------------------------------------------------------
	 * Extensions for Scene
	 * ----------------------------------------------------------------
	 */
	/**
	 * Every instance of ScrollMagic.Scene now accepts an additional option.  
	 * See {@link ScrollMagic.Scene} for a complete list of the standard options.
	 * @memberof! animation.GSAP#
	 * @method new ScrollMagic.Scene(options)
	 * @example
	 * var scene = new ScrollMagic.Scene({tweenChanges: true});
	 *
	 * @param {object} [options] - Options for the Scene. The options can be updated at any time.
	 * @param {boolean} [options.tweenChanges=false] - Tweens Animation to the progress target instead of setting it.  
	 Does not affect animations where duration is `0`.
	 */
	/**
	 * **Get** or **Set** the tweenChanges option value.  
	 * This only affects scenes with a duration. If `tweenChanges` is `true`, the progress update when scrolling will not be immediate, but instead the animation will smoothly animate to the target state.  
	 * For a better understanding, try enabling and disabling this option in the [Scene Manipulation Example](../examples/basic/scene_manipulation.html).
	 * @memberof! animation.GSAP#
	 * @method Scene.tweenChanges
	 * 
	 * @example
	 * // get the current tweenChanges option
	 * var tweenChanges = scene.tweenChanges();
	 *
	 * // set new tweenChanges option
	 * scene.tweenChanges(true);
	 *
	 * @fires {@link Scene.change}, when used as setter
	 * @param {boolean} [newTweenChanges] - The new tweenChanges setting of the scene.
	 * @returns {boolean} `get` -  Current tweenChanges option value.
	 * @returns {Scene} `set` -  Parent object for chaining.
	 */
	// add option (TODO: DOC (private for dev))
	ScrollMagic.Scene.addOption("tweenChanges", // name
	false, // default


	function (val) { // validation callback
		return !!val;
	});
	// extend scene
	ScrollMagic.Scene.extend(function () {
		var Scene = this,
			_tween;

		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};

		// set listeners
		Scene.on("progress.plugin_gsap", function () {
			updateTweenProgress();
		});
		Scene.on("destroy.plugin_gsap", function (e) {
			Scene.removeTween(e.reset);
		});

		/**
		 * Update the tween progress to current position.
		 * @private
		 */
		var updateTweenProgress = function () {
			if (_tween) {
				var
				progress = Scene.progress(),
					state = Scene.state();
				if (_tween.repeat && _tween.repeat() === -1) {
					// infinite loop, so not in relation to progress
					if (state === 'DURING' && _tween.paused()) {
						_tween.play();
					} else if (state !== 'DURING' && !_tween.paused()) {
						_tween.pause();
					}
				} else if (progress != _tween.progress()) { // do we even need to update the progress?
					// no infinite loop - so should we just play or go to a specific point in time?
					if (Scene.duration() === 0) {
						// play the animation
						if (progress > 0) { // play from 0 to 1
							_tween.play();
						} else { // play from 1 to 0
							_tween.reverse();
						}
					} else {
						// go to a specific point in time
						if (Scene.tweenChanges() && _tween.tweenTo) {
							// go smooth
							_tween.tweenTo(progress * _tween.duration());
						} else {
							// just hard set it
							_tween.progress(progress).pause();
						}
					}
				}
			}
		};

		/**
		 * Add a tween to the scene.  
		 * If you want to add multiple tweens, add them into a GSAP Timeline object and supply it instead (see example below).  
		 * 
		 * If the scene has a duration, the tween's duration will be projected to the scroll distance of the scene, meaning its progress will be synced to scrollbar movement.  
		 * For a scene with a duration of `0`, the tween will be triggered when scrolling forward past the scene's trigger position and reversed, when scrolling back.  
		 * To gain better understanding, check out the [Simple Tweening example](../examples/basic/simple_tweening.html).
		 *
		 * Instead of supplying a tween this method can also be used as a shorthand for `TweenMax.to()` (see example below).
		 * @memberof! animation.GSAP#
		 *
		 * @example
		 * // add a single tween directly
		 * scene.setTween(TweenMax.to("obj"), 1, {x: 100});
		 *
		 * // add a single tween via variable
		 * var tween = TweenMax.to("obj"), 1, {x: 100};
		 * scene.setTween(tween);
		 *
		 * // add multiple tweens, wrapped in a timeline.
		 * var timeline = new TimelineMax();
		 * var tween1 = TweenMax.from("obj1", 1, {x: 100});
		 * var tween2 = TweenMax.to("obj2", 1, {y: 100});
		 * timeline
		 *		.add(tween1)
		 *		.add(tween2);
		 * scene.addTween(timeline);
		 *
		 * // short hand to add a TweenMax.to() tween
		 * scene.setTween("obj3", 0.5, {y: 100});
		 *
		 * // short hand to add a TweenMax.to() tween for 1 second
		 * // this is useful, when the scene has a duration and the tween duration isn't important anyway
		 * scene.setTween("obj3", {y: 100});
		 *
		 * @param {(object|string)} TweenObject - A TweenMax, TweenLite, TimelineMax or TimelineLite object that should be animated in the scene. Can also be a Dom Element or Selector, when using direct tween definition (see examples).
		 * @param {(number|object)} duration - A duration for the tween, or tween parameters. If an object containing parameters are supplied, a default duration of 1 will be used.
		 * @param {object} params - The parameters for the tween
		 * @returns {Scene} Parent object for chaining.
		 */
		Scene.setTween = function (TweenObject, duration, params) {
			var newTween;
			if (arguments.length > 1) {
				if (arguments.length < 3) {
					params = duration;
					duration = 1;
				}
				TweenObject = Tween.to(TweenObject, duration, params);
			}
			try {
				// wrap Tween into a Timeline Object if available to include delay and repeats in the duration and standardize methods.
				if (Timeline) {
					newTween = new Timeline({
						smoothChildTiming: true
					}).add(TweenObject);
				} else {
					newTween = TweenObject;
				}
				newTween.pause();
			} catch (e) {
				log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenObject");
				return Scene;
			}
			if (_tween) { // kill old tween?
				Scene.removeTween();
			}
			_tween = newTween;

			// some properties need to be transferred it to the wrapper, otherwise they would get lost.
			if (TweenObject.repeat && TweenObject.repeat() === -1) { // TweenMax or TimelineMax Object?
				_tween.repeat(-1);
				_tween.yoyo(TweenObject.yoyo());
			}
			// Some tween validations and debugging helpers
			if (Scene.tweenChanges() && !_tween.tweenTo) {
				log(2, "WARNING: tweenChanges will only work if the TimelineMax object is available for ScrollMagic.");
			}

			// check if there are position tweens defined for the trigger and warn about it :)
			if (_tween && Scene.controller() && Scene.triggerElement() && Scene.loglevel() >= 2) { // controller is needed to know scroll direction.
				var
				triggerTweens = Tween.getTweensOf(Scene.triggerElement()),
					vertical = Scene.controller().info("vertical");
				triggerTweens.forEach(function (value, index) {
					var
					tweenvars = value.vars.css || value.vars,
						condition = vertical ? (tweenvars.top !== undefined || tweenvars.bottom !== undefined) : (tweenvars.left !== undefined || tweenvars.right !== undefined);
					if (condition) {
						log(2, "WARNING: Tweening the position of the trigger element affects the scene timing and should be avoided!");
						return false;
					}
				});
			}

			// warn about tween overwrites, when an element is tweened multiple times
			if (parseFloat(TweenLite.version) >= 1.14) { // onOverwrite only present since GSAP v1.14.0
				var
				list = _tween.getChildren ? _tween.getChildren(true, true, false) : [_tween],
					// get all nested tween objects
					newCallback = function () {
						log(2, "WARNING: tween was overwritten by another. To learn how to avoid this issue see here: https://github.com/janpaepke/ScrollMagic/wiki/WARNING:-tween-was-overwritten-by-another");
					};
				for (var i = 0, thisTween, oldCallback; i < list.length; i++) { /*jshint loopfunc: true */
					thisTween = list[i];
					if (oldCallback !== newCallback) { // if tweens is added more than once
						oldCallback = thisTween.vars.onOverwrite;
						thisTween.vars.onOverwrite = function () {
							if (oldCallback) {
								oldCallback.apply(this, arguments);
							}
							newCallback.apply(this, arguments);
						};
					}
				}
			}
			log(3, "added tween");

			updateTweenProgress();
			return Scene;
		};

		/**
		 * Remove the tween from the scene.  
		 * This will terminate the control of the Scene over the tween.
		 *
		 * Using the reset option you can decide if the tween should remain in the current state or be rewound to set the target elements back to the state they were in before the tween was added to the scene.
		 * @memberof! animation.GSAP#
		 *
		 * @example
		 * // remove the tween from the scene without resetting it
		 * scene.removeTween();
		 *
		 * // remove the tween from the scene and reset it to initial position
		 * scene.removeTween(true);
		 *
		 * @param {boolean} [reset=false] - If `true` the tween will be reset to its initial values.
		 * @returns {Scene} Parent object for chaining.
		 */
		Scene.removeTween = function (reset) {
			if (_tween) {
				if (reset) {
					_tween.progress(0).pause();
				}
				_tween.kill();
				_tween = undefined;
				log(3, "removed tween (reset: " + (reset ? "true" : "false") + ")");
			}
			return Scene;
		};

	});
}));
/*!
 * VERSION: 1.7.5
 * DATE: 2015-02-26
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2015, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope="undefined"!=typeof module&&module.exports&&"undefined"!=typeof global?global:this||window;(_gsScope._gsQueue||(_gsScope._gsQueue=[])).push(function(){"use strict";var t=document.documentElement,e=window,i=function(i,r){var s="x"===r?"Width":"Height",n="scroll"+s,o="client"+s,a=document.body;return i===e||i===t||i===a?Math.max(t[n],a[n])-(e["inner"+s]||t[o]||a[o]):i[n]-i["offset"+s]},r=_gsScope._gsDefine.plugin({propName:"scrollTo",API:2,version:"1.7.5",init:function(t,r,s){return this._wdw=t===e,this._target=t,this._tween=s,"object"!=typeof r&&(r={y:r}),this.vars=r,this._autoKill=r.autoKill!==!1,this.x=this.xPrev=this.getX(),this.y=this.yPrev=this.getY(),null!=r.x?(this._addTween(this,"x",this.x,"max"===r.x?i(t,"x"):r.x,"scrollTo_x",!0),this._overwriteProps.push("scrollTo_x")):this.skipX=!0,null!=r.y?(this._addTween(this,"y",this.y,"max"===r.y?i(t,"y"):r.y,"scrollTo_y",!0),this._overwriteProps.push("scrollTo_y")):this.skipY=!0,!0},set:function(t){this._super.setRatio.call(this,t);var r=this._wdw||!this.skipX?this.getX():this.xPrev,s=this._wdw||!this.skipY?this.getY():this.yPrev,n=s-this.yPrev,o=r-this.xPrev;this._autoKill&&(!this.skipX&&(o>7||-7>o)&&i(this._target,"x")>r&&(this.skipX=!0),!this.skipY&&(n>7||-7>n)&&i(this._target,"y")>s&&(this.skipY=!0),this.skipX&&this.skipY&&(this._tween.kill(),this.vars.onAutoKill&&this.vars.onAutoKill.apply(this.vars.onAutoKillScope||this._tween,this.vars.onAutoKillParams||[]))),this._wdw?e.scrollTo(this.skipX?r:this.x,this.skipY?s:this.y):(this.skipY||(this._target.scrollTop=this.y),this.skipX||(this._target.scrollLeft=this.x)),this.xPrev=this.x,this.yPrev=this.y}}),s=r.prototype;r.max=i,s.getX=function(){return this._wdw?null!=e.pageXOffset?e.pageXOffset:null!=t.scrollLeft?t.scrollLeft:document.body.scrollLeft:this._target.scrollLeft},s.getY=function(){return this._wdw?null!=e.pageYOffset?e.pageYOffset:null!=t.scrollTop?t.scrollTop:document.body.scrollTop:this._target.scrollTop},s._kill=function(t){return t.scrollTo_x&&(this.skipX=!0),t.scrollTo_y&&(this.skipY=!0),this._super._kill.call(this,t)}}),_gsScope._gsDefine&&_gsScope._gsQueue.pop()();
/*!
 * @file Debug Extension for ScrollMagic.
 */
/**
 * This plugin was formerly known as the ScrollMagic debug extension.
 *
 * It enables you to add visual indicators to your page, to be able to see exactly when a scene is triggered.
 *
 * To have access to this extension, please include `plugins/debug.addIndicators.js`.
 * @mixin debug.addIndicators
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ScrollMagic'], factory);
    } else if (typeof exports === 'object') {
    		// CommonJS
    		factory(require('scrollmagic'));
    } else {
    		// no browser global export needed, just execute
        factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic));
    }
}(this, function(ScrollMagic) {
	"use strict";
	var NAMESPACE = "debug.addIndicators";

	// (BUILD) - REMOVE IN MINIFY - START
	var
		console = window.console || {},
		err = Function.prototype.bind.call(console.error || console.log || function() {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}
	// (BUILD) - REMOVE IN MINIFY - END

	// plugin settings
	var
		FONT_SIZE = "0.85em",
		ZINDEX = "9999",
		EDGE_OFFSET = 15; // minimum edge distance, added to indentation

	// overall vars
	var
		_util = ScrollMagic._util,
		_autoindex = 0;



	ScrollMagic.Scene.extend(function () {
		var
			Scene = this,
			_indicator;

		// (BUILD) - REMOVE IN MINIFY - START
		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};
		// (BUILD) - REMOVE IN MINIFY - END

		/**
		 * Add visual indicators for a ScrollMagic.Scene.  
		 * @memberof! debug.addIndicators#
		 *
		 * @example
		 * // add basic indicators
		 * scene.addIndicators()
		 *
		 * // passing options
		 * scene.addIndicators({name: "pin scene", colorEnd: "#FFFFFF"});
		 *
		 * @param {object} [options] - An object containing one or more options for the indicators.
		 * @param {(string|object)} [options.parent=undefined] - A selector, DOM Object or a jQuery object that the indicators should be added to.  
		 														 														 If undefined, the controller's container will be used.
		 * @param {number} [options.name=""] - This string will be displayed at the start and end indicators of the scene for identification purposes. If no name is supplied an automatic index will be used.
		 * @param {number} [options.indent=0] - Additional position offset for the indicators (useful, when having multiple scenes starting at the same position).
		 * @param {string} [options.colorStart=green] - CSS color definition for the start indicator.
		 * @param {string} [options.colorEnd=red] - CSS color definition for the end indicator.
		 * @param {string} [options.colorTrigger=blue] - CSS color definition for the trigger indicator.
		 */
		Scene.addIndicators = function(options) {
			if (!_indicator) {
				var
					DEFAULT_OPTIONS = {
						name: "",
						indent: 0,
						parent: undefined,
						colorStart: "green",
						colorEnd: "red",
						colorTrigger: "blue",
					};
				
				options = _util.extend({}, DEFAULT_OPTIONS, options);

				_autoindex++;
				_indicator = new Indicator(Scene, options);

				Scene.on("add.plugin_addIndicators", _indicator.add);
				Scene.on("remove.plugin_addIndicators", _indicator.remove);
				Scene.on("destroy.plugin_addIndicators", Scene.removeIndicators);

				// it the scene already has a controller we can start right away.
				if (Scene.controller()) {
					_indicator.add();
				}
			}
			return Scene;
		};

		/**
		 * Removes visual indicators from a ScrollMagic.Scene.
		 * @memberof! debug.addIndicators#
		 *
		 * @example
		 * // remove previously added indicators
		 * scene.removeIndicators()
		 *
		 */
		Scene.removeIndicators = function() {
			if (_indicator) {
				_indicator.remove();
				this.off("*.plugin_addIndicators");
				_indicator = undefined;
			}
			return Scene;
		};

	});


	/*
	 * ----------------------------------------------------------------
	 * Extension for controller to store and update related indicators
	 * ----------------------------------------------------------------
	 */
	// add option to globally auto-add indicators to scenes
	/**
	 * Every ScrollMagic.Controller instance now accepts an additional option.  
	 * See {@link ScrollMagic.Controller} for a complete list of the standard options.
	 * @memberof! debug.addIndicators#
	 * @method new ScrollMagic.Controller(options)
	 * @example
	 * // make a controller and add indicators to all scenes attached
	 * var controller = new ScrollMagic.Controller({addIndicators: true});
	 * // this scene will automatically have indicators added to it
	 * new ScrollMagic.Scene()
	 *                .addTo(controller);
	 *
	 * @param {object} [options] - Options for the Controller.
	 * @param {boolean} [options.addIndicators=false] - If set to `true` every scene that is added to the controller will automatically get indicators added to it.
	 */
	ScrollMagic.Controller.addOption("addIndicators", false);
	// extend Controller
	ScrollMagic.Controller.extend(function () {
		var
			Controller = this,
			_info = Controller.info(),
			_container = _info.container,
			_isDocument = _info.isDocument,
			_vertical = _info.vertical,
			_indicators = { // container for all indicators and methods
				groups: []
			};

		// (BUILD) - REMOVE IN MINIFY - START
		var log = function () {
			if (Controller._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Controller._log.apply(this, arguments);
			}
		};
		if (Controller._indicators) {
			log(2, "WARNING: Scene already has a property '_indicators', which will be overwritten by plugin.");
		}
		// (BUILD) - REMOVE IN MINIFY - END
	
		// add indicators container
		this._indicators = _indicators;
		/*
			needed updates:
			+++++++++++++++
			start/end position on scene shift (handled in Indicator class)
			trigger parameters on triggerHook value change (handled in Indicator class)
			bounds position on container scroll or resize (to keep alignment to bottom/right)
			trigger position on container resize, window resize (if container isn't document) and window scroll (if container isn't document)
		*/
		
		// event handler for when associated bounds markers need to be repositioned
		var handleBoundsPositionChange = function () {
			_indicators.updateBoundsPositions();
		};

		// event handler for when associated trigger groups need to be repositioned
		var handleTriggerPositionChange = function () {
			_indicators.updateTriggerGroupPositions();
		};

		_container.addEventListener("resize", handleTriggerPositionChange);
		if (!_isDocument) {
			window.addEventListener("resize", handleTriggerPositionChange);
			window.addEventListener("scroll", handleTriggerPositionChange);
		}
		// update all related bounds containers
		_container.addEventListener("resize", handleBoundsPositionChange);
		_container.addEventListener("scroll", handleBoundsPositionChange);


		// updates the position of the bounds container to aligned to the right for vertical containers and to the bottom for horizontal
		this._indicators.updateBoundsPositions = function (specificIndicator) {
			var // constant for all bounds
				groups = specificIndicator ?
								[_util.extend({}, specificIndicator.triggerGroup, {members: [specificIndicator]})]: // create a group with only one element
								_indicators.groups, // use all
				g = groups.length,
				css = {},
				paramPos = _vertical ? "left"  : "top",
				paramDimension = _vertical ? "width" : "height",
				edge = _vertical ?
							_util.get.scrollLeft(_container) + _util.get.width(_container) - EDGE_OFFSET:
							_util.get.scrollTop(_container) + _util.get.height(_container) - EDGE_OFFSET,
				b, triggerSize, group;
			while (g--) { // group loop
				group = groups[g];
				b = group.members.length;
				triggerSize = _util.get[paramDimension](group.element.firstChild);
				while (b--) { // indicators loop
					css[paramPos] = edge - triggerSize;
					_util.css(group.members[b].bounds, css);
				}
			}
		};

		// updates the positions of all trigger groups attached to a controller or a specific one, if provided
		this._indicators.updateTriggerGroupPositions = function (specificGroup) {
			var // constant vars
				groups = specificGroup ? [specificGroup] : _indicators.groups,
				i = groups.length,
				container = _isDocument ? document.body : _container,
				containerOffset = _isDocument ?  {top: 0, left: 0} : _util.get.offset(container, true),
				edge = _vertical ?
							_util.get.width(_container) - EDGE_OFFSET :
							_util.get.height(_container) - EDGE_OFFSET,
				paramDimension = _vertical ? "width"  : "height",
				paramTransform = _vertical ? "Y" : "X";
			var // changing vars
					group,
					elem,
					pos,
					elemSize,
					transform;
			while (i--) {
				group = groups[i];
				elem = group.element;
				pos = group.triggerHook * Controller.info("size");
				elemSize = _util.get[paramDimension](elem.firstChild.firstChild);
				transform = pos > elemSize ? "translate" + paramTransform + "(-100%)" : "";

				_util.css(elem, {
					top: containerOffset.top + (_vertical ? pos : edge - group.members[0].options.indent),
					left: containerOffset.left + (_vertical ? edge - group.members[0].options.indent : pos)
				});
				_util.css(elem.firstChild.firstChild, {
					"-ms-transform" : transform,
					"-webkit-transform" : transform,
					"transform" : transform
				});
			}
		};

		// updates the label for the group to contain the name, if it only has one member
		this._indicators.updateTriggerGroupLabel = function (group) {
			var
				text = "trigger" + (group.members.length > 1 ? "" : " " + group.members[0].options.name),
				elem = group.element.firstChild.firstChild,
				doUpdate = elem.textContent !== text;
			if (doUpdate) {
				elem.textContent = text;
				if (_vertical) { // bounds position is dependent on text length, so update
					_indicators.updateBoundsPositions();
				}
			}
		};

		// add indicators if global option is set
		this.addScene = function (newScene) {

			if (this._options.addIndicators && newScene instanceof ScrollMagic.Scene && newScene.controller() === Controller) {
				newScene.addIndicators();
			}
			// call original destroy method
			this.$super.addScene.apply(this, arguments);
		};

		// remove all previously set listeners on destroy
		this.destroy = function () {
			_container.removeEventListener("resize", handleTriggerPositionChange);
			if (!_isDocument) {
				window.removeEventListener("resize", handleTriggerPositionChange);
				window.removeEventListener("scroll", handleTriggerPositionChange);
			}
			_container.removeEventListener("resize", handleBoundsPositionChange);
			_container.removeEventListener("scroll", handleBoundsPositionChange);
			// call original destroy method
			this.$super.destroy.apply(this, arguments);
		};
		return Controller;

	});

	/*
	 * ----------------------------------------------------------------
	 * Internal class for the construction of Indicators
	 * ----------------------------------------------------------------
	 */
	var Indicator = function (Scene, options) {
		var
			Indicator = this,
			_elemBounds = TPL.bounds(),
			_elemStart = TPL.start(options.colorStart),
			_elemEnd = TPL.end(options.colorEnd),
			_boundsContainer = options.parent && _util.get.elements(options.parent)[0],
			_vertical,
			_ctrl;

		// (BUILD) - REMOVE IN MINIFY - START
		var log = function () {
			if (Scene._log) { // not available, when main source minified
				Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
				Scene._log.apply(this, arguments);
			}
		};
		// (BUILD) - REMOVE IN MINIFY - END

		options.name = options.name || _autoindex;

		// prepare bounds elements
		_elemStart.firstChild.textContent += " " + options.name;
		_elemEnd.textContent += " " + options.name;
		_elemBounds.appendChild(_elemStart);
		_elemBounds.appendChild(_elemEnd);

		// set public variables
		Indicator.options = options;
		Indicator.bounds = _elemBounds;
		// will be set later
		Indicator.triggerGroup = undefined;

		// add indicators to DOM
		this.add = function () {
			_ctrl = Scene.controller();
			_vertical = _ctrl.info("vertical");

			var isDocument = _ctrl.info("isDocument");

			if (!_boundsContainer) {
				// no parent supplied or doesnt exist
				_boundsContainer = isDocument ? document.body : _ctrl.info("container"); // check if window/document (then use body)
			}
			if (!isDocument && _util.css(_boundsContainer, "position") === 'static') {
				// position mode needed for correct positioning of indicators
				_util.css(_boundsContainer, {position: "relative"});
			}

			// add listeners for updates
			Scene.on("change.plugin_addIndicators", handleTriggerParamsChange);
			Scene.on("shift.plugin_addIndicators", handleBoundsParamsChange);

			// updates trigger & bounds (will add elements if needed)
			updateTriggerGroup();
			updateBounds();

			setTimeout(function () { // do after all execution is finished otherwise sometimes size calculations are off
				_ctrl._indicators.updateBoundsPositions(Indicator);
			}, 0);

			log(3, "added indicators");
		};

		// remove indicators from DOM
		this.remove = function () {
			if (Indicator.triggerGroup) { // if not set there's nothing to remove
				Scene.off("change.plugin_addIndicators", handleTriggerParamsChange);
				Scene.off("shift.plugin_addIndicators", handleBoundsParamsChange);

				if (Indicator.triggerGroup.members.length > 1) {
					// just remove from memberlist of old group
					var group = Indicator.triggerGroup;
					group.members.splice(group.members.indexOf(Indicator), 1);
					_ctrl._indicators.updateTriggerGroupLabel(group);
					_ctrl._indicators.updateTriggerGroupPositions(group);
					Indicator.triggerGroup = undefined;
	 			} else {
	 				// remove complete group
	 				removeTriggerGroup();
	 			}
				removeBounds();
				
				log(3, "removed indicators");
			}
		};

		/*
		 * ----------------------------------------------------------------
		 * internal Event Handlers
		 * ----------------------------------------------------------------
		 */

		// event handler for when bounds params change
		var handleBoundsParamsChange = function () {
			updateBounds();
		};

		// event handler for when trigger params change
		var handleTriggerParamsChange = function (e) {
			if (e.what === "triggerHook") {
				updateTriggerGroup();
			}
		};

		/*
		 * ----------------------------------------------------------------
		 * Bounds (start / stop) management
		 * ----------------------------------------------------------------
		 */

		// adds an new bounds elements to the array and to the DOM
		var addBounds = function () {
			var v = _ctrl.info("vertical");
			// apply stuff we didn't know before...
			_util.css(_elemStart.firstChild, {
				"border-bottom-width" : v ? 1 : 0,
				"border-right-width" :	v ? 0 : 1,
				"bottom":								v ? -1 : options.indent,
				"right":								v ? options.indent : -1,
				"padding":							v ? "0 8px" : "2px 4px",
			});
			_util.css(_elemEnd, {
				"border-top-width" :		v ? 1 : 0,
				"border-left-width" : 	v ? 0 : 1,
				"top":									v ? "100%" : "",
				"right":								v ? options.indent : "",
				"bottom":								v ? "" : options.indent,
				"left":									v ? "" : "100%",
				"padding":							v ? "0 8px" : "2px 4px"
			});
			// append
			_boundsContainer.appendChild(_elemBounds);
		};

		// remove bounds from list and DOM
		var removeBounds = function () {
			_elemBounds.parentNode.removeChild(_elemBounds);
		};

		// update the start and end positions of the scene
		var updateBounds = function () {
			if (_elemBounds.parentNode !== _boundsContainer) {
				addBounds(); // Add Bounds elements (start/end)
			}
			var css = {};
			css[_vertical ? "top" : "left"] = Scene.triggerPosition();
			css[_vertical ? "height" : "width"] = Scene.duration();
			_util.css(_elemBounds, css);
			_util.css(_elemEnd, {
				display: Scene.duration() > 0 ? "" : "none"
			});
		};

		/*
		 * ----------------------------------------------------------------
		 * trigger and trigger group management
		 * ----------------------------------------------------------------
		 */

		// adds an new trigger group to the array and to the DOM
		var addTriggerGroup = function () {
			var triggerElem = TPL.trigger(options.colorTrigger); // new trigger element
			var css = {};
			css[_vertical ? "right" : "bottom"] = 0;
			css[_vertical ? "border-top-width" : "border-left-width"] = 1;
			_util.css(triggerElem.firstChild, css);
			_util.css(triggerElem.firstChild.firstChild, {
				padding: _vertical ? "0 8px 3px 8px" : "3px 4px"
			});
			document.body.appendChild(triggerElem); // directly add to body
			var newGroup = {
				triggerHook: Scene.triggerHook(),
				element: triggerElem,
				members: [Indicator]
			};
			_ctrl._indicators.groups.push(newGroup);
			Indicator.triggerGroup = newGroup;
			// update right away
			_ctrl._indicators.updateTriggerGroupLabel(newGroup);
			_ctrl._indicators.updateTriggerGroupPositions(newGroup);
		};

		var removeTriggerGroup = function () {
			_ctrl._indicators.groups.splice(_ctrl._indicators.groups.indexOf(Indicator.triggerGroup), 1);
			Indicator.triggerGroup.element.parentNode.removeChild(Indicator.triggerGroup.element);
			Indicator.triggerGroup = undefined;
		};

		// updates the trigger group -> either join existing or add new one
		/*	
		 * Logic:
		 * 1 if a trigger group exist, check if it's in sync with Scene settings – if so, nothing else needs to happen
		 * 2 try to find an existing one that matches Scene parameters
		 * 	 2.1 If a match is found check if already assigned to an existing group
		 *			 If so:
		 *       A: it was the last member of existing group -> kill whole group
		 *       B: the existing group has other members -> just remove from member list
		 *	 2.2 Assign to matching group
		 * 3 if no new match could be found, check if assigned to existing group
		 *   A: yes, and it's the only member -> just update parameters and positions and keep using this group
		 *   B: yes but there are other members -> remove from member list and create a new one
		 *   C: no, so create a new one
		 */
		var updateTriggerGroup = function () {
			var
				triggerHook = Scene.triggerHook(),
				closeEnough = 0.0001;

			// Have a group, check if it still matches
			if (Indicator.triggerGroup) {
				if (Math.abs(Indicator.triggerGroup.triggerHook - triggerHook) < closeEnough) {
					// _util.log(0, "trigger", options.name, "->", "no need to change, still in sync");
					return; // all good
				}
			}
			// Don't have a group, check if a matching one exists
			// _util.log(0, "trigger", options.name, "->", "out of sync!");
			var
				groups = _ctrl._indicators.groups,
				group,
				i = groups.length;
			while (i--) {
				group = groups[i];
				if (Math.abs(group.triggerHook - triggerHook) < closeEnough) {
					// found a match!
					// _util.log(0, "trigger", options.name, "->", "found match");
					if (Indicator.triggerGroup) { // do I have an old group that is out of sync?
						if (Indicator.triggerGroup.members.length === 1) { // is it the only remaining group?
							// _util.log(0, "trigger", options.name, "->", "kill");
							// was the last member, remove the whole group
							removeTriggerGroup();
						} else {
							Indicator.triggerGroup.members.splice(Indicator.triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
							_ctrl._indicators.updateTriggerGroupLabel(Indicator.triggerGroup);
							_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
							// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
						}
					}
					// join new group
					group.members.push(Indicator);
					Indicator.triggerGroup = group;
					_ctrl._indicators.updateTriggerGroupLabel(group);
					return;
				}
			}

			// at this point I am obviously out of sync and don't match any other group
			if (Indicator.triggerGroup) {
				if (Indicator.triggerGroup.members.length === 1) {
					// _util.log(0, "trigger", options.name, "->", "updating existing");
					// out of sync but i'm the only member => just change and update
					Indicator.triggerGroup.triggerHook = triggerHook;
					_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
					return;
				} else {
					// _util.log(0, "trigger", options.name, "->", "removing from previous member list");
					Indicator.triggerGroup.members.splice(Indicator.triggerGroup.members.indexOf(Indicator), 1); // just remove from memberlist of old group
					_ctrl._indicators.updateTriggerGroupLabel(Indicator.triggerGroup);
					_ctrl._indicators.updateTriggerGroupPositions(Indicator.triggerGroup);
					Indicator.triggerGroup = undefined; // need a brand new group...
				}
			}
			// _util.log(0, "trigger", options.name, "->", "add a new one");
			// did not find any match, make new trigger group
			addTriggerGroup();
		};
	};

	/*
	 * ----------------------------------------------------------------
	 * Templates for the indicators
	 * ----------------------------------------------------------------
	 */
	var TPL = {
		start: function (color) {
			// inner element (for bottom offset -1, while keeping top position 0)
			var inner = document.createElement("div");
			inner.textContent = "start";
			_util.css(inner, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			var e = document.createElement('div');
			// wrapper
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				width: 0,
				height: 0
			});
			e.appendChild(inner);
			return e;
		},
		end: function (color) {
			var e = document.createElement('div');
			e.textContent = "end";
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			return e;
		},
		bounds: function () {
			var e = document.createElement('div');
			_util.css(e, {
				position: "absolute",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events" : "none",
				"font-size": FONT_SIZE
			});
			e.style.zIndex = ZINDEX;
			return e;
		},
		trigger: function (color) {
			// inner to be above or below line but keep position
			var inner = document.createElement('div');
			inner.textContent = "trigger";
			_util.css(inner, {
				position: "relative",
			});
			// inner wrapper for right: 0 and main element has no size
			var w = document.createElement('div'); 
			_util.css(w, {
				position: "absolute",
				overflow: "visible",
				"border-width" : 0,
				"border-style" : "solid",
				color: color,
				"border-color" : color
			});
			w.appendChild(inner);
			// wrapper
			var e = document.createElement('div');
			_util.css(e, {
				position: "fixed",
				overflow: "visible",
				"white-space": "nowrap",
				"pointer-events" : "none",
				"font-size": FONT_SIZE
			});
			e.style.zIndex = ZINDEX;
			e.appendChild(w);
			return e;
		},
	};

}));

// KUTE.js v1.6.2 | © dnp_theme | Core Engine | MIT-License

!function(t,e){"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?module.exports=e():t.KUTE=e()}(this,function(){"use strict";for(var t="undefined"!=typeof global?global:window,e=t.performance,n=[],i=null,s=["color","backgroundColor"],r=["top","left","width","height"],a=["translate3d","translateX","translateY","translateZ","rotate","translate","rotateX","rotateY","rotateZ","skewX","skewY","scale"],o=["opacity"],u=s.concat(o,r,a),l=u.length,h={},c=0;c<l;c++){var p=u[c];s.indexOf(p)!==-1?h[p]="rgba(0,0,0,0)":r.indexOf(p)!==-1?h[p]=0:"translate3d"===p?h[p]=[0,0,0]:"translate"===p?h[p]=[0,0]:"rotate"===p||/X|Y|Z/.test(p)?h[p]=0:"scale"!==p&&"opacity"!==p||(h[p]=1),p=null}var f={duration:700,delay:0,offset:0,repeat:0,repeatDelay:0,yoyo:!1,easing:"linear",keepHex:!1},d=function(){for(var t=document.createElement("div"),e=0,n=["Moz","moz","Webkit","webkit","O","o","Ms","ms"],i=["MozTransform","mozTransform","WebkitTransform","webkitTransform","OTransform","oTransform","MsTransform","msTransform"],e=0,s=n.length;e<s;e++)if(i[e]in t.style)return n[e];t=null},v=function(t){var e=!(t in document.body.style),n=d();return e?n+(t.charAt(0).toUpperCase()+t.slice(1)):t},g=function(t,e){var n;if(n=e?t instanceof Object||"object"==typeof t?t:document.querySelectorAll(t):"object"==typeof t?t:/^#/.test(t)?document.getElementById(t.replace("#","")):document.querySelector(t),null===n&&"window"!==t)throw new TypeError("Element not found or incorrect selector: "+t);return n},y=function(t){return 180*t/Math.PI},m=function(t,e){for(var n,i=parseInt(t)||0,s=["px","%","deg","rad","em","rem","vh","vw"],r=0,a=s.length;r<a;r++)if("string"==typeof t&&t.indexOf(s[r])!==-1){n=s[r];break}return n=void 0!==n?n:e?"deg":"px",{v:i,u:n}},w=function(e){if(/rgb|rgba/.test(e)){var n=e.replace(/\s|\)/,"").split("(")[1].split(","),i=n[3]?n[3]:null;return i?{r:parseInt(n[0]),g:parseInt(n[1]),b:parseInt(n[2]),a:parseFloat(i)}:{r:parseInt(n[0]),g:parseInt(n[1]),b:parseInt(n[2])}}if(/^#/.test(e)){var s=I(e);return{r:s.r,g:s.g,b:s.b}}if(/transparent|none|initial|inherit/.test(e))return{r:0,g:0,b:0,a:0};if(!/^#|^rgb/.test(e)){var r=document.getElementsByTagName("head")[0];r.style.color=e;var a=t.getComputedStyle(r,null).color;return a=/rgb/.test(a)?a.replace(/[^\d,]/g,"").split(","):[0,0,0],r.style.color="",{r:parseInt(a[0]),g:parseInt(a[1]),b:parseInt(a[2])}}},b=function(t,e,n){return"#"+((1<<24)+(t<<16)+(e<<8)+n).toString(16).slice(1)},I=function(t){var e=/^#?([a-f\d])([a-f\d])([a-f\d])$/i;t=t.replace(e,function(t,e,n,i){return e+e+n+n+i+i});var n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return n?{r:parseInt(n[1],16),g:parseInt(n[2],16),b:parseInt(n[3],16)}:null},O=function(t,e){if(t){for(var n=t.style.cssText.replace(/\s/g,"").split(";"),i={},s=0,r=n.length;s<r;s++)if(/transform/i.test(n[s]))for(var o=n[s].split(":")[1].split(")"),u=0,l=o.length-1;u<l;u++){var h=o[u].split("("),c=h[0],p=h[1];a.indexOf(c)!==-1&&(i[c]=/translate3d/.test(c)?p.split(","):p)}return i}},E=function(e,n){var i=e.style,s=t.getComputedStyle(e,null)||e.currentStyle,r=v(n),a=i[n]&&!/auto|initial|none|unset/.test(i[n])?i[n]:s[r];if("transform"!==n&&(r in s||r in i)){if(a){if("filter"===r){var o=parseInt(a.split("=")[1].replace(")",""));return parseFloat(o/100)}return a}return h[n]}},M=function(t){n.push(t)},x=function(t){var e=n.indexOf(t);e!==-1&&n.splice(e,1)},T=function(){i&&(X(i),i=null)},k="ontouchstart"in t||navigator&&navigator.msMaxTouchPoints||!1,S=k?"touchstart":"mousewheel",P="mouseenter",Y=t.requestAnimationFrame||t.webkitRequestAnimationFrame||function(t){return setTimeout(t,16)},X=t.cancelAnimationFrame||t.webkitCancelRequestAnimationFrame||function(t){return clearTimeout(t)},C=v("transform"),A=document.body,F=document.getElementsByTagName("HTML")[0],Z=navigator&&/webkit/i.test(navigator.userAgent)||"BackCompat"==document.compatMode?A:F,_=!(!navigator||null===new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})").exec(navigator.userAgent))&&parseFloat(RegExp.$1),B=8===_,$=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent),q=t.Interpolate={},Q=q.number=function(t,e,n){return t=+t,e-=t,t+e*n},R=(q.unit=function(t,e,n,i){return t=+t,e-=t,t+e*i+n},q.color=function(t,e,n,i){var s,r={},a=")",o=",",u="rgb(",l="rgba(";for(s in e)r[s]="a"!==s?Q(t[s],e[s],n)>>0||0:t[s]&&e[s]?(100*Q(t[s],e[s],n)>>0)/100:null;return i?b(r.r,r.g,r.b):r.a?l+r.r+o+r.g+o+r.b+o+r.a+a:u+r.r+o+r.g+o+r.b+a}),W=q.translate=$?function(t,e,n,i){var s={};for(var r in e)s[r]=(t[r]===e[r]?e[r]:t[r]+(e[r]-t[r])*i>>0)+n;return s.x||s.y?"translate("+s.x+","+s.y+")":"translate3d("+s.translateX+","+s.translateY+","+s.translateZ+")"}:function(t,e,n,i){var s={};for(var r in e)s[r]=(t[r]===e[r]?e[r]:(100*(t[r]+(e[r]-t[r])*i)>>0)/100)+n;return s.x||s.y?"translate("+s.x+","+s.y+")":"translate3d("+s.translateX+","+s.translateY+","+s.translateZ+")"},z=q.rotate=function(t,e,n,i){var s={};for(var r in e)s[r]="z"===r?"rotate("+(100*(t[r]+(e[r]-t[r])*i)>>0)/100+n+")":r+"("+(100*(t[r]+(e[r]-t[r])*i)>>0)/100+n+")";return s.z?s.z:(s.rotateX||"")+(s.rotateY||"")+(s.rotateZ||"")},H=q.skew=function(t,e,n,i){var s={};for(var r in e)s[r]=r+"("+(10*(t[r]+(e[r]-t[r])*i)>>0)/10+n+")";return(s.skewX||"")+(s.skewY||"")},D=q.scale=function(t,e,n){return"scale("+(1e3*(t+(e-t)*n)>>0)/1e3+")"},j={},L=function(t){for(var e=0;e<n.length;)N.call(n[e],t)?e++:n.splice(e,1);i=Y(L)},N=function(t){if(t=t||e.now(),t<this._startTime&&this.playing)return!0;var n=Math.min((t-this._startTime)/this.options.duration,1),i=this.options.easing(n);for(var s in this.valuesEnd)j[s](this.element,s,this.valuesStart[s],this.valuesEnd[s],i,this.options);if(this.options.update&&this.options.update.call(),1===n){if(this.options.repeat>0)return isFinite(this.options.repeat)&&this.options.repeat--,this.options.yoyo&&(this.reversed=!this.reversed,tt.call(this)),this._startTime=this.options.yoyo&&!this.reversed?t+this.options.repeatDelay:t,!0;this.options.complete&&this.options.complete.call(),it.call(this);for(var r=0,a=this.options.chain.length;r<a;r++)this.options.chain[r].start();return et.call(this),!1}return!0},U=function(){var t=this.element,e=this.options;void 0!==e.perspective&&C in this.valuesEnd&&(this.valuesStart[C].perspective=this.valuesEnd[C].perspective),void 0===e.transformOrigin||"svgTransform"in this.valuesEnd||(t.style[v("transformOrigin")]=e.transformOrigin),void 0!==e.perspectiveOrigin&&(t.style[v("perspectiveOrigin")]=e.perspectiveOrigin),void 0!==e.parentPerspective&&(t.parentNode.style[v("perspective")]=e.parentPerspective+"px"),void 0!==e.parentPerspectiveOrigin&&(t.parentNode.style[v("perspectiveOrigin")]=e.parentPerspectiveOrigin)},K={},G={},J={boxModel:function(t,e){t in j||(j[t]=function(t,e,n,i,s){t.style[e]=(s>.99||s<.01?(10*Q(n,i,s)>>0)/10:Q(n,i,s)>>0)+"px"});var n=m(e);return"%"===n.u?n.v*this.element.offsetWidth/100:n.v},transform:function(t,e){if(C in j||(j[C]=function(t,e,n,i,s,r){t.style[e]=(n.perspective||"")+("translate"in n?W(n.translate,i.translate,"px",s):"")+("rotate"in n?z(n.rotate,i.rotate,"deg",s):"")+("skew"in n?H(n.skew,i.skew,"deg",s):"")+("scale"in n?D(n.scale,i.scale,s):"")}),/translate/.test(t)){if("translate3d"===t){var n=e.split(","),i=m(n[0]),s=m(n[1],t3d2=m(n[2]));return{translateX:"%"===i.u?i.v*this.element.offsetWidth/100:i.v,translateY:"%"===s.u?s.v*this.element.offsetHeight/100:s.v,translateZ:"%"===t3d2.u?t3d2.v*(this.element.offsetHeight+this.element.offsetWidth)/200:t3d2.v}}if(/^translate(?:[XYZ])$/.test(t)){var r=m(e),a=/X/.test(t)?this.element.offsetWidth/100:/Y/.test(t)?this.element.offsetHeight/100:(this.element.offsetWidth+this.element.offsetHeight)/200;return"%"===r.u?r.v*a:r.v}if("translate"===t){var o,u="string"==typeof e?e.split(","):e,l={},h=m(u[0]),c=u.length?m(u[1]):{v:0,u:"px"};return u instanceof Array?(l.x="%"===h.u?h.v*this.element.offsetWidth/100:h.v,l.y="%"===c.u?c.v*this.element.offsetHeight/100:c.v):(o=m(u),l.x="%"===o.u?o.v*this.element.offsetWidth/100:o.v,l.y=0),l}}else if(/rotate|skew/.test(t)){if(/^rotate(?:[XYZ])$|skew(?:[XY])$/.test(t)){var p=m(e,!0);return"rad"===p.u?y(p.v):p.v}if("rotate"===t){var f={},d=m(e,!0);return f.z="rad"===d.u?y(d.v):d.v,f}}else if("scale"===t)return parseFloat(e)},unitless:function(t,e){return!/scroll/.test(t)||t in j?"opacity"===t&&(t in j||(B?j[t]=function(t,e,n,i,s){var r="alpha(opacity=",a=")";t.style.filter=r+(100*Q(n,i,s)>>0)+a}:j[t]=function(t,e,n,i,s){t.style.opacity=(100*Q(n,i,s)>>0)/100})):j[t]=function(t,e,n,i,s){t.scrollTop=Q(n,i,s)>>0},parseFloat(e)},colors:function(t,e){return t in j||(j[t]=function(t,e,n,i,s,r){t.style[e]=R(n,i,s,r.keepHex)}),w(e)}},V=function(t,e){var n=(this.element,"start"===e?this.valuesStart:this.valuesEnd),i={},u={},l={},h={};for(var c in t)if(a.indexOf(c)!==-1){if(/^translate(?:[XYZ]|3d)$/.test(c)){for(var p=["X","Y","Z"],f=0;f<3;f++){var d=p[f];/3d/.test(c)?l["translate"+d]=J.transform.call(this,"translate"+d,t[c][f]):l["translate"+d]="translate"+d in t?J.transform.call(this,"translate"+d,t["translate"+d]):0}h.translate=l}else if(/^rotate(?:[XYZ])$|^skew(?:[XY])$/.test(c)){for(var v=/rotate/.test(c)?"rotate":"skew",g=["X","Y","Z"],y="rotate"===v?u:i,m=0;m<3;m++){var w=g[m];void 0!==t[v+w]&&"skewZ"!==c&&(y[v+w]=J.transform.call(this,v+w,t[v+w]))}h[v]=y}else/(rotate|translate|scale)$/.test(c)&&(h[c]=J.transform.call(this,c,t[c]));n[C]=h}else r.indexOf(c)!==-1?n[c]=J.boxModel.call(this,c,t[c]):o.indexOf(c)!==-1||"scroll"===c?n[c]=J.unitless.call(this,c,t[c]):s.indexOf(c)!==-1?n[c]=J.colors.call(this,c,t[c]):c in J&&(n[c]=J[c].call(this,c,t[c]))},tt=function(){if(this.options.yoyo)for(var t in this.valuesEnd){var e=this.valuesRepeat[t];this.valuesRepeat[t]=this.valuesEnd[t],this.valuesEnd[t]=e,this.valuesStart[t]=this.valuesRepeat[t]}},et=function(){this.repeat>0&&(this.options.repeat=this.repeat),this.options.yoyo&&this.reversed===!0&&(tt.call(this),this.reversed=!1),this.playing=!1,setTimeout(function(){n.length||T()},48)},nt=function(t){var e=document.body.getAttribute("data-tweening");e&&"scroll"===e&&t.preventDefault()},it=function(){"scroll"in this.valuesEnd&&document.body.getAttribute("data-tweening")&&(document.removeEventListener(S,nt,!1),document.removeEventListener(P,nt,!1),document.body.removeAttribute("data-tweening"))},st=function(){"scroll"in this.valuesEnd&&!document.body.getAttribute("data-tweening")&&(document.addEventListener(S,nt,!1),document.addEventListener(P,nt,!1),document.body.setAttribute("data-tweening","scroll"))},rt=function(t){return"function"==typeof t?t:"string"==typeof t?ot[t]:void 0},at=function(){var e={},n=O(this.element,"transform"),i=["rotate","skew"],s=["X","Y","Z"];for(var r in this.valuesStart)if(a.indexOf(r)!==-1){var o=/(rotate|translate|scale)$/.test(r);if(/translate/.test(r)&&"translate"!==r)e.translate3d=n.translate3d||h[r];else if(o)e[r]=n[r]||h[r];else if(!o&&/rotate|skew/.test(r))for(var l=0;l<2;l++)for(var c=0;c<3;c++){var p=i[l]+s[c];a.indexOf(p)!==-1&&p in this.valuesStart&&(e[p]=n[p]||h[p])}}else if("scroll"!==r)if("opacity"===r&&B){var f=E(this.element,"filter");e.opacity="number"==typeof f?f:h.opacity}else u.indexOf(r)!==-1?e[r]=E(this.element,r)||l[r]:e[r]=r in K?K[r].call(this,r,this.valuesStart[r]):0;else e[r]=this.element===Z?t.pageYOffset||Z.scrollTop:this.element.scrollTop;for(var r in n)a.indexOf(r)===-1||r in this.valuesStart||(e[r]=n[r]||h[r]);if(this.valuesStart={},V.call(this,e,"start"),C in this.valuesEnd)for(var d in this.valuesStart[C])if("perspective"!==d)if("object"==typeof this.valuesStart[C][d])for(var v in this.valuesStart[C][d])"undefined"==typeof this.valuesEnd[C][d]&&(this.valuesEnd[C][d]={}),"number"==typeof this.valuesStart[C][d][v]&&"undefined"==typeof this.valuesEnd[C][d][v]&&(this.valuesEnd[C][d][v]=this.valuesStart[C][d][v]);else"number"==typeof this.valuesStart[C][d]&&"undefined"==typeof this.valuesEnd[C][d]&&(this.valuesEnd[C][d]=this.valuesStart[C][d])},ot=t.Easing={};ot.linear=function(t){return t},ot.easingSinusoidalIn=function(t){return-Math.cos(t*Math.PI/2)+1},ot.easingSinusoidalOut=function(t){return Math.sin(t*Math.PI/2)},ot.easingSinusoidalInOut=function(t){return-.5*(Math.cos(Math.PI*t)-1)},ot.easingQuadraticIn=function(t){return t*t},ot.easingQuadraticOut=function(t){return t*(2-t)},ot.easingQuadraticInOut=function(t){return t<.5?2*t*t:-1+(4-2*t)*t},ot.easingCubicIn=function(t){return t*t*t},ot.easingCubicOut=function(t){return--t*t*t+1},ot.easingCubicInOut=function(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1},ot.easingQuarticIn=function(t){return t*t*t*t},ot.easingQuarticOut=function(t){return 1- --t*t*t*t},ot.easingQuarticInOut=function(t){return t<.5?8*t*t*t*t:1-8*--t*t*t*t},ot.easingQuinticIn=function(t){return t*t*t*t*t},ot.easingQuinticOut=function(t){return 1+--t*t*t*t*t},ot.easingQuinticInOut=function(t){return t<.5?16*t*t*t*t*t:1+16*--t*t*t*t*t},ot.easingCircularIn=function(t){return-(Math.sqrt(1-t*t)-1)},ot.easingCircularOut=function(t){return Math.sqrt(1-(t-=1)*t)},ot.easingCircularInOut=function(t){return(t*=2)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1)},ot.easingExponentialIn=function(t){return Math.pow(2,10*(t-1))-.001},ot.easingExponentialOut=function(t){return 1-Math.pow(2,-10*t)},ot.easingExponentialInOut=function(t){return(t*=2)<1?.5*Math.pow(2,10*(t-1)):.5*(2-Math.pow(2,-10*(t-1)))},ot.easingBackIn=function(t){var e=1.70158;return t*t*((e+1)*t-e)},ot.easingBackOut=function(t){var e=1.70158;return--t*t*((e+1)*t+e)+1},ot.easingBackInOut=function(t){var e=2.5949095;return(t*=2)<1?.5*(t*t*((e+1)*t-e)):.5*((t-=2)*t*((e+1)*t+e)+2)},ot.easingElasticIn=function(t){var e,n=.1,i=.4;return 0===t?0:1===t?1:(!n||n<1?(n=1,e=i/4):e=i*Math.asin(1/n)/Math.PI*2,-(n*Math.pow(2,10*(t-=1))*Math.sin((t-e)*Math.PI*2/i)))},ot.easingElasticOut=function(t){var e,n=.1,i=.4;return 0===t?0:1===t?1:(!n||n<1?(n=1,e=i/4):e=i*Math.asin(1/n)/Math.PI*2,n*Math.pow(2,-10*t)*Math.sin((t-e)*Math.PI*2/i)+1)},ot.easingElasticInOut=function(t){var e,n=.1,i=.4;return 0===t?0:1===t?1:(!n||n<1?(n=1,e=i/4):e=i*Math.asin(1/n)/Math.PI*2,(t*=2)<1?-.5*(n*Math.pow(2,10*(t-=1))*Math.sin((t-e)*Math.PI*2/i)):n*Math.pow(2,-10*(t-=1))*Math.sin((t-e)*Math.PI*2/i)*.5+1)},ot.easingBounceIn=function(t){return 1-ot.easingBounceOut(1-t)},ot.easingBounceOut=function(t){return t<1/2.75?7.5625*t*t:t<2/2.75?7.5625*(t-=1.5/2.75)*t+.75:t<2.5/2.75?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375},ot.easingBounceInOut=function(t){return t<.5?.5*ot.easingBounceIn(2*t):.5*ot.easingBounceOut(2*t-1)+.5};var ut=function(t,e,n,i){this.element="scroll"in n&&(void 0===t||null===t)?Z:t,this.playing=!1,this.reversed=!1,this.paused=!1,this._startTime=null,this._pauseTime=null,this._startFired=!1,this.options={};for(var s in i)this.options[s]=i[s];if(this.options.rpr=i.rpr||!1,this.valuesRepeat={},this.valuesEnd={},this.valuesStart={},V.call(this,n,"end"),this.options.rpr?this.valuesStart=e:V.call(this,e,"start"),void 0!==this.options.perspective&&C in this.valuesEnd){var r="perspective("+parseInt(this.options.perspective)+"px)";this.valuesEnd[C].perspective=r}for(var a in this.valuesEnd)a in G&&!this.options.rpr&&G[a].call(this);this.options.chain=[],this.options.easing=i.easing&&"function"==typeof rt(i.easing)?rt(i.easing):ot[f.easing],this.options.repeat=i.repeat||f.repeat,this.options.repeatDelay=i.repeatDelay||f.repeatDelay,this.options.yoyo=i.yoyo||f.yoyo,this.options.duration=i.duration||f.duration,this.options.delay=i.delay||f.delay,this.repeat=this.options.repeat},lt=(ut.prototype={start:function(t){st.call(this),this.options.rpr&&at.apply(this),U.apply(this);for(var s in this.valuesEnd)s in G&&this.options.rpr&&G[s].call(this),this.valuesRepeat[s]=this.valuesStart[s];return n.push(this),this.playing=!0,this.paused=!1,this._startFired=!1,this._startTime=t||e.now(),this._startTime+=this.options.delay,this._startFired||(this.options.start&&this.options.start.call(),this._startFired=!0),!i&&L(),this},play:function(){return this.paused&&this.playing&&(this.paused=!1,this.options.resume&&this.options.resume.call(),this._startTime+=e.now()-this._pauseTime,M(this),!i&&L()),this},resume:function(){return this.play()},pause:function(){return!this.paused&&this.playing&&(x(this),this.paused=!0,this._pauseTime=e.now(),this.options.pause&&this.options.pause.call()),this},stop:function(){return!this.paused&&this.playing&&(x(this),this.playing=!1,this.paused=!1,it.call(this),this.options.stop&&this.options.stop.call(),this.stopChainedTweens(),et.call(this)),this},chain:function(){return this.options.chain=arguments,this},stopChainedTweens:function(){for(var t=0,e=this.options.chain.length;t<e;t++)this.options.chain[t].stop()}},function(t,e,n){this.tweens=[];for(var i=[],s=0,r=t.length;s<r;s++)i[s]=n||{},n.delay=n.delay||f.delay,i[s].delay=s>0?n.delay+(n.offset||f.offset):n.delay,this.tweens.push(ct(t[s],e,i[s]))}),ht=function(t,e,n,i){this.tweens=[];for(var s=[],r=0,a=t.length;r<a;r++)s[r]=i||{},i.delay=i.delay||f.delay,s[r].delay=r>0?i.delay+(i.offset||f.offset):i.delay,this.tweens.push(pt(t[r],e,n,s[r]))},ct=(lt.prototype=ht.prototype={start:function(t){t=t||e.now();for(var n=0,i=this.tweens.length;n<i;n++)this.tweens[n].start(t);return this},stop:function(){for(var t=0,e=this.tweens.length;t<e;t++)this.tweens[t].stop();return this},pause:function(){for(var t=0,e=this.tweens.length;t<e;t++)this.tweens[t].pause();return this},chain:function(){return this.tweens[this.tweens.length-1].options.chain=arguments,this},play:function(){for(var t=0,e=this.tweens.length;t<e;t++)this.tweens[t].play();return this},resume:function(){return this.play()}},function(t,e,n){return n=n||{},n.rpr=!0,new ut(g(t),e,e,n)}),pt=function(t,e,n,i){return i=i||{},new ut(g(t),e,n,i)},ft=function(t,e,n){return new lt(g(t,!0),e,n)},dt=function(t,e,n,i){return new ht(g(t,!0),e,n,i)};return{property:v,getPrefix:d,selector:g,processEasing:rt,defaultOptions:f,to:ct,fromTo:pt,allTo:ft,allFromTo:dt,ticker:L,tick:i,tweens:n,update:N,dom:j,parseProperty:J,prepareStart:K,crossCheck:G,Tween:ut,truD:m,truC:w,rth:b,htr:I,getCurrentStyle:E}});



// KUTE.js v1.6.2 | © dnp_theme | SVG Plugin | MIT-License

!function(t,e){if("function"==typeof define&&define.amd)define(["kute.js"],e);else if("object"==typeof module&&"function"==typeof require)module.exports=e(require("kute.js"));else{if("undefined"==typeof t.KUTE)throw new Error("SVG Plugin require KUTE.js.");e(t.KUTE)}}(this,function(t){"use strict";var e="undefined"!=typeof global?global:window,r=t,n=r.dom,a=r.parseProperty,i=r.prepareStart,s=r.getCurrentStyle,o=(r.truC,r.truD,r.crossCheck),l=e.Interpolate.number,h=(e.Interpolate.unit,e.Interpolate.color,r.defaultOptions),u=null!==new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})").exec(navigator.userAgent)&&parseFloat(RegExp.$1),p=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);if(!(u&&u<9)){var f=/(m[^(h|v|l)]*|[vhl][^(v|h|l|z)]*)/gim,g="http://www.w3.org/2000/svg",c=e.Interpolate.coords=p?function(t,e,r,n){for(var a=[],i=0;i<r;i++){a[i]=[];for(var s=0;s<2;s++)a[i].push(t[i][s]+(e[i][s]-t[i][s])*n)}return a}:function(t,e,r,n){for(var a=[],i=0;i<r;i++){a[i]=[];for(var s=0;s<2;s++)a[i].push((10*(t[i][s]+(e[i][s]-t[i][s])*n)>>0)/10)}return a},v=function(t,e,r){for(var n=[],a=[],i=t.getTotalLength(),s=e.getTotalLength(),o=Math.max(i,s),l=o/r,h=0,u=l*r;(h+=r)<u;)n.push([t.getPointAtLength(h).x,t.getPointAtLength(h).y]),a.push([e.getPointAtLength(h).x,e.getPointAtLength(h).y]);return[n,a]},m=function(t,e,r){for(var n,a,i,s,o,l=[],h=r.length,u=0;u<h;u++)n=Math.abs(r[u][0]-e.x),a=Math.abs(r[u][1]-e.y),l.push(Math.sqrt(n*n+a*a));return i=l.indexOf(Math.min.apply(null,l)),o=r[i-1]?i-1:h-1,s=r[i+1]?i+1:0,Math.abs(r[o][0]-e.x)<t&&Math.abs(r[o][1]-e.y)<t?r[o]:Math.abs(r[s][0]-e.x)<t&&Math.abs(r[s][1]-e.y)<t?r[s]:Math.abs(r[i][0]-e.x)<t&&Math.abs(r[i][1]-e.y)<t?r[i]:[e.x,e.y]},d=function(t){for(var e,r,n=t.match(f),a=n.length,i=0,s=0,o=0;o<a;o++)n[o]=n[o],e=n[o][0],r=new RegExp(e+"[^\\d|\\-]*","i"),n[o]=n[o].replace(/(^|[^,])\s*-/g,"$1,-").replace(/(\s+\,|\s|\,)/g,",").replace(r,"").split(","),n[o][0]=parseFloat(n[o][0]),n[o][1]=parseFloat(n[o][1]),0===o?(i+=n[o][0],s+=n[o][1]):(i=n[o-1][0],s=n[o-1][1],/l/i.test(e)?(n[o][0]="l"===e?n[o][0]+i:n[o][0],n[o][1]="l"===e?n[o][1]+s:n[o][1]):/h/i.test(e)?(n[o][0]="h"===e?n[o][0]+i:n[o][0],n[o][1]=s):/v/i.test(e)&&(n[o][0]=i,n[o][1]="v"===e?n[o][0]+s:n[o][0]));return n},y=function(t){return t.split(/z/i).shift()+"z"},b=function(t){var e=document.createElementNS(g,"path"),r="object"==typeof t?t.getAttribute("d"):t;return e.setAttribute("d",r),e},w=function(t){if("glyph"===t.tagName){var e=b(t);return t.parentNode.appendChild(e),e}return t},A=function(t){var e={},r="object"==typeof t?t:/^\.|^\#/.test(t)?document.querySelector(t):null;return r&&/path|glyph/.test(r.tagName)?(e.e=w(r),e.o=r.getAttribute("d")):!r&&/[a-z][^a-z]*/gi.test(t)&&(e.e=b(t.trim()),e.o=t),e},M=function(t,e){var r,n,a,i,s,o,l,h,u,p,f,g=[],c=this.options.morphIndex;if(this._isPolygon)if(t=d(t),e=d(e),t.length!==e.length){i=Math.max(t.length,e.length),i===e.length?(s=t,o=e):(s=e,o=t),h=s.length,l=b("M"+s.join("L")+"z"),u=l.getTotalLength()/i;for(var y=0;y<i;y++)p=l.getPointAtLength(u*y),f=m(u,p,s),g.push([f[0],f[1]]);i===e.length?(n=o,r=g):(r=o,n=g)}else r=t,n=e;else t=b(t),e=b(e),a=v(t,e,this.options.morphPrecision),r=a[0],n=a[1],i=n.length;if(this.options.reverseFirstPath&&r.reverse(),this.options.reverseSecondPath&&n.reverse(),c){var w=n.splice(c,i-c);n=w.concat(n)}return t=e=null,[r,n]};h.morphPrecision=15,a.path=function(t,e){return"path"in n||(n.path=function(t,e,r,n,a){t.setAttribute("d",1===a?n.o:"M"+c(r.d,n.d,n.d.length,a)+"Z")}),A(e)},i.path=function(t){return this.element.getAttribute("d")},o.path=function(){var t,e=y(this.valuesStart.path.o),r=y(this.valuesEnd.path.o);this.options.morphPrecision=this.options&&"morphPrecision"in this.options?parseInt(this.options.morphPrecision):h.morphPrecision,this._isPolygon=!/[CSQTA]/i.test(e)&&!/[CSQTA]/i.test(r),t=M.apply(this,[e,r]),this.valuesStart.path.d=t[0],this.valuesEnd.path.d=t[1]};var x=function(t,e){return parseFloat(t)/100*e},P=function(t){var e=t.getAttribute("width"),r=t.getAttribute("height");return 2*e+2*r},k=function(t){var e=t.getAttribute("points").split(" "),r=0;if(e.length>1){var n=function(t){var e=t.split(",");if(2==e.length&&!isNaN(e[0])&&!isNaN(e[1]))return[parseFloat(e[0]),parseFloat(e[1])]},a=function(t,e){return void 0!=t&&void 0!=e?Math.sqrt(Math.pow(e[0]-t[0],2)+Math.pow(e[1]-t[1],2)):0};if(e.length>2)for(var i=0;i<e.length-1;i++)r+=a(n(e[i]),n(e[i+1]));r+=a(n(e[0]),n(e[e.length-1]))}return r},T=function(t){var e=t.getAttribute("x1"),r=t.getAttribute("x2"),n=t.getAttribute("y1"),a=t.getAttribute("y2");return Math.sqrt(Math.pow(r-e,2)+Math.pow(a-n,2))},F=function(t){var e=t.getAttribute("r");return 2*Math.PI*e},S=function(t){var e=t.getAttribute("rx"),r=t.getAttribute("ry"),n=2*e,a=2*r;return Math.sqrt(.5*(n*n+a*a))*(2*Math.PI)/2},N=function(t){return/rect/.test(t.tagName)?P(t):/circle/.test(t.tagName)?F(t):/ellipse/.test(t.tagName)?S(t):/polygon|polyline/.test(t.tagName)?k(t):/line/.test(t.tagName)?T(t):void 0},E=function(t,e){var r,n,a,i,o=/path|glyph/.test(t.tagName)?t.getTotalLength():N(t);return e instanceof Object?e:("string"==typeof e?(e=e.split(/\,|\s/),r=/%/.test(e[0])?x(e[0].trim(),o):parseFloat(e[0]),n=/%/.test(e[1])?x(e[1].trim(),o):parseFloat(e[1])):"undefined"==typeof e&&(i=parseFloat(s(t,"stroke-dashoffset")),a=s(t,"stroke-dasharray").split(/\,/),r=0-i,n=parseFloat(a[0])+r||o),{s:r,e:n,l:o})};a.draw=function(t,e){return"draw"in n||(n.draw=function(t,e,r,n,a){var i=(100*r.l>>0)/100,s=(100*l(r.s,n.s,a)>>0)/100,o=(100*l(r.e,n.e,a)>>0)/100,h=0-s,u=o+h;t.style.strokeDashoffset=h+"px",t.style.strokeDasharray=(100*(u<1?0:u)>>0)/100+"px, "+i+"px"}),E(this.element,e)},i.draw=function(){return E(this.element)};var I=function(t,e){return/[a-zA-Z]/.test(t)&&!/px/.test(t)?t.replace(/top|left/,0).replace(/right|bottom/,100).replace(/center|middle/,50):/%/.test(t)?e.x+parseFloat(t)*e.width/100:parseFloat(t)},L=function(t){var e=t&&/\)/.test(t)?t.substring(0,t.length-1).split(/\)\s|\)/):"none",r={};if(e instanceof Array)for(var n=0,a=e.length;n<a;n++){var i=e[n].trim().split("(");r[i[0]]=i[1]}return r},j=function(t){var e,r={},n=this.element.getBBox(),a=n.x+n.width/2,i=n.y+n.height/2,s=this.options.transformOrigin;s=s?s instanceof Array?s:s.split(/\s/):[a,i],s[0]="number"==typeof s[0]?s[0]:I(s[0],n),s[1]="number"==typeof s[1]?s[1]:I(s[1],n),r.origin=s;for(var o in t)"rotate"===o?r[o]="number"==typeof t[o]?t[o]:t[o]instanceof Array?t[o][0]:1*t[o].split(/\s/)[0]:"translate"===o?(e=t[o]instanceof Array?t[o]:/\,|\s/.test(t[o])?t[o].split(","):[t[o],0],r[o]=[1*e[0]||0,1*e[1]||0]):/skew/.test(o)?r[o]=1*t[o]||0:"scale"===o&&(r[o]=parseFloat(t[o])||1);return r};return a.svgTransform=function(t,e){return"svgTransform"in n||(n.svgTransform=function(t,e,r,n,a){var i,s=0,o=0,h=Math.PI/180,u="scale"in n?l(r.scale,n.scale,a):1,p="rotate"in n?l(r.rotate,n.rotate,a):0,f=Math.sin(p*h),g=Math.cos(p*h),c="skewX"in n?l(r.skewX,n.skewX,a):0,v="skewY"in n?l(r.skewY,n.skewY,a):0,m=p||c||v||1!==u||0;s-=m?n.origin[0]:0,o-=m?n.origin[1]:0,s*=u,o*=u,o+=v?s*Math.tan(v*h):0,s+=c?o*Math.tan(c*h):0,i=g*s-f*o,o=p?f*s+g*o:o,s=p?i:s,s+="translate"in n?l(r.translate[0],n.translate[0],a):0,o+="translate"in n?l(r.translate[1],n.translate[1],a):0,s+=m?n.origin[0]:0,o+=m?n.origin[1]:0,t.setAttribute("transform",(s||o?"translate("+(100*s>>0)/100+(o?","+(100*o>>0)/100:"")+")":"")+(p?"rotate("+(100*p>>0)/100+")":"")+(c?"skewX("+(10*c>>0)/10+")":"")+(v?"skewY("+(10*v>>0)/10+")":"")+(1!==u?"scale("+(1e3*u>>0)/1e3+")":""))}),j.call(this,e)},i.svgTransform=function(t,e){var r={},n=L(this.element.getAttribute("transform"));for(var a in e)r[a]=a in n?n[a]:"scale"===a?1:0;return r},o.svgTransform=function(){if(this.options.rpr){var t=this.valuesStart.svgTransform,e=this.valuesEnd.svgTransform,r=j.call(this,L(this.element.getAttribute("transform")));for(var n in r)t[n]=r[n];var a=this.element.ownerSVGElement,i=a.createSVGTransformFromMatrix(a.createSVGMatrix().translate(-t.origin[0],-t.origin[1]).translate("translate"in t?t.translate[0]:0,"translate"in t?t.translate[1]:0).rotate(t.rotate||0).skewX(t.skewX||0).skewY(t.skewY||0).scale(t.scale||1).translate(+t.origin[0],+t.origin[1]));t.translate=[i.matrix.e,i.matrix.f];for(var n in t)n in e||(e[n]=t[n])}},this}});

