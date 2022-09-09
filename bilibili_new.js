// ==UserScript==
// @name        Like button hitter - Auto Thumb Up
// @namespace   OIJ.CC
// @match       https://www.bilibili.com/video/*
// @match       https://www.bilibili.com/bangumi/play/*
// 因为Youtube网站总是会在当前页面进行跳转，跳转页面后 ViolentMonkey不会根据新页面的网址重新启用对应脚本，所以这里要针对 从Youtube首页跳转到视频播放页面 的情况做适配。
// @match       https://www.youtube.com/*
// @match       https://www.youtube.com/watch?v=*
// @grant       none
// @version     1.0
// @author      One Good Bob
// @description 2022/8/27 15:28:35
// ==/UserScript==

(() => {
  // Start here
  console.log("Bob's coming.");

  /*
      需要区分以下三个站点，他们点赞的网页元素不尽相同，需要区分对待。
      B站视频的URL sample:https://www.bilibili.com/video/BV1uT4y1P7CX?spm_id_from=333.337
      B站番剧的URL sample:https://www.bilibili.com/bangumi/play/ep411772?from_spmid=666.25.episode.0
      Youtube URL sample:https://www.youtube.com/watch?v=dQw4w9WgXcQ
  */
  // 其实下面可以只是一个Array，至于为什么要转换为Set，有待解释。
  const websiteSet = new Set([{
    regExp: new RegExp("^https://www\\.bilibili\\.com/video/(\\w+)\\b"),  // B站普通视频。
    likedSelector: "span.like.on",
    notLikedSelector: "span.like",
  }, {
    regExp: new RegExp("^https://www\\.bilibili\\.com/bangumi/play/(\\w+)\\b"),   // B站番剧。
    likedSelector: "div.like-info.active",
    notLikedSelector: "div[class='like-info']",   // 这里就是要用这样特别的方法来定位class，如果写作div.like-info，则likedSelector也符合这个Selector，容错考虑。
  }, {
    regExp: new RegExp("^https://www\\.youtube\\.com/watch\\?v=([-\\w]{11})\\b"),   // Youtube普通视频。11个字符 允许使用的符号：az，AZ，0-9，-和_。注意：这其中包含\w所不包含的减号-。
    likedSelector: "#info ytd-toggle-button-renderer:nth-child(1).style-default-active",
    notLikedSelector: "#info ytd-toggle-button-renderer:nth-child(1).style-text",
  }]);


  // 记录当前网页Id为undefined（当然需要是全局变量），使得后面刚打开网页也能认作是网址（标题）变化，需要检查点赞情况。
  let likedSelector, notLikedSelector;
  let timerId, promiseLocker;

  class OperateLocalStorage {
    key = "Bob";

    constructor() { }

    retrieve() {
      // 每次查看和添加点赞记录都要重新从localStorage中获取最新的数据，因为localStorage是多个同域名标签页共用的、实时更新的，需要及时获取最新的情况进行操作。
      // 基本上就是因为 这个方法会在指定位置被复用，所以才创建的这个class。
      const json = localStorage.getItem(this.key);
      // 多次实验和查阅发现：JS基本不支持将map转换为json（实测中 Bilibili是支持的，但Youtube不支持，转换为的JSON为一个空的Object），所以我们直接用的一个Object。
      // 如果是浏览器第一次运行该脚本，或者使用隐私无痕模式，则需要应为从localStorage读取为null，进而转换为一个空对象的情况。
      return JSON.parse(json) ?? {};
    }

    hasRecord(videoId) {
      // 从localStorage中查看是否有该视频的操作记录。
      const recordsObj = this.retrieve()
      console.log(recordsObj);
      console.log(videoId in recordsObj);
      return videoId in recordsObj;
    }

    addRecord(videoId) {
      // 将本次点赞记录到localStorage中。
      const recordsObj = this.retrieve()
      recordsObj[videoId] = new Date();
      const json = JSON.stringify(recordsObj);
      console.log(recordsObj);
      console.log(videoId);
      console.log(json);
      localStorage.setItem(this.key, json);
      // console.log(localStorage.getItem(this.key));
    }

    // TODO：回收机制，不能让存储在localStorage数据太大。
  }
  const operateLocalStorage = new OperateLocalStorage();
  // 页面全部加载完成后 就要运行一次检查等。
  // 实测发现，只有bilibili video会在刚进入网页时 发生title的变化（虽然实际内容没有变，但会发生mutation），其他的网站则不会产生任何title变化事件，所以这里定义在网页加载完成后单独调用一次接口。
  // 实测发现，addEventlistener('DOMContentLoaded')不起作用。
  window.onload = () => {
    console.log("Bob detected Page fully loaded.");
    titleChangedCallback();
  };

  // 之后监控网页的title变化。
  const observer = new MutationObserver(titleChangedCallback);
  const titleElem = document.querySelector('title');
  const config = { childList: true, characterData: true };

  observer.observe(titleElem, config);






  function titleChangedCallback() {
    // 判断当前页面是否是需要需要点赞的页面（这步操作暂时认为不应该在刚打开页面时操作，因为网页可能会任意跳转的缘故，所以这里采取 每次标题变动后 都需要重新检测网页归属。
    // 发现了指定元素（这里无需传入需要监控的元素）发生变化。
    console.log('Title changed!!!!!!!');
    // 一旦网页（标题）发生了变动，便更新全局变量promiseLocker，以阻止在 后续不能及时停止的Promise中产生任何的结果（比如记录到localStorage中)。
    promiseLocker = true;
    // 开始尝试获取当前页面视频的Id，因为websiteSet中有准确的正则，理论上一定会拿到有效的视频Id，
    // 如果拿不到返回的是undefined，
    // 我们这里其实默认了，每次网页标题变化后，最多产生一次网址（视频ID）变化。
    const currentVideoId = indentifyWeb();
    if (currentVideoId) {
      console.log(`发生网页标题后，最新的视频ID为：${currentVideoId}`);

      // 只要当前有正在运行的点赞程序，都应该在立即停止当前的点赞程序后 重新审查当前视频并操作点赞；
      // 因为最新的（最后一次）的标题变化，意味着如果继续进行点赞操作，可能不会点赞那个程序正处理的那个视频。
      if (timerId) clearInterval(timerId);
      // 因为涉及到网页交互，有可能出现未能点赞成功、用户未登录的情况；
      // 为了容错，这里设置“循环”尝试点赞；如果在Promise中resolve()，将会结束这个循环的定时操作。
      // 实测，B站的ms必须在1秒以上。
      promiseLocker = false;
      timerId = setInterval(makePromise, 2000, currentVideoId);
    }

  }

  function indentifyWeb() {
    // 这个函数，不光可以拿到当前网页Id，还会修改全局变量likedSelector, notLikedSelector
    // TODO:直接设定和修改全局变量currentVideoId？？？？？？？？？？？？？？？？？？？？？？？？
    const currentWebUrl = window.location.href;
    for (let websiteObj of websiteSet) {
      const matchResult = currentWebUrl.match(websiteObj.regExp);
      if (matchResult) {
        console.log(`Bob got the video Id: ${matchResult[1]}`);
        ({ likedSelector, notLikedSelector } = websiteObj);
        return matchResult[1];
      }
    }
    // 如果Bob没有识别初该网站，则返回True，表示需要跳过。Youtube为了应对同页面的跳转问题，会经常（比如在首页）匹配不到，所以不会对Youtube做提示。
    if (document.domain !== "www.youtube.com") alert(`${currentWebUrl}\nBob fails to indentify this website.`);
    // return undefined;
  }

  function makePromise(currentVideoId) {
    /* 
    为什么要通过Promise的形式来审查并操作点赞？
    因为点赞涉及到网页交互，存在可能的延迟响应。
    具体表现为：点赞操作后，网页的点赞按钮可能并不会立刻改变到稳定的已点赞状态，需要故意设置延迟来确认是否点赞成功。
    这样延迟(setTimeout)的异步操作需要对应使用Promise。
    */

    // 这里使用Promise唯一的原因是 再点赞的操作后 二次检查前 有刻意添加的延时，需要保证在进行完点赞操作 1秒后再检查是否点赞成功。
    // 使用resolve和reject的最主要依据是，是否需要clearInterval()。
    const promise = new Promise((resolve, reject) => {
      // 到localStorage检查是这个视频是否已经处理过了，如果已经有成功的处理记录（即便显示为未点赞），需要跳过。
      // 每次执行该Promise时都要再次检查，因为localStorage是多个同域名标签页共用的、实时更新的（但网页本身按钮情况并不会实时更新），需要及时获取最新的情况进行操作。
      // 下面必须得return resolve()，其中return必不可少，否则Promise主线程还会继续。
      if (operateLocalStorage.hasRecord(currentVideoId)) return resolve("通过localStorage发现该视频已被操作，本次不再操作");
      // 如果该视频页面显示已经点赞了，则直接跳过剩余操作。
      // 此时localStorage中的已完成记录中一定没有该视频，需要在.then()中将该视频添加入内。
      console.log(`document.querySelector(likedSelector)的值是${document.querySelector(likedSelector)}`)
      if (document.querySelector(likedSelector)) return resolve("Bob had liked this video before.");
      // if not liked, then like it
      console.log(`Haven't liked it yet. Let's like it.\n${likedSelector}\n${notLikedSelector}\n${document.querySelector(likedSelector)}`);
      // 先检查点赞按钮是否存在，存在则点击，否则就reject；已知存在找不到点赞按钮的情况是：Youtube会员专享影片 如果被非会员打开，点赞按钮是灰色的，不能正确进行点赞。
      (notLikedElem = document.querySelector(notLikedSelector)) ? notLikedElem.click() : reject(new Error("未找到可以正确点击的点赞按钮。\n Cannot location the clickable thumbup button."));
      // 因为这里不想着急检查是否成功点赞了，所以设置了Timeout，等会儿在检查。实测中发现B站非常需要这样的等待。
      setTimeout(() => {
        document.querySelector(likedSelector) ? resolve("Bob has liked this video successfully.") : reject(new Error("It seems that Bob failed liking it. He will wait for the NEXT ROUND and try it again."));
      }, 1000);
    });

    promise
      // 这里finally的目的便是 采用或弃用上面Promise的结果，因为如果网页发生了变动，正在进行的Promise无法被即使终结。
      .finally(result => {
        if (promiseLocker) throw new Error("点赞程序锁已被锁上，此次点赞结果将不会被进一步处理。");
        // 如果没有被锁，则将结果传递到.then()。
        return result;
      })
      // 如果检查了该视频已经被点赞了 或刚刚点赞成功了，就记录到localStorage，以后就可以跳过网页元素检查（只有第一次会有这种情况）。
      .then(result => {
        // 结束循环点赞的定时操作，并将全局变量timerId清空为null。
        clearInterval(timerId);
        timerId = null;
        // 记录到localStorage。
        // localStorage.setItem("Bob_" + currentVideoId, true);
        operateLocalStorage.addRecord(currentVideoId);
        console.log(result);
      })
      .catch(error => {
        console.log(error);
      });
  }


})();