/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

type Point = [number, number];

type Color = [number, number, number, number];

interface GridSettings {
  radialDivisions: number;
  pixelLength: number;
  length: number;
  origin: "zero" | "centered"
}

/**
 * Main entry point for tau, the polar pixel editor
 */
export class Editor {

  private element: HTMLElement;

  private width: number;
  private height: number;

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private imageData: ImageData;
  private pixelData: Uint8ClampedArray;

  private gridSettings: GridSettings = {
    radialDivisions: 16,
    pixelLength: 25,
    length: 10,
    origin: "centered"
  };

  private polarPixels = new Array<number>(4 * this.gridSettings.radialDivisions * this.gridSettings.length);

  private cursor: Point;

  private selectedColor: Color = [255, 255, 255, 255];

  /**
   * @param {HTMLElement} element The HTML Element to hold the editor
   * @param {number} length the length of the editor, both in width and height
   */
  constructor(element: HTMLElement, length: number);

  /**
   * @param {HTMLElement} element The HTML Element to hold the editor
   * @param {number} width the width of the editor, in pixels
   * @param {number} height the height of the editor, in pixels
   */
  constructor(element: HTMLElement, width: number, height: number);

  constructor(element: HTMLElement, width: number, height?: number) {

    this.element = element;

    this.width = width;
    this.height = height ? height : width;

    this.initPixels();
    this.hookColorPicker();
    this.createCanvas();
  }

  hookColorPicker() {
    const picker: any = document.querySelector("color-picker");
    picker.addEventListener("color-change", () => {
      const { state } = picker;
      this.selectedColor = [state.rgb.r, state.rgb.g, state.rgb.b, 255];
    });
  }

  initPixels() {
    for (let i = 0; i < this.polarPixels.length; i += 4) {
      this.polarPixels[i] = undefined;
      this.polarPixels[i + 1] = undefined;
      this.polarPixels[i + 2] = undefined;
      this.polarPixels[i + 3] = 255; // alpha transparency
    }
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.element.appendChild(this.canvas);

    this.context = this.canvas.getContext("2d");
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    this.pixelData = this.imageData.data;

    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));

    window.requestAnimationFrame(this.render.bind(this));
  }

  onMouseMove(event: MouseEvent) {
    this.cursor = [event.layerX, event.layerY];
  }

  onMouseOut() {
    delete this.cursor;
  }

  onClick() {
    const cursorIndex = this.getCursorIndex();
    if (cursorIndex > 0) {
      this.polarPixels[4 * cursorIndex] = this.selectedColor[0];
      this.polarPixels[4 * cursorIndex + 1] = this.selectedColor[1];
      this.polarPixels[4 * cursorIndex + 2] = this.selectedColor[2];
      this.polarPixels[4 * cursorIndex + 3] = this.selectedColor[3];
    }
  }

  renderPixels() {
    let cursorIndex = this.getCursorIndex();

    for (let i = 0; i < this.width * this.height; i++) {
      const [x, y] = this.toCartesianCoordinates(i % this.width, Math.round(i / this.width));
      const [r, theta] = this.toPolarCoordinates(x, y);

      const index = this.getPixelIndex(r, theta);

      if (index < this.gridSettings.radialDivisions * this.gridSettings.length) {

        if (this.polarPixels[4 * index] !== undefined) {
          // if pixel is defined, if yes render it
          [0, 1, 2, 3].forEach(offset => this.pixelData[4 * i + offset] = this.polarPixels[4 * index + offset]);
        }
        else {
          // else render the grid
          const offset = Math.floor(index / this.gridSettings.radialDivisions) % 2;
          const color = (index + offset) % 2 === 0 ? 76 : 85;
          [0, 1, 2].forEach(offset => this.pixelData[4 * i + offset] = color);
          this.pixelData[4 * i + 3] = 255;
        }

        if (index === cursorIndex) {
          [0, 1, 2].forEach(offset => this.pixelData[4 * i + offset] = Math.min(255, this.pixelData[4 * i + offset] - 25));
          this.pixelData[4 * i + 3] = 255;
        }
      }
    }
  }

  private getCursorIndex() {
    let cursorIndex = -1;
    if (this.cursor !== undefined) {
      const [x, y] = this.toCartesianCoordinates(this.cursor[0], this.cursor[1]);
      const [r, theta] = this.toPolarCoordinates(x, y);
      cursorIndex = this.getPixelIndex(r, theta);
    }
    return cursorIndex;
  }

  render() {
    window.requestAnimationFrame(this.render.bind(this));
    this.renderPixels();
    this.context.putImageData(this.imageData, 0, 0);
  }

  private toCartesianCoordinates(x: number, y: number): [number, number] {
    return [x - this.width / 2, this.height / 2 - y];
  }

  private toPolarCoordinates(x: number, y: number): [number, number] {
    const r = Math.sqrt(x ** 2 + y ** 2);
    const theta = Math.PI + Math.atan2(y, x) - (this.gridSettings.origin === "centered" ? 0 : (Math.PI / this.gridSettings.radialDivisions));
    return [r, theta];
  }

  private getPixelIndex(r: number, theta: number) {
    return Math.round(r / this.gridSettings.pixelLength) * this.gridSettings.radialDivisions
      + (Math.round(theta / (Math.PI * 2 / this.gridSettings.radialDivisions)) % this.gridSettings.radialDivisions);
  }
}