// Lodash utility imports
import range from 'lodash.range';

/**
 * Function to obtain the n harmonic weights for the given type of wave.
 * @param {number} harmonicNo - Number of harmonic frequencies
 * @param {string} waveType - Type of the complex wave (Eg: square, triangle, saw)
 * Eg: For input (10, 'sawtooth')  ---> [1, 0.5, 0.3, 0.25, 0.2, ...]
 * 
 */
const getHarmonicWeights = (harmonicNo, waveType) => {
  if (waveType && waveType === 'sawtooth') {
    return range(1, harmonicNo + 1).map((i) => (1/i));  // [1x, 2x, 3x , 4x , 5x]
  } else if (waveType && waveType === 'square') { 
    return range(1, 2 * harmonicNo, 2).map((i) => (1/i)); // [1x, 3x, 5x, 7x, 9x]
  } else if (waveType && waveType === 'triangle') {
    return range(1, 2 * harmonicNo, 2).map((i) => (1/Math.pow(i, 2)));
  } else if (waveType && waveType === 'random') {
    // TODO: Fill in the harmonics for the random wave
  }
}


export { getHarmonicWeights };