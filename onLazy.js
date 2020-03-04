/*! onLazy.js v1.9 | MIT License | https://github.com/k08045kk/onLazy.js/blob/master/LICENSE */
/**
 * onLazy.js
 * カスタムイベントとして遅延イベントを追加します。
 * 遅延イベントは、次の3つです。
 * lazy（初回ユーザイベント）
 * lazyed（初回スクロールイベント）
 * toolazy（初回ユーザイベント未発生時のunloadイベント）
 * 遅延イベントは、loadイベント以降の初回ユーザイベント後に発火します。
 * 遅延イベントは、loadイベント以前にユーザイベントが発火した場合、loadイベント時に発火します。
 * 遅延イベントは、loadイベント時にドキュメント先頭でない場合も発火します。
 * 遅延イベントは、一度しか発生しません。
 * 注意：初回ユーザイベントより後に発火します。初回ユーザイベントは、取り逃す前提で処理してください。
 * 注意：イベント登録は、「load イベントより前」または「onLazy.js実行より前」に実施して下さい。
 * 注意：toolazyは、unloadイベント中に発生します。そのため、unloadイベントの制約が有効になります。
 * 登録：window.addEventListener('lazy', func); // 初回ユーザイベント
 * 登録：window.addEventListener('lazyed', func); // 初回スクロールイベント
 * 登録：window.addEventListener('toolazy', func);  // 初回ユーザイベント未発生時のunloadイベント
 * 対応：IE9+ (addEventListener, createEvent, initCustomEvent, pageYOffset)
 * @auther      toshi (https://github.com/k08045kk)
 * @version     1.9
 * @see         1 - 20190601 - add - 初版
 * @see         1.1 - 20200116 - update - FID対策として、setTimeoutでlazy処理を更に遅延
 * @see         1.2 - 20200117 - update - FID対策として、addEventListener()にoptionsを設定
 * @see         1.3 - 20200117 - update - イベント種類を変更、スクロール位置の取得方法変更
 * @see         1.4 - 20200117 - update - スクロール位置の取得方法変更
 * @see         1.5 - 20200123 - update - toolazyを追加
 * @see         1.6 - 20200124 - update - リファクタリング（loadイベント時も遅延させる）
 * @see         1.7 - 20200201 - update - リファクタリング
 * @see         1.8 - 20200209 - update - FID対策として、バブリングフェーズまで待機するように変更
 * @see         1.8 - 20200215 - update - FID対策として、イベント種別変更（over -> down, move）
 * @see         1.8 - 20200215 - update - lazyイベントをバブリングなし・キャンセル不可とする
 * @see         1.8 - 20200215 - update - setTimeoutでのlazy処理を削除
 * @see         1.9 - 20200301 - update - lazyedイベントを追加（初回スクロールイベント）
 * @see         1.9 - 20200302 - update - onlazy, onlazyed, ontoolazyを追加
 * @see         1.9 - 20200302 - update - lazyの検出イベントにfocusを追加
 */
(function(window, document) {
  'use strict';
  
  var lazy = false;
  var load = false;
  var fire = false;
  // イベント種類
  // lazyイベントは、より早く発火することが望ましいが、FIDに悪影響を与えるべきではない。
  // そのため、mouseover/pointeroverではなく、mosedown/mousemove/pointerdown/pointermoveとする。
  // 想定初回イベント: PC:mousedown/mousemove/focus/scroll, SP:touchstart(scroll)
  var types = ['click','mousedown','keydown','touchstart','pointerdown','mousemove','pointermove','focus','scroll'];
  // バブリングフェーズ、1回のみ、中断なし
  var options = {capture:false, once:true, passive:true};
  
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
      evt = new CustomEvent(type, {detail:data, bubbles:false, cancelable:false});
    } catch (e) {
      // IE11-9
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, false, false, data);
    }
    try {
      const onevent = window['on'+type];
      if (onevent) { onevent(evt); }
    } catch (e) {}
    try {
      dispatchEvent(evt);
    } catch (e) {}
    //console.log('lazy: dispatch');
  };
  
  // 初回ユーザイベント
  var onLazy = function() {
    if (!fire) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      fire = true;
      //console.log('lazy: fire');
      
      eachEventListener(removeEventListener);
    }
    if (!lazy && load) {
      // 複数呼び出し回避
      lazy = true;
      //console.log('lazy: lazy');
      
      dispatchCustomEvent('lazy');
    }
  };
  
  // ページ読込み完了イベント
  var onLoad = function() {
    load = true;
    //console.log('lazy: load');
    
    // 既に発火済み or ドキュメントの途中（更新時 or ページ内リンク時）
    if (fire || pageYOffset) {
      //console.log('lazy: fire: '+fire);
      //console.log('lazy: scroll: '+pageYOffset);
      onLazy();
    }
    // 初回スクロールイベント
    if (pageYOffset) {
      // loadイベント前にスクロールイベントが発生した場合、ページ先頭にいない前提
      // 補足：次のパータンの時、初回スクロールイベントを取り逃します
      //       スクロールイベントがloadイベント前に発生する && loadイベント時にページ先頭にいる
      dispatchCustomEvent('lazyed');
    } else {
      var onLazyed = function() {
        removeEventListener('scroll', onLazyed, options);
        dispatchCustomEvent('lazyed');
      };
      addEventListener('scroll', onLazyed, options);
    }
    //console.log('lazy: loaded');
  };
  
  // ページ開放イベント
  var onUnload = function() {
    if (!lazy) {
      // 遅延イベント不発時のイベント
      // unload時のイベントのため、確実に処理されるとは保証できない
      lazy = true;
      dispatchCustomEvent('toolazy');
      // 注意：toolazy を予告なく名称変更する可能性があります
    }
    //console.log('lazy: unload');
  };
  
  // main
  eachEventListener(addEventListener);
  if (document.readyState != 'complete') {
    // loadイベント開始前
    addEventListener('load', onLoad);
  } else {
    // loadイベント開始後
    onLoad();
  }
  addEventListener('unload', onUnload);
  //console.log('lazy: init');
  
})(window, document);
