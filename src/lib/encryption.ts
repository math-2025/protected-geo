'use client';


export type DerivationStep = {
  name: string;
  latitude: number;
  longitude: number;
  details: string; 
};

export type EncryptedData = {
  encryptedLat: number;
  encryptedLng: number;
  derivationSteps: DerivationStep[];
};



function createSeed(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return Math.abs(hash);
}

function lcg(seed: number) {
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}


function collatzStep(lat: number, lng: number, seed: number, reverse = false): [number, number, string] {
  let latInt = Math.floor(Math.abs(lat));
  let lngInt = Math.floor(Math.abs(lng));
  let details = `Input: (${lat.toFixed(6)}, ${lng.toFixed(6)})\nInteger Parts: X=${latInt}, Y=${lngInt}\n\n`;
  const iterations = 5; 
  
  let latHistory = [latInt];
  let lngHistory = [lngInt];

  // Forward Collatz
  for(let i=0; i<iterations; i++) {
    details += `Step ${i+1}:\n`;
    let newLatInt, newLngInt;
    
    if (latInt % 2 === 0) {
        newLatInt = latInt / 2;
        details += `  X: ${latInt} (even) -> ${latInt} / 2 = ${newLatInt}\n`;
    } else {
        newLatInt = (latInt * 3) + 1;
        details += `  X: ${latInt} (odd) -> (3 * ${latInt}) + 1 = ${newLatInt}\n`;
    }
    latInt = newLatInt;
    latHistory.push(latInt);

    if (lngInt % 2 === 0) {
        newLngInt = lngInt / 2;
        details += `  Y: ${lngInt} (even) -> ${lngInt} / 2 = ${newLngInt}\n`;
    } else {
        newLngInt = (lngInt * 3) + 1;
        details += `  Y: ${lngInt} (odd) -> (3 * ${lngInt}) + 1 = ${newLngInt}\n`;
    }
    lngInt = newLngInt;
    lngHistory.push(lngInt);
    details += '\n';
  }

  const latOffset = (latHistory.reduce((a, b) => a + b, 0) % 10000) / 100000;
  const lngOffset = (lngHistory.reduce((a, b) => a + b, 0) % 10000) / 100000;
  
  details += `Resulting Offsets:\n  Lat Offset: ΣX % 10000 / 100000 = ${latOffset.toFixed(6)}\n  Lng Offset: ΣY % 10000 / 100000 = ${lngOffset.toFixed(6)}\n`;
  
  const newLat = lat + latOffset;
  const newLng = lng - lngOffset;
  details += `Output: (${newLat.toFixed(6)}, ${newLng.toFixed(6)})`;


  return reverse 
    ? [lat - latOffset, lng + lngOffset, details] 
    : [newLat, newLng, details];
}

function primeJumpStep(lat: number, lng: number, seed: number, reverse = false): [number, number, string] {
  const primes = [17, 31, 53, 71, 97];
  const random = lcg(seed);
  const prime1 = primes[Math.floor(random() * primes.length)];
  const prime2 = primes[Math.floor(random() * primes.length)];
  const offset = (prime1 * prime2) / 100000;
  
  const newLat = lat - offset;
  const newLng = lng + offset;

  const details = `Input: (${lat.toFixed(6)}, ${lng.toFixed(6)})\nChosen Primes: p1=${prime1}, p2=${prime2}\nOffset Calculation: (p1 * p2) / 100000 = ${offset.toFixed(6)}\nNew Lat: lat - offset = ${lat.toFixed(6)} - ${offset.toFixed(6)} = ${newLat.toFixed(6)}\nNew Lng: lng + offset = ${lng.toFixed(6)} + ${offset.toFixed(6)} = ${newLng.toFixed(6)}`;
  
  return reverse 
    ? [lat + offset, lng - offset, details] 
    : [newLat, newLng, details];
}

