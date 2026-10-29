(function () {
  "use strict";

  var endpoints = {
    data: "/cart/data/",
    add: "/cart/add/",
    remove: "/cart/remove/",
    clear: "/cart/clear/"
  };

  function getCsrfToken() {
    var cookieString = document.cookie || "";
    var parts = cookieString.split(";");
    for (var i = 0; i < parts.length; i += 1) {
      var cookie = parts[i].trim();
      if (cookie.indexOf("csrftoken=") === 0) {
        return decodeURIComponent(cookie.slice("csrftoken=".length));
      }
    }
    return "";
  }

  function parseJsonScript(id) {
    var node = document.getElementById(id);
    if (!node || !node.textContent) {
      return null;
    }
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return null;
    }
  }

  async function requestJson(url, options) {
    var response = await fetch(url, options || {});
    var contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false, authRequired: true, data: null };
    }
    var data = await response.json();
    return { ok: response.ok && !!data.ok, data: data, authRequired: false };
  }

  async function fetchCartState() {
    var result = await requestJson(endpoints.data, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    return result.ok ? result.data.cart : null;
  }

  async function postCart(url, payload) {
    var result = await requestJson(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
        Accept: "application/json"
      },
      body: JSON.stringify(payload || {})
    });
    if (result.authRequired) {
      var next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = "/login/?next=" + next;
      return null;
    }
    return result.ok ? result.data.cart : null;
  }

  function formatPrice(value) {
    return "\u00A3" + Number(value || 0).toFixed(2);
  }

  function updateCartBadges(cartState) {
    var count = Number((cartState && cartState.items_count) || 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (badge) {
      badge.textContent = count;
      badge.classList.toggle("has-items", count > 0);
    });
  }

  function dispatchCartEvent(cartState) {
    var items = (cartState && cartState.items) || [];
    document.dispatchEvent(
      new CustomEvent("bettyverse:cart-updated", {
        detail: { items: items }
      })
    );
  }

  function createAddonDetails(item) {
    if (!item.addons || !item.addons.length) {
      return null;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "cart-item-addons";

    var heading = document.createElement("strong");
    heading.className = "cart-item-addon-title";
    heading.textContent = "Selected add-ons";
    wrapper.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "cart-item-addon-list";

    item.addons.forEach(function (addon) {
      var row = document.createElement("li");
      var name = document.createElement("span");
      var price = document.createElement("span");
      name.textContent = addon.name;
      price.textContent = formatPrice(addon.price);
      row.appendChild(name);
      row.appendChild(price);
      list.appendChild(row);
    });

    wrapper.appendChild(list);

    var total = document.createElement("p");
    total.className = "cart-item-addon-total";
    total.textContent = "Base " + formatPrice(item.basePrice) + " + Add-ons " + formatPrice(item.addonTotal);
    wrapper.appendChild(total);

    return wrapper;
  }

  function createCartItem(item, onRemove) {
    var article = document.createElement("article");
    article.className = "cart-item";

    var media = document.createElement("div");
    media.className = "cart-item-media";
    var image = document.createElement("img");
    image.src = item.image || "";
    image.alt = item.name || "Package image";
    media.appendChild(image);

    var main = document.createElement("div");
    main.className = "cart-item-main";

    var head = document.createElement("div");
    head.className = "cart-item-head";

    var headCopy = document.createElement("div");
    var tag = document.createElement("span");
    tag.className = "blog_meta";
    tag.textContent = item.category || "Package";
    var title = document.createElement("h3");
    title.textContent = item.name || "Selected package";
    headCopy.appendChild(tag);
    headCopy.appendChild(title);

    var price = document.createElement("strong");
    price.className = "cart-item-price";
    price.textContent = formatPrice(item.price);

    head.appendChild(headCopy);
    head.appendChild(price);

    var summary = document.createElement("p");
    summary.className = "cart-item-copy";
    summary.textContent = item.summary || "";

    var footer = document.createElement("div");
    footer.className = "cart-item-footer";
    var footerActions = document.createElement("div");
    footerActions.className = "cart-item-actions";
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cart-remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      onRemove(item.id);
    });
    footerActions.appendChild(remove);
    footer.appendChild(footerActions);

    main.appendChild(head);
    main.appendChild(summary);
    var addonDetails = createAddonDetails(item);
    if (addonDetails) {
      main.appendChild(addonDetails);
    }
    main.appendChild(footer);

    article.appendChild(media);
    article.appendChild(main);
    return article;
  }

  function renderCart(cartState, removeHandler) {
    var list = document.querySelector("[data-cart-items]");
    var items = (cartState && cartState.items) || [];
    var count = Number((cartState && cartState.items_count) || 0);
    var totalValue = Number((cartState && cartState.total) || 0);

    if (list) {
      var emptyState = document.querySelector("[data-cart-empty]");
      var itemsCount = document.querySelector("[data-cart-items-count]");
      var total = document.querySelector("[data-cart-total]");
      var contactLink = document.querySelector("[data-cart-contact-link]");

      list.innerHTML = "";
      if (!items.length) {
        if (emptyState) {
          emptyState.hidden = false;
        }
      } else {
        if (emptyState) {
          emptyState.hidden = true;
        }
        items.forEach(function (item) {
          list.appendChild(createCartItem(item, removeHandler));
        });
      }

      if (itemsCount) {
        itemsCount.textContent = count;
      }
      if (total) {
        total.textContent = formatPrice(totalValue);
      }
      if (contactLink) {
        contactLink.classList.toggle("is-disabled", !items.length);
      }
    }

    updateCartBadges(cartState);
    dispatchCartEvent(cartState);
  }

  function getSelectedAddonIds(card) {
    var checked = card.querySelectorAll(".package-addon-input:checked");
    return Array.prototype.slice.call(checked)
      .map(function (input) {
        return Number(input.dataset.addonId || input.value || 0);
      })
      .filter(function (id) {
        return id > 0;
      });
  }

  function getSelectedAddonNames(card) {
    var checked = card.querySelectorAll(".package-addon-input:checked");
    return Array.prototype.slice.call(checked)
      .map(function (input) {
        return String(input.dataset.addonName || "").trim();
      })
      .filter(function (name) {
        return !!name;
      });
  }

  function getSelectedAddonRows(card) {
    var checked = card.querySelectorAll(".package-addon-input:checked");
    return Array.prototype.slice.call(checked)
      .map(function (input) {
        return {
          name: String(input.dataset.addonName || "").trim(),
          price: Number(input.dataset.addonPrice || 0)
        };
      })
      .filter(function (row) {
        return !!row.name;
      });
  }

  function markButtonAdded(button) {
    var original = button.dataset.defaultLabel || button.textContent;
    button.dataset.defaultLabel = original;
    button.classList.add("is-added");
    button.textContent = "Added to Cart";
    window.setTimeout(function () {
      button.classList.remove("is-added");
      button.textContent = original;
    }, 1200);
  }

  function bindAddToCartButtons(renderState) {
    document.querySelectorAll("[data-add-to-cart]").forEach(function (button) {
      button.addEventListener("click", async function () {
        var card = button.closest(".package-card");
        if (!card) {
          return;
        }
        var packageIdRaw = String(card.dataset.packageBackendId || card.dataset.packageId || "").trim();
        var packageId = Number(packageIdRaw || 0);
        var hasNumericId = Number.isFinite(packageId) && packageId > 0;
        var packageSlug = hasNumericId ? String(card.dataset.packageSlug || card.dataset.packageId || "").trim() : packageIdRaw;
        var packageName = String(card.dataset.packageName || "").trim();
        var packageCategory = String(card.dataset.packageCategory || "").trim();
        var packagePrice = Number(
          card.dataset.packageBasePrice ||
          card.dataset.packagePrice ||
          0
        );
        var packageSummary = String(card.dataset.packageSummary || "").trim();
        var packageImage = String(card.dataset.packageImage || "").trim();
        var cardItem = card.closest(".package-card-item");
        var packageTags = String((cardItem && cardItem.dataset && cardItem.dataset.tags) || "").trim();
        if (!hasNumericId && !packageName && !packageIdRaw) {
          return;
        }
        var addonIds = getSelectedAddonIds(card);
        var addonNames = getSelectedAddonNames(card);
        var addonRows = getSelectedAddonRows(card);
        var cartState = await postCart(endpoints.add, {
          package_id: hasNumericId ? packageId : null,
          package_slug: packageSlug,
          package_name: packageName,
          package_category: packageCategory,
          package_price: Number.isFinite(packagePrice) ? packagePrice : 0,
          package_summary: packageSummary,
          package_image: packageImage,
          package_tags: packageTags,
          addon_ids: addonIds,
          addon_names: addonNames,
          addon_rows: addonRows
        });
        if (!cartState) {
          return;
        }
        markButtonAdded(button);
        renderState(cartState);
      });
    });
  }

  function bindClearCart(renderState) {
    var clearButton = document.querySelector("[data-clear-cart]");
    if (!clearButton) {
      return;
    }
    clearButton.addEventListener("click", async function () {
      var cartState = await postCart(endpoints.clear, {});
      if (!cartState) {
        return;
      }
      renderState(cartState);
    });
  }

  function buildBookingMessage(items) {
    var lines = ["Selected packages from cart:"];
    items.forEach(function (item) {
      var addonText = "";
      if (item.addons && item.addons.length) {
        addonText =
          " | Add-ons: " +
          item.addons.map(function (addon) {
            return addon.name + " (" + formatPrice(addon.price) + ")";
          }).join(", ");
      }
      lines.push("- " + item.name + " (" + formatPrice(item.price) + ")" + addonText);
    });
    return lines.join("\n");
  }

  async function hydrateBookingFormFromCart() {
    var messageField = document.querySelector('textarea[name="special_requests"]');
    if (!messageField) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    if (params.get("cart") !== "1" || messageField.value.trim()) {
      return;
    }

    var cartState = await fetchCartState();
    if (!cartState || !cartState.items || !cartState.items.length) {
      return;
    }

    messageField.value = buildBookingMessage(cartState.items);
    var note = document.querySelector("[data-cart-message-note]");
    if (note) {
      note.hidden = false;
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var initialCart = parseJsonScript("cart-bootstrap-data");
    var state = initialCart;
    if (!state) {
      state = await fetchCartState();
    }
    if (!state) {
      state = { items: [], items_count: 0, total: 0 };
    }

    var renderState = async function (cartState) {
      renderCart(cartState, async function (itemId) {
        var nextState = await postCart(endpoints.remove, { item_id: itemId });
        if (nextState) {
          renderState(nextState);
        }
      });
    };

    renderState(state);
    bindAddToCartButtons(renderState);
    bindClearCart(renderState);
    await hydrateBookingFormFromCart();
  });
})();
