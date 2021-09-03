// Includes crypto module
import { createHash }from 'crypto';

// Calling createHash method
const GENESIS_BLOCK_HASH = '000000';

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

const Blockchain = {
  blocks: [],

  addBlock(block) {
    this.blocks.push(block);
  },

  getBlocks() {
    return this.blocks;
  }
}

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: GENESIS_BLOCK_HASH,
	data: "",
	timestamp: Date.now(),
});

function generateHash({prevHash, text, timestamp}) {
  return createHash('sha256').update(`${prevHash}${text}${timestamp}`).digest('hex');
}

/**
 * @name createBlock
 * @param {string} text - text input to be used for block
 * @description takes a text input and generates a block which includes
 * an index, has of the previous block, a new has for the current block,
 * the data which was passed in and a timestamp
 */
function createBlock(text) {
  const blockchainLength = Blockchain.blocks.length;
  const currBlock = Blockchain.blocks[Blockchain.blocks.length - 1];
  const nextIndex = blockchainLength;
  const timestamp = Date.now();

  return {
    index: nextIndex,
    prevHash: currBlock.hash,
    hash: generateHash({
      prevHash: currBlock.hash,
      text,
      timestamp
    }),
    data: text,
    timestamp,
  };
}

/**
 * @name createChain
 * creates the "Blockchain"
 */
function createChain() {
  poem.forEach((text) => {
    const block = createBlock(text);

    Blockchain.addBlock(block);
  })
}
/**
 * @name verifyBlock
 * @param block current block to check
 * @param prevBlock previous block to check against
 * @returns boolean
 * @description verifies a block based on the following conditions
 *   data must be non-empty (unless genesis block?)
 *   for the genesis block only, the hash must be "000000"
 *   prevHash must be non-empty
 *   index must be an integer >= 0
 *   the hash must match what recomputing the hash with blockHash(..) produces
 */
function verifyBlock(block, prevBlock) {
  const {
    data,
    index,
    hash,
    prevHash,
    timestamp
  } = block;

  // CHeck genesis block
  if (index === 0) {
    return hash === GENESIS_BLOCK_HASH;
  }

  const hasData = Boolean(data);
  const correctIndex = index >= 0;
  const hashMatches = hash === generateHash({
    prevHash: prevBlock.hash,
    text: data,
    timestamp
  });
  const hasChainMatched = prevBlock.hash === prevHash;

  return [hasData, correctIndex, hashMatches, hasChainMatched].every(val => val);
}

/**
 * @name verifyChain
 * @description - checks all blocks in the chain to ensure the chain is valid
 */
function verifyChain() {
  const blocks = Blockchain.getBlocks();

  // Returns an array of true or false values based on outcome of block verification
  const blockVerifications = blocks.map((block, i) => verifyBlock(block, blocks[i-1]));

  return blockVerifications.every(val => val);
}

createChain();

// Uncomment the following to test a broken chain (verifyChain fails)
// Blockchain.addBlock({
//   index: 5,
//   hash: '1238712931213123123123',
//   prevHash: '837393434',
//   data: '12313123',
//   timestamp: Date.now(),
// })
console.log(`Chain is valid: ${verifyChain()}`)
