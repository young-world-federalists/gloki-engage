// credit: the following code is taken from https://github.com/sindresorhus/uint8Array-extras

const cachedDecoders: { [encoding: string]: TextDecoder } = {
  utf8: new TextDecoder("utf8"),
};

const cachedEncoder = new TextEncoder();

const byteToHexLookupTable = Object.fromEntries(
  Array.from({ length: 256 }, (_, value) => [
    value,
    value.toString(16).padStart(2, "0"),
  ])
);

const hexToDecimalLookupTable: { [key: number | string]: number } = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
};

function concatUint8Arrays(arrays: Uint8Array[]) {
  if (arrays.length === 0) {
    return new Uint8Array(0);
  }

  const totalLength = arrays.reduce(
    (accumulator, currentValue) => accumulator + currentValue.length,
    0
  );

  const returnValue = new Uint8Array(totalLength);

  let offset = 0;
  for (const array of arrays) {
    returnValue.set(array, offset);
    offset += array.length;
  }

  return returnValue;
}

function uint8ArrayToString(
  array: Uint8Array,
  encoding = "utf8"
): string {
  if (encoding === "latin1") {
    return String.fromCharCode(...array);
  }
  cachedDecoders[encoding] ??= new TextDecoder(encoding);
  return cachedDecoders[encoding].decode(array);
}

function stringToUint8Array(value: string, encoding = ""): Uint8Array {
  if (encoding === "latin1") {
    return new Uint8Array([...value].map((char) => char.charCodeAt(0)));
  }
  return new Uint8Array(cachedEncoder.encode(value));
}

function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array, byte => byteToHexLookupTable[byte]).join('');
}

function hexToUint8Array(hexString: string): Uint8Array {
  const resultLength = hexString.length / 2;
  const bytes = new Uint8Array(resultLength);

  if (hexString.length % 2 == 0) {
    for (let index = 0; index < resultLength; index++) {
      const highNibble = hexToDecimalLookupTable[hexString[index * 2]];
      const lowNibble = hexToDecimalLookupTable[hexString[index * 2 + 1]];

      if (highNibble === undefined || lowNibble === undefined) {
        return new Uint8Array();
      }

      bytes[index] = (highNibble << 4) | lowNibble;
    }
  }

  return bytes;
}

/**
 * Encodes community invitation data for QR code generation
 * @param server - Server address
 * @param agent - Agent public key
 * @param contract - Contract ID (hex string)
 * @returns Encoded string suitable for QR code
 */
export function encodeCommunityInvitation(server: string, agent: string, contract: string): string {
  const s = stringToUint8Array(server || "");
  const a = stringToUint8Array(agent || "");
  const c = hexToUint8Array(contract || "");
  const lengths = new Uint8Array([s.length, a.length, c.length]);
  const all = concatUint8Arrays([lengths, s, a, c]);
  return uint8ArrayToString(all, "latin1");
}

/**
 * Decodes community invitation data from QR code
 * @param qrData - Encoded string from QR code
 * @returns Decoded object with server, agent, and contract fields
 */
export function decodeCommunityInvitation(qrData: string): { server: string; agent: string; contract: string } | null {
  try {
    const data = stringToUint8Array(qrData, "latin1");
    const lengths = data.slice(0, 3);
    const indexes = Array.from(lengths).reduce((acc, curr) => [...acc, acc[acc.length - 1] + curr], [3]);
    const server = uint8ArrayToString(data.slice(indexes[0], indexes[1]), "ascii");
    const agent = uint8ArrayToString(data.slice(indexes[1], indexes[2]), "ascii");
    const contract = uint8ArrayToHex(data.slice(indexes[2], indexes[3]));
    return { server, agent, contract };
  } catch (error) {
    console.error('Error decoding QR code:', error);
    return null;
  }
}