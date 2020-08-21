import { CreatePair } from "../generated/OptionPairFactory/OptionPairFactory";
import { ExecuteExercise } from "../generated/templates/Obligation/Obligation";
import {
  OptionPairFactory,
  OptionPair,
  Option,
  Obligation,
  Writer,
} from "../generated/schema";

import { FACTORY_ADDRESS, ZERO_BI } from "./constants";

function getFactory(): OptionPairFactory {
  let factory = OptionPairFactory.load(FACTORY_ADDRESS);
  if (factory == null) {
    factory = new OptionPairFactory(FACTORY_ADDRESS);
    factory.pairCount = 0;
    factory.totalSatoshis = ZERO_BI;
  }
  return factory as OptionPairFactory;
}

function getWriter(addr: string): Writer {
  let writer = Writer.load(addr);
  if (writer == null) {
    writer = new Writer(addr);
    writer.totalSatoshis = ZERO_BI;
  }
  return writer as Writer;
}

export function handleExercise(event: ExecuteExercise): void {
  // total amount of satoshis transferred to all option writers
  let factory = getFactory();
  factory.totalSatoshis.plus(event.params.satoshis);
  factory.save();

  // total amount of satoshis transferred to a writer
  let writer = getWriter(event.params.seller.toHex());
  writer.totalSatoshis.plus(event.params.satoshis);
  writer.save();
}

export function handleNewPair(event: CreatePair): void {
  let factory = getFactory();
  factory.pairCount = factory.pairCount + 1;
  factory.save();

  let option = new Option(event.params.option.toHex());
  option.save();

  let obligation = new Obligation(event.params.obligation.toHex());
  obligation.save();

  let pair = new OptionPair(event.params.pair.toHex());
  pair.option = event.params.option;
  pair.obligation = event.params.obligation;
  pair.collateral = event.params.collateral;
  pair.expiryTime = event.params.expiryTime;
  pair.windowSize = event.params.windowSize;
  pair.strikePrice = event.params.strikePrice;
  pair.save();
}
