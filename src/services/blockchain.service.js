const { createContracts } = require("../config/blockchain");
const env = require("../config/env");
const { ethers } = require("ethers");

const contracts = createContracts(env);

function receiptHash(receipt) {
  return receipt.hash || receipt.transactionHash || null;
}

function gasMetricsFromReceipt(receipt) {
  const gasUsed = receipt.gasUsed ?? null;
  const gasPrice = receipt.effectiveGasPrice ?? receipt.gasPrice ?? null;
  if (!gasUsed || !gasPrice) {
    return {
      gasUsed: null,
      gasPriceWei: null,
      costWei: null,
      costEth: null,
    };
  }
  const costWei = gasUsed * gasPrice;
  return {
    gasUsed: gasUsed.toString(),
    gasPriceWei: gasPrice.toString(),
    costWei: costWei.toString(),
    costEth: ethers.formatEther(costWei),
  };
}

async function addProductOnChain(productIdOnChain, name) {
  const tx = await contracts.productRegistry.addProduct(BigInt(productIdOnChain), name);
  const receipt = await tx.wait();
  return {
    txHash: receiptHash(receipt),
    blockNumber: Number(receipt.blockNumber),
    gas: gasMetricsFromReceipt(receipt),
  };
}

async function addLifecycleEventOnChain(productIdOnChain, eventType, locationText) {
  const tx = await contracts.productLifecycle.addEvent(
    BigInt(productIdOnChain),
    eventType,
    locationText
  );
  const receipt = await tx.wait();
  return {
    txHash: receiptHash(receipt),
    blockNumber: Number(receipt.blockNumber),
    gas: gasMetricsFromReceipt(receipt),
  };
}

module.exports = {
  contracts,
  addProductOnChain,
  addLifecycleEventOnChain,
};
