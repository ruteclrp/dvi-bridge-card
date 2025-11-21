class DviBridgeCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this.innerHTML = `
      <ha-card header="DVI LV Compact varmepumpe">
        <div id="container" style="position:relative;">
          <img src="/hacsfiles/dvi-bridge-card/dvi.gif?v=2" style="width:100%;" />
        </div>
      </ha-card>
    `;
  }

  _render() {
    const container = this.querySelector("#container");
    if (!container) {
      console.warn("Container not found");
      return;
    }

    // Clear old overlays
    container.querySelectorAll(".overlay").forEach(el => el.remove());

    // --- CV pump conditional ---
    const cvPump = this._hass.states["binary_sensor.dvi_lv12_circ_pump_cv"];
    if (cvPump?.state === "on") {
      this._addImage(container, "/hacsfiles/dvi-bridge-card/CV_on.gif", "55%", "78%", "21%");
      this._addImage(container, "/hacsfiles/dvi-bridge-card/CVflow_on.gif", "76.9%", "64.7%", "14.2%");
      this._addLabel(container, "sensor.dvi_lv12_cv_forward", "74.2%", "70%");
      this._addLabel(container, "sensor.dvi_lv12_cv_return", "89%", "70%");
    }

    // --- Aux heating conditional ---
    const auxHeating = this._hass.states["select.dvi_lv12_aux_heating"];
    if (auxHeating && auxHeating.state !== "Off") {
      this._addIcon(container, "binary_sensor.dvi_lv12_heating_element", "mdi:lightning-bolt-outline", "70%", "70%", {
        "--state-binary_sensor-on-color": "yellow",
        "--state-binary_sensor-off-color": "bluegrey"
      });
    }

    // --- Compressor conditional ---
    const compressor = this._hass.states["binary_sensor.dvi_lv12_soft_starter_compressor"];
    if (compressor?.state === "on") {
      this._addImage(container, "/hacsfiles/dvi-bridge-card/HP_on.gif", "25.6%", "1.4%", "33.9%");
      this._addImage(container, "/hacsfiles/dvi-bridge-card/COMP_on.gif", "25.6%", "35.4%", "21.3%");
      this._addLabel(container, "sensor.dvi_lv12_evaporator", "74%", "11%");
      this._addLabel(container, "sensor.dvi_lv12_compressor_hp", "28%", "38.5%");
      this._addLabel(container, "sensor.dvi_lv12_compressor_lp", "28%", "29%");
    }

    // --- VV mode conditional ---
    const vvMode = this._hass.states["select.dvi_lv12_vv_mode"];
    if (vvMode?.state === "On") {
      this._addLabel(container, "sensor.dvi_lv12_storage_tank_vv", "30%", "80%");
    }

    // --- Defrost valve icon ---
    this._addIcon(container, "binary_sensor.dvi_lv12_4_way_valve_defrost", "mdi:snowflake-melt", "80%", "13%", {
      "--state-binary_sensor-on-color": "orange",
      "--state-binary_sensor-off-color": "bluegrey"
    });

    // --- Outdoor temp ---
    this._addLabel(container, "sensor.dvi_lv12_outdoor", "8%", "8%");

    // --- Curve temp labels ---
    this._addStaticLabel(container, "kurvetemperatur", "13%", "45%");
    this._addLabel(container, "sensor.dvi_lv12_curve_temp", "13%", "68%");

    // --- Storage tank CV ---
    this._addLabel(container, "sensor.dvi_lv12_storage_tank_cv", "69.2%", "56%");

    // --- Info icon popup ---
    this._addPopupIcon(
      container,
      "mdi:information-slab-circle",
      "-2%", "90%",
      "Information",
      [
        "sensor.dvi_lv12_em23_energy",
        "sensor.dvi_lv12_comp_hours",
        "sensor.dvi_lv12_vv_hours",
        "sensor.dvi_lv12_heating_hours"
      ]
    );

    // --- Radiator popup ---
    this._addPopupIcon(
      container,
      "mdi:radiator",
      "8%", "90%",
      "Centralvarme",
      [
        "select.dvi_lv12_cv_mode",
        "number.dvi_lv12_cv_curve",
        "select.dvi_lv12_aux_heating",
        "select.dvi_lv12_cv_night"
      ]
    );

    // --- Shower popup ---
    this._addPopupIcon(
      container,
      "mdi:shower-head",
      "18%", "90%",
      "Varmtvandstemperatur",
      [
        "number.dvi_lv12_vv_setpoint",
        "select.dvi_lv12_vv_mode",
        "select.dvi_lv12_vv_schedule"
      ]
    );
  }

  // --- Helpers ---
  _addImage(container, src, top, left, width) {
    const img = document.createElement("img");
    img.src = src;
    img.className = "overlay";
    Object.assign(img.style, { position: "absolute", top, left, width });
    container.appendChild(img);
  }

  _addLabel(container, entity, top, left, prefix = "") {
    const state = this._hass?.states[entity];
    if (!state) return;
    const label = document.createElement("div");
    label.className = "overlay";
    Object.assign(label.style, {
      position: "absolute",
      top,
      left,
      color: "rgb(8,0,0)",
      fontSize: "100%",
      fontWeight: "normal",
      cursor: "pointer"
    });
    label.textContent = `${prefix ? prefix + " " : ""}${state.state} ${state.attributes.unit_of_measurement || ""}`;

    // Click opens native HA popup
    label.addEventListener("click", () => {
      const ev = new CustomEvent("hass-more-info", {
        detail: { entityId: entity },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(ev);
    });

    container.appendChild(label);
  }

  _addStaticLabel(container, text, top, left) {
    const label = document.createElement("div");
    label.className = "overlay";
    Object.assign(label.style, {
      position: "absolute",
      top,
      left,
      color: "rgb(8,0,0)",
      fontSize: "100%",
      fontWeight: "normal"
    });
    label.textContent = text;
    container.appendChild(label);
  }

  _addIcon(container, entity, icon, top, left, styleOverrides = {}) {
    const state = this._hass?.states[entity];
    if (!state) return;
    const el = document.createElement("ha-icon");
    el.className = "overlay";
    el.icon = icon;
    Object.assign(el.style, { position: "absolute", top, left, cursor: "pointer" }, styleOverrides);

    // Click opens native HA popup
    el.addEventListener("click", () => {
      const ev = new CustomEvent("hass-more-info", {
        detail: { entityId: entity },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(ev);
    });

    container.appendChild(el);
  }

  _addPopupIcon(container, icon, top, left, title, entities) {
      const el = document.createElement("ha-icon");
      el.className = "overlay";
      el.icon = icon;
      Object.assign(el.style, { position: "absolute", top, left, cursor: "pointer" });

      el.addEventListener("click", () => {
        if (!this._hass) return;
        this._hass.callService("browser_mod", "popup", {
          title,
          content: {
            type: "entities",
            entities: entities.map(e => ({ entity: e }))
          }
        });
      });

      container.appendChild(el);
    }


  getCardSize() {
    return 5;
  }
}

customElements.define("dvi-bridge-card", DviBridgeCard);
