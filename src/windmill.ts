import { ethers } from "ethers";
import { windmillAddress } from "./config";
import { signer } from "./provider";

const ABI = [
  "function nextOrderId() view returns (uint256)",
  "function getOrder(uint256 id) view returns (address buyToken, address sellToken, uint256 buyAmount, uint256 sellAmount, address maker, bool active)",
  "function priceAt(uint256 orderId, uint256 timestamp) view returns (uint256)",
  "function matchOrders(uint256 buyId, uint256 sellId) returns (bool)",
];

export const windmill = new ethers.Contract(windmillAddress, ABI, signer);
