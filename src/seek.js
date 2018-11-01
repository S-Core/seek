/*!
 * seek CSS Selector Engine v@VERSION
 * http://github.com/S-Core/seek
 *
 *
 * Date: @DATE
 */
( function ( window, undefined ) {
	var	push = [].push,
		slice = [].slice,
		hasDuplicate,

		// Regex
		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,
		whitespace = "[\\x20\\t\\r\\n\\f]",
		rheader = /h\d/i,

		// http://www.w3.org/TR/css3-syntax/#characters
		characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",
		identifier = characterEncoding.replace( "w", "w#" ),
		operators = "([*^$|!~]?=)",
		attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
			"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
		pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",
		pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)",
		rinputs = /input|select|textarea|button/i,

		rescape = /'|\\/g,
		rsibling = new RegExp( whitespace + "*[+~]" ),
		rattribute = new RegExp( attributes ),
		rpseudoUpperkeys = new RegExp( ":.*[A-Z]+.*", "g" ),

		// for tokenize
		rchild = /^[\s>+~]/,
		rcolonEnd = /[\(,\[\s]/,
		rcolonPass = /[\[\s]/,
		rnative = new RegExp( "^:(link|visited||hover|only|first|before|after|lang|root|" +
			"empty|target|enabled|disabled|checked|last|nth|nth-last)-(child|of-type|letter|line|child)", "i" ),
		ralter = new RegExp( "^:(checkbox|file|image|password|radio|reset|submit)", "i" ),

		matchExpr = {
			"ID": new RegExp( "^#(" + characterEncoding + ")" ),
			"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
			"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
			"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"POS": new RegExp( pos, "i" ),
			"CHILD": new RegExp( "^:(only|nth|first|last)-child(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			// For use in libraries implementing .is()
			"needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
		},

		expando = "seek" + -( new Date() ),
		// concern matchs
		rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),
		rbuggyMatches = /\:active/,
		docElem = document.documentElement,
		matches = docElem.matchesSelector ||
				docElem.mozMatchesSelector ||
				docElem.webkitMatchesSelector ||
				docElem.oMatchesSelector ||
				docElem.msMatchesSelector;

	function seek( selector, context, results, seed ) {
		var nodeType, matche, elems, elem;

		context = context || document;
		results = results || [];
		nodeType = context.nodeType;

		if ( seed && !seed.length ) {
			return [];
		}

		if ( !selector || typeof selector !== "string" || ( nodeType !== 1 && nodeType !== 9 ) ) {
			return results;
		}

		if ( !seed && ( matche = rquickExpr.exec( selector ) ) ) {
			if ( matche [ 1 ] ) { // ID
				if ( nodeType === 9 ) {
					elems = context.getElementById( matche [ 1 ] );
					if ( elems ) {
						results.push( elems );
					}
				} else {
					if ( context.ownerDocument && ( elem = context.ownerDocument.getElementById( matche [ 1 ] ) ) &&
							contains( context, elem ) && elem.id === matche [ 1 ] ) {
						results.push( elem );
					}
				}
			} else if ( matche [ 2 ] ) { // TAG
				push.apply( results, slice.call( context.getElementsByTagName(  matche [ 2 ] ), 0 ) );
			} else if ( matche [ 3 ] ) { // CLASS
				push.apply( results, slice.call( context.getElementsByClassName( matche[ 3 ] ), 0 ) );
			}
			if ( !( matche [ 1 ] && results.length === 0 ) ) {
				return results;
			}
		}

		return select( selector.trim(), context, results, seed );
	}

	function select( selector, context, results, seed ) {
		var  result, seedLength = seed ? seed.length : 0;

		result = ( seedLength > 0 ) ?
			validateElements( selector, context, seed ) :
				searchElements( selector, context, results, seed );

		push.apply( results, slice.call( result, 0 ) );

		if ( results.length > 1 ) {
			seek.uniqueSort( results );
		}

		return results;
	}

	function searchElements( selector, context, results, seed ) {
		var result, i = 0,
			contexts = context && context instanceof Array  ? context : [ context ],
			length = contexts.length;

		try {
			for ( ; i < length ; i++ ) {
				result = querySelector( contexts[ i ] , selector );
				if ( result.length > 0 ) {
					push.apply( results, slice.call( result, 0 ) );
				}
			}
			return results;
		} catch ( error ) {
			return deepSelect( selector, context, seed, finder );
		}
	}

	function validateElements( selector, context, seed ) {
		if ( !rbuggyMatches.test( selector ) ) {
			try {
				return elementsMatcher( selector, seed );
			} catch ( error ) {}
		}

		return deepSelect( selector, context, seed, validate );
	}

	function deepSelect( selector, context, seed, fn ) {
		var results = [], i = 0,
			groups, length, tokens, elems;

		groups = tokenize( selector );
		length = groups.length ;

		for ( ; i < length ; i++ ) {
			tokens = processTokens( groups[i] );
			elems = fn( tokens, context, seed );
			push.apply( results, elems );
		}

		return results;
	}

	seek.error = function ( message, selector ) {
		throw new Error( message + "\n '" + selector + "'" );
	};

	function tokenize( selector ) {
		var charactor,
			soFar = selector,
			groups = [],
			tokens = [ "" ],
			tokenslength = 0,
			parentheses = 0,
			colon = false,
			brackets = false,
			quotation = false,
			errorMessage = "Syntax error, unrecognized expression: \n '";

		if ( selector === "()" || selector[ 0 ] === "," ) {
			seek.error( errorMessage, selector );
		}

		while ( soFar ) {
			charactor = soFar[ 0 ];
			tokenslength = tokens.length - 1;

			if ( charactor === "(" && !brackets && !quotation ) {
				if ( !parentheses ) {
					tokens.push( "" );
					tokenslength++;
				}
				parentheses++;
			}

			if ( parentheses ) {
				tokens[ tokenslength ] += charactor;

				if ( charactor === "'" ) {
					quotation = !quotation;
				}

				if ( charactor === ")" && !brackets && !quotation ) {
					parentheses--;
					if ( !parentheses ) {
						tokens.push( "" );
					}
				}
			} else {
				if ( tokens[ tokenslength ].slice( -1 ) !== "\\" ) {
					if ( charactor === "[" ) {
						brackets = true;
					} else if ( charactor === "]" ) {
						brackets = false;
					}

					if ( charactor === ":" && !brackets ) {
						tokens.push( "" );
						tokenslength++;
						if ( !colon ) {
							colon = true;
						}
					}
				}

				if ( colon ) {
					if ( charactor === "," ) {
						groups.push( tokens.slice( 0 ) );
						tokens = [ "" ];
					} else if ( !rcolonPass.test( charactor ) ) {
						tokens[ tokenslength ] += charactor;
					}

					if ( rcolonEnd.test( charactor ) ) {
						colon = false;
						tokens.push( rcolonPass.test( charactor ) ? charactor: "" );
					}
				} else {
					if ( charactor === "," ) {
						groups.push( tokens.slice( 0 ) );
						tokens = [ "" ];

						if ( !soFar.slice( 1, soFar.length ).trim().length ) {
							seek.error( errorMessage, selector );
						}
					} else {
						tokens[ tokenslength ] += charactor;
					}
				}
			}

			soFar = soFar.slice( 1 );

			if ( charactor === "," ) {
				soFar = soFar.trim();
			}
		}

		if ( parentheses || brackets ) {
			seek.error( errorMessage, selector );
		}

		groups.push( tokens );
		return groups;
	}

	function processTokens( tokens ) {
		var i, piece, prev, alter,
			pieces = tokens,
			length = pieces.length,
			results = [],
			getQueryType = function ( value ) {
				return ( !results.length || rchild.test( value ) ) ? "child" : "sibling";
			};

		for ( i = 0; i < length; i++ ) {
			piece = pieces[i];

			if ( piece !== "" && piece !== undefined ) {
				prev = results[ results.length - 1 ];

				if ( ralter.exec( piece ) ) {
					alter = "[type=" + piece.substring( 1, piece.length ) + "]";

					if ( prev && prev.type !== "origin" ) {
						prev.value += alter;
					} else {
						results.push( { type: getQueryType( piece[ 0 ] ), value: alter } );
					}
				} else if ( !piece.indexOf( ":" ) ) {
					if ( rnative.test( piece ) ) {
						if ( prev && prev.type !== "origin" ) {
							prev.value += piece;
						} else {
							results.push( { type: getQueryType( piece[ 0 ] ), value: piece } );
						}
					} else {
						results.push( { type: "origin", value: piece, arg: "" });
					}
				} else if ( !piece.indexOf( "(" ) ) {
					if ( prev ) {
						if ( prev.type !== "origin" ) {
							prev.value += piece;
						} else {
							piece = piece.substring( 1, piece.length - 1 ).trim();

							if ( !piece.indexOf( "'" ) || !piece.indexOf( "\"" ) ) {
								piece = piece.substring( 1, piece.length - 1 ).trim();
							}

							prev.arg = piece;
						}
					}
				} else {
					if ( piece.slice( -1 ) === " " ) {
						piece += "*";
					}

					if ( piece.trim()[ 0 ] === "+" ) {
						piece = "*" + piece;
					}
					results.push( { type: getQueryType( piece[ 0 ] ), value: piece.trim() } );
				}
			}
		}

		if ( results[ 0 ].type === "origin" ) {
			results.unshift( { value: "*", type: "child" } );
		}

		return results;
	}

	function elementsMatcher( selector, seed ) {
		var type, results = [], length = seed.length, i = 0, newSelector;

		newSelector = validateAttribute( selector ).replace( rpseudoUpperkeys, function ( x ) {
			return x.toLowerCase()
		});

		newSelector = newSelector.replace( /_COMMA_/g, ",")

		for ( ; i < length ; i++ ) {
			type = seed[ i ].nodeType;
			if ( type && type === 1 && matches.call( seed[ i ], newSelector ) ) {
				results.push( seed [ i ] );
			}
		}

		return results;
	}

	function validate( tokens, context, seed ) {
		var elems, token, results = seed, i = 0;

		for ( ; i < tokens.length ; i++) {
			elems = results;
			results = ( tokens[ i ]. type !== "origin" ) ?
				elementsMatcher( tokens[ i ].value, elems ) :
					filterAdapter( elems, tokens[ i ] );
		}

		return results;
	}

	function finder( tokens, context ) {
		var	fn, type, tokenValue, elems, results= [], i = 0;

		elems = ( context instanceof Array ) ? context : [ context ];

		for ( ; i < tokens.length  ; i++ ) {
			type = tokens[ i ]. type;
			results = ( type === "child" ) ?
				findElements( elems, tokens[ i ] ) :
					( type === "sibling" ) ?
						elementsMatcher( tokens[ i ].value, elems ) :
							filterAdapter( elems, tokens[ i ] );
			elems = results;
		}

		if ( i !== tokens.length ) {
			results = [];
		}

		return results;
	}

	function findElements( contexts, token ) {
		var i = 0, length = contexts.length, results = [];

		for ( ; i < length ; i++ ) {
			result = querySelector( contexts[ i ], token.value );
			push.apply( results, slice.call( result, 0 ) );
		}

		if ( length > 1 ) {
			seek.uniqueSort( results );
		}

		return results;
	}

	function querySelector( context, selector ) {
		var results = [], newSelector, oldId, newId, newContext = context,
			changeSelector = context.nodeType === 1 && context.nodeName.toLowerCase() !== "object";

		if ( !selector ) {
			return [];
		}

		selector = validateAttribute( selector ).replace( rpseudoUpperkeys, function ( x ) {
			return x.toLowerCase()
		});

		newSelector = context.nodeType === 9 && selector;

		try {
			if ( changeSelector ) {
				newId = expando;
				if ( ( oldId = context.getAttribute("id")) ) {
					newId = oldId.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", newId );
				}
				newId = "[id='" + newId + "'] ";
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = newId + selector;

				newSelector = newSelector.replace(/\\,/gi, "__TEMP_SEEK__" );
				newSelector = newSelector.endsWith(",") ?	newSelector.substring( 0, newSelector.length - 1 ) : newSelector;
				if ( newSelector.indexOf(",") > 0 ) {
					newSelector = newSelector.replace(/,/gi, ", " + newId );
				}
				newSelector = newSelector.replace(/__TEMP_SEEK__/gi, "\\," );
			}

			if ( newContext && newContext.querySelectorAll ) {
				push.apply( results, slice.call( newContext.querySelectorAll( ( newSelector ? newSelector : selector).replace( /_COMMA_/g, ",") ), 0 ) );
			}
			return results;
		} catch ( err ) {
			throw new Error( "Syntax error, unrecognized expression: \n " + err.message +"     " + selector + "    " + newSelector );
			return [];
		} finally {
			if ( changeSelector &&  !oldId  ) {
				context.removeAttribute("id");
			}
		}
	}

	Expr = seek.selectors = {
		match: matchExpr,
		find: {
			"ID": function( id, context, xml ) {
				if ( context.getElementById && !xml ) {
					var m = context.getElementById( id );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [m] : [];
				}
			},

			"TAG": function( tag, context ) {
				if ( context.getElementsByTagName ) {
					return context.getElementsByTagName( tag );
				}
			},

			"NAME": function( tag, context ) {
				if ( context.getElementsByName ) {
					return context.getElementsByName( name );
				}
			},

			"CLASS": function( className, context, xml ) {
				if ( context.getElementsByClassName && !xml ) {
					return context.getElementsByClassName( className );
				}
			}
		},

		pseudos: {
			"not": function ( elems, selector ) {
				var  i = 0, j = 0, compared = 0, elem, index,
					matches = seek( selector, null, null, elems ),
					elemsLength = elems.length,
					matchesLength = matches.length,
					results = elems.slice( 0 );

				while ( i < elemsLength && j < matchesLength ) {
					compared = sortOrder( elems[ i ],  matches[ j ] );
					if  ( compared === 0 ) {
						if ( ( index = results.indexOf( elems[ i ] )  ) !== -1 ) {
							results.splice( index, 1 );
						}
						i = i < elemsLength ? i + 1 : i;
						j = j < matchesLength ? j + 1 : j; 
					} else if ( compared < 0 ) {
						i = i < elemsLength ? i + 1 : i;
					} else {
						j = j < matchesLength ? j + 1 : j; 
					}
				}

				return results;
			},

			"has": function ( elem, selector ) {
				return seek( selector, elem ).length > 0;
			},

			"contains": function ( elem, text ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			},

			"selected": function ( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			"parent": function ( elem ) {
				var nodeType;
				elem = elem.firstChild;
				while ( elem ) {
					if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
						return true;
					}
					elem = elem.nextSibling;
				}
				return false;
			},

			"header": function ( elem ) {
				return rheader.test( elem.nodeName );
			},

			"button": function ( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function( elem ) {
				return elem.nodeName.toLowerCase() === "input" &&  elem.type === "text";
			},

			"input": function ( elem ) {
				return rinputs.test( elem.nodeName );
			},

			"focus": function ( elem ) {
				var doc = elem.ownerDocument;
				return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			"active": function ( elem ) {
				return elem === elem.ownerDocument.activeElement;
			}
		}
	};

	function validateAttribute( selector ) {
		var i = 0,
			isNot,
			noQuotation,
			results = [],
			token,
			pieces = selector.split( rattribute ),
			length = pieces.length - 1;

		while ( i < length ) {
			if ( !pieces[ i + 2 ] ) {
				break;
			}

			token = [];
			isNot  = ( pieces[ i + 2 ] === "!=" );
			noQuotation = ( pieces[ i + 3 ] === undefined );

			token.push( "[",
				pieces[ i + 1 ], // name
				isNot ? "=" : pieces[ i + 2 ] // combinator
			);

			token.push( noQuotation ? pieces[ i + 3 ] = "'" : pieces[ i + 3 ], // quotation
				( pieces[ i + 4 ] || pieces[ i + 5 ] || "" ).replace( /,/g, "_COMMA_" ), // value
				pieces[ i + 3 ], // quotation
				"]"
			);

			if ( isNot ) {
				token.unshift( ":not(" );
				token.push( ")" );
			}

			results.push( pieces[i] + token.join( "" ) );
			i += 6;
		}

		if ( results.length ) {
			results.push( pieces[ length ] );
			selector = results.join( "" );
		}

		return selector;
	}

	function filterAdapter( elements, token ) {
		var i, element, fn, value, argument, length, results = [];

		if ( !elements || !( length = elements.length ) || !token ) {
			return [];
		}

		value = token.value.substring( 1, token.value.length ).toLowerCase();
		argument = token.arg;
		fn = Expr.pseudos[ value ];

		switch ( value ) {
		case "not":
			results = fn( elements, argument );
			break;

		case "first":
			results.push( elements[ 0 ] );
			break;

		case "last":
			results.push( elements[ length - 1 ] );
			break;

		case "nth": // Deprecated
		case "eq":
			argument = +argument;
			if ( length > argument )
				results.push( elements[ argument < 0 ? argument + length : argument ] );
			break;

		case "even":
			for ( i = 0; i < length; i += 2 ) {
				results.push( elements[ i ] );
			}
			break;

		case "odd":
			for ( i = 1; i < length; i += 2 ) {
				results.push( elements[ i ] );
			}
			break;

		case "lt":
			argument = +argument;
			for ( i = argument < 0 ? argument + length : argument; --i >= 0; ) {
				results.push( elements[ i ] );
			}
			break;

		case "gt":
			argument = +argument;
			for ( i = argument < 0 ? argument + length : argument; ++i < length; ) {
				results.push( elements[ i ] );
			}
			break;

		default:
			if ( !fn ) {
				seek.error( "Syntax error or unsupported pseudo: ", value );
				return [];
			}

			for ( i = 0; i < length; i++ ) {
				element = elements[ i ];
				if ( fn( element, argument ) ) {
					results.push( element );
				}
			}
		}

		return results;
	}

	seek.uniqueSort = function( results ) {
		var elem, duplicates = [], i = 1, j = 0;

		hasDuplicate = false;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( ; (elem = results[i]); i++ ) {
				if ( elem === results[ i - 1 ] ) {
					j = duplicates.push( i );
				}
			}

			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}

		return results;
	};

	seek.attr = function( elem, name ) {
		var val,
			xml = isXML( elem );

		if ( xml ) {
			return elem.getAttribute( name );
		}

		name = name.toLowerCase();
		val = elem.getAttributeNode( name );
		return val ?
			typeof elem[ name ] === "boolean" ?
				elem[ name ] ? name : null :
				val.specified ? val.value : null :
			null;
	};

	function sortOrder( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		return ( !a.compareDocumentPosition || !b.compareDocumentPosition ?
			a.compareDocumentPosition :
			a.compareDocumentPosition(b) & 4
		) ? -1 : 1;
	}

	seek.matches = function( expr, elements ) {
		return seek( expr, null, null, elements );
	};

	seek.matchesSelector = function ( elem, expr ) {
		// Make sure that attribute selectors are quoted
		expr = expr.replace( rattributeQuotes, "='$1']" );

		// rbuggyMatches always contains :active, so no need for an existence check
		if ( !rbuggyMatches.test( expr ) ) {
			try {
				return matches.call( elem, expr );
			} catch ( e ) {}
		}
		return seek( expr, null, null, [ elem ] ).length > 0;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = seek.getText = function ( elem ) {
		var node, ret = "", i = 0, nodeType = elem.nodeType;

		if ( nodeType ) {
			if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
				// Use textContent for elements
				// innerText usage removed for consistency of new lines (see #11153)
				if ( typeof elem.textContent === "string" ) {
					return elem.textContent;
				} else {
					// Traverse its children
					for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
						ret += getText( elem );
					}
				}
			} else if ( nodeType === 3 || nodeType === 4 ) {
				return elem.nodeValue;
			}
			// Do not include comment or processing instruction nodes
		} else {

			// If no nodeType, this is expected to be an array
			for ( ; (node = elem[i]); i++ ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		}
		return ret;
	};

	isXML = seek.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	var contains = seek.contains = function( a, b ) {
		var adown = a.nodeType === 9 ? a.documentElement : a,
			bup = b && b.parentNode;
		return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
	};

	// Back-compat
	if ( !String.prototype.trim ) {
		String.prototype.trim  = function() {
			return this.replace(/(^\s*)|(\s*$)/gi, "");
		};
	}

	String.prototype.endsWith = function ( suffix ) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};

	function SetFilters() {}
	Expr.filters = SetFilters.prototype = Expr.pseudos;
	Expr.setFilters = new SetFilters();

	window.seek = seek;
} ( window ) );
