import 'source-map-support/register';
import { engineConfigFromENV } from '../lib/config/env';
import { dataManager } from '../lib/data/manager';
import { Engine } from "../lib/engine";
import { Hubspot } from '../lib/hubspot';
import { isPresent, sorter } from "../lib/util/helpers";

const engine = new Engine(new Hubspot(), engineConfigFromENV());
const dataSet = dataManager.latestDataSet();
const logDir = dataSet.logDirNamed(`inspect-${Date.now()}`);
const data = dataSet.load();
engine.run(data);

const attributions = (engine
  .mpac.licenses
  .map(l => l.data.attribution)
  .filter(isPresent)
  .sort(sorter(a => [
    Object.keys(a).length,
    a.channel,
    a.referrerDomain,
  ].join(',')))
);

logDir.attributionsLog()!.writeArray(attributions.map(a => ({
  channel: a.channel,
  referrerDomain: a.referrerDomain,
  campaignName: a.campaignName,
  campaignSource: a.campaignSource,
  campaignMedium: a.campaignMedium,
  campaignContent: a.campaignContent,
})));
