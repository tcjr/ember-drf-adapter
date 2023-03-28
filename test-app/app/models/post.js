import Model, { attr, hasMany } from '@ember-data/model';

export default class PostModel extends Model {
  @attr('string')
  postTitle;

  @attr('string')
  body;

  @hasMany('comment', { async: true, inverse: 'post' })
  comments;
}
