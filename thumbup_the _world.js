// ==UserScript==
// @name         Bob's UserScript
// @namespace    OIJ.CC
// @version      0.7
// @description  try to smell my feet.
// @author       One Good Bob
// @match        https://www.bilibili.com/video/*
// @icon         https://static.hdslb.com/images/base/icons.png
// @grant        none
// @license      GPL-3.0-only
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    document.addEventListener('DOMContentLoaded', function() {
        alert('Does it work?');
        if (document.querySelector("span[class='like on']") === null) {
            console.log("Ready to thumbup.");
            document.querySelector("span[class='like']").click();
        } else {
            console.log("Already thumbup.");
        }
    });
})();