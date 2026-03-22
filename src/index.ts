import { pollInterval, rpcUrl, windmillAddress } from "./config";
import { scanAndMatch } from "./matcher";

console.log("Windmill EVM Keeper starting...");
console.log(`RPC:      ${rpcUrl}`);
console.log(`Contract: ${windmillAddress}`);
console.log(`Interval: ${pollInterval}ms`);

setInterval(async () => {
  console.log("Scanning...");
  try {
    await scanAndMatch();
  } catch (err) {
    console.error("Scan error:", err);
  }
}, pollInterval);
