/* eslint-disable prefer-const */
import { ethereum } from "@graphprotocol/graph-ts";
import { Block } from "../generated/schema";

export function handleBlock(block: ethereum.Block): void {
  let entity = new Block(block.hash.toHex());
  entity.parentHash = block.parentHash;
  entity.unclesHash = block.unclesHash;
  entity.author = block.author;
  entity.stateRoot = block.stateRoot;
  entity.transactionsRoot = block.transactionsRoot;
  entity.receiptsRoot = block.receiptsRoot;
  entity.number = block.number;
  entity.gasUsed = block.gasUsed;
  entity.gasLimit = block.gasLimit;
  entity.timestamp = block.timestamp;
  entity.difficulty = block.difficulty;
  entity.totalDifficulty = block.totalDifficulty;
  entity.size = block.size;
  entity.save();
}