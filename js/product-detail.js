/**
 * GrooveCast product page detail renderer.
 *
 * The 商品情報 spreadsheet is the single source of truth. BASE's 商品詳細を
 * カスタマイズ App content cannot be read or written through the BASE API, so
 * anything pasted there by hand — YouTube links, 許諾番号 — goes stale with no
 * way to fix it in code. This script therefore renders the whole detail
 * (曲説明・楽曲情報・編成・参考音源リンク・許諾表示・コピーライト) from the
 * sheet-derived products_detail.json and hides the handmade block.
 *
 * The BASE theme loads this from sub.groovecast.tokyo so that logic changes ship
 * with a git push instead of a theme paste.
 */
(function () {
    'use strict';

    var DATA_URL = 'https://sub.groovecast.tokyo/data/products_detail.json';
    var HANDMADE_BLOCK = '.shop-item-text:not(.purchase-flow):not(.product-detail-auto)';
    // The theme CSS zeroes <p> margins, so space the sections inline.
    var P = '<p style="margin:1.6em 0 0;">';
    // 管理団体マーク — the same files the site footer shows.
    var MARKS = {
        'JASRAC': 'https://basefile.akamaized.net/groovecast-official-ec/64e851b9cf1d5/jasrac.jpg',
        'NexTone': 'https://basefile.akamaized.net/groovecast-official-ec/64e851d1ae418/verified_pict.png'
    };
    var MARK_STYLE = 'width:72px;height:auto;display:block;margin:0.4em 0;';
    // Fallback only: the sheet spells the wording out per item (参考音源の表記).
    var DEFAULT_LINKS = {
        heading: '参考音源・解説(外部サイト)',
        labels: ['参考音源を聴く', '解説動画を見る']
    };

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

    function setHidden(blocks, hidden) {
        for (var i = 0; i < blocks.length; i++) {
            blocks[i].style.display = hidden ? 'none' : '';
        }
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

    /** Read 「【見出し】文言　文言」 as written in the sheet's 参考音源の表記 cell. */
    function linkWording(text) {
        var parsed = /^【([^】]+)】([\s\S]*)$/.exec((text || '').trim());
        if (!parsed) {
            return DEFAULT_LINKS;
        }
        var labels = parsed[2].split(/\s+/).filter(function (label) {
            return label.length > 0;
        });
        return {
            heading: parsed[1],
            labels: labels.length ? labels : DEFAULT_LINKS.labels
        };
    }

    function anchor(url, label) {
        // The theme drops link underlines inside the item text, which leaves the
        // label reading as plain text — underline it so it is visibly a link out.
        return '<a href="' + esc(url) + '" target="_blank" rel="noopener"'
            + ' style="text-decoration:underline;">' + esc(label) + '</a>';
    }

    function linksHtml(detail) {
        var wording = linkWording(detail.link_labels);
        var parts = [];
        if (detail.audio_url) {
            parts.push(anchor(detail.audio_url, wording.labels[0]));
        }
        if (detail.video_url) {
            parts.push(anchor(detail.video_url, wording.labels[1] || DEFAULT_LINKS.labels[1]));
        }
        if (!parts.length) {
            return '';
        }
        return P + '<strong>【' + esc(wording.heading) + '】</strong><br>'
            + parts.join('　') + '</p>';
    }

    function licenseHtml(detail) {
        if (!detail.license_no) {
            return '';
        }
        var org = detail.copyright_org;
        // JASRAC writes its licence number as 第…号; NexTone uses the bare ID.
        var number = org === 'JASRAC' ? '第' + detail.license_no + '号' : detail.license_no;
        var html = P + '<strong>【許諾表示】</strong><br>';
        if (MARKS[org]) {
            html += '<img src="' + MARKS[org] + '" alt="' + esc(org)
                + '" style="' + MARK_STYLE + '">';
        }
        return html + esc(org) + '許諾番号　' + esc(number) + '</p>';
    }

    function copyrightHtml(detail) {
        if (!detail.copyright_text) {
            return '';
        }
        return P + '<strong>【コピーライト】</strong><br>'
            + nl2br(detail.copyright_text) + '</p>';
    }

    /** Render from the sheet; false means the page is left as BASE rendered it. */
    function render(detail) {
        // Take the page over only when the sheet holds the full record —
        // otherwise the handmade block is still the only copy of 曲説明・編成.
        if (!detail.description || !detail.instrumentation) {
            return false;
        }
        var target = document.getElementById('autoItemDetail');
        if (!target) {
            return false;
        }
        target.innerHTML = detailHtml(detail) + linksHtml(detail)
            + licenseHtml(detail) + copyrightHtml(detail);
        target.style.display = '';
        return true;
    }

    function start() {
        var itemId = itemIdFromPath();
        if (!itemId) {
            return;
        }
        // Hide first so the stale hand-pasted 許諾番号 never flashes up; the block
        // comes back if the sheet turns out not to stand in for it.
        var blocks = document.querySelectorAll(HANDMADE_BLOCK);
        setHidden(blocks, true);
        fetch(DATA_URL, { cache: 'no-cache' })
            .then(function (response) {
                return response.ok ? response.json() : null;
            })
            .then(function (data) {
                var detail = data && data[itemId];
                if (!detail || !render(detail)) {
                    setHidden(blocks, false);
                }
            })
            .catch(function () {
                setHidden(blocks, false);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
