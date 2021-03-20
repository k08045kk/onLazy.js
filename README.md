onLazy.js
=========

Add a lazy event as a custom event.



## Description
The lazy event will be fired after the first user event after the `DOMContentLoaded` event.
If the user event occurs before the `DOMContentLoaded` event, the lazy event will be fired right after the `DOMContentLoaded` event. Also, if it is not at the beginning of the document, it will be fired right after the `DOMContentLoaded` event.
The lazy event will be fired only once.

User event here means `click / mousedown / keydown / touchstart / mousemove / scroll`.



## Usage
```js
// First user event
window.addEventListener('lazy', func);

// First scroll event
window.addEventListener('lazyed', func);

// When the first user event does not occur, the pagehide event
window.addEventListener('toolazy', func);
```



## License
[MIT](https://github.com/k08045kk/onLazy.js/blob/master/LICENSE)



## Author
[toshi](https://github.com/k08045kk)



