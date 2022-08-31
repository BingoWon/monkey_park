// ==UserScript==
// @name        New script - a.luxury
// @namespace   Violentmonkey Scripts
// @match       http://*.luxury/*
// @grant       none
// @version     1.0
// @author      -
// @description 2022/8/28 20:16:58
// ==/UserScript==


// window.onload = () => console.log("Fully Loaded!");
const url = window.location.href;
console.log(url);
window.onload = (url === "http://a.luxury/signin") ? autoLogin : autoCheckin;

function autoLogin() {
    console.log("自动登录开始。");
    myInput("input[type='text']", "bingow");
    myInput("input[type='password']", "1?B*x%t>~D@q*AE!*33D");

    document.querySelector("form button[type='button']").click();
    console.log("点击登录按钮完成。")
    waitForBtn("div.el-message-box__btns button")
        .then((btnElem) => {
            btnElem.click()
            console.log("点击登录成功按钮完成。")
        });
    // 登录后，首页弹窗的“确定”按钮（并不确定一定会出现）。
    console.log("登录完毕，开始尝试点击弹窗按钮。");
    waitForBtn("div.el-dialog button.el-button")
        .then((btnElem) => {
            btnElem.click()
            console.log("点击弹窗按钮完成。")
        });
}

function autoCheckin() {
    console.log("自动签到开始。");
    waitForBtn("div.el-dialog button.el-button")
        .then((btnElem) => {

            console.log("点击弹窗按钮开始。");
            setTimeout(() => {
                btnElem.click();
                console.log("点击弹窗按钮完成。");
            }, 2000);
        })
        .then(waitForBtn("div.leftbuttonwraps div:nth-last-child(1) a#succedaneum")
            .then((btnElem) => {

                console.log("点击签到按钮开始。");
                setTimeout(() => {
                    btnElem.click();
                    console.log("点击签到按钮完成。");
                }, 2000);
            }));
}

function myInput(selector, str) {
    const elem = document.querySelector(selector);
    elem.value = str;
    elem.dispatchEvent(new Event("input", { bubbles: true }));
}

function waitForBtn(btnSelector, parentSelector) {
    return new Promise((resolve, reject) => {
        let btnElem = document.querySelector(btnSelector);
        if (btnElem) resolve(btnElem);

        const observer = new MutationObserver(() => {
            btnElem = document.querySelector(btnSelector)
            if (btnElem) {
                return resolve(btnElem);
            } else {
                console.log("此轮检查发现btn暂不存在。")
            };
        });

        const parentElem = parentSelector ? document.querySelector(parenSelector) : document.body;
        config = { childList: true, subtree: true };
        observer.observe(parentElem, config);
    })
        .catch((error) => console.log(error));
}