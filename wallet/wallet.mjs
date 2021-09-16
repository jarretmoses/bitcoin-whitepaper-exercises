"use strict";

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { signature } from 'openpgp';
import { createHash } from 'crypto';
import Blockchain from './blockchain.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYS_DIR = path.join(__dirname,"keys");

const PRIV_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.pub.pgp.key"),"utf8");
const PRIV_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.pub.pgp.key"),"utf8");

let wallet = {
	accounts: {},
};

addAccount(PRIV_KEY_TEXT_1,PUB_KEY_TEXT_1);
addAccount(PRIV_KEY_TEXT_2,PUB_KEY_TEXT_2);

// fake an initial balance in account #1
wallet.accounts[PUB_KEY_TEXT_1].outputs.push(
	{
		account: PUB_KEY_TEXT_1,
		amount: 42,
	}
);

main().catch(console.log);


// **********************************

async function main() {
	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*amount=*/13
	);

	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*amount=*/5
	);

	await spend(
		/*from=*/wallet.accounts[PUB_KEY_TEXT_1],
		/*to=*/wallet.accounts[PUB_KEY_TEXT_2],
		/*amount=*/31
	);

	try {
		await spend(
			/*from=*/wallet.accounts[PUB_KEY_TEXT_2],
			/*to=*/wallet.accounts[PUB_KEY_TEXT_1],
			/*amount=*/40
		);
	}
	catch (err) {
		console.log(err);
	}

	console.log(accountBalance(PUB_KEY_TEXT_1));
	console.log(accountBalance(PUB_KEY_TEXT_2));
	console.log(await Blockchain.verifyChain(Blockchain.chain));
}

function addAccount(privKey,pubKey) {
	wallet.accounts[pubKey] = {
		privKey,
		pubKey,
		outputs: []
	};
}

async function spend(fromAccount,toAccount,amountToSpend) {
	let trData = {
    inputs: [],
    outputs: [],
  };

	// pick inputs to use from fromAccount's outputs (i.e. previous txns, see line 22), sorted descending
	let sortedInputs = [...fromAccount.outputs].sort((a, b) => b.amount - a.amount);
  let inputAmounts = 0;

  const inputsToUse = [];

	for (let input of sortedInputs) {
		// remove input from output-list

    const inputIndex = fromAccount.outputs.indexOf(input);
    fromAccount.outputs.splice(inputIndex, 1);
    inputsToUse.push(input);
    inputAmounts += input.amount;

		// do we have enough inputs to cover the spent amount?
    if (inputAmounts >= amountToSpend) break;
	}

  if (inputAmounts < amountToSpend) {
    fromAccount.outputs.push(...inputsToUse);
    throw `Don't have enough to spend ${amountToSpend}!`;
  }

	// sign and record inputs

  const inputs = await Promise.all(
    inputsToUse.map(async (input) => {
      const trData = {
        account: input.account,
        amount: input.amount,
      }

      await Blockchain.authorizeInput(trData, fromAccount.privKey);

      return trData;
    })
  )
  trData.inputs.push(...inputs);

  // record output
  trData.outputs.push({
    account: toAccount.pubKey,
    amount: amountToSpend
  });

	// is "change" output needed?
  if (inputAmounts > amountToSpend) {
    const refund = inputAmounts - amountToSpend;
    const refundOutput = {
      amount: refund,
      account: fromAccount.pubKey,
    }

    // why isnt this fromAccount.outputs
    trData.outputs.push(refundOutput);
  }


	// create transaction and add it to blockchain
	let tr = Blockchain.createTransaction(trData);
	Blockchain.insertBlock(
    Blockchain.createBlock([tr])
	);

	// record outputs in our wallet (if needed)
  trData.outputs.forEach((output) => {
    wallet.accounts[output.account]?.outputs?.push(output);
  })

}

function accountBalance(account) {
	let balance = 0;

	if (account in wallet.accounts) {
    balance = wallet.accounts[account].outputs.reduce((memo, output) => (
      memo += output.amount
    ), 0)
	}


	return balance;
}

