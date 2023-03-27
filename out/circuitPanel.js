"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitPanel = void 0;
const vscode = require("vscode");
const draw_1 = require("./draw");
/**
 * Represents a vscode panel which can handle the creation, storage,
 * manipulation and deletion of the webview panel for displaying
 * the quantum circuit diagrams.
 */
class CircuitPanel {
    constructor(panel, extensionUri, content) {
        this.disposables = [];
        this.panel = panel;
        this.uri = extensionUri;
        this.jsonData = content;
        this.panel.iconPath = {
            light: vscode.Uri.joinPath(this.uri, "assets", "logos", "iqsdk-light.png"),
            dark: vscode.Uri.joinPath(this.uri, "assets", "logos", "iqsdk-dark.png"),
        };
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }
    /**
     * Reveals panel if there is an instance stored, otherwise creates one
     * and stores it. Then calls setPanelData() to update panel content.
     */
    static displayWebview(extensionUri, data, valid) {
        if (CircuitPanel.instance) {
            CircuitPanel.instance.jsonData = data;
            valid ? CircuitPanel.instance.setPanelData() : CircuitPanel.instance.setPanelError();
            CircuitPanel.instance.panel.reveal(vscode.ViewColumn.Two, true);
        }
        else {
            const panel = vscode.window.createWebviewPanel("circuitGenerator", "Quantum Circuit", {
                viewColumn: vscode.ViewColumn.Two,
                preserveFocus: true
            }, {
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, "assets")],
                enableScripts: true,
            });
            CircuitPanel.instance = new CircuitPanel(panel, extensionUri, data);
            valid ? CircuitPanel.instance.setPanelData() : CircuitPanel.instance.setPanelError();
        }
    }
    /**
     * Gathers assets and input json data to create the webview content,
     * and assigns it to the panel's webview.
     */
    setPanelData() {
        const webview = this.panel.webview;
        // Create links to all assets
        const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.uri, "assets", "javascripts", "main.js"));
        const panzoomScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.uri, "assets", "javascripts", "panzoom.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.uri, "assets", "styles", "style.css"));
        this.panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <link href="${styleUri}" rel="stylesheet">
              <script src="${panzoomScriptUri}"></script>
              <script src="${mainScriptUri}"></script>
              <p hidden>${draw_1.initData(this.jsonData)}</p>
            </head>
            <body onload="initializePanzoom(${draw_1.getBackgroundWidth()}, ${draw_1.getBackgroundHeight()})">
              <div id="attributes" display="none"></div>
              <h1 id="title">${this.jsonData.title}</h1>
              <svg id='scene' width="95%" height="60%">
                <g id='circuitBoard'>
                  ${draw_1.drawBoard()}
                </g>
              </svg>  
            </body>
            </html>`;
    }
    /**
     * Checks that the iqsdk.json is valid
     */
    static validateQData(data) {
        // Syntax
        if (data.title === undefined) {
            throw new Error('iqsdk.json File Missing Title <br><br>Example <br>"title": "My Circuit",');
        }
        else if (data.numQbits === undefined) {
            throw new Error('iqsdk.json File Missing Qbit Quantity <br><br>Example <br>"numQbits": 2,');
        }
        else if (data.qbitNames === undefined) {
            throw new Error('iqsdk.json File Missing Qbit Names <br><br>Example <br>"qbitNames": [<br>"example_0",<br>""<br>],');
        }
        else if (data.gates === undefined) {
            throw new Error('iqsdk.json File Missing List of Gates <br><br>Example <br> "gates" : [<br>{<br>"name" : "X",<br>"qubits" : [0]<br>},<br>{<br>"name" : "H",<br>"qubits" : [1]<br>},');
        }
        // Semantic
        if (data.numQbits !== data.qbitNames.length) {
            throw new Error('Size of qbitNames list does not match numQbits');
        }
        data.gates.forEach((gate, index) => {
            // Syntax
            if (gate.name === undefined) {
                throw new Error('gate at index ' + index + ' needs a name <br><br>Example <br>"name" : "H",');
            }
            else if (gate.qubits === undefined) {
                throw new Error('gate at index ' + index + ' needs a qbit(s) to act upon <br><br>Example <br>"qubits" : [0]');
            }
            // Semantic
            for (let qbit of gate.qubits) {
                if (qbit >= data.numQbits) {
                    throw new Error('gate at index ' + index + ' acts on a qbit outside of the range defined by numQbits');
                }
            }
        });
    }
    /**
     * Prints an error to the webview
     */
    setPanelError() {
        this.panel.webview.html = `
              <!DOCTYPE html>
              <body>
                <h1 id="title">${this.jsonData.title}</h1>
              </body>
              </html>`;
    }
    /**
     * Handles deconstructing the object and vscode garbage
     */
    dispose() {
        CircuitPanel.instance = undefined;
        this.panel.dispose();
        while (this.disposables.length > 0) {
            const garbage = this.disposables.pop();
            if (garbage) {
                garbage.dispose();
            }
        }
    }
}
exports.CircuitPanel = CircuitPanel;
//# sourceMappingURL=circuitPanel.js.map