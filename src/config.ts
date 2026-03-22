import dotenv from "dotenv";
dotenv.config();

export const rpcUrl: string = process.env.RPC_URL ?? "";
export const privateKey: string = process.env.PRIVATE_KEY ?? "";
export const windmillAddress: string = process.env.WINDMILL_ADDRESS ?? "";
export const pollInterval: number = parseInt(process.env.POLL_INTERVAL ?? "5000", 10);
