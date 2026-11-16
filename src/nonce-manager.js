import { ethers } from "ethers";

/**
 * Wraps ethers.NonceManager to automatically recover and reset cached nonces
 * after failed transaction submissions (e.g. gas estimation reverts before broadcast)
 * preventing permanent nonce gaps.
 */
export class RecoverableNonceManager extends ethers.NonceManager {
  /**
   * @param {ethers.Signer} signer
   */
  constructor(signer) {
    super(signer);
    if ("address" in signer) {
      this.address = signer.address;
    }
  }

  /**
   * @param {ethers.TransactionRequest} tx
   */
  async sendTransaction(tx) {
    const noncePromise = this.getNonce("pending");
    // Attach no-op handler immediately to prevent unhandled rejection if population fails first
    noncePromise.catch(() => {});
    this.increment();

    let populatedTx;
    try {
      const nonce = await noncePromise;
      populatedTx = await this.signer.populateTransaction(tx);
      populatedTx.nonce = nonce;
    } catch (err) {
      // Known pre-broadcast failure (e.g. estimateGas / simulation revert or nonce lookup failure):
      // The transaction was never broadcast to the network. Reset to avoid nonce gaps.
      this.reset();
      throw err;
    }

    try {
      return await this.signer.sendTransaction(populatedTx);
    } catch (err) {
      await this.reconcileNonce(populatedTx);
      throw err;
    }
  }

  /**
   * @param {ethers.TransactionRequest} tx
   */
  async reconcileNonce(tx) {
    try {
      if (this.signer.provider && tx?.nonce !== undefined) {
        const address = await this.getAddress();
        const pendingCount = await this.signer.provider.getTransactionCount(address, "pending");
        if (pendingCount <= tx.nonce) {
          this.reset();
        }
      } else {
        this.reset();
      }
    } catch {
      this.reset();
    }
  }
}