function fibonacciStep(lat: number, lng: number, seed: number, reverse = false): [number, number, string] {
  const random = lcg(seed);
  const goldenAngle = 137.5 * (Math.PI / 180);
  const distance = random() * 0.02;
  const angle = random() * 360;

  const latOffset = distance * Math.cos(angle * goldenAngle);
  const lngOffset = distance * Math.sin(angle * goldenAngle);
  
  const newLat = lat + latOffset;
  const newLng = lng + lngOffset;

  const details = `Input: (${lat.toFixed(6)}, ${lng.toFixed(6)})\nGolden Angle: ${goldenAngle.toFixed(4)} rad\nDistance (d): ${distance.toFixed(4)}, Angle (a): ${angle.toFixed(4)}\nLat Offset: d * cos(a * GA) = ${latOffset.toFixed(6)}\nLng Offset: d * sin(a * GA) = ${lngOffset.toFixed(6)}\nOutput: (${newLat.toFixed(6)}, ${newLng.toFixed(6)})`;

  return reverse
    ? [lat - latOffset, lng - lngOffset, details]
    : [newLat, newLng, details];
}

function affineTransformationStep(lat: number, lng: number, seed: number, reverse = false): [number, number, string] {
    const random = lcg(seed);
    const a1 = 1 + (random() - 0.5) * 0.2; 
    const b1 = (random() - 0.5) * 0.1;
    const a2 = 1 + (random() - 0.5) * 0.2;
    const b2 = (random() - 0.5) * 0.1;
    
    let details = `Input: (${lat.toFixed(6)}, ${lng.toFixed(6)})\n`;
    details += `Formulas:\n  new_lat = (lat * a1) + b1\n  new_lng = (lng * a2) + b2\n\n`;
    details += `Variables:\n  a1=${a1.toFixed(4)}, b1=${b1.toFixed(4)}\n  a2=${a2.toFixed(4)}, b2=${b2.toFixed(4)}\n\n`;
    
    if (reverse) {
        const decryptedLat = (lat - b1) / a1;
        const decryptedLng = (lng - b2) / a2;
        details += `Reverse Calculation:\n  orig_lat = (${lat.toFixed(6)} - ${b1.toFixed(4)}) / ${a1.toFixed(4)} = ${decryptedLat.toFixed(6)}\n  orig_lng = (${lng.toFixed(6)} - ${b2.toFixed(4)}) / ${a2.toFixed(4)} = ${decryptedLng.toFixed(6)}`;
        return [decryptedLat, decryptedLng, details];
    } else {
        const encryptedLat = a1 * lat + b1;
        const encryptedLng = a2 * lng + b2;
        details += `Forward Calculation:\n  new_lat = (${lat.toFixed(6)} * ${a1.toFixed(4)}) + ${b1.toFixed(4)} = ${encryptedLat.toFixed(6)}\n  new_lng = (${lng.toFixed(6)} * ${a2.toFixed(4)}) + ${b2.toFixed(4)} = ${encryptedLng.toFixed(6)}`;
        return [encryptedLat, encryptedLng, details];
    }
}

function logarithmicSpiralStep(lat: number, lng: number, seed: number, reverse = false): [number, number, string] {
    const random = lcg(seed);
    const a = 0.01 + random() * 0.01;
    const b = 0.1 + random() * 0.1;
    const theta = (random() * 2 - 1) * Math.PI;

    const r = a * Math.exp(b * theta);

    const latOffset = r * Math.cos(theta);
    const lngOffset = r * Math.sin(theta);
    
    const newLat = lat + latOffset;
    const newLng = lng + lngOffset;

    let details = `Input: (${lat.toFixed(6)}, ${lng.toFixed(6)})\n`;
    details += `Formulas:\n  r = a * e^(b * θ)\n  lat_offset = r * cos(θ)\n  lng_offset = r * sin(θ)\n\n`;
    details += `Variables:\n  a=${a.toFixed(4)}, b=${b.toFixed(4)}, θ=${theta.toFixed(4)}\n\n`;
    details += `Calculation:\n  r = ${a.toFixed(4)} * e^(${b.toFixed(4)} * ${theta.toFixed(4)}) = ${r.toFixed(6)}\n  lat_offset = ${r.toFixed(6)} * cos(${theta.toFixed(4)}) = ${latOffset.toFixed(6)}\n  lng_offset = ${r.toFixed(6)} * sin(${theta.toFixed(4)}) = ${lngOffset.toFixed(6)}\n`;
    details += `Output: (${newLat.toFixed(6)}, ${newLng.toFixed(6)})`;

    if (reverse) {
        return [lat - latOffset, lng - lngOffset, details];
    } else {
        return [newLat, newLng, details];
    }
}


// --- Main Encryption/Decryption Functions ---

