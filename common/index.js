export const LAG = 250; // Number of milliseconds for roundtrip
export const SERVER_UPDATE_RATE = 10; // Times per second

export const idGenerator =
  (id = 1) =>
  () =>
    `${id++}`;
