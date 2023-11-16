import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	requestUrl,
} from "obsidian";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import * as dotenv from "dotenv";
// import got from "got";

const basePath = (app.vault.adapter as any).basePath;
const PLUGIN_ID = "obsidian-audio-alchemiser";
dotenv.config({
	path: `${basePath}/.obsidian/plugins/${PLUGIN_ID}/.env`,
	debug: false,
});

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	dangerouslyAllowBrowser: true,
});

interface AudioAlchemiserSettings {
	mySetting: string;
	podcastMode: boolean;
	audioPath: string;
	alchemisedPath: string;
	imagePath: string;
}

const DEFAULT_SETTINGS: AudioAlchemiserSettings = {
	mySetting: "default",
	podcastMode: false,
	audioPath: basePath + "/audio",
	alchemisedPath: basePath + "/alchemised",
	imagePath: basePath + "/images",
};

export default class AudioAlchemiser extends Plugin {
	settings: AudioAlchemiserSettings;

	async saveImgFromUrl(url: string, filename: string) {
		try {
			const res = await requestUrl(url);
			const buffer = res.arrayBuffer;
			// save buffer to file
			
			fs.writeFileSync(filename, Buffer.from(buffer));
			return filename;
		} catch (err) {
			console.error(err);
			throw err;
		}
	}

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
			name: "Alchemise",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const datedAudioPath = `${
					this.settings.audioPath
				}/speech-${new Date().toISOString().replace(/:/g, "-")}.mp3`;
				const speechFile = datedAudioPath;
				// path.resolve(basePath + `/speech.mp3`);
				const statusBarItemEl = this.addStatusBarItem();
				statusBarItemEl.setText("Starting alchemisation...");
				const selection = editor.getSelection();
				let txtToSpeech = selection;

				if (this.settings.podcastMode) {
					statusBarItemEl.setText("Generating podcast prompt...");
					const podCompletion = await openai.chat.completions.create({
						messages: [
							{
								role: "system",
								content:
									`Turn the following into a podcast like monologue format (just the host, no guests), very natural sounding. If you come across any code, just explain the code block, do not say any of the code itself. If there are any words that can't be spoken directly, convert them to phonetic sounding (e.g. dotenv == dot e en vee) Deliver the entire podcast in short narrative format. Just return the transcript, nothing else: ` +
									selection,
							},
						],
						model: "gpt-3.5-turbo",
					});

					if (podCompletion.choices[0].message.content) {
						txtToSpeech = podCompletion.choices[0].message.content;
					}

					statusBarItemEl.setText(
						"Podcast prompt generated. Generating audio..."
					);
				}

				const mp3 = await openai.audio.speech.create({
					model: "tts-1",
					voice: "echo", // todo add all voices
					input: txtToSpeech,
				});

				statusBarItemEl.setText("Audio generated. Saving audio...");
				const buffer = Buffer.from(await mp3.arrayBuffer());
				await fs.promises.writeFile(speechFile, buffer);

				statusBarItemEl.setText(
					"Audio saved. Generating art prompt..."
				);
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
					model: "gpt-3.5-turbo",
				});

				statusBarItemEl.setText(
					"Art prompt generated. Generating art..."
				);

				let prompt = completion.choices[0].message.content;

				if (prompt) {
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

					statusBarItemEl.setText("Art generated. Saving art...");

					if (imageUrl === undefined) {
						return {
							prompt: "Error generating prompt.",
							imageUrl: "",
						};
					}

					// save art to file in images folder
					const datedImagePath = `${
						this.settings.imagePath
						// YYYY-MM-DD-HH:mm:ss
					}/image-${new Date().toISOString().replace(/:/g, "-")}.png`;

					await this.saveImgFromUrl(imageUrl, datedImagePath);

					statusBarItemEl.setText(
						"Art saved. Generating alchemised note..."
					);

					const summaryCompletion =
						await openai.chat.completions.create({
							messages: [
								{
									role: "system",
									content:
										`Turn the following into a few word Markdown title. Just return the title, nothing else: ` +
										selection,
								},
							],
							model: "gpt-3.5-turbo",
						});

					const summaryTitle =
						summaryCompletion.choices[0].message.content;

					statusBarItemEl.setText(
						"Alchemised note generated. Saving alchemised note..."
					);

					editor.replaceSelection(
						`![[${datedImagePath.replace(basePath, "")}]]\n\n## ${summaryTitle
							?.trim()
							.replace(/^"|"$/g, "")}\n\n![[${speechFile.replace(basePath, "")}]]`
					);

					statusBarItemEl.setText("");
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
		console.log("saving settings");
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
			.setDesc(
				"Should the model return audio word-for-word (false) or in a more natural podcast format (true)?"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.podcastMode)
					.onChange(async (value) => {
						this.plugin.settings.podcastMode = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Audio Path")
			.setDesc("Path to save audio files")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.audioPath)
					.onChange(async (value) => {
						this.plugin.settings.audioPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Image Path")
			.setDesc("Path to save image files")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.imagePath)
					.onChange(async (value) => {
						this.plugin.settings.imagePath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Alchemised Path")
			.setDesc("Path to save alchemised notes")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.alchemisedPath)
					.onChange(async (value) => {
						this.plugin.settings.alchemisedPath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
