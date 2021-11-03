var mycallbacks = {};
//cookie functions
function setCookie(name, value, hours)
{
    var expires = "";
    if(hours)
    {
        var date = new Date();
        date.setTime(date.getTime() + (hours * 3600 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++)
    {
        var c = ca[i];
        while(c.charAt(0) == ' ') c = c.substring(1, c.length);
        if(c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name)
{
    document.cookie = name + '=; Path=/; Expires=Wed, 11 May 1983 00:00:01 GMT;';
}
//grabs html from a web page to load into defined element
//used by apps [contact form] to load content into a set div
function loadAppContent(url, loadInto, callback)
{
    $.ajax(
    {
        url: url,
        beforeSend: function()
        {
            $(loadInto).html('<i class="fa fa-circle-o-notch fa-spin fa-lg fa-fw appContentLoading"></i>');
        },
        success: function(data)
        {
            $(loadInto).html(data);
            $(loadInto).find('.lazy').Lazy(
            {
                effect: 'fadeIn',
                effectTime: 250
            });
            if(typeof mycallbacks[callback] === "function")
            {
                mycallbacks[callback](loadInto);
            }
        }
    });
}
//submit a form via ajax, basic
function ajaxForm(form, callback)
{
    $(form + ' .good').slideUp('fast');
    var btntxt = $(form + '> button').html();
    $.ajax(
    {
        type: $(form).attr('method'),
        url: $(form).attr('action'),
        data: $(form).serialize(),
        beforeSend: function()
        {
            $(form + ' > button').append('<i class="fa fa-circle-o-notch fa-spin fa-lg fa-fw appContentLoading"></i>');
        },
        success: function()
        {
            $(form + ' > button').html(btntxt);
            $(form + ' .good').slideDown('fast');
            $(form)[0].reset();
            scrollToElement(form + ' > .good');
            if(typeof mycallbacks[callback] === "function")
            {
                mycallbacks[callback](form);
            }
        }
    });
}
//find all elements we want to apply fancybox to and enable
mycallbacks.enableGallery = function(token)
{
    $ul = $(token + ' ul.gallery');
    var gallerySettings = $(token).parents('div.appGalleryInit');
    var startThumbs = (gallerySettings.hasClass('showThumbs')) ? true : false;
    var opts = {
        arrows: true,
        protect: true,
        thumbs:
        {
            autoStart: startThumbs
        }
        //animationEffect: $ul.attr('animationEffect'),//false, zoom, fade, zoom-in-out
        //transitionEffect: $ul.attr('transitionEffect')////false, fade, slide, circular, tube, zoom-in-out, rotate
    };
    $.fancybox.defaults.animationEffect = "fade";
    $(".appContent ul.gallery li a").not('.notFancyLink').fancybox(opts);
    $ul.find('.lazy').Lazy(
    {
        effect: 'fadeIn',
        effectTime: 250
    });
}
//find all elements we want to apply carousel to and enable
mycallbacks.enableCarousel = function(token)
{
    initIsSlider(token);
}
//find all elements we want to apply slideshow to and enable
mycallbacks.enableSlideshow = function(token)
{
    $data = $(token);
    var slides = $("div" + token + " ul li").length;
    if(slides > 0)
    {
        var opts = {
            numeric: ($data.attr('dots') == 'true') ? true : false,
            prevNext: ($data.attr('arrows') == 'true') ? true : false,
            effect: $data.attr('effect'),
            pause: ($data.attr('slidepause') * 1000),
            continuous: true,
            touch: true,
            auto: true,
        };
        var sudoSlider = $("div" + token).sudoSlider(opts);
        //stop on mouse over if enabled
        if($data.attr('mousepause') == 'true')
        {
            var autostopped = false;
            sudoSlider.mouseenter(function()
            {
                auto = sudoSlider.getValue('autoAnimation');
                if(auto)
                {
                    sudoSlider.stopAuto();
                }
                else
                {
                    autostopped = true;
                }
            }).mouseleave(function()
            {
                if(!autostopped)
                {
                    sudoSlider.startAuto();
                }
            });
        }
        //arrow keys support
        $(document).keydown(function(e)
        {
            if(e.which == 39)
            {
                sudoSlider.goToSlide("next");
            }
            else if(e.which == 37)
            {
                sudoSlider.goToSlide("prev");
            }
        });
    }
    else //slideshow doesnt have any slides, remove the show
    {
        $("div" + token).closest('.appSlideshowInit').remove();
    }
}
//fix select menu for IOS/Iphone devices
function fixIosSelect(selectElement)
{
    if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    {
        for(var a = document.querySelectorAll('[id^="' + selectElement + '"]'), b = 0; b < a.length; b++) a[b].appendChild(document.createElement("optgroup"));
    }
}
//reload the content of element on the page
function reloadElement(element, callback, url)
{
    url = (url) ? url : location.href;
    $.get(url, function(page)
    {
        var reloaded = $(page).find(element);
        if(reloaded)
        {
            $(element).replaceWith(reloaded);
            $('.lazy').Lazy(
            {
                effect: 'fadeIn',
                effectTime: 250
            });
        }
        else
        {
            $(element).slideUp('fast');
        }
        if(typeof callback == "function")
        {
            callback(element);
        }
    });
}
/**
 * dom ready
 */
$(document).ready(function()
{
    /**
     * Finds the first appHook element in nwContent div
     * Adds "firBlock" class to it for better control over the display of it
     */
    var check = $('div#nwContent > .appHook:first:not([class*="firstBlock"])').is(':visible');
    if(check)
    {
        $('div#nwContent > .appHook:first:not([class*="firstBlock"])').addClass('firstBlock');
    }
    //$("ul:not([class*='bbox'])").addClass("bbox");
    /**
     * Find all appContent elements and add content to them from their apps via source attr
     * Can also run callbacks from tags
     */
    $('.appContent').each(function()
    {
        var id = $(this).attr('id');
        var source = $(this).attr('source');
        if(source)
        {
            source += id;
        }
        var cb = $(this).attr('callback');
        loadAppContent(source, '#' + id, cb);
    });
    /**
     * Copies the menu into the mobile menu area
     */
    var h = $('#nwNavTop').html();
    $('#mobile-menu').html(h);
    $('#mobile-menu .hasSubs').replaceWith(function()
    {
        return $('<span>',
        {
            html: $(this).html()
        })
    });
    /**
     * load mobile menu
     */
    $("#mobile-menu").mmenu(
    {
        extensions: ["multiline"]
    });
    /**
     * Finds all .codeSnippet and run the source data html/js
     */
    $('body').find('.codeSnippet').each(function()
    {
        $(this).empty().html('<i class="fa fa-circle-o-notch fa-spin fa-lg fa-fw appContentLoading"></i>');
        var source = htmlDecode($(this).attr('data-snippetsource'));
        source = source.replace(/mctemp1/, '');
        $(this).empty().html(source);
    });
    /**
     * Find all shop product list snippet and fill with content
     */
    $('body').find('.appShopItemlist').each(function()
    {
        $(this).empty().html('<i class="fa fa-circle-o-notch fa-spin fa-lg fa-fw appContentLoading"></i>');
        var $container = $(this);
        var source = $container.data('source');
        var cat = $container.data('cat');
        var products = $container.data('products');
        var url = source + cat + '/' + products;
        $.get(url, function(data)
        {
            $container.empty().html(data);
            $container.find('.lazy').Lazy(
            {
                effect: 'fadeIn',
                effectTime: 250
            });
        });
    });
    /**
     * Toggle the search form via the header menu search link
     */
    $('body').on('click', 'a#searchToggleLinkTop', function(event)
    {
        event.preventDefault();
        $(this).toggleClass('hideSearch');
        $('form.nwSiteSearchForm').slideToggle().find('input#query').focus();
    });
    /**
     * Look for credit card fields and apply formatting and card type class to them
     */
    $('input.formatCCnumm, input.showCardType').trigger('keyup');
    /**
     * Look for credit card fields and apply formatting to their value on input
     */
    $('input.formatCCnum').on('keyup', function()
    {
        $(this).val(formatCreditCardField($(this).val()));
    });
    /**
     * Look for credit card fields and apply card type class to parent
     */
    $('input.showCardType').on('keyup', function()
    {
        $(this).parent().prop('class', cardTypeClass($(this).val()));
    });
    /**
     * Finds all inputs with .maxInput class and tabs to their data-next attr target element if defined
     */
    $('input.maxInput').keyup(function()
    {
        var target = $(this).data('next');
        var max = $(this).prop('maxlength');
        var count = $(this).val().length;
        if($('#' + target) && count >= max)
        {
            $('#' + target).focus();
        }
    });
    /**
     * Find all input.numbersOnly that only allow numbers
     */
    $('input.numbersOnly').on('keypress', function(e)
    {
        if(e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57))
        {
            return false;
        }
    });
    /**
     * Find all parallax elements on the page and set their background as parallax image attribute
     */
    $('[data-parallax="scroll"]').each(function()
    {
        var element = $(this);
        var backgroundImage = element.css('background-image');
        backgroundImage = backgroundImage.replace('url(', '').replace(')', '').replace(/\"/gi, "");
        $(this).data('image-src', backgroundImage);
        element.css('background-image', 'none');
    });
    //only leave the firstBlock on the page
    $('.firstBlock').not(':first').removeClass('firstBlock');
    //end of dom ready
});
/**
 * A function that can delay exec of the callback
 * Can be used with keyup and then run the function when user stops typing in a field
 */
var delay = (function()
{
    var timer = 0;
    return function(callback, ms)
    {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
/**
 * Scroll to the passed element
 */
function scrollToElement(element)
{
    if(jQuery(element).length > 0)
    {
        var topPadding = (jQuery(element).data('padding-top')) ? parseInt(jQuery(element).data('padding-top')) : 0;
        jQuery('html,body').animate(
        {
            scrollTop: jQuery(element).offset().top - 90 - topPadding
        }, 600);
    }
}
/**
 * Takes HTML and encodes it
 */
function htmlEncode(str)
{
    return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i)
    {
        return '&#' + i.charCodeAt(0) + ';';
    });
}
/**
 * Takes encoded HTML and decodes it
 */
function htmlDecode(str)
{
    return str.replace(/&#(\d+);/g, function(match, dec)
    {
        return String.fromCharCode(dec);
    });
}
/**
 * Takes a credit card number as a value and formats it into block of 4 digits
 */
function formatCreditCardField(value)
{
    var v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    var matches = v.match(/\d{4,16}/g);
    var match = matches && matches[0] || '';
    var parts = [];
    for(i = 0, len = match.length; i < len; i += 4)
    {
        parts.push(match.substring(i, i + 4));
    }
    if(parts.length)
    {
        return parts.join(' ');
    }
    else
    {
        return value;
    }
}
/**
 * Adds a class to the card number field based on card type
 */
function cardTypeClass(value)
{
    var firstDigit = value.charAt(0);
    if(firstDigit == 4)
    {
        return 'ccNum cardTypeVisa';
    }
    if(firstDigit == 5)
    {
        return 'ccNum cardTypeMasterCard';
    }
    if(firstDigit == 6)
    {
        return 'ccNum cardTypeDiscover';
    }
    if(firstDigit == 3)
    {
        return 'ccNum cardTypeAmex';
    }
}

/**
 * Sticky menu helper
 */
function stickyMenuScroller(targetElement)
{
    var viewportHeight = $(window).height();
    var menuBarHeight = $('#' + targetElement).height();
    var subMenuHeight = viewportHeight - menuBarHeight;
    $('#nwNavTop li ul').css('max-height', subMenuHeight + 'px');
}
/**
 * Makes the menu bar stick at top
 */
var layoutWorksIn = siteData.stickMenuConfig;
var layout = siteData.template_layout;
var targetElement = layoutWorksIn[layout];
if(siteData.stickyMenuTarget)
{
    var targetElement = siteData.stickyMenuTarget;
}
$(document).ready(function()
{
    window.onscroll = function()
    {
        if(targetElement && $(layoutWorksIn).length > 0)
        {
            stickyMenu();
        }
    };

    $(window).resize(function()
    {
        if(targetElement && $(layoutWorksIn).length > 0)
        {
            stickyMenu();
        }
    });

    if(targetElement && $(layoutWorksIn).length > 0)
    {
        var nwWebsite = document.getElementById("nwWebsite");
        var nwNavTop = document.getElementById(targetElement);
        var sticky = nwNavTop.offsetTop;
        var nwStage = document.getElementById("nwStage");
    }

    function stickyMenu()
    {
        if($(window).scrollTop() > sticky && $(window).width() > 699)
        {
            nwStage.style = 'margin-top: ' + nwNavTop.offsetHeight + 'px;';
            nwWebsite.classList.add("bodyMenuSticky");
            nwNavTop.classList.add("sticky");
        }
        else
        {
            nwWebsite.classList.remove("bodyMenuSticky");
            nwNavTop.classList.remove("sticky");
            nwStage.style = '';
        }
        stickyMenuScroller(targetElement);
    }

});
/**
 * Global overlay handlers
 */
function showGlobalOverlay(overLayContent, useInsideContentOverlay = 'n')
{
    var divToUse = (useInsideContentOverlay == 'y') ? 'globalOverlayInContent' : 'globalOverlay';
    $('#' + divToUse + ' .nwOverlayContent').empty().html(overLayContent);
    $('#' + divToUse).fadeIn(function()
    {
        $('#' + divToUse + ' .lazy').Lazy(
        {
            effect: 'fadeIn',
            effectTime: 250
        });
    });
}
//close the Global overlay when the close or the bg is clicked
$('body').on('click', '.nwOverlayClose, .nwCancelOverlay', function(event)
{
    event.preventDefault();
    $('.nwOverlay').fadeOut('fast');
});
//fix dropdown with long options on IOS devices
$(document).ready(function()
{
    if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    {
        for(var a = document.querySelectorAll("select"), b = 0; b < a.length; b++) a[b].appendChild(document.createElement("optgroup"));
    }
});
/**
 * Global slideshow - turns any tagged element to into a slider using slick slider
 * Slider options can be passed via data-attr in the snippet
 */
function initIsSlider(target)
{
    $(target).each(function()
    {
        $(this).slick(
        {
            slidesToShow: 4,
            slidesToScroll: 4,
            responsive: [
            {
                breakpoint: 699,
                settings:
                {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }]
        });
    });
}
$(document).ready(function()
{
    initIsSlider('.isSlider');
});
/**
 * Remove all noClick classes from in the sidebar menu
 */
$(document).ready(function()
{
    $('#nwNavSide .noClick').removeClass('noClick');
});
/**
 * show contents of an element as an overlay using link
 */
$(document).ready(function()
{
    $('body').on('click', '.targetAsOverlay', function(event)
    {
        event.preventDefault();
        var target = $(this).attr('data-target');
        var divToUse = $(this).attr('data-use-inside-div');
        var removePadding = $(target).attr('data-remove-padding');
        removePadding = (removePadding == 'n') ? 'n' : 'y';
        var html = $(target).html();
        var style = ($(target).attr('style')) ? $(target).attr('style') : '';
        var wrapper = '<div class="' + $(target).attr('class') + '" style="' + style.replace('"', "'") + '">' + html + '</div>';
        wrapper = $(wrapper).removeClass('hideFromSite');
        showGlobalOverlay(wrapper, divToUse);
        if(removePadding == 'y')
        {
            $('.nwOverlayContent').css('padding', 0);
        }
    });
});
/**
 * Monitor all on click overlay events
 */
$(document).ready(function()
{
    $("body").on("click", "a[href^='#overlay']", function(event)
    {
        event.preventDefault();
        var target = $(this).attr('href');
        var element = $(target);
        var html = element.html();
        var style = (element.attr('style')) ? element.attr('style') : '';
        style = style.replace(/"/g, "'");
        var useInsideDiv = element.attr('data-use-inside-div');
        useInsideDiv = (useInsideDiv == 'y' || !useInsideDiv) ? 'y' : 'n';
        var removePadding = element.attr('data-remove-padding');
        removePadding = (removePadding == 'n' || !removePadding) ? 'n' : 'y';
        var wrapper = '<div class="' + element.attr('class') + '" style="' + style + '">' + html + '</div>';
        wrapper = $(wrapper).removeClass('hideFromSite');
        showGlobalOverlay(wrapper, useInsideDiv);
        if(removePadding == 'y')
        {
            $('.nwOverlayContent').css('padding', 0);
        }
    });
});

/**
 * Find all the appOverlay elements and parse them
 */
$(document).ready(function()
{
    $('.appOverlay').each(function()
    {
        var element = $(this);
        var clickOverlay = element.attr('data-click');
        clickOverlay = (clickOverlay == 'y') ? 'y' : 'n';
        if(clickOverlay == 'y')
        {
            return false;
        }
        var timeDelay = parseInt(element.attr('data-delay'));
        timeDelay = (!timeDelay) ? 3 : timeDelay;
        timeDelay = (timeDelay * 1000);
        var useInsideDiv = element.attr('data-use-inside-div');
        useInsideDiv = (useInsideDiv == 'y' || !useInsideDiv) ? 'y' : 'n';
        var removePadding = element.attr('data-remove-padding');
        removePadding = (removePadding == 'n' || !removePadding) ? 'n' : 'y';
        var useCookie = parseInt(element.attr('data-every-hours'));
        var mode = element.attr('data-mode');
        var mode = (mode == 'auto' || !mode) ? 'auto' : 'manual';
        var trigger = element.attr('data-trigger');
        var id = element.attr('id');
        delay(function()
        {
            if(useCookie > 0 && mode == 'auto')
            {
                if(getCookie(id))
                {
                    return false;
                }
            }
            var html = element.html();
            var style = (element.attr('style')) ? element.attr('style') : '';
            style = style.replace(/"/g, "'");
            var wrapper = '<div class="' + element.attr('class') + '" style="' + style + '">' + html + '</div>';
            wrapper = $(wrapper).removeClass('hideFromSite');
            if(mode == 'auto')
            {
                showGlobalOverlay(wrapper, useInsideDiv);
            }
            if(trigger)
            {
                $(trigger).click(function(event)
                {
                    event.preventDefault();
                    showGlobalOverlay(wrapper, useInsideDiv);
                });
            }
            if(removePadding == 'y')
            {
                $('.nwOverlayContent').css('padding', 0);
            }
            if(useCookie > 0 && mode == 'auto')
            {
                setCookie(id, 'y', useCookie);
            }
        }, timeDelay);
    });
});
