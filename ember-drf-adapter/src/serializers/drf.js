import { decamelize } from '@ember/string';
import { isNone } from '@ember/utils';
import RESTSerializer from '@ember-data/serializer/rest';

const PAGENUM_REGEX = /.*?[?&]page=(\d+).*?/;
const REL_REGEX = /^((https?:)?\/\/|\/)\w/; // Matches strings starting with: https://, http://, //, /

export default class DrfSerializer extends RESTSerializer {
  /**
   * Returns the resource's relationships formatted as a JSON-API "relationships object".
   *
   * http://jsonapi.org/format/#document-resource-object-relationships
   *
   * This version adds a 'links' hash with relationship urls before invoking the
   * RESTSerializer's version.
   *
   * @method extractRelationships
   * @param {Object} modelClass
   * @param {Object} resourceHash
   * @return {Object}
   */
  extractRelationships(modelClass, resourceHash) {
    if (!Object.hasOwn(resourceHash, 'links')) {
      resourceHash['links'] = {};
    }

    modelClass.eachRelationship(function (key, relationshipMeta) {
      const payloadRelKey = this.keyForRelationship(key);

      if (!Object.hasOwn(resourceHash, payloadRelKey)) {
        return;
      }

      if (
        relationshipMeta.kind === 'hasMany' ||
        relationshipMeta.kind === 'belongsTo'
      ) {
        // Matches strings starting with: https://, http://, //, /
        const payloadRel = resourceHash[payloadRelKey];
        if (
          !isNone(payloadRel) &&
          !isNone(payloadRel.match) &&
          typeof payloadRel.match === 'function' &&
          payloadRel.match(REL_REGEX)
        ) {
          resourceHash['links'][key] = resourceHash[payloadRelKey];
          delete resourceHash[payloadRelKey];
        }
      }
    }, this);

    return super.extractRelationship(modelClass, resourceHash);
  }

  /**
   *  Returns the number extracted from the page number query param of
   *  a `url`. `null` is returned when the page number query param
   *  isn't present in the url. `null` is also returned when `url` is
   *  `null`.
   *
   * @method extractPageNumber
   * @private
   * @param {String} url
   * @return {Number} page number
   */
  extractPageNumber(url) {
    const match = PAGENUM_REGEX.exec(url);
    if (match) {
      return Number(match[1]).valueOf();
    }
    return null;
  }

  /**
   * Converts DRF API server responses into the format expected by the RESTSerializer.
   *
   * If the payload has DRF metadata and results properties, all properties that aren't in
   * the results are added to the 'meta' hash so that Ember Data can use these properties
   * for metadata. The next and previous pagination URLs are parsed to make it easier to
   * paginate data in applications. The RESTSerializer's version of this function is called
   * with the converted payload.
   *
   * @method normalizeResponse
   * @param {DS.Store} store
   * @param {DS.Model} primaryModelClass
   * @param {Object} payload
   * @param {String|Number} id
   * @param {String} requestType
   * @return {Object} JSON-API Document
   */
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let convertedPayload = {};

    if (
      !isNone(payload) &&
      Object.hasOwn(payload, 'next') &&
      Object.hasOwn(payload, 'previous') &&
      Object.hasOwn(payload, 'results')
    ) {
      // Move DRF metadata to the meta hash.
      convertedPayload[primaryModelClass.modelName] = JSON.parse(
        JSON.stringify(payload.results)
      );
      delete payload.results;
      convertedPayload['meta'] = JSON.parse(JSON.stringify(payload));

      // The next and previous pagination URLs are parsed to make it easier to paginate data in applications.
      if (!isNone(convertedPayload.meta['next'])) {
        convertedPayload.meta['next'] = this.extractPageNumber(
          convertedPayload.meta['next']
        );
      }
      if (!isNone(convertedPayload.meta['previous'])) {
        let pageNumber = this.extractPageNumber(
          convertedPayload.meta['previous']
        );
        // The DRF previous URL doesn't always include the page=1 query param in the results for page 2. We need to
        // explicitly set previous to 1 when the previous URL is defined but the page is not set.
        if (isNone(pageNumber)) {
          pageNumber = 1;
        }
        convertedPayload.meta['previous'] = pageNumber;
      }
    } else {
      convertedPayload[primaryModelClass.modelName] = JSON.parse(
        JSON.stringify(payload)
      );
    }

    // return single result for requestType 'queryRecord'
    let records = convertedPayload[primaryModelClass.modelName];
    if (requestType === 'queryRecord' && Array.isArray(records)) {
      let first = records.length > 0 ? records[0] : null;
      convertedPayload[primaryModelClass.modelName] = first;
    }

    return super.normalizeResponse(
      store,
      primaryModelClass,
      convertedPayload,
      id,
      requestType
    );
  }

  /**
   * Customize how a serialized record is added to the JSON hash sent to
   * the server.
   * @method serializeIntoHash
   * @param {Object} hash
   * @param {subclass of DS.Model} type
   * @param {DS.Snapshot} snapshot
   * @param {Object} options
   */
  serializeIntoHash(hash, _type, snapshot, options) {
    Object.assign(hash, this.serialize(snapshot, options));
  }

  /**
   * Converts camelCased attributes to snake_case.
   */
  keyForAttribute(key) {
    return decamelize(key);
  }

  /**
   * Converts camelCased relationship names to snake_case.
   */
  keyForRelationship(key) {
    return decamelize(key);
  }
}
