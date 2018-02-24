import { Color } from "./editor.js";

class Toolbar extends HTMLElement {
}

window.customElements.define('tau-toolbar', Toolbar);

export class ToolColorPicker extends HTMLElement {

  private color: Color = [0, 0, 0, 255];
  private pickerOpen: boolean = false;

  get selectedColor() {
    return this.color;
  }

  connectedCallback() {
    this.renderColor();
    this.addEventListener("click", this.onClick.bind(this));
  }

  renderColor() {
    this.innerHTML = `<div style="width: 16px; height: 16px; background-color: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});">`;
  }

  onClick() {
    if (!this.pickerOpen) {
      this.innerHTML = `
        <div style="width: 16px; height: 16px; background-color: rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]});">
        <div style="position: absolute;">
          <color-picker></color-picker>
        </div>`;
      this.pickerOpen = true;
      const picker: any = this.querySelector("color-picker");
      picker.addEventListener("color-change", () => {
        const { state } = picker;

        const color: Color = [state.rgb.r, state.rgb.g, state.rgb.b, 255];

        if (color.find(it => it !== 255) === undefined) {
          return;
        }

        this.color = color;

        this.pickerOpen = false;
        this.renderColor();
        this.dispatchEvent(this.createComposedEvent('color-selected', { bubbles: true }));
      });
    }
  }

  createComposedEvent(typeArg: string, eventInitDict?: EventInit) {
    const dict = Object.assign({ composed: true }, eventInitDict);
    return new Event(typeArg, dict);
  }
}

window.customElements.define('tau-tool-color-picker', ToolColorPicker);