const steps = [
    { fn: collatzStep, name: 'Collatz Fərziyyəsi ilə Qarışdırma' },
    { fn: primeJumpStep, name: 'Sadə Ədədlə Atlama (Prime-Jump)' },
    { fn: fibonacciStep, name: 'Fibonaççi Spiral Sürüşdürməsi' },
    { fn: affineTransformationStep, name: 'Affin Koordinat Transformasiyası' },
    { fn: logarithmicSpiralStep, name: 'Logarifmik Spiral Yerdəyişməsi' },
];

export function encryptCoordinates(lat: number, lng: number, key: string): EncryptedData {
  let currentLat = lat;
  let currentLng = lng;
  const derivationSteps: DerivationStep[] = [];
  const masterSeed = createSeed(key);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    // Derive a unique seed for each step from the master seed
    const stepSeed = createSeed(masterSeed.toString() + i); 
    const [newLat, newLng, details] = step.fn(currentLat, currentLng, stepSeed, false);
    
    // The output of this step becomes the input for the next
    currentLat = newLat;
    currentLng = newLng;

    derivationSteps.push({
      name: step.name,
      latitude: currentLat,
      longitude: currentLng,
      details: details,
    });
  }

  return {
    encryptedLat: currentLat,
    encryptedLng: currentLng,
    derivationSteps,
  };
}

export function decryptCoordinates(encryptedLat: number, encryptedLng: number, key: string): { decryptedLat: number, decryptedLng: number } {
  let currentLat = encryptedLat;
  let currentLng = encryptedLng;
  const masterSeed = createSeed(key);

  // Apply the steps in reverse order
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    // Derive the same unique seed for decryption
    const stepSeed = createSeed(masterSeed.toString() + i);
    // We only need the coordinates, not the details, for decryption
    const [newLat, newLng] = step.fn(currentLat, currentLng, stepSeed, true);
    currentLat = newLat;
    currentLng = newLng;
  }

  return {
    decryptedLat: currentLat,
    decryptedLng: currentLng,
  };
}

// --- New Message Encryption/Decryption ---

const a = 7;
const b = 13;
const m = 256;
const a_inv = 183; // Modular multiplicative inverse of 7 mod 256

/**
 * Encrypts a text message using a custom 3-step mathematical transformation for each character.
 * @param text The original text to encrypt.
 * @returns A JSON string representing an array of encrypted numbers.
 */
export function encryptMessage(text: string): { encryptedText: string } {
    const encryptedNumbers: number[] = [];
    for (let i = 0; i < text.length; i++) {
        const x = text.charCodeAt(i); // Get ASCII value
        
        // Step 1: Affin transformasiya
        const x1 = (a * x) + b;
        
        // Step 2: Modulyar arifmetika
        const x2 = x1 % m;
        
        // Step 3: Mövqe əsaslı qarışdırma
        const x3 = x2 + (i * i); // i^2
        
        encryptedNumbers.push(x3);
    }
    
    // Convert the array of numbers to a JSON string for database storage
    const encryptedText = JSON.stringify(encryptedNumbers);

    return { encryptedText };
}


/**
 * Decrypts a message that was encrypted with the custom 3-step algorithm.
 * @param encryptedText A JSON string representing an array of encrypted numbers.
 * @returns The original decrypted text.
 */
export function decryptMessage(encryptedText: string): string {
    let decryptedText = '';
    
    try {
        // Parse the JSON string back into an array of numbers
        const encryptedNumbers: number[] = JSON.parse(encryptedText);

        if (!Array.isArray(encryptedNumbers)) {
            return "[Format xətası: massiv deyil]";
        }

        for (let i = 0; i < encryptedNumbers.length; i++) {
            const x3 = encryptedNumbers[i];
            
            // Step 1 (Reverse): Mövqe təsirini sil
            const x2 = x3 - (i * i);
            
            // Step 2 (Reverse): Affin transformasiyanın tərsi
            // We need to handle potential negative results from (x2 - b) before applying modulo
            let term = x2 - b;
            // The modular multiplicative inverse handles the division
            let x_mod = (a_inv * term);

            // Ensure the result is within the 0-255 range
            let original_x = ((x_mod % m) + m) % m;

            decryptedText += String.fromCharCode(original_x);
        }
    } catch (e) {
        console.error("Decryption error:", e);
        return "[Deşifrə xətası]";
    }
    
    return decryptedText;
}