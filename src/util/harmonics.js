// Lodash utility imports
import range from 'lodash.range';
// import {getGain} from '../util/conversions';

/**
 * Function to obtain the n harmonic frequencies for the given fundamental freq. and type of wave.
 * @param {number} fundFreq - Fundamental frequency 
 * @param {number} fundAmp - Initial amplitude for fundamental freq.
 * @param {number} harmonicNo - Number of harmonic frequencies
 * @param {string} waveType - Type of the complex wave (Eg: square, triangle, saw)
 * Eg: For input (20, 5, 'sawtooth')  ---> Output = [40, 60, 80, 100, 120]
 * 
 */
const getHarmonicFreq = (fundFreq, fundAmp, harmonicNo, waveType) => {
  if (waveType && waveType === 'sawtooth') {
    return range(1, harmonicNo + 1).map((i) => {
      return {
        frequency: i * fundFreq, 
        amplitude: (i * fundAmp)        // Amplitude here increases as getGain function has a negative range
      }
    });
  } else if (waveType && waveType === 'square') { 
    return range(1, 2 * harmonicNo, 2).map((i) => {
      return {
        frequency: i * fundFreq, 
        amplitude: (i * fundAmp)
      }
    });
  } else if (waveType && waveType === 'triangle') {
    return range(1, 2 * harmonicNo, 2).map((i) => {
      return {
        frequency: i * fundFreq, 
        amplitude: Math.pow(i, 2) * fundAmp
      }
    });
  }
}


export { getHarmonicFreq };