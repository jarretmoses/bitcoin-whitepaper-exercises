"use strict";

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const KEYS_DIR = path.join(__dirname,"keys");
const PUB_KEY_TEXT = fs.readFileSync(path.join(KEYS_DIR,"pub.pgp.key"),"utf8");

// The Power of a Smile
// by Tupac Shakur
const poem = [
	"The power of a gun can kill",
	"and the power of fire can burn",
	"the power of wind can chill",
	"and the power of a mind can learn",
	"the power of anger can rage",
	"inside until it tears u apart",
	"but the power of a smile",
	"especially yours can heal a frozen heart",
];

const maxBlockSize = 4;
const blockFee = 5;
let difficulty = 16;

const Blockchain = {
	blocks: [],
};

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: "000000",
	data: "",
	timestamp: Date.now(),
});

var transactionPool = [];

addPoem();
processPool();
countMyEarnings();


// **********************************

function addPoem() {
	// TODO: add lines of poem as transactions to the transaction-pool
}

function processPool() {
	// TODO: process the transaction-pool in order of highest fees
}

function countMyEarnings() {
	// TODO: count up block-fees and transaction-fees
}

function createBlock(data) {
	const bl = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data,
		timestamp: Date.now(),
	};

	bl.hash = blockHash(bl);

	return bl;
}

function blockHash(bl) {
	while (true) {
		bl.nonce = Math.trunc(Math.random() * 1E7);
		let hash = crypto.createHash("sha256").update(
			`${bl.index};${bl.prevHash};${JSON.stringify(bl.data)};${bl.timestamp};${bl.nonce}`
		).digest("hex");

		if (hashIsLowEnough(hash)) {
			return hash;
		}
	}
}

function hashIsLowEnough(hash) {
	const neededChars = Math.ceil(difficulty / 4);
	const threshold = Number(`0b${"".padStart(neededChars * 4,"1111".padStart(4 + difficulty,"0"))}`);
	const prefix = Number(`0x${hash.substr(0,neededChars)}`);
	return prefix <= threshold;
}

function createTransaction(data) {
	const tr = {
		data,
	};

	tr.hash = transactionHash(tr);

	return tr;
}

function transactionHash(tr) {
	return crypto.createHash("sha256").update(
		`${JSON.stringify(tr.data)}`
	).digest("hex");
}
