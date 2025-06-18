import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'aeropost/1.59.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Get package PreAlert by id
   *
   * @summary Get PreAlert
   * @throws FetchError<400, types.Get1Response400> Bad Request
   */
  get_1(metadata: types.Get1MetadataParam): Promise<FetchResponse<200, types.Get1Response200>> {
    return this.core.fetch('/api/pre-alerts/{id}', 'get', metadata);
  }

  /**
   * Update a previously created Pre Alert
   *
   * @summary Update PreAlert
   * @throws FetchError<400, types.UpdateResponse400> Bad Request
   */
  update(body: types.UpdateBodyParam, metadata: types.UpdateMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/api/pre-alerts/{id}', 'put', body, metadata);
  }

  /**
   * Delete package PreAlert by id
   *
   * @summary Delete PreAlert
   * @throws FetchError<400, types.DeleteResponse400> Bad Request
   */
  delete(metadata: types.DeleteMetadataParam): Promise<FetchResponse<number, unknown>> {
    return this.core.fetch('/api/pre-alerts/{id}', 'delete', metadata);
  }

  /**
   * Create package PreAlert
   *
   * @summary Create PreAlert
   * @throws FetchError<400, types.CreateResponse400> Bad Request
   * @throws FetchError<409, types.CreateResponse409> Package already in Miami, please check details and errors for further instructions.
   */
  create(body: types.CreateBodyParam, metadata?: types.CreateMetadataParam): Promise<FetchResponse<201, types.CreateResponse201>> {
    return this.core.fetch('/api/pre-alerts', 'post', body, metadata);
  }

  /**
   * Returns the list of packages that match the provided filters.
   *
   * @summary Get account packages
   * @throws FetchError<400, types.PackagesResponse400> Bad Request
   */
  packages(metadata?: types.PackagesMetadataParam): Promise<FetchResponse<200, types.PackagesResponse200>> {
    return this.core.fetch('/api/v2/packages', 'get', metadata);
  }

  /**
   * Returns a package by aerotrack or courier number
   *
   * @summary Get package
   * @throws FetchError<400, types.GetResponse400> Bad Request
   */
  get(metadata: types.GetMetadataParam): Promise<FetchResponse<200, types.GetResponse200>> {
    return this.core.fetch('/api/v2/packages/{tracking}', 'get', metadata);
  }

  /**
   * Returns the package status history
   *
   * @summary Get status history
   * @throws FetchError<400, types.GetStatusHistoryResponse400> Bad Request
   */
  getStatusHistory(metadata: types.GetStatusHistoryMetadataParam): Promise<FetchResponse<200, types.GetStatusHistoryResponse200>> {
    return this.core.fetch('/api/v2/packages/{tracking}/status-history', 'get', metadata);
  }

  /**
   * Returns a summary of package charges if available.
   *
   * @summary Get charges summary
   * @throws FetchError<400, types.GetChargesSummaryResponse400> Bad Request
   */
  getChargesSummary(metadata: types.GetChargesSummaryMetadataParam): Promise<FetchResponse<200, types.GetChargesSummaryResponse200>> {
    return this.core.fetch('/api/v2/packages/{tracking}/charges-summary', 'get', metadata);
  }

  /**
   * Get all valid courier companies.
   *
   * @summary Get courier companies
   */
  getAllCouriers(): Promise<FetchResponse<200, types.GetAllCouriersResponse200>> {
    return this.core.fetch('/api/couriers', 'get');
  }

  /**
   * Gets all consignees from your account
   *
   * @summary Gets consignees
   */
  getConsignees(): Promise<FetchResponse<200, types.GetConsigneesResponse200>> {
    return this.core.fetch('/api/consignees', 'get');
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { CreateBodyParam, CreateMetadataParam, CreateResponse201, CreateResponse400, CreateResponse409, DeleteMetadataParam, DeleteResponse400, Get1MetadataParam, Get1Response200, Get1Response400, GetAllCouriersResponse200, GetChargesSummaryMetadataParam, GetChargesSummaryResponse200, GetChargesSummaryResponse400, GetConsigneesResponse200, GetMetadataParam, GetResponse200, GetResponse400, GetStatusHistoryMetadataParam, GetStatusHistoryResponse200, GetStatusHistoryResponse400, PackagesMetadataParam, PackagesResponse200, PackagesResponse400, UpdateBodyParam, UpdateMetadataParam, UpdateResponse400 } from './types';
