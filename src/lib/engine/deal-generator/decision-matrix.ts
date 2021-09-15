import { DealStage } from "../../util/config.js";
import { DealRelevantEvent } from "./events.js";

const hosting: { [name: string]: (hosting: License['hosting']) => boolean } = {
  isServer: (hosting) => hosting === 'Server',
  isDataCenter: (hosting) => hosting === 'Data Center',
  isCloud: (hosting) => hosting === 'Cloud',
  isAny: (_hosting) => true,
};

const event: { [name: string]: (type: DealRelevantEvent['type']) => boolean } = {
  isNewTrial: (type) => type === 'eval',
  isPurchase: (type) => type === 'purchase',
  isaRenewal: (type) => type === 'renewal',
  isUpgraded: (type) => type === 'upgrade',
  isRefunded: (type) => type === 'refund',
};

const state: { [name: string]: (deals: Deal[]) => [boolean, Deal | undefined] } = {
  hasNothing: (deals) => [deals.length === 0, undefined],
  hasTrial: (deals) => {
    const deal = deals.find(d => d.properties.dealstage === DealStage.EVAL);
    return [!!deal, deal];
  },
  hasNonLost: (deals) => {
    const deal = deals.find(d => d.properties.dealstage !== DealStage.CLOSED_LOST);
    return [!!deal, deal];
  },
  any: (_deals) => [true, _deals[0]],
};

const outcome: { [name: string]: Outcome } = {
  createTrial: { type: 'create', stage: DealStage.EVAL },
  createWon: { type: 'create', stage: DealStage.CLOSED_WON },
  closeWon: { type: 'close', stage: DealStage.CLOSED_WON },
  closeLost: { type: 'close', stage: DealStage.CLOSED_LOST },
  update: { type: 'update' },
};

export const decisionMatrix: DecisionMatrix = [
  [hosting.isServer, event.isNewTrial, state.hasNothing, outcome.createTrial],
  [hosting.isServer, event.isNewTrial, state.hasTrial, outcome.update],
  [hosting.isServer, event.isPurchase, state.hasNothing, outcome.createWon],
  [hosting.isServer, event.isPurchase, state.hasTrial, outcome.closeWon],
  [hosting.isServer, event.isaRenewal, state.any, outcome.createWon],
  [hosting.isServer, event.isUpgraded, state.any, outcome.createWon],

  [hosting.isDataCenter, event.isNewTrial, state.hasNothing, outcome.createTrial],
  [hosting.isDataCenter, event.isNewTrial, state.hasTrial, outcome.update],
  [hosting.isDataCenter, event.isPurchase, state.hasNothing, outcome.createWon],
  [hosting.isDataCenter, event.isPurchase, state.hasTrial, outcome.closeWon],
  [hosting.isDataCenter, event.isaRenewal, state.any, outcome.createWon],
  [hosting.isDataCenter, event.isUpgraded, state.any, outcome.createWon],

  [hosting.isCloud, event.isNewTrial, state.hasNothing, outcome.createTrial],
  [hosting.isCloud, event.isPurchase, state.hasTrial, outcome.closeWon],
  [hosting.isCloud, event.isPurchase, state.hasNothing, outcome.createWon],
  [hosting.isCloud, event.isaRenewal, state.any, outcome.createWon],
  [hosting.isCloud, event.isUpgraded, state.any, outcome.createWon],

  [hosting.isAny, event.isRefunded, state.hasNonLost, outcome.closeLost],
];

export type Outcome = (
  { type: 'create', stage: DealStage } |
  { type: 'close', stage: DealStage } |
  { type: 'update' }
);

type DecisionMatrix = [
  (hosting: License['hosting']) => boolean,
  (type: DealRelevantEvent['type']) => boolean,
  (deals: Deal[]) => [boolean, Deal | undefined],
  Outcome,
][];