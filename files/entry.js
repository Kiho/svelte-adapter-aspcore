import { createWriteStream } from 'fs';
import { installFetch } from '@sveltejs/kit/install-fetch';

import { Server } from 'SERVER';
import { manifest } from 'MANIFEST';

import { cleanup } from './cleanup';

const _isDebug = process.env.NODE_ENV === 'development';

installFetch();

const _server = new Server(manifest);
const _decoder = new TextDecoder();
let _logger = null;

if (_isDebug) {
	const logPath = __dirname + '/debug.log';
	console.info(`log path : ${logPath}`);
	_logger = createWriteStream(logPath, { flags: 'w' });
}

/**
 * @returns {Request}
 * */
function toRequest(req) {
	const { method, headers, rawBody: body, url: originalUrl } = req;
	// because we proxy all requests to the render function,
	// this header contains the URL the user requested
	// const originalUrl = headers['x-ms-original-url'];
	// console.log('originalUrl', originalUrl);
	/** @type {RequestInit} */
	const init = {
		method,
		headers: new Headers(headers)
	};

	if (method !== 'GET' && method !== 'HEAD') {
		init.body = typeof body === 'string' ? Buffer.from(body, 'utf-8') : body;
	}

	return new Request(originalUrl, init);
}

/**
 * @param {Response} rendered
 * @returns {Promise<Record<string, any>>}
 */
async function toResponse(rendered) {
	const { status } = rendered;
	if (status == 404) {
		return null;
	}
	const resBody = new Uint8Array(await rendered.arrayBuffer());

	/** @type {Record<string, string>} */
	const resHeaders = {};
	rendered.headers.forEach((value, key) => {
		resHeaders[key] = value;
	});

	return {
		status,
		body: _decoder.decode(resBody),
		headers: resHeaders,
		isRaw: true
	};
}

const HttpHandler = (callback, origRequest) => {
	try {
		if (_isDebug) {
			_logger.write(`svelte request payload - ${JSON.stringify(origRequest)} \r\n`);
		}

		const req = toRequest(origRequest);
		// @ts-ignore
		_server.respond(req)
			.then((rendered) => toResponse(rendered))
			.then((resp) => {
				if (_isDebug) {
					_logger.write(`svelte response - ${JSON.stringify(resp)} \r\n`);
				}
				if (origRequest.bodyOnlyReply) {
					callback(null, resp?.body);
				} else {
					callback(null, resp);
				}
			})
			.catch((err) => callback(err, null));
	} catch (err) {
		callback(err, null);
	}
};

cleanup(_logger);

module.exports = HttpHandler;
