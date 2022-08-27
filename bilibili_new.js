// ==UserScript==
// @name        Auto Thumb Up
// @namespace   OIJ.CC
// @match       https://www.bilibili.com/video/*
// @match       https://www.bilibili.com/bangumi/play/*
// @match       https://www.youtube.com/watch?v=*
// @grant       none
// @version     1.0
// @author      One Good Bob
// @description 2022/8/27 15:28:35
// ==/UserScript==

// Start here
console.log("Bob's coming.");

// 记录当前网页网址为undefined（当然需要是全局变量），使得后面刚打开网页也能认作是网址（标题）变化，需要检查点赞情况。
let webUrl;
// 页面全部加载完成后 就要运行一次检查等。
window.onload = () => {
  console.log("Bob detected Page fully loaded.");
  titleChangedCallback();
};

let videoUid, likedSelector, notLikedSelector, timerId;
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
const websiteSet = new Set([
  {
    regExp: new RegExp("^https://www.bilibili.com/video/(\\w+)\\b"),
    likedSelector: "span.like.on",
    notLikedSelector: "span.like",
  }, {
    regExp: new RegExp("^https://www.bilibili.com/bangumi/play/(\\w+)\\b"),
    likedSelector: "div.like-info.active",
    notLikedSelector: "div.like-info",
  }, {
    regExp: new RegExp("^https://www\\.youtube\\.com/watch\\?v=(\\w+)\\b"),
    likedSelector:
      "#info ytd-toggle-button-renderer:nth-child(1).style-default-active",
    notLikedSelector:
      "#info ytd-toggle-button-renderer:nth-child(1).style-text",
  }
]);

function titleChangedCallback() {
  // 发现了指定元素（这里还无需传入需要监控的元素）发生变化，将不会对监控元素本身做任何操作，而是检查网页url是否变化。
  const currentWebUrl = window.location.href;
  console.log('Title changed!!!!!!!', currentWebUrl, webUrl);
  if (currentWebUrl !== webUrl) {
    console.log(`发现网站网址变动，`)
    webUrl = currentWebUrl;
    // 判断当前页面是否是需要需要点赞的页面（这步操作暂时认为不应该在刚打开页面时操作，因为网页可能会任意跳转的缘故，所以这里采取 每次标题变动后 都需要重新检测网页归属。
    if (identifyWeb()) return;
    // 检查是这个视频是否已经处理过了，如果已经有成功的处理记录（即便显示为未点赞），需要跳过。
    if (localStorage.getItem("Bob_" + videoUid)) return;
    // 视频没有点赞，现在操作点赞。
    // 因为涉及到网页交互，有可能出现未能点赞成功的情况；为了容错，这里设置“循环”尝试点赞；在Promise中确认点赞成功后，将会退出这个循环的定时操作。
    // 这里有概率会出错，尤其是在切换网页的时候，报错为：Timer 'worker' already exists，虽然报错位置不在本脚本内，而且这个报错也会不定时出现，但总觉得有关联。/////////////////////////////////////
    console.log("在setInterval前");
    timerId = setInterval(makePromise, 3000);
    console.log("在setInterval后");
  }
}

function identifyWeb() {
  // get current website's URL which may change with the website.
  const currentUrl = window.location.href;

  for (let websiteObj of websiteSet) {
    const matchResult = currentUrl.match(websiteObj.regExp);
    if (matchResult) {
      // 如果发现视频编号发生变化（切换了视频），需要等一会儿再检查是否点赞，因为可能因为网页刷新延迟，将没有点赞的视频也识别为已经点赞。
      const currentVideoUid = matchResult[1];
      if (currentVideoUid !== videoUid) {
        console.log("Entered new video.")
        videoUid = matchResult[1];
      }
      ({ likedSelector, notLikedSelector } = websiteObj);
      return;
    }
  }
  // 如果Bob没有识别初该网站，则返回True，表示需要跳过。
  console.log("Bob fails to indentify this website.")
  return true;
}

function makePromise() {
  const promise = new Promise((resolve, reject) => {
    // 如果该视频页面显示已经点赞了，则直接跳过剩余操作。
    // 此时已完成记录中一定没有该视频，需要将该视频添加入内。
    if (document.querySelector(likedSelector)) resolve();
    // if not liked, then like it
    console.log("Haven't liked it yet. Let's like it.");
    // TODO:现在没有检查点赞按钮是否存在。
    document.querySelector(notLikedSelector).click();
    // 因为这里不想着急检查是否成功点赞了，所以设置了Timeout，等会儿在检查。实测中发现B站非常需要这样的等待。
    setTimeout(() => {
      document.querySelector(likedSelector) ? resolve() : reject();
    }, 1000);
  });

  promise
    // 如果检查了该视频已经被点赞了 或刚刚点赞成功了，就记录到localStorage，以后就可以跳过网页元素检查（只有第一次会有这种情况）。
    .then(() => {
      // 结束循环的定时操作。
      clearInterval(timerId);
      localStorage.setItem("Bob_" + videoUid, true);
      console.log("Bob has liked this video successfully.");
    })
    .catch(() => {
      console.log("It seems that Bob failed liking it. He will wait for the NEXT ROUND and try it again.");
    });
}