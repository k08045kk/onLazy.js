onLazy.js
=========

Lazy processing.



## Description
Add a "fire on first user event" event as a custom event.  
Fires at the first user event after the load event.  
If the user event is fired before the load event, it fires at the load event.  
It also fires when not at the beginning of the document at the time of the load event.  
The event occurs only once.


## Usage

	window.addEventListener('lazy', func);


## Copyright
Copyright (c) 2019 toshi (https://www.bugbugnow.net/p/profile.html)  
Released under the MIT license.  
see https://opensource.org/licenses/MIT
