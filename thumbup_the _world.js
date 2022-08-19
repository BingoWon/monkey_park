// ==UserScript==
// @name         Bob's UserScript
// @namespace    OIJ.CC
// @version      0.4
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
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector("span[class='like on']") === null) {
            document.querySelector("span[class='like']").click()
        }
    })
})();