"use strict";
var password_input   = document.getElementById("enc-password-input");




self.port.on( "setActive",   function( ) { setActive();   updateView( )});


password_input.onchange = function() 
{
    self.port.emit( "password", password_input.value);
}


