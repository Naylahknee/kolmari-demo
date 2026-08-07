// Kolmari — Relocation Command Center client API.
// Thin same-origin wrapper over /api/cc/*. Exposes window.CCApi so the
// dc-runtime component can call it. Cookies (cc_owner) ride along on every
// same-origin request automatically.
(function () {
  async function req(method, path, body) {
    var opts = { method: method, credentials: "same-origin", headers: {} };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    var res = await fetch("/api/cc" + path, opts);
    if (!res.ok) {
      var msg = "HTTP " + res.status;
      try {
        var e = await res.json();
        if (e && e.error) msg = e.error;
      } catch (_) {}
      throw new Error(msg);
    }
    var ct = res.headers.get("Content-Type") || "";
    return ct.indexOf("application/json") !== -1 ? res.json() : res.text();
  }

  window.CCApi = {
    getState: function () {
      return req("GET", "/state");
    },
    addDestination: function (name) {
      return req("POST", "/destination", { name: name });
    },
    renameDestination: function (id, name) {
      return req("PATCH", "/destination/" + id, { name: name });
    },
    deleteDestination: function (id) {
      return req("DELETE", "/destination/" + id);
    },
    addItem: function (destinationId, category, text) {
      return req("POST", "/item", {
        destination_id: destinationId,
        category: category,
        text: text,
      });
    },
    updateItem: function (id, patch) {
      return req("PATCH", "/item/" + id, patch);
    },
    deleteItem: function (id) {
      return req("DELETE", "/item/" + id);
    },
    saveNote: function (destinationId, category, body) {
      return req("PUT", "/note", {
        destination_id: destinationId,
        category: category,
        body: body,
      });
    },
    addMember: function (member) {
      return req("POST", "/member", member);
    },
    updateMember: function (id, patch) {
      return req("PATCH", "/member/" + id, patch);
    },
    deleteMember: function (id) {
      return req("DELETE", "/member/" + id);
    },
    saveMemberNote: function (memberId, destinationId, body) {
      return req("PUT", "/member-note", {
        member_id: memberId,
        destination_id: destinationId,
        body: body,
      });
    },
  };
})();
