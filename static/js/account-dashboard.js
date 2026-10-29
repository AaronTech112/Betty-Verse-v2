(function (window, document) {
  "use strict";

  var ENDPOINTS = {
    data: "/dashboard/data/",
    profile: "/dashboard/profile/",
    addressSave: "/dashboard/address/save/",
    passwordChange: "/dashboard/password/change/"
  };

  var ALERT_TYPES = {
    info: "is-info",
    success: "is-success",
    error: "is-error"
  };
  var DEFAULT_AVATAR = "images/logo.png";

  function getDashboardBootstrapProfile() {
    try {
      var node = document.getElementById("dashboard-bootstrap-data");
      if (!node || !node.textContent) {
        return null;
      }
      var parsed = JSON.parse(node.textContent);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function getTodayIsoDate() {
    var today = new Date();
    return today.toISOString().split("T")[0];
  }

  function getSessionUserSnapshot() {
    var user = getDashboardBootstrapProfile() || {};

    return {
      id: user.id || "client-001",
      name: user.name || "BettyVerse Client",
      email: user.email || "",
      phone: user.phone || "",
      preferredContact: user.preferredContact || "email",
      birthday: user.birthday || "",
      eventPreferences: user.eventPreferences || "",
      notes: user.notes || "",
      loyaltyTier: user.loyaltyTier || "Standard",
      memberSince: user.memberSince || "",
      avatar: user.avatar || DEFAULT_AVATAR
    };
  }

  function getDefaultMockState() {
    var user = getSessionUserSnapshot();

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        preferredContact: user.preferredContact,
        birthday: user.birthday,
        eventPreferences: user.eventPreferences,
        notes: user.notes,
        memberSince: user.memberSince,
        loyaltyTier: user.loyaltyTier
      },
      orders: [
        {
          id: "ORD-1132",
          date: "2026-04-02",
          total: 269.0,
          status: "paid",
          items: 2,
          summary: "Birthday Bliss + Premium Cake Add-on"
        },
        {
          id: "ORD-1098",
          date: "2026-03-11",
          total: 185.0,
          status: "processing",
          items: 1,
          summary: "Festival Magic Set"
        }
      ],
      bookings: [
        {
          id: "BK-704",
          eventType: "Anniversary Setup",
          eventDate: "2026-05-04",
          createdAt: "2026-04-12",
          venue: "The Glens Hotel, Dunfermline",
          packageName: "Anniversary Glow",
          guestCount: 18,
          status: "confirmed",
          notes: "Indoor room styling with candles and floral centerpieces."
        },
        {
          id: "BK-667",
          eventType: "Birthday Surprise",
          eventDate: "2026-06-21",
          createdAt: "2026-04-09",
          venue: "Client Residence",
          packageName: "Birthday Bliss",
          guestCount: 12,
          status: "pending",
          notes: "Morning delivery and setup by 7:30 AM."
        }
      ],
      addresses: [
        {
          id: "addr-home",
          label: "Home",
          recipient: user.name,
          phone: user.phone,
          line1: "59 Don Road",
          line2: "",
          city: "Dunfermline",
          region: "Scotland",
          postcode: "KY11 4NH",
          country: "United Kingdom",
          isDefault: true
        },
        {
          id: "addr-office",
          label: "Office",
          recipient: user.name,
          phone: user.phone,
          line1: "26 Queen Anne Street",
          line2: "Suite 4B",
          city: "Dunfermline",
          region: "Scotland",
          postcode: "KY12 8DA",
          country: "United Kingdom",
          isDefault: false
        }
      ]
    };
  }

  function normalizeStatus(status) {
    return String(status || "").toLowerCase().replace(/\s+/g, "-");
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatCurrency(value) {
    var amount = Number(value || 0);
    return "GBP " + amount.toFixed(2);
  }

  function buildAdapter() {
    function fetchDashboardData() {
      return requestJson(ENDPOINTS.data, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }).catch(function () {
        return {
          ok: true,
          profile: getDefaultMockState().profile,
          orders: [],
          bookings: [],
          addresses: []
        };
      });
    }

    return {
      getProfile: function () {
        return fetchDashboardData().then(function (data) {
          return clone(data.profile || {});
        });
      },
      updateProfile: function (payload) {
        return requestJson(ENDPOINTS.profile, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfTokenFromCookie(),
            Accept: "application/json"
          },
          body: JSON.stringify(payload || {})
        }).then(function (data) {
          return clone(data.profile || {});
        });
      },
      getOrders: function () {
        return fetchDashboardData().then(function (data) {
          return clone(data.orders || []);
        });
      },
      getBookings: function () {
        return fetchDashboardData().then(function (data) {
          return clone(data.bookings || []);
        });
      },
      getAddresses: function () {
        return fetchDashboardData().then(function (data) {
          return clone(data.addresses || []);
        });
      },
      saveAddress: function (payload) {
        return requestJson(ENDPOINTS.addressSave, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfTokenFromCookie(),
            Accept: "application/json"
          },
          body: JSON.stringify(payload || {})
        }).then(function (data) {
          return clone(data.address || {});
        });
      },
      changePassword: function (payload) {
        return requestJson(ENDPOINTS.passwordChange, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCsrfTokenFromCookie(),
            Accept: "application/json"
          },
          body: JSON.stringify(payload || {})
        }).then(function () {
          return { ok: true };
        });
      }
    };
  }

  function createStatusBadge(status) {
    var badge = document.createElement("span");
    var cleanStatus = normalizeStatus(status) || "pending";
    badge.className = "account-status status-" + cleanStatus;
    badge.textContent = status || "Pending";
    return badge;
  }

  function renderOrders(listElement, orders) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";

    if (!orders || !orders.length) {
      listElement.innerHTML = '<p class="account-empty-state">No orders yet.</p>';
      return;
    }

    orders.forEach(function (order) {
      var row = document.createElement("article");
      row.className = "account-record-card";

      var top = document.createElement("div");
      top.className = "account-record-head";

      var id = document.createElement("strong");
      id.className = "account-record-id";
      id.textContent = order.id;

      top.appendChild(id);
      top.appendChild(createStatusBadge(order.status));

      var summary = document.createElement("p");
      summary.className = "account-record-summary";
      summary.textContent = order.summary || "Package order";

      var meta = document.createElement("div");
      meta.className = "account-record-meta";
      meta.innerHTML =
        "<span><i class='fa fa-calendar'></i> " +
        formatDate(order.date) +
        "</span><span><i class='fa fa-shopping-bag'></i> " +
        (order.items || 0) +
        " item(s)</span><strong>" +
        formatCurrency(order.total) +
        "</strong>";

      row.appendChild(top);
      row.appendChild(summary);
      row.appendChild(meta);
      listElement.appendChild(row);
    });
  }

  function renderBookings(listElement, bookings) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";

    if (!bookings || !bookings.length) {
      listElement.innerHTML = '<p class="account-empty-state">No bookings yet.</p>';
      return;
    }

    bookings.forEach(function (booking) {
      var row = document.createElement("article");
      row.className = "account-record-card";

      var top = document.createElement("div");
      top.className = "account-record-head";

      var id = document.createElement("strong");
      id.className = "account-record-id";
      id.textContent = booking.id;

      top.appendChild(id);
      top.appendChild(createStatusBadge(booking.status));

      var title = document.createElement("h3");
      title.className = "account-record-title";
      title.textContent = booking.eventType + " - " + (booking.packageName || "Custom Package");

      var meta = document.createElement("div");
      meta.className = "account-record-meta";
      meta.innerHTML =
        "<span><i class='fa fa-calendar-check-o'></i> " +
        formatDate(booking.eventDate) +
        "</span><span><i class='fa fa-map-marker'></i> " +
        (booking.venue || "Venue to be confirmed") +
        "</span><span><i class='fa fa-users'></i> " +
        (booking.guestCount || 0) +
        " guests</span>";

      var note = document.createElement("p");
      note.className = "account-record-summary";
      note.textContent = booking.notes || "No additional booking notes.";

      row.appendChild(top);
      row.appendChild(title);
      row.appendChild(meta);
      row.appendChild(note);
      listElement.appendChild(row);
    });
  }

  function renderAddresses(listElement, addresses) {
    if (!listElement) {
      return;
    }

    listElement.innerHTML = "";

    if (!addresses || !addresses.length) {
      listElement.innerHTML = '<p class="account-empty-state">No saved addresses yet.</p>';
      return;
    }

    addresses.forEach(function (address) {
      var card = document.createElement("article");
      card.className = "account-address-card";

      if (address.isDefault) {
        card.classList.add("is-default");
      }

      var title = document.createElement("div");
      title.className = "account-address-head";
      title.innerHTML =
        "<strong>" +
        (address.label || "Address") +
        "</strong>" +
        (address.isDefault ? "<span>Default</span>" : "");

      var lines = [address.line1, address.line2, address.city, address.region, address.postcode, address.country]
        .filter(Boolean)
        .join(", ");

      var copy = document.createElement("p");
      copy.className = "account-address-copy";
      copy.textContent = lines || "-";

      var recipient = document.createElement("small");
      recipient.className = "account-address-recipient";
      recipient.textContent = (address.recipient || "-") + " - " + (address.phone || "-");

      card.appendChild(title);
      card.appendChild(copy);
      card.appendChild(recipient);
      listElement.appendChild(card);
    });
  }

  function updateText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function setActiveTab(tabKey) {
    document.querySelectorAll("[data-dashboard-tab-target]").forEach(function (button) {
      var isActive = button.getAttribute("data-dashboard-tab-target") === tabKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.querySelectorAll("[data-dashboard-panel]").forEach(function (panel) {
      var isPanelActive = panel.getAttribute("data-dashboard-panel") === tabKey;
      panel.hidden = !isPanelActive;
    });
  }

  function showAlert(type, message) {
    var alert = document.querySelector("[data-dashboard-alert]");
    if (!alert) {
      return;
    }

    alert.className = "dashboard-alert " + (ALERT_TYPES[type] || ALERT_TYPES.info);
    alert.textContent = message;
    alert.hidden = false;

    window.setTimeout(function () {
      alert.hidden = true;
    }, 3200);
  }

  function fillProfileForm(profile) {
    var form = document.querySelector("[data-profile-form]");
    if (!form || !profile) {
      return;
    }

    var values = {
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      preferredContact: profile.preferredContact || "email",
      birthday: profile.birthday || "",
      eventPreferences: profile.eventPreferences || "",
      notes: profile.notes || ""
    };

    Object.keys(values).forEach(function (key) {
      var field = form.querySelector("[name='" + key + "']");
      if (field) {
        field.value = values[key];
      }
    });
  }

  function getProfileAvatar(profile) {
    return (profile && profile.avatar) || DEFAULT_AVATAR;
  }

  function updateAvatar(selector, src) {
    var element = document.querySelector(selector);
    if (!element) {
      return;
    }

    element.setAttribute("src", src || DEFAULT_AVATAR);
  }

  function serializeForm(form) {
    var payload = {};
    if (!form) {
      return payload;
    }

    Array.prototype.slice.call(form.elements).forEach(function (field) {
      if (!field.name || field.disabled) {
        return;
      }

      if (field.type === "checkbox") {
        payload[field.name] = !!field.checked;
        return;
      }

      payload[field.name] = field.value;
    });

    return payload;
  }

  function bindTabs() {
    document.querySelectorAll("[data-dashboard-tab-target]").forEach(function (button) {
      button.addEventListener("click", function () {
        var tabKey = button.getAttribute("data-dashboard-tab-target");
        setActiveTab(tabKey);
      });
    });
  }

  function bindAvatarControls(adapter, snapshot) {
    var input = document.querySelector("[data-profile-avatar-input]");
    var resetButton = document.querySelector("[data-profile-avatar-reset]");

    if (input) {
      input.addEventListener("change", function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) {
          return;
        }

        if (file.type && file.type.indexOf("image/") !== 0) {
          showAlert("error", "Please choose an image file for your profile picture.");
          input.value = "";
          return;
        }

        var reader = new window.FileReader();
        reader.onload = function (loadEvent) {
          var nextAvatar = loadEvent && loadEvent.target ? loadEvent.target.result : "";
          if (!nextAvatar) {
            showAlert("error", "Unable to read that image. Please try another file.");
            return;
          }

          adapter
            .updateProfile({ avatar: nextAvatar })
            .then(function (profile) {
              snapshot.profile = Object.assign({}, snapshot.profile, profile);
              updateAvatar("[data-dashboard-avatar]", getProfileAvatar(snapshot.profile));
              updateAvatar("[data-profile-avatar-preview]", getProfileAvatar(snapshot.profile));
              showAlert("success", "Profile picture updated.");
              input.value = "";
            })
            .catch(function (error) {
              showAlert("error", error.message || "Unable to update profile picture.");
            });
        };

        reader.readAsDataURL(file);
      });
    }

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        adapter
          .updateProfile({ avatar: DEFAULT_AVATAR })
          .then(function (profile) {
            snapshot.profile = Object.assign({}, snapshot.profile, profile);
            updateAvatar("[data-dashboard-avatar]", getProfileAvatar(snapshot.profile));
            updateAvatar("[data-profile-avatar-preview]", getProfileAvatar(snapshot.profile));
            showAlert("success", "Demo logo restored as profile picture.");
          })
          .catch(function (error) {
            showAlert("error", error.message || "Unable to reset profile picture.");
          });
      });
    }
  }

  function initializeDashboard() {
    var adapter = buildAdapter();
    var snapshot = {
      profile: null,
      orders: [],
      bookings: [],
      addresses: []
    };

    bindTabs();
    bindAvatarControls(adapter, snapshot);
    setActiveTab("overview");

    Promise.all([adapter.getProfile(), adapter.getOrders(), adapter.getBookings(), adapter.getAddresses()])
      .then(function (results) {
        snapshot.profile = results[0] || {};
        snapshot.orders = results[1] || [];
        snapshot.bookings = results[2] || [];
        snapshot.addresses = results[3] || [];

        updateText("[data-dashboard-user-name]", snapshot.profile.name || "BettyVerse Client");
        updateText("[data-dashboard-user-email]", snapshot.profile.email || "client@bettyverse.com");
        updateText("[data-dashboard-tier]", snapshot.profile.loyaltyTier || "Standard");
        updateText("[data-dashboard-member-since]", formatDate(snapshot.profile.memberSince));
        updateText("[data-dashboard-phone]", snapshot.profile.phone || "-");
        updateAvatar("[data-dashboard-avatar]", getProfileAvatar(snapshot.profile));
        updateAvatar("[data-profile-avatar-preview]", getProfileAvatar(snapshot.profile));

        updateText("[data-dashboard-orders-count]", String(snapshot.orders.length));
        updateText(
          "[data-dashboard-active-bookings-count]",
          String(
            snapshot.bookings.filter(function (booking) {
              return normalizeStatus(booking.status) !== "completed";
            }).length
          )
        );
        updateText(
          "[data-dashboard-default-address-count]",
          String(
            snapshot.addresses.filter(function (address) {
              return !!address.isDefault;
            }).length
          )
        );

        fillProfileForm(snapshot.profile);
        renderOrders(document.querySelector("[data-orders-list]"), snapshot.orders);
        renderOrders(document.querySelector("[data-overview-orders-list]"), snapshot.orders.slice(0, 2));
        renderBookings(document.querySelector("[data-bookings-list]"), snapshot.bookings);
        renderBookings(document.querySelector("[data-overview-bookings-list]"), snapshot.bookings.slice(0, 2));
        renderAddresses(document.querySelector("[data-addresses-list]"), snapshot.addresses);
      })
      .catch(function (error) {
        showAlert("error", error.message || "Unable to load your dashboard right now.");
      });

    var profileForm = document.querySelector("[data-profile-form]");
    if (profileForm) {
      profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var payload = serializeForm(profileForm);

        adapter
          .updateProfile(payload)
          .then(function (profile) {
            snapshot.profile = Object.assign({}, snapshot.profile, profile);
            updateText("[data-dashboard-user-name]", snapshot.profile.name || "BettyVerse Client");
            updateText("[data-dashboard-user-email]", snapshot.profile.email || "client@bettyverse.com");
            updateText("[data-dashboard-phone]", snapshot.profile.phone || "-");
            updateAvatar("[data-dashboard-avatar]", getProfileAvatar(snapshot.profile));
            updateAvatar("[data-profile-avatar-preview]", getProfileAvatar(snapshot.profile));
            showAlert("success", "Profile settings saved.");
          })
          .catch(function (error) {
            showAlert("error", error.message || "Unable to save profile settings.");
          });
      });
    }

    var addressForm = document.querySelector("[data-address-form]");
    if (addressForm) {
      addressForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var payload = serializeForm(addressForm);
        payload.isDefault = !!payload.isDefault;

        adapter
          .saveAddress(payload)
          .then(function () {
            return adapter.getAddresses();
          })
          .then(function (addresses) {
            snapshot.addresses = addresses || [];
            renderAddresses(document.querySelector("[data-addresses-list]"), snapshot.addresses);
            updateText(
              "[data-dashboard-default-address-count]",
              String(
                snapshot.addresses.filter(function (address) {
                  return !!address.isDefault;
                }).length
              )
            );
            addressForm.reset();
            showAlert("success", "Address saved.");
          })
          .catch(function (error) {
            showAlert("error", error.message || "Unable to save address.");
          });
      });
    }

    var securityForm = document.querySelector("[data-security-form]");
    if (securityForm) {
      securityForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var payload = serializeForm(securityForm);

        if (!payload.newPassword || payload.newPassword.length < 8) {
          showAlert("error", "New password must be at least 8 characters.");
          return;
        }

        if (payload.newPassword !== payload.confirmPassword) {
          showAlert("error", "Password confirmation does not match.");
          return;
        }

        adapter
          .changePassword({
            currentPassword: payload.currentPassword,
            newPassword: payload.newPassword
          })
          .then(function () {
            securityForm.reset();
            showAlert("success", "Password updated.");
          })
          .catch(function (error) {
            showAlert("error", error.message || "Unable to update password.");
          });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-account-dashboard-root]");
    if (!root) {
      return;
    }

    updateText("[data-dashboard-today]", formatDate(getTodayIsoDate()));
    initializeDashboard();
  });
})(window, document);
