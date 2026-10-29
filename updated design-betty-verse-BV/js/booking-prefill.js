(function () {
  "use strict";

  var BOOKING_KEY = "bettyverse-booking-package";

  function formatPounds(value) {
    return "\u00A3" + Number(value || 0).toFixed(2);
  }

  function readBookingPackage() {
    try {
      var stored = window.localStorage.getItem(BOOKING_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function setField(form, name, value, append) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field || !value) {
      return;
    }
    if (append && field.value.trim()) {
      field.value = field.value.trim() + "\n\n" + value;
      return;
    }
    field.value = value;
  }

  function buildMessage(pkg) {
    var lines = [
      "Selected package: " + pkg.name,
      "Category: " + (pkg.category || "Package"),
      "Base price: " + formatPounds(pkg.basePrice),
      "Add-ons total: " + formatPounds(pkg.addonTotal),
      "Estimated total: " + formatPounds(pkg.finalPrice)
    ];
    if (Array.isArray(pkg.addons) && pkg.addons.length) {
      lines.push("");
      lines.push("Selected add-ons:");
      pkg.addons.forEach(function (addon) {
        lines.push("- " + addon.name + " (" + formatPounds(addon.price) + ")");
      });
    }
    if (pkg.summary) {
      lines.push("");
      lines.push("Package notes: " + pkg.summary);
    }
    return lines.join("\n");
  }

  function prefillBookingForm(pkg) {
    var form = document.querySelector(".booking_form");
    if (!form || !pkg || !pkg.name) {
      return;
    }
    setField(form, "eventType", pkg.category || "Package");
    setField(form, "occasionDetails", pkg.name);
    setField(form, "budget", formatPounds(pkg.finalPrice));
    setField(form, "message", buildMessage(pkg), true);

    var note = document.querySelector("[data-cart-message-note]");
    if (note) {
      note.hidden = false;
      var noteText = note.querySelector("span");
      if (noteText) {
        noteText.textContent = "Your selected package has been added to the booking notes below. You can edit anything before sending.";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    if (params.get("package") !== "1") {
      return;
    }
    prefillBookingForm(readBookingPackage());
  });
})();
