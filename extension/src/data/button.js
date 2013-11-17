"use strict";
var button   = document.getElementById("enc-button");
var settings = document.getElementById("enc-settings");
var progress = document.getElementById("enc-progress");
var status   = "active";
var view     = "";

function updateView( )
{
    button.src = status + view;
}
function setHoverView( )
{
    view = "_hover.png";        
}
function setNormalView( )
{
    view = ".png";        
}
function setInactive( )
{
    status = "inactive";
}
function setActive( )
{
    status = "active";
}
function setProgressVisible( )
{
    progress.style.visibility = "visible";
}
function setProgressHidden( )
{
    progress.style.visibility = "hidden";
}

self.port.on( "setActive",   function( ) { setActive();   updateView( )});
self.port.on( "setInactive", function( ) { setInactive(); updateView( )});
self.port.on( "setProgressVisible", setProgressVisible );
self.port.on( "setProgressHidden",  setProgressHidden );


button.onclick = function() 
{
    self.port.emit( "clk");
}

button.onmouseover = function( )
{
    setHoverView( );
    updateView( );
}

button.onmouseout = function( )
{
    setNormalView( );
    updateView( );
}


settings.onclick = function( )
{
    self.port.emit( 'settings-clk');
}

setProgressHidden( );
