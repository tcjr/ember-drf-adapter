import { module, test } from 'qunit';

import { setupTest } from 'test-app/tests/helpers';

module('Unit | Adapter | drf', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.adapter = this.owner.lookup('adapter:application');
    this.adapter.set('host', 'test-host');
  });

  test('host config override', function (assert) {
    var adapter = this.adapter;
    assert.strictEqual(adapter.get('host'), 'test-host');
  });

  test('namespace config override', function (assert) {
    var adapter = this.adapter;
    assert.strictEqual(adapter.get('namespace'), 'test-api');
  });

  test('pathForType', function (assert) {
    var adapter = this.adapter;
    assert.strictEqual(adapter.pathForType('Animal'), 'animals');
    assert.strictEqual(adapter.pathForType('FurryAnimals'), 'furry-animals');
  });

  test('buildURL', function (assert) {
    var adapter = this.adapter;
    assert.strictEqual(
      adapter.buildURL('Animal', 5, null),
      'test-host/test-api/animals/5/'
    );
    assert.strictEqual(
      adapter.buildURL('FurryAnimals', 5, null),
      'test-host/test-api/furry-animals/5/'
    );
    assert.strictEqual(
      adapter.buildURL('Animal', null, null, 'query', { limit: 10 }),
      'test-host/test-api/animals/'
    );
  });

  test('buildURL - no trailing slashes', function (assert) {
    var adapter = this.adapter;
    adapter.set('addTrailingSlashes', false);
    assert.strictEqual(
      adapter.buildURL('Animal', 5, null),
      'test-host/test-api/animals/5'
    );
    assert.strictEqual(
      adapter.buildURL('FurryAnimals', 5, null),
      'test-host/test-api/furry-animals/5'
    );
    assert.strictEqual(
      adapter.buildURL('Animal', null, null, 'query', { limit: 10 }),
      'test-host/test-api/animals'
    );
  });

  test('handleResponse - returns invalid error if 400 response', function (assert) {
    const headers = {},
      status = 400,
      payload = {
        name: ['This field cannot be blank.'],
        post_title: [
          'This field cannot be blank.',
          'This field cannot be empty.',
        ],
      };

    var adapter = this.adapter;
    var error = adapter.handleResponse(status, headers, payload);
    assert.strictEqual(error.errors[0].detail, 'This field cannot be blank.');
    assert.strictEqual(error.errors[0].source.pointer, '/data/attributes/name');
    assert.strictEqual(error.errors[0].title, 'Invalid Attribute');

    assert.strictEqual(error.errors[1].detail, 'This field cannot be blank.');
    assert.strictEqual(
      error.errors[1].source.pointer,
      '/data/attributes/post_title'
    );
    assert.strictEqual(error.errors[1].title, 'Invalid Attribute');

    assert.strictEqual(error.errors[2].detail, 'This field cannot be empty.');
    assert.strictEqual(
      error.errors[2].source.pointer,
      '/data/attributes/post_title'
    );
    assert.strictEqual(error.errors[2].title, 'Invalid Attribute');
  });

  test('handleResponse - returns error if not 400 response', function (assert) {
    const headers = {},
      status = 403,
      payload = {
        detail: 'You do not have permission to perform this action.',
      },
      adapter = this.adapter;
    var error = adapter.handleResponse(status, headers, payload);
    assert.strictEqual(error.errors[0].detail, payload.detail);
  });

  test('handleResponse - returns error if payload is empty', function (assert) {
    const headers = {},
      status = 409,
      payload = {},
      adapter = this.adapter;
    var error = adapter.handleResponse(status, headers, payload);
    assert.strictEqual(error.errors[0].detail, '');
  });

  test('handleResponse - returns error with internal server error if 500', function (assert) {
    const headers = {},
      status = 500,
      payload = {},
      adapter = this.adapter;
    var error = adapter.handleResponse(status, headers, payload);
    assert.strictEqual(error.errors[0].detail, '');
    assert.strictEqual(error.message, 'Internal Server Error');
  });

  test('_stripIDFromURL - returns base URL for type', function (assert) {
    var snapshot = {
      modelName: 'furry-animal',
    };
    var adapter = this.adapter;

    assert.strictEqual(
      adapter._stripIDFromURL('store', snapshot),
      'test-host/test-api/furry-animals/'
    );
  });

  test('_stripIDFromURL without trailing slash - returns base URL for type', function (assert) {
    var snapshot = {
      modelName: 'furry-animal',
    };
    var adapter = this.adapter;
    adapter.set('addTrailingSlashes', false);

    assert.strictEqual(
      adapter._stripIDFromURL('store', snapshot),
      'test-host/test-api/furry-animals'
    );
  });

  test('_formatPayload returns array when string received', function (assert) {
    var payload = {
      key: 'value',
    };
    var adapter = this.adapter;

    assert.deepEqual(adapter._formatPayload(payload), {
      key: ['value'],
    });
  });
});
