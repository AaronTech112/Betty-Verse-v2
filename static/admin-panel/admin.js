(function (window, document) {
  "use strict";

  var STORAGE_KEYS = {
    auth: "bettyverse-admin-auth",
    state: "bettyverse-admin-state",
    publicCatalog: "bettyverse-package-catalog"
  };

  var DEMO_ADMIN = {
    email: "admin@bettyverse.com",
    password: "admin123",
    name: "BettyVerse Admin"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function readJson(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function formatMoney(value) {
    return "GBP " + Number(value || 0).toFixed(2);
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

  function getDefaultState() {
    return {
      packages: [
        {
          id: "pkg-bday-luxe-arch",
          name: "Luxury Birthday Arch",
          category: "Birthday",
          basePrice: 150,
          summary: "Premium blue-and-gold balloon arch with focal plinth and styled reveal corner.",
          image: "../images/logo.png",
          tags: ["birthday", "balloons", "luxe"],
          status: "published",
          publishedAt: "2026-04-12T10:00:00.000Z",
          updatedAt: "2026-04-12T10:00:00.000Z"
        },
        {
          id: "pkg-anniversary-dining",
          name: "Anniversary Dining Glow",
          category: "Anniversary",
          basePrice: 210,
          summary: "Intimate dining setup with layered candles, florals, and a soft romantic palette.",
          image: "../images/logo.png",
          tags: ["anniversary", "dining", "romantic"],
          status: "draft",
          publishedAt: "",
          updatedAt: "2026-04-17T15:20:00.000Z"
        },
        {
          id: "pkg-work-surprise",
          name: "Workplace Celebration Pop-Up",
          category: "Surprise",
          basePrice: 135,
          summary: "Compact office surprise styling package with gift table, balloons, and branded details.",
          image: "../images/logo.png",
          tags: ["workplace", "surprise", "office"],
          status: "published",
          publishedAt: "2026-04-14T09:15:00.000Z",
          updatedAt: "2026-04-14T09:15:00.000Z"
        }
      ],
      bookings: [
        {
          id: "BK-9031",
          customerName: "Amina Yusuf",
          email: "amina@example.com",
          phone: "+234 803 000 1122",
          eventType: "Birthday Surprise",
          packageName: "Luxury Birthday Arch",
          eventDate: "2026-05-16",
          venue: "Lekki Phase 1, Lagos",
          budget: "GBP 180 - GBP 250",
          notes: "Blue and silver theme. Setup needed before 8:00 AM.",
          status: "pending",
          createdAt: "2026-04-23T12:10:00.000Z"
        },
        {
          id: "BK-9032",
          customerName: "Samuel Peters",
          email: "samuel@example.com",
          phone: "+234 809 110 2211",
          eventType: "Anniversary Setup",
          packageName: "Anniversary Dining Glow",
          eventDate: "2026-05-22",
          venue: "The George Hotel, Edinburgh",
          budget: "GBP 220 - GBP 320",
          notes: "Need candles, red accents, and dinner-table styling.",
          status: "approved",
          createdAt: "2026-04-24T09:40:00.000Z"
        },
        {
          id: "BK-9033",
          customerName: "Lina Okafor",
          email: "lina@example.com",
          phone: "+234 802 555 3399",
          eventType: "Workplace Celebration",
          packageName: "Workplace Celebration Pop-Up",
          eventDate: "2026-05-02",
          venue: "Victoria Island office suite",
          budget: "GBP 100 - GBP 160",
          notes: "Keep it polished and brand-friendly, no loud color mix.",
          status: "confirmed",
          createdAt: "2026-04-21T16:30:00.000Z"
        }
      ],
      orders: [
        {
          id: "ORD-7714",
          customerName: "Mariam Bello",
          email: "mariam@example.com",
          total: 260,
          paymentStatus: "paid",
          fulfillmentStatus: "processing",
          items: [
            { name: "Luxury Birthday Arch", qty: 1, price: 150 },
            { name: "Personalised Name Sign", qty: 1, price: 25 },
            { name: "Photographer", qty: 1, price: 85 }
          ],
          shippingNote: "Deliver add-ons to venue manager by 6 PM.",
          createdAt: "2026-04-22T14:05:00.000Z"
        },
        {
          id: "ORD-7715",
          customerName: "Emeka Cole",
          email: "emeka@example.com",
          total: 135,
          paymentStatus: "awaiting-payment",
          fulfillmentStatus: "pending",
          items: [
            { name: "Workplace Celebration Pop-Up", qty: 1, price: 135 }
          ],
          shippingNote: "Hold until payment clears.",
          createdAt: "2026-04-25T08:55:00.000Z"
        },
        {
          id: "ORD-7716",
          customerName: "Grace Arthur",
          email: "grace@example.com",
          total: 210,
          paymentStatus: "paid",
          fulfillmentStatus: "fulfilled",
          items: [
            { name: "Anniversary Dining Glow", qty: 1, price: 210 }
          ],
          shippingNote: "Completed and client confirmed delivery.",
          createdAt: "2026-04-20T19:20:00.000Z"
        }
      ]
    };
  }

  function migratePublicCatalog(packages) {
    var published = packages
      .filter(function (entry) {
        return entry.status === "published";
      })
      .map(function (entry) {
        return {
          id: entry.id,
          name: entry.name,
          category: entry.category,
          image: entry.image,
          summary: entry.summary,
          basePrice: Number(entry.basePrice || 0)
        };
      });

    writeJson(STORAGE_KEYS.publicCatalog, published);
  }

  function readState() {
    var state = readJson(STORAGE_KEYS.state);
    if (!state) {
      state = getDefaultState();
      writeJson(STORAGE_KEYS.state, state);
      migratePublicCatalog(state.packages);
    }
    return state;
  }

  function saveState(state) {
    writeJson(STORAGE_KEYS.state, state);
    migratePublicCatalog(state.packages);
    return clone(state);
  }

  function buildStore() {
    return {
      auth: {
        getSession: function () {
          return readJson(STORAGE_KEYS.auth);
        },
        login: function (payload) {
          if (
            !payload ||
            payload.email !== DEMO_ADMIN.email ||
            payload.password !== DEMO_ADMIN.password
          ) {
            return Promise.reject(new Error("Invalid admin credentials."));
          }

          var session = {
            name: DEMO_ADMIN.name,
            email: DEMO_ADMIN.email,
            loggedInAt: new Date().toISOString()
          };

          writeJson(STORAGE_KEYS.auth, session);
          return Promise.resolve(session);
        },
        logout: function () {
          window.localStorage.removeItem(STORAGE_KEYS.auth);
          return Promise.resolve();
        }
      },
      packages: {
        list: function () {
          return Promise.resolve(clone(readState().packages));
        },
        save: function (payload) {
          var state = readState();
          var next = Object.assign({}, payload);
          var existingIndex = state.packages.findIndex(function (entry) {
            return entry.id === next.id;
          });

          next.id = next.id || makeId("pkg");
          next.basePrice = Number(next.basePrice || 0);
          next.tags = Array.isArray(next.tags) ? next.tags : [];
          next.updatedAt = new Date().toISOString();
          if (next.status === "published" && !next.publishedAt) {
            next.publishedAt = new Date().toISOString();
          }

          if (existingIndex >= 0) {
            state.packages[existingIndex] = Object.assign({}, state.packages[existingIndex], next);
          } else {
            state.packages.unshift(next);
          }

          saveState(state);
          return Promise.resolve(clone(next));
        },
        remove: function (id) {
          var state = readState();
          state.packages = state.packages.filter(function (entry) {
            return entry.id !== id;
          });
          saveState(state);
          return Promise.resolve();
        },
        updateStatus: function (id, status) {
          var state = readState();
          state.packages = state.packages.map(function (entry) {
            if (entry.id !== id) {
              return entry;
            }
            var next = Object.assign({}, entry, {
              status: status,
              updatedAt: new Date().toISOString()
            });
            if (status === "published") {
              next.publishedAt = new Date().toISOString();
            }
            return next;
          });
          saveState(state);
          return Promise.resolve();
        }
      },
      bookings: {
        list: function () {
          return Promise.resolve(clone(readState().bookings));
        },
        updateStatus: function (id, status) {
          var state = readState();
          state.bookings = state.bookings.map(function (booking) {
            if (booking.id !== id) {
              return booking;
            }
            return Object.assign({}, booking, {
              status: status,
              reviewedAt: new Date().toISOString()
            });
          });
          saveState(state);
          return Promise.resolve();
        }
      },
      orders: {
        list: function () {
          return Promise.resolve(clone(readState().orders));
        },
        update: function (id, patch) {
          var state = readState();
          state.orders = state.orders.map(function (order) {
            if (order.id !== id) {
              return order;
            }
            return Object.assign({}, order, patch || {}, {
              updatedAt: new Date().toISOString()
            });
          });
          saveState(state);
          return Promise.resolve();
        }
      }
    };
  }

  function renderBadge(status) {
    var normalized = String(status || "").toLowerCase();
    return '<span class="admin-badge is-' + normalized + '">' + normalized.replace(/-/g, " ") + "</span>";
  }

  function safeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initAdminApp() {
    var store = buildStore();
    var state = {
      session: store.auth.getSession(),
      currentView: "overview",
      packages: [],
      bookings: [],
      orders: [],
      selectedBookingId: "",
      selectedOrderId: "",
      editingPackageId: ""
    };

    var authScreen = document.querySelector("[data-auth-screen]");
    var dashboard = document.querySelector("[data-dashboard]");
    var loginForm = document.querySelector("[data-login-form]");
    var loginStatus = document.querySelector("[data-login-status]");
    var globalStatus = document.querySelector("[data-global-status]");
    var packageForm = document.querySelector("[data-package-form]");
    var packageFormTitle = document.querySelector("[data-package-form-title]");
    var packageTableBody = document.querySelector("[data-package-table-body]");
    var bookingTableBody = document.querySelector("[data-booking-table-body]");
    var orderTableBody = document.querySelector("[data-order-table-body]");
    var bookingDetail = document.querySelector("[data-booking-detail]");
    var bookingEmpty = document.querySelector("[data-booking-empty-state]");
    var orderDetail = document.querySelector("[data-order-detail]");
    var orderEmpty = document.querySelector("[data-order-empty-state]");

    function showGlobalStatus(type, message) {
      if (!globalStatus) {
        return;
      }
      globalStatus.className = "admin-banner" + (type ? " is-" + type : "");
      globalStatus.textContent = message;
      globalStatus.hidden = false;
      window.clearTimeout(showGlobalStatus._timer);
      showGlobalStatus._timer = window.setTimeout(function () {
        globalStatus.hidden = true;
      }, 2800);
    }

    function syncAuthUi() {
      var isLoggedIn = !!state.session;
      authScreen.hidden = isLoggedIn;
      dashboard.hidden = !isLoggedIn;
      if (isLoggedIn) {
        var nameTarget = document.querySelector("[data-admin-name]");
        if (nameTarget) {
          nameTarget.textContent = state.session.name || DEMO_ADMIN.name;
        }
      }
    }

    function setView(view) {
      state.currentView = view;
      document.querySelectorAll("[data-admin-view-trigger]").forEach(function (button) {
        var active = button.getAttribute("data-admin-view-trigger") === view;
        button.classList.toggle("is-active", active);
      });
      document.querySelectorAll("[data-admin-view]").forEach(function (panel) {
        var active = panel.getAttribute("data-admin-view") === view;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });

      var labels = {
        overview: ["Overview", "Dashboard Snapshot"],
        packages: ["Packages", "Package Management"],
        bookings: ["Bookings", "Booking Review"],
        orders: ["Orders", "Order Management"]
      };

      var meta = labels[view] || labels.overview;
      var viewLabel = document.querySelector("[data-view-label]");
      var viewTitle = document.querySelector("[data-view-title]");
      if (viewLabel) {
        viewLabel.textContent = meta[0];
      }
      if (viewTitle) {
        viewTitle.textContent = meta[1];
      }
    }

    function resetPackageForm() {
      state.editingPackageId = "";
      packageForm.reset();
      packageForm.querySelector("[name='id']").value = "";
      packageForm.querySelector("[name='status']").value = "draft";
      packageFormTitle.textContent = "Create Package";
    }

    function fillPackageForm(pkg) {
      if (!pkg) {
        resetPackageForm();
        return;
      }
      state.editingPackageId = pkg.id;
      packageForm.querySelector("[name='id']").value = pkg.id || "";
      packageForm.querySelector("[name='name']").value = pkg.name || "";
      packageForm.querySelector("[name='category']").value = pkg.category || "";
      packageForm.querySelector("[name='basePrice']").value = Number(pkg.basePrice || 0);
      packageForm.querySelector("[name='summary']").value = pkg.summary || "";
      packageForm.querySelector("[name='tags']").value = (pkg.tags || []).join(", ");
      packageForm.querySelector("[name='image']").value = pkg.image || "";
      packageForm.querySelector("[name='status']").value = pkg.status || "draft";
      packageFormTitle.textContent = "Edit Package";
    }

    function getSelectedBooking() {
      return state.bookings.find(function (entry) {
        return entry.id === state.selectedBookingId;
      }) || null;
    }

    function getSelectedOrder() {
      return state.orders.find(function (entry) {
        return entry.id === state.selectedOrderId;
      }) || null;
    }

    function renderOverview() {
      var publishedCount = state.packages.filter(function (entry) {
        return entry.status === "published";
      }).length;
      var pendingBookings = state.bookings.filter(function (entry) {
        return entry.status === "pending";
      }).length;
      var openOrders = state.orders.filter(function (entry) {
        return entry.fulfillmentStatus !== "fulfilled" && entry.fulfillmentStatus !== "cancelled";
      }).length;

      var metricPublished = document.querySelector("[data-metric-published]");
      var metricBookings = document.querySelector("[data-metric-bookings]");
      var metricOrders = document.querySelector("[data-metric-orders]");
      if (metricPublished) {
        metricPublished.textContent = String(publishedCount);
      }
      if (metricBookings) {
        metricBookings.textContent = String(pendingBookings);
      }
      if (metricOrders) {
        metricOrders.textContent = String(openOrders);
      }

      var bookingsTarget = document.querySelector("[data-overview-bookings]");
      var ordersTarget = document.querySelector("[data-overview-orders]");
      if (bookingsTarget) {
        bookingsTarget.innerHTML = state.bookings.slice(0, 3).map(function (booking) {
          return (
            '<div class="admin-list-row">' +
              "<strong>" + safeText(booking.customerName) + "</strong>" +
              "<small>" + safeText(booking.eventType) + " • " + safeText(formatDate(booking.eventDate)) + "</small>" +
              '<div style="margin-top:10px;">' + renderBadge(booking.status) + "</div>" +
            "</div>"
          );
        }).join("");
      }
      if (ordersTarget) {
        ordersTarget.innerHTML = state.orders.slice(0, 3).map(function (order) {
          return (
            '<div class="admin-list-row">' +
              "<strong>" + safeText(order.id) + "</strong>" +
              "<small>" + safeText(order.customerName) + " • " + safeText(formatMoney(order.total)) + "</small>" +
              '<div style="margin-top:10px;">' + renderBadge(order.fulfillmentStatus) + "</div>" +
            "</div>"
          );
        }).join("");
      }
    }

    function renderPackages() {
      packageTableBody.innerHTML = state.packages.map(function (pkg) {
        return (
          "<tr>" +
            "<td><strong>" + safeText(pkg.name) + "</strong><small>" + safeText(pkg.summary) + "</small></td>" +
            "<td>" + renderBadge(pkg.status) + "</td>" +
            "<td>" + safeText(pkg.category) + "</td>" +
            "<td>" + safeText(formatMoney(pkg.basePrice)) + "</td>" +
            '<td><div class="admin-table__stack">' +
              '<button class="admin-table__action" type="button" data-package-edit="' + safeText(pkg.id) + '">Edit</button>' +
              '<button class="admin-table__action is-success" type="button" data-package-publish="' + safeText(pkg.id) + '">' + (pkg.status === "published" ? "Unpublish" : "Publish") + "</button>" +
              '<button class="admin-table__action is-danger" type="button" data-package-delete="' + safeText(pkg.id) + '">Delete</button>' +
            "</div></td>" +
          "</tr>"
        );
      }).join("");
    }

    function renderBookings() {
      bookingTableBody.innerHTML = state.bookings.map(function (booking) {
        return (
          "<tr>" +
            "<td><strong>" + safeText(booking.customerName) + "</strong><small>" + safeText(booking.email) + "</small></td>" +
            "<td>" + safeText(booking.eventType) + "<br><small>" + safeText(booking.packageName) + "</small></td>" +
            "<td>" + safeText(formatDate(booking.eventDate)) + "</td>" +
            "<td>" + renderBadge(booking.status) + "</td>" +
            '<td><div class="admin-table__stack">' +
              '<button class="admin-table__action" type="button" data-booking-view="' + safeText(booking.id) + '">View</button>' +
              '<button class="admin-table__action is-success" type="button" data-booking-status="' + safeText(booking.id) + '" data-next-status="approved">Approve</button>' +
              '<button class="admin-table__action" type="button" data-booking-status="' + safeText(booking.id) + '" data-next-status="confirmed">Confirm</button>' +
              '<button class="admin-table__action is-danger" type="button" data-booking-status="' + safeText(booking.id) + '" data-next-status="rejected">Reject</button>' +
            "</div></td>" +
          "</tr>"
        );
      }).join("");

      var selected = getSelectedBooking();
      if (!selected) {
        bookingEmpty.hidden = false;
        bookingDetail.hidden = true;
        bookingDetail.innerHTML = "";
        return;
      }

      bookingEmpty.hidden = true;
      bookingDetail.hidden = false;
      bookingDetail.innerHTML =
        '<div class="admin-detail-group">' +
          "<strong>" + safeText(selected.customerName) + "</strong>" +
          "<div>" + renderBadge(selected.status) + "</div>" +
          '<div class="admin-detail-grid" style="margin-top:12px;">' +
            "<div><small>Email</small><br>" + safeText(selected.email) + "</div>" +
            "<div><small>Phone</small><br>" + safeText(selected.phone) + "</div>" +
            "<div><small>Event</small><br>" + safeText(selected.eventType) + "</div>" +
            "<div><small>Package</small><br>" + safeText(selected.packageName) + "</div>" +
            "<div><small>Date</small><br>" + safeText(formatDate(selected.eventDate)) + "</div>" +
            "<div><small>Budget</small><br>" + safeText(selected.budget) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="admin-detail-group"><small>Venue</small><br>' + safeText(selected.venue) + "</div>" +
        '<div class="admin-detail-group"><small>Notes</small><br>' + safeText(selected.notes) + "</div>" +
        '<div class="admin-detail-actions">' +
          '<button class="admin-btn admin-btn--secondary" type="button" data-booking-status="' + safeText(selected.id) + '" data-next-status="approved">Approve</button>' +
          '<button class="admin-btn admin-btn--primary" type="button" data-booking-status="' + safeText(selected.id) + '" data-next-status="confirmed">Confirm</button>' +
          '<button class="admin-btn admin-btn--ghost" type="button" data-booking-status="' + safeText(selected.id) + '" data-next-status="rejected">Reject</button>' +
        "</div>";
    }

    function renderOrders() {
      orderTableBody.innerHTML = state.orders.map(function (order) {
        return (
          "<tr>" +
            "<td><strong>" + safeText(order.id) + "</strong><small>" + safeText(formatDate(order.createdAt)) + "</small></td>" +
            "<td><strong>" + safeText(order.customerName) + "</strong><small>" + safeText(order.email) + "</small></td>" +
            "<td>" + safeText(formatMoney(order.total)) + "</td>" +
            "<td>" + renderBadge(order.fulfillmentStatus) + "<div style='margin-top:8px;'>" + renderBadge(order.paymentStatus) + "</div></td>" +
            '<td><div class="admin-table__stack">' +
              '<button class="admin-table__action" type="button" data-order-view="' + safeText(order.id) + '">View</button>' +
              '<button class="admin-table__action is-success" type="button" data-order-payment="' + safeText(order.id) + '" data-payment-status="paid">Mark Paid</button>' +
              '<button class="admin-table__action" type="button" data-order-fulfillment="' + safeText(order.id) + '" data-fulfillment-status="fulfilled">Fulfill</button>' +
              '<button class="admin-table__action is-danger" type="button" data-order-fulfillment="' + safeText(order.id) + '" data-fulfillment-status="cancelled">Cancel</button>' +
            "</div></td>" +
          "</tr>"
        );
      }).join("");

      var selected = getSelectedOrder();
      if (!selected) {
        orderEmpty.hidden = false;
        orderDetail.hidden = true;
        orderDetail.innerHTML = "";
        return;
      }

      orderEmpty.hidden = true;
      orderDetail.hidden = false;
      orderDetail.innerHTML =
        '<div class="admin-detail-group">' +
          "<strong>" + safeText(selected.id) + "</strong>" +
          '<div class="admin-detail-grid" style="margin-top:12px;">' +
            "<div><small>Customer</small><br>" + safeText(selected.customerName) + "</div>" +
            "<div><small>Email</small><br>" + safeText(selected.email) + "</div>" +
            "<div><small>Total</small><br>" + safeText(formatMoney(selected.total)) + "</div>" +
            "<div><small>Created</small><br>" + safeText(formatDate(selected.createdAt)) + "</div>" +
          "</div>" +
          '<div style="margin-top:12px;">' + renderBadge(selected.paymentStatus) + " " + renderBadge(selected.fulfillmentStatus) + "</div>" +
        "</div>" +
        '<div class="admin-detail-group"><small>Items</small><br>' +
          selected.items.map(function (item) {
            return "<div style='margin-top:10px;'><strong>" + safeText(item.name) + "</strong> x " + safeText(item.qty) + " • " + safeText(formatMoney(item.price)) + "</div>";
          }).join("") +
        "</div>" +
        '<div class="admin-detail-group"><small>Admin Note</small><br>' + safeText(selected.shippingNote) + "</div>" +
        '<div class="admin-detail-actions">' +
          '<button class="admin-btn admin-btn--secondary" type="button" data-order-payment="' + safeText(selected.id) + '" data-payment-status="paid">Mark Paid</button>' +
          '<button class="admin-btn admin-btn--primary" type="button" data-order-fulfillment="' + safeText(selected.id) + '" data-fulfillment-status="fulfilled">Mark Fulfilled</button>' +
          '<button class="admin-btn admin-btn--ghost" type="button" data-order-fulfillment="' + safeText(selected.id) + '" data-fulfillment-status="cancelled">Cancel Order</button>' +
        "</div>";
    }

    function renderAll() {
      renderOverview();
      renderPackages();
      renderBookings();
      renderOrders();
    }

    function refreshAll() {
      return Promise.all([
        store.packages.list(),
        store.bookings.list(),
        store.orders.list()
      ]).then(function (results) {
        state.packages = results[0];
        state.bookings = results[1];
        state.orders = results[2];
        renderAll();
      });
    }

    function readFileAsDataUrl(file) {
      return new Promise(function (resolve, reject) {
        if (!file) {
          resolve("");
          return;
        }
        var reader = new window.FileReader();
        reader.onload = function (event) {
          resolve(event && event.target ? event.target.result : "");
        };
        reader.onerror = function () {
          reject(new Error("Unable to read image file."));
        };
        reader.readAsDataURL(file);
      });
    }

    document.querySelectorAll("[data-admin-view-trigger]").forEach(function (button) {
      button.addEventListener("click", function () {
        setView(button.getAttribute("data-admin-view-trigger"));
      });
    });

    document.querySelectorAll("[data-jump-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        setView(button.getAttribute("data-jump-view"));
      });
    });

    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        loginStatus.textContent = "";
        loginStatus.className = "admin-form-status";
        var formData = new window.FormData(loginForm);
        store.auth.login({
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || "")
        }).then(function (session) {
          state.session = session;
          syncAuthUi();
          return refreshAll();
        }).catch(function (error) {
          loginStatus.textContent = error.message || "Unable to sign in.";
          loginStatus.classList.add("is-error");
        });
      });
    }

    var logoutBtn = document.querySelector("[data-logout-btn]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        store.auth.logout().then(function () {
          state.session = null;
          syncAuthUi();
          showGlobalStatus("success", "Admin session closed.");
        });
      });
    }

    document.addEventListener("click", function (event) {
      var packageEditBtn = event.target.closest("[data-package-edit]");
      if (packageEditBtn) {
        var packageId = packageEditBtn.getAttribute("data-package-edit");
        var pkg = state.packages.find(function (entry) {
          return entry.id === packageId;
        });
        fillPackageForm(pkg || null);
        setView("packages");
        return;
      }

      var packagePublishBtn = event.target.closest("[data-package-publish]");
      if (packagePublishBtn) {
        var publishId = packagePublishBtn.getAttribute("data-package-publish");
        var current = state.packages.find(function (entry) {
          return entry.id === publishId;
        });
        var nextStatus = current && current.status === "published" ? "draft" : "published";
        store.packages.updateStatus(publishId, nextStatus).then(function () {
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Package status updated.");
        });
        return;
      }

      var packageDeleteBtn = event.target.closest("[data-package-delete]");
      if (packageDeleteBtn) {
        var deleteId = packageDeleteBtn.getAttribute("data-package-delete");
        store.packages.remove(deleteId).then(function () {
          if (state.editingPackageId === deleteId) {
            resetPackageForm();
          }
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Package deleted.");
        });
        return;
      }

      var bookingViewBtn = event.target.closest("[data-booking-view]");
      if (bookingViewBtn) {
        state.selectedBookingId = bookingViewBtn.getAttribute("data-booking-view");
        renderBookings();
        return;
      }

      var bookingStatusBtn = event.target.closest("[data-booking-status]");
      if (bookingStatusBtn) {
        var bookingId = bookingStatusBtn.getAttribute("data-booking-status");
        var nextBookingStatus = bookingStatusBtn.getAttribute("data-next-status");
        state.selectedBookingId = bookingId;
        store.bookings.updateStatus(bookingId, nextBookingStatus).then(function () {
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Booking updated.");
        });
        return;
      }

      var orderViewBtn = event.target.closest("[data-order-view]");
      if (orderViewBtn) {
        state.selectedOrderId = orderViewBtn.getAttribute("data-order-view");
        renderOrders();
        return;
      }

      var orderPaymentBtn = event.target.closest("[data-order-payment]");
      if (orderPaymentBtn) {
        var payId = orderPaymentBtn.getAttribute("data-order-payment");
        var nextPaymentStatus = orderPaymentBtn.getAttribute("data-payment-status");
        state.selectedOrderId = payId;
        store.orders.update(payId, { paymentStatus: nextPaymentStatus }).then(function () {
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Order payment updated.");
        });
        return;
      }

      var orderFulfillmentBtn = event.target.closest("[data-order-fulfillment]");
      if (orderFulfillmentBtn) {
        var fulfillId = orderFulfillmentBtn.getAttribute("data-order-fulfillment");
        var nextFulfillmentStatus = orderFulfillmentBtn.getAttribute("data-fulfillment-status");
        state.selectedOrderId = fulfillId;
        store.orders.update(fulfillId, { fulfillmentStatus: nextFulfillmentStatus }).then(function () {
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Order fulfillment updated.");
        });
        return;
      }
    });

    var newPackageBtn = document.querySelector("[data-new-package-btn]");
    if (newPackageBtn) {
      newPackageBtn.addEventListener("click", function () {
        resetPackageForm();
      });
    }

    var packageResetBtn = document.querySelector("[data-package-form-reset]");
    if (packageResetBtn) {
      packageResetBtn.addEventListener("click", function () {
        resetPackageForm();
      });
    }

    if (packageForm) {
      packageForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var formData = new window.FormData(packageForm);
        var imageFile = formData.get("imageFile");
        var tagTokens = String(formData.get("tags") || "")
          .split(",")
          .map(function (token) { return token.trim(); })
          .filter(Boolean);

        readFileAsDataUrl(imageFile && imageFile.size ? imageFile : null).then(function (imageFromFile) {
          return store.packages.save({
            id: String(formData.get("id") || "").trim(),
            name: String(formData.get("name") || "").trim(),
            category: String(formData.get("category") || "").trim(),
            basePrice: Number(formData.get("basePrice") || 0),
            summary: String(formData.get("summary") || "").trim(),
            tags: tagTokens,
            image: imageFromFile || String(formData.get("image") || "").trim() || "../images/logo.png",
            status: String(formData.get("status") || "draft").trim()
          });
        }).then(function () {
          resetPackageForm();
          return refreshAll();
        }).then(function () {
          showGlobalStatus("success", "Package saved.");
        }).catch(function (error) {
          showGlobalStatus("error", error.message || "Unable to save package.");
        });
      });
    }

    syncAuthUi();
    setView(state.currentView);
    resetPackageForm();
    if (state.session) {
      refreshAll();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminApp);
  } else {
    initAdminApp();
  }
})(window, document);
