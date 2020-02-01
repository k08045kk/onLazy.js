/*! onLazy.js v1.7 | MIT License | https://github.com/k08045kk/onLazy.js/blob/master/LICENSE */
/**
 * onLazy.js
 * 遅延イベントリスナー
 * カスタムイベントとして「初回ユーザーイベント後に発火する」イベントを追加します。
 * loadイベント以降の初回ユーザーイベント後に発火します。
 * loadイベント以前にユーザーイベントが発火した場合、loadイベント時に発火します。
 * loadイベント時にドキュメント先頭にない場合も発火します。
 * イベントは、一度しか発生しません。
 * 注意：初回ユーザイベントより後に lazy は発火します。
 *       初回ユーザイベントは、取り逃す前提で処理してください。
 * 登録：window.addEventListener(&#039;lazy&#039;, func);
 * 対応：IE9+
 * @auther      toshi (https://github.com/k08045kk)
 * @version     1.7
 * @see         1 - 20190601 - add - 初版
 * @see         1.1 - 20200116 - update - FID対策として、setTimeoutでlazy処理を更に遅延
 * @see         1.2 - 20200117 - update - FID対策として、addEventListener()にoptionsを設定
 * @see         1.3 - 20200117 - update - イベント種類を変更、スクロール位置の取得方法変更
 * @see         1.4 - 20200117 - update - スクロール位置の取得方法変更
 * @see         1.5 - 20200123 - update - toolazyを追加
 * @see         1.6 - 20200124 - update - リファクタリング（loadイベント時も遅延させる）
 * @see         1.7 - 20200201 - update - リファクタリング
 */
(function(window, document) {
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
  // capture=true: 何故かfalseよりFID良い。理由は不明
  var options = {capture:true, once:true, passive:true};
  
  function dispatchLazyEvent(opt_type) {
    var type = opt_type != null ? opt_type: 'lazy';
    
    // 遅延処理呼び出し
    var evt;
    var data = void 0;
    try {
      evt = new CustomEvent(type, {detail:data});
    } catch (e) {
      // IE11-9
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, true, true, data);
    }
    window.dispatchEvent(evt);
    //console.log('lazy: dispatch');
  }
  
  function onLazy() {
    if (!fire) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      fire = true;
      //console.log('lazy: fire');
      for (var i=0, len=types.length; i<len; i++) {
        window.removeEventListener(types[i], onLazy, options);
      }
    }
    if (!lazy && load) {
      // 複数呼び出し回避
      lazy = true;
      //console.log('lazy: lazy');
      
      // 更に遅延する。FID対策
      window.setTimeout(dispatchLazyEvent, delay);
    }
  }
  
  // main
  for (var i=0, len=types.length; i<len; i++) {
    window.addEventListener(types[i], onLazy, options);
  }
  window.addEventListener('load', function() {
    load = true;
    //console.log('lazy: load');
    
    // 既に発火済み or ドキュメントの途中（更新時 or ページ内リンク）
    if (fire || window.pageYOffset) {
      //console.log('lazy: fire: '+fire);
      //console.log('lazy: scroll: '+window.pageYOffset);
      onLazy();
    }
    //console.log('lazy: loaded');
  }, options);
  window.addEventListener('unload', function() {
    if (!lazy) {
      // 遅延イベント不発時のイベント
      // unload時のイベントのため、確実に処理されるとは保証できない
      lazy = true;
      dispatchLazyEvent('toolazy');
      // 注意：toolazy を予告なく名称変更する可能性があります
    }
    //console.log('lazy: unload');
  }, options);
  //console.log('lazy: init');
  
})(window, document);
