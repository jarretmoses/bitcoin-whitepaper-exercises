import { createHash } from 'crypto';

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

let difficulty = 10; // number of leading bits required to be 0

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

for (let line of poem) {
	let bl = createBlock(line);
	Blockchain.blocks.push(bl);
	console.log(`Hash (Difficulty: ${difficulty}): ${bl.hash}`);

	difficulty++;
}


// **********************************

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

function generateHash({
  prevHash,
  data,
  timestamp,
  nonce
}) {
  return createHash('sha256').update(`${prevHash}${data}${timestamp}${nonce}`).digest('hex');
}

function blockHash(bl) {
  let isValid = false;
  let nonce;
  let hash;

  while (!isValid) {
    nonce = Math.floor(Math.random() * Number.MAX_VALUE);
    hash = generateHash({
      prevHash: bl.prevHash,
      data: JSON.stringify(bl.data),
      timestamp: bl.timestamp,
      nonce,
    });

    if (hashIsLowEnough(hash)) {
      isValid = true;
    }
  }

  return hash;
}

function hashIsLowEnough(hash) {
  const leadingChars = Math.floor(difficulty / 4); // 4 bits per hex char
	return hash.slice(0, leadingChars) === ''.padStart(leadingChars, '0');
}

function verifyBlock(bl) {
	if (bl.data == null) return false;
	if (bl.index === 0) {
		if (bl.hash !== "000000") return false;
	}
	else {
		if (!bl.prevHash) return false;
		if (!(
			typeof bl.index === "number" &&
			Number.isInteger(bl.index) &&
			bl.index > 0
		)) {
			return false;
		}
		if (bl.hash !== blockHash(bl)) return false;
	}

	return true;
}

function verifyChain(chain) {
	let prevHash;
	for (let bl of chain.blocks) {
		if (prevHash && bl.prevHash !== prevHash) return false;
		if (!verifyBlock(bl)) return false;
		prevHash = bl.hash;
	}

	return true;
}
