export const idGenerator =
  (id = 1) =>
  () =>
    `${id++}`;
