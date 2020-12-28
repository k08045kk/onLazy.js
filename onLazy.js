/*! onLazy.js v2.8 | MIT License | https://github.com/k08045kk/onLazy.js/blob/master/LICENSE */
/**
 * onLazy.js
 * カスタムイベントとして遅延イベントを追加します。
 * 遅延イベントは、次の3つです。
 * lazy（初回ユーザイベント）
 * lazyed（初回スクロールイベント）
 * toolazy（初回ユーザイベント未発生時、unloadイベント）
 * 遅延イベントは、DOMContentLoadedイベント以降の初回ユーザイベント後に発火します。
 * 遅延イベントは、DOMContentLoadedイベント以前にユーザイベントが発火した場合、
 * DOMContentLoadedイベント時に発火します。
 * 遅延イベントは、DOMContentLoadedイベント時にドキュメント先頭でない場合も発火します。
 * 遅延イベントは、一度しか発生しません。
 * 注意：初回ユーザイベントより後に発火します。初回ユーザイベントは、取り逃す前提で処理してください。
 * 注意：イベント登録は、「DOMContentLoadedイベントより前」「onLazy.js実行より前」に実施して下さい。
 * 注意：toolazyは、unloadイベント中に発生します。そのため、unloadイベントの制約が有効になります。
 * 登録：window.addEventListener('lazy', func); // 初回ユーザイベント
 * 登録：window.addEventListener('lazyed', func); // 初回スクロールイベント
 * 登録：window.addEventListener('toolazy', func);  // 初回ユーザイベント未発生時のunloadイベント
 * 対応：IE9+ (addEventListener, createEvent, initCustomEvent, pageYOffset)
 * @auther      toshi (https://github.com/k08045kk)
 * @version     2.8
 * @see         1 - 20190601 - 初版
 * @see         2 - 20200408 - v2.0
 * @see         2.1 - 20200408 - update - lazyイベントをDOMContentLoaded以降に発生するように仕様変更
 * @see         2.2 - 20200408 - update - スクロール不可時、lazyでlazyedイベントを合わせて実施する
 * @see         2.3 - 20200409 - update - 各種イベントを解除する
 * @see         2.4 - 20200409 - fix - constが使用されている
 * @see         2.5 - 20200410 - fix - lazyedが暴発することがある
 * @see         2.6 - 20200410 - update - リファクタリング
 * @see         2.7 - 20200719 - update - リファクタリング
 * @see         2.8 - 20201222 - update - リロード以外をハッシュで簡易判定する
 * @see         2.8 - 20201222 - update - window.onEventを廃止
 * @see         2.8 - 20201222 - update - unloadをpagehideに変更（Lighthouse指摘対応）
 */
(function(document) {
  'use strict';
  
  var lazy = false;
  var load = false;
  var fire = false;
  var lazyed = false;
  // イベント種類
  // lazyイベントは、より早く発火することが望ましいが、FIDに悪影響を与えるべきではない。
  // そのため、mouseover/pointeroverではなく、mousedown/mousemove/pointerdown/pointermoveとする。
  // 想定初回イベント: PC:mousedown/mousemove/focus/scroll, SP:touchstart(scroll)
  var types = ['click','mousedown','keydown','touchstart','pointerdown','mousemove','pointermove','focus','scroll'];
  // バブリングフェーズ、1回のみ、中断なし
  var options = {capture:false, once:true, passive:true};
  
  var add = addEventListener;
  var remove = removeEventListener;
  
  // onLazyの登録と解除
  var eachEventListener = function(callback) {
    for (var i=0, len=types.length; i<len; i++) {
      callback(types[i], onLazy, options);
    }
  };
  
  // カスタムイベントの発信
  var dispatchCustomEvent = function(type) {
    var evt;
    var data = void 0;
    try {
      // バブルアップなし、キャンセル不可
      evt = new CustomEvent(type, {bubbles:false, cancelable:false, detail:data});
    } catch (e) {
      // IE11-9
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, false, false, data);
    }
    try {
      dispatchEvent(evt);
    } catch (e) {}
    //console.log('lazy: dispatch');
  };
  
  // ページ開放イベント
  var onUnload = function() {
    if (!lazy) {
      // 遅延イベント不発時のイベント
      // unloadイベントのため、確実に処理されるとは保証できない
      lazy = true;
      dispatchCustomEvent('toolazy');
    }
    //console.log('lazy: unload');
  };
  
  // 初回スクロールイベント
  var onLazyed = function() {
    remove('scroll', onLazyed, options);
    if (!lazyed) {
      lazyed = true;
      onLazy();
      setTimeout(function() {
        dispatchCustomEvent('lazyed');
      }, 0);
    }
  };
  
  // 初回ユーザイベント
  var onLazy = function() {
    if (!fire) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      fire = true;
      //console.log('lazy: fire');
      
      eachEventListener(remove);
    }
    if (!lazy && load) {
      // 複数呼び出し回避
      lazy = true;
      //console.log('lazy: lazy');
      
      dispatchCustomEvent('lazy');
      remove('pagehide', onUnload);
      if (innerHeight == document.documentElement.scrollHeight) {
        // ページが画面内に完全に収まっている時（スクロールイベントが発生しない時）
        onLazyed();
      }
    }
  };
  
  // ページ読込み完了イベント（DOMContentLoaded以降）
  var onLoad = function() {
    remove('DOMContentLoaded', onLoad);
    if (!load) {
      load = true;
      //console.log('lazy: load');
      
      // 既に発火済み or ドキュメントの途中（更新時 or ページ内リンク時）
      // リロード（or未定義）以外であれば、ハッシュだけで判定する
      var type = performance.navigation.type;
      var y = !((type == 0 || type == 2) && location.hash == '') && pageYOffset;
      if (fire || y) {
        //console.log('lazy: fire: '+fire);
        //console.log('lazy: scroll: '+pageYOffset);
        onLazy();
      }
      if (y) {
        // loadイベント前にスクロールイベントが発生した場合、ページ先頭にいない前提
        // 補足：次のパータンの時、初回スクロールイベントを取り逃す
        //       スクロールイベントがloadイベント前に発生する && loadイベント時にページ先頭にいる
        onLazyed();
      } else {
        add('scroll', onLazyed, options);
      }
      //console.log('lazy: loaded');
    }
  };
  
  // main
  eachEventListener(add);
  if (document.readyState == 'loading') {
    // DOMContentLoadedイベント開始前
    add('DOMContentLoaded', onLoad);
  } else {
    // DOMContentLoadedイベント開始後（正確には、DOMContentLoadedより前である可能性がある）
    // interactiveは、DOMContentLoaded前のドキュメント解析完了後のスクリプトより前に設定される
    // interactiveは、defer属性のスクリプト実行前に設定される
    // DOMContentLoadedイベントは、defer属性のスクリプト実行後に実行される
    onLoad();
  }
  add('pagehide', onUnload);
  //console.log('lazy: init');
  
})(document);
