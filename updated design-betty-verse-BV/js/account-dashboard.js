(function (window, document) {
  "use strict";

  var STORAGE_KEYS = {
    session: "bettyverse-auth-session",
    accountMock: "bettyverse-account-mock"
  };

  var ALERT_TYPES = {
    info: "is-info",
    success: "is-success",
    error: "is-error"
  };
  var DEFAULT_AVATAR = "images/logo.png";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function getTodayIsoDate() {
    var today = new Date();
    return today.toISOString().split("T")[0];
  }

  function getSession() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEYS.session);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    } catch (error) {
      return;
    }
  }

  function getSessionUserSnapshot() {
    var session = getSession() || {};
    var user = session.user || {};

    return {
      name: user.name || "BettyVerse Client",
      email: user.email || "client@bettyverse.com",
      phone: user.phone || "+234 800 000 0000",
      avatar: user.avatar || DEFAULT_AVATAR
    };
  }

  function saveSessionUserPatch(payload) {
    try {
      var session = getSession();
      if (!session || !session.user) {
        return;
      }

      session.user = Object.assign({}, session.user, payload || {});
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    } catch (error) {
      return;
    }
  }

  function getDefaultMockState() {
    var user = getSessionUserSnapshot();

    return {
      profile: {
        id: "client-001",
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        preferredContact: "email",
        birthday: "",
        eventPreferences: "Birthday, Anniversary",
        notes: "Likes modern blue-and-white decor styling with elegant gift packaging.",
        memberSince: "2026-01-18",
        loyaltyTier: "Silver"
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

  function readMockState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEYS.accountMock);
      if (!raw) {
        var seeded = getDefaultMockState();
        window.localStorage.setItem(STORAGE_KEYS.accountMock, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    } catch (error) {
      return getDefaultMockState();
    }
  }

  function saveMockState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.accountMock, JSON.stringify(state));
    } catch (error) {
      return;
    }
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
    return {
      getProfile: function () {
        return Promise.resolve(clone(readMockState().profile));
      },
      updateProfile: function (payload) {
        var state = readMockState();
        state.profile = Object.assign({}, state.profile, payload || {});
        state.profile.updatedAt = new Date().toISOString();
        saveMockState(state);
        return Promise.resolve(clone(state.profile));
      },
      getOrders: function () {
        return Promise.resolve(clone(readMockState().orders));
      },
      getBookings: function () {
        return Promise.resolve(clone(readMockState().bookings));
      },
      getAddresses: function () {
        return Promise.resolve(clone(readMockState().addresses));
      },
      saveAddress: function (payload) {
        var state = readMockState();
        var nextAddress = Object.assign({}, payload);
        if (!nextAddress.id) {
          nextAddress.id = createId("addr");
        }

        if (nextAddress.isDefault) {
          state.addresses.forEach(function (address) {
            address.isDefault = false;
          });
        }

        var existingIndex = state.addresses.findIndex(function (address) {
          return address.id === nextAddress.id;
        });

        if (existingIndex >= 0) {
          state.addresses[existingIndex] = Object.assign({}, state.addresses[existingIndex], nextAddress);
        } else {
          state.addresses.unshift(nextAddress);
        }

        saveMockState(state);
        return Promise.resolve(clone(nextAddress));
      },
      changePassword: function () {
        return Promise.resolve({ ok: true });
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

  function bindLogout() {
    var logoutButton = document.querySelector("[data-dashboard-logout]");
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener("click", function () {
      clearSession();
      window.location.href = "login/login_index.html";
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
              saveSessionUserPatch({ avatar: getProfileAvatar(snapshot.profile) });
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
            saveSessionUserPatch({ avatar: DEFAULT_AVATAR });
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
    bindLogout();
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
            saveSessionUserPatch({
              name: snapshot.profile.name || "BettyVerse Client",
              email: snapshot.profile.email || "client@bettyverse.com",
              phone: snapshot.profile.phone || "+234 800 000 0000",
              avatar: getProfileAvatar(snapshot.profile)
            });
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

    if (!getSession()) {
      showAlert("info", "Please log in to access your account dashboard.");
      window.setTimeout(function () {
        window.location.href = "login/login_index.html";
      }, 1200);
      return;
    }

    updateText("[data-dashboard-today]", formatDate(getTodayIsoDate()));
    initializeDashboard();
  });
})(window, document);
