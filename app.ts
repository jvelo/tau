/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Editor } from './src/editor.js';

function bootstrapEditor() {
  new Editor(document.querySelector('body'), 800);
}

document.addEventListener('DOMContentLoaded', bootstrapEditor, false);