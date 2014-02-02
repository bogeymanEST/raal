const ANIM_FROM_LEFT = 0;
const ANIM_FROM_RIGHT = 1;
const ANIM_FROM_TOP = 2;
const ANIM_FROM_BOTTOM = 3;

const STATE_MAIN = "main";
const STATE_LEFT = "ehin";
const STATE_RIGHT = "laaban";
const STATE_BOT = "tasks";
const STATE_TOP = "comparison";

var animEndEventNames = {
    'WebkitAnimation': 'webkitAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd',
    'animation': 'animationend'
};
var animEndEventName = animEndEventNames[ Modernizr.prefixed('animation') ];
var endCur = false;
var endNext = false;
var animating = false;

var lastPage = null;
var animStack = [];
var backAnim = "";
var animSupport = Modernizr.cssanimations;

var pages = [
    [ANIM_FROM_LEFT, "ehin"],
    [ANIM_FROM_RIGHT, "laaban"],
    [ANIM_FROM_BOTTOM, "tasks"],
    [ANIM_FROM_TOP, "comparison"],
    [ANIM_FROM_TOP, "comparison-poetry"],
    [ANIM_FROM_LEFT, "ehin-gallery"],
    [ANIM_FROM_RIGHT, "laaban-gallery"]
];

function reset(cur, next) {
    cur.removeClass("pt-page-current");
}
function onAnimEnd(cur, next) {
    endCur = false;
    endNext = false;
    animating = false;
    reset(cur, next);
}
/**
 * Changes the page with an animation
 * @param animation The animation
 * @param next The jQuery object of the next page
 */
function changePage(animation, next, state) {
    var cur = $(".pt-page-current").eq(0);
    var curAnim = "";
    var nextAnim = "";
    if (animating) return;
    animating = true;
    if (animation == ANIM_FROM_LEFT) {
        curAnim = "pt-page-moveToRight";
        nextAnim = "pt-page-moveFromLeft";
        backAnim = ANIM_FROM_RIGHT;
    } else if (animation == ANIM_FROM_RIGHT) {
        curAnim = "pt-page-moveToLeft";
        nextAnim = "pt-page-moveFromRight";
        backAnim = ANIM_FROM_LEFT;
    } else if (animation == ANIM_FROM_TOP) {
        curAnim = "pt-page-moveToBottom";
        nextAnim = "pt-page-moveFromTop";
        backAnim = ANIM_FROM_BOTTOM;
    } else if (animation == ANIM_FROM_BOTTOM) {
        curAnim = "pt-page-moveToTop";
        nextAnim = "pt-page-moveFromBottom";
        backAnim = ANIM_FROM_TOP;
    }
    next.addClass("pt-page-current");
    lastPage = cur;
    animStack.push({page: cur, anim: backAnim, state: state});
    cur.addClass(curAnim).on(animEndEventName, function () {
        cur.off(animEndEventName);
        cur.removeClass(curAnim);
        endCur = true;
        if (endNext) {
            onAnimEnd(cur, next);
        }
    });

    next.addClass(nextAnim).on(animEndEventName, function () {
        next.off(animEndEventName);
        next.removeClass(nextAnim);
        endNext = true;
        if (endCur) {
            onAnimEnd(cur, next);
        }
    });

    if (!animSupport) {
        onAnimEnd(cur, next);
    }
}
window.onbeforeunload = function () {
    console.log("unload");
}
function isValidState(state) {
    for (var i = 0; i < pages.length; i++) {
        var p = pages[i];
        if(p[1] == state) return true;
    }
    return state == "main";
}
var disableHash = false;
function popState() {
    if (lastState == null) return;
    var last = animStack.pop();
    if (last == null) return;
    changePage(last.anim, last.page, last.state); //Going back
    if(!isValidState(last.state)) last.state = "main";
    disableHash = true;
    History.setHash(last.state);
}
var lastState = null;
function checkState() {
    var state = History.getHash();
    if (state == lastState) return;
    if(disableHash) {
        disableHash = false;
        return;
    }
    var changed = false;
    if (animStack.length > 1 && (state == "back" || animStack.slice(-1)[0].state == state)) {
        popState();
    } else {
        for (var i = 0; i < pages.length; i++) {
            var p = pages[i];
            if (p[1] == state) {
                changePage(p[0], $("#page-" + p[1]), lastState);
                changed = true;
                History.setHash(p[1]);
                break;
            }
        }
        if (!changed) {
            popState();
        }
    }
    lastState = state;
}

