/*
Copyright 2013 jQuery Foundation and other contributors
http://jquery.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* 
  This test code is referenceing  the sizzle (ver: 1.10.6-pre). 
 We refer to the code to check the consistency of our code.
 */
/*global
	QUnit: true,
	q: true,
	t: true,
	url: true,
	createWithFriesXML: true,
	seek: true,
	module: true,
	test: true,
	asyncTest: true,
	expect: true,
	stop: true,
	start: true,
	ok: true,
	equal: true,
	notEqual: true,
	deepEqual: true,
	notDeepEqual: true,
	strictEqual: true,
	notStrictEqual: true,
	raises: true,
	moduleTeardown: true
*/

module("utilities", { teardown: moduleTeardown });

test("seek.contains", function() {
	expect( 16 );

	var container = document.getElementById("nonnodes"),
		element = container.firstChild,
		text = element.nextSibling,
		nonContained = container.nextSibling,
		detached = document.createElement("a");
	ok( element && element.nodeType === 1, "preliminary: found element" );
	ok( text && text.nodeType === 3, "preliminary: found text" );
	ok( nonContained, "preliminary: found non-descendant" );
	ok( seek.contains(container, element), "child" );
	ok( seek.contains(container.parentNode, element), "grandchild" );
	ok( seek.contains(container, text), "text child" );
	ok( seek.contains(container.parentNode, text), "text grandchild" );
	ok( !seek.contains(container, container), "self" );
	ok( !seek.contains(element, container), "parent" );
	ok( !seek.contains(container, nonContained), "non-descendant" );
	ok( !seek.contains(container, document), "document" );
	ok( !seek.contains(container, document.documentElement), "documentElement (negative)" );
	ok( !seek.contains(container, null), "Passing null does not throw an error" );
	ok( seek.contains(document, document.documentElement), "documentElement (positive)" );
	ok( seek.contains(document, element), "document container (positive)" );
	ok( !seek.contains(document, detached), "document container (negative)" );
});

test("seek.uniqueSort", function() {
	expect( 8 );

	function Arrayish() {
		var i = this.length = arguments.length;
		while ( i-- ) {
			this[ i ] = arguments[ i ];
		}
	}
	Arrayish.prototype = {
		slice: [].slice,
		sort: [].sort,
		splice: [].splice
	};

	var el1 = document.body,
		el2 = document.getElementById("qunit-fixture"),
		arrEmpty = [],
		objEmpty = new Arrayish(),
		arr1 = [ el1 ],
		obj1 = new Arrayish( el1 ),
		arr2 = [ el2, el1 ],
		obj2 = new Arrayish( el2, el1 ),
		arrDup = [ el1, el2, el2, el1 ],
		objDup = new Arrayish( el1, el2, el2, el1 );

	deepEqual( seek.uniqueSort( arrEmpty ).slice( 0 ), [], "Empty array" );
	deepEqual( seek.uniqueSort( objEmpty ).slice( 0 ), [], "Empty quasi-array" );
	deepEqual( seek.uniqueSort( arr1 ).slice( 0 ), [ el1 ], "Single-element array" );
	deepEqual( seek.uniqueSort( obj1 ).slice( 0 ), [ el1 ], "Single-element quasi-array" );
	deepEqual( seek.uniqueSort( arr2 ).slice( 0 ), [ el1, el2 ], "No-duplicates array" );
	deepEqual( seek.uniqueSort( obj2 ).slice( 0 ), [ el1, el2 ], "No-duplicates quasi-array" );
	deepEqual( seek.uniqueSort( arrDup ).slice( 0 ), [ el1, el2 ], "Duplicates array" );
	deepEqual( seek.uniqueSort( objDup ).slice( 0 ), [ el1, el2 ], "Duplicates quasi-array" );
});
