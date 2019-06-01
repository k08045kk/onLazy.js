onLazy.js
=========

Lazy processing.



## Description
Add "Ignite on first user event" event as a custom event.  
It fires at the first user event after the load event.  
If the user event fires before the load event, it fires at the load event.  
Also fires in the middle of the document at the time of the load event.  
Ignition occurs only once.  


## Usage

	window.addEventListener('lazy', func);


## Copyright
Copyright (c) 2019 toshi (https://www.bugbugnow.net/p/profile.html)  
Released under the MIT license.  
see https://opensource.org/licenses/MIT
