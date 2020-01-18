onLazy.js
=========

Lazy event listener.


## Description
Add a "fire after first user event" event as a custom event.
Fired after the first user event after the load event.
If the user event fires before the load event, it fires at the time of the load event.
Fired if not at the beginning of the document at the time of the load event.
An event occurs only once.


## Usage

	window.addEventListener('lazy', func);


## Copyright
Copyright (c) 2019 toshi (https://www.bugbugnow.net/p/profile.html)  
Released under the MIT license.  
see https://opensource.org/licenses/MIT
