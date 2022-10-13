// just to be explicit, yet strict is implied by export:
// see https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export
'use strict';

export const SOME_CONSTANT = 10;

export function sayHello(name) {
  console.log('Hello ' + name);
}
