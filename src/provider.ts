import { ethers } from "ethers";
import { rpcUrl, privateKey } from "./config";

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

export const signer = wallet.connect(provider);
