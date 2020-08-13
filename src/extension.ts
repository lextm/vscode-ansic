/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Logger } from './logger';


import * as util from './common';
import { ExtensionDownloader } from './ExtensionDownloader';
import * as LanguageServer from './languageServer/extension';

let extensionPath = "";

export function getExtensionPath(): string {
	return extensionPath;
}

export async function activate(context: vscode.ExtensionContext): Promise<{ initializationFinished: Promise<void> }> {
	extensionPath = context.extensionPath;

	const extensionId = 'lextudio.ansic';
	const extension = vscode.extensions.getExtension(extensionId);
	util.setExtensionPath(context.extensionPath);

	const logger = new Logger();
	logger.log('Please visit https://github.com/lextm/vscode-ansic to learn how to configure the extension.');

	const disableLsp = !platformIsSupported(logger);// TODO: || Configuration.getLanguageServerDisabled();
	// *
	if (!disableLsp) {
		await ensureRuntimeDependencies(extension, logger);
	}
	// */

	// activate language services
	const lspPromise = LanguageServer.activate(context, logger, disableLsp);
	return {
		initializationFinished: Promise.all([lspPromise])
			.then((promiseResult) => {
				// This promise resolver simply swallows the result of Promise.all.
				// When we decide we want to expose this level of detail
				// to other extensions then we will design that return type and implement it here.
			}),
	};
}

function ensureRuntimeDependencies(extension: vscode.Extension<any>, logger: Logger): Promise<boolean> {
    return util.installFileExists(util.InstallFileType.Lock)
        .then((exists) => {
            if (!exists) {
                const downloader = new ExtensionDownloader(logger, extension.packageJSON);
                return downloader.installRuntimeDependencies();
            } else {
                return true;
            }
        });
}

function platformIsSupported(logger: Logger): boolean {
	var getos = require('getos')
 
	let dist: string;
	let platform: string;
	getos(function(e,os) {
	  if(e) {
		  logger.log("Failed to learn the OS.");
		  logger.log(e);
		  return;
	  }
	  logger.log("Your OS is:" +JSON.stringify(os));
	  dist = os.dist;
	  platform = os.os;
	});

	if (platform === 'darwin' || platform === 'win32') {
		return true;
	}

	if (!dist) {
		logger.log("Unknown distribution.");
		return false;
	}

    // TODO:
	// const supportedPlatforms = Configuration.getSupportedPlatforms();
    // supportedPlatforms.forEach(item => {
	// 	if (dist.toLowerCase().indexOf(item) > -1 ) {
	// 		logger.log("Supported distribution.");
	// 		return true;
	// 	}
	// });

	logger.log("Not-supported distribution.")
	return false;
}
