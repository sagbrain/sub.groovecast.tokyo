/**
 * GrooveCast product page detail renderer.
 *
 * The 商品情報 spreadsheet is the single source of truth. BASE's 商品詳細を
 * カスタマイズ App content cannot be read or written through the BASE API, so
 * links pasted there by hand go stale (or 404) with no way to fix them in code.
 * This script reconciles the rendered item page against the sheet-derived
 * products_detail.json:
 *
 *   1. YouTube links inside handmade content are repointed at the sheet's 音源URL
 *   2. sheet links the page does not already show are appended as a links section
 *   3. items with no handmade content get the full auto-rendered detail
 *
 * The BASE theme loads this from sub.groovecast.tokyo so that logic changes ship
 * with a git push instead of a theme paste.
 */
(function () {
    'use strict';

    var DATA_URL = 'https://sub.groovecast.tokyo/data/products_detail.json';
    var CUSTOM_BLOCK = '.shop-item-text:not(.purchase-flow):not(.product-detail-auto)';
    var YOUTUBE_URL = /^https?:\/\/(?:[\w-]+\.)*(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\//i;
    // The theme CSS zeroes <p> margins, so space the sections inline.
    var P = '<p style="margin:1.6em 0 0;">';

    function itemIdFromPath() {
        var m = location.pathname.match(/items\/(\d+)/);
        return m ? m[1] : null;
    }

    function esc(text) {
        var span = document.createElement('span');
        span.textContent = text || '';
        return span.innerHTML;
    }

    function nl2br(text) {
        return esc(text).replace(/\n/g, '<br>');
    }

    function handmadeBlocks() {
        var found = [];
        var blocks = document.querySelectorAll(CUSTOM_BLOCK);
        for (var i = 0; i < blocks.length; i++) {
            // The customize App renders an empty block (hidden input only) for
            // items without handmade content — count only blocks with real text.
            if (blocks[i].textContent.trim().length > 0) {
                found.push(blocks[i]);
            }
        }
        return found;
    }

    /**
     * Repoint handmade YouTube links at the sheet, and report which URLs the
     * page already shows so the links section below does not duplicate them.
     */
    function reconcileLinks(blocks, detail) {
        var shown = {};
        for (var i = 0; i < blocks.length; i++) {
            var anchors = blocks[i].getElementsByTagName('a');
            for (var j = 0; j < anchors.length; j++) {
                var anchor = anchors[j];
                if (!YOUTUBE_URL.test(anchor.getAttribute('href') || '')) {
                    continue;
                }
                if (detail.audio_url) {
                    // The admin pastes the bare URL as the link text as well, so
                    // the visible text has to move with the href.
                    if (YOUTUBE_URL.test(anchor.textContent.trim())) {
                        anchor.textContent = detail.audio_url;
                    }
                    anchor.setAttribute('href', detail.audio_url);
                }
                shown[anchor.getAttribute('href')] = true;
            }
        }
        return shown;
    }

    function linksHtml(detail, shown) {
        var parts = [];
        if (detail.audio_url && !shown[detail.audio_url]) {
            parts.push('<a href="' + esc(detail.audio_url)
                + '" target="_blank" rel="noopener">デモ音源を聴く</a>');
        }
        if (detail.video_url && !shown[detail.video_url]) {
            parts.push('<a href="' + esc(detail.video_url)
                + '" target="_blank" rel="noopener">解説動画を見る</a>');
        }
        if (!parts.length) {
            return '';
        }
        return P + '<strong>【デモ音源・解説】</strong><br>' + parts.join('　') + '</p>';
    }

    function detailHtml(detail) {
        var html = '';
        if (detail.description) {
            html += P + '<strong>【曲説明／編曲内容】</strong><br>'
                + nl2br(detail.description) + '</p>';
        }
        var facts = [];
        if (detail.artist) facts.push(['アーチスト', detail.artist]);
        if (detail.composer) facts.push(['作曲', detail.composer]);
        if (detail.arranger) facts.push(['編曲', detail.arranger]);
        if (detail.duration) facts.push(['演奏時間', detail.duration]);
        if (detail.trumpet_range) facts.push(['トランペットの最高音域', detail.trumpet_range]);
        if (detail.solo) facts.push(['ソロ楽器', detail.solo]);
        if (facts.length) {
            html += P + '<strong>【楽曲情報】</strong><br>' + facts.map(function (fact) {
                return esc(fact[0]) + '：' + esc(fact[1]);
            }).join('<br>') + '</p>';
        }
        if (detail.instrumentation) {
            html += P + '<strong>【編成】</strong><br>' + nl2br(detail.instrumentation) + '</p>';
        }
        return html;
    }

    function render(detail) {
        var blocks = handmadeBlocks();
        var shown = reconcileLinks(blocks, detail);
        // Handmade content already carries 曲説明・編成 etc.; only links are missing.
        var html = (blocks.length ? '' : detailHtml(detail)) + linksHtml(detail, shown);
        if (!html) {
            return;
        }
        var target = document.getElementById('autoItemDetail');
        if (!target) {
            return;
        }
        target.innerHTML = html;
        target.style.display = '';
    }

    function start() {
        var itemId = itemIdFromPath();
        if (!itemId) {
            return;
        }
        fetch(DATA_URL, { cache: 'no-cache' })
            .then(function (response) {
                return response.ok ? response.json() : null;
            })
            .then(function (data) {
                var detail = data && data[itemId];
                if (detail) {
                    render(detail);
                }
            })
            .catch(function () {});
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
