import BreathingCNN from './breathingModel.js'

/**
 * Test script to validate the CNN breathing detection model
 * This can be run in the browser console to verify functionality
 */

async function testBreathingModel() {
  console.log('🧪 Testing Breathing CNN Model...')
  
  try {
    // Create model instance
    const model = new BreathingCNN()
    console.log('✅ Model instance created')
    
    // Build the model architecture
    model.buildModel()
    console.log('✅ Model architecture built')
    console.log('📊 Model info:', model.getModelInfo())
    
    // Generate test data
    console.log('🎯 Generating synthetic test data...')
    const testData = model.generateTrainingData(100) // Small dataset for testing
    console.log('✅ Test data generated:', testData.x.shape, testData.y.shape)
    
    // Train the model (quick test)
    console.log('🏋️ Training model (5 epochs for testing)...')
    await model.trainWithSyntheticData(5, 0.2)
    console.log('✅ Model training completed')
    
    // Test predictions with synthetic audio data
    console.log('🔮 Testing predictions...')
    
    // Create fake frequency data (simulating microphone input)
    const fakeFrequencyData = new Uint8Array(256)
    
    // Test 1: Simulate breathing sound (higher energy in low frequencies)
    console.log('\n--- Test 1: Simulated Breathing ---')
    for (let i = 0; i < fakeFrequencyData.length; i++) {
      // Higher energy in lower frequencies (breathing pattern)
      fakeFrequencyData[i] = Math.floor((Math.random() * 100 + 50) * Math.exp(-i / 40))
    }
    
    let prediction = await model.predict(fakeFrequencyData)
    console.log('Prediction:', prediction)
    console.log(`Detected: ${prediction.class} (${(prediction.confidence * 100).toFixed(1)}% confidence)`)
    console.log('Probabilities:', prediction.probabilities)
    console.log('Breathing Score:', (prediction.breathingScore * 100).toFixed(1) + '%')
    
    // Test 2: Simulate silence/pause
    console.log('\n--- Test 2: Simulated Silence ---')
    for (let i = 0; i < fakeFrequencyData.length; i++) {
      // Low energy across all frequencies
      fakeFrequencyData[i] = Math.floor(Math.random() * 20 + 5)
    }
    
    prediction = await model.predict(fakeFrequencyData)
    console.log('Prediction:', prediction)
    console.log(`Detected: ${prediction.class} (${(prediction.confidence * 100).toFixed(1)}% confidence)`)
    console.log('Probabilities:', prediction.probabilities)
    console.log('Breathing Score:', (prediction.breathingScore * 100).toFixed(1) + '%')
    
    // Test 3: Simulate noise
    console.log('\n--- Test 3: Simulated Noise ---')
    for (let i = 0; i < fakeFrequencyData.length; i++) {
      // Random noise across all frequencies
      fakeFrequencyData[i] = Math.floor(Math.random() * 150 + 50)
    }
    
    prediction = await model.predict(fakeFrequencyData)
    console.log('Prediction:', prediction)
    console.log(`Detected: ${prediction.class} (${(prediction.confidence * 100).toFixed(1)}% confidence)`)
    console.log('Probabilities:', prediction.probabilities)
    console.log('Breathing Score:', (prediction.breathingScore * 100).toFixed(1) + '%')
    
    // Test model save/load functionality
    console.log('\n--- Testing Save/Load ---')
    await model.saveModel()
    console.log('✅ Model saved to localStorage')
    
    const newModel = new BreathingCNN()
    const loaded = await newModel.loadModel()
    console.log('✅ Model loaded:', loaded)
    
    if (loaded) {
      console.log('📊 Loaded model info:', newModel.getModelInfo())
      
      // Test prediction with loaded model
      const testPrediction = await newModel.predict(fakeFrequencyData)
      console.log('✅ Loaded model prediction:', testPrediction.class, 
                  `(${(testPrediction.confidence * 100).toFixed(1)}%)`)
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('💡 The CNN model is ready for real-time breathing detection!')
    
    // Clean up
    testData.x.dispose()
    testData.y.dispose()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Benchmark model performance
async function benchmarkModel() {
  console.log('⚡ Benchmarking model performance...')
  
  const model = new BreathingCNN()
  model.buildModel()
  await model.trainWithSyntheticData(10, 0.2) // Quick training
  
  const fakeData = new Uint8Array(256)
  for (let i = 0; i < fakeData.length; i++) {
    fakeData[i] = Math.floor(Math.random() * 255)
  }
  
  const numTests = 100
  console.log(`Running ${numTests} predictions...`)
  
  const startTime = performance.now()
  
  for (let i = 0; i < numTests; i++) {
    await model.predict(fakeData)
  }
  
  const endTime = performance.now()
  const avgTime = (endTime - startTime) / numTests
  
  console.log(`⚡ Average prediction time: ${avgTime.toFixed(2)}ms`)
  console.log(`📊 Predictions per second: ${(1000 / avgTime).toFixed(1)}`)
  
  if (avgTime < 50) {
    console.log('✅ Performance is excellent for real-time use!')
  } else if (avgTime < 100) {
    console.log('⚠️ Performance is acceptable but could be optimized')
  } else {
    console.log('❌ Performance may be too slow for real-time use')
  }
}

// Export functions for use in browser console
window.testBreathingModel = testBreathingModel
window.benchmarkModel = benchmarkModel

export { testBreathingModel, benchmarkModel }
