import { Entity } from "../hubspot/entity";
import { EntityAdapter } from "../hubspot/interfaces";
import { EntityManager } from "../hubspot/manager";
import { Contact } from "./contact";

type CompanyData = {
  name: string;
  type: 'Partner' | null;
};

export interface HubspotCompanyConfig {
  managedFields?: Set<string>,
}

export class Company extends Entity<CompanyData> {

  public contacts = this.makeDynamicAssociation<Contact>('contact');

}

function makeAdapter(config: HubspotCompanyConfig): EntityAdapter<CompanyData> {
  return {
    kind: 'company',

    associations: {
      contact: 'down',
    },

    data: {
      name: {
        property: 'name',
        down: name => name ?? '',
        up: name => name,
      },
      type: {
        property: 'type',
        down: type => type === 'PARTNER' ? 'Partner' : null,
        up: type => type === 'Partner' ? 'PARTNER' : '',
      },
    },

    additionalProperties: [],

    managedFields: config.managedFields ?? new Set(),
  }
}

export class CompanyManager extends EntityManager<CompanyData, Company> {

  protected override Entity = Company;
  public override entityAdapter: EntityAdapter<CompanyData>;

  constructor(typeMappings: Map<string, string>, config: HubspotCompanyConfig) {
    super(typeMappings);
    this.entityAdapter = makeAdapter(config)
  }
}
