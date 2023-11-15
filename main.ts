import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

const basePath = (app.vault.adapter as any).basePath;

import * as dotenv from "dotenv";
dotenv.config({
	path: `${basePath}/.obsidian/plugins/obsidian-audio-alchemiser/.env`,
	debug: false,
});

import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	dangerouslyAllowBrowser: true,
});

const speechFile = path.resolve(basePath + "/speech.mp3");
// Remember to rename these classes and interfaces!

interface AudioAlchemiserSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: AudioAlchemiserSettings = {
	mySetting: "default",
};

export default class AudioAlchemiser extends Plugin {
	settings: AudioAlchemiserSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: "open-sample-modal-simple",
		// 	name: "Open sample modal (simple)",
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	},
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Audio Alch",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				const podCompletion = await openai.chat.completions.create({
					messages: [
						{
							role: "system",
							content:
								`Turn the following into a podcast like monologue format (just the host, no guests), very natural sounding. If you come across any code, just explain the code block, do not say any of the code itself. If there are any words that can't be spoken directly, conert them to phonetic sounding (e.g. dotenv == dot e en vee) Deliver the entire podcast in short narrative format. Just return the transcript, nothing else: ` +
								selection,
						},
					],
					model: "gpt-4",
				});

				const  promptPod = podCompletion.choices[0].message.content;

				if (!promptPod) {
					return {
						prompt: "Error generating prompt.",
						imageUrl: "",
					};
				}

				console.log(promptPod);

				const mp3 = await openai.audio.speech.create({
					model: "tts-1",
					voice: "onyx",
					input: promptPod,
				});

				console.log("mp3 created");
			
				const buffer = Buffer.from(await mp3.arrayBuffer());
				await fs.promises.writeFile(speechFile, buffer);

				const artMovements = [
					"Abstract Expressionism",
					"Art Deco",
					"Art Nouveau",
					"Avant-garde",
					"Baroque",
					"Bauhaus",
					"Classicism",
					"CoBrA",
					"Color Field Painting",
					"Conceptual Art",
					"Constructivism",
					"Cubism",
					"Dada / Dadaism",
					"Digital Art",
					"Expressionism",
					"Fauvism",
					"Futurism",
					"Harlem Renaissance",
					"Impressionism",
					"Installation Art",
					"Land Art",
					"Minimalism",
					"Neo-Impressionism",
					"Neoclassicism",
					"Neon Art",
					"Op Art",
					"Performance Art",
					"Pop Art",
					"Post-Impressionism",
					"Precisionism",
					"Rococo",
					"Street Art",
					"Surrealism",
					"Suprematism",
					"Symbolism",
					"Zero Group",
				];

				const randomArtMovement =
					artMovements[
						Math.floor(Math.random() * artMovements.length)
					];

				const palettes = [
					"#C7CEEA, #D6EADF, #E4C1F9",
					"#D8A7B1, #FFDAC1, #FFD1DC",
					"#A4B0BE, #FBC4AB, #E4C1F9",
					"#D8A7B1, #C7CEEA, #FFC1CC",
					"#D6EADF, #FFADCD, #C7CEEA",
					"#FFD1DC, #C4FCEF, #E1CE7A",
					"#FFADCD, #E1CE7A, #FFD1DC",
					"#E4C1F9, #FFC1CC, #B5E2FA",
					"#C7CEEA, #FBC4AB, #C7CEEA",
					"#D6EADF, #FFDAC1, #FFADCD",
					"#FEF5EF, #F7D08A, #B5EAD7",
					"#FFB7B2, #B5EAD7, #778DA9",
					"#E1CE7A, #E4C1F9, #B5EAD7",
					"#6A4C93, #C4FCEF, #FBC4AB",
					"#FBC4AB, #F0A1BF, #FFD1DC",
					"#BEE5BF, #A4B0BE, #FBC4AB",
					"#FEF5EF, #FFDAC1, #A3D8F4",
					"#E1CE7A, #F7D08A, #C4FCEF",
					"#F7D08A, #FFB4A2, #B5EAD7",
					"#6A4C93, #C7CEEA, #D6EADF",
					"#FFC1CC, #C7CEEA, #BEE5BF",
					"#F0A1BF, #B5EAD7, #FBC4AB",
					"#B5EAD7, #F7D08A, #F4E8C1",
					"#B5E2FA, #C7CEEA, #FFADCD",
					"#FFD1DC, #FFB4A2, #FFADCD",
				];

				const randomPalette =
					palettes[Math.floor(Math.random() * palettes.length)];

				const completion = await openai.chat.completions.create({
					messages: [
						{
							role: "system",
							content:
								`Summarize the following into a theme and create an art prompt from the feel of the text aesthetically along the lines of: 'a ${randomArtMovement} version of {x}' where x is the feel of the text aesthetically. Remove any unsafe or NSFW content. Just return the art prompt, say nothing else. Use color palette: ${randomPalette} and take advantage of negative space (leave much of the canvas blank)` +
								selection,
						},
					],
					model: "gpt-4",
				});

			

				let prompt = completion.choices[0].message.content;

				console.log(prompt);

				if(prompt) {
					prompt = prompt.replace("Art Prompt: ", "").trim();
	
					if (prompt === "Error generating prompt.") {
						return {
							prompt: "Error generating prompt.",
							imageUrl: "",
						};
					}
	
					const image = await openai.images.generate({
						model: "dall-e-3",
						prompt: prompt,
					});
					const imageUrl = image.data[0].url;

					console.log(imageUrl);
	
					if (imageUrl === undefined) {
						return {
							prompt: "Error generating prompt.",
							imageUrl: "",
						};
					}

					const summaryCompletion = await openai.chat.completions.create({
						messages: [
							{
								role: "system",
								content:
									`Turn the following into a few word Markdown title. Just return the title, nothing else: ` +
									selection,
							},
						],
						model: "gpt-4",
					});

					console.log(summaryCompletion);
	
					const  summaryTitle = summaryCompletion.choices[0].message.content;

					editor.replaceSelection(`![](${imageUrl})\n\n## ${summaryTitle?.trim().replace(/^"|"$/g, '')}\n\n![[speech.mp3]]`);
				}



				
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class SampleSettingTab extends PluginSettingTab {
	plugin: AudioAlchemiser;

	constructor(app: App, plugin: AudioAlchemiser) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Podcast Mode")
			.setDesc("It's a secret")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
			// .addText((text) =>
			// 	text
			// 		.setPlaceholder("Enter your secret")
			// 		.setValue(this.plugin.settings.mySetting)
			// 		.onChange(async (value) => {
			// 			this.plugin.settings.mySetting = value;
			// 			await this.plugin.saveSettings();
			// 		})
			// );
	}
}
