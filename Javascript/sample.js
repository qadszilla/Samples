var mycallbacks = {};
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
