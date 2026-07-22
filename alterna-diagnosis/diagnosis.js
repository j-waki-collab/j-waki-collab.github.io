/* =========================================================
   オルタナバンク 診断チャットボット（バニラJS・依存なし）
   使い方：
     <div id="alterna-diagnosis"></div>
     <link rel="stylesheet" href="diagnosis.css">
     <script src="diagnosis.js"></script>
   ダッシュ計測：window.dataLayer に push（GTM想定）
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 設定（文言・分岐はここだけ触れば変えられる） ---------- */
  var CFG = {
    mountId: "alterna-diagnosis",
    ctaUrl: "https://www.alternabank.jp/lp28/",
    avatarLabel: "公式",          // 画像が読めない時のフォールバック文字

    // キャラ画像（アバター＝リカ）。埋め込み先に合わせてパスを変える
    assetBase: "assets/",
    avatarImg: "rika_avatar.png",     // 吹き出し横のアバター
    introImg: "rika_magnifier_bust.png", // 開始画面で登場（虫眼鏡バストアップ）
    diagnosingImg: "rika_magnifier.png", // 「診断中…」で登場
    resultImg: "rika_cheer.png",         // 結果リビールで登場

    title: "資産運用スタイル診断",
    subtitle: "かんたん2問で",
    lead: "30秒であなたに合う“始め方”がわかる",

    // botの各発言のタイピング演出時間(ms)
    typingMs: 700,
    // 結果リビール前の「診断中…」演出(ms)
    diagnosingMs: 900,

    questions: [
      {
        key: "q1",
        event: "diagnosis_q1_answer",
        bot: "投資で、一番気になることは？",
        choices: [
          { code: "A", label: "損したくない・元本が心配", sub: "リスクへの不安" },
          { code: "B", label: "難しそう・手間がかかりそう", sub: "知識や手間のハードル" }
        ]
      },
      {
        key: "q2",
        event: "diagnosis_q2_answer",
        bot: "なるほど！じゃあ、資産運用はどんなふうに始めたい？",
        choices: [
          { code: "X", label: "まずは1万円から、少額でおためし", sub: "少額スタート" },
          { code: "Y", label: "コツコツ堅実に育てたい", sub: "堅実重視" }
        ]
      }
    ],

    // 結果はQ1(A/B)×Q2(X/Y)の組み合わせキーで引く
    results: {
      AX: {
        type: "1万円おためしタイプ",
        lead: "まずは1万円から。口座開設費も管理費も無料で、気軽に試せます。",
        reasons: [
          "1万円から始められ、口座開設費も管理費も無料",
          "株式や投資信託のような日々の値動きがない",
          "口座開設の申込は最短5分"
        ]
      },
      AY: {
        type: "コツコツ堅実タイプ",
        lead: "実績で選びたいあなたに。顧客元本毀損率0%の実績があります。",
        reasons: [
          "顧客元本毀損率0%（過去の実績）",
          "目標利回り達成率99.4%（※2025年9月16日現在）",
          "目標利回りが事前に定められている※／日々の値動きがない"
        ]
      },
      BX: {
        type: "ほったらかし少額タイプ",
        lead: "銘柄選びも値動きチェックも不要。選んで、満了を待つだけ。",
        reasons: [
          "銘柄を選ぶ必要がなく、ファンドを選ぶだけ",
          "日々の値動きがなく、満了を待つだけ",
          "1万円から始められ、手数料も無料"
        ]
      },
      BY: {
        type: "目標利回り重視タイプ",
        lead: "目標利回りが事前に定められたファンドで、堅実に資産運用を。",
        reasons: [
          "目標利回りが事前に定められている※（4〜12%・税引前）",
          "株式や投資信託のような日々の値動きがない",
          "顧客元本毀損率0%（過去の実績）"
        ]
      }
    },

    resultBadge: "あなたの診断結果は…",
    campaign: "今なら初回投資応援で現金3,000円プレゼント",
    ctaLabel: "無料！口座開設はこちら",
    ctaSub: "最短5分・口座開設費も維持費も無料",
    note: "※固定利回りとは募集時に定められていることを意味し、利回りを確約するものではありません。将来の運用成果を保証するものではありません。",
    restartLabel: "もう一度診断する"
  };

  /* ---------- 計測ヘルパー ---------- */
  function track(event, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event };
    if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) payload[k] = extra[k]; } }
    window.dataLayer.push(payload);
  }

  /* ---------- DOM小道具 ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // リカのアバター（画像／読めなければ文字バッジにフォールバック）
  function avatar() {
    var a = el("div", "abd-avatar");
    if (CFG.avatarImg) {
      var img = document.createElement("img");
      img.src = CFG.assetBase + CFG.avatarImg;
      img.alt = "案内役リカ";
      img.addEventListener("error", function () {
        a.className = "abd-avatar abd-avatar-text";
        a.textContent = CFG.avatarLabel;
      });
      a.appendChild(img);
    } else {
      a.className = "abd-avatar abd-avatar-text";
      a.textContent = CFG.avatarLabel;
    }
    return a;
  }
  // 登場カット（全身）
  function figure(file, small) {
    if (!file) return null;
    var img = document.createElement("img");
    img.className = "abd-figure" + (small ? " abd-figure-sm" : "");
    img.src = CFG.assetBase + file;
    img.alt = "";
    img.addEventListener("error", function () { img.style.display = "none"; });
    return img;
  }

  /* ---------- 本体 ---------- */
  function Diagnosis(mount) {
    this.mount = mount;
    this.answers = {};   // { q1:"A", q2:"X" }
    this.render();
  }

  Diagnosis.prototype.render = function () {
    this.mount.innerHTML = "";
    var root = el("div", "abd-root");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", CFG.title);

    var head = el("div", "abd-head");
    head.appendChild(el("span", "abd-tag", esc(CFG.subtitle)));
    head.appendChild(el("h2", "abd-title", esc(CFG.title)));
    head.appendChild(el("div", "abd-title-accent"));
    if (CFG.lead) head.appendChild(el("p", "abd-lead", esc(CFG.lead)));
    root.appendChild(head);

    // チャットログ（読み上げ対応）
    this.log = el("div", "abd-log");
    this.log.setAttribute("role", "log");
    this.log.setAttribute("aria-live", "polite");
    root.appendChild(this.log);

    // 開始ボタン
    this.startWrap = el("div", "abd-start-wrap");
    var introFig = figure(CFG.introImg);
    if (introFig) { introFig.classList.add("abd-figure-intro"); this.startWrap.appendChild(introFig); }
    var startBtn = el("button", "abd-start", "診断をはじめる");
    startBtn.type = "button";
    var self = this;
    startBtn.addEventListener("click", function () { self.start(); });
    this.startWrap.appendChild(startBtn);
    root.appendChild(this.startWrap);

    this.mount.appendChild(root);
    this.root = root;
  };

  Diagnosis.prototype.start = function () {
    track("diagnosis_start");
    this.startWrap.style.display = "none";
    // 開始時に該当エリアへスムーズスクロール
    try { this.root.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
    this.ask(0);
  };

  // botの発言→タイピング→選択肢表示
  Diagnosis.prototype.ask = function (idx) {
    var self = this;
    var q = CFG.questions[idx];
    this.botSay(q.bot, function () {
      self.showChoices(q, idx);
    });
    this.setProgress(idx);
  };

  Diagnosis.prototype.setProgress = function (idx) {
    if (this.progress) this.progress.remove();
    this.progress = el("div", "abd-progress", "Q" + (idx + 1) + " / " + CFG.questions.length);
    this.log.appendChild(this.progress);
    this.scrollLog();
  };

  // タイピング演出つきbot発言
  Diagnosis.prototype.botSay = function (text, done) {
    var self = this;
    var row = el("div", "abd-row abd-bot");
    row.appendChild(avatar());
    var bubble = el("div", "abd-bubble");
    bubble.innerHTML = '<span class="abd-typing"><span></span><span></span><span></span></span>';
    row.appendChild(bubble);
    this.log.appendChild(row);
    this.scrollLog();

    setTimeout(function () {
      bubble.innerHTML = esc(text);
      self.scrollLog();
      if (done) done();
    }, CFG.typingMs);
  };

  Diagnosis.prototype.showChoices = function (q, idx) {
    var self = this;
    var wrap = el("div", "abd-choices");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", q.bot);

    q.choices.forEach(function (c) {
      var btn = el("button", "abd-choice");
      btn.type = "button";
      btn.innerHTML = esc(c.label) + '<span class="abd-choice-sub">' + esc(c.sub) + "</span>";
      btn.addEventListener("click", function () {
        self.choose(q, idx, c, wrap);
      });
      wrap.appendChild(btn);
    });
    this.log.appendChild(wrap);
    this.scrollLog();
    // 最初の選択肢へフォーカス（キーボード操作）
    var first = wrap.querySelector(".abd-choice");
    if (first) first.focus();
  };

  Diagnosis.prototype.choose = function (q, idx, choice, choicesWrap) {
    var self = this;
    // 二度押し防止
    var btns = choicesWrap.querySelectorAll(".abd-choice");
    for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
    choicesWrap.remove();

    // 回答を保持＋計測
    this.answers[q.key] = choice.code;
    track(q.event, { value: choice.label });

    // ユーザー発言を右にスライドイン
    this.userSay(choice.label);

    if (idx + 1 < CFG.questions.length) {
      setTimeout(function () { self.ask(idx + 1); }, 350);
    } else {
      setTimeout(function () { self.diagnose(); }, 350);
    }
  };

  Diagnosis.prototype.userSay = function (text) {
    var row = el("div", "abd-row abd-user");
    row.appendChild(el("div", "abd-bubble", esc(text)));
    this.log.appendChild(row);
    this.scrollLog();
  };

  // 「診断中…」→結果リビール
  Diagnosis.prototype.diagnose = function () {
    var self = this;
    if (this.progress) { this.progress.remove(); this.progress = null; }

    // リカが虫眼鏡で「診断中…」
    var fig = figure(CFG.diagnosingImg);
    if (fig) this.log.appendChild(fig);

    var row = el("div", "abd-row abd-bot");
    row.appendChild(avatar());
    var bubble = el("div", "abd-bubble",
      'あなたにぴったりの始め方を診断中…<span class="abd-typing" style="margin-left:6px"><span></span><span></span><span></span></span>');
    row.appendChild(bubble);
    this.log.appendChild(row);
    this.scrollLog();

    setTimeout(function () {
      row.remove();
      if (fig) fig.remove();
      self.showResult();
    }, CFG.diagnosingMs);
  };

  Diagnosis.prototype.showResult = function () {
    var key = (this.answers.q1 || "") + (this.answers.q2 || "");
    var r = CFG.results[key];
    if (!r) return; // 想定外キーは何もしない

    track("diagnosis_result", { value: r.type });

    var card = el("div", "abd-result");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "診断結果");

    // リカが万歳で結果発表
    var fig = figure(CFG.resultImg);
    if (fig) card.appendChild(fig);

    card.appendChild(el("div", "abd-result-badge", esc(CFG.resultBadge)));

    var type = el("h3", "abd-result-type",
      'あなたは<br><span class="abd-q">「' + esc(r.type) + "」</span>");
    card.appendChild(type);

    card.appendChild(el("p", "abd-result-lead", esc(r.lead)));

    var ul = el("ul", "abd-reasons");
    r.reasons.forEach(function (txt) { ul.appendChild(el("li", null, esc(txt))); });
    card.appendChild(ul);

    card.appendChild(el("div", "abd-campaign", "🎁 " + esc(CFG.campaign)));

    var cta = el("a", "abd-cta",
      esc(CFG.ctaLabel) + '<small>' + esc(CFG.ctaSub) + "</small>");
    cta.href = CFG.ctaUrl;
    cta.rel = "noopener";
    cta.addEventListener("click", function () {
      track("diagnosis_cta_click", { value: r.type });
    });
    card.appendChild(cta);

    card.appendChild(el("p", "abd-note", esc(CFG.note)));

    var restart = el("button", "abd-restart", esc(CFG.restartLabel));
    restart.type = "button";
    var self = this;
    restart.addEventListener("click", function () {
      self.answers = {};
      self.render();
    });
    card.appendChild(restart);

    this.log.appendChild(card);
    this.scrollLog();
  };

  Diagnosis.prototype.scrollLog = function () {
    // ログ末尾を視界に（ページ全体スクロールはしない・埋め込み配慮）
    var last = this.log.lastElementChild;
    if (last && last.scrollIntoView) {
      try { last.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
    }
  };

  /* ---------- 起動 ---------- */
  function boot() {
    var mount = document.getElementById(CFG.mountId);
    if (mount) new Diagnosis(mount);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // 手動再マウント用に公開
  window.AlternaDiagnosis = { boot: boot, config: CFG };
})();
