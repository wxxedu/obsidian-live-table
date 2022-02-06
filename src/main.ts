import { App, Plugin, PluginSettingTab, Setting, MarkdownRenderer, MarkdownView, Editor } from "obsidian";

export default class MyPlugin extends Plugin {
  // This field stores your plugin settings.
  setting: MyPluginSettings;

  onInit() {}

  async onload() {
    console.log("Plugin is Loading...");

    this.registerMarkdownCodeBlockProcessor("table", async (source, el, ctx) => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const editor = view.editor;
      MarkdownRenderer.renderMarkdown(source, el, ctx.sourcePath, null);
      // find all ths and tds
      let tableWidth = el.querySelectorAll("th").length;
      let tableHeight = el.querySelectorAll("tr").length;
      let htmlCells = el.querySelectorAll("td, th") as NodeListOf<HTMLTableCellElement>;

      // process the raw table
      let rawLines = source.split("\n");
      // remove the second line from the raw table
      rawLines.splice(1, 1);
      // split each line into an array of cells
      let rawCells = rawLines.map(line => {
        let _cells = line.split("|")
        // remove the first and last cell
        _cells.shift();
        _cells.pop();
        return _cells;
      });
      // create function toMarkdown for _cells
      let toMarkdown = () => {
        let markdown = "";
        for (let i = 0; i < tableHeight; i++) {
          markdown += "|";
          if (i === 1) {
            for (let j = 0; j < tableWidth; j++) {
              markdown += "---|";
            }
            markdown += "\n";
          }
          for (let j = 0; j < tableWidth; j++) {
            markdown += rawCells[i][j] + "|";
          }
          markdown += "\n";
        }
        return markdown;
      }
      for (let i = 0; i < htmlCells.length; i++) {
        // when tapping on a cell, set the cell to the value of the raw cell
        htmlCells[i].addEventListener("click", () => {
          htmlCells[i].innerHTML = rawCells[Math.floor(i / tableWidth)][i % tableWidth];
          // set the cell to contenteditable
          htmlCells[i].setAttribute("contenteditable", "true");
          // update the raw cell when the cell is edited
          htmlCells[i].addEventListener("input", () => {
            rawCells[Math.floor(i / tableWidth)][i % tableWidth] = htmlCells[i].innerHTML;
          });
          // when the cell loses focus, set the cell to readonly
          htmlCells[i].addEventListener("blur", () => {
            // clear the cell
            htmlCells[i].innerHTML = "";
            htmlCells[i].setAttribute("contenteditable", "false");
            MarkdownRenderer.renderMarkdown(rawCells[Math.floor(i / tableWidth)][i % tableWidth], htmlCells[i], ctx.sourcePath, null);
            editor.setValue(editor.getValue().replace(source, toMarkdown()));
          });
        });
      }
    });

    // This snippet of code is used to load pluging settings from disk (if any)
    // and then add the setting tab in the Obsidian Settings panel.
    // If your plugin does not use settings, you can delete these two lines.
    this.setting = (await this.loadData()) || {
      someConfigData: 1,
      anotherConfigData: "defaultValue",
    };
    this.addSettingTab(new MyPluginSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Plugin is Unloading...");
  }
}

/**
 * This is a data class that contains your plugin configurations. You can edit it
 * as you wish by adding fields and all the data you need.
 */
interface MyPluginSettings {
  someConfigData: number;
  anotherConfigData: string;
}

class MyPluginSettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.setting;
    // This is just an example of a setting controll.
    new Setting(containerEl)
      .setName("Setting Name")
      .setDesc("Setting description")
      .addText((text) =>
        text.setValue(String(settings.someConfigData)).onChange((value) => {
          if (!isNaN(Number(value))) {
            settings.someConfigData = Number(value);
            this.plugin.saveData(settings);
          }
        })
      );
  }
}
