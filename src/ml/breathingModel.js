import * as tf from '@tensorflow/tfjs'

/**
 * Breathing Detection CNN Model
 * 
 * This model classifies audio spectrograms into breathing phases:
 * 0 - Inhale
 * 1 - Exhale
 */
class BreathingCNN {
  constructor() {
    this.model = null
    this.isLoaded = false
    this.inputShape = [128, 1] // 128 frequency bins, 1 channel
    this.classes = ['inhale', 'exhale']
    this.sampleRate = 44100
    this.windowSize = 2048
    this.hopLength = 512
  }

  /**
   * Build the CNN model architecture
   * Lightweight design optimized for real-time inference
   */
  buildModel() {
    const model = tf.sequential({
      layers: [
        // First Conv Block - Extract low-level breathing features
        tf.layers.conv1d({
          filters: 16,
          kernelSize: 7,
          strides: 1,
          activation: 'relu',
          inputShape: this.inputShape,
          padding: 'same',
          name: 'conv1d_1'
        }),
        tf.layers.batchNormalization({ name: 'batch_norm_1' }),
        tf.layers.maxPooling1d({ poolSize: 2, name: 'maxpool_1' }),
        
        // Second Conv Block - Detect breathing patterns
        tf.layers.conv1d({
          filters: 32,
          kernelSize: 5,
          strides: 1,
          activation: 'relu',
          padding: 'same',
          name: 'conv1d_2'
        }),
        tf.layers.batchNormalization({ name: 'batch_norm_2' }),
        tf.layers.maxPooling1d({ poolSize: 2, name: 'maxpool_2' }),
        
        // Third Conv Block - High-level feature extraction
        tf.layers.conv1d({
          filters: 64,
          kernelSize: 3,
          strides: 1,
          activation: 'relu',
          padding: 'same',
          name: 'conv1d_3'
        }),
        tf.layers.batchNormalization({ name: 'batch_norm_3' }),
        
        // Global Average Pooling - Reduce parameters and overfitting
        tf.layers.globalAveragePooling1d({ name: 'global_avg_pool' }),
        
        // Dense layers for classification
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'dense_1'
        }),
        tf.layers.dropout({ rate: 0.3, name: 'dropout_1' }),
        
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          name: 'dense_2'
        }),
        tf.layers.dropout({ rate: 0.2, name: 'dropout_2' }),
        
