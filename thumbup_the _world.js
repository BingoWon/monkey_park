// ==UserScript==
// @name         Bob's UserScript
// @namespace    OIJ.CC
// @version      1.0
// @description  try to smell my feet.
// @author       One Good Bob
// @match        https://www.bilibili.com/video/*
// @icon         https://static.hdslb.com/images/base/icons.png
// @grant        none
// @license      GPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';
    console.log("Does BiliBili know that I have a UserScript on him?")
    // alert("Fuck you.")
    // Your code here...
    const myInterval = setInterval(thumbUp, 1000);

    function thumbUp() {        
        if (document.querySelector("span[class='like on']") === null) {
            console.log("Ready to thumbup.");
            document.querySelector("span[class='like']").click();
            clearInterval(myInterval)
        } else {
            console.log("Already thumbup.");
        }
    }
})();