Array.prototype.chooseRandom = function () {
    return this[Math.floor(Math.random() * this.length)];
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function loadRandomQuote() {
    var r = randomInt(0, 1);
    var author = "";
    var quote = "";
    if (availableQuotes.laaban.length == 0 && availableQuotes.ehin.length == 0) {
        availableQuotes.laaban = quotes.laaban.slice(0);
        availableQuotes.ehin = quotes.ehin.slice(0);
    }
    if ((r == 0 && availableQuotes.laaban.length > 0) || (availableQuotes.ehin.length == 0)) {
        author = "Ilmar Laaban";
        quote = availableQuotes.laaban.chooseRandom();
        availableQuotes.laaban.splice(availableQuotes.laaban.indexOf(quote), 1); //Remove the selected quote
    } else {
        author = "Andres Ehin";
        quote = availableQuotes.ehin.chooseRandom();
        availableQuotes.ehin.splice(availableQuotes.ehin.indexOf(quote), 1); //Remove the selected quote
    }
    $(".quote-generator-container > .quote").html(quote.split("\n").join("<br/>")); //Replace all newlines
    $(".quote-generator-container > .author").text(author);
}

$(".quote-generator-container").click(function () {
    loadRandomQuote();
});
var poemLeft = "";
var poemRight = "";
var availableQuotes = [];
function loadRandomPoems(sectionId) {
    var left = "";
    var right = "";
    var questions = [];
    if (sectionId == 1) { //Get a premade pair
        var pre = poemData.premade.chooseRandom();
        right = poemList[0][pre.pair.laaban];
        left = poemList[1][pre.pair.ehin];
        questions = pre.questions;
    } else if(sectionId == 2) { //Get a random pair
        right = poemList[0].chooseRandom();
        left = poemList[1].chooseRandom();
        var available = poemData.questions.slice(0);
        while (questions.length < 3) { //Grab some random questions
            var sel = available.chooseRandom();
            questions.push(sel);
            available.splice(available.indexOf(sel), 1); //Remove the selected question
        }
    }
    $.get(left, function (data) {
        $("#poem-left-" + sectionId).find(".poem-content").html(data);
        poemLeft = data;
    }, "text");

    $.get(right, function (data) {
        $("#poem-right-" + sectionId).find(".poem-content").html(data);
        poemRight = data;
    }, "text");
    var cont = $("#poem-q-container-" + sectionId);
    cont.text(""); //Clear previous questions
    var c = 0;
    for (var id in questions) {
        if (!questions.hasOwnProperty(id)) continue;
        var q = questions[id];
        cont.append("<div class=\"poem-question\" id=\"poem-question-" + c + "\">" + q + "<br/>" +
            "<textarea rows=\"4\"  class=\"poem-answer\" data-poem-question=\"" + c + "\"/></div>");
        c++;
    }
}
$("#poem-send-button").click(function () {
    var email = $("#poem-send-email").val();
    var subject = encodeURIComponent("Kahe luuletuse võrdlus");
    var body = "Esimene luuletus:\n" + poemLeft + "Teine luuletus:\n" + poemRight + "\nKüsimused:\n";
    $('[data-poem-question!=""]').each(function () {
        var num = $(this).data("poem-question");
        var question = $("#poem-question-" + num).text();
        var answer = $(this).val();
        body += question + "\n" + answer + "\n";
    });
    body = encodeURIComponent(body);
    window.open("mailto:" + email + "?subject=" + subject + "&body=" + body);
});
var quotes = [];
var poemData = {};
var poemList = [
    [],
    []
];
$(function () {
    $.get("data/poems.yml", function (data) {
        poemData = jsyaml.load(data);
        var i;
        for (i = 1; i <= poemData.poems.laaban; i++) {
            poemList[0].push("data/poems/laaban/" + i + ".txt");
        }
        for (i = 1; i <= poemData.poems.ehin; i++) {
            poemList[1].push("data/poems/ehin/" + i + ".txt");
        }
        loadRandomPoems(1);
        loadRandomPoems(2);
    }, "text");
    $.get("data/quotes.yml", function (data) {
        quotes = jsyaml.load(data);
        availableQuotes.laaban = quotes.laaban.slice(0);
        availableQuotes.ehin = quotes.ehin.slice(0);
        loadRandomQuote();
    });
    // MAKE SURE YOUR SELECTOR MATCHES SOMETHING IN YOUR HTML!!!
    $('.tooltip').each(function() {
        $(this).qtip({
            content: {
                text: $(this).next('.text')
            },
            style: {
                classes: 'qtip-dark'
            }
        });
    });
    window.setInterval(function () {
        checkState();
    }, 100);
});
