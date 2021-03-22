/*! onLazy.js v4.0 | MIT License | github.com/k08045kk/onLazy.js/blob/master/LICENSE */
/**
 * @name        onLazy.js
 * @description カスタムイベントとして遅延イベントを追加します。
 *              遅延イベントは、次の3つです。
 *                1. lazy（初回ユーザイベント）
 *                2. lazyed（初回スクロールイベント）
 *                3. toolazy（初回ユーザイベント未発生時のページクローズイベント）
 *              遅延イベントは、初回ユーザイベント後に発火します。
 *              遅延イベントは、ページ表示時にドキュメント先頭でない場合、発火します。
 *              遅延イベントは、一度しか発火しません。
 *              注意：初回ユーザイベントより後に発火します。初回ユーザイベントは、取り逃します。
 *              注意：リスナー登録は、「DOMContentLoadedまで」または「onLazy.js実行前」に実施する。
 *                    DOMContentLoaded中に登録したDOMContentLoadedでの登録は、対象外。
 *              登録：window.addEventListener('lazy', func);
 *              対応：IE9+（addEventListener, createEvent, initCustomEvent, pageYOffset）
 * @auther      toshi (https://github.com/k08045kk)
 * @license     MIT License | https://github.com/k08045kk/onLazy.js/blob/master/LICENSE
 * @version     4.0
 * @since       1.0 - 20190601 - 初版
 * @since       2.0 - 20200408 - v2
 * @since       2.1 - 20200408 - lazyイベントをDOMContentLoaded以降に発生するように仕様変更
 * @since       2.2 - 20200408 - スクロール不可時、lazyでlazyedイベントを合わせて実施する
 * @since       2.3 - 20200409 - 各種イベントを解除する
 * @since       2.4 - 20200409 - fix constが使用されている
 * @since       2.5 - 20200410 - fix lazyedが暴発することがある
 * @since       2.6 - 20200410 - リファクタリング
 * @since       2.7 - 20200719 - リファクタリング
 * @since       2.8 - 20201222 - リロード以外をハッシュで簡易判定する
 * @since       2.8 - 20201222 - window.onEventを廃止
 * @since       2.8 - 20201222 - unloadをpagehideに変更（Lighthouse指摘対応）
 * @since       2.9 - 20201228 - scrollリスナーを1個に統合
 * @since       3.0 - 20210108 - イベント発動をsetTimeoutで遅延する
 * @since       3.1 - 20210203 - requestAnimationFrameを導入
 * @since       3.2 - 20210208 - fix グローバル変数のチェック漏れ
 * @since       3.3 - 20210209 - requestAnimationFrameを導入2
 * @since       3.4 - 20210318 - requestAnimationFrameを導入3
 * @since       3.5 - 20210320 - fix Firefoxでユーザ操作なしでfocusを取得する
 * @since       3.6 - 20210320 - is変数を使用しない
 * @since       4.0 - 20210322 - キャッシュ方式を採用
 * @see         https://github.com/k08045kk/onLazy.js
 */
