export interface PatchExpression<T> {
  $set?: Partial<T>;
  $add?: Partial<Record<keyof T, unknown>>;
  $incr?: Partial<Record<keyof T, number>>;
  $unset?: Partial<Record<keyof T, true>>;
}
