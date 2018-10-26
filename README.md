# SEEK

__Seek is a pure-JavaScript CSS selector engine using browser native API.__
We used native API to make it lightweight. It provides convenience in finding elements for manipulation.

* querySelectorAll
* getElementById
* getElementsByTagName
* getElementsByClassName

# Browser Supports

A browser must support the native function of 'querySelectorAll'.

As such, __Seek__ supports the following browsers:
* Chrome 16+
* Edge 12+
* Firefox 3.6+
* Internet Explorer 9+

# API

```
  seek( String selector [, DOMNode context [, Array result]] )
```
The main function for finding elements. use `'querySelectorAll'`.

*Parameters*

* `selector`: A CSS selector.

* `context`: An element, document, or document fragment to use as the context for finding elements.

   ( Defaults : window.document )

* `result`: An array.


*Return*

* `returns`:  All elements matching the selector.

# Selector

`seek` supports [__CSS3 Selector__](https://www.w3.org/TR/selectors-3/) and some functional selector.
And results returned in document order.

As such, the following pseudo-selectors are not supported:
* :hover
* :active
* :visit, :link

As such, the follwing functional selector:
* `:first/:last` : the first/last matching element.
* `:even/:odd` : Even/odd-numbered elements.
* `:eq(NUMBER)/:nth(NUMBER)` : the nth element. ':eq(1)' finds the second element.
* `:lt(NUMBER)/:gt(NUMBER)` : Elements at positions above/below the specified position.
* `:contains(TEXT)` :  Elements with textContent containing the word 'TEXT'.

*Example*
```
// Finds odd table rows.
var elems = seek(  "#content-table tr:odd"  )
```

# Testing

Open the test/index.html on a web browser.

# LICENSE
GNU Lesser General Public License version 2.1.
