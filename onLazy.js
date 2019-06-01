/**
 * onLazy.js
 * 遅延処理
 * カスタムイベントとして「初回ユーザーイベント時に発火する」イベントを追加します。
 * loadイベント以降の初回ユーザーイベントで発火します。
 * loadイベント以前にユーザーイベントが発火した場合、loadイベント時に発火します。
 * loadイベント時にドキュメント先頭にない場合も発火します。
 * イベントは、一度しか発生しません。
 * 登録：window.addEventListener('lazy', func);
 * 対応：IE9+
 * @auther      toshi(https://www.bugbugnow.net/p/profile.html)
 * @license     MIT License
 * @see         https://opensource.org/licenses/MIT
 * @version     1
 * @see         1 - add - 初版
 */
(function(win, doc) {
  'use strict';
  
  var lazy = false;
  var load = false;
  var fire = false;
  // scrollは保険。wheel/touchstartでスクロールを検出可能。
  // keyupは保険。キー押下中にページ遷移するとkeydownを検出せずに、keyupのみ検出する。
  // mouseoverで、mosedown/mousemoveを検出する。
  var types = ['wheel','keydown','keyup','mouseover','touchstart','scroll'];
  
  function onLazy(event) {
    if (fire === false) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      fire = true;
      //console.log('lazy: fire');
      for (var i=0; i<types.length; i++) {
        win.removeEventListener(types[i], onLazy);
      }
    }
    if (lazy === false && load === true) {
      // 複数呼び出し回避
      lazy = true;
      //console.log('lazy: lazy');
      
      // 遅延処理呼び出し
      var evt;
      var data = void 0;
      try {
        evt = new CustomEvent('lazy', {detail: data});
      } catch (e) {
        // IE11-9
        evt = doc.createEvent('CustomEvent');
        evt.initCustomEvent('lazy', true, true, data);
      }
      win.dispatchEvent(evt);
      //console.log('lazy: dispatch');
    }
  }
  
  for (var i=0; i<types.length; i++) {
    win.addEventListener(types[i], onLazy);
  }
  win.addEventListener('load', function(event) {
    // 既に着火済み or ドキュメントの途中（更新時 or ページ内リンク）
    load = true;
    //console.log('lazy: load');
    if (fire === true || doc.documentElement.scrollTop != 0 || doc.body.scrollTop != 0) {
      //console.log('lazy: fire: '+fire);
      //console.log('lazy: scroll: '+doc.documentElement.scrollTop);
      //console.log('lazy: scroll: '+doc.body.scrollTop);
      onLazy(event);
    }
    //console.log('lazy: loaded');
  });
  //console.log('lazy: init');
})(window, document);
