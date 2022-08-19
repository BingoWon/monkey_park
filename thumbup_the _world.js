// ==UserScript==
// @name         Bob's UserScript
// @namespace    OIJ.CC
// @version      1.3
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
    const targetNode = document.querySelector("span[class='like']");

    const config = {attribute: true, childList: true, subtree: true};

    const callback = (mutationList, observer) => {
        // mutationList.array.forEach(element => {
            mutationList.forEach(mutation => {
                console.log("Detect thumbup btn. will try to click on it.")
                mutation.click();
        });
    }
    const observer = new MutationObserver(callback);

    observer.observe(targetNode, config);



    // const myInterval = setInterval(thumbUp, 1000);

    // function thumbUp() {        
    //     if (document.querySelector("span[class='like on']") === null) {
    //         console.log("Ready to thumbup.");
    //         document.querySelector("span[class='like']").click();
    //     } else {
    //         console.log("Already thumbup.");
    //         clearInterval(myInterval)
    //     }
    // }
})();