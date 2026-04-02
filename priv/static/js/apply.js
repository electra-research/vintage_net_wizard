"use strict";

function applyConfiguration(title, button_color) {
  const state = {
    view: "trying",
    dots: "",
    targetElem: document.querySelector(".content"),
    configurationStatus: "not_configured",
    completed: false,
    ssid: document.getElementById("ssid").getAttribute("value"),
    title: title
  }

  function runGetStatus() {
    setTimeout(getStatus, 1000);
  }

  function getStatus() {
    fetch("/api/v1/configuration/status")
      .then(resp => resp.json())
      .then(handleStatusResponse)
      .catch(handleNetworkErrorResponse);
  }

  function handleStatusResponse(status) {
    switch (status) {
      case "not_configured":
        state.dots = state.dots + ".";
        render(state);
        break;
      case "good":
        if (!status.completed) {
          state.view = "configurationGood";
          state.configurationStatus = status;
          render(state);
        }
        break;
      case "bad":
        state.view = "configurationBad";
        state.configurationStatus = status;
        render(state);
        break;
    }
  }

  function handleNetworkErrorResponse(e) {
    state.dots = state.dots + ".";
    render(state);
  }

  function successfulFinish({ view }) {
    const el = document.getElementById("configuration_status_value");
    el.textContent = "Configured";
    el.className += " configured";
    document.getElementById("range_wiregraph_container").className += " done";
    fetch("/api/v1/complete");
  }

  function view({ view, title, dots, ssid }) {
    switch (view) {
      case "trying":
        return [`
        <div id="please_wait">
         Please wait while we verify your connection.
        </div>

        <p>${dots}</p>

        <p>If this page doesn't update in 15-30 seconds, check that you're connected to
        the access point named "<b>${ssid}</b>"</p>
        `, runGetStatus
        ];
      case "configurationGood":
        return ["", successfulFinish];
      case "configurationBad":
        return [`
        <p>Failed to connect. Please check your configuration and try again.</p>
        <a class="btn btn-primary" href="/">Configure</a>
        `, null];
      case "complete":
        return ['', null];
    }
  }

  function render(state) {
    const [innerHTML, action] = view(state);
    state.targetElem.innerHTML = innerHTML;

    if (action) {
      action(state);
    }
  }

  fetch("/api/v1/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(resp => runGetStatus());
}
