import DrfAdapter from 'ember-drf-adapter/adapters/drf';

export default class ApplicationAdapter extends DrfAdapter {
  host = 'test-host';
  namespace = 'test-api';
}
