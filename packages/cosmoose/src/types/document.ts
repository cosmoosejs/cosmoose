export type Document<T> = T & {
  id: string;
  _etag?: string;
  _ts?: number;
  _rid?: string;
  _self?: string;
  _attachments?: string;
};