(function(window, document) {
  
  // イベント種類
  // 想定初回イベント: despktop:mousedown/mousemove/scroll, mobile:touchstart/scroll
  var types = ['click','mousedown','keydown','touchstart','mousemove'];
  // バブリングフェーズ、1回のみ、中断なし
  var option = {capture:false, once:true, passive:true};
  
  var add = addEventListener;
  var remove = removeEventListener;
  
  // onLazyの登録と解除
  var eachEventListener = function(callback) {
    for (var i=types.length; i--; ) {
      callback(types[i], onLazy, option);
    }
  };
  
  // カスタムイベントの発火
  var dispatchCustomEvent = function(type) {
    var evt;
    var data = void 0;
    try {
      // バブルアップなし、キャンセル不可
      evt = new CustomEvent(type, {bubbles:false, cancelable:false, detail:data});
    } catch (e) {
      // IE9-11
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, false, false, data);
    }
    try {
      dispatchEvent(evt);
    } catch (e) {}
    //console.log('lazy: dispatch');
  };
  
  // 初回ユーザイベント未発生時のページクローズイベント
  var onTooLazy = function() {
    if (onTooLazy && onLazy) {
      onTooLazy = 0;
      dispatchCustomEvent('toolazy');
    }
    //console.log('lazy: unload');
  };
  
  // カスタムイベントの遅延発火
  var cache = [];
  var lazyDispatchCustomEvent = function(type) {
    if (onLoad) {
      cache.unshift(type);
    } else if (onTooLazy) {
      setTimeout(function() {
        dispatchCustomEvent(type);
        
        if (onLazyed && innerHeight == document.documentElement.scrollHeight) {
          // ページが画面内に完全に収まっている時（スクロールイベントが発生しない時）
          onLazyed();
        }
      }, 0);
    }
    // 前提：lazy, lazyed から各一回のみ呼び出される
    // 前提：lazy → lazyed の順で呼び出される
  };
  
  // 初回スクロールイベント
  var onLazyed = function() {
    if (onLazyed) {
      remove('scroll', onLazyed, option);
      onLazyed = 0;
      //console.log('lazy: lazyed');
      
      onLazy && onLazy();
      lazyDispatchCustomEvent('lazyed');
      // 補足：（scroll登録の関係上）既にonLoadedは完了している
    }
  };
  
  // 初回ユーザイベント
  var onLazy = function() {
    if (onLazy) {
      eachEventListener(remove);
      onLazy = 0;
      //console.log('lazy: lazy');
      
      lazyDispatchCustomEvent('lazy');
    }
  };
  
  // ページ読込み完了イベント
  var onLoaded = function(zero) {
    if (onLoaded && onLazyed) {
      onLoaded = 0;
      if (zero === 0 || !pageYOffset) {
        add('scroll', onLazyed, option);
      } else {
        onLazyed();
      }
      //console.log('lazy: loaded');
    }
  };
  
  // ページ読込みイベント（DOMContentLoaded以降）
  var onLoad = function() {
    if (onLoad) {
      onLoad = 0;
      //console.log('lazy: load');
      
      // 既にキャッシュ済みのイベントを発火する
      for (var i=cache.length; i--; ) {
        lazyDispatchCustomEvent(cache[i]);
      }
      
      if (onLoaded) {
        // ドキュメントの途中（リロード or 履歴 or 戻る or ページ内リンク）
        var performance = window.performance;
        var requestAnimationFrame = window.requestAnimationFrame;
        if (performance && !performance.navigation.type && !location.hash) {
          // 通常表示であれば、ハッシュだけで判定する
          onLoaded(0);
        } else if (requestAnimationFrame && document.readyState !== 'complete') {
          // 強制レイアウト（pageYOffset）の問題がないタイミングまで待機する
          requestAnimationFrame(onLoaded);
          // 非表示の場合、requestAnimationFrameが発生しないため、最悪loadイベントで強制起動する
          add('load', onLoaded, option);
        } else {
          // requestAnimationFrame非対応（IE9） or loadイベント後
          onLoaded();
        }
      }
    }
  };
  
  // main
  add('pagehide', onTooLazy, option);
  eachEventListener(add);
  if (document.readyState === 'loading') {
    // DOMContentLoadedイベント前
    if (!document.body) {
      // bodyなしならば、初回スクロール前と判断する
      // 補足：初回スクロールは、最短でDOMContentLoaded前に発生する
      onLoaded = 0;
      add('scroll', onLazyed, option);
    }
    add('DOMContentLoaded', function() {
      // イベント登録をバブリングフェーズのできる限り最後まで受け付ける
      add('DOMContentLoaded', onLoad, false);
    }, true);
  } else {
    // DOMContentLoadedイベント後（正確には、DOMContentLoadedより前である可能性がある）
    // interactiveは、DOMContentLoaded前のドキュメント解析完了後のスクリプトより前に設定される
    // interactiveは、defer属性のスクリプト実行前に設定される
    // DOMContentLoadedイベントは、defer属性のスクリプト実行後に実行される
    onLoad();
  }
  //console.log('lazy: init');
  
  // 補足：DOMContentLoaded, load, pagehide イベントは、解除しない（コード量削減のため）
  //       複数回呼び出しイベントでないため、解除なしで問題ないと考える（ただし、動作ロックはする）
})(window, document);
