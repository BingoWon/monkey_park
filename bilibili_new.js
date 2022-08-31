// ==UserScript==
// @name        Auto Thumb Up
// @namespace   OIJ.CC
// @match       https://www.bilibili.com/video/*
// @match       https://www.bilibili.com/bangumi/play/*
// 因为Youtube网站总是会在当前页面进行跳转，跳转页面后 ViolentMonkey不会根据新页面的网址重新启用对应脚本，所以这里要针对Youtube做适配。
// @match       https://www.youtube.com/*
// @match       https://www.youtube.com/watch?v=*
// @grant       none
// @version     1.0
// @author      One Good Bob
// @description 2022/8/27 15:28:35
// ==/UserScript==

// Start here
console.log("Bob's coming.");

// 记录当前网页uid为undefined（当然需要是全局变量），使得后面刚打开网页也能认作是网址（标题）变化，需要检查点赞情况。
let lastVideoUid, likedSelector, notLikedSelector;
let timerIdArr = [];
// 页面全部加载完成后 就要运行一次检查等。
// window.onload = () => {
//   console.log("Bob detected Page fully loaded.");
//   titleChangedCallback();
// };

// 之后监控网页的title变化。
const observer = new MutationObserver(titleChangedCallback);

const titleElem = document.querySelector('title');
const config = { childList: true, characterData: true };

observer.observe(titleElem, config);


/*
    需要区分以下三个站点，他们点赞的网页元素不尽相同，需要区分对待。
    B站视频的URL sample:https://www.bilibili.com/video/BV1Ja411N7zD?spm_id_from=333.1007.tianma.1-1-1.click&vd_source=b156e07ac063bb4be8dd1dacf8c3a63f
    B站番剧的URL sample:https://www.bilibili.com/bangumi/play/ss28747?spm_id_from=333.337.0.0
    Youtube URL sample:https://www.youtube.com/watch?v=JKlr0tyQgzk
*/

// 其实下面可以只是一个Array，至于为什么要转换为Set，有待解释。
const websiteSet = new Set([{
  regExp: new RegExp("^https://www.bilibili.com/bangumi/play/(\\w+)\\b"),
  likedSelector: "div.like-info.active",
  notLikedSelector: "div[class='like-info']",   // 这里就是要用这样特别的方法来定位class，否则会与likedSelector重合。
},
{
  regExp: new RegExp("^https://www.bilibili.com/video/(\\w+)\\b"),
  likedSelector: "span.like.on",
  notLikedSelector: "span.like",
},
{
  regExp: new RegExp("^https://www\\.youtube\\.com/watch\\?v=(\\w+)\\b"),
  likedSelector:
    "#info ytd-toggle-button-renderer:nth-child(1).style-default-active",
  notLikedSelector:
    "#info ytd-toggle-button-renderer:nth-child(1).style-text",
}
]);


function titleChangedCallback() {
  // 判断当前页面是否是需要需要点赞的页面（这步操作暂时认为不应该在刚打开页面时操作，因为网页可能会任意跳转的缘故，所以这里采取 每次标题变动后 都需要重新检测网页归属。
  // 发现了指定元素（这里无需传入需要监控的元素）发生变化。
  console.log('Title changed!!!!!!!');
  // 开始尝试获取当前页面视频的uid，如果拿不到返回的是undefined，要单独拿出来判断，因为初始的lastVideoUid也是undefined。
  const currentVideoUid = indentifyWeb();
  if ((currentVideoUid) && (currentVideoUid !== lastVideoUid)) {
    console.log(`检查到网页的uid更新为：${currentVideoUid}`);
    lastVideoUid = currentVideoUid;
    // 到localStorage检查是这个视频是否已经处理过了，如果已经有成功的处理记录（即便显示为未点赞），需要跳过。
    if (localStorage.getItem("Bob_" + currentVideoUid)) return;

    // 视频没有点赞，现在操作点赞。
    // 因为涉及到网页交互，有可能出现未能点赞成功的情况；为了容错，这里设置“循环”尝试点赞；在Promise中确认点赞成功后，将会退出这个循环的定时操作。
    // 这里有概率会出错，尤其是在切换网页的时候，报错为：Timer 'worker' already exists，虽然报错位置不在本脚本内，而且这个报错也会不定时出现，但总觉得有关联。/////////////////////////////////////
    console.log("在setInterval前");
    const timerId = setInterval(makePromise, 3000);
    timerIdArr.push(timerId);
    console.log("在setInterval后");
  }
}

function indentifyWeb() {
  // 这个函数，不光可以拿到当前网页uid，还会修改全局变量likedSelector, notLikedSelector
  // TODO:直接设定和修改全局变量currentVideoUid？？？？？？？？？？？？？？？？？？？？？？？？
  const currentWebUrl = window.location.href;
  for (let websiteObj of websiteSet) {
    const matchResult = currentWebUrl.match(websiteObj.regExp);
    if (matchResult) {
      console.log(`Bob got the video uid: ${matchResult[1]}`);
      ({ likedSelector, notLikedSelector } = websiteObj);
      return matchResult[1];
    }
  }
  // 如果Bob没有识别初该网站，则返回True，表示需要跳过。Youtube为了应对同页面的跳转问题，会经常（比如在首页）匹配不到，所以不会对Youtube做提示。
  if (document.domain !== "www.youtube.com") alert(`${currentWebUrl}\nBob fails to indentify this website.`);
  // return undefined;
}

function makePromise() {
  const promise = new Promise((resolve, reject) => {
    // 如果该视频页面显示已经点赞了，则直接跳过剩余操作。
    // 此时localStorage中的已完成记录中一定没有该视频，需要在.then()中将该视频添加入内。
    console.log(`document.querySelector(likedSelector)的值是${document.querySelector(likedSelector)}`)
    // 下面必须得return resolve()，return必不可少，否则Promise主线程还会继续。
    if (document.querySelector(likedSelector)) return resolve();
    // if not liked, then like it
    console.log(`Haven't liked it yet. Let's like it.\n${likedSelector}\n${notLikedSelector}\n${document.querySelector(likedSelector)}`);
    // TODO:现在没有检查点赞按钮是否存在。
    document.querySelector(notLikedSelector).click();
    // 因为这里不想着急检查是否成功点赞了，所以设置了Timeout，等会儿在检查。实测中发现B站非常需要这样的等待。
    setTimeout(() => {
      document.querySelector(likedSelector) ? resolve() : reject(new Error("It seems that Bob failed liking it. He will wait for the NEXT ROUND and try it again."));
    }, 1000);
  });

  promise
    // 如果检查了该视频已经被点赞了 或刚刚点赞成功了，就记录到localStorage，以后就可以跳过网页元素检查（只有第一次会有这种情况）。
    .then(() => {
      // 结束循环的定时操作。
      // clearInterval(timerId);
      timerIdArr.forEach((timerId) => clearInterval(timerId));
      timerIdArr.length = 0;
      localStorage.setItem("Bob_" + currentVideoUid, true);
      console.log("Bob has liked this video successfully.");
    })
    .catch((error) => {
      console.log(error);
    });
}