(function () {
  "use strict";

  var ENDPOINTS = {
    cartData: "/cart/data/",
    checkoutAddress: "/checkout/address/",
    checkoutPay: "/checkout/pay/",
    stripeSession: "/checkout/stripe/session/"
  };
  var EMPTY_ADDRESS = {
    label: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: ""
  };
  var EMPTY_ADDRESS_STATE = {
    label: "No address added yet",
    lines: "Add a delivery address if needed for order coordination."
  };
  var paymentElements = {
    modal: null,
    liveArea: null,
    total: null,
    status: null,
    cardNote: null,
    paypalNote: null,
    googleNote: null,
    methodName: null,
    methodCaption: null,
    preview: null,
    cardBrand: null,
    cardType: null,
    cardNumber: null,
    cardLogo: null,
    confirmButton: null,
    cardSlot: null,
    paypalSlot: null,
    appleSlot: null,
    googleSlot: null,
    cardButtons: null,
    paypalButtons: null,
    applePayContainer: null,
    applePayNote: null,
    addressLabel: null,
    addressLines: null,
    addressModal: null,
    addressForm: null,
    addressStatus: null,
    reviewModal: null,
    reviewItems: null,
    reviewEmpty: null,
    reviewItemsCount: null,
    reviewSubtotal: null,
    reviewTotal: null,
    reviewAddressLabel: null,
    reviewAddressLines: null,
    reviewStartPaymentButton: null,
    openButtons: [],
    closeButtons: [],
    reviewOpenButtons: [],
    reviewCloseButtons: [],
    methodButtons: [],
    addressOpenButtons: [],
    addressCloseButtons: []
  };
  var activeMethod = "card";
  var currentCartItems = [];
  var currentAddress = null;
  var paymentMethodContent = {
    card: {
      name: "Card",
      confirmLabel: "Pay",
      previewClass: "is-card",
      caption:
        "Secure card checkout powered by Stripe.",
      note:
        "You will be redirected to Stripe to complete your card payment securely.",
      brand: "VISA",
      type: "Credit Card",
      number: "4315  0245448  00345",
      logoClass: "fa fa-cc-mastercard payment-card-logo"
    },
    paypal: {
      name: "PayPal",
      confirmLabel: "Pay",
      previewClass: "is-paypal",
      caption:
        "PayPal is currently displayed as a frontend UI preview while backend integration is pending.",
      note:
        "PayPal checkout is disabled in frontend-only mode. Connect backend and credentials later.",
      brand: "PAYPAL",
      type: "Digital Wallet",
      number: "FAST  .  SAFE  .  ONLINE",
      logoClass: "fa fa-paypal payment-card-logo"
    },
    apple: {
      name: "Apple Pay",
      confirmLabel: "Pay",
      previewClass: "is-apple",
      caption:
        "Apple Pay is shown here for layout and interaction preview in frontend-only mode.",
      note:
        "Apple Pay is disabled in frontend-only mode. Merchant validation can be connected later.",
      brand: "APPLE",
      type: "Wallet Checkout",
      number: "APPLE  PAY  READY",
      logoClass: "fa fa-apple payment-card-logo"
    },
    google: {
      name: "Google Pay",
      confirmLabel: "Pay",
      previewClass: "is-google",
      caption:
        "Google Pay is included as a UI placeholder and can be connected when backend is ready.",
      note:
        "Google Pay is disabled in frontend-only mode. Enable gateway integration later.",
      brand: "G PAY",
      type: "Wallet Checkout",
      number: "GOOGLE  PAY  READY",
      logoClass: "fa fa-google-wallet payment-card-logo"
    }
  };
  function normalizeAddons(addons) {
    if (!Array.isArray(addons)) {
      return [];
    }

    return addons.reduce(function (result, addon) {
      if (!addon || !addon.name) {
        return result;
      }

      var addonName = String(addon.name).trim();
      if (!addonName) {
        return result;
      }

      result.push({
        name: addonName,
        price: Number(addon.price || 0)
      });

      return result;
    }, []);
  }

  function normalizeCartItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.reduce(function (result, item) {
      if (!item || !item.id) {
        return result;
      }

      var normalizedAddons = normalizeAddons(item.addons);
      var addonTotal =
        Number(item.addonTotal || 0) ||
        normalizedAddons.reduce(function (total, addon) {
          return total + (Number(addon.price) || 0);
        }, 0);
      var basePrice =
        Number(item.basePrice || 0) ||
        (Number(item.price || 0) > 0 ? Number(item.price || 0) - addonTotal : 0);
      var normalizedItem = {
        id: item.id,
        name: item.name || "",
        price: Number(item.price || basePrice + addonTotal || 0),
        basePrice: basePrice,
        addonTotal: addonTotal,
        addons: normalizedAddons,
        quantity: 1
      };
      var existingIndex = result.findIndex(function (entry) {
        return entry.id === item.id;
      });

      if (existingIndex >= 0) {
        result[existingIndex] = normalizedItem;
      } else {
        result.push(normalizedItem);
      }

      return result;
    }, []);
  }

  function getCsrfTokenFromCookie() {
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

  function requestJson(url, options) {
    return fetch(url, options || {}).then(function (response) {
      var contentType = response.headers.get("content-type") || "";
      if (contentType.indexOf("application/json") === -1) {
        throw new Error("Unexpected server response.");
      }
      return response.json().then(function (payload) {
        if (!response.ok || !payload || payload.ok === false) {
          throw new Error((payload && payload.error) || "Request failed.");
        }
        return payload;
      });
    });
  }

  function fetchCartItems() {
    return requestJson(ENDPOINTS.cartData, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }).then(function (payload) {
      currentCartItems = normalizeCartItems((payload.cart && payload.cart.items) || []);
      return currentCartItems;
    });
  }

  function readCart() {
    return normalizeCartItems(currentCartItems);
  }

  function normalizeAddress(address) {
    if (!address || typeof address !== "object") {
      return {
        label: EMPTY_ADDRESS.label,
        line1: EMPTY_ADDRESS.line1,
        line2: EMPTY_ADDRESS.line2,
        city: EMPTY_ADDRESS.city,
        postcode: EMPTY_ADDRESS.postcode,
        country: EMPTY_ADDRESS.country
      };
    }

    return {
      label: String(address.label || "").trim(),
      line1: String(address.line1 || "").trim(),
      line2: String(address.line2 || "").trim(),
      city: String(address.city || "").trim(),
      postcode: String(address.postcode || "").trim(),
      country: String(address.country || "").trim()
    };
  }

  function hasAddress(address) {
    var normalized = normalizeAddress(address);
    return !!(
      normalized.line1 ||
      normalized.line2 ||
      normalized.city ||
      normalized.postcode ||
      normalized.country
    );
  }

  function readAddress() {
    return normalizeAddress(currentAddress);
  }

  function loadAddressFromBackend() {
    return requestJson(ENDPOINTS.checkoutAddress, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }).then(function (payload) {
      currentAddress = normalizeAddress(payload.address);
      return currentAddress;
    });
  }

  function saveAddress(address) {
    var normalized = normalizeAddress(address);
    return requestJson(ENDPOINTS.checkoutAddress, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfTokenFromCookie(),
        Accept: "application/json"
      },
      body: JSON.stringify(normalized)
    }).then(function (payload) {
      currentAddress = normalizeAddress(payload.address || normalized);
      return currentAddress;
    });
  }

  function buildAddressLine(address) {
    return [address.line1, address.line2, address.city, address.postcode, address.country]
      .filter(function (part) {
        return !!part;
      })
      .join(", ");
  }

  function renderAddress(address) {
    var normalized = normalizeAddress(address);
    var label = normalized.label || EMPTY_ADDRESS_STATE.label;
    var lines = hasAddress(normalized)
      ? buildAddressLine(normalized)
      : EMPTY_ADDRESS_STATE.lines;
    if (paymentElements.addressLabel) {
      paymentElements.addressLabel.textContent = label;
    }
    if (paymentElements.addressLines) {
      paymentElements.addressLines.textContent = lines;
    }
    if (paymentElements.reviewAddressLabel) {
      paymentElements.reviewAddressLabel.textContent = label;
    }
    if (paymentElements.reviewAddressLines) {
      paymentElements.reviewAddressLines.textContent = lines;
    }
  }

  function openAddressModal() {
    if (!paymentElements.addressModal || !paymentElements.addressForm) {
      return;
    }

    var current = readAddress();
    paymentElements.addressForm.elements.label.value = current.label;
    paymentElements.addressForm.elements.line1.value = current.line1;
    paymentElements.addressForm.elements.line2.value = current.line2;
    paymentElements.addressForm.elements.city.value = current.city;
    paymentElements.addressForm.elements.postcode.value = current.postcode;
    paymentElements.addressForm.elements.country.value = current.country;

    if (paymentElements.addressStatus) {
      paymentElements.addressStatus.textContent = "";
    }

    paymentElements.addressModal.hidden = false;
    paymentElements.addressModal.setAttribute("aria-hidden", "false");
  }

  function closeAddressModal() {
    if (!paymentElements.addressModal) {
      return;
    }

    paymentElements.addressModal.hidden = true;
    paymentElements.addressModal.setAttribute("aria-hidden", "true");
  }

  function getAddressFromForm(form) {
    return {
      label: form.elements.label.value,
      line1: form.elements.line1.value,
      line2: form.elements.line2.value,
      city: form.elements.city.value,
      postcode: form.elements.postcode.value,
      country: form.elements.country.value
    };
  }

  function validateAddress(address) {
    if (
      !String(address.line1 || "").trim() ||
      !String(address.city || "").trim() ||
      !String(address.postcode || "").trim() ||
      !String(address.country || "").trim()
    ) {
      return "Please complete all required address fields.";
    }
    return "";
  }

  function getTotal(items) {
    return items.reduce(function (total, item) {
      return total + (Number(item.price) || 0);
    }, 0);
  }

  function formatMoney(value) {
    return "\u00A3" + Number(value || 0).toFixed(2);
  }

  function createReviewAddonList(item) {
    if (!item.addons || !item.addons.length) {
      return null;
    }

    var list = document.createElement("ul");
    list.className = "review-order-addon-list";

    item.addons.forEach(function (addon) {
      var row = document.createElement("li");
      var name = document.createElement("span");
      var price = document.createElement("span");

      name.textContent = addon.name;
      price.textContent = formatMoney(addon.price);

      row.appendChild(name);
      row.appendChild(price);
      list.appendChild(row);
    });

    return list;
  }

  function createReviewOrderItem(item) {
    var wrapper = document.createElement("article");
    wrapper.className = "review-order-item";

    var head = document.createElement("div");
    head.className = "review-order-item-head";

    var title = document.createElement("strong");
    title.textContent = item.name || "Selected package";

    var price = document.createElement("span");
    price.textContent = formatMoney(item.price);

    head.appendChild(title);
    head.appendChild(price);
    wrapper.appendChild(head);

    if (Number(item.basePrice || 0) > 0) {
      var meta = document.createElement("p");
      meta.className = "review-order-item-meta";
      meta.textContent =
        "Base " +
        formatMoney(item.basePrice) +
        " + Add-ons " +
        formatMoney(item.addonTotal || 0);
      wrapper.appendChild(meta);
    }

    var addonList = createReviewAddonList(item);
    if (addonList) {
      wrapper.appendChild(addonList);
    }

    return wrapper;
  }

  function renderReviewOrder(items) {
    if (!paymentElements.reviewItems) {
      return;
    }

    var normalizedItems = normalizeCartItems(items);
    paymentElements.reviewItems.innerHTML = "";

    if (!normalizedItems.length) {
      if (paymentElements.reviewEmpty) {
        paymentElements.reviewEmpty.hidden = false;
      }
    } else {
      if (paymentElements.reviewEmpty) {
        paymentElements.reviewEmpty.hidden = true;
      }

      normalizedItems.forEach(function (item) {
        paymentElements.reviewItems.appendChild(createReviewOrderItem(item));
      });
    }

    var itemCount = normalizedItems.length;
    var subtotal = getTotal(normalizedItems);

    if (paymentElements.reviewItemsCount) {
      paymentElements.reviewItemsCount.textContent = itemCount;
    }
    if (paymentElements.reviewSubtotal) {
      paymentElements.reviewSubtotal.textContent = formatMoney(subtotal);
    }
    if (paymentElements.reviewTotal) {
      paymentElements.reviewTotal.textContent = formatMoney(subtotal);
    }
    if (paymentElements.reviewStartPaymentButton) {
      paymentElements.reviewStartPaymentButton.disabled = !itemCount;
    }
  }

  function openReviewOrderModal() {
    if (!paymentElements.reviewModal) {
      return;
    }

    renderReviewOrder(readCart());
    renderAddress(readAddress());
    paymentElements.reviewModal.hidden = false;
    paymentElements.reviewModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("review-order-modal-open");
  }

  function closeReviewOrderModal() {
    if (!paymentElements.reviewModal) {
      return;
    }

    paymentElements.reviewModal.hidden = true;
    paymentElements.reviewModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("review-order-modal-open");
  }

  function showStatus(type, message) {
    if (!paymentElements.status) {
      return;
    }

    paymentElements.status.className = "payment-status " + (type ? "is-" + type : "");
    paymentElements.status.textContent = message || "";
    paymentElements.status.style.display = message ? "block" : "none";
  }

  function updateDisplayedTotal(items) {
    if (paymentElements.total) {
      paymentElements.total.textContent = formatMoney(getTotal(items));
    }
  }

  function updateLauncherState(items) {
    if (!paymentElements.openButtons.length) {
      return;
    }

    var hasItems = !!items.length;
    paymentElements.openButtons.forEach(function (button) {
      button.disabled = !hasItems;
      button.classList.toggle("is-disabled", !hasItems);
      button.setAttribute("aria-disabled", hasItems ? "false" : "true");
    });
  }

  function updateConfirmState(items) {
    if (!paymentElements.confirmButton) {
      return;
    }

    paymentElements.confirmButton.disabled = !items.length;
  }

  function setApplePayNote(message, tone) {
    if (!paymentElements.applePayNote) {
      return;
    }

    paymentElements.applePayNote.textContent = message;
    paymentElements.applePayNote.className = "payment-method-note" + (tone ? " is-" + tone : "");
  }

  function setSlotNote(element, message) {
    if (!element) {
      return;
    }

    element.textContent = message || "";
  }

  function setDisabledPreviewButton(container, label) {
    if (!container) {
      return;
    }

    container.innerHTML = "";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "payment-unavailable-btn";
    button.disabled = true;
    button.textContent = label;
    container.appendChild(button);
  }

  function syncMethodPreview(method) {
    var content = paymentMethodContent[method] || paymentMethodContent.card;

    if (paymentElements.methodCaption) {
      paymentElements.methodCaption.textContent = content.caption;
    }

    if (paymentElements.methodName) {
      paymentElements.methodName.textContent = content.name;
    }

    if (paymentElements.preview) {
      paymentElements.preview.className = "payment-card-preview " + content.previewClass;
    }

    if (paymentElements.cardBrand) {
      paymentElements.cardBrand.textContent = content.brand;
    }

    if (paymentElements.cardType) {
      paymentElements.cardType.textContent = content.type;
    }

    if (paymentElements.cardNumber) {
      paymentElements.cardNumber.textContent = content.number;
    }

    if (paymentElements.cardLogo) {
      paymentElements.cardLogo.className = content.logoClass;
      paymentElements.cardLogo.setAttribute("aria-hidden", "true");
    }

    if (paymentElements.cardSlot) {
      paymentElements.cardSlot.hidden = method !== "card";
    }

    if (paymentElements.paypalSlot) {
      paymentElements.paypalSlot.hidden = method !== "paypal";
    }

    if (paymentElements.appleSlot) {
      paymentElements.appleSlot.hidden = method !== "apple";
    }

    if (paymentElements.googleSlot) {
      paymentElements.googleSlot.hidden = method !== "google";
    }

    if (paymentElements.confirmButton) {
      paymentElements.confirmButton.textContent = content.confirmLabel;
    }

    setSlotNote(paymentElements.cardNote, paymentMethodContent.card.note);
    setSlotNote(paymentElements.paypalNote, paymentMethodContent.paypal.note);
    setSlotNote(paymentElements.googleNote, paymentMethodContent.google.note);
    setApplePayNote(paymentMethodContent.apple.note, "");
  }

  function setActiveMethod(method) {
    activeMethod = paymentMethodContent[method] ? method : "card";

    paymentElements.methodButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-payment-method") === activeMethod;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    syncMethodPreview(activeMethod);
  }

  function renderFrontendMethodPanels(items) {
    setDisabledPreviewButton(paymentElements.cardButtons, "Card Checkout Ready");
    setDisabledPreviewButton(paymentElements.paypalButtons, "PayPal Checkout Ready");
    setDisabledPreviewButton(paymentElements.applePayContainer, "Apple Pay Ready");

    if (!items.length) {
      setSlotNote(paymentElements.cardNote, "Add at least one package to continue.");
      setSlotNote(paymentElements.paypalNote, "Add at least one package to continue.");
      setSlotNote(paymentElements.googleNote, "Add at least one package to continue.");
      setApplePayNote("Add at least one package to continue.", "info");
      return;
    }

    setSlotNote(paymentElements.cardNote, paymentMethodContent.card.note);
    setSlotNote(paymentElements.paypalNote, paymentMethodContent.paypal.note);
    setSlotNote(paymentElements.googleNote, paymentMethodContent.google.note);
    setApplePayNote(paymentMethodContent.apple.note, "info");
  }

  function openPaymentModal() {
    if (!paymentElements.modal) {
      return;
    }

    paymentElements.modal.hidden = false;
    paymentElements.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("payment-modal-open");
    renderPaymentOptions(readCart());
  }

  function closePaymentModal() {
    if (!paymentElements.modal) {
      return;
    }

    closeReviewOrderModal();
    closeAddressModal();
    paymentElements.modal.hidden = true;
    paymentElements.modal.setAttribute("aria-hidden", "true");
    if (paymentElements.liveArea) {
      paymentElements.liveArea.hidden = true;
    }
    showStatus("", "");
    document.body.classList.remove("payment-modal-open");
  }

  function handleConfirmAction() {
    var items = readCart();
    var selected = paymentMethodContent[activeMethod] || paymentMethodContent.card;

    if (!items.length) {
      showStatus("info", "Add at least one package to the cart before starting payment.");
      return;
    }

    if (paymentElements.liveArea) {
      paymentElements.liveArea.hidden = false;
      paymentElements.liveArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (activeMethod === "card") {
      showStatus("info", "Redirecting to secure Stripe checkout...");
      requestJson(ENDPOINTS.stripeSession, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfTokenFromCookie(),
          Accept: "application/json"
        },
        body: JSON.stringify({})
      })
        .then(function (payload) {
          if (!payload.checkout_url) {
            throw new Error("Stripe checkout URL was not returned.");
          }
          window.location.href = payload.checkout_url;
        })
        .catch(function (error) {
          showStatus("error", error.message || "Unable to open Stripe checkout right now.");
        });
      return;
    }

    requestJson(ENDPOINTS.checkoutPay, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfTokenFromCookie(),
        Accept: "application/json"
      },
      body: JSON.stringify({ method: activeMethod })
    })
      .then(function (payload) {
        showStatus("success", payload.message || (selected.name + " payment completed successfully."));
        return fetchCartItems();
      })
      .then(function (updatedItems) {
        renderPaymentOptions(updatedItems || []);
      })
      .catch(function (error) {
        showStatus("error", error.message || "Unable to complete payment right now.");
      });
  }

  function bindReviewOrderModal() {
    paymentElements.reviewOpenButtons.forEach(function (button) {
      button.addEventListener("click", openReviewOrderModal);
    });

    paymentElements.reviewCloseButtons.forEach(function (button) {
      button.addEventListener("click", closeReviewOrderModal);
    });

    if (paymentElements.reviewStartPaymentButton) {
      paymentElements.reviewStartPaymentButton.addEventListener("click", function () {
        closeReviewOrderModal();
        openPaymentModal();
      });
    }
  }

  function bindPaymentModal() {
    paymentElements.openButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled) {
          return;
        }

        openPaymentModal();
      });
    });

    paymentElements.closeButtons.forEach(function (button) {
      button.addEventListener("click", closePaymentModal);
    });

    paymentElements.methodButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveMethod(button.getAttribute("data-payment-method"));
      });
    });

    if (paymentElements.confirmButton) {
      paymentElements.confirmButton.addEventListener("click", handleConfirmAction);
    }

    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        paymentElements.addressModal &&
        !paymentElements.addressModal.hidden
      ) {
        closeAddressModal();
        return;
      }

      if (
        event.key === "Escape" &&
        paymentElements.reviewModal &&
        !paymentElements.reviewModal.hidden
      ) {
        closeReviewOrderModal();
        return;
      }

      if (event.key === "Escape" && paymentElements.modal && !paymentElements.modal.hidden) {
        closePaymentModal();
      }
    });
  }

  function bindAddressModal() {
    paymentElements.addressOpenButtons.forEach(function (button) {
      button.addEventListener("click", openAddressModal);
    });

    paymentElements.addressCloseButtons.forEach(function (button) {
      button.addEventListener("click", closeAddressModal);
    });

    if (!paymentElements.addressForm) {
      return;
    }

    paymentElements.addressForm.addEventListener("input", function () {
      if (paymentElements.addressStatus) {
        paymentElements.addressStatus.textContent = "";
      }
    });

    paymentElements.addressForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var addressInput = getAddressFromForm(paymentElements.addressForm);
      var errorMessage = validateAddress(addressInput);

      if (errorMessage) {
        if (paymentElements.addressStatus) {
          paymentElements.addressStatus.textContent = errorMessage;
        }
        return;
      }

      saveAddress(addressInput)
        .then(function (saved) {
          renderAddress(saved);
          closeAddressModal();
        })
        .catch(function (error) {
          if (paymentElements.addressStatus) {
            paymentElements.addressStatus.textContent = error.message || "Unable to save address.";
          }
        });
    });
  }

  function renderPaymentOptions(items) {
    updateLauncherState(items);
    updateConfirmState(items);
    updateDisplayedTotal(items);
    renderReviewOrder(items);
    renderFrontendMethodPanels(items);
  }

  function cacheElements() {
    paymentElements.modal = document.querySelector("[data-payment-modal]");
    paymentElements.liveArea = document.querySelector("[data-payment-live-area]");
    paymentElements.total = document.querySelector("[data-payment-total]");
    paymentElements.status = document.querySelector("[data-payment-status]");
    paymentElements.cardNote = document.querySelector("[data-payment-card-note]");
    paymentElements.paypalNote = document.querySelector("[data-payment-paypal-note]");
    paymentElements.googleNote = document.querySelector("[data-payment-google-note]");
    paymentElements.methodName = document.querySelector("[data-payment-method-name]");
    paymentElements.methodCaption = document.querySelector("[data-payment-method-caption]");
    paymentElements.preview = document.querySelector("[data-payment-card-preview]");
    paymentElements.cardBrand = document.querySelector("[data-payment-card-brand]");
    paymentElements.cardType = document.querySelector("[data-payment-card-type]");
    paymentElements.cardNumber = document.querySelector(".payment-card-number");
    paymentElements.cardLogo = document.querySelector(".payment-card-logo");
    paymentElements.confirmButton = document.querySelector("[data-payment-confirm]");
    paymentElements.cardSlot = document.querySelector("[data-payment-card-slot]");
    paymentElements.paypalSlot = document.querySelector("[data-payment-paypal-slot]");
    paymentElements.appleSlot = document.querySelector("[data-payment-apple-slot]");
    paymentElements.googleSlot = document.querySelector("[data-payment-google-slot]");
    paymentElements.cardButtons = document.querySelector("[data-card-buttons]");
    paymentElements.paypalButtons = document.querySelector("[data-paypal-buttons]");
    paymentElements.applePayContainer = document.querySelector("[data-applepay-container]");
    paymentElements.applePayNote = document.querySelector("[data-applepay-note]");
    paymentElements.addressLabel = document.querySelector("[data-payment-address-label]");
    paymentElements.addressLines = document.querySelector("[data-payment-address-lines]");
    paymentElements.addressModal = document.querySelector("[data-address-modal]");
    paymentElements.addressForm = document.querySelector("[data-address-form]");
    paymentElements.addressStatus = document.querySelector("[data-address-status]");
    paymentElements.reviewModal = document.querySelector("[data-review-order-modal]");
    paymentElements.reviewItems = document.querySelector("[data-review-order-items]");
    paymentElements.reviewEmpty = document.querySelector("[data-review-order-empty]");
    paymentElements.reviewItemsCount = document.querySelector("[data-review-items-count]");
    paymentElements.reviewSubtotal = document.querySelector("[data-review-subtotal]");
    paymentElements.reviewTotal = document.querySelector("[data-review-total]");
    paymentElements.reviewAddressLabel = document.querySelector("[data-review-address-label]");
    paymentElements.reviewAddressLines = document.querySelector("[data-review-address-lines]");
    paymentElements.reviewStartPaymentButton = document.querySelector("[data-review-start-payment]");
    paymentElements.openButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-open-payment-modal]")
    );
    paymentElements.closeButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-payment-close]")
    );
    paymentElements.reviewOpenButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-open-review-order]")
    );
    paymentElements.reviewCloseButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-review-order-close]")
    );
    paymentElements.methodButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-payment-method]")
    );
    paymentElements.addressOpenButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-open-address-modal]")
    );
    paymentElements.addressCloseButtons = Array.prototype.slice.call(
      document.querySelectorAll("[data-address-close]")
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();
    bindReviewOrderModal();
    bindPaymentModal();
    bindAddressModal();
    currentAddress = normalizeAddress(EMPTY_ADDRESS);
    renderAddress(currentAddress);
    setActiveMethod(activeMethod);
    if (!paymentElements.total) {
      return;
    }
    Promise.all([fetchCartItems(), loadAddressFromBackend()])
      .then(function (results) {
        var items = results[0] || [];
        var address = results[1] || EMPTY_ADDRESS;
        renderAddress(address);
        renderPaymentOptions(items);
      })
      .catch(function () {
        renderPaymentOptions(readCart());
      });
  });

  document.addEventListener("bettyverse:cart-updated", function (event) {
    if (!paymentElements.total) {
      return;
    }
    currentCartItems = normalizeCartItems((event.detail && event.detail.items) || []);
    renderPaymentOptions(currentCartItems);
  });
})();
