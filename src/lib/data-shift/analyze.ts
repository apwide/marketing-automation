import { DateTime } from "luxon";
import { DataSet } from "../data/set";
import { ConsoleLogger } from "../log/console";
import { Marketplace } from "../marketplace/marketplace";
import { License, LicenseData } from "../model/license";
import { Transaction, TransactionData } from "../model/transaction";
import { MultiRecordMap } from "./multi-id-map";

const LATE_TRANSACTION_THRESHOLD = 30;

interface DeletedRecordIssue {
  kind: string,
  id: string,
  timestampChecked: string,
}

interface LateTransactionIssue {
  id: string,
  expected: string,
  found: string,
}

interface AlteredRecordIssue {
  kind: string,
  id: string,
  key: string,
  val: any,
  lastVal: any,
}

export class DataShiftAnalyzer {

  #logStep = (...args: any[]) => this.console?.printInfo('Analyze Data Shift', ...args);

  constructor(
    private console?: ConsoleLogger,
  ) { }

  public run(dataSetsAsc: DataSet[]) {
    return {

      deletedLicenses:
        this.#checkForDeletedRecords(dataSetsAsc, 'license'),

      deletedTransactions:
        this.#checkForDeletedRecords(dataSetsAsc, 'transaction'),

      lateTransactions:
        this.#checkForWrongTransactionDates(dataSetsAsc),

      alteredTransactions:
        this.#checkForAlteredTransactionData(dataSetsAsc),

      alteredLicenses:
        this.#checkForAlteredLicenseData(dataSetsAsc),

    };
  }

  #checkForDeletedRecords(dataSetsAsc: DataSet[], kind: 'license' | 'transaction') {
    const deletedRecords: DeletedRecordIssue[] = [];

    const getRecords = (mpac: Marketplace) => kind === 'license' ? mpac.licenses : mpac.transactions;

    this.#logStep(`Checking for deleted ${kind}s: Starting...`);

    const [firstDataset, ...remainingDataSets] = dataSetsAsc;

    let lastRecordMap = new MultiRecordMap<License | Transaction, true>();
    for (const record of getRecords(firstDataset.mpac)) {
      lastRecordMap.set(record, true);
    }

    for (const ds of remainingDataSets) {
      const currentRecordMap = new MultiRecordMap<License | Transaction, true>();
      for (const record of getRecords(ds.mpac)) {
        currentRecordMap.set(record, true);
      }

      for (const [record,] of lastRecordMap.entries()) {
        const found = currentRecordMap.get(record);
        if (!found) {
          deletedRecords.push({
            kind,
            id: record.id,
            timestampChecked: ds.timestamp.toISO(),
          });
        }
      }

      lastRecordMap = currentRecordMap;
    }

    this.#logStep(`Checking for deleted ${kind}s: Done`);

    return deletedRecords;
  }

  #checkForWrongTransactionDates(dataSetsAsc: DataSet[]) {
    const lateTransactions: LateTransactionIssue[] = [];

    this.#logStep(`Checking for late transactions: Starting...`);

    const dataSetsDesc = [...dataSetsAsc].reverse();
    const transactionMap = new MultiRecordMap<Transaction, DateTime>();

    for (const ds of dataSetsDesc) {
      for (const transaction of ds.mpac.transactions) {
        transactionMap.set(transaction, ds.timestamp);
      }
    }

    const earliest = dataSetsDesc[dataSetsDesc.length - 1].timestamp;

    for (const [transaction, foundDate] of transactionMap.entries()) {
      const claimedDate = DateTime.fromISO(transaction.data.saleDate);
      const diff = foundDate.diff(claimedDate, 'days');

      if (foundDate.toMillis() === earliest.toMillis()) {
        continue;
      }

      if (diff.days > LATE_TRANSACTION_THRESHOLD) {
        lateTransactions.push({
          id: transaction.id,
          expected: transaction.data.saleDate,
          found: foundDate.toISO(),
        });
      }
    }

    this.#logStep(`Checking for late transactions: Done`);

    return lateTransactions;
  }

  #checkForAlteredTransactionData(dataSetsAsc: DataSet[]) {
    const alteredRecords: AlteredRecordIssue[] = [];

    this.#logStep(`Checking for altered transaction data: Starting...`);

    const map = new MultiRecordMap<Transaction, TransactionData>();

    for (const dataSet of dataSetsAsc) {
      for (const transaction of dataSet.mpac.transactions) {
        const data = transaction.data;
        const lastData = map.get(transaction);
        if (lastData) {
          const keysToExamine: (keyof TransactionData)[] = [
            'saleDate', 'saleType',
            'addonKey', 'addonName', 'hosting',
            'country', 'region',
            'purchasePrice', 'vendorAmount',
            'billingPeriod',
            'maintenanceStartDate', 'maintenanceEndDate',
          ];
          for (const key of keysToExamine) {
            const val = data[key];
            const lastVal = lastData[key];
            if (val !== lastVal) {
              alteredRecords.push({
                kind: `transaction`,
                id: transaction.id,
                key,
                val,
                lastVal,
              });
            }
          }
        }
        map.set(transaction, data);
      }
    }

    this.#logStep(`Checking for altered transaction data: Done`);

    return alteredRecords;
  }

  #checkForAlteredLicenseData(dataSetsAsc: DataSet[]) {
    const alteredRecords: AlteredRecordIssue[] = [];

    this.#logStep(`Checking for altered license data: Starting...`);

    const map = new MultiRecordMap<License, LicenseData>();

    for (const dataSet of dataSetsAsc) {
      for (const license of dataSet.mpac.licenses) {
        const data = license.data;
        const lastData = map.get(license);
        if (lastData) {
          const keysToExamine: (keyof LicenseData)[] = [
            'addonKey', 'addonName', 'hosting',
            'maintenanceStartDate',
          ];
          for (const key of keysToExamine) {
            const val = data[key];
            const lastVal = lastData[key];
            if (val !== lastVal) {
              alteredRecords.push({
                kind: `license`,
                id: license.id,
                key,
                val,
                lastVal,
              });
            }
          }

        }
        map.set(license, data);
      }
    }

    this.#logStep(`Checking for altered license data: Done`);

    return alteredRecords;
  }

}