        // Output layer - 2 classes (inhale, exhale)
        tf.layers.dense({
          units: 2,
          activation: 'softmax',
          name: 'output'
        })
      ]
    })

    // Compile with Adam optimizer and categorical crossentropy
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    this.model = model
    return model
  }

  /**
   * Convert audio frequency data to model input format
   * @param {Uint8Array} frequencyData - Raw frequency data from Web Audio API
   * @returns {tf.Tensor} Preprocessed tensor ready for model input
   */
  preprocessAudio(frequencyData) {
    // Convert Uint8Array to Float32Array and normalize to [0,1]
    const normalizedData = new Float32Array(frequencyData.length)
    for (let i = 0; i < frequencyData.length; i++) {
      normalizedData[i] = frequencyData[i] / 255.0
    }

    // Focus on breathing frequency range (0-500Hz, roughly first 20% of spectrum)
    const breathingRange = Math.floor(frequencyData.length * 0.5) // Take more range for better features
    const breathingData = normalizedData.slice(0, breathingRange)

    // Resize to model input size (128 bins)
    const resized = this.resizeSpectrum(breathingData, 128)

    // Create tensor with batch dimension [1, 128, 1]
    return tf.tensor3d([resized.map(x => [x])], [1, 128, 1])
  }

  /**
   * Resize spectrum to target size using linear interpolation
   */
  resizeSpectrum(spectrum, targetSize) {
    if (spectrum.length === targetSize) return Array.from(spectrum)
    
    const result = new Array(targetSize)
    const ratio = (spectrum.length - 1) / (targetSize - 1)
    
    for (let i = 0; i < targetSize; i++) {
      const pos = i * ratio
      const index = Math.floor(pos)
      const fraction = pos - index
      
      if (index + 1 < spectrum.length) {
        result[i] = spectrum[index] * (1 - fraction) + spectrum[index + 1] * fraction
      } else {
        result[i] = spectrum[index]
      }
    }
    
    return result
  }

  /**
   * Make prediction on audio data
   * @param {Uint8Array} frequencyData - Raw frequency data
   * @returns {Object} Prediction results with confidence scores
   */
  async predict(frequencyData) {
    if (!this.model) {
      throw new Error('Model not loaded. Call buildModel() first.')
    }

    // Preprocess the audio data
    const inputTensor = this.preprocessAudio(frequencyData)
    
    try {
      // Run inference
      const prediction = await this.model.predict(inputTensor)
      const probabilities = await prediction.data()
      
      // Clean up tensors
      inputTensor.dispose()
      prediction.dispose()
      
      // Find the predicted class
      const predictedIndex = probabilities.indexOf(Math.max(...probabilities))
      const predictedClass = this.classes[predictedIndex]
      const confidence = probabilities[predictedIndex]
      
      return {
        class: predictedClass,
        confidence: confidence,
        probabilities: {
          inhale: probabilities[0],
          exhale: probabilities[1]
        },
        breathingScore: this.calculateBreathingScore(probabilities)
      }
    } catch (error) {
      // Clean up in case of error
      inputTensor.dispose()
      throw error
    }
  }

  /**
   * Calculate breathing quality score from predictions
   * High score = clear inhale/exhale distinction
   * Low score = ambiguous or weak breathing signals
   */
  calculateBreathingScore(probabilities) {
    const [inhaleProb, exhaleProb] = probabilities
    
    // Good breathing has clear distinction between inhale and exhale
    const confidence = Math.max(inhaleProb, exhaleProb) // Stronger phase indication
    const clarity = Math.abs(inhaleProb - exhaleProb) // Clear distinction between phases
    
    // Combine confidence and clarity
    return (confidence * 0.7) + (clarity * 0.3)
  }

  /**
   * Generate synthetic training data for breathing patterns
   * This creates realistic breathing spectrograms for initial training
   */
  generateTrainingData(numSamples = 1000) {
    const data = []
    const labels = []
    
    // Ensure balanced classes - equal representation of inhale and exhale
    const samplesPerClass = Math.floor(numSamples / 2)
    
    for (let classIndex = 0; classIndex < 2; classIndex++) {
      const className = this.classes[classIndex]
      
      for (let i = 0; i < samplesPerClass; i++) {
        // Generate synthetic spectrum based on class
        const spectrum = this.generateSyntheticSpectrum(className)
        const label = tf.oneHot(classIndex, 2)
        
        data.push(spectrum)
        labels.push(label)
      }
    }
    
    // Add any remaining samples randomly to reach exact numSamples
    const remaining = numSamples - (samplesPerClass * 2)
    for (let i = 0; i < remaining; i++) {
      const classIndex = Math.floor(Math.random() * 2)
      const className = this.classes[classIndex]
      
      const spectrum = this.generateSyntheticSpectrum(className)
      const label = tf.oneHot(classIndex, 2)
      
      data.push(spectrum)
      labels.push(label)
    }
    
    // Shuffle the data to avoid learning order bias
    const shuffledData = []
    const shuffledLabels = []
    const indices = [...Array(data.length).keys()]
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    for (const index of indices) {
      shuffledData.push(data[index])
      shuffledLabels.push(labels[index])
    }
    
    console.log(`Generated balanced training data: ${samplesPerClass} samples per class (${samplesPerClass * 2 + remaining} total)`)
    
    return {
      x: tf.tensor3d(shuffledData.map(spectrum => spectrum.map(x => [x]))),
      y: tf.stack(shuffledLabels)
    }
  }

  /**
   * Generate realistic breathing spectrograms for each class
   */
  generateSyntheticSpectrum(className) {
    const spectrum = new Float32Array(128)
    
    switch (className) {
      case 'inhale':
        // Higher energy in lower frequencies with characteristic inhale pattern
        for (let i = 0; i < 128; i++) {
          const baseEnergy = 0.35 + Math.random() * 0.25 // Higher base energy
          const frequencyFactor = Math.exp(-i / 25) // Steeper decay for inhale
          spectrum[i] = baseEnergy * frequencyFactor
        }
        
        // Add inhale-specific harmonic content (air rushing in)
        for (let i = 5; i < 40; i += 8) {
          spectrum[i] += Math.random() * 0.2
        }
        
        // Add some high-frequency content typical of inhale
        for (let i = 60; i < 90; i++) {
          spectrum[i] += Math.random() * 0.08
        }
        break
        
      case 'exhale':
        // Broader spectrum with turbulent flow characteristics
        for (let i = 0; i < 128; i++) {
          const baseEnergy = 0.28 + Math.random() * 0.3
          const frequencyFactor = Math.exp(-i / 45) // Slower decay than inhale
          spectrum[i] = baseEnergy * frequencyFactor
        }
        
        // Add exhale-specific turbulent flow patterns
        for (let i = 15; i < 85; i += 6) {
          spectrum[i] += Math.random() * 0.12
        }
        
        // Add broader high-frequency content (air turbulence)
        for (let i = 40; i < 100; i++) {
          spectrum[i] += Math.random() * 0.06
        }
        break
    }
    
    return Array.from(spectrum)
  }

  /**
   * Train the model with synthetic data
   * This provides a good starting point before real user data is available
   */
  async trainWithSyntheticData(epochs = 20, validationSplit = 0.2) {
    if (!this.model) {
      this.buildModel()
    }

    console.log('Generating synthetic training data...')
    const trainingData = this.generateTrainingData(2000)
    
    console.log('Starting training...')
    const history = await this.model.fit(trainingData.x, trainingData.y, {
      epochs: epochs,
      validationSplit: validationSplit,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`)
        }
      }
    })

    // Clean up training data
    trainingData.x.dispose()
    trainingData.y.dispose()

    this.isLoaded = true
    console.log('Model training completed!')
    return history
  }

  /**
   * Save the trained model to browser storage
   */
  async saveModel() {
    if (!this.model) {
      throw new Error('No model to save')
    }
    
    await this.model.save('localstorage://breathing-model')
    console.log('Model saved to localStorage')
  }

  /**
   * Load a previously saved model
   */
  async loadModel() {
    try {
      this.model = await tf.loadLayersModel('localstorage://breathing-model')
      this.isLoaded = true
      console.log('Model loaded from localStorage')
      return true
    } catch (error) {
      console.log('No saved model found, will need to train new model')
      return false
    }
  }

  /**
   * Get model summary and info
   */
  getModelInfo() {
    if (!this.model) return null
    
    return {
      totalParams: this.model.countParams(),
      layers: this.model.layers.length,
      inputShape: this.inputShape,
      classes: this.classes,
      isLoaded: this.isLoaded
    }
  }
}

export default BreathingCNN
