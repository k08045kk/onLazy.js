/*! onLazy.js v3.2 | MIT License | https://github.com/k08045kk/onLazy.js/blob/master/LICENSE */
/**
 * onLazy.js
 * カスタムイベントとして遅延イベントを追加します。
 * 遅延イベントは、次の3つです。
 *   lazy（初回ユーザイベント）
 *   lazyed（初回スクロールイベント）
 *   toolazy（初回ユーザイベント未発生時のページクローズイベント）
 * 遅延イベントは、初回ユーザイベント後に発火します。
 * 遅延イベントは、ページ表示時にドキュメント先頭でない場合も、発火します。
 * 遅延イベントは、一度しか発火しません。
 * 注意：初回ユーザイベントより後に発火します。初回ユーザイベントは、取り逃します。
 * 注意：リスナー登録は、「DOMContentLoadedより前」または、「onLazy.js実行より前」に実施して下さい。
 * 登録：例：window.addEventListener('lazy', func);
 * 対応：IE9+（addEventListener, createEvent, initCustomEvent, pageYOffset）
 * @auther      toshi (https://github.com/k08045kk)
 * @license     MIT License
 * @see         https://github.com/k08045kk/onLazy.js/blob/master/LICENSE
 * @version     3.2
 * @note        1.0 - 20190601 - 初版
 * @note        2.0 - 20200408 - v2.0
 * @note        2.1 - 20200408 - lazyイベントをDOMContentLoaded以降に発生するように仕様変更
 * @note        2.2 - 20200408 - スクロール不可時、lazyでlazyedイベントを合わせて実施する
 * @note        2.3 - 20200409 - 各種イベントを解除する
 * @note        2.4 - 20200409 - fix constが使用されている
 * @note        2.5 - 20200410 - fix lazyedが暴発することがある
 * @note        2.6 - 20200410 - リファクタリング
 * @note        2.7 - 20200719 - リファクタリング
 * @note        2.8 - 20201222 - リロード以外をハッシュで簡易判定する
 * @note        2.8 - 20201222 - window.onEventを廃止
 * @note        2.8 - 20201222 - unloadをpagehideに変更（Lighthouse指摘対応）
 * @note        2.9 - 20201228 - scrollリスナーを1個に統合
 * @note        3.0 - 20210108 - イベント発動をsetTimeoutで遅延する+他
 * @note        3.1 - 20210203 - requestAnimationFrameを導入
 * @note        3.2 - 20210208 - fix グローバル変数のチェック漏れ
 * @see         https://github.com/k08045kk/onLazy.js
 */
(function(window, document) {
  'use strict';
  
  var isFire, isLoad, isLoaded, isLazy, isLazyed;
  // イベント種類
  // 想定初回イベント: despktop:mousedown/mousemove/focus/scroll, mobile:touchstart/focus/scroll
  var types = ['click','mousedown','keydown','touchstart','mousemove','focus'];
  // バブリングフェーズ、1回のみ、中断なし
  var option = {capture:false, once:true, passive:true};
  
  var add = addEventListener;
  var remove = removeEventListener;
  
  // onLazyの登録と解除
  var eachEventListener = function(callback) {
    for (var i=0, len=types.length; i<len; i++) {
      callback(types[i], onLazy, option);
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
    if (!isLazy) {
      // 遅延イベント不発時のイベント
      // unloadイベントのため、確実に処理されるとは保証できない
      isLazy = true;
      dispatchCustomEvent('toolazy');
    }
    //console.log('lazy: unload');
  };
  
  // 初回スクロールイベント
  var onLazyed = function() {
    if (!isLazyed) {
      isLazyed = true;
      remove('scroll', onLazyed, option);
      !isLazy && onLazy();
      //console.log('lazy: lazyed');
      
      setTimeout(function() {
        dispatchCustomEvent('lazyed');
      }, 0);
    }
  };
  
  // 初回ユーザイベント
  var onLazy = function() {
    if (!isFire) {
      // 初回イベントでリスナー解除（load前の複数回呼び出しを回避）
      // load前：loadで遅延処理実行
      // load後：このまま遅延処理実行
      isFire = true;
      eachEventListener(remove);
      //console.log('lazy: fire');
    }
    if (!isLazy && isLoad) {
      // 複数呼び出し回避
      isLazy = true;
      //console.log('lazy: lazy');
      
      setTimeout(function() {
        dispatchCustomEvent('lazy');
        remove('pagehide', onUnload, option);
        if (!isLazyed && innerHeight == document.documentElement.scrollHeight) {
          // ページが画面内に完全に収まっている時（スクロールイベントが発生しない時）
          onLazyed();
        }
      }, 0);
    }
  };
  
  // ページ読込み完了イベント
  var onLoaded = function(y) {
    if (!isLoaded) {
      isLoaded = true;
      if (y) {
        onLazyed();
      } else {
        add('scroll', onLazyed, option);
      }
      //console.log('lazy: loaded');
    }
  };
  
  // ページ読込みイベント（DOMContentLoaded以降）
  var onLoad = function() {
    if (!isLoad) {
      isLoad = true;
      //console.log('lazy: load');
      
      // 発火済み
      if (isFire) {
        onLazy();
      }
      
      // ドキュメントの途中（リロード or 履歴 or ページ内リンク）
      if (window.performance && !performance.navigation.type && !location.hash) {
        // 通常表示であれば、ハッシュだけで判定する
        onLoaded(0);
      } else if (window.requestAnimationFrame) {
        // 強制レイアウト（pageYOffset）の問題がないタイミング（requestAnimationFrame）まで待機する
        requestAnimationFrame(function() { onLoaded(pageYOffset); });
        if (document.readyState !== 'complete') {
          // 非表示の時、requestAnimationFrameが発生しないため、最悪loadイベントで強制起動する
          add('load', function() { onLoaded(pageYOffset); }, option);
        }
      } else {
        // requestAnimationFrame非対応用（IE9）
        onLoaded(pageYOffset);
      }
    }
  };
  
  // main
  add('pagehide', onUnload, option);
  eachEventListener(add);
  if (document.readyState === 'loading') {
    // DOMContentLoadedイベント開始前
    add('DOMContentLoaded', onLoad, option);
  } else {
    // DOMContentLoadedイベント開始後（正確には、DOMContentLoadedより前である可能性がある）
    // interactiveは、DOMContentLoaded前のドキュメント解析完了後のスクリプトより前に設定される
    // interactiveは、defer属性のスクリプト実行前に設定される
    // DOMContentLoadedイベントは、defer属性のスクリプト実行後に実行される
    onLoad();
  }
  //console.log('lazy: init');
  
})(window, document);
