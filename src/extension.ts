import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const PERL_MODE: vscode.DocumentFilter = { language: "perl", scheme: "file" };

class PerlDefinitionProvider implements vscode.DefinitionProvider {
	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
		return new Promise((resolve, reject) => {
			let range = document.getWordRangeAtPosition(position);
			let word = document.getText(range);
			console.log(word);

			let wordRegexp = new RegExp(`\\x7f${word}\\x01(\\d+)`);
			let fileRegexp = new RegExp("(.*),\\d");
			let dir = vscode.workspace.rootPath;
			console.log(dir);

			let fileName: string;
			let lineNumber: number;
			let tags = path.join(vscode.workspace.rootPath, "TAGS");
			console.log(tags);

			let stream = fs.createReadStream(tags);
			stream.on("data", (chunk: Buffer) => {
				let sections = chunk.toString().split("\x0c");
				for (var i = 0; i < sections.length; i++) {
					let section = sections[i];
					let lines = section.split("\n");
					for (var j = 0; j < lines.length; j++) {
						var line = lines[j];
						let match = line.match(wordRegexp);
						if (match) {
							lineNumber = parseInt(match[1]);
							fileName = lines[1].match(fileRegexp)[1];
							console.log(fileName, lineNumber);
							let uri = vscode.Uri.file(path.join(vscode.workspace.rootPath, fileName));
							let pos = new vscode.Position(lineNumber - 1, 0);

							return resolve(new vscode.Location(uri, pos));
						}
						if (token.isCancellationRequested) {
							return reject("cancelled!");
						}
					}
				}
				if (typeof lineNumber === "undefined") {
					return reject("could not find tag");
				}
			});
			stream.on("error", error => {
				console.log(error);
			});
			stream.on("close", close => {
				console.log(close);
			});
			stream.on("end", end => {
				console.log(end);
			});
		});
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log("Congratulations, your extension \"vscode-perl\" is now active!");

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(PERL_MODE, new PerlDefinitionProvider()));
	// vscode.languages.setLanguageConfiguration(PERL_MODE.language, {
	// 	wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	// 	comments: {
	// 		lineComment: "#",
	// 	},
	// 	brackets: [
	// 		["{", "}"],
	// 		["[", "]"],
	// 		["(", ")"],
	// 	],
	// });
}
