import { CreatePair } from "../generated/OptionPairFactory/OptionPairFactory";
import {
  ExecuteExercise,
  RequestExercise,
  Write,
} from "../generated/templates/Obligation/Obligation";
import { Transfer } from "../generated/templates/Option/Option";
import {
  OptionPairFactory,
  OptionPair,
  Request,
  Obligation as Position,
  Account,
} from "../generated/schema";
import { Option, Obligation } from "../generated/templates";
import { FACTORY_ADDRESS, ZERO_BI, ADDRESS_ZERO } from "./constants";
import { Bytes } from "@graphprotocol/graph-ts";

function getFactory(): OptionPairFactory {
  let factory = OptionPairFactory.load(FACTORY_ADDRESS);
  if (factory == null) {
    factory = new OptionPairFactory(FACTORY_ADDRESS);
    factory.pairCount = 0;
    factory.totalSatoshis = ZERO_BI;
  }
  return factory as OptionPairFactory;
}

function getAccount(addr: string): Account {
  let account = Account.load(addr);
  if (account == null) {
    account = new Account(addr);
    account.totalSatoshis = ZERO_BI;
    account.totalOptions = ZERO_BI;
    account.totalObligations = ZERO_BI;
  }
  return account as Account;
}

function getPosition(addr: Bytes, writer: string): Position {
  let id = addr
    .toHexString()
    .concat("-")
    .concat(writer);
  let pos = Position.load(id);
  if (pos == null) {
    pos = new Position(id);
    pos.balance = ZERO_BI;
    pos.writer = writer;
    pos.obligation = addr;
  }
  return pos as Position;
}

// called whenever obligations are written or transferred
export function handleWrite(event: Write): void {
  let obligationAddress = event.address;
  let value = event.params.value;

  let toAddress = event.params.to.toHexString();
  if (toAddress != ADDRESS_ZERO) {
    let toPos = getPosition(obligationAddress, toAddress);
    toPos.balance = toPos.balance.plus(value);
    toPos.save();

    let writer = getAccount(toAddress);
    writer.totalObligations = writer.totalObligations.plus(value);
    writer.save();
  }

  let fromAddress = event.params.from.toHexString();
  if (fromAddress != ADDRESS_ZERO) {
    // position should exist if address non-zero
    let fromPos = getPosition(obligationAddress, fromAddress);
    fromPos.balance = fromPos.balance.minus(value);
    fromPos.save();

    let writer = getAccount(fromAddress);
    writer.totalObligations = writer.totalObligations.plus(value);
    writer.save();
  }
}

export function handleTransfer(event: Transfer): void {
  let value = event.params.value;

  let toAddress = event.params.to.toHexString();
  if (toAddress != ADDRESS_ZERO) {
    let toAccount = getAccount(toAddress);
    toAccount.totalOptions = toAccount.totalOptions.plus(value);
    toAccount.save();
  }

  let fromAddress = event.params.from.toHexString();
  if (fromAddress != ADDRESS_ZERO) {
    let fromAccount = getAccount(fromAddress);
    fromAccount.totalOptions = fromAccount.totalOptions.minus(value);
    fromAccount.save();
  }
}

export function handleRequest(event: RequestExercise): void {
  let req = new Request(event.params.id.toHex());
  req.buyer = event.params.buyer;
  req.seller = event.params.seller;
  req.amount = event.params.amount;
  req.save();
}

export function handleExercise(event: ExecuteExercise): void {
  // total amount of satoshis transferred to all option writers
  let factory = getFactory();
  factory.totalSatoshis = factory.totalSatoshis.plus(event.params.satoshis);
  factory.save();

  // total amount of satoshis transferred to a writer
  let writer = getAccount(event.params.seller.toHex());
  writer.totalSatoshis = writer.totalSatoshis.plus(event.params.satoshis);
  writer.save();
}

export function handleNewPair(event: CreatePair): void {
  let factory = getFactory();
  factory.pairCount = factory.pairCount + 1;
  factory.save();

  Option.create(event.params.option);
  Obligation.create(event.params.obligation);

  let id = event.params.option
    .toHexString()
    .concat("-")
    .concat(event.params.obligation.toHexString());

  let pair = new OptionPair(id);
  pair.option = event.params.option;
  pair.obligation = event.params.obligation;
  pair.collateral = event.params.collateral;
  pair.expiryTime = event.params.expiryTime;
  pair.windowSize = event.params.windowSize;
  pair.strikePrice = event.params.strikePrice;
  pair.save();
}
