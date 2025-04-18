/**
 * SHA-256 implementation for MakeCode Arcade
 * Note: This is a simplified version optimized for the MakeCode environment  :) still works
 */
namespace crypto {
    // SHA-256 Constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    // Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19)
    const H0 = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    function rotr(x: number, n: number): number {
        return (x >>> n) | (x << (32 - n));
    }
    function ch(x: number, y: number, z: number): number {
        return (x & y) ^ (~x & z);
    }
    function maj(x: number, y: number, z: number): number {
        return (x & y) ^ (x & z) ^ (y & z);
    }
    function sigma0(x: number): number {
        return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
    }
    function sigma1(x: number): number {
        return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
    }
    function gamma0(x: number): number {
        return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
    }
    function gamma1(x: number): number {
        return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10);
    }

    function stringToBytes(str: string): number[] {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        return bytes;
    }

    function longToBytes(value: number): number[] {
        return [
            (value >>> 24) & 0xFF,
            (value >>> 16) & 0xFF,
            (value >>> 8) & 0xFF,
            value & 0xFF
        ];
    }

    function padMessage(bytes: number[]): number[] {
        const len = bytes.length;
        const k = (512 + 448 - ((len * 8 + 1) % 512)) % 512;
        const padding = [];
        padding.push(0x80);
        for (let i = 0; i < (k - 7) / 8; i++) {
            padding.push(0);
        }
        const lenBits = len * 8;
        for (let i = 0; i < 8; i++) {
            padding.push(0);
        }
        padding[padding.length - 4] = (lenBits >>> 24) & 0xFF;
        padding[padding.length - 3] = (lenBits >>> 16) & 0xFF;
        padding[padding.length - 2] = (lenBits >>> 8) & 0xFF;
        padding[padding.length - 1] = lenBits & 0xFF;

        return bytes.concat(padding);
    }
    function processBlock(block: number[], H: number[]): void {
        const W = [];
        for (let t = 0; t < 16; t++) {
            W[t] = (block[t * 4] << 24) | (block[t * 4 + 1] << 16) | (block[t * 4 + 2] << 8) | block[t * 4 + 3];
        }
        for (let t = 16; t < 64; t++) {
            W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
        }
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];
        let e = H[4];
        let f = H[5];
        let g = H[6];
        let h = H[7];
        for (let t = 0; t < 64; t++) {
            const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
            const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + T1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
        H[5] = (H[5] + f) >>> 0;
        H[6] = (H[6] + g) >>> 0;
        H[7] = (H[7] + h) >>> 0;
    }
    /**
     * Hashes a string
     * @param message - The input you want to hash
     * @returns - Hashed message
     */
    //% block
    export function sha256(message: string): string {
        const bytes = stringToBytes(message);
        const paddedBytes = padMessage(bytes);
        const H = H0.slice();
        for (let i = 0; i < paddedBytes.length; i += 64) {
            const block = paddedBytes.slice(i, i + 64);
            processBlock(block, H);
        }
        let result = "";
        for (let i = 0; i < 8; i++) {
            let hex = "";
            let temp = H[i];
            for (let j = 0; j < 8; j++) {
                const digit = temp & 0xF;
                hex = "0123456789abcdef".charAt(digit) + hex;
                temp = temp >>> 4;
            }
            result += hex;
        }
        return result;
    }
}
