export const LAG = 250; // Number of milliseconds for roundtrip

export const idGenerator =
  (id = 1) =>
  () =>
    `${id++}`;
