onLazy.js
=========

Add a lazy event as a custom event.



## Description
The lazy event fires after the first user event after the DOMContentLoaded event.
The lazy event fires at the DOMContentLoaded event if the user event fires before the DOMContentLoaded event.
The lazy event will also fire at the DOMContentLoaded event if it is not at the beginning of the document.
The lazy event can only occur once.



## Usage

	// First user event
	window.addEventListener('lazy', func);
	
	// First scroll event
	window.addEventListener('lazyed', func);
	
	// When the first user event does not occur, the pagehide event
	window.addEventListener('toolazy', func);



## License
[MIT](https://github.com/k08045kk/onLazy.js/blob/master/LICENSE)



## Author
[toshi](https://github.com/k08045kk)



