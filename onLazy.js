/*! onLazy.js v1.3 | MIT License | github.com/k08045kk/onLazy.js */
/**
 * onLazy.js
 * 遅延イベントリスナー
 * カスタムイベントとして「初回ユーザーイベント時に発火する」イベントを追加します。
 * loadイベント以降の初回ユーザーイベントで発火します。
 * loadイベント以前にユーザーイベントが発火した場合、loadイベント時に発火します。
 * loadイベント時にドキュメント先頭にない場合も発火します。
 * イベントは、一度しか発生しません。
 * 注意：初回ユーザイベントより後に lazy は発火します。
 *       初回ユーザイベント時に必須の処理は、lazy で処理しないでください。
 * 登録：window.addEventListener('lazy', func);
 * 対応：IE9+
 * @auther      toshi(https://www.bugbugnow.net/p/profile.html)
 * @version     1.3
 * @see         1 - 20190601 - add - 初版
 * @see         1.1 - 20200116 - update - FID対策として、setTimeoutでlazy処理を更に遅延
 * @see         1.2 - 20200117 - update - FID対策として、addEventListener()にoptionsを設定
 * @see         1.3 - 20200117 - update - イベント種類を変更、スクロール位置の取得方法変更
 */
(function(win, doc) {
  'use strict';
  
  var delay = 10;
  var lazy = false;
  var load = false;
  var fire = false;
  // click: 保険。mouseover/touchstart でスクロールを検出可能
  // scroll: 保険。wheel/touchstart でスクロールを検出可能
  // mouseover: mosedown/mousemove を検出
  // 想定初回イベント: PC:mousemove(mouseover), SP:scroll(touchstart)
  // 補足：PC環境では初回表示領域が大きいため、スクロールより早くしたい。なので、マウス移動を検出する
  var types = ['click','mouseover','keydown','touchstart','pointerover','wheel','scroll'];
  var options = {capture:true, once:true, passive:true};
  
  function dispatchLazyEvent() {
    // 遅延処理呼び出し
    var evt;
    var data = void 0;
    try {
      evt = new CustomEvent('lazy', {detail:data});
    } catch (e) {
      // IE11-9
      evt = doc.createEvent('CustomEvent');
      evt.initCustomEvent('lazy', true, true, data);
    }
    win.dispatchEvent(evt);
    //console.log('lazy: dispatch');
  }
  
  function onLazy(event, isLoad) {
    if (fire === false) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      fire = true;
      //console.log('lazy: fire');
      for (var i=0, len=types.length; i<len; i++) {
        win.removeEventListener(types[i], onLazy, options);
      }
    }
    if (lazy === false && load === true) {
      // 複数呼び出し回避
      lazy = true;
      //console.log('lazy: lazy');
      
      if (isLoad === true) {
        dispatchLazyEvent();
      } else {
        // 更に遅延する。FID対策
        win.setTimeout(dispatchLazyEvent, delay);
      }
    }
  }
  
  for (var i=0, len=types.length; i<len; i++) {
    win.addEventListener(types[i], onLazy, options);
  }
  win.addEventListener('load', function(event) {
    // 既に着火済み or ドキュメントの途中（更新時 or ページ内リンク）
    load = true;
    //console.log('lazy: load');
    
    var y =  win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    if (fire === true || y != 0) {
      //console.log('lazy: fire: '+fire);
      //console.log('lazy: scroll: '+y);
      onLazy(event, true);
    }
    //console.log('lazy: loaded');
  }, options);
  //console.log('lazy: init');
})(window, document);
